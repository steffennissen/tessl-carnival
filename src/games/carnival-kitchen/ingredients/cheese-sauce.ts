import { C, blend, circle, face, palette } from '../art';
import type { Ingredient } from '../kit';
import { drawElbow } from './macaroni';

export const SAUCE = palette({
  milky: '#fff4dc',
  sauce: '#ffb547',
  sauceLight: '#ffd27a',
  sauceDark: '#f29a2e',
  shred: '#ffb84d',
});

/** Where the macaroni sit in the pot: angle, distance from the middle (share of r), turn. */
const ELBOWS = [
  [0.2, 0.2, 0.3],
  [1.1, 0.42, 1.9],
  [2.0, 0.66, 0.8],
  [2.9, 0.3, 2.6],
  [3.6, 0.55, 0.1],
  [4.4, 0.78, 1.4],
  [5.1, 0.36, 2.2],
  [5.8, 0.62, 3.0],
  [0.7, 0.8, 2.4],
  [1.6, 0.12, 0.6],
  [2.5, 0.84, 1.1],
  [3.2, 0.72, 2.9],
  [4.0, 0.2, 1.7],
  [4.8, 0.5, 0.4],
  [5.5, 0.84, 2.0],
] as const;

/**
 * Cheese sauce with macaroni, stirred in the pot: milky with orange shreds
 * of cheddar at first, melting into a smooth, glossy orange sauce.
 */
const cheeseSauce: Ingredient = {
  id: 'cheese-sauce',
  label: 'cheese sauce',
  plural: 'cheese sauce',
  icon: '🧀',
  colors: [SAUCE.sauce, SAUCE.sauceLight],

  stirred: {
    spoon: SAUCE.sauceLight,
    draw(g, { x: px, y: py, r, swirl, done: melted, t }) {
      circle(g, px, py, r);
      const sauce = g.createRadialGradient(px - 24, py - 24, 8, px, py, r);
      sauce.addColorStop(0, blend([C.white, SAUCE.sauceLight], melted));
      sauce.addColorStop(0.7, blend([SAUCE.milky, SAUCE.sauce], melted));
      sauce.addColorStop(1, blend([C.cream, SAUCE.sauceDark], melted));
      g.fillStyle = sauce;
      g.fill();

      // Creamy swirls following the spoon.
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.strokeStyle = `rgba(255, 236, 190, ${0.5 + 0.3 * melted})`;
        g.lineWidth = 6 - j;
        g.beginPath();
        g.arc(px, py, 26 + j * 30, swirl + j * 2.1, swirl + j * 2.1 + 1.5);
        g.stroke();
      }

      // Shreds of cheddar that melt away as you stir.
      g.strokeStyle = SAUCE.shred;
      for (let i = 0; i < 14; i++) {
        const left = 1 - melted * 1.2 + (i % 4) * 0.05;
        if (left <= 0) continue;
        const a = i * 0.45 + swirl * 0.9;
        const br = 18 + ((i * 37) % 80);
        const sx = px + Math.cos(a) * br;
        const sy = py + Math.sin(a) * br;
        g.lineWidth = 4 * Math.min(1, left);
        g.beginPath();
        g.moveTo(sx - 6, sy - 2);
        g.quadraticCurveTo(sx, sy + 3, sx + 6, sy - 2);
        g.stroke();
      }

      // The macaroni, going round with the spoon.
      for (const [a0, share, rot] of ELBOWS) {
        const a = a0 + swirl * 0.8 + t * 0.03;
        const br = share * r * 0.92;
        drawElbow(g, px + Math.cos(a) * br, py + Math.sin(a) * br, rot + a, 1.15);
      }

      // Bubbles once it's melty, and a happy face when it's smooth.
      if (melted > 0.5) {
        for (let i = 0; i < 6; i++) {
          const phase = (t * 0.9 + i * 0.37) % 1;
          const a = i * 1.3 + 0.4;
          const br = 22 + i * 14;
          g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
          g.lineWidth = 2;
          circle(g, px + Math.cos(a) * br, py + Math.sin(a) * br, 2 + phase * 5);
          g.stroke();
        }
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.4)';
      g.beginPath();
      g.ellipse(px - r * 0.35, py - r * 0.45, r * 0.22, r * 0.07, -0.5, 0, Math.PI * 2);
      g.fill();
      if (melted >= 1) face(g, px, py + 6, 1.1, 'joy');
    },
  },
};

export default cheeseSauce;
