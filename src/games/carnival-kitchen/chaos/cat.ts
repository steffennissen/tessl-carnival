import {
  C,
  type G,
  clamp01,
  emoji,
  face,
  fillStroke,
  heartPath,
  oval,
  palette,
  shadow,
} from '../art';
import { COUNTER_Y } from '../kit';
import type { Chaos } from './rules';

/**
 * Counter cat: a cat hops up onto the counter and sits right on the work.
 * Tap the cat PETS times to pet it: it purrs, and hops off again. Cooking
 * waits while it's there, so no timer runs out under it.
 */

const K = palette({
  fur: '#ffc98f',
  furLight: '#ffe3c2',
  stripe: '#f2a35e',
  nose: '#ff8fb1',
});

/** Pets it takes before the cat hops off, happy. */
export const PETS = 3;
/** Seconds the cat takes to hop on, and to hop off. */
export const HOP_TIME = 0.8;
/** Where the cat sits: on the counter in the middle of the work. */
export const CAT = { x: 400, y: COUNTER_Y } as const;
/** A tap this close to the middle of the cat (scene units) pets it. */
export const CAT_REACH = 115;

export interface CatState {
  phase: 'in' | 'sit' | 'out';
  /** Seconds in this phase. */
  age: number;
  pets: number;
  /** Seconds since the last pet, for her happy face and the hearts. */
  petAge: number;
  /** Which side she comes from and goes to: -1 left, 1 right. */
  side: -1 | 1;
  /** Taps that missed her, so the pointing hand shows. */
  misses: number;
}

/** Where the middle of the cat is, for petting: her body and head. */
export const catMiddle = () => ({ x: CAT.x, y: CAT.y - 70 });

/** Whether a tap at (x, y) is on the cat. */
export function onCat(x: number, y: number): boolean {
  const m = catMiddle();
  return Math.hypot(x - m.x, y - m.y) <= CAT_REACH;
}

/** Where the cat is drawn now: hopping on, sitting, or hopping off. */
export function catSpot(s: CatState): { x: number; y: number } {
  if (s.phase === 'sit') return { x: CAT.x, y: CAT.y };
  const p = clamp01(s.age / HOP_TIME);
  const along = s.phase === 'in' ? 1 - p : p;
  const x = CAT.x + s.side * 520 * along;
  const y = CAT.y - Math.sin(Math.PI * Math.min(1, along * 1.6)) * 150 * Math.min(1, along * 3);
  return { x, y };
}

const cat: Chaos<CatState, { pets: number; misses: number; meowed: boolean }> = {
  id: 'cat',
  name: 'Counter cat',
  fits: () => true,
  interrupts: true,
  start: (_run, random) => ({
    phase: 'in',
    age: 0,
    pets: 0,
    petAge: 9,
    side: random() < 0.5 ? -1 : 1,
    misses: 0,
  }),
  update({ state: s }, dt) {
    s.age += dt;
    s.petAge += dt;
    if (s.phase === 'in' && s.age >= HOP_TIME) {
      s.phase = 'sit';
      s.age = 0;
    }
  },
  press({ state: s }, x, y) {
    if (s.phase === 'out') return;
    if (!onCat(x, y)) {
      s.misses += 1;
      return;
    }
    s.pets += 1;
    s.petAge = 0;
    if (s.pets >= PETS) {
      // One last happy purr first, then off she hops.
      s.phase = 'out';
      s.age = -0.6;
    }
  },
  done: (s) => s.phase === 'out' && s.age >= HOP_TIME,
  says: { start: 'Oh! A kitty on the counter! Pet her three times!', end: 'Bye bye, kitty!' },
  bubble: (s) =>
    s.pets >= PETS
      ? ['Purr purr!', 'She loves you!']
      : ['A kitty! Tap her', `${PETS - s.pets} more ${PETS - s.pets === 1 ? 'time' : 'times'}!`],
  fx: () => ({ pets: 0, misses: 0, meowed: false }),
  observe({ state: s, effects }, fx) {
    if (!fx.meowed) {
      fx.meowed = true;
      // Meow!
      effects.sound.tone(760, 0.32, { type: 'triangle', volume: 0.12, slideTo: 520 });
    }
    if (s.pets > fx.pets) {
      fx.pets = s.pets;
      const m = catMiddle();
      effects.burst(m.x, m.y - 40, 8, ['heart'], [C.hotPink, C.pink, C.lavender], 180, 120);
      // A purr: a low rumble that wobbles.
      for (let i = 0; i < 4; i++) {
        effects.sound.tone(58 + (i % 2) * 6, 0.12, {
          type: 'sawtooth',
          volume: 0.05,
          delay: i * 0.12,
        });
      }
    }
    if (s.misses > fx.misses) {
      fx.misses = s.misses;
      effects.sound.boop();
    }
  },
  draw({ g, state: s, t }) {
    const at = catSpot(s);
    const happy = s.petAge < 1 || s.pets >= PETS;
    const sitting = s.phase === 'sit' || (s.phase === 'out' && s.age < 0);
    if (sitting) shadow(g, at.x, CAT.y + 4, 80, 12);
    drawCat(g, at.x, at.y, t, happy, s.side, s.petAge);
    if (sitting && s.pets < PETS && (s.misses > 0 || s.age > 2.5)) {
      // A finger points at her, gently.
      emoji(g, '👆', at.x + 105, at.y - 30 + Math.sin(t * 5) * 6, 46);
    }
  },
  solve(turn) {
    const m = catMiddle();
    turn.state.phase = 'sit';
    for (let i = 0; i < PETS; i++) cat.press?.(turn, m.x, m.y);
    turn.state.age = HOP_TIME;
  },
};

/**
 * A round, friendly orange cat sitting with her bottom at (x, y): a body,
 * a curly tail, a head with ears and a face. `happy` closes her eyes in a
 * purr; `side` is where she faces from.
 */
function drawCat(
  g: G,
  x: number,
  y: number,
  t: number,
  happy: boolean,
  side: -1 | 1,
  petAge: number,
) {
  g.save();
  g.translate(x, y);
  // A squish when she's petted.
  const squish = petAge < 0.3 ? 1 - Math.sin((petAge / 0.3) * Math.PI) * 0.08 : 1;
  g.scale(1 + (1 - squish), squish);

  // The tail, swishing.
  const swish = Math.sin(t * (happy ? 7 : 3)) * 18;
  g.beginPath();
  g.moveTo(-side * 50, -16);
  g.quadraticCurveTo(-side * 110, -10 + swish, -side * 95, -80 + swish);
  g.lineWidth = 20;
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.stroke();
  g.lineWidth = 13;
  g.strokeStyle = K.fur;
  g.stroke();

  // Body.
  oval(g, 0, -48, 64, 52);
  fillStroke(g, K.fur, 4);
  oval(g, 0, -36, 36, 34);
  g.fillStyle = K.furLight;
  g.fill();
  // Paws.
  for (const px of [-24, 24]) {
    oval(g, px, -6, 16, 10);
    fillStroke(g, K.furLight, 3.5);
  }
  // Stripes on her back.
  g.strokeStyle = K.stripe;
  g.lineWidth = 5;
  for (const sx of [-44, 44]) {
    g.beginPath();
    g.moveTo(sx, -70);
    g.lineTo(sx * 0.82, -56);
    g.stroke();
  }

  // Head.
  g.translate(0, -112 + Math.sin(t * 2) * 2);
  for (const ex of [-1, 1]) {
    g.beginPath();
    g.moveTo(ex * 44, -12);
    g.lineTo(ex * 40, -58);
    g.lineTo(ex * 10, -36);
    g.closePath();
    fillStroke(g, K.fur, 4);
    g.beginPath();
    g.moveTo(ex * 36, -22);
    g.lineTo(ex * 36, -46);
    g.lineTo(ex * 18, -34);
    g.closePath();
    g.fillStyle = K.nose;
    g.fill();
  }
  oval(g, 0, 0, 52, 42);
  fillStroke(g, K.fur, 4);
  face(g, 0, 2, 1.25, happy ? 'joy' : 'happy');
  // Nose and whiskers.
  oval(g, 0, 8, 5, 3.5);
  g.fillStyle = K.nose;
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  for (const wx of [-1, 1]) {
    for (const wy of [-3, 4]) {
      g.beginPath();
      g.moveTo(wx * 30, 10 + wy * 0.5);
      g.lineTo(wx * 58, 6 + wy * 1.6);
      g.stroke();
    }
  }
  if (happy) {
    // A little heart above her head.
    heartPath(g, 0, -64 - Math.min(1, petAge) * 16, 12);
    fillStroke(g, C.hotPink, 3);
  }
  g.restore();
}

export default cat;
