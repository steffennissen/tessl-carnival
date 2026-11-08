import { describe, expect, it } from 'vitest';
import { DISHES } from './dishes';
import {
  BOUNCE_TIME,
  SPIN_LAPS,
  SPIN_TIME,
  drawSpinner,
  easeOutQuart,
  holdFor,
  reelIndex,
  reelPosition,
  spinEnd,
  spinTime,
} from './spinner';
import { fakeCanvas } from './test-kit';

const COUNT = DISHES.length;

describe('the dish spinner', () => {
  it('lands on the picked dish, from any start', () => {
    for (let start = 0; start < COUNT; start++) {
      for (let target = 0; target < COUNT; target++) {
        const end = spinEnd(start, target, COUNT);
        expect(reelIndex(end, COUNT)).toBe(target);
        expect(reelIndex(reelPosition(start, end, SPIN_TIME), COUNT)).toBe(target);
        expect(end - start).toBeGreaterThanOrEqual(SPIN_LAPS * COUNT);
        expect(end - start).toBeLessThan((SPIN_LAPS + 1) * COUNT);
      }
    }
  });

  it('starts where it was and turns one way, slowing down', () => {
    const end = spinEnd(5, 2, COUNT);
    expect(reelPosition(5, end, 0)).toBe(5);
    let last = 5;
    let lastStep = Infinity;
    for (let age = 0.1; age <= SPIN_TIME; age += 0.1) {
      const pos = reelPosition(5, end, age);
      expect(pos).toBeGreaterThanOrEqual(last);
      expect(pos - last).toBeLessThanOrEqual(lastStep + 1e-9);
      lastStep = pos - last;
      last = pos;
    }
  });

  it('bounces on the landed dish without leaving it, then settles exactly', () => {
    const end = spinEnd(0, 7, COUNT);
    for (let after = 0; after <= BOUNCE_TIME; after += 0.02) {
      expect(reelIndex(reelPosition(0, end, SPIN_TIME + after), COUNT)).toBe(7);
    }
    expect(reelPosition(0, end, SPIN_TIME + BOUNCE_TIME)).toBe(end);
    expect(reelPosition(0, end, 99)).toBe(end);
  });

  it('eases from 0 to 1', () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
    expect(easeOutQuart(0.5)).toBeGreaterThan(0.5);
  });

  it('wraps the reel both ways', () => {
    expect(reelIndex(-1, COUNT)).toBe(COUNT - 1);
    expect(reelIndex(COUNT * 3 + 2.3, COUNT)).toBe(2);
  });

  it('waits longer for longer names, and the whole thing takes about 4 seconds', () => {
    expect(holdFor('Omurice with a Ketchup Heart')).toBeGreaterThan(holdFor('Pizza'));
    for (const dish of DISHES) {
      expect(spinTime(dish)).toBeGreaterThanOrEqual(3.5);
      expect(spinTime(dish)).toBeLessThanOrEqual(4.6);
    }
  });

  it('draws every frame without errors', () => {
    const g = fakeCanvas();
    const end = spinEnd(0, 3, COUNT);
    for (let age = 0; age <= SPIN_TIME + 2; age += 0.25) {
      drawSpinner(g, {
        dishes: DISHES,
        pos: reelPosition(0, end, age),
        speed: 10,
        landed: age >= SPIN_TIME ? age - SPIN_TIME : -1,
        t: age,
      });
    }
  });
});
