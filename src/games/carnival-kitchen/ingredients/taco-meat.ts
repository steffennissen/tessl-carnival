import {
  C,
  type G,
  blend,
  circle,
  face,
  fillStroke,
  horizontal,
  oval,
  palette,
  rounded,
  shadow,
  vertical,
} from '../art';
import { drawSteam, type Ingredient } from '../kit';

/** This file's own colours: taco meat, pink when raw and brown when cooked. */
const K = palette({
  raw: '#e89a8c',
  rawDark: '#c97467',
  meat: '#a8643c',
  meatLight: '#c98552',
  meatDark: '#7d4528',
});

/**
 * Crumbly taco meat filling an oval round (x, y), browning as `done` goes
 * 0 to 1, with bits of red and green pepper. `turn` spins the crumbles.
 */
export function drawCrumbles(
  g: G,
  x: number,
  y: number,
  rx: number,
  ry: number,
  done: number,
  turn = 0,
) {
  oval(g, x, y, rx, ry);
  g.fillStyle = blend([K.rawDark, K.meatDark], done);
  g.fill();
  const light = blend([K.raw, K.meatLight], done);
  const mid = blend([K.rawDark, K.meat], done);
  const count = Math.round((rx * ry) / 80);
  const size = Math.max(2.2, Math.min(rx, ry) / 16);
  for (let i = 0; i < count; i++) {
    // A steady scatter: the same each frame, but with no pattern to it.
    const hash = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const a = i * 2.39996 + turn + hash * 0.8;
    const d = Math.sqrt((i + hash) / count) * 0.9;
    const cx = x + Math.cos(a) * d * rx;
    const cy = y + Math.sin(a) * d * ry;
    const s = size * (0.75 + hash * 0.5);
    if (hash < 0.07) {
      rounded(g, cx - s * 1.7, cy - s, s * 3.4, s * 2, s * 0.8);
      fillStroke(g, hash < 0.035 ? C.leaf : C.berry, 1.5);
      continue;
    }
    circle(g, cx, cy, s);
    fillStroke(g, hash > 0.5 ? light : mid, 1.2, 'rgba(91, 59, 79, 0.5)');
  }
}

/** Taco meat: stirred in the frying pan, then seasoned in it. */
const tacoMeat: Ingredient = {
  id: 'taco-meat',
  label: 'taco meat',
  plural: 'taco meat',
  icon: '🌮',
  colors: [K.meat, K.meatLight, C.leaf],

  /** In the pan from above, browning as it's stirred. */
  stirred: {
    spoon: C.woodLight,
    draw(g, { x, y, r, swirl, done, t }) {
      drawCrumbles(g, x, y, r, r, done, swirl);
      for (let i = 0; i < 8; i++) {
        const phase = (t * 1.6 + i * 0.29) % 1;
        const a = i * 0.79 + 0.3;
        g.strokeStyle = `rgba(255, 255, 255, ${0.85 * (1 - phase)})`;
        g.lineWidth = 2;
        circle(g, x + Math.cos(a) * (r - 10), y + Math.sin(a) * (r - 10), 2 + phase * 4);
        g.stroke();
      }
    },
  },

  /** Sizzling in a pink skillet on the counter, seen from the side. */
  seasoned: {
    draw(g, { x, t, specks, speck }) {
      drawSteam(g, t, x, 296, 50, { alpha: 0.8, rise: 46, length: 9, wiggle: 0.8 });
      shadow(g, x, 404, 140, 12);
      for (const side of [-1, 1]) {
        rounded(g, x + side * 136 - 18, 328, 36, 18, 9);
        fillStroke(g, C.hotPink, 3.5);
      }
      g.beginPath();
      g.moveTo(x - 132, 322);
      g.lineTo(x - 120, 378);
      g.quadraticCurveTo(x - 114, 398, x - 90, 398);
      g.lineTo(x + 90, 398);
      g.quadraticCurveTo(x + 114, 398, x + 120, 378);
      g.lineTo(x + 132, 322);
      g.closePath();
      fillStroke(g, horizontal(g, x - 132, x + 132, [C.panDark, C.panLight, C.pan, C.panDark]));
      g.fillStyle = 'rgba(255, 255, 255, 0.35)';
      rounded(g, x - 108, 336, 10, 44, 5);
      g.fill();
      face(g, x, 366, 1.1, 'happy');
      oval(g, x, 322, 134, 22);
      fillStroke(g, C.panLight);
      // The meat, heaped up in the middle, in crumbles.
      const top = (px: number) => 320 - 26 * (1 - ((px - x) / 118) ** 2);
      g.beginPath();
      g.moveTo(x - 118, 320);
      g.bezierCurveTo(x - 100, 284, x + 100, 284, x + 118, 320);
      g.quadraticCurveTo(x, 336, x - 118, 320);
      g.closePath();
      fillStroke(g, vertical(g, 290, 330, [K.meatLight, K.meatDark]), 3);
      for (let i = 0; i < 46; i++) {
        const hash = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
        const px = x - 104 + ((i * 53) % 46) * 4.6;
        const py = top(px) + 4 + hash * (326 - top(px) - 6);
        if (hash < 0.12) {
          rounded(g, px - 6, py - 3.5, 12, 7, 3);
          fillStroke(g, hash < 0.06 ? C.leaf : C.berry, 1.5);
        } else {
          circle(g, px, py, 3.5 + hash * 2.5);
          fillStroke(g, hash > 0.55 ? K.meatLight : K.meat, 1.2, 'rgba(91, 59, 79, 0.5)');
        }
      }
      g.fillStyle = speck;
      for (let i = 0; i < specks; i++) {
        const px = x + ((i * 73) % 190) - 95;
        oval(g, px, top(px) + 3 + ((i * 37) % 14), 2.4, 1.8);
        g.fill();
      }
    },
  },
};

export default tacoMeat;
