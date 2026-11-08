import { C, starPath } from '../art';
import { drawFruitBowl } from '../ingredients/fruit-bowl';
import { drawStrawberry } from '../ingredients/strawberry';
import { findStep, type Dish } from '../kit';
import type { ToppingSpot, TopState } from '../steps/top';

/** The toppings before anyone has made one (no round to draw from). */
const SHOW_TOPPINGS: ToppingSpot[] = [
  { id: 'blueberry', x: 330, y: 296 },
  { id: 'kiwi', x: 470, y: 298 },
  { id: 'blueberry', x: 455, y: 270 },
  { id: 'kiwi', x: 340, y: 270 },
  { id: 'mint', x: 400, y: 310 },
];

const fruitSalad: Dish = {
  id: 'fruit-salad',
  name: 'Fruit Salad',
  steps: [
    { kind: 'chop', item: 'strawberry' },
    { kind: 'chop', item: 'banana' },
    { kind: 'mix', vessel: 'fruit-bowl', contents: 'fruit-salad' },
    // Blueberries, kiwi slices and a mint leaf, each on its own sparkly spot.
    {
      kind: 'top',
      base: 'fruit-bowl',
      always: ['blueberry', 'kiwi', 'blueberry', 'kiwi', 'mint'],
      extras: [],
      count: 5,
    },
  ],

  draw(g, t, state) {
    // The glass bowl of rainbow fruit with your toppings, and a smiling strawberry on top.
    const toppings = (state && findStep<TopState>(state, 'top')?.state.spots) || SHOW_TOPPINGS;
    drawFruitBowl(g, 0, -6, 0.62, toppings);
    drawStrawberry(g, 0, -52 + Math.sin(t * 3) * 2, 24, 'joy');
    for (const [sx, sy, r] of [
      [-96, -40, 8],
      [92, -48, 9],
      [104, 30, 6],
      [-104, 26, 6],
    ]) {
      starPath(g, sx, sy, r + Math.sin(t * 4 + sx) * 1.5, t);
      g.fillStyle = C.gold;
      g.fill();
    }
  },
};

export default fruitSalad;
