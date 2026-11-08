import { C, type G, circle, fillStroke, oval, palette, vertical } from '../art';
import type { Ingredient } from '../kit';
import { drawChopPieces } from './strawberry';

/** This file's own colours: see `palette` in art.ts. */
export const NANA = palette({
  light: '#fff3a8',
  main: '#ffe066',
  dark: '#f2c230',
  tip: '#a8794a',
  inside: '#fff6d8',
  seeds: '#e6c98a',
});

/** A round banana slice centred on (x, y), radius r, with a little star of seeds. */
export function drawBananaSlice(g: G, x: number, y: number, r: number) {
  circle(g, x, y, r);
  fillStroke(g, NANA.inside, Math.max(1.5, r * 0.18));
  circle(g, x, y, r * 0.78);
  g.strokeStyle = 'rgba(242, 194, 48, 0.55)';
  g.lineWidth = Math.max(1, r * 0.12);
  g.stroke();
  g.fillStyle = NANA.seeds;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 - Math.PI / 2;
    oval(g, x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25, r * 0.08, r * 0.16, a);
    g.fill();
  }
}

const banana: Ingredient = {
  id: 'banana',
  label: 'banana',
  icon: '🍌',
  colors: [NANA.main, NANA.inside],

  /** A curvy banana lying along the board, a little brown at each end. */
  chop: {
    draw(g, { bounds, cy, x0, x1 }) {
      const span = x1 - x0;
      const u = (x: number) => Math.min(1, Math.max(0, (x - x0) / span));
      const mid = (x: number) => cy + 12 - 22 * Math.sin(Math.PI * u(x));
      const radius = (x: number) => 4 + 28 * Math.sin(Math.PI * (0.03 + 0.9 * u(x))) ** 0.55;
      const outline = () => {
        g.beginPath();
        for (let i = 0; i <= 48; i++) {
          const x = x0 + (span * i) / 48;
          g.lineTo(x, mid(x) - radius(x));
        }
        for (let i = 48; i >= 0; i--) {
          const x = x0 + (span * i) / 48;
          g.lineTo(x, mid(x) + radius(x));
        }
        g.closePath();
      };
      // The stalk, poking out on the right.
      g.save();
      g.translate(x1 - 4, mid(x1) - 4);
      g.rotate(-0.25);
      g.beginPath();
      g.roundRect(0, -8, 30, 16, 6);
      fillStroke(g, vertical(g, -8, 8, [C.leaf, NANA.tip]), 3);
      g.restore();
      drawChopPieces(g, bounds, {
        outline,
        mid,
        radius,
        paint() {
          fillStroke(g, vertical(g, cy - 40, cy + 40, [NANA.light, NANA.main, NANA.dark]), 3.5);
          // A ridge along its length.
          g.strokeStyle = 'rgba(242, 194, 48, 0.9)';
          g.lineWidth = 3;
          g.beginPath();
          for (let i = 4; i <= 44; i++) {
            const x = x0 + (span * i) / 48;
            g.lineTo(x, mid(x) + radius(x) * 0.35);
          }
          g.stroke();
          // A shine on top.
          g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          g.lineWidth = 5;
          g.lineCap = 'round';
          g.beginPath();
          for (let i = 12; i <= 30; i++) {
            const x = x0 + (span * i) / 48;
            g.lineTo(x, mid(x) - radius(x) * 0.6);
          }
          g.stroke();
          // The little brown tip on the left.
          oval(g, x0 + 2, mid(x0), 6, 5);
          g.fillStyle = NANA.tip;
          g.fill();
        },
        cut(x) {
          const r = radius(x);
          oval(g, x, mid(x), 5, r);
          fillStroke(g, NANA.inside, 2.5);
        },
      });
    },
  },
};

export default banana;
