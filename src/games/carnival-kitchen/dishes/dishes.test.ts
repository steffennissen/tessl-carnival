// Loads the dishes before anything else, as a new dish's own test might, to
// check the dish files don't depend on the game logic being loaded first.
import { describe, expect, it } from 'vitest';
import { DISHES } from './index';

describe('dishes', () => {
  it('load on their own, before the game logic', () => {
    expect(DISHES.length).toBeGreaterThan(0);
  });
});
