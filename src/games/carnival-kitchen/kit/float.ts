import { C, type G, rounded } from '../art';
import { STEP_POINTS, accuracy, finishStep, scoreAction } from './rules';
import type { StepBasics, Turn } from './types';

/**
 * Float-tap: things drift across the scene one at a time, left to right, and
 * you tap when each is over its target (eggs over the bowl, toppings over
 * their spots). A tap too far off is "Not yet!" and the thing keeps going; one
 * that floats off the right comes round again from the left. So nothing is
 * ever wasted.
 *
 * steps/crack.ts is the one to copy for one target; steps/top.ts for a
 * target per thing.
 */

/** Where each thing starts, just off the left of the scene. */
export const FLOAT_START = -40;
/** Past here (just off the right) it comes round again. */
export const FLOAT_END = 840;

export interface FloatState {
  /** Where the floating thing is. */
  x: number;
  /** Which thing is floating; the count once they're all done. */
  index: number;
  points: number;
  /** Each tap's share of its points, 0 to 1. */
  results: number[];
}

export interface FloatRules {
  /** Within this many pixels of the target scores in full. */
  perfect: number;
  /** Taps this far or more from the target are "Not yet!". */
  miss: number;
}

export function startFloat(): FloatState {
  return { x: FLOAT_START, index: 0, points: 0, results: [] };
}

/**
 * A tap, with the floating thing aiming for `target` (an x), one of `count`.
 * Returns the points scored, or null for a tap too far off: "Not yet!".
 */
export function tapFloat(
  turn: Turn<StepBasics, FloatState>,
  target: number,
  count: number,
  rules: FloatRules,
): number | null {
  const s = turn.state;
  const distance = Math.abs(s.x - target);
  if (distance >= rules.miss) return null;
  const share = accuracy(distance, rules.perfect, rules.miss);
  const points = scoreAction(turn.round, share, STEP_POINTS / count);
  s.results.push(share);
  s.points += points;
  s.index += 1;
  s.x = FLOAT_START;
  if (s.index === count) finishStep(turn.round, s.points);
  return points;
}

/** Floats the thing along at `speed` pixels a second, round again past the end. */
export function updateFloat(state: FloatState, speed: number, dt: number): void {
  state.x += speed * dt;
  if (state.x > FLOAT_END) state.x = FLOAT_START;
}

/** The stars under the cooking: one per thing. */
export function floatProgress(state: FloatState, count: number): [number, number] {
  return [count, state.results.length];
}

/** A glowing lane, `halfWidth` either side of x, from `top` down `height`. */
export function drawGlowLane(
  g: G,
  t: number,
  x: number,
  halfWidth: number,
  top: number,
  height: number,
) {
  g.fillStyle = `rgba(255, 201, 60, ${0.2 + Math.sin(t * 5) * 0.08})`;
  rounded(g, x - halfWidth, top, halfWidth * 2, height, 26);
  g.fill();
}

/** `count` gold arrows sliding down from `top` by `distance`, pointing at the target. */
export function drawFallArrows(
  g: G,
  t: number,
  x: number,
  top: number,
  distance: number,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const phase = (t * 0.9 + i / count) % 1;
    const y = top + phase * distance;
    g.globalAlpha = Math.sin(phase * Math.PI);
    g.strokeStyle = C.gold;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x - 12, y - 7);
    g.lineTo(x, y + 4);
    g.lineTo(x + 12, y - 7);
    g.stroke();
    g.globalAlpha = 1;
  }
}
