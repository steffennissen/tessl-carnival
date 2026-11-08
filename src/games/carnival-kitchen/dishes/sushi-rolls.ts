import { C, type Mood, fillStroke, heartPath, oval, rounded, vertical } from '../art';
import { drawSushiSlice, sliceFillings } from '../ingredients/sushi-roll';
import type { Dish } from '../kit';

/** Where the slices sit on the end card's board: two rows of three. */
const SLICES = [
  [-70, -18],
  [0, -22],
  [70, -18],
  [-70, 38],
  [0, 34],
  [70, 38],
] as const;
const MOODS: Mood[] = ['joy', 'happy', 'wow', 'happy', 'joy', 'happy'];

const sushiRolls: Dish = {
  id: 'sushi-rolls',
  name: 'Sushi Rolls',
  steps: [
    { kind: 'chop', item: 'cucumber' },
    {
      kind: 'sauce',
      base: 'nori',
      sauce: 'sushi-rice',
      hint: ['Hold and draw circles', 'to spread the rice!'],
    },
    // Cucumber, carrot and egg always go in, and one more of them at random.
    {
      kind: 'top',
      base: 'nori',
      always: ['cucumber', 'carrot-stick', 'egg-strip'],
      extras: ['cucumber', 'carrot-stick', 'egg-strip'],
      count: 4,
      title: 'Add the fillings!',
      icon: '🥒',
    },
    { kind: 'roll', how: 'mat', item: 'sushi-roll' },
    { kind: 'chop', item: 'sushi-roll' },
  ],

  draw(g, t, state) {
    // Six slices with faces on a wooden board.
    oval(g, 6, 78, 132, 12);
    g.fillStyle = C.shadow;
    g.fill();
    rounded(g, -128, -60, 256, 136, 20);
    fillStroke(g, vertical(g, -60, 76, [C.woodLight, C.wood]));
    g.strokeStyle = 'rgba(211, 141, 80, 0.4)';
    g.lineWidth = 2.5;
    for (const y of [-38, -2, 34, 60]) {
      g.beginPath();
      g.moveTo(-112, y);
      g.bezierCurveTo(-40, y - 6, 40, y + 6, 112, y - 2);
      g.stroke();
    }
    const fillings = sliceFillings(state);
    SLICES.forEach(([x, y], i) => {
      const bob = Math.sin(t * 3 + i * 1.1) * 1.5;
      drawSushiSlice(g, x, y + bob, 30, fillings, MOODS[i]);
    });
    heartPath(g, 112, -60, 10 + Math.sin(t * 4));
    fillStroke(g, C.hotPink, 2.5);
  },
};

export default sushiRolls;
