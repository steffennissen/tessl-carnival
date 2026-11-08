import {
  C,
  type G,
  blend,
  circle,
  clamp01,
  face,
  fillStroke,
  horizontal,
  oval,
  rounded,
  shadow,
  vertical,
} from '../art';
import { GOLDEN, findStep, type Ingredient, type KitchenState } from '../kit';
import type { SauceOptions, SpreadArt } from '../steps/sauce';
import type { ToppingSpot } from '../steps/top';
import { artOf } from './index';

/**
 * Pizza: the dough the sauce goes on, the base the toppings go on, and what
 * goes in the oven. `drawPizza` draws it any size, for the end card too.
 */

/** Where the pizza sits while the toppings go on, seen a little from the side. */
export const PIZZA_VIEW = { x: 400, y: 335, rx: 170, ry: 80 } as const;

/** Where each topping's pieces sit around its spot. */
const PIECES = [
  [-20, -5],
  [18, -9],
  [2, 11],
] as const;

export interface PizzaLook {
  /** How much of the dough the sauce covers, 0 to 1. */
  sauce: number;
  /** The sauce's colours. Tomato if left out. */
  spread?: SpreadArt;
  cheese: boolean;
  /** The toppings that are on, on their spots in PIZZA_VIEW. */
  toppings: readonly ToppingSpot[];
  /** How baked it is: 0 raw, GOLDEN, 1 crispy. */
  baked: number;
  /** Turns the sauce swirl. */
  swirl?: number;
}

/** The sauce spread in this round, so the pizza keeps its colour from step to step. */
export function sauceIn(round: KitchenState | null): SpreadArt {
  const sauce = round && findStep<unknown, SauceOptions>(round, 'sauce');
  return artOf(sauce?.options.sauce ?? 'tomato-sauce', 'spread');
}

/**
 * A pizza centred on (x, y). With ry smaller than rx it's seen a little from
 * the side; toppings sit where their spots are on PIZZA_VIEW, scaled.
 */
export function drawPizza(g: G, x: number, y: number, rx: number, ry: number, look: PizzaLook) {
  const spread = look.spread ?? artOf('tomato-sauce', 'spread');
  const squash = ry / rx;
  const golden = look.baked / GOLDEN;
  const crisp = (look.baked - GOLDEN) / (1 - GOLDEN);
  const crust =
    look.baked <= GOLDEN
      ? blend([C.dough, C.crustGold], golden)
      : blend([C.crustGold, C.crustBrown], crisp);
  const crustLight =
    look.baked <= GOLDEN
      ? blend([C.doughLight, C.dough], golden)
      : blend([C.dough, C.crustGold], crisp);

  // The crust's side, then its top.
  shadow(g, x + 6, y + ry * 0.35 + 10 * squash, rx * 0.98, ry * 0.75);
  oval(g, x, y + 9 * squash + 2, rx, ry);
  fillStroke(g, blend([crust, C.crustBrown], 0.35), 3.5);
  oval(g, x, y, rx, ry);
  const top = g.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 4, x, y, rx);
  top.addColorStop(0, crustLight);
  top.addColorStop(1, crust);
  fillStroke(g, top, 3.5);

  // The middle, where the sauce goes.
  const inner = 0.86;
  oval(g, x, y, rx * inner, ry * inner);
  g.fillStyle = blend([C.doughLight, crustLight], 0.5);
  g.fill();
  g.strokeStyle = 'rgba(184, 114, 58, 0.35)';
  g.lineWidth = 2;
  g.stroke();

  if (look.sauce > 0) {
    const cover = 0.22 + 0.78 * clamp01(look.sauce);
    g.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const wobble = look.sauce < 1 ? 1 + Math.sin(a * 7 + (look.swirl ?? 0)) * 0.05 : 1;
      const r = cover * inner * 0.96 * wobble;
      g.lineTo(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r);
    }
    g.closePath();
    const sauce = g.createRadialGradient(x - rx * 0.2, y - ry * 0.2, 2, x, y, rx * cover);
    sauce.addColorStop(0, spread.light);
    sauce.addColorStop(1, look.baked > GOLDEN ? spread.dark : spread.main);
    g.fillStyle = sauce;
    g.fill();
    // A swirl in the sauce while it's being spread.
    if (look.swirl !== undefined) {
      g.strokeStyle = spread.swirl;
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const r = (0.2 + j * 0.22) * cover;
        g.beginPath();
        g.ellipse(x, y, rx * r, ry * r, 0, look.swirl + j * 2.1, look.swirl + j * 2.1 + 1.5);
        g.stroke();
      }
    }
  }

  if (look.cheese) {
    // Melty cheese in soft blobs, turning golden in the oven.
    const cheese =
      look.baked <= GOLDEN
        ? blend([C.cheese, C.cheeseGold], golden * 0.8)
        : blend([C.cheeseGold, C.cheeseBrown], crisp);
    g.fillStyle = cheese;
    const blobs = [
      [0, 0, 0.42],
      [-0.42, -0.2, 0.26],
      [0.42, -0.18, 0.27],
      [-0.36, 0.3, 0.27],
      [0.38, 0.3, 0.26],
      [0, -0.48, 0.24],
      [0.02, 0.5, 0.24],
      [-0.6, 0.05, 0.18],
      [0.6, 0.05, 0.18],
    ];
    for (const [bx, by, r] of blobs) {
      oval(g, x + bx * rx, y + by * ry, r * rx, r * ry);
      g.fill();
    }
    // Toasty spots once it's golden.
    if (look.baked > GOLDEN * 0.8) {
      g.fillStyle = `rgba(200, 120, 40, ${0.25 + 0.35 * clamp01(crisp)})`;
      for (const [bx, by] of [
        [-0.25, -0.1],
        [0.3, 0.12],
        [0.05, 0.32],
        [-0.45, 0.22],
        [0.2, -0.36],
      ]) {
        oval(g, x + bx * rx, y + by * ry, 0.05 * rx, 0.05 * ry);
        g.fill();
      }
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    oval(g, x - rx * 0.2, y - ry * 0.22, rx * 0.12, ry * 0.06, -0.3);
    g.fill();
  }

  // Toppings, flattened to match the pizza's tilt.
  const scale = rx / PIZZA_VIEW.rx;
  look.toppings.forEach((spot, i) => {
    const art = artOf(spot.id, 'topping');
    const nx = (spot.x - PIZZA_VIEW.x) / PIZZA_VIEW.rx;
    const ny = (spot.y - PIZZA_VIEW.y) / PIZZA_VIEW.ry;
    PIECES.forEach(([dx, dy], k) => {
      const tx = x + nx * rx + dx * scale;
      const ty = y + ny * ry + dy * scale * (squash / (PIZZA_VIEW.ry / PIZZA_VIEW.rx));
      g.save();
      g.translate(tx, ty);
      g.scale(1, Math.min(1, squash * 1.6));
      g.rotate(i + k * 2.1);
      g.scale(scale, scale);
      art.draw(g);
      g.restore();
    });
  });
}

const pizza: Ingredient = {
  id: 'pizza',
  label: 'pizza',
  icon: '🍕',
  // Sparkles when it comes out of the oven.
  colors: [C.cheeseGold, C.sauceLight, C.white],

  /** The dough on a round wooden board with a handle, seen from above. */
  sauceBase: {
    draw(g, { x: px, y: py, r: R, cover, swirl, spread }) {
      shadow(g, px + 8, py + R - 2, R + 4, 20);
      // The board's handle, then the board.
      rounded(g, px + R - 6, py - 16, 120, 32, 16);
      fillStroke(g, horizontal(g, px + R, px + R + 120, [C.wood, C.woodLight]));
      circle(g, px, py, R);
      fillStroke(g, vertical(g, py - R, py + R, [C.woodLight, C.wood]));
      const r = R - 14;
      drawPizza(g, px, py, r, r, {
        sauce: cover,
        spread,
        cheese: false,
        toppings: [],
        baked: 0,
        swirl,
      });
      // A happy face on the dough until the sauce covers it.
      if (cover < 0.4) face(g, px, py + 6, 1.1, 'happy');
    },
  },

  /** Sauced and cheesy, on an oval board, waiting for its toppings. */
  toppingBase: {
    area: PIZZA_VIEW,
    splash: [C.cheese, C.sauceLight],
    draw(g, { toppings, round }) {
      const { x, y, rx, ry } = PIZZA_VIEW;
      oval(g, x, y + 14, rx + 26, ry + 22);
      fillStroke(g, vertical(g, y - ry, y + ry + 30, [C.woodLight, C.wood]));
      drawPizza(g, x, y, rx, ry, {
        sauce: 1,
        spread: sauceIn(round),
        cheese: true,
        toppings,
        baked: 0,
      });
    },
  },

  /** In the oven with all its toppings, rising a little and bubbling while it bakes. */
  bake: {
    draw(g, { x, y, level, baking, t, round }) {
      const rise = baking ? Math.sin(t * 5) * 1.5 : 0;
      drawPizza(g, x, y + rise, 100, 34, {
        sauce: 1,
        spread: sauceIn(round),
        cheese: true,
        toppings: toppingsIn(round),
        baked: level,
      });
      // Cheese bubbles.
      if (baking) {
        for (let i = 0; i < 5; i++) {
          const phase = (t * 1.4 + i * 0.27) % 1;
          g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
          g.lineWidth = 2;
          circle(g, x - 60 + i * 30, y - 6 - phase * 18, 2 + phase * 4);
          g.stroke();
        }
      }
    },
  },
};

/** The toppings that went on in this round, or none. */
export function toppingsIn(round: KitchenState | null): readonly ToppingSpot[] {
  const top = round && findStep<{ spots: ToppingSpot[] }>(round, 'top');
  return top?.state.spots ?? [];
}

export default pizza;
