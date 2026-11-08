import { C, circle, eggPath, face, fillStroke, oval, palette } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
const K = palette({ shellEdge: '#f0dcc6' });

const egg: Ingredient = {
  id: 'egg',
  label: 'egg',
  icon: '🥚',
  // Bits of shell when it cracks.
  colors: [C.white, C.cream],

  crack: {
    draw(g, mood) {
      eggPath(g, 0, 0, 26, 30);
      const shell = g.createRadialGradient(-8, -12, 2, 0, 0, 36);
      shell.addColorStop(0, C.white);
      shell.addColorStop(0.6, C.cream);
      shell.addColorStop(1, K.shellEdge);
      fillStroke(g, shell, 3.5);
      face(g, 0, 4, 0.8, mood);
    },
    /** The white, and a happy yolk. */
    drawCracked(g, x, y) {
      oval(g, x, y, 30, 11);
      fillStroke(g, C.white, 2.5);
      circle(g, x, y - 3, 11);
      const yolk = g.createRadialGradient(x - 3, y - 7, 1, x, y - 3, 11);
      yolk.addColorStop(0, C.yolkLight);
      yolk.addColorStop(1, C.yolk);
      fillStroke(g, yolk, 2.5);
      face(g, x, y - 2, 0.4, 'joy');
    },
  },
};

export default egg;
