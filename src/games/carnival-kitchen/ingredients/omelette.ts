import { C, type G, circle, face, fillStroke, heartPath, oval, palette, shadow } from '../art';
import type { Ingredient } from '../kit';
import type { SpreadArt } from '../steps/sauce';
import { artOf } from './index';
import { drawRice } from './rice';

/** This file's own colours: a golden omelette. */
const K = palette({ eggDark: '#f0ad2e', eggBrown: '#d48a2c' });

/** A golden omelette seen from above, centred on (x, y), with a shine. */
export function drawOmeletteTop(g: G, x: number, y: number, rx: number, ry: number) {
  oval(g, x, y + ry * 0.12, rx, ry);
  fillStroke(g, K.eggDark, 3.5);
  oval(g, x, y, rx, ry);
  const top = g.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 4, x, y, rx);
  top.addColorStop(0, C.yolkLight);
  top.addColorStop(0.55, C.yolk);
  top.addColorStop(1, K.eggDark);
  fillStroke(g, top, 3.5);
  g.fillStyle = 'rgba(255, 255, 255, 0.6)';
  oval(g, x - rx * 0.42, y - ry * 0.45, rx * 0.2, ry * 0.1, -0.4);
  g.fill();
  circle(g, x - rx * 0.16, y - ry * 0.6, Math.max(1.5, rx * 0.03));
  g.fill();
}

/** A ketchup heart centred on (x, y), `s` big, in the spread's colours. */
export function drawKetchupHeart(g: G, x: number, y: number, s: number, spread: SpreadArt) {
  heartPath(g, x, y, s);
  const fill = g.createRadialGradient(x - s * 0.4, y - s * 0.5, 1, x, y, s * 1.4);
  fill.addColorStop(0, spread.light);
  fill.addColorStop(1, spread.main);
  fillStroke(g, fill, Math.min(3, 1 + s * 0.08));
  g.fillStyle = 'rgba(255, 255, 255, 0.7)';
  oval(g, x - s * 0.55, y - s * 0.35, s * 0.18, s * 0.1, -0.6);
  g.fill();
}

/** An omelette: flipped in the pan, then the plate the ketchup goes on. */
const omelette: Ingredient = {
  id: 'omelette',
  label: 'omelette',
  icon: '🍳',
  colors: [C.yolk, C.yolkLight, C.white],

  flip: {
    drawInPan(g, { up, flipping }) {
      oval(g, 0, 8, 96, 40);
      fillStroke(g, K.eggDark, 3.5);
      oval(g, 0, 0, 96, 40);
      const top = g.createRadialGradient(-24, -12, 6, 0, 0, 100);
      if (up) {
        top.addColorStop(0, C.yolkLight);
        top.addColorStop(0.6, C.yolk);
        top.addColorStop(1, K.eggDark);
      } else {
        top.addColorStop(0, C.yolk);
        top.addColorStop(1, K.eggBrown);
      }
      fillStroke(g, top, 3.5);
      if (up) {
        // Fluffy bubbles, a shine and a face.
        g.fillStyle = 'rgba(255, 255, 255, 0.55)';
        oval(g, -46, -16, 16, 6, -0.3);
        g.fill();
        for (const [bx, by, br] of [
          [44, -14, 4],
          [58, 6, 3],
          [-56, 10, 3.5],
        ]) {
          circle(g, bx, by, br);
          g.fill();
        }
        face(g, 0, 4, 1, flipping ? 'joy' : 'happy');
      } else {
        // The golden-brown side.
        g.fillStyle = 'rgba(190, 110, 30, 0.35)';
        for (const [sx, sy] of [
          [-40, -6],
          [12, 10],
          [46, -8],
          [-8, -18],
          [-30, 16],
        ]) {
          oval(g, sx, sy, 11, 5);
          g.fill();
        }
      }
    },

    /** A little rolled omelette: golden if it was flipped well, browner if not. */
    drawOnPlate(g, x, y, share) {
      const color = share >= 0.6 ? C.yolk : share > 0 ? K.eggDark : K.eggBrown;
      oval(g, x, y + 6, 46, 18);
      fillStroke(g, K.eggBrown, 3);
      oval(g, x, y, 46, 18);
      fillStroke(g, color, 3);
      g.strokeStyle = 'rgba(190, 110, 30, 0.45)';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x - 8, y - 2, 30, 11, 0, 0.3, Math.PI - 0.3);
      g.stroke();
    },

    /** A ketchup heart on the top one. */
    garnish(g, x, y) {
      drawKetchupHeart(g, x, y - 4, 12, artOf('ketchup', 'spread'));
    },
  },

  /**
   * Seen from above on a plate of rosy rice, waiting for its ketchup. The
   * ketchup grows into a heart as the circles are drawn.
   */
  sauceBase: {
    draw(g, { x, y, r, cover, swirl, spread }) {
      shadow(g, x + 8, y + r - 4, r, 20);
      circle(g, x, y, r);
      fillStroke(g, C.white);
      circle(g, x, y, r - 14);
      g.strokeStyle = C.sky;
      g.lineWidth = 4;
      g.stroke();
      // The rice peeks out round the omelette.
      g.save();
      oval(g, x, y + 4, r * 0.84, r * 0.68);
      g.clip();
      drawRice(g, x, y + 4, r * 0.84, 0, 1);
      g.restore();
      oval(g, x, y + 4, r * 0.84, r * 0.68);
      g.strokeStyle = 'rgba(91, 59, 79, 0.5)';
      g.lineWidth = 2.5;
      g.stroke();
      drawOmeletteTop(g, x, y - 2, r * 0.72, r * 0.54);

      // The ketchup heart, with a swirl in it while it's drawn.
      const hx = x;
      const hy = y - 14;
      const s = 6 + 38 * cover;
      drawKetchupHeart(g, hx, hy, s, spread);
      if (cover > 0.05 && cover < 1) {
        g.save();
        heartPath(g, hx, hy, s);
        g.clip();
        g.strokeStyle = spread.swirl;
        g.lineWidth = 3;
        g.lineCap = 'round';
        for (let j = 0; j < 3; j++) {
          g.beginPath();
          g.arc(hx, hy, s * (0.3 + j * 0.25), swirl + j * 2.1, swirl + j * 2.1 + 1.4);
          g.stroke();
        }
        g.restore();
      }
      face(g, x, y + r * 0.34, 0.95, cover > 0.6 ? 'joy' : 'happy');
    },
  },
};

export default omelette;
