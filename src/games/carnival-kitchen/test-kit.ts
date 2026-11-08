import type { G } from './art';
import { layoutFor, type Shape } from './layout';
import { dishById } from './dishes';
import { createState, move, press, release, tick } from './game';
import {
  BANNER_TIME,
  CIRCLE,
  POUR_SPEED,
  currentRun,
  currentTurn,
  type Dish,
  type Effects,
  type HoldState,
  type KitchenState,
  type StepRun,
  type StepView,
  type Box,
} from './kit';
import type { Reading, Sound } from './sound';
import { stepOf } from './steps';

/**
 * Helpers for the kitchen's tests: a seeded random, a round ready to play
 * on a given step, and a pretend canvas so drawing runs without a browser.
 */

/** A seeded random, so a test's round is the same every run. */
export function seeded(seed = 1): () => number {
  let s = seed;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  // Small seeds start with tiny numbers, so skip a few first.
  for (let i = 0; i < 5; i++) next();
  return next;
}

/**
 * A round of `dish` (a Dish or its id), its card gone, on the first step of
 * `kind` (or the first step).
 */
export function ready(dish: Dish | string, kind?: string, seed = 1): KitchenState {
  const state = createState(typeof dish === 'string' ? dishById(dish) : dish, seeded(seed));
  if (kind) {
    state.stepIndex = state.steps.findIndex((run) => run.kind === kind);
    if (state.stepIndex < 0) throw new Error(`No ${kind} step in ${state.dish.id}`);
  }
  tick(state, BANNER_TIME);
  return state;
}

/** The state of the step being cooked, typed as that step's state. */
export function current<S>(state: KitchenState): S {
  return currentRun(state).state as S;
}

/** Finishes the step's card, so the next step takes input. */
export function nextStep(state: KitchenState): void {
  tick(state, BANNER_TIME);
}

/**
 * Drags the spoon round the circle in small steps, `turns` times. The last
 * step goes a hair past, so rounding never leaves it just short.
 */
export function circleTurnsOf(state: KitchenState, turns: number, radius = 80): void {
  const steps = turns * 36;
  for (let i = 0; i <= steps; i++) {
    const a = (i / 36) * Math.PI * 2 + (i === steps ? 0.001 : 0);
    move(state, CIRCLE.x + Math.cos(a) * radius, CIRCLE.y + Math.sin(a) * radius);
  }
}

/** Holds and lets go exactly at each star of a hold-meter step (salt, flour and milk). */
export function pourPerfectly(state: KitchenState): void {
  for (const target of current<HoldState>(state).targets) {
    press(state, 0, 0);
    tick(state, target / POUR_SPEED);
    release(state);
  }
}

/**
 * Plays any round to the end without knowing its steps: taps and holds of
 * different lengths, and circles while holding. Calls `each` after every
 * press, every frame of a hold, and every let-go.
 */
export function playThrough(state: KitchenState, each: (dt: number) => void = () => {}) {
  for (let go = 0; state.phase === 'playing' && go < 3000; go++) {
    if (state.banner > 0) {
      tick(state, state.banner);
      each(1 / 60);
      continue;
    }
    // A learning step (a question, a ticket): answer it as someone who knows.
    const step = stepOf(currentRun(state).kind);
    if (step.learning && step.solve) {
      tick(state, 0.5);
      each(0.5);
      step.solve(currentTurn(state));
      each(1 / 60);
      continue;
    }
    press(state, 480, 275);
    each(1 / 60);
    circleTurnsOf(state, 1);
    for (let frame = 0; frame <= go % 20; frame++) {
      tick(state, 0.05);
      each(0.05);
    }
    release(state);
    each(1 / 60);
  }
}

/**
 * A pretend canvas: every method does nothing, but throws if it's given a
 * number that isn't finite (NaN or Infinity), which would draw nothing in a
 * browser. Setting a property to one throws too.
 */
export function fakeCanvas(): G {
  const gradient = { addColorStop: check('addColorStop') };
  function check(name: string) {
    return (...args: unknown[]) => {
      for (const arg of args) {
        if (typeof arg === 'number' && !Number.isFinite(arg)) {
          throw new Error(`${name} was given ${arg}`);
        }
      }
      if (name === 'createLinearGradient' || name === 'createRadialGradient') return gradient;
      if (name === 'measureText') return { width: 10 };
      return undefined;
    };
  }
  return new Proxy({} as G, {
    get: (_target, prop) => check(String(prop)),
    set: (_target, prop, value) => {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new Error(`${String(prop)} was set to ${value}`);
      }
      return true;
    },
  });
}

/** Words read out by `quiet`: done straight away. */
const READ: Reading = { count: 0, word: () => -1, done: () => true };

/** Sounds that do nothing. */
export const quiet = new Proxy({} as Sound, {
  get: (_target, prop) =>
    prop === 'muted' ? false : prop === 'read' ? () => READ : () => undefined,
});

/** Effects that do nothing, counting what was asked for. */
export function quietEffects(): Effects & { counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  const count = (name: string) => () => {
    counts[name] = (counts[name] ?? 0) + 1;
  };
  return {
    counts,
    sound: quiet,
    celebrate: count('celebrate'),
    burst: count('burst'),
    add: count('add'),
    calm: count('calm'),
  };
}

/**
 * Observes and draws every step of the round that has started, as the
 * renderer would, on a pretend canvas. `memory` keeps each step's effect
 * memory between calls.
 */
export function drawRound(
  state: KitchenState,
  memory = new Map<StepRun, unknown>(),
  dt = 1 / 60,
  shape: 'page' | 'wide' | 'tall' = 'page',
): void {
  const g = fakeCanvas();
  const effects = quietEffects();
  const view = (run: StepRun): StepView => {
    if (!memory.has(run)) memory.set(run, stepOf(run.kind).fx?.());
    return {
      round: state,
      options: run.options,
      state: run.state,
      g,
      t: 1.5,
      dt,
      pointer: { x: CIRCLE.x + 60, y: CIRCLE.y, down: true },
      taking: state.phase === 'playing' && state.banner === 0,
      shape,
      fx: memory.get(run),
      fxOf: <T>(other: StepRun) => memory.get(other) as T | undefined,
      effects,
    };
  };
  for (let i = 0; i <= state.stepIndex; i++) {
    const run = state.steps[i];
    stepOf(run.kind).observe?.(view(run));
  }
  const run = currentRun(state);
  stepOf(run.kind).draw(view(run));
}

// ---------------------------------------------------------------------------
// Sizes on a phone, for steps with big buttons

/** CSS pixels per scene unit on a 390×844 phone (upright) or 844×390 (sideways). */
export function cssScale(shape: Shape): number {
  if (shape === 'page') return 1;
  const [w, h] = shape === 'tall' ? [390, 844] : [844, 390];
  const layout = layoutFor(w, h, true);
  if (layout.shape !== shape) throw new Error(`${w}×${h} is ${layout.shape}, not ${shape}`);
  return Math.min(w / layout.width, h / layout.height);
}

/** Whether two boxes overlap. */
export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * What must stay clear on each shape, in scene units: Chef Bunny, the HUD
 * and the progress pill at the bottom, for a step with `stars` stars.
 */
export function keepClear(shape: Shape, stars = 1): Box[] {
  const pill = { x: 400 - stars * 15 - 14, y: 466, w: stars * 30 + 28, h: 34 };
  if (shape === 'tall') {
    return [
      { x: -100, y: 0, w: 210, h: 1000 }, // off the left of the screen
      { x: 690, y: 0, w: 300, h: 1000 }, // off the right
      { x: 0, y: -200, w: 800, h: 300 }, // recipe and streak at the top
      { x: 0, y: 546, w: 800, h: 400 }, // Chef Bunny and her bubble
      pill,
    ];
  }
  return [
    { x: 0, y: 230, w: 210, h: 270 }, // Chef Bunny and her bubble
    { x: 0, y: 0, w: 125, h: 105 }, // sound and home buttons
    { x: 200, y: 50, w: 400, h: 60 }, // the recipe along the top
    { x: 630, y: 55, w: 155, h: 90 }, // score and streak
    { x: 800, y: 0, w: 200, h: 500 }, // off the scene
    pill,
  ];
}
