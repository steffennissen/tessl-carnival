import { C, fillStroke, palette, vertical } from '../art';
import type { Ingredient } from '../kit';

const K = palette({ lettuceLight: '#c2f59a' });

/** A frilly lettuce leaf, its frills hanging over the edge. */
const lettuceLeaf: Ingredient = {
  id: 'lettuce-leaf',
  label: 'lettuce',
  plural: 'lettuce',
  icon: '🥬',
  colors: [C.leaf, K.lettuceLight],

  stack: {
    size: () => ({ w: 172, h: 12 }),
    draw(g, { t }) {
      const flutter = Math.sin(t * 3) * 1.5;
      g.beginPath();
      g.moveTo(-84, -4);
      for (let i = 0; i < 12; i++) {
        const x = -84 + i * 14;
        g.quadraticCurveTo(x + 7, -17, x + 14, -9);
      }
      g.lineTo(86, 1);
      for (let i = 0; i < 12; i++) {
        const x = 84 - i * 14;
        g.quadraticCurveTo(x - 7, 9 + (i % 2 ? flutter : -flutter), x - 14, 2);
      }
      g.closePath();
      fillStroke(g, vertical(g, -15, 14, [K.lettuceLight, C.leaf, C.leafDark]), 3);
      g.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      g.lineWidth = 2;
      for (const x of [-52, -10, 34, 70]) {
        g.beginPath();
        g.moveTo(x, -8);
        g.quadraticCurveTo(x + 6, -1, x + 2, 6);
        g.stroke();
      }
    },
  },
};

export default lettuceLeaf;
