import {
  C,
  type G,
  blend,
  circle,
  clamp01,
  face,
  fillStroke,
  oval,
  rounded,
  shadow,
  starPath,
  vertical,
} from '../art';
import type { Ingredient } from '../kit';
import { drawShape, faceSpot, shapeOf } from './cookies';

/**
 * Sugar cookie dough: mixed in the bowl, rolled out flat with the rolling
 * pin, then cut into shapes with the cookie cutters.
 */

/** Where the rolled-out dough sits while the cutters cut it: the roll step's outline. */
export const ROLLED = { x: 400, y: 285, rx: 180, ry: 112 } as const;
/** How big a cut-out cookie is, middle to edge. */
const CUT = 24;

/**
 * The dough from above as an oval round (x, y). `spread` 0 is a fat, lumpy
 * ball; 1 is rolled flat and smooth. The face shows unless `plain`.
 */
export function drawDoughSheet(
  g: G,
  x: number,
  y: number,
  rx: number,
  ry: number,
  spread: number,
  t: number,
  plain = false,
) {
  const thick = 4 + (1 - spread) * 16;
  // A blob that smooths out as it's rolled.
  const outline = (oy: number) => {
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const wobble = 1 + (1 - spread) * (Math.sin(a * 5 + 0.6) * 0.05 + Math.sin(a * 3) * 0.03);
      g.lineTo(x + Math.cos(a) * rx * wobble, y + oy + Math.sin(a) * ry * wobble);
    }
    g.closePath();
  };
  outline(thick);
  fillStroke(g, blend([C.dough, C.crustGold], 0.45), 3.5);
  outline(0);
  const top = g.createRadialGradient(x - rx * 0.3, y - ry * 0.45, 4, x, y, Math.max(rx, ry));
  top.addColorStop(0, C.doughLight);
  top.addColorStop(1, C.dough);
  fillStroke(g, top, 3.5);
  // A shine, and flour dusted on top.
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  oval(g, x - rx * 0.35, y - ry * 0.45, rx * 0.22, ry * 0.08, -0.25);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4 + 0.3;
    const r = 0.25 + ((i * 3) % 7) / 10;
    circle(g, x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r, 1.6 + (i % 2));
    g.fill();
  }
  if (!plain) {
    const s = Math.min(1.4, 0.7 + rx / 200);
    face(g, x, y + 4, s, spread >= 1 ? 'joy' : Math.sin(t * 2) > 0.95 ? 'wow' : 'happy');
  }
}

const cookieDough: Ingredient = {
  id: 'cookie-dough',
  label: 'cookie dough',
  plural: 'cookie dough',
  icon: '🍪',
  colors: [C.dough, C.butter, C.white],

  /** Butter, sugar and flour coming together into a soft ball of dough. */
  stirred: {
    spoon: C.dough,
    draw(g, { x: px, y: py, r, swirl, done, t }) {
      circle(g, px, py, r);
      const base = g.createRadialGradient(px - 20, py - 20, 10, px, py, r);
      base.addColorStop(0, blend([C.cream, C.doughLight], done));
      base.addColorStop(1, blend([C.cream, C.dough], done));
      g.fillStyle = base;
      g.fill();

      // Butter streaks swirling round, fading as it comes together.
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.strokeStyle = `rgba(255, 229, 138, ${0.9 * (1 - done * 0.85)})`;
        g.lineWidth = 10 - j * 2;
        g.beginPath();
        g.arc(px, py, 32 + j * 26, swirl + j * 2.1, swirl + j * 2.1 + 1.5);
        g.stroke();
      }
      // Cubes of butter and heaps of flour that melt away.
      const lumps = [
        [0.4, 70, 12, 'butter'],
        [1.6, 42, 11, 'flour'],
        [2.7, 86, 12, 'butter'],
        [3.8, 58, 13, 'flour'],
        [4.9, 80, 10, 'butter'],
        [5.8, 30, 10, 'flour'],
      ] as const;
      lumps.forEach(([a0, lr, size, kind], i) => {
        const left = 1 - done * 1.2 + i * 0.03;
        if (left <= 0) return;
        const a = a0 + swirl + t * 0.04;
        const lx = px + Math.cos(a) * lr;
        const ly = py + Math.sin(a) * lr;
        const s = size * Math.min(1, left);
        if (kind === 'butter') {
          rounded(g, lx - s, ly - s, s * 2, s * 2, s * 0.4);
          fillStroke(g, C.butter, 2);
        } else {
          circle(g, lx, ly, s);
          fillStroke(g, C.white, 2);
        }
      });
      // Sparkly sugar.
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + swirl * 0.6;
        const sr = 22 + ((i * 17) % 80);
        starPath(g, px + Math.cos(a) * sr, py + Math.sin(a) * sr, 3 + (i % 2), t + i);
        g.fillStyle = 'rgba(255, 255, 255, 0.9)';
        g.fill();
      }
      // A ball of dough gathers in the middle.
      const ball = clamp01((done - 0.35) / 0.65);
      if (ball > 0) {
        drawDoughSheet(g, px, py, 30 + ball * 45, 26 + ball * 38, 0, t, done < 1);
      }
    },
  },

  /** Rolled out flat with the rolling pin, on its floury board. */
  rollOut: {
    draw(g, { x, y, rx, ry, spread, t }) {
      drawDoughSheet(g, x, y, rx, ry, spread, t);
    },
  },

  /** Rolled flat, with a cookie cut out at every spot a cutter landed. */
  toppingBase: {
    area: ROLLED,
    splash: [C.white, C.dough, C.butter],
    draw(g, { toppings, t }) {
      const { x, y, rx, ry } = ROLLED;
      // The floury board from the rolling step.
      shadow(g, x + 8, y + ry + 30, rx + 22, 14);
      rounded(g, x - rx - 18, y - ry - 26, (rx + 18) * 2, (ry + 26) * 2, 30);
      fillStroke(g, vertical(g, y - ry - 26, y + ry + 26, [C.woodLight, C.wood]));
      drawDoughSheet(g, x, y, rx, ry, 1, t, true);
      for (const spot of toppings) {
        const shape = shapeOf(spot.id);
        // The cut: a groove round the shape, and a cookie with a happy face.
        drawShape(g, shape, spot.x, spot.y + 2, CUT, 'rgba(211, 141, 80, 0.35)', 0);
        const top = g.createRadialGradient(spot.x - 8, spot.y - 10, 1, spot.x, spot.y, CUT * 1.2);
        top.addColorStop(0, C.white);
        top.addColorStop(1, C.doughLight);
        drawShape(g, shape, spot.x, spot.y, CUT, top, 2);
        face(g, spot.x, spot.y + faceSpot(shape, CUT), CUT / 30, 'joy');
      }
      if (toppings.length === 0) face(g, x, y + 4, 1.2, 'happy');
    },
  },
};

export default cookieDough;
