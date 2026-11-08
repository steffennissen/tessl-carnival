import { C, type G, fillStroke, rounded, starPath, vertical } from '../art';
import { STEP_POINTS, accuracy, finishStep, scoreAction } from './rules';
import type { StepBasics, Turn } from './types';

/**
 * Hold-meter: hold to fill a meter, and let go when it reaches the star
 * (shaking salt, pouring flour and milk, baking the pizza). Each let-go
 * scores by how close the meter was to its star; a meter that fills right up
 * lets go by itself. Letting go too soon is "Not yet!" and uses nothing up.
 *
 * steps/season.ts is the one to copy for several pours; steps/bake.ts for
 * one, where the meter keeps its level between holds.
 */

/** Where a meter's star goes, at random between these. */
export const TARGET_LOW = 0.4;
export const TARGET_HIGH = 0.8;

export interface HoldState {
  /** Where the star is for each let-go, 0 to 1. */
  targets: number[];
  /** How full the meter is, 0 to 1. */
  level: number;
  holding: boolean;
  /** Which let-go is next; `targets.length` once they're all done. */
  index: number;
  points: number;
}

export interface HoldRules {
  /** Meter per second while held. */
  speed: number;
  /** Within this of the star scores in full. */
  perfect: number;
  /** This far or more from the star scores nothing. */
  zone: number;
  /** Whether letting go at `level` is too soon: "Not yet!", and nothing is used up. */
  tooSoon(level: number, target: number): boolean;
  /**
   * Whether the meter keeps its level when you let go (the oven keeps its
   * heat), or empties for the next pour.
   */
  keep: boolean;
}

/** Pouring and shaking: meter per second while held. */
export const POUR_SPEED = 0.28;
/** Within this of the star scores in full. */
export const POUR_PERFECT = 0.06;
/** Off the star by this much or more scores nothing. */
export const POUR_ZONE = 0.35;
/** A pour shorter than this was just a tap, so it doesn't use up a pour. */
export const MIN_POUR = 0.1;

/** The rules for pouring and shaking: a quick tap is "Not yet!", and each pour starts empty. */
export const POUR_RULES: HoldRules = {
  speed: POUR_SPEED,
  perfect: POUR_PERFECT,
  zone: POUR_ZONE,
  tooSoon: (level) => level < MIN_POUR,
  keep: false,
};

/**
 * How baked something golden is, from 0 (raw) to 1 (crispy): where the
 * oven's star is, and what baked art draws as just right.
 */
export const GOLDEN = 0.7;

export function startHold(targets: number[]): HoldState {
  return { targets, level: 0, holding: false, index: 0, points: 0 };
}

export function pressHold(turn: Turn<StepBasics, HoldState>): void {
  turn.state.holding = true;
}

function letGo(turn: Turn<StepBasics, HoldState>, rules: HoldRules): number {
  const s = turn.state;
  const share = accuracy(Math.abs(s.level - s.targets[s.index]), rules.perfect, rules.zone);
  const points = scoreAction(turn.round, share, STEP_POINTS / s.targets.length);
  s.points += points;
  s.index += 1;
  if (!rules.keep) s.level = 0;
  s.holding = false;
  if (s.index === s.targets.length) finishStep(turn.round, s.points);
  return points;
}

/**
 * Lets go. Returns the points scored, null if nothing was held, or 'not yet'
 * for a let-go that came too soon.
 */
export function releaseHold(
  turn: Turn<StepBasics, HoldState>,
  rules: HoldRules,
): number | 'not yet' | null {
  const s = turn.state;
  if (!s.holding) return null;
  if (rules.tooSoon(s.level, s.targets[s.index])) {
    s.holding = false;
    if (!rules.keep) s.level = 0;
    return 'not yet';
  }
  return letGo(turn, rules);
}

/** Fills the meter while held; a full meter lets go by itself. */
export function updateHold(turn: Turn<StepBasics, HoldState>, rules: HoldRules, dt: number) {
  const s = turn.state;
  if (!s.holding) return;
  s.level = Math.min(1, s.level + rules.speed * dt);
  if (s.level === 1) letGo(turn, rules);
}

/** The stars under the cooking: one per let-go. */
export function holdProgress(turn: Turn<StepBasics, HoldState>): [number, number] {
  return [turn.state.targets.length, turn.state.index];
}

/**
 * The tall meter at the right of the scene (x 588 to 634, y 120 to 390),
 * with a star at `target`. `fill` is its gradient, top to bottom.
 */
export function drawMeter(g: G, t: number, level: number, target: number, fill: string[]) {
  const mx = 588;
  const top = 126;
  const height = 258;
  rounded(g, mx, top - 6, 46, height + 12, 23);
  fillStroke(g, C.white);
  g.save();
  rounded(g, mx + 6, top, 34, height, 17);
  g.clip();
  const ty = top + height * (1 - target);
  g.fillStyle = 'rgba(255, 201, 60, 0.4)';
  g.fillRect(mx, ty - height * 0.08, 46, height * 0.16);
  const fillTop = top + height * (1 - level);
  g.fillStyle = vertical(g, top, top + height, fill);
  g.fillRect(mx, fillTop, 46, height);
  g.restore();
  g.setLineDash([6, 6]);
  g.strokeStyle = C.gold;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(mx + 4, ty);
  g.lineTo(mx + 42, ty);
  g.stroke();
  g.setLineDash([]);
  starPath(g, mx - 22, ty, 17 + Math.sin(t * 5) * 1.5, Math.sin(t * 2) * 0.2);
  fillStroke(g, C.gold, 3.5);
}
