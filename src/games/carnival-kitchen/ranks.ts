import { preferencesFor, savePreference } from '../../carnival';
import { DISHES } from './dishes';
import type { Dish } from './kit';
import { ITEMS, type Item } from './wardrobe';

/**
 * Chef ranks, from Kid Chef to Master Chef, and what they unlock. Her rank
 * comes from "chef points", worked out from the stickers she already has:
 * each star on a dish's sticker, each Smart Chef mark, each trophy. So
 * nothing new is stored but the last rank celebrated, which the ceremony
 * uses to happen once per new rank.
 *
 * Also here: the special dish that a full recipe book unlocks.
 */

const GAME = 'carnival-kitchen';

export interface Rank {
  name: string;
  /** Chef points it takes. */
  points: number;
  icon: string;
}

/**
 * The ranks. Junior Chef comes in the first sitting (two or three dishes),
 * Sous Chef after about six dishes, Head Chef after ten or so with a few
 * Smart Chef marks, Master Chef once most of the book is cooked well: days,
 * not weeks.
 */
export const RANKS: Rank[] = [
  { name: 'Kid Chef', points: 0, icon: '🥄' },
  { name: 'Junior Chef', points: 5, icon: '⭐' },
  { name: 'Sous Chef', points: 14, icon: '🧁' },
  { name: 'Head Chef', points: 26, icon: '🏅' },
  { name: 'Master Chef', points: 42, icon: '👑' },
];

/** Chef points per Smart Chef mark (`smart:<dish>`) and per trophy (`trophy:<boss>`). */
export const SMART_POINTS = 2;
export const TROPHY_POINTS = 3;

/**
 * Her chef points: every star on every dish's sticker, plus SMART_POINTS for
 * each Smart Chef mark and TROPHY_POINTS for each trophy. Other stickers
 * (things she owns) don't count.
 */
export function chefPoints(
  stickers: Record<string, number>,
  dishIds: string[] = DISHES.map((d) => d.id),
): number {
  let points = 0;
  for (const [id, level] of Object.entries(stickers)) {
    if (!(level >= 1)) continue;
    if (id.startsWith('smart:')) points += SMART_POINTS;
    else if (id.startsWith('trophy:')) points += TROPHY_POINTS;
    else if (dishIds.includes(id)) points += Math.min(3, Math.round(level));
  }
  return points;
}

/** The rank (an index into RANKS) for some chef points. */
export function rankFor(points: number): number {
  let rank = 0;
  RANKS.forEach((r, i) => {
    if (points >= r.points) rank = i;
  });
  return rank;
}

/** Her rank from her stickers. */
export const rankOf = (stickers: Record<string, number>) => rankFor(chefPoints(stickers));

/** How far she is toward the next rank, for the badge on the title screen. */
export function rankProgress(points: number) {
  const rank = rankFor(points);
  const next = rank + 1 < RANKS.length ? rank + 1 : null;
  if (next === null) return { rank, next, toNext: 0, share: 1 };
  const from = RANKS[rank].points;
  const to = RANKS[next].points;
  return { rank, next, toNext: to - points, share: (points - from) / (to - from) };
}

/**
 * The rank to celebrate, if she has reached one past the last celebrated:
 * the highest, so jumping two ranks is one ceremony. Null when there's
 * nothing new.
 */
export function ceremonyDue(rank: number, celebrated: number): number | null {
  return rank > celebrated ? rank : null;
}

/** What Chef Bunny says at the ceremony. */
export function rankLine(rank: number): string {
  return `You're a ${RANKS[rank].name} now!`;
}

const CELEBRATED = 'rank-celebrated';

/** The last rank celebrated (0 if none yet). */
export function loadCelebrated(): number {
  const saved = preferencesFor(GAME)[CELEBRATED];
  return typeof saved === 'number' && saved >= 0 ? Math.floor(saved) : 0;
}

export function saveCelebrated(rank: number): void {
  savePreference(GAME, CELEBRATED, rank);
}

/** What a rank gives: its hat and its kitchen (none for Kid Chef). */
export function rewardsFor(rank: number): { hat?: Item; kitchen?: Item } {
  return {
    hat: ITEMS.find((i) => i.slot === 'hat' && i.rank === rank),
    kitchen: ITEMS.find((i) => i.slot === 'kitchen' && i.rank === rank),
  };
}

// ---------------------------------------------------------------------------
// The special dish

/** The dishes every round can pick from from the start. */
export const openDishes = (dishes: Dish[] = DISHES) => dishes.filter((d) => !d.locked);

/** The recipe book's order: the open dishes, then the surprise ones at the end. */
export const bookDishes = (dishes: Dish[] = DISHES) => [
  ...openDishes(dishes),
  ...dishes.filter((d) => d.locked),
];

/** How many open dishes still have no sticker. */
export function dishesLeft(stickers: Record<string, number>, dishes: Dish[] = DISHES): number {
  return openDishes(dishes).filter((d) => !((stickers[d.id] ?? 0) >= 1)).length;
}

/** Whether the locked dishes (the Birthday Cake) are unlocked: every open dish has its sticker. */
export function surpriseUnlocked(
  stickers: Record<string, number>,
  dishes: Dish[] = DISHES,
): boolean {
  return dishesLeft(stickers, dishes) === 0;
}

/** The book's hint, such as "1 more dish to unlock a surprise!", or null once unlocked. */
export function surpriseHint(
  stickers: Record<string, number>,
  dishes: Dish[] = DISHES,
): string | null {
  const left = dishesLeft(stickers, dishes);
  if (left === 0) return null;
  return `${left} more ${left === 1 ? 'dish' : 'dishes'} to unlock a surprise!`;
}

/** The dishes a round can pick: every open dish, and the locked ones once unlocked. */
export function playableDishes(stickers: Record<string, number>, dishes: Dish[] = DISHES): Dish[] {
  return surpriseUnlocked(stickers, dishes) ? dishes : openDishes(dishes);
}
