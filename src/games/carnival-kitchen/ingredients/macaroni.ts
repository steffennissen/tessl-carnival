import { type G, palette } from '../art';
import type { Ingredient } from '../kit';

export const MAC = palette({
  pasta: '#ffe08a',
  pastaLight: '#fff1c4',
  pastaEdge: '#e9b04a',
});

/**
 * One elbow of macaroni centred on (x, y), turned by `rot`, `s` times its
 * size (about 22 across at 1): a fat curved tube with an outline and a shine.
 */
export function drawElbow(g: G, x: number, y: number, rot: number, s = 1) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.lineCap = 'round';
  g.beginPath();
  g.arc(0, 5, 9, Math.PI * 1.05, Math.PI * 1.95);
  g.lineWidth = 11;
  g.strokeStyle = 'rgba(91, 59, 79, 0.85)';
  g.stroke();
  g.lineWidth = 7.5;
  g.strokeStyle = MAC.pasta;
  g.stroke();
  g.beginPath();
  g.arc(0, 5, 10.2, Math.PI * 1.2, Math.PI * 1.6);
  g.lineWidth = 2;
  g.strokeStyle = MAC.pastaLight;
  g.stroke();
  // Ridges along the tube.
  g.strokeStyle = MAC.pastaEdge;
  g.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) {
    const a = Math.PI * (1.25 + k * 0.25);
    g.beginPath();
    g.moveTo(Math.cos(a) * 6, 5 + Math.sin(a) * 6);
    g.lineTo(Math.cos(a) * 12, 5 + Math.sin(a) * 12);
    g.stroke();
  }
  g.restore();
}

/** Elbow macaroni. The cheese sauce and the casserole draw it with `drawElbow`. */
const macaroni: Ingredient = {
  id: 'macaroni',
  label: 'macaroni',
  plural: 'macaroni',
  icon: '🧀',
  colors: [MAC.pasta, MAC.pastaLight],

  /** A little pile of three elbows, for anything that goes on top. */
  topping: {
    faceY: 2,
    draw(g) {
      drawElbow(g, -7, 3, -0.4, 0.9);
      drawElbow(g, 7, 4, 0.5, 0.9);
      drawElbow(g, 0, -5, 0.1, 0.9);
    },
  },
};

export default macaroni;
