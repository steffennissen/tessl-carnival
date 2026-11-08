import { C, blend, face, fillStroke, oval, rounded, vertical } from '../art';
import { BOWL, type Ingredient } from '../kit';

const milk: Ingredient = {
  id: 'milk',
  label: 'milk',
  plural: 'milk',
  icon: '🥛',
  colors: [C.white, C.skyLight],

  pour: {
    stream: 'rgba(255, 255, 255, 0.95)',
    meter: [C.sky, C.white],
    color: C.white,
    liquid: true,
    /** A milk jug with a spout and a handle. */
    drawContainer(g, pouring) {
      g.beginPath();
      g.arc(-40, 0, 20, Math.PI * 0.6, Math.PI * 1.4);
      g.lineWidth = 9;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = C.white;
      g.stroke();
      g.beginPath();
      g.moveTo(-30, -44);
      g.lineTo(26, -44);
      g.lineTo(40, -56);
      g.lineTo(34, -36);
      g.lineTo(34, 40);
      g.quadraticCurveTo(0, 52, -34, 40);
      g.closePath();
      fillStroke(g, vertical(g, -56, 50, [C.white, C.skyLight]));
      rounded(g, -30, -2, 64, 16, 8);
      g.fillStyle = C.sky;
      g.fill();
      face(g, 0, -18, 0.75, pouring ? 'joy' : 'happy');
    },
    /** It fills the bowl from the edges in, creamy yellow from the eggs. */
    drawInBowl(g, amount) {
      oval(g, BOWL.x, 333, 134 * (0.5 + 0.5 * amount), 21 * (0.5 + 0.5 * amount));
      g.fillStyle = blend([C.white, C.pancakeLight], 0.35);
      g.fill();
    },
  },
};

export default milk;
