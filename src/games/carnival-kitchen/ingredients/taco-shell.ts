import { C, type G, face, fillStroke, oval, palette, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';
import type { ToppingArt, ToppingSpot } from '../steps/top';
import { artOf } from './index';
import { drawCrumbles } from './taco-meat';

/** This file's own colours: a crunchy golden corn shell. */
const K = palette({ shell: '#f7c35f', shellLight: '#ffe3a0', shellDark: '#e0983a' });

/** Where the taco's opening is while the toppings go in. */
export const TACO_VIEW = { x: 400, y: 284, rx: 125, ry: 22 } as const;

/** Toasty speckles on the shell. */
const SPECKS = [
  [-0.55, 0.45],
  [-0.2, 0.7],
  [0.25, 0.62],
  [0.6, 0.35],
  [-0.4, 0.15],
  [0.42, 0.85],
  [-0.7, 0.75],
  [0.05, 0.35],
];

/** Where each topping's pieces sit around its spot. */
const PIECES = [
  [-18, -2],
  [17, -5],
  [0, 4],
] as const;

/** One piece of a topping at (x, y), scaled by `s` and turned by `rot`. */
function drawPiece(g: G, art: ToppingArt, x: number, y: number, s: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  art.draw(g);
  g.restore();
}

/** The shell's golden front, a half-moon hanging under the line y 0 from -r to r. */
function shellFront(g: G, r: number, depth: number, rim: number) {
  g.beginPath();
  g.moveTo(r, 0);
  g.ellipse(0, 0, r, rim, 0, 0, Math.PI);
  g.ellipse(0, 0, r, depth, 0, Math.PI, 0, true);
  g.closePath();
  fillStroke(g, vertical(g, 0, depth, [K.shellLight, K.shell, K.shellDark]), 3.5);
  g.fillStyle = 'rgba(200, 120, 40, 0.35)';
  for (const [sx, sy] of SPECKS) {
    oval(g, sx * r * 0.85, rim + sy * (depth - rim) * 0.8, r * 0.035, r * 0.022);
    g.fill();
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.5)';
  oval(g, -r * 0.55, rim + (depth - rim) * 0.25, r * 0.12, r * 0.04, 0.5);
  g.fill();
}

/** The back half of the folded shell, a half-moon under (x, y). */
function shellBack(g: G, x: number, y: number, r: number, depth: number) {
  g.beginPath();
  g.ellipse(x, y, r, depth, 0, Math.PI, 0, true);
  g.closePath();
  fillStroke(g, vertical(g, y, y + depth, [K.shell, K.shellDark]), 3.5);
}

/**
 * A taco standing up, seen from the side, centred on (x, y) with its
 * opening along y, `r` from the middle to each end, overflowing with these
 * toppings. For the end card.
 */
export function drawTaco(g: G, x: number, y: number, r: number, toppings: string[]) {
  g.save();
  g.translate(x, y);
  // The back half of the folded shell, then the meat.
  shellBack(g, r * 0.07, -r * 0.07, r, r * 0.82);
  drawCrumbles(g, 0, -r * 0.04, r * 0.92, r * 0.08, 1);
  // Toppings poking out along the top, overflowing a little.
  const s = r / 34;
  for (let i = 0; i < 9; i++) {
    const id = toppings[i % toppings.length];
    const tx = -r * 0.78 + (i / 8) * r * 1.56;
    const ty = -r * 0.1 - (i % 2) * r * 0.12 - Math.sin((i / 8) * Math.PI) * r * 0.08;
    drawPiece(g, artOf(id, 'topping'), tx, ty, s, i * 1.3);
  }
  shellFront(g, r, r * 0.82, r * 0.03);
  face(g, 0, r * 0.5, r / 60, 'joy');
  g.restore();
}

/** A crunchy taco shell, standing up on a plate, waiting for its toppings. */
const tacoShell: Ingredient = {
  id: 'taco-shell',
  label: 'taco',
  icon: '🌮',
  colors: [K.shell, K.shellLight],

  toppingBase: {
    area: TACO_VIEW,
    splash: [C.leaf, C.cheeseGold, K.shellLight],
    draw(g, { toppings }) {
      const { x, rx } = TACO_VIEW;
      const r = rx + 28;
      const rim = 300;
      // The plate, then the back of the shell and the meat peeking out.
      shadow(g, x + 6, 452, 210, 16);
      oval(g, x, 444, 210, 22);
      fillStroke(g, C.white);
      oval(g, x, 442, 180, 14);
      g.strokeStyle = C.sky;
      g.lineWidth = 3;
      g.stroke();
      // The back half of the folded shell, peeking out behind, then the meat.
      shellBack(g, x + 12, rim - 12, r, 150);
      drawCrumbles(g, x + 4, rim - 8, r - 10, 16, 1);
      g.save();
      g.translate(x, rim);
      shellFront(g, r, 150, 5);
      g.restore();
      face(g, x, rim + 70, 1.3, 'happy');
      // Toppings on top, overflowing a little.
      toppings.forEach((spot: ToppingSpot, i) => {
        const art = artOf(spot.id, 'topping');
        (spot.single ? [[0, 0] as const] : PIECES).forEach(([dx, dy], k) => {
          drawPiece(g, art, spot.x + dx, spot.y + dy, 1.5, i + k * 2.1);
        });
      });
    },
  },
};

export default tacoShell;
