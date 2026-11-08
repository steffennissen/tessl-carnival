import { describe, expect, it } from 'vitest';
import { createState, press } from '../game';
import { dishById } from '../dishes';
import { fakeCanvas, playThrough, seeded } from '../test-kit';
import {
  DEFAULT_MINUTES,
  angleAt,
  clockHour,
  clockText,
  drawClock,
  handAngles,
  hourFromAngle,
  minuteFromAngle,
  roundTime,
  startTime,
  stepMinutes,
  timeAtStep,
  withHourHand,
  withMinuteHand,
} from './clock';

const TAU = Math.PI * 2;

describe('kitchen clock', () => {
  it('shows times the way a clock does', () => {
    expect(clockText(16 * 60)).toBe('4:00');
    expect(clockText(16 * 60 + 5)).toBe('4:05');
    expect(clockText(12 * 60 + 30)).toBe('12:30');
    expect(clockText(35)).toBe('12:35');
    expect(clockHour(13 * 60)).toBe(1);
  });

  it('points the hands, the hour hand moving on with the minutes', () => {
    expect(handAngles(15 * 60)).toEqual({ hour: TAU / 4, minute: 0 });
    const half = handAngles(15 * 60 + 30);
    expect(half.minute).toBeCloseTo(Math.PI);
    expect(half.hour).toBeCloseTo(TAU / 4 + TAU / 24);
  });

  it('turns a drag into an angle, and an angle into a snapped minute or hour', () => {
    expect(angleAt(0, 0, 0, -10)).toBeCloseTo(0);
    expect(angleAt(0, 0, 10, 0)).toBeCloseTo(TAU / 4);
    expect(angleAt(0, 0, 0, 10)).toBeCloseTo(Math.PI);
    expect(angleAt(0, 0, -10, 0)).toBeCloseTo((3 * TAU) / 4);
    expect(minuteFromAngle(TAU / 4)).toBe(15);
    expect(minuteFromAngle(TAU / 4 + 0.05)).toBe(15);
    expect(minuteFromAngle(TAU - 0.01)).toBe(0);
    expect(minuteFromAngle((TAU * 7) / 60, 1)).toBe(7);
    expect(hourFromAngle(0)).toBe(12);
    expect(hourFromAngle(TAU / 4)).toBe(3);
  });

  it('sets a time by dragging either hand, keeping the other', () => {
    const t = 15 * 60 + 10; // 3:10 pm
    expect(clockText(withMinuteHand(t, Math.PI))).toBe('3:30');
    // The hour hand at 4:10 sits a little past the 4.
    const at4 = handAngles(16 * 60 + 10).hour;
    expect(withHourHand(t, at4)).toBe(16 * 60 + 10);
    expect(withHourHand(t, 0)).toBe(12 * 60 + 10);
  });

  it('starts a round in the afternoon: Level 1 on the hour or half, Level 2 any 5 minutes', () => {
    const level2 = new Set<number>();
    for (let seed = 1; seed < 60; seed++) {
      const one = startTime(1, seeded(seed));
      expect(one).toBeGreaterThanOrEqual(14 * 60);
      expect(one).toBeLessThanOrEqual(17 * 60 + 30);
      expect(one % 30).toBe(0);
      const two = startTime(2, seeded(seed));
      expect(two % 5).toBe(0);
      level2.add(two % 60);
    }
    expect(level2.size).toBeGreaterThan(4);
  });

  it("moves on by each finished step's minutes", () => {
    expect(stepMinutes({ kind: 'bake' })).toBe(DEFAULT_MINUTES.bake);
    expect(stepMinutes({ kind: 'bake', minutes: 20 })).toBe(20);
    expect(stepMinutes({ kind: 'ask' })).toBe(0);
    const steps = [{ kind: 'chop' }, { kind: 'bake', minutes: 20 }];
    expect(timeAtStep(steps, 900, 2)).toBe(900 + DEFAULT_MINUTES.chop + 20);

    const state = createState(dishById('pizza'), seeded());
    expect(roundTime(state)).toBe(state.start);
    playThrough(state);
    press(state, 0, 0);
    const minutes = state.steps.reduce((sum, run) => sum + stepMinutes(run.options), 0);
    expect(roundTime(state)).toBe(state.start + minutes);
  });

  it('draws at any size, with or without numbers', () => {
    const g = fakeCanvas();
    for (const r of [12, 40, 120])
      drawClock(g, 100, 100, r, 995, { numbers: r > 20, glow: 'minute' });
  });
});
