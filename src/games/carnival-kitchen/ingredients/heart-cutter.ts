import { C } from '../art';
import type { Ingredient } from '../kit';
import { cutterArt } from './cookies';

/** A heart cookie cutter: it cuts a heart out of the rolled dough. */
const heartCutter: Ingredient = {
  id: 'heart-cutter',
  label: 'heart cutter',
  icon: '💗',
  colors: [C.hotPink, C.dough],
  topping: cutterArt('heart', C.hotPink),
};

export default heartCutter;
