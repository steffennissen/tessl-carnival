import { describe, expect, it } from 'vitest';
import { currentKind, move, press, release, tick } from '../game';
import { current, ready } from '../test-kit';
import {
  BLOCK_MAX,
  BLOCK_MIN,
  GRATE_STROKES,
  GRATE_TIME,
  SWIPE_SLACK,
  SWIPE_TRAVEL,
  startSwipe,
  swipeTo,
  type GrateState,
} from './grate';

const block = current<GrateState>;

/** Holds the cheese and swipes it left and right `strokes` times, in small moves. */
function rub(state: ReturnType<typeof ready>, strokes: number, width = 120) {
  press(state, 400, 200);
  let x = 400;
  for (let k = 0; k < strokes; k++) {
    const dir = k % 2 === 0 ? 1 : -1;
    for (let i = 0; i < 12; i++) {
      x += (dir * width) / 12;
      move(state, x, 200);
    }
  }
}

describe('grate', () => {
  it('counts each swipe that goes far enough, either way', () => {
    const s = startSwipe(0);
    expect(swipeTo(s, SWIPE_TRAVEL - 5)).toBe(false);
    expect(swipeTo(s, SWIPE_TRAVEL + 5)).toBe(true);
    // Going further the same way doesn't count again.
    expect(swipeTo(s, 200)).toBe(false);
    // Turning round starts a new swipe.
    expect(swipeTo(s, 200 - SWIPE_TRAVEL - 1)).toBe(true);
  });

  it('ignores small wobbles', () => {
    const s = startSwipe(0);
    swipeTo(s, 40);
    swipeTo(s, 40 - SWIPE_SLACK + 2);
    expect(swipeTo(s, SWIPE_TRAVEL)).toBe(true);
  });

  it('scores 100 for grating quickly, and moves on', () => {
    const state = ready('mac-and-cheese', 'grate');
    rub(state, GRATE_STROKES);
    expect(state.scores[0]).toBe(100);
    expect(currentKind(state)).toBe('pour');
  });

  it('scores 50 plus a share of the time left', () => {
    const state = ready('mac-and-cheese', 'grate');
    tick(state, GRATE_TIME / 2);
    rub(state, GRATE_STROKES);
    expect(state.scores[0]).toBe(75);
  });

  it('scores up to 50 for the strokes made when time runs out', () => {
    const state = ready('mac-and-cheese', 'grate');
    rub(state, GRATE_STROKES / 2);
    release(state);
    for (let t = 0; t <= GRATE_TIME; t += 0.5) tick(state, 0.5);
    expect(state.scores[0]).toBe(25);
    expect(currentKind(state)).toBe('pour');
  });

  it('keeps the block on the grater, but counts big swipes past its ends', () => {
    const state = ready('mac-and-cheese', 'grate');
    rub(state, 2, 500);
    const s = block(state);
    expect(s.x).toBeGreaterThanOrEqual(BLOCK_MIN);
    expect(s.x).toBeLessThanOrEqual(BLOCK_MAX);
    expect(s.strokes).toBe(2);
  });

  it('does nothing while nobody is holding', () => {
    const state = ready('mac-and-cheese', 'grate');
    move(state, 300, 200);
    move(state, 500, 200);
    expect(block(state).strokes).toBe(0);
  });

  it('leaves the streak alone', () => {
    const state = ready('mac-and-cheese', 'grate');
    state.combo = 3;
    rub(state, GRATE_STROKES);
    expect(state.combo).toBe(3);
  });
});
