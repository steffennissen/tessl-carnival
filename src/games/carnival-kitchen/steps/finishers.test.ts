import { describe, expect, it } from 'vitest';
import { CHAOS, planSurprise } from '../chaos';
import { DISHES } from '../dishes';
import { createState, tick } from '../game';
import { ready, seeded } from '../test-kit';
import { STEPS, stepOf } from './index';

const FINISHERS = ['dough-toss', 'flambe', 'tower', 'party'];

/** A surprise waiting to start from the first step, any moment now. */
const waiting = (id: string) => ({
  id,
  from: 0,
  wait: 0.1,
  phase: 'waiting' as const,
  step: -1,
  state: null,
  age: 0,
  paid: 0,
  down: false,
  seed: 1,
});

describe('the finishers', () => {
  it('are marked as show-off finishes', () => {
    expect(
      STEPS.filter((s) => s.finisher)
        .map((s) => s.kind)
        .sort(),
    ).toEqual([...FINISHERS].sort());
  });

  it('never get a kitchen surprise planned on them', () => {
    for (const dish of DISHES) {
      for (let seed = 1; seed <= 60; seed++) {
        const state = createState(dish, seeded(seed));
        planSurprise(state, seeded(seed + 1000), { round: 1, on: true });
        if (!state.chaos) continue;
        expect(stepOf(state.steps[state.chaos.from].kind).finisher, dish.id).toBeFalsy();
      }
    }
  });

  it('never have a surprise start during them, even one waiting from earlier', () => {
    // As a check that it would: on the toppings, it starts.
    const top = ready('pizza', 'top');
    top.chaos = { ...waiting('cat') };
    for (let i = 0; i < 20; i++) tick(top, 0.05);
    expect(top.chaos.phase).toBe('on');

    for (const [dish, kind] of [
      ['pizza', 'dough-toss'],
      ['pancakes', 'flambe'],
      ['ice-cream-sundae', 'tower'],
      ['cupcakes', 'party'],
    ]) {
      for (const chaos of CHAOS) {
        const state = ready(dish, kind);
        state.chaos = waiting(chaos.id);
        for (let i = 0; i < 20; i++) tick(state, 0.05);
        expect(state.chaos.phase, `${chaos.id} on ${kind}`).not.toBe('on');
      }
    }
  });
});
