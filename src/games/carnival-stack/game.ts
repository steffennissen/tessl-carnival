import { bestScore, canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const COLS = 10;
export const ROWS = 22;
/** Rows 0 and 1 sit above the visible well. */
export const HIDDEN_ROWS = 2;
export const CELL = 24;
export const LOCK_DELAY = 500;
export const MAX_RESETS = 15;
export const REPEAT_DELAY = 170;
export const REPEAT_INTERVAL = 50;
export const SOFT_DROP_INTERVAL = 50;
export const NEXT_COUNT = 3;

const WELL_X = (WIDTH - COLS * CELL) / 2;
const WELL_Y = (HEIGHT - (ROWS - HIDDEN_ROWS) * CELL) / 2;
const WELL_W = COLS * CELL;
const WELL_H = (ROWS - HIDDEN_ROWS) * CELL;

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** 0 is the spawn orientation, then clockwise: 1 is R, 2 is 2, 3 is L. */
export type Rotation = 0 | 1 | 2 | 3;

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  /** Column of the left edge of the piece's bounding box. */
  x: number;
  /** Row of the top edge of the piece's bounding box. */
  y: number;
}

export type Action =
  'left' | 'right' | 'down' | 'rotateCw' | 'rotateCcw' | 'hardDrop' | 'hold' | 'pause' | 'newRound';

type Direction = 'left' | 'right';

export interface StackOptions {
  random?: () => number;
  onGameOver?: (score: number) => void;
}

export interface StackState {
  board: (PieceType | null)[][];
  piece: Piece | null;
  queue: PieceType[];
  hold: PieceType | null;
  holdUsed: boolean;
  score: number;
  lines: number;
  /** How many locks this round cleared at least one row. Drawing uses it to start confetti. */
  clears: number;
  phase: 'playing' | 'paused' | 'over';
  fallTimer: number;
  lockTimer: number;
  /** Whether the lock timer has started for this piece since its last new lowest row. */
  lockStarted: boolean;
  resets: number;
  /** The lowest row any cell of the current piece has reached. */
  lowestRow: number;
  held: { left: boolean; right: boolean; down: boolean };
  /** The direction that repeats, the last one pressed. */
  repeatDir: Direction | null;
  repeatTimer: number;
  /** Whether the first 170ms wait is over. */
  repeating: boolean;
  /** Whether onGameOver has fired for this round. */
  recorded: boolean;
  random: () => number;
  onGameOver: (score: number) => void;
}

/** Each piece's cells in its spawn orientation, as [column, row] in its bounding box. */
const SHAPES: Record<PieceType, { size: number; cells: [number, number][] }> = {
  I: {
    size: 4,
    cells: [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
  },
  O: {
    size: 2,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  T: {
    size: 3,
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  S: {
    size: 3,
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
  },
  Z: {
    size: 3,
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
  J: {
    size: 3,
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  L: {
    size: 3,
    cells: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
};

type Kick = [number, number];

/** Super Rotation System kicks, y-up, keyed by `${from}${to}`. */
const KICKS: Record<string, Kick[]> = {
  '01': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '10': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '12': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '21': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '23': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  '32': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '30': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '03': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

const I_KICKS: Record<string, Kick[]> = {
  '01': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '10': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '12': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  '21': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '23': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '32': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '30': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '03': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

const LINE_POINTS = [0, 100, 300, 500, 800];

export function levelFor(lines: number): number {
  return 1 + Math.floor(lines / 10);
}

export function level(state: StackState): number {
  return levelFor(state.lines);
}

/** Milliseconds per row of gravity at a level. */
export function gravityInterval(lvl: number): number {
  return Math.max(1000 * 0.8 ** (lvl - 1), 50);
}

/** Points for clearing `count` rows at once, before any drop points. */
export function clearPoints(count: number, lvl: number): number {
  return LINE_POINTS[count] * lvl;
}

/** The board cells a piece covers, as [column, row]. */
export function cellsOf(piece: Piece): [number, number][] {
  const { size, cells } = SHAPES[piece.type];
  return cells.map(([cx, cy]) => {
    let x = cx;
    let y = cy;
    for (let i = 0; i < piece.rotation; i++) [x, y] = [size - 1 - y, x];
    return [piece.x + x, piece.y + y];
  });
}

export function emptyBoard(): (PieceType | null)[][] {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
}

/** Whether a piece fits: inside the walls, the floor and the top, on empty cells. */
export function fits(board: (PieceType | null)[][], piece: Piece): boolean {
  return cellsOf(piece).every(
    ([x, y]) => x >= 0 && x < COLS && y >= 0 && y < ROWS && board[y][x] === null,
  );
}

function shuffledBag(random: () => number): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function takeNext(state: StackState): PieceType {
  const type = state.queue.shift()!;
  if (state.queue.length < PIECE_TYPES.length) state.queue.push(...shuffledBag(state.random));
  return type;
}

export function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: type === 'O' ? 4 : 3, y: 0 };
}

function lowestCell(piece: Piece): number {
  return Math.max(...cellsOf(piece).map(([, y]) => y));
}

export function isGrounded(state: StackState): boolean {
  const { piece } = state;
  return piece !== null && !fits(state.board, { ...piece, y: piece.y + 1 });
}

/** The row the current piece's box would land on: where the ghost is drawn. */
export function ghostY(state: StackState): number {
  const { piece } = state;
  if (!piece) return 0;
  let y = piece.y;
  while (fits(state.board, { ...piece, y: y + 1 })) y++;
  return y;
}

function endRound(state: StackState) {
  state.phase = 'over';
  state.piece = null;
  if (!state.recorded) {
    state.recorded = true;
    state.onGameOver(state.score);
  }
}

/** Puts a piece in play at the spawn position, with fresh fall, lock and reset values. */
function spawn(state: StackState, type: PieceType) {
  const piece = spawnPiece(type);
  state.fallTimer = 0;
  state.lockTimer = 0;
  state.lockStarted = false;
  state.resets = 0;
  if (!fits(state.board, piece)) {
    endRound(state);
    return;
  }
  if (fits(state.board, { ...piece, y: piece.y + 1 })) piece.y += 1;
  state.piece = piece;
  state.lowestRow = lowestCell(piece);
  afterMove(state);
}

/** Tracks a new lowest row and whether the lock timer has started. */
function afterMove(state: StackState) {
  const piece = state.piece!;
  const lowest = lowestCell(piece);
  if (lowest > state.lowestRow) {
    state.lowestRow = lowest;
    state.lockTimer = 0;
    state.resets = 0;
    state.lockStarted = false;
  }
  if (isGrounded(state)) {
    state.lockStarted = true;
    state.fallTimer = 0;
  }
}

/** A successful move or rotation after the lock timer has started uses a reset. */
function useReset(state: StackState, lockStarted: boolean) {
  if (lockStarted && state.resets < MAX_RESETS) {
    state.lockTimer = 0;
    state.resets += 1;
  }
}

function shift(state: StackState, dx: number): boolean {
  const piece = state.piece;
  if (!piece) return false;
  const moved = { ...piece, x: piece.x + dx };
  if (!fits(state.board, moved)) return false;
  const lockStarted = state.lockStarted;
  state.piece = moved;
  useReset(state, lockStarted);
  afterMove(state);
  return true;
}

/** Moves the piece down one row. Returns false if it can't. */
function fall(state: StackState): boolean {
  const piece = state.piece;
  if (!piece) return false;
  const moved = { ...piece, y: piece.y + 1 };
  if (!fits(state.board, moved)) return false;
  state.piece = moved;
  if (state.held.down) state.score += 1;
  afterMove(state);
  return true;
}

function rotate(state: StackState, turn: 1 | 3): boolean {
  const piece = state.piece;
  if (!piece || piece.type === 'O') return false;
  const to = ((piece.rotation + turn) % 4) as Rotation;
  const table = piece.type === 'I' ? I_KICKS : KICKS;
  for (const [kx, ky] of table[`${piece.rotation}${to}`]) {
    const moved = { ...piece, rotation: to, x: piece.x + kx, y: piece.y - ky };
    if (fits(state.board, moved)) {
      const lockStarted = state.lockStarted;
      state.piece = moved;
      useReset(state, lockStarted);
      afterMove(state);
      return true;
    }
  }
  return false;
}

function lock(state: StackState) {
  const piece = state.piece!;
  const cells = cellsOf(piece);
  for (const [x, y] of cells) state.board[y][x] = piece.type;
  state.piece = null;

  const kept = state.board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - kept.length;
  if (cleared > 0) {
    state.score += clearPoints(cleared, level(state));
    state.lines += cleared;
    state.clears += 1;
    state.board = [...emptyBoard().slice(0, cleared), ...kept];
  }

  if (cleared === 0 && cells.every(([, y]) => y < HIDDEN_ROWS)) {
    endRound(state);
    return;
  }
  state.holdUsed = false;
  spawn(state, takeNext(state));
}

function hardDrop(state: StackState) {
  const piece = state.piece!;
  const y = ghostY(state);
  state.score += 2 * (y - piece.y);
  state.piece = { ...piece, y };
  lock(state);
}

function hold(state: StackState) {
  if (state.holdUsed || !state.piece) return;
  const current = state.piece.type;
  const next = state.hold ?? takeNext(state);
  state.hold = current;
  state.holdUsed = true;
  spawn(state, next);
}

function clearHeld(state: StackState) {
  state.held = { left: false, right: false, down: false };
  state.repeatDir = null;
}

function freshRound(state: StackState) {
  state.board = emptyBoard();
  state.piece = null;
  state.queue = shuffledBag(state.random);
  state.hold = null;
  state.holdUsed = false;
  state.score = 0;
  state.lines = 0;
  state.clears = 0;
  state.phase = 'playing';
  state.repeatTimer = 0;
  state.repeating = false;
  state.recorded = false;
  clearHeld(state);
  spawn(state, takeNext(state));
}

/** Starts a round straight away. */
export function createState(options: StackOptions = {}): StackState {
  const state: StackState = {
    board: emptyBoard(),
    piece: null,
    queue: [],
    hold: null,
    holdUsed: false,
    score: 0,
    lines: 0,
    clears: 0,
    phase: 'playing',
    fallTimer: 0,
    lockTimer: 0,
    lockStarted: false,
    resets: 0,
    lowestRow: 0,
    held: { left: false, right: false, down: false },
    repeatDir: null,
    repeatTimer: 0,
    repeating: false,
    recorded: false,
    random: options.random ?? Math.random,
    onGameOver: options.onGameOver ?? (() => {}),
  };
  freshRound(state);
  return state;
}

/** A key went down. Key repeats from the browser never reach here. */
export function press(state: StackState, action: Action): void {
  if (state.phase === 'over') {
    if (action === 'newRound') freshRound(state);
    return;
  }
  if (state.phase === 'paused') {
    if (action === 'pause') state.phase = 'playing';
    return;
  }
  if (!state.piece) return;

  switch (action) {
    case 'pause':
      state.phase = 'paused';
      clearHeld(state);
      return;
    case 'left':
    case 'right':
      state.held[action] = true;
      state.repeatDir = action;
      state.repeatTimer = 0;
      state.repeating = false;
      shift(state, action === 'left' ? -1 : 1);
      return;
    case 'down':
      state.held.down = true;
      fall(state);
      state.fallTimer = 0;
      return;
    case 'rotateCw':
      rotate(state, 1);
      return;
    case 'rotateCcw':
      rotate(state, 3);
      return;
    case 'hardDrop':
      hardDrop(state);
      return;
    case 'hold':
      hold(state);
      return;
    case 'newRound':
      return;
  }
}

/** A key came up. */
export function release(state: StackState, action: Action): void {
  if (action === 'down') {
    state.held.down = false;
    return;
  }
  if (action !== 'left' && action !== 'right') return;
  state.held[action] = false;
  if (state.repeatDir !== action) return;
  const other: Direction = action === 'left' ? 'right' : 'left';
  if (state.held[other] && state.phase === 'playing') {
    state.repeatDir = other;
    state.repeatTimer = 0;
    state.repeating = false;
    shift(state, other === 'left' ? -1 : 1);
  } else {
    state.repeatDir = null;
  }
}

/** The window lost focus or the page was hidden. */
export function blur(state: StackState): void {
  if (state.phase !== 'playing') return;
  state.phase = 'paused';
  clearHeld(state);
}

const EPSILON = 1e-9;

/** Advances the game by `dtMs` milliseconds, handling every interval that elapses. */
export function step(state: StackState, dtMs: number): void {
  let remaining = dtMs;
  while (remaining > 0 && state.phase === 'playing' && state.piece) {
    const grounded = isGrounded(state);
    const repeatAt = state.repeating ? REPEAT_INTERVAL : REPEAT_DELAY;
    const fallAt = state.held.down ? SOFT_DROP_INTERVAL : gravityInterval(level(state));

    let dt = remaining;
    if (state.repeatDir) dt = Math.min(dt, repeatAt - state.repeatTimer);
    dt = Math.min(dt, grounded ? LOCK_DELAY - state.lockTimer : fallAt - state.fallTimer);
    dt = Math.max(dt, 0);

    remaining -= dt;
    if (state.repeatDir) state.repeatTimer += dt;
    if (grounded) state.lockTimer += dt;
    else state.fallTimer += dt;

    if (state.repeatDir && state.repeatTimer >= repeatAt - EPSILON) {
      state.repeatTimer -= repeatAt;
      state.repeating = true;
      shift(state, state.repeatDir === 'left' ? -1 : 1);
    }

    if (isGrounded(state)) {
      if (state.lockTimer >= LOCK_DELAY - EPSILON) lock(state);
    } else if (state.fallTimer >= fallAt - EPSILON) {
      state.fallTimer -= fallAt;
      fall(state);
    }
  }
}

export const CONFETTI_PIECES = 90;
export const CONFETTI_DURATION = 1600;

/** The confetti burst. It lives beside the game state and never feeds back into play. */
export interface Confetti {
  /** The clear count the burst last saw. */
  clears: number;
  /** Milliseconds since the burst started, or null when there is none. */
  age: number | null;
}

export function createConfetti(clears = 0): Confetti {
  return { clears, age: null };
}

/**
 * Advances the burst by `dtMs`. A higher clear count starts it again, a lower one
 * (a new round) clears it, and with reduced motion it never starts.
 */
export function stepConfetti(
  confetti: Confetti,
  clears: number,
  dtMs: number,
  reducedMotion = false,
): void {
  if (confetti.age !== null) {
    confetti.age += dtMs;
    if (confetti.age >= CONFETTI_DURATION) confetti.age = null;
  }
  if (clears < confetti.clears) confetti.age = null;
  else if (clears > confetti.clears && !reducedMotion) confetti.age = 0;
  confetti.clears = clears;
}

const CONFETTI_COLORS = [
  theme.colors.accent,
  theme.colors.water,
  theme.colors.danger,
  theme.colors.text,
  theme.colors.muted,
];

/** A repeatable number in [0, 1) for confetti piece `i`. */
function scatter(i: number): number {
  const value = Math.sin(i * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** Where each confetti piece is `ageMs` into a burst: thrown up from the well, then falling. */
export function confettiPieces(ageMs: number) {
  const t = ageMs / 1000;
  return Array.from({ length: CONFETTI_PIECES }, (_, i) => ({
    x: WELL_X - 30 + scatter(i) * (WELL_W + 60) + Math.sin(t * 4 + i) * 12,
    y: 300 - (1 + scatter(i + 200)) * 330 * t * Math.max(0, 1.1 - t) * 1.7 + 330 * t * t * 0.9,
    angle: t * 7 + i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
}

const COLORS: Record<PieceType, string> = {
  I: theme.colors.water,
  O: theme.colors.accent,
  T: theme.colors.muted,
  S: theme.colors.text,
  Z: theme.colors.danger,
  J: theme.colors.stripeA,
  L: theme.colors.wood,
};

const PATTERN_COLORS: Record<PieceType, string> = {
  I: theme.colors.text,
  O: theme.colors.stripeA,
  T: theme.colors.text,
  S: theme.colors.stripeA,
  Z: theme.colors.text,
  J: theme.colors.text,
  L: theme.colors.text,
};

const PANEL_LEFT = 36;
const PANEL_RIGHT = WELL_X + WELL_W + 36;
const PANEL_WIDTH = 208;

const STRIPE = 54;
const STRIPE_COLORS = [theme.colors.stripeA, theme.colors.text];

/** Draws a cell in its piece's colour with its pattern, clipped to the cell. */
function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, type: PieceType) {
  const size = CELL - 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.fillStyle = COLORS[type];
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = ctx.strokeStyle = PATTERN_COLORS[type];
  ctx.lineWidth = 3;
  switch (type) {
    case 'I':
      ctx.fillRect(x, y + 6, CELL, 4);
      ctx.fillRect(x, y + 15, CELL, 4);
      break;
    case 'O':
      for (const [dx, dy] of [
        [6, 6],
        [17, 6],
        [11.5, 12],
        [6, 18],
        [17, 18],
      ]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'T':
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 3);
      ctx.lineTo(x + 20, y + 12);
      ctx.lineTo(x + 12, y + 21);
      ctx.lineTo(x + 4, y + 12);
      ctx.closePath();
      ctx.fill();
      break;
    case 'S':
      ctx.fillRect(x, y, 12, 12);
      ctx.fillRect(x + 12, y + 12, 12, 12);
      break;
    case 'Z':
      for (let k = -CELL; k < CELL; k += 9) {
        ctx.beginPath();
        ctx.moveTo(x + k, y + CELL);
        ctx.lineTo(x + k + CELL, y);
        ctx.stroke();
      }
      break;
    case 'J':
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + 11.5, y + 11.5, 6.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'L':
      ctx.fillRect(x + 9.5, y + 3, 4, 18);
      ctx.fillRect(x + 3, y + 9.5, 18, 4);
      break;
  }
  ctx.restore();
}

/** Draws a piece in spawn orientation with its box's top-left at (x, y). */
function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType, x: number, y: number) {
  for (const [cx, cy] of SHAPES[type].cells) drawCell(ctx, x + cx * CELL, y + cy * CELL, type);
}

/** The striped tent, its poles, the scalloped trim beside the well, and the side panels. */
function drawTent(ctx: CanvasRenderingContext2D) {
  const { colors } = theme;
  const stripes = Math.ceil(WIDTH / STRIPE);
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = STRIPE_COLORS[i % 2];
    ctx.fillRect(i * STRIPE, 0, STRIPE, HEIGHT);
  }
  ctx.fillStyle = colors.background;
  ctx.globalAlpha = 0.72;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.wood;
  ctx.fillRect(WELL_X - 10, 0, 6, HEIGHT);
  ctx.fillRect(WELL_X + WELL_W + 4, 0, 6, HEIGHT);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WELL_X, HEIGHT);
  ctx.rect(WELL_X + WELL_W, 0, WIDTH - WELL_X - WELL_W, HEIGHT);
  ctx.clip();
  for (let i = 0; i < stripes; i++) {
    const x = i * STRIPE;
    ctx.fillStyle = STRIPE_COLORS[i % 2];
    ctx.fillRect(x, 0, STRIPE, 12);
    ctx.beginPath();
    ctx.arc(x + STRIPE / 2, 12, STRIPE / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = colors.background;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(PANEL_LEFT, 62, PANEL_WIDTH, 124, theme.radius);
  ctx.roundRect(PANEL_LEFT, 200, PANEL_WIDTH, 144, theme.radius);
  ctx.roundRect(PANEL_RIGHT, 62, PANEL_WIDTH, 250, theme.radius);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawConfetti(ctx: CanvasRenderingContext2D, ageMs: number) {
  for (const piece of confettiPieces(ageMs)) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-4, -2.5, 8, 5);
    ctx.restore();
  }
}

function draw(ctx: CanvasRenderingContext2D, state: StackState, best: number, confetti: Confetti) {
  const { colors } = theme;
  const paused = state.phase === 'paused';
  const cellX = (col: number) => WELL_X + col * CELL;
  const cellY = (row: number) => WELL_Y + (row - HIDDEN_ROWS) * CELL;

  drawTent(ctx);

  ctx.fillStyle = colors.surface;
  ctx.fillRect(WELL_X, WELL_Y, WELL_W, WELL_H);
  if (!paused && confetti.age !== null) drawConfetti(ctx, confetti.age);

  ctx.save();
  ctx.beginPath();
  ctx.rect(WELL_X, WELL_Y, WELL_W, WELL_H);
  ctx.clip();
  if (!paused) {
    state.board.forEach((row, y) =>
      row.forEach((type, x) => {
        if (type) drawCell(ctx, cellX(x), cellY(y), type);
      }),
    );
    if (state.piece) {
      const ghost = { ...state.piece, y: ghostY(state) };
      ctx.strokeStyle = COLORS[ghost.type];
      ctx.lineWidth = 1;
      for (const [x, y] of cellsOf(ghost)) {
        ctx.strokeRect(cellX(x) + 0.5, cellY(y) + 0.5, CELL - 2, CELL - 2);
      }
      for (const [x, y] of cellsOf(state.piece))
        drawCell(ctx, cellX(x), cellY(y), state.piece.type);
    }
  }
  ctx.restore();

  const leftX = PANEL_LEFT + 24;
  const rightX = PANEL_RIGHT + 24;
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Hold', leftX, 92);
  ctx.fillText('Next', rightX, 92);
  if (!paused) {
    if (state.hold) drawPreview(ctx, state.hold, leftX, 108);
    state.queue
      .slice(0, NEXT_COUNT)
      .forEach((type, i) => drawPreview(ctx, type, rightX, 108 + i * 3 * CELL));
  }

  const stats = [
    `Score ${state.score}`,
    `Best ${best}`,
    `Level ${level(state)}`,
    `Lines ${state.lines}`,
  ];
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body');
  stats.forEach((line, i) => ctx.fillText(line, leftX, 234 + i * 30));

  if (paused) {
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText('Paused', WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Press P to resume', WIDTH / 2, HEIGHT / 2 + 36);
  }

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Game over! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2 - 10);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText(`Best ${best}`, WIDTH / 2, HEIGHT / 2 + 26);
    ctx.fillText('Press Enter to play again', WIDTH / 2, HEIGHT / 2 + 60);
  }
}

const KEYS: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'rotateCw',
  KeyX: 'rotateCw',
  KeyZ: 'rotateCcw',
  Space: 'hardDrop',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  KeyP: 'pause',
  Enter: 'newRound',
};

export const carnivalStack: CarnivalGame = {
  id: 'carnival-stack',
  name: 'Carnival Stack',
  description: 'Fit the falling blocks together and clear full rows before the well fills up.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const readBest = () => bestScore(carnivalStack.id) ?? 0;
    let best = readBest();
    const state = createState({
      onGameOver: (score) => {
        recordScore(carnivalStack.id, score);
        best = readBest();
      },
    });

    const actionFor = (event: KeyboardEvent): Action | undefined => {
      if (event.metaKey || event.ctrlKey || event.altKey) return undefined;
      return KEYS[event.code];
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const action = actionFor(event);
      if (!action) return;
      event.preventDefault();
      if (event.repeat) return;
      const wasOver = state.phase === 'over';
      press(state, action);
      if (wasOver && state.phase === 'playing') best = readBest();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const action = actionFor(event);
      if (!action) return;
      event.preventDefault();
      release(state, action);
    };
    const onBlur = () => blur(state);
    const onVisibility = () => {
      if (document.hidden) blur(state);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const confetti = createConfetti(state.clears);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      const dt = Math.max(time - last, 0);
      step(state, dt);
      stepConfetti(confetti, state.clears, state.phase === 'paused' ? 0 : dt, reducedMotion);
      last = time;
      draw(ctx, state, best, confetti);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  },
};

export default carnivalStack;
