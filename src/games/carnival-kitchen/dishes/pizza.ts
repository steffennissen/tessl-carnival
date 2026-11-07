import { C, circle, drawPizza, face, fillStroke, oval, vertical } from '../art';
import type { Dish, ToppingSpot } from '../game';
import { BAKE_TARGET } from '../pizza-shape';

/** The pizza before anyone has made one (no round to draw from): a bit of everything. */
const SHOW_TOPPINGS: ToppingSpot[] = [
  { kind: 'pepperoni', x: 330, y: 312, speed: 0 },
  { kind: 'mushroom', x: 470, y: 316, speed: 0 },
  { kind: 'pineapple', x: 400, y: 345, speed: 0 },
  { kind: 'olive', x: 318, y: 356, speed: 0 },
  { kind: 'pepper', x: 482, y: 358, speed: 0 },
  { kind: 'tomato', x: 405, y: 305, speed: 0 },
];

const pizza: Dish = {
  id: 'pizza',
  name: 'Cheesy Pizza',
  steps: ['chop', 'sauce', 'top', 'bake'],
  chop: 'pepperoni',
  pours: 0,

  draw(g, t, state) {
    // Steam, then the pizza on its board with the toppings you put on.
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.5 + i / 3) % 1;
      g.strokeStyle = `rgba(255, 255, 255, ${0.9 * Math.sin(phase * Math.PI)})`;
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      for (let k = 0; k <= 8; k++)
        g.lineTo(-50 + i * 50 + Math.sin(k + t * 3 + i) * 6, -40 - phase * 40 - k * 5);
      g.stroke();
    }
    oval(g, 0, 22, 138, 64);
    fillStroke(g, vertical(g, -40, 86, [C.woodLight, C.wood]));
    drawPizza(g, 0, 10, 116, 54, {
      sauce: 1,
      cheese: true,
      toppings: state?.plan.toppings ?? SHOW_TOPPINGS,
      baked: state?.bake.level ?? BAKE_TARGET,
    });
    circle(g, 0, 14, 20);
    fillStroke(g, C.cheese, 2.5);
    face(g, 0, 14, 0.8, 'joy');
  },
};

export default pizza;
