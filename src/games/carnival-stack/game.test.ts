import { describe, expect, it } from 'vitest';
import {
  COLS,
  CONFETTI_DURATION,
  CONFETTI_PIECES,
  PIECE_TYPES,
  ROWS,
  blur,
  cellsOf,
  clearPoints,
  confettiPieces,
  createConfetti,
  createState,
  ghostY,
  gravityInterval,
  isGrounded,
  level,
  press,
  release,
  spawnPiece,
  step,
  stepConfetti,
  type Action,
  type Piece,
  type PieceType,
  type StackOptions,
  type StackState,
} from './game';

/** A small seeded generator, so a round deals the same pieces every time. */
function seeded(seed = 1) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function newState(options: StackOptions = {}) {
  return createState({ random: seeded(), ...options });
}

/** Puts a piece in play directly, as if it had just arrived there. */
function setPiece(state: StackState, piece: Piece) {
  state.piece = piece;
  state.lowestRow = Math.max(...cellsOf(piece).map(([, y]) => y));
  state.fallTimer = 0;
  state.lockTimer = 0;
  state.resets = 0;
  state.lockStarted = isGrounded(state);
}

/** A piece in spawn orientation after its one-row spawn move on an empty board. */
function spawned(state: StackState, type: PieceType) {
  setPiece(state, { ...spawnPiece(type), y: 1 });
}

function fill(state: StackState, cells: [number, number][]) {
  for (const [x, y] of cells) state.board[y][x] = 'Z';
}

function fillRow(state: StackState, row: number, except: number[] = []) {
  for (let x = 0; x < COLS; x++) if (!except.includes(x)) state.board[row][x] = 'Z';
}

function tap(state: StackState, action: Action) {
  press(state, action);
  release(state, action);
}

/** Soft drops one row at a time, with Down released, until the piece is on the ground. */
function land(state: StackState) {
  while (!isGrounded(state)) tap(state, 'down');
}

function columns(state: StackState) {
  return [...new Set(cellsOf(state.piece!).map(([x]) => x))].sort((a, b) => a - b);
}

function rows(state: StackState) {
  return [...new Set(cellsOf(state.piece!).map(([, y]) => y))].sort((a, b) => a - b);
}

/** Hard drops the current piece, so `type` is the piece that spawns next. */
function spawnNext(state: StackState, type: PieceType) {
  state.queue[0] = type;
  press(state, 'hardDrop');
}

describe('carnival stack', () => {
  it('starts a round as soon as it opens', () => {
    const state = newState();
    expect(state.phase).toBe('playing');
    expect(state.piece).not.toBeNull();
    expect(state.score).toBe(0);
    expect(level(state)).toBe(1);
  });

  describe('pieces', () => {
    it('deals the first 14 pieces as two full bags', () => {
      const state = newState();
      const first = [state.piece!.type, ...state.queue.slice(0, 13)];
      expect([...first.slice(0, 7)].sort()).toEqual([...PIECE_TYPES].sort());
      expect([...first.slice(7, 14)].sort()).toEqual([...PIECE_TYPES].sort());
    });

    it('never shows fewer than 3 next pieces', () => {
      const state = newState();
      for (let i = 0; i < 200; i++) {
        expect(state.queue.length).toBeGreaterThanOrEqual(3);
        if (state.phase === 'over') press(state, 'newRound');
        else press(state, i % 5 === 0 ? 'hold' : 'hardDrop');
      }
    });
  });

  describe('spawning', () => {
    it('spawns each piece in its columns and moves it down one row', () => {
      const expected: Record<PieceType, { cols: number[]; rows: number[] }> = {
        I: { cols: [3, 4, 5, 6], rows: [2] },
        O: { cols: [4, 5], rows: [1, 2] },
        T: { cols: [3, 4, 5], rows: [1, 2] },
        S: { cols: [3, 4, 5], rows: [1, 2] },
        Z: { cols: [3, 4, 5], rows: [1, 2] },
        J: { cols: [3, 4, 5], rows: [1, 2] },
        L: { cols: [3, 4, 5], rows: [1, 2] },
      };
      for (const type of PIECE_TYPES) {
        const state = newState();
        spawnNext(state, type);
        expect(state.piece!.type).toBe(type);
        expect(columns(state), type).toEqual(expected[type].cols);
        expect(rows(state), type).toEqual(expected[type].rows);
      }
    });

    it('spawns in rows 0-1, with I in row 1', () => {
      for (const type of PIECE_TYPES) {
        const spawnRows = [...new Set(cellsOf(spawnPiece(type)).map(([, y]) => y))];
        expect(spawnRows.sort(), type).toEqual(type === 'I' ? [1] : [0, 1]);
      }
    });

    it('scores nothing for the spawn move, even with Down held', () => {
      const state = newState();
      spawned(state, 'T');
      state.held.down = true;
      press(state, 'hardDrop');
      // Only the hard drop scores: 19 rows from rows 1-2 down to rows 20-21.
      expect(state.score).toBe(2 * 19);
      expect(state.piece!.y).toBe(1);
      expect(newState().score).toBe(0);
    });

    it('stays at the spawn rows when the row below is taken', () => {
      const state = newState();
      fillRow(state, 2, [0, 1]);
      setPiece(state, { type: 'O', rotation: 0, x: 0, y: 19 });
      spawnNext(state, 'T');
      expect(state.phase).toBe('playing');
      expect(rows(state)).toEqual([0, 1]);
    });
  });

  describe('movement', () => {
    it('stops at the walls', () => {
      const state = newState();
      spawned(state, 'T');
      for (let i = 0; i < 6; i++) tap(state, 'left');
      expect(columns(state)).toEqual([0, 1, 2]);
      for (let i = 0; i < 12; i++) tap(state, 'right');
      expect(columns(state)).toEqual([7, 8, 9]);
    });

    it('stops on locked cells', () => {
      const state = newState();
      spawned(state, 'T');
      fill(state, [[2, 2]]);
      tap(state, 'left');
      expect(columns(state)).toEqual([3, 4, 5]);
    });

    it('puts the ghost where the piece will land', () => {
      const state = newState();
      spawned(state, 'T');
      expect(ghostY(state)).toBe(ROWS - 2);
      fillRow(state, 21, [0]);
      expect(ghostY(state)).toBe(ROWS - 3);
      fill(state, [[4, 10]]);
      expect(ghostY(state)).toBe(8);
    });
  });

  describe('rotation', () => {
    it('rotates clockwise and counter-clockwise on an open board', () => {
      const state = newState();
      spawned(state, 'T');
      tap(state, 'rotateCw');
      expect(state.piece!.rotation).toBe(1);
      tap(state, 'rotateCcw');
      tap(state, 'rotateCcw');
      expect(state.piece!.rotation).toBe(3);
    });

    /** Fills the board except the piece's cells and the target's, then rotates. */
    function kickTo(from: Piece, target: Piece, action: Action) {
      const state = newState();
      for (let y = 0; y < ROWS; y++) fillRow(state, y);
      for (const [x, y] of [...cellsOf(from), ...cellsOf(target)]) state.board[y][x] = null;
      setPiece(state, from);
      tap(state, action);
      return state;
    }

    it('kicks T up a row, with the y-up kick table', () => {
      const from: Piece = { type: 'T', rotation: 0, x: 4, y: 10 };
      // 0 to R, test 3 is (-1, +1): one column left and one row up.
      const target: Piece = { type: 'T', rotation: 1, x: 3, y: 9 };
      const state = kickTo(from, target, 'rotateCw');
      expect(state.piece).toEqual(target);
    });

    it('kicks I with its own table', () => {
      const from: Piece = { type: 'I', rotation: 0, x: 4, y: 10 };
      // 0 to R on the I table, test 4 is (-2, -1): two columns left and one row down.
      const target: Piece = { type: 'I', rotation: 1, x: 2, y: 11 };
      const state = kickTo(from, target, 'rotateCw');
      expect(state.piece).toEqual(target);
    });

    it('kicks I up two rows', () => {
      const from: Piece = { type: 'I', rotation: 0, x: 3, y: 10 };
      // 0 to R on the I table, test 5 is (+1, +2).
      const target: Piece = { type: 'I', rotation: 1, x: 4, y: 8 };
      const state = kickTo(from, target, 'rotateCw');
      expect(state.piece).toEqual(target);
    });

    it('does nothing when no kick fits', () => {
      const from: Piece = { type: 'T', rotation: 0, x: 4, y: 10 };
      const state = kickTo(from, from, 'rotateCw');
      expect(state.piece).toEqual(from);
    });

    it('treats the cells above row 0 as blocked', () => {
      const state = newState();
      setPiece(state, { type: 'I', rotation: 0, x: 3, y: -1 });
      // Row 0 holds the I. Every kick to R would need rows above 0 or below the block.
      fillRow(state, 1);
      tap(state, 'rotateCw');
      expect(state.piece!.rotation).toBe(0);
    });

    it('never rotates O, and an O rotate uses no reset', () => {
      const state = newState();
      spawned(state, 'O');
      land(state);
      step(state, 200);
      tap(state, 'rotateCw');
      tap(state, 'rotateCcw');
      expect(state.piece!.rotation).toBe(0);
      expect(state.lockTimer).toBe(200);
      expect(state.resets).toBe(0);
    });
  });

  describe('lock delay', () => {
    it('locks after 500ms on the ground', () => {
      const state = newState();
      spawned(state, 'T');
      land(state);
      step(state, 499);
      expect(state.board[21].every((cell) => cell === null)).toBe(true);
      step(state, 1);
      expect(state.board[21].filter(Boolean)).toHaveLength(3);
    });

    it('allows 15 resets, and the 16th move leaves the timer alone', () => {
      const state = newState();
      spawned(state, 'T');
      land(state);
      for (let i = 1; i <= 15; i++) {
        step(state, 100);
        tap(state, i % 2 ? 'left' : 'right');
        expect(state.resets).toBe(i);
        expect(state.lockTimer).toBe(0);
      }
      step(state, 100);
      const x = state.piece!.x;
      tap(state, 'right');
      expect(state.piece!.x).toBe(x + 1);
      expect(state.lockTimer).toBe(100);
      expect(state.resets).toBe(15);
      step(state, 399);
      expect(state.board[21].every((cell) => cell === null)).toBe(true);
      step(state, 1);
      expect(state.board[21].filter(Boolean)).toHaveLength(3);
    });

    it('uses no reset on a failed move', () => {
      const state = newState();
      spawned(state, 'T');
      for (let i = 0; i < 5; i++) tap(state, 'left');
      land(state);
      step(state, 100);
      tap(state, 'left');
      expect(state.lockTimer).toBe(100);
      expect(state.resets).toBe(0);
    });

    it('restores the resets on a new lowest row, after sliding off a ledge', () => {
      const state = newState();
      spawned(state, 'T');
      fillRow(state, 21, [7, 8, 9]);
      land(state);
      step(state, 100);
      for (let i = 0; i < 4; i++) tap(state, 'right');
      expect(columns(state)).toEqual([7, 8, 9]);
      expect(state.resets).toBe(4);
      expect(isGrounded(state)).toBe(false);
      // The fall timer stayed at 0 on the ground, so it falls a full interval later.
      step(state, 999);
      expect(rows(state)).toEqual([19, 20]);
      step(state, 1);
      expect(rows(state)).toEqual([20, 21]);
      expect(state.resets).toBe(0);
      expect(state.lockTimer).toBe(0);
    });

    it('does not refresh the timer on a kick up and a re-land', () => {
      const state = newState();
      // T in R at (3, 10), on blocks that make a counter-clockwise turn kick up two rows.
      fill(state, [
        [3, 11],
        [6, 11],
        [5, 12],
        [4, 13],
      ]);
      setPiece(state, { type: 'T', rotation: 1, x: 3, y: 10 });
      expect(isGrounded(state)).toBe(true);
      step(state, 300);
      state.resets = 15;
      tap(state, 'rotateCcw');
      expect(state.piece).toEqual({ type: 'T', rotation: 0, x: 3, y: 8 });
      expect(isGrounded(state)).toBe(false);
      expect(state.lockTimer).toBe(300);
      step(state, 1000);
      expect(state.piece!.y).toBe(9);
      expect(isGrounded(state)).toBe(true);
      expect(state.lockTimer).toBe(300);
      step(state, 199);
      expect(state.piece!.y).toBe(9);
      step(state, 1);
      expect(state.board[10][4]).toBe('T');
    });

    it('never locks on a soft drop', () => {
      const state = newState();
      spawned(state, 'T');
      land(state);
      tap(state, 'down');
      expect(state.piece!.type).toBe('T');
      expect(state.board[21].every((cell) => cell === null)).toBe(true);
    });
  });

  describe('key repeat', () => {
    it('moves once, waits 170ms, then moves every 50ms', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'right');
      expect(state.piece!.x).toBe(4);
      step(state, 169);
      expect(state.piece!.x).toBe(4);
      step(state, 1);
      expect(state.piece!.x).toBe(5);
      step(state, 49);
      expect(state.piece!.x).toBe(5);
      step(state, 1);
      expect(state.piece!.x).toBe(6);
      step(state, 50);
      expect(state.piece!.x).toBe(7);
    });

    it('lets the last pressed direction take over', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'right');
      step(state, 170);
      expect(state.piece!.x).toBe(5);
      press(state, 'left');
      expect(state.piece!.x).toBe(4);
      step(state, 169);
      expect(state.piece!.x).toBe(4);
      step(state, 1);
      expect(state.piece!.x).toBe(3);
    });

    it('falls back to the other held direction on release', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'left');
      press(state, 'right');
      expect(state.piece!.x).toBe(3);
      step(state, 100);
      release(state, 'right');
      expect(state.piece!.x).toBe(2);
      step(state, 169);
      expect(state.piece!.x).toBe(2);
      step(state, 1);
      expect(state.piece!.x).toBe(1);
    });

    it('stops when the held direction is released', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'right');
      release(state, 'right');
      step(state, 500);
      expect(state.piece!.x).toBe(4);
    });

    it('carries the repeat timer across a lock and spawn', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'right');
      step(state, 100);
      spawnNext(state, 'T');
      expect(state.piece!.x).toBe(3);
      step(state, 69);
      expect(state.piece!.x).toBe(3);
      step(state, 1);
      expect(state.piece!.x).toBe(4);
    });

    it('keeps running while blocked by a wall', () => {
      const state = newState();
      spawned(state, 'T');
      for (let i = 0; i < 3; i++) tap(state, 'left');
      press(state, 'left');
      step(state, 200);
      expect(state.repeating).toBe(true);
      expect(state.repeatTimer).toBe(30);
    });
  });

  describe('dropping', () => {
    it('soft drops one row every 50ms at level 1 and scores 1 per row', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'down');
      expect(state.piece!.y).toBe(2);
      step(state, 49);
      expect(state.piece!.y).toBe(2);
      step(state, 1);
      expect(state.piece!.y).toBe(3);
      step(state, 100);
      expect(state.piece!.y).toBe(5);
      expect(state.score).toBe(4);
    });

    it('soft drops one row every 50ms at level 15', () => {
      const state = newState();
      state.lines = 140;
      expect(level(state)).toBe(15);
      spawned(state, 'T');
      press(state, 'down');
      step(state, 150);
      expect(state.piece!.y).toBe(5);
      expect(state.score).toBe(4);
    });

    it('returns to normal gravity on release, keeping the fall timer', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'down');
      step(state, 30);
      release(state, 'down');
      expect(state.fallTimer).toBe(30);
      step(state, 969);
      expect(state.piece!.y).toBe(2);
      step(state, 1);
      expect(state.piece!.y).toBe(3);
      expect(state.score).toBe(1);
    });

    it('keeps soft dropping a new piece while Down is held', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'down');
      spawnNext(state, 'T');
      const y = state.piece!.y;
      step(state, 50);
      expect(state.piece!.y).toBe(y + 1);
    });

    it('hard drops 2 points per row moved', () => {
      const state = newState();
      spawned(state, 'T');
      press(state, 'hardDrop');
      expect(state.score).toBe(2 * 19);
      expect(state.board[21].filter(Boolean)).toHaveLength(3);
    });

    it('hard drops 0 points when already on the ground', () => {
      const state = newState();
      setPiece(state, { type: 'T', rotation: 0, x: 3, y: 20 });
      press(state, 'hardDrop');
      expect(state.score).toBe(0);
      expect(state.board[21].filter(Boolean)).toHaveLength(3);
    });
  });

  describe('clears and scoring', () => {
    /** Fills the bottom rows except column 9, then locks a vertical I there. */
    function clearRows(state: StackState, count: number) {
      for (let y = ROWS - count; y < ROWS; y++) fillRow(state, y, [9]);
      setPiece(state, { type: 'I', rotation: 1, x: 7, y: ROWS - 4 });
      const before = state.score;
      press(state, 'hardDrop');
      return state.score - before;
    }

    it.each([
      [1, 100],
      [2, 300],
      [3, 500],
      [4, 800],
    ])('clears %i rows for %i points at level 1', (count, points) => {
      const state = newState();
      expect(clearRows(state, count)).toBe(points);
      expect(state.lines).toBe(count);
      expect(state.board[21][9]).toBe(count === 4 ? null : 'I');
      expect(state.board.flat().filter(Boolean)).toHaveLength(4 - count);
    });

    it('multiplies by the level', () => {
      const state = newState();
      state.lines = 20;
      expect(clearRows(state, 2)).toBe(300 * 3);
      expect(clearPoints(4, 5)).toBe(4000);
    });

    it('scores a clear across a level boundary with the old level, then levels up', () => {
      const state = newState();
      state.lines = 8;
      expect(clearRows(state, 4)).toBe(800);
      expect(state.lines).toBe(12);
      expect(level(state)).toBe(2);
    });

    it('applies the new level to the next piece', () => {
      const state = newState();
      state.lines = 9;
      clearRows(state, 1);
      expect(level(state)).toBe(2);
      const y = state.piece!.y;
      step(state, 799);
      expect(state.piece!.y).toBe(y);
      step(state, 1);
      expect(state.piece!.y).toBe(y + 1);
    });
  });

  describe('gravity', () => {
    it('speeds up with each level, down to a 50ms floor', () => {
      expect(gravityInterval(1)).toBe(1000);
      expect(gravityInterval(2)).toBe(800);
      expect(gravityInterval(3)).toBeCloseTo(640);
      expect(gravityInterval(14)).toBeCloseTo(1000 * 0.8 ** 13);
      expect(gravityInterval(15)).toBe(50);
      expect(gravityInterval(30)).toBe(50);
    });

    it('falls one row per interval, several in one step', () => {
      const state = newState();
      spawned(state, 'T');
      step(state, 999);
      expect(state.piece!.y).toBe(1);
      step(state, 1);
      expect(state.piece!.y).toBe(2);
      step(state, 3000);
      expect(state.piece!.y).toBe(5);
      expect(state.score).toBe(0);
    });

    it('falls at 50ms per row at a high level', () => {
      const state = newState();
      state.lines = 200;
      spawned(state, 'T');
      step(state, 500);
      expect(state.piece!.y).toBe(11);
    });
  });

  describe('hold', () => {
    it('takes the next piece when hold is empty, once per piece', () => {
      const state = newState();
      const first = state.piece!.type;
      const next = state.queue[0];
      press(state, 'hold');
      expect(state.hold).toBe(first);
      expect(state.piece!.type).toBe(next);
      press(state, 'hold');
      expect(state.hold).toBe(first);
      expect(state.piece!.type).toBe(next);
    });

    it('can hold again after a lock, swapping in spawn orientation', () => {
      const state = newState();
      const first = state.piece!.type;
      press(state, 'hold');
      press(state, 'hardDrop');
      const current = state.piece!.type;
      press(state, 'hold');
      expect(state.hold).toBe(current);
      expect(state.piece).toEqual({ ...spawnPiece(first), y: 1 });
    });

    it('works during lock delay with fresh lock values', () => {
      const state = newState();
      spawned(state, 'T');
      land(state);
      step(state, 200);
      tap(state, 'left');
      expect(state.resets).toBe(1);
      press(state, 'hold');
      expect(state.hold).toBe('T');
      expect(state.lockTimer).toBe(0);
      expect(state.resets).toBe(0);
      expect(state.fallTimer).toBe(0);
    });

    it('ends the round when the held piece spawns into an overlap', () => {
      let calls = 0;
      const state = newState({ onGameOver: () => calls++ });
      spawned(state, 'T');
      state.hold = 'I';
      fill(state, [[6, 1]]);
      press(state, 'hold');
      expect(state.phase).toBe('over');
      expect(calls).toBe(1);
      expect(state.board[1].filter(Boolean)).toHaveLength(1);
    });
  });

  describe('pause', () => {
    function busyState() {
      const state = newState();
      spawned(state, 'T');
      press(state, 'right');
      press(state, 'down');
      step(state, 30);
      return state;
    }

    function timers(state: StackState) {
      const { fallTimer, lockTimer, repeatTimer, piece } = state;
      return { fallTimer, lockTimer, repeatTimer, piece };
    }

    it.each([
      ['P', (state: StackState) => press(state, 'pause')],
      ['blur', (state: StackState) => blur(state)],
    ])('freezes every timer and clears held keys on %s', (_, pause) => {
      const state = busyState();
      pause(state);
      expect(state.phase).toBe('paused');
      expect(state.held).toEqual({ left: false, right: false, down: false });
      expect(state.repeatDir).toBeNull();
      const before = timers(state);
      step(state, 5000);
      expect(timers(state)).toEqual(before);

      // Resuming is by P only, and the keys held before do nothing.
      blur(state);
      expect(state.phase).toBe('paused');
      press(state, 'pause');
      expect(state.phase).toBe('playing');
      const x = state.piece!.x;
      step(state, 500);
      expect(state.piece!.x).toBe(x);
    });

    it('freezes the lock timer', () => {
      const state = newState();
      spawned(state, 'T');
      land(state);
      step(state, 200);
      press(state, 'pause');
      step(state, 5000);
      press(state, 'pause');
      expect(state.lockTimer).toBe(200);
      expect(state.piece!.type).toBe('T');
    });

    it('blocks every input except P', () => {
      const actions: Action[] = [
        'left',
        'right',
        'down',
        'rotateCw',
        'rotateCcw',
        'hardDrop',
        'hold',
        'newRound',
      ];
      const state = newState();
      spawned(state, 'T');
      press(state, 'pause');
      const before = structuredClone({ ...state, random: undefined, onGameOver: undefined });
      for (const action of actions) press(state, action);
      expect({ ...state, random: undefined, onGameOver: undefined }).toEqual(before);
    });
  });

  describe('game over', () => {
    it('ends the round when a spawn overlaps, without placing the piece', () => {
      let score: number | undefined;
      const state = newState({ onGameOver: (s) => (score = s) });
      spawned(state, 'T');
      fill(state, [[4, 0]]);
      spawnNext(state, 'O');
      expect(state.phase).toBe('over');
      expect(state.piece).toBeNull();
      expect(score).toBe(state.score);
      expect(state.board[0][5]).toBeNull();
      expect(state.board[1][4]).toBeNull();
    });

    it('ends the round when a piece locks entirely in the hidden rows', () => {
      const scores: number[] = [];
      const state = newState({ onGameOver: (s) => scores.push(s) });
      fill(state, [
        [4, 2],
        [5, 2],
      ]);
      setPiece(state, { type: 'O', rotation: 0, x: 4, y: 0 });
      step(state, 500);
      expect(state.phase).toBe('over');
      expect(state.board[0][4]).toBe('O');
      expect(scores).toEqual([0]);
    });

    it('keeps playing after a clear in the hidden rows', () => {
      let calls = 0;
      const state = newState({ onGameOver: () => calls++ });
      fill(state, [
        [0, 2],
        [1, 2],
      ]);
      fillRow(state, 1, [0, 1]);
      setPiece(state, { type: 'O', rotation: 0, x: 0, y: 0 });
      press(state, 'hardDrop');
      expect(state.phase).toBe('playing');
      expect(state.lines).toBe(1);
      expect(state.board[1].slice(0, 2)).toEqual(['O', 'O']);
      expect(calls).toBe(0);
    });

    it('fires onGameOver exactly once on a hard drop game over, and again in a new round', () => {
      const scores: number[] = [];
      const state = newState({ onGameOver: (s) => scores.push(s) });
      const hiddenLock = () => {
        fill(state, [
          [4, 2],
          [5, 2],
        ]);
        setPiece(state, { type: 'O', rotation: 0, x: 4, y: 0 });
        state.score = 120;
        press(state, 'hardDrop');
      };
      hiddenLock();
      expect(state.phase).toBe('over');
      press(state, 'hardDrop');
      press(state, 'pause');
      blur(state);
      step(state, 5000);
      expect(state.phase).toBe('over');
      expect(scores).toEqual([120]);

      press(state, 'newRound');
      expect(state.phase).toBe('playing');
      expect(state.score).toBe(0);
      expect(state.board.flat().filter(Boolean)).toHaveLength(0);
      hiddenLock();
      expect(scores).toEqual([120, 120]);
    });

    it('starts a new round only with Enter at game over, clearing held keys', () => {
      const state = newState();
      press(state, 'newRound');
      expect(state.phase).toBe('playing');
      state.phase = 'over';
      state.held.left = true;
      state.repeatDir = 'left';
      press(state, 'newRound');
      expect(state.held.left).toBe(false);
      expect(state.repeatDir).toBeNull();
    });
  });

  describe('clear count and confetti', () => {
    function clearRow(state: StackState) {
      fillRow(state, ROWS - 1, [9]);
      setPiece(state, { type: 'I', rotation: 1, x: 7, y: ROWS - 4 });
      press(state, 'hardDrop');
    }

    it('counts each lock that clears rows, once however many rows it clears', () => {
      const state = newState();
      expect(state.clears).toBe(0);
      clearRow(state);
      expect(state.clears).toBe(1);
      for (let y = ROWS - 4; y < ROWS; y++) fillRow(state, y, [0]);
      setPiece(state, { type: 'I', rotation: 1, x: -2, y: ROWS - 4 });
      press(state, 'hardDrop');
      expect(state.lines).toBe(5);
      expect(state.clears).toBe(2);
      spawnNext(state, 'O');
      expect(state.clears).toBe(2);
    });

    it('resets the clear count on a new round', () => {
      const state = newState();
      clearRow(state);
      state.phase = 'over';
      press(state, 'newRound');
      expect(state.clears).toBe(0);
    });

    it('starts a burst on a clear, lasts 1.6 seconds, and restarts on the next clear', () => {
      const confetti = createConfetti();
      stepConfetti(confetti, 0, 16);
      expect(confetti.age).toBeNull();
      stepConfetti(confetti, 1, 16);
      expect(confetti.age).toBe(0);
      stepConfetti(confetti, 1, 1000);
      expect(confetti.age).toBe(1000);
      stepConfetti(confetti, 2, 16);
      expect(confetti.age).toBe(0);
      stepConfetti(confetti, 2, CONFETTI_DURATION - 1);
      expect(confetti.age).toBe(CONFETTI_DURATION - 1);
      stepConfetti(confetti, 2, 1);
      expect(confetti.age).toBeNull();
    });

    it('clears the burst on a new round', () => {
      const confetti = createConfetti();
      stepConfetti(confetti, 3, 16);
      stepConfetti(confetti, 0, 16);
      expect(confetti.age).toBeNull();
      expect(confetti.clears).toBe(0);
    });

    it('never starts with reduced motion', () => {
      const confetti = createConfetti();
      stepConfetti(confetti, 1, 16, true);
      expect(confetti.age).toBeNull();
      expect(confetti.clears).toBe(1);
    });

    it('has up to 90 pieces in the five confetti colours', () => {
      const pieces = confettiPieces(400);
      expect(pieces).toHaveLength(CONFETTI_PIECES);
      expect(CONFETTI_PIECES).toBeLessThanOrEqual(90);
      expect(new Set(pieces.map((p) => p.color)).size).toBe(5);
    });

    it('has no effect on play', () => {
      const run = (withConfetti: boolean) => {
        const state = newState();
        const confetti = createConfetti(state.clears);
        const actions: Action[] = ['left', 'rotateCw', 'hardDrop', 'right', 'hardDrop', 'hold'];
        clearRow(state);
        for (const action of actions) {
          tap(state, action);
          step(state, 120);
          if (withConfetti) {
            stepConfetti(confetti, state.clears, 120);
            confettiPieces(confetti.age ?? 0);
          }
        }
        return { ...state, random: undefined, onGameOver: undefined };
      };
      expect(run(true)).toEqual(run(false));
    });
  });
});
