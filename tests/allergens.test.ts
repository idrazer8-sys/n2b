import { describe, it, expect } from 'vitest';
import { matchAllergenKey, matchAllergenKeys } from '../src/lib/allergens';

describe('matchAllergenKey', () => {
  it('matches plain English category names (AI-import/seed format)', () => {
    expect(matchAllergenKey('Dairy')).toBe('MILK');
    expect(matchAllergenKey('Gluten')).toBe('GLUTEN');
  });

  it('matches lowercase Spanish, accents included', () => {
    expect(matchAllergenKey('lactosa')).toBe('MILK');
    expect(matchAllergenKey('glúten')).toBe('GLUTEN');
    expect(matchAllergenKey('Frutos de cáscara')).toBe('TREE_NUTS');
    expect(matchAllergenKey('Sésamo')).toBe('SESAME');
    expect(matchAllergenKey('Crustáceos')).toBe('CRUSTACEANS');
  });

  it('matches across all five app locales for one allergen', () => {
    expect(matchAllergenKey('gluten')).toBe('GLUTEN'); // es/en
    expect(matchAllergenKey('Glúten')).toBe('GLUTEN'); // pt
    expect(matchAllergenKey('Weizen')).toBe('GLUTEN'); // de
    expect(matchAllergenKey('Blé')).toBe('GLUTEN'); // fr
  });

  it('returns null for text that matches nothing (no icon, not a crash)', () => {
    expect(matchAllergenKey('sin relación con nada')).toBeNull();
    expect(matchAllergenKey('')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(matchAllergenKey('EGG')).toBe('EGGS');
    expect(matchAllergenKey('egg')).toBe('EGGS');
  });
});

describe('matchAllergenKeys', () => {
  it('de-duplicates and returns a stable ALLERGEN_KEYS order', () => {
    expect(matchAllergenKeys(['huevo', 'huevo', 'Egg'])).toEqual(['EGGS']);
  });

  it('drops unmatched entries silently', () => {
    expect(matchAllergenKeys(['Gluten', 'no lo sé'])).toEqual(['GLUTEN']);
  });

  it('handles an empty list', () => {
    expect(matchAllergenKeys([])).toEqual([]);
  });

  it('orders mixed matches by ALLERGEN_KEYS, not input order', () => {
    // SESAME comes after GLUTEN in ALLERGEN_KEYS, regardless of input order
    expect(matchAllergenKeys(['Sésamo', 'Gluten'])).toEqual(['GLUTEN', 'SESAME']);
  });
});
