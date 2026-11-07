import { theme } from '../../carnival';
import { BAKE_TARGET, PIZZA_VIEW, type Topping, type ToppingSpot } from './game';

/**
 * The kitchen's drawing kit: its palette, shapes, faces and text, and the
 * pizza. render.ts draws the kitchen and each step with these, and each dish
 * in dishes/ draws its finished dish with them.
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
};
export const CONFETTI = [C.hotPink, C.gold, C.mint, C.sky, C.lavender, C.pink, C.butter];

export const FONT =
  '"Arial Rounded MT Bold", "Chalkboard SE", "Comic Sans MS", "Trebuchet MS", sans-serif';
export const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
export const font = (size: number) => `bold ${size}px ${FONT}`;

export type G = CanvasRenderingContext2D;

/** Where each topping's pieces sit around its spot. */
export const PIECES = [
  [-20, -5],
  [18, -9],
  [2, 11],
] as const;

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

/** A kawaii face: eyes with a glint, rosy cheeks and a smile. */
export function face(g: G, x: number, y: number, s: number, mood: 'happy' | 'joy' | 'wow') {
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
) {
  g.font = font(size);
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
// Pizza

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

/** One piece of a topping, about 14px across at scale 1, centred on (x, y). */
export function toppingPiece(g: G, kind: Topping, x: number, y: number, s: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  if (kind === 'pepperoni') {
    circle(g, 0, 0, 13);
    fillStroke(g, vertical(g, -13, 13, [C.pepperoni, C.pepperoniDark]), 2.5);
    g.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (const [dx, dy] of [
      [-5, -4],
      [4, 3],
      [5, -6],
      [-3, 6],
    ]) {
      circle(g, dx, dy, 1.8);
      g.fill();
    }
  } else if (kind === 'mushroom') {
    g.beginPath();
    g.moveTo(-13, 1);
    g.bezierCurveTo(-13, -15, 13, -15, 13, 1);
    g.lineTo(5, 1);
    g.lineTo(6, 12);
    g.quadraticCurveTo(0, 15, -6, 12);
    g.lineTo(-5, 1);
    g.closePath();
    fillStroke(g, vertical(g, -12, 14, [C.mushroom, C.mushroomDark]), 2.5);
  } else if (kind === 'pineapple') {
    g.beginPath();
    g.moveTo(0, -12);
    g.lineTo(12, 9);
    g.quadraticCurveTo(0, 14, -12, 9);
    g.closePath();
    fillStroke(g, vertical(g, -12, 12, [C.butter, C.pineapple]), 2.5);
  } else if (kind === 'olive') {
    circle(g, 0, 0, 10);
    g.lineWidth = 9;
    g.strokeStyle = C.ink;
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = C.olive;
    g.stroke();
  } else if (kind === 'tomato') {
    circle(g, 0, 0, 12);
    fillStroke(g, vertical(g, -12, 12, [C.sauceLight, C.berry]), 2.5);
    g.fillStyle = 'rgba(255, 230, 160, 0.9)';
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      oval(g, Math.cos(a) * 6, Math.sin(a) * 6, 2.6, 1.6, a);
      g.fill();
    }
  } else {
    g.beginPath();
    g.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
    g.lineWidth = 8;
    g.strokeStyle = C.ink;
    g.stroke();
    g.lineWidth = 4.5;
    g.strokeStyle = C.pepper;
    g.stroke();
  }
  g.restore();
}

export interface PizzaLook {
  /** How much of the dough the sauce covers, 0 to 1. */
  sauce: number;
  cheese: boolean;
  /** The toppings that are on. */
  toppings: readonly ToppingSpot[];
  /** How baked it is: 0 raw, BAKE_TARGET golden, 1 crispy. */
  baked: number;
  /** Turns the sauce swirl. */
  swirl?: number;
}

/**
 * A pizza centred on (x, y). With ry smaller than rx it's seen a little from
 * the side; toppings sit where their spots are on PIZZA_VIEW, scaled.
 */
export function drawPizza(g: G, x: number, y: number, rx: number, ry: number, look: PizzaLook) {
  const squash = ry / rx;
  const golden = look.baked / BAKE_TARGET;
  const crisp = (look.baked - BAKE_TARGET) / (1 - BAKE_TARGET);
  const crust =
    look.baked <= BAKE_TARGET
      ? blend([C.dough, C.crustGold], golden)
      : blend([C.crustGold, C.crustBrown], crisp);
  const crustLight =
    look.baked <= BAKE_TARGET
      ? blend([C.doughLight, C.dough], golden)
      : blend([C.dough, C.crustGold], crisp);

  // The crust's side, then its top.
  shadow(g, x + 6, y + ry * 0.35 + 10 * squash, rx * 0.98, ry * 0.75);
  oval(g, x, y + 9 * squash + 2, rx, ry);
  fillStroke(g, blend([crust, C.crustBrown], 0.35), 3.5);
  oval(g, x, y, rx, ry);
  const top = g.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 4, x, y, rx);
  top.addColorStop(0, crustLight);
  top.addColorStop(1, crust);
  fillStroke(g, top, 3.5);

  // The middle, where the sauce goes.
  const inner = 0.86;
  oval(g, x, y, rx * inner, ry * inner);
  g.fillStyle = blend([C.doughLight, crustLight], 0.5);
  g.fill();
  g.strokeStyle = 'rgba(184, 114, 58, 0.35)';
  g.lineWidth = 2;
  g.stroke();

  if (look.sauce > 0) {
    const cover = 0.22 + 0.78 * clamp01(look.sauce);
    g.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const wobble = look.sauce < 1 ? 1 + Math.sin(a * 7 + (look.swirl ?? 0)) * 0.05 : 1;
      const r = cover * inner * 0.96 * wobble;
      g.lineTo(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r);
    }
    g.closePath();
    const sauce = g.createRadialGradient(x - rx * 0.2, y - ry * 0.2, 2, x, y, rx * cover);
    sauce.addColorStop(0, C.sauceLight);
    sauce.addColorStop(1, look.baked > BAKE_TARGET ? C.sauceDark : C.sauce);
    g.fillStyle = sauce;
    g.fill();
    // A swirl in the sauce while it's being spread.
    if (look.swirl !== undefined) {
      g.strokeStyle = 'rgba(255, 170, 140, 0.8)';
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const r = (0.2 + j * 0.22) * cover;
        g.beginPath();
        g.ellipse(x, y, rx * r, ry * r, 0, look.swirl + j * 2.1, look.swirl + j * 2.1 + 1.5);
        g.stroke();
      }
    }
  }

  if (look.cheese) {
    // Melty cheese in soft blobs, turning golden in the oven.
    const cheese =
      look.baked <= BAKE_TARGET
        ? blend([C.cheese, C.cheeseGold], golden * 0.8)
        : blend([C.cheeseGold, C.cheeseBrown], crisp);
    g.fillStyle = cheese;
    const blobs = [
      [0, 0, 0.42],
      [-0.42, -0.2, 0.26],
      [0.42, -0.18, 0.27],
      [-0.36, 0.3, 0.27],
      [0.38, 0.3, 0.26],
      [0, -0.48, 0.24],
      [0.02, 0.5, 0.24],
      [-0.6, 0.05, 0.18],
      [0.6, 0.05, 0.18],
    ];
    for (const [bx, by, r] of blobs) {
      oval(g, x + bx * rx, y + by * ry, r * rx, r * ry);
      g.fill();
    }
    // Toasty spots once it's golden.
    if (look.baked > BAKE_TARGET * 0.8) {
      g.fillStyle = `rgba(200, 120, 40, ${0.25 + 0.35 * clamp01(crisp)})`;
      for (const [bx, by] of [
        [-0.25, -0.1],
        [0.3, 0.12],
        [0.05, 0.32],
        [-0.45, 0.22],
        [0.2, -0.36],
      ]) {
        oval(g, x + bx * rx, y + by * ry, 0.05 * rx, 0.05 * ry);
        g.fill();
      }
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    oval(g, x - rx * 0.2, y - ry * 0.22, rx * 0.12, ry * 0.06, -0.3);
    g.fill();
  }

  // Toppings, flattened to match the pizza's tilt.
  const scale = rx / PIZZA_VIEW.rx;
  look.toppings.forEach((spot, i) => {
    const nx = (spot.x - PIZZA_VIEW.x) / PIZZA_VIEW.rx;
    const ny = (spot.y - PIZZA_VIEW.y) / PIZZA_VIEW.ry;
    PIECES.forEach(([dx, dy], k) => {
      const tx = x + nx * rx + dx * scale;
      const ty = y + ny * ry + dy * scale * (squash / (PIZZA_VIEW.ry / PIZZA_VIEW.rx));
      g.save();
      g.translate(tx, ty);
      g.scale(1, Math.min(1, squash * 1.6));
      toppingPiece(g, spot.kind, 0, 0, scale, i + k * 2.1);
      g.restore();
    });
  });
}
