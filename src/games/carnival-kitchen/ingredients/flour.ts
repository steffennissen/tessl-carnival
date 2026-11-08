import { C, face, fillStroke, heartPath, rounded, vertical } from '../art';
import { BOWL, type Ingredient } from '../kit';

const flour: Ingredient = {
  id: 'flour',
  label: 'flour',
  plural: 'flour',
  icon: '🌾',
  colors: [C.white, C.cream],

  pour: {
    stream: 'rgba(255, 247, 236, 0.95)',
    grains: C.white,
    meter: [C.woodLight, C.cream],
    liquid: false,
    /** A paper flour bag with a heart. */
    drawContainer(g, pouring) {
      g.beginPath();
      g.moveTo(-34, -44);
      g.lineTo(34, -44);
      g.lineTo(38, 46);
      g.quadraticCurveTo(0, 54, -38, 46);
      g.closePath();
      fillStroke(g, vertical(g, -44, 50, [C.cream, C.woodLight]));
      rounded(g, -34, -52, 68, 14, 6);
      fillStroke(g, C.woodLight, 3);
      heartPath(g, 0, 18, 10);
      fillStroke(g, C.pink, 2.5);
      face(g, 0, -12, 0.75, pouring ? 'joy' : 'happy');
    },
    /** A soft mound that grows as it's poured. */
    drawInBowl(g, amount) {
      const h = 10 + 26 * amount;
      const w = 40 + 50 * amount;
      const x = BOWL.x;
      g.beginPath();
      g.moveTo(x - w, 338);
      g.quadraticCurveTo(x - w * 0.4, 338 - h * 1.3, x, 338 - h);
      g.quadraticCurveTo(x + w * 0.4, 338 - h * 1.3, x + w, 338);
      g.closePath();
      fillStroke(g, vertical(g, 338 - h, 338, [C.white, C.cream]), 2.5);
    },
  },
};

export default flour;
