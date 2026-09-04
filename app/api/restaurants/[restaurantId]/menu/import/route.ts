import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { rateLimit } from '@/src/lib/rate-limit';
import {
  extractMenuFromPhotos,
  AiNotConfiguredError,
} from '@/src/lib/ai';

const MAX_IMAGES = 12;
// Roughly caps the request at ~30MB of base64 text combined.
const MAX_BASE64_CHARS_PER_IMAGE = 8_000_000;

const ALLOWED_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

const schema = z.object({
  images: z
    .array(
      z.object({
        mediaType: z.string(),
        base64: z.string().min(1).max(MAX_BASE64_CHARS_PER_IMAGE),
      })
    )
    .min(1, 'Upload at least one photo of the menu.')
    .max(MAX_IMAGES, `You can upload up to ${MAX_IMAGES} photos at once.`),
});

/*
 * POST /api/restaurants/[restaurantId]/menu/import
 *
 * Takes photos of a paper/PDF menu and asks Claude to read them and
 * return a structured draft menu (categories + items + prices). Nothing
 * is written to the database here — the manager reviews/edits the draft
 * in the UI first, then confirms via .../menu/import/publish.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    // Each call spends real Gemini quota/cost — keyed by restaurant (not
    // IP) since this is an authenticated manager action, not a public
    // endpoint. Generous enough for genuine re-analysis after edits, tight
    // enough to stop a runaway retry loop or a compromised account from
    // running up usage unbounded.
    const limited = await rateLimit(
      `menu-import:${params.restaurantId}`,
      20,
      10 * 60 * 1000
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many import attempts — please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const body = schema.parse(await req.json());

    for (const image of body.images) {
      if (!ALLOWED_MEDIA_TYPES.has(image.mediaType)) {
        return NextResponse.json(
          {
            error: `Unsupported image type: ${image.mediaType}. Use JPEG, PNG, WEBP or HEIC photos.`,
          },
          { status: 400 }
        );
      }
    }

    const draft = await extractMenuFromPhotos(
      body.images.map((image) => ({
        mediaType: image.mediaType,
        base64: image.base64,
      }))
    );

    return NextResponse.json(draft);
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.error(
      'POST /api/restaurants/[restaurantId]/menu/import error:',
      err
    );

    // schema.parse() failures above (malformed request body) are still a
    // genuine 400 via errorResponse's ZodError branch. Everything else that
    // reaches here comes from extractMenuFromPhotos itself — a Gemini call
    // that failed outright, an empty/blocked response, or a response that
    // didn't match our own schema (e.g. the model returned malformed JSON).
    // None of those are the manager's fault or fixable by reading a raw
    // "Internal server error" or a wall of Zod field paths, so give them
    // one clear, actionable message instead — reproduced directly: an
    // unreadable image returns a bare 500 today.
    if (!(err instanceof z.ZodError) || err.issues.every((issue) => issue.path[0] !== 'images')) {
      return NextResponse.json(
        {
          error:
            'We could not read the menu in these photos. Try again with clearer, well-lit photos of the full menu.',
        },
        { status: 502 }
      );
    }

    return errorResponse(err);
  }
}
