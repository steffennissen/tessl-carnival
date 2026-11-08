import { C, type G, circle, fillStroke, horizontal, oval, rounded, shadow, vertical } from '../art';
import { artOf, ingredient, pluralOf } from '../ingredients';
import {
  between,
  drawGauge,
  startNeedle,
  tapNeedle,
  updateNeedle,
  type NeedleRules,
  type NeedleState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Flip: a heart swings along the heat gauge under the pan. Tap when it's in
 * the gold to flip what's cooking onto the plate. 4 goes, each a little
 * faster, each with its gold somewhere new.
 */

export interface FlipOptions extends StepBasics {
  kind: 'flip';
  /** What's flipped: an ingredient with `flip` art. */
  item: string;
  /** How many, each a little faster. 4 if left out. */
  count?: number;
}

/** How something you flip in the pan draws itself. */
export interface FlipArt {
  /**
   * Draws it in the pan, centred on the origin, about 200 wide and 90 tall.
   * `up` is whether its top side shows; the step squashes it to turn it.
   */
  drawInPan(g: G, look: { up: boolean; flipping: boolean }): void;
  /**
   * Draws one on the plate, centred on (x, y), about 120 wide; they stack up
   * 15 apart. `share` is how well it was flipped, 0 to 1.
   */
  drawOnPlate(g: G, x: number, y: number, share: number): void;
  /** Something on top of the finished stack, whose top one is at (x, y). */
  garnish?(g: G, x: number, y: number): void;
}

declare module '../kit/types' {
  interface StepKinds {
    flip: FlipOptions;
  }
  interface IngredientArt {
    flip: FlipArt;
  }
}

export const FLIP_COUNT = 4;
/** The first heart's speed in gauges a second, and how much faster each next one is. */
export const FLIP_SPEED = 0.3;
export const FLIP_SPEEDUP = 0.04;
/** The gold's middle lands somewhere between these. */
export const FLIP_LOW = 0.3;
export const FLIP_HIGH = 0.7;
export const FLIP_RULES: NeedleRules = { perfect: 0.06, zone: 0.3 };

export interface FlipState extends NeedleState {
  /** Each go's gold spot and speed. */
  goes: { target: number; speed: number }[];
}

interface FlipFx {
  flips: number;
  /** Seconds since the last flip, for the toss. */
  age: number;
}

const flip: Step<FlipOptions, FlipState, FlipFx> = {
  kind: 'flip',
  uses: (o) => [[o.item, 'flip']],

  start: (o, random) => ({
    ...startNeedle(),
    goes: Array.from({ length: o.count ?? FLIP_COUNT }, (_, i) => ({
      target: between(random, FLIP_LOW, FLIP_HIGH),
      speed: Math.round((FLIP_SPEED + i * FLIP_SPEEDUP) * 100) / 100,
    })),
  }),

  title: (o) => `Flip the ${pluralOf(ingredient(o.item))}!`,
  hint: () => ['Tap when the heart', 'is in the gold!'],
  icon: (o) => ingredient(o.item).icon,
  progress: ({ state }) => [state.goes.length, state.results.length],
  points: ({ state }) => state.points,

  press: (turn) => {
    const { goes, index } = turn.state;
    return tapNeedle(turn, goes[index].target, goes.length, FLIP_RULES) !== null;
  },

  update({ state }, dt) {
    updateNeedle(state, state.goes[state.index].speed, dt);
  },

  fx: () => ({ flips: 0, age: 9 }),

  observe({ state, fx, dt, effects }) {
    const flips = state.results.length;
    if (flips > fx.flips) {
      fx.age = 0;
      effects.sound.whoosh();
      effects.celebrate(350, 200);
    }
    fx.flips = flips;
    fx.age += dt;
  },

  draw({ g, t, state: f, options, fx, round, shape }) {
    const art = artOf(options.item, 'flip');
    const px = 350;
    const py = 250;

    // The pan, with its handle and sizzling bubbles.
    shadow(g, px + 6, py + 74, 150, 16);
    rounded(g, px + 128, py - 13, 168, 28, 14);
    fillStroke(g, horizontal(g, px + 128, px + 296, [C.hotPink, C.pink]));
    circle(g, px + 276, py + 1, 6);
    fillStroke(g, C.wallBottom, 3);
    oval(g, px, py, 150, 72);
    fillStroke(g, vertical(g, py - 72, py + 72, [C.panLight, C.pan, C.panDark]));
    oval(g, px, py - 5, 128, 56);
    const inner = g.createRadialGradient(px - 30, py - 20, 10, px, py - 5, 128);
    inner.addColorStop(0, C.pan);
    inner.addColorStop(1, C.panDark);
    g.fillStyle = inner;
    g.fill();
    for (let i = 0; i < 8; i++) {
      const phase = (t * 1.6 + i * 0.29) % 1;
      const a = i * 0.8;
      g.fillStyle = `rgba(255, 255, 255, ${0.7 * (1 - phase)})`;
      circle(g, px + Math.cos(a) * 112, py - 6 + Math.sin(a) * 46 - phase * 8, 2 + phase * 2);
      g.fill();
    }

    const flipping = fx.age < 0.6;
    const goes = f.goes;
    const waiting = f.index < goes.length && round.phase === 'playing';
    if (flipping || waiting) {
      const p = flipping ? fx.age / 0.6 : 0;
      const lift = flipping ? -Math.sin(Math.PI * p) * 140 : 0;
      const turn = flipping ? Math.cos(Math.PI * 2 * p) : 1;
      g.save();
      g.translate(px, py - 8 + lift);
      g.rotate(flipping ? Math.sin(Math.PI * p) * 0.3 : 0);
      g.scale(1, Math.max(0.1, Math.abs(turn)));
      art.drawInPan(g, { up: turn >= 0, flipping });
      g.restore();
    }

    // The plate, stacking up what you've flipped. A tall canvas is too
    // narrow for it beside the pan, so it goes above the handle.
    const tall = shape === 'tall';
    const sx = tall ? 590 : 700;
    const sy = tall ? 175 : 372;
    oval(g, sx, sy, 76, 22);
    fillStroke(g, C.white);
    oval(g, sx, sy - 2, 56, 13);
    g.strokeStyle = C.sky;
    g.lineWidth = 3;
    g.stroke();
    const landed = f.results.length - (flipping ? 1 : 0);
    for (let i = 0; i < landed; i++) art.drawOnPlate(g, sx, sy - 10 - i * 15, f.results[i]);
    if (landed === goes.length) art.garnish?.(g, sx, sy - 10 - (landed - 1) * 15);

    drawGauge(g, t, f.needle, goes[Math.min(f.index, goes.length - 1)].target);
  },
};

export default flip;
