import { C, fillStroke, vertical } from '../art';
import type { Ingredient } from '../kit';

const pineapple: Ingredient = {
  id: 'pineapple',
  label: 'pineapple',
  icon: '🍍',
  colors: [C.pineapple, C.butter],

  topping: {
    draw(g) {
      g.beginPath();
      g.moveTo(0, -12);
      g.lineTo(12, 9);
      g.quadraticCurveTo(0, 14, -12, 9);
      g.closePath();
      fillStroke(g, vertical(g, -12, 12, [C.butter, C.pineapple]), 2.5);
    },
    faceY: 6,
  },
};

export default pineapple;
