import {
  C,
  type G,
  blend,
  circle,
  clamp01,
  emoji,
  face,
  fillStroke,
  horizontal,
  oval,
  rounded,
  shadow,
  stickerText,
  vertical,
} from '../art';
import { artOf, ingredient, pluralOf } from '../ingredients';
import { drawSteam, finishStep, showGrade, type Step, type StepBasics, type Turn } from '../kit';
import { startSwipe, swipeTo, type SwipeState } from './grate';

/**
 * Toss: hold the pan and swipe left and right to toss what's in it. While
 * you toss, the thermometer drifts up; resting lets it cool back down to
 * warm. Keep it out of the red: the step scores the share of your tossing
 * time spent cosy, and ends after 10 tosses. Too hot is never a fail: a few
 * cheese lumps show and Chef says "Not too hot!", and they melt away again
 * as it cools. Like circles, it shows a grade but leaves the combo alone.
 */

export interface TossOptions extends StepBasics {
  kind: 'toss';
  /** What's tossed: an ingredient with `tossed` art, such as 'spaghetti'. */
  item: string;
  /** How many tosses. 10 if left out. */
  tosses?: number;
}

/** Something tossed in the pan. */
export interface TossedArt {
  /**
   * Draws it in the pan seen a little from above, centred on (x, y),
   * filling an oval `r` across and about 0.4 r deep. `lumps` (0 to 1) is
   * how lumpy it's gone from being too hot; `tossing` while it's flying.
   */
  draw(
    g: G,
    look: { x: number; y: number; r: number; t: number; lumps: number; tossing: boolean },
  ): void;
}

declare module '../kit/types' {
  interface StepKinds {
    toss: TossOptions;
  }
  interface IngredientArt {
    tossed: TossedArt;
  }
}

export const TOSS_COUNT = 10;
/** The heat the pan rests at: warm, and comfortably cosy. */
export const HEAT_REST = 0.3;
/** Heat per second while tossing, and cooling per second while resting. */
export const HEAT_UP = 0.1;
export const HEAT_DOWN = 0.2;
/** Above this it's too hot. Everything below is cosy. */
export const COSY_HIGH = 0.75;
/** A pan that moved this recently is still being tossed, in seconds. */
export const TOSSING_FOR = 0.4;
/** A toss is a swipe this long, in scene units. */
export const TOSS_TRAVEL = 50;
/** How far the pan slides. */
export const PAN_MIN = 330;
export const PAN_MAX = 450;
const PAN_Y = 262;

export interface TossState {
  panX: number;
  /** The pan's offset from the finger, so it doesn't jump when held. */
  grip: number;
  lastX: number;
  swipe: SwipeState;
  holding: boolean;
  /** Seconds since the pan last moved. */
  still: number;
  /** 0 to 1: the thermometer. */
  heat: number;
  tosses: number;
  target: number;
  /** Seconds spent tossing, and how many of them were cosy. */
  active: number;
  cosy: number;
  done: boolean;
}

export function startToss(target = TOSS_COUNT): TossState {
  return {
    panX: (PAN_MIN + PAN_MAX) / 2,
    grip: 0,
    lastX: 0,
    swipe: startSwipe(),
    holding: false,
    still: 9,
    heat: HEAT_REST,
    tosses: 0,
    target,
    active: 0,
    cosy: 0,
    done: false,
  };
}

/** Whether the pan is being tossed right now: held, and moved just now. */
export function tossing(s: TossState): boolean {
  return s.holding && s.still < TOSSING_FOR;
}

/** Too hot: above the cosy zone. */
export function tooHot(s: TossState): boolean {
  return s.heat > COSY_HIGH;
}

/** The share of the tossing time spent cosy, 0 to 1. All of it before any time has passed. */
export function cosyShare(s: TossState): number {
  return s.active > 0 ? s.cosy / s.active : 1;
}

export function pressToss(turn: Turn<TossOptions, TossState>, x: number) {
  const s = turn.state;
  if (s.done) return;
  s.holding = true;
  s.grip = s.panX - x;
  s.lastX = x;
  s.swipe = startSwipe(x);
}

export function moveToss(turn: Turn<TossOptions, TossState>, x: number) {
  const s = turn.state;
  if (s.done || !s.holding) return;
  if (Math.abs(x - s.lastX) > 0.5) s.still = 0;
  s.lastX = x;
  s.panX = Math.min(PAN_MAX, Math.max(PAN_MIN, x + s.grip));
  if (swipeTo(s.swipe, x, TOSS_TRAVEL)) {
    s.tosses += 1;
    if (s.tosses >= s.target) {
      s.done = true;
      s.holding = false;
      const points = 100 * cosyShare(s);
      showGrade(turn.round, points);
      finishStep(turn.round, points);
    }
  }
}

export function updateToss(turn: Turn<TossOptions, TossState>, dt: number) {
  const s = turn.state;
  if (s.done) return;
  s.still += dt;
  if (tossing(s)) {
    s.heat = Math.min(1, s.heat + HEAT_UP * dt);
    s.active += dt;
    if (!tooHot(s)) s.cosy += dt;
  } else {
    s.heat = Math.max(HEAT_REST, s.heat - HEAT_DOWN * dt);
  }
}

/** How lumpy it looks: none while cosy, more the hotter it gets. */
export function lumpsOf(s: TossState): number {
  return clamp01((s.heat - COSY_HIGH) / 0.15);
}

// ---------------------------------------------------------------------------
// Drawing

/** The thermometer at the right: a cosy green zone, a hot pink top, and a face on the bulb. */
function drawThermometer(g: G, t: number, heat: number) {
  const x = 668;
  const top = 178;
  const bottom = 340;
  const height = bottom - top;
  const hotY = bottom - height * COSY_HIGH;
  rounded(g, x - 17, top - 8, 34, height + 20, 17);
  fillStroke(g, C.white, 4);
  g.save();
  rounded(g, x - 11, top - 2, 22, height + 8, 11);
  g.clip();
  g.fillStyle = 'rgba(143, 227, 200, 0.45)';
  g.fillRect(x - 12, hotY, 24, bottom - hotY + 8);
  g.fillStyle = 'rgba(255, 95, 162, 0.25)';
  g.fillRect(x - 12, top - 2, 24, hotY - top + 2);
  const level = bottom - height * heat;
  g.fillStyle = vertical(g, top, bottom, [C.hotPink, C.ember, C.gold, C.mint]);
  g.fillRect(x - 6, level, 12, bottom - level + 10);
  g.restore();
  // The line between cosy and hot, with a little flame above it.
  g.setLineDash([4, 4]);
  g.strokeStyle = C.hotPink;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - 14, hotY);
  g.lineTo(x + 14, hotY);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = C.ink;
  emoji(g, '🔥', x, top - 22, 20);
  const hot = heat > COSY_HIGH;
  circle(g, x, bottom + 22, 22);
  fillStroke(g, blend([C.mint, C.ember, C.hotPink], clamp01((heat - 0.3) / 0.6)), 4);
  face(g, x, bottom + 22, 0.6, hot ? 'wow' : 'happy');
  if (hot) {
    // Little sweat drops.
    g.fillStyle = C.sky;
    for (const [dx, dy] of [
      [-26, -10],
      [26, -14],
    ]) {
      circle(g, x + dx, bottom + 22 + dy + Math.sin(t * 8 + dx) * 2, 4);
      fillStroke(g, C.sky, 2);
    }
  }
}

/** The pan, seen a little from above, with its handle to the right. */
function drawPan(g: G, x: number, y: number, tilt: number) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  rounded(g, 104, -14, 92, 26, 13);
  fillStroke(g, horizontal(g, 104, 196, [C.hotPink, C.pink]));
  circle(g, 180, -1, 5);
  fillStroke(g, C.wallBottom, 2.5);
  oval(g, 0, 8, 124, 54);
  fillStroke(g, vertical(g, -46, 62, [C.panLight, C.pan, C.panDark]));
  oval(g, 0, 0, 116, 44);
  fillStroke(g, vertical(g, -44, 44, [C.panLight, C.pan]), 3.5);
  oval(g, 0, 3, 100, 35);
  const inner = g.createRadialGradient(-26, -10, 6, 0, 3, 100);
  inner.addColorStop(0, C.pan);
  inner.addColorStop(1, C.panDark);
  g.fillStyle = inner;
  g.fill();
  g.restore();
}

interface TossFx {
  tosses: number;
  /** Seconds since the last toss, for the flight. */
  age: number;
  prevX: number;
  tilt: number;
  hot: boolean;
  done: boolean;
  sizzle: number;
}

/** How long one toss flies, in seconds. */
const FLIGHT = 0.45;

const toss: Step<TossOptions, TossState, TossFx> = {
  kind: 'toss',
  uses: (o) => [[o.item, 'tossed']],
  start: (o) => startToss(o.tosses ?? TOSS_COUNT),

  title: (o) => `Toss the ${pluralOf(ingredient(o.item))}!`,
  hint: () => ['Swipe left and right,', 'but not too hot!'],
  icon: (o) => ingredient(o.item).icon,
  progress: ({ state }) => [state.target, Math.min(state.target, state.tosses)],

  press: (turn, x) => pressToss(turn, x),
  move: (turn, x) => moveToss(turn, x),
  release: (turn) => {
    turn.state.holding = false;
  },
  update: (turn, dt) => updateToss(turn, dt),

  fx: () => ({ tosses: 0, age: 9, prevX: 390, tilt: 0, hot: false, done: false, sizzle: 0 }),

  observe({ state: s, options, fx, dt, effects }) {
    if (s.tosses > fx.tosses) {
      fx.age = 0;
      effects.sound.whoosh();
      effects.sound.tone(420 + s.tosses * 25, 0.1, { type: 'triangle', volume: 0.08 });
    }
    fx.tosses = s.tosses;
    fx.age += dt;
    // The pan tips the way it's moving.
    const v = (s.panX - fx.prevX) / Math.max(dt, 1 / 120);
    fx.prevX = s.panX;
    fx.tilt += (clamp01(Math.abs(v) / 900) * Math.sign(v) * 0.12 - fx.tilt) * Math.min(1, dt * 12);
    // A gentle "uh oh" the moment it gets too hot.
    const hot = tooHot(s);
    if (hot && !fx.hot) effects.sound.tone(520, 0.25, { volume: 0.1, slideTo: 380 });
    fx.hot = hot;
    if (tossing(s)) {
      fx.sizzle -= dt;
      if (fx.sizzle <= 0) {
        effects.sound.sizzle();
        fx.sizzle = 0.35;
      }
    }
    if (s.done && !fx.done) {
      effects.sound.ding();
      effects.celebrate(s.panX, PAN_Y - 40);
      effects.burst(
        s.panX,
        PAN_Y - 30,
        12,
        ['heart', 'star'],
        ingredient(options.item).colors,
        240,
      );
    }
    fx.done = s.done;
  },

  draw({ g, t, state: s, options, fx, taking }) {
    const art = artOf(options.item, 'tossed');

    // The hob on the counter, with soft flames that grow with the heat.
    shadow(g, 400, 372, 190, 12);
    rounded(g, 230, 338, 340, 26, 13);
    fillStroke(g, vertical(g, 338, 364, [C.lavenderLight, C.lavender]), 3.5);
    for (let i = 0; i < 7; i++) {
      const fxX = 330 + i * 23;
      const h = 10 + s.heat * 18 + Math.sin(t * 14 + i * 1.7) * 3;
      g.beginPath();
      g.moveTo(fxX - 7, 340);
      g.quadraticCurveTo(fxX - 6, 340 - h * 0.6, fxX, 340 - h);
      g.quadraticCurveTo(fxX + 6, 340 - h * 0.6, fxX + 7, 340);
      g.closePath();
      fillStroke(g, vertical(g, 340 - h, 340, [C.butter, C.ember]), 2);
    }

    // The pan, then what's in it, flying up with each toss.
    const panY = PAN_Y + (s.holding ? Math.sin(t * 20) * 1 : 0);
    drawPan(g, s.panX, panY, fx.tilt);
    const flying = fx.age < FLIGHT;
    const p = flying ? fx.age / FLIGHT : 0;
    const lift = flying ? Math.sin(Math.PI * p) * 70 : 0;
    g.save();
    g.translate(s.panX, panY + 3 - lift);
    g.rotate(flying ? Math.sin(Math.PI * 2 * p) * 0.25 : fx.tilt);
    art.draw(g, { x: 0, y: 0, r: 92, t, lumps: lumpsOf(s), tossing: flying });
    g.restore();
    drawSteam(g, t, s.panX, panY - 50, 40, { alpha: 0.85, rise: 40, length: 8 });

    drawThermometer(g, t, s.heat);

    if (tooHot(s) && !s.done) {
      const bob = Math.sin(t * 6) * 3;
      stickerText(g, 'Not too hot!', 560, 410 + bob, 24, C.hotPink);
    }

    // While nobody's holding: a finger sliding left and right.
    if (taking && !s.holding && !s.done) {
      const cx = 390;
      const y = 172;
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      g.setLineDash([2, 12]);
      g.beginPath();
      g.moveTo(cx - 90, y);
      g.lineTo(cx + 90, y);
      g.stroke();
      g.setLineDash([]);
      for (const side of [-1, 1]) {
        g.fillStyle = C.white;
        g.beginPath();
        g.moveTo(cx + side * 104, y);
        g.lineTo(cx + side * 90, y - 10);
        g.lineTo(cx + side * 90, y + 10);
        g.closePath();
        g.fill();
      }
      g.fillStyle = C.ink;
      emoji(g, '👆', cx + Math.sin(t * 3) * 70, y + 20, 40);
    }
  },
};

export default toss;
