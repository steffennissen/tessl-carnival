import { numberWord, type Activity, type Dish, type Level, type RecipeStep } from '../kit';
import type { AskOptions } from '../steps/ask';
import type { CutFood, CutOptions, CutPicture } from '../steps/cut';

/**
 * Equal parts (math: halves, thirds and fourths). When the pizza, the
 * pancakes or the mac & cheese is done, it's time to share it: three
 * pictures of it cut different ways, "Which pizza is cut into 4 equal
 * pieces?", then a question about the pieces, with the food cut the right
 * way beside it.
 *
 * Level 1: halves or fourths. Which one is cut into 2 (or 4) equal pieces,
 * then "What is each piece?": one half, one third or one fourth. Level 2:
 * thirds too, asked by name ("Which pizza is cut into thirds?"), then "How
 * many thirds make the whole pizza?".
 */

/** What a dish's sharing is cut from, the word for it, and the step it comes after. */
export function cutOf(dish: Dish): { food: CutFood; noun: string; after: RecipeStep } | null {
  for (const step of dish.steps) {
    if (step.kind === 'bake' && step.item === 'pizza')
      return { food: 'pizza', noun: 'pizza', after: step };
    if (step.kind === 'flip' && step.item === 'pancake')
      return { food: 'pancake', noun: 'pancake', after: step };
    if (step.kind === 'bake' && step.item === 'casserole')
      return { food: 'casserole', noun: 'mac and cheese', after: step };
  }
  return null;
}

/** Each piece's name, and the pieces' name, for 2, 3 and 4 equal pieces. */
export const PART_NAMES: Record<number, { one: string; many: string }> = {
  2: { one: 'half', many: 'halves' },
  3: { one: 'third', many: 'thirds' },
  4: { one: 'fourth', many: 'fourths' },
};

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length) % items.length];

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const left = [...items];
  const out: T[] = [];
  while (left.length) out.push(left.splice(Math.floor(random() * left.length) % left.length, 1)[0]);
  return out;
}

/** How many equal pieces at `level`: 2 or 4 at Level 1, 2, 3 or 4 at Level 2. */
export function partsFor(level: Level, random: () => number): number {
  return pick(level === 1 ? [2, 4] : [2, 3, 4], random);
}

/**
 * The picture question: the right picture (`parts` equal pieces), the same
 * number of unequal pieces, and a different number of equal pieces, shuffled.
 */
export function cutQuestion(
  food: CutFood,
  noun: string,
  parts: number,
  level: Level,
  random: () => number,
): CutOptions {
  const other = pick(
    (level === 1 ? [2, 4] : [2, 3, 4]).filter((n) => n !== parts),
    random,
  );
  const right: CutPicture = { parts, equal: true };
  const pictures = shuffled<CutPicture>(
    [right, { parts, equal: false }, { parts: other, equal: true }],
    random,
  );
  const say = (p: CutPicture) =>
    p.equal ? `${p.parts} equal pieces` : `${p.parts} pieces, not equal`;
  const name = PART_NAMES[parts].many;
  return {
    kind: 'cut',
    food,
    pictures,
    question: {
      text:
        level === 1
          ? `Which ${noun} is cut into ${parts} equal pieces?`
          : `Which ${noun} is cut into ${name}?`,
      choices: pictures.map(say),
      answer: pictures.indexOf(right),
      hint: ['Count the pieces.', 'Are they the same size?'],
      help: `This one! ${numberWord(parts)} pieces, all the same size. That's ${name}!`,
      layout: 'row',
    },
  };
}

/** The question after: what each piece is called (Level 1), or how many make the whole (Level 2). */
export function pieceQuestion(noun: string, parts: number, level: Level): AskOptions {
  const { one, many } = PART_NAMES[parts];
  if (level === 1) {
    const names = [2, 3, 4].map((n) => `one ${PART_NAMES[n].one}`);
    return {
      kind: 'ask',
      title: 'Name the pieces!',
      icon: '🍕',
      question: {
        text: `The ${noun} has ${parts} equal pieces. What is each piece?`,
        choices: names,
        answer: [2, 3, 4].indexOf(parts),
        hint: ['2 pieces are halves,', '4 pieces are fourths!'],
        help: `${numberWord(parts)} equal pieces, so each piece is one ${one}!`,
      },
    };
  }
  return {
    kind: 'ask',
    title: 'The whole thing!',
    icon: '🍕',
    question: {
      text: `How many ${many} make the whole ${noun}?`,
      choices: ['2', '3', '4'],
      answer: [2, 3, 4].indexOf(parts),
      hint: ['Count the pieces', 'of the whole thing!'],
      help: `${numberWord(parts)} ${many} make one whole ${noun}!`,
    },
  };
}

const equalParts: Activity = {
  id: 'equal-parts',
  name: 'Equal parts',
  skills: ['math'],
  fits: (dish) => cutOf(dish) !== null,

  weave({ dish, level, random }) {
    const found = cutOf(dish);
    if (!found) return dish.steps;
    const parts = partsFor(level, random);
    const cut = cutQuestion(found.food, found.noun, parts, level, random);
    const ask = pieceQuestion(found.noun, parts, level);
    const icon = found.food === 'pancake' ? '🥞' : found.food === 'pizza' ? '🍕' : '🧀';
    const i = dish.steps.indexOf(found.after);
    return [...dish.steps.slice(0, i + 1), cut, { ...ask, icon }, ...dish.steps.slice(i + 1)];
  },
};

export default equalParts;
