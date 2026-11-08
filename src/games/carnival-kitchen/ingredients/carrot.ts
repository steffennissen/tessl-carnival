import { C, fillStroke, oval, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A carrot to chop: the tip points left, the leaves are on the right. */
const carrot: Ingredient = {
  id: 'carrot',
  label: 'carrot',
  icon: '🥕',
  colors: [C.carrot, C.carrotLight],

  chop: {
    draw(g, { bounds, cy, x0, x1 }) {
      const radius = (x: number) => 9 + ((x - x0) / (x1 - x0)) * 25;
      for (const angle of [-0.55, 0, 0.55]) {
        const lx = x1 + 6 + Math.cos(angle) * 26;
        const ly = cy + Math.sin(angle) * 26;
        oval(g, lx, ly, 28, 10, angle);
        fillStroke(g, vertical(g, ly - 10, ly + 10, [C.leaf, C.leafDark]), 3);
        g.strokeStyle = C.leafDark;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x1 + 6, cy);
        g.lineTo(lx + Math.cos(angle) * 18, ly + Math.sin(angle) * 18);
        g.stroke();
      }
      const body = vertical(g, cy - 34, cy + 34, [C.carrotLight, C.carrot, C.carrotDark]);
      const ridges = [252, 300, 362, 425, 452, 515, 570];
      for (let k = 0; k < bounds.length - 1; k++) {
        const first = k === 0;
        const last = k === bounds.length - 2;
        const a = bounds[k] + (first ? 0 : 3);
        const b = bounds[k + 1] - (last ? 0 : 3);
        g.beginPath();
        g.moveTo(a, cy - radius(a));
        g.lineTo(b, cy - radius(b));
        if (last) g.arc(b, cy, radius(b), -Math.PI / 2, Math.PI / 2);
        else g.lineTo(b, cy + radius(b));
        g.lineTo(a, cy + radius(a));
        if (first) g.quadraticCurveTo(a - 22, cy, a, cy - radius(a));
        g.closePath();
        fillStroke(g, body, 3.5);
        g.strokeStyle = C.carrotDark;
        g.lineWidth = 2.5;
        ridges.forEach((x, i) => {
          if (x < a + 6 || x > b - 6) return;
          const side = i % 2 === 0 ? -1 : 1;
          const y = cy + side * radius(x) * 0.5;
          g.beginPath();
          g.moveTo(x - 5, y);
          g.quadraticCurveTo(x, y - side * 4, x + 5, y);
          g.stroke();
        });
        if (!first) {
          oval(g, a, cy, 5, radius(a));
          fillStroke(g, C.carrotLight, 2.5);
        }
      }
    },
  },
};

export default carrot;
