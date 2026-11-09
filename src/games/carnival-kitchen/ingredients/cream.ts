import { C, face, fillStroke, heartPath, oval, palette, vertical } from '../art';
import { BOWL, type Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
const K = palette({ cream: '#fffaf0', edge: '#f3e6d0' });

/** Pouring cream, in a little jug with a heart on it. */
const cream: Ingredient = {
  id: 'cream',
  label: 'cream',
  plural: 'cream',
  icon: '🥛',
  amount: '½ cup',
  colors: [K.cream, C.white],

  pour: {
    stream: 'rgba(255, 250, 240, 0.97)',
    meter: [C.hotPink, C.pink],
    color: K.cream,
    liquid: true,
    /** A small round jug with a spout, a handle and a pink heart. */
    drawContainer(g, pouring) {
      g.beginPath();
      g.arc(-36, 4, 16, Math.PI * 0.6, Math.PI * 1.4);
      g.lineWidth = 9;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = C.pink;
      g.stroke();
      g.beginPath();
      g.moveTo(-28, -30);
      g.lineTo(22, -30);
      g.lineTo(36, -42);
      g.lineTo(30, -22);
      g.quadraticCurveTo(36, 30, 0, 40);
      g.quadraticCurveTo(-36, 30, -28, -30);
      g.closePath();
      fillStroke(g, vertical(g, -42, 40, [C.white, K.edge]));
      heartPath(g, 0, 18, 9);
      fillStroke(g, C.pink, 2.5);
      face(g, 0, -8, 0.7, pouring ? 'joy' : 'happy');
    },
    /** A white swirl that grows round the bowl. */
    drawInBowl(g, amount) {
      oval(g, BOWL.x, 333, 134 * (0.4 + 0.6 * amount), 21 * (0.4 + 0.6 * amount));
      g.fillStyle = K.cream;
      g.fill();
      g.strokeStyle = 'rgba(255, 156, 201, 0.5)';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(BOWL.x, 333, 70 * amount + 10, 10 * amount + 2, 0, 0, Math.PI * 1.5);
      g.stroke();
    },
  },
};

export default cream;
