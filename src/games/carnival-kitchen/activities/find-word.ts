import { ingredient } from '../ingredients';
import {
  listOf,
  pick,
  shuffle,
  type Activity,
  type Dish,
  type IngredientArt,
  type Level,
  type RecipeStep,
} from '../kit';
import { stepOf } from '../steps';
import type { FindOptions } from '../steps/find';

/**
 * Find the ingredient (phonics and sight words). Just before a step that
 * uses an ingredient, "Tap the CHEESE!": three jars with words on their
 * labels and their pictures hidden. Level 1's jars say three different
 * ingredients that start differently (cheese, rice, pancake); Level 2's say
 * words that sound alike (cheese, chess, cherry), so she has to read past
 * the first sound. Every word to find practises a 2nd-grade spelling
 * pattern: ch, sh, th, wh, ee, ea, oa, ai, ay, igh, ow or a silent e.
 */

/** The 2nd-grade spelling patterns the word bank practises. */
export const PATTERNS = [
  'ch',
  'sh',
  'th',
  'wh',
  'ee',
  'ea',
  'oa',
  'ai',
  'ay',
  'igh',
  'ow',
  'silent e',
] as const;
export type Pattern = (typeof PATTERNS)[number];

export interface BankWord {
  /** The word on the jar, an ingredient's label: "cheese". */
  word: string;
  /** Its picture, when it's on a jar that isn't the one to find. */
  picture: string;
  /** The patterns it practises; the hint points at them ("Look for ch and ee!"). */
  sounds: Pattern[];
  /** Two words that look and sound like it, with their pictures, for Level 2. */
  alike: [{ word: string; picture: string }, { word: string; picture: string }];
}

/**
 * The words to find: ingredient labels in the dishes that have a 2nd-grade
 * pattern. A new ingredient whose label is here can be found too.
 */
export const WORD_BANK: readonly BankWord[] = [
  {
    word: 'cheese',
    picture: '🧀',
    // Its last e is silent, but it isn't the silent e that makes a vowel long (rice, cake).
    sounds: ['ch', 'ee'],
    alike: [
      { word: 'chess', picture: '♟️' },
      { word: 'cherry', picture: '🍒' },
    ],
  },
  {
    word: 'cherry',
    picture: '🍒',
    sounds: ['ch'],
    alike: [
      { word: 'cheery', picture: '😊' },
      { word: 'berry', picture: '🫐' },
    ],
  },
  {
    word: 'shells',
    picture: '🐚',
    sounds: ['sh'],
    alike: [
      { word: 'sells', picture: '🏷️' },
      { word: 'bells', picture: '🔔' },
    ],
  },
  {
    word: 'cream',
    picture: '🥛',
    sounds: ['ea'],
    alike: [
      { word: 'dream', picture: '💭' },
      { word: 'crane', picture: '🏗️' },
    ],
  },
  {
    word: 'meatball',
    picture: '🧆',
    sounds: ['ea'],
    alike: [
      { word: 'meatloaf', picture: '🍖' },
      { word: 'mailbox', picture: '📫' },
    ],
  },
  {
    word: 'rice',
    picture: '🍚',
    sounds: ['silent e'],
    alike: [
      { word: 'race', picture: '🏁' },
      { word: 'mice', picture: '🐭' },
    ],
  },
  {
    word: 'pancake',
    picture: '🥞',
    sounds: ['silent e'],
    alike: [
      { word: 'cupcake', picture: '🧁' },
      { word: 'pinecone', picture: '🌲' },
    ],
  },
  {
    word: 'cupcakes',
    picture: '🧁',
    sounds: ['silent e'],
    alike: [
      { word: 'pancakes', picture: '🥞' },
      { word: 'cupboards', picture: '🗄️' },
    ],
  },
  {
    word: 'sushi',
    picture: '🍣',
    sounds: ['sh'],
    alike: [
      { word: 'slushy', picture: '🥤' },
      { word: 'sunny', picture: '☀️' },
    ],
  },
  {
    word: 'smoothie',
    picture: '🥤',
    sounds: ['th'],
    alike: [
      { word: 'tooth', picture: '🦷' },
      { word: 'smoky', picture: '💨' },
    ],
  },
  {
    word: 'ketchup',
    picture: '🍅',
    sounds: ['ch'],
    alike: [
      { word: 'kitchen', picture: '🍳' },
      { word: 'catch', picture: '⚾' },
    ],
  },
  {
    word: 'whipped cream',
    picture: '☁️',
    sounds: ['wh', 'ea'],
    alike: [
      { word: 'ice cream', picture: '🍦' },
      { word: 'sour cream', picture: '🥣' },
    ],
  },
];

/** The bank's entry for a word, or undefined. */
export function bankWord(word: string): BankWord | undefined {
  return WORD_BANK.find((w) => w.word === word);
}

/** Roles where the ingredient is the food itself, not a pot, plate or bowl it goes in. */
const FOOD_ROLES: readonly (keyof IngredientArt)[] = [
  'chop',
  'crack',
  'pour',
  'stirred',
  'shaker',
  'spread',
  'topping',
  'bake',
  'flip',
  'grate',
  'tossed',
  'blended',
  'scoop',
  'stack',
  'rollOut',
  'rollUp',
];

/** A word she could find in a dish: the step it goes before, and its ingredient. */
export interface FindTarget {
  /** Index into the dish's steps of the step that uses it. */
  step: number;
  id: string;
  word: BankWord;
}

/**
 * Every word in the bank that a dish's steps use for sure, with the step.
 * A top step's `extras` may not go on, so only its `always` count.
 */
export function findTargets(dish: Dish): FindTarget[] {
  const targets: FindTarget[] = [];
  dish.steps.forEach((step, i) => {
    const kind = stepOf(step.kind);
    if (kind.learning) return;
    const used = kind
      .uses(step as never)
      .filter(([, role]) => FOOD_ROLES.includes(role))
      .map(([id]) => id);
    const sure = step.kind === 'top' ? used.filter((id) => (step.always ?? []).includes(id)) : used;
    for (const id of new Set(sure)) {
      const word = bankWord(ingredient(id).label);
      if (word && !targets.some((t) => t.word === word)) targets.push({ step: i, id, word });
    }
  });
  return targets;
}

/**
 * The sound a word starts with, roughly as a reader hears it: "ch", "sh",
 * "th" and "wh" (as w); a hard c or k as "k" (cream, ketchup, cupcakes);
 * otherwise its first letter.
 */
export function firstSound(word: string): string {
  const w = word.toLowerCase();
  if (/^(ch|sh|th)/.test(w)) return w.slice(0, 2);
  if (w.startsWith('wh')) return 'w';
  if (/^(c[^eiy]|k|q)/.test(w)) return 'k';
  if (/^c[eiy]/.test(w)) return 's';
  return w[0];
}

/**
 * The three words on the jars and their pictures, the word to find among
 * them. Level 1: two other one-word bank words, each starting with a
 * different letter and a different sound from the word and each other.
 * Level 2: the word's two look-alikes, real words.
 */
export function jarWords(
  target: BankWord,
  picture: string,
  level: Level,
  random: () => number,
): { words: string[]; pictures: string[]; answer: number } {
  let others: { word: string; picture: string }[];
  if (level === 2) {
    others = [...target.alike];
  } else {
    others = [];
    for (const w of shuffle(WORD_BANK, random)) {
      const taken = [target, ...others];
      // Different first letters and different first sounds: cream, ketchup
      // and cupcakes all start with a k sound, cheese with a c but not a k.
      const fits =
        !taken.some((o) => o.word[0] === w.word[0] || firstSound(o.word) === firstSound(w.word)) &&
        !w.word.includes(' ');
      if (others.length < 2 && fits) others.push(w);
    }
  }
  const jars = shuffle([{ word: target.word, picture }, ...others], random);
  return {
    words: jars.map((j) => j.word),
    pictures: jars.map((j) => j.picture),
    answer: jars.findIndex((j) => j.word === target.word),
  };
}

/** The find step for a target word. */
export function makeFind(target: FindTarget, level: Level, random: () => number): FindOptions {
  const { word } = target.word;
  const { words, pictures, answer } = jarWords(
    target.word,
    ingredient(target.id).icon,
    level,
    random,
  );
  const sounds = target.word.sounds.map((s) => (s === 'silent e' ? 'a silent e' : s));
  return {
    kind: 'find',
    word,
    pictures,
    question: {
      text: `Tap the ${word.toUpperCase()}!`,
      choices: words,
      answer,
      hint: ['Look at the letters:', `find ${listOf(sounds.slice(0, 2))}!`],
      help: `This one says ${word}!`,
      layout: 'row',
    },
  };
}

const findWord: Activity = {
  id: 'find-word',
  name: 'Find the ingredient',
  skills: ['reading'],
  fits: (dish) => findTargets(dish).length > 0,

  weave({ dish, level, random }) {
    const targets = findTargets(dish);
    if (!targets.length) return dish.steps;
    const target = pick(targets, random);
    const steps: RecipeStep[] = [...dish.steps];
    steps.splice(target.step, 0, makeFind(target, level, random));
    return steps;
  },
};

export default findWord;
