import type { G } from '../art';
import type { Effects, KitchenState, Pointer, StepRun } from '../kit';
import type { Shape } from '../layout';

/**
 * Kitchen surprises ("chaos events"): short, silly moments in the middle of
 * cooking. The lights go out, a cat hops on the counter, the pot bubbles
 * over. They're fun, never punishing: no points are lost, the step waits
 * while one is on (no timer runs, no meter fills), the step's own state is
 * never touched, and finishing one adds a little bonus.
 *
 * Each surprise is its own file in chaos/, its default export a `Chaos`, found
 * by chaos/index.ts. This file has the shared shapes and plain rules, so
 * events and tests can import it without the registry.
 */

/** What finishing a surprise adds to the round's bonus. Once per surprise. */
export const CHAOS_BONUS = 5;

/** How likely a round is to have a surprise (never the session's first round). */
export const CHAOS_CHANCE = 1 / 3;

/**
 * Seconds of cooking (the step taking input, nobody holding on) before the
 * surprise starts: enough for the step's instruction to have been read out.
 */
export const CHAOS_WAIT: [number, number] = [2, 3.5];

/** A surprise in the round: which one, where, and how it's going. */
export interface ChaosRun {
  /** The event's file name in chaos/, such as 'cat'. */
  id: string;
  /** The earliest step it may happen on; a later one it fits if that one ends first. */
  from: number;
  /** Seconds of cooking left before it starts. */
  wait: number;
  /** Waiting to start, on, or finished (or never happened). */
  phase: 'waiting' | 'on' | 'over';
  /** The step it happened on, once it has started. */
  step: number;
  /** The event's own state, made by its `start` when it starts. */
  state: unknown;
  /** Seconds since it started. */
  age: number;
  /** Bonus points it added: 0, or CHAOS_BONUS once finished. */
  paid: number;
  /** Whether a finger is down on the cooking, so it never starts mid-hold. */
  down: boolean;
  /** Rolls the event's own randomness when it starts, so tests repeat. */
  seed: number;
}

declare module '../kit/types' {
  interface KitchenState {
    /** The round's kitchen surprise, if it has one (see chaos/). */
    chaos?: ChaosRun | null;
  }
}

/** What an event's rules get: the round, and its own state. */
export interface ChaosTurn<S = unknown> {
  round: KitchenState;
  state: S;
  /** The canvas's shape, for places that move on a phone ('page' if left out). */
  shape?: Shape;
}

/** What an event's drawing gets, each frame, in scene units. */
export interface ChaosView<S = unknown> extends ChaosTurn<S> {
  g: G;
  /** Seconds since the kitchen opened, for wobbling and bobbing. */
  t: number;
  dt: number;
  pointer: Pointer;
  shape: Shape;
  /** The whole canvas in scene units, for something that covers it all. */
  screen: { x: number; y: number; w: number; h: number };
  effects: Effects;
  /** Seconds since the event started. */
  age: number;
}

/**
 * A kitchen surprise. Its rules (`start`, `update`, `press`, `move`, `done`)
 * are plain functions; `draw` and `observe` only run in the browser.
 */
export interface Chaos<S = unknown, F = unknown> {
  /** Matches the file name: chaos/cat.ts has the id 'cat'. */
  id: string;
  /** For people: "Counter cat". */
  name: string;
  /** Whether it can happen during this cooking step (one with a pot, say). */
  fits(run: StepRun): boolean;
  /**
   * Whether cooking waits while it's on: taps go to the surprise and the
   * step's timers and meters stop. A surprise that doesn't (the flashlight)
   * lets her keep cooking, and ends when its step does.
   */
  interrupts: boolean;
  /** Its state as it starts, during `run`. Roll anything random with `random`. */
  start(run: StepRun, random: () => number): S;
  update(turn: ChaosTurn<S>, dt: number): void;
  /** A tap or the start of a drag, at a scene point (an interrupting surprise gets every one). */
  press?(turn: ChaosTurn<S>, x: number, y: number): void;
  /** The pointer moving, held or not. */
  move?(turn: ChaosTurn<S>, x: number, y: number): void;
  /** Whether it's finished. */
  done(state: S): boolean;
  /** What Chef Bunny says as it starts, and when it's done. */
  says: { start: string; end: string };
  /** Chef Bunny's two lines while it's on, instead of the step's hint. */
  bubble(state: S): [string, string];
  /** Fresh memory for effects. */
  fx?(): F;
  /** Each frame while it's on: sounds and sparkles on changes. */
  observe?(view: ChaosView<S>, fx: F): void;
  /** Draws it over the cooking. */
  draw(view: ChaosView<S>, fx: F): void;
  /**
   * For tilting the cooking itself (a wobbly table): an angle in radians
   * round (x, y), or null.
   */
  tilt?(state: S, t: number): { angle: number; x: number; y: number } | null;
  /** For tests: does what a cook would do to finish it. */
  solve(turn: ChaosTurn<S>): void;
}

/** A seeded random from `seed`, like test-kit's, so a surprise rolls the same each time. */
export function seededRandom(seed: number): () => number {
  let s = Math.max(1, Math.floor(seed) % 2147483646);
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Whether a step of the round is a learning step, given how to look it up. */
export type IsLearning = (run: StepRun) => boolean;

/**
 * Plans a round's surprise, or null. Never in the session's first round
 * (`round` is how many rounds came before this one), never with surprises
 * turned off, and in about CHAOS_CHANCE of the rest. It picks one of the
 * `events` that fits one of the round's cooking steps after the first, and
 * the first such step to try it on. Learning steps never get one.
 */
export function planChaos(
  steps: readonly StepRun[],
  events: readonly Chaos[],
  random: () => number,
  { round, on, learning }: { round: number; on: boolean; learning: IsLearning },
): ChaosRun | null {
  if (!on || round < 1) return null;
  if (random() >= CHAOS_CHANCE) return null;
  const cooking = steps.flatMap((run, i) => (i > 0 && !learning(run) ? [i] : []));
  const fitting = events.filter((event) => cooking.some((i) => event.fits(steps[i])));
  if (!fitting.length) return null;
  const event = fitting[Math.floor(random() * fitting.length) % fitting.length];
  const places = cooking.filter((i) => event.fits(steps[i]));
  const from = places[Math.floor(random() * places.length) % places.length];
  const [low, high] = CHAOS_WAIT;
  return {
    id: event.id,
    from,
    wait: low + random() * (high - low),
    phase: 'waiting',
    step: -1,
    state: null,
    age: 0,
    paid: 0,
    down: false,
    seed: 1 + Math.floor(random() * 2147483000),
  };
}

/** The round's surprise while it's on, or null. */
export function activeChaos(round: KitchenState): ChaosRun | null {
  const run = round.chaos;
  return run && run.phase === 'on' ? run : null;
}

/** Ends a surprise that's on, adding its bonus once. */
export function finishChaos(round: KitchenState, run: ChaosRun): void {
  if (run.phase !== 'on') return;
  run.phase = 'over';
  if (run.paid === 0) {
    run.paid = CHAOS_BONUS;
    round.bonus += CHAOS_BONUS;
  }
}

/**
 * Advances the round's surprise by `dt` seconds, given the event it is and
 * whether the step being cooked is a learning step. Waiting, it counts down
 * only while a cooking step it fits is taking input, then starts as soon as
 * nobody's holding on. On, it runs, and ends (with its bonus) when it's done, or, for
 * one that doesn't interrupt, when its step ends. Returns whether cooking
 * waits this frame: an interrupting surprise is on.
 */
export function tickChaos(
  round: KitchenState,
  event: Chaos | null,
  dt: number,
  learning: IsLearning,
): boolean {
  const run = round.chaos;
  if (!run || !event || run.phase === 'over') return false;
  if (run.phase === 'waiting') {
    if (round.phase !== 'playing') {
      run.phase = 'over';
      return false;
    }
    const step = round.steps[round.stepIndex];
    const fits = round.stepIndex >= run.from && !learning(step) && event.fits(step);
    if (!fits || round.banner > 0) return false;
    run.wait -= dt;
    // Never in the middle of a hold or a drag: it starts once she lets go.
    if (run.wait > 0 || run.down) return false;
    run.phase = 'on';
    run.step = round.stepIndex;
    run.age = 0;
    run.state = event.start(step, seededRandom(run.seed));
    return event.interrupts;
  }
  // On.
  settleChaos(round, event);
  if (run.phase !== 'on') return false;
  run.age += dt;
  event.update({ round, state: run.state }, dt);
  if (event.done(run.state)) {
    finishChaos(round, run);
    return false;
  }
  return event.interrupts;
}

/**
 * A surprise that lets cooking go on ends when its step does (or the round),
 * with its bonus, so it never carries into a learning moment or decorating.
 */
export function settleChaos(round: KitchenState, event: Chaos | null): void {
  const run = round.chaos;
  if (!run || !event || run.phase !== 'on' || event.interrupts) return;
  if (round.phase !== 'playing' || round.stepIndex !== run.step) finishChaos(round, run);
}

/**
 * A press on the cooking at (x, y). Returns whether the surprise took it
 * (an interrupting one takes every press), so the step never sees it.
 */
export function pressChaos(
  round: KitchenState,
  event: Chaos | null,
  x: number,
  y: number,
  shape?: Shape,
): boolean {
  const run = round.chaos;
  if (!run) return false;
  run.down = true;
  if (!event || run.phase !== 'on' || !event.interrupts) return false;
  event.press?.({ round, state: run.state, shape }, x, y);
  if (event.done(run.state)) finishChaos(round, run);
  return true;
}

/**
 * The pointer moving to (x, y), held or not. Returns whether an
 * interrupting surprise took it.
 */
export function moveChaos(
  round: KitchenState,
  event: Chaos | null,
  x: number,
  y: number,
  shape?: Shape,
): boolean {
  const run = round.chaos;
  if (!run || !event || run.phase !== 'on') return false;
  event.move?.({ round, state: run.state, shape }, x, y);
  return event.interrupts;
}

/** Letting go. Returns whether an interrupting surprise is on, so the step never sees it. */
export function releaseChaos(round: KitchenState, event: Chaos | null): boolean {
  const run = round.chaos;
  if (!run) return false;
  run.down = false;
  return !!event && run.phase === 'on' && event.interrupts;
}
