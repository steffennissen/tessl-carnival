import { C, circle, face, fillStroke, heartPath, oval, vertical } from '../art';
import type { Dish } from '../kit';

const pancakes: Dish = {
  id: 'pancakes',
  name: 'Pancakes',
  steps: [
    { kind: 'crack', item: 'egg' },
    { kind: 'pour', pours: ['flour', 'milk'], amounts: ['1½ cups', '1 cup'] },
    { kind: 'mix', vessel: 'mixing-bowl', contents: 'batter' },
    { kind: 'flip', item: 'pancake' },
  ],
  // The eggs, or the flour and milk, can go in the bowl first.
  either: [[0, 1]],

  draw(g) {
    // A stack on a plate, with cream and strawberry hearts on top.
    oval(g, 0, 42, 112, 28);
    fillStroke(g, C.white);
    oval(g, 0, 40, 86, 18);
    g.strokeStyle = C.sky;
    g.lineWidth = 3;
    g.stroke();
    for (let i = 0; i < 4; i++) {
      const y = 30 - i * 18;
      oval(g, 0, y + 7, 84, 22);
      fillStroke(g, C.pancakeDark, 3.5);
      oval(g, 0, y, 84, 22);
      fillStroke(
        g,
        i === 3 ? vertical(g, y - 22, y + 22, [C.pancakeLight, C.pancake]) : C.pancake,
        3.5,
      );
    }
    face(g, 0, 32, 1.1, 'joy');
    for (const [cx, cy, r] of [
      [-20, -30, 14],
      [12, -32, 16],
      [-2, -44, 13],
    ]) {
      circle(g, cx, cy, r);
      fillStroke(g, C.white, 3);
    }
    for (const [bx, by, rot] of [
      [4, -64, Math.PI],
      [-34, -48, Math.PI + 0.5],
    ]) {
      g.save();
      g.translate(bx, by);
      g.rotate(rot);
      heartPath(g, 0, 0, 13);
      fillStroke(g, C.berry, 3);
      g.restore();
    }
  },
};

export default pancakes;
