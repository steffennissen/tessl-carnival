import { C, type G, fillStroke, rounded, starPath, stickerText, vertical } from '../art';
import { drawAmount } from './hold';

/**
 * Real amounts: "1½ cups", "¼ teaspoon". Reading them, writing them, and the
 * measuring cup the pour step fills, with a labelled line for every quarter
 * or half cup and the star exactly on the recipe's amount. Plain maths, plus
 * one drawing function.
 */

export type Unit = 'cup' | 'tablespoon' | 'teaspoon';

/** An amount: `value` of `unit`, such as 1.5 cups. */
export interface Amount {
  value: number;
  unit: Unit;
}

/** The kid-friendly fractions, as recipes write them. */
const GLYPHS: [string, number][] = [
  ['¼', 0.25],
  ['½', 0.5],
  ['¾', 0.75],
  ['⅓', 1 / 3],
  ['⅔', 2 / 3],
];

const UNITS: [RegExp, Unit][] = [
  [/^cups?$/, 'cup'],
  [/^(tablespoons?|tbsp)$/, 'tablespoon'],
  [/^(teaspoons?|tsp)$/, 'teaspoon'],
];

/** Reads "1½ cups", "½ cup" or "2 teaspoons"; null for anything else. */
export function parseAmount(text: string | undefined): Amount | null {
  const m = /^\s*(\d*)\s*([¼½¾⅓⅔]?)\s+([a-z]+)\s*$/.exec(text ?? '');
  if (!m || (!m[1] && !m[2])) return null;
  const unit = UNITS.find(([pattern]) => pattern.test(m[3]))?.[1];
  if (!unit) return null;
  const part = GLYPHS.find(([glyph]) => glyph === m[2])?.[1] ?? 0;
  return { value: (m[1] ? Number(m[1]) : 0) + part, unit };
}

/** A number the way a recipe writes it: 1.5 is "1½", 0.25 "¼", 2 "2". */
export function fractionText(value: number): string {
  const whole = Math.floor(value + 1e-6);
  const part = value - whole;
  if (part < 1e-6) return String(whole);
  const glyph = GLYPHS.find(([, v]) => Math.abs(v - part) < 1e-3)?.[0];
  if (!glyph) return String(Math.round(value * 100) / 100);
  return whole ? `${whole}${glyph}` : glyph;
}

/** An amount the way a recipe writes it: "1½ cups", "½ cup", "1 teaspoon". */
export function amountText({ value, unit }: Amount): string {
  return `${fractionText(value)} ${unit}${value > 1 ? 's' : ''}`;
}

/** The cup's lines, as a measuring cup or jug has them. */
export interface Scale {
  /** What the cup holds up to its top line, in the amount's unit. */
  capacity: number;
  /** A line at each of these, from the bottom: every ¼ in a small cup, every ½ in a jug. */
  marks: number[];
}

/** The sizes of measuring cup, smallest first: ½ cup, 1 cup, then jugs. */
const CUPS = [0.5, 1, 2, 3, 4];

/** The fullest a cup is filled to: the star always has room above it. */
export const MEASURE_FULLEST = 0.8;

/**
 * The measuring cup for `value`: the smallest one it fills to no more than
 * `fullest` (MEASURE_FULLEST), so the star sits between 0.4 and 0.8 of the
 * way up, like the stars of other meters. `least` is the smallest cup to use
 * (questions use a 1 cup measure even for ¼ cup).
 */
export function measureScale(value: number, least = 0, fullest = MEASURE_FULLEST): Scale {
  const capacity =
    CUPS.find((c) => c >= least && value / c <= fullest + 1e-9) ?? Math.ceil(value / fullest);
  const step = capacity <= 1 ? 0.25 : capacity <= 3 ? 0.5 : 1;
  const marks: number[] = [];
  for (let v = step; v <= capacity + 1e-9; v += step) marks.push(Math.round(v * 100) / 100);
  return { capacity, marks };
}

/** Where `value`'s line is on its measuring cup, 0 (bottom) to 1 (top line): the star. */
export function measureTarget(value: number): number {
  return value / measureScale(value).capacity;
}

/** The unit as the cup says it, short: "cups", "tsp", "tbsp". */
export function unitShort(unit: Unit): string {
  return unit === 'cup' ? 'cups' : unit === 'teaspoon' ? 'tsp' : 'tbsp';
}

export interface CupLook {
  /** The glass: left x, the top line's y, width, and the height from the bottom to the top line. */
  x: number;
  top: number;
  w: number;
  h: number;
  scale: Scale;
  unit: Unit;
  /** How full it is, as a share of the capacity (0 to 1). */
  level: number;
  /** The fill's gradient, top to bottom. */
  fill: string[];
  /** Where the star goes (a share of the capacity), or null for none. */
  target: number | null;
  /** Which lines get a number: all of them, or only whole cups (and ½ in a small cup). */
  labels?: 'all' | 'some';
  /** The real amount on a label under the cup ("1½ cups"), if any. */
  label?: string;
  /** Seconds, for the star's twinkle. */
  t: number;
  /** Bigger numbers on the lines, for a small cup on a phone. */
  big?: boolean;
}

/** How much a colour stands out from white glass: its WCAG contrast ratio with white (1 to 21). */
export function contrastWithWhite(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 1;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

/**
 * The least contrast with white a measuring cup's fill colours may have
 * (`CUP_FILL_SURFACE` for its first, at the surface), so ¼ cup of milk is
 * plain to see on a phone.
 */
export const CUP_FILL_LEAST = 1.4;
export const CUP_FILL_SURFACE = 1.8;

/** Whether a line gets its number on a cup labelled 'some'. */
export function labelled(value: number, scale: Scale, labels: 'all' | 'some' = 'all'): boolean {
  if (labels === 'all') return true;
  return Number.isInteger(value) || (scale.capacity <= 1 && value === 0.5);
}

/**
 * A see-through measuring cup with a handle, a line for each mark and its
 * number ("¼", "½", "1½"), filled to `level`, with a soft gold band and a
 * star at the target line: what the pour step's meter looks like.
 */
export function drawMeasuringCup(g: G, look: CupLook): void {
  const { x, top, w, h, scale, unit, level, fill, target, t } = look;
  const bottom = top + h;
  const rim = top - Math.max(30, h * 0.15);
  const yOf = (share: number) => bottom - h * share;
  // The handle, behind the glass.
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(x + w - 6, rim + h * 0.12);
  g.bezierCurveTo(x + w + 30, rim + h * 0.12, x + w + 30, rim + h * 0.55, x + w - 6, rim + h * 0.6);
  g.stroke();
  g.strokeStyle = C.skyLight;
  g.lineWidth = 7;
  g.stroke();
  // The glass, with a little spout at the top left.
  g.beginPath();
  g.moveTo(x - 10, rim - 6);
  g.lineTo(x + w, rim);
  g.lineTo(x + w - 3, bottom + 6);
  g.quadraticCurveTo(x + w - 4, bottom + 14, x + w - 14, bottom + 14);
  g.lineTo(x + 14, bottom + 14);
  g.quadraticCurveTo(x + 4, bottom + 14, x + 3, bottom + 6);
  g.lineTo(x, rim + 10);
  g.closePath();
  fillStroke(g, 'rgba(255, 255, 255, 0.82)', 4);
  // What's in it, and the gold band round the target, clipped to the glass.
  g.save();
  rounded(g, x + 5, rim + 4, w - 10, bottom + 10 - rim - 4, 10);
  g.clip();
  if (target !== null) {
    g.fillStyle = 'rgba(255, 201, 60, 0.4)';
    g.fillRect(x, yOf(target) - h * 0.08, w, h * 0.16);
  }
  if (level > 0) {
    // The gradient runs from the surface down, so even ¼ cup shows its
    // strongest colour, with a dark line along the top of what's in it.
    const surface = Math.min(yOf(level), bottom + 10);
    g.fillStyle = vertical(g, surface, Math.max(surface + 24, bottom + 10), fill);
    g.fillRect(x, surface, w, bottom + 14 - surface);
    g.strokeStyle = C.ink;
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(x, surface);
    g.lineTo(x + w, surface);
    g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, surface + 4);
    g.lineTo(x + w, surface + 4);
    g.stroke();
  }
  g.restore();
  // The lines, each with its number: long for whole cups, short between.
  // `big` (on a phone) makes the numbers bigger, so they're still easy to read.
  const size = look.big
    ? Math.max(20, Math.min(24, w * 0.42))
    : Math.max(13, Math.min(18, w * 0.3));
  for (const v of scale.marks) {
    const y = yOf(v / scale.capacity);
    const whole = Number.isInteger(v);
    g.strokeStyle = C.ink;
    g.lineWidth = whole ? 3.5 : 2.5;
    g.beginPath();
    g.moveTo(x + 4, y);
    g.lineTo(x + 4 + w * (whole ? 0.38 : 0.26), y);
    g.stroke();
    if (labelled(v, scale, look.labels)) {
      stickerText(
        g,
        fractionText(v),
        x + w * 0.72,
        y,
        size,
        C.ink,
        'center',
        w * (look.big ? 0.6 : 0.5),
      );
    }
  }
  // The unit, small, on the glass between the rim and the top line.
  stickerText(
    g,
    unitShort(unit),
    x + w / 2,
    rim + 12,
    look.big ? 18 : 13,
    C.purple,
    'center',
    w - 4,
  );
  if (target !== null) {
    const ty = yOf(target);
    g.setLineDash([6, 6]);
    g.strokeStyle = C.gold;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + 2, ty);
    g.lineTo(x + w * 0.46, ty);
    g.stroke();
    g.setLineDash([]);
    starPath(g, x - 22, ty, 17 + Math.sin(t * 5) * 1.5, Math.sin(t * 2) * 0.2);
    fillStroke(g, C.gold, 3.5);
  }
  if (look.label) drawAmount(g, look.label, x + w / 2, bottom + 36);
}

/** The pour meter's place: the same place as the other meters (x 582 to 640, y 120 to 390). */
export const CUP_METER = { x: 584, top: 148, w: 54, h: 224 };
