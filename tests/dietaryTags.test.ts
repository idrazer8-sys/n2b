import { describe, it, expect } from 'vitest';
import { matchDietaryTagKey, matchDietaryTagKeys, isDietaryTagKey } from '../src/lib/dietaryTags';

describe('matchDietaryTagKey', () => {
  it('matches plain Spanish and English tags', () => {
    expect(matchDietaryTagKey('Vegano')).toBe('VEGAN');
    expect(matchDietaryTagKey('Vegan')).toBe('VEGAN');
    expect(matchDietaryTagKey('Vegetariano')).toBe('VEGETARIAN');
    expect(matchDietaryTagKey('Sin gluten')).toBe('GLUTEN_FREE');
    expect(matchDietaryTagKey('Sin lactosa')).toBe('DAIRY_FREE');
  });

  it('matches "muy picante" as VERY_SPICY, not SPICY (longest-match-first)', () => {
    expect(matchDietaryTagKey('Muy picante')).toBe('VERY_SPICY');
    expect(matchDietaryTagKey('Picante')).toBe('SPICY');
  });

  it('matches across other app locales', () => {
    expect(matchDietaryTagKey('Glutenfrei')).toBe('GLUTEN_FREE'); // de
    expect(matchDietaryTagKey('Sans lactose')).toBe('DAIRY_FREE'); // fr
    expect(matchDietaryTagKey('Sem glúten')).toBe('GLUTEN_FREE'); // pt
  });

  it('returns null for unrelated text', () => {
    expect(matchDietaryTagKey('sin relación con nada')).toBeNull();
    expect(matchDietaryTagKey('')).toBeNull();
  });

  it('is case-insensitive and accent-insensitive', () => {
    expect(matchDietaryTagKey('VEGANO')).toBe('VEGAN');
    expect(matchDietaryTagKey('vegano')).toBe('VEGAN');
  });
});

describe('matchDietaryTagKeys', () => {
  it('de-duplicates and returns a stable DIETARY_TAG_KEYS order', () => {
    expect(matchDietaryTagKeys(['Vegano', 'Vegano', 'Vegan'])).toEqual(['VEGAN']);
  });

  it('drops unmatched entries silently', () => {
    expect(matchDietaryTagKeys(['Vegano', 'no lo sé'])).toEqual(['VEGAN']);
  });

  it('handles an empty list', () => {
    expect(matchDietaryTagKeys([])).toEqual([]);
  });

  it('orders mixed matches by DIETARY_TAG_KEYS, not input order', () => {
    // DAIRY_FREE comes after VEGETARIAN in DIETARY_TAG_KEYS, regardless of input order
    expect(matchDietaryTagKeys(['Sin lactosa', 'Vegetariano'])).toEqual([
      'VEGETARIAN',
      'DAIRY_FREE',
    ]);
  });
});

describe('isDietaryTagKey', () => {
  it('accepts every canonical key', () => {
    expect(isDietaryTagKey('VEGETARIAN')).toBe(true);
    expect(isDietaryTagKey('VERY_SPICY')).toBe(true);
  });

  it('rejects anything else, including near-misses', () => {
    expect(isDietaryTagKey('vegan')).toBe(false); // wrong case
    expect(isDietaryTagKey('VEGANO')).toBe(false); // not a key
    expect(isDietaryTagKey(null)).toBe(false);
    expect(isDietaryTagKey(42)).toBe(false);
  });
});
