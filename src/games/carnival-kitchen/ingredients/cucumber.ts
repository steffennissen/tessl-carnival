import { C, circle, fillStroke, oval, palette, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
export const CUKE = palette({
  skin: '#4fb565',
  skinLight: '#7fd48a',
  skinDark: '#358a4a',
  flesh: '#dcf5c8',
  seed: '#b4e09a',
});

/** A cucumber to chop, and strips of it for sushi. */
const cucumber: Ingredient = {
  id: 'cucumber',
  label: 'cucumber',
  icon: '🥒',
  colors: [CUKE.skin, CUKE.flesh],

  /** Lying along the board in slices between the cuts, a little flower at the left. */
  chop: {
    draw(g, { bounds, cy }) {
      const r = 28;
      const body = vertical(g, cy - r, cy + r, [CUKE.skinLight, CUKE.skin, CUKE.skinDark]);
      const bumps = [246, 280, 312, 350, 384, 418, 452, 488, 520, 556];
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
        // Little bumps along the skin, and a shine.
        g.fillStyle = 'rgba(255, 255, 255, 0.4)';
        bumps.forEach((x, i) => {
          if (x < a + 8 || x > b - 8) return;
          circle(g, x, cy + (i % 2 === 0 ? -12 : 10), 2.2);
          g.fill();
        });
        g.fillStyle = 'rgba(255, 255, 255, 0.35)';
        rounded(g, Math.max(a + 6, bounds[0] + 16), cy - r + 6, Math.max(0, b - a - 22), 6, 3);
        g.fill();
        if (!first) {
          // A fresh slice: pale with a ring of seeds.
          oval(g, a, cy, 8, r);
          fillStroke(g, CUKE.flesh, 2.5);
          g.fillStyle = CUKE.seed;
          for (const dy of [-12, -4, 4, 12]) {
            oval(g, a, cy + dy, 2, 3);
            g.fill();
          }
        }
      }
      // A little yellow flower still on the end.
      const end = bounds[0];
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        oval(g, end + 2 + Math.cos(angle) * 6, cy + Math.sin(angle) * 6, 5, 3.5, angle);
        fillStroke(g, C.butter, 1.5);
      }
      circle(g, end + 2, cy, 3);
      fillStroke(g, C.gold, 1.5);
    },
  },

  /** A strip of cucumber: green skin along one side, pale inside. */
  topping: {
    draw(g) {
      rounded(g, -16, -6, 32, 12, 4);
      g.fillStyle = CUKE.flesh;
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = CUKE.skin;
      g.fillRect(-16, -6, 32, 4.5);
      g.restore();
      g.fillStyle = CUKE.seed;
      for (const x of [-9, -3, 3, 9]) {
        oval(g, x, 2, 1.6, 1.1);
        g.fill();
      }
      rounded(g, -16, -6, 32, 12, 4);
      g.lineWidth = 2.2;
      g.strokeStyle = C.ink;
      g.stroke();
    },
  },
};

export default cucumber;
