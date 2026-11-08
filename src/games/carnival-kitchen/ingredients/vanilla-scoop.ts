import { C, palette } from '../art';
import type { Ingredient } from '../kit';
import { drawScoopBall } from '../steps/scoop';

const K = palette({ vanilla: '#fff1c4', vanillaDark: '#f3d27e' });

/** Creamy vanilla ice cream with golden specks. */
const vanillaScoop: Ingredient = {
  id: 'vanilla-scoop',
  label: 'vanilla ice cream',
  icon: '🍦',
  colors: [K.vanilla, C.butter, C.white],

  scoop: {
    tub: C.gold,
    top: K.vanilla,
    meter: [C.gold, C.butter],
    drawBall: (g, r, mood) =>
      drawScoopBall(g, r, {
        light: C.white,
        main: K.vanilla,
        dark: K.vanillaDark,
        chips: 'rgba(214, 150, 70, 0.5)',
        mood,
      }),
  },

  /** A ball in a tower of scoops. */
  stack: {
    size: () => ({ w: 76, h: 38 }),
    draw(g, { mood }) {
      g.save();
      g.translate(0, -32);
      drawScoopBall(g, 36, {
        light: C.white,
        main: K.vanilla,
        dark: K.vanillaDark,
        chips: 'rgba(214, 150, 70, 0.5)',
        mood,
      });
      g.restore();
    },
  },
};

export default vanillaScoop;
