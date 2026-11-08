import { C, type G, fillStroke, oval, palette, shadow } from '../art';
import type { Ingredient } from '../kit';
import type { ToppingArt } from '../steps/top';
import { artOf } from './index';

/** This file's own colours: golden noodles. */
const K = palette({ noodle: '#ffe08a', noodleDark: '#f2c45c' });

/** Where the spaghetti sits while the toppings go on, seen a little from the side. */
export const SPAGHETTI_VIEW = { x: 400, y: 318, rx: 150, ry: 62 } as const;

/** One noodle: a thick golden line with an ink edge. */
function noodle(g: G, width: number) {
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.lineWidth = width + 2.4;
  g.stroke();
  g.strokeStyle = K.noodle;
  g.lineWidth = width;
  g.stroke();
}

/**
 * A nest of spaghetti centred on (x, y), rx by ry, with tomato sauce on top.
 * `turn` spins the loops a little, for a twirl.
 */
export function drawSpaghetti(g: G, x: number, y: number, rx: number, ry: number, turn = 0) {
  const width = Math.max(2.5, rx / 24);
  oval(g, x, y, rx, ry);
  fillStroke(g, K.noodleDark, 3);
  oval(g, x, y - ry * 0.06, rx * 0.94, ry * 0.88);
  g.fillStyle = K.noodle;
  g.fill();
  // Loops of noodle all over, the same every frame.
  const loops = 30;
  for (let i = 0; i < loops; i++) {
    const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const a = i * 2.39996;
    const d = Math.sqrt((i + 0.5) / loops) * 0.72;
    const size = 0.16 + h * 0.14;
    g.beginPath();
    g.ellipse(
      x + Math.cos(a) * d * rx,
      y + Math.sin(a) * d * ry,
      size * rx,
      size * rx * (ry / rx) * 1.3,
      0,
      h * 6.28 + turn,
      h * 6.28 + turn + 4.6,
    );
    noodle(g, width);
  }
  // The sauce in the middle, wobbly at the edge.
  const sx = rx * 0.42;
  const sy = ry * 0.46;
  g.beginPath();
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const wobble = 1 + Math.sin(a * 6) * 0.07;
    g.lineTo(x + Math.cos(a) * sx * wobble, y - ry * 0.08 + Math.sin(a) * sy * wobble);
  }
  g.closePath();
  const sauce = g.createRadialGradient(x - sx * 0.3, y - sy * 0.5, 2, x, y, sx);
  sauce.addColorStop(0, C.sauceLight);
  sauce.addColorStop(1, C.sauce);
  fillStroke(g, sauce, 2.5);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  oval(g, x - sx * 0.45, y - sy * 0.5, sx * 0.18, sy * 0.12, -0.4);
  g.fill();
}

/** The white plate under it all, centred on (x, y). */
export function drawPlate(g: G, x: number, y: number, rx: number, ry: number) {
  shadow(g, x + 6, y + ry * 0.5, rx, ry * 0.7);
  oval(g, x, y, rx, ry);
  fillStroke(g, C.white);
  oval(g, x, y - 2, rx * 0.84, ry * 0.8);
  g.strokeStyle = C.sky;
  g.lineWidth = 3;
  g.stroke();
}

/** One piece of a topping at (x, y), scaled by `s` and turned by `rot`. */
export function drawPieceAt(g: G, art: ToppingArt, x: number, y: number, s: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  art.draw(g);
  g.restore();
}

/** A plate of spaghetti, waiting for its meatballs and basil. */
const spaghettiPlate: Ingredient = {
  id: 'spaghetti-plate',
  label: 'spaghetti',
  plural: 'spaghetti',
  icon: '🍝',
  colors: [K.noodle, C.sauce],

  toppingBase: {
    area: SPAGHETTI_VIEW,
    splash: [C.sauceLight, K.noodle],
    draw(g, { toppings }) {
      const { x, y, rx, ry } = SPAGHETTI_VIEW;
      drawPlate(g, x, y + 14, rx + 40, ry + 32);
      drawSpaghetti(g, x, y, rx + 12, ry + 8);
      toppings.forEach((spot, i) => {
        // Meatballs sit up round; leaves lie flat and turned.
        drawPieceAt(
          g,
          artOf(spot.id, 'topping'),
          spot.x,
          spot.y,
          2,
          spot.id === 'meatball' ? 0 : i * 1.7,
        );
      });
    },
  },
};

export default spaghettiPlate;
