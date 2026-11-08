import { C, type G, type Mood, circle, face, fillStroke, oval, vertical } from '../art';
import type { Ingredient, KitchenState } from '../kit';
import { CUKE } from './cucumber';
import { NORI, SHEET, drawSushiSheet, fillingsIn } from './nori';

/**
 * The sushi roll: rice and fillings on nori, rolled up in the bamboo mat,
 * then chopped into slices. `drawSushiSlice` draws one slice, for the end
 * card too.
 */

/** The colour each filling shows in a slice. */
function fillingColor(id: string): [string, string] {
  if (id === 'carrot-stick') return [C.carrot, C.carrotDark];
  if (id === 'egg-strip') return [C.yolkLight, C.yolk];
  return [CUKE.flesh, CUKE.skin];
}

/** The fillings to show in a slice: this round's, or one of each. */
export function sliceFillings(round: KitchenState | null): string[] {
  const ids = [...new Set(fillingsIn(round).map((spot) => spot.id))];
  return ids.length > 0 ? ids : ['cucumber', 'carrot-stick', 'egg-strip'];
}

/**
 * One slice seen end on, centred on (x, y), radius r: nori round the
 * outside, rice, and the fillings in the middle. With a `mood`, a face.
 */
export function drawSushiSlice(
  g: G,
  x: number,
  y: number,
  r: number,
  fillings: readonly string[],
  mood?: Mood,
) {
  circle(g, x, y, r);
  fillStroke(g, vertical(g, y - r, y + r, [NORI.noriLight, NORI.nori, NORI.noriDark]), 3);
  circle(g, x, y, r * 0.8);
  const rice = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r * 0.8);
  rice.addColorStop(0, C.white);
  rice.addColorStop(1, NORI.rice);
  g.fillStyle = rice;
  g.fill();
  g.strokeStyle = NORI.riceShade;
  g.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) {
    const a = i * 0.63 + 0.2;
    const d = r * (0.55 + (i % 2) * 0.13);
    oval(g, x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.07, r * 0.04, a);
    g.stroke();
  }
  // The fillings, snug in the middle (a little up, to leave room for a face).
  const fy = mood ? y - r * 0.22 : y;
  const size = r * 0.2;
  fillings.forEach((id, i) => {
    const angle = -Math.PI / 2 + (i / fillings.length) * Math.PI * 2;
    const spread = fillings.length > 1 ? size * 0.85 : 0;
    const [fill, edge] = fillingColor(id);
    g.beginPath();
    g.roundRect(
      x + Math.cos(angle) * spread - size,
      fy + Math.sin(angle) * spread * 0.7 - size * 0.8,
      size * 2,
      size * 1.6,
      size * 0.4,
    );
    fillStroke(g, fill, 1.6, edge);
  });
  if (mood) face(g, x, y + r * 0.38, r / 52, mood);
}

const sushiRoll: Ingredient = {
  id: 'sushi-roll',
  label: 'sushi',
  plural: 'sushi',
  icon: '🍣',
  colors: [NORI.rice, NORI.nori, C.carrot],

  /** On the mat: nori, rice and this round's fillings, rolled up from the bottom. */
  rollUp: {
    drawSheet(g, { round }) {
      drawSushiSheet(g, SHEET, { rice: 1, toppings: fillingsIn(round) });
    },
    drawEnd(g, x, y, r) {
      drawSushiSlice(g, x, y, r, ['cucumber', 'carrot-stick', 'egg-strip']);
    },
  },

  /** The roll along the board, in slices between the cuts. */
  chop: {
    draw(g, { bounds, cy }) {
      const r = 32;
      // Lighter than the sheet, so the face the chop step draws on it shows.
      const body = vertical(g, cy - r, cy + r, [NORI.noriPale, NORI.noriLight, NORI.nori]);
      const fillings = ['cucumber', 'carrot-stick', 'egg-strip'];
      for (let k = 0; k < bounds.length - 1; k++) {
        const first = k === 0;
        const a = bounds[k] + (first ? 0 : 3);
        const b = bounds[k + 1] - (k === bounds.length - 2 ? 0 : 3);
        g.beginPath();
        g.roundRect(a, cy - r, b - a, r * 2, 6);
        fillStroke(g, body, 3.5);
        // A shine along the nori.
        g.fillStyle = 'rgba(255, 255, 255, 0.18)';
        g.beginPath();
        g.roundRect(a + 8, cy - r + 6, Math.max(0, b - a - 16), 6, 3);
        g.fill();
        // The cut face of each piece, seen a little from the side.
        g.save();
        g.translate(a, cy);
        g.scale(0.32, 1);
        drawSushiSlice(g, 0, 0, r, fillings);
        g.restore();
      }
    },
  },
};

export default sushiRoll;
