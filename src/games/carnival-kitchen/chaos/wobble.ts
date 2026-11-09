import { C, type G, emoji, fillStroke, oval, rounded, shadow, vertical } from '../art';
import { COUNTER_Y } from '../kit';
import type { Chaos } from './rules';

/**
 * Wobbly table: whoops, a table leg is loose and everything on the counter
 * wobbles. Tap the wobbly leg TAPS times to push a little wedge under it, and
 * the wobbling stops. Cooking waits while it wobbles.
 */

/** Taps on the leg to fix it. */
export const TAPS = 2;
/** Seconds the wobble takes to settle once it's fixed. */
export const SETTLE_TIME = 0.6;
/** The leg: where it stands, and the box a tap on it lands in (scene units). */
export const LEG = { x: 290, top: COUNTER_Y + 14, bottom: 452 } as const;
export const LEG_BOX = { x: LEG.x - 62, y: LEG.top - 10, w: 124, h: LEG.bottom - LEG.top + 30 };

/** How far it rocks, in radians, at most. */
const ROCK = 0.035;

export interface WobbleState {
  taps: number;
  age: number;
  /** Seconds since it was fixed, or -1. */
  fixedAge: number;
  /** Taps that missed the leg, so the pointing hand shows. */
  misses: number;
}

/** Whether a tap at (x, y) is on the wobbly leg. */
export function onLeg(x: number, y: number): boolean {
  const b = LEG_BOX;
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

/** How much it wobbles, 0 to 1: all of it, half after a tap, settling once fixed. */
export function wobbleAmount(s: WobbleState): number {
  if (s.fixedAge >= 0) return 0.5 * Math.max(0, 1 - s.fixedAge / SETTLE_TIME);
  return 1 - s.taps / TAPS / 2;
}

const wobble: Chaos<WobbleState, { taps: number; misses: number; creaked: boolean }> = {
  id: 'wobble',
  name: 'Wobbly table',
  fits: () => true,
  interrupts: true,
  start: () => ({ taps: 0, age: 0, fixedAge: -1, misses: 0 }),
  update({ state: s }, dt) {
    s.age += dt;
    if (s.fixedAge >= 0) s.fixedAge += dt;
  },
  press({ state: s }, x, y) {
    if (s.fixedAge >= 0) return;
    if (!onLeg(x, y)) {
      s.misses += 1;
      return;
    }
    s.taps += 1;
    if (s.taps >= TAPS) s.fixedAge = 0;
  },
  done: (s) => s.fixedAge >= SETTLE_TIME,
  says: { start: 'Whoa, the table is wobbly! Tap the wobbly leg!', end: 'All fixed!' },
  bubble: (s) =>
    s.fixedAge >= 0
      ? ['All fixed!', 'No more wobbles!']
      : ['Wobble wobble!', s.taps === 0 ? 'Tap the table leg!' : 'Tap it once more!'],
  fx: () => ({ taps: 0, misses: 0, creaked: false }),
  observe({ state: s, effects }, fx) {
    if (!fx.creaked) {
      fx.creaked = true;
      effects.sound.tone(180, 0.4, { type: 'sawtooth', volume: 0.05, slideTo: 140 });
    }
    if (s.taps > fx.taps) {
      fx.taps = s.taps;
      // Bonk!
      effects.sound.tone(220, 0.1, { type: 'square', volume: 0.08, slideTo: 120 });
      effects.sound.hiss(0.05, { volume: 0.1, from: 900, filter: 'lowpass' });
      effects.burst(LEG.x, LEG.bottom - 10, 8, ['star', 'dot'], [C.gold, C.butter, C.white], 200);
    }
    if (s.misses > fx.misses) {
      fx.misses = s.misses;
      effects.sound.boop();
    }
  },
  tilt: (s, t) => ({ angle: Math.sin(t * 11) * ROCK * wobbleAmount(s), x: 400, y: LEG.bottom }),
  draw({ g, state: s, t }) {
    drawLeg(g, s, t);
    if (s.fixedAge < 0 && (s.misses > 0 || s.age > 2.5)) {
      emoji(g, '👆', LEG.x + 96, LEG.top + 70 + Math.sin(t * 5) * 6, 44);
    }
  },
  solve(turn) {
    for (let i = 0; i < TAPS; i++) wobble.press?.(turn, LEG.x, (LEG.top + LEG.bottom) / 2);
    turn.state.fixedAge = SETTLE_TIME;
  },
};

/** The loose leg, jiggling, with the wedge sliding in under it as it's tapped. */
function drawLeg(g: G, s: WobbleState, t: number) {
  const jiggle = Math.sin(t * 11) * 6 * wobbleAmount(s);
  const { x, top, bottom } = LEG;
  shadow(g, x, bottom + 4, 46, 8);
  g.save();
  g.translate(x, top);
  g.rotate(jiggle * 0.02);
  // The leg: a fat wooden post with a cap and a foot, a gap under it when loose.
  const gap = s.fixedAge >= 0 ? 0 : 10 - s.taps * 4;
  const h = bottom - top - gap;
  rounded(g, -20, 0, 40, h, 12);
  fillStroke(g, vertical(g, 0, h, [C.woodLight, C.wood, C.woodDark]));
  rounded(g, -30, -8, 60, 18, 9);
  fillStroke(g, C.woodLight, 3.5);
  oval(g, 0, h, 26, 8);
  fillStroke(g, C.woodDark, 3.5);
  g.restore();
  // The wedge: a little pink one, pushed further in with each tap.
  const inBy = s.fixedAge >= 0 ? 1 : s.taps / TAPS;
  const wx = x - 80 + inBy * 70;
  g.beginPath();
  g.moveTo(wx + 26, bottom + 4);
  g.lineTo(wx - 26, bottom + 4);
  g.lineTo(wx - 26, bottom - 10);
  g.closePath();
  fillStroke(g, C.pink, 3);
  if (s.fixedAge < 0) {
    // Wobble lines either side.
    g.strokeStyle = C.ink;
    g.lineWidth = 3;
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const r = 34 + k * 12 + Math.sin(t * 11) * 3;
        g.beginPath();
        g.arc(
          x,
          bottom - 30,
          r,
          side < 0 ? Math.PI * 0.85 : -Math.PI * 0.15,
          side < 0 ? Math.PI * 1.15 : Math.PI * 0.15,
        );
        g.stroke();
      }
    }
  }
}

export default wobble;
