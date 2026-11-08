import { describe, expect, it } from 'vitest';
import { press, release, tick } from '../game';
import type { HoldState } from '../kit';
import { current, ready } from '../test-kit';
import { BAKE_EARLY, BAKE_SPEED, BAKE_TARGET } from './bake';

const oven = current<HoldState>;

describe('bake', () => {
  it('scores food taken out when it is golden', () => {
    const state = ready('pizza', 'bake');
    const b = oven(state);
    press(state, 0, 0);
    tick(state, BAKE_TARGET / BAKE_SPEED);
    expect(release(state)).toBeCloseTo(100);
    expect(b.index).toBe(1);
    expect(state.phase).toBe('over');
  });

  it('keeps pale food in the oven: "Not yet!", and the heat stays', () => {
    const state = ready('pizza', 'bake');
    const b = oven(state);
    press(state, 0, 0);
    tick(state, (BAKE_TARGET - BAKE_EARLY - 0.1) / BAKE_SPEED);
    const level = b.level;
    expect(release(state)).toBe('not yet');
    expect(b.level).toBe(level);
    expect(state.phase).toBe('playing');
    press(state, 0, 0);
    tick(state, (BAKE_TARGET - level) / BAKE_SPEED);
    expect(release(state)).toBeCloseTo(100);
  });

  it('takes forgotten food out by itself, still worth something', () => {
    const state = ready('pizza', 'bake');
    const b = oven(state);
    press(state, 0, 0);
    for (let i = 0; i < 200; i++) tick(state, 0.05);
    expect(b.index).toBe(1);
    expect(b.level).toBe(1);
    expect(state.scores[3]).toBeGreaterThan(0);
    expect(state.phase).toBe('over');
  });
});
