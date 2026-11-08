import { C, type G, face, fillStroke, oval, palette, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

const K = palette({
  patty: '#b06a40',
  pattyLight: '#d39060',
  pattyDark: '#7d4528',
  grill: '#6a3720',
  raw: '#f39a9a',
  rawLight: '#ffc9c4',
});

/** Dark grill stripes across an oval, clipped to it. */
function grillMarks(g: G, x: number, y: number, rx: number, ry: number) {
  g.save();
  oval(g, x, y, rx, ry);
  g.clip();
  g.strokeStyle = K.grill;
  g.lineWidth = Math.max(3, ry * 0.18);
  g.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(x + i * rx * 0.36 - ry * 0.5, y + ry);
    g.lineTo(x + i * rx * 0.36 + ry * 0.5, y - ry);
    g.stroke();
  }
  g.restore();
}

/** A burger patty: flipped in the pan, then a layer of the burger. */
const patty: Ingredient = {
  id: 'patty',
  label: 'patty',
  plural: 'patties',
  icon: '🍔',
  colors: [K.pattyLight, K.patty, C.gold],

  flip: {
    /** Pink and smiling until it's flipped; the cooked side has grill stripes. */
    drawInPan(g, { up, flipping }) {
      oval(g, 0, 10, 84, 36);
      fillStroke(g, up ? K.raw : K.pattyDark, 3.5);
      oval(g, 0, 0, 84, 36);
      const top = g.createRadialGradient(-22, -10, 6, 0, 0, 90);
      top.addColorStop(0, up ? K.rawLight : K.pattyLight);
      top.addColorStop(1, up ? K.raw : K.patty);
      fillStroke(g, top, 3.5);
      if (up) {
        g.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (const [sx, sy] of [
          [-48, -8],
          [44, -12],
          [-30, 16],
          [36, 14],
          [56, 2],
        ]) {
          oval(g, sx, sy, 4, 2.5);
          g.fill();
        }
        face(g, 0, 4, 1, flipping ? 'joy' : 'happy');
      } else {
        grillMarks(g, 0, 0, 84, 36);
      }
    },
    /** Juicy brown if it was flipped well, darker if not. */
    drawOnPlate(g, x, y, share) {
      oval(g, x, y + 6, 54, 15);
      fillStroke(g, K.pattyDark, 3);
      oval(g, x, y, 54, 15);
      fillStroke(g, share >= 0.6 ? K.patty : share > 0 ? K.pattyDark : K.grill, 3);
      grillMarks(g, x, y, 54, 15);
    },
    /** A slice of cheese melting over the top one. */
    garnish(g, x, y) {
      g.beginPath();
      g.moveTo(x - 40, y - 8);
      g.lineTo(x + 30, y - 12);
      g.lineTo(x + 44, y + 2);
      g.quadraticCurveTo(x + 30, y + 16, x + 22, y + 4);
      g.lineTo(x - 6, y + 6);
      g.quadraticCurveTo(x - 14, y + 20, x - 22, y + 6);
      g.lineTo(x - 46, y + 4);
      g.closePath();
      fillStroke(g, vertical(g, y - 12, y + 18, [C.cheese, C.cheeseGold]), 3);
    },
  },

  stack: {
    size: () => ({ w: 152, h: 26 }),
    draw(g, { mood }) {
      rounded(g, -76, -26, 152, 26, 13);
      fillStroke(g, vertical(g, -26, 0, [K.pattyLight, K.patty, K.pattyDark]));
      // A bumpy, juicy look.
      g.fillStyle = 'rgba(255, 220, 180, 0.35)';
      for (const [sx, sy] of [
        [-56, -16],
        [-40, -8],
        [40, -17],
        [58, -9],
        [-62, -6],
        [30, -6],
      ]) {
        oval(g, sx, sy, 4, 2.2);
        g.fill();
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.3)';
      rounded(g, -60, -23, 120, 4, 2);
      g.fill();
      face(g, 0, -14, 0.7, mood);
    },
  },
};

export default patty;
