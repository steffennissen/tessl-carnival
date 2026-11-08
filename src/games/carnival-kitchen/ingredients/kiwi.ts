import { type G, circle, fillStroke, oval, palette } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
export const KIWI = palette({
  skin: '#b98a5a',
  flesh: '#8fd85a',
  light: '#c8f08a',
  core: '#fbfbe0',
  seed: '#4a3a3a',
});

/** A round kiwi slice centred on (x, y), radius r: green with a pale middle and a ring of seeds. */
export function drawKiwiSlice(g: G, x: number, y: number, r: number) {
  circle(g, x, y, r);
  fillStroke(g, KIWI.skin, Math.max(1.5, r * 0.15));
  circle(g, x, y, r * 0.86);
  const flesh = g.createRadialGradient(x, y, r * 0.1, x, y, r * 0.86);
  flesh.addColorStop(0, KIWI.light);
  flesh.addColorStop(1, KIWI.flesh);
  g.fillStyle = flesh;
  g.fill();
  oval(g, x, y, r * 0.3, r * 0.22);
  g.fillStyle = KIWI.core;
  g.fill();
  g.fillStyle = KIWI.seed;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    oval(g, x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.09, r * 0.05, a);
    g.fill();
  }
}

const kiwi: Ingredient = {
  id: 'kiwi',
  label: 'kiwi',
  icon: '🥝',
  colors: [KIWI.flesh, KIWI.light],

  topping: {
    draw(g) {
      drawKiwiSlice(g, 0, 0, 13);
    },
    faceY: 0,
  },
};

export default kiwi;
