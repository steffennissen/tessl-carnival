import { C, type G, face, fillStroke, heartPath, oval, vertical } from '../art';
import { drawSpaghettiNest } from '../ingredients/spaghetti';
import type { Dish } from '../kit';

/** A heart-shaped curl of lavender steam that rises and fades, so it shows on white. */
function heartSteam(g: G, t: number, x: number, y: number) {
  const phase = (t * 0.4) % 1;
  const alpha = 0.45 + 0.55 * Math.sin(phase * Math.PI);
  const rise = phase * 26;
  g.lineCap = 'round';
  g.lineWidth = 6;
  g.strokeStyle = `rgba(190, 150, 255, ${alpha})`;
  // A wavy tail up from the pasta, then the heart.
  g.beginPath();
  for (let k = 0; k <= 6; k++) g.lineTo(x + Math.sin(k * 1.1 + t * 3) * 5, y - rise - k * 5);
  g.stroke();
  heartPath(g, x + Math.sin(t * 2) * 3, y - rise - 48, 16 + alpha * 3);
  g.stroke();
  for (const side of [-1, 1]) {
    const p = (phase + 0.5) % 1;
    g.strokeStyle = `rgba(205, 178, 255, ${0.6 * Math.sin(p * Math.PI)})`;
    g.beginPath();
    for (let k = 0; k <= 6; k++) {
      g.lineTo(x + side * 50 + Math.sin(k + t * 3 + side) * 5, y + 6 - p * 26 - k * 5);
    }
    g.stroke();
  }
}

const cacioEPepe: Dish = {
  id: 'cacio-e-pepe',
  name: 'Cheesy Pepper Twirl',
  steps: [
    { kind: 'grate', item: 'pecorino' },
    { kind: 'season', shaker: 'black-pepper', food: 'pecorino', shakes: 3, amount: '¼ teaspoon' },
    // Into the bowl of peppery cheese, to mix into a cream.
    { kind: 'pour', pours: ['pasta-water'], into: 'pecorino', amounts: ['¼ cup'] },
    { kind: 'mix', vessel: 'mixing-bowl', contents: 'cheese-cream' },
    { kind: 'toss', item: 'spaghetti' },
  ],

  draw(g, t) {
    // The blue bowl, seen from the side, with a heart on it.
    g.beginPath();
    g.ellipse(0, 6, 112, 76, 0, 0, Math.PI);
    g.closePath();
    fillStroke(g, vertical(g, 6, 82, [C.sky, C.skyDark]));
    g.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (const [dx, dy] of [
      [-70, 30],
      [-30, 50],
      [30, 50],
      [70, 30],
    ]) {
      oval(g, dx, dy, 5, 4);
      g.fill();
    }
    oval(g, 0, 6, 114, 26);
    fillStroke(g, C.white);
    oval(g, 0, 8, 100, 18);
    g.fillStyle = C.skyLight;
    g.fill();
    // The twirly nest, snowy with cheese and freckled with pepper.
    drawSpaghettiNest(g, 0, 4, 92, {
      t,
      twirl: Math.sin(t * 0.8) * 0.15,
      dome: 0.42,
      snow: true,
      pepper: true,
      mood: null,
    });
    face(g, 0, 50, 0.9, 'joy');
    // Steam last, so the heart floats in front.
    heartSteam(g, t, 0, -46);
  },
};

export default cacioEPepe;
