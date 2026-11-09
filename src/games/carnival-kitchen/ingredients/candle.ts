import { C, fillStroke, oval, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A striped birthday candle with its little flame, standing on its bottom near the origin. */
const candle: Ingredient = {
  id: 'candle',
  label: 'candle',
  icon: '🕯️',
  colors: [C.butter, C.sky, C.hotPink],

  topping: {
    draw(g) {
      rounded(g, -4, -16, 8, 26, 3);
      fillStroke(g, C.sky, 1.8);
      g.strokeStyle = C.white;
      g.lineWidth = 2;
      for (const y of [-10, -2, 6]) {
        g.beginPath();
        g.moveTo(-4, y + 3);
        g.lineTo(4, y - 1);
        g.stroke();
      }
      g.strokeStyle = C.ink;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(0, -16);
      g.lineTo(0, -20);
      g.stroke();
      g.beginPath();
      g.moveTo(0, -32);
      g.quadraticCurveTo(6, -24, 0, -20);
      g.quadraticCurveTo(-6, -24, 0, -32);
      g.closePath();
      fillStroke(g, vertical(g, -32, -20, [C.butter, C.carrot]), 1.5);
      g.fillStyle = 'rgba(255, 255, 255, 0.8)';
      oval(g, 0, -24, 1.5, 2.5);
      g.fill();
    },
    faceY: -2,
  },
};

export default candle;
