import { C, fillStroke, heartPath, oval, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A sugar candy heart. */
const candyHeart: Ingredient = {
  id: 'candy-heart',
  label: 'candy heart',
  icon: '💗',
  colors: [C.hotPink, C.pink, C.lavender],

  topping: {
    draw(g) {
      heartPath(g, 0, 0, 12);
      fillStroke(g, vertical(g, -12, 12, [C.pink, C.hotPink]), 2.5);
      g.fillStyle = 'rgba(255, 255, 255, 0.7)';
      oval(g, -6, -5, 3, 1.8, -0.6);
      g.fill();
    },
    faceY: 1,
  },
};

export default candyHeart;
