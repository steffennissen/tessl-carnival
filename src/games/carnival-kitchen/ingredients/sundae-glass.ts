import { C, type G, face, fillStroke, oval, rounded, shadow, vertical } from '../art';
import { findStep, type Ingredient, type KitchenState } from '../kit';
import type { SauceOptions, SpreadArt } from '../steps/sauce';
import { drawStack, leanOf, type StackOptions, type StackState } from '../steps/stack';
import type { ToppingSpot } from '../steps/top';
import { artOf } from './index';

/**
 * A tall sundae glass: the scoops are stacked in it, the chocolate is
 * drizzled over them, and the toppings go on top. `drawSundae` draws the
 * whole sundae for each of those steps and the end card.
 */

/** The scoops when nobody stacked any: strawberry, vanilla and mint, bottom first. */
export const SUNDAE_SCOOPS = ['strawberry-scoop', 'vanilla-scoop', 'mint-scoop'];
/** How high the rim is above the glass's foot. */
const RIM = 92;
/** Each scoop's height in the tower, and its ball's middle and radius above its bottom. */
const SCOOP_H = 38;
const BALL_Y = 32;
const BALL_R = 36;

/** Where the sundae stands while the toppings go on, and how big it is there. */
const TOP_VIEW = { x: 400, y: 425, scale: 0.85 } as const;
const AREA = { x: 400, y: 248, rx: 50, ry: 28 } as const;

export interface SundaeLook {
  t: number;
  /** The scoops, bottom first, and how far each leans. */
  scoops: { id: string; lean: number }[];
  /** How much chocolate is on, 0 to 1, and its colours. */
  chocolate: number;
  spread?: SpreadArt;
  /** Turns the drizzle while it's spread. */
  swirl?: number;
  /** Toppings, in the sundae's own units (its foot's middle at the origin). */
  toppings: readonly ToppingSpot[];
}

/** A whole sundae with its foot's middle at the origin, about 130 wide and 240 tall. */
export function drawSundae(g: G, look: SundaeLook) {
  drawStack(g, 0, 0, 'sundae-glass', look.scoops, {
    t: look.t,
    wobble: 0,
    total: look.scoops.length,
    mood: (i) => (i === look.scoops.length - 1 ? 'joy' : 'happy'),
  });
  const balls = look.scoops.map((s, i) => ({ x: s.lean, y: -RIM - i * SCOOP_H - BALL_Y }));

  if (look.chocolate > 0 && balls.length > 0) {
    const c = Math.min(1, look.chocolate);
    const spread = look.spread ?? artOf('chocolate-sauce', 'spread');
    const top = balls[balls.length - 1].y - BALL_R;
    const bottom = top + 14 + 36 * c;
    g.save();
    g.beginPath();
    for (const b of balls) {
      g.moveTo(b.x + BALL_R + 1, b.y);
      g.arc(b.x, b.y, BALL_R + 1, 0, Math.PI * 2);
    }
    g.clip();
    // A cap of chocolate with drips running down, longer as more goes on.
    g.beginPath();
    g.moveTo(-90, top - 10);
    g.lineTo(90, top - 10);
    g.lineTo(90, bottom);
    for (let i = 8; i >= -8; i--) {
      const x = i * 11;
      const drip = (i % 3 === 0 ? 22 : i % 2 ? 5 : 11) * (0.4 + c);
      g.lineTo(x + 5, bottom);
      g.quadraticCurveTo(x + 5, bottom + drip, x, bottom + drip);
      g.quadraticCurveTo(x - 5, bottom + drip, x - 5, bottom);
    }
    g.lineTo(-90, bottom);
    g.closePath();
    fillStroke(g, vertical(g, top, bottom + 20, [spread.light, spread.main]), 3);
    if (look.swirl !== undefined) {
      g.strokeStyle = spread.swirl;
      g.lineWidth = 3;
      g.lineCap = 'round';
      const b = balls[balls.length - 1];
      for (let j = 0; j < 2; j++) {
        g.beginPath();
        g.ellipse(
          b.x,
          b.y - 10,
          12 + j * 12,
          5 + j * 4,
          0,
          look.swirl + j * 2,
          look.swirl + j * 2 + 2,
        );
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (const b of balls) {
      if (b.y - BALL_R > bottom) continue;
      oval(g, b.x - 16, Math.max(top + 8, b.y - 26), 7, 3, -0.4);
      g.fill();
    }
    g.restore();
    // Faces peek out through the chocolate.
    balls.forEach((b, i) => {
      if (b.y > bottom + 10) return;
      face(g, b.x, b.y + BALL_R * 0.12, BALL_R / 40, i === balls.length - 1 ? 'joy' : 'happy');
    });
  }

  // The toppings, the cherry always last, on top.
  const order = [...look.toppings].sort(
    (a, b) => Number(a.id === 'cherry') - Number(b.id === 'cherry'),
  );
  for (const spot of order) {
    g.save();
    g.translate(spot.x, spot.y);
    g.scale(1.7, 1.7);
    artOf(spot.id, 'topping').draw(g);
    g.restore();
  }
}

/** The scoops this round stacked, or the usual three. */
export function scoopsIn(round: KitchenState | null, leaning = 0.5) {
  const run = round && findStep<StackState, StackOptions>(round, 'stack');
  if (!run) return SUNDAE_SCOOPS.map((id) => ({ id, lean: 0 }));
  return run.options.layers.map((id, i) => ({
    id,
    lean: leanOf(run.state.offsets[i] ?? 0) * leaning,
  }));
}

/** The chocolate this round spread, if any. */
export function chocolateIn(round: KitchenState | null): SpreadArt | null {
  const run = round && findStep<unknown, SauceOptions>(round, 'sauce');
  return run ? artOf(run.options.sauce, 'spread') : null;
}

/** Toppings on their spots in the scene, moved into the sundae's own units. */
export function sundaeToppings(toppings: readonly ToppingSpot[]): ToppingSpot[] {
  return toppings.map((spot) => ({
    id: spot.id,
    x: (spot.x - TOP_VIEW.x) / TOP_VIEW.scale,
    y: (spot.y - TOP_VIEW.y) / TOP_VIEW.scale,
  }));
}

const sundaeGlass: Ingredient = {
  id: 'sundae-glass',
  label: 'sundae',
  icon: '🍨',
  colors: [C.pink, C.skyLight, C.white],

  stackBase: {
    top: RIM,
    draw(g) {
      const glass = vertical(g, -RIM, 10, [C.white, C.skyLight]);
      shadow(g, 4, 6, 58, 9);
      oval(g, 0, 0, 44, 10);
      fillStroke(g, glass, 3.5);
      rounded(g, -7, -46, 14, 44, 6);
      fillStroke(g, glass, 3.5);
      oval(g, 0, -44, 15, 6);
      fillStroke(g, glass, 3);
      // The tulip bowl, with strawberry syrup and cream at the bottom.
      g.beginPath();
      g.moveTo(-64, -RIM);
      g.bezierCurveTo(-62, -50, -30, -42, 0, -42);
      g.bezierCurveTo(30, -42, 62, -50, 64, -RIM);
      g.closePath();
      g.fillStyle = 'rgba(223, 242, 255, 0.9)';
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = vertical(g, -66, -42, [C.pink, C.hotPink]);
      g.fillRect(-70, -66, 140, 30);
      g.fillStyle = C.cream;
      g.fillRect(-70, -80, 140, 14);
      g.restore();
      g.lineWidth = 3.5;
      g.strokeStyle = C.ink;
      g.stroke();
      oval(g, 0, -RIM, 64, 11);
      g.fillStyle = 'rgba(255, 255, 255, 0.6)';
      g.fill();
      g.lineWidth = 3;
      g.stroke();
    },
    /** The front of the rim, in front of the bottom scoop, and a shine on the glass. */
    drawFront(g) {
      g.beginPath();
      g.ellipse(0, -RIM, 64, 11, 0, 0, Math.PI);
      g.lineWidth = 3.5;
      g.strokeStyle = C.ink;
      g.stroke();
      g.beginPath();
      g.ellipse(0, -RIM + 2, 59, 8, 0, Math.PI * 0.15, Math.PI * 0.85);
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      g.stroke();
      g.beginPath();
      g.moveTo(-52, -82);
      g.quadraticCurveTo(-48, -58, -28, -51);
      g.lineWidth = 4;
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      g.stroke();
    },
  },

  /** The sundae standing in the middle, the chocolate drizzling over its scoops. */
  sauceBase: {
    draw(g, { x, y, r, cover, swirl, spread }) {
      const s = r / 135;
      // A little plate under it.
      oval(g, x, y + r * 0.88, r * 0.6, r * 0.12);
      fillStroke(g, vertical(g, y + r * 0.76, y + r, [C.white, C.skyLight]), 3);
      g.save();
      g.translate(x, y + r * 0.88);
      g.scale(s, s);
      drawSundae(g, {
        t: 0,
        scoops: SUNDAE_SCOOPS.map((id) => ({ id, lean: 0 })),
        chocolate: cover,
        spread,
        swirl,
        toppings: [],
      });
      g.restore();
    },
  },

  /** The finished sundae, waiting for its toppings. */
  toppingBase: {
    area: AREA,
    splash: [C.white, C.pink, C.butter],
    draw(g, { toppings, t, round }) {
      const spread = chocolateIn(round);
      g.save();
      g.translate(TOP_VIEW.x, TOP_VIEW.y);
      g.scale(TOP_VIEW.scale, TOP_VIEW.scale);
      drawSundae(g, {
        t,
        scoops: scoopsIn(round),
        chocolate: spread ? 1 : 0,
        spread: spread ?? undefined,
        toppings: sundaeToppings(toppings),
      });
      g.restore();
    },
  },
};

export default sundaeGlass;
