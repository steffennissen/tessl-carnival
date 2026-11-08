import { C, circle } from '../art';
import type { Ingredient } from '../kit';

const olive: Ingredient = {
  id: 'olive',
  label: 'olive',
  icon: '🫒',
  colors: [C.olive],

  topping: {
    draw(g) {
      circle(g, 0, 0, 10);
      g.lineWidth = 9;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = C.olive;
      g.stroke();
    },
    ring: true,
  },
};

export default olive;
