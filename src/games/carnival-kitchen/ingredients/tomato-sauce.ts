import { C } from '../art';
import type { Ingredient } from '../kit';

/** Tomato sauce, for spreading on pizza. */
const tomatoSauce: Ingredient = {
  id: 'tomato-sauce',
  label: 'sauce',
  icon: '🍅',
  colors: [C.sauce, C.sauceLight],

  spread: {
    light: C.sauceLight,
    main: C.sauce,
    dark: C.sauceDark,
    swirl: 'rgba(255, 170, 140, 0.8)',
  },
};

export default tomatoSauce;
