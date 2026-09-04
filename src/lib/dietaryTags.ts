// Matches free-text dietary-tag strings (managers type whatever they want,
// in whatever language — there's no fixed vocabulary in MenuItem.dietaryTags)
// against the 6 tags the customer menu shows icons for. Best-effort by
// design, same as allergens.ts: a string that matches nothing just renders
// as plain text with no icon.
//
// These are never inferred from ingredients — "looks vegetable-based" is
// not the same as "is vegan" — only set when a manager (or the menu-import
// AI, with the same caution) has real evidence for the specific tag.

export type DietaryTagKey =
  | 'VEGETARIAN'
  | 'VEGAN'
  | 'SPICY'
  | 'VERY_SPICY'
  | 'GLUTEN_FREE'
  | 'DAIRY_FREE';

export const DIETARY_TAG_KEYS: DietaryTagKey[] = [
  'VEGETARIAN',
  'VEGAN',
  'SPICY',
  'VERY_SPICY',
  'GLUTEN_FREE',
  'DAIRY_FREE',
];

const SYNONYMS: Record<DietaryTagKey, string[]> = {
  VEGETARIAN: ['vegetariano', 'vegetariana', 'vegetarian', 'vegetarisch', 'vegetarien'],
  VEGAN: ['vegano', 'vegana', 'vegan', 'vegane', 'vegetalien', 'vegetaliano'],
  // Checked before SPICY (see SORTED_ENTRIES) so "muy picante" doesn't
  // match the shorter "picante" entry first.
  VERY_SPICY: [
    'muy picante', 'very spicy', 'extra spicy', 'tres epice', 'sehr scharf',
    'muito picante',
  ],
  SPICY: ['picante', 'spicy', 'epice', 'scharf', 'apimentado'],
  GLUTEN_FREE: [
    'sin gluten', 'gluten free', 'gluten-free', 'sans gluten', 'glutenfrei',
    'sem gluten',
  ],
  DAIRY_FREE: [
    'sin lactosa', 'lactose free', 'lactose-free', 'dairy free', 'dairy-free',
    'sans lactose', 'laktosefrei', 'sem lactose',
  ],
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const SORTED_ENTRIES: Array<[DietaryTagKey, string]> = DIETARY_TAG_KEYS.flatMap(
  (key) => SYNONYMS[key].map((word): [DietaryTagKey, string] => [key, word])
).sort((a, b) => b[1].length - a[1].length);

export function isDietaryTagKey(value: unknown): value is DietaryTagKey {
  return typeof value === 'string' && (DIETARY_TAG_KEYS as string[]).includes(value);
}

export function matchDietaryTagKey(text: string): DietaryTagKey | null {
  const normalized = normalize(text);
  if (!normalized) return null;

  for (const [key, word] of SORTED_ENTRIES) {
    if (normalized.includes(word)) return key;
  }
  return null;
}

/**
 * Matches a whole dietary-tags list, de-duplicated and in DIETARY_TAG_KEYS
 * order (a stable, predictable order for rendering a row of icons).
 */
export function matchDietaryTagKeys(tags: string[]): DietaryTagKey[] {
  const matched = new Set<DietaryTagKey>();
  for (const raw of tags) {
    const key = matchDietaryTagKey(raw);
    if (key) matched.add(key);
  }
  return DIETARY_TAG_KEYS.filter((key) => matched.has(key));
}
