import {
  C,
  type G,
  circle,
  face,
  fillStroke,
  heartPath,
  horizontal,
  rounded,
  shadow,
  vertical,
} from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  STEP_POINTS,
  accuracy,
  between,
  bounce,
  finishStep,
  scoreAction,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Chop: a knife glides along the board over something to chop. Tap when it's
 * over a dotted line. 4 or 5 lines, a little different each round. A chop
 * always cuts the nearest line, scoring in full within 14px of it and
 * nothing from 60px.
 */

export interface ChopOptions extends StepBasics {
  kind: 'chop';
  /** What gets chopped: an ingredient with `chop` art. */
  item: string;
}

/** How something you can chop draws itself, whole or in pieces. */
export interface ChopArt {
  /**
   * Draws it lying along the board at height `cy`, from `x0` (its left end)
   * to `x1` (its right end), about 70 tall. `bounds` is where the pieces
   * are: [x0, ...the cuts so far, x1]. Chef Bunny's face goes at (572, cy).
   */
  draw(g: G, cut: { bounds: number[]; cy: number; x0: number; x1: number }): void;
}

declare module '../kit/types' {
  interface StepKinds {
    chop: ChopOptions;
  }
  interface IngredientArt {
    chop: ChopArt;
  }
}

/** The dotted lines spread between these, 4 or 5 of them, a little different each time. */
export const CHOP_FIRST = 270;
export const CHOP_LAST = 550;
export const CHOP_JITTER = 12;
export const KNIFE_MIN = 220;
export const KNIFE_MAX = 600;
export const KNIFE_SPEED = 105;
/** Within this many pixels of a line scores in full. */
export const CHOP_PERFECT = 14;
/** This many pixels or more from a line scores nothing. */
export const CHOP_MISS = 60;

export interface ChopState {
  /** Where the dotted lines are. */
  marks: number[];
  knifeX: number;
  dir: 1 | -1;
  /** Which lines are cut. */
  cut: boolean[];
  points: number;
}

interface ChopFx {
  cuts: number;
  /** Seconds since the last chop, for the knife's drop. */
  age: number;
}

/** The uncut line nearest the knife. */
function nearestMark(state: ChopState): number {
  let nearest = -1;
  state.marks.forEach((x, i) => {
    if (state.cut[i]) return;
    const closer =
      nearest === -1 || Math.abs(x - state.knifeX) < Math.abs(state.marks[nearest] - state.knifeX);
    if (closer) nearest = i;
  });
  return nearest;
}

/** Brings the knife down on the nearest uncut line. Returns the points scored. */
export function chopNow(turn: Turn<ChopOptions, ChopState>): number {
  const c = turn.state;
  const nearest = nearestMark(c);
  const share = accuracy(Math.abs(c.marks[nearest] - c.knifeX), CHOP_PERFECT, CHOP_MISS);
  const points = scoreAction(turn.round, share, STEP_POINTS / c.marks.length);
  c.cut[nearest] = true;
  c.points += points;
  if (c.cut.every(Boolean)) finishStep(turn.round, c.points);
  return points;
}

const chop: Step<ChopOptions, ChopState, ChopFx> = {
  kind: 'chop',
  uses: (o) => [[o.item, 'chop']],

  start(_options, random) {
    const count = random() < 0.5 ? 4 : 5;
    const gap = (CHOP_LAST - CHOP_FIRST) / (count - 1);
    const marks = Array.from({ length: count }, (_, i) =>
      Math.round(CHOP_FIRST + i * gap + between(random, -CHOP_JITTER, CHOP_JITTER)),
    );
    return { marks, knifeX: KNIFE_MIN, dir: 1, cut: marks.map(() => false), points: 0 };
  },

  title: (o) => `Chop the ${ingredient(o.item).label}!`,
  hint: () => ['Tap when the knife', 'is on a dotted line!'],
  icon: (o) => ingredient(o.item).icon,
  progress: ({ state }) => [state.marks.length, state.cut.filter(Boolean).length],
  points: ({ state }) => state.points,

  press(turn) {
    chopNow(turn);
  },

  update({ state: c }, dt) {
    const knife = bounce(c.knifeX, c.dir, KNIFE_SPEED * dt, KNIFE_MIN, KNIFE_MAX);
    c.knifeX = knife.value;
    c.dir = knife.dir;
  },

  fx: () => ({ cuts: 0, age: 9 }),

  observe({ state, options, fx, dt, effects }) {
    const cuts = state.cut.filter(Boolean).length;
    if (cuts > fx.cuts) {
      fx.age = 0;
      effects.sound.chop();
      effects.celebrate(state.knifeX, 290);
      effects.burst(state.knifeX, 290, 5, ['dot'], ingredient(options.item).colors, 160);
    }
    fx.cuts = cuts;
    fx.age += dt;
  },

  draw({ g, t, state: c, options, fx }) {
    const marks = c.marks;
    const cy = 290;
    const x0 = 222;
    const x1 = 592;

    // The chopping board.
    rounded(g, 198, 234, 450, 145, 30);
    g.fillStyle = C.shadow;
    g.fill();
    rounded(g, 190, 222, 450, 145, 30);
    fillStroke(g, vertical(g, 222, 367, [C.woodLight, C.wood]));
    g.strokeStyle = 'rgba(211, 141, 80, 0.35)';
    g.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const y = 246 + i * 30;
      g.beginPath();
      g.moveTo(214, y);
      g.bezierCurveTo(320, y - 8, 420, y + 10, 590, y - 2);
      g.stroke();
    }

    const cutXs = marks.filter((_, i) => c.cut[i]);
    artOf(options.item, 'chop').draw(g, { bounds: [x0, ...cutXs, x1], cy, x0, x1 });
    face(g, 572, cy + 2, 0.85, cutXs.length > 0 && fx.age < 0.8 ? 'joy' : 'happy');

    // Dotted lines on the marks still to cut; the nearest one glows.
    const nearest = nearestMark(c);
    marks.forEach((x, i) => {
      if (c.cut[i]) return;
      const glow = i === nearest;
      if (glow) {
        g.fillStyle = `rgba(255, 201, 60, ${0.28 + Math.sin(t * 6) * 0.1})`;
        rounded(g, x - 14, cy - 54, 28, 108, 14);
        g.fill();
      }
      g.setLineDash([0.1, 9]);
      g.lineCap = 'round';
      g.lineWidth = 5;
      g.strokeStyle = C.hotPink;
      g.beginPath();
      g.moveTo(x, cy - 46);
      g.lineTo(x, cy + 46);
      g.stroke();
      g.setLineDash([]);
      heartPath(g, x, cy - 60, glow ? 9 + Math.sin(t * 6) : 7);
      fillStroke(g, C.hotPink, 2.5);
    });

    // The knife, which drops for a chop and bobs while it waits.
    const ca = fx.age;
    const down = ca < 0.07 ? ca / 0.07 : ca < 0.3 ? 1 - (ca - 0.07) / 0.23 : 0;
    const tip = 222 + down * (cy + 8 - 222) + (down === 0 ? Math.sin(t * 5) * 3 : 0);
    const x = c.knifeX;
    const top = tip - 80;
    shadow(g, x + 6, 356, 16, 5);
    g.setLineDash([0.1, 8]);
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    g.beginPath();
    g.moveTo(x, tip + 8);
    g.lineTo(x, cy + 54);
    g.stroke();
    g.setLineDash([]);
    g.beginPath();
    g.moveTo(x - 15, top);
    g.lineTo(x + 15, top);
    g.lineTo(x + 13, tip - 30);
    g.quadraticCurveTo(x + 10, tip - 8, x, tip);
    g.quadraticCurveTo(x - 10, tip - 8, x - 13, tip - 30);
    g.closePath();
    fillStroke(g, horizontal(g, x - 15, x + 15, [C.steelDark, C.white, C.steel, C.steelDark]), 3.5);
    g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x - 7, top + 8);
    g.lineTo(x - 6, tip - 34);
    g.stroke();
    rounded(g, x - 18, top - 10, 36, 12, 5);
    fillStroke(g, C.gold, 3);
    rounded(g, x - 12, top - 64, 24, 56, 12);
    fillStroke(g, horizontal(g, x - 12, x + 12, [C.hotPink, C.pink, C.hotPink]), 3.5);
    g.fillStyle = C.white;
    for (const ry of [top - 48, top - 26]) {
      circle(g, x, ry, 3.5);
      g.fill();
    }
  },
};

export default chop;
