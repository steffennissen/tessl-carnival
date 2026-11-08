import {
  C,
  type G,
  circle,
  clamp01,
  easeOutBack,
  fillStroke,
  horizontal,
  rounded,
  starPath,
  stickerText,
  vertical,
} from './art';
import type { Dish } from './kit';

/**
 * The dish spinner: a carnival slot machine with one reel of dish pictures.
 * It spins fast, slows down tick by tick, and lands with a bounce on the dish
 * the game already picked. The maths here is plain functions, so tests can
 * check that the reel always lands on the right dish; the renderer keeps the
 * clock and plays the sounds and sparkles.
 *
 * The reel's position counts dishes: at position p the dish at index
 * `reelIndex(p, count)` is in the middle of the window.
 */

/** Seconds from the first spin to landing on the dish. */
export const SPIN_TIME = 2.2;
/** Seconds the little bounce lasts after landing. */
export const BOUNCE_TIME = 0.6;
/** Whole turns of the reel before it lands, at least. */
export const SPIN_LAPS = 3;

/** Where the reel stops: past `laps` whole turns from `start`, on `target`. */
export function spinEnd(start: number, target: number, count: number, laps = SPIN_LAPS): number {
  const from = start + laps * count;
  const ahead = (((target - from) % count) + count) % count;
  return Math.round(from + ahead);
}

/** Fast at first, then slower and slower until it stops. */
export function easeOutQuart(p: number): number {
  return 1 - Math.pow(1 - clamp01(p), 4);
}

/**
 * The reel's position `age` seconds into the spin: easing from `start` to
 * `end`, then a small bounce (less than half a dish, so the same dish stays
 * in the middle) that settles exactly on `end`.
 */
export function reelPosition(start: number, end: number, age: number): number {
  if (age < SPIN_TIME) return start + (end - start) * easeOutQuart(age / SPIN_TIME);
  const after = age - SPIN_TIME;
  if (after >= BOUNCE_TIME) return end;
  return end + 0.18 * Math.sin(after * 16) * Math.exp(-after * 7) * (1 - after / BOUNCE_TIME);
}

/** The index of the dish in the middle of the window at position `pos`. */
export function reelIndex(pos: number, count: number): number {
  return ((Math.round(pos) % count) + count) % count;
}

/**
 * How long the landed dish stays up before cooking starts: long enough for
 * Chef Bunny to say "Let's make <dish>!", so longer names wait a little more.
 */
export function holdFor(name: string): number {
  return Math.min(2.4, Math.max(1.6, 1.3 + name.length * 0.035));
}

/** The whole spinner, from the first spin to the first step's card. */
export function spinTime(dish: Dish): number {
  return SPIN_TIME + holdFor(dish.name);
}

/** What the renderer passes to draw one frame of the spinner. */
export interface SpinView {
  dishes: Dish[];
  /** The reel's position (see reelPosition). */
  pos: number;
  /** How fast the reel turns, in dishes a second. */
  speed: number;
  /** Seconds since landing, or below 0 while it still spins. */
  landed: number;
  /** The clock, in seconds, for lights and wobbles. */
  t: number;
}

/** Dishes apart on the reel, in scene units. */
const PITCH = 170;
/** The machine's middle, and its window, in scene units. */
const CX = 400;
const WINDOW = { top: 104, bottom: 356, half: 150 };
const MID = (WINDOW.top + WINDOW.bottom) / 2;

/** Where the landed dish sits on the scene, for sparkles. */
export const SPINNER_DISH = { x: CX, y: MID };

/** Draws the slot machine, in scene units, centred on the scene. */
export function drawSpinner(g: G, view: SpinView) {
  const { dishes, pos, speed, landed, t } = view;
  const count = dishes.length;
  const done = landed >= 0;
  const pop = done ? easeOutBack(clamp01(landed / 0.45)) : 0;

  // The machine: a pink cabinet with light bulbs all round.
  g.save();
  g.translate(CX, 250);
  const breathe = done ? 1 + 0.04 * Math.sin(clamp01(landed / 0.35) * Math.PI) : 1;
  g.scale(breathe, breathe);
  rounded(g, -186, -212, 372, 424, 38);
  fillStroke(g, vertical(g, -212, 212, [C.pink, C.hotPink]), 5);
  bulbs(g, t, done);
  g.restore();

  // The sign on top.
  rounded(g, CX - 140, 52, 280, 42, 21);
  fillStroke(g, horizontal(g, CX - 140, CX + 140, [C.purple, C.lavender, C.purple]), 4);
  stickerText(g, done ? "Let's make" : 'What shall we cook?', CX, 74, 24, C.white, 'center', 260);

  // The window, with the reel behind it.
  g.save();
  rounded(g, CX - WINDOW.half, WINDOW.top, WINDOW.half * 2, WINDOW.bottom - WINDOW.top, 26);
  fillStroke(g, vertical(g, WINDOW.top, WINDOW.bottom, [C.cream, C.white, C.cream]), 5);
  g.clip();
  if (done) {
    // Sun rays behind the dish it landed on.
    g.save();
    g.translate(CX, MID);
    g.rotate(t * 0.5);
    g.fillStyle = `rgba(255, 229, 138, ${0.7 * pop})`;
    for (let i = 0; i < 12; i++) {
      g.rotate(Math.PI / 6);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-20, -190);
      g.lineTo(20, -190);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  const near = Math.round(pos);
  for (let k = near - 1; k <= near + 1; k++) {
    const dish = dishes[reelIndex(k, count)];
    const y = MID + (k - pos) * PITCH;
    const middle = done && k === near;
    const scale = middle ? 0.62 + 0.26 * pop : 0.62;
    // A blur of ghosts while it spins fast.
    const blur = Math.min(1, speed / 25);
    if (blur > 0.2) {
      g.globalAlpha = 0.25 * blur;
      for (const ghost of [-1, 1]) drawDish(g, dish, CX, y + ghost * blur * 36, 0.62, t);
      g.globalAlpha = 1;
    }
    drawDish(g, dish, CX, y, scale, t);
  }
  // The window's glass: a soft shade at the top and bottom, like a drum.
  g.fillStyle = vertical(g, WINDOW.top, WINDOW.top + 60, [
    'rgba(91, 59, 79, 0.28)',
    'rgba(91, 59, 79, 0)',
  ]);
  g.fillRect(CX - WINDOW.half, WINDOW.top, WINDOW.half * 2, 60);
  g.fillStyle = vertical(g, WINDOW.bottom - 60, WINDOW.bottom, [
    'rgba(91, 59, 79, 0)',
    'rgba(91, 59, 79, 0.28)',
  ]);
  g.fillRect(CX - WINDOW.half, WINDOW.bottom - 60, WINDOW.half * 2, 60);
  g.restore();
  rounded(g, CX - WINDOW.half, WINDOW.top, WINDOW.half * 2, WINDOW.bottom - WINDOW.top, 26);
  g.lineWidth = 5;
  g.strokeStyle = C.ink;
  g.stroke();

  // Gold arrows either side, pointing at the middle.
  for (const side of [-1, 1]) {
    const x = CX + side * (WINDOW.half + 4);
    const nudge = done ? Math.sin(t * 10) * 3 : 0;
    g.beginPath();
    g.moveTo(x + side * (22 + nudge), MID - 18);
    g.lineTo(x - side * (10 - nudge), MID);
    g.lineTo(x + side * (22 + nudge), MID + 18);
    g.closePath();
    fillStroke(g, C.gold, 3.5);
  }

  // The name of the dish in the middle, on a plaque under the window.
  const name = dishes[reelIndex(pos, count)].name;
  rounded(g, CX - 172, 368, 344, 76, 30);
  fillStroke(g, C.white, 4.5);
  g.save();
  g.translate(CX, 406);
  const grow = done ? 1 + 0.25 * (1 - pop) * Math.sin(clamp01(landed / 0.45) * Math.PI) : 1;
  g.scale(grow, grow);
  stickerText(
    g,
    done ? `${name}!` : name,
    0,
    0,
    done ? 34 : 28,
    done ? vertical(g, -18, 18, [C.hotPink, C.purple]) : C.purple,
    'center',
    320,
  );
  g.restore();

  // Sparkly stars round the dish once it has landed.
  if (done) {
    for (let i = 0; i < 4; i++) {
      const a = t * 1.4 + (i * Math.PI) / 2;
      const r = 12 + Math.sin(t * 6 + i) * 3;
      starPath(g, CX + Math.cos(a) * 128, MID + Math.sin(a) * 96, r * pop, t * 2 + i);
      fillStroke(g, C.gold, 2.5);
    }
  }
}

/** A dish's finished picture, scaled down, centred on (x, y). */
function drawDish(g: G, dish: Dish, x: number, y: number, scale: number, t: number) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  dish.draw(g, t, null);
  g.restore();
}

/** Light bulbs round the cabinet: chasing while it spins, flashing once it lands. */
function bulbs(g: G, t: number, done: boolean) {
  const w = 186;
  const h = 212;
  const spots: [number, number][] = [];
  for (let x = -w + 34; x <= w - 34; x += 34) spots.push([x, -h + 14]);
  for (let y = -h + 48; y <= h - 34; y += 34) spots.push([w - 14, y]);
  for (let x = w - 34; x >= -w + 34; x -= 34) spots.push([x, h - 14]);
  for (let y = h - 48; y >= -h + 34; y -= 34) spots.push([-w + 14, y]);
  const chase = Math.floor(t * 14);
  const flash = Math.floor(t * 6) % 2 === 0;
  spots.forEach(([x, y], i) => {
    const on = done ? flash : (i + chase) % 3 === 0;
    circle(g, x, y, on ? 6.5 : 5);
    fillStroke(g, on ? C.butter : C.white, 2.5);
  });
}
