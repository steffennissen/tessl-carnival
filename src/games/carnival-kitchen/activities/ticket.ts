import { ingredient } from '../ingredients';
import {
  listOf,
  nearChoices,
  numberWord,
  orderTotal,
  type Activity,
  type Dish,
  type Level,
  type Order,
  type OrderLine,
  type Question,
  type RecipeStep,
} from '../kit';
import type { AskOptions } from '../steps/ask';
import type { StackOptions } from '../steps/stack';
import type { TicketOptions } from '../steps/ticket';
import type { TopOptions } from '../steps/top';

/**
 * Order tickets (reading and counting). A customer's ticket comes first:
 * "One pizza with 2 olives and 3 mushrooms, please!". She reads it, then
 * cooks it: the toppings (or the burger's layers) are exactly what it says,
 * with the ticket's note pinned up and ticked off as they go on. Right after,
 * a counting question about what she put on, with a picture of it: how many
 * in all, or (adding) how many with some more.
 *
 * Level 1: digits on the ticket, usually two kinds, up to 5 things; count
 * them, or add up to 3 more (within 10). Level 2: number words, two or
 * three kinds and something the customer doesn't want ("No tomatoes!");
 * add 3 to 9 more (within 20).
 */

/** Names for bases whose own label doesn't read well on a ticket. */
const BASE_NOUNS: Record<string, string> = {
  'spaghetti-plate': 'plate of spaghetti',
  nori: 'sushi roll',
};

/** Burger layers a ticket can ask for, in the order they stack, with their words. */
const BURGER_LAYERS: { id: string; one: string; many: string }[] = [
  { id: 'patty', one: 'patty', many: 'patties' },
  { id: 'cheese-slice', one: 'cheese slice', many: 'cheese slices' },
  { id: 'pickle', one: 'pickle', many: 'pickles' },
  { id: 'lettuce-leaf', one: 'lettuce leaf', many: 'lettuce leaves' },
  { id: 'tomato-slice', one: 'tomato slice', many: 'tomato slices' },
];

/** Something you can count ("2 olives"), rather than "some cheese". */
function countable(id: string): boolean {
  const ing = ingredient(id);
  return (ing.plural ?? `${ing.label}s`) !== ing.label;
}

function words(id: string): { one: string; many: string } {
  const layer = BURGER_LAYERS.find((l) => l.id === id);
  if (layer) return layer;
  const ing = ingredient(id);
  return { one: ing.label, many: ing.plural ?? `${ing.label}s` };
}

/** "2 olives", "one mushroom", "three olives". */
function amountOf(line: OrderLine, level: Level): string {
  const { one, many } = words(line.id);
  const n = level === 1 ? String(line.count) : numberWord(line.count);
  return `${n} ${line.count === 1 ? one : many}`;
}

function topOf(dish: Dish): TopOptions | undefined {
  return dish.steps.find((s): s is TopOptions => s.kind === 'top');
}
function stackOf(dish: Dish): StackOptions | undefined {
  return dish.steps.find((s): s is StackOptions => s.kind === 'stack');
}

function baseNoun(base: string): string | null {
  return BASE_NOUNS[base] ?? (countable(base) ? ingredient(base).label : null);
}

/** What a ticket can go on in this dish: a top step's toppings, or a burger's layers. */
export function ticketTarget(
  dish: Dish,
):
  | { kind: 'top'; step: TopOptions; kinds: string[]; noun: string }
  | { kind: 'stack'; step: StackOptions; kinds: string[]; noun: string }
  | null {
  const top = topOf(dish);
  const noun = top && baseNoun(top.base);
  if (top && noun) {
    const kinds = [...new Set([...(top.always ?? []), ...top.extras])].filter(countable);
    if (kinds.length) return { kind: 'top', step: top, kinds, noun };
  }
  const stack = stackOf(dish);
  if (stack?.base === 'burger-plate') {
    return { kind: 'stack', step: stack, kinds: BURGER_LAYERS.map((l) => l.id), noun: 'burger' };
  }
  return null;
}

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length) % items.length];
const between = (random: () => number, low: number, high: number) =>
  low + (Math.floor(random() * (high - low + 1)) % (high - low + 1));

/** Splits `total` into `parts` counts of at least 1 each. */
function split(total: number, parts: number, random: () => number): number[] {
  const counts = Array.from({ length: parts }, () => 1);
  for (let left = total - parts; left > 0; left--)
    counts[Math.floor(random() * parts) % parts] += 1;
  return counts;
}

/** The ticket for a round of `dish`, or null if it takes no ticket. */
export function makeOrder(dish: Dish, level: Level, random: () => number): Order | null {
  const target = ticketTarget(dish);
  if (!target) return null;
  // Anything chopped earlier in the round goes on (the pizza's pepperoni);
  // a burger always has a patty.
  const chopped = dish.steps.flatMap((s) => (s.kind === 'chop' ? [s.item] : []));
  const must =
    target.kind === 'stack' ? ['patty'] : target.kinds.filter((k) => chopped.includes(k));
  const others = target.kinds.filter((k) => !must.includes(k));
  const most = level === 1 ? 2 : 3;
  // A burger has a patty and at least one more kind of layer.
  const fewest = target.kind === 'stack' ? 2 : must.length;
  // Level 1 usually asks for two kinds (four times in five), now and then one.
  const kinds = level === 1 ? (random() < 0.8 ? 2 : 1) : between(random, level, most);
  const want = Math.min(target.kinds.length, Math.max(fewest, kinds));
  const chosen = [...must];
  const pool = [...others];
  while (chosen.length < want && pool.length) {
    chosen.push(pool.splice(Math.floor(random() * pool.length) % pool.length, 1)[0]);
  }
  // Keep the order things go on: a burger bottom to top, toppings as listed.
  chosen.sort((a, b) => target.kinds.indexOf(a) - target.kinds.indexOf(b));
  const usual = target.kind === 'top' ? target.step.count : 4;
  const [low, high] = level === 1 ? [2, Math.min(5, usual + 1)] : [3, Math.min(7, usual + 2)];
  const total = Math.max(chosen.length, between(random, low, Math.max(low, high)));
  const counts = split(total, chosen.length, random);
  // No more than 2 patties: the rest go to the other layers.
  const patty = chosen.indexOf('patty');
  for (let i = 1; patty >= 0 && counts[patty] > 2; i++) {
    counts[patty] -= 1;
    counts[(patty + i) % counts.length || 1] += 1;
  }
  const lines: OrderLine[] = chosen.map((id, i) => ({
    id,
    count: counts[i],
    icon: ingredient(id).icon,
  }));
  const left = target.kinds.filter((k) => !chosen.includes(k));
  const without =
    level === 2 && left.length ? { id: pick(left, random), count: 0, icon: '' } : undefined;
  if (without) without.icon = ingredient(without.id).icon;
  const list = listOf(lines.map((line) => amountOf(line, level)));
  const no = without ? ` No ${words(without.id).many}!` : '';
  return { text: `One ${target.noun} with ${list}, please!${no}`, lines, without };
}

/**
 * The counting question after the order is cooked: how many in all
 * ("count"), or how many with some more ("add"). Level 1 adds up to 3 (to
 * within 10), Level 2 adds 3 to 9 (to within 20).
 */
export function countQuestion(
  order: Order,
  kind: 'top' | 'stack',
  level: Level,
  random: () => number,
): { question: Question; tag?: string } {
  // A burger's layers include its two buns.
  const total = orderTotal(order) + (kind === 'stack' ? 2 : 0);
  const single = order.lines.length === 1 && kind === 'top';
  const things = kind === 'stack' ? 'layers' : single ? words(order.lines[0].id).many : 'toppings';
  const add = level === 2 || (total < 9 && random() < 0.5);
  if (!add) {
    const { choices, index } = nearChoices(total, random, 1);
    const counting = Array.from({ length: total }, (_, i) => numberWord(i + 1)).join(', ');
    return {
      question: {
        text:
          kind === 'stack'
            ? 'How many layers does your burger have?'
            : `How many ${things} did you put on?`,
        choices: choices.map(String),
        answer: index,
        hint: ['Point and count', 'them one by one!'],
        help: `Let's count: ${counting}. ${numberWord(total)}!`,
      },
    };
  }
  const more =
    level === 1
      ? between(random, 1, Math.min(3, 10 - total))
      : between(random, 3, Math.min(9, 20 - total));
  const sum = total + more;
  const { choices, index } = nearChoices(sum, random, 1);
  const icon = kind === 'stack' ? '🍔' : order.lines[0].icon;
  return {
    question: {
      text: `You put on ${total} ${things}. Add ${more} more. How many is that?`,
      choices: choices.map(String),
      answer: index,
      hint: [`Start at ${total},`, `then count on ${more}!`],
      help: `${total} and ${more} more makes ${sum}!`,
    },
    tag: `+${more} ${icon}`,
  };
}

const ticket: Activity = {
  id: 'ticket',
  name: 'Order tickets',
  skills: ['reading', 'math'],
  fits: (dish) => ticketTarget(dish) !== null,

  weave({ dish, level, random }) {
    const target = ticketTarget(dish);
    const order = makeOrder(dish, level, random);
    if (!target || !order) return dish.steps;
    const ids = order.lines.flatMap((line) => Array.from({ length: line.count }, () => line.id));
    const filled: RecipeStep =
      target.kind === 'top'
        ? { ...target.step, always: ids, extras: [], count: ids.length, order }
        : { ...target.step, layers: ['bun', ...ids, 'bun'], order };
    const { question, tag } = countQuestion(order, target.kind, level, random);
    const ask: AskOptions = { kind: 'ask', question, tag, title: 'Count them!', icon: '🔢' };
    const first: TicketOptions = { kind: 'ticket', order };
    const steps: RecipeStep[] = [first];
    for (const step of dish.steps) {
      if (step === target.step) steps.push(filled, ask);
      else steps.push(step);
    }
    return steps;
  },
};

export default ticket;
