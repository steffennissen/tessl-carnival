import { C, type G, circle, emoji, fillStroke, font, rounded } from '../art';

/**
 * Words for young readers: splitting text into words, following along as
 * the voice reads (or timing it when the browser can't say where it is),
 * number words, and drawing text with the word being read highlighted.
 */

/** A word of a text, and where it starts in the text. */
export interface Word {
  word: string;
  start: number;
}

/** The words of `text`, split at spaces. */
export function wordsOf(text: string): Word[] {
  const words: Word[] = [];
  const pattern = /\S+/g;
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    words.push({ word: m[0], start: m.index });
  }
  return words;
}

/** Which word a character of the text is in: the last word starting at or before it. */
export function wordAtChar(words: readonly Word[], charIndex: number): number {
  let found = 0;
  words.forEach((w, i) => {
    if (w.start <= charIndex) found = i;
  });
  return found;
}

/** About how fast the voice reads, for following along without word events. */
export const WORDS_PER_SECOND = 2.3;

/**
 * The word being read `elapsed` seconds in, timed rather than told: `count`
 * once it's done.
 */
export function timedWord(count: number, elapsed: number): number {
  if (elapsed < 0) return -1;
  return Math.min(count, Math.floor(elapsed * WORDS_PER_SECOND));
}

const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
];

/** A number as a word, "three", up to twenty; digits after that. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** Splits `text` into lines no wider than `width` at `size`. */
export function wrapWords(g: G, text: string, width: number, size: number): string[] {
  g.font = font(size);
  const lines: string[] = [];
  for (const { word } of wordsOf(text)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && g.measureText(`${last} ${word}`).width <= width) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

/**
 * The biggest size from `size` down to `smallest` at which `text` fits in
 * `most` lines of `width`, and those lines.
 */
export function fitWords(
  g: G,
  text: string,
  width: number,
  size: number,
  most: number,
  smallest = 14,
): { lines: string[]; size: number } {
  for (let s = size; s > smallest; s -= 1) {
    const lines = wrapWords(g, text, width, s);
    if (lines.length <= most) return { lines, size: s };
  }
  return { lines: wrapWords(g, text, width, smallest), size: smallest };
}

export interface WordsLook {
  /** The word being read (counting from the first line's first word), or -1. */
  highlight: number;
  color: string;
  /** The words already read, if they should look different. */
  readColor?: string;
}

/**
 * Draws `lines` centred on x, the first line's middle at y, each `size`
 * tall and `gap` apart. The word being read sits on a butter-yellow
 * highlight, a little bigger, so a young reader can follow along.
 */
export function drawWords(
  g: G,
  lines: readonly string[],
  x: number,
  y: number,
  size: number,
  gap: number,
  look: WordsLook,
): void {
  g.font = font(size);
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  const space = g.measureText(' ').width;
  let index = 0;
  lines.forEach((line, row) => {
    const words = line.split(' ');
    const widths = words.map((w) => g.measureText(w).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let left = x - total / 2;
    const ly = y + row * gap;
    words.forEach((word, i) => {
      const w = widths[i];
      if (index === look.highlight) {
        rounded(g, left - 5, ly - size * 0.62, w + 10, size * 1.24, size * 0.3);
        fillStroke(g, C.butter, 2.5, C.gold);
        g.font = font(size);
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        g.fillStyle = C.hotPink;
      } else {
        const read = look.readColor && look.highlight >= 0 && index < look.highlight;
        g.fillStyle = read ? (look.readColor ?? look.color) : look.color;
      }
      g.fillText(word, left, ly);
      left += w + space;
      index += 1;
    });
  });
  g.textAlign = 'center';
}

/** A round speaker button: tap it to hear the words. It pulses while speaking. */
export function drawSpeaker(g: G, x: number, y: number, r: number, speaking: boolean, t: number) {
  const pulse = speaking ? 1 + Math.sin(t * 10) * 0.06 : 1;
  if (speaking) {
    g.strokeStyle = C.gold;
    g.lineWidth = 4;
    circle(g, x, y, r + 6 + Math.sin(t * 8) * 2);
    g.stroke();
  }
  circle(g, x, y, r * pulse);
  fillStroke(g, speaking ? C.butter : C.white, 3.5);
  g.fillStyle = C.ink;
  emoji(g, '🔊', x, y + 1, r * 1.05);
}

const SPOKEN_PARTS: Record<string, [one: string, more: string]> = {
  '¼': ['one-quarter', 'a-quarter'],
  '½': ['one-half', 'a-half'],
  '¾': ['three-quarters', 'three-quarters'],
  '⅓': ['one-third', 'a-third'],
  '⅔': ['two-thirds', 'two-thirds'],
};

/**
 * Text as the voice should say it: "1½ cups" is "one-and-a-half cups", "¼"
 * "one-quarter". Each fraction stays one word (joined with hyphens), so the
 * words line up with the text's for lighting them up as they're read.
 */
export function speakable(text: string): string {
  return text.replace(/(\d*)([¼½¾⅓⅔])/g, (_, whole: string, glyph: string) => {
    const [one, more] = SPOKEN_PARTS[glyph];
    return whole ? `${numberWord(Number(whole))}-and-${more}` : one;
  });
}

/** Whether (x, y) is within `r` (plus a little slop for fingers) of (cx, cy). */
export function inCircle(cx: number, cy: number, r: number, x: number, y: number, slop = 8) {
  return Math.hypot(x - cx, y - cy) <= r + slop;
}

/** Whether (x, y) is in the box, or within `slop` of its edges. */
export function inBox(
  b: { x: number; y: number; w: number; h: number },
  x: number,
  y: number,
  slop = 8,
): boolean {
  return x >= b.x - slop && x <= b.x + b.w + slop && y >= b.y - slop && y <= b.y + b.h + slop;
}
