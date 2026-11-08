import { C } from '../art';
import type { Ingredient } from '../kit';
import { cutterArt } from './cookies';

/** A star cookie cutter: it cuts a star out of the rolled dough. */
const starCutter: Ingredient = {
  id: 'star-cutter',
  label: 'star cutter',
  icon: '⭐',
  colors: [C.gold, C.dough],
  topping: cutterArt('star', C.gold),
};

export default starCutter;
