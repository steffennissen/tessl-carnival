import { C, type G, fillStroke, vertical } from '../art';
import type { Ingredient } from '../kit';

/** A mint leaf centred on (x, y), `s` long, turned by `rot`, with veins. */
export function drawMintLeaf(g: G, x: number, y: number, s: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.moveTo(-s / 2, 0);
  g.bezierCurveTo(-s * 0.2, -s * 0.42, s * 0.3, -s * 0.36, s / 2, 0);
  g.bezierCurveTo(s * 0.3, s * 0.36, -s * 0.2, s * 0.42, -s / 2, 0);
  g.closePath();
  fillStroke(
    g,
    vertical(g, -s * 0.4, s * 0.4, [C.mint, C.leaf, C.leafDark]),
    Math.max(1.5, s * 0.07),
  );
  g.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  g.lineWidth = Math.max(1, s * 0.04);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-s * 0.42, 0);
  g.lineTo(s * 0.4, 0);
  for (const vx of [-0.2, 0, 0.2]) {
    g.moveTo(vx * s, 0);
    g.lineTo((vx + 0.12) * s, -s * 0.16);
    g.moveTo(vx * s, 0);
    g.lineTo((vx + 0.12) * s, s * 0.16);
  }
  g.stroke();
  g.restore();
}

const mint: Ingredient = {
  id: 'mint',
  label: 'mint leaf',
  plural: 'mint leaves',
  icon: '🌿',
  colors: [C.mint, C.leaf],

  topping: {
    draw(g) {
      drawMintLeaf(g, 0, 0, 30, -0.3);
    },
    faceY: 0,
  },
};

export default mint;
