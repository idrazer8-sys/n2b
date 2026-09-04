// A small, curated set of Google Font pairings a restaurant's online menu
// can use instead of the platform default (Fraunces/Inter). Deliberately a
// closed list rather than free text — an AI suggestion or a manager typing
// an arbitrary Google Fonts family name could easily reference a font that
// doesn't exist or renders badly at menu sizes; every pairing here has been
// picked and sized for restaurant branding specifically.
//
// `display` is used for headings (restaurant name, category names, dish
// names — anywhere the app already applies the `font-display` Tailwind
// utility). `body` is used for everything else. `googleFontsParam` is the
// exact `family=...` query fragment for the Google Fonts CSS2 API.

export type FontPairingKey =
  | 'elegant-script'
  | 'modern-serif'
  | 'rustic-handwritten'
  | 'bold-modern';

export const FONT_PAIRINGS: Record<
  FontPairingKey,
  { display: string; body: string; googleFontsParam: string }
> = {
  'elegant-script': {
    display: 'Dancing Script',
    body: 'Cormorant Garamond',
    googleFontsParam:
      'family=Dancing+Script:wght@600;700&family=Cormorant+Garamond:wght@400;500;600',
  },
  'modern-serif': {
    display: 'Playfair Display',
    body: 'EB Garamond',
    googleFontsParam:
      'family=Playfair+Display:wght@600;700&family=EB+Garamond:wght@400;500',
  },
  'rustic-handwritten': {
    display: 'Caveat',
    body: 'Nunito',
    googleFontsParam: 'family=Caveat:wght@600;700&family=Nunito:wght@400;500;600',
  },
  'bold-modern': {
    display: 'Bebas Neue',
    body: 'Work Sans',
    googleFontsParam: 'family=Bebas+Neue&family=Work+Sans:wght@400;500;600',
  },
};

export const FONT_PAIRING_KEYS = Object.keys(FONT_PAIRINGS) as FontPairingKey[];

export function isFontPairingKey(value: unknown): value is FontPairingKey {
  return typeof value === 'string' && (FONT_PAIRING_KEYS as string[]).includes(value);
}

export function googleFontsHref(key: FontPairingKey): string {
  return `https://fonts.googleapis.com/css2?${FONT_PAIRINGS[key].googleFontsParam}&display=swap`;
}
