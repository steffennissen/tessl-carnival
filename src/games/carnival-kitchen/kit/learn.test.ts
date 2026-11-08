import { describe, expect, it } from 'vitest';
import { createState } from '../game';
import { dishById } from '../dishes';
import { seeded } from '../test-kit';
import {
  DEFAULT_SETTINGS,
  READ_PAUSE,
  SMART_BONUS,
  answer,
  autoReadDelay,
  nearChoices,
  settingsFrom,
  smartChef,
  smartSticker,
  startAnswer,
} from './learn';
import { BANNER_TIME, READ_BANNER_TIME, bannerTime } from './rules';

const round = () => createState(dishById('soup'), seeded());

describe('learning rules', () => {
  it('reads saved settings, falling back to the defaults', () => {
    expect(settingsFrom({})).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ learning: true, level: 1, readMyself: false });
    expect(settingsFrom({ learning: false, level: 2, readMyself: true })).toEqual({
      learning: false,
      level: 2,
      readMyself: true,
    });
    expect(settingsFrom({ learning: 'yes', level: 7, readMyself: 1 })).toEqual(DEFAULT_SETTINGS);
  });

  it('answers right on the first or second try with a bonus and a Smart Chef star', () => {
    const state = round();
    const a = startAnswer();
    expect(answer(state, a, false)).toBe('try again');
    expect(answer(state, a, true)).toBe('right');
    expect(a.outcome).toBe('right');
    expect(state.bonus).toBe(SMART_BONUS);
    expect(state.scores.every((s) => s === 0)).toBe(true);
    expect(smartChef(state)).toBe(true);
    // Answering again changes nothing.
    expect(answer(state, a, true)).toBe('right');
    expect(state.bonus).toBe(SMART_BONUS);
  });

  it('shows the answer after two wrong tries, never fails, and gives no star', () => {
    const state = round();
    const a = startAnswer();
    expect(answer(state, a, false)).toBe('try again');
    expect(answer(state, a, false)).toBe('show');
    expect(a.shown).toBe(true);
    expect(answer(state, a, false)).toBe('show');
    expect(answer(state, a, true)).toBe('right');
    expect(a.outcome).toBe('helped');
    expect(state.bonus).toBe(0);
    expect(smartChef(state)).toBe(false);
  });

  it('only gives the star when every question was answered on her own', () => {
    const state = round();
    expect(smartChef(state)).toBe(false);
    answer(state, startAnswer(), true);
    const second = startAnswer();
    answer(state, second, false);
    answer(state, second, false);
    answer(state, second, true);
    expect(smartChef(state)).toBe(false);
    expect(smartSticker('pizza')).toBe('smart:pizza');
  });

  it('reads questions out unless "Read it myself" is on, waiting at Level 2 when asked', () => {
    expect(autoReadDelay({ learning: true, level: 1, readMyself: false }, true)).toBeLessThan(1);
    expect(autoReadDelay({ learning: true, level: 2, readMyself: false }, true)).toBe(READ_PAUSE);
    expect(autoReadDelay({ learning: true, level: 2, readMyself: false })).toBeLessThan(1);
    expect(autoReadDelay({ learning: true, level: 1, readMyself: true })).toBeNull();
  });

  it('keeps cards up longer in "Read it myself" mode', () => {
    const state = round();
    expect(bannerTime(state)).toBe(BANNER_TIME);
    state.learn.settings = { ...state.learn.settings, readMyself: true };
    expect(bannerTime(state)).toBe(READ_BANNER_TIME);
  });

  it('offers three near choices, one right, never below the minimum', () => {
    for (let seed = 1; seed < 30; seed++) {
      for (const n of [1, 2, 5, 19]) {
        const { choices, index } = nearChoices(n, seeded(seed), 1);
        expect(choices).toHaveLength(3);
        expect(choices[index]).toBe(n);
        expect(new Set(choices).size).toBe(3);
        expect(Math.min(...choices)).toBeGreaterThanOrEqual(1);
        expect([...choices].sort((a, b) => a - b)).toEqual(choices);
      }
    }
  });
});
