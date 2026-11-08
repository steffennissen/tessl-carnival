import { C, fillStroke, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A fresh basil leaf, for on top. */
const basil: Ingredient = {
  id: 'basil',
  label: 'basil',
  plural: 'basil',
  icon: '🌿',
  colors: [C.leaf, C.leafDark],

  topping: {
    draw(g) {
      g.beginPath();
      g.moveTo(-14, 2);
      g.bezierCurveTo(-8, -12, 8, -12, 14, -2);
      g.bezierCurveTo(8, 10, -6, 12, -14, 2);
      g.closePath();
      fillStroke(g, vertical(g, -10, 10, [C.leaf, C.leafDark]), 2.2);
      // The vein, with little side veins.
      g.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      g.lineWidth = 1.6;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-11, 2);
      g.quadraticCurveTo(0, -2, 11, -2);
      g.stroke();
      for (const vx of [-4, 3]) {
        g.beginPath();
        g.moveTo(vx, -0.5);
        g.lineTo(vx + 4, -6);
        g.moveTo(vx, -0.5);
        g.lineTo(vx + 3, 5);
        g.stroke();
      }
    },
  },
};

export default basil;
