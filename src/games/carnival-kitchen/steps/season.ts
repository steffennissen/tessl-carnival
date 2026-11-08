import { C, type G } from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  POUR_RULES,
  TARGET_HIGH,
  TARGET_LOW,
  between,
  drawMeter,
  holdProgress,
  pressHold,
  releaseHold,
  startHold,
  updateHold,
  type HoldState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Season: hold to shake (salt, pepper, spice) over the food, and let go when
 * the meter reaches the star. 3 shakes unless the recipe says otherwise.
 */

export interface SeasonOptions extends StepBasics {
  kind: 'season';
  /** What's shaken: an ingredient with `shaker` art. Its first colour is the grains'. */
  shaker: string;
  /** What's seasoned: an ingredient with `seasoned` art. */
  food: string;
  /** How many shakes. 3 if left out. */
  shakes?: number;
}

/** How a shaker (salt, a pepper mill, a spice jar) draws itself. */
export interface ShakerArt {
  /**
   * Draws it upright, centred on the origin, about 66 wide and 110 tall,
   * with a face. The step turns it over and shakes it while you hold.
   * `left` is how full it still is, 0 to 1.
   */
  draw(g: G, left: number, shaking: boolean): void;
}

/** How food being seasoned draws itself under the shaker. */
export interface SeasonedArt {
  /**
   * Draws it on the counter, centred on x (about 260 wide, from y 240 to
   * 420), with `specks` grains of seasoning on top in `speck` colour.
   */
  draw(g: G, look: { x: number; t: number; specks: number; speck: string }): void;
}

declare module '../kit/types' {
  interface StepKinds {
    season: SeasonOptions;
  }
  interface IngredientArt {
    shaker: ShakerArt;
    seasoned: SeasonedArt;
  }
}

export const SHAKES = 3;
/** Where the food and the shaker stand. */
const X = 380;

interface SeasonFx {
  index: number;
  timer: number;
}

const season: Step<SeasonOptions, HoldState, SeasonFx> = {
  kind: 'season',
  uses: (o) => [
    [o.shaker, 'shaker'],
    [o.food, 'seasoned'],
  ],

  start: (o, random) =>
    startHold(
      Array.from({ length: o.shakes ?? SHAKES }, () => between(random, TARGET_LOW, TARGET_HIGH)),
    ),

  title: (o) => `Shake the ${ingredient(o.shaker).label}!`,
  hint: () => ['Hold to shake,', 'let go at the star!'],
  icon: (o) => ingredient(o.shaker).icon,
  progress: holdProgress,
  points: ({ state }) => state.points,

  press: pressHold,
  release: (turn) => releaseHold(turn, POUR_RULES),
  update: (turn, dt) => updateHold(turn, POUR_RULES, dt),

  fx: () => ({ index: 0, timer: 0 }),

  observe({ state: s, options, fx, dt, effects }) {
    if (s.index > fx.index) {
      effects.sound.pop();
      effects.celebrate(X, 290);
    }
    fx.index = s.index;
    if (!s.holding) return;
    fx.timer -= dt;
    if (fx.timer <= 0) {
      effects.sound.shake();
      fx.timer = 0.12;
    }
    // Grains falling from the shaker, mostly its first colour.
    const colors = ingredient(options.shaker).colors;
    for (let i = 0; i < 3; i++) {
      effects.add({
        x: X + (Math.random() - 0.5) * 30,
        y: 240,
        vx: (Math.random() - 0.5) * 30,
        vy: 140 + Math.random() * 60,
        gravity: 500,
        life: 0.32,
        max: 0.32,
        size: 3,
        color: Math.random() < 0.7 ? colors[0] : (colors[1] ?? colors[0]),
        shape: 'salt',
        rot: 0,
        spin: 0,
      });
    }
  },

  draw({ g, t, state: s, options }) {
    const shaker = ingredient(options.shaker);
    artOf(options.food, 'seasoned').draw(g, {
      x: X,
      t,
      specks: s.index * 12 + Math.floor(s.level * 14),
      speck: shaker.colors[0],
    });

    // The shaker, which turns over and shakes while you hold.
    const targets = s.targets;
    g.save();
    g.translate(X, s.holding ? 178 : 168 + Math.sin(t * 2.5) * 3);
    g.rotate(s.holding ? Math.PI + Math.sin(t * 38) * 0.16 : Math.sin(t * 2) * 0.05);
    artOf(options.shaker, 'shaker').draw(
      g,
      1 - (s.index + s.level) / (targets.length + 1),
      s.holding,
    );
    g.restore();

    // The meter, with a star to stop at.
    drawMeter(g, t, s.level, targets[Math.min(s.index, targets.length - 1)], [C.lavender, C.sky]);
  },
};

export default season;
