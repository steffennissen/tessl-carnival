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
  quarterWords,
  sameClockTime,
  sayTime,
  roundTime,
  startTime,
  stepMinutes,
  timeAtStep,
  turnMinuteHand,
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
      expect(two).toBeGreaterThanOrEqual(14 * 60);
      expect(two).toBeLessThanOrEqual(17 * 60 + 30);
      level2.add(two % 60);
    }
    expect(level2.size).toBeGreaterThan(4);
    // The latest start at either level is 5:30.
    expect(startTime(2, () => 0.999)).toBe(17 * 60 + 30);
    expect(startTime(1, () => 0.999)).toBe(17 * 60 + 30);
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

  it('turns the minute hand like a geared clock: past 12, the hour moves on', () => {
    const at = (minute: number) => (minute / 60) * TAU;
    expect(clockText(turnMinuteHand(15 * 60 + 50, at(5)))).toBe('4:05');
    expect(clockText(turnMinuteHand(16 * 60 + 5, at(55)))).toBe('3:55');
    expect(clockText(turnMinuteHand(15 * 60 + 10, at(30)))).toBe('3:30');
    // Round and round from 12:00 to 2:30, five minutes at a time.
    let time = 12 * 60;
    for (let m = 5; m <= 150; m += 5) time = turnMinuteHand(time, at(m % 60));
    expect(clockText(time)).toBe('2:30');
  });

  it('says times the way people do', () => {
    expect(sayTime(16 * 60)).toBe("four o'clock");
    expect(sayTime(16 * 60 + 5)).toBe('four oh five');
    expect(sayTime(16 * 60 + 15)).toBe('four fifteen');
    expect(sayTime(16 * 60 + 30)).toBe('four thirty');
    expect(sayTime(16 * 60 + 45)).toBe('four forty-five');
    expect(sayTime(12 * 60 + 50)).toBe('twelve fifty');
    expect(quarterWords(16 * 60)).toBe("4 o'clock");
    expect(quarterWords(16 * 60 + 15)).toBe('quarter past 4');
    expect(quarterWords(16 * 60 + 30, true)).toBe('half past four');
    expect(quarterWords(16 * 60 + 45)).toBe('quarter to 5');
    expect(quarterWords(12 * 60 + 45)).toBe('quarter to 1');
    expect(quarterWords(16 * 60 + 20)).toBeNull();
  });

  it('matches times on the face, morning or afternoon', () => {
    expect(sameClockTime(16 * 60 + 30, 4 * 60 + 30)).toBe(true);
    expect(sameClockTime(16 * 60 + 30, 16 * 60 + 35)).toBe(false);
  });
});
