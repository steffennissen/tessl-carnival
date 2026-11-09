import {
  C,
  type G,
  circle,
  clamp01,
  easeOutBack,
  fillStroke,
  font,
  palette,
  plainText,
  rounded,
  stickerText,
  vertical,
} from '../art';
import type { Shape } from '../layout';
import {
  QUIZ_OUTRO,
  SMART_BONUS,
  answer,
  answerFx,
  cheerLines,
  drawQuestion,
  finishStep,
  inBox,
  inCircle,
  middleOf,
  observeAnswer,
  quizPlaces,
  startAnswer,
  type AnswerFx,
  type AnswerState,
  type Box,
  type Disc,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Pay: a customer buys the finished dish. "That's 45¢. Tap the coins to
 * pay!" She taps coins in the bank at the bottom into the tray, and the
 * total counts up. At Level 1 each coin shows its value and name; at Level 2
 * only its name, with the values shown after a wrong check. Paying exactly right
 * checks itself (after adding a coin or giving one back); Check! asks
 * whether it's enough. Too much gets a gentle
 * "Oops, too much!" and a tap on a coin's pile in the tray gives one back
 * (each kind of coin has its own cell, a big target).
 *
 * The shared answer rules: Check! short of the price gets a hint and
 * another go; after two, Chef Bunny lays out the coins and Check! carries
 * on. A learning step: no part of the cooking score.
 */

const K = palette({ copper: '#e59a62', copperLight: '#ffd2a8', copperDark: '#b8693a' });

export type CoinId = 'quarter' | 'dime' | 'nickel' | 'penny';

export interface Coin {
  id: CoinId;
  name: string;
  /** Its value in cents. */
  value: number;
  /** Its size in the bank: a dime is the smallest, as in real life. */
  r: number;
}

/** The coins, biggest value first. Sizes follow the real coins. */
export const COINS: Record<CoinId, Coin> = {
  quarter: { id: 'quarter', name: 'quarter', value: 25, r: 43 },
  dime: { id: 'dime', name: 'dime', value: 10, r: 32 },
  nickel: { id: 'nickel', name: 'nickel', value: 5, r: 38 },
  penny: { id: 'penny', name: 'penny', value: 1, r: 35 },
};

export interface PayOptions extends StepBasics {
  kind: 'pay';
  /** The price in cents. */
  price: number;
  /** The coins in the bank, biggest value first. */
  coins: CoinId[];
  /** What she reads, and the voice reads out: "That's 45¢. Tap the coins to pay!" */
  text: string;
  /**
   * Whether each coin shows its value ("25¢") from the start (Level 1, and
   * if left out). False (Level 2): the coins show only their names, so she
   * has to know them, and their values appear after a wrong check, as help.
   */
  values?: boolean;
}

declare module '../kit/types' {
  interface StepKinds {
    pay: PayOptions;
  }
}

/** The tray, the total paid and Check! on a computer, in scene units. */
export const TRAY: Box = { x: 215, y: 250, w: 330, h: 110 };
export const PAID: Box = { x: 558, y: 250, w: 132, h: 50 };
export const PAY_CHECK: Box = { x: 558, y: 308, w: 132, h: 56 };
/** The most coins the tray holds. */
export const TRAY_MOST = 16;

/** Where the paying's pieces go, for a canvas shape (see `payPlaces`). */
export interface PayPlaces {
  bubble: Box;
  speaker: Disc;
  tray: Box;
  paid: Box;
  check: Box;
  /**
   * The bank's row of coins: across `x` to `x + w` at height `y`, drawn
   * `scale` times their size in COINS, and a tap within `reach` of one (or
   * just off its edge) taps it.
   */
  bank: { x: number; w: number; y: number; scale: number; reach: number };
}

/**
 * Where everything goes for the canvas's shape, clear of Chef Bunny, the
 * HUD and the progress pill. On a computer: the tray under the question,
 * the total and Check! beside it, and the bank along the bottom. On a phone
 * held sideways the tray is wider and Check! is big at the right.
 * Held upright the tray spans the screen under the question, then the bank
 * with bigger coins, then the total and Check! either side of the pill.
 * Everything a finger taps is at least about 60 CSS pixels.
 */
export function payPlaces(shape: Shape = 'page'): PayPlaces {
  if (shape === 'tall') {
    const { bubble, speaker } = quizPlaces('tall');
    return {
      bubble,
      speaker,
      tray: { x: 110, y: 214, w: 580, h: 118 },
      paid: { x: 110, y: 450, w: 240, h: 94 },
      check: { x: 450, y: 450, w: 240, h: 94 },
      bank: { x: 110, w: 580, y: 388, scale: 1.2, reach: 48 },
    };
  }
  const { bubble, speaker } = quizPlaces(shape);
  if (shape === 'wide') {
    return {
      bubble,
      speaker,
      tray: { x: 215, y: 250, w: 380, h: 110 },
      paid: { x: 607, y: 250, w: 178, h: 62 },
      check: { x: 607, y: 328, w: 178, h: 102 },
      bank: { x: 215, w: 385, y: 420, scale: 1, reach: 44 },
    };
  }
  return {
    bubble,
    speaker,
    tray: TRAY,
    paid: PAID,
    check: PAY_CHECK,
    bank: { x: 215, w: 475, y: 414, scale: 1, reach: 44 },
  };
}

/** A coin in the bank: where it sits, how big it's drawn, and how far off it a tap still taps it. */
export interface BankSpot {
  id: CoinId;
  x: number;
  y: number;
  r: number;
  reach: number;
}

/** Where the bank's coins sit, in order. */
export function bankSpots(coins: readonly CoinId[], shape: Shape = 'page'): BankSpot[] {
  const { bank } = payPlaces(shape);
  const gap = bank.w / coins.length;
  return coins.map((id, i) => {
    const r = COINS[id].r * bank.scale;
    return { id, x: bank.x + gap * (i + 0.5), y: bank.y, r, reach: Math.max(bank.reach, r + 8) };
  });
}

/**
 * The tray's cells, one per coin in the bank, in the bank's order, side by
 * side across the tray: the coins tapped in pile up in their own kind's
 * cell, and a tap anywhere in a cell gives one of them back. So each cell,
 * not a little coin, is the target: at least about 60 CSS pixels on a phone.
 */
export function trayCells(coins: readonly CoinId[], shape: Shape = 'page'): Box[] {
  const { tray } = payPlaces(shape);
  const pad = 8;
  const gap = 6;
  const w = (tray.w - pad * 2 - gap * (coins.length - 1)) / coins.length;
  return coins.map((_, i) => ({
    x: tray.x + pad + i * (w + gap),
    y: tray.y + pad,
    w,
    h: tray.h - pad * 2,
  }));
}

/**
 * Where each coin of a pile sits in its cell, and how big: fanned out from
 * left to right, overlapping when there are many.
 */
export function pileSpots(cell: Box, count: number): { x: number; y: number; r: number }[] {
  const r = Math.min(cell.h * 0.33, cell.w * 0.3);
  const room = cell.w - r * 2 - 14;
  const dx = count > 1 ? Math.min(r * 0.75, room / (count - 1)) : 0;
  const left = cell.x + cell.w / 2 - (dx * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: left + i * dx,
    y: cell.y + cell.h / 2 + 4 + (i % 2 ? -3 : 3),
    r,
  }));
}

/** What coins add up to, in cents. */
export function coinTotal(coins: readonly CoinId[]): number {
  return coins.reduce((sum, id) => sum + COINS[id].value, 0);
}

/** The fewest coins (from those in the bank) that make `cents`, biggest first. */
export function fewestCoins(cents: number, bank: readonly CoinId[]): CoinId[] {
  const coins: CoinId[] = [];
  let left = cents;
  for (const id of [...bank].sort((a, b) => COINS[b].value - COINS[a].value)) {
    while (left >= COINS[id].value) {
      coins.push(id);
      left -= COINS[id].value;
    }
  }
  return coins;
}

/** "Let's count on: quarter, 25. Dime, 35. 35 cents!" */
export function countOn(coins: readonly CoinId[]): string {
  let total = 0;
  const parts = coins.map((id) => {
    total += COINS[id].value;
    return `${COINS[id].name}, ${total}`;
  });
  return `Let's count on: ${parts.join('. ')}. That's ${total} cents!`;
}

export interface PayState extends AnswerState {
  /** The coins in the tray, in the order they went in. */
  tray: CoinId[];
  /** Checked right (or paid exactly). */
  done: boolean;
  /** Short at the last wrong check, in cents. */
  short: number;
  reads: number;
  age: number;
  after: number;
  /** Coins tapped in so far (for the clinks). */
  taps: number;
  /** Coins tapped while the tray was full: "The tray is full!". */
  full: number;
}

export function startPay(): PayState {
  return {
    ...startAnswer(),
    tray: [],
    done: false,
    short: 0,
    reads: 0,
    age: 0,
    after: 0,
    taps: 0,
    full: 0,
  };
}

/** Checks what's in the tray: right, or a wrong try (short, or too much). */
function check(turn: Turn<PayOptions, PayState>) {
  const s = turn.state;
  const total = coinTotal(s.tray);
  const result = answer(turn.round, s, total === turn.options.price);
  if (result === 'right') {
    s.done = true;
    return;
  }
  s.short = turn.options.price - total;
  if (result === 'show') s.tray = fewestCoins(turn.options.price, turn.options.coins);
}

export function pressPay(turn: Turn<PayOptions, PayState>, x: number, y: number): boolean {
  const s = turn.state;
  const { price, coins } = turn.options;
  if (s.done) return true;
  const places = payPlaces(turn.shape);
  if (inCircle(places.speaker.x, places.speaker.y, places.speaker.r, x, y)) {
    s.reads += 1;
    return true;
  }
  if (inBox(places.check, x, y)) {
    // An empty tray isn't a try: nothing happens.
    if (s.tray.length) check(turn);
    return true;
  }
  // Once Chef Bunny has laid out the coins, they stay.
  if (s.shown) return true;
  // A tap on a cell of the tray gives one of its coins back.
  const cell = trayCells(coins, turn.shape).findIndex((b) => inBox(b, x, y, 0));
  if (cell >= 0) {
    const i = s.tray.lastIndexOf(coins[cell]);
    if (i >= 0) {
      s.tray.splice(i, 1);
      // Exactly right after giving one back checks itself too.
      if (s.tray.length && coinTotal(s.tray) === price) check(turn);
    }
    return true;
  }
  const coin = bankSpots(coins, turn.shape).find((c) => Math.hypot(x - c.x, y - c.y) <= c.reach);
  if (!coin) return true;
  // A full tray isn't "Not yet!": Chef Bunny says it's full.
  if (s.tray.length >= TRAY_MOST) {
    s.full += 1;
    return true;
  }
  s.tray.push(coin.id);
  s.taps += 1;
  // Exactly right checks itself.
  if (coinTotal(s.tray) === price) check(turn);
  return true;
}

/** Whether the coins show their values now: always at Level 1, after a wrong check (or the answer shown) at Level 2. */
export function valuesShown(options: PayOptions, state: PayState): boolean {
  return options.values !== false || state.wrong > 0 || state.shown;
}

/**
 * What the total box says, its label and its number: "Paid 35¢" while the
 * coins show their values; at Level 2 before that, how many coins are in
 * the tray (the cents would give the values away): "Coins 3".
 */
export function paidText(options: PayOptions, state: PayState): [string, string] {
  if (valuesShown(options, state)) return ['Paid', `${coinTotal(state.tray)}¢`];
  return ['Coins', String(state.tray.length)];
}

/**
 * Draws a coin centred on (x, y), radius r: silver or copper, with its value
 * and its name (`named`, if there's room). A coin with no value shown has
 * its name only, bigger.
 */
export function drawCoin(
  g: G,
  id: CoinId,
  x: number,
  y: number,
  r: number,
  named = true,
  value = true,
) {
  const coin = COINS[id];
  const copper = id === 'penny';
  circle(g, x, y, r);
  fillStroke(
    g,
    vertical(g, y - r, y + r, copper ? [K.copperLight, K.copper] : [C.white, C.steelDark]),
    3.5,
  );
  circle(g, x, y, r * 0.84);
  g.strokeStyle = copper ? K.copperDark : C.steelDark;
  g.lineWidth = 2;
  g.stroke();
  if (!value) {
    // The name alone, as big as fits across the coin.
    g.save();
    g.font = font(Math.max(11, r * 0.42));
    const fit = Math.min(1, (r * 1.55) / Math.max(1, g.measureText(coin.name).width));
    g.translate(x, y);
    g.scale(fit, fit);
    plainText(g, coin.name, 0, 1, Math.max(11, r * 0.42), C.ink);
    g.restore();
    return;
  }
  const size = Math.max(12, r * (named ? 0.52 : 0.7));
  plainText(g, `${coin.value}¢`, x, y - (named ? r * 0.16 : 0), size, C.ink);
  if (named) plainText(g, coin.name, x, y + r * 0.44, Math.max(12, r * 0.34), C.ink);
}

interface PayFx extends AnswerFx {
  taps: number;
  coins: number;
  over: boolean;
  full: number;
}

const pay: Step<PayOptions, PayState, PayFx> = {
  kind: 'pay',
  learning: true,
  uses: () => [],
  start: () => startPay(),
  title: () => 'A customer is here!',
  hint: () => ['Tap the coins', 'to pay!'],
  icon: () => '🪙',
  progress: ({ state }) => [1, state.done ? 1 : 0],
  press: (turn, x, y) => pressPay(turn, x, y),
  update(turn, dt) {
    const s = turn.state;
    s.age += dt;
    if (!s.done) return;
    s.after += dt;
    if (s.after >= QUIZ_OUTRO) finishStep(turn.round, 0);
  },
  bubble({ state: s, options, round }) {
    const total = coinTotal(s.tray);
    if (s.done) return cheerLines(round, s, ['Yes, that is', `${options.price}¢!`]);
    if (s.shown) return [`That makes ${options.price}¢!`, 'Tap Check!'];
    if (total > options.price) return ['Oops, too much!', 'Tap a coin to give it back.'];
    if (s.full > 0 && s.tray.length >= TRAY_MOST) return ['The tray is full!', 'Try bigger coins.'];
    if (s.wrong > 0 && s.short > 0) return [`We need ${s.short}¢ more!`, 'Tap more coins.'];
    return null;
  },
  solve(turn) {
    turn.state.tray = fewestCoins(turn.options.price, turn.options.coins);
    const middle = middleOf(payPlaces(turn.shape).check);
    pressPay(turn, middle.x, middle.y);
    pay.update?.(turn, QUIZ_OUTRO);
  },

  fx: () => ({ ...answerFx(), taps: 0, coins: 0, over: false, full: 0 }),

  observe(view) {
    const { state: s, options, fx, effects, round, shape } = view;
    const { tray, check } = payPlaces(shape);
    const { sound } = effects;
    const settings = round.learn.settings;
    if (s.taps > fx.taps) {
      // A coin clinks into the tray.
      fx.taps = s.taps;
      sound.tone(2350, 0.12, { type: 'triangle', volume: 0.14 });
      sound.tone(3150, 0.18, { type: 'sine', volume: 0.08, delay: 0.05 });
    } else if (s.tray.length < fx.coins && !s.shown) {
      sound.whoosh();
    }
    fx.coins = s.tray.length;
    const over = coinTotal(s.tray) > options.price && !s.done;
    if (over && !fx.over) {
      sound.boop();
      if (!settings.readMyself)
        sound.say('Oops, too much! Tap a coin in the tray to give it back.');
    }
    fx.over = over;
    if (s.full > fx.full) {
      fx.full = s.full;
      sound.boop();
      if (!settings.readMyself) sound.say('The tray is full! Try bigger coins.');
    }
    const middle = middleOf(check);
    observeAnswer(view, s, fx, {
      read: options.text,
      done: s.done,
      wrongAt: () => middle,
      wrongSay: () =>
        s.short > 0
          ? `Not quite! We need ${s.short} cents more.`
          : 'Oops, too much! Tap a coin in the tray to give it back.',
      helpSay: () => countOn(s.tray),
      doneAt: () => middle,
      burstAt: () => ({ x: tray.x + tray.w / 2, y: tray.y + 40 }),
      doneSay: () => `Yes! ${options.price} cents. Thank you!`,
    });
  },

  draw({ g, t, state: s, options, fx, taking, shape }) {
    if (!taking && s.age === 0) return;
    const { bubble, speaker, tray, paid, check } = payPlaces(shape);
    const appear = easeOutBack(clamp01(s.age / 0.4));
    const mid = middleOf(bubble);
    g.save();
    g.translate(mid.x, mid.y);
    g.scale(appear, appear);
    g.translate(-mid.x, -mid.y);
    drawQuestion(g, options.text, bubble, speaker, fx.reading, t);
    g.restore();

    // The tray, with the coins tapped in.
    rounded(g, tray.x, tray.y, tray.w, tray.h, 22);
    fillStroke(g, vertical(g, tray.y, tray.y + tray.h, [C.woodLight, C.wood]), 4);
    rounded(g, tray.x + 8, tray.y + 8, tray.w - 16, tray.h - 16, 16);
    g.fillStyle = 'rgba(255, 255, 255, 0.35)';
    g.fill();
    if (!s.tray.length)
      plainText(
        g,
        'Tap coins to put them here',
        tray.x + tray.w / 2,
        tray.y + tray.h / 2,
        Math.round(Math.min(26, tray.h * 0.2)),
        C.woodDark,
      );
    // Each kind of coin in its own cell, piled up, with how many on a tag.
    const values = valuesShown(options, s);
    trayCells(options.coins, shape).forEach((cell, k) => {
      const id = options.coins[k];
      const count = s.tray.filter((c) => c === id).length;
      if (!count) return;
      const spots = pileSpots(cell, count);
      for (const at of spots) drawCoin(g, id, at.x, at.y, at.r, false, values);
      if (count > 1) {
        const tag = Math.max(14, cell.h * 0.18);
        stickerText(
          g,
          `×${count}`,
          cell.x + cell.w - tag * 0.9,
          cell.y + tag * 0.6,
          tag,
          C.hotPink,
        );
      }
    });

    // How much is in the tray: pink while short, mint when it's right, lavender if too much.
    const total = coinTotal(s.tray);
    const color = total === options.price ? C.mint : total > options.price ? C.lavender : C.white;
    const k = paid.h / PAID.h;
    rounded(g, paid.x, paid.y, paid.w, paid.h, 16 * k);
    fillStroke(g, color, 3.5);
    const [label, amount] = paidText(options, s);
    plainText(g, label, paid.x + 34 * k, paid.y + paid.h / 2 + 1, 18 * k, C.ink);
    stickerText(
      g,
      amount,
      paid.x + paid.w - 42 * k,
      paid.y + paid.h / 2 + 1,
      30 * k,
      C.hotPink,
      'center',
      80 * k,
    );

    // Check!
    const b = check;
    const glow = s.shown && !s.done;
    g.save();
    g.translate(b.x + b.w / 2, b.y + b.h / 2);
    const throb = glow ? 1 + Math.sin(t * 6) * 0.05 : 1;
    g.scale(throb, throb);
    if (glow) {
      g.strokeStyle = C.gold;
      g.lineWidth = 7;
      rounded(g, -b.w / 2 - 7, -b.h / 2 - 7, b.w + 14, b.h + 14, 24);
      g.stroke();
    }
    g.globalAlpha = s.tray.length ? 1 : 0.5;
    rounded(g, -b.w / 2, -b.h / 2, b.w, b.h, 22);
    fillStroke(g, vertical(g, -b.h / 2, b.h / 2, [C.cabinetLight, C.mint]), 4);
    stickerText(g, 'Check! ✔', 0, 2, Math.min(44, b.h / 2), C.hotPink, 'center', b.w - 16);
    g.restore();
    g.globalAlpha = 1;

    // The bank: one of each coin, tap as many as you like.
    bankSpots(options.coins, shape).forEach((c, i) => {
      const pop = easeOutBack(clamp01((s.age - 0.15 - i * 0.08) / 0.35));
      if (pop <= 0.01) return;
      g.save();
      g.translate(c.x, c.y);
      g.scale(pop, pop);
      g.globalAlpha = s.shown ? 0.5 : 1;
      drawCoin(g, c.id, 0, 0, c.r, true, values);
      g.restore();
    });
    g.globalAlpha = 1;

    if (s.done) {
      const up = easeOutBack(clamp01(s.after / 0.35));
      g.save();
      g.translate(tray.x + tray.w / 2, tray.y + tray.h / 2);
      g.scale(up, up);
      g.rotate(-0.08);
      stickerText(g, s.outcome === 'right' ? `Yes! +${SMART_BONUS}` : 'Yes!', 0, 0, 40, C.hotPink);
      g.restore();
    }
  },
};

export default pay;
