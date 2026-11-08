import { type G, face, fillStroke, palette, rounded, vertical } from '../art';
import type { Ingredient } from '../kit';

const K = palette({
  cheddar: '#ffb84d',
  cheddarLight: '#ffd98a',
  cheddarDark: '#f0962f',
  cheddarPale: '#ffe9b8',
});

/** The colours of a block of cheese: its top, front and side, light to dark. */
export interface BlockColors {
  top: string;
  light: string;
  front: string;
  side: string;
}

/**
 * A chunky block of cheese seen a little from above, with the middle of its
 * bottom edge on the origin: 110 wide and up to 70 tall (`left` of it,
 * 0 to 1), with a face. `rind` draws stripes along the top and bottom.
 */
export function drawCheeseBlock(
  g: G,
  left: number,
  rubbing: boolean,
  colors: BlockColors,
  rind?: string,
) {
  const h = Math.max(14, 70 * left);
  const w = 55;
  const d = 12;
  // The side, then the top, then the front.
  g.beginPath();
  g.moveTo(w, 0);
  g.lineTo(w + d, -10);
  g.lineTo(w + d, -h - 10);
  g.lineTo(w, -h);
  g.closePath();
  fillStroke(g, colors.side, 3.5);
  g.beginPath();
  g.moveTo(-w, -h);
  g.lineTo(-w + d, -h - 10);
  g.lineTo(w + d, -h - 10);
  g.lineTo(w, -h);
  g.closePath();
  fillStroke(g, colors.top, 3.5);
  rounded(g, -w, -h, w * 2, h, 7);
  fillStroke(g, vertical(g, -h, 0, [colors.light, colors.front]), 3.5);
  if (rind) {
    g.save();
    rounded(g, -w, -h, w * 2, h, 7);
    g.clip();
    g.fillStyle = rind;
    g.fillRect(-w, -h, w * 2, 6);
    g.fillRect(-w, -6, w * 2, 6);
    g.restore();
  }
  // A shine down the front.
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  rounded(g, -w + 8, -h + 8, 7, Math.max(2, h - 18), 3.5);
  g.fill();
  face(g, 4, -h / 2 + 1, Math.min(0.85, h / 46), rubbing ? 'joy' : 'happy');
}

/** Orange cheddar, for grating. */
const cheddar: Ingredient = {
  id: 'cheddar',
  label: 'cheese',
  plural: 'cheese',
  icon: '🧀',
  colors: [K.cheddar, K.cheddarLight],

  grate: {
    shreds: [K.cheddarLight, K.cheddar],
    drawBlock(g, left, rubbing) {
      drawCheeseBlock(g, left, rubbing, {
        top: K.cheddarPale,
        light: K.cheddarLight,
        front: K.cheddar,
        side: K.cheddarDark,
      });
    },
  },
};

export default cheddar;
