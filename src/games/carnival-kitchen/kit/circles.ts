import { C, type G, circle, emoji, fillStroke, oval, rounded, starPath, vertical } from '../art';
import { finishStep, showGrade } from './rules';
import type { StepBasics, StepView, Turn } from './types';

/**
 * Circles: hold and draw circles round something (stirring the soup,
 * mixing the batter, spreading the sauce). 3 turns in 15 seconds scores 50
 * for finishing plus up to 50 for time left; running out of time scores up
 * to 50 for the turns made. Circles show a grade but leave the combo alone.
 *
 * A circles step spreads `circleRules` into itself and draws its own scene
 * round CIRCLE, then calls `drawCircleControls` on top. steps/stir.ts is the
 * one to copy.
 */

/** A pot or bowl seen from above, for stirring or mixing in. */
export interface VesselArt {
  /** Draws it centred on (x, y), `radius` to its outer edge, empty. */
  draw(g: G, x: number, y: number, radius: number): void;
  /** How far in from the outer edge what's inside starts. */
  inset: number;
}

/** What's inside a pot or bowl while it's stirred or mixed. */
export interface StirredArt {
  /**
   * Draws it filling a circle of radius r round (x, y). `swirl` turns with
   * the spoon; `done` goes from 0 to 1 as the turns are made.
   */
  draw(
    g: G,
    look: { x: number; y: number; r: number; swirl: number; done: number; t: number },
  ): void;
  /** The colour of the spoon's bowl. */
  spoon: string;
}

declare module './types' {
  interface IngredientArt {
    vessel: VesselArt;
    stirred: StirredArt;
  }
}

/** Where the circles go: the middle of the scene, above the counter. */
export const CIRCLE = { x: 400, y: 275, radius: 140 } as const;
/** How far outside the circle the spoon still counts, so small fingers can be a bit off. */
export const CIRCLE_REACH = 90;
export const CIRCLE_TURNS = 3;
/** Seconds to make the turns in. */
export const CIRCLE_TIME = 15;

export interface CircleState {
  /** How far the spoon has gone round, either way. Wiggling back and forth cancels out. */
  radians: number;
  lastAngle: number | null;
  timeLeft: number;
  /** Set when the step finishes, so `observe` can celebrate. */
  done: boolean;
}

/** What `circleRules.observe` remembers between frames. */
export interface CircleFx {
  bloopAt: number;
  done: boolean;
}

export function startCircles(): CircleState {
  return { radians: 0, lastAngle: null, timeLeft: CIRCLE_TIME, done: false };
}

/** Full turns so far, in either direction. */
export function circleTurns(state: CircleState): number {
  return Math.abs(state.radians) / (Math.PI * 2);
}

function finishCircles(turn: Turn<StepBasics, CircleState>, points: number): void {
  turn.state.done = true;
  showGrade(turn.round, points);
  finishStep(turn.round, points);
}

/** Moves the spoon to (x, y) while the pointer is held down. */
export function moveCircles(turn: Turn<StepBasics, CircleState>, x: number, y: number): void {
  const s = turn.state;
  const distance = Math.hypot(x - CIRCLE.x, y - CIRCLE.y);
  if (distance < 12 || distance > CIRCLE.radius + CIRCLE_REACH) {
    s.lastAngle = null;
    return;
  }
  const angle = Math.atan2(y - CIRCLE.y, x - CIRCLE.x);
  if (s.lastAngle !== null) {
    let delta = angle - s.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    s.radians += delta;
  }
  s.lastAngle = angle;
  if (circleTurns(s) >= CIRCLE_TURNS) {
    // Done in time: 50 for finishing, plus up to 50 for speed.
    finishCircles(turn, 50 + 50 * (s.timeLeft / CIRCLE_TIME));
  }
}

/**
 * The rules of a circles step, ready to spread into a Step:
 * `{ ...circleRules, kind: 'stir', ... }`.
 */
export const circleRules = {
  start: (): CircleState => startCircles(),
  press: (turn: Turn<StepBasics, CircleState>, x: number, y: number) => moveCircles(turn, x, y),
  move: (turn: Turn<StepBasics, CircleState>, x: number, y: number) => moveCircles(turn, x, y),
  /** Lifting the spoon starts a fresh stroke. */
  release: (turn: Turn<StepBasics, CircleState>) => {
    turn.state.lastAngle = null;
  },
  update: (turn: Turn<StepBasics, CircleState>, dt: number) => {
    const s = turn.state;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    // Out of time: up to 50 for the turns you managed.
    if (s.timeLeft === 0) finishCircles(turn, 50 * (circleTurns(s) / CIRCLE_TURNS));
  },
  progress: (turn: Turn<StepBasics, CircleState>): [number, number] => [
    CIRCLE_TURNS,
    Math.min(CIRCLE_TURNS, Math.floor(circleTurns(turn.state))),
  ],
  fx: (): CircleFx => ({ bloopAt: 0, done: false }),
  /** A bloop every so often while stirring, and sparkles when it's done. */
  observe: (view: StepView<StepBasics, CircleState, CircleFx>) => {
    const { state: s, fx, effects } = view;
    if (s.done && !fx.done) effects.celebrate(CIRCLE.x, CIRCLE.y);
    fx.done = s.done;
    if (Math.abs(s.radians - fx.bloopAt) > 0.7) {
      fx.bloopAt = s.radians;
      effects.sound.bloop();
    }
  },
};

/**
 * The whole scene for stirring or mixing: the pot or bowl, what's in it,
 * and the controls on top.
 */
export function drawStirring(
  view: StepView<StepBasics, CircleState>,
  vessel: VesselArt,
  contents: StirredArt,
) {
  const { x, y, radius } = CIRCLE;
  vessel.draw(view.g, x, y, radius);
  contents.draw(view.g, {
    x,
    y,
    r: radius - vessel.inset,
    swirl: view.state.radians * 0.85,
    done: Math.min(1, circleTurns(view.state) / CIRCLE_TURNS),
    t: view.t,
  });
  drawCircleControls(view, contents.spoon);
}

/**
 * The ring of stars round the circle, the spoon (or a circling finger while
 * nobody's holding), and the clock. `spoon` colours the spoon's bowl.
 */
export function drawCircleControls(view: StepView<StepBasics, CircleState>, spoon: string) {
  const { g, t, state: s, pointer } = view;
  const { x: px, y: py, radius: R } = CIRCLE;

  // A ring that fills up, with a star for every full turn.
  const turns = circleTurns(s);
  g.lineCap = 'round';
  g.lineWidth = 10;
  g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  circle(g, px, py, R + 16);
  g.stroke();
  if (turns > 0) {
    g.strokeStyle = C.gold;
    g.beginPath();
    g.arc(
      px,
      py,
      R + 16,
      -Math.PI / 2,
      -Math.PI / 2 + Math.min(1, turns / CIRCLE_TURNS) * Math.PI * 2,
    );
    g.stroke();
  }
  for (let k = 1; k <= CIRCLE_TURNS; k++) {
    const a = -Math.PI / 2 + (k / CIRCLE_TURNS) * Math.PI * 2;
    const lit = turns >= k;
    starPath(g, px + Math.cos(a) * (R + 16), py + Math.sin(a) * (R + 16), lit ? 15 : 12, 0);
    fillStroke(g, lit ? C.gold : C.white, 3);
  }

  if (view.taking && pointer.down) {
    const dir = Math.atan2(pointer.y - py, pointer.x - px);
    g.save();
    g.translate(pointer.x, pointer.y);
    g.rotate(dir);
    rounded(g, 12, -7, 150, 14, 7);
    fillStroke(g, C.wood, 3.5);
    oval(g, 0, 0, 22, 16);
    fillStroke(g, vertical(g, -16, 16, [C.woodLight, spoon]), 3.5);
    g.restore();
  } else if (view.taking) {
    const a = t * 2.2;
    g.setLineDash([2, 12]);
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    circle(g, px, py, 80);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = C.ink;
    emoji(g, '👆', px + Math.cos(a) * 80, py + Math.sin(a) * 80 + 14, 40);
  }

  // A gentle clock: a pie that empties.
  const cx = 640;
  const cy = 140;
  circle(g, cx, cy, 24);
  fillStroke(g, C.white, 3.5);
  g.beginPath();
  g.moveTo(cx, cy);
  g.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + (s.timeLeft / CIRCLE_TIME) * Math.PI * 2);
  g.closePath();
  g.fillStyle = C.mint;
  g.fill();
}
