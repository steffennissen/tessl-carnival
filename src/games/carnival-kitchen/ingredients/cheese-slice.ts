import { C, fillStroke, oval, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A square slice of cheese, its corners and drips melting over the edges. */
const cheeseSlice: Ingredient = {
  id: 'cheese-slice',
  label: 'cheese',
  plural: 'cheese',
  icon: '🧀',
  colors: [C.cheeseGold, C.cheese],

  stack: {
    size: () => ({ w: 160, h: 9 }),
    draw(g) {
      g.beginPath();
      g.moveTo(-64, -10);
      g.lineTo(64, -10);
      g.lineTo(80, 8);
      g.lineTo(56, 1);
      g.lineTo(38, 1);
      g.bezierCurveTo(38, 16, 22, 16, 22, 1);
      g.lineTo(-12, 1);
      g.bezierCurveTo(-12, 22, -30, 22, -30, 1);
      g.lineTo(-56, 1);
      g.lineTo(-80, 8);
      g.closePath();
      fillStroke(g, vertical(g, -10, 18, [C.cheese, C.cheeseGold]), 3);
      g.fillStyle = 'rgba(224, 154, 60, 0.4)';
      for (const [hx, hy, r] of [
        [-40, -4, 4],
        [8, -5, 5],
        [46, -4, 3],
      ]) {
        oval(g, hx, hy, r, r * 0.55);
        g.fill();
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.6)';
      oval(g, -21, 10, 2.5, 4);
      g.fill();
    },
  },
};

export default cheeseSlice;
