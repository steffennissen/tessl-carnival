import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from './dishes';
import {
  RANKS,
  SMART_POINTS,
  TROPHY_POINTS,
  bookDishes,
  ceremonyDue,
  chefPoints,
  dishesLeft,
  loadCelebrated,
  openDishes,
  playableDishes,
  rankFor,
  rankLine,
  rankProgress,
  rewardsFor,
  saveCelebrated,
  surpriseHint,
  surpriseUnlocked,
} from './ranks';
import { ITEMS, owns } from './wardrobe';

/** Every open dish cooked at `stars`, but the ones in `skip`. */
const cooked = (stars: number, skip: string[] = []) =>
  Object.fromEntries(openDishes().flatMap((d) => (skip.includes(d.id) ? [] : [[d.id, stars]])));

describe('chef points', () => {
  it('count stars on dishes, Smart Chef marks and trophies, and nothing else', () => {
    expect(chefPoints({})).toBe(0);
    expect(chefPoints({ pizza: 3, soup: 1 })).toBe(4);
    expect(chefPoints({ pizza: 2, 'smart:pizza': 1 })).toBe(2 + SMART_POINTS);
    expect(chefPoints({ 'trophy:queen': 1 })).toBe(TROPHY_POINTS);
    // Things she owns, unknown stickers and zero levels don't count.
    expect(chefPoints({ 'own:crown': 1, 'not-a-dish': 3, soup: 0 })).toBe(0);
    // A dish's stars never count for more than 3.
    expect(chefPoints({ pizza: 7 })).toBe(3);
  });

  it('counts the surprise dish too', () => {
    expect(chefPoints({ 'birthday-cake': 2 })).toBe(2);
  });
});

describe('chef ranks', () => {
  it('go from Kid Chef to Master Chef, five of them, each needing more', () => {
    expect(RANKS.map((r) => r.name)).toEqual([
      'Kid Chef',
      'Junior Chef',
      'Sous Chef',
      'Head Chef',
      'Master Chef',
    ]);
    expect(RANKS[0].points).toBe(0);
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].points).toBeGreaterThan(RANKS[i - 1].points);
    }
  });

  it('are reached over days, not weeks', () => {
    // Junior Chef in a first sitting: two or three dishes.
    expect(rankFor(chefPoints({ pizza: 2, soup: 2, tacos: 1 }))).toBe(1);
    // Sous Chef after about six dishes at two stars.
    const six = Object.fromEntries(
      openDishes()
        .slice(0, 7)
        .map((d) => [d.id, 2]),
    );
    expect(rankFor(chefPoints(six))).toBeGreaterThanOrEqual(2);
    // Master Chef is in reach once most of the book is cooked well, with
    // some Smart Chef marks.
    const most = cooked(
      3,
      openDishes()
        .slice(0, 3)
        .map((d) => d.id),
    );
    expect(rankFor(chefPoints(most))).toBe(3);
    const smart = Object.fromEntries(
      openDishes()
        .slice(0, 4)
        .map((d) => [`smart:${d.id}`, 1]),
    );
    expect(rankFor(chefPoints({ ...most, ...smart }))).toBe(4);
    // ...and the most she can have is well past it.
    const all = Object.fromEntries([
      ...DISHES.map((d) => [d.id, 3]),
      ...DISHES.map((d) => [`smart:${d.id}`, 1]),
    ]);
    expect(chefPoints(all)).toBeGreaterThan(RANKS[4].points + 20);
  });

  it('shows the way to the next rank', () => {
    expect(rankProgress(0)).toEqual({ rank: 0, next: 1, toNext: RANKS[1].points, share: 0 });
    const half = (RANKS[1].points + RANKS[2].points) / 2;
    const p = rankProgress(half);
    expect(p.rank).toBe(1);
    expect(p.next).toBe(2);
    expect(p.share).toBeCloseTo(0.5);
    expect(p.toNext).toBe(RANKS[2].points - half);
    expect(rankProgress(999)).toEqual({ rank: 4, next: null, toNext: 0, share: 1 });
  });

  it('has a ceremony once for each new rank, the highest when she jumps two', () => {
    expect(ceremonyDue(0, 0)).toBeNull();
    expect(ceremonyDue(1, 0)).toBe(1);
    expect(ceremonyDue(1, 1)).toBeNull();
    expect(ceremonyDue(3, 1)).toBe(3);
    expect(ceremonyDue(2, 3)).toBeNull();
    expect(rankLine(2)).toBe("You're a Sous Chef now!");
  });

  it('remembers the last rank celebrated', () => {
    expect(loadCelebrated()).toBe(0);
    saveCelebrated(2);
    expect(loadCelebrated()).toBe(2);
    saveCelebrated(0);
  });

  it('gives each rank from Junior up a free hat and a new kitchen', () => {
    expect(rewardsFor(0)).toEqual({ hat: undefined, kitchen: undefined });
    const kitchens = [1, 2, 3, 4].map((r) => rewardsFor(r).kitchen?.id);
    expect(kitchens).toEqual(['candy', 'space', 'underwater', 'palace']);
    for (const r of [1, 2, 3, 4]) {
      const { hat, kitchen } = rewardsFor(r);
      expect(hat?.slot).toBe('hat');
      expect(hat?.price).toBe(0);
      // Theirs from that rank on, and not before.
      for (const item of [hat, kitchen]) {
        if (!item) throw new Error(`rank ${r} has no reward`);
        expect(owns(item, {}, r - 1)).toBe(false);
        expect(owns(item, {}, r)).toBe(true);
      }
    }
    // The carnival tent is everyone's.
    const tent = ITEMS.find((i) => i.id === 'tent');
    expect(tent && owns(tent, {}, 0)).toBe(true);
  });
});

describe('the surprise dish', () => {
  it('is the Birthday Cake, locked, at the end of the recipe book', () => {
    const cake = dishById('birthday-cake');
    expect(cake.locked).toBe(true);
    expect(openDishes()).toHaveLength(DISHES.length - 1);
    expect(openDishes()).not.toContain(cake);
    expect(bookDishes().at(-1)).toBe(cake);
    expect(bookDishes()).toHaveLength(DISHES.length);
  });

  it('unlocks when every other dish has a sticker', () => {
    const cake = dishById('birthday-cake');
    expect(dishesLeft({})).toBe(openDishes().length);
    expect(surpriseUnlocked({})).toBe(false);
    expect(playableDishes({})).not.toContain(cake);
    const oneLeft = cooked(1, ['pizza']);
    expect(dishesLeft(oneLeft)).toBe(1);
    expect(surpriseUnlocked(oneLeft)).toBe(false);
    expect(playableDishes(oneLeft)).not.toContain(cake);
    const all = { ...oneLeft, pizza: 1 };
    expect(surpriseUnlocked(all)).toBe(true);
    expect(playableDishes(all)).toContain(cake);
    expect(playableDishes(all)).toHaveLength(DISHES.length);
  });

  it('gives the book a hint of how many dishes are left', () => {
    expect(surpriseHint(cooked(2, ['pizza']))).toBe('1 more dish to unlock a surprise!');
    expect(surpriseHint(cooked(2, ['pizza', 'soup', 'tacos']))).toBe(
      '3 more dishes to unlock a surprise!',
    );
    expect(surpriseHint(cooked(2))).toBeNull();
  });
});
