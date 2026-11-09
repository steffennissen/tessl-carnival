import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, press, release, tick } from '../game';
import { currentTurn } from '../kit';
import {
  cssScale,
  current,
  drawRound,
  keepClear,
  overlaps,
  playThrough,
  ready,
  seeded,
} from '../test-kit';
import {
  BLOW_TIME,
  FAR_SHARE,
  LIT_PAUSE,
  PARTY_CANDLES,
  PARTY_TIME,
  PUFF,
  blowButton,
  flameOf,
  solveParty,
  type PartyState,
} from './party';

const party = current<PartyState>;
type Round = ReturnType<typeof ready>;

/** Taps each candle's wick in turn. */
function lightAll(state: Round) {
  for (const c of party(state).candles) {
    const f = flameOf(c);
    press(state, f.x, f.y);
    release(state);
  }
}

describe('party', () => {
  it('puts the candles on the cupcake, and lights one per tap', () => {
    const state = ready('cupcakes', 'party');
    const s = party(state);
    expect(s.candles).toHaveLength(PARTY_CANDLES);
    for (const c of s.candles) {
      expect(c.x).toBeGreaterThan(300);
      expect(c.x).toBeLessThan(500);
    }
    const f = flameOf(s.candles[2]);
    press(state, f.x, f.y);
    expect(s.candles.map((c) => c.lit)).toEqual([false, false, true, false]);
    expect(s.results).toEqual([1]);
  });

  it('lights the nearest candle even from far away, for a little less', () => {
    const state = ready('cupcakes', 'party');
    const s = party(state);
    press(state, 700, 450);
    expect(s.candles.filter((c) => c.lit)).toHaveLength(1);
    expect(s.results).toEqual([FAR_SHARE]);
  });

  it('blows them out with taps or a hold, then the friends sing and the dish is done', () => {
    const state = ready('cupcakes', 'party');
    const s = party(state);
    lightAll(state);
    expect(s.phase).toBe('blow');
    // Not straight away: a moment to see them all lit.
    expect(press(state, 400, 300)).toBe(false);
    tick(state, LIT_PAUSE);
    press(state, 400, 300);
    release(state);
    expect(s.blow).toBeCloseTo(PUFF);
    expect(s.candles.some((c) => c.out)).toBe(true);
    press(state, 600, 360);
    tick(state, BLOW_TIME);
    expect(s.phase).toBe('party');
    expect(s.candles.every((c) => c.out)).toBe(true);
    expect(state.phase).toBe('playing');
    tick(state, PARTY_TIME);
    expect(state.phase).toBe('over');
    expect(state.scores[5]).toBe(100);
  });

  it('solves to full marks, for tests', () => {
    const state = ready('cupcakes', 'party');
    solveParty(currentTurn(state) as never);
    tick(state, PARTY_TIME);
    expect(state.scores[5]).toBe(100);
  });

  it('has a Blow! button at least 60 CSS pixels across on a phone, clear of everything', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const b = blowButton(shape);
      if (shape !== 'page') expect(b.r * 2 * cssScale(shape)).toBeGreaterThanOrEqual(60);
      const box = { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
      for (const clear of keepClear(shape, PARTY_CANDLES + 1)) {
        expect(overlaps(box, clear), shape).toBe(false);
      }
    }
  });

  it('cooks and draws to the end in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = createState(dishById('cupcakes'), seeded(6));
      const memory = new Map();
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      expect(state.phase).toBe('over');
      for (let i = 0; i < 40; i++) drawRound(state, memory, 0.05, shape);
    }
  });
});
