import { C, fillStroke, palette, vertical } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: crunchy light lettuce. */
const K = palette({ light: '#c4f2a8' });

/** Shredded lettuce, for on top: a frilly green bunch. */
const lettuce: Ingredient = {
  id: 'lettuce',
  label: 'lettuce',
  plural: 'lettuce',
  icon: '🥬',
  colors: [C.leaf, K.light],

  topping: {
    draw(g) {
      // A frilly scalloped bunch, then a lighter one on top.
      for (const [r, fill] of [
        [14, vertical(g, -14, 14, [C.leaf, C.leafDark])],
        [8.5, vertical(g, -9, 9, [K.light, C.leaf])],
      ] as const) {
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
          const a = (i / 40) * Math.PI * 2;
          const rr = r * (1 + 0.14 * Math.sin(a * 9));
          g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.85);
        }
        g.closePath();
        fillStroke(g, fill, 2.2);
      }
      // Shreds poking out.
      g.strokeStyle = K.light;
      g.lineWidth = 2;
      g.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [
        [-4, -2, 3, 3],
        [2, -5, 6, 1],
        [-6, 3, -1, 6],
      ]) {
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
        g.stroke();
      }
    },
  },
};

export default lettuce;
