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

const POLE_BAND_H = 10;
const POLE_BAND_GAP = 26;
const TRIM_H = 12;
const SCALLOPS = 4;
const BALLOON_R = 13;

const SHADOW_ALPHA = 0.25;
/** Every card's shadow falls this far right and up, as if lit from below. */
const SHADOW_DX = 3;
const SHADOW_DY = -4;
/** A pole's card leaves room for its shadow inside the collision rectangle. */
const POLE_CARD_W = OBSTACLE_W - SHADOW_DX;
const SCALLOP_R = POLE_CARD_W / SCALLOPS / 2;

const CLOUD_PARALLAX = 0.06;
const HILL_PARALLAX = 0.12;
const TENT_PARALLAX = 0.25;
const BUNTING_PARALLAX = 0.5;
const HILL_Y = 300;
const CLOUD_SPACING = 340;
const TENT_SPACING = 270;
const BUNTING_SPAN = 160;
const FLAGS_PER_SPAN = 5;

/**
 * How far the course has scrolled since the round began, worked out from the
 * poles: pole k always sits at FIRST_POLE_X + k * SPACING minus the scroll,
 * and every pole that has left the screen was scored first. It changes only
 * when the poles move, so the scenery is still in `ready` and `over`.
 */
export function scrolled(state: BalloonHopState): number {
  const first = state.poles[0];
  const gone = state.score - state.poles.filter((pole) => pole.scored).length;
  return FIRST_POLE_X + gone * SPACING - first.x;
}

/** Fills a sheet of card: its shadow first, offset by (dx, dy), then the card itself. */
function paper(
  ctx: CanvasRenderingContext2D,
  color: string,
  trace: () => void,
  dx = SHADOW_DX,
  dy = SHADOW_DY,
) {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.globalAlpha = SHADOW_ALPHA;
  ctx.fillStyle = theme.colors.background;
  ctx.beginPath();
  trace();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath();
  trace();
  ctx.fill();
}

/** Calls `draw` for every repeat of a pattern `spacing` apart that shows on screen, `offset` scrolled. */
function repeat(
  offset: number,
  spacing: number,
  margin: number,
  draw: (x: number, k: number) => void,
) {
  for (
    let k = Math.floor((offset - margin) / spacing);
    k * spacing - offset < WIDTH + margin;
    k++
  ) {
    draw(k * spacing - offset, k);
  }
}

/** Which of `n` variants the k-th repeat uses, for negative k too. */
function variant(k: number, n: number) {
  return ((k % n) + n) % n;
}

const CLOUDS: readonly { y: number; puffs: readonly [number, number, number][] }[] = [
  {
    y: 95,
    puffs: [
      [0, 0, 18],
      [22, -10, 24],
      [48, -2, 20],
      [68, 4, 14],
    ],
  },
  {
    y: 150,
    puffs: [
      [0, 0, 14],
      [18, -8, 19],
      [40, 0, 15],
    ],
  },
  {
    y: 115,
    puffs: [
      [0, 2, 16],
      [24, -12, 26],
      [54, -6, 22],
      [80, 2, 15],
      [34, 6, 16],
    ],
  },
];

function drawClouds(ctx: CanvasRenderingContext2D, scroll: number) {
  repeat(scroll * CLOUD_PARALLAX, CLOUD_SPACING, 120, (x, k) => {
    const cloud = CLOUDS[variant(k, CLOUDS.length)];
    paper(ctx, theme.colors.text, () => {
      for (const [dx, dy, r] of cloud.puffs) {
        ctx.moveTo(x + dx + r, cloud.y + dy);
        ctx.arc(x + dx, cloud.y + dy, r, 0, Math.PI * 2);
      }
    });
  });
}

function drawHills(ctx: CanvasRenderingContext2D, scroll: number) {
  const offset = scroll * HILL_PARALLAX;
  paper(ctx, theme.colors.surface, () => {
    ctx.moveTo(-10, HEIGHT);
    for (let x = -10; x <= WIDTH + 10; x += 10) {
      const wx = x + offset;
      ctx.lineTo(x, HILL_Y + 16 * Math.sin(wx / 70) + 7 * Math.sin(wx / 29 + 1));
    }
    ctx.lineTo(WIDTH + 10, HEIGHT);
    ctx.closePath();
  });
}

/** Fills `trace` with stripeB, then paints `stripes` in stripeA clipped to it. */
function stripedCard(ctx: CanvasRenderingContext2D, trace: () => void, stripes: () => void) {
  paper(ctx, theme.colors.stripeB, trace);
  ctx.save();
  ctx.beginPath();
  trace();
  ctx.clip();
  ctx.fillStyle = theme.colors.stripeA;
  ctx.beginPath();
  stripes();
  ctx.fill();
  ctx.restore();
}

const TENT_SIZES = [1, 0.75, 1.2] as const;

function drawTent(ctx: CanvasRenderingContext2D, x: number, size: number) {
  const { colors } = theme;
  const w = 96 * size;
  const bodyTop = GROUND_Y - 44 * size;
  const peakX = x + w / 2;
  const peakY = bodyTop - 46 * size;
  const eave = 8 * size;
  const stripe = w / 8;

  ctx.fillStyle = colors.background;
  ctx.fillRect(peakX - 1, peakY - 16 * size, 2, 16 * size);
  paper(ctx, colors.accent, () => {
    ctx.moveTo(peakX + 1, peakY - 16 * size);
    ctx.lineTo(peakX + 15 * size, peakY - 12 * size);
    ctx.lineTo(peakX + 1, peakY - 8 * size);
    ctx.closePath();
  });

  stripedCard(
    ctx,
    () => ctx.rect(x, bodyTop, w, GROUND_Y + 4 - bodyTop),
    () => {
      for (let i = 0; i < 8; i += 2) ctx.rect(x + i * stripe, bodyTop, stripe, GROUND_Y);
    },
  );
  stripedCard(
    ctx,
    () => {
      ctx.moveTo(x - eave, bodyTop);
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(x + w + eave, bodyTop);
      ctx.closePath();
    },
    () => {
      const base = (w + 2 * eave) / 8;
      for (let i = 0; i < 8; i += 2) {
        ctx.moveTo(peakX, peakY);
        ctx.lineTo(x - eave + i * base, bodyTop);
        ctx.lineTo(x - eave + (i + 1) * base, bodyTop);
        ctx.closePath();
      }
    },
  );
}

function drawTents(ctx: CanvasRenderingContext2D, scroll: number) {
  repeat(scroll * TENT_PARALLAX, TENT_SPACING, 140, (x, k) =>
    drawTent(ctx, x, TENT_SIZES[variant(k, TENT_SIZES.length)]),
  );
}

function drawBunting(ctx: CanvasRenderingContext2D, scroll: number) {
  const { colors } = theme;
  const flagColors = [colors.accent, colors.water, colors.danger];
  const sag = (t: number) => 16 + 18 * 4 * t * (1 - t);
  repeat(scroll * BUNTING_PARALLAX, BUNTING_SPAN, BUNTING_SPAN, (x, k) => {
    ctx.strokeStyle = colors.background;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, sag(0));
    ctx.quadraticCurveTo(x + BUNTING_SPAN / 2, sag(0.5) * 2 - sag(0), x + BUNTING_SPAN, sag(1));
    ctx.stroke();
    for (let i = 0; i < FLAGS_PER_SPAN; i++) {
      const t = (i + 0.5) / FLAGS_PER_SPAN;
      const fx = x + t * BUNTING_SPAN;
      const fy = sag(t);
      paper(ctx, flagColors[variant(k * FLAGS_PER_SPAN + i, flagColors.length)], () => {
        ctx.moveTo(fx - 10, fy);
        ctx.lineTo(fx + 10, fy);
        ctx.lineTo(fx, fy + 20);
        ctx.closePath();
      });
    }
  });
}

/** The scalloped trim along one gap edge: the scallops reach exactly to `edge` and no further. */
function traceTrim(x: number, edge: number, dir: 1 | -1) {
  return (ctx: CanvasRenderingContext2D) => {
    const back = edge - dir * TRIM_H;
    const mid = edge - dir * SCALLOP_R;
    ctx.rect(x, Math.min(back, mid), POLE_CARD_W, TRIM_H - SCALLOP_R);
    for (let i = 0; i < SCALLOPS; i++) {
      const cx = x + SCALLOP_R * (2 * i + 1);
      ctx.moveTo(cx + SCALLOP_R, mid);
      ctx.arc(cx, mid, SCALLOP_R, 0, Math.PI, dir === -1);
    }
  };
}

function drawPole(ctx: CanvasRenderingContext2D, pole: Pole, x: number) {
  const { colors } = theme;
  const top = pole.gapY - GAP / 2;
  const bottom = pole.gapY + GAP / 2;
  // The shaft, trim and their shadows stay inside the collision rectangles, so what you see
  // is what you hit. The shadow falls only sideways, so it never reaches into the gap.
  const shaft = (from: number, to: number) => {
    paper(ctx, colors.stripeB, () => ctx.rect(x, from, POLE_CARD_W, to - from), SHADOW_DX, 0);
    ctx.fillStyle = colors.stripeA;
    for (let y = from + POLE_BAND_GAP; y < to; y += POLE_BAND_GAP + POLE_BAND_H) {
      ctx.fillRect(x, y, POLE_CARD_W, Math.min(POLE_BAND_H, to - y));
    }
  };
  shaft(0, top);
  shaft(bottom, GROUND_Y);
  const upper = traceTrim(x, top, 1);
  const lower = traceTrim(x, bottom, -1);
  paper(ctx, colors.accent, () => upper(ctx), SHADOW_DX, 0);
  paper(ctx, colors.accent, () => lower(ctx), SHADOW_DX, 0);
}

function drawGround(ctx: CanvasRenderingContext2D, scroll: number) {
  const { colors } = theme;
  paper(ctx, colors.wood, () => {
    ctx.moveTo(-10, HEIGHT);
    for (let x = -10; x <= WIDTH + 10; x += 8) {
      ctx.lineTo(x, GROUND_Y + 2 * Math.sin((x + scroll) / 18));
    }
    ctx.lineTo(WIDTH + 10, HEIGHT);
    ctx.closePath();
  });
  ctx.fillStyle = colors.background;
  ctx.globalAlpha = 0.35;
  repeat(scroll, PLANK_W, PLANK_W, (x) => ctx.fillRect(x, GROUND_Y + 4, 2, GROUND_H));
  ctx.globalAlpha = 1;
}

function drawBalloon(ctx: CanvasRenderingContext2D, y: number, vy: number) {
  const { colors } = theme;
  const tilt = Math.min(Math.max(vy / MAX_FALL, -1), 1) * 0.35;
  ctx.save();
  ctx.translate(PLAYER_X, y);
  ctx.rotate(tilt);

  ctx.strokeStyle = colors.background;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, BALLOON_R + 3);
  ctx.quadraticCurveTo(-7, BALLOON_R + 14, 0, BALLOON_R + 28);
  ctx.stroke();

  paper(ctx, colors.danger, () => {
    ctx.moveTo(-3, BALLOON_R + 4);
    ctx.lineTo(3, BALLOON_R + 4);
    ctx.lineTo(0, BALLOON_R - 1);
    ctx.closePath();
    ctx.moveTo(BALLOON_R, 0);
    ctx.arc(0, 0, BALLOON_R, 0, Math.PI * 2);
  });

  ctx.fillStyle = colors.text;
  ctx.beginPath();
  ctx.ellipse(-5, -5, 2.5, 4, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  const { colors } = theme;
  const text = String(score);
  ctx.font = canvasFont('title', 'bold');
  const w = Math.max(ctx.measureText(text).width + 32, 64);
  paper(ctx, colors.background, () => ctx.rect(WIDTH / 2 - w / 2, 14, w, 48));
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(text, WIDTH / 2, 50);
}

function drawCaption(ctx: CanvasRenderingContext2D, lines: [string, string?, string?]) {
  const { colors } = theme;
  ctx.fillStyle = colors.background;
  ctx.globalAlpha = 0.85;
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
  ctx.fillStyle = colors.muted;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Everything is drawn where it was between steps too, so it keeps pace with the balloon.
  const lag = state.phase === 'playing' ? (1 - alpha) * SCROLL_SPEED * STEP : 0;
  const scroll = scrolled(state) - lag;
  drawClouds(ctx, scroll);
  drawHills(ctx, scroll);
  drawTents(ctx, scroll);
  drawBunting(ctx, scroll);
  for (const pole of state.poles) drawPole(ctx, pole, pole.x + lag);
  drawGround(ctx, scroll);
  drawBalloon(ctx, state.prevY + (state.y - state.prevY) * alpha, state.vy);
  drawScore(ctx, state.score);

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
