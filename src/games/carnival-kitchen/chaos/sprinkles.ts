import {
  C,
  CONFETTI,
  type G,
  emoji,
  fillStroke,
  oval,
  rounded,
  stickerText,
  vertical,
} from '../art';
import type { Chaos } from './rules';

/**
 * Sprinkle snow: it suddenly snows sprinkles! A bowl follows her finger (or
 * the mouse) along the bottom; catch CATCH sprinkles in it. Missed ones just
 * melt away. Cooking waits until the bowl is full, then carries on. If it
 * takes longer than SNOW_TIME, the last ones jump in by themselves.
 */

/** Sprinkles to catch. */
export const CATCH = 10;
/** Seconds between sprinkles. */
export const SNOW_GAP = 0.22;
/** Seconds of snow before the bowl fills itself up: nobody has to be quick. */
export const SNOW_TIME = 20;
/** The bowl: its rim's height, how far it reaches each side, and where it can go. */
export const SPRINKLE_BOWL = { y: 395, reach: 85, left: 200, right: 600 } as const;
/** Falling speed, scene units a second. */
const FALL: [number, number] = [120, 170];

export interface Sprinkle {
  x: number;
  y: number;
  vy: number;
  color: number;
  rot: number;
  /** Caught in the bowl, or melted past it. */
  gone: boolean;
}

export interface SprinklesState {
  bowlX: number;
  sprinkles: Sprinkle[];
  caught: number;
  age: number;
  /** Seconds until the next sprinkle. */
  next: number;
  /** Rolled once, so the snow repeats in tests. */
  seed: number;
}

/** A fraction from a sprinkle's number and the seed: where it falls, its colour, its speed. */
function roll(seed: number, n: number, k: number): number {
  const v = Math.sin(seed * 12.9898 + n * 78.233 + k * 37.719) * 43758.5453;
  return v - Math.floor(v);
}

/** Moves the bowl under x, within its bounds. */
export function aimBowl(s: SprinklesState, x: number): void {
  s.bowlX = Math.min(SPRINKLE_BOWL.right, Math.max(SPRINKLE_BOWL.left, x));
}

const sprinkles: Chaos<SprinklesState, { caught: number }> = {
  id: 'sprinkles',
  name: 'Sprinkle snow',
  fits: () => true,
  interrupts: true,
  start: (_run, random) => ({
    bowlX: 400,
    sprinkles: [],
    caught: 0,
    age: 0,
    next: 0,
    seed: random() * 1000,
  }),
  update({ state: s }, dt) {
    s.age += dt;
    s.next -= dt;
    let n = s.sprinkles.length;
    while (s.next <= 0 && s.caught < CATCH) {
      // Most fall near the bowl's side of the counter, so catching is easy.
      const x = 200 + roll(s.seed, n, 1) * 400;
      s.sprinkles.push({
        x,
        y: 70,
        vy: FALL[0] + roll(s.seed, n, 2) * (FALL[1] - FALL[0]),
        color: Math.floor(roll(s.seed, n, 3) * CONFETTI.length),
        rot: roll(s.seed, n, 4) * Math.PI,
        gone: false,
      });
      n += 1;
      s.next += SNOW_GAP;
    }
    for (const p of s.sprinkles) {
      if (p.gone) continue;
      const was = p.y;
      p.y += p.vy * dt;
      p.rot += dt * 3;
      if (was < SPRINKLE_BOWL.y && p.y >= SPRINKLE_BOWL.y) {
        if (Math.abs(p.x - s.bowlX) <= SPRINKLE_BOWL.reach && s.caught < CATCH) {
          p.gone = true;
          s.caught += 1;
        }
      }
      if (p.y > SPRINKLE_BOWL.y + 70) p.gone = true;
    }
    s.sprinkles = s.sprinkles.filter((p) => !p.gone);
    // Taking a long time? The rest jump in by themselves.
    if (s.age >= SNOW_TIME) s.caught = CATCH;
  },
  press({ state }, x) {
    aimBowl(state, x);
  },
  move({ state }, x) {
    aimBowl(state, x);
  },
  done: (s) => s.caught >= CATCH,
  says: { start: 'Wow, it is snowing sprinkles! Catch ten in the bowl!', end: 'Yummy sprinkles!' },
  bubble: (s) => [
    'Sprinkle snow!',
    CATCH - s.caught === 1 ? 'Catch one more!' : `Catch ${CATCH - s.caught} more!`,
  ],
  fx: () => ({ caught: 0 }),
  observe({ state: s, effects }, fx) {
    if (s.caught > fx.caught) {
      fx.caught = s.caught;
      effects.sound.tone(700 + s.caught * 60, 0.08, { type: 'triangle', volume: 0.1 });
      effects.burst(s.bowlX, SPRINKLE_BOWL.y - 10, 4, ['star', 'dot'], CONFETTI, 140, 300);
    }
  },
  draw({ g, state: s, t, age }) {
    for (const p of s.sprinkles) drawSprinkle(g, p.x, p.y, p.rot, CONFETTI[p.color]);
    drawBowl(g, s.bowlX, s.caught, t);
    if (age < 3) {
      // A finger shows the bowl moves.
      emoji(
        g,
        '👆',
        s.bowlX + SPRINKLE_BOWL.reach + 30 + Math.sin(t * 3) * 10,
        SPRINKLE_BOWL.y + 30,
        40,
      );
    }
  },
  solve(turn) {
    turn.state.caught = CATCH;
  },
};

/** One sprinkle: a little rounded stick. */
function drawSprinkle(g: G, x: number, y: number, rot: number, color: string) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  rounded(g, -12, -4.5, 24, 9, 4.5);
  fillStroke(g, color, 2.5);
  g.restore();
}

/** The catching bowl, its rim at SPRINKLE_BOWL.y, with how many it has caught. */
function drawBowl(g: G, x: number, caught: number, t: number) {
  const y = SPRINKLE_BOWL.y;
  const w = SPRINKLE_BOWL.reach;
  g.beginPath();
  g.ellipse(x, y, w, 56, 0, 0, Math.PI);
  g.closePath();
  fillStroke(g, vertical(g, y, y + 56, [C.pink, C.hotPink]));
  oval(g, x, y, w, 16);
  fillStroke(g, C.cream, 3.5);
  // What's in it so far, a little heap of colours.
  for (let i = 0; i < caught; i++) {
    const a = (i * 2.4) % (Math.PI * 2);
    const r = 12 + (i % 4) * 14;
    drawSprinkle(
      g,
      x + Math.cos(a) * r * 1.6,
      y + Math.sin(a) * 6 - 2,
      a + t * 0.2,
      CONFETTI[i % CONFETTI.length],
    );
  }
  stickerText(g, `${caught}/${CATCH}`, x, y + 32, 24, C.white);
}

export default sprinkles;
