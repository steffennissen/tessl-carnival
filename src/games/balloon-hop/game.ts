import {
  canvasFont,
  prizeFor,
  recordScore,
  theme,
  type CarnivalGame,
  type PrizeTier,
} from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

/** Fixed simulation step, in seconds. */
export const STEP = 1 / 120;
/** The most time one frame may feed the simulation: at most 12 steps. */
export const MAX_FRAME = 0.1;
export const GRAVITY = 900;
/** A hop sets the balloon's velocity to this; it doesn't add to it. */
export const HOP_VELOCITY = -270;
export const MAX_FALL = 300;
/** Poles and ground move together at this speed. */
export const SCROLL_SPEED = 150;
export const OBSTACLE_W = 52;
export const GAP = 130;
export const SPACING = 200;
/** Largest change between consecutive gap centres. */
export const MAX_GAP_DELTA = 110;
export const GAP_MARGIN = 50;
export const GROUND_H = 60;
export const GROUND_Y = HEIGHT - GROUND_H;
export const PLAYER_X = 220;
/** Collision radius. The balloon is drawn a little larger. */
export const PLAYER_R = 10;
/** Simulation seconds after a round ends before a press starts a new one. */
export const RESTART_LOCKOUT = 0.5;

/** Gap centres stay in 115 to 325, so every gap sits clear of the top and the ground. */
export const GAP_MIN_Y = GAP_MARGIN + GAP / 2;
export const GAP_MAX_Y = GROUND_Y - GAP_MARGIN - GAP / 2;
export const FIRST_POLE_X = 620;
const START_Y = 220;
const BOB_AMPLITUDE = 6;
const BOB_SPEED = 3;
/** The upper rectangle reaches this far above the canvas, so nobody flies over a pole. */
const SKY_REACH = 10_000;
const PLANK_W = 40;

export const PRIZES: readonly PrizeTier[] = [
  { name: 'Paper Pennant', minScore: 10 },
  { name: 'Plush Monkey', minScore: 20 },
  { name: 'Giant Teddy Bear', minScore: 30 },
  { name: 'Golden Ticket', minScore: 40 },
];

export interface Pole {
  /** Left edge. */
  x: number;
  /** Centre of the gap. */
  gapY: number;
  scored: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BalloonHopState {
  phase: 'ready' | 'playing' | 'over';
  /** The random generator's state, an integer. */
  seed: number;
  y: number;
  /** `y` before the last step, for drawing between steps. */
  prevY: number;
  vy: number;
  hopQueued: boolean;
  poles: Pole[];
  score: number;
  /** Simulation seconds spent in the current phase. */
  time: number;
  /** How far the boardwalk has scrolled, modulo one plank. */
  groundX: number;
}

/**
 * mulberry32, a small seeded random generator by bryc
 * (https://github.com/bryc/code/blob/master/jshash/PRNGs.md), public domain.
 * Returns a number in [0, 1) and advances `state.seed`.
 */
export function nextRandom(state: { seed: number }): number {
  const a = (state.seed + 0x6d2b79f5) | 0;
  state.seed = a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** The next gap centre: random, but within MAX_GAP_DELTA of the last one and inside the course. */
export function nextGapY(state: { seed: number }, prevGapY: number): number {
  const wanted = GAP_MIN_Y + nextRandom(state) * (GAP_MAX_Y - GAP_MIN_Y);
  const near = Math.min(Math.max(wanted, prevGapY - MAX_GAP_DELTA), prevGapY + MAX_GAP_DELTA);
  return Math.min(Math.max(near, GAP_MIN_Y), GAP_MAX_Y);
}

/** Runs one `tick` per whole STEP in the accumulator, and returns what's left over. */
export function pump(acc: number, elapsed: number, tick: () => void): number {
  acc += Math.min(Math.max(elapsed, 0), MAX_FRAME);
  while (acc >= STEP) {
    tick();
    acc -= STEP;
  }
  return acc;
}

export function circleHitsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nearestX = Math.min(Math.max(cx, rect.x), rect.x + rect.w);
  const nearestY = Math.min(Math.max(cy, rect.y), rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

/** The pole's two collision rectangles: above the gap and below it. */
export function poleRects(pole: Pole): [Rect, Rect] {
  const top = pole.gapY - GAP / 2;
  const bottom = pole.gapY + GAP / 2;
  return [
    { x: pole.x, y: -SKY_REACH, w: OBSTACLE_W, h: top + SKY_REACH },
    { x: pole.x, y: bottom, w: OBSTACLE_W, h: GROUND_Y - bottom },
  ];
}

export function createState(seed: number): BalloonHopState {
  const state: BalloonHopState = {
    phase: 'ready',
    seed: seed | 0,
    y: START_Y,
    prevY: START_Y,
    vy: 0,
    hopQueued: false,
    poles: [],
    score: 0,
    time: 0,
    groundX: 0,
  };
  const gapY = nextGapY(state, (GAP_MIN_Y + GAP_MAX_Y) / 2);
  state.poles.push({ x: FIRST_POLE_X, gapY, scored: false });
  return state;
}

/**
 * A press. In `ready` it starts the round and hops; in `playing` it queues a
 * hop for the next step. In `over` it is ignored until RESTART_LOCKOUT has
 * passed, and after that it asks for a new round, which the caller makes.
 */
export function hop(state: BalloonHopState): 'started' | 'queued' | 'ignored' | 'restart' {
  if (state.phase === 'ready') {
    state.phase = 'playing';
    state.time = 0;
    state.hopQueued = true;
    return 'started';
  }
  if (state.phase === 'playing') {
    state.hopQueued = true;
    return 'queued';
  }
  return state.time >= RESTART_LOCKOUT ? 'restart' : 'ignored';
}

function fall(state: BalloonHopState, dt: number) {
  state.vy = Math.min(state.vy + GRAVITY * dt, MAX_FALL);
  state.y += state.vy * dt;
  if (state.y < PLAYER_R) {
    state.y = PLAYER_R;
    state.vy = 0;
  }
}

/** Advances the game by `dt` seconds. Call it with STEP. */
export function step(state: BalloonHopState, dt: number): void {
  state.prevY = state.y;
  state.time += dt;

  if (state.phase === 'ready') {
    state.y = START_Y + Math.sin(state.time * BOB_SPEED) * BOB_AMPLITUDE;
    return;
  }

  if (state.phase === 'over') {
    state.hopQueued = false;
    fall(state, dt);
    if (state.y > GROUND_Y - PLAYER_R) {
      state.y = GROUND_Y - PLAYER_R;
      state.vy = 0;
    }
    return;
  }

  if (state.hopQueued) {
    state.vy = HOP_VELOCITY;
    state.hopQueued = false;
  }
  fall(state, dt);

  const scroll = SCROLL_SPEED * dt;
  for (const pole of state.poles) pole.x -= scroll;
  state.groundX = (state.groundX + scroll) % PLANK_W;

  const last = state.poles[state.poles.length - 1];
  if (last.x <= WIDTH) {
    state.poles.push({ x: last.x + SPACING, gapY: nextGapY(state, last.gapY), scored: false });
  }

  const hit =
    state.y >= GROUND_Y - PLAYER_R ||
    state.poles.some((pole) =>
      poleRects(pole).some((rect) => circleHitsRect(PLAYER_X, state.y, PLAYER_R, rect)),
    );
  if (hit) {
    state.phase = 'over';
    state.time = 0;
    return;
  }

  for (const pole of state.poles) {
    if (!pole.scored && pole.x + OBSTACLE_W / 2 <= PLAYER_X) {
      pole.scored = true;
      state.score += 1;
    }
  }

  state.poles = state.poles.filter((pole) => pole.x + OBSTACLE_W >= 0);
}

const STRIPE_H = 16;
const CAP_H = 12;
const BALLOON_R = 13;

function drawPole(ctx: CanvasRenderingContext2D, pole: Pole, x: number) {
  const { colors } = theme;
  const top = pole.gapY - GAP / 2;
  const bottom = pole.gapY + GAP / 2;
  const stripes = (from: number, to: number) => {
    for (let y = from, i = 0; y < to; y += STRIPE_H, i++) {
      ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
      ctx.fillRect(x, y, OBSTACLE_W, Math.min(STRIPE_H, to - y));
    }
  };
  stripes(0, top);
  stripes(bottom, GROUND_Y);
  // The caps are exactly as wide as the collision rectangle, so what you see is what you hit.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x, top - CAP_H, OBSTACLE_W, CAP_H);
  ctx.fillRect(x, bottom, OBSTACLE_W, CAP_H);
}

function drawBalloon(ctx: CanvasRenderingContext2D, y: number, vy: number) {
  const { colors } = theme;
  const tilt = Math.min(Math.max(vy / MAX_FALL, -1), 1) * 0.35;
  ctx.save();
  ctx.translate(PLAYER_X, y);
  ctx.rotate(tilt);

  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, BALLOON_R + 3);
  ctx.quadraticCurveTo(-7, BALLOON_R + 14, 0, BALLOON_R + 28);
  ctx.stroke();

  ctx.fillStyle = colors.danger;
  ctx.beginPath();
  ctx.moveTo(-3, BALLOON_R + 4);
  ctx.lineTo(3, BALLOON_R + 4);
  ctx.lineTo(0, BALLOON_R - 1);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, BALLOON_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.text;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(-4, -5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, groundX: number) {
  const { colors } = theme;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, GROUND_Y, WIDTH, GROUND_H);
  ctx.fillStyle = colors.background;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, GROUND_Y, WIDTH, 3);
  for (let x = -groundX; x < WIDTH; x += PLANK_W) ctx.fillRect(x, GROUND_Y, 2, GROUND_H);
  ctx.globalAlpha = 1;
}

function drawCaption(ctx: CanvasRenderingContext2D, lines: [string, string?, string?]) {
  const { colors } = theme;
  ctx.fillStyle = colors.background;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(0, HEIGHT / 2 - 70, WIDTH, 140);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.accent;
  ctx.font = canvasFont('title', 'bold');
  ctx.fillText(lines[0], WIDTH / 2, HEIGHT / 2 - 20);
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body');
  if (lines[1]) ctx.fillText(lines[1], WIDTH / 2, HEIGHT / 2 + 14);
  ctx.fillStyle = colors.muted;
  if (lines[2]) ctx.fillText(lines[2], WIDTH / 2, HEIGHT / 2 + 44);
}

/** Draws the state `alpha` of the way from the previous step to the current one. */
function draw(
  ctx: CanvasRenderingContext2D,
  state: BalloonHopState,
  alpha: number,
  paused: boolean,
) {
  const { colors } = theme;
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Poles are drawn where they were between steps too, so they keep pace with the balloon.
  const lag = state.phase === 'playing' ? (1 - alpha) * SCROLL_SPEED * STEP : 0;
  for (const pole of state.poles) drawPole(ctx, pole, pole.x + lag);
  drawGround(ctx, (state.groundX - lag + PLANK_W) % PLANK_W);
  drawBalloon(ctx, state.prevY + (state.y - state.prevY) * alpha, state.vy);

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'center';
  ctx.fillText(String(state.score), WIDTH / 2, 50);

  if (paused) {
    drawCaption(ctx, ['Paused', 'Press to carry on']);
  } else if (state.phase === 'ready') {
    drawCaption(ctx, ['Balloon Hop', 'Click, tap, Space or ArrowUp to hop']);
  } else if (state.phase === 'over') {
    const prize = prizeFor(state.score, PRIZES);
    drawCaption(ctx, [
      `Pop! You scored ${state.score}`,
      prize ? `You win a ${prize.name}!` : `Score ${PRIZES[0].minScore} to win a prize`,
      state.time >= RESTART_LOCKOUT ? 'Press to play again' : undefined,
    ]);
  }
}

const MAX_PIXEL_RATIO = 2;

export const balloonHop: CarnivalGame = {
  id: 'balloon-hop',
  name: 'Balloon Hop',
  description: 'Hop a balloon through the gaps in the striped poles. Every gap scores a point.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas.width = Math.round(WIDTH * ratio);
      canvas.height = Math.round(HEIGHT * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    // The only call to Math.random(): one seed per round.
    const newRound = () => createState(Math.floor(Math.random() * 2 ** 32) | 0);

    let state = newRound();
    let scoreRecorded = false;
    let acc = 0;
    let last: number | undefined;
    let paused = false;

    const press = () => {
      if (paused) {
        // Coming back from a hidden tab: this press only resumes, it doesn't hop.
        if (document.hidden) return;
        paused = false;
        acc = 0;
        last = undefined;
        return;
      }
      if (hop(state) === 'restart') {
        state = newRound();
        scoreRecorded = false;
        acc = 0;
      }
    };

    const controller = new AbortController();
    const { signal } = controller;
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();
        press();
      },
      { signal },
    );
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
        event.preventDefault();
        if (event.repeat) return;
        press();
      },
      { signal },
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          paused = true;
          state.hopQueued = false;
        }
        acc = 0;
        last = undefined;
      },
      { signal },
    );
    window.addEventListener('resize', resize, { signal });

    let frame = 0;
    const loop = (time: number) => {
      if (!paused) {
        const elapsed = last === undefined ? 0 : (time - last) / 1000;
        last = time;
        acc = pump(acc, elapsed, () => step(state, STEP));
        if (state.phase === 'over' && !scoreRecorded) {
          recordScore(balloonHop.id, state.score);
          scoreRecorded = true;
        }
      }
      draw(ctx, state, paused ? 1 : acc / STEP, paused);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  },
};

export default balloonHop;
