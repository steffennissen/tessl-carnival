import {
  C,
  type G,
  circle,
  face,
  fillStroke,
  horizontal,
  oval,
  rounded,
  shadow,
  vertical,
} from '../art';
import { drawSteam, type Ingredient } from '../kit';

/** Tomato chunks and basil bits in the sauce, by angle and distance (0 to 1). */
const BITS: [number, number, 'tomato' | 'basil'][] = [
  [0.2, 0.55, 'tomato'],
  [1.1, 0.8, 'basil'],
  [1.9, 0.35, 'tomato'],
  [2.7, 0.7, 'tomato'],
  [3.4, 0.5, 'basil'],
  [4.2, 0.82, 'tomato'],
  [5.0, 0.28, 'basil'],
  [5.7, 0.65, 'tomato'],
];

/** A tomato chunk or a basil bit, `s` big. */
function drawBit(g: G, x: number, y: number, s: number, kind: 'tomato' | 'basil', a: number) {
  if (kind === 'tomato') {
    rounded(g, x - s, y - s, s * 2, s * 2, s * 0.6);
    fillStroke(g, C.berry, 2);
    g.fillStyle = 'rgba(255, 230, 160, 0.95)';
    oval(g, x - s * 0.3, y + s * 0.2, s * 0.25, s * 0.16, a);
    g.fill();
    oval(g, x + s * 0.35, y - s * 0.1, s * 0.25, s * 0.16, a);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.7)';
    oval(g, x - s * 0.45, y - s * 0.5, s * 0.3, s * 0.14, -0.4);
    g.fill();
  } else {
    oval(g, x, y, s * 1.3, s * 0.65, a);
    fillStroke(g, C.leaf, 2);
  }
}

/** Tomato sauce for spaghetti, with chunks of tomato and bits of basil. */
const spaghettiSauce: Ingredient = {
  id: 'spaghetti-sauce',
  label: 'sauce',
  icon: '🍅',
  colors: [C.sauce, C.sauceLight, C.leaf],

  /** In the pot while it's stirred, seen from above, getting glossier. */
  stirred: {
    spoon: C.wood,
    draw(g, { x, y, r, swirl, done, t }) {
      circle(g, x, y, r);
      const sauce = g.createRadialGradient(x - 24, y - 24, 8, x, y, r);
      sauce.addColorStop(0, C.sauceLight);
      sauce.addColorStop(0.7, C.sauce);
      sauce.addColorStop(1, C.sauceDark);
      g.fillStyle = sauce;
      g.fill();

      g.strokeStyle = 'rgba(255, 170, 140, 0.8)';
      g.lineWidth = 5;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.beginPath();
        g.arc(x, y, 26 + j * 28, swirl + j * 2.1, swirl + j * 2.1 + 1.4);
        g.stroke();
      }
      // Glossy shine that grows as it's stirred.
      g.fillStyle = `rgba(255, 255, 255, ${0.25 + 0.35 * done})`;
      oval(g, x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.09, -0.6);
      g.fill();
      // Blooping bubbles.
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.9 + i * 0.37) % 1;
        const a = i * 1.3 + 0.6;
        const br = 22 + i * 14;
        g.strokeStyle = `rgba(255, 210, 190, ${0.85 * (1 - phase)})`;
        g.lineWidth = 2.5;
        circle(g, x + Math.cos(a) * br, y + Math.sin(a) * br, 3 + phase * 7);
        g.stroke();
      }
      for (const [a0, d, kind] of BITS) {
        const a = a0 + swirl;
        drawBit(g, x + Math.cos(a) * d * r, y + Math.sin(a) * d * r, 11, kind, a);
      }
    },
  },

  /** In a mint saucepan on the counter, seen from the side, while it's seasoned. */
  seasoned: {
    draw(g, { x, t, specks, speck }) {
      drawSteam(g, t, x, 290, 50, { alpha: 0.8, rise: 50, length: 10, wiggle: 0.8 });
      shadow(g, x, 420, 130, 14);
      for (const side of [-1, 1]) {
        rounded(g, x + side * 120 - 17, 318, 34, 18, 9);
        fillStroke(g, C.mint, 3.5);
      }
      g.beginPath();
      g.moveTo(x - 118, 300);
      g.lineTo(x - 118, 370);
      g.quadraticCurveTo(x - 118, 414, x - 76, 414);
      g.lineTo(x + 76, 414);
      g.quadraticCurveTo(x + 118, 414, x + 118, 370);
      g.lineTo(x + 118, 300);
      g.closePath();
      fillStroke(g, horizontal(g, x - 118, x + 118, [C.cabinet, C.cabinetLight, C.cabinet]));
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      rounded(g, x - 100, 318, 12, 70, 6);
      g.fill();
      face(g, x, 360, 1.1, 'happy');
      oval(g, x, 300, 124, 24);
      fillStroke(g, C.cabinetLight);
      oval(g, x, 302, 106, 15);
      g.fillStyle = vertical(g, 288, 316, [C.sauceLight, C.sauce]);
      g.fill();
      for (const [dx, dy, kind] of [
        [-62, 0, 'tomato'],
        [-24, 5, 'basil'],
        [28, -3, 'tomato'],
        [66, 3, 'basil'],
      ] as const) {
        drawBit(g, x + dx, 302 + dy, 6, kind, 0.2);
      }
      g.fillStyle = speck;
      for (let i = 0; i < specks; i++) {
        g.fillRect(x + ((i * 73) % 170) - 85, 296 + ((i * 37) % 14) - 3, 3, 3);
      }
    },
  },
};

export default spaghettiSauce;
