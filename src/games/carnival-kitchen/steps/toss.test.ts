import { describe, expect, it } from 'vitest';
import { move, press, release, tick } from '../game';
import { current, ready } from '../test-kit';
import {
  COSY_HIGH,
  HEAT_DOWN,
  HEAT_REST,
  HEAT_UP,
  PAN_MAX,
  PAN_MIN,
  TOSS_COUNT,
  lumpsOf,
  tooHot,
  type TossState,
} from './toss';

const pan = current<TossState>;
type Round = ReturnType<typeof ready>;

/** Swipes the pan left and right `count` times, each swipe taking `seconds`. */
function toss(state: Round, count: number, seconds = 0.2) {
  press(state, 400, 280);
  let x = 400;
  for (let k = 0; k < count; k++) {
    const dir = k % 2 === 0 ? 1 : -1;
    for (let i = 0; i < 10; i++) {
      x += dir * 8;
      move(state, x, 280);
      tick(state, seconds / 10);
    }
  }
}

describe('toss', () => {
  it('counts a toss for each swipe left or right', () => {
    const state = ready('cacio-e-pepe', 'toss');
    toss(state, 3);
    expect(pan(state).tosses).toBe(3);
  });

  it('scores 100 when it stays cosy, and finishes the dish', () => {
    const state = ready('cacio-e-pepe', 'toss');
    toss(state, TOSS_COUNT);
    expect(state.scores[4]).toBe(100);
    expect(state.phase).toBe('over');
  });

  it('warms up while tossing, and cools back to warm while resting', () => {
    const state = ready('cacio-e-pepe', 'toss');
    toss(state, 4, 0.5);
    const s = pan(state);
    expect(s.heat).toBeCloseTo(HEAT_REST + HEAT_UP * 2);
    release(state);
    for (let i = 0; i < 40; i++) tick(state, 0.1);
    expect(s.heat).toBe(HEAT_REST);
  });

  it('holding still is resting, too', () => {
    const state = ready('cacio-e-pepe', 'toss');
    toss(state, 4, 0.5);
    const before = pan(state).heat;
    tick(state, 0.5);
    expect(pan(state).heat).toBeCloseTo(before - HEAT_DOWN * 0.5);
  });

  it('scores the share of tossing time spent cosy, never failing', () => {
    const state = ready('cacio-e-pepe', 'toss');
    // Slow, non-stop tossing: it goes too hot part way through.
    toss(state, TOSS_COUNT, 1);
    // Cosy for its first seconds of nearly 10 seconds' tossing.
    const cosy = (COSY_HIGH - HEAT_REST) / HEAT_UP;
    expect(state.scores[4]).toBeGreaterThanOrEqual(Math.round((100 * cosy) / TOSS_COUNT));
    expect(state.scores[4]).toBeLessThan(55);
    expect(state.feedback?.grade).not.toBe('Nice try!');
  });

  it('shows lumps only while too hot, and they melt away as it cools', () => {
    const state = ready('cacio-e-pepe', 'toss');
    const s = pan(state);
    expect(lumpsOf(s)).toBe(0);
    toss(state, 7, 1);
    expect(tooHot(s)).toBe(true);
    expect(lumpsOf(s)).toBeGreaterThan(0);
    release(state);
    for (let i = 0; i < 50; i++) tick(state, 0.1);
    expect(tooHot(s)).toBe(false);
    expect(lumpsOf(s)).toBe(0);
  });

  it('keeps the pan on the hob, but counts big swipes', () => {
    const state = ready('cacio-e-pepe', 'toss');
    press(state, 400, 280);
    for (const x of [700, 100, 700]) move(state, x, 280);
    const s = pan(state);
    expect(s.panX).toBeGreaterThanOrEqual(PAN_MIN);
    expect(s.panX).toBeLessThanOrEqual(PAN_MAX);
    expect(s.tosses).toBe(3);
  });

  it('leaves the streak alone', () => {
    const state = ready('cacio-e-pepe', 'toss');
    state.combo = 2;
    toss(state, TOSS_COUNT);
    expect(state.combo).toBe(2);
  });
});
