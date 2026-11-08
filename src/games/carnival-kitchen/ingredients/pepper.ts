import { C } from '../art';
import type { Ingredient } from '../kit';

/** A green pepper, in rings. */
const pepper: Ingredient = {
  id: 'pepper',
  label: 'pepper',
  icon: '🫑',
  colors: [C.pepper],

  topping: {
    draw(g) {
      g.beginPath();
      g.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
      g.lineWidth = 8;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 4.5;
      g.strokeStyle = C.pepper;
      g.stroke();
    },
    ring: true,
  },
};

export default pepper;
