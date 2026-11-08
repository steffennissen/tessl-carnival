import { C, fillStroke, oval, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A swirl of whipped cream with a curly tip. */
const whippedCream: Ingredient = {
  id: 'whipped-cream',
  label: 'whipped cream',
  plural: 'whipped cream',
  icon: '☁️',
  colors: [C.white, C.cream, C.pink],

  topping: {
    draw(g) {
      const cream = vertical(g, -16, 12, [C.white, C.cream]);
      oval(g, 0, 7, 15, 6);
      fillStroke(g, cream, 2.5);
      oval(g, 0, 0, 12, 5.5);
      fillStroke(g, cream, 2.5);
      oval(g, 0, -6, 8, 4.5);
      fillStroke(g, cream, 2.5);
      g.beginPath();
      g.moveTo(-5, -9);
      g.quadraticCurveTo(0, -20, 5, -15);
      g.quadraticCurveTo(2, -11, -1, -10);
      g.closePath();
      fillStroke(g, C.white, 2.5);
    },
    faceY: 3,
  },
};

export default whippedCream;
