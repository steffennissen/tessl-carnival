import { findStep, type Dish, type KitchenState, type RecipeStep } from './kit';
import type { CoinId, PayOptions, PayState } from './steps/pay';

/**
 * The food stand: who comes to the counter, what they order, and what they
 * pay. Plain functions with no canvas, so they're tested without a browser
 * (customers.test.ts). stand.ts draws the customers, render.ts shows them
 * and game.ts runs a visit.
 *
 * Every round is a customer's visit: they walk up after the dish spinner
 * lands and ask for the dish ("Hi! I'm Benny Bear. Can I have Pizza,
 * please?"), watch her cook it, get it served and pay in coins. Now and then
 * a boss (a VIP) comes instead, with a fanfare, and orders three dishes in a
 * row; any finish wins their golden trophy and a big coin bonus.
 */

/** What a guest looks like: the animal stand.ts draws. */
export type GuestKind =
  | 'bear'
  | 'fox'
  | 'kitten'
  | 'penguin'
  | 'frog'
  | 'elephant'
  | 'pig'
  | 'owl'
  | 'lobster'
  | 'king'
  | 'dragon'
  | 'grandma';

/** Someone who comes to the stand: a customer, or a boss (a VIP). */
export interface Guest {
  id: string;
  /** Their whole name: "Benny Bear". */
  name: string;
  /** What she calls them in a short sentence: "Benny". */
  short: string;
  kind: GuestKind;
  /** A little about them, on their name tag when they arrive. */
  line: string;
  boss: boolean;
}

/** The customers, one of them at a time at the counter. */
export const CUSTOMERS: readonly Guest[] = [
  {
    id: 'benny',
    name: 'Benny Bear',
    short: 'Benny',
    kind: 'bear',
    line: 'I love honey on everything!',
    boss: false,
  },
  {
    id: 'fifi',
    name: 'Fifi Fox',
    short: 'Fifi',
    kind: 'fox',
    line: 'I am the fastest runner at the carnival!',
    boss: false,
  },
  {
    id: 'kiki',
    name: 'Kiki Kitten',
    short: 'Kiki',
    kind: 'kitten',
    line: 'Purr! I love sparkly things!',
    boss: false,
  },
  {
    id: 'pip',
    name: 'Pip Penguin',
    short: 'Pip',
    kind: 'penguin',
    line: 'I just came from the ice rink!',
    boss: false,
  },
  {
    id: 'freddie',
    name: 'Freddie Frog',
    short: 'Freddie',
    kind: 'frog',
    line: 'I can jump super high!',
    boss: false,
  },
  {
    id: 'ellie',
    name: 'Ellie Elephant',
    short: 'Ellie',
    kind: 'elephant',
    line: 'I never forget a yummy dish!',
    boss: false,
  },
  {
    id: 'polly',
    name: 'Polly Pig',
    short: 'Polly',
    kind: 'pig',
    line: 'I love jumping in puddles!',
    boss: false,
  },
  {
    id: 'ollie',
    name: 'Ollie Owl',
    short: 'Ollie',
    kind: 'owl',
    line: 'Hoo! I read a book every night!',
    boss: false,
  },
  {
    id: 'lulu',
    name: 'Lulu the Lobster',
    short: 'Lulu',
    kind: 'lobster',
    line: 'I wave hello with my big claw!',
    boss: false,
  },
];

/** The bosses: VIPs who order three dishes and give a golden trophy. */
export const BOSSES: readonly Guest[] = [
  {
    id: 'king',
    name: 'the Carnival King',
    short: 'The King',
    kind: 'king',
    line: 'Make way for the King of the carnival!',
    boss: true,
  },
  {
    id: 'dragon',
    name: 'Sparky the Dragon',
    short: 'Sparky',
    kind: 'dragon',
    line: 'Rawr! That means hello in dragon!',
    boss: true,
  },
  {
    id: 'grandma',
    name: "Lulu's Grandma",
    short: 'Grandma',
    kind: 'grandma',
    line: 'Lulu says you cook the best food!',
    boss: true,
  },
];

/** A guest's name at the start of a sentence: "The Carnival King". */
export function title(guest: Guest): string {
  return guest.name[0].toUpperCase() + guest.name.slice(1);
}

// ---------------------------------------------------------------------------
// Who comes

/** Visits at the start of a session that never bring a boss. */
export const BOSS_FREE_VISITS = 2;
/** How often a boss comes after that: about one visit in six. */
export const BOSS_CHANCE = 1 / 6;
/** How many dishes a boss orders. */
export const BOSS_DISHES = 3;

/**
 * Whether visit number `visit` (0 for the session's first) brings a boss:
 * never in the first two, never twice in a row, and otherwise one roll in six.
 */
export function bossDue(visit: number, random: () => number, lastWasBoss = false): boolean {
  if (visit < BOSS_FREE_VISITS || lastWasBoss) return false;
  return random() < BOSS_CHANCE;
}

/** One of `guests` at random, but not `previous` (unless it's the only one). */
export function pickGuest(
  guests: readonly Guest[],
  random: () => number,
  previous?: Guest | null,
): Guest {
  const choices = guests.length > 1 ? guests.filter((g) => g.id !== previous?.id) : guests;
  return choices[Math.floor(random() * choices.length) % choices.length];
}

/**
 * A boss's three dishes: all different, and the first isn't `previous` (the
 * dish just cooked), so it never repeats straight away.
 */
export function bossDishes(dishes: readonly Dish[], random: () => number, previous?: Dish): Dish[] {
  const pool = [...dishes];
  const picked: Dish[] = [];
  while (picked.length < BOSS_DISHES && pool.length) {
    const choices = picked.length === 0 ? pool.filter((d) => d.id !== previous?.id) : pool;
    const from = choices.length ? choices : pool;
    const dish = from[Math.floor(random() * from.length) % from.length];
    picked.push(dish);
    pool.splice(pool.indexOf(dish), 1);
  }
  return picked;
}

// ---------------------------------------------------------------------------
// A visit

/** A guest's visit: the dishes they ordered and how far along they are. */
export interface Visit {
  guest: Guest;
  /** One dish for a customer, three for a boss, in order. */
  dishes: Dish[];
  /** Which dish is being cooked (an index into `dishes`). */
  index: number;
  /** Whether the boss's trophy has been given: only ever once. */
  trophy: boolean;
}

export function createVisit(guest: Guest, dishes: Dish[]): Visit {
  if (!dishes.length) throw new Error('A visit needs at least one dish');
  return { guest, dishes, index: 0, trophy: false };
}

/** The dish being cooked for the visit. */
export function visitDish(visit: Visit): Dish {
  return visit.dishes[visit.index];
}

/**
 * What comes after the dish being cooked is served: the boss's next dish,
 * the boss's trophy, or the end of the visit.
 */
export function afterDish(visit: Visit): 'next dish' | 'trophy' | 'done' {
  if (visit.index < visit.dishes.length - 1) return 'next dish';
  return visit.guest.boss && !visit.trophy ? 'trophy' : 'done';
}

/** Moves the visit on to its next dish, and returns it. */
export function nextDish(visit: Visit): Dish {
  if (visit.index >= visit.dishes.length - 1) throw new Error('No more dishes in this visit');
  visit.index += 1;
  return visitDish(visit);
}

/** "Dish 2 of 3". */
export function dishCount(visit: Visit): string {
  return `Dish ${visit.index + 1} of ${visit.dishes.length}`;
}

/** The sticker that keeps a boss's trophy, its level how many times it was won. */
export function trophySticker(bossId: string): string {
  return `trophy:${bossId}`;
}

/** How many times each boss's trophy was won, from the game's stickers. */
export function trophiesOf(stickers: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    BOSSES.map((b) => [b.id, Math.max(0, Math.round(stickers[trophySticker(b.id)] ?? 0))]),
  );
}

/** Coins a boss's trophy brings. */
export const TROPHY_COINS = 50;

/**
 * Gives the boss's trophy at the end of their last dish: the sticker to earn
 * (one more win than `wins`) and the coin bonus. Null if it isn't due or was
 * already given, so it's only ever given once per visit, however often it's asked.
 */
export function claimTrophy(
  visit: Visit,
  wins: number,
): { sticker: string; level: number; coins: number } | null {
  if (afterDish(visit) !== 'trophy') return null;
  visit.trophy = true;
  return { sticker: trophySticker(visit.guest.id), level: wins + 1, coins: TROPHY_COINS };
}

// ---------------------------------------------------------------------------
// What they say

/** The guest's order, in their speech bubble: two lines. */
export function greeting(guest: Guest, dish: Dish): [string, string] {
  return [`Hi! I'm ${title(guest)}.`, `Can I have ${dish.name}, please?`];
}

/** A boss's whole order, said as they arrive. */
export function bossOrder(guest: Guest, dishes: readonly Dish[]): string {
  const names = dishes.map((d) => d.name);
  const list = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Ta-da! I'm ${title(guest)}! ${guest.line} I would like three dishes: ${list}, please!`;
}

/** What a boss says between dishes. */
export function progressLine(visit: Visit): string {
  return `${dishCount(visit)}! Next, ${visitDish(visit).name}, please!`;
}

/**
 * What the guest says when she serves the dish: always happy, more so with
 * more stars. 1 star is still "Yummy, thank you!".
 */
export function serveLine(stars: number, dish: Dish): string {
  if (stars >= 3) return `Wow! The best ${dish.name} ever!`;
  if (stars === 2) return 'Super yummy! Thank you!';
  return 'Yummy, thank you!';
}

/**
 * The round's steps with the guest in them: an order ticket comes from
 * them ("Benny Bear's order") and "the customer pays" is them paying.
 */
export function withGuest(steps: readonly RecipeStep[], guest: Guest): RecipeStep[] {
  return steps.map((step) => {
    if (step.kind === 'ticket') return { ...step, from: title(guest) };
    if (step.kind === 'pay') {
      const pay = step as PayOptions;
      const text = pay.text
        .replace(/^That's (\d+)¢\./, `${guest.short} pays $1¢.`)
        .replace(/^A customer/, title(guest));
      return { ...pay, from: title(guest), text };
    }
    return step;
  });
}

// ---------------------------------------------------------------------------
// Coins

/** Coins for each star the dish earned. */
export const STAR_COINS = 10;
/** A tip for a perfect streak (Chef Bunny's party at 3 in a row). */
export const TIP_COINS = 5;
/** The streak that earns the tip. */
export const TIP_STREAK = 3;
/** A bonus for a Smart Chef round. */
export const SMART_COINS = 5;

/**
 * One coin dropped into the jar: a carnival coin worth 10 or 5, or a real
 * coin the customer paid with (`kind` is its CoinId).
 */
export interface CoinDrop {
  value: number;
  kind: 'carnival' | CoinId;
  why: 'star' | 'paid' | 'tip' | 'smart' | 'trophy';
}

export interface RoundCoins {
  drops: CoinDrop[];
  total: number;
}

const COIN_VALUES: Record<CoinId, number> = { quarter: 25, dime: 10, nickel: 5, penny: 1 };

/**
 * What a served dish brings in: 10 for each star, or, when the customer
 * paid (`paid`: the coins she counted into the tray), exactly those coins;
 * then 5 more for a perfect streak and 5 for a Smart Chef round. Small, round
 * numbers she can count: 10 to 40 coins, or the price plus up to 10.
 */
export function roundCoins({
  stars,
  streak,
  smart,
  paid,
}: {
  stars: number;
  streak: number;
  smart: boolean;
  paid: readonly CoinId[] | null;
}): RoundCoins {
  const drops: CoinDrop[] = paid
    ? paid.map((kind) => ({ value: COIN_VALUES[kind], kind, why: 'paid' as const }))
    : Array.from({ length: Math.max(1, Math.min(3, stars)) }, () => ({
        value: STAR_COINS,
        kind: 'carnival' as const,
        why: 'star' as const,
      }));
  if (streak >= TIP_STREAK) drops.push({ value: TIP_COINS, kind: 'carnival', why: 'tip' });
  if (smart) drops.push({ value: SMART_COINS, kind: 'carnival', why: 'smart' });
  return { drops, total: drops.reduce((sum, d) => sum + d.value, 0) };
}

/** The trophy's bonus as coins to drop in the jar: five tens. */
export function trophyCoins(): RoundCoins {
  const drops = Array.from({ length: TROPHY_COINS / 10 }, () => ({
    value: 10,
    kind: 'carnival' as const,
    why: 'trophy' as const,
  }));
  return { drops, total: TROPHY_COINS };
}

/**
 * The coins the customer paid with, when the round had "the customer pays"
 * and it was paid: what she counted into the tray (or what Chef Bunny laid
 * out for her). Null otherwise.
 */
export function paidCoins(round: KitchenState): CoinId[] | null {
  const pay = findStep<PayState, PayOptions>(round, 'pay');
  if (!pay?.state.done) return null;
  return [...pay.state.tray];
}

/**
 * Keeps a round's coins from being earned twice: `settle` runs `earn` with
 * the round's coins the first time it's asked for a round, and returns
 * null after that.
 */
export function createTill() {
  const settled = new WeakSet<KitchenState>();
  return {
    settle(round: KitchenState, coins: RoundCoins, earn: (amount: number) => number) {
      if (settled.has(round)) return null;
      settled.add(round);
      return earn(coins.total);
    },
  };
}
