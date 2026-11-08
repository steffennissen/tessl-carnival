import { C, type G, fillStroke, heartPath, horizontal, oval, rounded, starPath } from '../art';
import { STEP_POINTS, accuracy, bounce, finishStep, scoreAction } from './rules';
import type { StepBasics, Turn } from './types';

/**
 * Needle: a heart swings back and forth along a gauge, and you tap when it's
 * in the gold (flipping the pancakes). Each go has its own gold spot and
 * speed. A tap far from the gold is "Not yet!" and uses nothing up.
 *
 * steps/flip.ts is the one to copy.
 */

export interface NeedleState {
  /** Where the heart is on the gauge, 0 to 1. */
  needle: number;
  dir: 1 | -1;
  /** Which go is next; the count once they're all done. */
  index: number;
  points: number;
  /** Each tap's share of its points, 0 to 1. */
  results: number[];
}

export interface NeedleRules {
  /** Within this of the gold's middle scores in full. */
  perfect: number;
  /** Taps this far or more from it are "Not yet!". */
  zone: number;
}

export function startNeedle(): NeedleState {
  return { needle: 0, dir: 1, index: 0, points: 0, results: [] };
}

/**
 * A tap, with the gold's middle at `target`, one of `count` goes. Returns
 * the points scored, or null for a tap far from the gold: "Not yet!".
 */
export function tapNeedle(
  turn: Turn<StepBasics, NeedleState>,
  target: number,
  count: number,
  rules: NeedleRules,
): number | null {
  const s = turn.state;
  const distance = Math.abs(s.needle - target);
  if (distance >= rules.zone) return null;
  const share = accuracy(distance, rules.perfect, rules.zone);
  const points = scoreAction(turn.round, share, STEP_POINTS / count);
  s.results.push(share);
  s.points += points;
  s.index += 1;
  s.needle = 0;
  s.dir = 1;
  if (s.index === count) finishStep(turn.round, s.points);
  return points;
}

/** Swings the heart at `speed` gauges a second, bouncing off the ends. */
export function updateNeedle(state: NeedleState, speed: number, dt: number): void {
  const next = bounce(state.needle, state.dir, speed * dt, 0, 1);
  state.needle = next.value;
  state.dir = next.dir;
}

/**
 * The gauge along the bottom of the scene (x 192 to 608, y 381 to 429): a
 * rainbow bar, the gold spot round `target` with a star, and the heart.
 */
export function drawGauge(g: G, t: number, needle: number, target: number) {
  const x0 = 200;
  const width = 400;
  const gy = 405;
  rounded(g, x0 - 8, gy - 24, width + 16, 48, 24);
  fillStroke(g, C.white);
  rounded(g, x0, gy - 15, width, 30, 15);
  g.fillStyle = horizontal(g, x0, x0 + width, [C.sky, C.mint, C.butter, C.pink, C.hotPink]);
  g.fill();
  rounded(g, x0 + (target - 0.1) * width, gy - 20, 0.2 * width, 40, 14);
  g.fillStyle = `rgba(255, 201, 60, ${0.75 + Math.sin(t * 6) * 0.15})`;
  g.fill();
  g.lineWidth = 3.5;
  g.strokeStyle = C.ink;
  g.stroke();
  starPath(g, x0 + target * width, gy - 34, 12, Math.sin(t * 3) * 0.3);
  fillStroke(g, C.gold, 3);
  const hx = x0 + needle * width;
  heartPath(g, hx, gy + 2, 16);
  fillStroke(g, C.hotPink, 3.5);
  g.fillStyle = 'rgba(255, 255, 255, 0.8)';
  oval(g, hx - 7, gy - 6, 4, 3, -0.5);
  g.fill();
}
