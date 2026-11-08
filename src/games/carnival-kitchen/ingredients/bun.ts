import { face, fillStroke, oval, palette, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

const K = palette({
  bun: '#f7b85e',
  bunLight: '#ffdc9c',
  bunDark: '#dc8f3c',
  crumb: '#fff1d2',
  seed: '#fffaf0',
});

/** Sesame seeds on the dome, clear of the face. */
const SEEDS = [
  [-44, -24, -0.5],
  [-20, -38, -0.2],
  [16, -40, 0.3],
  [42, -27, 0.6],
  [-58, -10, -0.9],
  [60, -12, 0.9],
  [-2, -44, 0.1],
  [-34, -36, -0.4],
  [32, -38, 0.5],
];

/**
 * A burger bun. In a tower it's the bottom half, unless it's the top layer:
 * then it's the sesame dome, with a smile.
 */
const bun: Ingredient = {
  id: 'bun',
  label: 'bun',
  icon: '🍞',
  colors: [K.bun, K.bunLight, K.seed],

  stack: {
    size: (top) => (top ? { w: 160, h: 50 } : { w: 150, h: 26 }),
    draw(g, { top, mood }) {
      if (!top) {
        rounded(g, -75, -26, 150, 26, 11);
        fillStroke(g, vertical(g, -26, 0, [K.bunLight, K.bun, K.bunDark]));
        // The soft cut side on top.
        rounded(g, -70, -24, 140, 8, 4);
        g.fillStyle = K.crumb;
        g.fill();
        face(g, 0, -9, 0.55, mood);
        return;
      }
      g.beginPath();
      g.moveTo(-78, -4);
      g.bezierCurveTo(-82, -66, 82, -66, 78, -4);
      g.quadraticCurveTo(78, 2, 70, 2);
      g.lineTo(-70, 2);
      g.quadraticCurveTo(-78, 2, -78, -4);
      g.closePath();
      fillStroke(g, vertical(g, -50, 2, [K.bunLight, K.bun, K.bunDark]));
      // A glossy shine.
      g.fillStyle = 'rgba(255, 255, 255, 0.55)';
      oval(g, -34, -33, 20, 7, -0.45);
      g.fill();
      for (const [sx, sy, rot] of SEEDS) {
        oval(g, sx, sy, 4.5, 2.4, rot);
        fillStroke(g, K.seed, 1.5);
      }
      face(g, 0, -17, 0.95, mood);
    },
  },
};

export default bun;
