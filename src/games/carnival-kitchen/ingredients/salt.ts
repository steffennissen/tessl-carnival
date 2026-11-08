import { C, circle, face, fillStroke, rounded } from '../art';
import type { Ingredient } from '../kit';

const salt: Ingredient = {
  id: 'salt',
  label: 'salt',
  plural: 'salt',
  icon: '🧂',
  // The grains: mostly white, some grey.
  colors: [C.white, C.steelDark],

  /** A glass shaker with a pink cap. */
  shaker: {
    draw(g, left, shaking) {
      rounded(g, -30, -38, 60, 82, 20);
      fillStroke(g, 'rgba(255, 255, 255, 0.8)');
      g.save();
      rounded(g, -27, -35, 54, 76, 17);
      g.clip();
      g.fillStyle = C.cream;
      g.fillRect(-30, 44 - 74 * left, 60, 80);
      g.fillStyle = C.steelDark;
      for (let i = 0; i < 10; i++)
        g.fillRect(-22 + ((i * 13) % 44), 40 - ((i * 29) % Math.max(1, 70 * left)), 2, 2);
      g.restore();
      g.fillStyle = 'rgba(255, 255, 255, 0.9)';
      rounded(g, -22, -28, 7, 50, 4);
      g.fill();
      face(g, 2, 6, 0.85, shaking ? 'joy' : 'happy');
      rounded(g, -33, -62, 66, 28, 12);
      fillStroke(g, C.hotPink);
      g.fillStyle = C.white;
      for (const hx of [-14, 0, 14]) {
        circle(g, hx, -50, 3);
        g.fill();
      }
    },
  },
};

export default salt;
