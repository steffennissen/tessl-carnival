// Loads an ingredient that looks others up before anything else, to check
// ingredient files can import the registry without a loop going wrong.
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import pizza from './pizza';
import { allIngredients, artOf, ingredient } from './index';

describe('ingredients', () => {
  it('load on their own, even one that looks others up', () => {
    expect(pizza.id).toBe('pizza');
    expect(artOf('pepperoni', 'topping')).toBeDefined();
  });

  it('finds one ingredient per file in ingredients/, named by its id', () => {
    const files = readdirSync(import.meta.dirname)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
      .map((f) => f.slice(0, -3));
    expect(
      allIngredients()
        .map((i) => i.id)
        .sort(),
    ).toEqual(files.sort());
  });

  it('gives every ingredient a label, an icon and at least one colour', () => {
    for (const found of allIngredients()) {
      expect(found.label.trim(), found.id).not.toBe('');
      expect(found.icon.trim(), found.id).not.toBe('');
      expect(found.colors.length, found.id).toBeGreaterThan(0);
    }
  });

  it('says clearly when something is missing', () => {
    expect(() => ingredient('broccoli')).toThrow('No ingredient "broccoli"');
    expect(() => artOf('salt', 'chop')).toThrow('ingredients/salt.ts has no "chop" art');
  });
});
