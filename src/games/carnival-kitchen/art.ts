import { theme } from '../../carnival';

/**
 * The kitchen's drawing kit: its palette, shapes, faces and text. render.ts
 * draws the kitchen with these, and every step, ingredient and dish draws
 * with them too.
 *
 * This game is made for young cooks, so it goes beyond the carnival theme
 * for a softer, brighter look.
 */

export const { width: W, height: H } = theme.canvas;

// The kitchen's own palette. This game is made for young cooks, so it goes
// beyond the carnival theme for a softer, brighter look.
export const C = {
  ink: '#5b3b4f',
  white: '#ffffff',
  cream: '#fff7ec',
  shadow: 'rgba(91, 59, 79, 0.16)',
  wallTop: '#ffe9f4',
  wallBottom: '#ffd6ea',
  counterTop: '#fff3e2',
  counterEdge: '#f6d9b8',
  cabinet: '#aee8d6',
  cabinetLight: '#d2f6ea',
  pink: '#ff9cc9',
  hotPink: '#ff5fa2',
  lavender: '#cdb2ff',
  lavenderLight: '#e9ddff',
  purple: '#9b6cf3',
  mint: '#8fe3c8',
  sky: '#9fd8ff',
  skyLight: '#dff2ff',
  skyDark: '#5fb2ec',
  butter: '#ffe58a',
  gold: '#ffc93c',
  carrot: '#ff9a3d',
  carrotLight: '#ffc58a',
  carrotDark: '#ee7a1c',
  leaf: '#6fd67a',
  leafDark: '#40ad57',
  wood: '#efb37a',
  woodLight: '#f9d6ad',
  woodDark: '#d38d50',
  steel: '#e9eef6',
  steelDark: '#aab6c9',
  soup: '#ff9a68',
  soupLight: '#ffc59b',
  soupDark: '#f27a48',
  stew: '#de9160',
  stewLight: '#f2b585',
  pancake: '#f7c46c',
  pancakeLight: '#ffe1a3',
  pancakeDark: '#db9743',
  pancakeDone: '#c9873f',
  yolk: '#ffc53d',
  yolkLight: '#ffe58f',
  berry: '#ff4f6e',
  pan: '#7b679a',
  panLight: '#9a86b8',
  panDark: '#55446f',
  dough: '#ffe6b0',
  doughLight: '#fff3d6',
  crustGold: '#f2b457',
  crustBrown: '#b8723a',
  sauce: '#ee4b3b',
  sauceLight: '#ff7a5c',
  sauceDark: '#c93a2e',
  cheese: '#fff1b8',
  cheeseGold: '#ffd25e',
  cheeseBrown: '#e09a3c',
  pepperoni: '#e3434f',
  pepperoniDark: '#b92f3c',
  mushroom: '#f1dfc7',
  mushroomDark: '#c9a988',
  pineapple: '#ffd84a',
  olive: '#4f3a57',
  pepper: '#4fc66a',
  glass: '#5b3b4f',
  glassLight: '#86607a',
  ember: '#ff8a3d',
  oven: '#ffe3ef',
  starEdge: '#d9c8ef',
};

/**
 * More colours for one file, such as a new ingredient's: the one sanctioned
 * place for colour codes outside this file. Pick soft, bright colours that sit
 * with C, and reuse C where one fits.
 *
 *     const K = palette({ shell: '#f0dcc6' });
 */
export function palette<T extends Record<string, string>>(colors: T): Readonly<T> {
  return colors;
}
export const CONFETTI = [C.hotPink, C.gold, C.mint, C.sky, C.lavender, C.pink, C.butter];

export const FONT =
  '"Arial Rounded MT Bold", "Chalkboard SE", "Comic Sans MS", "Trebuchet MS", sans-serif';
export const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
export const font = (size: number) => `bold ${size}px ${FONT}`;

export type G = CanvasRenderingContext2D;

// ---------------------------------------------------------------------------
// Small drawing helpers

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function fillStroke(g: G, fill: string | CanvasGradient, line = 4, stroke: string = C.ink) {
  g.fillStyle = fill;
  g.fill();
  if (line > 0) {
    g.lineWidth = line;
    g.strokeStyle = stroke;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.stroke();
  }
}

export function circle(g: G, x: number, y: number, r: number) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
}

export function oval(g: G, x: number, y: number, rx: number, ry: number, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

export function rounded(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

export function starPath(g: G, x: number, y: number, r: number, rot = 0) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.5;
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    g.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  g.closePath();
}

export function heartPath(g: G, x: number, y: number, s: number) {
  g.beginPath();
  g.moveTo(x, y + s);
  g.bezierCurveTo(x - s * 1.7, y - s * 0.2, x - s * 0.7, y - s * 1.4, x, y - s * 0.45);
  g.bezierCurveTo(x + s * 0.7, y - s * 1.4, x + s * 1.7, y - s * 0.2, x, y + s);
  g.closePath();
}

/** An egg: a taller top half and a rounder bottom half. */
export function eggPath(g: G, x: number, y: number, w: number, h: number) {
  g.beginPath();
  g.ellipse(x, y, w, h * 1.15, 0, Math.PI, Math.PI * 2);
  g.ellipse(x, y, w, h * 0.85, 0, 0, Math.PI);
  g.closePath();
}

/** A face's mood: smiling, eyes closed with joy, or surprised. */
export type Mood = 'happy' | 'joy' | 'wow';

/** A kawaii face: eyes with a glint, rosy cheeks and a smile. */
export function face(g: G, x: number, y: number, s: number, mood: Mood) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = 'rgba(255, 110, 160, 0.45)';
  oval(g, -15, 6, 6, 3.6);
  g.fill();
  oval(g, 15, 6, 6, 3.6);
  g.fill();
  g.fillStyle = C.ink;
  g.strokeStyle = C.ink;
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  if (mood === 'joy') {
    for (const ex of [-9, 9]) {
      g.beginPath();
      g.arc(ex, 2, 4, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    }
  } else {
    for (const ex of [-9, 9]) {
      circle(g, ex, 0, mood === 'wow' ? 4.4 : 3.8);
      g.fill();
    }
    g.fillStyle = C.white;
    for (const ex of [-9, 9]) {
      circle(g, ex + 1.2, -1.4, 1.4);
      g.fill();
    }
  }
  g.fillStyle = C.ink;
  if (mood === 'wow') {
    oval(g, 0, 8, 3, 3.6);
    g.fill();
  } else {
    g.beginPath();
    g.arc(0, 4.5, 4.5, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
  }
  g.restore();
}

/** Chunky sticker text: an ink edge, a white outline and a bright fill. */
export function stickerText(
  g: G,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string | CanvasGradient,
  align: CanvasTextAlign = 'center',
  maxWidth = Infinity,
) {
  g.font = font(size);
  // Too wide for its space (a long dish name): shrink it to fit.
  const wide = g.measureText(text).width + size * 0.3;
  if (wide > maxWidth) {
    size *= maxWidth / wide;
    g.font = font(size);
  }
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.3;
  g.strokeStyle = C.ink;
  g.strokeText(text, x, y);
  g.lineWidth = size * 0.17;
  g.strokeStyle = C.white;
  g.strokeText(text, x, y);
  g.fillStyle = fill;
  g.fillText(text, x, y);
}

export function plainText(
  g: G,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
) {
  g.font = font(size);
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, x, y);
}

export function emoji(g: G, text: string, x: number, y: number, size: number) {
  g.font = `${size}px ${EMOJI}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, x, y);
}

export function vertical(g: G, y0: number, y1: number, stops: string[]) {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
  return grad;
}

export function horizontal(g: G, x0: number, x1: number, stops: string[]) {
  const grad = g.createLinearGradient(x0, 0, x1, 0);
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
  return grad;
}

export function shadow(g: G, x: number, y: number, rx: number, ry: number) {
  g.fillStyle = C.shadow;
  oval(g, x, y, rx, ry);
  g.fill();
}

// ---------------------------------------------------------------------------
// Colours

/** Reads '#rrggbb', or the 'rgb(r, g, b)' that `blend` returns. */
export function rgb(color: string): [number, number, number] {
  if (color.startsWith('rgb')) {
    const [r, g, b] = color
      .slice(color.indexOf('(') + 1)
      .split(',')
      .map(parseFloat);
    return [r, g, b];
  }
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blends between colours: t = 0 gives the first, t = 1 the last. */
export function blend(colors: string[], t: number): string {
  const at = clamp01(t) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(at));
  const f = at - i;
  const a = rgb(colors[i]);
  const b = rgb(colors[i + 1]);
  const mixed = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${mixed.join(', ')})`;
}
