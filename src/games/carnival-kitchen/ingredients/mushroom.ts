import { C, fillStroke, vertical } from '../art';
import type { Ingredient } from '../kit';

const mushroom: Ingredient = {
  id: 'mushroom',
  label: 'mushroom',
  icon: '🍄',
  colors: [C.mushroom, C.mushroomDark],

  topping: {
    draw(g) {
      g.beginPath();
      g.moveTo(-13, 1);
      g.bezierCurveTo(-13, -15, 13, -15, 13, 1);
      g.lineTo(5, 1);
      g.lineTo(6, 12);
      g.quadraticCurveTo(0, 15, -6, 12);
      g.lineTo(-5, 1);
      g.closePath();
      fillStroke(g, vertical(g, -12, 14, [C.mushroom, C.mushroomDark]), 2.5);
    },
    // The face goes on the cap.
    faceY: -12,
  },
};

export default mushroom;
