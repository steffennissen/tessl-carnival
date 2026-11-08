import {
  C,
  type G,
  circle,
  clamp01,
  emoji,
  face,
  fillStroke,
  heartPath,
  horizontal,
  oval,
  palette,
  rounded,
  shadow,
  starPath,
  vertical,
} from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  finishStep,
  showGrade,
  type KitchenState,
  type Step,
  type StepBasics,
  type StepView,
  type Turn,
} from '../kit';
import { NOTE } from '../sound';

/**
 * Roll: two ways to roll, picked by `how`.
 *
 * - 'dough': hold the rolling pin and drag it over the dough, any way you
 *   like. The dough spreads out toward a dotted outline and stops there, so
 *   it can't be rolled too thin.
 * - 'mat': drag upward over the bamboo mat to roll it up, with the filling
 *   inside. Upward drags roll it; down drags just don't count.
 *
 * Scored like circles: 50 for finishing plus up to 50 for time left, or up
 * to 50 for how far it got if time runs out. It shows a grade but leaves the
 * combo alone.
 */

export interface RollOptions extends StepBasics {
  kind: 'roll';
  /** 'dough' rolls it out flat with a rolling pin; 'mat' rolls it up in a bamboo mat. */
  how: 'dough' | 'mat';
  /** What's rolled: an ingredient with `rollOut` art (dough) or `rollUp` art (mat). */
  item: string;
}

/** Something you roll out flat with a rolling pin, seen from above. */
export interface RollOutArt {
  /**
   * Draws it centred on (x, y), an oval rx by ry. `spread` is how rolled out
   * it is: 0 a fat ball, 1 flat and filling the dotted outline.
   */
  draw(
    g: G,
    look: { x: number; y: number; rx: number; ry: number; spread: number; t: number },
  ): void;
}

/** Something you roll up in a bamboo mat, such as sushi. */
export interface RollUpArt {
  /**
   * Draws the sheet lying flat on the mat, seen from above, filling x0 to x1
   * and y0 to y1 (the filling and all). The step only shows the part that
   * isn't rolled up yet. `round` is there to show an earlier step's work.
   */
  drawSheet(
    g: G,
    look: { x0: number; y0: number; x1: number; y1: number; t: number; round: KitchenState },
  ): void;
  /** One end of the roll, seen end on: a circle of radius r round (x, y). */
  drawEnd(g: G, x: number, y: number, r: number): void;
}

declare module '../kit/types' {
  interface StepKinds {
    roll: RollOptions;
  }
  interface IngredientArt {
    rollOut: RollOutArt;
    rollUp: RollUpArt;
  }
}

/** This file's own colours: see `palette` in art.ts. */
const K = palette({
  bamboo: '#cfe59a',
  bambooLight: '#eef8cf',
  bambooDark: '#93bb5c',
  flour: '#fffaf0',
});

/** Seconds to roll it in. Generous: finishing at all is worth 50. */
export const ROLL_TIME = 20;
/** Pixels of rolling-pin dragging to roll the dough out to its outline. */
export const DOUGH_DISTANCE = 1500;
/** Pixels of upward dragging to roll up the mat. */
export const MAT_DISTANCE = 700;
/** One pointer move counts for at most this many pixels, so a jump isn't a roll. */
export const ROLL_STEP_MAX = 60;
/** The dough's dotted outline: where it stops spreading. */
export const DOUGH = { x: 400, y: 285, rx: 180, ry: 112 } as const;
/** How big the dough starts, as a share of the outline. */
export const DOUGH_START = 0.38;
/** The rolling pin rolls the dough anywhere this close to its middle. */
export const DOUGH_REACH = 330;
/** The bamboo mat, seen from above. It rolls up from the bottom edge to the top. */
export const MAT = { x0: 235, x1: 565, y0: 135, y1: 405 } as const;
/** Stars under the cooking. */
export const ROLL_STARS = 3;

export interface RollState {
  /** How far it's rolled, 0 to 1. Never more: the dough stops at its outline. */
  rolled: number;
  timeLeft: number;
  /** Where the pointer was, while held; null starts a fresh stroke. */
  last: { x: number; y: number } | null;
  /** Set when the step finishes, so `observe` can celebrate. */
  done: boolean;
}

interface RollFx {
  done: boolean;
  /** How far it was rolled at the last squeak. */
  squeakAt: number;
  stars: number;
}

export function startRoll(): RollState {
  return { rolled: 0, timeLeft: ROLL_TIME, last: null, done: false };
}

function finishRoll(turn: Turn<RollOptions, RollState>, points: number): void {
  turn.state.done = true;
  showGrade(turn.round, points);
  finishStep(turn.round, points);
}

/** How much one pointer move from `last` to (x, y) rolls, as a share of the whole. */
export function rollGain(
  how: RollOptions['how'],
  last: { x: number; y: number },
  x: number,
  y: number,
): number {
  if (how === 'mat') return Math.min(ROLL_STEP_MAX, Math.max(0, last.y - y)) / MAT_DISTANCE;
  if (Math.hypot(x - DOUGH.x, y - DOUGH.y) > DOUGH_REACH) return 0;
  return Math.min(ROLL_STEP_MAX, Math.hypot(x - last.x, y - last.y)) / DOUGH_DISTANCE;
}

/** Moves the pin (or the hand on the mat) to (x, y) while the pointer is held. */
export function moveRoll(turn: Turn<RollOptions, RollState>, x: number, y: number): void {
  const s = turn.state;
  if (s.done) return;
  if (s.last) s.rolled = Math.min(1, s.rolled + rollGain(turn.options.how, s.last, x, y));
  s.last = { x, y };
  // Done in time: 50 for finishing, plus up to 50 for time left.
  if (s.rolled >= 1) finishRoll(turn, 50 + 50 * (s.timeLeft / ROLL_TIME));
}

const roll: Step<RollOptions, RollState, RollFx> = {
  kind: 'roll',
  uses: (o) => [[o.item, o.how === 'mat' ? 'rollUp' : 'rollOut']],
  start: () => startRoll(),

  title: (o) =>
    o.how === 'mat'
      ? `Roll the ${ingredient(o.item).label}!`
      : `Roll out the ${ingredient(o.item).label}!`,
  hint: (o) =>
    o.how === 'mat'
      ? ['Hold and push the mat', 'up to roll it!']
      : ['Hold and roll the pin', 'to the dotted line!'],
  icon: (o) => ingredient(o.item).icon,
  progress: ({ state }) => [
    ROLL_STARS,
    Math.min(ROLL_STARS, Math.floor(state.rolled * ROLL_STARS + 1e-9)),
  ],

  press: (turn, x, y) => moveRoll(turn, x, y),
  move: (turn, x, y) => moveRoll(turn, x, y),
  /** Lifting the finger starts a fresh stroke. */
  release: (turn) => {
    turn.state.last = null;
  },
  update: (turn, dt) => {
    const s = turn.state;
    if (s.done) return;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    // Out of time: up to 50 for how far it got.
    if (s.timeLeft === 0) finishRoll(turn, 50 * s.rolled);
  },

  fx: () => ({ done: false, squeakAt: 0, stars: 0 }),

  observe({ state: s, options, fx, effects }) {
    const mat = options.how === 'mat';
    const at = mat ? { x: 400, y: MAT.y0 + 60 } : { x: DOUGH.x, y: DOUGH.y };
    if (s.done && !fx.done) {
      effects.celebrate(at.x, at.y);
      effects.burst(at.x, at.y, 12, ['heart', 'star'], ingredient(options.item).colors, 240);
    }
    fx.done = s.done;
    // A soft squish as it rolls, and a chime for each star.
    if (s.rolled - fx.squeakAt > 0.06) {
      fx.squeakAt = s.rolled;
      effects.sound.tone(mat ? 330 : 200, 0.12, { volume: 0.12, slideTo: mat ? 420 : 150 });
    }
    const stars = Math.floor(s.rolled * ROLL_STARS + 1e-9);
    if (stars > fx.stars && !s.done) effects.sound.chime([NOTE.E5, NOTE.G5], 0.08, 0.12);
    fx.stars = stars;
  },

  draw(view) {
    if (view.options.how === 'mat') drawMat(view);
    else drawDough(view);
    drawClock(view.g, view.state.timeLeft);
  },
};

export default roll;

// ---------------------------------------------------------------------------
// Drawing

/** A gentle clock in the corner: a pie that empties, as the circles steps have. */
function drawClock(g: G, timeLeft: number) {
  const cx = 640;
  const cy = 140;
  circle(g, cx, cy, 24);
  fillStroke(g, C.white, 3.5);
  g.beginPath();
  g.moveTo(cx, cy);
  g.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + (timeLeft / ROLL_TIME) * Math.PI * 2);
  g.closePath();
  g.fillStyle = C.mint;
  g.fill();
}

/** A wooden rolling pin lying across, centred on (x, y), with pink handles and a face. */
export function drawRollingPin(g: G, x: number, y: number, spin: number, happy: boolean) {
  const half = 115;
  shadow(g, x + 6, y + 24, half + 40, 9);
  for (const side of [-1, 1]) {
    rounded(g, x + side * (half + 6) - (side < 0 ? 46 : 0), y - 9, 46, 18, 9);
    fillStroke(g, vertical(g, y - 9, y + 9, [C.pink, C.hotPink]), 3);
  }
  rounded(g, x - half, y - 18, half * 2, 36, 16);
  fillStroke(g, vertical(g, y - 18, y + 18, [C.woodLight, C.wood, C.woodDark]), 3.5);
  // Grain lines that turn as it rolls.
  g.save();
  rounded(g, x - half, y - 18, half * 2, 36, 16);
  g.clip();
  g.strokeStyle = 'rgba(211, 141, 80, 0.45)';
  g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const ly = y + Math.sin(spin + i * 1.6) * 15;
    g.beginPath();
    g.moveTo(x - half + 10, ly);
    g.bezierCurveTo(x - 40, ly - 3, x + 40, ly + 3, x + half - 10, ly);
    g.stroke();
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.5)';
  rounded(g, x - half + 14, y - 13, half * 2 - 28, 6, 3);
  g.fill();
  g.restore();
  face(g, x, y + 2, 0.7, happy ? 'joy' : 'happy');
}

function drawDough(view: StepView<RollOptions, RollState, RollFx>) {
  const { g, t, state: s, options, pointer, taking } = view;
  const { x, y, rx, ry } = DOUGH;

  // A floury board under the dough.
  shadow(g, x + 8, y + ry + 30, rx + 22, 14);
  rounded(g, x - rx - 18, y - ry - 26, (rx + 18) * 2, (ry + 26) * 2, 30);
  fillStroke(g, vertical(g, y - ry - 26, y + ry + 26, [C.woodLight, C.wood]));
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let i = 0; i < 16; i++) {
    const a = i * 2.39;
    const r = 0.35 + ((i * 37) % 10) / 16;
    circle(g, x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r, 3 + (i % 3));
    g.fill();
  }

  // The dotted outline it rolls out to, glowing as the dough reaches it.
  const share = DOUGH_START + (1 - DOUGH_START) * clamp01(s.rolled);
  const close = clamp01((s.rolled - 0.7) / 0.3);
  if (close > 0) {
    g.strokeStyle = `rgba(255, 201, 60, ${0.25 + 0.35 * close + Math.sin(t * 6) * 0.08})`;
    g.lineWidth = 18;
    oval(g, x, y, rx, ry);
    g.stroke();
  }
  artOf(options.item, 'rollOut').draw(g, {
    x,
    y,
    rx: rx * share,
    ry: ry * share,
    spread: clamp01(s.rolled),
    t,
  });
  g.setLineDash([0.1, 13]);
  g.lineDashOffset = -t * 12;
  g.lineCap = 'round';
  g.lineWidth = 6;
  g.strokeStyle = C.hotPink;
  oval(g, x, y, rx, ry);
  g.stroke();
  g.setLineDash([]);
  g.lineDashOffset = 0;
  for (const [hx, hy] of [
    [x, y - ry],
    [x + rx, y],
    [x, y + ry],
    [x - rx, y],
  ]) {
    heartPath(g, hx, hy, 9 + Math.sin(t * 5 + hx) * 1.2);
    fillStroke(g, C.hotPink, 2.5);
  }

  // A sprinkle of flour behind the pin.
  if (taking && pointer.down) {
    g.fillStyle = K.flour;
    for (let i = 0; i < 6; i++) {
      const phase = (t * 1.5 + i / 6) % 1;
      g.globalAlpha = 1 - phase;
      circle(g, pointer.x - 100 + i * 40, pointer.y - 24 - phase * 22, 3);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // The pin: under the finger while held, rocking gently while it waits.
  if (taking && pointer.down) {
    const px = Math.min(x + 30, Math.max(x - 30, pointer.x));
    const py = Math.min(y + ry + 10, Math.max(y - ry - 10, pointer.y));
    drawRollingPin(g, px, py, py * 0.06, s.rolled > 0);
  } else if (!s.done) {
    const bob = Math.sin(t * 2.4) * 46;
    drawRollingPin(g, x, y + bob, bob * 0.06, false);
    if (taking) {
      drawUpDownArrows(g, t, x + 140, y);
      g.fillStyle = C.ink;
      emoji(g, '👆', x + 40, y + bob + 40, 42);
    }
  }
}

/** Gold arrows up and down beside the dough: roll it back and forth. */
function drawUpDownArrows(g: G, t: number, x: number, y: number) {
  const pulse = 1 + Math.sin(t * 5) * 0.12;
  g.strokeStyle = C.gold;
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const dir of [-1, 1]) {
    const tip = y + dir * 56 * pulse;
    g.beginPath();
    g.moveTo(x, y + dir * 12);
    g.lineTo(x, tip);
    g.moveTo(x - 13, tip - dir * 13);
    g.lineTo(x, tip);
    g.lineTo(x + 13, tip - dir * 13);
    g.stroke();
  }
}

function drawMat(view: StepView<RollOptions, RollState, RollFx>) {
  const { g, t, state: s, options, pointer, taking, round } = view;
  const art = artOf(options.item, 'rollUp');
  const { x0, x1, y0, y1 } = MAT;
  const rolled = clamp01(s.rolled);
  // The roll starts at the bottom edge and moves up, growing fatter.
  const r = 16 + 26 * rolled;
  const logY = y1 - r * 0.6 - rolled * (y1 - y0 - 70);
  const flatBottom = logY;

  shadow(g, 400, y1 + 14, (x1 - x0) / 2 + 20, 12);
  // The flat part of the mat: bamboo slats tied with string.
  if (flatBottom > y0 + 4) {
    rounded(g, x0, y0, x1 - x0, flatBottom - y0, 10);
    fillStroke(g, horizontal(g, x0, x1, [K.bambooDark, K.bamboo, K.bambooLight, K.bamboo]), 3.5);
    g.save();
    rounded(g, x0, y0, x1 - x0, flatBottom - y0, 10);
    g.clip();
    g.strokeStyle = 'rgba(91, 59, 79, 0.25)';
    g.lineWidth = 2;
    for (let sy = y0 + 13; sy < flatBottom; sy += 13) {
      g.beginPath();
      g.moveTo(x0, sy);
      g.lineTo(x1, sy);
      g.stroke();
    }
    // The sheet on top, cut off where it's rolled up.
    art.drawSheet(g, { x0: x0 + 22, y0: y0 + 16, x1: x1 - 22, y1: y1 - 16, t, round });
    g.restore();
    g.strokeStyle = C.hotPink;
    g.lineWidth = 2.5;
    for (const sx of [x0 + 10, x1 - 10]) {
      g.beginPath();
      g.moveTo(sx, y0 + 2);
      g.lineTo(sx, flatBottom);
      g.stroke();
    }
  }

  // The roll: the mat wrapped round it, the sushi showing at each end.
  const ex = x0 - 4;
  const ew = x1 - x0 + 8;
  shadow(g, 400, logY + r + 6, ew / 2 + 10, 7);
  rounded(g, ex, logY - r, ew, r * 2, r);
  fillStroke(g, vertical(g, logY - r, logY + r, [K.bambooLight, K.bamboo, K.bambooDark]), 3.5);
  g.save();
  rounded(g, ex, logY - r, ew, r * 2, r);
  g.clip();
  g.strokeStyle = 'rgba(91, 59, 79, 0.22)';
  g.lineWidth = 2;
  const turn = rolled * 30;
  for (let k = 0; k < 8; k++) {
    const ly = logY + Math.sin(turn + k * 0.8) * r;
    g.beginPath();
    g.moveTo(ex, ly);
    g.lineTo(ex + ew, ly);
    g.stroke();
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.45)';
  rounded(g, ex + r, logY - r * 0.7, ew - r * 2, r * 0.3, r * 0.15);
  g.fill();
  g.restore();
  for (const side of [ex, ex + ew]) {
    g.save();
    g.translate(side, logY);
    g.scale(0.45, 1);
    art.drawEnd(g, 0, 0, r * 0.95);
    g.restore();
  }
  if (rolled > 0.15) face(g, 400, logY + 2, 0.55 + rolled * 0.35, s.done ? 'joy' : 'happy');

  // Arrows up the mat, and a finger pushing up while nobody's holding.
  if (taking && !s.done) {
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.8 + i / 3) % 1;
      const ay = logY - 30 - phase * Math.max(40, logY - y0 - 40);
      g.globalAlpha = Math.sin(phase * Math.PI);
      g.strokeStyle = C.gold;
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(400 - 22, ay + 13);
      g.lineTo(400, ay);
      g.lineTo(400 + 22, ay + 13);
      g.stroke();
      g.globalAlpha = 1;
    }
    if (!pointer.down) {
      const phase = (t * 0.7) % 1;
      g.globalAlpha = Math.sin(phase * Math.PI);
      g.fillStyle = C.ink;
      emoji(g, '👆', 470, logY + 30 - phase * 110, 42);
      g.globalAlpha = 1;
    } else {
      // A sparkle under the finger while it pushes.
      starPath(g, pointer.x, pointer.y - 30, 9 + Math.sin(t * 9) * 2, t * 3);
      fillStroke(g, C.gold, 2.5);
    }
  }
}
