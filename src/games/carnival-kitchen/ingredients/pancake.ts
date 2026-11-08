import { C, circle, face, fillStroke, heartPath, oval, rounded } from '../art';
import type { Ingredient } from '../kit';

const pancake: Ingredient = {
  id: 'pancake',
  label: 'pancake',
  icon: '🥞',
  colors: [C.pancake, C.pancakeLight],

  flip: {
    drawInPan(g, { up, flipping }) {
      oval(g, 0, 9, 98, 40);
      fillStroke(g, C.pancakeDark, 3.5);
      oval(g, 0, 0, 98, 40);
      const top = g.createRadialGradient(-20, -10, 6, 0, 0, 100);
      if (up) {
        top.addColorStop(0, C.pancakeLight);
        top.addColorStop(0.6, C.pancake);
        top.addColorStop(1, C.pancakeDark);
      } else {
        top.addColorStop(0, C.pancake);
        top.addColorStop(1, C.pancakeDark);
      }
      fillStroke(g, top, 3.5);
      if (up) {
        // A pat of butter, and a face.
        g.save();
        g.rotate(-0.15);
        rounded(g, -16, -22, 30, 18, 6);
        fillStroke(g, C.butter, 2.5);
        g.restore();
        face(g, 0, 10, 1, flipping ? 'joy' : 'happy');
      } else {
        // The browned side.
        g.fillStyle = 'rgba(180, 110, 40, 0.35)';
        for (const [sx, sy] of [
          [-40, -5],
          [10, 8],
          [45, -10],
          [-10, -18],
        ]) {
          oval(g, sx, sy, 10, 5);
          g.fill();
        }
      }
    },

    /** Golden if it was flipped well, browner if not. */
    drawOnPlate(g, x, y, share) {
      oval(g, x, y + 6, 58, 17);
      fillStroke(g, C.pancakeDark, 3);
      oval(g, x, y, 58, 17);
      fillStroke(g, share >= 0.6 ? C.pancake : share > 0 ? C.pancakeDark : C.pancakeDone, 3);
    },

    /** Cream and a strawberry heart. */
    garnish(g, x, y) {
      for (const [cx, cy, r] of [
        [-14, -8, 10],
        [8, -10, 12],
        [0, -18, 10],
      ]) {
        circle(g, x + cx, y + cy, r);
        fillStroke(g, C.white, 3);
      }
      g.save();
      g.translate(x + 2, y - 30);
      g.rotate(Math.PI);
      heartPath(g, 0, 0, 12);
      fillStroke(g, C.berry, 3);
      g.restore();
    },
  },
};

export default pancake;
