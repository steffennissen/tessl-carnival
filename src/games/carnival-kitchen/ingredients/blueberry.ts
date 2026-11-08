import { type G, circle, fillStroke, palette, starPath } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
export const BLUE = palette({
  light: '#8fa8ff',
  main: '#5a6fe0',
  dark: '#3d4fb8',
  bloom: '#c9d4ff',
});

/** One blueberry centred on (x, y), radius r, with its little star-shaped crown. */
export function drawBlueberry(g: G, x: number, y: number, r: number) {
  circle(g, x, y, r);
  const body = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  body.addColorStop(0, BLUE.light);
  body.addColorStop(0.6, BLUE.main);
  body.addColorStop(1, BLUE.dark);
  fillStroke(g, body, Math.max(1.5, r * 0.18));
  starPath(g, x + r * 0.15, y - r * 0.2, r * 0.38, 0.3);
  g.fillStyle = BLUE.dark;
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.6)';
  circle(g, x - r * 0.45, y - r * 0.4, r * 0.2);
  g.fill();
}

const blueberry: Ingredient = {
  id: 'blueberry',
  label: 'blueberry',
  plural: 'blueberries',
  icon: '🫐',
  colors: [BLUE.main, BLUE.bloom],

  topping: {
    draw(g) {
      drawBlueberry(g, 0, 0, 12);
    },
    // The face goes a little low, under the crown.
    faceY: 3,
  },
};

export default blueberry;
