import { C, circle, face, fillStroke, oval, vertical } from '../art';
import { drawPizza, sauceIn, toppingsIn } from '../ingredients/pizza';
import { GOLDEN, drawSteam, findStep, type Dish, type HoldState } from '../kit';
import type { ToppingSpot } from '../steps/top';

/** The pizza before anyone has made one (no round to draw from): a bit of everything. */
const SHOW_TOPPINGS: ToppingSpot[] = [
  { id: 'pepperoni', x: 330, y: 312 },
  { id: 'mushroom', x: 470, y: 316 },
  { id: 'pineapple', x: 400, y: 345 },
  { id: 'olive', x: 318, y: 356 },
  { id: 'pepper', x: 482, y: 358 },
  { id: 'tomato', x: 405, y: 305 },
];

const pizza: Dish = {
  id: 'pizza',
  name: 'Pizza',
  steps: [
    // There's no pepperoni emoji, so the card shows the knife.
    { kind: 'chop', item: 'pepperoni', icon: '🔪' },
    { kind: 'sauce', base: 'pizza', sauce: 'tomato-sauce' },
    // The pepperoni you chopped always goes on, with four others picked at random.
    {
      kind: 'top',
      base: 'pizza',
      always: ['pepperoni'],
      extras: ['mushroom', 'pineapple', 'olive', 'pepper', 'tomato'],
      count: 5,
    },
    { kind: 'bake', item: 'pizza', minutes: 15 },
  ],

  draw(g, t, state) {
    // Steam, then the pizza on its board with the toppings you put on.
    drawSteam(g, t, 0, -40, 50);
    oval(g, 0, 22, 138, 64);
    fillStroke(g, vertical(g, -40, 86, [C.woodLight, C.wood]));
    drawPizza(g, 0, 10, 116, 54, {
      sauce: 1,
      cheese: true,
      spread: sauceIn(state),
      toppings: state ? toppingsIn(state) : SHOW_TOPPINGS,
      baked: (state && findStep<HoldState>(state, 'bake')?.state.level) ?? GOLDEN,
    });
    circle(g, 0, 14, 20);
    fillStroke(g, C.cheese, 2.5);
    face(g, 0, 14, 0.8, 'joy');
  },
};

export default pizza;
