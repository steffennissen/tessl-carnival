import { C, type G, blend, circle, fillStroke, oval, palette, rounded } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: rice that turns rosy as the ketchup stirs in. */
const K = palette({ rosy: '#ffb08a', rosyGrain: '#ffd2b8', onion: '#d9c2f7' });

/** A rice grain's colour, from plain white to rosy ketchup rice as `done` goes 0 to 1. */
export function riceColor(done: number) {
  return blend([C.cream, K.rosyGrain], done);
}

/**
 * A heap of ketchup rice, with peas, carrot and onion, seen from above in a
 * circle of radius r round (x, y). Everything turns with `swirl`.
 */
export function drawRice(g: G, x: number, y: number, r: number, swirl: number, done: number) {
  circle(g, x, y, r);
  const heap = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 6, x, y, r);
  heap.addColorStop(0, C.white);
  heap.addColorStop(0.6, blend([C.cream, K.rosy], done * 0.8));
  heap.addColorStop(1, blend([C.mushroom, C.soup], done * 0.8));
  g.fillStyle = heap;
  g.fill();

  // Grains, round and round, spread out by a little golden-angle trick.
  const grain = riceColor(done);
  const count = Math.round((r * r) / 75);
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996 + swirl;
    const d = Math.sqrt((i + 0.5) / count) * r * 0.94;
    const size = Math.max(2.5, r / 22);
    oval(g, x + Math.cos(a) * d, y + Math.sin(a) * d, size, size * 0.55, a * 3 + i);
    fillStroke(g, grain, 1.2, 'rgba(91, 59, 79, 0.4)');
  }

  // Peas, carrot cubes and bits of onion.
  for (let i = 0; i < 16; i++) {
    const a = i * 1.7 + 0.5 + swirl;
    const d = (0.2 + ((i * 37) % 10) / 13) * r * 0.85;
    const bx = x + Math.cos(a) * d;
    const by = y + Math.sin(a) * d;
    if (i % 3 === 0) {
      circle(g, bx, by, 5.5);
      fillStroke(g, C.leaf, 2);
    } else if (i % 3 === 1) {
      rounded(g, bx - 5, by - 5, 10, 10, 3);
      fillStroke(g, C.carrot, 2);
    } else {
      oval(g, bx, by, 7, 3.5, a);
      fillStroke(g, K.onion, 2);
    }
  }
}

/** Rice, stirred in the frying pan till it's rosy with ketchup. */
const rice: Ingredient = {
  id: 'rice',
  label: 'rice',
  plural: 'rice',
  icon: '🍚',
  colors: [C.white, K.rosy, C.leaf],

  stirred: {
    spoon: C.woodLight,
    draw(g, { x, y, r, swirl, done, t }) {
      drawRice(g, x, y, r, swirl, done);
      // Sizzle: little bubbles popping round the edge.
      for (let i = 0; i < 8; i++) {
        const phase = (t * 1.5 + i * 0.31) % 1;
        const a = i * 0.79 + 0.2;
        g.strokeStyle = `rgba(255, 255, 255, ${0.85 * (1 - phase)})`;
        g.lineWidth = 2;
        circle(g, x + Math.cos(a) * (r - 8), y + Math.sin(a) * (r - 8), 2 + phase * 4);
        g.stroke();
      }
    },
  },
};

export default rice;
