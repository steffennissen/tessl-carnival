import { C, fillStroke, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A strip of sweet rolled omelette, for a sushi filling. */
const eggStrip: Ingredient = {
  id: 'egg-strip',
  label: 'egg',
  icon: '🍳',
  colors: [C.yolk, C.yolkLight],

  topping: {
    draw(g) {
      rounded(g, -16, -6.5, 32, 13, 3.5);
      fillStroke(g, vertical(g, -6.5, 6.5, [C.yolkLight, C.yolk]), 2.2);
      // The thin layers of a rolled omelette.
      g.strokeStyle = 'rgba(219, 151, 67, 0.55)';
      g.lineWidth = 1;
      for (const y of [-2, 2.5]) {
        g.beginPath();
        g.moveTo(-13, y);
        g.lineTo(13, y);
        g.stroke();
      }
    },
  },
};

export default eggStrip;
