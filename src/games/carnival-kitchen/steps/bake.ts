import {
  C,
  type G,
  circle,
  emoji,
  fillStroke,
  heartPath,
  horizontal,
  rounded,
  shadow,
  vertical,
} from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  GOLDEN,
  drawMeter,
  stepMinutes,
  holdProgress,
  pressHold,
  releaseHold,
  startHold,
  updateHold,
  type HoldRules,
  type HoldState,
  type KitchenState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Bake: hold to bake, and let go when the meter reaches the star and the
 * food looks golden. Letting go while it's still pale is "Not yet!": it stays
 * in, keeps its heat, and you can hold again. Left in too long, it comes out
 * by itself, a little crispy.
 */

export interface BakeOptions extends StepBasics {
  kind: 'bake';
  /** What's baked: an ingredient with `bake` art. Its colours sparkle when it comes out. */
  item: string;
}

/** How something in the oven draws itself. */
export interface BakeArt {
  /**
   * Draws it on the oven's rack, centred on (x, y), about 200 wide and 70
   * tall (the window is 270 × 150). `level` is how baked it is: 0 raw,
   * GOLDEN just right, 1 crispy. `round` is there for art that shows an
   * earlier step's work, such as the pizza's toppings.
   */
  draw(
    g: G,
    look: { x: number; y: number; level: number; baking: boolean; t: number; round: KitchenState },
  ): void;
}

declare module '../kit/types' {
  interface StepKinds {
    bake: BakeOptions;
  }
  interface IngredientArt {
    bake: BakeArt;
  }
}

/** Oven heat per second while held. */
export const BAKE_SPEED = 0.18;
/** How baked it should be: the star. */
export const BAKE_TARGET = GOLDEN;
export const BAKE_PERFECT = 0.07;
/** Off the target by this much or more scores nothing. */
export const BAKE_ZONE = 0.4;
/** Letting go this far before the target is "Not yet!": it stays in. */
export const BAKE_EARLY = 0.2;

export const BAKE_RULES: HoldRules = {
  speed: BAKE_SPEED,
  perfect: BAKE_PERFECT,
  zone: BAKE_ZONE,
  tooSoon: (level, target) => level < target - BAKE_EARLY,
  keep: true,
};

interface BakeFx {
  done: boolean;
  sizzle: number;
}

const bake: Step<BakeOptions, HoldState, BakeFx> = {
  kind: 'bake',
  uses: (o) => [[o.item, 'bake']],
  start: () => startHold([BAKE_TARGET]),

  title: (o) => `Bake the ${ingredient(o.item).label}!`,
  hint: () => ['Hold to bake, let go', 'when it is golden!'],
  icon: () => '🔥',
  progress: holdProgress,
  points: ({ state }) => state.points,

  press: pressHold,
  release: (turn) => releaseHold(turn, BAKE_RULES),
  update: (turn, dt) => updateHold(turn, BAKE_RULES, dt),

  fx: () => ({ done: false, sizzle: 0 }),

  observe({ state: b, options, fx, dt, effects }) {
    const done = b.index >= b.targets.length;
    if (done && !fx.done) {
      effects.sound.ding();
      effects.celebrate(380, 300);
      effects.burst(380, 300, 12, ['heart', 'star'], ingredient(options.item).colors, 260);
    }
    fx.done = done;
    // The oven crackles while it bakes.
    if (b.holding) {
      fx.sizzle -= dt;
      if (fx.sizzle <= 0) {
        effects.sound.sizzle();
        fx.sizzle = 0.2;
      }
    }
  },

  draw({ g, t, state: b, options, taking, round }) {
    const ox = 380;
    const left = ox - 165;
    const width = 330;
    const heat = b.holding ? 1 : 0;

    // Heat shimmer above the oven while it's on.
    if (b.holding) {
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.8 + i / 3) % 1;
        g.strokeStyle = `rgba(255, 138, 61, ${0.6 * Math.sin(phase * Math.PI)})`;
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.beginPath();
        for (let k = 0; k <= 8; k++) {
          g.lineTo(ox - 60 + i * 60 + Math.sin(k * 0.9 + t * 6 + i) * 6, 128 - phase * 30 - k * 4);
        }
        g.stroke();
      }
    }

    // The oven.
    shadow(g, ox + 6, 408, 170, 14);
    for (const foot of [left + 30, left + width - 30]) {
      rounded(g, foot - 14, 392, 28, 18, 6);
      fillStroke(g, C.lavender, 3);
    }
    rounded(g, left, 136, width, 262, 34);
    fillStroke(g, vertical(g, 136, 398, [C.white, C.oven]), 4.5);
    // Control panel with knobs and a little heart light.
    rounded(g, left + 14, 148, width - 28, 40, 18);
    fillStroke(g, horizontal(g, left, left + width, [C.pink, C.hotPink]), 3.5);
    [-110, -70, 70, 110].forEach((dx, i) => {
      circle(g, ox + dx, 168, 12);
      fillStroke(g, C.white, 3);
      const a = b.holding ? t * 3 + i : -Math.PI / 2;
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(ox + dx, 168);
      g.lineTo(ox + dx + Math.cos(a) * 8, 168 + Math.sin(a) * 8);
      g.stroke();
    });
    heartPath(g, ox, 169, 11 + (b.holding ? Math.sin(t * 10) * 1.5 : 0));
    fillStroke(g, b.holding ? C.gold : C.white, 3);
    // Door handle.
    rounded(g, ox - 70, 198, 140, 14, 7);
    fillStroke(g, horizontal(g, ox - 70, ox + 70, [C.gold, C.butter, C.gold]), 3);

    // The window, glowing while it bakes, with the food inside.
    const wx = left + 30;
    const wy = 222;
    const ww = width - 60;
    const wh = 150;
    rounded(g, wx, wy, ww, wh, 24);
    fillStroke(g, vertical(g, wy, wy + wh, [C.glassLight, C.glass]), 4);
    g.save();
    rounded(g, wx + 4, wy + 4, ww - 8, wh - 8, 20);
    g.clip();
    const flicker = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
    const glow = g.createRadialGradient(ox, wy + wh, 10, ox, wy + wh, 200);
    glow.addColorStop(0, `rgba(255, 170, 70, ${(0.35 + 0.5 * heat) * flicker})`);
    glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
    g.fillStyle = glow;
    g.fillRect(wx, wy, ww, wh);
    // Rack and the glowing element below it.
    g.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(wx, wy + 108);
    g.lineTo(wx + ww, wy + 108);
    g.stroke();
    g.strokeStyle = b.holding ? C.ember : 'rgba(255, 255, 255, 0.25)';
    g.lineWidth = 5;
    g.beginPath();
    for (let k = 0; k <= 12; k++) g.lineTo(wx + 20 + k * ((ww - 40) / 12), wy + 134 + (k % 2) * 6);
    g.stroke();
    artOf(options.item, 'bake').draw(g, {
      x: ox,
      y: wy + 92,
      level: b.level,
      baking: b.holding,
      t,
      round,
    });
    g.restore();
    // Shine on the glass.
    g.fillStyle = 'rgba(255, 255, 255, 0.18)';
    g.beginPath();
    g.moveTo(wx + 30, wy + 6);
    g.lineTo(wx + 80, wy + 6);
    g.lineTo(wx + 30, wy + 90);
    g.lineTo(wx + 8, wy + 90);
    g.closePath();
    g.fill();

    // The meter, with a star where it's golden.
    drawMeter(
      g,
      t,
      b.level,
      BAKE_TARGET,
      [C.hotPink, C.ember, C.butter],
      `${stepMinutes(options)} minutes`,
    );

    if (taking && !b.holding) {
      const bob = Math.sin(t * 5) * 6;
      g.fillStyle = C.ink;
      emoji(g, '👆', ox + 120, 330 + bob, 46);
    }
  },
};

export default bake;
