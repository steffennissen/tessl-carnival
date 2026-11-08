import { C, fillStroke, oval, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

/** Two juicy tomato slices side by side. */
const tomatoSlice: Ingredient = {
  id: 'tomato-slice',
  label: 'tomato',
  icon: '🍅',
  colors: [C.sauce, C.sauceLight],

  stack: {
    size: () => ({ w: 156, h: 12 }),
    draw(g) {
      for (const dx of [-37, 37]) {
        rounded(g, dx - 40, -13, 80, 13, 6.5);
        fillStroke(g, vertical(g, -13, 0, [C.sauceLight, C.sauce, C.sauceDark]), 3);
        // The seedy middle.
        g.fillStyle = 'rgba(255, 210, 190, 0.55)';
        rounded(g, dx - 30, -10, 60, 6, 3);
        g.fill();
        g.fillStyle = C.butter;
        for (const sx of [-18, -6, 6, 18]) {
          oval(g, dx + sx, -7, 2.4, 1.6);
          g.fill();
        }
      }
    },
  },
};

export default tomatoSlice;
