import { palette } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: bright tomato ketchup. */
const K = palette({
  light: '#ff6b74',
  main: '#e8303f',
  dark: '#b5222f',
  swirl: 'rgba(255, 190, 190, 0.85)',
});

/** Ketchup, for drawing a heart on the omelette. */
const ketchup: Ingredient = {
  id: 'ketchup',
  label: 'ketchup',
  plural: 'ketchup',
  // There's no ketchup emoji: a tomato is closest.
  icon: '🍅',
  colors: [K.main, K.light],

  spread: { light: K.light, main: K.main, dark: K.dark, swirl: K.swirl },
};

export default ketchup;
