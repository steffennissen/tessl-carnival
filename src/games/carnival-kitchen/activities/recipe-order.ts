import { shuffle, type Activity, type Dish, type Level, type RecipeStep } from '../kit';
import { iconOf, stepOf, titleOf } from '../steps';
import type { SequenceCard, SequenceOptions } from '../steps/sequence';

/**
 * Put the recipe in order (sequencing and reading). The round starts with
 * the dish's step cards shuffled in a tray: she drags them (or taps them in
 * order) into First, Next, Then and Last. Then she cooks them in that order,
 * which is the recipe's real one. Level 1 cards have each step's emoji and
 * words; Level 2 cards have words only.
 *
 * It fits dishes with three or four cooking steps: enough to think about,
 * few enough for a young reader.
 */

/** The dish's cooking steps, if it has three or four. */
function cookingSteps(dish: Dish): RecipeStep[] {
  return dish.steps.filter((s) => !stepOf(s.kind).learning);
}

/** The cards for a dish, in the recipe's order: each step's title, and its emoji at Level 1. */
export function recipeCards(dish: Dish, level: Level): SequenceCard[] {
  return cookingSteps(dish).map((options) => {
    const run = { kind: options.kind, options, state: null };
    return { text: titleOf(run), icon: level === 1 ? iconOf(run) : null };
  });
}

/**
 * How the cards lie in the tray: shuffled, never already in order, and
 * with the first step not first, so there's always something to do.
 */
export function shuffledTray(count: number, random: () => number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  let tray = shuffle(order, random);
  for (let i = 0; tray[0] === 0 && i < 20; i++) tray = shuffle(order, random);
  // Still first after all that (a very unlucky roll): swap it along.
  if (tray[0] === 0) tray = [...tray.slice(1), 0];
  return tray;
}

const recipeOrder: Activity = {
  id: 'recipe-order',
  name: 'Put the recipe in order',
  skills: ['reading'],
  fits: (dish) => {
    const steps = cookingSteps(dish);
    // Cards with the same words (two "Chop the strawberry!") couldn't be told apart.
    const titles = new Set(recipeCards(dish, 2).map((c) => c.text));
    return steps.length >= 3 && steps.length <= 4 && titles.size === steps.length;
  },

  weave({ dish, level, random }) {
    const cards = recipeCards(dish, level);
    const sequence: SequenceOptions = {
      kind: 'sequence',
      cards,
      tray: shuffledTray(cards.length, random),
    };
    return [sequence, ...dish.steps];
  },
};

export default recipeOrder;
