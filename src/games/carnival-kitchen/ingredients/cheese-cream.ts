import { C, blend, circle, face, palette } from '../art';
import type { Ingredient } from '../kit';
import { PECORINO } from './pecorino';

const K = palette({
  water: '#eaf3f8',
  pepper: '#4a3a44',
});

/**
 * Cheese cream for cacio e pepe: grated pecorino and pepper in cloudy pasta
 * water, mixed into a smooth, glossy white cream.
 */
const cheeseCream: Ingredient = {
  id: 'cheese-cream',
  label: 'cheese cream',
  plural: 'cheese cream',
  icon: '🥣',
  colors: [PECORINO.cheeseLight, PECORINO.cheese],

  stirred: {
    spoon: C.white,
    draw(g, { x: px, y: py, r, swirl, done: smooth, t }) {
      circle(g, px, py, r);
      const cream = g.createRadialGradient(px - 24, py - 24, 8, px, py, r);
      cream.addColorStop(0, blend([K.water, PECORINO.cheeseLight], smooth));
      cream.addColorStop(0.75, blend([K.water, PECORINO.cheese], smooth));
      cream.addColorStop(1, blend([C.skyLight, PECORINO.cheeseShade], smooth));
      g.fillStyle = cream;
      g.fill();

      // Silky swirls.
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.strokeStyle = `rgba(255, 255, 255, ${0.6 + 0.3 * smooth})`;
        g.lineWidth = 7 - j * 1.5;
        g.beginPath();
        g.arc(px, py, 28 + j * 30, swirl + j * 2.1, swirl + j * 2.1 + 1.6);
        g.stroke();
      }

      // Clumps of grated cheese that melt in as you mix.
      for (let i = 0; i < 9; i++) {
        const left = 1 - smooth * 1.15 + (i % 3) * 0.04;
        if (left <= 0) continue;
        const a = i * 0.7 + swirl * 0.9 + t * 0.03;
        const br = 22 + ((i * 41) % 78);
        const cx = px + Math.cos(a) * br;
        const cy = py + Math.sin(a) * br;
        const size = 11 * Math.min(1, left);
        g.fillStyle = PECORINO.cheese;
        g.strokeStyle = PECORINO.cheeseShade;
        g.lineWidth = 2;
        circle(g, cx, cy, size);
        g.fill();
        g.stroke();
        circle(g, cx + size * 0.6, cy - size * 0.4, size * 0.6);
        g.fill();
        g.stroke();
      }

      // Pepper freckles, going round with the spoon.
      g.fillStyle = K.pepper;
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39996 + swirl * 0.8;
        const br = r * 0.9 * Math.sqrt((i + 0.5) / 26);
        g.fillRect(px + Math.cos(a) * br - 1.5, py + Math.sin(a) * br - 1.5, 3, 3);
      }

      // A glossy shine once it's creamy, and a happy face when it's smooth.
      g.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.5 * smooth})`;
      g.beginPath();
      g.ellipse(px - r * 0.35, py - r * 0.45, r * 0.24, r * 0.08, -0.5, 0, Math.PI * 2);
      g.fill();
      if (smooth >= 1) face(g, px, py + 6, 1.1, 'joy');
    },
  },
};

export default cheeseCream;
