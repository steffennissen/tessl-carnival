import { pick, shuffle } from './rules';
import type { Dish, KitchenState, LearnRound, LearnSettings, Level, RecipeStep } from './types';

/**
 * The rules every learning moment shares: the grown-ups' settings, answering
 * (never a fail), the Smart Chef star, and when questions read themselves out.
 * Plain functions, no canvas.
 *
 * A wrong answer gets a gentle hint and another go. After two wrong tries
 * Chef Bunny shows the answer, and tapping it carries on. Answering right on
 * her own (first or second try) adds SMART_BONUS points; a round whose every
 * question was answered on her own earns the dish's Smart Chef star.
 */

/** The settings before a grown-up changes anything: learning on, Level 1, the voice reads. */
export const DEFAULT_SETTINGS: LearnSettings = { learning: true, level: 1, readMyself: false };

/** Settings for a round with no learning at all (tests, and dishes cooked without it). */
export const NO_LEARNING: LearnSettings = { learning: false, level: 1, readMyself: false };

/** Wrong tries before Chef Bunny shows the answer. */
export const TRIES_BEFORE_HELP = 2;

/** Bonus points for a learning question answered right without help. */
export const SMART_BONUS = 10;

/**
 * Seconds an order ticket waits at Level 2 before reading itself out, so a
 * cook who can read gets the first go.
 */
export const READ_PAUSE = 4;

/** The settings saved as preferences (strings, numbers, booleans), checked. */
export function settingsFrom(saved: Record<string, unknown>): LearnSettings {
  return {
    learning: typeof saved.learning === 'boolean' ? saved.learning : DEFAULT_SETTINGS.learning,
    level: saved.level === 2 ? 2 : 1,
    readMyself:
      typeof saved.readMyself === 'boolean' ? saved.readMyself : DEFAULT_SETTINGS.readMyself,
  };
}

/**
 * When a question or ticket reads itself out loud, in seconds after it
 * appears, or null for never (read it myself: only the speaker button reads).
 * `pause` asks for READ_PAUSE at Level 2, for text she should try first.
 */
export function autoReadDelay(settings: LearnSettings, pause = false): number | null {
  if (settings.readMyself) return null;
  return pause && settings.level === 2 ? READ_PAUSE : 0.3;
}

// ---------------------------------------------------------------------------
// The round's plan

/** A round's recipe with its learning moment woven in, from `planRound` in activities/. */
export interface RoundPlan {
  steps: RecipeStep[];
  activity: string | null;
  settings: LearnSettings;
  /** The kitchen clock at the start, in minutes since midnight; rolled by createState if left out. */
  start?: number;
}

/** What an activity gets to weave itself into a round. */
export interface WeaveContext {
  dish: Dish;
  level: Level;
  /** Roll anything random with this, never Math.random, so tests are repeatable. */
  random: () => number;
  /** The kitchen clock when the round starts (minutes since midnight; see clock.ts). */
  start: number;
}

/**
 * A learning activity: one file in activities/, its default export. The
 * planner picks at most one per round, among those that fit the dish.
 */
export interface Activity {
  /** The file name: activities/ticket.ts has the id 'ticket'. */
  id: string;
  /** For people: "Order tickets". */
  name: string;
  /** What it practises. */
  skills: ('reading' | 'math' | 'time')[];
  /**
   * How often the planner picks it among the activities that fit, compared
   * with the others: 1 if left out, 2 for twice as often.
   */
  weight?: number;
  /** Whether it can be woven into this dish (a predicate on its steps, usually). */
  fits(dish: Dish): boolean;
  /**
   * The round's recipe with the activity woven in: learning steps inserted
   * (an order ticket, a question) and existing steps' options changed (the
   * ticket's toppings on the top step). Return new objects; never change
   * the dish's own steps.
   */
  weave(round: WeaveContext): RecipeStep[];
}

/** The dish's own recipe, with no learning moment. */
export function plainPlan(dish: Dish, settings: LearnSettings = NO_LEARNING): RoundPlan {
  return { steps: dish.steps, activity: null, settings };
}

export function startLearn(plan: RoundPlan): LearnRound {
  return { settings: plan.settings, activity: plan.activity, answers: [] };
}

// ---------------------------------------------------------------------------
// Answering

/** One question's answering so far. Put it in a learning step's state. */
export interface AnswerState {
  /** Wrong tries so far. */
  wrong: number;
  /** Chef Bunny is showing the answer. */
  shown: boolean;
  /** How it went, once answered right. */
  outcome: 'right' | 'helped' | null;
}

export type AnswerResult = 'right' | 'try again' | 'show';

export function startAnswer(): AnswerState {
  return { wrong: 0, shown: false, outcome: null };
}

/**
 * Answers a question: `correct` is whether the answer was right. Right on
 * her own adds SMART_BONUS to the round's bonus and counts toward the Smart
 * Chef star; right after being shown carries on without either. A wrong
 * answer is 'try again' (show a hint), and after TRIES_BEFORE_HELP of them
 * 'show' (Chef Bunny shows the answer). It never fails, and the cooking score
 * is never touched. Answering again once it's right does nothing.
 */
export function answer(round: KitchenState, state: AnswerState, correct: boolean): AnswerResult {
  if (state.outcome) return 'right';
  if (correct) {
    state.outcome = state.shown ? 'helped' : 'right';
    round.learn.answers.push(state.outcome);
    if (state.outcome === 'right') round.bonus += SMART_BONUS;
    return 'right';
  }
  state.wrong += 1;
  if (state.wrong >= TRIES_BEFORE_HELP) {
    state.shown = true;
    return 'show';
  }
  return 'try again';
}

/** Whether the round earned its Smart Chef star: at least one question, every one right on her own. */
export function smartChef(round: KitchenState): boolean {
  const { answers } = round.learn;
  return answers.length > 0 && answers.every((a) => a === 'right');
}

/** The sticker that marks a dish's Smart Chef star in the recipe book. */
export function smartSticker(dishId: string): string {
  return `smart:${dishId}`;
}

/**
 * Chef Bunny's cheer for a right answer: "a Smart Chef!" only while the
 * round is still earning its star (this answer and every one before it
 * right on her own), otherwise a plain "Yes" with `helped` (the answer).
 */
export function cheerLines(
  round: KitchenState,
  state: AnswerState,
  helped: [string, string],
): [string, string] {
  if (state.outcome !== 'right') return helped;
  return smartChef(round) ? ['Yes! You are', 'a Smart Chef!'] : ['Yes! You', 'got it!'];
}

/**
 * Numbers to pick from, smallest first, with the answer as likely to be the
 * first, the middle or the last (so where it sits gives nothing away):
 * `answer` and `count - 1` others, taken in order from `below` (smaller than
 * it) and `above` (bigger). A place it can't have, for want of numbers
 * below or above, is skipped.
 */
export function spreadChoices(
  answer: number,
  below: readonly number[],
  above: readonly number[],
  random: () => number,
  count = 3,
): { choices: number[]; index: number } {
  const lower = [...new Set(below)].filter((n) => n < answer);
  const higher = [...new Set(above)].filter((n) => n > answer);
  const places = Array.from({ length: count }, (_, i) => i).filter(
    (i) => i <= lower.length && count - 1 - i <= higher.length,
  );
  const index = places.length ? pick(places, random) : Math.min(lower.length, count - 1);
  const choices = [...lower.slice(0, index), answer, ...higher.slice(0, count - 1 - index)].sort(
    (a, b) => a - b,
  );
  return { choices, index: choices.indexOf(answer) };
}

/**
 * Three answer choices round `answer`: it and two within 2 of it, at least
 * `min`, smallest first, the answer's place spread (see `spreadChoices`).
 */
export function nearChoices(
  answer: number,
  random: () => number,
  min = 0,
): { choices: number[]; index: number } {
  const below = shuffle([answer - 1, answer - 2], random).filter((n) => n >= min);
  const above = shuffle([answer + 1, answer + 2], random);
  return spreadChoices(answer, below, above, random);
}
