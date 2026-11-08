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
import { type Box, bookButtonFor, bookPlaces, countLine, starsOf, twoLines } from './book';
import {
  DECORATIONS,
  type DecorState,
  decorPlaces,
  drawDecoration,
  drawDecorations,
} from './decorate';
import { DISHES } from './dishes';
import { type StickerNews, liveScore, maxScore, ratingFor, starsFor, totalScore } from './game';
import {
  BANNER_TIME,
  FEEDBACK_TIME,
  currentRun,
  currentTurn,
  type Effects,
  type Feedback,
  type KitchenState,
  type Particle,
  type Pointer,
  type StepRun,
  type StepView,
} from './kit';
import { type Layout, layoutFor } from './layout';
import { NOTE, type Sound } from './sound';
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

const BUTTON_RADIUS = 24;

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
    return {
      home: { x: 40, y: 50 } as Spot | null,
      sound: { x: 100, y: 50 },
      score: { x: width - 168, y: 28 },
      combo: { x: width / 2, y: sy + 75 },
      recipe: { x: width / 2, y: sy + 13 },
      bunny: { x: 92, y: bunnyY },
      speech: { x: 180, y: bunnyY - 86, w: width - 200, tail: 'left' } as Bubble,
    };
  }
  // On the page the scene is the whole canvas, and there's a back link above
  // it, so there's no home button.
  return {
    home: layout.shape === 'wide' ? { x: sx + 40, y: sy + 80 } : null,
    sound: { x: sx + (layout.shape === 'wide' ? 100 : 40), y: sy + 80 },
    score: { x: sx + W - 168, y: sy + 58 },
    combo: { x: sx + W - 93, y: sy + 126 },
    recipe: { x: sx + W / 2, y: sy + 80 },
    bunny: { x: sx + 86, y: sy + 392 },
    speech: { x: sx + 12, y: sy + 230, w: 188, tail: 'down' } as Bubble,
  };
}

/** What the end of a round shows besides the round: decorating, and sticker news. */
export interface RoundEnd {
  decor: DecorState;
  sticker: StickerNews;
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

  // A shelf with jars and a little plant, at the scene's right. A tall
  // canvas leaves it out: the meters and the plate stand there.
  if (layout.shape !== 'tall') drawShelf(g, sceneX, counter - 338);

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

// ---------------------------------------------------------------------------
// The renderer

export function createRenderer(ctx: G, sound: Sound) {
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
    if (line && sound.chatter(line)) fx.said = { text: line, age: 0 };
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
  });
  let fx = fresh();

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
      // The first step also says what we're making.
      const intro = state.stepIndex === 0 ? `Let's make ${state.dish.name}! ` : '';
      sound.say(`${intro}${titleOf(run)} ${hintOf(run).join(' ')}`);
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
        sound.say(`${ratingFor(totalScore(state), maxScore(state))} You made ${dish}!${news}`);
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
      for (const [spot, icon] of buttons) {
        circle(g, spot.x, spot.y, BUTTON_RADIUS);
        fillStroke(g, C.white, 3.5);
        g.fillStyle = C.ink;
        emoji(g, icon, spot.x, spot.y + 1, 22);
      }
    });
  }

  function drawHud(state: KitchenState) {
    drawButtons();
    onCanvas(() => drawTopBar(state));
    drawProgress(state);
  }

  /** The recipe, the score and the streak, in canvas units. */
  function drawTopBar(state: KitchenState) {
    const g = ctx;
    const t = fx.time;

    // The recipe: one bubble per step.
    const n = state.steps.length;
    state.steps.forEach((run, i) => {
      const x = places.recipe.x + (i - (n - 1) / 2) * 78;
      const y = places.recipe.y;
      const done = i < state.stepIndex || state.phase === 'over';
      const current = i === state.stepIndex && state.phase === 'playing';
      if (i < n - 1) {
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
      g.fillStyle = C.ink;
      emoji(g, iconOf(run), x, y + 2, 26);
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

  function drawBanner(state: KitchenState) {
    const g = ctx;
    const run = currentRun(state);
    const elapsed = BANNER_TIME - state.banner;
    const scale = easeOutBack(clamp01(elapsed / 0.45));
    const fade = state.banner < 0.3 ? state.banner / 0.3 : 1;
    g.globalAlpha = fade;
    dim(0.22);
    g.save();
    g.translate(W / 2, 250);
    g.scale(scale, scale);
    rounded(g, -260, -82, 520, 164, 38);
    fillStroke(g, C.white, 6, C.hotPink);
    g.setLineDash([10, 9]);
    rounded(g, -246, -68, 492, 136, 28);
    g.lineWidth = 3;
    g.strokeStyle = C.lavender;
    g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(-172, 2);
    g.rotate(Math.sin(fx.time * 3) * 0.12);
    g.fillStyle = C.ink;
    emoji(g, iconOf(run), 0, 0, 76);
    g.restore();
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
    plainText(g, `Step ${state.stepIndex + 1} of ${state.steps.length}`, 50, 36, 20, C.purple);
    // The first step says what we're making, on a ribbon above the card.
    if (state.stepIndex === 0) {
      rounded(g, -190, -122, 380, 50, 25);
      fillStroke(g, horizontal(g, -190, 190, [C.purple, C.lavender, C.purple]), 4);
      stickerText(g, `Let's make ${state.dish.name}!`, 0, -97, 26, C.white, 'center', 350);
    }
    g.restore();
    g.globalAlpha = 1;
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
    rounded(g, -250, -196, 500, 392, 38);
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
      122,
      32,
      vertical(g, 104, 140, [C.hotPink, C.purple]),
    );
    plainText(g, `⭐ ${score} points`, 0, 158, 20, C.purple);

    const pulse = 1 + Math.sin(t * 4) * 0.04;
    g.save();
    g.translate(0, 196);
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

    stickerText(
      g,
      'Decorate your dish!',
      p.title.x,
      p.title.y,
      34,
      vertical(g, p.title.y - 20, p.title.y + 20, [C.hotPink, C.purple]),
      'center',
      panel.w - 60,
    );

    // The dish, with what's on it so far.
    const { dish } = p;
    shadow(g, dish.x, dish.y + 70 * dish.scale, 150 * dish.scale, 18);
    g.save();
    g.translate(dish.x, dish.y);
    g.scale(dish.scale, dish.scale);
    state.dish.draw(g, t, state);
    drawDecorations(g, decor.placed);
    g.restore();

    // The tray of treats.
    const r = p.trayRadius;
    const first = p.tray[0];
    const lastSpot = p.tray[p.tray.length - 1];
    rounded(
      g,
      first.x - r - 12,
      first.y - r - 10,
      lastSpot.x - first.x + 2 * r + 24,
      2 * r + 20,
      r + 10,
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
      drawDecoration(g, kind, spot.x, spot.y + bob, 1.35);
    });

    // Done! It nudges a little more once some treats are on.
    const { done } = p;
    const pulse = 1 + Math.sin(t * 4) * (decor.placed.length > 0 ? 0.06 : 0.03);
    g.save();
    g.translate(done.x, done.y);
    g.scale(pulse, pulse);
    rounded(g, -done.w / 2, -done.h / 2, done.w, done.h, done.h / 2);
    fillStroke(g, vertical(g, -done.h / 2, done.h / 2, [C.cabinetLight, C.mint]), 4);
    stickerText(g, 'Done!', 0, 2, 28, C.hotPink, 'center', done.w - 16);
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
      b.page.w - 170,
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
    plainText(g, '✕', b.close.x, b.close.y + 1, 28, C.ink);

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

  return {
    reset() {
      const keep = fx.particles;
      fx = fresh();
      fx.particles = keep;
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
      return Math.hypot(x - places.sound.x, y - places.sound.y) <= BUTTON_RADIUS + 8;
    },

    /** Whether a canvas point is on the home button (when there is one). */
    hitHomeButton(x: number, y: number) {
      const home = places.home;
      return !!home && Math.hypot(x - home.x, y - home.y) <= BUTTON_RADIUS + 8;
    },

    /** Whether the end card has been up long enough to leave it. */
    endShown() {
      return fx.overAge >= 1.2;
    },

    /** Draws the title screen, waiting for a tap to start cooking. */
    drawTitle(dt: number) {
      update(dt);
      begin();
      bunny();
      drawTitle();
      drawButtons();
      drawParticles();
    },

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
      observe(state, pointer, dt, end);
      fx.pointer = pointer;
      // Holding to pour, shake or bake: she leans in for a look.
      const taking = state.phase === 'playing' && state.banner === 0;
      const holding = taking && pointer.down && isHolding(currentRun(state).state);
      if (holding && !fx.chef.holding) chefReacts({ kind: 'peek' }, pointer.x, pointer.y);
      update(dt, holding);
      fx.shownScore += (liveScore(state) - fx.shownScore) * Math.min(1, dt * 8);

      begin();

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
        return;
      }

      bunny();
      if (state.phase === 'playing' && state.banner === 0) {
        const said = fx.said;
        onCanvas(() => drawSpeech(ctx, said ? [said.text] : hintOf(run), places.speech));
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
