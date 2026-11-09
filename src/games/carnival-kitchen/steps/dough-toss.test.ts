import { describe, expect, it } from 'vitest';
import { createState, move, press, release, tick } from '../game';
import { currentTurn } from '../kit';
import { current, drawRound, playThrough, ready, seeded } from '../test-kit';
import { dishById } from '../dishes';
import {
  CATCH_Y,
  DOUGH_FINALE,
  DOUGH_REST,
  DOUGH_TOSSES,
  DROP_SHARE,
  catchable,
  doughY,
  solveDough,
  type DoughTossState,
} from './dough-toss';

const dough = current<DoughTossState>;
type Round = ReturnType<typeof ready>;

/** Swipes the dough up from the board. */
function swipeUp(state: Round) {
  press(state, 400, 300);
  move(state, 400, 280);
  move(state, 400, 240);
  release(state);
}

/** The highest the dough goes on the toss in the air, sampled. */
function peakOf(s: DoughTossState): number {
  const go = s.goes[s.index];
  const was = s.time;
  let top = Infinity;
  for (let k = 0; k <= 20; k++) {
    s.time = (go.time * k) / 20;
    top = Math.min(top, doughY(s));
  }
  s.time = was;
  return top;
}

describe('dough toss', () => {
  it('flings the dough on a swipe up, and a plain tap is "Not yet!"', () => {
    const state = ready('pizza', 'dough-toss');
    const s = dough(state);
    expect(s.goes).toHaveLength(DOUGH_TOSSES);
    press(state, 400, 300);
    expect(release(state)).toBe('not yet');
    expect(s.phase).toBe('ready');
    swipeUp(state);
    expect(s.phase).toBe('flying');
  });

  it('goes higher each toss, and takes no catch on the way up', () => {
    const state = ready('pizza', 'dough-toss');
    const s = dough(state);
    const peaks: number[] = [];
    for (let i = 0; i < DOUGH_TOSSES; i++) {
      swipeUp(state);
      peaks.push(peakOf(s));
      tick(state, 0.2);
      expect(catchable(s)).toBe(false);
      expect(press(state, 400, 300)).toBe(false);
      release(state);
      tick(state, s.goes[s.index].time - 0.2);
      expect(press(state, 400, 300)).toBe(true);
      release(state);
      tick(state, DOUGH_REST);
    }
    expect(peaks[1]).toBeLessThan(peaks[0]);
    expect(peaks[2]).toBeLessThan(peaks[1]);
    // The last one goes right off the top of the kitchen.
    expect(peaks[2]).toBeLessThan(0);
  });

  it('scores a catch in the ring in full, and shows off before moving on', () => {
    const state = ready('pizza', 'dough-toss');
    const s = dough(state);
    for (const go of s.goes) {
      swipeUp(state);
      tick(state, go.time);
      expect(doughY(s)).toBeCloseTo(CATCH_Y);
      press(state, 400, 300);
      release(state);
      tick(state, DOUGH_REST);
    }
    expect(s.results).toEqual([1, 1, 1]);
    expect(state.stepIndex).toBe(1);
    tick(state, DOUGH_FINALE);
    expect(state.stepIndex).toBe(2);
    expect(state.scores[1]).toBe(100);
  });

  it('never fails: a missed catch bounces onto the board and the next toss is ready', () => {
    const state = ready('pizza', 'dough-toss');
    const s = dough(state);
    swipeUp(state);
    for (let i = 0; i < 60 && s.results.length === 0; i++) tick(state, 0.05);
    expect(s.results).toEqual([DROP_SHARE]);
    expect(s.caught).toEqual([false]);
    expect(state.feedback?.grade).toBe('Good!');
    tick(state, DOUGH_REST);
    expect(s.phase).toBe('ready');
  });

  it('solves to full marks, for tests', () => {
    const state = ready('pizza', 'dough-toss');
    solveDough(currentTurn(state) as never);
    tick(state, 0.1);
    solveDough(currentTurn(state) as never);
    tick(state, 0.1);
    solveDough(currentTurn(state) as never);
    tick(state, DOUGH_FINALE);
    expect(state.scores[1]).toBe(100);
  });

  it('cooks and draws to the end in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = createState(dishById('pizza'), seeded(3));
      const memory = new Map();
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      expect(state.phase).toBe('over');
    }
  });
});
