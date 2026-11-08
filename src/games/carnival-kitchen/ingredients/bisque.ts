import { palette } from '../art';
import type { Ingredient } from '../kit';
import { CELERY } from './celery';
import { LULU } from './lobster-shells';

/** This file's own colours: see `palette` in art.ts. */
export const BISQUE = palette({
  chunky: '#ffb592',
  smooth: '#ffaab4',
  light: '#ffe0e4',
});

/** Lobster bisque: Lulu's outgrown shells, celery and seafood stock, blended silky and pink. */
const bisque: Ingredient = {
  id: 'bisque',
  label: 'bisque',
  icon: '🥣',
  colors: [BISQUE.smooth, BISQUE.light, LULU.light],

  blended: {
    chunks: [LULU.main, CELERY.main, LULU.light, CELERY.light],
    chunky: BISQUE.chunky,
    smooth: BISQUE.smooth,
    light: BISQUE.light,
  },
};

export default bisque;
