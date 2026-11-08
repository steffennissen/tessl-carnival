import { C, circle, fillStroke, oval, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

/** Pepperoni: a sausage to chop, and slices to go on top. */
const pepperoni: Ingredient = {
  id: 'pepperoni',
  label: 'pepperoni',
  // There's no pepperoni emoji. The pizza's recipe puts a knife on its chop step.
  icon: '🍕',
  colors: [C.pepperoni, C.pepperoniDark],

  /** A sausage in slices between the cuts, tied with string at the right. */
  chop: {
    draw(g, { bounds, cy }) {
      const r = 31;
      const body = vertical(g, cy - r, cy + r, [C.sauceLight, C.pepperoni, C.pepperoniDark]);
      const specks = [240, 268, 300, 331, 357, 389, 418, 446, 477, 505, 534, 560];
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
        g.fillStyle = 'rgba(255, 240, 230, 0.75)';
        specks.forEach((x, i) => {
          if (x < a + 6 || x > b - 6) return;
          oval(g, x, cy + ((i * 7) % 3) * 9 - 9, 3, 2);
          g.fill();
        });
        g.fillStyle = 'rgba(255, 255, 255, 0.35)';
        rounded(g, Math.max(a + 6, bounds[0] + 14), cy - r + 6, Math.max(0, b - a - 18), 6, 3);
        g.fill();
        if (!first) {
          // A fresh slice face: pink with fatty dots.
          oval(g, a, cy, 7, r);
          fillStroke(g, C.pink, 2.5);
          g.fillStyle = C.white;
          for (const dy of [-12, 0, 11]) {
            circle(g, a, cy + dy, 1.8);
            g.fill();
          }
        }
      }
      // The string tied round the end.
      const end = bounds[bounds.length - 1];
      g.strokeStyle = C.cream;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(end - 14, cy - r + 2);
      g.lineTo(end - 14, cy + r - 2);
      g.stroke();
      g.beginPath();
      g.moveTo(end, cy);
      g.quadraticCurveTo(end + 14, cy - 12, end + 22, cy - 4);
      g.stroke();
    },
  },

  topping: {
    draw(g) {
      circle(g, 0, 0, 13);
      fillStroke(g, vertical(g, -13, 13, [C.pepperoni, C.pepperoniDark]), 2.5);
      g.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (const [dx, dy] of [
        [-5, -4],
        [4, 3],
        [5, -6],
        [-3, 6],
      ]) {
        circle(g, dx, dy, 1.8);
        g.fill();
      }
    },
  },
};

export default pepperoni;
