import { C, CONFETTI, fillStroke, starPath } from '../art';
import {
  SUNDAE_SCOOPS,
  chocolateIn,
  drawSundae,
  scoopsIn,
  sundaeToppings,
} from '../ingredients/sundae-glass';
import { findStep, type Dish } from '../kit';
import type { TopState } from '../steps/top';

/** The toppings, in the sundae's own units, when nobody put any on. */
const TOPPINGS = [
  { id: 'whipped-cream', x: 0, y: -226 },
  { id: 'sprinkles', x: -20, y: -206 },
  { id: 'cherry', x: 4, y: -250 },
];

const iceCreamSundae: Dish = {
  id: 'ice-cream-sundae',
  name: 'Ice Cream Sundae',
  steps: [
    { kind: 'scoop', flavours: SUNDAE_SCOOPS },
    {
      kind: 'stack',
      base: 'sundae-glass',
      layers: SUNDAE_SCOOPS,
      title: 'Stack the scoops!',
    },
    {
      kind: 'sauce',
      base: 'sundae-glass',
      sauce: 'chocolate-sauce',
      title: 'Drizzle the chocolate!',
      hint: ['Hold and draw', 'circles round it!'],
    },
    {
      kind: 'top',
      base: 'sundae-glass',
      always: ['whipped-cream', 'sprinkles', 'cherry'],
      extras: [],
      count: 3,
    },
  ],

  draw(g, time, state) {
    // A rainbow behind it.
    g.lineCap = 'round';
    [C.hotPink, C.gold, C.mint, C.sky, C.lavender].forEach((color, i) => {
      g.strokeStyle = color;
      g.lineWidth = 7;
      g.beginPath();
      g.arc(0, 40, 112 - i * 8, Math.PI * 1.08, Math.PI * 1.92);
      g.stroke();
    });

    const top = state && findStep<TopState>(state, 'top');
    const spread = chocolateIn(state);
    g.save();
    g.translate(0, 80);
    g.scale(0.64, 0.64);
    drawSundae(g, {
      t: time,
      scoops: scoopsIn(state, 0.3),
      chocolate: spread || !state ? 1 : 0,
      spread: spread ?? undefined,
      toppings: top ? sundaeToppings(top.state.spots) : TOPPINGS,
    });
    g.restore();

    // Sparkles twinkling round it.
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + time * 0.4;
      const x = Math.cos(a) * 96;
      const y = -20 + Math.sin(a) * 66;
      starPath(g, x, y, 6 + Math.sin(time * 5 + k) * 2.5, time + k);
      fillStroke(g, CONFETTI[k % CONFETTI.length], 2);
    }
  },
};

export default iceCreamSundae;
