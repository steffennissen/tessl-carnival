import { C, CONFETTI, fillStroke, oval, rounded } from '../art';
import { drawTaco } from '../ingredients/taco-shell';
import { findStep, type Dish } from '../kit';
import type { TopState } from '../steps/top';

/** Every topping, for a taco nobody has made yet. */
const ALL_TOPPINGS = ['lettuce', 'shredded-cheese', 'tomato', 'avocado'];

const tacos: Dish = {
  id: 'tacos',
  name: 'Tacos',
  steps: [
    { kind: 'chop', item: 'tomato' },
    { kind: 'stir', vessel: 'rice-pan', contents: 'taco-meat' },
    { kind: 'season', shaker: 'taco-spice', food: 'taco-meat', amount: '1 teaspoon' },
    {
      kind: 'top',
      base: 'taco-shell',
      always: ['lettuce', 'shredded-cheese', 'tomato', 'avocado'],
      extras: [],
      count: 4,
    },
  ],

  draw(g, t, state) {
    const spots = state && findStep<TopState>(state, 'top')?.state.spots;
    const toppings = spots?.length ? [...new Set(spots.map((s) => s.id))] : ALL_TOPPINGS;

    // A confetti burst behind, popping out again and again.
    for (let i = 0; i < 26; i++) {
      const phase = (t * 0.45 + i / 26) % 1;
      const a = i * 2.39996;
      const d = 50 + phase * 100;
      g.save();
      g.globalAlpha = Math.sin(phase * Math.PI);
      g.translate(Math.cos(a) * d * 1.15, -20 + Math.sin(a) * d * 0.7 + phase * 20);
      g.rotate(a + t * 3);
      rounded(g, -7, -3.5, 14, 7, 2.5);
      g.fillStyle = CONFETTI[i % CONFETTI.length];
      g.fill();
      g.restore();
    }
    g.globalAlpha = 1;

    // The plate, and two tacos leaning on each other.
    oval(g, 0, 58, 124, 26);
    fillStroke(g, C.white);
    oval(g, 0, 56, 100, 17);
    g.strokeStyle = C.sky;
    g.lineWidth = 3;
    g.stroke();
    for (const [x, rot, order] of [
      [-60, -0.14, 0],
      [60, 0.14, 1],
    ]) {
      g.save();
      g.translate(x, 8 + Math.sin(t * 3 + order * 1.5) * 2);
      g.rotate(rot);
      drawTaco(g, 0, 0, 58, order ? [...toppings].reverse() : toppings);
      g.restore();
    }
  },
};

export default tacos;
