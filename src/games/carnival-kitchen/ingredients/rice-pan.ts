import { C, circle, fillStroke, horizontal, rounded, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';

/**
 * A big frying pan seen from above, with its handle off to the right: for
 * stirring fried rice, taco meat and anything else that sizzles.
 */
const ricePan: Ingredient = {
  id: 'rice-pan',
  label: 'pan',
  icon: '🍳',
  colors: [C.pan, C.panLight],

  vessel: {
    inset: 22,
    draw(g, px, py, R) {
      shadow(g, px + 8, py + R - 4, R, 22);
      // The handle, with a pink grip and a hole to hang it by.
      rounded(g, px + R - 16, py - 13, 70, 26, 8);
      fillStroke(g, horizontal(g, px + R - 16, px + R + 54, [C.panDark, C.pan]));
      rounded(g, px + R + 40, py - 17, 110, 34, 17);
      fillStroke(g, horizontal(g, px + R + 40, px + R + 150, [C.hotPink, C.pink]));
      circle(g, px + R + 130, py, 6);
      fillStroke(g, C.wallBottom, 3);
      // The pan: a shiny rim and a dark, deep middle.
      circle(g, px, py, R);
      fillStroke(g, vertical(g, py - R, py + R, [C.panLight, C.pan, C.panDark]));
      circle(g, px, py, R - 14);
      const inner = g.createRadialGradient(px - 30, py - 30, 10, px, py, R);
      inner.addColorStop(0, C.pan);
      inner.addColorStop(1, C.panDark);
      fillStroke(g, inner, 3);
      g.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(px, py, R - 7, Math.PI * 1.1, Math.PI * 1.45);
      g.stroke();
    },
  },
};

export default ricePan;
