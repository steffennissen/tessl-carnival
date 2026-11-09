import { describe, expect, it } from 'vitest';
import { press, release, tick } from '../game';
import type { HoldState } from '../kit';
import { dishById } from '../dishes';
import { current, ready } from '../test-kit';
import bake, { BAKE_EARLY, BAKE_SPEED, BAKE_TARGET, minuteMarks, type BakeOptions } from './bake';

const oven = current<HoldState>;

describe('bake', () => {
  it('scores food taken out when it is golden', () => {
    const state = ready('pizza', 'bake');
    const b = oven(state);
    press(state, 0, 0);
    tick(state, BAKE_TARGET / BAKE_SPEED);
    expect(release(state)).toBeCloseTo(100);
    expect(b.index).toBe(1);
    expect(state.phase).toBe('over');
  });

  it('keeps pale food in the oven: "Not yet!", and the heat stays', () => {
    const state = ready('pizza', 'bake');
    const b = oven(state);
    press(state, 0, 0);
    tick(state, (BAKE_TARGET - BAKE_EARLY - 0.1) / BAKE_SPEED);
    const level = b.level;
    expect(release(state)).toBe('not yet');
    expect(b.level).toBe(level);
    expect(state.phase).toBe('playing');
    press(state, 0, 0);
    tick(state, (BAKE_TARGET - level) / BAKE_SPEED);
    expect(release(state)).toBeCloseTo(100);
  });

  it('takes forgotten food out by itself, still worth something', () => {
    const state = ready('pizza', 'bake');
    const b = oven(state);
    press(state, 0, 0);
    for (let i = 0; i < 200; i++) tick(state, 0.05);
    expect(b.index).toBe(1);
    expect(b.level).toBe(1);
    expect(state.scores[4]).toBeGreaterThan(0);
    expect(state.phase).toBe('over');
  });

  it('bakes for the real minutes, and says so, with a line every 5 minutes up to the star', () => {
    const minutes = (id: string) =>
      (dishById(id).steps.find((s) => s.kind === 'bake') as BakeOptions).minutes;
    expect(minutes('sugar-cookies')).toBe(10);
    expect(minutes('cupcakes')).toBe(20);
    expect(minutes('pizza')).toBe(15);
    expect(minutes('mac-and-cheese')).toBe(25);
    expect(bake.hint({ kind: 'bake', item: 'cookies', minutes: 10 })[0]).toBe(
      'Bake for 10 minutes!',
    );
    expect(minuteMarks(10)).toEqual([5, 10]);
    expect(minuteMarks(25)).toEqual([5, 10, 15, 20, 25, 30, 35]);
  });
});
