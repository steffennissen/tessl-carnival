import { C, type G, type Mood, circle, clamp01 } from '../art';
import { artOf, ingredient, pluralOf } from '../ingredients';
import {
  BOWL,
  FLOAT_START,
  drawFallArrows,
  drawGlowLane,
  drawMixingBowl,
  floatProgress,
  startFloat,
  tapFloat,
  updateFloat,
  type FloatRules,
  type FloatState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Crack: eggs float over the mixing bowl one at a time, each a little faster.
 * Tap when one is over the bowl and it drops in. Scores in full within 22px
 * of the bowl's middle; the bowl takes any tap within 120px.
 */

export interface CrackOptions extends StepBasics {
  kind: 'crack';
  /** What gets cracked: an ingredient with `crack` art. */
  item: string;
  /** How many, each a little faster. 3 if left out. */
  count?: number;
}

/** How something you can crack into the bowl draws itself. */
export interface CrackArt {
  /** Draws it whole, centred on the origin, about 52 wide and 60 tall, with a face. */
  draw(g: G, mood: Mood): void;
  /** Draws it cracked open in the bowl, centred on (x, y). About 60 wide. */
  drawCracked(g: G, x: number, y: number): void;
}

declare module '../kit/types' {
  interface StepKinds {
    crack: CrackOptions;
  }
  interface IngredientArt {
    crack: CrackArt;
  }
}

export const EGG_COUNT = 3;
/** The first egg's speed in pixels a second, and how much faster each next one is. */
export const EGG_SPEED = 95;
export const EGG_SPEEDUP = 15;
export const CRACK_RULES: FloatRules = { perfect: 22, miss: 120 };
/** Where the floating egg is, above the bowl. */
const FLOAT_Y = 175;

export interface CrackState extends FloatState {
  /** Each egg's speed. */
  speeds: number[];
}

/** What crack steps remember for effects: an egg that's still falling. */
export interface CrackFx {
  eggs: number;
  prevX: number;
  drop: { x: number; age: number } | null;
}

/** Where the cracked eggs sit in the bowl, round its middle. */
const SPOTS = [
  [-52, 2],
  [48, 4],
  [0, -3],
];

/** Where a falling egg lands: inside the bowl's rim. */
const landX = (x: number) => Math.min(BOWL.x + 90, Math.max(BOWL.x - 90, x));

/**
 * The eggs a crack step has dropped in the mixing bowl, leaving out one
 * that's still falling. The pour step draws them too, under the flour.
 */
export function drawCrackedEggs(g: G, state: CrackState, art: CrackArt, fx?: CrackFx) {
  state.results.forEach((share, i) => {
    if (share === 0) return;
    if (fx?.drop && i === state.results.length - 1) return;
    const [dx, dy] = SPOTS[i % SPOTS.length];
    art.drawCracked(g, BOWL.x + dx, 334 + dy);
  });
}

const crack: Step<CrackOptions, CrackState, CrackFx> = {
  kind: 'crack',
  uses: (o) => [[o.item, 'crack']],

  start: (o) => ({
    ...startFloat(),
    speeds: Array.from({ length: o.count ?? EGG_COUNT }, (_, i) => EGG_SPEED + i * EGG_SPEEDUP),
  }),

  title: (o) => `Crack the ${pluralOf(ingredient(o.item))}!`,
  hint: (o) => [`Tap when the ${ingredient(o.item).label}`, 'is over the bowl!'],
  icon: (o) => ingredient(o.item).icon,
  progress: ({ state }) => floatProgress(state, state.speeds.length),
  points: ({ state }) => state.points,

  press: (turn) => tapFloat(turn, BOWL.x, turn.state.speeds.length, CRACK_RULES) !== null,

  update({ state }, dt) {
    updateFloat(state, state.speeds[state.index], dt);
  },

  fx: () => ({ eggs: 0, prevX: FLOAT_START, drop: null }),

  observe({ state, options, fx, dt, effects }) {
    const eggs = state.results.length;
    if (eggs > fx.eggs) {
      if (state.results[eggs - 1] > 0) {
        // It falls first; the sparkles come when it lands.
        fx.drop = { x: fx.prevX, age: 0 };
        effects.calm();
      } else {
        effects.celebrate(fx.prevX, FLOAT_Y);
      }
    }
    fx.eggs = eggs;

    // A falling egg cracks when it lands in the bowl.
    if (fx.drop) {
      fx.drop.age += dt;
      if (fx.drop.age >= 0.32) {
        const x = landX(fx.drop.x);
        effects.sound.crack();
        effects.burst(x, 330, 8, ['shell'], ingredient(options.item).colors, 200);
        effects.celebrate(x, 320);
        fx.drop = null;
      }
    }
    fx.prevX = state.x;
  },

  draw({ g, t, state: c, options, fx, taking }) {
    const art = artOf(options.item, 'crack');
    drawMixingBowl(g);
    drawCrackedEggs(g, c, art, fx);

    const active = taking && c.index < c.speeds.length;
    if (active) {
      // The drop zone over the bowl.
      const perfect = CRACK_RULES.perfect;
      drawGlowLane(g, t, BOWL.x, perfect + 6, 132, 186);
      g.setLineDash([10, 8]);
      g.lineDashOffset = -t * 30;
      g.lineWidth = 4;
      g.strokeStyle = C.gold;
      circle(g, BOWL.x, FLOAT_Y, 44);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      drawFallArrows(g, t, BOWL.x, 236, 60, 3);
    }

    const drawWhole = (x: number, y: number, rot: number, mood: Mood) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      art.draw(g, mood);
      g.restore();
    };

    if (fx.drop) {
      const p = clamp01(fx.drop.age / 0.32);
      const x = fx.drop.x + (landX(fx.drop.x) - fx.drop.x) * p;
      drawWhole(x, FLOAT_Y + (318 - FLOAT_Y) * p * p, p * 2, 'wow');
    }
    if (active) {
      const near = Math.abs(c.x - BOWL.x) <= CRACK_RULES.perfect + 10;
      drawWhole(c.x, FLOAT_Y + Math.sin(t * 4) * 6, Math.sin(t * 3) * 0.12, near ? 'wow' : 'happy');
    }
  },
};

export default crack;
