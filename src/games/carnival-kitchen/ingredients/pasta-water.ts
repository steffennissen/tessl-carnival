import { C, face, fillStroke, oval, palette, rounded, vertical } from '../art';
import { BOWL, type Ingredient } from '../kit';

const K = palette({
  water: '#e6f4ff',
  cloudy: '#f4f1e6',
});

/** A little starchy pasta water, which makes the cheese go creamy. */
const pastaWater: Ingredient = {
  id: 'pasta-water',
  label: 'pasta water',
  plural: 'pasta water',
  icon: '💧',
  amount: '¼ cup',
  colors: [C.skyLight, C.white],

  pour: {
    stream: 'rgba(223, 242, 255, 0.95)',
    meter: [C.sky, C.skyLight],
    color: K.cloudy,
    liquid: true,
    /** A glass measuring jug of steamy water, with a spout and a handle. */
    drawContainer(g, pouring) {
      // Drawn spout-left, then mirrored so the spout faces the bowl.
      g.save();
      g.scale(-1, 1);
      g.beginPath();
      g.arc(38, -2, 20, -Math.PI * 0.4, Math.PI * 0.4);
      g.lineWidth = 9;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = C.lavender;
      g.stroke();
      g.beginPath();
      g.moveTo(-40, -50);
      g.lineTo(-30, -42);
      g.lineTo(-30, 38);
      g.quadraticCurveTo(-30, 46, -22, 46);
      g.lineTo(26, 46);
      g.quadraticCurveTo(34, 46, 34, 38);
      g.lineTo(34, -42);
      g.closePath();
      fillStroke(g, 'rgba(255, 255, 255, 0.75)');
      g.save();
      g.clip();
      g.fillStyle = vertical(g, -10, 46, [K.water, C.sky]);
      g.fillRect(-40, -8, 80, 60);
      g.restore();
      // Measuring lines.
      g.strokeStyle = C.lavender;
      g.lineWidth = 2.5;
      for (const y of [-30, -18, 6, 22]) {
        g.beginPath();
        g.moveTo(18, y);
        g.lineTo(30, y);
        g.stroke();
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.8)';
      rounded(g, -24, -34, 6, 64, 3);
      g.fill();
      g.restore();
      face(g, -2, 18, 0.75, pouring ? 'joy' : 'happy');
    },
    /** A cloudy pool that spreads across the bowl. */
    drawInBowl(g, amount) {
      oval(g, BOWL.x, 333, 134 * (0.45 + 0.55 * amount), 21 * (0.45 + 0.55 * amount));
      g.fillStyle = K.cloudy;
      g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.7)';
      oval(g, BOWL.x - 30, 330, 30 * amount, 4 * amount);
      g.fill();
    },
  },
};

export default pastaWater;
