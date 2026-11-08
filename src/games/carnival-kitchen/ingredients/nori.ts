import { C, type G, clamp01, face, fillStroke, oval, palette, rounded, vertical } from '../art';
import { findStep, type Ingredient, type KitchenState } from '../kit';
import { MAT, drawBambooMat } from '../steps/roll';
import type { SpreadArt } from '../steps/sauce';
import type { ToppingSpot } from '../steps/top';
import { artOf } from './index';

/**
 * Nori: the seaweed sheet sushi is rolled in. It lies on the bamboo mat:
 * the rice is spread on it, then the fillings go on, then it's rolled up.
 * `drawSushiSheet` draws it at any stage, for the sushi roll too.
 */

/** This file's own colours: see `palette` in art.ts. */
export const NORI = palette({
  noriPale: '#8cb79c',
  nori: '#3f6b55',
  noriLight: '#5f8f73',
  noriDark: '#2e5141',
  rice: '#fffdf7',
  riceShade: '#efe8da',
});

/**
 * The sheet on the mat, the same in every sushi step: where the roll step
 * puts it, inside its MAT. (Written out, not worked out from MAT, so this
 * file never reads the step's values while the files are still loading.)
 */
export const SHEET = { x0: 257, y0: 151, x1: 543, y1: 389 } as const;
/** The nori left bare along the top, to seal the roll. */
const SEAL = 30;
/** Where the fillings go: a band across the rice. */
const FILLING = { x: 400, y: 318, rx: 128, ry: 50 } as const;

export interface SheetLook {
  /** How much of it the rice covers, 0 to 1. */
  rice: number;
  /** The rice's colours, if it isn't plain sushi rice. */
  spread?: SpreadArt;
  /** Turns a swirl in the rice while it's spread. */
  swirl?: number;
  toppings: readonly ToppingSpot[];
  /** A face on the nori until the rice covers it. */
  smile?: boolean;
}

/** One topping laid along the rice at its spot, a long strip. */
function drawFilling(g: G, spot: ToppingSpot) {
  const art = artOf(spot.id, 'topping');
  g.save();
  g.translate(spot.x, spot.y);
  g.scale(2.5, 1.8);
  art.draw(g);
  g.restore();
  face(g, spot.x, spot.y, 0.4, 'happy');
}

/** The nori sheet on the mat, filling the rectangle, with rice and fillings on it. */
export function drawSushiSheet(
  g: G,
  rect: { x0: number; y0: number; x1: number; y1: number },
  look: SheetLook,
) {
  const { x0, y0, x1, y1 } = rect;
  rounded(g, x0, y0, x1 - x0, y1 - y0, 6);
  fillStroke(g, vertical(g, y0, y1, [NORI.noriLight, NORI.nori, NORI.noriDark]), 3);
  // Faint seaweed ridges.
  g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  g.lineWidth = 2;
  for (let x = x0 + 16; x < x1; x += 22) {
    g.beginPath();
    g.moveTo(x, y0 + 4);
    g.lineTo(x + 6, y1 - 4);
    g.stroke();
  }

  const rice = clamp01(look.rice);
  if (rice > 0) {
    const top = y0 + SEAL;
    const cx = (x0 + x1) / 2;
    const cy = (top + y1) / 2;
    const reach = Math.hypot(x1 - x0, y1 - top) / 2;
    const r = 30 + (reach + 10 - 30) * rice;
    g.save();
    rounded(g, x0 + 6, top, x1 - x0 - 12, y1 - top - 6, 8);
    g.clip();
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const wobble = rice < 1 ? 1 + Math.sin(a * 6 + (look.swirl ?? 0)) * 0.06 : 1.2;
      g.lineTo(cx + Math.cos(a) * r * wobble, cy + Math.sin(a) * r * wobble);
    }
    g.closePath();
    g.fillStyle = look.spread?.main ?? NORI.rice;
    g.fill();
    g.strokeStyle = NORI.riceShade;
    g.lineWidth = 3;
    g.stroke();
    // Grains of rice.
    g.clip();
    g.fillStyle = C.white;
    g.strokeStyle = NORI.riceShade;
    g.lineWidth = 1.2;
    for (let gx = x0 + 10; gx < x1; gx += 15) {
      for (let gy = top + 6; gy < y1; gy += 11) {
        const k = gx * 7 + gy * 13;
        oval(g, gx + (k % 7) - 3, gy + (k % 5) - 2, 4.2, 2.4, (k % 10) / 3);
        g.fill();
        g.stroke();
      }
    }
    if (look.swirl !== undefined && rice < 1) {
      g.strokeStyle = look.spread?.swirl ?? NORI.riceShade;
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.beginPath();
        g.arc(cx, cy, r * (0.25 + j * 0.22), look.swirl + j * 2.1, look.swirl + j * 2.1 + 1.4);
        g.stroke();
      }
    }
    g.restore();
  }

  for (const spot of look.toppings) drawFilling(g, spot);
  if (look.smile) face(g, (x0 + x1) / 2, y0 + SEAL + 70, 1.2, 'happy');
  else if (rice >= 1 && look.toppings.length === 0)
    face(g, (x0 + x1) / 2, y0 + SEAL + 60, 1, 'joy');
}

/** The fillings that went on in this round, or none. */
export function fillingsIn(round: KitchenState | null): readonly ToppingSpot[] {
  const top = round && findStep<{ spots: ToppingSpot[] }>(round, 'top');
  return top?.state.spots ?? [];
}

const nori: Ingredient = {
  id: 'nori',
  label: 'seaweed',
  plural: 'seaweed',
  icon: '🍙',
  colors: [NORI.nori, NORI.rice],

  /** The sheet on the mat; the rice spreads out from the middle. */
  sauceBase: {
    draw(g, { cover, swirl, spread }) {
      drawBambooMat(g, MAT.x0, MAT.y0, MAT.x1, MAT.y1, () =>
        drawSushiSheet(g, SHEET, {
          rice: cover,
          spread,
          swirl,
          toppings: [],
          smile: cover < 0.35,
        }),
      );
    },
  },

  /** Covered in rice, the fillings in a band across it. */
  toppingBase: {
    area: FILLING,
    splash: [NORI.rice, C.leaf, C.yolkLight],
    draw(g, { toppings }) {
      drawBambooMat(g, MAT.x0, MAT.y0, MAT.x1, MAT.y1, () =>
        drawSushiSheet(g, SHEET, { rice: 1, toppings }),
      );
    },
  },
};

export default nori;
