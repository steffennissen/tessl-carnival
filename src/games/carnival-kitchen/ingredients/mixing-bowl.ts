import { C, circle, fillStroke, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';

/**
 * The blue mixing bowl, seen from above for mixing. Eggs, flour and milk go
 * into it from the side: that view is `drawMixingBowl` in kit/scene.ts.
 */
const mixingBowl: Ingredient = {
  id: 'mixing-bowl',
  label: 'bowl',
  icon: '🥣',
  colors: [C.sky, C.skyDark],

  vessel: {
    inset: 24,
    draw(g, px, py, R) {
      shadow(g, px + 8, py + R - 4, R, 22);
      circle(g, px, py, R);
      fillStroke(g, vertical(g, py - R, py + R, [C.sky, C.skyDark]));
      circle(g, px, py, R - 14);
      fillStroke(g, C.white, 3);
    },
  },
};

export default mixingBowl;
