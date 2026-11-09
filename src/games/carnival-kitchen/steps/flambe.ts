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
import {
  STEP_POINTS,
  accuracy,
  between,
  drawMeter,
  finishStep,
  scoreAction,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Flambé: a show-off finish with pretend fire. Press on the pan and WHOOSH,
 * big cartoon flames jump up; keep holding and they dance higher while the
 * meter fills. Let go when it reaches the star, and the flames pop into a
 * firework of sparks. Three goes. Letting go too soon is "Not yet!" and the
 * meter keeps its level, so she just holds again; a full meter lets go by
 * itself. The fire is only ever pretend: Chef Bunny says so.
 */

export interface FlambeOptions extends StepBasics {
  kind: 'flambe';
  /** What's in the pan: an ingredient with `flip` art (it's drawn in the pan). */
  item: string;
  /** How many flambés. 3 if left out. */
  goes?: number;
}

declare module '../kit/types' {
  interface StepKinds {
    flambe: FlambeOptions;
  }
}

export const FLAMBE_GOES = 3;
/** Meter per second while held: about two seconds to fill. */
export const FLAMBE_SPEED = 0.45;
/** Where each go's star lands, at random between these. */
export const FLAMBE_LOW = 0.55;
export const FLAMBE_HIGH = 0.8;
/** Within `perfect` of the star scores in full, falling to nothing `zone` away. Very kind. */
export const FLAMBE_RULES = { perfect: 0.1, zone: 0.5 } as const;
/** Letting go below this is "Not yet!": the flames keep going for the next hold. */
export const FLAMBE_SOON = 0.15;
/** Seconds the fireworks are shown off before the step ends. */
export const FLAMBE_FINALE = 1.4;

/** The pan's middle. */
const PAN = { x: 380, y: 320 } as const;

export interface FlambeState {
  targets: number[];
  /** 0 to 1: how high the flames have danced this go. */
  level: number;
  holding: boolean;
  index: number;
  /** Each go's share of its points. */
  results: number[];
  points: number;
  /** How many times the flames have whooshed up (each press). */
  whooshes: number;
  /** Seconds left of the fireworks before the step ends, once every go is done. */
  finale: number;
}

export function startFlambe(count: number, random: () => number): FlambeState {
  return {
    targets: Array.from({ length: count }, () => between(random, FLAMBE_LOW, FLAMBE_HIGH)),
    level: 0,
    holding: false,
    index: 0,
    results: [],
    points: 0,
    whooshes: 0,
    finale: -1,
  };
}

function letGo(turn: Turn<FlambeOptions, FlambeState>): number {
  const s = turn.state;
  const share = accuracy(
    Math.abs(s.level - s.targets[s.index]),
    FLAMBE_RULES.perfect,
    FLAMBE_RULES.zone,
  );
  const points = scoreAction(turn.round, share, STEP_POINTS / s.targets.length);
  s.points += points;
  s.results.push(share);
  s.index += 1;
  s.level = 0;
  s.holding = false;
  if (s.index === s.targets.length) s.finale = FLAMBE_FINALE;
  return points;
}

/** Whoosh! Starts the flames dancing. */
export function pressFlambe(turn: Turn<FlambeOptions, FlambeState>): boolean {
  const s = turn.state;
  if (s.finale >= 0 || s.index >= s.targets.length) return true;
  s.holding = true;
  s.whooshes += 1;
  return true;
}

/** Lets go: scores by how near the star the flames were, or "Not yet!" if they'd barely started. */
export function releaseFlambe(turn: Turn<FlambeOptions, FlambeState>): number | 'not yet' | null {
  const s = turn.state;
  if (!s.holding) return null;
  if (s.level < FLAMBE_SOON) {
    s.holding = false;
    return 'not yet';
  }
  return letGo(turn);
}

export function updateFlambe(turn: Turn<FlambeOptions, FlambeState>, dt: number): void {
  const s = turn.state;
  if (s.finale >= 0) {
    s.finale -= dt;
    if (s.finale <= 0) {
      s.finale = 0;
      finishStep(turn.round, s.points);
    }
    return;
  }
  if (!s.holding) return;
  s.level = Math.min(1, s.level + FLAMBE_SPEED * dt);
  if (s.level === 1) letGo(turn);
}

/** For tests: holds right up to the star and lets go, for every go, then waits for the show. */
export function solveFlambe(turn: Turn<FlambeOptions, FlambeState>): void {
  const s = turn.state;
  while (s.index < s.targets.length) {
    pressFlambe(turn);
    s.level = s.targets[s.index];
    releaseFlambe(turn);
  }
}

// ---------------------------------------------------------------------------
// Drawing

/** One cartoon flame tongue, its foot at (x, y), `h` tall and `w` wide. */
function tongue(g: G, x: number, y: number, w: number, h: number, lean: number, colors: string[]) {
  g.beginPath();
  g.moveTo(x - w, y);
  g.bezierCurveTo(x - w * 1.1, y - h * 0.45, x + lean - w * 0.5, y - h * 0.7, x + lean, y - h);
  g.bezierCurveTo(x + lean + w * 0.5, y - h * 0.7, x + w * 1.1, y - h * 0.45, x + w, y);
  g.closePath();
  fillStroke(g, vertical(g, y - h, y, colors), 3);
}

/** Big friendly flames, `size` 0 (none) to about 1.4 (a whoosh). */
function drawFlames(g: G, t: number, size: number) {
  if (size < 0.03) return;
  // Tall, but never up over the recipe along the top.
  size = Math.min(size, 1.35);
  const base = PAN.y - 30;
  const outer = [C.hotPink, C.ember, C.gold];
  const inner = [C.gold, C.butter, C.white];
  const tongues = [-2, 2, -1, 1, 0];
  for (const k of tongues) {
    const wob = Math.sin(t * 9 + k * 1.9) * 0.12 + Math.sin(t * 15 + k) * 0.06;
    const h = (45 + size * 75) * (1 - Math.abs(k) * 0.18) * (1 + wob);
    const w = 34 + size * 12 - Math.abs(k) * 4;
    const x = PAN.x + k * 46;
    const lean = Math.sin(t * 4 + k) * 14 * size;
    tongue(g, x, base, w, h, lean, outer);
    tongue(g, x, base, w * 0.55, h * 0.62, lean * 0.7, inner);
  }
  // The big middle flame has a happy face.
  const h0 = (45 + size * 75) * (1 + Math.sin(t * 9) * 0.12);
  face(g, PAN.x + Math.sin(t * 4) * 5 * size, base - h0 * 0.32, 0.75 + size * 0.25, 'joy');
}

/** The pan on the hob, seen a little from above, with what's in it. */
function drawPan(g: G, t: number, item: string, glow: number) {
  // The hob.
  shadow(g, 400, 402, 210, 14);
  rounded(g, 190, 372, 420, 26, 13);
  fillStroke(g, vertical(g, 372, 398, [C.lavenderLight, C.lavender]), 3.5);
  // The handle, then the pan.
  rounded(g, PAN.x + 140, PAN.y - 12, 72, 26, 13);
  fillStroke(g, horizontal(g, PAN.x + 140, PAN.x + 212, [C.hotPink, C.pink]));
  circle(g, PAN.x + 196, PAN.y + 1, 6);
  fillStroke(g, C.wallBottom, 3);
  oval(g, PAN.x, PAN.y + 6, 160, 62);
  fillStroke(g, vertical(g, PAN.y - 56, PAN.y + 68, [C.panLight, C.pan, C.panDark]));
  oval(g, PAN.x, PAN.y, 140, 48);
  const inner = g.createRadialGradient(PAN.x - 30, PAN.y - 14, 8, PAN.x, PAN.y, 140);
  inner.addColorStop(0, blend([C.pan, C.ember], glow * 0.6));
  inner.addColorStop(1, C.panDark);
  g.fillStyle = inner;
  g.fill();
  // The food, in a pool of shiny orange sauce.
  oval(g, PAN.x, PAN.y + 4, 118, 36);
  g.fillStyle = 'rgba(255, 154, 61, 0.75)';
  g.fill();
  g.save();
  g.translate(PAN.x, PAN.y - 4);
  g.scale(0.85, 0.7);
  artOf(item, 'flip').drawInPan(g, { up: true, flipping: false });
  g.restore();
  g.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 6; i++) {
    const phase = (t * 1.4 + i * 0.31) % 1;
    circle(g, PAN.x - 100 + i * 40, PAN.y + 18 - phase * 10, 2 + phase * 2);
    g.fill();
  }
}

interface FlambeFx {
  whooshes: number;
  results: number;
  /** How big the flames are drawn, easing toward where they should be. */
  flame: number;
  /** Seconds since the first whoosh, for the "Pretend fire!" sign. */
  pretend: number;
  crackle: number;
  spark: number;
  shake: number;
  finale: boolean;
}

const flambe: Step<FlambeOptions, FlambeState, FlambeFx> = {
  kind: 'flambe',
  finisher: true,
  uses: (o) => [[o.item, 'flip']],
  start: (o, random) => startFlambe(o.goes ?? FLAMBE_GOES, random),

  title: (o) => `Flambé the ${pluralOf(ingredient(o.item))}!`,
  hint: () => ['Hold the pan for', 'pretend fire!'],
  icon: () => '🔥',
  progress: ({ state }) => [state.targets.length, state.results.length],
  points: ({ state }) => state.points,

  press: (turn) => pressFlambe(turn),
  release: (turn) => releaseFlambe(turn),
  update: (turn, dt) => updateFlambe(turn, dt),
  solve: (turn) => solveFlambe(turn),

  fx: () => ({
    whooshes: 0,
    results: 0,
    flame: 0,
    pretend: -1,
    crackle: 0,
    spark: 0,
    shake: 0,
    finale: false,
  }),

  observe({ state: s, fx, dt, effects }) {
    if (s.whooshes > fx.whooshes) {
      // WHOOSH: the flames leap up.
      effects.sound.whoosh();
      effects.sound.hiss(0.7, { filter: 'lowpass', from: 300, to: 2400, volume: 0.22 });
      effects.sound.tone(180, 0.5, { type: 'sawtooth', volume: 0.05, slideTo: 420 });
      fx.flame = Math.max(fx.flame, 1.35);
      fx.shake = 0.6;
      effects.burst(PAN.x, PAN.y - 60, 14, ['star', 'dot'], [C.gold, C.ember, C.butter], 300);
      if (fx.pretend < 0) {
        fx.pretend = 0;
        effects.sound.chatter('Ta-da! Pretend fire!');
      }
    }
    fx.whooshes = s.whooshes;
    if (fx.pretend >= 0) fx.pretend += dt;

    // The flames ease toward their height: taller as the meter fills.
    const want = s.holding ? 0.55 + s.level * 0.8 : 0;
    fx.flame += (want - fx.flame) * Math.min(1, dt * (s.holding ? 4 : 3));
    if (s.holding) {
      fx.crackle -= dt;
      if (fx.crackle <= 0) {
        effects.sound.sizzle();
        fx.crackle = 0.3;
      }
      fx.spark -= dt;
      if (fx.spark <= 0) {
        effects.burst(
          PAN.x + Math.sin(fx.flame * 40) * 60,
          PAN.y - 100 - s.level * 120,
          3,
          ['star'],
          [C.gold, C.butter],
          160,
          60,
        );
        fx.spark = 0.12;
      }
    }

    // Each go ends in fireworks.
    if (s.results.length > fx.results) {
      const share = s.results[s.results.length - 1];
      effects.sound.pop();
      effects.sound.chime([783.99, 1046.5, 1318.5], 0.08, 0.16);
      effects.celebrate(PAN.x, PAN.y - 140);
      const bursts = 2 + Math.round(share * 2);
      for (let k = 0; k < bursts; k++) {
        effects.burst(
          PAN.x - 150 + k * (300 / Math.max(1, bursts - 1)),
          150 + (k % 2) * 40,
          16,
          ['star', 'confetti', 'heart'],
          [C.hotPink, C.gold, C.mint, C.sky, C.lavender],
          280,
          120,
        );
      }
      fx.shake = 0.8;
    }
    fx.results = s.results.length;
    if (s.finale >= 0 && !fx.finale) {
      fx.finale = true;
      effects.sound.fanfare();
      effects.sound.chatter('Real fire is just for grown-ups!');
    }
    fx.shake = Math.max(0, fx.shake - dt * 1.8);
  },

  draw({ g, t, state: s, options, fx, taking }) {
    const shake = fx.shake * fx.shake * 8;
    g.save();
    g.translate(Math.sin(t * 57) * shake, Math.cos(t * 43) * shake);

    // A warm glow on the wall behind the flames.
    if (fx.flame > 0.05) {
      const glow = g.createRadialGradient(PAN.x, PAN.y - 80, 20, PAN.x, PAN.y - 80, 260);
      glow.addColorStop(0, `rgba(255, 201, 60, ${0.35 * clamp01(fx.flame)})`);
      glow.addColorStop(1, 'rgba(255, 201, 60, 0)');
      g.fillStyle = glow;
      g.fillRect(PAN.x - 300, PAN.y - 360, 600, 440);
    }

    drawPan(g, t, options.item, clamp01(fx.flame));
    drawFlames(g, t, fx.flame);

    if (fx.pretend >= 0 && fx.pretend < 2.5) {
      const pop = Math.min(1, fx.pretend * 4);
      stickerText(g, 'Pretend fire!', PAN.x, 140 + Math.sin(t * 6) * 4, 30 * pop + 1, C.hotPink);
    }

    const playing = s.index < s.targets.length && s.finale < 0;
    if (playing) drawMeter(g, t, s.level, s.targets[s.index], [C.hotPink, C.ember, C.gold]);

    if (taking && playing && !s.holding) {
      const pulse = 1 + Math.sin(t * 6) * 0.08;
      g.fillStyle = C.ink;
      emoji(g, '👆', PAN.x + 40, PAN.y + 40, 46 * pulse);
      stickerText(g, 'Hold!', PAN.x - 70, PAN.y + 60, 30, C.gold);
    }
    if (s.finale >= 0) {
      stickerText(g, 'Ta-da!', PAN.x, 438 + Math.sin(t * 5) * 4, 40, C.gold);
    }
    g.restore();
  },
};

export default flambe;
