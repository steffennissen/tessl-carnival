import { C, palette } from '../art';
import type { Ingredient } from '../kit';
import { drawScoopBall } from '../steps/scoop';

const K = palette({ berryCream: '#ffd3e6', berryDark: '#f27aab' });

/** Pink strawberry ice cream. */
const strawberryScoop: Ingredient = {
  id: 'strawberry-scoop',
  label: 'strawberry ice cream',
  icon: '🍓',
  colors: [C.pink, K.berryCream, C.hotPink],

  scoop: {
    tub: C.hotPink,
    top: K.berryCream,
    meter: [C.hotPink, C.pink],
    drawBall: (g, r, mood) =>
      drawScoopBall(g, r, { light: K.berryCream, main: C.pink, dark: K.berryDark, mood }),
  },

  /** A ball in a tower of scoops. */
  stack: {
    size: () => ({ w: 76, h: 38 }),
    draw(g, { mood }) {
      g.save();
      g.translate(0, -32);
      drawScoopBall(g, 36, { light: K.berryCream, main: C.pink, dark: K.berryDark, mood });
      g.restore();
    },
  },
};

export default strawberryScoop;
