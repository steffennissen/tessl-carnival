import { canvasFont, prizeFor, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

/** Fixed physics step, in seconds. */
export const STEP = 1 / 120;
/** Longest frame the game simulates, in seconds. */
export const MAX_FRAME = 0.05;
export const START_BALLS = 5;
/** Launch speed at a full pull, in px/s. */
export const MAX_SPEED = 560;
/** Drag for a full pull, in px. */
export const MAX_PULL = 140;
/** A shorter drag cancels the shot. */
export const MIN_PULL = 12;
/** Pull at a planet's surface, in px/s². */
export const GRAVITY = 3600;
export const BALL_RADIUS = 6;
/** How close to a planet's surface a ball must pass to graze it. */
export const GRAZE_RANGE = 24;
/** A ball still flying after this many seconds is lost. */
export const FLIGHT_LIMIT = 7;
/** How far off screen a ball can swing before it is lost. */
export const BOUNDS_MARGIN = 150;
/** Length of the aiming preview, in seconds. */
export const PREVIEW_TIME = 0.75;
/** Pause after each shot, in seconds. */
export const RESULT_TIME = 1.1;
export const LEVEL_POINTS = 100;
export const FIRST_SHOT_BONUS = 100;
export const GRAZE_BONUS = 50;
/** From level 2 on, the winning shot is at least this far off the line to the goal. */
export const MIN_AIM_OFFSET = (15 * Math.PI) / 180;
/** Most shots a level build simulates. */
export const BUILD_ATTEMPTS = 60;

const FLIGHT_STEPS = Math.round(FLIGHT_LIMIT / STEP);
const PREVIEW_STEPS = Math.round(PREVIEW_TIME / STEP);
const BUILD_FLIGHT_STEPS = Math.round(3 / STEP);
/** After this many failed attempts, a build drops to one planet and stops asking for a bend. */
const SIMPLE_AFTER = 40;
const START_X = 70;

export const PRIZES = [
  { name: 'Paper Moon', minScore: 500 },
  { name: 'Comet Keychain', minScore: 1500 },
  { name: 'Plush Planet', minScore: 3000 },
  { name: 'Golden Telescope', minScore: 6000 },
];

export interface Vec {
  x: number;
  y: number;
}

export interface Planet {
  x: number;
  y: number;
  radius: number;
}

export interface Goal {
  x: number;
  y: number;
  radius: number;
}

export interface Level {
  start: Vec;
  goal: Goal;
  planets: Planet[];
  /** A launch velocity that reaches the goal. */
  proof: Vec;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Physics steps flown so far. */
  steps: number;
  /** Indexes of the planets this shot has grazed, each once. */
  grazed: number[];
}

export type Outcome = 'goal' | 'crash' | 'lost';

export interface ShotResult {
  outcome: Outcome;
  x: number;
  y: number;
  /** Points the shot scored: zero unless it reached the goal. */
  points: number;
}

export interface OrbitSlingshotState {
  seed: number;
  levelNumber: number;
  level: Level;
  balls: number;
  score: number;
  /** Shots taken at the current level. */
  shots: number;
  phase: 'aiming' | 'flying' | 'result' | 'over';
  ball: Ball | null;
  trail: Vec[];
  /** Frame time not yet simulated, carried to the next frame. */
  leftover: number;
  /** Seconds left in the result pause. */
  resultTimer: number;
  lastResult: ShotResult | null;
}

/**
 * Seeded random numbers in [0, 1): mulberry32, by bryc
 * (https://github.com/bryc/code/blob/master/jshash/PRNGs.md), written out here.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let stepCount = 0;

/** How many physics steps have run since the page loaded. Lets tests measure build cost. */
export function physicsSteps(): number {
  return stepCount;
}

function createBall(start: Vec, velocity: Vec): Ball {
  return { x: start.x, y: start.y, vx: velocity.x, vy: velocity.y, steps: 0, grazed: [] };
}

/**
 * Moves the ball one fixed step and reports how the shot ended, or null while
 * it is still flying. Every flight, preview and level build goes through here.
 */
function physicsStep(planets: readonly Planet[], goal: Goal | null, ball: Ball): Outcome | null {
  stepCount += 1;
  let ax = 0;
  let ay = 0;
  for (const planet of planets) {
    const dx = planet.x - ball.x;
    const dy = planet.y - ball.y;
    const distanceSq = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSq);
    const pull = (GRAVITY * planet.radius * planet.radius) / distanceSq;
    ax += (pull * dx) / distance;
    ay += (pull * dy) / distance;
  }
  ball.vx += ax * STEP;
  ball.vy += ay * STEP;
  ball.x += ball.vx * STEP;
  ball.y += ball.vy * STEP;
  ball.steps += 1;

  if (goal && Math.hypot(ball.x - goal.x, ball.y - goal.y) <= goal.radius) return 'goal';
  for (const planet of planets) {
    if (Math.hypot(ball.x - planet.x, ball.y - planet.y) - planet.radius <= BALL_RADIUS) {
      return 'crash';
    }
  }
  planets.forEach((planet, index) => {
    const gap = Math.hypot(ball.x - planet.x, ball.y - planet.y) - planet.radius;
    if (gap <= GRAZE_RANGE && !ball.grazed.includes(index)) ball.grazed.push(index);
  });
  const outside =
    ball.x < -BOUNDS_MARGIN ||
    ball.x > WIDTH + BOUNDS_MARGIN ||
    ball.y < -BOUNDS_MARGIN ||
    ball.y > HEIGHT + BOUNDS_MARGIN;
  if (outside || ball.steps >= FLIGHT_STEPS) return 'lost';
  return null;
}

/** Flies a shot to its end and says how it ended. */
export function simulate(level: Level, velocity: Vec): Outcome {
  const ball = createBall(level.start, velocity);
  for (;;) {
    const outcome = physicsStep(level.planets, level.goal, ball);
    if (outcome) return outcome;
  }
}

/** The ball's position after each step of the first PREVIEW_TIME of a shot. */
export function predictPath(level: Level, velocity: Vec): Vec[] {
  const ball = createBall(level.start, velocity);
  const path: Vec[] = [];
  for (let i = 0; i < PREVIEW_STEPS; i++) {
    const outcome = physicsStep(level.planets, level.goal, ball);
    path.push({ x: ball.x, y: ball.y });
    if (outcome) break;
  }
  return path;
}

/** The ball flies opposite the pull, faster the longer the pull, up to MAX_PULL. */
export function launchVelocity(pullX: number, pullY: number): Vec {
  const length = Math.hypot(pullX, pullY);
  if (length === 0) return { x: 0, y: 0 };
  const speed = (Math.min(length, MAX_PULL) / MAX_PULL) * MAX_SPEED;
  return { x: (-pullX / length) * speed, y: (-pullY / length) * speed };
}

export function planetCountFor(levelNumber: number): number {
  return Math.min(1 + Math.floor(levelNumber / 2), 5);
}

export function goalRadiusFor(levelNumber: number): number {
  return Math.max(36 - 2 * levelNumber, 18);
}

export function scoreForClear(levelNumber: number, shots: number, grazes: number): number {
  return LEVEL_POINTS * levelNumber + (shots === 1 ? FIRST_SHOT_BONUS : 0) + GRAZE_BONUS * grazes;
}

function layOutPlanets(random: () => number, start: Vec, count: number): Planet[] {
  const planets: Planet[] = [];
  for (let i = 0; i < count; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const radius = 20 + random() * 24;
      const x = i === 0 ? WIDTH / 3 + (random() * WIDTH) / 3 : 180 + random() * 440;
      const y =
        i === 0 ? Math.min(Math.max(start.y - 80 + random() * 160, 80), 450) : 80 + random() * 370;
      const clearOfStart = Math.hypot(x - start.x, y - start.y) >= radius + 90;
      const clearOfOthers = planets.every(
        (p) => Math.hypot(x - p.x, y - p.y) >= radius + p.radius + 30,
      );
      if (clearOfStart && clearOfOthers) {
        planets.push({ x, y, radius });
        break;
      }
    }
  }
  return planets;
}

/** Flies a shot past the planets with no goal yet, and returns the first point that could hold one. */
function findGoalSpot(start: Vec, planets: readonly Planet[], velocity: Vec): Vec | null {
  const ball = createBall(start, velocity);
  for (let i = 0; i < BUILD_FLIGHT_STEPS; i++) {
    const outcome = physicsStep(planets, null, ball);
    if (outcome === 'crash') return null;
    if (ball.x >= 640 && ball.x <= 750 && ball.y >= 80 && ball.y <= 440) {
      return { x: ball.x, y: ball.y };
    }
    if (outcome) return null;
  }
  return null;
}

/** The angle between a launch velocity and the straight line from the start to the goal. */
export function aimOffset(level: Level, velocity: Vec): number {
  const launchAngle = Math.atan2(velocity.y, velocity.x);
  const lineAngle = Math.atan2(level.goal.y - level.start.y, level.goal.x - level.start.x);
  const difference = Math.abs(launchAngle - lineAngle) % (Math.PI * 2);
  return difference > Math.PI ? Math.PI * 2 - difference : difference;
}

/** A full-power shot aimed straight at the goal. */
export function straightShot(level: Level): Vec {
  const dx = level.goal.x - level.start.x;
  const dy = level.goal.y - level.start.y;
  const length = Math.hypot(dx, dy);
  return { x: (dx / length) * MAX_SPEED, y: (dy / length) * MAX_SPEED };
}

/** One planet 120 px off a straight full-power shot, with the goal on that shot's path. */
function fallbackLevel(start: Vec, goalRadius: number): Level {
  const planet = { x: WIDTH / 2, y: start.y + (start.y < HEIGHT / 2 ? 120 : -120), radius: 30 };
  const proof = { x: MAX_SPEED, y: 0 };
  const ball = createBall(start, proof);
  while (ball.x < 690 && ball.steps < FLIGHT_STEPS) physicsStep([planet], null, ball);
  return { start, goal: { x: ball.x, y: ball.y, radius: goalRadius }, planets: [planet], proof };
}

/**
 * Builds a level from the round's seed. Rather than search for a winning shot,
 * each attempt fires one shot past the planets and puts the goal on its path,
 * so only a few shots are ever simulated. `attempts` only exists so tests can
 * force the fallback.
 */
export function createLevel(seed: number, levelNumber: number, attempts = BUILD_ATTEMPTS): Level {
  const random = mulberry32(seed ^ Math.imul(levelNumber, 0x9e3779b9));
  const start = { x: START_X, y: 110 + random() * 280 };
  const goalRadius = goalRadiusFor(levelNumber);

  for (let attempt = 0; attempt < attempts; attempt++) {
    const simple = attempt >= SIMPLE_AFTER;
    const planets = layOutPlanets(random, start, simple ? 1 : planetCountFor(levelNumber));
    const angle = ((random() * 2 - 1) * 50 * Math.PI) / 180;
    const speed = (0.6 + random() * 0.4) * MAX_SPEED;
    const proof = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };

    const spot = findGoalSpot(start, planets, proof);
    if (!spot) continue;
    const goal = { ...spot, radius: goalRadius };
    if (planets.some((p) => Math.hypot(goal.x - p.x, goal.y - p.y) < p.radius + 30)) {
      continue;
    }
    const level = { start, goal, planets, proof };
    if (levelNumber >= 2 && !simple) {
      if (aimOffset(level, proof) < MIN_AIM_OFFSET) continue;
      if (simulate(level, straightShot(level)) === 'goal') continue;
    }
    return level;
  }
  return fallbackLevel(start, goalRadius);
}

export function createState(seed: number): OrbitSlingshotState {
  return {
    seed,
    levelNumber: 1,
    level: createLevel(seed, 1),
    balls: START_BALLS,
    score: 0,
    shots: 0,
    phase: 'aiming',
    ball: null,
    trail: [],
    leftover: 0,
    resultTimer: 0,
    lastResult: null,
  };
}

/** Launches the ball with a pull. Returns false, changing nothing, if no shot fired. */
export function launch(state: OrbitSlingshotState, pullX: number, pullY: number): boolean {
  if (state.phase !== 'aiming' || Math.hypot(pullX, pullY) < MIN_PULL) return false;
  state.ball = createBall(state.level.start, launchVelocity(pullX, pullY));
  state.trail = [];
  state.leftover = 0;
  state.shots += 1;
  state.phase = 'flying';
  return true;
}

function endShot(state: OrbitSlingshotState, ball: Ball, outcome: Outcome) {
  const points =
    outcome === 'goal' ? scoreForClear(state.levelNumber, state.shots, ball.grazed.length) : 0;
  state.score += points;
  state.lastResult = { outcome, x: ball.x, y: ball.y, points };
  state.leftover = 0;
  if (outcome !== 'goal') state.balls -= 1;
  if (state.balls === 0) {
    state.phase = 'over';
  } else {
    state.phase = 'result';
    state.resultTimer = RESULT_TIME;
  }
}

/** Advances the game by `dt` seconds of real time, in fixed physics steps. */
export function step(state: OrbitSlingshotState, dt: number): void {
  const frame = Math.min(Math.max(dt, 0), MAX_FRAME);

  if (state.phase === 'flying' && state.ball) {
    state.leftover += frame;
    // The small allowance stops rounding in the sum from dropping a step.
    while (state.phase === 'flying' && state.leftover >= STEP - 1e-9) {
      state.leftover -= STEP;
      const outcome = physicsStep(state.level.planets, state.level.goal, state.ball);
      state.trail.push({ x: state.ball.x, y: state.ball.y });
      if (outcome) endShot(state, state.ball, outcome);
    }
  } else if (state.phase === 'result') {
    state.resultTimer -= frame;
    if (state.resultTimer <= 0) {
      if (state.lastResult?.outcome === 'goal') {
        state.levelNumber += 1;
        state.level = createLevel(state.seed, state.levelNumber);
        state.shots = 0;
      }
      state.phase = 'aiming';
      state.ball = null;
      state.trail = [];
    }
  }
}

// Fixed star positions, the same every round.
const STARS = (() => {
  const random = mulberry32(2024);
  return Array.from({ length: 70 }, () => ({
    x: random() * WIDTH,
    y: random() * HEIGHT,
    size: 0.6 + random() * 1.2,
  }));
})();

const PLANET_COLORS = [theme.colors.stripeA, theme.colors.water, theme.colors.wood];

interface Pull {
  pointerId: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

function draw(
  ctx: CanvasRenderingContext2D,
  state: OrbitSlingshotState,
  pull: Pull | null,
  time: number,
  showHint: boolean,
) {
  const { colors } = theme;
  const { level } = state;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = colors.muted;
  for (const star of STARS) {
    circle(ctx, star.x, star.y, star.size);
    ctx.fill();
  }

  level.planets.forEach((planet, index) => {
    ctx.fillStyle = PLANET_COLORS[index % PLANET_COLORS.length];
    circle(ctx, planet.x, planet.y, planet.radius);
    ctx.fill();
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    circle(ctx, planet.x, planet.y, planet.radius + GRAZE_RANGE);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  const { goal } = level;
  ctx.fillStyle = colors.stripeB;
  circle(ctx, goal.x, goal.y, goal.radius);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  circle(ctx, goal.x, goal.y, goal.radius * 0.6);
  ctx.fill();
  ctx.fillStyle = colors.stripeB;
  circle(ctx, goal.x, goal.y, goal.radius * 0.25);
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 4);
  circle(ctx, goal.x, goal.y, goal.radius + 4 + 2 * Math.sin(time * 4));
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 4;
  circle(ctx, level.start.x, level.start.y, BALL_RADIUS + 8);
  ctx.stroke();

  ctx.fillStyle = colors.accent;
  state.trail.forEach((point, index) => {
    if (index % 3 !== 0) return;
    ctx.globalAlpha = 0.15 + (0.5 * index) / state.trail.length;
    circle(ctx, point.x, point.y, 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const dragX = pull ? pull.x - pull.fromX : 0;
  const dragY = pull ? pull.y - pull.fromY : 0;
  const dragLength = Math.hypot(dragX, dragY);
  if (state.phase === 'aiming' && pull && dragLength >= MIN_PULL) {
    const path = predictPath(level, launchVelocity(dragX, dragY));
    ctx.fillStyle = colors.accent;
    path.forEach((point, index) => {
      if (index % 4 !== 0) return;
      ctx.globalAlpha = 1 - index / path.length;
      circle(ctx, point.x, point.y, 2.5);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const back = (Math.min(dragLength, MAX_PULL) * 0.35) / dragLength;
    const ballX = level.start.x + dragX * back;
    const ballY = level.start.y + dragY * back;
    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(level.start.x, level.start.y);
    ctx.lineTo(ballX, ballY);
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    circle(ctx, ballX, ballY, BALL_RADIUS);
    ctx.fill();
  } else if (state.phase === 'aiming') {
    ctx.fillStyle = colors.accent;
    circle(ctx, level.start.x, level.start.y, BALL_RADIUS);
    ctx.fill();
  } else if (state.phase === 'flying' && state.ball) {
    ctx.fillStyle = colors.accent;
    circle(ctx, state.ball.x, state.ball.y, BALL_RADIUS);
    ctx.fill();
  }

  const result = state.lastResult;
  if (state.phase === 'result' && result) {
    const age = RESULT_TIME - state.resultTimer;
    if (result.outcome !== 'lost') {
      ctx.strokeStyle = result.outcome === 'goal' ? colors.accent : colors.danger;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(1 - age / 0.6, 0);
      circle(ctx, result.x, result.y, 8 + age * 120);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const message =
      result.outcome === 'goal'
        ? `+${result.points}`
        : result.outcome === 'crash'
          ? 'Crashed! One ball lost'
          : 'Lost in space! One ball lost';
    ctx.textAlign = 'center';
    ctx.fillStyle = result.outcome === 'goal' ? colors.accent : colors.danger;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(message, WIDTH / 2, HEIGHT / 2);
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, 30);
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${state.levelNumber}`, WIDTH / 2, 30);
  ctx.textAlign = 'right';
  ctx.fillText(`Balls ${state.balls}`, WIDTH - 16, 30);

  if (showHint && state.phase === 'aiming') {
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('body');
    ctx.fillText('Drag back from anywhere and let go', WIDTH / 2, HEIGHT - 24);
  }

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of balls! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2 - 20);
    const prize = prizeFor(state.score, PRIZES);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText(
      prize ? `You win a ${prize.name}!` : 'No prize this time',
      WIDTH / 2,
      HEIGHT / 2 + 20,
    );
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 56);
  }
}

export const orbitSlingshot: CarnivalGame = {
  id: 'orbit-slingshot',
  name: 'Orbit Slingshot',
  description: 'Pull back, let go, and bend the ball around the planets to hit the target.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.touchAction = 'none';

    const newSeed = () => Math.floor(Math.random() * 2 ** 32);
    let state = createState(newSeed());
    let scoreRecorded = false;
    let showHint = true;
    let pull: Pull | null = null;

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };

    const controller = new AbortController();
    const { signal } = controller;
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();
        if (state.phase === 'over') {
          state = createState(newSeed());
          scoreRecorded = false;
          showHint = true;
          return;
        }
        const point = toCanvas(event);
        pull = { pointerId: event.pointerId, fromX: point.x, fromY: point.y, ...point };
      },
      { signal },
    );
    window.addEventListener(
      'pointermove',
      (event) => {
        if (pull?.pointerId !== event.pointerId) return;
        Object.assign(pull, toCanvas(event));
      },
      { signal },
    );
    window.addEventListener(
      'pointerup',
      (event) => {
        if (pull?.pointerId !== event.pointerId) return;
        const point = toCanvas(event);
        if (launch(state, point.x - pull.fromX, point.y - pull.fromY)) showHint = false;
        pull = null;
      },
      { signal },
    );
    window.addEventListener(
      'pointercancel',
      (event) => {
        if (pull?.pointerId === event.pointerId) pull = null;
      },
      { signal },
    );

    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    const loop = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;
      elapsed += Math.min(Math.max(dt, 0), MAX_FRAME);
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(orbitSlingshot.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, pull, elapsed, showHint);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  },
};

export default orbitSlingshot;
