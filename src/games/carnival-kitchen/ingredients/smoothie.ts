import { C, palette } from '../art';
import type { Ingredient } from '../kit';
import { NANA } from './banana';
import { BERRY } from './strawberry';

/** This file's own colours: see `palette` in art.ts. */
export const SMOOTHIE = palette({
  chunky: '#ffc4d2',
  smooth: '#ff9db5',
  light: '#ffe2ec',
});

/** Strawberry, banana and milk in the blender, turning silky pink. */
const smoothie: Ingredient = {
  id: 'smoothie',
  label: 'smoothie',
  icon: '🥤',
  colors: [SMOOTHIE.smooth, C.pink, C.white],

  blended: {
    chunks: [BERRY.main, NANA.main, BERRY.light, NANA.inside],
    chunky: SMOOTHIE.chunky,
    smooth: SMOOTHIE.smooth,
    light: SMOOTHIE.light,
  },
};

export default smoothie;
