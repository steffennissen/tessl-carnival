import { C, CONFETTI, type G, clamp01, stickerText } from '../art';
import type { Effects, KitchenState, Pointer } from '../kit';
import type { Shape } from '../layout';
import { NOTE } from '../sound';
import { chaosOf } from './index';
import { CHAOS_BONUS, type ChaosRun } from './rules';

/**
 * Showing the round's surprise: drawing it over the cooking, its sounds,
 * the "+5" when it's done, and telling render.ts when Chef Bunny should
 * react. Nothing here changes the round.
 */

/** Seconds a line Chef Bunny wants to say waits for the voice to be free. */
export const LINE_WAIT = 3;
/** Seconds the "+5" floats up after a surprise. */
export const BONUS_SHOWN = 1.4;

/** What render.ts keeps between frames for the round's surprise. */
export interface SurpriseShow {
  run: ChaosRun | null;
  /** The run's phase last frame. */
  phase: ChaosRun['phase'] | null;
  /** The event's effect memory, from its `fx`. */
  fx: unknown;
  /** A line waiting to be said when the voice is free, and how long it has waited. */
  line: { text: string; age: number } | null;
  /** Seconds since it finished, for the "+5", or -1. */
  endAge: number;
}

export function createShow(): SurpriseShow {
  return { run: null, phase: null, fx: undefined, line: null, endAge: -1 };
}

/** Something Chef Bunny reacts to: a surprise starting or ending, and her line. */
export interface SurpriseNews {
  kind: 'start' | 'end';
  /** Said out loud (when the voice is free). */
  line: string;
}

/** What drawing a surprise needs from the renderer. */
export interface ShowContext {
  g: G;
  t: number;
  dt: number;
  pointer: Pointer;
  shape: Shape;
  screen: { x: number; y: number; w: number; h: number };
  effects: Effects;
}

/**
 * Watches and draws the round's surprise for one frame, over the cooking,
 * in scene units. Returns news for Chef Bunny when it starts or ends.
 */
export function showSurprise(
  show: SurpriseShow,
  round: KitchenState,
  context: ShowContext,
): SurpriseNews | null {
  const run = round.chaos ?? null;
  if (run !== show.run) Object.assign(show, createShow(), { run });
  if (!run) return null;
  const event = chaosOf(run.id);
  const { effects, g } = context;
  let news: SurpriseNews | null = null;

  if (show.line) {
    show.line.age += context.dt;
    if (show.line.age > LINE_WAIT) show.line = null;
  }

  if (run.phase === 'on' && show.phase !== 'on') {
    show.fx = event.fx?.();
    show.line = { text: event.says.start, age: 0 };
    news = { kind: 'start', line: event.says.start };
    // A little "boing!" to say something's happening.
    effects.sound.tone(NOTE.C5, 0.18, { type: 'triangle', volume: 0.14, slideTo: NOTE.C6 });
    effects.sound.tone(NOTE.G5, 0.2, { type: 'triangle', volume: 0.12, delay: 0.16 });
  }
  if (run.phase === 'over' && show.phase === 'on') {
    show.endAge = 0;
    show.line = { text: event.says.end, age: 0 };
    news = { kind: 'end', line: event.says.end };
    if (run.paid > 0) {
      effects.sound.chime([NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7], 0.08, 0.1);
      effects.burst(400, 200, 18, ['star', 'heart', 'star', 'dot'], CONFETTI, 260);
    }
  }
  show.phase = run.phase;

  if (run.phase === 'on') {
    const view = {
      ...context,
      round,
      state: run.state,
      age: run.age,
    };
    event.observe?.(view, show.fx);
    event.draw(view, show.fx);
  }

  if (show.endAge >= 0 && show.endAge < BONUS_SHOWN) {
    show.endAge += context.dt;
    if (run.paid > 0) {
      const p = clamp01(show.endAge / BONUS_SHOWN);
      g.save();
      g.globalAlpha = 1 - p * p;
      stickerText(g, `+${CHAOS_BONUS}`, 400, 200 - p * 60, 54, C.gold);
      g.restore();
    }
  }
  return news;
}

/** The angle to tilt the cooking by this frame (a wobbly table), or null. */
export function surpriseTilt(
  round: KitchenState,
  t: number,
): { angle: number; x: number; y: number } | null {
  const run = round.chaos;
  if (!run || run.phase !== 'on') return null;
  return chaosOf(run.id).tilt?.(run.state, t) ?? null;
}
