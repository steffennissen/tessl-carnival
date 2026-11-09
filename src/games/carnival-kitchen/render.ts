import {
  C,
  CONFETTI,
  type G,
  W,
  circle,
  clamp01,
  easeOutBack,
  emoji,
  fillStroke,
  font,
  heartPath,
  horizontal,
  oval,
  plainText,
  rounded,
  shadow,
  starPath,
  stickerText,
  vertical,
} from './art';
import { type BunnyPose, drawBunny } from './bunny';
import {
  type BunnyMood,
  blinking,
  createChef,
  earFlick,
  gaze,
  glancing,
  instructionStarted,
  isHolding,
  react,
  tickChef,
  type ChefEvent,
} from './chef';
import { type Box, bookButtonFor, bookPlaces, countLine, smartOf, starsOf, twoLines } from './book';
import {
  DECORATIONS,
  type DecorState,
  decorPlaces,
  drawDecoration,
  drawDecorations,
} from './decorate';
import { DISHES } from './dishes';
import {
  type StickerNews,
  cookingSteps,
  isLearning,
  liveScore,
  maxScore,
  ratingFor,
  starsFor,
  totalScore,
} from './game';
import { gearFor, grownupPlaces, optionBoxes } from './grownups';
import {
  FEEDBACK_TIME,
  bannerTime,
  clockText,
  currentRun,
  currentTurn,
  drawClock,
  drawSpeaker,
  drawWords,
  fitWords,
  roundTime,
  stepMinutes,
  wordNow,
  type LearnSettings,
  type Dish,
  type Effects,
  type Feedback,
  type KitchenState,
  type Particle,
  type Pointer,
  type StepRun,
  type StepView,
} from './kit';
import { type Layout, type Shape, layoutFor } from './layout';
import { NOTE, type Reading, type Sound } from './sound';
import { SPINNER_DISH, SPIN_TIME, drawSpinner, reelPosition, spinEnd, spinTime } from './spinner';
import { hintOf, iconOf, stepOf, titleOf } from './steps';

/**
 * Drawing for Carnival Kitchen: sticker-style art with soft ink outlines,
 * a pastel kitchen, Chef Bunny, particles and the end-of-round celebration.
 *
 * Each step draws itself (see steps/): this file draws everything around
 * it, and asks the step being cooked to draw on the scene.
 *
 * Nothing in here changes the game's state. It watches the state from frame
 * to frame to know when to play a sound or throw some sparkles, and each
 * step watches its own state the same way, with its `observe`.
 */

/** The big start button on the title screen. */
const START_BUTTON = { x: W / 2 + 40, y: 392, w: 300, h: 70 };

/** The sound and home buttons' radius on a computer; on a phone they're bigger (`buttonR`). */
const BUTTON_RADIUS = 24;

/** How much bigger the kitchen clock gets while its hands sweep on. */
const CLOCK_GROW = 1.08;

/** Seconds something Chef Bunny said stays in her bubble. */
const SAID_TIME = 2;

interface Spot {
  x: number;
  y: number;
}

interface Bubble {
  x: number;
  y: number;
  w: number;
  tail: 'down' | 'left';
}

/**
 * Where the things around the cooking go on the canvas, for a layout: the
 * buttons, score and recipe along the top, and Chef Bunny with her speech
 * bubble. Everything else is drawn on the scene.
 */
export function placesFor(layout: Layout) {
  const { width, height, sceneX: sx, sceneY: sy } = layout;
  if (layout.shape === 'tall') {
    // The buttons and score stay at the top; the recipe sits just above the
    // cooking and Chef Bunny just below it, whatever the screen's height.
    const bunnyY = Math.min(height - 150, sy + 635);
    // The dish being made: big on the wall between the score and the recipe
    // when there's room, or small between the buttons and the score.
    // (Below the buttons, which are big for a finger.)
    const below = 112;
    const room = sy - 24 - below;
    const badge: Box =
      room >= 60
        ? {
            x: width / 2 - Math.min(210, width / 2 - 50),
            y: below + (room - Math.min(room, 200)) / 2,
            w: Math.min(420, width - 100),
            h: Math.min(room, 200),
          }
        : { x: 254, y: 26, w: width - 254 - 180, h: 48 };
    // Big enough for a finger (60 CSS pixels on a phone), and well apart, so
    // a tap meant for the sound doesn't land on home.
    const buttonR = height >= 1000 ? 48 : 36;
    return {
      badge,
      buttonR,
      home: { x: 58, y: 54 } as Spot | null,
      sound: { x: 196, y: 54 },
      score: { x: width - 168, y: 28 },
      combo: { x: width / 2, y: sy + 75 },
      recipe: { x: width / 2, y: sy + 13 },
      bunny: { x: 92, y: bunnyY },
      speech: { x: 180, y: bunnyY - 86, w: width - 200, tail: 'left' } as Bubble,
      clock: tallClock(width, height, bunnyY),
      shelf: false,
    };
  }
  // On the page the scene is the whole canvas, and there's a back link above
  // it, so there's no home button. The dish being made sits in the kitchen
  // beside the scene when the screen is wide enough, above it when there's
  // room there, and otherwise in the strip above the recipe.
  const side = Math.min(220, sx - 20);
  const badge: Box =
    side >= 110
      ? { x: (sx - side) / 2, y: sy + 110, w: side, h: Math.min(240, side * 1.8) }
      : sy >= 90
        ? { x: sx + W / 2 - 180, y: (sy - 80) / 2, w: 360, h: 80 }
        : { x: sx + W / 2 - 165, y: sy + 4, w: 330, h: 40 };
  // The kitchen clock: beside the scene at the right when there's room
  // (the badge is at the left), or on the wall where the shelf would be.
  const clock =
    side >= 110
      ? { x: sx + W + sx / 2, y: sy + 200, r: Math.min(72, sx / 2 - 16) }
      : { x: sx + 742, y: sy + 196, r: 42 };
  // On a phone held sideways the buttons are 60 CSS pixels: home in the top
  // left corner, and the sound in the top right one when there's room
  // beside or above the scene, else beside home.
  const wide = layout.shape === 'wide';
  const buttonR = wide ? 40 : BUTTON_RADIUS;
  const roomRight = sx >= 100 || sy >= 100;
  return {
    clock,
    shelf: side >= 110,
    badge,
    buttonR,
    home: wide ? ({ x: 44, y: 46 } as Spot) : null,
    sound: wide
      ? roomRight
        ? { x: width - 50, y: 50 }
        : { x: sx + 125 - buttonR, y: 46 }
      : { x: sx + 40, y: sy + 80 },
    score: { x: sx + W - 168, y: sy + 58 },
    combo: { x: sx + W - 93, y: sy + 126 },
    recipe: { x: sx + W / 2, y: sy + 80 },
    bunny: { x: sx + 86, y: sy + 392 },
    speech: { x: sx + 12, y: sy + 230, w: 188, tail: 'down' } as Bubble,
  };
}

/**
 * The little "Leave the kitchen?" card a tap on 🏠 opens, in canvas units:
 * ✓ leaves, ✕ (or a tap anywhere else) stays. So a stray tap on 🏠 never
 * ends a round by itself. Its buttons are at least 60 CSS pixels on a phone.
 */
export function leavePlaces(layout: Layout) {
  const tall = layout.shape === 'tall';
  const w = Math.min(layout.width - 40, tall ? 520 : 480);
  const h = tall ? 300 : 250;
  const cx = layout.width / 2;
  const cy = tall ? layout.height * 0.4 : layout.height / 2;
  const r = tall ? 58 : 48;
  const box: Box = { x: cx - w / 2, y: cy - h / 2, w, h };
  return {
    box,
    title: { x: cx, y: box.y + (tall ? 58 : 48) },
    yes: { x: cx - w * 0.22, y: box.y + h - r - 34, r },
    no: { x: cx + w * 0.22, y: box.y + h - r - 34, r },
  };
}

/** How near the sound or home button a tap counts as on it. */
function hitRadius(places: ReturnType<typeof placesFor>): number {
  return places.buttonR + (places.buttonR > BUTTON_RADIUS ? 4 : 8);
}

/**
 * The step card's speaker button ("Read it myself"), in scene units: at the
 * card's lower left, and on a phone at least about 60 CSS pixels across.
 */
export function cardSpeakerAt(shape: Shape) {
  return { x: W / 2 - 200, y: 250 + 52, r: shape === 'tall' ? 48 : shape === 'wide' ? 40 : 28 };
}

/**
 * Whether the recipe along the top hides its steps' pictures: while she puts
 * the recipe in order (a `sequence` step), so it doesn't give the order away.
 */
export function recipeVeiled(state: KitchenState): boolean {
  return state.phase === 'playing' && currentRun(state).kind === 'sequence';
}

/**
 * The kitchen clock on a tall screen: in the drawers below Chef Bunny's
 * bubble, as big as the room there allows, beside her rather than over her.
 */
function tallClock(width: number, height: number, bunnyY: number) {
  const room = height - bunnyY;
  const r = Math.max(48, Math.min(140, room / 2 - 28));
  // Room for the rim, and for the clock growing a little while its hands move.
  const reach = r * CLOCK_GROW + 8;
  const x = room >= 260 ? width / 2 + 60 : width - reach;
  const y = Math.min(height - reach, bunnyY + Math.max(72, room / 2 + 10));
  return { x, y, r };
}

/** What the end of a round shows besides the round: decorating, and sticker news. */
export interface RoundEnd {
  decor: DecorState;
  sticker: StickerNews;
  /** Whether the round earned its dish's Smart Chef star. */
  smart: boolean;
}

// ---------------------------------------------------------------------------
// The kitchen behind everything, drawn once

/**
 * The kitchen, filling a canvas of any layout. The counter lines up with the
 * scene's counter, and the window and shelf sit where the scene expects them.
 */
function drawKitchen(g: G, layout: Layout) {
  const { width, height, sceneX } = layout;
  const counter = layout.sceneY + 338;

  // Wall, with a pattern of dots and little hearts.
  g.fillStyle = vertical(g, 0, counter + 2, [C.wallTop, C.wallBottom]);
  g.fillRect(0, 0, width, counter + 2);
  const rows = Math.floor((counter - 86) / 36) + 1;
  const cols = Math.ceil(width / 40) + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * 40 + (row % 2) * 20;
      const y = 60 + row * 36;
      if ((row + col) % 3 === 0) {
        g.fillStyle = 'rgba(255, 95, 162, 0.13)';
        heartPath(g, x, y, 6);
        g.fill();
      } else {
        g.fillStyle = 'rgba(255, 255, 255, 0.7)';
        circle(g, x, y, 2.6);
        g.fill();
      }
    }
  }

  // A window with a sunny sky, at the scene's left (or the canvas's, if the
  // scene is wider than the canvas).
  g.save();
  g.translate(Math.max(0, sceneX), counter - 338);
  rounded(g, 26, 112, 150, 108, 18);
  fillStroke(g, C.white);
  rounded(g, 36, 122, 130, 88, 12);
  fillStroke(g, vertical(g, 122, 210, [C.sky, C.skyLight]), 3);
  g.fillStyle = C.butter;
  circle(g, 140, 146, 14);
  g.fill();
  g.fillStyle = C.white;
  for (const [x, y, r] of [
    [62, 160, 11],
    [76, 154, 14],
    [92, 162, 10],
    [100, 190, 8],
    [112, 186, 11],
    [124, 192, 8],
  ]) {
    circle(g, x, y, r);
    g.fill();
  }
  g.strokeStyle = C.white;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(101, 122);
  g.lineTo(101, 210);
  g.moveTo(36, 166);
  g.lineTo(166, 166);
  g.stroke();
  for (const side of [-1, 1]) {
    const x = side < 0 ? 22 : 180;
    g.beginPath();
    g.moveTo(x, 104);
    g.lineTo(x + side * -46, 104);
    g.quadraticCurveTo(x + side * -18, 150, x + side * -6, 226);
    g.lineTo(x, 226);
    g.closePath();
    fillStroke(g, C.pink, 3.5);
  }
  rounded(g, 12, 98, 178, 12, 6);
  fillStroke(g, C.hotPink, 3.5);
  g.restore();

  // A shelf with jars and a little plant, at the scene's right, unless the
  // kitchen clock hangs there. A tall canvas leaves it out: the meters and
  // the plate stand there.
  if (placesFor(layout).shelf) drawShelf(g, sceneX, counter - 338);

  // The counter top and the cabinets below it.
  g.fillStyle = vertical(g, counter, counter + 92, [C.counterTop, C.cream]);
  g.fillRect(0, counter, width, 92);
  g.strokeStyle = C.ink;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, counter);
  g.lineTo(width, counter);
  g.stroke();
  rounded(g, -10, counter + 86, width + 20, 16, 8);
  fillStroke(g, C.counterEdge);
  g.fillStyle = C.cabinet;
  g.fillRect(0, counter + 102, width, height - counter - 102);
  const doors = Math.max(1, Math.round(width / 197));
  const left = (width - (doors * 197 - 16)) / 2;
  for (let y = counter + 114; y < height; y += 84) {
    for (let i = 0; i < doors; i++) {
      const x = left + i * 197;
      rounded(g, x, y, 181, 70, 14);
      fillStroke(g, C.cabinetLight, 3.5);
      heartPath(g, x + 90.5, y + 14, 6);
      fillStroke(g, C.hotPink, 2.5);
    }
  }

  // Bunting along the top.
  const sag = (x: number) => 10 + Math.sin((Math.PI * x) / width) * 22;
  g.strokeStyle = C.ink;
  g.lineWidth = 2.5;
  g.beginPath();
  for (let x = 0; x <= width; x += 10) g.lineTo(x, sag(x));
  g.stroke();
  const flags = [C.hotPink, C.butter, C.mint, C.sky, C.lavender];
  const count = Math.round((width - 25) / 47.5) + 1;
  const step = (width - 50) / (count - 1);
  for (let i = 0; i < count; i++) {
    const x = 25 + i * step;
    const y = sag(x);
    g.beginPath();
    g.moveTo(x - 17, y);
    g.lineTo(x + 17, sag(x + 17));
    g.lineTo(x, y + 32);
    g.closePath();
    fillStroke(g, flags[i % flags.length], 3);
  }
}

function drawShelf(g: G, dx: number, dy: number) {
  g.save();
  g.translate(dx, dy);
  rounded(g, 664, 198, 128, 14, 6);
  fillStroke(g, C.wood, 3.5);
  rounded(g, 676, 152, 34, 46, 10);
  fillStroke(g, C.mint, 3.5);
  rounded(g, 672, 144, 42, 12, 5);
  fillStroke(g, C.hotPink, 3);
  heartPath(g, 693, 175, 7);
  fillStroke(g, C.white, 2);
  rounded(g, 718, 162, 30, 36, 9);
  fillStroke(g, C.butter, 3.5);
  rounded(g, 715, 155, 36, 10, 5);
  fillStroke(g, C.lavender, 3);
  starPath(g, 733, 181, 7);
  fillStroke(g, C.white, 2);
  for (const [x, y, rot] of [
    [764, 150, -0.6],
    [776, 144, 0],
    [788, 150, 0.6],
  ]) {
    oval(g, x, y, 6, 13, rot);
    fillStroke(g, C.leaf, 3);
  }
  g.beginPath();
  g.moveTo(760, 166);
  g.lineTo(792, 166);
  g.lineTo(787, 198);
  g.lineTo(765, 198);
  g.closePath();
  fillStroke(g, C.hotPink, 3.5);
  g.restore();
}

/**
 * A plate under a shiny lid with a big "?" on it, for the title screen. The
 * lid wobbles and now and then peeks open a crack, with a puff of steam, but
 * never shows what's inside: the kitchen picks the dish when you tap.
 */
function drawMysteryDish(g: G, x: number, y: number, t: number) {
  // The plate.
  shadow(g, x, y + 16, 140, 14);
  oval(g, x, y, 132, 24);
  fillStroke(g, C.white);
  oval(g, x, y - 2, 108, 15);
  g.strokeStyle = C.sky;
  g.lineWidth = 3;
  g.stroke();

  // Every 3 seconds the lid lifts a little, then settles.
  const cycle = t % 3;
  const peek = cycle > 2.2 ? Math.sin(((cycle - 2.2) / 0.8) * Math.PI) : 0;
  const lift = peek * 16;
  const wobble = Math.sin(t * 2.4) * 0.03 + peek * 0.08;

  // Steam and sparkles escaping through the crack.
  if (peek > 0) {
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = `rgba(255, 255, 255, ${0.9 * peek})`;
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      for (let k = 0; k <= 6; k++) {
        g.lineTo(x + 70 + i * 16 + Math.sin(k + t * 6 + i) * 4, y - 10 - k * 6 - peek * 10);
      }
      g.stroke();
    }
    starPath(g, x - 104, y - 20 - peek * 14, 9 * peek, t);
    fillStroke(g, C.gold, 2.5);
  }

  g.save();
  g.translate(x + 110, y - 4 - lift);
  g.rotate(-wobble);
  g.translate(-110, 0);
  // The dome.
  g.beginPath();
  g.ellipse(0, 0, 112, 104, 0, Math.PI, 0);
  g.closePath();
  fillStroke(g, vertical(g, -104, 0, [C.white, C.steel, C.steelDark]), 4);
  // A pink band with hearts round its rim.
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 112, 104, 0, Math.PI, 0);
  g.closePath();
  g.clip();
  g.fillStyle = C.pink;
  g.fillRect(-120, -26, 240, 26);
  g.restore();
  g.strokeStyle = C.ink;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-109, -26);
  g.lineTo(109, -26);
  g.stroke();
  for (const hx of [-70, 0, 70]) {
    heartPath(g, hx, -15, 6);
    fillStroke(g, C.white, 2);
  }
  // A shine, and the knob on top.
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(0, 0, 86, 80, 0, Math.PI * 1.18, Math.PI * 1.38);
  g.stroke();
  circle(g, 0, -114, 13);
  fillStroke(g, C.hotPink, 3.5);
  rounded(g, -14, -108, 28, 8, 4);
  fillStroke(g, C.hotPink, 3);
  // The question.
  stickerText(g, '?', 0, -58 + Math.sin(t * 4) * 3, 56, C.hotPink);
  // The rim, tilting with the dome as it lifts.
  oval(g, 0, 0, 114, 9);
  fillStroke(g, C.steelDark, 3.5);
  g.restore();
}

/**
 * Chef Bunny's speech bubble. Above her head it points down; beside her (in
 * the tall layout) it points left, and the words are bigger.
 */
function drawSpeech(g: G, lines: [string, string] | [string], bubble: Bubble) {
  const { x, y, w, tail } = bubble;
  const h = 82;
  rounded(g, x, y, w, h, 20);
  fillStroke(g, C.white, 3.5);
  // The tail: three points, then the same two edges again in ink, so the
  // bubble's outline stays open where the tail joins it.
  const points: [number, number][] =
    tail === 'down'
      ? [
          [x + 60, y + h - 4],
          [x + 72, y + h + 22],
          [x + 86, y + h - 4],
        ]
      : [
          [x + 4, y + 26],
          [x - 22, y + 52],
          [x + 4, y + 50],
        ];
  g.beginPath();
  for (const [px, py] of points) g.lineTo(px, py);
  g.fillStyle = C.white;
  g.fill();
  const inset = tail === 'down' ? [0, 3.5] : [-3.5, 0];
  g.strokeStyle = C.ink;
  g.lineWidth = 3.5;
  g.beginPath();
  points.forEach(([px, py], i) => {
    const edge = i !== 1;
    g.lineTo(px + (edge ? inset[0] : 0), py + (edge ? inset[1] : 0));
  });
  g.stroke();
  const size = tail === 'down' ? 16 : 22;
  if (lines.length === 1) {
    // Something she said herself, big and pink, shrunk to fit.
    g.font = font(size * 1.3);
    const fit = Math.min(1, (w - 24) / Math.max(1, g.measureText(lines[0]).width));
    plainText(g, lines[0], x + w / 2, y + 41, size * 1.3 * fit, C.hotPink);
    return;
  }
  plainText(g, lines[0], x + w / 2, y + 27, size, C.ink);
  plainText(g, lines[1], x + w / 2, y + 54, size, C.hotPink);
}

/**
 * The dish being made, on a little card: its finished picture and its name.
 * A tall card has the picture on top; a short one has it on the left.
 * `wiggle` (0 to 1) gives it a shake when it's tapped.
 */
function drawBadge(g: G, dish: Dish, box: Box, t: number, wiggle: number) {
  const { x, y, w, h } = box;
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(Math.sin(wiggle * 18) * 0.06 * wiggle);
  g.translate(-w / 2, -h / 2);
  rounded(g, 0, 0, w, h, Math.min(22, h / 2));
  fillStroke(g, C.white, 3.5, C.ink);
  g.save();
  rounded(g, 0, 0, w, h, Math.min(22, h / 2));
  g.clip();
  const tall = h >= 100;
  // A tall card's name goes on as many lines as it needs, up to three.
  // At least 18 units, so it's readable on a phone held sideways (about 14 CSS pixels).
  const name = tall ? wrapName(g, dish.name, w - 12, badgeNameSize(w), 4) : null;
  const nameHeight = name ? name.lines.length * name.size * 1.15 + 12 : 0;
  // The picture's space, and the name's.
  const art = tall
    ? { x: w / 2, y: (h - nameHeight) / 2 + 2, w: w - 16, h: h - nameHeight - 8 }
    : { x: 8 + ((h - 6) * 1.5) / 2, y: h / 2, w: (h - 6) * 1.5, h: h - 6 };
  const scale = Math.min(art.w / 250, art.h / 170);
  g.translate(art.x, art.y);
  g.scale(scale, scale);
  dish.draw(g, t, null);
  g.restore();
  if (name) {
    name.lines.forEach((line, i) => {
      const y = h - nameHeight + 6 + (i + 0.5) * name.size * 1.15;
      stickerText(g, line, w / 2, y, name.size, C.hotPink, 'center', w - 10);
    });
  } else {
    // A short card's name goes beside the picture, on two lines if it's tall enough.
    const left = 8 + art.w + 4;
    const room = w - 8 - left;
    const beside = wrapName(g, dish.name, room, Math.min(26, h * 0.5), h >= 60 ? 2 : 1);
    beside.lines.forEach((line, i) => {
      const y = h / 2 + 1 + (i - (beside.lines.length - 1) / 2) * beside.size * 1.15;
      stickerText(g, line, (left + w - 8) / 2, y, beside.size, C.hotPink, 'center', room);
    });
  }
  g.restore();
}

/** The biggest size a tall badge's name may be, for a badge `w` wide. */
export function badgeNameSize(w: number): number {
  return Math.min(24, Math.max(18, w / 8));
}

/**
 * Splits a name into lines no wider than `width`, at the biggest size up to
 * `size` that needs `most` lines at most.
 */
export function wrapName(g: G, text: string, width: number, size: number, most = 3) {
  const words = text.split(' ');
  let lines: string[] = [text];
  for (let s = size; s >= 10; s -= 1) {
    g.font = font(s);
    lines = [];
    for (const word of words) {
      const last = lines[lines.length - 1];
      const joined = last === undefined ? word : `${last} ${word}`;
      if (last !== undefined && g.measureText(joined).width + s * 0.3 > width) lines.push(word);
      else lines[Math.max(0, lines.length - 1)] = joined;
    }
    const fits = lines.every((line) => g.measureText(line).width + s * 0.3 <= width);
    if (lines.length <= most && fits) return { lines, size: s };
  }
  return { lines, size: 10 };
}

// ---------------------------------------------------------------------------
// The renderer

export function createRenderer(ctx: G, voice: Sound) {
  // Everything said out loud (by the renderer or a step) is counted, so
  // Chef Bunny's chatter can wait for the end of the frame and stay quiet
  // when an instruction was said in the meantime, instead of starting and
  // being cut off at once.
  let spoken = 0;
  const sound: Sound = new Proxy(voice, {
    get(target, prop) {
      if (prop === 'say' || prop === 'read') {
        return (text: string) => {
          spoken += 1;
          return prop === 'say' ? target.say(text) : target.read(text);
        };
      }
      return Reflect.get(target, prop) as unknown;
    },
  });
  /** Chatter waiting for the end of the frame, and how much had been said when it was asked for. */
  let waiting: { line: string; spoken: number; show: boolean } | null = null;
  let kitchen: HTMLCanvasElement | null = null;
  let layout = layoutFor(0, 0, false);
  let places = placesFor(layout);
  // Canvas pixels per canvas unit, so the art is sharp on high-density screens.
  let pixels = 1;

  /** Draws in canvas units, ignoring the scene's offset. */
  function onCanvas(paint: () => void) {
    ctx.save();
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
    paint();
    ctx.restore();
  }

  /** Dims the whole canvas behind a card. */
  function dim(alpha: number) {
    onCanvas(() => {
      ctx.fillStyle = `rgba(91, 59, 79, ${alpha})`;
      ctx.fillRect(0, 0, layout.width, layout.height);
    });
  }

  /** The kitchen behind everything, then the scene's offset for the rest. */
  function begin() {
    if (!kitchen) kitchen = paintKitchen(layout, pixels);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(kitchen, 0, 0);
    ctx.setTransform(pixels, 0, 0, pixels, layout.sceneX * pixels, layout.sceneY * pixels);
  }

  // -------------------------------------------------------------------------
  // Chef Bunny: chef.ts decides how she feels, bunny.ts draws her.

  /** Where she looks: what just happened, the pointer, or now and then at you. */
  function lookTarget(): Spot | null {
    const focus = fx.focus;
    if (focus && focus.age < 1.5) return focus;
    if (glancing(fx.chef)) return null;
    if (fx.pointer) {
      return { x: fx.pointer.x + layout.sceneX, y: fx.pointer.y + layout.sceneY };
    }
    return null;
  }

  function bunny(mood?: BunnyMood, age?: number) {
    const chef = fx.chef;
    const at = places.bunny;
    const target = lookTarget();
    const look = target ? gaze({ x: at.x, y: at.y + 4 }, target, 3.2) : { x: 0, y: 0.6 };
    const ease = Math.min(1, fx.dt * 10);
    fx.look.x += (look.x - fx.look.x) * ease;
    fx.look.y += (look.y - fx.look.y) * ease;
    // She leans toward the cooking: right, unless what she's looking at is left of her.
    const side = target && target.x < at.x - 20 ? -1 : 1;
    const pose: BunnyPose = {
      mood: mood ?? chef.mood,
      age: age ?? chef.moodAge,
      t: fx.time,
      blink: blinking(chef),
      ear: earFlick(chef),
      look: fx.look,
      lean: chef.lean * side,
    };
    onCanvas(() => drawBunny(ctx, at, pose));
  }

  /**
   * Chef Bunny reacts to something at (x, y) on the scene, and may say a
   * line about it: only while the step is taking input and the voice is free,
   * so she never talks over an instruction.
   */
  function chefReacts(event: ChefEvent, x: number, y: number) {
    const state = fx.seen;
    fx.focus = { x: x + layout.sceneX, y: y + layout.sceneY, age: 0 };
    const open = !!state && state.phase === 'playing' && state.banner === 0;
    const line = react(fx.chef, event, fx.time, open);
    if (fx.chef.mood === 'party' && fx.chef.moodAge === 0) {
      // A milestone streak: she jumps for joy in a shower of stars.
      burst(
        places.bunny.x - layout.sceneX,
        places.bunny.y - layout.sceneY - 20,
        16,
        ['star', 'heart', 'star'],
        [C.gold, C.hotPink, C.butter, C.white],
        280,
      );
      sound.chime([NOTE.G6, NOTE.C7, NOTE.G6, NOTE.C7], 0.09, 0.08);
    }
    // Only a cheer goes in her bubble: after "Not yet!" or while holding,
    // the bubble keeps the step's instruction.
    if (event.kind === 'not yet') fx.said = null;
    if (line) waiting = { line, spoken, show: event.kind === 'hit' };
  }

  /** Says the frame's chatter, unless something else was said since it was asked for. */
  function flushChatter() {
    const w = waiting;
    waiting = null;
    if (!w || w.spoken !== spoken) return;
    if (sound.chatter(w.line) && w.show) fx.said = { text: w.line, age: 0 };
  }

  const fresh = () => ({
    time: 0,
    particles: [] as Particle[],
    seen: null as KitchenState | null,
    stepIndex: -1,
    feedback: null as Feedback | null,
    /** Each step's own effect memory, from its `fx`. */
    runs: new Map<StepRun, unknown>(),
    chef: createChef(),
    /** What she said on her own, shown in her bubble for a moment. */
    said: null as { text: string; age: number } | null,
    /** Where something just happened, in canvas units, for her to look at. */
    focus: null as { x: number; y: number; age: number } | null,
    pointer: null as Pointer | null,
    look: { x: 0, y: 0 },
    dt: 0,
    overAge: -1,
    /** Seconds since decorating started, or -1 before it. */
    decorAge: -1,
    stickerShown: false,
    starsPlayed: 0,
    shownScore: 0,
    notYet: null as { x: number; y: number; age: number } | null,
    /** The time the kitchen clock shows: it sweeps on to the round's time. */
    clock: null as number | null,
    smartShown: false,
  });
  let fx = fresh();

  /** A step's card being read out by its speaker ("Read it myself"), or null. */
  let card: { reading: Reading; state: KitchenState; index: number } | null = null;
  /** Whether the card on screen is being read out. */
  const cardReading = () =>
    !!card &&
    card.state === fx.seen &&
    card.index === card.state.stepIndex &&
    card.state.banner > 0 &&
    !card.reading.done();

  /** The dish spinner while it runs (see spinner.ts), or null. */
  let spin: {
    dish: Dish;
    start: number;
    end: number;
    age: number;
    pos: number;
    ticked: number;
    tickAge: number;
    landed: boolean;
  } | null = null;
  /** The dish the spinner already said "Let's make..." for. */
  let announced: Dish | null = null;
  /**
   * Where the spinner goes on the canvas: on the scene, or bigger on a tall
   * screen, in the space above Chef Bunny. `x`, `y` is its middle.
   */
  function spinnerSpot() {
    if (layout.shape !== 'tall') {
      return { x: layout.sceneX + W / 2, y: layout.sceneY + 250, scale: 1 };
    }
    const top = 90;
    const bottom = places.bunny.y - 84;
    const scale = Math.min((layout.width - 70) / 380, (bottom - top) / 430);
    return { x: layout.width / 2, y: (top + bottom) / 2, scale };
  }

  /** Seconds since the dish badge was tapped. */
  let badgeAge = 9;

  /** Seconds the "Leave the kitchen?" card has been up, or -1 when it isn't. */
  let leaveAge = -1;

  /** The "Leave the kitchen?" card, over everything. */
  function drawLeave(dt: number) {
    if (leaveAge < 0) return;
    leaveAge += dt;
    const g = ctx;
    const p = leavePlaces(layout);
    const pop = easeOutBack(clamp01(leaveAge / 0.3));
    dim(0.35);
    onCanvas(() => {
      const { box } = p;
      g.translate(box.x + box.w / 2, box.y + box.h / 2);
      g.scale(pop, pop);
      g.translate(-(box.x + box.w / 2), -(box.y + box.h / 2));
      rounded(g, box.x, box.y, box.w, box.h, 36);
      fillStroke(g, C.cream, 5, C.hotPink);
      emoji(g, '🏠', box.x + 46, p.title.y, 34);
      stickerText(
        g,
        'Leave the kitchen?',
        p.title.x + 20,
        p.title.y,
        34,
        C.hotPink,
        'center',
        box.w - 110,
      );
      const buttons: [typeof p.yes, string, string][] = [
        [p.yes, '✓', C.mint],
        [p.no, '✕', C.pink],
      ];
      for (const [b, mark, fill] of buttons) {
        circle(g, b.x, b.y, b.r);
        fillStroke(g, fill, 4);
        plainText(g, mark, b.x, b.y + 2, b.r * 1.1, C.ink);
      }
    });
  }

  const burst: Effects['burst'] = (x, y, count, shapes, colors, speed = 220, gravity = 380) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      const max = 0.6 + Math.random() * 0.5;
      fx.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.5,
        gravity,
        life: max,
        max,
        size: 6 + Math.random() * 7,
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  };

  function celebrate(x: number, y: number, feedback: Feedback) {
    const counts = { 'Perfect!': 20, 'Great!': 13, 'Good!': 8, 'Nice try!': 5 };
    const shapes: Particle['shape'][] =
      feedback.grade === 'Nice try!' ? ['heart'] : ['star', 'heart', 'star', 'dot'];
    burst(x, y, counts[feedback.grade], shapes, CONFETTI);
    chefReacts({ kind: 'hit', grade: feedback.grade, combo: feedback.combo }, x, y);
  }

  /** What steps can set off: sounds, sparkles, and Chef Bunny's mood. */
  const effects: Effects = {
    sound,
    celebrate(x, y, feedback) {
      const shown = feedback === undefined ? fx.seen?.feedback : feedback;
      if (shown) celebrate(x, y, shown);
    },
    burst,
    add(particle) {
      fx.particles.push(particle);
    },
    calm() {
      fx.chef.mood = 'idle';
    },
  };

  /** What a step's `observe` and `draw` get for one of the round's steps. */
  function viewFor(state: KitchenState, run: StepRun, pointer: Pointer, dt: number): StepView {
    if (!fx.runs.has(run)) fx.runs.set(run, stepOf(run.kind).fx?.());
    return {
      round: state,
      options: run.options,
      state: run.state,
      g: ctx,
      t: fx.time,
      dt,
      pointer,
      taking: state.phase === 'playing' && state.banner === 0,
      shape: layout.shape,
      fx: fx.runs.get(run),
      fxOf: <T>(other: StepRun) => fx.runs.get(other) as T | undefined,
      effects,
    };
  }

  /** Watches the state for things that just happened. */
  function observe(state: KitchenState, pointer: Pointer, dt: number, end: RoundEnd) {
    if (fx.seen !== state) {
      const keep = fx.particles;
      fx = fresh();
      fx.particles = keep;
      fx.seen = state;
    }

    if (state.phase === 'playing' && state.stepIndex !== fx.stepIndex) {
      fx.stepIndex = state.stepIndex;
      const run = currentRun(state);
      sound.banner();
      // The first step also says what we're making, unless the spinner did.
      // Read it myself: the card waits for its speaker to be tapped.
      const intro =
        state.stepIndex === 0 && announced !== state.dish ? `Let's make ${state.dish.name}! ` : '';
      if (!state.learn.settings.readMyself) {
        sound.say(`${intro}${titleOf(run)} ${hintOf(run).join(' ')}`);
      }
      instructionStarted(fx.chef, fx.time);
      fx.said = null;
    }

    if (state.feedback && state.feedback !== fx.feedback) {
      sound.grade(state.feedback.grade, state.feedback.combo);
    }
    fx.feedback = state.feedback;

    // Every step that has started watches its own state, to the end of the
    // round, so effects that outlast a step (an egg still falling) finish.
    for (let i = 0; i <= state.stepIndex; i++) {
      const run = state.steps[i];
      stepOf(run.kind).observe?.(viewFor(state, run, pointer, dt));
    }

    // Decorating comes first, then the stars.
    if (state.phase === 'over' && !end.decor.done) {
      if (fx.decorAge < 0) {
        fx.decorAge = 0;
        sound.banner();
        sound.say('Decorate your dish! Drag the treats onto it.');
      }
      fx.decorAge += dt;
    }

    if (state.phase === 'over' && end.decor.done) {
      if (fx.overAge < 0) {
        fx.overAge = 0;
        sound.fanfare();
        const dish = state.dish.name;
        const news =
          end.sticker === 'new'
            ? ' A new sticker for your recipe book!'
            : end.sticker === 'better'
              ? ' Your sticker got more stars!'
              : '';
        const times = ` You started at ${clockText(state.start)} and finished at ${clockText(roundTime(state))}!`;
        const smartLine = end.smart ? ' You are a Smart Chef!' : '';
        sound.say(
          `${ratingFor(totalScore(state), maxScore(state))} You made ${dish}!${times}${news}${smartLine}`,
        );
      }
      fx.overAge += dt;
      fx.chef.mood = 'cheer';
      const stars = starsFor(totalScore(state), maxScore(state));
      while (fx.starsPlayed < 3 && fx.overAge >= 0.9 + fx.starsPlayed * 0.45) {
        if (fx.starsPlayed < stars) {
          sound.star(fx.starsPlayed);
          burst(
            400 + (fx.starsPlayed - 1) * 90,
            305,
            10,
            ['star', 'dot'],
            [C.gold, C.butter, C.white],
            200,
          );
        }
        fx.starsPlayed += 1;
      }
      if (fx.overAge < 3 && Math.random() < 0.6) {
        fx.particles.push({
          x: Math.random() * W,
          y: -10,
          vx: (Math.random() - 0.5) * 60,
          vy: 90 + Math.random() * 80,
          gravity: 40,
          life: 4,
          max: 4,
          size: 9,
          color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
          shape: 'confetti',
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 10,
        });
      }
    }
  }

  /** Advances the effects by `dt` seconds; `holding` is whether a hold-style step is held. */
  function update(dt: number, holding = false) {
    fx.time += dt;
    fx.dt = dt;
    tickChef(fx.chef, dt, holding);
    if (fx.focus) fx.focus.age += dt;
    if (fx.said) {
      fx.said.age += dt;
      if (fx.said.age > SAID_TIME) fx.said = null;
    }
    badgeAge += dt;
    if (fx.notYet) fx.notYet.age += dt;
    for (const p of fx.particles) {
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      p.life -= dt;
    }
    fx.particles = fx.particles.filter(
      (p) => p.life > 0 && p.y < layout.height - layout.sceneY + 30,
    );
  }

  // -------------------------------------------------------------------------
  // Overlays

  /** The sound button, and the home button when the game fills the screen. */
  function drawButtons() {
    const g = ctx;
    onCanvas(() => {
      const buttons: [Spot, string][] = [[places.sound, sound.muted ? '🔇' : '🔊']];
      if (places.home) buttons.push([places.home, '🏠']);
      const r = places.buttonR;
      for (const [spot, icon] of buttons) {
        circle(g, spot.x, spot.y, r);
        fillStroke(g, C.white, 3.5);
        g.fillStyle = C.ink;
        emoji(g, icon, spot.x, spot.y + 1, r * 0.92);
      }
    });
  }

  function drawHud(state: KitchenState) {
    if (state.phase === 'playing') {
      onCanvas(() =>
        drawBadge(ctx, state.dish, places.badge, fx.time, clamp01(1 - badgeAge / 0.6)),
      );
    }
    drawButtons();
    onCanvas(() => drawTopBar(state));
    drawProgress(state);
  }

  /** The recipe, the score and the streak, in canvas units. */
  function drawTopBar(state: KitchenState) {
    const g = ctx;
    const t = fx.time;

    // The recipe: one bubble per cooking step (learning steps aren't in it),
    // each a question mark while she puts the recipe in order.
    const cooking = cookingSteps(state);
    const n = cooking.length;
    const veiled = recipeVeiled(state);
    cooking.forEach((i, k) => {
      const run = state.steps[i];
      const x = places.recipe.x + (k - (n - 1) / 2) * 78;
      const y = places.recipe.y;
      const done = i < state.stepIndex || state.phase === 'over';
      const current = i === state.stepIndex && state.phase === 'playing';
      if (k < n - 1) {
        g.strokeStyle = done ? C.mint : 'rgba(255, 255, 255, 0.9)';
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(x + 26, y);
        g.lineTo(x + 52, y);
        g.stroke();
      }
      if (current) {
        g.strokeStyle = C.gold;
        g.lineWidth = 5;
        circle(g, x, y, 31 + Math.sin(t * 5) * 2);
        g.stroke();
      }
      circle(g, x, y, 25);
      fillStroke(g, done ? C.mint : current ? C.white : 'rgba(255, 255, 255, 0.6)', 3.5);
      g.globalAlpha = done || current ? 1 : 0.55;
      if (veiled) plainText(g, '?', x, y + 1, 30, C.purple);
      else {
        g.fillStyle = C.ink;
        emoji(g, iconOf(run), x, y + 2, 26);
      }
      g.globalAlpha = 1;
      if (done) {
        circle(g, x + 18, y - 18, 10);
        fillStroke(g, C.hotPink, 3);
        g.strokeStyle = C.white;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x + 13, y - 18);
        g.lineTo(x + 17, y - 14);
        g.lineTo(x + 23, y - 22);
        g.stroke();
      }
    });

    // Score, counting up.
    const { x: sx, y: sy } = places.score;
    rounded(g, sx, sy, 150, 44, 22);
    fillStroke(g, C.white, 3.5);
    g.fillStyle = C.ink;
    emoji(g, '⭐', sx + 28, sy + 23, 24);
    plainText(g, String(Math.round(fx.shownScore)), sx + 86, sy + 23, 26, C.hotPink);

    if (state.combo >= 2 && state.phase === 'playing') {
      const pulse = 1 + Math.sin(t * 8) * 0.04;
      g.save();
      g.translate(places.combo.x, places.combo.y);
      g.scale(pulse, pulse);
      rounded(g, -75, -16, 150, 32, 16);
      fillStroke(g, C.hotPink, 3);
      plainText(g, `✨ ${state.combo} in a row!`, 0, 1, 16, C.white);
      g.restore();
    }
  }

  /** The stars for this step's actions, under the cooking. */
  function drawProgress(state: KitchenState) {
    const g = ctx;
    if (state.phase === 'playing') {
      const [total, done] = stepOf(currentRun(state).kind).progress(currentTurn(state));
      const width = total * 30;
      rounded(g, W / 2 - width / 2 - 12, 468, width + 24, 30, 15);
      fillStroke(g, C.white, 3);
      for (let i = 0; i < total; i++) {
        const x = W / 2 - width / 2 + 15 + i * 30;
        if (i < done) {
          starPath(g, x, 483, 11);
          fillStroke(g, C.gold, 2.5);
        } else {
          circle(g, x, 483, 6);
          fillStroke(g, C.lavenderLight, 2.5);
        }
      }
    }
  }

  function drawNotYet() {
    const n = fx.notYet;
    if (!n) return;
    if (n.age > 0.8) {
      fx.notYet = null;
      return;
    }
    const g = ctx;
    const wobble = Math.sin(n.age * 30) * 0.12 * (1 - n.age / 0.8);
    g.globalAlpha = clamp01((0.8 - n.age) / 0.3);
    g.save();
    // Kept on the canvas, which can be narrower than the scene.
    const left = Math.max(90, 90 - layout.sceneX);
    const right = Math.min(W - 90, layout.width - layout.sceneX - 90);
    g.translate(Math.min(right, Math.max(left, n.x)), Math.max(40, n.y - 40 - n.age * 20));
    g.rotate(wobble);
    stickerText(g, 'Not yet!', 0, 0, 26, C.skyDark);
    g.restore();
    g.globalAlpha = 1;
  }

  function drawParticles() {
    const g = ctx;
    for (const p of fx.particles) {
      g.globalAlpha = clamp01((p.life / p.max) * 2);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      if (p.shape === 'star') {
        starPath(g, 0, 0, p.size);
        fillStroke(g, p.color, 2);
      } else if (p.shape === 'heart') {
        heartPath(g, 0, 0, p.size * 0.7);
        fillStroke(g, p.color, 2);
      } else if (p.shape === 'dot') {
        circle(g, 0, 0, p.size * 0.45);
        fillStroke(g, p.color, 2);
      } else if (p.shape === 'confetti') {
        g.fillStyle = p.color;
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'shell') {
        g.beginPath();
        g.moveTo(-p.size / 2, p.size / 3);
        g.lineTo(0, -p.size / 2);
        g.lineTo(p.size / 2, p.size / 3);
        g.closePath();
        fillStroke(g, p.color, 1.5);
      } else {
        g.fillStyle = p.color;
        g.fillRect(-1.5, -1.5, p.size, p.size);
      }
      g.restore();
    }
    g.globalAlpha = 1;
  }

  function drawFeedback(feedback: Feedback, y: number) {
    const g = ctx;
    const age = feedback.age;
    const pop = age < 0.2 ? easeOutBack(age / 0.2) : 1;
    const fadeFrom = FEEDBACK_TIME * 0.65;
    g.globalAlpha = age > fadeFrom ? clamp01(1 - (age - fadeFrom) / (FEEDBACK_TIME - fadeFrom)) : 1;
    g.save();
    g.translate(W / 2, y - age * 18);
    g.scale(pop, pop);
    const fills: Record<Feedback['grade'], string | CanvasGradient> = {
      'Perfect!': vertical(g, -26, 26, [C.gold, C.hotPink]),
      'Great!': C.hotPink,
      'Good!': C.purple,
      'Nice try!': C.skyDark,
    };
    stickerText(g, feedback.grade, 0, 0, 52, fills[feedback.grade]);
    if (feedback.points > 0) stickerText(g, `+${Math.round(feedback.points)}`, 0, 44, 26, C.gold);
    if (feedback.combo >= 2 && feedback.grade === 'Perfect!') {
      stickerText(g, `✨ ${feedback.combo} in a row! ✨`, 0, 78, 22, C.purple);
    }
    g.restore();
    g.globalAlpha = 1;
  }

  /** What a card says under its title: the step's number and minutes, or that it's for learning. */
  function cardLine(state: KitchenState): string {
    if (isLearning(state, state.stepIndex)) return '🎓 Learning time!';
    const cooking = cookingSteps(state);
    const number = `Step ${cooking.indexOf(state.stepIndex) + 1} of ${cooking.length}`;
    const minutes = stepMinutes(currentRun(state).options);
    return minutes > 0 ? `${number} · ⏰ ${minutes} min` : number;
  }

  function drawBanner(state: KitchenState) {
    const g = ctx;
    const run = currentRun(state);
    const elapsed = bannerTime(state) - state.banner;
    const scale = easeOutBack(clamp01(elapsed / 0.45));
    const fade = state.banner < 0.3 ? state.banner / 0.3 : 1;
    const reader = state.learn.settings.readMyself;
    g.globalAlpha = fade;
    dim(0.22);
    g.save();
    g.translate(W / 2, 250);
    g.scale(scale, scale);
    // Read it myself: a taller card with the hint on it too, and a speaker.
    const half = reader ? 112 : 82;
    rounded(g, -260, -half, 520, half * 2, 38);
    fillStroke(g, C.white, 6, C.hotPink);
    g.setLineDash([10, 9]);
    rounded(g, -246, -half + 14, 492, half * 2 - 28, 28);
    g.lineWidth = 3;
    g.strokeStyle = C.lavender;
    g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(-172, reader ? -34 : 2);
    g.rotate(Math.sin(fx.time * 3) * 0.12);
    g.fillStyle = C.ink;
    emoji(g, iconOf(run), 0, 0, reader ? 64 : 76);
    g.restore();
    if (reader) {
      const reading = cardReading() && card ? card.reading : null;
      const word = wordNow(reading);
      const speaker = cardSpeakerAt(layout.shape);
      drawSpeaker(g, speaker.x - W / 2, speaker.y - 250, speaker.r, word >= 0, fx.time);
      const title = fitWords(g, titleOf(run), 360, 34, 1);
      drawWords(g, title.lines, 50, -62, title.size, 0, { highlight: word, color: C.hotPink });
      const hint = hintOf(run);
      const titleWords = titleOf(run).split(' ').length;
      const hintSize = fitWords(g, hint.join(' '), 720, 24, 2).size;
      let at = titleWords;
      hint.forEach((line, i) => {
        drawWords(g, [line], 50, -12 + i * 34, hintSize, 0, {
          highlight: word - at,
          color: C.ink,
        });
        at += line.split(' ').length;
      });
      plainText(g, cardLine(state), 50, 70, 18, C.purple);
    } else {
      stickerText(
        g,
        titleOf(run),
        50,
        -16,
        38,
        vertical(g, -36, 4, [C.hotPink, C.purple]),
        'center',
        380,
      );
      plainText(g, cardLine(state), 50, 36, 20, C.purple);
    }
    // The first step says what we're making, on a ribbon above the card.
    if (state.stepIndex === 0) {
      rounded(g, -190, -half - 40, 380, 50, 25);
      fillStroke(g, horizontal(g, -190, 190, [C.purple, C.lavender, C.purple]), 4);
      stickerText(g, `Let's make ${state.dish.name}!`, 0, -half - 15, 26, C.white, 'center', 350);
    }
    g.restore();
    g.globalAlpha = 1;
  }

  /**
   * The kitchen clock on the wall. When a step finishes, its minutes go by:
   * the minute hand sweeps round to the new time with a tick every 5 minutes,
   * and the clock grows a little while it moves, so it's easy to watch.
   */
  function drawWallClock(state: KitchenState, dt: number) {
    const target = roundTime(state);
    if (fx.clock === null || fx.clock > target) fx.clock = target;
    const before = fx.clock;
    if (before < target) {
      fx.clock = Math.min(target, before + dt * Math.max(6, (target - before) * 1.6));
      if (Math.floor(fx.clock / 5) > Math.floor(before / 5)) sound.tick(0.7);
    }
    const moving = fx.clock < target;
    const { x, y, r } = places.clock;
    const grow = moving ? CLOCK_GROW : 1;
    onCanvas(() => {
      shadow(ctx, x + 3, y + r * grow + 4, r * 0.7, 5);
      drawClock(ctx, x, y, r * grow, fx.clock ?? target, {
        t: fx.time,
        glow: moving ? 'minute' : null,
        numbers: r >= 30,
      });
    });
  }

  function drawEnd(state: KitchenState, end: RoundEnd) {
    const g = ctx;
    const t = fx.time;
    const age = fx.overAge;
    const score = totalScore(state);
    const stars = starsFor(score, maxScore(state));

    dim(0.35 * clamp01(age / 0.4));

    const scale = easeOutBack(clamp01(age / 0.5));
    g.save();
    g.translate(W / 2, 250);
    g.scale(scale, scale);
    rounded(g, -250, -196, 500, 436, 38);
    fillStroke(g, C.white);

    // Sun rays behind the dish.
    g.save();
    g.translate(0, -66);
    g.rotate(t * 0.3);
    g.fillStyle = 'rgba(255, 229, 138, 0.55)';
    for (let i = 0; i < 12; i++) {
      g.rotate(Math.PI / 6);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-18, -140);
      g.lineTo(18, -140);
      g.closePath();
      g.fill();
    }
    g.restore();

    g.save();
    g.translate(0, -66);
    state.dish.draw(g, t, state);
    drawDecorations(g, end.decor.placed);
    g.restore();

    rounded(g, -200, -226, 400, 58, 29);
    fillStroke(g, horizontal(g, -200, 200, [C.hotPink, C.pink, C.hotPink]));
    stickerText(g, `${state.dish.name}!`, 0, -197, 30, C.white, 'center', 370);

    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 92;
      const y = i === 1 ? 52 : 62;
      const r = i === 1 ? 36 : 30;
      const shownAt = 0.9 + i * 0.45;
      const earned = i < stars && age >= shownAt;
      starPath(g, x, y, r, 0);
      fillStroke(g, C.lavenderLight, 4, C.starEdge);
      if (earned) {
        const s = easeOutBack(clamp01((age - shownAt) / 0.35));
        g.save();
        g.translate(x, y);
        g.scale(s, s);
        starPath(g, 0, 0, r, Math.sin(t * 2 + i) * 0.08);
        fillStroke(g, vertical(g, -r, r, [C.butter, C.gold]), 4);
        g.restore();
      }
    }
    stickerText(
      g,
      ratingFor(score, maxScore(state)),
      0,
      116,
      32,
      vertical(g, 98, 134, [C.hotPink, C.purple]),
    );
    // When you started and finished, in words and on two little clocks.
    const started = state.start;
    const finished = roundTime(state);
    plainText(
      g,
      `You started at ${clockText(started)} and finished at ${clockText(finished)}!`,
      0,
      150,
      18,
      C.ink,
    );
    for (const [x, label, time] of [
      [-192, 'Start', started],
      [192, 'Finish', finished],
    ] as const) {
      plainText(g, `${label} ${clockText(time)}`, x, 8, 15, C.purple);
      drawClock(g, x, 58, 38, time, { t });
    }
    plainText(g, `⭐ ${score} points`, 0, 178, 20, C.purple);

    const pulse = 1 + Math.sin(t * 4) * 0.04;
    g.save();
    g.translate(0, 212);
    g.scale(pulse, pulse);
    rounded(g, -118, -26, 236, 52, 26);
    fillStroke(g, vertical(g, -26, 26, [C.cabinetLight, C.mint]));
    plainText(g, 'Cook again! 🔁', 0, 1, 24, C.ink);
    g.restore();

    // The sticker news pops on after the stars.
    const newsAt = 0.9 + stars * 0.45 + 0.3;
    if (end.sticker && age >= newsAt) {
      if (!fx.stickerShown) {
        fx.stickerShown = true;
        sound.chime([NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7], 0.08, 0.16);
        burst(400 + 176, 250 - 112, 14, ['star', 'heart'], CONFETTI, 200);
      }
      const s = easeOutBack(clamp01((age - newsAt) / 0.4));
      g.save();
      g.translate(176, -112);
      g.rotate(0.2 + Math.sin(t * 3) * 0.05);
      g.scale(s, s);
      starPath(g, 0, 0, 66, t * 0.2);
      fillStroke(g, vertical(g, -60, 60, [C.butter, C.gold]), 4);
      circle(g, 0, 0, 42);
      fillStroke(g, C.white, 3);
      const [top, bottom] = end.sticker === 'new' ? ['New', 'sticker!'] : ['Sticker', 'upgraded!'];
      stickerText(g, top, 0, -10, 19, C.hotPink, 'center', 76);
      stickerText(g, bottom, 0, 12, 17, C.purple, 'center', 80);
      g.restore();
    }

    // The Smart Chef star, for a learning moment answered on her own.
    if (end.smart && age >= newsAt) {
      if (!fx.smartShown) {
        fx.smartShown = true;
        burst(400 - 176, 250 - 112, 14, ['star', 'heart'], CONFETTI, 200);
      }
      const s = easeOutBack(clamp01((age - newsAt) / 0.4));
      g.save();
      g.translate(-176, -112);
      g.rotate(-0.2 + Math.sin(t * 3) * 0.05);
      g.scale(s, s);
      starPath(g, 0, 0, 66, -t * 0.2);
      fillStroke(g, vertical(g, -60, 60, [C.lavenderLight, C.purple]), 4);
      circle(g, 0, 0, 42);
      fillStroke(g, C.white, 3);
      g.fillStyle = C.ink;
      emoji(g, '🎓', 0, -14, 24);
      stickerText(g, 'Smart', 0, 8, 17, C.purple, 'center', 76);
      stickerText(g, 'Chef!', 0, 26, 16, C.hotPink, 'center', 76);
      g.restore();
    }

    g.restore();
  }

  // -------------------------------------------------------------------------
  // Decorating the finished dish

  function drawDecorate(state: KitchenState, decor: DecorState) {
    const g = ctx;
    const t = fx.time;
    const p = decorPlaces(layout.shape);
    dim(0.28 * clamp01(fx.decorAge / 0.4));

    const pop = easeOutBack(clamp01(fx.decorAge / 0.45));
    const { panel } = p;
    g.save();
    g.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
    g.scale(pop, pop);
    g.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));

    // A cloth to decorate on.
    rounded(g, panel.x, panel.y, panel.w, panel.h, 36);
    fillStroke(g, C.cream, 5, C.hotPink);
    g.setLineDash([10, 9]);
    rounded(g, panel.x + 12, panel.y + 12, panel.w - 24, panel.h - 24, 26);
    g.lineWidth = 3;
    g.strokeStyle = C.lavender;
    g.stroke();
    g.setLineDash([]);

    // The dish, with what's on it so far.
    const { dish } = p;
    shadow(g, dish.x, dish.y + 70 * dish.scale, 150 * dish.scale, 18);
    g.save();
    g.translate(dish.x, dish.y);
    g.scale(dish.scale, dish.scale);
    state.dish.draw(g, t, state);
    drawDecorations(g, decor.placed);
    g.restore();

    // The title on top, so a tall dish (a smoothie's straw) never hides it.
    stickerText(
      g,
      'Decorate your dish!',
      p.title.x,
      p.title.y,
      34,
      vertical(g, p.title.y - 20, p.title.y + 20, [C.hotPink, C.purple]),
      'center',
      p.titleW,
    );

    // The tray of treats.
    const r = p.trayRadius;
    const first = p.tray[0];
    const lastSpot = p.tray[p.tray.length - 1];
    rounded(
      g,
      first.x - r - 6,
      first.y - r - 8,
      lastSpot.x - first.x + 2 * r + 12,
      2 * r + 16,
      r + 8,
    );
    fillStroke(g, C.white, 3.5);
    p.tray.forEach((spot, i) => {
      const kind = DECORATIONS[i];
      const chosen = decor.selected === kind;
      if (chosen) {
        g.strokeStyle = C.gold;
        g.lineWidth = 5;
        circle(g, spot.x, spot.y, r + 3 + Math.sin(t * 6) * 2);
        g.stroke();
      }
      circle(g, spot.x, spot.y, r - 2);
      fillStroke(g, chosen ? C.butter : C.lavenderLight, 2.5);
      const bob = Math.sin(t * 2.5 + i) * 2;
      drawDecoration(g, kind, spot.x, spot.y + bob, 1.35 * (r / 30));
    });

    // Done! It nudges a little more once some treats are on.
    const { done } = p;
    const pulse = 1 + Math.sin(t * 4) * (decor.placed.length > 0 ? 0.06 : 0.03);
    g.save();
    g.translate(done.x, done.y);
    g.scale(pulse, pulse);
    rounded(g, -done.w / 2, -done.h / 2, done.w, done.h, done.h / 2);
    fillStroke(g, vertical(g, -done.h / 2, done.h / 2, [C.cabinetLight, C.mint]), 4);
    stickerText(g, 'Done!', 0, 2, Math.min(36, done.h * 0.45), C.hotPink, 'center', done.w - 16);
    g.restore();

    g.restore();
  }

  /** The treat under the finger, a little bigger, as if lifted. */
  function drawHeld(decor: DecorState) {
    const held = decor.held;
    if (!held) return;
    const scale = decorPlaces(layout.shape).dish.scale * 1.2;
    shadow(ctx, held.x + 6, held.y + 16, 16, 6);
    drawDecoration(ctx, held.kind, held.x, held.y - 4, scale);
  }

  // -------------------------------------------------------------------------
  // The recipe book

  /** Text that shrinks to fit `maxWidth`. */
  function fitted(
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
    maxWidth: number,
  ) {
    const g = ctx;
    g.font = font(size);
    const wide = g.measureText(text).width;
    plainText(g, text, x, y, wide > maxWidth ? (size * maxWidth) / wide : size, color);
  }

  /** A dish nobody has cooked yet: under a little lid with a "?". */
  function drawCovered(g: G, x: number, y: number, s: number) {
    oval(g, x, y + 22 * s, 50 * s, 10 * s);
    fillStroke(g, C.white, 3);
    g.beginPath();
    g.ellipse(x, y + 20 * s, 42 * s, 40 * s, 0, Math.PI, 0);
    g.closePath();
    fillStroke(g, vertical(g, y - 20 * s, y + 20 * s, [C.white, C.steel, C.steelDark]), 3);
    circle(g, x, y - 24 * s, 6 * s);
    fillStroke(g, C.pink, 2.5);
    stickerText(g, '?', x, y + 2 * s, 30 * s, C.lavender);
  }

  function drawBookPage(stickers: Record<string, number>) {
    const g = ctx;
    const t = fx.time;
    const b = bookPlaces(layout, DISHES.length);
    const tall = layout.shape === 'tall';
    dim(0.3);
    rounded(g, b.page.x, b.page.y, b.page.w, b.page.h, 32);
    fillStroke(g, C.cream, 5, C.hotPink);
    g.setLineDash([10, 9]);
    rounded(g, b.page.x + 10, b.page.y + 10, b.page.w - 20, b.page.h - 20, 24);
    g.lineWidth = 3;
    g.strokeStyle = C.lavender;
    g.stroke();
    g.setLineDash([]);

    stickerText(
      g,
      'My Recipe Book',
      b.title.x,
      b.title.y,
      tall ? 44 : 36,
      vertical(g, b.title.y - 22, b.title.y + 22, [C.hotPink, C.purple]),
      'center',
      b.page.w - 2 * (b.close.r + 50),
    );
    plainText(
      g,
      `📖 ${countLine(stickers, DISHES)}`,
      b.count.x,
      b.count.y,
      tall ? 26 : 20,
      C.purple,
    );

    // Close: or tap anywhere that isn't a dish you've cooked.
    circle(g, b.close.x, b.close.y, b.close.r);
    fillStroke(g, C.white, 3.5);
    plainText(g, '✕', b.close.x, b.close.y + 1, b.close.r * 0.9, C.ink);

    DISHES.forEach((dish, i) => {
      const cell: Box = b.cells[i];
      const s = b.scale;
      const cx = cell.x + cell.w / 2;
      const level = starsOf(stickers, dish.id);
      rounded(g, cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 8, 18 * s);
      fillStroke(g, level ? C.white : C.lavenderLight, 3, level ? C.ink : C.lavender);
      if (level) {
        g.save();
        g.translate(cx, cell.y + 47 * s);
        g.scale(0.36 * s, 0.36 * s);
        dish.draw(g, t, null);
        g.restore();
        const lines = twoLines(dish.name);
        lines.forEach((line, k) => {
          const y = cell.y + (lines.length === 1 ? 100 : 91 + k * 14) * s;
          fitted(line, cx, y, 13 * s, C.ink, cell.w - 16);
        });
      } else {
        drawCovered(g, cx, cell.y + 52 * s, s);
      }
      if (smartOf(stickers, dish.id)) {
        // The Smart Chef star: a learning moment answered on her own.
        starPath(g, cell.x + cell.w - 22 * s, cell.y + 22 * s, 16 * s, 0.2);
        fillStroke(g, C.lavender, 2.5, C.purple);
        g.fillStyle = C.ink;
        emoji(g, '🎓', cell.x + cell.w - 22 * s, cell.y + 23 * s, 13 * s);
      }
      for (let k = 0; k < 3; k++) {
        starPath(g, cx + (k - 1) * 20 * s, cell.y + 124 * s, 8 * s);
        fillStroke(g, k < level ? C.gold : C.white, 2, k < level ? C.ink : C.starEdge);
      }
    });
  }

  /** The book button on the title screen. */
  function drawBookButton() {
    const g = ctx;
    const box = bookButtonFor(layout);
    const wiggle = Math.sin(fx.time * 2.2) * 0.03;
    g.save();
    g.translate(box.x + box.w / 2, box.y + box.h / 2);
    g.rotate(wiggle);
    rounded(g, -box.w / 2, -box.h / 2, box.w, box.h, box.h / 2);
    fillStroke(g, vertical(g, -box.h / 2, box.h / 2, [C.white, C.lavenderLight]), 4);
    g.fillStyle = C.ink;
    emoji(g, '📖', -box.w / 2 + 32, 2, 30);
    stickerText(g, 'Recipes', 22, 2, 24, C.purple, 'center', box.w - 70);
    g.restore();
  }

  function drawTitle() {
    const g = ctx;
    const t = fx.time;
    dim(0.18);
    // Beside Chef Bunny, or in the middle when she stands below.
    const cx = layout.shape === 'tall' ? W / 2 : START_BUTTON.x;
    g.save();
    g.translate(cx, 150);
    g.rotate(Math.sin(t * 1.5) * 0.02);
    stickerText(g, 'Carnival', 0, -44, 46, vertical(g, -66, -22, [C.hotPink, C.purple]));
    stickerText(g, 'Kitchen', 0, 14, 64, vertical(g, -18, 46, [C.gold, C.hotPink]));
    g.restore();
    for (const [dx, y, r] of [
      [-190, 100, 16],
      [160, 96, 20],
      [220, 190, 12],
      [-200, 200, 12],
    ]) {
      const x = cx + dx;
      starPath(g, x, y, r + Math.sin(t * 4 + x) * 2, t + x);
      fillStroke(g, C.gold, 3);
    }

    // A covered dish: what's under the lid is a surprise until you tap.
    drawMysteryDish(g, cx, 322, t);

    // One big button: the dish is a surprise.
    const pulse = 1 + Math.sin(t * 4) * 0.05;
    g.save();
    g.translate(cx, START_BUTTON.y);
    g.scale(pulse, pulse);
    rounded(g, -START_BUTTON.w / 2, -START_BUTTON.h / 2, START_BUTTON.w, START_BUTTON.h, 35);
    fillStroke(g, vertical(g, -35, 35, [C.pink, C.hotPink]), 5);
    stickerText(g, 'Tap to cook!', 0, 2, 34, C.white);
    g.restore();

    onCanvas(drawBookButton);
  }

  /**
   * The grown-ups' gear in the corner, with its hint. `held` (0 to 1) is how
   * far through the hold it is: a ring fills round it.
   */
  function drawGear(held: number) {
    const g = ctx;
    const gear = gearFor(layout);
    circle(g, gear.x, gear.y, gear.r);
    fillStroke(g, 'rgba(255, 255, 255, 0.85)', 3);
    g.fillStyle = C.ink;
    g.save();
    g.translate(gear.x, gear.y + 1);
    g.rotate(held * Math.PI);
    emoji(g, '⚙️', 0, 0, gear.r * 1.1);
    g.restore();
    if (held > 0) {
      g.strokeStyle = C.purple;
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(gear.x, gear.y, gear.r + 7, -Math.PI / 2, -Math.PI / 2 + held * Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 0.75;
    plainText(g, 'Hold for grown-ups', gear.x - gear.r - 8, gear.y + 1, 14, C.ink, 'right');
    g.globalAlpha = 1;
  }

  /** The grown-ups' settings page. */
  function drawGrownupPage(settings: LearnSettings) {
    const g = ctx;
    const p = grownupPlaces(layout);
    dim(0.3);
    rounded(g, p.page.x, p.page.y, p.page.w, p.page.h, 32);
    fillStroke(g, C.cream, 5, C.purple);
    stickerText(
      g,
      '⚙️ For grown-ups',
      p.title.x,
      p.title.y,
      p.tall ? 40 : 34,
      vertical(g, p.title.y - 20, p.title.y + 20, [C.purple, C.hotPink]),
      'center',
      p.page.w - 2 * (p.close.r + 50),
    );
    circle(g, p.close.x, p.close.y, p.close.r);
    fillStroke(g, C.white, 3.5);
    plainText(g, '✕', p.close.x, p.close.y + 1, p.close.r * 0.9, C.ink);
    for (const { row, label, note, control } of p.rows) {
      plainText(g, row.label, label.x, label.y, p.tall ? 30 : 26, C.ink, 'left');
      g.font = font(16);
      const fit = Math.min(1, p.noteWidth / Math.max(1, g.measureText(row.note).width));
      plainText(g, row.note, note.x, note.y, 16 * fit, C.purple, 'left');
      optionBoxes(control).forEach((b, i) => {
        const [text, value] = row.options[i];
        const on = settings[row.key] === value;
        rounded(g, b.x + 4, b.y, b.w - 8, b.h, b.h / 2);
        fillStroke(g, on ? vertical(g, b.y, b.y + b.h, [C.pink, C.hotPink]) : C.white, 3.5);
        plainText(
          g,
          text,
          b.x + b.w / 2,
          b.y + b.h / 2 + 1,
          p.tall ? 26 : 22,
          on ? C.white : C.ink,
        );
      });
    }
    const d = p.done;
    rounded(g, d.x, d.y, d.w, d.h, d.h / 2);
    fillStroke(g, vertical(g, d.y, d.y + d.h, [C.cabinetLight, C.mint]), 4);
    plainText(g, 'Done', d.x + d.w / 2, d.y + d.h / 2 + 1, 26, C.ink);
  }

  return {
    reset() {
      const keep = fx.particles;
      fx = fresh();
      fx.particles = keep;
      spin = null;
      announced = null;
      waiting = null;
    },

    /**
     * Starts the dish spinner, which lands on `dish`: the game has already
     * picked it. Chef Bunny says "Let's make..." when it lands, so the first
     * step's card doesn't say it again.
     */
    startSpin(dish: Dish) {
      const count = DISHES.length;
      const target = Math.max(0, DISHES.indexOf(dish));
      const start = Math.floor(Math.random() * count);
      const end = spinEnd(start, target, count);
      spin = { dish, start, end, age: 0, pos: start, ticked: start, tickAge: 9, landed: false };
      announced = dish;
      sound.whoosh();
    },

    /** Whether the spinner has finished, so cooking can start. */
    spinDone() {
      return !spin || spin.age >= spinTime(spin.dish);
    },

    /** A tap once the spinner has landed skips the rest of the pause. */
    skipSpin() {
      if (spin && spin.landed && spin.age >= SPIN_TIME + 0.5) {
        spin.age = Math.max(spin.age, spinTime(spin.dish) - 0.2);
      }
    },

    /** Draws a frame of the dish spinner. */
    drawSpin(dt: number) {
      update(dt);
      begin();
      if (spin) {
        spin.age += dt;
        spin.tickAge += dt;
        const pos = reelPosition(spin.start, spin.end, spin.age);
        const speed = dt > 0 ? Math.abs(pos - spin.pos) / dt : 0;
        spin.pos = pos;
        // A click each time a dish passes the middle, but not a buzz.
        const passing = Math.round(pos);
        if (passing !== spin.ticked && !spin.landed) {
          spin.ticked = passing;
          if (spin.tickAge > 0.06) {
            spin.tickAge = 0;
            sound.tick(1 + 0.4 * clamp01(spin.age / SPIN_TIME));
          }
        }
        if (!spin.landed && spin.age >= SPIN_TIME) {
          spin.landed = true;
          sound.tada();
          sound.say(`Let's make ${spin.dish.name}!`);
          // Sparkles from the dish, in scene units.
          const at = spinnerSpot();
          burst(
            at.x - layout.sceneX + (SPINNER_DISH.x - W / 2) * at.scale,
            at.y - layout.sceneY + (SPINNER_DISH.y - 250) * at.scale,
            24,
            ['star', 'heart', 'star', 'dot'],
            CONFETTI,
            360,
          );
          fx.chef.moodAge = 0;
        }
        if (spin.landed) fx.chef.mood = 'cheer';
        bunny();
        dim(0.25);
        const at = spinnerSpot();
        const view = {
          dishes: DISHES,
          pos,
          speed,
          landed: spin.landed ? spin.age - SPIN_TIME : -1,
          t: fx.time,
        };
        onCanvas(() => {
          ctx.translate(at.x, at.y);
          ctx.scale(at.scale, at.scale);
          ctx.translate(-W / 2, -250);
          drawSpinner(ctx, view);
        });
      }
      drawButtons();
      drawParticles();
      drawLeave(dt);
    },

    /** Whether a canvas point is on the badge of the dish being made. */
    hitBadge(x: number, y: number) {
      const { badge } = places;
      return x >= badge.x && x <= badge.x + badge.w && y >= badge.y && y <= badge.y + badge.h;
    },

    /** Chef Bunny says what we're making, and the badge gives a wiggle. */
    sayDish(dish: Dish) {
      badgeAge = 0;
      sound.pop();
      sound.say(`We're making ${dish.name}!`);
      fx.chef.mood = 'nod';
      fx.chef.moodAge = 0;
    },

    /** Shows a gentle "Not yet!" where a too-early tap landed. */
    notYet(x: number, y: number) {
      fx.notYet = { x, y, age: 0 };
      sound.boop();
      chefReacts({ kind: 'not yet' }, x, y);
    },

    /**
     * Fits the drawing to a new layout. `pixels` is how many canvas pixels
     * make one canvas unit; the caller sizes the canvas to match.
     */
    setLayout(next: Layout, nextPixels: number) {
      layout = next;
      places = placesFor(next);
      pixels = nextPixels;
      kitchen = null;
    },

    /** Whether a canvas point is on the sound button. */
    hitSoundButton(x: number, y: number) {
      return Math.hypot(x - places.sound.x, y - places.sound.y) <= hitRadius(places);
    },

    /** Whether a canvas point is on the home button (when there is one). */
    hitHomeButton(x: number, y: number) {
      const home = places.home;
      return !!home && Math.hypot(x - home.x, y - home.y) <= hitRadius(places);
    },

    /** Opens the "Leave the kitchen?" card (a tap on 🏠). */
    askLeave() {
      leaveAge = 0;
      sound.pop();
      sound.say('Do you want to leave the kitchen?');
    },

    /** Whether the "Leave the kitchen?" card is up. */
    leaveAsked() {
      return leaveAge >= 0;
    },

    /**
     * A tap while the "Leave the kitchen?" card is up: 'leave' on ✓, else
     * 'stay' (✕, or anywhere else). Either way the card closes.
     */
    leaveTap(x: number, y: number): 'leave' | 'stay' {
      const { yes } = leavePlaces(layout);
      leaveAge = -1;
      if (Math.hypot(x - yes.x, y - yes.y) <= yes.r + 6) return 'leave';
      sound.whoosh();
      return 'stay';
    },

    /** Whether the end card has been up long enough to leave it. */
    endShown() {
      return fx.overAge >= 1.2;
    },

    /**
     * Draws the title screen, waiting for a tap to start cooking. `gearHeld`
     * (0 to 1) is how far through holding the grown-ups' gear.
     */
    drawTitle(dt: number, gearHeld = 0) {
      update(dt);
      begin();
      bunny();
      drawTitle();
      onCanvas(() => drawGear(gearHeld));
      drawButtons();
      drawParticles();
      drawLeave(dt);
    },

    /** Draws the grown-ups' settings page. */
    drawGrownups(dt: number, settings: LearnSettings) {
      update(dt);
      begin();
      onCanvas(() => drawGrownupPage(settings));
    },

    /** Whether a canvas point is on the step card's speaker ("Read it myself"). */
    hitCardSpeaker(x: number, y: number) {
      const speaker = cardSpeakerAt(layout.shape);
      const sx = speaker.x + layout.sceneX;
      const sy = speaker.y + layout.sceneY;
      return Math.hypot(x - sx, y - sy) <= speaker.r + 10;
    },

    /** Reads the step's card out loud, its words lighting up as they're said. */
    readCard(state: KitchenState) {
      const run = currentRun(state);
      sound.pop();
      card = {
        reading: sound.read(`${titleOf(run)} ${hintOf(run).join(' ')}`),
        state,
        index: state.stepIndex,
      };
    },

    /** Whether the step's card is being read out by its speaker. */
    cardReading,

    /** Draws the recipe book, with the stickers earned so far. */
    drawBook(dt: number, stickers: Record<string, number>) {
      update(dt);
      begin();
      onCanvas(() => drawBookPage(stickers));
    },

    /** Sparkles where a treat lands on the dish, and a happy Chef Bunny. */
    sparkle(x: number, y: number) {
      burst(x, y, 8, ['star', 'heart', 'dot'], CONFETTI, 150, 300);
      sound.bloop();
      fx.chef.mood = 'cheer';
      fx.chef.moodAge = 0;
    },

    draw(state: KitchenState, pointer: Pointer, dt: number, end: RoundEnd) {
      spin = null;
      observe(state, pointer, dt, end);
      fx.pointer = pointer;
      // Holding to pour, shake or bake: she leans in for a look.
      const taking = state.phase === 'playing' && state.banner === 0;
      const holding = taking && pointer.down && isHolding(currentRun(state).state);
      if (holding && !fx.chef.holding) chefReacts({ kind: 'peek' }, pointer.x, pointer.y);
      update(dt, holding);
      fx.shownScore += (liveScore(state) - fx.shownScore) * Math.min(1, dt * 8);

      begin();
      if (state.phase === 'playing') drawWallClock(state, dt);

      // The step being cooked draws itself on the scene.
      const run = currentRun(state);
      stepOf(run.kind).draw(viewFor(state, run, pointer, dt));

      // The finished dish, waiting to be decorated before the stars.
      if (state.phase === 'over' && !end.decor.done) {
        drawDecorate(state, end.decor);
        bunny();
        onCanvas(() => drawSpeech(ctx, ['Drag a treat', 'onto your dish!'], places.speech));
        drawButtons();
        drawParticles();
        drawHeld(end.decor);
        drawLeave(dt);
        return;
      }

      bunny();
      if (state.phase === 'playing' && state.banner === 0) {
        const said = fx.said;
        const lines = stepOf(run.kind).bubble?.(currentTurn(state)) ?? hintOf(run);
        onCanvas(() => drawSpeech(ctx, said ? [said.text] : lines, places.speech));
      }
      drawHud(state);
      if (state.phase === 'playing') drawParticles();
      // The last action's popup floats above the next step's card.
      if (state.phase === 'playing' && state.banner > 0) drawBanner(state);
      if (state.phase === 'playing' && state.feedback) {
        drawFeedback(state.feedback, state.banner > 0 ? 112 : 168);
      }
      if (state.phase === 'playing') drawNotYet();
      if (state.phase === 'over') {
        drawEnd(state, end);
        bunny('cheer', fx.overAge);
        drawParticles();
      }
      drawLeave(dt);
      flushChatter();
    },
  };
}

/** The kitchen for a layout, painted once at the canvas's pixel density. */
function paintKitchen(layout: Layout, pixels: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(layout.width * pixels);
  canvas.height = Math.round(layout.height * pixels);
  const g = canvas.getContext('2d');
  if (g) {
    g.scale(pixels, pixels);
    drawKitchen(g, layout);
  }
  return canvas;
}
