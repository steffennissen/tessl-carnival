import { ingredient } from '../ingredients';
import {
  amountText,
  fractionText,
  parseAmount,
  type Activity,
  type Dish,
  type Level,
  type Question,
  type RecipeStep,
} from '../kit';
import type { CupOptions } from '../steps/cup';
import { amountOf, type PourOptions } from '../steps/pour';

/**
 * Measure it (math: measurement and fractions). Just before a pour, a big
 * measuring cup with an ingredient in it and a question about it, then the
 * pour itself uses that amount: its star sits on the same line.
 *
 * Level 1 reads the cup, every line numbered: ½ cup, 1 cup or 2 cups.
 * Level 2 reads ¼, ¾ or 1½ cups with only the whole cups (and ½) numbered,
 * or works out how much more: "We need 1 cup of milk and have ½ cup. How
 * much more?", then pours the rest.
 */

/** Level 1's amounts, and Level 2's for reading a cup. */
export const LEVEL_1_CUPS = [0.5, 1, 2];
export const LEVEL_2_CUPS = [0.25, 0.75, 1.5];
/** Every amount an answer can be. */
const ANSWERS = [0.25, 0.5, 0.75, 1, 1.5, 2];
/** Level 2's "how much more": [need, have]. */
export const MORE_PAIRS: [number, number][] = [
  [1, 0.5],
  [1, 0.25],
  [1, 0.75],
  [0.75, 0.5],
  [1.5, 1],
  [1.5, 0.5],
  [2, 1],
  [2, 1.5],
];

/** A pour that can be measured: its step, and which of its pours. */
export interface Measurable {
  step: PourOptions;
  pour: number;
}

/** The pours in a dish measured in cups, ½ cup or more (not a splash of pasta water). */
export function measurable(dish: Dish): Measurable[] {
  return dish.steps.flatMap((step) =>
    step.kind === 'pour'
      ? step.pours.flatMap((_, pour) => {
          const real = parseAmount(amountOf(step, pour));
          return real && real.unit === 'cup' && real.value >= 0.5 ? [{ step, pour }] : [];
        })
      : [],
  );
}

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length) % items.length];

/** `answer` and two other amounts, smallest first, as cups ("½ cup"). */
function cupChoices(answer: number, random: () => number): { choices: string[]; answer: number } {
  const others = ANSWERS.filter((v) => v !== answer);
  const picked = [answer];
  while (picked.length < 3) {
    picked.push(others.splice(Math.floor(random() * others.length) % others.length, 1)[0]);
  }
  picked.sort((a, b) => a - b);
  return {
    choices: picked.map((value) => amountText({ value, unit: 'cup' })),
    answer: picked.indexOf(answer),
  };
}

/**
 * The measuring question for `item` (an ingredient that pours) at `level`,
 * and the amount the pour after it should pour, in cups.
 */
export function measureQuestion(
  item: string,
  level: Level,
  random: () => number,
): { cup: CupOptions; pour: number } {
  const label = ingredient(item).label;
  const cup = (question: Question, have: number, need?: number): CupOptions => ({
    kind: 'cup',
    item,
    unit: 'cup',
    have,
    ...(need === undefined ? {} : { need }),
    labels: level === 1 ? 'all' : 'some',
    question,
  });
  if (level === 1 || random() < 0.5) {
    const have = pick(level === 1 ? LEVEL_1_CUPS : LEVEL_2_CUPS, random);
    const { choices, answer } =
      level === 1
        ? {
            choices: LEVEL_1_CUPS.map((value) => amountText({ value, unit: 'cup' })),
            answer: LEVEL_1_CUPS.indexOf(have),
          }
        : cupChoices(have, random);
    const amount = amountText({ value: have, unit: 'cup' });
    return {
      cup: cup(
        {
          text: `How much ${label} is in the measuring cup?`,
          choices,
          answer,
          hint:
            level === 1
              ? ['Find the line at', `the top of the ${label}!`]
              : have < 1
                ? ['Each little line', 'is ¼ cup more!']
                : ['It is between', 'the 1 and the 2!'],
          help: `The ${label} comes up to the ${fractionText(have)} line. That's ${amount}!`,
        },
        have,
      ),
      pour: have,
    };
  }
  const [need, have] = pick(MORE_PAIRS, random);
  const more = need - have;
  const { choices, answer } = cupChoices(more, random);
  const needText = amountText({ value: need, unit: 'cup' });
  const haveText = amountText({ value: have, unit: 'cup' });
  return {
    cup: cup(
      {
        text: `We need ${needText} of ${label} and have ${haveText}. How much more?`,
        choices,
        answer,
        hint: ['Count the lines', 'up to the star!'],
        help: `${fractionText(need)} take away ${fractionText(have)} is ${fractionText(more)}. We need ${amountText({ value: more, unit: 'cup' })} more!`,
      },
      have,
      need,
    ),
    pour: more,
  };
}

const measure: Activity = {
  id: 'measure',
  name: 'Measure it',
  skills: ['math'],
  fits: (dish) => measurable(dish).length > 0,

  weave({ dish, level, random }) {
    const target = pick(measurable(dish), random);
    const { step, pour } = target;
    const { cup, pour: value } = measureQuestion(step.pours[pour], level, random);
    const amounts = step.pours.map((_, i) =>
      i === pour ? amountText({ value, unit: 'cup' }) : (amountOf(step, i) ?? ''),
    );
    const steps: RecipeStep[] = [];
    for (const s of dish.steps) {
      if (s === step) steps.push(cup, { ...step, amounts });
      else steps.push(s);
    }
    return steps;
  },
};

export default measure;
