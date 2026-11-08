import { C, face, fillStroke, heartPath, oval, starPath, vertical } from '../art';
import { BISQUE } from '../ingredients/bisque';
import { drawLulu } from '../ingredients/lobster-shells';
import { drawSteam, type Dish } from '../kit';

const lobsterBisque: Dish = {
  id: 'lobster-bisque',
  name: 'Lobster Bisque',
  steps: [
    { kind: 'chop', item: 'celery' },
    // Lulu the lobster gives you the shells she has outgrown.
    {
      kind: 'stir',
      vessel: 'pot',
      contents: 'lobster-shells',
      title: 'Stir the shells and veggies!',
    },
    { kind: 'pour', pours: ['sunset-splash'], into: 'pot', inside: 'bisque', amounts: ['1 cup'] },
    { kind: 'blend', blender: 'blender', contents: 'bisque' },
    // Back in the pot, blended smooth, for a swirl of cream.
    { kind: 'pour', pours: ['cream'], into: 'pot', inside: 'bisque', amounts: ['½ cup'] },
  ],

  draw(g, t) {
    // Lulu peeks over the back of the bowl.
    drawLulu(g, 56, -62, 28, t);
    drawSteam(g, t, -20, -30, 34);
    // A pastel-pink bowl.
    g.beginPath();
    g.ellipse(0, -10, 110, 80, 0, 0, Math.PI);
    g.closePath();
    fillStroke(g, vertical(g, -10, 70, [C.pink, C.hotPink]));
    heartPath(g, 0, 36, 13);
    fillStroke(g, C.white, 3);
    oval(g, 0, -10, 112, 24);
    fillStroke(g, C.white);
    // The bisque, with a white cream swirl and chive sprinkles.
    oval(g, 0, -8, 98, 16);
    g.fillStyle = vertical(g, -24, 8, [BISQUE.light, BISQUE.smooth]);
    g.fill();
    g.strokeStyle = C.cream;
    g.lineWidth = 4;
    g.lineCap = 'round';
    g.beginPath();
    for (let k = 0; k <= 40; k++) {
      const a = (k / 40) * Math.PI * 4;
      const r = 4 + k * 0.9;
      g.lineTo(-6 + Math.cos(a + t * 0.5) * r * 1.6, -8 + Math.sin(a + t * 0.5) * r * 0.35);
    }
    g.stroke();
    g.strokeStyle = C.leafDark;
    g.lineWidth = 3;
    for (const [cx, cy, a] of [
      [-60, -10, 0.4],
      [-36, -2, -0.6],
      [30, -14, 0.9],
      [56, -4, -0.3],
      [-14, -16, 1.4],
      [14, 0, -1.1],
    ]) {
      g.beginPath();
      g.moveTo(cx - Math.cos(a) * 4, cy - Math.sin(a) * 2);
      g.lineTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 2);
      g.stroke();
    }
    face(g, 0, 16, 1.1, 'joy');
    starPath(g, -96, -44, 8 + Math.sin(t * 4) * 1.5, t);
    fillStroke(g, C.gold, 2);
  },
};

export default lobsterBisque;
