import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from '../dishes';
import type { PayOptions } from '../steps/pay';
import { seeded } from '../test-kit';
import customerPays, { BANK, payStep, priceFor } from './customer-pays';

describe('the customer pays (activity)', () => {
  it('fits every dish, after its last step', () => {
    expect(DISHES.every((d) => customerPays.fits(d))).toBe(true);
    const pizza = dishById('pizza');
    const steps = customerPays.weave({ dish: pizza, level: 1, random: seeded(), start: 900 });
    expect(steps.slice(0, -1)).toEqual(pizza.steps);
    expect(steps[steps.length - 1].kind).toBe('pay');
  });

  it('asks up to 50¢ in dimes, nickels and pennies at Level 1; up to 99¢ with quarters at Level 2', () => {
    const fives = new Set<boolean>();
    for (let seed = 1; seed < 80; seed++) {
      const one = priceFor(1, seeded(seed));
      expect(one).toBeGreaterThanOrEqual(10);
      expect(one).toBeLessThanOrEqual(50);
      fives.add(one % 5 === 0);
      const two = priceFor(2, seeded(seed));
      expect(two).toBeGreaterThanOrEqual(26);
      expect(two).toBeLessThanOrEqual(99);
    }
    expect(fives.size).toBe(2);
    expect(BANK[1]).not.toContain('quarter');
    expect(BANK[2]).toContain('quarter');
    const step: PayOptions = payStep(1, seeded(3));
    expect(step.text).toBe(`That's ${step.price}¢. Tap the coins to pay!`);
  });
});
