import type { Grade, KitchenState, StepBasics, StepRun, Turn } from './types';

/**
 * The rules every step shares: scoring an action, the combo, the popup, and
 * moving on to the next step. Plain functions, no canvas.
 */

/** Each step is worth up to this many points, before combo bonuses. */
export const STEP_POINTS = 100;

/**
 * Seconds the "Chop the carrot!" card shows before a step takes input.
 * Long enough for the instruction to be read out loud.
 */
export const BANNER_TIME = 2.6;
/**
 * Seconds a step's card stays up in "Read it myself" mode: long enough to
 * read it. A tap on the card after CARD_SKIP_AFTER moves on sooner.
 */
export const READ_BANNER_TIME = 6;
export const CARD_SKIP_AFTER = 0.8;

/** How long this round's step cards stay up. */
export function bannerTime(round: KitchenState): number {
  return round.learn.settings.readMyself ? READ_BANNER_TIME : BANNER_TIME;
}

/** Seconds a "Perfect!" style popup stays on screen. */
export const FEEDBACK_TIME = 1.1;

/** An action this good or better (as a share of its points) is perfect. */
export const PERFECT = 0.9;
/** Bonus for each perfect action after the first in an unbroken streak. */
export const COMBO_BONUS = 5;

/** The popup for an action that earned `share` of its points (0 to 1). */
export function gradeFor(share: number): Grade {
  if (share >= PERFECT) return 'Perfect!';
  if (share >= 0.6) return 'Great!';
  if (share > 0) return 'Good!';
  return 'Nice try!';
}

/** 1 up to `perfect` away, falling to 0 at `miss` away. */
export function accuracy(distance: number, perfect: number, miss: number): number {
  if (distance <= perfect) return 1;
  if (distance >= miss) return 0;
  return 1 - (distance - perfect) / (miss - perfect);
}

/**
 * Scores one action worth `worth` points that earned `share` of them (0 to
 * 1): updates the combo and shows the popup. Returns the points.
 */
export function scoreAction(round: KitchenState, share: number, worth: number): number {
  const points = share * worth;
  if (share >= PERFECT) {
    round.combo += 1;
    if (round.combo > 1) round.bonus += COMBO_BONUS;
  } else {
    round.combo = 0;
  }
  round.feedback = { grade: gradeFor(share), points, combo: round.combo, age: 0 };
  return points;
}

/**
 * Shows the popup for points out of a whole step, without touching the
 * combo. For steps with no single moment to judge, such as circles.
 */
export function showGrade(round: KitchenState, points: number): void {
  round.feedback = {
    grade: gradeFor(points / STEP_POINTS),
    points,
    combo: round.combo,
    age: 0,
  };
}

/**
 * Ends the step being cooked with `points` (kept between 0 and 100), and
 * moves on to the next step's card, or to the end of the round.
 */
export function finishStep(round: KitchenState, points: number): void {
  round.scores[round.stepIndex] = Math.round(Math.min(STEP_POINTS, Math.max(0, points)));
  round.stepIndex += 1;
  if (round.stepIndex < round.steps.length) {
    round.banner = bannerTime(round);
  } else {
    round.stepIndex = round.steps.length - 1;
    round.phase = 'over';
  }
}

/** The step being cooked. */
export function currentRun(round: KitchenState): StepRun {
  return round.steps[round.stepIndex];
}

/** The step being cooked, with the round, as its rules get it. */
export function currentTurn(round: KitchenState): Turn {
  const run = currentRun(round);
  return { round, options: run.options, state: run.state };
}

/**
 * The latest step of this kind cooked so far (the one being cooked
 * included), or undefined. For art that shows an earlier step's work, such
 * as the toppings in the oven; a later repeat of the kind doesn't count.
 * Type it with the step's exported options and state types.
 */
export function findStep<S = unknown, O extends StepBasics = StepBasics>(
  round: KitchenState,
  kind: string,
): StepRun<O, S> | undefined {
  for (let i = Math.min(round.stepIndex, round.steps.length - 1); i >= 0; i--) {
    if (round.steps[i].kind === kind) return round.steps[i] as StepRun<O, S>;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Random rolls and movement

/** A random number between `low` and `high`. */
export function between(random: () => number, low: number, high: number): number {
  return low + random() * (high - low);
}

/** A whole number from `low` to `high`, both included. */
export function wholeBetween(random: () => number, low: number, high: number): number {
  const count = high - low + 1;
  return low + (Math.floor(random() * count) % count);
}

/** One of `items`, at random. */
export function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length) % items.length];
}

/** A shuffled copy. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Moves `value` by `delta` in direction `dir`, bouncing off `min` and `max`. */
export function bounce(value: number, dir: 1 | -1, delta: number, min: number, max: number) {
  let next = value + dir * delta;
  let nextDir = dir;
  if (next > max) {
    next = max - (next - max);
    nextDir = -1;
  } else if (next < min) {
    next = min + (min - next);
    nextDir = 1;
  }
  return { value: Math.min(max, Math.max(min, next)), dir: nextDir };
}

/** "a", "a and b", "a, b and c". */
export function listOf(words: readonly string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
