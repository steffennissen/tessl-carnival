import { C, circle, clamp01, face, fillStroke, horizontal, palette, rounded } from '../art';
import type { Ingredient } from '../kit';

const K = palette({
  grain: '#4a3a44',
  grainLight: '#7d6a73',
});

/**
 * Black pepper in a wooden pepper mill. (The `pepper` ingredient is the
 * green bell pepper that goes on pizza.)
 */
const blackPepper: Ingredient = {
  id: 'black-pepper',
  label: 'pepper',
  plural: 'pepper',
  icon: '🧂',
  amount: '¼ teaspoon',
  // The grains: mostly black, some grey.
  colors: [K.grain, K.grainLight],

  /** A round-bellied wooden pepper mill with a knob on top and a pink band. */
  shaker: {
    draw(g, left, shaking) {
      const wood = horizontal(g, -30, 30, [C.woodDark, C.wood, C.woodLight, C.wood]);
      // The base.
      rounded(g, -24, 34, 48, 18, 7);
      fillStroke(g, wood, 3.5);
      // The belly.
      g.beginPath();
      g.moveTo(-18, 36);
      g.bezierCurveTo(-36, 20, -36, -14, -20, -26);
      g.lineTo(20, -26);
      g.bezierCurveTo(36, -14, 36, 20, 18, 36);
      g.closePath();
      fillStroke(g, wood, 3.5);
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      rounded(g, -24, -16, 6, 40, 3);
      g.fill();
      // The band and the crown, with a knob to turn.
      rounded(g, -22, -34, 44, 10, 5);
      fillStroke(g, C.hotPink, 3);
      rounded(g, -16, -52, 32, 20, 8);
      fillStroke(g, wood, 3.5);
      circle(g, 0, -58, 7);
      fillStroke(g, C.hotPink, 3);
      face(g, 0, 6, 0.8, shaking ? 'joy' : 'happy');
      // Peppercorns along the base: fewer as it empties.
      g.fillStyle = K.grain;
      const corns = Math.ceil(clamp01(left) * 5);
      for (let i = 0; i < corns; i++) {
        circle(g, -16 + i * 8, 43, 3);
        g.fill();
      }
    },
  },
};

export default blackPepper;
