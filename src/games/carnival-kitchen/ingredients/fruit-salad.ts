import { C, type G, blend, circle, face, fillStroke, oval, palette, starPath } from '../art';
import type { Ingredient } from '../kit';
import { drawBananaSlice } from './banana';
import { drawBlueberry } from './blueberry';
import { drawKiwiSlice } from './kiwi';
import { drawStrawberryHalf } from './strawberry';

/** This file's own colours: see `palette` in art.ts. */
export const SALAD = palette({
  juice: '#ffe4ea',
  juiceLight: '#fff6f0',
  orange: '#ffb347',
  orangeLight: '#ffd79a',
  grape: '#b07ef0',
  grapeLight: '#d8bfff',
});

/** A mandarin segment: a little orange crescent. */
function drawOrange(g: G, x: number, y: number, s: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.arc(0, s * 0.3, s, Math.PI * 1.15, Math.PI * 1.85);
  g.arc(0, -s * 0.15, s * 0.55, Math.PI * 1.9, Math.PI * 1.1, true);
  g.closePath();
  const fill = g.createLinearGradient(0, -s, 0, 0);
  fill.addColorStop(0, SALAD.orangeLight);
  fill.addColorStop(1, SALAD.orange);
  fillStroke(g, fill, Math.max(1.5, s * 0.12));
  g.restore();
}

/** A purple grape with a shine. */
function drawGrape(g: G, x: number, y: number, r: number) {
  circle(g, x, y, r);
  fillStroke(g, SALAD.grape, Math.max(1.5, r * 0.18));
  g.fillStyle = SALAD.grapeLight;
  circle(g, x - r * 0.35, y - r * 0.35, r * 0.3);
  g.fill();
}

/** The fruit, in rainbow order: strawberry, orange, banana, kiwi, blueberry and grape. */
export type Fruit = 'strawberry' | 'orange' | 'banana' | 'kiwi' | 'blueberry' | 'grape';
export const RAINBOW: Fruit[] = ['strawberry', 'orange', 'banana', 'kiwi', 'blueberry', 'grape'];

/** One piece of fruit centred on (x, y), about `s` across, turned by `rot`. */
export function drawFruit(g: G, fruit: Fruit, x: number, y: number, s: number, rot = 0) {
  if (fruit === 'strawberry') drawStrawberryHalf(g, x, y, s * 0.5, rot);
  else if (fruit === 'orange') drawOrange(g, x, y, s * 0.6, rot);
  else if (fruit === 'banana') drawBananaSlice(g, x, y, s * 0.45);
  else if (fruit === 'kiwi') drawKiwiSlice(g, x, y, s * 0.48);
  else if (fruit === 'blueberry') drawBlueberry(g, x, y, s * 0.32);
  else drawGrape(g, x, y, s * 0.34);
}

/**
 * A heap of rainbow fruit seen from the side: a dome on (x, y), rx wide and
 * ry tall, packed with pieces. `only` limits it to some fruit.
 */
export function drawFruitHeap(
  g: G,
  x: number,
  y: number,
  rx: number,
  ry: number,
  only: Fruit[] = RAINBOW,
) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, Math.PI, Math.PI * 2);
  g.closePath();
  g.fillStyle = SALAD.juice;
  g.fill();
  const s = rx * 0.26;
  let n = 0;
  for (let row = 0; row < 4; row++) {
    const fy = y - ry * (0.08 + row * 0.27);
    const half = rx * Math.sqrt(Math.max(0, 1 - ((y - fy) / ry) ** 2)) - s * 0.35;
    const count = Math.max(1, Math.round((half * 2) / (s * 0.85)));
    for (let i = 0; i < count; i++) {
      const fx = count === 1 ? x : x - half + (i * half * 2) / (count - 1);
      const fruit = only[(n * 5 + row) % only.length];
      drawFruit(g, fruit, fx, fy + ((i * 7) % 5) - 2, s, (n * 1.7) % 6);
      n++;
    }
  }
}

/** Strawberry and banana pieces tumbling round the bowl, coming together as they're mixed. */
const fruitSalad: Ingredient = {
  id: 'fruit-salad',
  label: 'fruit',
  plural: 'fruit',
  icon: '🍓',
  colors: [C.berry, C.butter, C.mint],

  stirred: {
    spoon: C.pink,
    draw(g, { x: px, y: py, r, swirl, done, t }) {
      circle(g, px, py, r);
      const juice = g.createRadialGradient(px - 20, py - 20, 10, px, py, r);
      juice.addColorStop(0, SALAD.juiceLight);
      juice.addColorStop(1, blend([SALAD.juiceLight, SALAD.juice], 0.4 + done * 0.6));
      g.fillStyle = juice;
      g.fill();
      // Swirls in the juice.
      g.strokeStyle = 'rgba(255, 143, 156, 0.4)';
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.beginPath();
        g.arc(px, py, 30 + j * 26, swirl + j * 2.1, swirl + j * 2.1 + 1.3);
        g.stroke();
      }
      // At first the strawberries sit on one side and the bananas on the
      // other; mixing spreads them all round.
      for (let i = 0; i < 18; i++) {
        const berry = i % 2 === 0;
        const ring = 24 + ((i * 29) % 76);
        const clump = (berry ? Math.PI : 0) + ((i % 6) - 2.5) * 0.28;
        const spread = (i / 18) * Math.PI * 2;
        const a = clump + (spread - clump) * done + swirl * (1 - ring / 140) * 0.9;
        const fx = px + Math.cos(a) * ring;
        const fy = py + Math.sin(a) * ring;
        drawFruit(g, berry ? 'strawberry' : 'banana', fx, fy, 40, a + i);
      }
      if (done >= 1) {
        face(g, px, py + 4, 1.1, 'joy');
        for (let k = 0; k < 3; k++) {
          const a = t * 1.5 + (k * Math.PI * 2) / 3;
          starPath(g, px + Math.cos(a) * 52, py + Math.sin(a) * 52, 8, t);
          fillStroke(g, C.gold, 2);
        }
      } else {
        // A little sparkle so the bowl feels alive before it's mixed.
        oval(g, px - r * 0.5, py - r * 0.55, 14, 6, -0.6);
        g.fillStyle = 'rgba(255, 255, 255, 0.7)';
        g.fill();
      }
    },
  },
};

export default fruitSalad;
