import { C, type G, type Mood, clamp01, easeOutBack, fillStroke, oval, starPath } from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  STEP_POINTS,
  accuracy,
  drawFallArrows,
  drawGlowLane,
  drawOrderNote,
  finishStep,
  scoreAction,
  type Order,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Stack: build a tower. Each layer (a bun, a patty, a scoop of ice cream...)
 * swings gently from side to side above the stack, and you tap to drop it.
 * It lands on the stack and scores by how near the middle it was. Every layer
 * sticks, however far off: an off-centre one just scores less and leans out,
 * and the tower wobbles more. Each layer swings a little faster.
 */

export interface StackOptions extends StepBasics {
  kind: 'stack';
  /** What the tower stands on: an ingredient with `stackBase` art (a plate, a sundae glass). */
  base: string;
  /** The layers, bottom first: ingredients with `stack` art. One may come twice (a bun). */
  layers: string[];
  /** An order ticket this step fills: its note is pinned up, ticking off what's on. */
  order?: Order;
}

/** One layer of a tower. */
export interface StackArt {
  /**
   * Its width, and how much it adds to the tower's height. `top` is whether
   * it's the tower's last layer, which caps it (a bun's dome).
   */
  size(top: boolean): { w: number; h: number };
  /**
   * Draws it with the middle of its bottom at the origin, about `h` tall
   * (it may bulge above that, under the next layer). `mood` is for a face,
   * if it has one.
   */
  draw(g: G, look: { top: boolean; mood: Mood; t: number }): void;
}

/** What a tower stands on. */
export interface StackBaseArt {
  /** How far above the base's foot the first layer sits. */
  top: number;
  /** Draws it with the middle of its foot at the origin. */
  draw(g: G, t: number): void;
  /** Anything in front of the first layer, such as a glass's rim. */
  drawFront?(g: G, t: number): void;
}

declare module '../kit/types' {
  interface StepKinds {
    stack: StackOptions;
  }
  interface IngredientArt {
    stack: StackArt;
    stackBase: StackBaseArt;
  }
}

/** Where the tower stands: the middle of the base's foot. */
export const STACK_X = 400;
export const STACK_Y = 410;
/** How far either side of the middle a layer swings. */
export const SWING = 120;
/** Where a swinging layer's bottom is, unless the tower is taller. */
export const SWING_Y = 215;
/** The first layer's swing in radians a second, and how much faster each next one is. */
export const STACK_SPEED = 0.9;
export const STACK_SPEEDUP = 0.12;
/** Within `perfect` px of the middle scores in full, falling to nothing at `miss`. */
export const STACK_RULES = { perfect: 20, miss: 130 } as const;
/** Seconds after a drop before the next layer swings in. Taps meanwhile are "Not yet!". */
export const STACK_WAIT = 0.45;
/** How far a layer leans out for how far off it landed, and the most it leans. */
export const LEAN = 0.35;
export const MAX_LEAN = 24;
/** Seconds a dropped layer takes to fall. */
const DROP_TIME = 0.3;

export interface StackState {
  /** Each layer, in order, with its swing speed. */
  layers: { id: string; speed: number }[];
  /** Where the swing is: the layer is at STACK_X + SWING × sin(phase). */
  phase: number;
  /** Which layer is swinging; the count once they're all on. */
  index: number;
  /** How far from the middle each layer was dropped, in px (left is negative). */
  offsets: number[];
  /** Each drop's share of its points, 0 to 1. */
  results: number[];
  points: number;
  /** Seconds until the next layer swings in. */
  wait: number;
}

/** A layer's swing starts at an edge, left and right in turn. */
const startPhase = (index: number) => (index % 2 === 0 ? -Math.PI / 2 : Math.PI / 2);

/** Where the swinging layer is. */
export function swingX(state: StackState): number {
  return STACK_X + SWING * Math.sin(state.phase);
}

/** How far a layer dropped `offset` from the middle leans out on the tower. */
export function leanOf(offset: number): number {
  return Math.max(-MAX_LEAN, Math.min(MAX_LEAN, offset * LEAN));
}

export function startStack(options: StackOptions): StackState {
  return {
    layers: options.layers.map((id, i) => ({
      id,
      speed: Math.round((STACK_SPEED + i * STACK_SPEEDUP) * 100) / 100,
    })),
    phase: startPhase(0),
    index: 0,
    offsets: [],
    results: [],
    points: 0,
    wait: 0,
  };
}

/**
 * Drops the swinging layer. It always sticks, scoring by how near the middle
 * it was. Returns the points, or null while the next layer is still on its
 * way ("Not yet!").
 */
export function dropLayer(turn: Turn<StackOptions, StackState>): number | null {
  const s = turn.state;
  if (s.wait > 0 || s.index >= s.layers.length) return null;
  const offset = swingX(s) - STACK_X;
  const share = accuracy(Math.abs(offset), STACK_RULES.perfect, STACK_RULES.miss);
  const points = scoreAction(turn.round, share, STEP_POINTS / s.layers.length);
  s.offsets.push(offset);
  s.results.push(share);
  s.points += points;
  s.index += 1;
  s.wait = STACK_WAIT;
  s.phase = startPhase(s.index);
  if (s.index === s.layers.length) finishStep(turn.round, s.points);
  return points;
}

/** Swings the layer; waits first if one was just dropped. */
export function updateStack(state: StackState, dt: number): void {
  const waited = Math.min(state.wait, dt);
  state.wait -= waited;
  if (state.wait > 0) return;
  const layer = state.layers[state.index];
  if (layer) state.phase += layer.speed * (dt - waited);
}

/** A layer on a tower, for drawing: its ingredient, and how far it leans out. */
export interface StackedLayer {
  id: string;
  lean: number;
}

export interface StackLook {
  t: number;
  /** How much it wobbles: 0 still, 1 a good wobble. */
  wobble: number;
  /** How many layers the finished tower has; the last one caps it. */
  total: number;
  /** The face on each layer; happy if left out. */
  mood?: (index: number) => Mood;
  /** Squashes one layer as it lands, by `amount` 0 to 1. */
  squash?: { index: number; amount: number };
}

/**
 * Draws a tower: `base` with its foot's middle at (x, y), and `layers` on it,
 * bottom first. Dishes use it for their end cards (scale the context first).
 * Returns the y of the tower's top.
 */
export function drawStack(
  g: G,
  x: number,
  y: number,
  base: string,
  layers: readonly StackedLayer[],
  look: StackLook,
): number {
  const baseArt = artOf(base, 'stackBase');
  g.save();
  g.translate(x, y);
  baseArt.draw(g, look.t);
  let bottom = -baseArt.top;
  const total = Math.max(look.total, layers.length, 1);
  layers.forEach((layer, i) => {
    const art = artOf(layer.id, 'stack');
    const top = i === total - 1;
    const frac = (i + 1) / total;
    const sway = Math.sin(look.t * 6.5 - i * 0.4) * look.wobble * frac;
    g.save();
    g.translate(layer.lean + sway * 9, bottom);
    g.rotate(sway * 0.05);
    if (look.squash?.index === i) {
      const a = clamp01(look.squash.amount);
      g.scale(1 + a * 0.22, 1 - a * 0.3);
    }
    art.draw(g, { top, mood: look.mood?.(i) ?? 'happy', t: look.t });
    g.restore();
    bottom -= art.size(top).h;
  });
  baseArt.drawFront?.(g, look.t);
  g.restore();
  return y + bottom;
}

/** Where each layer's bottom goes on the tower, in scene units. */
export function layerBottoms(options: StackOptions): number[] {
  let y = STACK_Y - artOf(options.base, 'stackBase').top;
  return options.layers.map((id, i) => {
    const bottom = y;
    y -= artOf(id, 'stack').size(i === options.layers.length - 1).h;
    return bottom;
  });
}

/** Where the swinging layer's bottom is: above the tower, however tall it is. */
function swingY(bottoms: readonly number[], index: number): number {
  const i = Math.min(index, bottoms.length - 1);
  return Math.min(SWING_Y, (bottoms[i] ?? STACK_Y) - 64);
}

interface StackFx {
  count: number;
  prevX: number;
  prevY: number;
  /** A layer still falling onto the tower. */
  drop: { x: number; y: number; index: number; age: number } | null;
  wobble: number;
  /** Seconds since the last layer landed, and which it was. */
  landAge: number;
  landIndex: number;
}

const stack: Step<StackOptions, StackState, StackFx> = {
  kind: 'stack',
  uses: (o) => [[o.base, 'stackBase'], ...o.layers.map((id): [string, 'stack'] => [id, 'stack'])],

  start: (o) => startStack(o),

  title: () => 'Stack it up!',
  hint: () => ['Tap to drop it', 'in the middle!'],
  icon: (o) => ingredient(o.base).icon,
  progress: ({ state }) => [state.layers.length, state.results.length],
  points: ({ state }) => state.points,

  press: (turn) => dropLayer(turn) !== null,
  update: ({ state }, dt) => updateStack(state, dt),

  fx: () => ({
    count: 0,
    prevX: STACK_X,
    prevY: SWING_Y,
    drop: null,
    wobble: 0,
    landAge: 9,
    landIndex: -1,
  }),

  observe({ state: s, options, fx, dt, effects }) {
    const bottoms = layerBottoms(options);
    const count = s.results.length;
    if (count > fx.count) {
      fx.drop = { x: fx.prevX, y: fx.prevY, index: count - 1, age: 0 };
      effects.sound.whoosh();
      effects.calm();
    }
    fx.count = count;

    // A falling layer lands with a squishy plop, and the tower wobbles.
    if (fx.drop) {
      fx.drop.age += dt;
      if (fx.drop.age >= DROP_TIME) {
        const i = fx.drop.index;
        const offset = s.offsets[i];
        const x = STACK_X + leanOf(offset);
        effects.sound.pop();
        effects.sound.tone(330, 0.2, { type: 'sine', volume: 0.16, slideTo: 150 });
        effects.burst(
          x,
          bottoms[i] - 10,
          8,
          ['dot', 'heart'],
          ingredient(s.layers[i].id).colors,
          190,
        );
        effects.celebrate(x, bottoms[i] - 40);
        fx.wobble = Math.min(1.3, Math.max(fx.wobble, 0.45 + Math.abs(offset) / 70));
        fx.landAge = 0;
        fx.landIndex = i;
        fx.drop = null;
      }
    }
    fx.wobble *= Math.exp(-dt * 1.5);
    fx.landAge += dt;
    fx.prevX = swingX(s);
    fx.prevY = swingY(bottoms, s.index);
  },

  draw({ g, t, state: s, options, fx, taking, round, shape }) {
    const bottoms = layerBottoms(options);
    const total = s.layers.length;
    const landed = s.results.length - (fx.drop ? 1 : 0);
    const swinging = round.phase === 'playing' && s.index < total;
    const sy = swingY(bottoms, s.index);
    const towerTop = bottoms[Math.min(landed, total - 1)];
    // The order's note, while it's being filled (not in a picture of it later).
    if (options.order && taking) {
      drawOrderNote(
        g,
        options.order,
        s.layers.slice(0, landed).map((l) => l.id),
        t,
        shape,
      );
    }

    // A glowing lane down the middle, where the layers should drop.
    if (taking && swinging) {
      drawGlowLane(g, t, STACK_X, STACK_RULES.perfect + 10, sy - 70, towerTop - sy + 64);
    }

    const squashT = fx.landAge / 0.3;
    drawStack(
      g,
      STACK_X,
      STACK_Y,
      options.base,
      s.offsets.slice(0, landed).map((offset, i) => ({ id: s.layers[i].id, lean: leanOf(offset) })),
      {
        t,
        wobble: fx.wobble + 0.08,
        total,
        mood: (i) => (i === fx.landIndex && fx.landAge < 0.9 ? 'joy' : 'happy'),
        squash:
          squashT < 1 ? { index: fx.landIndex, amount: Math.sin(squashT * Math.PI) } : undefined,
      },
    );

    // The swinging layer, popping in after each drop, with a dotted line down
    // to show where it would land.
    if (swinging) {
      const art = artOf(s.layers[s.index].id, 'stack');
      const x = swingX(s);
      const near = Math.abs(x - STACK_X) <= STACK_RULES.perfect + 8;
      if (taking && s.wait === 0) {
        g.setLineDash([0.1, 10]);
        g.lineCap = 'round';
        g.lineWidth = 5;
        g.strokeStyle = near ? C.gold : 'rgba(255, 255, 255, 0.9)';
        g.beginPath();
        g.moveTo(x, sy + 12);
        g.lineTo(x, towerTop - 6);
        g.stroke();
        g.setLineDash([]);
        drawFallArrows(g, t, STACK_X, sy + 20, Math.max(10, towerTop - sy - 50), 2);
        // A sparkly target on top of the tower.
        g.setLineDash([8, 7]);
        g.lineDashOffset = -t * 30;
        g.lineWidth = 4;
        g.strokeStyle = C.gold;
        oval(g, STACK_X, towerTop - 4, 44 + Math.sin(t * 6) * 2, 11);
        g.stroke();
        g.setLineDash([]);
        g.lineDashOffset = 0;
        for (const [dx, dy, r] of [
          [-56, -8, 7],
          [56, -10, 6],
        ]) {
          starPath(g, STACK_X + dx, towerTop + dy, r + Math.sin(t * 7 + dx) * 1.5, t * 2);
          fillStroke(g, C.gold, 2);
        }
      }
      const appear = easeOutBack(clamp01(1 - s.wait / STACK_WAIT));
      if (appear > 0.01) {
        g.save();
        g.translate(x, sy + Math.sin(t * 3) * 4);
        // It trails a little behind the way it's swinging.
        g.rotate(-Math.cos(s.phase) * 0.08);
        g.scale(appear, appear);
        art.draw(g, { top: s.index === total - 1, mood: near ? 'wow' : 'happy', t });
        g.restore();
      }
    }

    // A dropped layer falling onto the tower.
    if (fx.drop) {
      const i = fx.drop.index;
      const p = clamp01(fx.drop.age / DROP_TIME);
      const tx = STACK_X + leanOf(s.offsets[i]);
      g.save();
      g.translate(fx.drop.x + (tx - fx.drop.x) * p, fx.drop.y + (bottoms[i] - fx.drop.y) * p * p);
      artOf(s.layers[i].id, 'stack').draw(g, { top: i === total - 1, mood: 'wow', t });
      g.restore();
    }
  },
};

export default stack;
