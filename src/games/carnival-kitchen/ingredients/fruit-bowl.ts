import { C, type G, fillStroke, oval, palette, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';
import type { ToppingSpot } from '../steps/top';
import { drawFruitHeap } from './fruit-salad';
import { artOf } from './index';

/** This file's own colours: see `palette` in art.ts. */
const GLASS = palette({ tint: '#dff2ff', edge: '#9fd8ff' });

/** Where the fruit's top sits while the toppings go on, seen a little from the side. */
export const FRUIT_TOP = { x: 400, y: 288, rx: 150, ry: 42 } as const;

/** How many pieces of each topping go on its spot. */
const PIECES: Record<string, [number, number, number][]> = {
  blueberry: [
    [-12, 3, 0.9],
    [12, 1, 0.9],
    [0, -10, 0.9],
  ],
  kiwi: [
    [-12, 0, 1.15],
    [12, -5, 1.15],
  ],
};
const ONE: [number, number, number][] = [[0, 0, 1.5]];

/**
 * A glass bowl of rainbow fruit seen from the side, with `toppings` on top
 * (spots on FRUIT_TOP), drawn at (x, y) and `scale` times FRUIT_TOP's size:
 * (x, y) is the middle of the fruit's top.
 */
export function drawFruitBowl(
  g: G,
  x: number,
  y: number,
  scale: number,
  toppings: readonly ToppingSpot[],
) {
  const rx = (FRUIT_TOP.rx + 22) * scale;
  const rim = y + 10 * scale;
  const deep = 104 * scale;
  shadow(g, x, rim + deep + 14 * scale, rx * 0.7, 10 * scale);
  // The foot.
  oval(g, x, rim + deep + 6 * scale, rx * 0.42, 10 * scale);
  fillStroke(g, vertical(g, rim + deep, rim + deep + 16 * scale, [GLASS.tint, GLASS.edge]), 3.5);
  // The glass bowl's back half, then the fruit inside it, then its front.
  const bowl = () => {
    g.beginPath();
    g.ellipse(x, rim, rx, deep, 0, 0, Math.PI);
    g.closePath();
  };
  bowl();
  g.fillStyle = 'rgba(223, 242, 255, 0.7)';
  g.fill();
  g.save();
  bowl();
  g.clip();
  drawFruitHeap(g, x, rim + deep * 0.95, rx * 0.96, deep * 0.95);
  g.restore();
  // The heap above the rim, the strawberry and banana you chopped, where the toppings go.
  drawFruitHeap(g, x, rim + 2 * scale, rx * 0.9, 58 * scale, ['strawberry', 'banana']);
  // Glass over the fruit: a tint, shine and an ink edge.
  bowl();
  g.fillStyle = 'rgba(223, 242, 255, 0.22)';
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = C.ink;
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 6 * scale;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(x, rim, rx * 0.85, deep * 0.82, 0, Math.PI * 0.62, Math.PI * 0.86);
  g.stroke();
  // The rim, a glassy ring in front.
  g.beginPath();
  g.ellipse(x, rim, rx, 14 * scale, 0, 0, Math.PI);
  g.lineWidth = 5 * scale;
  g.strokeStyle = GLASS.edge;
  g.stroke();
  // The toppings, on their spots.
  for (const spot of toppings) {
    const art = artOf(spot.id, 'topping');
    const sx = x + (spot.x - FRUIT_TOP.x) * scale;
    const sy = y + (spot.y - FRUIT_TOP.y) * scale;
    for (const [dx, dy, s] of (!spot.single && PIECES[spot.id]) || ONE) {
      g.save();
      g.translate(sx + dx * scale, sy + dy * scale);
      g.rotate((dx + dy) * 0.05);
      g.scale(s * scale, s * scale);
      art.draw(g);
      g.restore();
    }
  }
}

/** A footed glass fruit bowl: mixed in from above, topped from the side. */
const fruitBowl: Ingredient = {
  id: 'fruit-bowl',
  label: 'bowl',
  icon: '🥣',
  colors: [GLASS.tint, GLASS.edge],

  vessel: {
    inset: 22,
    draw(g, px, py, R) {
      shadow(g, px + 8, py + R - 4, R, 22);
      oval(g, px, py, R, R);
      fillStroke(g, vertical(g, py - R, py + R, [GLASS.tint, GLASS.edge]));
      oval(g, px, py, R - 12, R - 12);
      fillStroke(g, C.white, 3);
      g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(px, py, R - 6, Math.PI * 1.1, Math.PI * 1.4);
      g.stroke();
    },
  },

  toppingBase: {
    area: FRUIT_TOP,
    splash: [C.pink, C.butter, C.mint],
    draw(g, { toppings }) {
      drawFruitBowl(g, FRUIT_TOP.x, FRUIT_TOP.y, 1, toppings);
    },
  },
};

export default fruitBowl;
