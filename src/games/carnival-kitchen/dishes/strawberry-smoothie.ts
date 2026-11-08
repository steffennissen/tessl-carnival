import { C, type G, circle, face, fillStroke, heartPath, shadow, starPath, vertical } from '../art';
import { SMOOTHIE } from '../ingredients/smoothie';
import { drawStrawberry } from '../ingredients/strawberry';
import type { Dish } from '../kit';

/** A bendy straw, pink and white stripes, from (x, y) up and over to the right. */
function drawStraw(g: G, x: number, y: number) {
  const path = () => {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 6, y - 62);
    g.quadraticCurveTo(x + 8, y - 80, x + 26, y - 84);
    g.lineTo(x + 50, y - 90);
  };
  path();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = 17;
  g.strokeStyle = C.ink;
  g.stroke();
  g.lineWidth = 11;
  g.strokeStyle = C.white;
  g.stroke();
  g.setLineDash([9, 9]);
  g.strokeStyle = C.hotPink;
  g.stroke();
  g.setLineDash([]);
  // The bendy bit's little ridges.
  g.strokeStyle = 'rgba(91, 59, 79, 0.45)';
  g.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.arc(x + 24, y - 64, 12 + k * 4, Math.PI * 1.05, Math.PI * 1.35);
    g.stroke();
  }
}

const strawberrySmoothie: Dish = {
  id: 'strawberry-smoothie',
  name: 'Strawberry Smoothie',
  steps: [
    { kind: 'chop', item: 'strawberry' },
    { kind: 'chop', item: 'banana' },
    { kind: 'pour', pours: ['milk'] },
    { kind: 'blend', blender: 'blender', contents: 'smoothie' },
  ],

  draw(g, t) {
    // A tall glass of pink smoothie with a bendy straw and a strawberry on the rim.
    const top = -78;
    const foot = 74;
    const glass = (inset: number) => {
      g.beginPath();
      g.moveTo(-50 + inset, top);
      g.lineTo(50 - inset, top);
      g.lineTo(38 - inset, foot - 8);
      g.quadraticCurveTo(36 - inset, foot - inset * 0.5, 26 - inset, foot - inset * 0.5);
      g.lineTo(-26 + inset, foot - inset * 0.5);
      g.quadraticCurveTo(-36 + inset, foot - inset * 0.5, -38 + inset, foot - 8);
      g.closePath();
    };
    shadow(g, 0, foot + 6, 64, 9);
    drawStraw(g, 12, top + 30);
    // The glass, then the smoothie inside it.
    glass(0);
    fillStroke(g, 'rgba(223, 242, 255, 0.5)', 4);
    g.save();
    glass(5);
    g.clip();
    g.fillStyle = vertical(g, top + 8, foot, [SMOOTHIE.light, SMOOTHIE.smooth, C.hotPink]);
    g.fillRect(-60, top + 14, 120, foot - top);
    // A frothy top.
    g.fillStyle = SMOOTHIE.light;
    for (let k = -2; k <= 2; k++) {
      circle(g, k * 19, top + 14 + Math.sin(t * 3 + k) * 1.5, 12);
      g.fill();
    }
    // Bubbles rising.
    for (let i = 0; i < 5; i++) {
      const phase = (t * 0.6 + i * 0.23) % 1;
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
      g.lineWidth = 2;
      circle(g, -24 + i * 12, foot - 16 - phase * 100, 2 + phase * 3);
      g.stroke();
    }
    g.restore();
    glass(0);
    g.lineWidth = 4;
    g.strokeStyle = C.ink;
    g.stroke();
    // Shine on the glass.
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    g.beginPath();
    g.moveTo(-42, top + 10);
    g.lineTo(-32, top + 10);
    g.lineTo(-26, foot - 18);
    g.lineTo(-32, foot - 18);
    g.closePath();
    g.fill();
    heartPath(g, 0, 46, 10);
    fillStroke(g, C.white, 2.5);
    face(g, 0, 18, 1, 'joy');
    // The strawberry on the rim, with a notch over the glass.
    drawStrawberry(g, -48, top + 4, 22, 'happy');
    // Sparkles.
    for (const [sx, sy, r] of [
      [70, -40, 9],
      [-80, 20, 7],
      [64, 40, 6],
    ]) {
      starPath(g, sx, sy, r + Math.sin(t * 4 + sx) * 1.5, t);
      fillStroke(g, C.gold, 2);
    }
  },
};

export default strawberrySmoothie;
