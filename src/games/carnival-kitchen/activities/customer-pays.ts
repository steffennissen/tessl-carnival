import type { Activity, Level } from '../kit';
import type { CoinId, PayOptions } from '../steps/pay';

/**
 * The customer pays (money). When the cooking's done, before decorating, a
 * carnival customer buys the dish: "That's 45¢. Tap the coins to pay!" She
 * taps coins into the tray until they make the price.
 *
 * Level 1: up to 50¢ with dimes, nickels and pennies. Level 2: up to 99¢,
 * with quarters too.
 */

/** The coins in the bank at each level, biggest value first. */
export const BANK: Record<Level, CoinId[]> = {
  1: ['dime', 'nickel', 'penny'],
  2: ['quarter', 'dime', 'nickel', 'penny'],
};

/**
 * A price for the level, in cents: Level 1 10¢ to 50¢, half of them in
 * fives (counting by tens and fives); Level 2 26¢ to 99¢.
 */
export function priceFor(level: Level, random: () => number): number {
  const roll = (low: number, high: number) =>
    low + (Math.floor(random() * (high - low + 1)) % (high - low + 1));
  if (level === 2) return roll(26, 99);
  return random() < 0.5 ? roll(2, 10) * 5 : roll(10, 50);
}

/** The pay step for a round at this level. */
export function payStep(level: Level, random: () => number): PayOptions {
  const price = priceFor(level, random);
  return {
    kind: 'pay',
    price,
    coins: BANK[level],
    text:
      level === 1
        ? `That's ${price}¢. Tap the coins to pay!`
        : `A customer buys your dish for ${price}¢. Tap the coins to pay!`,
  };
}

const customerPays: Activity = {
  id: 'customer-pays',
  name: 'The customer pays',
  skills: ['math'],
  fits: () => true,
  // Last, once the cooking's done: decorating and the end card come after.
  weave: ({ dish, level, random }) => [...dish.steps, payStep(level, random)],
};

export default customerPays;
