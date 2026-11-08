import { C, blend, circle, face, fillStroke } from '../art';
import type { Ingredient } from '../kit';

/** Pancake batter: lumpy flour and streaks of yolk that turn smooth and golden as it's mixed. */
const batter: Ingredient = {
  id: 'batter',
  label: 'batter',
  icon: '🥣',
  colors: [C.pancake, C.cream],

  stirred: {
    spoon: C.pancake,
    draw(g, { x: px, y: py, r, swirl, done: smooth, t }) {
      circle(g, px, py, r);
      const batter = g.createRadialGradient(px - 20, py - 20, 10, px, py, r);
      batter.addColorStop(0, blend([C.cream, C.pancakeLight], smooth));
      batter.addColorStop(1, blend([C.cream, C.pancake], smooth));
      g.fillStyle = batter;
      g.fill();

      // Yolk streaks swirling round, fading as the batter comes together.
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.strokeStyle = `rgba(255, 197, 61, ${0.85 * (1 - smooth * 0.8)})`;
        g.lineWidth = 9 - j * 2;
        g.beginPath();
        g.arc(px, py, 30 + j * 26, swirl + j * 2.1, swirl + j * 2.1 + 1.6);
        g.stroke();
      }
      g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
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
        [5.7, 30, 9],
      ];
      lumps.forEach(([a0, lr, size], i) => {
        const left = 1 - smooth * 1.15 + i * 0.03;
        if (left <= 0) return;
        const a = a0 + swirl + t * 0.04;
        circle(g, px + Math.cos(a) * lr, py + Math.sin(a) * lr, size * Math.min(1, left));
        fillStroke(g, C.white, 2);
      });
      // Little bubbles once it's smooth.
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

export default batter;
