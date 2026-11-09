import { describe, expect, it } from 'vitest';
import customerPays from './activities/customer-pays';
import ticket from './activities/ticket';
import {
  BOSSES,
  BOSS_CHANCE,
  CUSTOMERS,
  TROPHY_COINS,
  afterDish,
  bossDishes,
  bossDue,
  bossOrder,
  claimTrophy,
  createTill,
  createVisit,
  dishCount,
  greeting,
  nextDish,
  paidCoins,
  pickGuest,
  progressLine,
  roundCoins,
  serveLine,
  trophiesOf,
  trophyCoins,
  trophySticker,
  visitDish,
  withGuest,
} from './customers';
import { DISHES, dishById } from './dishes';
import { playableDishes } from './ranks';
import { createState } from './game';
import { playThrough, seeded } from './test-kit';
import type { PayOptions } from './steps/pay';
import type { TicketOptions } from './steps/ticket';

describe('the stand’s guests', () => {
  it('has a cast of customers and three bosses, each with a name and a line', () => {
    expect(CUSTOMERS.length).toBeGreaterThanOrEqual(6);
    expect(CUSTOMERS.length).toBeLessThanOrEqual(10);
    expect(BOSSES.map((b) => b.id)).toEqual(['king', 'dragon', 'grandma']);
    const all = [...CUSTOMERS, ...BOSSES];
    expect(new Set(all.map((g) => g.id)).size).toBe(all.length);
    for (const guest of all) {
      expect(guest.name.length).toBeGreaterThan(2);
      expect(guest.line.length).toBeGreaterThan(5);
    }
    expect(CUSTOMERS.every((c) => !c.boss)).toBe(true);
    expect(BOSSES.every((b) => b.boss)).toBe(true);
    // Lulu the lobster comes too.
    expect(CUSTOMERS.some((c) => c.kind === 'lobster')).toBe(true);
  });

  it('never picks the same guest twice in a row', () => {
    const random = seeded(4);
    let last = pickGuest(CUSTOMERS, random);
    const seen = new Set([last.id]);
    for (let i = 0; i < 200; i++) {
      const next = pickGuest(CUSTOMERS, random, last);
      expect(next.id).not.toBe(last.id);
      seen.add(next.id);
      last = next;
    }
    expect(seen.size).toBe(CUSTOMERS.length);
  });

  it('greets and orders the dish, and is always happy with it', () => {
    const pizza = dishById('pizza');
    expect(greeting(CUSTOMERS[0], pizza)).toEqual([
      "Hi! I'm Benny Bear.",
      'Can I have Pizza, please?',
    ]);
    expect(serveLine(1, pizza)).toBe('Yummy, thank you!');
    expect(serveLine(2, pizza)).toBe('Super yummy! Thank you!');
    expect(serveLine(3, pizza)).toBe('Wow! The best Pizza ever!');
  });
});

describe('bosses', () => {
  it('never come in the first two visits of a session, nor twice in a row', () => {
    const always = () => 0;
    expect(bossDue(0, always)).toBe(false);
    expect(bossDue(1, always)).toBe(false);
    expect(bossDue(2, always)).toBe(true);
    expect(bossDue(5, always, true)).toBe(false);
    expect(bossDue(9, () => 0.99)).toBe(false);
  });

  it('come about one visit in six, the same way for the same seed', () => {
    const run = (seed: number) => {
      const random = seeded(seed);
      let last = false;
      return Array.from({ length: 600 }, (_, visit) => {
        last = bossDue(visit, random, last);
        return last;
      });
    };
    expect(run(7)).toEqual(run(7));
    const bosses = run(7).filter(Boolean).length;
    // One in six of the rolls, less the visits right after a boss.
    expect(bosses).toBeGreaterThan(600 * BOSS_CHANCE * 0.6);
    expect(bosses).toBeLessThan(600 * BOSS_CHANCE * 1.3);
  });

  it('order three different dishes, the first not the one just cooked', () => {
    for (let seed = 1; seed < 40; seed++) {
      const previous = DISHES[seed % DISHES.length];
      const dishes = bossDishes(DISHES, seeded(seed), previous);
      expect(dishes).toHaveLength(3);
      expect(new Set(dishes.map((d) => d.id)).size).toBe(3);
      expect(dishes[0].id).not.toBe(previous.id);
    }
  });

  it('only order dishes she can cook: the Birthday Cake once it is unlocked', () => {
    const locked = DISHES.filter((d) => d.locked);
    expect(locked.length).toBeGreaterThan(0);
    for (let seed = 1; seed < 60; seed++) {
      const dishes = bossDishes(playableDishes({}), seeded(seed));
      expect(dishes.some((d) => d.locked)).toBe(false);
    }
    const all = Object.fromEntries(DISHES.map((d) => [d.id, 3]));
    expect(playableDishes(all)).toEqual(DISHES);
  });

  it('go through their three dishes, then give the trophy exactly once', () => {
    const [a, b, c] = ['pizza', 'tacos', 'cupcakes'].map(dishById);
    const visit = createVisit(BOSSES[0], [a, b, c]);
    expect(visitDish(visit)).toBe(a);
    expect(dishCount(visit)).toBe('Dish 1 of 3');
    expect(afterDish(visit)).toBe('next dish');
    expect(claimTrophy(visit, 0)).toBeNull();
    expect(nextDish(visit)).toBe(b);
    expect(dishCount(visit)).toBe('Dish 2 of 3');
    expect(progressLine(visit)).toBe('Dish 2 of 3! Next, Tacos, please!');
    expect(nextDish(visit)).toBe(c);
    expect(afterDish(visit)).toBe('trophy');
    expect(() => nextDish(visit)).toThrow();
    // Any finish wins it: the trophy's level counts the wins.
    expect(claimTrophy(visit, 2)).toEqual({
      sticker: 'trophy:king',
      level: 3,
      coins: TROPHY_COINS,
    });
    expect(claimTrophy(visit, 3)).toBeNull();
    expect(afterDish(visit)).toBe('done');
  });

  it('say their whole order when they arrive', () => {
    const dishes = ['pizza', 'tacos', 'cupcakes'].map(dishById);
    expect(bossOrder(BOSSES[1], dishes)).toContain('Pizza, Tacos and Cupcakes');
  });

  it('a customer has one dish and no trophy', () => {
    const visit = createVisit(CUSTOMERS[0], [dishById('soup')]);
    expect(afterDish(visit)).toBe('done');
    expect(claimTrophy(visit, 0)).toBeNull();
  });

  it('counts the trophies from the stickers', () => {
    expect(trophySticker('dragon')).toBe('trophy:dragon');
    expect(trophiesOf({ 'trophy:dragon': 2, pizza: 3 })).toEqual({
      king: 0,
      dragon: 2,
      grandma: 0,
    });
  });
});

describe('coins', () => {
  it('pays 10 a star, 5 for a perfect streak and 5 for a Smart Chef', () => {
    expect(roundCoins({ stars: 1, streak: 0, smart: false, paid: null }).total).toBe(10);
    expect(roundCoins({ stars: 2, streak: 2, smart: false, paid: null }).total).toBe(20);
    expect(roundCoins({ stars: 3, streak: 3, smart: false, paid: null }).total).toBe(35);
    const most = roundCoins({ stars: 3, streak: 8, smart: true, paid: null });
    expect(most.total).toBe(40);
    expect(most.drops.map((d) => d.why)).toEqual(['star', 'star', 'star', 'tip', 'smart']);
    // Small, round numbers she can count by fives and tens.
    for (const drop of most.drops) expect([5, 10]).toContain(drop.value);
  });

  it('when the customer paid, are the very coins she counted', () => {
    const coins = roundCoins({
      stars: 3,
      streak: 0,
      smart: true,
      paid: ['quarter', 'dime', 'dime'],
    });
    expect(coins.drops.map((d) => d.kind)).toEqual(['quarter', 'dime', 'dime', 'carnival']);
    expect(coins.total).toBe(45 + 5);
  });

  it('finds the coins paid in a round where the customer paid', () => {
    const pizza = dishById('pizza');
    const random = seeded(3);
    const steps = customerPays.weave({ dish: pizza, level: 2, random, start: 900 });
    const state = createState(pizza, random, {
      steps,
      activity: 'customer-pays',
      settings: { learning: true, level: 2, readMyself: false },
      start: 900,
    });
    expect(paidCoins(state)).toBeNull();
    playThrough(state);
    const paid = paidCoins(state);
    const price = (steps[steps.length - 1] as PayOptions).price;
    const values = { quarter: 25, dime: 10, nickel: 5, penny: 1 };
    expect(paid?.reduce((sum, id) => sum + values[id], 0)).toBe(price);
    // A round without paying has none.
    const plain = createState(pizza, seeded(2));
    playThrough(plain);
    expect(paidCoins(plain)).toBeNull();
  });

  it('are earned once per round, however often the round is settled', () => {
    const till = createTill();
    const state = createState(dishById('soup'), seeded(1));
    const coins = roundCoins({ stars: 2, streak: 0, smart: false, paid: null });
    let wallet = 0;
    const earn = (n: number) => (wallet += n);
    expect(till.settle(state, coins, earn)).toBe(20);
    expect(till.settle(state, coins, earn)).toBeNull();
    expect(wallet).toBe(20);
    // The next round earns its own.
    expect(till.settle(createState(dishById('soup'), seeded(2)), coins, earn)).toBe(40);
  });

  it('gives the trophy’s 50 as five tens', () => {
    const bonus = trophyCoins();
    expect(bonus.total).toBe(TROPHY_COINS);
    expect(bonus.drops.every((d) => d.value === 10)).toBe(true);
  });
});

describe('the guest in the learning moments', () => {
  it('sends the order ticket and does the paying', () => {
    const pizza = dishById('pizza');
    const benny = CUSTOMERS[0];
    const ticketSteps = withGuest(
      ticket.weave({ dish: pizza, level: 1, random: seeded(1), start: 900 }),
      benny,
    );
    expect((ticketSteps[0] as TicketOptions).from).toBe('Benny Bear');
    const one = withGuest(
      customerPays.weave({ dish: pizza, level: 1, random: seeded(2), start: 900 }),
      benny,
    );
    const pay = one[one.length - 1] as PayOptions;
    expect(pay.from).toBe('Benny Bear');
    expect(pay.text).toBe(`Benny pays ${pay.price}¢. Tap the coins to pay!`);
    const two = withGuest(
      customerPays.weave({ dish: pizza, level: 2, random: seeded(2), start: 900 }),
      BOSSES[0],
    );
    const bossPay = two[two.length - 1] as PayOptions;
    expect(bossPay.text).toBe(
      `The Carnival King buys your dish for ${bossPay.price}¢. Tap the coins to pay!`,
    );
    // Everything else is left as it was.
    expect(one.slice(0, -1)).toEqual(pizza.steps);
  });
});
