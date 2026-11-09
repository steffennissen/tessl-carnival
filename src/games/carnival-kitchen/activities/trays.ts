import {
  pick,
  shuffle,
  spreadChoices,
  wholeBetween,
  type Activity,
  type Dish,
  type Level,
  type Question,
  type RecipeStep,
} from '../kit';
import type { TrayItem, TrayOptions } from '../steps/tray';

/**
 * Tray arrays (math: early multiplication). Once the cupcakes or cookies are
 * baked, or the sushi roll is cut, they sit on a tray in rows, and a
 * question asks how many: "3 rows of 5 cupcakes. Count by 5s! How many?".
 *
 * Level 1: rows of 2, 5 or 10, skip counting (up to 10, 20 or 30); after a
 * wrong try each row but the last shows its running total. Level 2: up to
 * 5 rows of up to 5, adding row by row ("4 + 4 + 4 = 12").
 */

/** What a dish's tray holds, and the step it comes after. */
export function trayOf(dish: Dish): { item: TrayItem; after: RecipeStep } | null {
  for (const step of dish.steps) {
    if (step.kind === 'bake' && step.item === 'cupcake-tray')
      return { item: 'cupcake', after: step };
    if (step.kind === 'bake' && step.item === 'cookies') return { item: 'cookie', after: step };
    if (step.kind === 'chop' && step.item === 'sushi-roll') return { item: 'sushi', after: step };
  }
  return null;
}

const THINGS: Record<TrayItem, string> = {
  cupcake: 'cupcakes',
  cookie: 'cookies',
  sushi: 'sushi pieces',
};

/** Level 1 counts by these, with this many rows at most. */
export const SKIP_ROWS: Record<number, number> = { 2: 5, 5: 4, 10: 3 };

/** The tray's rows and columns at `level`. */
export function traySize(level: Level, random: () => number): { rows: number; cols: number } {
  if (level === 1) {
    const cols = pick([2, 5, 10], random);
    return { rows: wholeBetween(random, 2, SKIP_ROWS[cols]), cols };
  }
  return { rows: wholeBetween(random, 2, 5), cols: wholeBetween(random, 2, 5) };
}

/**
 * The answer and two wrong ones near it, smallest first, with the answer as
 * likely first, middle or last. Level 1's wrong ones are a row more or less
 * (the slips skip counting makes) before one more or less; Level 2's a row
 * or column more or less, or one off, at random.
 */
export function trayChoices(
  rows: number,
  cols: number,
  level: Level,
  random: () => number,
): { choices: number[]; index: number } {
  const total = rows * cols;
  const below =
    level === 1
      ? [total - cols, total - 1]
      : shuffle([total - cols, total - rows, total - 1], random);
  const above =
    level === 1
      ? [total + cols, total + 1]
      : shuffle([total + cols, total + rows, total + 1], random);
  return spreadChoices(
    total,
    below.filter((n) => n > 0),
    above,
    random,
  );
}

/** The tray question for `item` at `level`. */
export function trayQuestion(item: TrayItem, level: Level, random: () => number): TrayOptions {
  const { rows, cols } = traySize(level, random);
  const total = rows * cols;
  const things = THINGS[item];
  const { choices, index } = trayChoices(rows, cols, level, random);
  const counts = Array.from({ length: rows }, (_, r) => (r + 1) * cols);
  const question: Question =
    level === 1
      ? {
          text: `${rows} rows of ${cols} ${things}. Count by ${cols}s! How many?`,
          choices: choices.map(String),
          answer: index,
          hint: [`Count by ${cols}s:`, `${cols}, ${cols * 2}, ...`],
          help: `${counts.join(', ')}. ${total} ${things}!`,
        }
      : {
          text: `${rows} rows of ${cols} ${things}. How many ${things}?`,
          choices: choices.map(String),
          answer: index,
          hint: ['Add one row', 'at a time!'],
          help: `${Array.from({ length: rows }, () => cols).join(' + ')} = ${total}. ${total} ${things}!`,
        };
  return { kind: 'tray', item, rows, cols, skip: level === 1, question };
}

const trays: Activity = {
  id: 'trays',
  name: 'Tray arrays',
  skills: ['math'],
  fits: (dish) => trayOf(dish) !== null,

  weave({ dish, level, random }) {
    const tray = trayOf(dish);
    if (!tray) return dish.steps;
    const ask = trayQuestion(tray.item, level, random);
    const i = dish.steps.indexOf(tray.after);
    return [...dish.steps.slice(0, i + 1), ask, ...dish.steps.slice(i + 1)];
  },
};

export default trays;
