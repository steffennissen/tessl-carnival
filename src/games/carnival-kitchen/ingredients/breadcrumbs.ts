import { type G, fillStroke, palette } from '../art';
import type { Ingredient } from '../kit';

export const CRUMB = palette({
  crumb: '#f6c56b',
  crumbLight: '#ffe3a6',
  crumbToast: '#d98a3a',
  crumbEdge: '#a8622a',
});

/** Where the nuggets sit in one sprinkle of crumbs, and how big each is. */
const NUGGETS = [
  [-8, -4, 6.5],
  [6, -7, 5.5],
  [9, 5, 6],
  [-4, 7, 5],
  [0, -1, 4.5],
  [-12, 6, 3.5],
  [13, -2, 3.5],
] as const;

/** A lumpy little nugget, rounder than a square and knobblier than a circle. */
function nugget(g: G, x: number, y: number, r: number, turn: number) {
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = turn + (k / 6) * Math.PI * 2;
    const rr = r * (k % 2 ? 0.8 : 1);
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}

/**
 * A sprinkle of golden crumbs centred on (x, y), about 30 across at `s` 1.
 * `toast` turns them golden at 1, and brown past it.
 */
export function drawCrumbs(g: G, x: number, y: number, s = 1, toast = 0, line = 2) {
  NUGGETS.forEach(([dx, dy, r], i) => {
    nugget(g, x + dx * s, y + dy * s, r * s, i * 1.7);
    const fill = toast > 1.15 ? CRUMB.crumbToast : toast > 0.5 ? CRUMB.crumb : CRUMB.crumbLight;
    fillStroke(g, i % 3 === 0 ? CRUMB.crumb : fill, line, CRUMB.crumbEdge);
  });
}

/** Golden breadcrumbs that go on top of the mac and cheese. */
const breadcrumbs: Ingredient = {
  id: 'breadcrumbs',
  label: 'breadcrumbs',
  plural: 'breadcrumbs',
  icon: '🍞',
  colors: [CRUMB.crumb, CRUMB.crumbLight],

  topping: {
    faceY: 0,
    /** A big round crumb (where the face goes) with little ones round it. */
    draw(g) {
      for (const [dx, dy, r] of [
        [-12, -6, 4],
        [12, -7, 3.5],
        [13, 6, 4],
        [-11, 8, 3.5],
        [0, -12, 3],
      ] as const) {
        nugget(g, dx, dy, r, dx);
        fillStroke(g, CRUMB.crumb, 1.4);
      }
      g.beginPath();
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const r = 10 * (k % 2 ? 0.92 : 1);
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9);
      }
      g.closePath();
      fillStroke(g, CRUMB.crumbLight, 1.6);
      g.fillStyle = CRUMB.crumb;
      for (const [dx, dy] of [
        [-5, 5],
        [5, -5],
        [6, 4],
      ]) {
        g.fillRect(dx - 0.8, dy - 0.8, 1.6, 1.6);
      }
    },
  },
};

export default breadcrumbs;
