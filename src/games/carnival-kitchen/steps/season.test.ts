// The hold-meter steps (season, pour, bake) share their rules: kit/hold.ts.
import { describe, expect, it } from 'vitest';
import { currentKind, press, release, tick } from '../game';
import { POUR_SPEED, TARGET_HIGH, TARGET_LOW, type HoldState } from '../kit';
import { current, pourPerfectly, ready, seeded } from '../test-kit';
import pour from './pour';
import season from './season';

const shaker = current<HoldState>;

describe('hold and let go: salt, flour and milk', () => {
  it('puts the stars somewhere new each round, one per shake or pour', () => {
    const options = { kind: 'season', shaker: 'salt', food: 'soup' } as const;
    const a = season.start(options, seeded(1)).targets;
    const b = season.start(options, seeded(2)).targets;
    expect(a).toHaveLength(3);
    expect(a).not.toEqual(b);
    for (const p of [...a, ...b]) {
      expect(p).toBeGreaterThanOrEqual(TARGET_LOW);
      expect(p).toBeLessThanOrEqual(TARGET_HIGH);
    }
    expect(season.start({ ...options, shakes: 5 }, seeded()).targets).toHaveLength(5);
    expect(pour.start({ kind: 'pour', pours: ['flour', 'milk'] }, seeded()).targets).toHaveLength(
      2,
    );
  });

  it('scores when you let go at the star', () => {
    const state = ready('soup', 'season');
    const s = shaker(state);
    press(state, 0, 0);
    tick(state, s.targets[0] / POUR_SPEED);
    expect(release(state)).toBeCloseTo(100 / s.targets.length);
    expect(s.index).toBe(1);
  });

  it('overflows to nothing if you never let go', () => {
    const state = ready('soup', 'season');
    const s = shaker(state);
    press(state, 0, 0);
    for (let i = 0; i < 100; i++) tick(state, 0.05);
    expect(s.index).toBe(1);
    expect(s.points).toBe(0);
  });

  it('ignores a release that poured nothing', () => {
    const state = ready('soup', 'season');
    expect(release(state)).toBeNull();
  });

  it('does not use up a shake on a quick tap: "Not yet!"', () => {
    const state = ready('soup', 'season');
    const s = shaker(state);
    press(state, 0, 0);
    tick(state, 0.05);
    expect(release(state)).toBe('not yet');
    expect(s.index).toBe(0);
    expect(s.level).toBe(0);
    expect(state.feedback).toBeNull();
  });

  it('pours flour then milk into the pancake bowl', () => {
    const state = ready('pancakes', 'pour');
    pourPerfectly(state);
    expect(state.scores[1]).toBe(100);
    expect(currentKind(state)).toBe('mix');
  });
});
