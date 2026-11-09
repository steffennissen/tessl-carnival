import { C, type G, blend, face, fillStroke, oval, palette, rounded, vertical } from '../art';
import { GOLDEN, findStep, type Ingredient, type KitchenState } from '../kit';
import type { TopOptions, TopState, ToppingSpot } from '../steps/top';
import { artOf } from './index';

const K = palette({
  frosting: '#ffb3d4',
  frostingLight: '#ffe0ee',
  frostingDark: '#f48bbb',
  sponge: '#ffe2a8',
  filling: '#ff6f9c',
});

/** Where the cake's top is while the candles go on, in scene units. */
const ORIGIN = { x: 400, y: 236 } as const;
const AREA = { x: 400, y: 236, rx: 112, ry: 30 } as const;

/**
 * A big pink birthday cake on a plate, centred on the middle of its top
 * (about 320 wide and 150 tall below it), with `toppings` on top in its own
 * units.
 */
export function drawBirthdayCake(
  g: G,
  toppings: readonly ToppingSpot[],
  mood: 'happy' | 'joy' = 'happy',
) {
  // The plate.
  oval(g, 0, 104, 166, 20);
  fillStroke(g, C.white, 3.5);
  // The side: sponge, a strawberry filling, and frosting dripping down.
  g.beginPath();
  g.moveTo(-130, 0);
  g.lineTo(-130, 96);
  g.ellipse(0, 96, 130, 14, 0, Math.PI, 0, true);
  g.lineTo(130, 0);
  g.closePath();
  fillStroke(g, vertical(g, 0, 110, [K.sponge, K.frostingDark]));
  g.fillStyle = K.filling;
  g.fillRect(-128, 50, 256, 10);
  g.fillStyle = C.white;
  for (let i = 0; i < 9; i++) {
    const x = -112 + i * 28;
    oval(g, x, 64, 5, 3);
    g.fill();
  }
  face(g, 0, 78, 1.1, mood);
  // The frosting on top, dripping over the edge.
  g.beginPath();
  g.ellipse(0, 0, 132, 38, 0, 0, Math.PI * 2);
  g.closePath();
  fillStroke(g, vertical(g, -38, 38, [K.frostingLight, K.frosting]));
  g.fillStyle = K.frosting;
  for (let i = 0; i < 8; i++) {
    const x = -112 + i * 32;
    const drop = 14 + (i % 3) * 8;
    rounded(g, x - 7, 22, 14, drop, 7);
    g.fill();
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  oval(g, -54, -12, 30, 7, -0.1);
  g.fill();

  // The toppings, back to front, candles last so they stand on top.
  const order = [...toppings].sort((a, b) => a.y - b.y);
  for (const spot of order) {
    g.save();
    g.translate(spot.x, spot.y);
    g.scale(1.6, 1.6);
    artOf(spot.id, 'topping').draw(g);
    g.restore();
  }
}

/** Toppings on their spots in the scene, moved into the cake's own units. */
export function cakeToppings(toppings: readonly ToppingSpot[]): ToppingSpot[] {
  return toppings.map((s) => ({ id: s.id, x: s.x - ORIGIN.x, y: s.y - ORIGIN.y }));
}

/** The round's toppings on the cake, in its own units, if it had any. */
function toppingsOf(round: KitchenState | null): ToppingSpot[] {
  const top = round && findStep<TopState, TopOptions>(round, 'top');
  return top ? cakeToppings(top.state.spots) : [];
}

/** A birthday cake: a round tin rising in the oven, then a big frosted cake for candles. */
const birthdayCake: Ingredient = {
  id: 'birthday-cake',
  label: 'cake',
  icon: '🎂',
  colors: [K.frosting, C.white, C.butter],

  bake: {
    draw(g, { x, y, level, baking, t }) {
      const rise = Math.min(1, level / GOLDEN);
      const crisp = Math.max(0, (level - GOLDEN) / (1 - GOLDEN));
      const cake =
        level <= GOLDEN
          ? blend([C.doughLight, C.crustGold], rise)
          : blend([C.crustGold, C.crustBrown], crisp);
      const bob = baking ? Math.sin(t * 5) * 1.2 : 0;
      // The cake rising out of its round tin.
      const h = 8 + 26 * rise;
      g.beginPath();
      g.ellipse(x, y - 8 + bob, 86, h, 0, Math.PI, 0);
      g.closePath();
      fillStroke(g, vertical(g, y - 8 - h, y - 8, [C.doughLight, cake]), 3.5);
      rounded(g, x - 92, y - 10, 184, 36, 10);
      fillStroke(g, vertical(g, y - 10, y + 26, [C.steel, C.steelDark]), 3.5);
      g.fillStyle = 'rgba(255, 255, 255, 0.5)';
      oval(g, x - 56, y, 22, 3);
      g.fill();
      if (rise > 0.5)
        face(g, x, y - 10 - h * 0.45 + bob, 0.6, level >= GOLDEN * 0.9 ? 'joy' : 'happy');
    },
  },

  toppingBase: {
    area: AREA,
    splash: [K.frosting, C.white, C.butter],
    draw(g, { toppings }) {
      g.save();
      g.translate(ORIGIN.x, ORIGIN.y);
      drawBirthdayCake(g, cakeToppings(toppings));
      g.restore();
    },
  },

  /** The finished cake, with candles in a gentle arc across its top for the party. */
  partyCake: {
    // The plate, and the lit candles' flames above the top.
    box: { x: ORIGIN.x - 166, y: ORIGIN.y - 94, w: 332, h: 218 },
    draw(g, { round }) {
      g.save();
      g.translate(ORIGIN.x, ORIGIN.y);
      drawBirthdayCake(g, toppingsOf(round), 'joy');
      g.restore();
    },
    candles(count) {
      return Array.from({ length: count }, (_, i) => {
        const x = count === 1 ? 0 : -88 + (176 * i) / (count - 1);
        // Round the frosting's oval: the middle ones a little further back.
        const y = 4 - 12 * Math.cos((x / 132) * (Math.PI / 2));
        return { x: ORIGIN.x + x, y: ORIGIN.y + y };
      });
    },
  },
};

export default birthdayCake;
