import { C, blend, circle, face, fillStroke, palette } from '../art';
import type { Ingredient } from '../kit';

const K = palette({ batter: '#ffd9e2', batterLight: '#fff0f3' });

/** Cupcake batter: lumpy and streaky at first, then smooth, pale pink and bubbly. */
const cupcakeBatter: Ingredient = {
  id: 'cupcake-batter',
  label: 'batter',
  icon: '🧁',
  colors: [K.batter, C.cream],

  stirred: {
    spoon: K.batter,
    draw(g, { x: px, y: py, r, swirl, done: smooth, t }) {
      circle(g, px, py, r);
      const batter = g.createRadialGradient(px - 20, py - 20, 10, px, py, r);
      batter.addColorStop(0, blend([C.cream, K.batterLight], smooth));
      batter.addColorStop(1, blend([C.cream, K.batter], smooth));
      g.fillStyle = batter;
      g.fill();

      // Yolk and sugar streaks swirling round, fading as it comes together.
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.strokeStyle = `rgba(255, 197, 61, ${0.8 * (1 - smooth * 0.85)})`;
        g.lineWidth = 9 - j * 2;
        g.beginPath();
        g.arc(px, py, 30 + j * 26, swirl + j * 2.1, swirl + j * 2.1 + 1.6);
        g.stroke();
      }
      g.strokeStyle = `rgba(255, 95, 162, ${0.25 + smooth * 0.35})`;
      g.lineWidth = 3;
      for (let j = 0; j < 2; j++) {
        g.beginPath();
        g.arc(px, py, 45 + j * 38, swirl * 1.2 + j * 3, swirl * 1.2 + j * 3 + 1.1);
        g.stroke();
      }
      // Lumps of flour that melt away.
      const lumps = [
        [0.3, 70, 13],
        [1.5, 40, 11],
        [2.6, 88, 12],
        [3.7, 58, 14],
        [4.8, 82, 10],
      ];
      lumps.forEach(([a0, lr, size], i) => {
        const left = 1 - smooth * 1.15 + i * 0.03;
        if (left <= 0) return;
        const a = a0 + swirl + t * 0.04;
        circle(g, px + Math.cos(a) * lr, py + Math.sin(a) * lr, size * Math.min(1, left));
        fillStroke(g, C.white, 2);
      });
      if (smooth > 0.6) {
        for (let i = 0; i < 6; i++) {
          const phase = (t * 0.8 + i * 0.37) % 1;
          const a = i * 1.3 + 0.4;
          const br = 20 + i * 15;
          g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
          g.lineWidth = 2;
          circle(g, px + Math.cos(a) * br, py + Math.sin(a) * br, 2 + phase * 5);
          g.stroke();
        }
      }
      if (smooth >= 1) face(g, px, py + 6, 1.1, 'joy');
    },
  },
};

export default cupcakeBatter;
