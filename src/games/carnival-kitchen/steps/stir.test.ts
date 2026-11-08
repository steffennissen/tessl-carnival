// The circles steps (stir, sauce, mix) share their rules: kit/circles.ts.
import { describe, expect, it } from 'vitest';
import { currentKind, move, release, tick } from '../game';
import {
  CIRCLE,
  CIRCLE_REACH,
  CIRCLE_TIME,
  CIRCLE_TURNS,
  circleTurns,
  type CircleState,
} from '../kit';
import { circleTurnsOf, current, ready } from '../test-kit';

const spoon = current<CircleState>;

describe('circles: stirring, sauce and batter', () => {
  it('counts turns in either direction', () => {
    const state = ready('soup', 'stir');
    circleTurnsOf(state, 2);
    expect(spoon(state).radians).toBeCloseTo(Math.PI * 4);
  });

  it('counts a spoon a little outside the pot', () => {
    const state = ready('soup', 'stir');
    circleTurnsOf(state, 1, CIRCLE.radius + CIRCLE_REACH - 5);
    expect(circleTurns(spoon(state))).toBeCloseTo(1);
  });

  it('scores 100 for finishing instantly and moves on', () => {
    const state = ready('soup', 'stir');
    circleTurnsOf(state, CIRCLE_TURNS);
    expect(state.scores[1]).toBe(100);
    expect(currentKind(state)).toBe('season');
  });

  it('scores up to 50 for the turns made when time runs out', () => {
    const state = ready('soup', 'stir');
    circleTurnsOf(state, 2);
    release(state);
    for (let t = 0; t < CIRCLE_TIME; t += 0.05) tick(state, 0.05);
    tick(state, 0.05);
    expect(state.scores[1]).toBe(Math.round(50 * (2 / CIRCLE_TURNS)));
    expect(currentKind(state)).toBe('season');
  });

  it('starts a fresh stroke after the spoon is lifted', () => {
    const state = ready('soup', 'stir');
    move(state, CIRCLE.x + 80, CIRCLE.y);
    release(state);
    move(state, CIRCLE.x - 80, CIRCLE.y);
    expect(spoon(state).radians).toBe(0);
  });

  it('spreads the sauce and mixes the batter the same way', () => {
    for (const [dish, kind, index] of [
      ['pizza', 'sauce', 1],
      ['pancakes', 'mix', 2],
    ] as const) {
      const state = ready(dish, kind);
      circleTurnsOf(state, CIRCLE_TURNS);
      expect(state.scores[index], kind).toBe(100);
    }
  });
});
