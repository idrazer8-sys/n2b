import type { Locale } from '../locales';

// Display names for the 6 dietary-preference tags, used as icon tooltips/
// aria-labels wherever DietaryTagIconRow renders.
export const dietaryTags: Record<Locale, Record<string, string>> = {
  es: {
    'dietaryTags.VEGETARIAN': 'Vegetariano',
    'dietaryTags.VEGAN': 'Vegano',
    'dietaryTags.SPICY': 'Picante',
    'dietaryTags.VERY_SPICY': 'Muy picante',
    'dietaryTags.GLUTEN_FREE': 'Sin gluten',
    'dietaryTags.DAIRY_FREE': 'Sin lactosa',
  },
  en: {
    'dietaryTags.VEGETARIAN': 'Vegetarian',
    'dietaryTags.VEGAN': 'Vegan',
    'dietaryTags.SPICY': 'Spicy',
    'dietaryTags.VERY_SPICY': 'Very spicy',
    'dietaryTags.GLUTEN_FREE': 'Gluten-free',
    'dietaryTags.DAIRY_FREE': 'Dairy-free',
  },
  pt: {
    'dietaryTags.VEGETARIAN': 'Vegetariano',
    'dietaryTags.VEGAN': 'Vegano',
    'dietaryTags.SPICY': 'Picante',
    'dietaryTags.VERY_SPICY': 'Muito picante',
    'dietaryTags.GLUTEN_FREE': 'Sem glúten',
    'dietaryTags.DAIRY_FREE': 'Sem lactose',
  },
  de: {
    'dietaryTags.VEGETARIAN': 'Vegetarisch',
    'dietaryTags.VEGAN': 'Vegan',
    'dietaryTags.SPICY': 'Scharf',
    'dietaryTags.VERY_SPICY': 'Sehr scharf',
    'dietaryTags.GLUTEN_FREE': 'Glutenfrei',
    'dietaryTags.DAIRY_FREE': 'Laktosefrei',
  },
  fr: {
    'dietaryTags.VEGETARIAN': 'Végétarien',
    'dietaryTags.VEGAN': 'Végan',
    'dietaryTags.SPICY': 'Épicé',
    'dietaryTags.VERY_SPICY': 'Très épicé',
    'dietaryTags.GLUTEN_FREE': 'Sans gluten',
    'dietaryTags.DAIRY_FREE': 'Sans lactose',
  },
};
