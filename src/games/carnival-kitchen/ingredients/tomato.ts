import { C, circle, fillStroke, oval, vertical } from '../art';
import type { Ingredient } from '../kit';

/** Tomato slices, for on top. The sauce is tomato-sauce.ts. */
const tomato: Ingredient = {
  id: 'tomato',
  label: 'tomato',
  plural: 'tomatoes',
  icon: '🍅',
  colors: [C.berry, C.sauceLight],

  topping: {
    draw(g) {
      circle(g, 0, 0, 12);
      fillStroke(g, vertical(g, -12, 12, [C.sauceLight, C.berry]), 2.5);
      g.fillStyle = 'rgba(255, 230, 160, 0.9)';
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        oval(g, Math.cos(a) * 6, Math.sin(a) * 6, 2.6, 1.6, a);
        g.fill();
      }
    },
  },
};

export default tomato;
