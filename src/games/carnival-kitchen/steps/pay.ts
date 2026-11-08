import {
  C,
  CONFETTI,
  type G,
  circle,
  clamp01,
  easeOutBack,
  fillStroke,
  palette,
  plainText,
  rounded,
  stickerText,
  vertical,
} from '../art';
import {
  QUIZ_BUBBLE,
  QUIZ_OUTRO,
  QUIZ_SPEAKER,
  SMART_BONUS,
  answer,
  autoReadDelay,
  drawQuestion,
  finishStep,
  inCircle,
  startAnswer,
  type AnswerState,
  type Box,
  type Feedback,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';
import type { Reading } from '../sound';

/**
 * Pay: a customer buys the finished dish. "That's 45¢. Tap the coins to
 * pay!" She taps coins in the bank at the bottom (each drawn with its value
 * and name) into the tray, and the total counts up. Paying exactly right
 * checks itself; Check! asks whether it's enough. Too much gets a gentle
 * "Oops, too much!" and a tap on a coin in the tray gives it back.
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
}

declare module '../kit/types' {
  interface StepKinds {
    pay: PayOptions;
  }
}

/** Where everything goes, in scene units: clear of Chef Bunny and the HUD in every layout. */
export const TRAY: Box = { x: 215, y: 250, w: 330, h: 110 };
export const PAID: Box = { x: 558, y: 250, w: 132, h: 50 };
export const PAY_CHECK: Box = { x: 558, y: 308, w: 132, h: 56 };
/** The most coins the tray holds. */
export const TRAY_MOST = 16;
const BANK_Y = 414;
const TRAY_GAP = 40;

/** Where the bank's coins sit, in order. */
export function bankSpots(
  coins: readonly CoinId[],
): { id: CoinId; x: number; y: number; r: number }[] {
  const gap = 475 / coins.length;
  return coins.map((id, i) => ({ id, x: 215 + gap * (i + 0.5), y: BANK_Y, r: COINS[id].r }));
}

/** Where the `i`th coin in the tray sits: two rows of 8. */
export function traySpot(i: number): { x: number; y: number } {
  return {
    x: TRAY.x + 25 + (i % 8) * TRAY_GAP,
    y: TRAY.y + 32 + Math.floor(i / 8) * 46,
  };
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
  };
}

const inBox = (b: Box, x: number, y: number) =>
  x >= b.x - 8 && x <= b.x + b.w + 8 && y >= b.y - 8 && y <= b.y + b.h + 8;

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
  if (inCircle(QUIZ_SPEAKER.x, QUIZ_SPEAKER.y, QUIZ_SPEAKER.r, x, y)) {
    s.reads += 1;
    return true;
  }
  if (inBox(PAY_CHECK, x, y)) {
    // An empty tray isn't a try: nothing happens.
    if (s.tray.length) check(turn);
    return true;
  }
  // Once Chef Bunny has laid out the coins, they stay.
  if (s.shown) return true;
  // A coin in the tray goes back.
  for (let i = s.tray.length - 1; i >= 0; i--) {
    const at = traySpot(i);
    if (Math.hypot(x - at.x, y - at.y) <= 22) {
      s.tray.splice(i, 1);
      return true;
    }
  }
  const coin = bankSpots(coins).find((c) => Math.hypot(x - c.x, y - c.y) <= Math.max(44, c.r + 8));
  if (!coin) return true;
  if (s.tray.length >= TRAY_MOST) return false;
  s.tray.push(coin.id);
  s.taps += 1;
  // Exactly right checks itself.
  if (coinTotal(s.tray) === price) check(turn);
  return true;
}

/** Draws a coin centred on (x, y), radius r: silver or copper, its value, and its name if there's room. */
export function drawCoin(g: G, id: CoinId, x: number, y: number, r: number, named = true) {
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
  const size = Math.max(12, r * (named ? 0.52 : 0.7));
  plainText(g, `${coin.value}¢`, x, y - (named ? r * 0.16 : 0), size, C.ink);
  if (named) plainText(g, coin.name, x, y + r * 0.44, Math.max(12, r * 0.34), C.ink);
}

const CHEER: Feedback = { grade: 'Perfect!', points: 0, combo: 0, age: 0 };
const ENCOURAGE: Feedback = { grade: 'Nice try!', points: 0, combo: 0, age: 0 };

interface PayFx {
  reading: Reading | null;
  reads: number;
  autoRead: boolean;
  taps: number;
  coins: number;
  over: boolean;
  wrong: number;
  shown: boolean;
  done: boolean;
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
  bubble({ state: s, options }) {
    const total = coinTotal(s.tray);
    if (s.done)
      return s.outcome === 'right'
        ? ['Yes! You are', 'a Smart Chef!']
        : ['Yes, that is', `${options.price}¢!`];
    if (s.shown) return [`That makes ${options.price}¢!`, 'Tap Check!'];
    if (total > options.price) return ['Oops, too much!', 'Tap a coin to give it back.'];
    if (s.wrong > 0 && s.short > 0) return [`We need ${s.short}¢ more!`, 'Tap more coins.'];
    return null;
  },
  solve(turn) {
    turn.state.tray = fewestCoins(turn.options.price, turn.options.coins);
    pressPay(turn, PAY_CHECK.x + PAY_CHECK.w / 2, PAY_CHECK.y + PAY_CHECK.h / 2);
    pay.update?.(turn, QUIZ_OUTRO);
  },

  fx: () => ({
    reading: null,
    reads: 0,
    autoRead: false,
    taps: 0,
    coins: 0,
    over: false,
    wrong: 0,
    shown: false,
    done: false,
  }),

  observe({ state: s, options, fx, effects, round, taking }) {
    const { sound } = effects;
    const settings = round.learn.settings;
    const delay = autoReadDelay(settings);
    if (taking && !fx.autoRead && delay !== null && s.age >= delay && !s.done) {
      fx.autoRead = true;
      fx.reading = sound.read(options.text);
    }
    if (s.reads > fx.reads) {
      fx.reads = s.reads;
      fx.autoRead = true;
      fx.reading = sound.read(options.text);
    }
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
    const check = { x: PAY_CHECK.x + PAY_CHECK.w / 2, y: PAY_CHECK.y + PAY_CHECK.h / 2 };
    if (s.wrong > fx.wrong && !s.shown) {
      fx.wrong = s.wrong;
      sound.boop();
      effects.celebrate(check.x, check.y, ENCOURAGE);
      if (!settings.readMyself) {
        sound.say(
          s.short > 0
            ? `Not quite! We need ${s.short} cents more.`
            : 'Oops, too much! Tap a coin in the tray to give it back.',
        );
      }
    }
    if (s.shown && !fx.shown) {
      fx.shown = true;
      sound.chime([1046.5, 1318.5], 0.12, 0.12);
      if (!settings.readMyself) sound.say(countOn(s.tray));
    }
    if (s.done && !fx.done) {
      fx.done = true;
      sound.chime([1046.5, 1318.5, 1568, 2093], 0.07, 0.16);
      effects.burst(
        TRAY.x + TRAY.w / 2,
        TRAY.y + 40,
        20,
        ['star', 'heart', 'star', 'dot'],
        CONFETTI,
        280,
      );
      effects.celebrate(check.x, check.y, CHEER);
      sound.say(`Yes! ${options.price} cents. Thank you!`);
    }
  },

  draw({ g, t, state: s, options, fx, taking }) {
    if (!taking && s.age === 0) return;
    const appear = easeOutBack(clamp01(s.age / 0.4));
    g.save();
    g.translate(450, 200);
    g.scale(appear, appear);
    g.translate(-450, -200);
    drawQuestion(g, options.text, QUIZ_BUBBLE, QUIZ_SPEAKER, fx.reading, t);
    g.restore();

    // The tray, with the coins tapped in.
    rounded(g, TRAY.x, TRAY.y, TRAY.w, TRAY.h, 22);
    fillStroke(g, vertical(g, TRAY.y, TRAY.y + TRAY.h, [C.woodLight, C.wood]), 4);
    rounded(g, TRAY.x + 8, TRAY.y + 8, TRAY.w - 16, TRAY.h - 16, 16);
    g.fillStyle = 'rgba(255, 255, 255, 0.35)';
    g.fill();
    if (!s.tray.length)
      plainText(
        g,
        'Tap coins to put them here',
        TRAY.x + TRAY.w / 2,
        TRAY.y + TRAY.h / 2,
        18,
        C.woodDark,
      );
    s.tray.forEach((id, i) => {
      const at = traySpot(i);
      drawCoin(g, id, at.x, at.y, 19, false);
    });

    // How much is in the tray: pink while short, mint when it's right, lavender if too much.
    const total = coinTotal(s.tray);
    const color = total === options.price ? C.mint : total > options.price ? C.lavender : C.white;
    rounded(g, PAID.x, PAID.y, PAID.w, PAID.h, 16);
    fillStroke(g, color, 3.5);
    plainText(g, 'Paid', PAID.x + 32, PAID.y + PAID.h / 2 + 1, 18, C.ink);
    stickerText(
      g,
      `${total}¢`,
      PAID.x + PAID.w - 42,
      PAID.y + PAID.h / 2 + 1,
      30,
      C.hotPink,
      'center',
      80,
    );

    // Check!
    const b = PAY_CHECK;
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
    stickerText(g, 'Check! ✔', 0, 2, 28, C.hotPink, 'center', b.w - 16);
    g.restore();
    g.globalAlpha = 1;

    // The bank: one of each coin, tap as many as you like.
    bankSpots(options.coins).forEach((c, i) => {
      const pop = easeOutBack(clamp01((s.age - 0.15 - i * 0.08) / 0.35));
      if (pop <= 0.01) return;
      g.save();
      g.translate(c.x, c.y);
      g.scale(pop, pop);
      g.globalAlpha = s.shown ? 0.5 : 1;
      drawCoin(g, c.id, 0, 0, c.r);
      g.restore();
    });
    g.globalAlpha = 1;

    if (s.done) {
      const up = easeOutBack(clamp01(s.after / 0.35));
      g.save();
      g.translate(TRAY.x + TRAY.w / 2, TRAY.y + TRAY.h / 2);
      g.scale(up, up);
      g.rotate(-0.08);
      stickerText(g, s.outcome === 'right' ? `Yes! +${SMART_BONUS}` : 'Yes!', 0, 0, 40, C.hotPink);
      g.restore();
    }
  },
};

export default pay;
