import { C, fillStroke, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A thin stick of carrot, for a sushi filling. */
const carrotStick: Ingredient = {
  id: 'carrot-stick',
  label: 'carrot',
  icon: '🥕',
  colors: [C.carrot, C.carrotLight],

  topping: {
    draw(g) {
      rounded(g, -16, -5.5, 32, 11, 5.5);
      fillStroke(g, vertical(g, -5.5, 5.5, [C.carrotLight, C.carrot, C.carrotDark]), 2.2);
      g.strokeStyle = C.carrotDark;
      g.lineWidth = 1.2;
      for (const x of [-8, 1, 9]) {
        g.beginPath();
        g.moveTo(x - 2, -1.5);
        g.lineTo(x + 2, -1.5);
        g.stroke();
      }
    },
  },
};

export default carrotStick;
