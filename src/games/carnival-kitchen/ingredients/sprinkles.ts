import { C, CONFETTI, rounded } from '../art';
import type { Ingredient } from '../kit';

/** Where each sprinkle in a pinch lies, and which way. */
const BITS = [
  [-9, -6, 0.4],
  [6, -9, -0.7],
  [10, 3, 1.2],
  [-3, 7, -0.2],
  [-11, 4, 1.6],
  [1, -1, 0.9],
  [8, 10, -1.1],
  [-6, -12, 2.2],
];

/** A pinch of rainbow sprinkles. */
const sprinkles: Ingredient = {
  id: 'sprinkles',
  label: 'sprinkles',
  plural: 'sprinkles',
  icon: '🌈',
  colors: [C.hotPink, C.sky, C.gold, C.mint],

  topping: {
    draw(g) {
      BITS.forEach(([x, y, rot], i) => {
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        rounded(g, -5, -2, 10, 4, 2);
        g.fillStyle = CONFETTI[i % CONFETTI.length];
        g.fill();
        g.lineWidth = 1.2;
        g.strokeStyle = 'rgba(91, 59, 79, 0.5)';
        g.stroke();
        g.restore();
      });
    },
    // A scatter has no middle for a face, so it goes on a sign.
    ring: true,
  },
};

export default sprinkles;
