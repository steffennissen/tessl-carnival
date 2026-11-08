import { C, palette } from '../art';
import type { Ingredient } from '../kit';
import { drawScoopBall } from '../steps/scoop';

const K = palette({ mintCream: '#d8f8ec', mintDark: '#5fcca8', chip: '#7a4a3a' });

/** Mint choc chip ice cream. */
const mintScoop: Ingredient = {
  id: 'mint-scoop',
  label: 'mint ice cream',
  icon: '🍃',
  colors: [C.mint, K.mintCream, K.chip],

  scoop: {
    tub: C.leaf,
    top: K.mintCream,
    meter: [C.leaf, C.mint],
    drawBall: (g, r, mood) =>
      drawScoopBall(g, r, {
        light: K.mintCream,
        main: C.mint,
        dark: K.mintDark,
        chips: K.chip,
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
        light: K.mintCream,
        main: C.mint,
        dark: K.mintDark,
        chips: K.chip,
        mood,
      });
      g.restore();
    },
  },
};

export default mintScoop;
