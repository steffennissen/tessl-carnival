import { C, type G, circle, fillStroke, font } from '../art';
import type { KitchenState, Level, StepBasics } from './types';
import { numberWord } from './words';

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
  // Level 2's 5:xx starts stop at 5:30 too: 7 choices then, 12 in the other hours.
  const fives = hour === 17 ? 7 : 12;
  const minute =
    level === 1 ? (random() < 0.5 ? 0 : 30) : 5 * (Math.floor(random() * fives) % fives);
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
 * A clock's layers that never change: drawn once into a small canvas of
 * their own and stamped each frame, instead of 60 tick strokes and 12
 * numbers every frame. Kept by size and pixel density.
 */
const layers = new Map<string, HTMLCanvasElement>();
/** How often each layer has been asked for, so a clock that's growing isn't cached at every size. */
const asked = new Map<string, number>();
const MOST_LAYERS = 16;

/**
 * Draws `paint` (centred on 0, 0, within `reach` of it) at (x, y), from a
 * cached canvas when the browser has one and `g` is only scaled and moved.
 */
function stamp(g: G, key: string, x: number, y: number, reach: number, paint: (g: G) => void) {
  const m = typeof g.getTransform === 'function' ? g.getTransform() : undefined;
  const scale = m ? Math.hypot(m.a, m.b) : 0;
  const plain = !!m && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.a - m.d) < 1e-6;
  const id = `${key}:${Math.round(reach * scale)}`;
  const seen = (asked.get(id) ?? 0) + 1;
  asked.set(id, seen);
  if (asked.size > 200) asked.clear();
  let layer = layers.get(id);
  if (!layer && plain && scale > 0 && seen >= 3 && typeof document !== 'undefined') {
    const size = Math.ceil(reach * 2 * scale);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const lg = canvas.getContext('2d');
    if (lg) {
      lg.scale(size / (reach * 2), size / (reach * 2));
      lg.translate(reach, reach);
      paint(lg);
      if (layers.size >= MOST_LAYERS) layers.clear();
      layers.set(id, canvas);
      layer = canvas;
    }
  }
  if (layer && plain) {
    g.drawImage(layer, x - reach, y - reach, reach * 2, reach * 2);
    return;
  }
  g.save();
  g.translate(x, y);
  paint(g);
  g.restore();
}

/** The face: a pink rim, white inside, and a tick for every minute (longer every 5). */
function drawFace(g: G, r: number) {
  circle(g, 0, 0, r);
  fillStroke(g, C.hotPink, Math.max(2, r * 0.06));
  circle(g, 0, 0, r * 0.88);
  fillStroke(g, C.white, Math.max(1.5, r * 0.035));
  g.strokeStyle = C.ink;
  g.lineCap = 'round';
  for (const five of [false, true]) {
    // All the ticks of one size in one stroke.
    g.lineWidth = Math.max(1, r * (five ? 0.04 : 0.018));
    g.beginPath();
    for (let i = 0; i < 60; i++) {
      if ((i % 5 === 0) !== five) continue;
      const a = (i / 60) * Math.PI * 2;
      const inner = r * (five ? 0.7 : 0.76);
      g.moveTo(Math.sin(a) * inner, -Math.cos(a) * inner);
      g.lineTo(Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.82);
    }
    g.stroke();
  }
}

/** The numbers 1 to 12, each with a white edge so a hand passing under it never hides it. */
function drawNumbers(g: G, r: number) {
  g.font = font(Math.max(8, r * 0.2));
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(2, r * 0.06);
  g.strokeStyle = C.white;
  g.fillStyle = C.ink;
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const nx = Math.sin(a) * r * 0.55;
    const ny = -Math.cos(a) * r * 0.55 + r * 0.02;
    g.strokeText(String(h), nx, ny);
    g.fillText(String(h), nx, ny);
  }
}

/**
 * An analog clock centred on (x, y), radius r, showing `time`: a white face,
 * the numbers 1 to 12, a tick for every minute (longer every 5), a short fat
 * hour hand and a long minute hand. The hands are thick, and the numbers go
 * on top of them so they always show. Any size: everything scales with r.
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
  // The face and the numbers sit a little past r, for the rim's stroke.
  const reach = r * 1.06 + 2;
  stamp(g, `face:${r.toFixed(2)}`, x, y, reach, (lg) => drawFace(lg, r));

  g.save();
  g.translate(x, y);
  const { hour, minute } = handAngles(time);
  const hand = (angle: number, length: number, width: number, color: string, lit: boolean) => {
    g.lineCap = 'round';
    if (lit) {
      g.strokeStyle = `rgba(255, 201, 60, ${0.55 + Math.sin(t * 6) * 0.25})`;
      g.lineWidth = width + r * 0.12;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.sin(angle) * length, -Math.cos(angle) * length);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(-Math.sin(angle) * r * 0.1, Math.cos(angle) * r * 0.1);
    g.lineTo(Math.sin(angle) * length, -Math.cos(angle) * length);
    // A thin white edge first, so the hand stands out on the ticks.
    g.strokeStyle = C.white;
    g.lineWidth = width + Math.max(1.5, r * 0.03);
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  };
  hand(hour, r * 0.45, Math.max(3.5, r * 0.13), C.ink, glow === 'hour');
  hand(minute, r * 0.74, Math.max(2.5, r * 0.085), C.purple, glow === 'minute');
  g.restore();

  if (numbers) stamp(g, `numbers:${r.toFixed(2)}`, x, y, reach, (lg) => drawNumbers(lg, r));

  g.save();
  g.translate(x, y);
  circle(g, 0, 0, Math.max(2.5, r * 0.08));
  fillStroke(g, C.hotPink, Math.max(1, r * 0.025));
  g.restore();
}

/**
 * `time` with its minute hand turned to `angle`, snapped, the way a real
 * geared clock does it: the hour hand goes along, so turning the minute hand
 * past 12 moves on to the next hour (or back to the one before).
 */
export function turnMinuteHand(time: number, angle: number, snap = 5): number {
  const at = Math.floor(time / 60) * 60 + minuteFromAngle(angle, snap);
  return [at - 60, at, at + 60].reduce((best, t) =>
    Math.abs(t - time) < Math.abs(best - time) ? t : best,
  );
}

/** Whether two times look the same on a clock's face (4:30 am and pm alike). */
export function sameClockTime(a: number, b: number): boolean {
  return (((a - b) % 720) + 720) % 720 === 0;
}

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

/** A time said out loud the way people say it: "four o'clock", "four oh five", "four thirty-five". */
export function sayTime(time: number): string {
  const hour = numberWord(clockHour(time));
  const minute = ((time % 60) + 60) % 60;
  if (minute === 0) return `${hour} o'clock`;
  if (minute < 10) return `${hour} oh ${numberWord(minute)}`;
  if (minute <= 20) return `${hour} ${numberWord(minute)}`;
  const tens = TENS[Math.floor(minute / 10)];
  return `${hour} ${minute % 10 ? `${tens}-${numberWord(minute % 10)}` : tens}`;
}

/**
 * A time on the hour, half or quarter in words: "4 o'clock", "quarter past
 * 4", "half past 4", "quarter to 5" (with `spoken`, "four" for "4"). Null
 * for any other time.
 */
export function quarterWords(time: number, spoken = false): string | null {
  const minute = ((time % 60) + 60) % 60;
  const name = (t: number) => (spoken ? numberWord(clockHour(t)) : String(clockHour(t)));
  if (minute === 0) return `${name(time)} o'clock`;
  if (minute === 15) return `quarter past ${name(time)}`;
  if (minute === 30) return `half past ${name(time)}`;
  if (minute === 45) return `quarter to ${name(time + 60)}`;
  return null;
}
