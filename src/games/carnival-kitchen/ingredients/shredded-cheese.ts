import { C, fillStroke, palette, rounded } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: orange cheddar. */
const K = palette({ cheddar: '#ffb347' });

/** Shredded cheese, for on top: a little pile of yellow and orange strands. */
const shreddedCheese: Ingredient = {
  id: 'shredded-cheese',
  label: 'cheese',
  plural: 'cheese',
  icon: '🧀',
  colors: [C.cheeseGold, K.cheddar],

  topping: {
    draw(g) {
      const strands: [number, number, number][] = [
        [-6, 4, 0.5],
        [5, 5, -0.6],
        [0, -1, 0.1],
        [-7, -4, -0.9],
        [7, -4, 1.1],
        [0, 7, 1.5],
        [1, -8, -0.3],
      ];
      strands.forEach(([x, y, rot], i) => {
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        rounded(g, -9, -2.6, 18, 5.2, 2.6);
        fillStroke(g, i % 2 ? K.cheddar : C.cheeseGold, 1.8);
        g.fillStyle = 'rgba(255, 255, 255, 0.55)';
        rounded(g, -6, -1.6, 9, 1.6, 0.8);
        g.fill();
        g.restore();
      });
    },
  },
};

export default shreddedCheese;
