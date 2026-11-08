import { CONFETTI, rounded } from '../art';
import { cupcakeToppings, drawCupcake } from '../ingredients/cupcake';
import { findStep, type Dish } from '../kit';
import type { TopState } from '../steps/top';

/** The toppings, in the cupcake's own units, when nobody put any on. */
const TOPPINGS = [
  { id: 'sprinkles', x: -40, y: -50 },
  { id: 'candy-heart', x: 44, y: -40 },
  { id: 'cherry', x: 2, y: -112 },
];

const cupcakes: Dish = {
  id: 'cupcakes',
  name: 'Sprinkle Cupcakes',
  steps: [
    { kind: 'crack', item: 'egg' },
    { kind: 'pour', pours: ['flour', 'sugar'] },
    { kind: 'mix', vessel: 'mixing-bowl', contents: 'cupcake-batter' },
    { kind: 'bake', item: 'cupcake-tray' },
    {
      kind: 'top',
      base: 'cupcake',
      always: ['cherry', 'sprinkles', 'candy-heart'],
      extras: [],
      count: 3,
    },
  ],

  draw(g, time, state) {
    const top = state && findStep<TopState>(state, 'top');
    g.save();
    g.translate(0, 14);
    g.scale(0.6, 0.6);
    drawCupcake(g, top ? cupcakeToppings(top.state.spots) : TOPPINGS, 'joy');
    g.restore();

    // Sprinkles bouncing all round it.
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (82 + (i % 4) * 9);
      const bounce = Math.abs(Math.sin(time * 3 + i * 0.7));
      const y = 60 - (i % 7) * 20 - bounce * 16;
      g.save();
      g.translate(x, y);
      g.rotate(time * 2 + i);
      rounded(g, -6, -2.5, 12, 5, 2.5);
      g.fillStyle = CONFETTI[i % CONFETTI.length];
      g.fill();
      g.restore();
    }
  },
};

export default cupcakes;
