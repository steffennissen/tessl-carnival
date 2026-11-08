import { C, fillStroke, starPath } from '../art';
import { findStep, type Dish } from '../kit';
import { drawStack, leanOf, type StackOptions, type StackState } from '../steps/stack';

const LAYERS = ['bun', 'patty', 'cheese-slice', 'pickle', 'lettuce-leaf', 'tomato-slice', 'bun'];
/** A little lean for each layer when nobody cooked it, so it still looks home-made. */
const LEANS = [0, 4, -3, 2, -4, 3, -1];

const cheeseburger: Dish = {
  id: 'cheeseburger',
  name: 'Cheeseburger Tower',
  steps: [
    { kind: 'chop', item: 'pickle' },
    { kind: 'flip', item: 'patty', count: 3 },
    {
      kind: 'stack',
      base: 'burger-plate',
      layers: LAYERS,
      title: 'Stack the burger!',
    },
  ],

  draw(g, time, state) {
    // The tower as it was stacked this round, leaning where it landed, but
    // never so far that it looks like it will fall.
    const run = state && findStep<StackState, StackOptions>(state, 'stack');
    const offsets = run?.state.offsets ?? [];
    const layers = LAYERS.map((id, i) => ({
      id,
      lean: offsets[i] === undefined ? LEANS[i] : leanOf(offsets[i]) * 0.6,
    }));
    g.save();
    g.scale(0.9, 0.9);
    drawStack(g, 0, 62, 'burger-plate', layers, {
      t: time,
      wobble: 0.35,
      total: LAYERS.length,
      mood: (i) => (i === LAYERS.length - 1 ? 'joy' : 'happy'),
    });
    g.restore();

    // Twinkles round it.
    for (const [sx, sy, r, k] of [
      [-112, -40, 11, 0],
      [110, -58, 9, 1],
      [-96, 30, 7, 2],
      [118, 18, 8, 3],
    ]) {
      starPath(g, sx, sy, r + Math.sin(time * 4 + k) * 2, time + k);
      fillStroke(g, k % 2 ? C.gold : C.butter, 2.5);
    }
  },
};

export default cheeseburger;
