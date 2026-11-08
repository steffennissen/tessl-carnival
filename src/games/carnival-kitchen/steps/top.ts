import { C, type G, circle, clamp01, face, fillStroke, oval, shadow, starPath } from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  FLOAT_START,
  drawFallArrows,
  drawGlowLane,
  drawOrderNote,
  floatProgress,
  shuffle,
  startFloat,
  tapFloat,
  updateFloat,
  type FloatRules,
  type FloatState,
  type KitchenState,
  type Order,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Top: toppings float across one at a time, each a little faster, and you
 * tap when each is over its sparkly spot on the base. Every topping in
 * `always` goes on, plus extras picked at random to make `count`, each on its
 * own random spot.
 */

export interface TopOptions extends StepBasics {
  kind: 'top';
  /** What they go on: an ingredient with `toppingBase` art, such as 'pizza'. */
  base: string;
  /** Toppings that always go on: ingredients with `topping` art. */
  always?: string[];
  /** Toppings to pick the rest from, at random. */
  extras: string[];
  /** How many toppings in all. */
  count: number;
  /** An order ticket this step fills: its note is pinned up, ticking off what's on. */
  order?: Order;
}

/** One piece of a topping. */
export interface ToppingArt {
  /**
   * Draws one piece centred on the origin, about 26 across. The step scales
   * it up to float across, and the base scales it to fit.
   */
  draw(g: G): void;
  /** Where its face goes on the floating piece, down from the middle. 0 if left out. */
  faceY?: number;
  /** A ring with a hole (olive, pepper): the face goes on a little sign above. */
  ring?: boolean;
}

/** A topping on its spot, in scene units. */
export interface ToppingSpot {
  /** The topping's ingredient id. */
  id: string;
  x: number;
  y: number;
  /**
   * One piece, not a little heap of them, so the toppings can be counted
   * (an order ticket). Bases that draw a heap per topping draw just one.
   */
  single?: boolean;
}

/** Something toppings go on. */
export interface ToppingBaseArt {
  /**
   * Where it sits while the toppings go on, in scene units: an oval round
   * (x, y). The spots are picked inside it, well clear of the edge.
   */
  area: { x: number; y: number; rx: number; ry: number };
  /** Draws it at `area`, with these toppings on (sauce, cheese and all). */
  draw(g: G, look: { toppings: readonly ToppingSpot[]; t: number; round: KitchenState }): void;
  /** Colours that splash up as a topping lands. */
  splash: string[];
}

declare module '../kit/types' {
  interface StepKinds {
    top: TopOptions;
  }
  interface IngredientArt {
    topping: ToppingArt;
    toppingBase: ToppingBaseArt;
  }
}

/** The first topping's speed in pixels a second, and how much faster each next one is. */
export const TOPPING_SPEED = 90;
export const TOPPING_SPEEDUP = 8;
/** Spots stay this far inside the area (as a share of its radius), clear of the crust. */
export const SPOT_REACH = 0.62;
/** Spots keep at least this far apart (as a share of the radius), so toppings don't pile up. */
export const SPOT_GAP = 0.42;
export const TOP_RULES: FloatRules = { perfect: 20, miss: 100 };
/** Where the floating topping is. */
const FLOAT_Y = 165;

export interface TopState extends FloatState {
  /** Each topping, in the order they float across, with its spot and speed. */
  spots: (ToppingSpot & { speed: number })[];
}

interface TopFx {
  tops: number;
  prevX: number;
  drop: { x: number; index: number; age: number } | null;
}

/** Random spots in an area, spread out so toppings don't land on each other. */
export function spotsIn(
  area: ToppingBaseArt['area'],
  count: number,
  random: () => number,
): { x: number; y: number }[] {
  const spots: { nx: number; ny: number }[] = [];
  for (let tries = 0; spots.length < count && tries < 400; tries++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * SPOT_REACH;
    const spot = { nx: Math.cos(a) * r, ny: Math.sin(a) * r };
    // Late on, take any spot rather than loop forever.
    const gap = tries < 300 ? SPOT_GAP : 0;
    if (spots.every((o) => Math.hypot(o.nx - spot.nx, o.ny - spot.ny) >= gap)) spots.push(spot);
  }
  return spots.map(({ nx, ny }) => ({
    x: Math.round(area.x + nx * area.rx),
    y: Math.round(area.y + ny * area.ry),
  }));
}

/** One piece of a topping at (x, y), scaled by `s` and turned by `rot`. */
export function drawPiece(g: G, art: ToppingArt, x: number, y: number, s: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  art.draw(g);
  g.restore();
}

const top: Step<TopOptions, TopState, TopFx> = {
  kind: 'top',
  uses: (o) => [
    [o.base, 'toppingBase'],
    ...[...(o.always ?? []), ...o.extras].map((id): [string, 'topping'] => [id, 'topping']),
  ],

  start(o, random) {
    const always = o.always ?? [];
    const ids = shuffle(
      [...always, ...shuffle(o.extras, random).slice(0, o.count - always.length)],
      random,
    );
    const spots = spotsIn(artOf(o.base, 'toppingBase').area, o.count, random);
    return {
      ...startFloat(),
      spots: ids.map((id, i) => ({
        id,
        ...spots[i],
        speed: TOPPING_SPEED + i * TOPPING_SPEEDUP,
        ...(o.order ? { single: true } : {}),
      })),
    };
  },

  title: () => 'Add the toppings!',
  hint: () => ['Tap when it is over', 'the sparkly spot!'],
  icon: (o) => ingredient([...o.extras, ...(o.always ?? [])][0]).icon,
  progress: ({ state }) => floatProgress(state, state.spots.length),
  points: ({ state }) => state.points,

  press: (turn) => {
    const { spots, index } = turn.state;
    return tapFloat(turn, spots[index].x, spots.length, TOP_RULES) !== null;
  },

  update({ state }, dt) {
    updateFloat(state, state.spots[state.index].speed, dt);
  },

  fx: () => ({ tops: 0, prevX: FLOAT_START, drop: null }),

  observe({ state, options, fx, dt, effects }) {
    const tops = state.results.length;
    if (tops > fx.tops) {
      fx.drop = { x: fx.prevX, index: tops - 1, age: 0 };
      effects.sound.whoosh();
    }
    fx.tops = tops;

    // A falling topping lands on its spot with a little splat.
    if (fx.drop) {
      fx.drop.age += dt;
      if (fx.drop.age >= 0.3) {
        const spot = state.spots[fx.drop.index];
        effects.sound.pop();
        effects.burst(spot.x, spot.y, 6, ['dot'], artOf(options.base, 'toppingBase').splash, 150);
        effects.celebrate(spot.x, spot.y - 20);
        fx.drop = null;
      }
    }
    fx.prevX = state.x;
  },

  draw({ g, t, state: top, options, fx, taking, round, shape }) {
    const spots = top.spots;
    const placed = top.results.length - (fx.drop ? 1 : 0);
    // The order's note, while it's being filled (not in a picture of it later).
    if (options.order && taking) {
      drawOrderNote(
        g,
        options.order,
        spots.slice(0, placed).map((s) => s.id),
        t,
        shape,
      );
    }
    artOf(options.base, 'toppingBase').draw(g, { toppings: spots.slice(0, placed), t, round });

    const active = taking && top.index < spots.length;
    if (active) {
      const spot = spots[top.index];
      const perfect = TOP_RULES.perfect;
      // A glowing lane down to the spot, and a sparkly ring on the base.
      drawGlowLane(g, t, spot.x, perfect + 8, 128, spot.y - 128);
      g.setLineDash([8, 7]);
      g.lineDashOffset = -t * 30;
      g.lineWidth = 4;
      g.strokeStyle = C.gold;
      oval(g, spot.x, spot.y, 30 + Math.sin(t * 6) * 2, 15 + Math.sin(t * 6));
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      for (const [sx, sy, r] of [
        [-36, -12, 7],
        [34, -16, 6],
        [0, -26, 5],
      ]) {
        starPath(g, spot.x + sx, spot.y + sy, r + Math.sin(t * 7 + sx) * 1.5, t * 2);
        fillStroke(g, C.gold, 2);
      }
      drawFallArrows(g, t, spot.x, 220, spot.y - 260, 2);
    }

    const drawFloating = (id: string, x: number, y: number, rot: number, near: boolean) => {
      const art = artOf(id, 'topping');
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      drawPiece(g, art, 0, 0, 2.6);
      if (art.ring) {
        // Rings have a hole in the middle, so the face sits on a little sign.
        circle(g, 0, -40, 15);
        fillStroke(g, C.white, 2.5);
        face(g, 0, -40, 0.55, near ? 'wow' : 'happy');
      } else {
        face(g, 0, art.faceY ?? 0, 0.75, near ? 'wow' : 'happy');
      }
      g.restore();
    };

    if (fx.drop) {
      const spot = spots[fx.drop.index];
      const p = clamp01(fx.drop.age / 0.3);
      const dx = fx.drop.x + (spot.x - fx.drop.x) * p;
      const dy = FLOAT_Y + (spot.y - FLOAT_Y) * p * p;
      const s = 1 - p * 0.55;
      g.save();
      g.translate(dx, dy);
      g.scale(s, s);
      drawFloating(spot.id, 0, 0, p * 3, true);
      g.restore();
    }
    if (active) {
      const spot = spots[top.index];
      const near = Math.abs(top.x - spot.x) <= TOP_RULES.perfect + 10;
      shadow(g, top.x, 238, 26, 6);
      drawFloating(spot.id, top.x, FLOAT_Y + Math.sin(t * 4) * 6, Math.sin(t * 3) * 0.15, near);
    }
  },
};

export default top;
