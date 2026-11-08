import {
  C,
  type G,
  circle,
  clamp01,
  emoji,
  face,
  fillStroke,
  horizontal,
  oval,
  rounded,
  shadow,
  vertical,
} from '../art';
import { artOf, ingredient } from '../ingredients';
import { finishStep, showGrade, type Step, type StepBasics, type Turn } from '../kit';

/**
 * Grate: hold the cheese and rub it left and right across the grater. Each
 * swipe that travels far enough is a stroke, and a fluffy pile of cheese
 * grows on the plate below. 8 strokes in 20 seconds scores 50 for finishing
 * plus up to 50 for time left; running out of time scores up to 50 for the
 * strokes made. Like circles, it shows a grade but leaves the combo alone.
 */

export interface GrateOptions extends StepBasics {
  kind: 'grate';
  /** What's grated: an ingredient with `grate` art, such as 'cheddar'. */
  item: string;
  /** How many strokes. 8 if left out. */
  strokes?: number;
}

/** A block of something you grate (cheese), and what comes off it. */
export interface GrateArt {
  /**
   * Draws the block with the middle of its bottom edge on the origin, about
   * 110 wide and 70 tall when whole, with a face. `left` is how much of it
   * is left (0 to 1): it gets shorter as you grate.
   */
  drawBlock(g: G, left: number, rubbing: boolean): void;
  /** The shreds' colours: light, then main. */
  shreds: [string, string];
}

declare module '../kit/types' {
  interface StepKinds {
    grate: GrateOptions;
  }
  interface IngredientArt {
    grate: GrateArt;
  }
}

// ---------------------------------------------------------------------------
// Swipes: shared with steps/toss.ts

/** Counting swipes left and right of a finger. */
export interface SwipeState {
  /** Where this swipe started, and how far it has got. */
  from: number;
  peak: number;
  /** Which way it's going: 0 until it has moved a little. */
  dir: -1 | 0 | 1;
  /** Whether this swipe has counted yet. */
  counted: boolean;
}

/** A swipe has to go this far, in scene units, to count. */
export const SWIPE_TRAVEL = 60;
/** Wobbling back by less than this doesn't turn a swipe round. */
export const SWIPE_SLACK = 10;

export function startSwipe(x = 0): SwipeState {
  return { from: x, peak: x, dir: 0, counted: false };
}

/**
 * Follows the finger to x. Returns true when the swipe it's on has just
 * gone far enough to count. Each swipe counts once, whichever way it goes,
 * and turning round starts the next one; small wobbles are ignored.
 */
export function swipeTo(s: SwipeState, x: number, travel = SWIPE_TRAVEL): boolean {
  if (s.dir === 0) {
    if (Math.abs(x - s.from) > SWIPE_SLACK) {
      s.dir = x > s.from ? 1 : -1;
      s.peak = x;
    }
  } else if ((x - s.peak) * s.dir > 0) {
    s.peak = x;
  } else if ((s.peak - x) * s.dir > SWIPE_SLACK) {
    // Turned round: the next swipe starts where this one got to.
    s.from = s.peak;
    s.peak = x;
    s.dir = s.dir === 1 ? -1 : 1;
    s.counted = false;
  }
  if (!s.counted && Math.abs(s.peak - s.from) >= travel) {
    s.counted = true;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// The rules

export const GRATE_STROKES = 8;
/** Seconds to make the strokes in. Generous: going fast is never needed. */
export const GRATE_TIME = 20;
/** Where the grater is, and how far the block slides along it. */
export const GRATER = { x: 400, y: 214, left: 262, right: 538 } as const;
export const BLOCK_MIN = 330;
export const BLOCK_MAX = 470;
/** Where the plate sits on the counter, and the pile on it. */
const PLATE = { x: 400, y: 352 } as const;

export interface GrateState {
  /** The block's middle along the grater. */
  x: number;
  /** The block's offset from the finger, so it doesn't jump when held. */
  grip: number;
  swipe: SwipeState;
  holding: boolean;
  strokes: number;
  target: number;
  timeLeft: number;
  done: boolean;
}

export function startGrate(target = GRATE_STROKES): GrateState {
  return {
    x: GRATER.x,
    grip: 0,
    swipe: startSwipe(),
    holding: false,
    strokes: 0,
    target,
    timeLeft: GRATE_TIME,
    done: false,
  };
}

function finishGrate(turn: Turn<GrateOptions, GrateState>, points: number) {
  turn.state.done = true;
  turn.state.holding = false;
  showGrade(turn.round, points);
  finishStep(turn.round, points);
}

/** Grabs the block, wherever the finger is. */
export function pressGrate(turn: Turn<GrateOptions, GrateState>, x: number) {
  const s = turn.state;
  if (s.done) return;
  s.holding = true;
  s.grip = s.x - x;
  s.swipe = startSwipe(x);
}

/** Slides the block with the finger, counting strokes. */
export function moveGrate(turn: Turn<GrateOptions, GrateState>, x: number) {
  const s = turn.state;
  if (s.done || !s.holding) return;
  s.x = Math.min(BLOCK_MAX, Math.max(BLOCK_MIN, x + s.grip));
  // Strokes count on the finger, not the block, so a big swipe past the
  // end of the grater still counts.
  if (swipeTo(s.swipe, x)) {
    s.strokes += 1;
    if (s.strokes >= s.target) {
      // Done in time: 50 for finishing, plus up to 50 for time left.
      finishGrate(turn, 50 + 50 * (s.timeLeft / GRATE_TIME));
    }
  }
}

export function updateGrate(turn: Turn<GrateOptions, GrateState>, dt: number) {
  const s = turn.state;
  if (s.done) return;
  s.timeLeft = Math.max(0, s.timeLeft - dt);
  // Out of time: up to 50 for the strokes made.
  if (s.timeLeft === 0) finishGrate(turn, 50 * (s.strokes / s.target));
}

// ---------------------------------------------------------------------------
// Drawing

/** A tiny hash, so the pile's shreds sit in the same places every frame. */
function hash(i: number): number {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * A fluffy pile of shreds on a plate, its base centred on (x, y). `amount`
 * is 0 to 1; `size` scales it.
 */
export function drawShredPile(
  g: G,
  x: number,
  y: number,
  amount: number,
  shreds: [string, string],
  size = 1,
) {
  const a = clamp01(amount);
  if (a <= 0) return;
  const w = (36 + 64 * a) * size;
  const h = (10 + 52 * a) * size;
  // A soft mound underneath, so the pile looks full.
  g.beginPath();
  g.moveTo(x - w, y);
  g.quadraticCurveTo(x - w * 0.5, y - h * 1.25, x, y - h);
  g.quadraticCurveTo(x + w * 0.5, y - h * 1.25, x + w, y);
  g.closePath();
  fillStroke(g, vertical(g, y - h, y, [shreds[0], shreds[1]]), 2.5);
  // Curly shreds all over it.
  g.lineCap = 'round';
  const count = Math.floor(16 + 60 * a);
  for (let i = 0; i < count; i++) {
    const u = (hash(i) * 2 - 1) * 0.8;
    const top = 1 - (u * u) / 0.64;
    const sx = x + u * w * 0.9;
    const sy = y - 6 * size - hash(i + 99) * h * top * 0.85;
    const rot = hash(i + 7) * Math.PI;
    const len = (8 + hash(i + 3) * 6) * size;
    // Each shred is a little outlined curl, like the rest of the kitchen.
    g.beginPath();
    g.moveTo(sx - Math.cos(rot) * len * 0.5, sy - Math.sin(rot) * len * 0.5);
    g.quadraticCurveTo(
      sx + Math.sin(rot) * 4,
      sy - Math.cos(rot) * 4,
      sx + Math.cos(rot) * len * 0.5,
      sy + Math.sin(rot) * len * 0.5,
    );
    g.strokeStyle = 'rgba(91, 59, 79, 0.55)';
    g.lineWidth = 5.5 * size;
    g.stroke();
    g.strokeStyle = i % 2 ? shreds[0] : shreds[1];
    g.lineWidth = 3.2 * size;
    g.stroke();
  }
  // A shine on top.
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  oval(g, x - w * 0.2, y - h * 0.75, w * 0.18, h * 0.08 + 1, -0.3);
  g.fill();
}

/** The grater: a wide steel paddle with a pink handle, standing on two legs over the plate. */
function drawGrater(g: G, t: number, rubbing: boolean) {
  const { y, left, right } = GRATER;
  // Legs down to the plate.
  for (const lx of [left + 22, right - 22]) {
    rounded(g, lx - 6, y + 10, 12, PLATE.y - y - 14, 6);
    fillStroke(g, vertical(g, y, PLATE.y, [C.steel, C.steelDark]), 3);
    oval(g, lx, PLATE.y - 4, 12, 5);
    fillStroke(g, C.hotPink, 2.5);
  }
  // The handle, then the paddle.
  rounded(g, right - 6, y - 12, 92, 26, 13);
  fillStroke(g, horizontal(g, right, right + 86, [C.hotPink, C.pink]));
  circle(g, right + 70, y + 1, 5);
  fillStroke(g, C.wallBottom, 2.5);
  rounded(g, left, y - 12, right - left, 30, 14);
  fillStroke(g, vertical(g, y - 12, y + 18, [C.white, C.steel, C.steelDark]));
  // Rows of little holes, each with a bright lip.
  for (let row = 0; row < 2; row++) {
    for (let k = 0; k < 15; k++) {
      const hx = left + 22 + k * 16.5 + (row ? 8 : 0);
      const hy = y - 3 + row * 11;
      oval(g, hx, hy, 4.5, 2.6);
      g.fillStyle = C.steelDark;
      g.fill();
      g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.ellipse(hx, hy + 1, 4.5, 2.6, 0, 0.2, Math.PI - 0.2);
      g.stroke();
    }
  }
  // A glint that runs along it while you rub.
  if (rubbing) {
    const gx = left + 20 + ((t * 300) % (right - left - 40));
    g.fillStyle = 'rgba(255, 255, 255, 0.7)';
    oval(g, gx, y - 6, 16, 3);
    g.fill();
  }
}

interface GrateFx {
  strokes: number;
  done: boolean;
  /** Seconds since the last stroke, for a little jiggle. */
  age: number;
  prevX: number;
}

const grate: Step<GrateOptions, GrateState, GrateFx> = {
  kind: 'grate',
  uses: (o) => [[o.item, 'grate']],
  start: (o) => startGrate(o.strokes ?? GRATE_STROKES),

  title: (o) => `Grate the ${ingredient(o.item).label}!`,
  hint: () => ['Hold the cheese and', 'rub it left and right!'],
  icon: (o) => ingredient(o.item).icon,
  progress: ({ state }) => [state.target, Math.min(state.target, state.strokes)],

  press: (turn, x) => pressGrate(turn, x),
  move: (turn, x) => moveGrate(turn, x),
  release: (turn) => {
    turn.state.holding = false;
  },
  update: (turn, dt) => updateGrate(turn, dt),

  fx: () => ({ strokes: 0, done: false, age: 9, prevX: GRATER.x }),

  observe({ state: s, options, fx, dt, effects }) {
    const shreds = artOf(options.item, 'grate').shreds;
    if (s.strokes > fx.strokes) {
      fx.age = 0;
      // A soft scritch, a little higher each stroke.
      effects.sound.hiss(0.12, { volume: 0.22, from: 2600 + s.strokes * 120, to: 5200 });
      effects.sound.tone(300 + s.strokes * 30, 0.08, { type: 'triangle', volume: 0.08 });
    }
    fx.strokes = s.strokes;
    fx.age += dt;
    if (s.done && !fx.done) {
      effects.sound.ding();
      effects.celebrate(PLATE.x, PLATE.y - 60);
      effects.burst(PLATE.x, PLATE.y - 40, 10, ['heart', 'star'], shreds, 220);
    }
    fx.done = s.done;
    // Shreds fall from under the block while it moves.
    const moving = Math.abs(s.x - fx.prevX) > 0.5;
    fx.prevX = s.x;
    if (s.holding && moving && !s.done) {
      for (let i = 0; i < 2; i++) {
        effects.add({
          x: s.x + (Math.random() - 0.5) * 80,
          y: GRATER.y + 16,
          vx: (Math.random() - 0.5) * 40,
          vy: 40 + Math.random() * 40,
          gravity: 420,
          life: 0.38,
          max: 0.38,
          size: 9,
          color: Math.random() < 0.5 ? shreds[0] : shreds[1],
          shape: 'confetti',
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 8,
        });
      }
    }
  },

  draw({ g, t, state: s, options, fx, taking }) {
    const art = artOf(options.item, 'grate');
    const amount = s.done ? 1 : s.strokes / s.target;

    // The plate on the counter, and the pile growing on it.
    shadow(g, PLATE.x + 6, PLATE.y + 14, 168, 14);
    oval(g, PLATE.x, PLATE.y, 168, 30);
    fillStroke(g, vertical(g, PLATE.y - 30, PLATE.y + 30, [C.white, C.skyLight]));
    oval(g, PLATE.x, PLATE.y - 2, 128, 19);
    g.strokeStyle = C.sky;
    g.lineWidth = 3;
    g.stroke();
    drawShredPile(g, PLATE.x, PLATE.y + 4, amount, art.shreds);
    if (amount >= 1) face(g, PLATE.x, PLATE.y - 24, 0.8, 'joy');

    drawGrater(g, t, s.holding);

    // The block on top, squashing a little each stroke.
    const jiggle = fx.age < 0.25 ? Math.sin((fx.age / 0.25) * Math.PI) : 0;
    g.save();
    g.translate(s.x, GRATER.y - 12);
    g.scale(1 + jiggle * 0.05, 1 - jiggle * 0.06);
    if (!s.done) art.drawBlock(g, 1 - 0.6 * amount, s.holding);
    g.restore();

    // While nobody's holding: a finger sliding left and right.
    if (taking && !s.holding && !s.done) {
      const fxX = GRATER.x + Math.sin(t * 3) * 70;
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      g.setLineDash([2, 12]);
      g.beginPath();
      g.moveTo(GRATER.x - 90, 132);
      g.lineTo(GRATER.x + 90, 132);
      g.stroke();
      g.setLineDash([]);
      for (const side of [-1, 1]) {
        g.fillStyle = C.white;
        g.beginPath();
        g.moveTo(GRATER.x + side * 104, 132);
        g.lineTo(GRATER.x + side * 90, 122);
        g.lineTo(GRATER.x + side * 90, 142);
        g.closePath();
        g.fill();
      }
      g.fillStyle = C.ink;
      emoji(g, '👆', fxX, 150, 40);
    }

    // A gentle clock: a pie that empties.
    const cx = 640;
    const cy = 170;
    circle(g, cx, cy, 24);
    fillStroke(g, C.white, 3.5);
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + (s.timeLeft / GRATE_TIME) * Math.PI * 2);
    g.closePath();
    g.fillStyle = C.mint;
    g.fill();
  },
};

export default grate;
