import { describe, expect, it } from 'vitest';
import { press, tick } from '../game';
import { FLOAT_END, FLOAT_START } from '../kit';
import { PIZZA_VIEW } from '../ingredients/pizza';
import { current, ready, seeded } from '../test-kit';
import top, { SPOT_REACH, TOP_RULES, type TopOptions, type TopState } from './top';

const toppings = current<TopState>;

const PIZZA_TOP: TopOptions = {
  kind: 'top',
  base: 'pizza',
  always: ['pepperoni'],
  extras: ['mushroom', 'pineapple', 'olive', 'pepper', 'tomato'],
  count: 5,
};

describe('toppings', () => {
  it('always puts on the pepperoni, and four others, each on its own spot', () => {
    const ids = new Set<string>();
    for (let seed = 1; seed < 20; seed++) {
      const { spots } = top.start(PIZZA_TOP, seeded(seed));
      expect(spots).toHaveLength(5);
      expect(spots.map((t) => t.id)).toContain('pepperoni');
      expect(new Set(spots.map((t) => t.id)).size).toBe(5);
      expect(spots.map((t) => t.speed)).toEqual([90, 98, 106, 114, 122]);
      for (const t of spots) {
        ids.add(t.id);
        const nx = (t.x - PIZZA_VIEW.x) / PIZZA_VIEW.rx;
        const ny = (t.y - PIZZA_VIEW.y) / PIZZA_VIEW.ry;
        expect(Math.hypot(nx, ny)).toBeLessThanOrEqual(SPOT_REACH + 0.02);
      }
    }
    expect(ids.size).toBe(6);
  });

  it('scores a topping dropped on its spot', () => {
    const state = ready('pizza', 'top');
    const t = toppings(state);
    t.x = t.spots[0].x;
    press(state, 0, 0);
    expect(t.points).toBeCloseTo(100 / 5);
    expect(t.results).toEqual([1]);
    expect(t.x).toBe(FLOAT_START);
  });

  it('ignores a tap far from the spot, so no topping is wasted: "Not yet!"', () => {
    const state = ready('pizza', 'top');
    const t = toppings(state);
    t.x = t.spots[0].x + TOP_RULES.miss;
    expect(press(state, 0, 0)).toBe(false);
    expect(t.index).toBe(0);
  });

  it('brings a topping that floats past back round', () => {
    const state = ready('pizza', 'top');
    const t = toppings(state);
    t.x = FLOAT_END - 1;
    tick(state, 0.05);
    expect(t.x).toBe(FLOAT_START);
  });
});
