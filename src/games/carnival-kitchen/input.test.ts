import { describe, expect, it } from 'vitest';
import { dishById } from './dishes';
import {
  CARD_HOLD,
  cancel,
  createState,
  holdCard,
  press,
  release,
  releaseCard,
  skipCard,
  tick,
} from './game';
import { DEFAULT_SETTINGS, POUR_SPEED, plainPlan, type HoldState } from './kit';
import { current, ready, seeded } from './test-kit';

describe('a gesture the browser takes away (pointercancel)', () => {
  it('stops a pour without scoring it or using it up', () => {
    const state = ready('pancakes', 'pour');
    const meter = () => current<HoldState>(state);
    press(state, 0, 0);
    tick(state, meter().targets[0] / POUR_SPEED);
    expect(cancel(state)).toBeNull();
    expect(meter().holding).toBe(false);
    expect(meter().index).toBe(0);
    expect(meter().points).toBe(0);
    // Ticking on doesn't keep pouring, and the next hold carries on.
    const level = meter().level;
    tick(state, 1);
    expect(meter().level).toBe(level);
    press(state, 0, 0);
    expect(typeof release(state)).toBe('number');
    expect(meter().index).toBe(1);
  });
});

describe('"Read it myself" step cards', () => {
  const reader = () => {
    const soup = dishById('soup');
    return createState(soup, seeded(), plainPlan(soup, { ...DEFAULT_SETTINGS, readMyself: true }));
  };

  it('stay up until tapped, however long she takes to read', () => {
    const state = reader();
    tick(state, 60);
    expect(state.banner).toBe(CARD_HOLD);
    expect(skipCard(state)).toBe(true);
    expect(state.banner).toBe(0);
  });

  it('close a moment after their speaker has read them out', () => {
    const state = reader();
    tick(state, 1);
    holdCard(state);
    tick(state, 30);
    expect(state.banner).toBeGreaterThan(0);
    releaseCard(state);
    tick(state, CARD_HOLD / 2);
    expect(state.banner).toBeGreaterThan(0);
    tick(state, CARD_HOLD);
    expect(state.banner).toBe(0);
  });

  it('still close by themselves with the setting off', () => {
    const soup = dishById('soup');
    const state = createState(soup, seeded());
    tick(state, 60);
    expect(state.banner).toBe(0);
  });
});
