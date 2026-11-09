import {
  C,
  type G,
  circle,
  clamp01,
  emoji,
  face,
  fillStroke,
  heartPath,
  oval,
  palette,
  plainText,
  rounded,
  starPath,
  stickerText,
  vertical,
  type Mood,
} from './art';
import type { Box } from './book';
import type { CoinDrop, Guest, GuestKind } from './customers';
import { drawLulu } from './ingredients/lobster-shells';
import type { Dish } from './kit';
import type { Layout } from './layout';
import { drawCoin } from './steps/pay';

/**
 * The food stand's drawing: the customers and bosses, the coin jar, coins,
 * the golden trophy and the boss's order card, and where they go for each
 * layout. The places are plain functions, tested in stand.test.ts; render.ts
 * runs the scenes (a customer arriving, serving, the trophy).
 */

/** This file's own colours: see `palette` in art.ts. */
const K = palette({
  bear: '#c98f5f',
  bearLight: '#f1cfa6',
  kitten: '#cfc6dd',
  kittenDark: '#a99cbf',
  penguin: '#4d4a6b',
  frog: '#7fdc85',
  frogLight: '#d9f7c6',
  elephant: '#b8b4d8',
  elephantLight: '#ddd9f2',
  pigLight: '#ffd1e5',
  cape: '#e8506a',
  capeDark: '#c23a55',
  mane: '#f6a04d',
  dragon: '#8fd9a8',
  dragonDark: '#55b77a',
  coin: '#ffd25e',
  coinDark: '#e9a92c',
  glass: '#eaf6ff',
});

// ---------------------------------------------------------------------------
// Where things go

/** What render.ts's places say about the screen, for the stand's places. */
export interface Around {
  bunny: { x: number; y: number };
  speech: { x: number; y: number; w: number };
  clock: { x: number; y: number; r: number };
  badge: Box;
  score: { x: number; y: number };
  sound: { x: number; y: number };
  recipe: { x: number; y: number };
  home: { x: number; y: number } | null;
  buttonR: number;
}

/** A guest's size at scale 1, feet to the top of the head. */
export const GUEST = { w: 130, h: 168 } as const;

/**
 * Where the customer waits while she cooks, in canvas units: `x`, `y` their
 * feet, `scale` their size. Small, and clear of the cooking and the HUD: in
 * the kitchen window above Chef Bunny on a computer, in the kitchen beside
 * the scene on a wide phone held sideways, and below Chef Bunny (or beside
 * her, under her speech bubble) on a phone held upright.
 */
export function guestSpot(layout: Layout, around: Around): { x: number; y: number; scale: number } {
  const { sceneX: sx, sceneY: sy, height } = layout;
  if (layout.shape === 'tall') {
    const { bunny, speech, clock } = around;
    const clockLeft = clock.x - clock.r * 1.08 - 10;
    // Under Chef Bunny, at the bottom left.
    const below = { x0: 6, x1: Math.min(clockLeft, 236), y0: bunny.y + 136, y1: height - 8 };
    // Or beside her, under her speech bubble, left of the clock.
    const beside = { x0: speech.x, x1: clockLeft, y0: speech.y + 92, y1: height - 8 };
    const fit = (r: typeof below) => Math.min(1, (r.x1 - r.x0) / GUEST.w, (r.y1 - r.y0) / GUEST.h);
    const room = fit(below) >= 0.6 ? below : beside;
    const scale = Math.max(0.4, fit(room));
    return { x: (room.x0 + room.x1) / 2, y: room.y1, scale };
  }
  if (sx >= 110) {
    // Beside the scene at the right, under the kitchen clock.
    const top = around.clock.y + around.clock.r * 1.08 + 12;
    const feet = sy + 440;
    const scale = Math.min(1, (sx - 14) / GUEST.w, (feet - top) / GUEST.h);
    return { x: sx + 800 + sx / 2, y: feet, scale };
  }
  // In the kitchen window, above Chef Bunny's speech bubble.
  return { x: sx + 101, y: sy + 226, scale: 0.6 };
}

/**
 * The coins in the jar, small in the HUD, in canvas units: beside the sound
 * button on a computer, beside 🏠 on a phone held sideways, and under the
 * score on a phone held upright.
 */
export function walletSpot(layout: Layout, around: Around): Box {
  const { sceneX: sx, sceneY: sy } = layout;
  if (layout.shape === 'tall') {
    // Under the score, right of the recipe (at most five steps, 78 apart).
    const x = Math.max(around.score.x + 18, around.recipe.x + 2 * 78 + 40);
    return { x, y: around.score.y + 48, w: Math.min(132, layout.width - 8 - x), h: 32 };
  }
  if (layout.shape === 'wide') {
    // Beside 🏠 when the sound button is off at the right; else right of the dish's badge.
    if (around.sound.x > layout.width / 2) {
      return { x: (around.home?.x ?? 0) + around.buttonR + 10, y: 26, w: 112, h: 36 };
    }
    return { x: around.badge.x + around.badge.w + 12, y: 6, w: 112, h: 36 };
  }
  return { x: sx + 70, y: sy + 62, w: 112, h: 34 };
}

/**
 * Where the stand's scenes go (a customer arriving, serving, a boss and the
 * trophy). They're drawn on a stage 440 wide (x 180 to 620) and 500 tall,
 * like the scene's middle; `x`, `y` is where the stage's middle (400, 250)
 * goes on the canvas, and `scale` how big. On a phone held upright it's
 * bigger, in the room above Chef Bunny.
 */
export function stageSpot(layout: Layout, around: Around): { x: number; y: number; scale: number } {
  if (layout.shape !== 'tall') {
    return { x: layout.sceneX + 400, y: layout.sceneY + 250, scale: 1 };
  }
  const top = Math.max(around.buttonR * 2 + 24, 104);
  const bottom = around.bunny.y - 96;
  const scale = Math.min((layout.width - 24) / STAGE.w, (bottom - top) / STAGE.h);
  return { x: layout.width / 2, y: (top + bottom) / 2, scale };
}

/** The stage's size, in stage units (see stageSpot). */
export const STAGE = { x: 180, w: 440, h: 500 } as const;

/** A customer arriving: their bubble, where they stand, their name tag. */
export const ARRIVE_PLACES = {
  bubble: { x: 188, y: 18, w: 424, h: 150 },
  guest: { x: 400, y: 404, scale: 1.3 },
  tag: { x: 400, y: 437 },
  line: { x: 400, y: 480 },
} as const;

/** A boss: the banner, the boss, their name, and the order card. */
export const BOSS_PLACES = {
  banner: { x: 210, y: 10, w: 380, h: 50 },
  guest: { x: 400, y: 292, scale: 1.05 },
  tag: { x: 400, y: 318 },
  card: { x: 186, y: 344, w: 428, h: 152 },
} as const;

/** Serving: their bubble, where they stand, the dish, and the coin jar. */
export const SERVE_PLACES = {
  bubble: { x: 188, y: 14, w: 424, h: 104 },
  guest: { x: 500, y: 450, scale: 1.2 },
  dishFrom: { x: 196, y: 404 },
  dishTo: { x: 404, y: 404 },
  dishScale: 0.5,
  jar: { x: 268, y: 300, scale: 1 },
} as const;

/** The trophy ceremony: the banner, the trophy, its name, the boss, the jar and the button. */
export const TROPHY_PLACES = {
  banner: { x: 196, y: 10, w: 408, h: 50 },
  trophy: { x: 390, y: 205, scale: 1.1 },
  name: { x: 400, y: 318 },
  guest: { x: 556, y: 292, scale: 0.66 },
  jar: { x: 250, y: 484, scale: 0.85 },
  /** Its middle, and its size. */
  button: { x: 470, y: 450, w: 210, h: 64 },
} as const;

// ---------------------------------------------------------------------------
// Timings

/** A customer arriving: walking up, then their order. */
export const ARRIVE = { walk: 0.9, skip: 1.4, end: 5 } as const;
/** A boss arriving: a drumroll in the dark, then the reveal and the order. */
export const ENTRANCE = { drum: 1.6, skip: 3.2, end: 9.5 } as const;
/** Between a boss's dishes: "Dish 2 of 3". */
export const PROGRESS = { skip: 1, end: 3.6 } as const;

/** Serving: the dish slides over, they react, then the coins drop into the jar one by one. */
export const SERVE = { slide: 0.7, coins: 1.8, gap: 0.3, fly: 0.5, skip: 1 } as const;

/** When serving's parts happen, for `count` coins: the last coin lands, they leave, it's over. */
export function serveTimes(count: number, boss: boolean) {
  const coinsEnd = SERVE.coins + Math.max(0, count - 1) * SERVE.gap + SERVE.fly;
  const leave = coinsEnd + 0.4;
  // A boss stays for the next dish (or the trophy); a customer waves and walks off.
  return { coinsEnd, leave, end: boss ? coinsEnd + 0.9 : leave + 1.1 };
}

/** The trophy ceremony: it rises, then the bonus coins drop in. */
export const TROPHY = { rise: 1.3, coins: 2.4, gap: 0.3, fly: 0.5, skip: 2 } as const;

export function trophyTimes(count: number) {
  return { coinsEnd: TROPHY.coins + Math.max(0, count - 1) * TROPHY.gap + TROPHY.fly };
}

/**
 * How many of `count` coins dropped from `start`, one every `gap` seconds and
 * each `fly` seconds in the air, have landed by `age`.
 */
export function coinsLanded(
  age: number,
  count: number,
  start: number,
  gap: number,
  fly: number,
): number {
  if (age < start + fly) return 0;
  return Math.min(count, Math.floor((age - start - fly) / gap + 1e-9) + 1);
}

/** What `drops` add up to, counting the first `landed` of them. */
export function countedSoFar(drops: readonly CoinDrop[], landed: number): number {
  return drops.slice(0, landed).reduce((sum, d) => sum + d.value, 0);
}

/** A coin's arc from `from` to `to`, `p` 0 to 1 of the way. */
export function coinArc(
  from: { x: number; y: number },
  to: { x: number; y: number },
  p: number,
): { x: number; y: number } {
  const t = clamp01(p);
  const lift = 110 * Math.sin(Math.PI * t);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - lift };
}

// ---------------------------------------------------------------------------
// The guests

/** How a guest looks right now. */
export interface GuestPose {
  /** Seconds of the clock, for breathing. */
  t: number;
  /** 'happy' hops with joy; 'wow' throws both arms up. */
  mood: 'idle' | 'happy' | 'wow';
  /** Seconds since the mood started. */
  age: number;
  /** Walking: 0 standing, else the walk's clock, for steps and bobbing. */
  walk: number;
  /** Waving a paw (hello, or goodbye). */
  wave: boolean;
}

export function stillPose(t: number): GuestPose {
  return { t, mood: 'idle', age: 9, walk: 0, wave: false };
}

/** A guest standing with their feet at (x, y), `scale` times GUEST's size. */
export function drawGuest(
  g: G,
  guest: Guest,
  x: number,
  y: number,
  scale: number,
  pose: GuestPose,
) {
  const { mood, age, t, walk } = pose;
  const hop =
    mood === 'happy' && age < 1.4
      ? -Math.abs(Math.sin(age * 9)) * 14
      : mood === 'wow' && age < 1
        ? -Math.abs(Math.sin(age * 6)) * 18
        : walk
          ? -Math.abs(Math.sin(walk * 10)) * 7
          : Math.sin(t * 2.2) * 1.5;
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  // A shadow on the ground, then the guest above it.
  g.fillStyle = C.shadow;
  oval(g, 0, 2, 46, 8);
  g.fill();
  g.translate(0, hop);
  g.rotate(walk ? Math.sin(walk * 10) * 0.05 : 0);
  const faceMood: Mood = mood === 'happy' ? 'joy' : mood === 'wow' ? 'wow' : 'happy';
  DRAW[guest.kind](g, { ...pose, faceMood });
  g.restore();
}

interface Look extends GuestPose {
  faceMood: Mood;
}

/** The arms: resting, waving, or both up for a "wow". Paws at the sides. */
function arms(g: G, fill: string, look: Look, line = 3.5) {
  for (const side of [-1, 1]) {
    let px = side * 40;
    let py = -58;
    if (look.mood === 'wow' || (look.mood === 'happy' && look.age < 1.4)) {
      px = side * 46;
      py = -98 + Math.sin(look.age * 14 + side) * 6;
    } else if (look.wave && side === 1) {
      px = 46;
      py = -104 + Math.sin(look.t * 12) * 8;
    }
    circle(g, px, py, 12);
    fillStroke(g, fill, line);
  }
}

/** Feet, a round body and a lighter belly: most guests start like this. */
function plump(g: G, fur: string, belly: string, look: Look, feet = fur) {
  const step = look.walk ? Math.sin(look.walk * 10) * 5 : 0;
  for (const side of [-1, 1]) {
    oval(g, side * 17, -6 + (side > 0 ? step : -step) * 0.5, 15, 9);
    fillStroke(g, feet, 3.5);
  }
  oval(g, 0, -48, 40, 44);
  fillStroke(g, fur);
  oval(g, 0, -40, 26, 28);
  g.fillStyle = belly;
  g.fill();
  arms(g, fur, look);
}

function head(g: G, fill: string, y = -118, r = 42) {
  circle(g, 0, y, r);
  fillStroke(g, fill);
}

function triangleEars(g: G, fill: string, inner: string, spread = 26, tall = 36) {
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * (spread - 14), -148);
    g.lineTo(side * (spread + 6), -150 - tall);
    g.lineTo(side * (spread + 18), -140);
    g.closePath();
    fillStroke(g, fill);
    g.beginPath();
    g.moveTo(side * (spread - 6), -150);
    g.lineTo(side * (spread + 5), -142 - tall * 0.8);
    g.lineTo(side * (spread + 12), -146);
    g.closePath();
    g.fillStyle = inner;
    g.fill();
  }
}

function nose(g: G, x: number, y: number, fill: string = C.ink) {
  oval(g, x, y, 5, 3.6);
  g.fillStyle = fill;
  g.fill();
}

const DRAW: Record<GuestKind, (g: G, look: Look) => void> = {
  bear(g, look) {
    plump(g, K.bear, K.bearLight, look);
    for (const side of [-1, 1]) {
      circle(g, side * 30, -150, 15);
      fillStroke(g, K.bear);
      circle(g, side * 30, -150, 7);
      g.fillStyle = K.bearLight;
      g.fill();
    }
    head(g, K.bear);
    oval(g, 0, -106, 18, 13);
    g.fillStyle = K.bearLight;
    g.fill();
    face(g, 0, -122, 1.15, look.faceMood);
    nose(g, 0, -114);
  },
  fox(g, look) {
    // A big fluffy tail behind.
    oval(g, 42, -40, 18, 38, 0.7);
    fillStroke(g, C.carrot);
    oval(g, 58, -64, 9, 12, 0.7);
    g.fillStyle = C.white;
    g.fill();
    plump(g, C.carrot, C.white, look, C.carrotDark);
    triangleEars(g, C.carrot, C.pink, 24, 38);
    head(g, C.carrot);
    for (const side of [-1, 1]) {
      oval(g, side * 17, -104, 17, 13, side * 0.3);
      g.fillStyle = C.white;
      g.fill();
    }
    face(g, 0, -122, 1.15, look.faceMood);
    nose(g, 0, -113);
  },
  kitten(g, look) {
    plump(g, K.kitten, C.white, look);
    triangleEars(g, K.kitten, C.pink, 24, 26);
    head(g, K.kitten);
    g.strokeStyle = K.kittenDark;
    g.lineWidth = 4;
    g.lineCap = 'round';
    for (const dx of [-10, 0, 10]) {
      g.beginPath();
      g.moveTo(dx, -158);
      g.lineTo(dx, -146);
      g.stroke();
    }
    face(g, 0, -120, 1.15, look.faceMood);
    nose(g, 0, -113, C.hotPink);
    g.strokeStyle = C.ink;
    g.lineWidth = 2;
    for (const side of [-1, 1]) {
      for (const dy of [-3, 4]) {
        g.beginPath();
        g.moveTo(side * 24, -110 + dy);
        g.lineTo(side * 44, -112 + dy * 2);
        g.stroke();
      }
    }
  },
  penguin(g, look) {
    plump(g, K.penguin, C.white, look, C.carrot);
    head(g, K.penguin);
    for (const side of [-1, 1]) {
      circle(g, side * 13, -116, 21);
      g.fillStyle = C.white;
      g.fill();
    }
    face(g, 0, -120, 1.1, look.faceMood);
    g.beginPath();
    g.moveTo(-8, -112);
    g.lineTo(8, -112);
    g.lineTo(0, -101);
    g.closePath();
    fillStroke(g, C.carrot, 2.5);
  },
  frog(g, look) {
    plump(g, K.frog, K.frogLight, look);
    oval(g, 0, -112, 50, 36);
    fillStroke(g, K.frog);
    // Big eyes on top.
    for (const side of [-1, 1]) {
      circle(g, side * 24, -144, 16);
      fillStroke(g, K.frog);
      circle(g, side * 24, -144, 10);
      g.fillStyle = C.white;
      g.fill();
      if (look.faceMood === 'joy') {
        g.strokeStyle = C.ink;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(side * 24, -142, 5, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
      } else {
        circle(g, side * 24, -143, 5);
        g.fillStyle = C.ink;
        g.fill();
      }
    }
    g.fillStyle = 'rgba(255, 110, 160, 0.45)';
    oval(g, -30, -108, 8, 5);
    g.fill();
    oval(g, 30, -108, 8, 5);
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 3;
    g.beginPath();
    if (look.faceMood === 'wow') oval(g, 0, -104, 7, 8);
    else g.arc(0, -116, 18, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
  },
  elephant(g, look) {
    for (const side of [-1, 1]) {
      oval(g, side * 46, -118, 26, 33, side * 0.2);
      fillStroke(g, K.elephant);
      oval(g, side * 48, -118, 15, 21, side * 0.2);
      g.fillStyle = C.pink;
      g.fill();
    }
    plump(g, K.elephant, K.elephantLight, look);
    head(g, K.elephant);
    face(g, 0, -126, 1.1, look.faceMood);
    // The trunk, curling up at the end.
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0, -116);
    g.quadraticCurveTo(-4, -86, 12, -80);
    g.lineWidth = 17;
    g.strokeStyle = C.ink;
    g.stroke();
    g.lineWidth = 11;
    g.strokeStyle = K.elephant;
    g.stroke();
  },
  pig(g, look) {
    // A curly tail.
    g.strokeStyle = C.ink;
    g.lineWidth = 3.5;
    g.beginPath();
    g.arc(46, -40, 7, Math.PI, Math.PI * 2.6);
    g.stroke();
    plump(g, C.pink, K.pigLight, look, C.hotPink);
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 16, -152);
      g.lineTo(side * 40, -168);
      g.lineTo(side * 38, -138);
      g.closePath();
      fillStroke(g, C.pink);
    }
    head(g, C.pink);
    face(g, 0, -126, 1.1, look.faceMood);
    oval(g, 0, -106, 15, 10);
    fillStroke(g, K.pigLight, 3);
    for (const side of [-1, 1]) {
      oval(g, side * 5, -106, 2.4, 3.4);
      g.fillStyle = C.ink;
      g.fill();
    }
  },
  owl(g, look) {
    plump(g, C.wood, C.woodLight, look, C.carrot);
    triangleEars(g, C.woodDark, C.wood, 22, 22);
    head(g, C.wood);
    for (const side of [-1, 1]) {
      circle(g, side * 16, -122, 15);
      fillStroke(g, C.white, 3);
    }
    face(g, 0, -122, 1.25, look.faceMood);
    g.beginPath();
    g.moveTo(-6, -112);
    g.lineTo(6, -112);
    g.lineTo(0, -102);
    g.closePath();
    fillStroke(g, C.carrot, 2.5);
  },
  lobster(g, look) {
    drawLulu(g, 0, -84, 44, look.t * (look.mood === 'idle' ? 1 : 2));
  },
  king(g, look) {
    // A red cape with a white trim behind, then a lion with a crown.
    g.beginPath();
    g.moveTo(-34, -86);
    g.quadraticCurveTo(-62, -30, -54, -2);
    g.lineTo(54, -2);
    g.quadraticCurveTo(62, -30, 34, -86);
    g.closePath();
    fillStroke(g, vertical(g, -86, 0, [K.cape, K.capeDark]));
    plump(g, C.butter, C.cream, look, C.carrot);
    rounded(g, -44, -96, 88, 18, 9);
    fillStroke(g, C.white, 3);
    for (const dx of [-28, -10, 8, 26]) {
      circle(g, dx, -87, 2.5);
      g.fillStyle = C.ink;
      g.fill();
    }
    // The mane.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      circle(g, Math.cos(a) * 42, -118 + Math.sin(a) * 42, 16);
      fillStroke(g, i % 2 ? K.mane : C.carrot, 3);
    }
    head(g, C.butter, -118, 38);
    face(g, 0, -120, 1.1, look.faceMood);
    nose(g, 0, -112, C.carrotDark);
    // The crown.
    g.beginPath();
    g.moveTo(-28, -150);
    g.lineTo(-30, -186);
    g.lineTo(-14, -168);
    g.lineTo(0, -192);
    g.lineTo(14, -168);
    g.lineTo(30, -186);
    g.lineTo(28, -150);
    g.closePath();
    fillStroke(g, vertical(g, -192, -150, [C.butter, C.gold]), 3.5);
    for (const [dx, color] of [
      [-14, C.hotPink],
      [0, C.sky],
      [14, C.mint],
    ] as const) {
      circle(g, dx, -160, 4.5);
      fillStroke(g, color, 2);
    }
  },
  dragon(g, look) {
    // Wings and a tail behind.
    for (const side of [-1, 1]) {
      const flap = Math.sin(look.t * 4 + side) * 0.12;
      g.save();
      g.translate(side * 30, -78);
      g.rotate(side * (0.4 + flap));
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(side * 30, -64, side * 58, -54);
      g.quadraticCurveTo(side * 46, -30, side * 52, -12);
      g.quadraticCurveTo(side * 30, -10, 0, 12);
      g.closePath();
      fillStroke(g, C.lavender, 3.5);
      g.restore();
    }
    g.beginPath();
    g.moveTo(30, -20);
    g.quadraticCurveTo(70, -10, 76, -44);
    g.lineTo(86, -36);
    g.lineTo(80, -54);
    g.lineTo(66, -46);
    g.lineTo(72, -40);
    g.quadraticCurveTo(64, -24, 30, -36);
    g.closePath();
    fillStroke(g, K.dragon);
    plump(g, K.dragon, C.butter, look, K.dragonDark);
    // Little horns and spikes.
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 14, -154);
      g.lineTo(side * 24, -178);
      g.lineTo(side * 30, -150);
      g.closePath();
      fillStroke(g, C.butter, 3);
    }
    head(g, K.dragon);
    oval(g, 0, -106, 22, 14);
    g.fillStyle = C.butter;
    g.fill();
    face(g, 0, -126, 1.1, look.faceMood);
    for (const side of [-1, 1]) {
      circle(g, side * 6, -106, 2.2);
      g.fillStyle = C.ink;
      g.fill();
    }
    // A puff of happy smoke now and then: little hearts.
    const puff = (look.t * 0.7) % 3;
    if (puff < 1) {
      g.globalAlpha = 1 - puff;
      heartPath(g, 26 + puff * 30, -116 - puff * 40, 6 + puff * 4);
      fillStroke(g, C.pink, 2);
      g.globalAlpha = 1;
    }
  },
  grandma(g, look) {
    // A lavender shawl, then Lulu's grandma with her glasses and a lace cap.
    oval(g, 0, -30, 52, 34);
    fillStroke(g, C.lavender);
    drawLulu(g, 0, -84, 44, look.t * 0.8);
    const k = 44 / 28;
    g.strokeStyle = C.ink;
    g.lineWidth = 2.5;
    for (const side of [-1, 1]) {
      circle(g, side * 9 * k, -84 + 2.2, 7.5 * k);
      g.fillStyle = 'rgba(255, 255, 255, 0.35)';
      g.fill();
      g.stroke();
    }
    g.beginPath();
    g.moveTo(-1.5 * k, -82);
    g.lineTo(1.5 * k, -82);
    g.stroke();
    // A lace cap.
    for (let i = 0; i < 7; i++) {
      circle(g, -27 + i * 9, -118 - Math.sin((i / 6) * Math.PI) * 10, 7);
      fillStroke(g, C.white, 2.5);
    }
    // Pearls.
    for (let i = 0; i < 7; i++) {
      circle(g, -18 + i * 6, -50 + Math.sin((i / 6) * Math.PI) * 6, 3);
      fillStroke(g, C.cream, 1.5);
    }
  },
};

// ---------------------------------------------------------------------------
// Coins, the jar and the trophy

/** A carnival coin worth `value` (or a real coin the customer paid with). */
export function drawCoinDrop(g: G, drop: CoinDrop, x: number, y: number, r: number) {
  if (drop.kind !== 'carnival') {
    drawCoin(g, drop.kind, x, y, r, false, true);
    return;
  }
  circle(g, x, y, r);
  fillStroke(g, vertical(g, y - r, y + r, [C.butter, K.coin, K.coinDark]), Math.max(2, r * 0.12));
  circle(g, x, y, r * 0.78);
  g.strokeStyle = K.coinDark;
  g.lineWidth = Math.max(1.5, r * 0.08);
  g.stroke();
  plainText(g, String(drop.value), x, y + 1, r * 0.9, C.ink);
}

/**
 * The coin jar, its bottom-centre at (x, y), `fill` (0 to 1) how full. The
 * glass shows a pile of gold coins.
 */
export function drawJar(g: G, x: number, y: number, scale: number, fill: number, t: number) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.fillStyle = C.shadow;
  oval(g, 0, 2, 54, 8);
  g.fill();
  // The glass.
  rounded(g, -48, -112, 96, 112, 26);
  g.fillStyle = K.glass;
  g.fill();
  // Coins inside, piled up to `fill`.
  const level = 12 + clamp01(fill) * 80;
  g.save();
  rounded(g, -48, -112, 96, 112, 26);
  g.clip();
  g.fillStyle = vertical(g, -level, 0, [K.coin, K.coinDark]);
  g.fillRect(-50, -level, 100, level);
  for (let i = 0; i < 12; i++) {
    const cx = -34 + ((i * 23) % 70);
    const cy = -level + 6 + (i % 3) * 9;
    oval(g, cx, cy, 11, 5);
    fillStroke(g, C.butter, 2, K.coinDark);
  }
  g.restore();
  rounded(g, -48, -112, 96, 112, 26);
  g.lineWidth = 4;
  g.strokeStyle = C.ink;
  g.stroke();
  // A shine, and the lid.
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-32, -92);
  g.lineTo(-32, -40);
  g.stroke();
  rounded(g, -40, -126, 80, 18, 8);
  fillStroke(g, C.hotPink, 3.5);
  heartPath(g, 0, -117, 5 + Math.sin(t * 4) * 0.6);
  fillStroke(g, C.white, 2);
  g.restore();
}

/**
 * The golden trophy, centred on (x, y), about 170 tall at scale 1, with the
 * boss's emoji on its front. `shine` (0 to 1) sweeps a gleam across it.
 */
export function drawTrophy(
  g: G,
  x: number,
  y: number,
  scale: number,
  icon: string,
  t: number,
  shine = 0,
) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  const gold = vertical(g, -84, 30, [C.butter, C.gold, K.coinDark]);
  // Handles.
  for (const side of [-1, 1]) {
    circle(g, side * 58, -50, 20);
    g.lineWidth = 13;
    g.strokeStyle = C.ink;
    g.stroke();
    g.lineWidth = 7;
    g.strokeStyle = C.gold;
    g.stroke();
  }
  // The cup.
  g.beginPath();
  g.moveTo(-62, -84);
  g.lineTo(62, -84);
  g.quadraticCurveTo(60, 0, 0, 10);
  g.quadraticCurveTo(-60, 0, -62, -84);
  g.closePath();
  fillStroke(g, gold, 4.5);
  oval(g, 0, -84, 62, 10);
  fillStroke(g, C.butter, 4);
  // The stem and the base.
  rounded(g, -12, 8, 24, 30, 6);
  fillStroke(g, gold, 4);
  rounded(g, -44, 36, 88, 18, 8);
  fillStroke(g, gold, 4);
  rounded(g, -54, 52, 108, 26, 10);
  fillStroke(g, C.wood, 4);
  // The boss's badge on the front.
  circle(g, 0, -42, 24);
  fillStroke(g, C.white, 3);
  g.fillStyle = C.ink;
  emoji(g, icon, 0, -40, 28);
  starPath(g, 0, 65, 7, t);
  fillStroke(g, C.butter, 2);
  // A gleam sweeping across.
  if (shine > 0 && shine < 1) {
    g.save();
    g.beginPath();
    g.moveTo(-62, -84);
    g.lineTo(62, -84);
    g.quadraticCurveTo(60, 0, 0, 10);
    g.quadraticCurveTo(-60, 0, -62, -84);
    g.closePath();
    g.clip();
    const sx = -90 + shine * 180;
    g.fillStyle = 'rgba(255, 255, 255, 0.7)';
    g.beginPath();
    g.moveTo(sx, -90);
    g.lineTo(sx + 22, -90);
    g.lineTo(sx - 8, 12);
    g.lineTo(sx - 30, 12);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.restore();
}

/** A boss's emoji, for their trophy. */
export function trophyIcon(kind: GuestKind): string {
  return kind === 'king' ? '👑' : kind === 'dragon' ? '🐉' : kind === 'grandma' ? '🦞' : '⭐';
}

/** A trophy not won yet: a grey shape with a "?". */
export function drawTrophyShadow(g: G, x: number, y: number, scale: number) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.beginPath();
  g.moveTo(-62, -84);
  g.lineTo(62, -84);
  g.quadraticCurveTo(60, 0, 0, 10);
  g.quadraticCurveTo(-60, 0, -62, -84);
  g.closePath();
  fillStroke(g, C.lavenderLight, 4, C.lavender);
  rounded(g, -12, 8, 24, 30, 6);
  fillStroke(g, C.lavenderLight, 4, C.lavender);
  rounded(g, -54, 40, 108, 30, 10);
  fillStroke(g, C.lavenderLight, 4, C.lavender);
  stickerText(g, '?', 0, -38, 54, C.lavender);
  g.restore();
}

/** The coins in the jar, small in the HUD: "🪙 140". */
export function drawWallet(g: G, box: Box, amount: number, bump = 0) {
  g.save();
  g.translate(box.x + box.w / 2, box.y + box.h / 2);
  const s = 1 + 0.12 * Math.sin(clamp01(bump) * Math.PI);
  g.scale(s, s);
  rounded(g, -box.w / 2, -box.h / 2, box.w, box.h, box.h / 2);
  fillStroke(g, C.white, 3.5);
  const r = box.h * 0.36;
  drawCoinDrop(g, { value: 0, kind: 'carnival', why: 'star' }, -box.w / 2 + r + 6, 0, r);
  starPath(g, -box.w / 2 + r + 6, 0, r * 0.55);
  fillStroke(g, C.butter, 1.5);
  plainText(g, String(amount), (r * 2 + 6) / 2, 1, box.h * 0.62, C.hotPink);
  g.restore();
}

/**
 * A speech bubble, with its tail pointing at (tx, ty). Up to two lines: the
 * first big, the second smaller.
 */
export function drawSaying(
  g: G,
  box: Box,
  lines: readonly string[],
  tx: number,
  ty: number,
  first: string = C.hotPink,
) {
  const mid = box.x + box.w / 2;
  const base = Math.min(Math.max(tx, box.x + 40), box.x + box.w - 40);
  g.beginPath();
  g.moveTo(base - 18, box.y + box.h - 4);
  g.lineTo(tx, ty);
  g.lineTo(base + 18, box.y + box.h - 4);
  g.closePath();
  fillStroke(g, C.white, 3.5);
  rounded(g, box.x, box.y, box.w, box.h, 26);
  fillStroke(g, C.white, 3.5);
  g.fillStyle = C.white;
  g.fillRect(base - 15, box.y + box.h - 8, 30, 8);
  if (lines.length === 1) {
    stickerText(g, lines[0], mid, box.y + box.h / 2 + 2, 32, first, 'center', box.w - 30);
    return;
  }
  stickerText(g, lines[0], mid, box.y + box.h * 0.34, 30, first, 'center', box.w - 30);
  stickerText(g, lines[1], mid, box.y + box.h * 0.7, 26, C.purple, 'center', box.w - 30);
}

/**
 * A boss's order card: their three dishes in a row, numbered, with a tick on
 * the ones served and a glow round `next`.
 */
export function drawOrderCard(
  g: G,
  box: Box,
  dishes: readonly Dish[],
  served: number,
  next: number,
  t: number,
) {
  rounded(g, box.x, box.y, box.w, box.h, 28);
  fillStroke(g, C.cream, 4.5, C.hotPink);
  const n = dishes.length;
  const slot = (box.w - 24) / n;
  dishes.forEach((dish, i) => {
    const cx = box.x + 12 + slot * (i + 0.5);
    const cy = box.y + box.h / 2 + 4;
    const w = slot - 14;
    const h = box.h - 24;
    if (i === next) {
      g.strokeStyle = C.gold;
      g.lineWidth = 6;
      rounded(g, cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8, 22);
      g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
      g.stroke();
      g.globalAlpha = 1;
    }
    rounded(g, cx - w / 2, cy - h / 2, w, h, 18);
    fillStroke(g, i < served ? C.cabinetLight : C.white, 3);
    g.save();
    g.translate(cx, cy - 10);
    const s = Math.min(w / 250, (h - 30) / 170);
    g.scale(s, s);
    dish.draw(g, t, null);
    g.restore();
    stickerText(g, dish.name, cx, cy + h / 2 - 16, 16, C.purple, 'center', w - 8);
    circle(g, cx - w / 2 + 6, cy - h / 2 + 6, 15);
    fillStroke(g, C.hotPink, 3);
    plainText(g, String(i + 1), cx - w / 2 + 6, cy - h / 2 + 7, 17, C.white);
    if (i < served) {
      circle(g, cx + w / 2 - 8, cy - h / 2 + 8, 16);
      fillStroke(g, C.mint, 3);
      plainText(g, '✓', cx + w / 2 - 8, cy - h / 2 + 9, 20, C.ink);
    }
  });
}

/** A ribbon banner with big words on it. */
export function drawRibbon(g: G, box: Box, text: string) {
  rounded(g, box.x, box.y, box.w, box.h, box.h / 2);
  fillStroke(g, vertical(g, box.y, box.y + box.h, [C.purple, C.lavender]), 4);
  stickerText(g, text, box.x + box.w / 2, box.y + box.h / 2 + 2, 28, C.white, 'center', box.w - 30);
}

/** A name tag on a pill. */
export function drawTag(g: G, x: number, y: number, text: string, w = 280) {
  rounded(g, x - w / 2, y - 19, w, 38, 19);
  fillStroke(g, C.white, 3.5);
  stickerText(g, text, x, y + 1, 22, C.hotPink, 'center', w - 20);
}
