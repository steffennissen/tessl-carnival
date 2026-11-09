import { describe, expect, it } from 'vitest';
import { press } from '../game';
import { current, ready, seeded } from '../test-kit';
import flip, { FLIP_HIGH, FLIP_LOW, type FlipState } from './flip';

const pan = current<FlipState>;

describe('flip', () => {
  it('moves the golden zone for each pancake, each a little faster', () => {
    const { goes } = flip.start({ kind: 'flip', item: 'pancake' }, seeded(3));
    expect(goes.map((go) => go.speed)).toEqual([0.3, 0.34, 0.38, 0.42]);
    for (const go of goes) {
      expect(go.target).toBeGreaterThanOrEqual(FLIP_LOW);
      expect(go.target).toBeLessThanOrEqual(FLIP_HIGH);
    }
  });

  it('scores in full on the target', () => {
    const state = ready('pancakes', 'flip');
    const f = pan(state);
    f.needle = f.goes[0].target;
    press(state, 0, 0);
    expect(f.points).toBeCloseTo(100 / f.goes.length);
    expect(f.results).toEqual([1]);
  });

  it('ignores a tap far from the gold, so no pancake is wasted: "Not yet!"', () => {
    const state = ready('pancakes', 'flip');
    const f = pan(state);
    f.needle = f.goes[0].target > 0.5 ? 0 : 1;
    expect(press(state, 0, 0)).toBe(false);
    expect(f.index).toBe(0);
  });

  it('moves on to the flambé after the last pancake', () => {
    const state = ready('pancakes', 'flip');
    const f = pan(state);
    for (const go of f.goes) {
      f.needle = go.target;
      press(state, 0, 0);
    }
    expect(state.stepIndex).toBe(4);
    expect(state.scores[3]).toBe(100);
    expect(f.results).toHaveLength(4);
  });
});
