import { C, face, fillStroke, heartPath, oval, starPath, vertical } from '../art';
import type { Dish } from '../game';

const soup: Dish = {
  id: 'soup',
  name: 'Veggie Soup',
  steps: ['chop', 'stir', 'season'],
  chop: 'carrot',
  // Three shakes of salt.
  pours: 3,

  draw(g, t) {
    // Steam over a pink bowl of soup with carrots, peas and a star.
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.5 + i / 3) % 1;
      g.strokeStyle = `rgba(255, 255, 255, ${0.9 * Math.sin(phase * Math.PI)})`;
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      for (let k = 0; k <= 8; k++)
        g.lineTo(-40 + i * 40 + Math.sin(k + t * 3 + i) * 6, -30 - phase * 40 - k * 5);
      g.stroke();
    }
    g.beginPath();
    g.ellipse(0, -10, 110, 80, 0, 0, Math.PI);
    g.closePath();
    fillStroke(g, vertical(g, -10, 70, [C.pink, C.hotPink]));
    heartPath(g, 0, 36, 13);
    fillStroke(g, C.white, 3);
    oval(g, 0, -10, 112, 24);
    fillStroke(g, C.white);
    oval(g, 0, -8, 98, 16);
    g.fillStyle = vertical(g, -24, 8, [C.soupLight, C.soup]);
    g.fill();
    for (const [dx, dy, kind] of [
      [-56, -8, 0],
      [-20, -4, 1],
      [24, -10, 2],
      [60, -6, 0],
    ]) {
      if (kind === 2) {
        starPath(g, dx, dy, 8);
        fillStroke(g, C.butter, 2);
      } else {
        oval(g, dx, dy, 8, 4);
        fillStroke(g, kind === 0 ? C.carrot : C.leaf, 2);
      }
    }
    face(g, 0, 16, 1.1, 'joy');
  },
};

export default soup;
