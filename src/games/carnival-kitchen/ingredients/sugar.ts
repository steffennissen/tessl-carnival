import { C, circle, face, fillStroke, rounded, starPath, vertical } from '../art';
import { BOWL, type Ingredient } from '../kit';

/** Sparkly sugar in a pink jar, heaping up in the bowl. */
const sugar: Ingredient = {
  id: 'sugar',
  label: 'sugar',
  plural: 'sugar',
  icon: '🍬',
  colors: [C.white, C.pink, C.skyLight],

  pour: {
    stream: 'rgba(255, 255, 255, 0.9)',
    grains: C.pink,
    meter: [C.pink, C.white],
    color: C.white,
    liquid: false,
    /** A round pink jar with a lid and a sugar-cube sticker. */
    drawContainer(g, pouring) {
      rounded(g, -36, -40, 72, 88, 26);
      fillStroke(g, vertical(g, -40, 48, [C.white, C.pink]));
      rounded(g, -30, -54, 60, 18, 8);
      fillStroke(g, C.hotPink, 3);
      rounded(g, -14, 14, 28, 22, 5);
      fillStroke(g, C.white, 2.5);
      starPath(g, 0, 25, 6, 0);
      g.fillStyle = C.gold;
      g.fill();
      face(g, 0, -12, 0.75, pouring ? 'joy' : 'happy');
    },
    /** A sparkly heap beside the flour. */
    drawInBowl(g, amount) {
      const h = 8 + 20 * amount;
      const w = 30 + 40 * amount;
      const x = BOWL.x + 34;
      g.beginPath();
      g.moveTo(x - w, 338);
      g.quadraticCurveTo(x - w * 0.4, 338 - h * 1.3, x, 338 - h);
      g.quadraticCurveTo(x + w * 0.4, 338 - h * 1.3, x + w, 338);
      g.closePath();
      fillStroke(g, vertical(g, 338 - h, 338, [C.white, C.skyLight]), 2.5);
      g.fillStyle = C.pink;
      for (let i = 0; i < 6; i++) {
        circle(g, x - w * 0.6 + i * w * 0.24, 336 - h * 0.35 - (i % 2) * h * 0.25, 1.8);
        g.fill();
      }
    },
  },
};

export default sugar;
