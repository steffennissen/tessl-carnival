import { C, palette } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
const K = palette({ rice: '#fffdf7', riceShade: '#efe8da', riceToast: '#e9d9b8' });

/** Sticky sushi rice, spread on the nori with a spoon. */
const sushiRice: Ingredient = {
  id: 'sushi-rice',
  label: 'rice',
  plural: 'rice',
  icon: '🍚',
  colors: [C.white, K.rice],

  spread: { light: C.white, main: K.rice, dark: K.riceToast, swirl: K.riceShade },
};

export default sushiRice;
