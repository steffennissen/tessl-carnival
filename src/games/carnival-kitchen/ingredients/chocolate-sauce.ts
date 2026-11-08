import { palette } from '../art';
import type { Ingredient } from '../kit';

const K = palette({
  choc: '#8a5236',
  chocLight: '#b77a52',
  chocDark: '#5e3322',
  swirl: '#d29a6e',
});

/** Warm chocolate sauce, to drizzle over a sundae. */
const chocolateSauce: Ingredient = {
  id: 'chocolate-sauce',
  label: 'chocolate sauce',
  plural: 'chocolate sauce',
  icon: '🍫',
  colors: [K.choc, K.chocLight],

  spread: { light: K.chocLight, main: K.choc, dark: K.chocDark, swirl: K.swirl },
};

export default chocolateSauce;
