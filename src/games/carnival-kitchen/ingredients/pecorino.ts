import { C, face, fillStroke, heartPath, oval, palette, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';
import { drawCheeseBlock } from './cheddar';

export const PECORINO = palette({
  cheese: '#fff1cc',
  cheeseLight: '#fffaea',
  cheeseShade: '#f3dea6',
  rind: '#e2b878',
});

/** Pecorino: a pale, sharp sheep's cheese with a golden rind, for grating. */
const pecorino: Ingredient = {
  id: 'pecorino',
  label: 'cheese',
  plural: 'cheese',
  icon: '🧀',
  colors: [PECORINO.cheese, C.white],

  grate: {
    shreds: [PECORINO.cheeseLight, PECORINO.cheese],
    drawBlock(g, left, rubbing) {
      drawCheeseBlock(
        g,
        left,
        rubbing,
        {
          top: PECORINO.cheeseLight,
          light: PECORINO.cheeseLight,
          front: PECORINO.cheese,
          side: PECORINO.cheeseShade,
        },
        PECORINO.rind,
      );
    },
  },

  /** A blue bowl heaped with snowy grated cheese, getting freckled with pepper. */
  seasoned: {
    draw(g, { x, t, specks, speck }) {
      shadow(g, x, 418, 128, 12);
      // The heap of cheese, peeking over the bowl.
      const top = 286 + Math.sin(t * 2) * 1.5;
      g.beginPath();
      g.moveTo(x - 104, 336);
      g.bezierCurveTo(x - 90, top - 6, x - 30, top - 30, x, top - 26);
      g.bezierCurveTo(x + 30, top - 30, x + 90, top - 6, x + 104, 336);
      g.closePath();
      fillStroke(g, vertical(g, top - 30, 336, [PECORINO.cheeseLight, PECORINO.cheese]), 3.5);
      g.strokeStyle = PECORINO.cheeseShade;
      g.lineWidth = 3;
      g.lineCap = 'round';
      for (let i = 0; i < 22; i++) {
        const u = ((i * 37) % 22) / 21 - 0.5;
        const sx = x + u * 160;
        const sy = 326 - ((i * 53) % 7) * 5 * (1 - Math.abs(u) * 1.6);
        g.beginPath();
        g.moveTo(sx - 5, sy);
        g.quadraticCurveTo(sx, sy - 4, sx + 5, sy + 1);
        g.stroke();
      }
      face(g, x, 300, 0.9, specks > 0 ? 'joy' : 'happy');
      // Pepper on top.
      g.fillStyle = speck;
      for (let i = 0; i < specks; i++) {
        const u = ((i * 73) % 100) / 100 - 0.5;
        const sx = x + u * 170;
        const sy = 330 - (1 - 4 * u * u) * (42 - ((i * 29) % 16));
        g.fillRect(sx - 1.5, sy - 1.5, 3.5, 3.5);
      }
      // The bowl, seen from the side.
      g.beginPath();
      g.ellipse(x, 336, 128, 80, 0, 0, Math.PI);
      g.closePath();
      fillStroke(g, vertical(g, 336, 416, [C.sky, C.skyDark]));
      heartPath(g, x, 378, 13);
      fillStroke(g, C.white, 3);
      oval(g, x, 336, 128, 16);
      fillStroke(g, C.white, 3.5);
      oval(g, x, 336, 112, 9);
      g.fillStyle = PECORINO.cheese;
      g.fill();
    },
  },
};

export default pecorino;
