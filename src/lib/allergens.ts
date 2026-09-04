// Matches free-text allergen strings (managers type whatever they want, in
// whatever language — there's no fixed vocabulary in MenuItem.allergens)
// against the 14 allergens EU Regulation 1169/2011 Annex II requires
// restaurants to declare. Best-effort by design: a string that matches
// nothing just renders as plain text with no icon, which is exactly what
// happened before this existed — nothing regresses, some items gain an
// icon.

export type AllergenKey =
  | 'GLUTEN'
  | 'CRUSTACEANS'
  | 'EGGS'
  | 'FISH'
  | 'PEANUTS'
  | 'SOY'
  | 'MILK'
  | 'TREE_NUTS'
  | 'CELERY'
  | 'MUSTARD'
  | 'SESAME'
  | 'SULPHITES'
  | 'LUPIN'
  | 'MOLLUSCS';

export const ALLERGEN_KEYS: AllergenKey[] = [
  'GLUTEN',
  'CRUSTACEANS',
  'EGGS',
  'FISH',
  'PEANUTS',
  'SOY',
  'MILK',
  'TREE_NUTS',
  'CELERY',
  'MUSTARD',
  'SESAME',
  'SULPHITES',
  'LUPIN',
  'MOLLUSCS',
];

// Keywords are matched against a normalized (lowercased, accent-stripped)
// version of the stored string, longest-first so e.g. "frutos de cascara"
// doesn't lose to a shorter unrelated fragment.
const SYNONYMS: Record<AllergenKey, string[]> = {
  GLUTEN: [
    'gluten', 'trigo', 'wheat', 'cereales con gluten', 'cereales', 'weizen',
    'ble', 'cebada', 'centeno', 'avena', 'barley', 'rye', 'oat', 'espelta',
    'kamut', 'triticale', 'roggen', 'hafer', 'seigle', 'orge', 'avoine',
  ],
  CRUSTACEANS: [
    'crustaceos', 'crustaceans', 'crevette', 'shrimp', 'prawn', 'camaron',
    'gamba', 'langostino', 'krebstiere', 'crustace', 'crab', 'cangrejo',
    'lobster', 'langosta',
  ],
  EGGS: [
    'huevo', 'huevos', 'egg', 'eggs', 'ei', 'eier', 'oeuf', 'ovo', 'ovos',
  ],
  FISH: ['pescado', 'fish', 'fisch', 'poisson', 'peixe'],
  PEANUTS: [
    'cacahuete', 'cacahuetes', 'peanut', 'peanuts', 'erdnuss', 'erdnusse',
    'arachide', 'amendoim',
  ],
  SOY: ['soja', 'soy', 'soya', 'sojabohnen'],
  MILK: [
    'lacteos', 'lacteo', 'lactosa', 'lactose', 'leche', 'milk', 'dairy',
    'milch', 'lait', 'laticinios', 'leite', 'queso', 'cheese', 'butter',
    'mantequilla', 'yogur', 'yoghurt', 'nata', 'cream',
  ],
  TREE_NUTS: [
    'frutos de cascara', 'frutos secos', 'tree nuts', 'nuts', 'nusse',
    'noix', 'nozes', 'almendra', 'almond', 'avellana', 'hazelnut', 'nuez',
    'walnut', 'anacardo', 'cashew', 'pistacho', 'pistachio', 'macadamia',
    'pecana', 'pecan', 'castana', 'chestnut',
  ],
  CELERY: ['apio', 'celery', 'sellerie', 'celeri', 'aipo'],
  MUSTARD: ['mostaza', 'mustard', 'senf', 'moutarde', 'mostarda'],
  SESAME: ['sesamo', 'sesame', 'sesam', 'gergelim'],
  SULPHITES: [
    'sulfitos', 'sulfito', 'sulphites', 'sulphite', 'sulfites', 'sulfite',
    'sulfit', 'dioxido de azufre', 'anhidrido sulfuroso',
  ],
  LUPIN: ['altramuces', 'altramuz', 'lupin', 'lupine', 'lupinen', 'lupino'],
  MOLLUSCS: [
    'moluscos', 'molusco', 'molluscs', 'mollusc', 'weichtiere', 'mollusque',
    'mejillon', 'mussel', 'calamar', 'squid', 'pulpo', 'octopus', 'almeja',
    'clam', 'ostra', 'oyster', 'vieira', 'scallop',
  ],
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const SORTED_ENTRIES: Array<[AllergenKey, string]> = ALLERGEN_KEYS.flatMap(
  (key) => SYNONYMS[key].map((word): [AllergenKey, string] => [key, word])
).sort((a, b) => b[1].length - a[1].length);

/**
 * Matches one free-text allergen string to a canonical key, or null if
 * nothing in the synonym list matches. Case/accent-insensitive.
 */
export function matchAllergenKey(text: string): AllergenKey | null {
  const normalized = normalize(text);
  if (!normalized) return null;

  for (const [key, word] of SORTED_ENTRIES) {
    if (normalized.includes(word)) return key;
  }
  return null;
}

/**
 * Matches a whole allergens list, de-duplicated and in ALLERGEN_KEYS order
 * (a stable, predictable order for rendering a row of icons) — entries that
 * matched nothing are simply dropped, since there is no icon for them.
 */
export function matchAllergenKeys(allergens: string[]): AllergenKey[] {
  const matched = new Set<AllergenKey>();
  for (const raw of allergens) {
    const key = matchAllergenKey(raw);
    if (key) matched.add(key);
  }
  return ALLERGEN_KEYS.filter((key) => matched.has(key));
}
