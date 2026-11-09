import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, press, release, tick } from '../game';
import { current, drawRound, playThrough, ready, seeded } from '../test-kit';
import flambe, {
  FLAMBE_FINALE,
  FLAMBE_GOES,
  FLAMBE_HIGH,
  FLAMBE_LOW,
  FLAMBE_SPEED,
  type FlambeState,
} from './flambe';

const pan = current<FlambeState>;

describe('flambé', () => {
  it('puts each star somewhere new, within reach', () => {
    const s = flambe.start({ kind: 'flambe', item: 'pancake' }, seeded(4));
    expect(s.targets).toHaveLength(FLAMBE_GOES);
    for (const target of s.targets) {
      expect(target).toBeGreaterThanOrEqual(FLAMBE_LOW);
      expect(target).toBeLessThanOrEqual(FLAMBE_HIGH);
    }
  });

  it('whooshes on every press, and a quick tap is "Not yet!", keeping the flames', () => {
    const state = ready('pancakes', 'flambe');
    const s = pan(state);
    press(state, 400, 300);
    expect(s.whooshes).toBe(1);
    tick(state, 0.1);
    expect(release(state)).toBe('not yet');
    expect(s.index).toBe(0);
    const level = s.level;
    expect(level).toBeGreaterThan(0);
    press(state, 400, 300);
    expect(s.whooshes).toBe(2);
    tick(state, 0.1);
    expect(s.level).toBeGreaterThan(level);
  });

  it('scores in full at the star, shows off its fireworks, then finishes the dish', () => {
    const state = ready('pancakes', 'flambe');
    const s = pan(state);
    for (const target of s.targets) {
      press(state, 400, 300);
      tick(state, target / FLAMBE_SPEED);
      expect(release(state)).toBeCloseTo(100 / FLAMBE_GOES);
    }
    expect(s.results).toEqual([1, 1, 1]);
    expect(state.phase).toBe('playing');
    tick(state, FLAMBE_FINALE);
    expect(state.phase).toBe('over');
    expect(state.scores[4]).toBe(100);
  });

  it('lets go by itself when the flames reach the top, still scoring something', () => {
    const state = ready('pancakes', 'flambe');
    const s = pan(state);
    press(state, 400, 300);
    for (let i = 0; i < 60; i++) tick(state, 0.05);
    expect(s.index).toBe(1);
    expect(s.holding).toBe(false);
    expect(s.results[0]).toBeGreaterThan(0);
  });

  it('cooks and draws to the end in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = createState(dishById('pancakes'), seeded(2));
      const memory = new Map();
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      expect(state.phase).toBe('over');
      for (let i = 0; i < 40; i++) drawRound(state, memory, 0.05, shape);
    }
  });
});
