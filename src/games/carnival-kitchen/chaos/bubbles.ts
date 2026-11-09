import { C, type G, circle, clamp01, emoji, fillStroke, oval } from '../art';
import type { StepRun } from '../kit';
import { NOTE } from '../sound';
import { mouthOf, type PourOptions } from '../steps/pour';
import type { Chaos } from './rules';

/**
 * Bubbling over: the pot (or bowl, or blender) bubbles over, and big
 * bubbles float up out of it. Tap each one to pop it. Cooking waits until
 * they're all popped. It only happens in steps with something to bubble
 * over: stirring, mixing, pouring and blending.
 */

/** How many bubbles come out. */
export const BUBBLES = 8;
/** Seconds between one bubble and the next coming out. */
export const BUBBLE_GAP = 0.35;
/** Seconds a bubble takes to float up to its spot. */
export const RISE_TIME = 1.1;
/** A tap this far outside a bubble (scene units) still pops it: fingers are big. */
export const POP_REACH = 26;

/**
 * Where the bubbles come from, by kind of step: the pot or bowl seen from
 * above (foam all round its rim, `ring` across), the mixing bowl from the
 * side, or the blender's top (foam along a rim `w` wide).
 */
export const SOURCES: Record<string, Source> = {
  stir: { x: 400, y: 275, ring: 150 },
  mix: { x: 400, y: 275, ring: 150 },
  pour: { x: 400, y: 330, w: 150 },
  blend: { x: 400, y: 175, w: 70 },
};

export interface Source {
  x: number;
  y: number;
  /** The rim's radius, for a pot seen from above. */
  ring?: number;
  /** Half the rim's width, for a bowl or jar seen from the side. */
  w?: number;
}

export interface Bubble {
  /** Where it floats to, and its size. */
  x: number;
  y: number;
  r: number;
  /** Seconds after the start that it comes out. */
  born: number;
  popped: boolean;
  /** For its wobble. */
  phase: number;
}

export interface BubblesState {
  /** Where they come from. */
  from: Source;
  bubbles: Bubble[];
  age: number;
}

/** Where a bubble is now, or null before it has come out. */
export function bubbleAt(s: BubblesState, b: Bubble): { x: number; y: number } | null {
  const age = s.age - b.born;
  if (age < 0) return null;
  const p = clamp01(age / RISE_TIME);
  const ease = 1 - (1 - p) * (1 - p);
  return {
    x: s.from.x + (b.x - s.from.x) * ease + Math.sin(age * 2 + b.phase) * 8 * p,
    y: s.from.y + (b.y - s.from.y) * ease + Math.cos(age * 1.6 + b.phase) * 6 * p,
  };
}

/** The bubble a tap at (x, y) pops: the nearest one out and not popped that it's on, or -1. */
export function bubbleHit(s: BubblesState, x: number, y: number): number {
  let best = -1;
  let bestDistance = Infinity;
  s.bubbles.forEach((b, i) => {
    if (b.popped) return;
    const at = bubbleAt(s, b);
    if (!at) return;
    const distance = Math.hypot(x - at.x, y - at.y);
    if (distance <= b.r + POP_REACH && distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
}

const bubbles: Chaos<BubblesState, { popped: number; out: number }> = {
  id: 'bubbles',
  name: 'Bubbling over',
  fits: (run: StepRun) => run.kind in SOURCES,
  interrupts: true,
  start(run, random) {
    let from = SOURCES[run.kind] ?? SOURCES.stir;
    const into = (run.options as Partial<PourOptions>).into;
    if (run.kind === 'pour' && into) {
      // Pouring into a pot or the blender: the foam is at its opening.
      const mouth = mouthOf(run.options as PourOptions);
      from = { x: mouth.x - 26, y: mouth.y - 8, w: into === 'blender' ? 75 : 120 };
    }
    // Spots spread over the middle of the scene, two rows of four, a little jumbled.
    const list: Bubble[] = [];
    for (let i = 0; i < BUBBLES; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      list.push({
        x: 255 + col * 97 + (random() - 0.5) * 24,
        y: 160 + row * 120 + (random() - 0.5) * 30,
        r: 36 + random() * 10,
        born: i * BUBBLE_GAP,
        popped: false,
        phase: random() * Math.PI * 2,
      });
    }
    // They come out in a jumbled order, not left to right.
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)) % (i + 1);
      [list[i].born, list[j].born] = [list[j].born, list[i].born];
    }
    return { from, bubbles: list, age: 0 };
  },
  update(turn, dt) {
    turn.state.age += dt;
  },
  press({ state: s }, x, y) {
    const i = bubbleHit(s, x, y);
    if (i >= 0) s.bubbles[i].popped = true;
  },
  done: (s) => s.bubbles.every((b) => b.popped),
  says: { start: 'Oh no, it is bubbling over! Pop the bubbles!', end: 'You popped them all!' },
  bubble: (s) => {
    const left = s.bubbles.filter((b) => !b.popped).length;
    return ['Bubbling over!', left === 1 ? 'Pop the last one!' : `Pop ${left} bubbles!`];
  },
  fx: () => ({ popped: 0, out: 0 }),
  observe({ state: s, effects }, fx) {
    const out = s.bubbles.filter((b) => s.age >= b.born).length;
    if (out > fx.out) {
      fx.out = out;
      effects.sound.tone(300 + out * 40, 0.12, {
        type: 'sine',
        volume: 0.08,
        slideTo: 600 + out * 40,
      });
    }
    s.bubbles.forEach((b, i) => {
      const bit = 1 << i;
      if (!b.popped || fx.popped & bit) return;
      fx.popped |= bit;
      const at = bubbleAt(s, b) ?? { x: b.x, y: b.y };
      effects.sound.pop();
      effects.sound.tone(NOTE.C6 + i * 60, 0.08, { type: 'triangle', volume: 0.1 });
      effects.burst(at.x, at.y, 10, ['dot', 'star'], [C.white, C.sky, C.skyLight], 220, 200);
    });
  },
  draw({ g, state: s, t }) {
    const left = s.bubbles.filter((b) => !b.popped).length;
    // Foam spilling over the top of the pot, smaller as the bubbles pop.
    drawFoam(g, s.from, t, left / BUBBLES);
    for (const b of s.bubbles) {
      if (b.popped) continue;
      const at = bubbleAt(s, b);
      if (at) drawBubble(g, at.x, at.y, b.r * clamp01((s.age - b.born) / 0.3 + 0.3), t + b.phase);
    }
    const first = s.bubbles.find((b) => !b.popped && s.age - b.born > RISE_TIME);
    if (first && s.age > BUBBLES * BUBBLE_GAP + 2) {
      const at = bubbleAt(s, first);
      if (at) emoji(g, '👆', at.x + 20, at.y + first.r + 26 + Math.sin(t * 5) * 6, 40);
    }
  },
  solve(turn) {
    turn.state.age = BUBBLES * BUBBLE_GAP + RISE_TIME;
    for (const b of turn.state.bubbles) {
      const at = bubbleAt(turn.state, b);
      if (at) bubbles.press?.(turn, at.x, at.y);
    }
  },
};

/** A shiny soap-like bubble, wobbling a little. */
function drawBubble(g: G, x: number, y: number, r: number, t: number) {
  const wobble = Math.sin(t * 4) * 0.05;
  oval(g, x, y, r * (1 + wobble), r * (1 - wobble));
  const fill = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  fill.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  fill.addColorStop(0.6, 'rgba(223, 242, 255, 0.55)');
  fill.addColorStop(1, 'rgba(205, 178, 255, 0.7)');
  fillStroke(g, fill, 3.5, C.skyDark);
  oval(g, x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.13, -0.6);
  g.fillStyle = C.white;
  g.fill();
  circle(g, x + r * 0.4, y + r * 0.35, r * 0.08);
  g.fill();
}

/** Foam bubbling over the rim, `amount` 0 to 1. */
function drawFoam(g: G, from: Source, t: number, amount: number) {
  if (amount <= 0) return;
  const { x, y, ring } = from;
  const blob = (bx: number, by: number, r: number) => {
    circle(g, bx, by, r * (0.5 + amount * 0.5));
    fillStroke(g, C.white, 3, C.skyDark);
  };
  if (ring) {
    // All the way round the pot's rim, bubbling.
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const r = ring + Math.sin(t * 3 + i * 1.7) * 5;
      blob(x + Math.cos(a) * r, y + Math.sin(a) * r, 15 + (i % 3) * 5);
    }
    return;
  }
  const w = from.w ?? 120;
  const count = Math.max(4, Math.round(w / 16));
  for (let i = 0; i <= count; i++) {
    const fx = x - w + (i * 2 * w) / count;
    blob(fx, y + Math.sin(t * 3 + i) * 4 - (i % 2) * 10, 16 + (i % 3) * 6);
  }
  // A drip down each side.
  for (const side of [-1, 1]) {
    oval(
      g,
      x + side * (w + 8),
      y + 22 + Math.sin(t * 2 + side) * 4,
      12 * amount + 4,
      24 * amount + 6,
    );
    fillStroke(g, C.white, 3, C.skyDark);
  }
}

export default bubbles;
