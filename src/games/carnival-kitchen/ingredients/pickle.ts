import { type G, circle, fillStroke, oval, palette, vertical } from '../art';
import type { Ingredient } from '../kit';

const K = palette({
  pickle: '#8bcf5a',
  pickleLight: '#c4ec8c',
  pickleDark: '#5c9c38',
  flesh: '#e6f8bb',
  seed: '#fff8d8',
});

/** One round pickle chip, seen a little from the side. */
function chip(g: G, x: number, y: number) {
  oval(g, x, y, 21, 7);
  fillStroke(g, vertical(g, y - 7, y + 7, [K.pickle, K.pickleDark]), 2.5);
  oval(g, x, y - 1, 15, 4.2);
  g.fillStyle = K.flesh;
  g.fill();
  g.fillStyle = K.pickleDark;
  for (const dx of [-7, 0, 7]) {
    oval(g, x + dx, y - 1, 1.6, 1);
    g.fill();
  }
}

/** A bumpy pickle to chop, and chips of it in the burger. */
const pickle: Ingredient = {
  id: 'pickle',
  label: 'pickle',
  icon: '🥒',
  colors: [K.pickle, K.pickleLight],

  /** Lying along the board in pieces, with round ends. */
  chop: {
    draw(g, { bounds, cy }) {
      const r = 30;
      const body = vertical(g, cy - r, cy + r, [K.pickleLight, K.pickle, K.pickleDark]);
      const bumps = [246, 274, 306, 338, 366, 398, 430, 458, 490, 520, 548, 574];
      for (let k = 0; k < bounds.length - 1; k++) {
        const first = k === 0;
        const last = k === bounds.length - 2;
        const a = bounds[k] + (first ? 0 : 3);
        const b = bounds[k + 1] - (last ? 0 : 3);
        g.beginPath();
        if (first) {
          g.moveTo(a + r, cy - r);
          g.arc(a + r, cy, r, -Math.PI / 2, Math.PI / 2, true);
        } else {
          g.moveTo(a, cy - r);
          g.lineTo(a, cy + r);
        }
        if (last) {
          g.lineTo(b - r, cy + r);
          g.arc(b - r, cy, r, Math.PI / 2, -Math.PI / 2, true);
        } else {
          g.lineTo(b, cy + r);
          g.lineTo(b, cy - r);
        }
        g.closePath();
        fillStroke(g, body, 3.5);
        // Little bumps all over.
        g.fillStyle = 'rgba(255, 255, 255, 0.45)';
        bumps.forEach((x, i) => {
          if (x < a + 6 || x > b - 6) return;
          circle(g, x, cy + ((i * 5) % 3) * 14 - 14, 3);
          g.fill();
        });
        if (!first) {
          // A fresh cut: pale green with seeds.
          oval(g, a, cy, 7, r);
          fillStroke(g, K.flesh, 2.5);
          g.fillStyle = K.seed;
          for (const dy of [-12, 0, 12]) {
            circle(g, a, cy + dy, 2);
            g.fill();
          }
        }
      }
    },
  },

  /** A row of pickle chips. */
  stack: {
    size: () => ({ w: 150, h: 10 }),
    draw(g) {
      chip(g, -52, -6);
      chip(g, 52, -6);
      chip(g, -18, -4);
      chip(g, 20, -5);
    },
  },
};

export default pickle;
