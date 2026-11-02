import { describe, expect, it } from 'vitest';
import {
  FIRST_POLE_X,
  GAP,
  GAP_MAX_Y,
  GAP_MIN_Y,
  GROUND_Y,
  HOP_VELOCITY,
  MAX_FALL,
  MAX_GAP_DELTA,
  OBSTACLE_W,
  PLAYER_R,
  PLAYER_X,
  RESTART_LOCKOUT,
  SPACING,
  STEP,
  balloonHop,
  circleHitsRect,
  createState,
  hop,
  nextGapY,
  nextRandom,
  pump,
  step,
  type BalloonHopState,
  type Pole,
} from './game';

function run(state: BalloonHopState, steps: number) {
  for (let i = 0; i < steps; i++) step(state, STEP);
}

/** A started round, one step in, with the hop that started it spent. */
function playing(seed = 1): BalloonHopState {
  const state = createState(seed);
  hop(state);
  step(state, STEP);
  return state;
}

/** The pole the balloon must pass next. */
function nextPole(state: BalloonHopState): Pole {
  return state.poles.find((p) => p.x + OBSTACLE_W + PLAYER_R >= PLAYER_X) ?? state.poles[0];
}

/** Hops whenever the balloon sinks below the middle of the next gap. */
function autopilot(state: BalloonHopState) {
  if (state.vy >= 0 && state.y > nextPole(state).gapY + 12) hop(state);
}

/** Keeps the balloon alive by putting it in the next gap before each step. */
function hover(state: BalloonHopState) {
  const pole = nextPole(state);
  state.y = pole.gapY;
  state.vy = 0;
}

describe('balloon hop', () => {
  it('registers with an id that matches its folder', () => {
    expect(balloonHop.id).toBe('balloon-hop');
  });

  describe('deterministic', () => {
    it('gives the known mulberry32 sequence from seed 1', () => {
      const rng = { seed: 1 };
      expect(nextRandom(rng)).toBe(0.6270739405881613);
      expect(nextRandom(rng)).toBe(0.002735721180215478);
      expect(nextRandom(rng)).toBe(0.5274470399599522);
    });

    it('gives deep-equal state for the same seed and inputs', () => {
      const play = (seed: number) => {
        const state = createState(seed);
        hop(state);
        for (let i = 0; i < 5000; i++) {
          autopilot(state);
          step(state, STEP);
        }
        return state;
      };
      expect(play(42)).toEqual(play(42));
      expect(play(42)).not.toEqual(play(43));
    });

    it('starts with prevY equal to y and an integer seed', () => {
      const state = createState(7);
      expect(state.prevY).toBe(state.y);
      expect(Number.isInteger(state.seed)).toBe(true);
      expect(state.phase).toBe('ready');
      expect(state.poles).toHaveLength(1);
      expect(state.poles[0].x).toBe(FIRST_POLE_X);
    });
  });

  describe('frame rate', () => {
    const stepsFor = (hz: number, seconds: number) => {
      let count = 0;
      let acc = 0;
      for (let i = 0; i < hz * seconds; i++) acc = pump(acc, 1 / hz, () => count++);
      return count;
    };

    it('runs the same number of steps at 60 Hz and 144 Hz, within 1', () => {
      expect(Math.abs(stepsFor(60, 10) - stepsFor(144, 10))).toBeLessThanOrEqual(1);
      expect(Math.abs(stepsFor(60, 10) - 1200)).toBeLessThanOrEqual(1);
    });

    it('runs at most 12 steps for a long frame', () => {
      let count = 0;
      pump(0, 10, () => count++);
      expect(count).toBeLessThanOrEqual(12);
    });

    it('runs no steps for negative elapsed time', () => {
      let count = 0;
      expect(pump(0, -1, () => count++)).toBe(0);
      expect(count).toBe(0);
    });
  });

  describe('hop', () => {
    it('sets the velocity rather than adding to it', () => {
      const state = playing();
      state.vy = 200;
      hop(state);
      step(state, STEP);
      expect(state.vy).toBeCloseTo(HOP_VELOCITY + 900 * STEP);
      state.vy = -400;
      hop(state);
      step(state, STEP);
      expect(state.vy).toBeCloseTo(HOP_VELOCITY + 900 * STEP);
    });

    it('treats two queued hops as one', () => {
      const once = playing();
      const twice = playing();
      hop(once);
      hop(twice);
      hop(twice);
      run(once, 30);
      run(twice, 30);
      expect(twice).toEqual(once);
    });

    it('keeps a hop queued in a frame that runs no steps', () => {
      const state = playing();
      run(state, 30);
      hop(state);
      const acc = pump(0, STEP / 2, () => step(state, STEP));
      expect(state.hopQueued).toBe(true);
      pump(acc, STEP, () => step(state, STEP));
      expect(state.hopQueued).toBe(false);
      expect(state.vy).toBeCloseTo(HOP_VELOCITY + 900 * STEP);
    });
  });

  describe('bounds', () => {
    it('never falls faster than MAX_FALL', () => {
      const state = playing();
      state.poles = [];
      state.poles.push({ x: 10_000, gapY: 200, scored: false });
      let fastest = 0;
      while (state.phase === 'playing') {
        step(state, STEP);
        fastest = Math.max(fastest, state.vy);
      }
      expect(fastest).toBe(MAX_FALL);
    });

    it('clamps at the top of the canvas without ending the round', () => {
      const state = playing();
      state.poles = [{ x: 10_000, gapY: 200, scored: false }];
      for (let i = 0; i < 120; i++) {
        hop(state);
        step(state, STEP);
      }
      expect(state.phase).toBe('playing');
      expect(state.y).toBe(PLAYER_R);
      expect(state.vy).toBe(0);
    });

    it('ends the round on the ground', () => {
      const state = playing();
      state.poles = [{ x: 10_000, gapY: 200, scored: false }];
      state.y = GROUND_Y - PLAYER_R - 1;
      state.vy = MAX_FALL;
      step(state, STEP);
      expect(state.phase).toBe('over');
    });
  });

  describe('scoring', () => {
    it('scores exactly one point per pole, as the pole centre passes the balloon', () => {
      const state = playing();
      let checked = 0;
      while (state.score < 120) {
        hover(state);
        const before = state.score;
        const pole = nextPole(state);
        const centreBefore = pole.x + OBSTACLE_W / 2;
        step(state, STEP);
        expect(state.phase).toBe('playing');
        if (state.score !== before) {
          expect(state.score).toBe(before + 1);
          expect(centreBefore).toBeGreaterThan(PLAYER_X);
          expect(pole.x + OBSTACLE_W / 2).toBeLessThanOrEqual(PLAYER_X);
          checked++;
        }
      }
      expect(checked).toBe(120);
    });

    it('awards no point on the step that collides', () => {
      const state = playing();
      state.poles = [{ x: PLAYER_X - OBSTACLE_W / 2 + 1, gapY: 200, scored: false }];
      state.y = GROUND_Y - PLAYER_R - 0.5;
      state.vy = MAX_FALL;
      step(state, STEP);
      expect(state.phase).toBe('over');
      expect(state.score).toBe(0);
      expect(state.poles[0].scored).toBe(false);
    });
  });

  describe('fair course', () => {
    it.each([1, 2, 3, 99, 2024])('lets an autopilot pass 1000 poles on seed %i', (seed) => {
      const state = createState(seed);
      hop(state);
      let prev = state.poles[0].gapY;
      let lastPole = state.poles[0];
      while (state.score < 1000) {
        autopilot(state);
        step(state, STEP);
        expect(state.phase).toBe('playing');
        const newest = state.poles[state.poles.length - 1];
        if (newest !== lastPole) {
          expect(Math.abs(newest.gapY - prev)).toBeLessThanOrEqual(MAX_GAP_DELTA);
          expect(newest.gapY).toBeGreaterThanOrEqual(GAP_MIN_Y);
          expect(newest.gapY).toBeLessThanOrEqual(GAP_MAX_Y);
          expect(newest.x - lastPole.x).toBeCloseTo(SPACING);
          prev = newest.gapY;
          lastPole = newest;
        }
      }
    });

    it('keeps gap centres in range and close to the last one', () => {
      const rng = { seed: 5 };
      for (const start of [GAP_MIN_Y, GAP_MAX_Y, 220]) {
        let prev = start;
        for (let i = 0; i < 2000; i++) {
          const next = nextGapY(rng, prev);
          expect(Math.abs(next - prev)).toBeLessThanOrEqual(MAX_GAP_DELTA);
          expect(next).toBeGreaterThanOrEqual(115);
          expect(next).toBeLessThanOrEqual(325);
          prev = next;
        }
      }
    });
  });

  describe('collision', () => {
    const rect = { x: 100, y: 100, w: 50, h: 80 };
    it.each([
      ['an edge hit', 95, 140, 10, true],
      ['a near edge miss', 89, 140, 10, false],
      ['a corner miss', 92.5, 92.5, 10, false],
      ['a corner hit', 95, 95, 10, true],
      ['a centre inside', 125, 140, 10, true],
    ])('%s', (_, cx, cy, r, hit) => {
      expect(circleHitsRect(cx, cy, r, rect)).toBe(hit);
    });

    it('cannot fly over a pole', () => {
      const state = playing();
      state.poles = [{ x: PLAYER_X - PLAYER_R + 1, gapY: 200, scored: false }];
      state.y = PLAYER_R;
      state.vy = 0;
      step(state, STEP);
      expect(state.phase).toBe('over');
    });

    it('passes cleanly through the middle of a gap', () => {
      const state = playing();
      state.poles = [{ x: PLAYER_X - OBSTACLE_W / 2, gapY: 200, scored: false }];
      state.y = 200;
      state.vy = 0;
      step(state, STEP);
      expect(state.phase).toBe('playing');
      expect(GAP / 2).toBeGreaterThan(PLAYER_R);
    });
  });

  describe('phases', () => {
    it('moves only the bob while ready', () => {
      const state = createState(3);
      const poles = structuredClone(state.poles);
      const ys = new Set<number>();
      for (let i = 0; i < 240; i++) {
        step(state, STEP);
        ys.add(state.y);
      }
      expect(state.phase).toBe('ready');
      expect(state.poles).toEqual(poles);
      expect(state.score).toBe(0);
      expect(state.groundX).toBe(0);
      expect(ys.size).toBeGreaterThan(1);
    });

    it('starts the round and hops on the first press', () => {
      const state = createState(3);
      expect(hop(state)).toBe('started');
      step(state, STEP);
      expect(state.phase).toBe('playing');
      expect(state.vy).toBeLessThan(0);
    });

    it('freezes poles and score once over, and rests the balloon on the ground', () => {
      const state = playing();
      while (state.phase === 'playing') step(state, STEP);
      const poles = structuredClone(state.poles);
      const score = state.score;
      run(state, 600);
      expect(state.poles).toEqual(poles);
      expect(state.score).toBe(score);
      expect(state.y).toBe(GROUND_Y - PLAYER_R);
    });

    it('ignores presses for RESTART_LOCKOUT, then asks for a new ready round', () => {
      const state = playing();
      while (state.phase === 'playing') step(state, STEP);
      const lockoutSteps = Math.round(RESTART_LOCKOUT / STEP);
      for (let i = 0; i < lockoutSteps - 1; i++) {
        expect(hop(state)).toBe('ignored');
        step(state, STEP);
      }
      expect(hop(state)).toBe('ignored');
      step(state, STEP);
      expect(hop(state)).toBe('restart');
      expect(state.phase).toBe('over');
      const fresh = createState(9);
      expect(fresh.phase).toBe('ready');
      expect(fresh.hopQueued).toBe(false);
    });
  });

  describe('memory', () => {
    it('removes off-screen poles and keeps the array bounded', () => {
      const state = playing();
      let most = 0;
      while (state.score < 200) {
        hover(state);
        step(state, STEP);
        most = Math.max(most, state.poles.length);
        for (const pole of state.poles) expect(pole.x + OBSTACLE_W).toBeGreaterThanOrEqual(0);
      }
      expect(most).toBeLessThanOrEqual(7);
    });
  });
});
