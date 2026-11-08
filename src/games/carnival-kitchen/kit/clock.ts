import { C, type G, circle, fillStroke, font } from '../art';
import type { KitchenState, Level, StepBasics } from './types';

/**
 * Kitchen time: the wall clock. Each round starts at a real afternoon time
 * and each step takes real minutes (chop 5, stir 10, bake 15...), so the
 * clock on the wall moves on as you cook, and the end card says when you
 * started and finished. A time is minutes since midnight (16:35 is 995),
 * shown the way a clock shows it: "4:35".
 *
 * The maths for a clock you can set by dragging its hands (angles to times,
 * snapping to 5 minutes) is here too, as plain functions.
 */

/** Minutes a step takes when its recipe doesn't say, by kind. Learning steps take none. */
export const DEFAULT_MINUTES: Record<string, number> = {
  chop: 5,
  crack: 2,
  pour: 2,
  mix: 5,
  stir: 10,
  season: 1,
  sauce: 3,
  top: 5,
  bake: 15,
  flip: 5,
  grate: 3,
  toss: 5,
  blend: 2,
  scoop: 3,
  stack: 3,
  roll: 5,
};

/** The minutes a recipe step takes: its own `minutes`, or its kind's usual. */
export function stepMinutes(options: StepBasics): number {
  return options.minutes ?? DEFAULT_MINUTES[options.kind] ?? 0;
}

/**
 * When a round starts: an afternoon time, 2:00 to 5:30. Level 1 starts on
 * the hour or half hour, Level 2 on any 5 minutes.
 */
export function startTime(level: Level, random: () => number): number {
  const hour = 14 + (Math.floor(random() * 4) % 4);
  const minute = level === 1 ? (random() < 0.5 ? 0 : 30) : 5 * (Math.floor(random() * 12) % 12);
  return hour * 60 + minute;
}

/** The time when step `index` of `steps` starts, if the first starts at `start`. */
export function timeAtStep(steps: readonly StepBasics[], start: number, index: number): number {
  return steps.slice(0, index).reduce((time, step) => time + stepMinutes(step), start);
}

/** The kitchen clock now: the round's start plus every finished step's minutes. */
export function roundTime(round: KitchenState): number {
  const done = round.phase === 'over' ? round.steps.length : round.stepIndex;
  return timeAtStep(
    round.steps.map((run) => run.options),
    round.start,
    done,
  );
}

/** The hour on a clock's face, 1 to 12. */
export function clockHour(time: number): number {
  return (((Math.floor(time / 60) % 12) + 11) % 12) + 1;
}

/** A time as a clock shows it: "4:05". */
export function clockText(time: number): string {
  const minute = ((time % 60) + 60) % 60;
  return `${clockHour(time)}:${String(minute).padStart(2, '0')}`;
}

/**
 * Where the hands point, in radians clockwise from 12. The hour hand moves
 * on a little as the minutes go by, as on a real clock.
 */
export function handAngles(time: number): { hour: number; minute: number } {
  const minute = ((time % 60) + 60) % 60;
  const hours = (time / 60) % 12;
  return { hour: (hours / 12) * Math.PI * 2, minute: (minute / 60) * Math.PI * 2 };
}

/** The angle from a clock's middle (cx, cy) to (x, y), clockwise from 12, 0 to 2π. */
export function angleAt(cx: number, cy: number, x: number, y: number): number {
  const a = Math.atan2(x - cx, cy - y);
  return a < 0 ? a + Math.PI * 2 : a;
}

/** The minute a minute hand at `angle` points to, snapped to `snap` minutes (0 to 55). */
export function minuteFromAngle(angle: number, snap = 5): number {
  const minute = Math.round(((angle / (Math.PI * 2)) * 60) / snap) * snap;
  return ((minute % 60) + 60) % 60;
}

/** The hour (1 to 12) an hour hand at `angle` points nearest to. */
export function hourFromAngle(angle: number): number {
  const hour = Math.round((angle / (Math.PI * 2)) * 12) % 12;
  return hour === 0 ? 12 : hour;
}

/** `time` with its minute hand dragged to `angle`, snapped; the hour stays. */
export function withMinuteHand(time: number, angle: number, snap = 5): number {
  return Math.floor(time / 60) * 60 + minuteFromAngle(angle, snap);
}

/**
 * `time` with its hour hand dragged to `angle`; the minutes stay. The hand
 * sits partway past the hour as the minutes go by, so that's allowed for.
 * Keeps the afternoon (or morning) the time was in.
 */
export function withHourHand(time: number, angle: number): number {
  const minute = ((time % 60) + 60) % 60;
  const hourAngle = angle - (minute / 60) * (Math.PI / 6);
  const hour = hourFromAngle(hourAngle < 0 ? hourAngle + Math.PI * 2 : hourAngle) % 12;
  const half = Math.floor(time / 720) * 12;
  return (half + hour) * 60 + minute;
}

export interface ClockLook {
  /** Seconds, for a gentle glow on a highlighted hand. */
  t?: number;
  /** A hand to make stand out (the one being dragged, or asked about). */
  glow?: 'hour' | 'minute' | null;
  /** Leave the numbers off, for a tiny clock. */
  numbers?: boolean;
}

/**
 * An analog clock centred on (x, y), radius r, showing `time`: a white face,
 * the numbers 1 to 12, a tick for every minute (longer every 5), a short fat
 * hour hand and a long minute hand. Any size: everything scales with r.
 */
export function drawClock(
  g: G,
  x: number,
  y: number,
  r: number,
  time: number,
  look: ClockLook = {},
) {
  const { t = 0, glow = null, numbers = true } = look;
  g.save();
  g.translate(x, y);
  circle(g, 0, 0, r);
  fillStroke(g, C.hotPink, Math.max(2, r * 0.06));
  circle(g, 0, 0, r * 0.88);
  fillStroke(g, C.white, Math.max(1.5, r * 0.035));

  // Minute ticks.
  g.strokeStyle = C.ink;
  g.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const five = i % 5 === 0;
    const outer = r * 0.82;
    const inner = r * (five ? 0.7 : 0.76);
    g.lineWidth = Math.max(1, r * (five ? 0.04 : 0.018));
    g.beginPath();
    g.moveTo(Math.sin(a) * inner, -Math.cos(a) * inner);
    g.lineTo(Math.sin(a) * outer, -Math.cos(a) * outer);
    g.stroke();
  }
  if (numbers) {
    g.font = font(Math.max(8, r * 0.2));
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = C.ink;
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      g.fillText(String(h), Math.sin(a) * r * 0.55, -Math.cos(a) * r * 0.55 + r * 0.02);
    }
  }

  const { hour, minute } = handAngles(time);
  const hand = (angle: number, length: number, width: number, color: string, lit: boolean) => {
    if (lit) {
      g.strokeStyle = `rgba(255, 201, 60, ${0.55 + Math.sin(t * 6) * 0.25})`;
      g.lineWidth = width + r * 0.12;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.sin(angle) * length, -Math.cos(angle) * length);
      g.stroke();
    }
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(-Math.sin(angle) * r * 0.1, Math.cos(angle) * r * 0.1);
    g.lineTo(Math.sin(angle) * length, -Math.cos(angle) * length);
    g.stroke();
  };
  hand(hour, r * 0.45, Math.max(2.5, r * 0.09), C.ink, glow === 'hour');
  hand(minute, r * 0.74, Math.max(1.8, r * 0.055), C.purple, glow === 'minute');
  circle(g, 0, 0, Math.max(2, r * 0.07));
  fillStroke(g, C.hotPink, Math.max(1, r * 0.025));
  g.restore();
}
