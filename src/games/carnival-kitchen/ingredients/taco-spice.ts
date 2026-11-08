import { C, circle, face, fillStroke, palette, rounded, starPath, vertical } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: warm, sunny taco spice. */
const K = palette({ spice: '#e8662e', spiceLight: '#ffa25c', cap: '#ff7a3d' });

/** Taco spice in a glass jar with an orange cap and a star on its label. */
const tacoSpice: Ingredient = {
  id: 'taco-spice',
  label: 'taco spice',
  plural: 'taco spice',
  icon: '🌶️',
  amount: '1 teaspoon',
  // The grains: mostly orange, some red.
  colors: [K.spice, C.berry],

  shaker: {
    draw(g, left, shaking) {
      // The glass jar, with the spice inside going down as it shakes out.
      rounded(g, -30, -40, 60, 86, 18);
      fillStroke(g, 'rgba(255, 255, 255, 0.8)');
      g.save();
      rounded(g, -27, -37, 54, 80, 15);
      g.clip();
      g.fillStyle = vertical(g, -37, 43, [K.spiceLight, K.spice]);
      g.fillRect(-30, 43 - 78 * left, 60, 84);
      g.fillStyle = C.berry;
      for (let i = 0; i < 12; i++)
        g.fillRect(-22 + ((i * 13) % 44), 40 - ((i * 29) % Math.max(1, 72 * left)), 2.5, 2.5);
      g.restore();
      // The label, with a face on it.
      rounded(g, -26, -12, 52, 40, 10);
      fillStroke(g, C.cream, 3);
      starPath(g, 16, -2, 5, 0.2);
      fillStroke(g, C.gold, 1.5);
      face(g, 0, 8, 0.85, shaking ? 'joy' : 'happy');
      g.fillStyle = 'rgba(255, 255, 255, 0.9)';
      rounded(g, -23, -32, 6, 16, 3);
      g.fill();
      // The cap, with holes to shake through.
      rounded(g, -34, -66, 68, 30, 12);
      fillStroke(g, vertical(g, -66, -36, [K.spiceLight, K.cap]));
      g.fillStyle = C.white;
      for (const hx of [-14, 0, 14]) {
        circle(g, hx, -53, 3);
        g.fill();
      }
    },
  },
};

export default tacoSpice;
