import {
  C,
  type G,
  type Mood,
  circle,
  emoji,
  face,
  fillStroke,
  heartPath,
  horizontal,
  oval,
  rounded,
  shadow,
  starPath,
  vertical,
} from '../art';
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
  type HoldRules,
  type HoldState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Scoop: hold the scoop in the tub and the ball of ice cream grows; let go
 * when it fills the dotted circle (and the meter reaches the star). One scoop
 * from each tub, in order. A quick tap is "Not yet!" and uses nothing up; a
 * scoop held until it's as big as it gets comes out by itself.
 */

export interface ScoopOptions extends StepBasics {
  kind: 'scoop';
  /** The tubs to scoop from, in order: ingredients with `scoop` art. One scoop each. */
  flavours: string[];
}

/** How a flavour of ice cream draws itself. */
export interface ScoopArt {
  /** Draws a ball of it centred on the origin, radius r, with a face. See `drawScoopBall`. */
  drawBall(g: G, r: number, mood: Mood): void;
  /** Its tub's label. */
  tub: string;
  /** The ice cream in the open tub, seen from above. */
  top: string;
  /** The meter's gradient, top to bottom. */
  meter: string[];
}

declare module '../kit/types' {
  interface StepKinds {
    scoop: ScoopOptions;
  }
  interface IngredientArt {
    scoop: ScoopArt;
  }
}

/** Pouring's rules: 0.28 of the meter a second, full points within 0.06 of the star, none from 0.35. */
export const SCOOP_RULES: HoldRules = POUR_RULES;
/** Where the tubs' rims are, and how far apart the tubs stand. */
export const TUB_Y = 338;
const TUB_X = 384;
const TUB_GAP = 122;

/** How big a ball is for how full the meter is: the dotted circle is the star's size. */
export function ballRadius(level: number): number {
  return 10 + 36 * level;
}

export interface ScoopState extends HoldState {
  /** How big each scoop came out, 0 to 1, in order. */
  sizes: number[];
}

/** Where tub `i` of `count` stands. */
export function tubX(i: number, count: number): number {
  return TUB_X + (i - (count - 1) / 2) * TUB_GAP;
}

/**
 * A ball of ice cream centred on the origin, radius r: glossy, with a
 * scalloped edge underneath, `chips` if it has any, and a face. Flavours
 * draw their balls with this.
 */
export function drawScoopBall(
  g: G,
  r: number,
  look: { light: string; main: string; dark: string; chips?: string; mood: Mood },
) {
  // The frilly edge a scoop leaves, peeking out underneath.
  for (let i = -3; i <= 3; i++) {
    circle(g, i * r * 0.3, r * 0.62 + Math.abs(i) * -r * 0.04, r * 0.24);
    fillStroke(g, look.main, Math.max(1.5, r * 0.07));
  }
  circle(g, 0, 0, r);
  const ball = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  ball.addColorStop(0, look.light);
  ball.addColorStop(0.65, look.main);
  ball.addColorStop(1, look.dark);
  fillStroke(g, ball, Math.max(2, r * 0.09));
  if (look.chips) {
    g.fillStyle = look.chips;
    for (const [cx, cy, rot] of [
      [-0.5, -0.2, 0.4],
      [0.45, -0.35, -0.6],
      [0.55, 0.3, 1.1],
      [-0.35, 0.45, -0.3],
      [0.05, -0.62, 0.9],
    ]) {
      g.save();
      g.translate(cx * r, cy * r);
      g.rotate(rot);
      rounded(g, -r * 0.08, -r * 0.04, r * 0.16, r * 0.08, r * 0.04);
      g.fill();
      g.restore();
    }
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.7)';
  oval(g, -r * 0.4, -r * 0.48, r * 0.24, r * 0.13, -0.5);
  g.fill();
  face(g, 0, r * 0.12, r / 40, look.mood);
}

/** A tub of ice cream on the counter, its lid off. */
function drawTub(g: G, x: number, art: ScoopArt, scooped: boolean) {
  const y = TUB_Y;
  shadow(g, x + 4, y + 72, 50, 8);
  g.beginPath();
  g.moveTo(x - 48, y);
  g.lineTo(x + 48, y);
  g.lineTo(x + 40, y + 68);
  g.quadraticCurveTo(x, y + 76, x - 40, y + 68);
  g.closePath();
  fillStroke(g, vertical(g, y, y + 74, [C.white, C.cream]));
  rounded(g, x - 44, y + 18, 88, 26, 10);
  fillStroke(g, art.tub, 3);
  heartPath(g, x, y + 31, 7);
  fillStroke(g, C.white, 2);
  oval(g, x, y, 50, 12);
  fillStroke(g, C.white);
  oval(g, x, y + 1, 42, 8);
  g.fillStyle = art.top;
  g.fill();
  if (scooped) {
    g.fillStyle = 'rgba(91, 59, 79, 0.15)';
    oval(g, x + 6, y + 1, 18, 4);
    g.fill();
  }
}

interface ScoopFx {
  index: number;
  timer: number;
}

const scoop: Step<ScoopOptions, ScoopState, ScoopFx> = {
  kind: 'scoop',
  uses: (o) => o.flavours.map((id) => [id, 'scoop']),

  start: (o, random) => ({
    ...startHold(o.flavours.map(() => between(random, TARGET_LOW, TARGET_HIGH))),
    sizes: [],
  }),

  title: () => 'Scoop the ice cream!',
  hint: () => ['Hold to scoop, let go', 'when it fills the circle!'],
  icon: () => '🍦',
  progress: holdProgress,
  points: ({ state }) => state.points,

  press: pressHold,
  release(turn) {
    const level = turn.state.level;
    const out = releaseHold(turn, SCOOP_RULES);
    if (typeof out === 'number') turn.state.sizes.push(level);
    return out;
  },
  update(turn, dt) {
    const before = turn.state.index;
    updateHold(turn, SCOOP_RULES, dt);
    // A scoop held until it's as big as it gets comes out by itself.
    if (turn.state.index > before) turn.state.sizes.push(1);
  },

  fx: () => ({ index: 0, timer: 0 }),

  observe({ state: s, options, fx, dt, effects }) {
    const count = options.flavours.length;
    if (s.index > fx.index) {
      const i = s.index - 1;
      const x = tubX(i, count);
      effects.sound.pop();
      effects.sound.tone(520, 0.18, { type: 'sine', volume: 0.14, slideTo: 880 });
      effects.burst(
        x,
        TUB_Y - 40,
        8,
        ['heart', 'star'],
        ingredient(options.flavours[i]).colors,
        200,
      );
      effects.celebrate(x, TUB_Y - 60);
    }
    fx.index = s.index;
    if (!s.holding) return;
    // Scraping round the tub, with little crumbs flying up.
    fx.timer -= dt;
    if (fx.timer <= 0) {
      fx.timer = 0.22;
      effects.sound.hiss(0.1, { volume: 0.07, from: 2400, filter: 'bandpass' });
      const x = tubX(s.index, count);
      effects.burst(x, TUB_Y, 2, ['dot'], ingredient(options.flavours[s.index]).colors, 110);
    }
  },

  draw({ g, t, state: s, options, taking }) {
    const count = options.flavours.length;
    const index = Math.min(s.index, count - 1);
    const active = s.index < count;

    // The tubs, the one to scoop from glowing and bobbing.
    options.flavours.forEach((id, i) => {
      const x = tubX(i, count);
      if (i === s.index) {
        g.fillStyle = `rgba(255, 201, 60, ${0.35 + Math.sin(t * 5) * 0.12})`;
        oval(g, x, TUB_Y + 74, 62, 12);
        g.fill();
      }
      drawTub(g, x, artOf(id, 'scoop'), i < s.index);
    });

    // Finished scoops, sitting proudly on their tubs.
    s.sizes.forEach((size, i) => {
      const r = ballRadius(size);
      g.save();
      g.translate(tubX(i, count), TUB_Y - r + 4 + Math.sin(t * 3 + i) * 2);
      artOf(options.flavours[i], 'scoop').drawBall(g, r, 'joy');
      g.restore();
    });

    if (!active) return;
    const art = artOf(options.flavours[index], 'scoop');
    const x = tubX(index, count);
    const target = s.targets[index];
    const rt = ballRadius(target);

    if (s.holding || s.level > 0) {
      // Digging in: the ball grows on the scoop.
      const r = ballRadius(s.level);
      const near = Math.abs(s.level - target) <= SCOOP_RULES.perfect;
      g.save();
      g.translate(x, TUB_Y - 2 - r);
      g.rotate(s.holding ? Math.sin(t * 22) * 0.05 : 0);
      g.save();
      g.rotate(-0.75);
      rounded(g, r * 0.6, -5, 34, 10, 5);
      fillStroke(g, horizontal(g, r * 0.6, r * 0.6 + 34, [C.steelDark, C.white, C.steel]), 3);
      rounded(g, r * 0.6 + 30, -10, 86, 20, 10);
      fillStroke(g, horizontal(g, 0, 140, [C.hotPink, C.pink, C.hotPink]), 3.5);
      g.restore();
      art.drawBall(g, r, near ? 'wow' : 'happy');
      g.restore();
    } else {
      // The empty scoop waiting over the tub, and a finger to show what to do.
      const bob = Math.sin(t * 3) * 5;
      g.save();
      g.translate(x + 6, 262 + bob);
      g.rotate(-0.5);
      rounded(g, 20, -6, 30, 12, 6);
      fillStroke(g, horizontal(g, 20, 50, [C.steelDark, C.white, C.steel]), 3);
      rounded(g, 44, -11, 86, 22, 11);
      fillStroke(g, horizontal(g, 44, 130, [C.hotPink, C.pink, C.hotPink]), 3.5);
      g.beginPath();
      g.arc(0, 0, 24, 0, Math.PI);
      g.closePath();
      fillStroke(g, vertical(g, 0, 24, [C.white, C.steelDark]), 3.5);
      g.restore();
      if (taking) {
        g.fillStyle = C.ink;
        emoji(g, '👆', index === 0 ? x + 62 : x - 58, 300 + Math.sin(t * 5) * 6, 42);
      }
    }

    // The dotted circle to fill, with a star on it, over the growing ball.
    if (taking) {
      g.setLineDash([7, 7]);
      g.lineDashOffset = -t * 20;
      g.lineWidth = 4;
      g.strokeStyle = C.gold;
      circle(g, x, TUB_Y - 2 - rt, rt);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      starPath(
        g,
        x + rt * 0.75,
        TUB_Y - 2 - rt * 1.75,
        11 + Math.sin(t * 5),
        Math.sin(t * 2) * 0.2,
      );
      fillStroke(g, C.gold, 2.5);
    }

    drawMeter(g, t, s.level, target, art.meter);
  },
};

export default scoop;
