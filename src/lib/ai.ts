import 'server-only';

import { z } from 'zod';
import { FONT_PAIRING_KEYS } from './fontPairings';
import { DIETARY_TAG_KEYS } from './dietaryTags';

/*
 * Thin wrapper around the Google Gemini API (generativelanguage.googleapis.com)
 * using plain `fetch` — no SDK dependency, nothing new to install. Gemini
 * was chosen specifically because it has a real free tier for API usage
 * (unlike Anthropic/OpenAI, which are pay-as-you-go from the first call).
 *
 * Used for two features:
 *
 *  - extractMenuFromPhotos: reads photos of a paper/PDF menu and turns
 *    them into structured categories/items so a new restaurant can go
 *    online without typing the whole menu by hand.
 *  - getSupportAssistantReply: a first-line help assistant for
 *    managers, shown as a chat widget in the dashboard. It answers
 *    common "how do I..." / "why isn't this working" questions and
 *    flags the conversation for human follow-up when it can't help.
 *
 * Both require GEMINI_API_KEY to be set (free key from
 * https://aistudio.google.com/apikey). Until it is, both throw a clear,
 * catchable AiNotConfiguredError instead of crashing — the API routes
 * turn that into a friendly 400 response.
 */

const DEFAULT_MODEL = 'gemini-3.6-flash';

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      'AI features are not configured yet. Set GEMINI_API_KEY in your environment to enable them.'
    );
    this.name = 'AiNotConfiguredError';
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new AiNotConfiguredError();
  }
  return key;
}

function model(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

type Part =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type ContentEntry = { role: 'user' | 'model'; parts: Part[] };

async function callGemini(params: {
  systemInstruction?: string;
  contents: ContentEntry[];
  maxOutputTokens?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent`;

  const body: Record<string, unknown> = {
    contents: params.contents,
    generationConfig: {
      maxOutputTokens: params.maxOutputTokens ?? 2048,
      ...(params.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${text.slice(0, 500)}`);
  }

  const json = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
    promptFeedback?: { blockReason?: string };
  };

  if (json.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked this request: ${json.promptFeedback.blockReason}`);
  }

  const candidate = json.candidates?.[0];

  const text = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();

  if (!text) {
    const reason = candidate?.finishReason;
    throw new Error(
      `Gemini API returned an empty response${reason ? ` (finishReason: ${reason})` : ''}.`
    );
  }

  return text;
}

function extractJson(text: string): unknown {
  // With jsonMode this should already be clean JSON, but be defensive in
  // case the model wraps it in a ```json fence anyway.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('Could not find JSON in the AI response.');
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

/* ------------------------------------------------------------------ */
/* Menu extraction from photos                                         */
/* ------------------------------------------------------------------ */

export const extractedModifierOptionSchema = z.object({
  name: z.string().trim().min(1).max(60),
  priceDelta: z.number().min(0).max(1000).optional().default(0),
});

export const extractedModifierSchema = z.object({
  name: z.string().trim().min(1).max(60),
  selectionType: z.enum(['SINGLE', 'MULTIPLE']).optional().default('SINGLE'),
  isRequired: z.boolean().optional().default(false),
  options: z.array(extractedModifierOptionSchema).min(1).max(20),
});

// Coarse, self-reported buckets — never a fake-precise percentage. This is
// a signal that ADDS review items on top of the deterministic checks the
// review page already runs (missing price, duplicate name, empty
// category); it never substitutes for them and never suppresses one. An
// LLM grading its own extraction is not a calibrated probability, so we
// only ever ask it for "am I unsure about this," not "how sure am I."
const confidenceLevel = z.enum(['high', 'medium', 'low']);

export const extractedMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  // null means the price could not be read with real confidence — the
  // manager must fill it in themselves during review. Never a guessed
  // number standing in for something the model couldn't actually read.
  price: z.number().min(0).max(10000).nullable(),
  allergens: z.array(z.string().trim().max(60)).max(20).optional().default([]),
  // Closed list, not free text — see DIETARY_TAG_KEYS in dietaryTags.ts.
  // Only ever set when the source actually supports it; never inferred
  // from ingredients (a vegetable-looking dish is not necessarily vegan).
  dietaryTags: z.array(z.enum(DIETARY_TAG_KEYS as [string, ...string[]])).max(6).optional().default([]),
  modifiers: z.array(extractedModifierSchema).max(15).optional().default([]),
  confidence: confidenceLevel.optional().default('high'),
  // Which specific fields the model itself is unsure about, if any — lets
  // the review UI badge just the shaky field instead of the whole item.
  uncertainFields: z
    .array(z.enum(['name', 'description', 'price', 'allergens', 'dietaryTags', 'modifiers']))
    .optional()
    .default([]),
});

export const extractedMenuCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  items: z.array(extractedMenuItemSchema).max(200),
  // Is the model sure this is a real, distinct category (vs. e.g. a guess
  // at where to split two run-together sections on a cluttered photo).
  confidence: confidenceLevel.optional().default('high'),
});

// Closed list — see the FONT_PAIRINGS registry comment in fontPairings.ts
// for why this is never free text. Gemini picks the closest-matching key;
// it never invents a font name of its own.
const brandingSchema = z
  .object({
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional()
      .default(null),
    fontPairing: z.enum(FONT_PAIRING_KEYS as [string, ...string[]]).nullable().optional().default(null),
  })
  .optional()
  .default({ accentColor: null, fontPairing: null });

export const extractedMenuSchema = z.object({
  categories: z.array(extractedMenuCategorySchema).max(60),
  branding: brandingSchema,
});

export type ExtractedMenu = z.infer<typeof extractedMenuSchema>;

export async function extractMenuFromPhotos(
  images: { mediaType: string; base64: string }[]
): Promise<ExtractedMenu> {
  const system = `You are a careful data-entry assistant for a restaurant SaaS platform.
You will be shown one or more photos of a restaurant's paper or PDF menu, possibly in
Spanish, English or another language. Read every page and extract the FULL menu.

Reply with ONLY a single JSON object matching this exact shape:

{
  "categories": [
    {
      "name": "string, e.g. Starters / Entrantes",
      "items": [
        {
          "name": "string",
          "description": "string or null if the menu has no description",
          "price": 12.5,
          "allergens": ["gluten", "dairy"],
          "dietaryTags": ["VEGAN"],
          "modifiers": [
            {
              "name": "string, e.g. Choose a sauce / Elige salsa",
              "selectionType": "SINGLE or MULTIPLE",
              "isRequired": true,
              "options": [
                { "name": "string, e.g. Extra cheese / Sin cebolla", "priceDelta": 1.5 }
              ]
            }
          ],
          "confidence": "high, medium, or low",
          "uncertainFields": ["price"]
        }
      ],
      "confidence": "high, medium, or low"
    }
  ],
  "branding": {
    "accentColor": "#rrggbb or null",
    "fontPairing": "one of: elegant-script | modern-serif | rustic-handwritten | bold-modern, or null"
  }
}

Rules for categories/items:
- "price" is a plain decimal number in the menu's currency major unit (e.g. 12.5 for 12,50€), never a string, never including a currency symbol.
- Keep category and item names in the SAME language as the source photos.
- If a price cannot be read with real confidence, set "price" to null — NEVER guess or invent a
  number. A missing price is far better than a wrong one; the manager will fill it in by hand.
- If the photos contain no menu at all, reply with {"categories": [], "branding": {"accentColor": null, "fontPairing": null}}.
- Do not invent items that are not in the photos.
- Do not invent a "description" when the menu shows none — leave it null. A restaurant naming a
  dish (e.g. "Pizza de la casa", "Menú del día") with nothing else printed is NOT an invitation
  to write plausible-sounding filler text; null is the correct, honest answer.

Rules for "confidence" and "uncertainFields" — your own honest self-assessment, used only to
tell the manager which fields are worth a second look, never to decide whether to include
something:
- Item-level "confidence": "low" if the source text for this item was blurry, partially cropped,
  overlapping another item, or you had to make a real judgment call anywhere in it. "medium" if
  mostly clear but one detail is a bit uncertain. "high" if you read it cleanly and are not
  guessing at anything.
- "uncertainFields": list only the specific fields (name, description, price, allergens,
  dietaryTags, modifiers) you are genuinely unsure about for this item — e.g. the price digits
  were smudged, or you're not fully sure an item belongs in this category. Leave it empty when
  nothing about the item felt uncertain.
- Category-level "confidence": "low"/"medium" if you had to guess where one section ends and
  another begins (e.g. a cluttered layout with no clear heading break), "high" otherwise.
- This is separate from — and never a substitute for — the null-price and no-invented-content
  rules above. Marking something "low confidence" is not permission to guess; if you can't read
  a price at all, it is still null, not a low-confidence number.

Rules for "allergens" — list only what the source actually supports:
- The menu explicitly states it (a legend, an icon, the word "gluten"/"lácteos"/etc. printed next
  to the item), OR
- A named ingredient unambiguously contains it (e.g. "pan" or "harina" named in the ingredients
  implies gluten; "queso" or "nata" implies dairy).
Never guess an allergen from a dish's category, name, or cuisine alone (e.g. do not assume a
pasta dish contains gluten unless gluten-bearing ingredients are actually named or stated). When
the source gives no real basis, leave "allergens" empty for that item — an omitted allergen the
manager can add during review is far safer than a wrong one presented as fact.

Rules for "modifiers" — options a customer chooses when ordering the item, printed near it on
the menu (e.g. "Extra queso +1,50€", "Elige salsa", "Con patatas +2€", "Sin cebolla",
"Suplemento trufa +3€"). Group them: a SINGLE-select group is "choose exactly one" (e.g. choice
of sauce), a MULTIPLE-select group is "add any number" (e.g. extras). "priceDelta" is 0 for a
free option (like "sin cebolla"). If an item has no such options printed near it, omit
"modifiers" or return an empty array — never invent options that aren't on the menu.

Rules for "dietaryTags" — pick zero or more of exactly these six values:
VEGETARIAN, VEGAN, SPICY, VERY_SPICY, GLUTEN_FREE, DAIRY_FREE. Only include one when the
source gives you real evidence:
- The menu explicitly says so (an icon, the word "vegano"/"vegan", "picante", "sin gluten", etc.
  printed next to the item), OR
- The dish is UNAMBIGUOUSLY that by its named ingredients (e.g. a plain green salad with no
  cheese, egg, meat, or fish named is vegan; a dish naming "queso" or "huevo" is NOT vegan).
Do NOT guess from a dish merely sounding or looking plant-based — "looks like a vegetable dish"
is not evidence of VEGAN or VEGETARIAN on its own if any ingredient is ambiguous or unlisted.
When genuinely unsure, leave "dietaryTags" empty for that item rather than guessing.

Rules for "branding" — a best-effort guess at the restaurant's visual identity, used only to
suggest a look for their online menu (the manager reviews and can reject it):
- "accentColor": pick ONE hex color that captures the menu's dominant brand color — usually
  whatever color the headings, borders, or accents are printed in. If the photo is plain black
  text on white/cream paper with no real color identity, return null rather than guessing.
- "fontPairing": pick the closest match to the photographed menu's heading typography from
  exactly these four styles, or null if none fit reasonably:
  - "elegant-script": flowing cursive/script headings (dish names, section titles) — typical of
    fine dining, Italian, French, or romantic-restaurant branding.
  - "modern-serif": a refined, editorial serif for headings — upscale, contemporary, minimalist.
  - "rustic-handwritten": a casual handwritten/marker-style heading font — trattorias, cafes,
    bistros, taverns with a warm, informal feel.
  - "bold-modern": a tall condensed sans-serif (like a poster/sign font) for headings — bars,
    grills, contemporary fast-casual.
  If the photo's headings are in a plain, unremarkable font (e.g. default sans-serif), return
  null — do not force a match.`;

  const parts: Part[] = [
    ...images.map((image): Part => ({
      inline_data: {
        mime_type: image.mediaType,
        data: image.base64,
      },
    })),
    {
      text: 'Extract the full menu and suggested branding from these photos as the JSON object described in your instructions.',
    },
  ];

  const text = await callGemini({
    systemInstruction: system,
    contents: [{ role: 'user', parts }],
    maxOutputTokens: 8192,
    jsonMode: true,
  });

  const parsed = extractJson(text);
  return extractedMenuSchema.parse(parsed);
}

/* ------------------------------------------------------------------ */
/* Manager support assistant                                           */
/* ------------------------------------------------------------------ */

export type SupportChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const ESCALATE_TAG = '[ESCALATE]';

export async function getSupportAssistantReply(params: {
  restaurantName: string;
  history: SupportChatMessage[];
}): Promise<{ reply: string; escalate: boolean }> {
  const system = `You are the built-in support assistant for NOT2BUSY, a SaaS platform
restaurant managers use to run QR/NFC ordering: digital menu -> customer order ->
kitchen -> waiter -> payment.

You are chatting with a restaurant manager or owner of "${params.restaurantName}" who
opened the help chat, usually because something looks broken or they don't know how
to do something.

Help with common questions, for example:
- How to add/edit menu items, categories, prices, or availability (Dashboard > Menu).
- How to add tables and print/share their QR codes (Dashboard > Tables).
- How to create waiter/kitchen staff accounts (Dashboard > Waiters). Only a
  Manager/Owner can create these; staff cannot self-register.
- How table assignments work: a waiter only sees tables assigned to them
  (Dashboard > Waiters, or the waiter can self-assign an unclaimed table).
- The order lifecycle: NEW -> ACCEPTED -> PREPARING -> READY -> a waiter claims
  and delivers it -> COMPLETED, plus REJECTED/CANCELLED.
- Payments: the customer picks how they will pay (online, or pay at the
  restaurant with cash/card/other); a waiter only CONFIRMS a pay-at-restaurant
  payment was received, they don't choose the method.
- One login for everyone at "/": Owner/Manager land on the dashboard and can
  open Manager, Kitchen and Waiter from there without logging in again; Staff
  land directly on their assigned portal.

Be concise and practical, a few sentences, plain text (no markdown headers).

If the issue sounds like an actual system problem you cannot fix by explaining
(orders not appearing, payments stuck, a page erroring, data that looks wrong,
something that used to work and stopped), OR the manager explicitly asks for a
human / says the AI isn't helping, do this:
1. Write a short, reassuring reply telling them their issue has been flagged for
   the team and someone will follow up.
2. On a new line at the very end of your reply, output exactly: ${ESCALATE_TAG}

Only output ${ESCALATE_TAG} when you are actually escalating — never mention it
otherwise, and never show it as part of your visible explanation.`;

  const contents: ContentEntry[] = params.history.map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }],
  }));

  const text = await callGemini({
    systemInstruction: system,
    contents,
    maxOutputTokens: 1024,
  });

  const escalate = text.includes(ESCALATE_TAG);
  const reply = text.replace(ESCALATE_TAG, '').trim();

  return { reply, escalate };
}
