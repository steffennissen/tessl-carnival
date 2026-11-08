import { C, circle, fillStroke, rounded, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A pink soup pot with handles, seen from above. */
const pot: Ingredient = {
  id: 'pot',
  label: 'pot',
  icon: '🍲',
  colors: [C.pink, C.hotPink],

  vessel: {
    inset: 26,
    draw(g, px, py, R) {
      shadow(g, px + 8, py + R - 4, R, 22);
      for (const side of [-1, 1]) {
        rounded(g, px + side * (R + 4) - 22, py - 14, 44, 28, 14);
        fillStroke(g, C.hotPink);
      }
      circle(g, px, py, R);
      fillStroke(g, vertical(g, py - R, py + R, [C.pink, C.hotPink]));
      circle(g, px, py, R - 16);
      fillStroke(g, C.steel, 3);
    },
  },
};

export default pot;
