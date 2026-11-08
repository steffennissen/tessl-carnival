import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, press, tick } from '../game';
import type { Dish } from '../kit';
import { current, drawRound, playThrough, ready } from '../test-kit';
import stack, {
  MAX_LEAN,
  STACK_RULES,
  STACK_WAIT,
  STACK_X,
  SWING,
  leanOf,
  swingX,
  type StackState,
} from './stack';

const tower = current<StackState>;
const layers = ['bun', 'patty', 'cheese-slice', 'bun'];
const dish: Dish = {
  ...dishById('pancakes'),
  id: 'tower',
  steps: [{ kind: 'stack', base: 'burger-plate', layers }],
};

/** Puts the swinging layer `offset` px from the middle. */
function aim(state: StackState, offset: number) {
  state.phase = Math.asin(offset / SWING);
}

describe('stack', () => {
  it('swings each layer a little faster, starting from the sides in turn', () => {
    const s = stack.start({ kind: 'stack', base: 'burger-plate', layers }, () => 0.5);
    expect(s.layers.map((l) => l.id)).toEqual(layers);
    expect(s.layers.map((l) => l.speed)).toEqual([0.9, 1.02, 1.14, 1.26]);
    expect(swingX(s)).toBeCloseTo(STACK_X - SWING);
  });

  it('scores in full when a layer drops in the middle', () => {
    const state = ready(dish);
    const s = tower(state);
    aim(s, STACK_RULES.perfect - 1);
    expect(press(state, 0, 0)).toBe(true);
    expect(s.results).toEqual([1]);
    expect(s.points).toBeCloseTo(100 / layers.length);
    expect(state.feedback?.grade).toBe('Perfect!');
  });

  it('keeps a layer dropped far off: it sticks, leaning out, for fewer points', () => {
    const state = ready(dish);
    const s = tower(state);
    aim(s, 75);
    press(state, 0, 0);
    expect(s.index).toBe(1);
    expect(s.results[0]).toBeCloseTo(0.5);
    expect(leanOf(s.offsets[0])).toBeGreaterThan(0);
    expect(leanOf(s.offsets[0])).toBeLessThanOrEqual(MAX_LEAN);

    // Even at the very edge it sticks, and still scores a little.
    tick(state, STACK_WAIT);
    aim(s, -SWING);
    expect(press(state, 0, 0)).toBe(true);
    expect(s.index).toBe(2);
    expect(state.feedback?.grade).toBe('Good!');
  });

  it('says "Not yet!" to a tap while the next layer is still on its way', () => {
    const state = ready(dish);
    const s = tower(state);
    aim(s, 0);
    press(state, 0, 0);
    expect(press(state, 0, 0)).toBe(false);
    expect(s.index).toBe(1);
    // The next layer waits at its edge, then swings.
    const phase = s.phase;
    tick(state, STACK_WAIT / 2);
    expect(s.phase).toBe(phase);
    tick(state, STACK_WAIT);
    expect(s.phase).not.toBe(phase);
    expect(press(state, 0, 0)).toBe(true);
  });

  it('ends the step after the last layer', () => {
    const state = ready(dish);
    const s = tower(state);
    for (let i = 0; i < layers.length; i++) {
      aim(s, 0);
      press(state, 0, 0);
      tick(state, STACK_WAIT);
    }
    expect(state.phase).toBe('over');
    expect(state.scores).toEqual([100]);
    expect(s.offsets).toHaveLength(layers.length);
  });

  it('plays and draws to the end, upright too', () => {
    for (const shape of ['page', 'tall'] as const) {
      const state = createState(dish);
      const memory = new Map();
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      for (let i = 0; i < 20; i++) drawRound(state, memory, 0.05, shape);
      expect(state.phase).toBe('over');
    }
  });
});
