import {
  C,
  type G,
  type Mood,
  clamp01,
  emoji,
  face,
  fillStroke,
  horizontal,
  oval,
  shadow,
  stickerText,
  vertical,
} from '../art';
import {
  STEP_POINTS,
  accuracy,
  finishStep,
  scoreAction,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Dough toss: a show-off pizza move. Swipe up on the dough to fling it into
 * the air, spinning. It flies up and comes down again; tap when it's back in
 * the gold ring to catch it. Three tosses, each higher than the last (the
 * third goes right off the top of the kitchen). A missed catch never fails:
 * the dough just bounces softly onto the board and the next toss is ready.
 */

export interface DoughTossOptions extends StepBasics {
  kind: 'dough-toss';
  /** How many tosses, each higher. 3 if left out. */
  tosses?: number;
}

declare module '../kit/types' {
  interface StepKinds {
    'dough-toss': DoughTossOptions;
  }
}

export const DOUGH_TOSSES = 3;
/** Where the dough rests on the board, and where the catching ring is. */
export const DOUGH_X = 400;
export const CATCH_Y = 300;
/** How high each toss goes above the ring, and how long it flies, in order. */
export const TOSS_HEIGHTS = [150, 240, 360];
export const TOSS_TIMES = [1.5, 1.8, 2.1];
/** A swipe this far up flings the dough. */
export const SWIPE_UP = 40;
/** A catch within `perfect` of the ring scores in full, falling to nothing at `miss`. */
export const CATCH_RULES = { perfect: 28, miss: 130 } as const;
/** Taps are only a catch on the way down, this near the ring; sooner is "Not yet!". */
export const CATCH_ZONE = 150;
/** Below the ring by this much, the dough has missed and bounces onto the board. */
export const MISS_BELOW = 40;
/** A dropped catch still earns this share: it landed safe on the board. */
export const DROP_SHARE = 0.3;
/** Seconds after a catch or a bounce before the next toss is ready. */
export const DOUGH_REST = 0.7;
/** Seconds the last toss is shown off before the step ends. */
export const DOUGH_FINALE = 1.2;

export interface DoughTossState {
  /** One entry per toss: its height and flight time. */
  goes: { height: number; time: number }[];
  /** Which toss is next or flying; `goes.length` once they're all done. */
  index: number;
  /** 'ready' to swipe, 'flying' in the air, or 'resting' after a catch or a bounce. */
  phase: 'ready' | 'flying' | 'resting';
  /** Seconds into the flight, or into the rest. */
  time: number;
  /** Where the finger went down, while it's down. */
  pressY: number | null;
  /** Each toss's share of its points, 0 to 1, and whether it was caught. */
  results: number[];
  caught: boolean[];
  points: number;
  /** Seconds left of the show before the step ends, once every toss is done. */
  finale: number;
}

export function startDoughToss(count = DOUGH_TOSSES): DoughTossState {
  return {
    goes: Array.from({ length: count }, (_, i) => ({
      height: TOSS_HEIGHTS[Math.min(i, TOSS_HEIGHTS.length - 1)] + Math.max(0, i - 2) * 40,
      time: TOSS_TIMES[Math.min(i, TOSS_TIMES.length - 1)],
    })),
    index: 0,
    phase: 'ready',
    time: 0,
    pressY: null,
    results: [],
    caught: [],
    points: 0,
    finale: -1,
  };
}

/** Where the dough is: its middle's y, in the air or on the board. */
export function doughY(s: DoughTossState): number {
  if (s.phase !== 'flying') return CATCH_Y;
  const go = s.goes[s.index];
  const p = s.time / go.time;
  // A parabola through the ring at p = 0 and p = 1, peaking at p = 0.5; it
  // keeps falling past the ring until it's missed.
  return CATCH_Y - 4 * go.height * p * (1 - p);
}

/** Whether the dough is on its way down, near enough the ring to catch. */
export function catchable(s: DoughTossState): boolean {
  if (s.phase !== 'flying') return false;
  const go = s.goes[s.index];
  return s.time > go.time / 2 && Math.abs(doughY(s) - CATCH_Y) <= CATCH_ZONE;
}

/** Flings the dough, if it's ready. */
export function launch(s: DoughTossState): boolean {
  if (s.phase !== 'ready' || s.index >= s.goes.length) return false;
  s.phase = 'flying';
  s.time = 0;
  s.pressY = null;
  return true;
}

function land(turn: Turn<DoughTossOptions, DoughTossState>, share: number, caught: boolean) {
  const s = turn.state;
  s.points += scoreAction(turn.round, share, STEP_POINTS / s.goes.length);
  s.results.push(share);
  s.caught.push(caught);
  s.index += 1;
  s.phase = 'resting';
  s.time = 0;
  if (s.index === s.goes.length) s.finale = DOUGH_FINALE;
}

/**
 * Catches the dough on the way down, scoring by how near the ring it was.
 * Returns false ("Not yet!") while it's still going up or far above.
 */
export function catchDough(turn: Turn<DoughTossOptions, DoughTossState>): boolean {
  const s = turn.state;
  if (!catchable(s)) return false;
  land(turn, accuracy(Math.abs(doughY(s) - CATCH_Y), CATCH_RULES.perfect, CATCH_RULES.miss), true);
  return true;
}

export function pressDough(turn: Turn<DoughTossOptions, DoughTossState>, y: number): boolean {
  const s = turn.state;
  if (s.finale >= 0) return true;
  if (s.phase === 'ready') {
    s.pressY = y;
    return true;
  }
  if (s.phase === 'flying') return catchDough(turn);
  // Still settling after a catch: nothing to do yet.
  return false;
}

export function moveDough(turn: Turn<DoughTossOptions, DoughTossState>, y: number): void {
  const s = turn.state;
  if (s.phase === 'ready' && s.pressY !== null && s.pressY - y >= SWIPE_UP) launch(s);
}

/** Letting go without swiping up is "Not yet!": the dough waits for a swipe. */
export function releaseDough(turn: Turn<DoughTossOptions, DoughTossState>): 'not yet' | null {
  const s = turn.state;
  const tapped = s.phase === 'ready' && s.pressY !== null;
  s.pressY = null;
  return tapped && s.finale < 0 ? 'not yet' : null;
}

export function updateDough(turn: Turn<DoughTossOptions, DoughTossState>, dt: number): void {
  const s = turn.state;
  if (s.finale >= 0) {
    s.time += dt;
    s.finale -= dt;
    if (s.finale <= 0) {
      s.finale = 0;
      finishStep(turn.round, s.points);
    }
    return;
  }
  s.time += dt;
  if (
    s.phase === 'flying' &&
    s.time > s.goes[s.index].time / 2 &&
    doughY(s) > CATCH_Y + MISS_BELOW
  ) {
    // Missed: it flops softly onto the board. Never a fail.
    land(turn, DROP_SHARE, false);
  } else if (s.phase === 'resting' && s.time >= DOUGH_REST) {
    s.phase = 'ready';
    s.time = 0;
  }
}

/** For tests: swipe up, then wait for the dough to come down and catch it right in the ring. */
export function solveDough(turn: Turn<DoughTossOptions, DoughTossState>): void {
  const s = turn.state;
  if (s.phase === 'resting') s.time = DOUGH_REST;
  if (s.phase === 'resting' || s.phase === 'ready') {
    s.phase = 'ready';
    launch(s);
  }
  if (s.phase === 'flying') {
    s.time = s.goes[s.index].time;
    catchDough(turn);
  }
}

// ---------------------------------------------------------------------------
// Drawing

/** The pizza dough, a little from the side, spinning: `spin` turns its dimples round. */
function drawDough(g: G, r: number, spin: number, mood: Mood) {
  const ry = r * 0.36;
  oval(g, 0, 8, r, ry);
  fillStroke(g, C.crustGold, 3.5);
  oval(g, 0, 0, r, ry);
  fillStroke(g, vertical(g, -ry, ry, [C.doughLight, C.dough]), 3.5);
  // The rim, and dimples going round as it spins.
  oval(g, 0, 0, r * 0.82, ry * 0.74);
  g.strokeStyle = 'rgba(242, 180, 87, 0.7)';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = 'rgba(242, 180, 87, 0.55)';
  for (let k = 0; k < 6; k++) {
    const a = spin + (k / 6) * Math.PI * 2;
    oval(g, Math.cos(a) * r * 0.58, Math.sin(a) * ry * 0.5, 7, 3);
    g.fill();
  }
  face(g, 0, -ry * 0.1, 0.8, mood);
}

/** The wooden board on the counter. */
function drawBoard(g: G) {
  shadow(g, DOUGH_X + 6, 362, 170, 16);
  oval(g, DOUGH_X, 344, 160, 34);
  fillStroke(g, vertical(g, 312, 378, [C.woodLight, C.wood, C.woodDark]), 3.5);
  oval(g, DOUGH_X, 338, 150, 26);
  fillStroke(g, horizontal(g, 250, 550, [C.wood, C.woodLight, C.wood]), 2.5);
}

interface DoughFx {
  phase: DoughTossState['phase'];
  index: number;
  /** How hard the scene shakes, 0 to 1. */
  shake: number;
  spin: number;
  /** Seconds since the dough last landed, and whether it was caught. */
  landAge: number;
  caught: boolean;
  peaked: boolean;
  whirr: number;
  cheered: boolean;
}

const doughToss: Step<DoughTossOptions, DoughTossState, DoughFx> = {
  kind: 'dough-toss',
  finisher: true,
  uses: () => [],
  start: (o) => startDoughToss(o.tosses ?? DOUGH_TOSSES),

  title: () => 'Toss the dough!',
  hint: () => ['Swipe up to toss it,', 'tap to catch it!'],
  icon: () => '🍕',
  progress: ({ state }) => [state.goes.length, state.results.length],
  points: ({ state }) => state.points,

  press: (turn, _x, y) => pressDough(turn, y),
  move: (turn, _x, y) => moveDough(turn, y),
  release: (turn) => releaseDough(turn),
  update: (turn, dt) => updateDough(turn, dt),
  solve: (turn) => solveDough(turn),

  fx: () => ({
    phase: 'ready',
    index: 0,
    shake: 0,
    spin: 0,
    landAge: 9,
    caught: false,
    peaked: false,
    whirr: 0,
    cheered: false,
  }),

  observe({ state: s, fx, dt, effects }) {
    if (s.phase === 'flying' && fx.phase !== 'flying') {
      // Up it goes: a whoosh rising higher with every toss, and a shake.
      effects.sound.whoosh();
      effects.sound.hiss(0.5, { filter: 'bandpass', from: 500, to: 2600, volume: 0.14 });
      effects.sound.tone(300 + s.index * 80, 0.45, { type: 'triangle', volume: 0.1, slideTo: 900 });
      fx.shake = 0.5 + s.index * 0.2;
      fx.peaked = false;
      effects.calm();
    }
    if (s.phase === 'flying') {
      const go = s.goes[s.index];
      if (!fx.peaked && s.time >= go.time / 2) {
        fx.peaked = true;
        effects.sound.tone(1200 + s.index * 200, 0.15, { type: 'sine', volume: 0.08 });
      }
      fx.whirr -= dt;
      if (fx.whirr <= 0) {
        effects.sound.hiss(0.12, { filter: 'highpass', from: 3000, volume: 0.04 });
        fx.whirr = 0.18;
      }
    }
    if (s.results.length > fx.index) {
      const caught = s.caught[s.caught.length - 1];
      fx.landAge = 0;
      fx.caught = caught;
      fx.shake = Math.max(fx.shake, caught ? 0.35 : 0.2);
      if (caught) {
        effects.sound.pop();
        effects.celebrate(DOUGH_X, CATCH_Y - 40);
        effects.burst(
          DOUGH_X,
          CATCH_Y - 10,
          14,
          ['star', 'dot'],
          [C.gold, C.dough, C.hotPink],
          260,
        );
      } else {
        // A soft flop and a boing: never a fail.
        effects.sound.bloop();
        effects.sound.tone(260, 0.3, { type: 'sine', volume: 0.12, slideTo: 420 });
        effects.burst(DOUGH_X, 330, 8, ['dot'], [C.dough, C.white], 140);
      }
      if (s.finale >= 0 && !fx.cheered) {
        fx.cheered = true;
        effects.sound.chime([523.25, 659.25, 783.99, 1046.5], 0.1, 0.18);
        effects.burst(
          DOUGH_X,
          200,
          30,
          ['confetti', 'star'],
          [C.hotPink, C.gold, C.mint, C.sky],
          360,
        );
      }
    }
    fx.index = s.results.length;
    fx.phase = s.phase;
    fx.landAge += dt;
    fx.shake = Math.max(0, fx.shake - dt * 1.6);
    const speed = s.phase === 'flying' ? 14 : fx.landAge < 0.5 ? 6 : 0.6;
    fx.spin += speed * dt;
  },

  draw({ g, t, state: s, fx, taking }) {
    // The whole scene shakes a little as the dough flies and lands.
    const shake = fx.shake * fx.shake * 9;
    g.save();
    g.translate(Math.sin(t * 53) * shake, Math.cos(t * 41) * shake);

    drawBoard(g);
    const flying = s.phase === 'flying';
    const y = doughY(s);
    const near = catchable(s);

    // Its shadow on the board grows as it comes down.
    const height = CATCH_Y - y;
    g.fillStyle = `rgba(91, 59, 79, ${0.1 + 0.18 * clamp01(1 - height / 360)})`;
    oval(g, DOUGH_X, 340, 120 * (1 - 0.5 * clamp01(height / 360)), 16);
    g.fill();

    // The gold ring: where to catch it.
    if (s.finale < 0 && (flying || s.phase === 'ready')) {
      g.setLineDash([10, 8]);
      g.lineDashOffset = -t * 30;
      g.lineWidth = near ? 7 : 5;
      g.strokeStyle = near ? C.gold : 'rgba(255, 255, 255, 0.9)';
      oval(g, DOUGH_X, CATCH_Y, 132 + Math.sin(t * 6) * 3, 46);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
    }

    // Speed lines under it on the way up.
    if (flying && s.time < s.goes[s.index].time / 2) {
      g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      g.lineWidth = 5;
      g.lineCap = 'round';
      for (const dx of [-60, -20, 20, 60]) {
        g.beginPath();
        g.moveTo(DOUGH_X + dx, y + 40);
        g.lineTo(DOUGH_X + dx * 0.8, y + 90 + Math.abs(dx) * 0.3);
        g.stroke();
      }
    }

    // The dough: spinning in the air, squashing as it lands.
    const squash = fx.landAge < 0.35 ? Math.sin((fx.landAge / 0.35) * Math.PI) * 0.25 : 0;
    const restY = fx.caught || fx.landAge > 0.35 ? y : y + 18;
    g.save();
    g.translate(DOUGH_X, flying ? y : restY);
    g.rotate(flying ? Math.sin(s.time * 5) * 0.18 : 0);
    g.scale(1 + squash, 1 - squash);
    drawDough(g, 110, fx.spin, flying ? 'wow' : fx.landAge < 1 ? 'joy' : 'happy');
    g.restore();

    // Gone right off the top: an arrow says where it is.
    if (flying && y < 40) {
      const bob = Math.sin(t * 8) * 4;
      g.fillStyle = C.ink;
      emoji(g, '🍕', DOUGH_X, 134 + bob, 34);
      stickerText(g, 'Wheee!', DOUGH_X + 90, 134 + bob, 26, C.hotPink);
    }

    if (taking && near && s.finale < 0) {
      stickerText(g, 'Tap!', DOUGH_X + 190, CATCH_Y - 10 + Math.sin(t * 10) * 4, 34, C.gold);
    }

    // Ready: a finger swiping up from the dough.
    if (taking && s.phase === 'ready' && s.finale < 0) {
      const p = (t * 0.9) % 1;
      g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(DOUGH_X + 170, 300);
      g.lineTo(DOUGH_X + 170, 170);
      g.stroke();
      g.fillStyle = C.white;
      g.beginPath();
      g.moveTo(DOUGH_X + 170, 150);
      g.lineTo(DOUGH_X + 156, 172);
      g.lineTo(DOUGH_X + 184, 172);
      g.closePath();
      g.fill();
      g.fillStyle = C.ink;
      emoji(g, '👆', DOUGH_X + 178, 300 - p * 120, 44);
    }

    if (s.finale >= 0) {
      stickerText(g, 'Pizza pro!', DOUGH_X, 425 + Math.sin(t * 5) * 4, 40, C.gold);
    }
    g.restore();
  },
};

export default doughToss;
