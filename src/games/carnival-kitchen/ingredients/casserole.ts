import {
  C,
  type G,
  blend,
  circle,
  clamp01,
  fillStroke,
  heartPath,
  horizontal,
  oval,
  palette,
  rounded,
  shadow,
  vertical,
} from '../art';
import { GOLDEN, findStep, type Ingredient, type KitchenState } from '../kit';
import type { ToppingSpot } from '../steps/top';
import { drawCrumbs } from './breadcrumbs';
import { SAUCE } from './cheese-sauce';
import { drawElbow } from './macaroni';

const K = palette({
  dish: '#ff8f84',
  dishLight: '#ffc0b5',
  dishDark: '#e8665d',
  crust: '#f7b54a',
  toasty: '#c97a32',
});

/** Where the casserole sits while the crumbs go on, seen a little from the side. */
export const CASSEROLE_VIEW = { x: 400, y: 318, rx: 160, ry: 66 } as const;

/** Where the macaroni poke up through the sauce: across, down (shares of the inside), turn. */
const ELBOWS = [
  [-0.6, -0.2, 0.4],
  [-0.3, 0.3, 2.1],
  [0.05, -0.45, 1.2],
  [0.35, 0.15, 2.8],
  [0.65, -0.15, 0.9],
  [-0.05, 0.05, 1.7],
  [-0.75, 0.25, 2.5],
  [0.55, 0.45, 0.2],
  [-0.4, -0.5, 2.9],
  [0.25, -0.2, 0.6],
  [-0.15, 0.55, 1.4],
  [0.8, 0.1, 2.3],
] as const;

/** Spots for the crumbs when no round put them on, in CASSEROLE_VIEW. */
const SHOW_CRUMBS: ToppingSpot[] = [
  { id: 'breadcrumbs', x: 340, y: 305 },
  { id: 'breadcrumbs', x: 450, y: 300 },
  { id: 'breadcrumbs', x: 395, y: 335 },
  { id: 'breadcrumbs', x: 480, y: 332 },
  { id: 'breadcrumbs', x: 315, y: 334 },
];

export interface CasseroleLook {
  /** The crumbs on top, on their spots in CASSEROLE_VIEW. */
  crumbs: readonly ToppingSpot[];
  /** How baked it is: 0 raw, GOLDEN just right, 1 crispy. */
  baked: number;
  t: number;
  /** Bubbling away, in the oven or fresh out. */
  bubbling: boolean;
}

/** The crumbs the round put on, or a sprinkle of them. */
export function crumbsIn(round: KitchenState | null): readonly ToppingSpot[] {
  const top = round && findStep<{ spots: ToppingSpot[] }>(round, 'top');
  return top?.state.spots ?? SHOW_CRUMBS;
}

/**
 * Mac and cheese in a coral baking dish centred on (x, y), any size: rx
 * across, ry deep. Crumbs sit where their spots are on CASSEROLE_VIEW.
 */
export function drawCasserole(
  g: G,
  x: number,
  y: number,
  rx: number,
  ry: number,
  look: CasseroleLook,
) {
  const s = rx / CASSEROLE_VIEW.rx;
  const depth = ry * 0.62;
  const golden = clamp01(look.baked / GOLDEN);
  const crisp = clamp01((look.baked - GOLDEN) / (1 - GOLDEN));

  shadow(g, x + 6 * s, y + depth + ry * 0.55, rx * 1.02, ry * 0.5);
  // Handles on each side.
  for (const side of [-1, 1]) {
    rounded(g, x + side * rx - 22 * s, y - 2 * s, 44 * s, 20 * s, 10 * s);
    fillStroke(g, K.dishDark, 3);
  }
  // The dish's side, then its rim.
  g.beginPath();
  g.moveTo(x - rx, y);
  g.lineTo(x - rx, y + depth);
  g.ellipse(x, y + depth, rx, ry, 0, Math.PI, 0, true);
  g.lineTo(x + rx, y);
  g.closePath();
  fillStroke(
    g,
    horizontal(g, x - rx, x + rx, [K.dishDark, K.dish, K.dishLight, K.dish, K.dishDark]),
    3.5,
  );
  heartPath(g, x, y + depth + ry * 0.5, 11 * s);
  fillStroke(g, C.white, 2.5);
  g.fillStyle = 'rgba(255, 255, 255, 0.35)';
  rounded(g, x - rx * 0.78, y + ry * 0.5, 10 * s, depth * 0.9, 5 * s);
  g.fill();
  oval(g, x, y, rx, ry);
  fillStroke(g, vertical(g, y - ry, y + ry, [C.white, K.dishLight]), 3.5);

  // The mac and cheese inside, going golden in the oven.
  const irx = rx * 0.88;
  const iry = ry * 0.8;
  const iy = y + 2 * s;
  oval(g, x, iy, irx, iry);
  const top = g.createRadialGradient(x - irx * 0.3, iy - iry * 0.4, 4, x, iy, irx);
  top.addColorStop(0, blend([SAUCE.sauceLight, K.crust], golden * 0.6));
  top.addColorStop(1, crisp > 0 ? blend([SAUCE.sauce, K.toasty], crisp) : SAUCE.sauce);
  g.fillStyle = top;
  g.fill();
  g.save();
  oval(g, x, iy, irx, iry);
  g.clip();
  for (const [nx, ny, rot] of ELBOWS) {
    drawElbow(g, x + nx * irx, iy + ny * iry, rot, 1.1 * s);
  }
  // A crackly golden crust over it once it's baking.
  if (golden > 0.2) {
    g.fillStyle = `rgba(247, 181, 74, ${0.55 * golden})`;
    oval(g, x, iy, irx, iry);
    g.fill();
    g.strokeStyle = `rgba(201, 122, 50, ${0.35 + 0.4 * crisp})`;
    g.lineWidth = 2 * s;
    g.lineCap = 'round';
    for (let k = 0; k < 9; k++) {
      const cx = x + Math.cos(k * 2.3) * irx * 0.6;
      const cy = iy + Math.sin(k * 1.7) * iry * 0.55;
      g.beginPath();
      g.moveTo(cx - 9 * s, cy);
      g.lineTo(cx - 2 * s, cy - 4 * s);
      g.lineTo(cx + 3 * s, cy + 2 * s);
      g.lineTo(cx + 10 * s, cy - 2 * s);
      g.stroke();
    }
  }
  // The crumbs, toasting with it.
  const vs = ry / rx / (CASSEROLE_VIEW.ry / CASSEROLE_VIEW.rx);
  for (const spot of look.crumbs) {
    const nx = (spot.x - CASSEROLE_VIEW.x) / CASSEROLE_VIEW.rx;
    const ny = (spot.y - CASSEROLE_VIEW.y) / CASSEROLE_VIEW.ry;
    const cx = x + nx * rx;
    const cy = y + ny * ry;
    drawCrumbs(g, cx, cy, 1.25 * s, look.baked / GOLDEN, 1.6 * Math.min(1, s * 1.3));
    drawCrumbs(
      g,
      cx + 18 * s,
      cy + 6 * s * vs,
      0.7 * s,
      look.baked / GOLDEN,
      1.2 * Math.min(1, s * 1.3),
    );
    drawCrumbs(
      g,
      cx - 16 * s,
      cy + 8 * s * vs,
      0.6 * s,
      look.baked / GOLDEN,
      1.2 * Math.min(1, s * 1.3),
    );
  }
  // Bubbles popping up through the sauce.
  if (look.bubbling) {
    for (let i = 0; i < 6; i++) {
      const phase = (look.t * 1.2 + i * 0.29) % 1;
      const bx = x + Math.cos(i * 2.4) * irx * 0.7;
      const by = iy + Math.sin(i * 1.9) * iry * 0.6;
      g.strokeStyle = `rgba(255, 255, 255, ${0.85 * (1 - phase)})`;
      g.lineWidth = 2;
      circle(g, bx, by - phase * 6 * s, (2 + phase * 5) * s);
      g.stroke();
    }
  }
  g.restore();
  // A shine on the rim.
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(x, y, rx - 5, ry - 4, 0, Math.PI * 1.1, Math.PI * 1.35);
  g.stroke();
}

/** Mac and cheese in its baking dish: where the crumbs go on, and what bakes. */
const casserole: Ingredient = {
  id: 'casserole',
  label: 'mac and cheese',
  plural: 'mac and cheese',
  icon: '🧀',
  colors: [K.crust, SAUCE.sauceLight, C.white],

  toppingBase: {
    area: CASSEROLE_VIEW,
    splash: [SAUCE.sauceLight, C.butter],
    draw(g, { toppings, t }) {
      const { x, y, rx, ry } = CASSEROLE_VIEW;
      drawCasserole(g, x, y, rx, ry, { crumbs: toppings, baked: 0, t, bubbling: false });
    },
  },

  bake: {
    draw(g, { x, y, level, baking, t, round }) {
      drawCasserole(g, x, y - 8, 98, 34, {
        crumbs: crumbsIn(round),
        baked: level,
        t,
        bubbling: baking,
      });
    },
  },
};

export default casserole;
