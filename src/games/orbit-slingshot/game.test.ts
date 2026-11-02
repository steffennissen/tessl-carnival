import { describe, expect, it } from 'vitest';
import {
  BALL_RADIUS,
  BOUNDS_MARGIN,
  FIRST_SHOT_BONUS,
  FLIGHT_LIMIT,
  GRAZE_BONUS,
  GRAZE_RANGE,
  LEVEL_POINTS,
  MAX_PULL,
  MAX_SPEED,
  MIN_AIM_OFFSET,
  MIN_PULL,
  RESULT_TIME,
  START_BALLS,
  STEP,
  aimOffset,
  createLevel,
  createState,
  goalRadiusFor,
  launch,
  launchVelocity,
  physicsSteps,
  planetCountFor,
  predictPath,
  scoreForClear,
  simulate,
  step,
  straightShot,
  type Level,
  type OrbitSlingshotState,
} from './game';

const SEEDS = Array.from({ length: 100 }, (_, i) => (i + 1) * 7919);
const LEVELS = [1, 2, 4, 8, 12, 20];

/** A level with no planets and the goal straight to the right of the start. */
function openLevel(overrides: Partial<Level> = {}): Level {
  return {
    start: { x: 70, y: 250 },
    goal: { x: 700, y: 250, radius: 30 },
    planets: [],
    proof: { x: MAX_SPEED, y: 0 },
    ...overrides,
  };
}

function stateWith(level: Level): OrbitSlingshotState {
  return { ...createState(1), level };
}

/** Steps until the shot ends, in frames of `dt`, and returns how many frames it took. */
function flyOut(state: OrbitSlingshotState, dt = 1 / 60): number {
  let frames = 0;
  while (state.phase === 'flying') {
    step(state, dt);
    frames += 1;
  }
  return frames;
}

function waitOutResult(state: OrbitSlingshotState) {
  for (let t = 0; t <= RESULT_TIME + 0.1; t += 0.05) step(state, 0.05);
}

describe('launching', () => {
  it('flies opposite the pull', () => {
    const velocity = launchVelocity(-100, 50);
    expect(velocity.x).toBeGreaterThan(0);
    expect(velocity.y).toBeLessThan(0);
    expect(velocity.y / velocity.x).toBeCloseTo(-0.5);
  });

  it('scales speed with the pull and caps it at a full pull', () => {
    expect(Math.hypot(...Object.values(launchVelocity(MAX_PULL / 2, 0)))).toBeCloseTo(
      MAX_SPEED / 2,
    );
    expect(Math.hypot(...Object.values(launchVelocity(MAX_PULL, 0)))).toBeCloseTo(MAX_SPEED);
    expect(Math.hypot(...Object.values(launchVelocity(MAX_PULL * 3, 0)))).toBeCloseTo(MAX_SPEED);
  });

  it('cancels a pull shorter than MIN_PULL and changes nothing', () => {
    const state = createState(5);
    const before = structuredClone(state);
    expect(launch(state, -(MIN_PULL - 1), 0)).toBe(false);
    expect(state).toEqual(before);
  });

  it('blocks another launch while a ball is in flight', () => {
    const state = createState(5);
    expect(launch(state, -100, 0)).toBe(true);
    expect(state.phase).toBe('flying');
    const ball = { ...state.ball! };
    expect(launch(state, 0, 100)).toBe(false);
    expect(state.ball).toEqual(ball);
    expect(state.shots).toBe(1);
  });
});

describe('flight', () => {
  it('flies straight with no planets', () => {
    const path = predictPath(openLevel(), { x: 300, y: -200 });
    for (const point of path) {
      expect((point.y - 250) / (point.x - 70)).toBeCloseTo(-200 / 300);
    }
  });

  it('bends towards a planet', () => {
    const level = openLevel({ planets: [{ x: 400, y: 150, radius: 30 }] });
    const path = predictPath(level, { x: 400, y: 0 });
    expect(path.at(-1)!.y).toBeLessThan(250 - 1);
  });

  it('pulls harder from a nearer planet', () => {
    const near = predictPath(openLevel({ planets: [{ x: 70, y: 150, radius: 30 }] }), {
      x: 1,
      y: 0,
    });
    const far = predictPath(openLevel({ planets: [{ x: 70, y: 50, radius: 30 }] }), {
      x: 1,
      y: 0,
    });
    expect(250 - near[0].y).toBeGreaterThan(250 - far[0].y);
  });

  it('loses the ball when it crashes into a planet', () => {
    const level = openLevel({ planets: [{ x: 300, y: 250, radius: 30 }] });
    expect(simulate(level, { x: MAX_SPEED, y: 0 })).toBe('crash');
  });

  it('crashes once the ball touches the surface', () => {
    const path = predictPath(openLevel({ planets: [{ x: 300, y: 250, radius: 30 }] }), {
      x: MAX_SPEED,
      y: 0,
    });
    expect(300 - path.at(-1)!.x - 30).toBeLessThanOrEqual(BALL_RADIUS);
  });

  it('loses the ball when it leaves the bounds', () => {
    const state = stateWith(openLevel());
    launch(state, MAX_PULL, 0);
    flyOut(state);
    expect(state.lastResult?.outcome).toBe('lost');
    expect(state.lastResult!.x).toBeLessThan(-BOUNDS_MARGIN);
    expect(state.balls).toBe(START_BALLS - 1);
  });

  it('loses a ball still flying at FLIGHT_LIMIT', () => {
    const before = physicsSteps();
    expect(simulate(openLevel(), { x: 0, y: 0 })).toBe('lost');
    expect((physicsSteps() - before) * STEP).toBeCloseTo(FLIGHT_LIMIT);
  });
});

describe('preview', () => {
  it('matches the same steps of a real flight', () => {
    const level = createLevel(42, 6);
    const state = stateWith(level);
    const pull = { x: -110, y: 40 };
    const path = predictPath(level, launchVelocity(pull.x, pull.y));
    launch(state, pull.x, pull.y);
    while (state.phase === 'flying' && state.trail.length < path.length) step(state, 1 / 60);
    const flown = state.trail.slice(0, path.length);
    expect(flown).toEqual(path.slice(0, flown.length));
    expect(flown.length).toBeGreaterThan(0);
  });
});

describe('frame rate', () => {
  it('ends one shot in the same place at 60 Hz and 144 Hz', () => {
    const level = createLevel(7, 5);
    const at60 = stateWith(level);
    const at144 = stateWith(level);
    launch(at60, level.proof.x * -0.2, level.proof.y * -0.2);
    launch(at144, level.proof.x * -0.2, level.proof.y * -0.2);
    flyOut(at60, 1 / 60);
    flyOut(at144, 1 / 144);
    expect(at60.lastResult?.outcome).toBe(at144.lastResult?.outcome);
    expect(Math.abs(at60.trail.length - at144.trail.length)).toBeLessThanOrEqual(1);
    const reach = MAX_SPEED * 2 * STEP;
    expect(Math.abs(at60.lastResult!.x - at144.lastResult!.x)).toBeLessThanOrEqual(reach);
    expect(Math.abs(at60.lastResult!.y - at144.lastResult!.y)).toBeLessThanOrEqual(reach);
  });
});

describe('scoring', () => {
  it('multiplies the level points by the level number', () => {
    expect(scoreForClear(1, 2, 0)).toBe(LEVEL_POINTS);
    expect(scoreForClear(7, 2, 0)).toBe(7 * LEVEL_POINTS);
  });

  it('adds the first shot bonus only on the first shot', () => {
    expect(scoreForClear(3, 1, 0)).toBe(3 * LEVEL_POINTS + FIRST_SHOT_BONUS);
    expect(scoreForClear(3, 2, 0)).toBe(3 * LEVEL_POINTS);
  });

  it('adds the graze bonus per planet', () => {
    expect(scoreForClear(2, 3, 2)).toBe(2 * LEVEL_POINTS + 2 * GRAZE_BONUS);
  });

  it('counts a graze once per planet, even when the ball stays close', () => {
    // Two planets, one either side of the ball's path, pull equally and cancel
    // out, so the ball stays in graze range of both for many steps.
    const gap = 30 + GRAZE_RANGE - 4;
    const planets = [
      { x: 380, y: 250 - gap, radius: 30 },
      { x: 380, y: 250 + gap, radius: 30 },
    ];
    const state = stateWith(openLevel({ planets }));
    launch(state, -MAX_PULL, 0);
    flyOut(state);
    expect(state.lastResult?.outcome).toBe('goal');
    expect(state.score).toBe(LEVEL_POINTS + FIRST_SHOT_BONUS + 2 * GRAZE_BONUS);
  });

  it('earns nothing on a miss, even after a graze', () => {
    const state = stateWith(openLevel({ planets: [{ x: 380, y: 250, radius: 30 }] }));
    launch(state, -MAX_PULL, 0);
    flyOut(state);
    expect(state.lastResult?.outcome).toBe('crash');
    expect(state.ball?.grazed).toEqual([0]);
    expect(state.lastResult?.points).toBe(0);
    expect(state.score).toBe(0);
  });
});

describe('rounds', () => {
  it('starts with every ball at level 1, ready to aim', () => {
    const state = createState(3);
    expect(state.balls).toBe(START_BALLS);
    expect(state.levelNumber).toBe(1);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('aiming');
  });

  it('moves on after a clear and keeps every ball', () => {
    const state = stateWith(openLevel());
    launch(state, -MAX_PULL, 0);
    flyOut(state);
    expect(state.phase).toBe('result');
    waitOutResult(state);
    expect(state.phase).toBe('aiming');
    expect(state.levelNumber).toBe(2);
    expect(state.balls).toBe(START_BALLS);
    expect(state.level).toEqual(createLevel(state.seed, 2));
  });

  it('retries the same level after a miss, takes one ball and loses the first shot bonus', () => {
    const level = openLevel();
    const state = stateWith(level);
    launch(state, MAX_PULL, 0);
    flyOut(state);
    waitOutResult(state);
    expect(state.phase).toBe('aiming');
    expect(state.levelNumber).toBe(1);
    expect(state.level).toBe(level);
    expect(state.balls).toBe(START_BALLS - 1);

    launch(state, -MAX_PULL, 0);
    flyOut(state);
    expect(state.score).toBe(LEVEL_POINTS);
  });

  it('ends the round with the last ball', () => {
    const state = stateWith(openLevel());
    state.balls = 1;
    launch(state, MAX_PULL, 0);
    flyOut(state);
    expect(state.phase).toBe('over');
    expect(state.balls).toBe(0);
    expect(launch(state, -MAX_PULL, 0)).toBe(false);
  });
});

describe('levels', () => {
  it('follows the planet count and goal radius formulas', () => {
    expect([1, 2, 3, 4, 8, 20].map(planetCountFor)).toEqual([1, 2, 2, 3, 5, 5]);
    expect([1, 5, 9, 20].map(goalRadiusFor)).toEqual([34, 26, 18, 18]);
  });

  it('is deterministic: same seed and level, same level', () => {
    expect(createLevel(1234, 6)).toEqual(createLevel(1234, 6));
    expect(createLevel(1234, 6)).not.toEqual(createLevel(1235, 6));
  });

  it('is always winnable, with at least one planet', () => {
    for (const levelNumber of LEVELS) {
      for (const seed of SEEDS) {
        const level = createLevel(seed, levelNumber);
        expect(level.planets.length).toBeGreaterThan(0);
        expect(simulate(level, level.proof)).toBe('goal');
      }
    }
  });

  it('makes the player aim away from the goal from level 2 on', () => {
    for (const levelNumber of LEVELS.filter((n) => n >= 2)) {
      const bent = SEEDS.filter((seed) => {
        const level = createLevel(seed, levelNumber);
        return (
          aimOffset(level, level.proof) >= MIN_AIM_OFFSET &&
          simulate(level, straightShot(level)) !== 'goal'
        );
      });
      expect(bent.length / SEEDS.length).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('never runs more than 75,000 physics steps to build a level', () => {
    for (const levelNumber of LEVELS) {
      for (const seed of SEEDS) {
        const before = physicsSteps();
        createLevel(seed, levelNumber);
        expect(physicsSteps() - before).toBeLessThanOrEqual(75_000);
      }
    }
  });

  it('falls back to a winnable level with a planet when every attempt fails', () => {
    for (const seed of SEEDS) {
      const level = createLevel(seed, 10, 0);
      expect(level.planets).toHaveLength(1);
      expect(simulate(level, level.proof)).toBe('goal');
    }
  });
});
