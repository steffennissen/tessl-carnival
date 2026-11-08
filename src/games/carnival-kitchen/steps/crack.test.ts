import { describe, expect, it } from 'vitest';
import { press, tick } from '../game';
import { BOWL, FLOAT_END, FLOAT_START } from '../kit';
import { current, ready } from '../test-kit';
import crack, { CRACK_RULES, type CrackState } from './crack';

const eggs = current<CrackState>;

describe('crack', () => {
  it('floats 3 eggs unless the recipe says, each a little faster', () => {
    expect(crack.start({ kind: 'crack', item: 'egg' }, Math.random).speeds).toEqual([95, 110, 125]);
    expect(crack.start({ kind: 'crack', item: 'egg', count: 2 }, Math.random).speeds).toHaveLength(
      2,
    );
  });

  it('scores when the egg is over the bowl', () => {
    const state = ready('pancakes');
    const c = eggs(state);
    c.x = BOWL.x;
    expect(press(state, 0, 0)).toBe(true);
    expect(c.points).toBeCloseTo(100 / 3);
    expect(c.index).toBe(1);
    expect(c.results).toEqual([1]);
  });

  it('brings an egg that floats past back round', () => {
    const state = ready('pancakes');
    const c = eggs(state);
    c.x = FLOAT_END - 1;
    tick(state, 0.05);
    expect(c.x).toBe(FLOAT_START);
    expect(c.index).toBe(0);
  });

  it('ignores a tap far from the bowl, so no egg is wasted: "Not yet!"', () => {
    const state = ready('pancakes');
    const c = eggs(state);
    c.x = BOWL.x - CRACK_RULES.miss;
    expect(press(state, 0, 0)).toBe(false);
    expect(c.index).toBe(0);
    expect(state.feedback).toBeNull();
  });

  it('scores something for any egg that lands in the bowl', () => {
    const state = ready('pancakes');
    const c = eggs(state);
    c.x = BOWL.x + CRACK_RULES.miss - 1;
    press(state, 0, 0);
    expect(c.points).toBeGreaterThan(0);
  });
});
