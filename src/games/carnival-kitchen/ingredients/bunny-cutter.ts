import { C } from '../art';
import type { Ingredient } from '../kit';
import { cutterArt } from './cookies';

/** A bunny cookie cutter: it cuts a bunny out of the rolled dough. */
const bunnyCutter: Ingredient = {
  id: 'bunny-cutter',
  label: 'bunny cutter',
  icon: '🐰',
  colors: [C.lavender, C.dough],
  topping: cutterArt('bunny', C.lavender),
};

export default bunnyCutter;
