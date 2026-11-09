import { C, type G, face, fillStroke, oval, palette, vertical } from '../art';
import { findStep, type Ingredient, type KitchenState } from '../kit';
import type { TopOptions, TopState, ToppingSpot } from '../steps/top';
import { artOf } from './index';

const K = palette({
  frosting: '#ffa8cf',
  frostingLight: '#ffd6e8',
  frostingDark: '#f47fb2',
  liner: '#ffc2dc',
  linerStripe: '#ff8fbf',
  cake: '#f2b457',
});

/** Where the cupcake stands while the toppings go on: the middle of its frosting. */
const ORIGIN = { x: 400, y: 300 } as const;
const AREA = { x: 400, y: 250, rx: 92, ry: 40 } as const;

/**
 * A big pink-frosted cupcake centred on the origin (its frosting's middle),
 * about 230 wide and 230 tall, with `toppings` on in its own units.
 */
export function drawCupcake(
  g: G,
  toppings: readonly ToppingSpot[],
  mood: 'happy' | 'joy' = 'happy',
) {
  // The striped case.
  g.fillStyle = C.shadow;
  oval(g, 4, 102, 92, 12);
  g.fill();
  g.beginPath();
  g.moveTo(-104, 0);
  g.lineTo(104, 0);
  g.lineTo(78, 100);
  g.quadraticCurveTo(0, 108, -78, 100);
  g.closePath();
  fillStroke(g, vertical(g, 0, 104, [K.liner, K.frostingDark]));
  g.save();
  g.clip();
  g.strokeStyle = K.linerStripe;
  g.lineWidth = 6;
  for (let i = -5; i <= 5; i++) {
    g.beginPath();
    g.moveTo(i * 20, 0);
    g.lineTo(i * 15, 106);
    g.stroke();
  }
  g.restore();
  face(g, 0, 52, 1.2, mood);
  // A peek of cake under the frosting.
  oval(g, 0, -2, 108, 16);
  fillStroke(g, K.cake, 3.5);
  // The frosting swirl, three tiers and a curly tip.
  const frost = (cy: number, rx: number, ry: number) => {
    oval(g, 0, cy, rx, ry);
    fillStroke(g, vertical(g, cy - ry, cy + ry, [K.frostingLight, K.frosting, K.frostingDark]));
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    oval(g, -rx * 0.45, cy - ry * 0.45, rx * 0.22, ry * 0.2, -0.2);
    g.fill();
  };
  frost(-18, 114, 34);
  frost(-54, 92, 30);
  frost(-86, 64, 26);
  g.beginPath();
  g.moveTo(-18, -104);
  g.quadraticCurveTo(-4, -138, 12, -128);
  g.quadraticCurveTo(4, -116, 16, -104);
  g.closePath();
  fillStroke(g, vertical(g, -136, -104, [K.frostingLight, K.frosting]));

  // The toppings, the cherry last so it sits on top.
  const order = [...toppings].sort((a, b) => Number(a.id === 'cherry') - Number(b.id === 'cherry'));
  for (const spot of order) {
    g.save();
    g.translate(spot.x, spot.y);
    g.scale(1.6, 1.6);
    artOf(spot.id, 'topping').draw(g);
    g.restore();
  }
}

/** Toppings on their spots in the scene, moved into the cupcake's own units. */
export function cupcakeToppings(toppings: readonly ToppingSpot[]): ToppingSpot[] {
  return toppings.map((s) => ({ id: s.id, x: s.x - ORIGIN.x, y: s.y - ORIGIN.y }));
}

/** The round's toppings on the cupcake, in its own units, if it had any. */
function toppingsOf(round: KitchenState | null): ToppingSpot[] {
  const top = round && findStep<TopState, TopOptions>(round, 'top');
  return top ? cupcakeToppings(top.state.spots) : [];
}

/** A big cupcake with pink frosting, waiting for its toppings. */
const cupcake: Ingredient = {
  id: 'cupcake',
  label: 'cupcake',
  icon: '🧁',
  colors: [K.frosting, C.white],

  toppingBase: {
    area: AREA,
    splash: [K.frosting, C.white, C.butter],
    draw(g, { toppings }) {
      g.save();
      g.translate(ORIGIN.x, ORIGIN.y);
      drawCupcake(g, cupcakeToppings(toppings));
      g.restore();
    },
  },

  /** The finished cupcake, with candles round its middle tier for a party. */
  partyCake: {
    draw(g, { round }) {
      g.save();
      g.translate(ORIGIN.x, ORIGIN.y);
      drawCupcake(g, toppingsOf(round), 'joy');
      g.restore();
    },
    candles(count) {
      return Array.from({ length: count }, (_, i) => {
        const x = count === 1 ? 0 : -66 + (132 * i) / (count - 1);
        // Round the frosting's middle tier, the outer ones a little lower.
        const y = -62 + 16 * (1 - Math.cos((x / 92) * (Math.PI / 2)));
        return { x: ORIGIN.x + x, y: ORIGIN.y + y };
      });
    },
  },
};

export default cupcake;
