import { C, type G, circle, fillStroke, heartPath, oval, starPath } from './art';
import type { Shape } from './layout';

/**
 * Decorating the finished dish: after the last step, before the stars, the
 * cook drags treats from a tray onto the dish (or taps a treat, then taps the
 * dish). It scores nothing and nothing can go wrong: a treat dropped anywhere
 * lands on the dish, and one dragged back to the tray goes away. "Done!", or
 * 20 seconds without a touch, moves on to the end card, which shows the dish
 * with its decorations.
 *
 * Everything here is plain state and scene coordinates, so it's tested
 * without a browser. render.ts draws it, game.ts passes it the pointer.
 */

/** The treats on the tray, in order. */
export const DECORATIONS = ['sprinkles', 'cherry', 'heart', 'star', 'flower', 'flag'] as const;
export type DecorationKind = (typeof DECORATIONS)[number];

/** A treat on the dish, in the dish's own units (its origin is its middle). */
export interface Decoration {
  kind: DecorationKind;
  x: number;
  y: number;
  rot: number;
}

/** The treat under the finger, in scene units. */
export interface Held {
  kind: DecorationKind;
  x: number;
  y: number;
  /** Where it was picked up: the tray, or the dish (to move it). */
  from: 'tray' | 'dish';
  startX: number;
  startY: number;
  /** Whether it has moved far enough to be a drag rather than a tap. */
  moved: boolean;
}

export interface DecorState {
  placed: Decoration[];
  held: Held | null;
  /** A treat tapped on the tray: the next tap on the dish puts one there. */
  selected: DecorationKind | null;
  /** Seconds since decorating started. */
  age: number;
  /** Seconds since the last touch. */
  idle: number;
  /** Decorating is over: on to the stars. */
  done: boolean;
}

/** Seconds before decorating takes a tap, so a last excited tap does nothing. */
export const DECOR_WAIT = 0.6;
/** Seconds without a touch before decorating finishes by itself. */
export const DECOR_IDLE = 20;
/** The most treats on one dish. Another one replaces the oldest. */
export const MAX_DECORATIONS = 30;
/** How far (in dish units) from its middle a treat may sit. */
export const DISH_REACH = { x: 115, y: 78 } as const;
/** How near (in scene units) a press must be to a treat to pick it up. */
const GRAB = 34;
/** A finger that moves less than this (in scene units) is a tap. */
const TAP_SLOP = 14;

export interface DecorPlaces {
  /** Where the dish sits in the scene, and how big it's drawn. */
  dish: { x: number; y: number; scale: number };
  title: { x: number; y: number };
  /** Behind it all: a soft cloth on the counter. */
  panel: { x: number; y: number; w: number; h: number };
  /** The tray: one spot per treat in DECORATIONS, and its size. */
  tray: { x: number; y: number }[];
  trayRadius: number;
  /** Treats let go below this line go back to the tray. */
  trayTop: number;
  done: { x: number; y: number; w: number; h: number };
}

/**
 * Where decorating happens in the scene, for a layout's shape. On a computer
 * or a phone held sideways, Chef Bunny stands at the left, so it all sits to
 * the right of her. Held upright, only about x 100 to 700 shows, so the dish
 * sits in the middle with the tray below it and "Done!" below that.
 */
export function decorPlaces(shape: Shape): DecorPlaces {
  if (shape === 'tall') {
    return {
      dish: { x: 400, y: 280, scale: 1.3 },
      title: { x: 400, y: 132 },
      panel: { x: 112, y: 92, w: 576, h: 456 },
      tray: DECORATIONS.map((_, i) => ({ x: 400 + (i - 2.5) * 80, y: 440 })),
      trayRadius: 32,
      trayTop: 405,
      done: { x: 400, y: 512, w: 180, h: 58 },
    };
  }
  return {
    dish: { x: 500, y: 240, scale: 1.3 },
    title: { x: 500, y: 100 },
    panel: { x: 222, y: 60, w: 562, h: 420 },
    tray: DECORATIONS.map((_, i) => ({ x: 445 + (i - 2.5) * 70, y: 420 })),
    trayRadius: 30,
    trayTop: 385,
    done: { x: 720, y: 420, w: 104, h: 64 },
  };
}

export function createDecor(): DecorState {
  return { placed: [], held: null, selected: null, age: 0, idle: 0, done: false };
}

/** Whether decorating is taking taps: it has started a moment ago and isn't done. */
export function decorTaking(d: DecorState): boolean {
  return !d.done && d.age >= DECOR_WAIT;
}

/** The tray treat under a scene point, if any. */
export function trayAt(places: DecorPlaces, x: number, y: number): DecorationKind | null {
  const i = places.tray.findIndex(
    (spot) => Math.hypot(x - spot.x, y - spot.y) <= places.trayRadius + 6,
  );
  return i < 0 ? null : DECORATIONS[i];
}

export function hitDone(places: DecorPlaces, x: number, y: number): boolean {
  const { done } = places;
  return Math.abs(x - done.x) <= done.w / 2 + 6 && Math.abs(y - done.y) <= done.h / 2 + 6;
}

/** A scene point in the dish's own units, kept on the dish. */
export function onDish(places: DecorPlaces, x: number, y: number): { x: number; y: number } {
  const { dish } = places;
  const clamp = (v: number, reach: number) => Math.max(-reach, Math.min(reach, v));
  return {
    x: clamp((x - dish.x) / dish.scale, DISH_REACH.x),
    y: clamp((y - dish.y) / dish.scale, DISH_REACH.y),
  };
}

/** A dish point in scene units. */
export function toSceneFromDish(places: DecorPlaces, x: number, y: number) {
  const { dish } = places;
  return { x: dish.x + x * dish.scale, y: dish.y + y * dish.scale };
}

/** Index of the topmost treat on the dish under a scene point, or -1. */
export function placedAt(d: DecorState, places: DecorPlaces, x: number, y: number): number {
  for (let i = d.placed.length - 1; i >= 0; i--) {
    const at = toSceneFromDish(places, d.placed[i].x, d.placed[i].y);
    if (Math.hypot(x - at.x, y - at.y) <= GRAB) return i;
  }
  return -1;
}

/** Puts a treat on the dish at a scene point, tilted a little, each one differently. */
function place(d: DecorState, places: DecorPlaces, kind: DecorationKind, x: number, y: number) {
  const at = onDish(places, x, y);
  const rot = (((d.placed.length * 7) % 5) - 2) * 0.15;
  d.placed.push({ kind, x: at.x, y: at.y, rot });
  if (d.placed.length > MAX_DECORATIONS) d.placed.shift();
}

export type DecorPress = 'done' | 'pick' | 'place' | 'none';

/**
 * Presses at a scene point: "Done!", picks a treat up from the tray or the
 * dish, or (with a treat tapped on the tray) puts one on the dish.
 */
export function decorPress(d: DecorState, places: DecorPlaces, x: number, y: number): DecorPress {
  if (!decorTaking(d)) return 'none';
  d.idle = 0;
  if (hitDone(places, x, y)) {
    d.done = true;
    d.held = null;
    return 'done';
  }
  const held = (kind: DecorationKind, from: Held['from']) => {
    d.held = { kind, x, y, from, startX: x, startY: y, moved: false };
    return 'pick' as const;
  };
  const fromTray = trayAt(places, x, y);
  if (fromTray) return held(fromTray, 'tray');
  if (y >= places.trayTop) return 'none';
  if (d.selected) {
    place(d, places, d.selected, x, y);
    return 'place';
  }
  const i = placedAt(d, places, x, y);
  if (i >= 0) {
    const [taken] = d.placed.splice(i, 1);
    return held(taken.kind, 'dish');
  }
  return 'none';
}

/** Moves the held treat with the finger. */
export function decorMove(d: DecorState, x: number, y: number): void {
  const held = d.held;
  if (!held) return;
  d.idle = 0;
  held.x = x;
  held.y = y;
  if (Math.hypot(x - held.startX, y - held.startY) > TAP_SLOP) held.moved = true;
}

export type DecorRelease = 'place' | 'select' | 'unselect' | 'remove' | 'none';

/**
 * Lets go of the held treat. Above the tray it lands on the dish. A tap on a
 * tray treat picks it for tapping onto the dish (or unpicks it); a treat from
 * the dish dragged back to the tray goes away.
 */
export function decorRelease(d: DecorState, places: DecorPlaces): DecorRelease {
  const held = d.held;
  if (!held) return 'none';
  d.held = null;
  d.idle = 0;
  if (held.from === 'tray' && !held.moved) {
    d.selected = d.selected === held.kind ? null : held.kind;
    return d.selected ? 'select' : 'unselect';
  }
  if (held.y < places.trayTop) {
    place(d, places, held.kind, held.x, held.y);
    return 'place';
  }
  return held.from === 'dish' ? 'remove' : 'none';
}

/** Advances decorating by `dt` seconds; it finishes by itself after a long rest. */
export function decorTick(d: DecorState, dt: number): void {
  if (d.done) return;
  d.age += dt;
  if (!d.held) d.idle += dt;
  if (d.idle >= DECOR_IDLE) {
    d.done = true;
  }
}

// ---------------------------------------------------------------------------
// Drawing

const SPRINKLES = [C.hotPink, C.sky, C.butter, C.mint, C.lavender];

/** A treat centred on (x, y), about 30 across at `size` 1. */
export function drawDecoration(
  g: G,
  kind: DecorationKind,
  x: number,
  y: number,
  size = 1,
  rot = 0,
) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(size, size);
  switch (kind) {
    case 'sprinkles':
      [
        [-8, -6, 0.5],
        [6, -9, -0.7],
        [10, 4, 0.3],
        [-4, 7, -0.2],
        [-12, 4, 1.2],
        [2, -1, 1.6],
      ].forEach(([sx, sy, a], i) => {
        g.save();
        g.translate(sx, sy);
        g.rotate(a);
        g.beginPath();
        g.roundRect(-6, -2.5, 12, 5, 2.5);
        fillStroke(g, SPRINKLES[i % SPRINKLES.length], 1.8);
        g.restore();
      });
      break;
    case 'cherry':
      g.strokeStyle = C.leafDark;
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0, -4);
      g.quadraticCurveTo(2, -14, 9, -18);
      g.stroke();
      oval(g, 8, -16, 6, 3, -0.5);
      fillStroke(g, C.leaf, 2);
      circle(g, 0, 4, 11);
      fillStroke(g, C.berry, 3);
      g.fillStyle = C.white;
      oval(g, -4, 0, 3, 2, -0.6);
      g.fill();
      break;
    case 'heart':
      heartPath(g, 0, 0, 13);
      fillStroke(g, C.hotPink, 3);
      g.fillStyle = C.white;
      oval(g, -6, -4, 3, 2, -0.6);
      g.fill();
      break;
    case 'star':
      starPath(g, 0, 0, 15);
      fillStroke(g, C.gold, 3);
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        circle(g, Math.cos(a) * 8, Math.sin(a) * 8, 7);
        fillStroke(g, C.lavender, 2.5);
      }
      circle(g, 0, 0, 6);
      fillStroke(g, C.butter, 2.5);
      break;
    case 'flag':
      g.strokeStyle = C.woodDark;
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-6, 14);
      g.lineTo(-6, -16);
      g.stroke();
      g.beginPath();
      g.moveTo(-5, -16);
      g.lineTo(15, -10);
      g.lineTo(-5, -3);
      g.closePath();
      fillStroke(g, C.mint, 2.5);
      heartPath(g, 1, -10, 3);
      g.fillStyle = C.white;
      g.fill();
      break;
  }
  g.restore();
}

/** Every treat on the dish, in the dish's units (draw them right after the dish). */
export function drawDecorations(g: G, placed: Decoration[]) {
  for (const d of placed) drawDecoration(g, d.kind, d.x, d.y, 1, d.rot);
}
