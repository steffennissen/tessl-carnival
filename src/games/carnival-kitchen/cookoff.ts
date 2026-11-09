import { planRound } from './activities';
import { type Box, closeButton, gridFor } from './book';
import type { GuestKind } from './customers';
import type { Dish, LearnSettings, RoundPlan } from './kit';
import type { Layout } from './layout';

/**
 * The cook-off: a challenge from the title screen's **Cook-off** button.
 *
 * - **Beat your best**: one dish she has cooked, and her best score on it
 *   (kept as the sticker `best:<dish>`, whose level is the best score: the
 *   sticker book only ever keeps the best level). Chef Bunny challenges her
 *   to beat it, she cooks it, and the judges taste it.
 * - **Two chefs**: two players on one device each pick an animal chef, then
 *   both cook the same dish (the same seeded round, so the same dotted lines,
 *   stars and learning moment), passing the device between them. The judges
 *   taste both and hold up their score cards.
 *
 * Plain functions with no canvas, tested in cookoff.test.ts; game.ts runs a
 * cook-off, render.ts and cookoff-draw.ts show it.
 */

/** The two kinds of cook-off. */
export type CookoffMode = 'best' | 'duo';

/** A chef in a cook-off: an animal (two chefs), or her own self (beat your best). */
export interface CookoffChef {
  /** The animal drawn for them (stand.ts), or null for her (beat your best). */
  kind: GuestKind | null;
  /** "Chef Fox", or "You". */
  name: string;
}

/** The animal chefs two players pick from. Lulu the Lobster is a judge, so she isn't one. */
export const CHEFS: readonly CookoffChef[] = [
  { kind: 'fox', name: 'Chef Fox' },
  { kind: 'bear', name: 'Chef Bear' },
  { kind: 'kitten', name: 'Chef Kitten' },
  { kind: 'penguin', name: 'Chef Penguin' },
  { kind: 'frog', name: 'Chef Frog' },
  { kind: 'pig', name: 'Chef Pig' },
];

/** Her, in a beat-your-best cook-off. */
export const YOU: CookoffChef = { kind: null, name: 'You' };

/** What a chef's round scored: its points, and the most its cooking steps could. */
export interface CookoffResult {
  score: number;
  max: number;
}

export interface Cookoff {
  mode: CookoffMode;
  dish: Dish;
  /** Seeds every chef's round, so they're all the same round. */
  seed: number;
  chefs: CookoffChef[];
  /** Whose turn it is to cook: an index into `chefs`. */
  turn: number;
  /** Each chef's round, once cooked. */
  results: CookoffResult[];
  /** Her best score on the dish before this cook-off (beat your best), or null. */
  best: number | null;
  /** The round's plan (steps, learning moment, clock), the same for every chef. */
  plan: RoundPlan | null;
  /** Whether the cook-off's coins have been given. */
  paid: boolean;
}

export function createCookoff(
  mode: CookoffMode,
  dish: Dish,
  seed: number,
  chefs: CookoffChef[],
  best: number | null = null,
): Cookoff {
  return { mode, dish, seed, chefs, turn: 0, results: [], best, plan: null, paid: false };
}

/** A seeded random (Park and Miller), so a cook-off's rounds and cards repeat. */
export function seededRandom(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) % 2147483646;
  if (s === 0) s = 1;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 5; i++) next();
  return next;
}

/** A fresh seed for a new cook-off. */
export const newSeed = (random: () => number = Math.random) =>
  1 + Math.floor(random() * 2147483000);

/**
 * The round's plan, made once and then shared by every chef: the same steps,
 * the same learning moment (if learning is on) and the same start time.
 */
export function cookoffPlan(
  cookoff: Cookoff,
  settings: LearnSettings,
  previous: string | null = null,
): RoundPlan {
  cookoff.plan ??= planRound(cookoff.dish, settings, seededRandom(cookoff.seed), previous);
  return cookoff.plan;
}

/**
 * The random a chef's round is started with (`createState`): the same for
 * every chef, so the dotted lines, stars and floating toppings are the same.
 */
export const roundRandom = (cookoff: Cookoff) => seededRandom(cookoff.seed + 7919);

/**
 * Whether a round has kitchen surprises (chaos/): as the grown-ups set it,
 * but never in two chefs, where a surprise at a random moment would make the
 * two rounds differ. Beat your best (and a normal round, `mode` null) keeps them.
 */
export function surprisesOn(setting: boolean, mode: CookoffMode | null): boolean {
  return setting && mode !== 'duo';
}

/**
 * Keeps the chef's round that just ended. Returns what comes next: the
 * next chef's turn ('pass', and `turn` moves on), or the judges.
 */
export function finishTurn(cookoff: Cookoff, result: CookoffResult): 'pass' | 'judges' {
  cookoff.results[cookoff.turn] = result;
  if (cookoff.turn + 1 < cookoff.chefs.length) {
    cookoff.turn += 1;
    return 'pass';
  }
  return 'judges';
}

// ---------------------------------------------------------------------------
// Her best score on each dish

/** The sticker that keeps her best score on a dish, as its level. */
export const bestSticker = (dishId: string) => `best:${dishId}`;

/** Her best score on a dish, or null if none is saved. */
export function bestOf(stickers: Record<string, number>, dishId: string): number | null {
  const best = stickers[bestSticker(dishId)] as number | undefined;
  return best === undefined ? null : best;
}

/**
 * The dishes a beat-your-best can pick: the ones she has a sticker for, or
 * every dish she can cook if she hasn't cooked any yet.
 */
export function bestDishes(
  stickers: Record<string, number>,
  dishes: readonly Dish[],
  playable: readonly Dish[],
): Dish[] {
  const cooked = dishes.filter((d) => (stickers[d.id] ?? 0) >= 1);
  return cooked.length ? cooked : [...playable];
}

/** What Chef Bunny says to start a beat-your-best. */
export function challengeLines(dish: Dish, best: number | null): [string, string] {
  if (best === null) return [`Let's set your first ${dish.name} record!`, 'Ready, chef?'];
  return [`Your best ${dish.name} is ${best} points.`, 'Can you beat it?'];
}

// ---------------------------------------------------------------------------
// The judges

export interface Judge {
  id: string;
  name: string;
  /** How they lean: a fussy judge a little lower, a hungry one higher. */
  lean: number;
  /** What they say as they taste, for a low (5–6), middle (7–8) and high (9–10) card. */
  lines: [string[], string[], string[]];
}

/** The three judges, left to right. */
export const JUDGES: readonly Judge[] = [
  {
    id: 'duchess',
    name: 'Duchess Purrington',
    lean: -0.4,
    lines: [
      ['Charmant!', 'A little more love!'],
      ['Ooh la la!', 'Très bien!'],
      ['Magnifique!', 'Purr-fection!'],
    ],
  },
  {
    id: 'hugo',
    name: 'Hugo the Hippo',
    lean: 0.6,
    lines: [
      ['Still yummy!', 'I would eat it all!'],
      ['Mmm, crunchy!', 'Munch munch!'],
      ['MORE please!', 'Yum yum YUM!'],
    ],
  },
  {
    id: 'lulu',
    name: 'Lulu the Lobster',
    lean: 0,
    lines: [
      ['Nice and cosy!', 'A pinch of love!'],
      ['More cheese please!', 'Snappy tasty!'],
      ['Clap clap clap!', 'Snappy good!'],
    ],
  },
];

/** The lowest card a judge ever holds up, and the highest. */
export const LOWEST_CARD = 5;
export const HIGHEST_CARD = 10;

/** How much a judge's taste can wobble a card, either way. */
export const TASTE_WOBBLE = 1.5;

/** Card totals this close are a tie: both chefs win. */
export const TIE_MARGIN = 1;

/**
 * The three judges' cards for a round that scored `score` out of `max`:
 * 5 to 10, from 5 for nothing to 10 for everything, each judge leaning their
 * own way and with a little taste wobble rolled with `random`. Never below
 * 5. A better round never gets worse cards for the same rolls.
 */
export function judgeCards(score: number, max: number, random: () => number): number[] {
  const share = max > 0 ? Math.min(1, Math.max(0, score / max)) : 0;
  const base = LOWEST_CARD + (HIGHEST_CARD - LOWEST_CARD) * share;
  return JUDGES.map((judge) => {
    const wobble = (random() * 2 - 1) * TASTE_WOBBLE;
    const card = Math.round(base + judge.lean + wobble);
    return Math.min(HIGHEST_CARD, Math.max(LOWEST_CARD, card));
  });
}

/** Each chef's cards, the same every time for the same cook-off. */
export function cookoffCards(cookoff: Cookoff): number[][] {
  return cookoff.results.map((result, i) =>
    judgeCards(result.score, result.max, seededRandom(cookoff.seed + 104729 * (i + 1))),
  );
}

export const cardTotal = (cards: readonly number[]) => cards.reduce((a, b) => a + b, 0);

/** What a judge says as they taste, for their card. */
export function judgeLine(judge: Judge, card: number, pick: number): string {
  const tier = card >= 9 ? 2 : card >= 7 ? 1 : 0;
  const lines = judge.lines[tier];
  return lines[Math.abs(Math.floor(pick)) % lines.length];
}

/** How a cook-off ends. */
export type Verdict =
  | { kind: 'record'; score: number; best: number | null }
  | { kind: 'close'; score: number; best: number; gap: number }
  | { kind: 'win'; winner: number; totals: number[] }
  | { kind: 'tie'; totals: number[] };

/**
 * The verdict: beat your best compares her points with her best (any score
 * is a record when there was none); two chefs compare the judges' card
 * totals, and totals within TIE_MARGIN are a tie.
 */
export function verdictOf(cookoff: Cookoff): Verdict {
  if (cookoff.mode === 'best') {
    const score = cookoff.results[0]?.score ?? 0;
    const best = cookoff.best;
    if (best === null || score > best) return { kind: 'record', score, best };
    return { kind: 'close', score, best, gap: best - score };
  }
  return duoVerdict(cookoffCards(cookoff).map(cardTotal));
}

/** Two chefs' verdict from their card totals: within TIE_MARGIN is a tie. */
export function duoVerdict(totals: number[]): Verdict {
  const [a, b] = totals;
  if (Math.abs(a - b) <= TIE_MARGIN) return { kind: 'tie', totals };
  return { kind: 'win', winner: a > b ? 0 : 1, totals };
}

/** What Chef Bunny says about the verdict. */
export function verdictLine(cookoff: Cookoff, verdict: Verdict): string {
  switch (verdict.kind) {
    case 'record':
      return verdict.best === null
        ? `Your first ${cookoff.dish.name} record: ${verdict.score} points!`
        : `New record! Your best ${cookoff.dish.name} is now ${verdict.score} points!`;
    case 'close':
      return closeLine(verdict.gap);
    case 'win':
      return `${cookoff.chefs[verdict.winner].name} wins! Hooray!`;
    case 'tie':
      return 'It is a tie! Both chefs win!';
  }
}

/** A kind line when her best stands: "So close! Only 20 points to go!". */
export function closeLine(gap: number): string {
  if (gap <= 0) return 'Just as good as your best! Wow!';
  return `So close! Only ${gap} ${gap === 1 ? 'point' : 'points'} to go!`;
}

/** Coins for trying a cook-off, and for a new record or a win. */
export const TRY_COINS = 10;
export const WIN_COINS = 25;

/**
 * The cook-off's coins: WIN_COINS for a new record, or for two chefs (there's
 * always a winner, or two), else TRY_COINS.
 */
export function cookoffCoins(verdict: Verdict): number {
  return verdict.kind === 'close' ? TRY_COINS : WIN_COINS;
}

/**
 * Gives the cook-off's coins with `earn`, once: returns how many, or null if
 * they were already given.
 */
export function claimCookoffCoins(cookoff: Cookoff, earn: (coins: number) => void): number | null {
  if (cookoff.paid) return null;
  cookoff.paid = true;
  const coins = cookoffCoins(verdictOf(cookoff));
  earn(coins);
  return coins;
}

// ---------------------------------------------------------------------------
// The judging scene's timing

/** Seconds: the drumroll, a chef's dish coming out, each judge, and the total. */
export const JUDGING = {
  drum: 1.8,
  intro: 1,
  taste: 1.3,
  flip: 0.5,
  judge: 2,
  total: 0.9,
} as const;

/** When each part of the judging happens, for `chefs` chefs. */
export function judgingTimes(chefs: number) {
  const each = JUDGING.intro + JUDGES.length * JUDGING.judge + JUDGING.total;
  const start = (chef: number) => JUDGING.drum + chef * each;
  const taste = (chef: number, judge: number) =>
    start(chef) + JUDGING.intro + judge * JUDGING.judge;
  const card = (chef: number, judge: number) => taste(chef, judge) + JUDGING.taste;
  const total = (chef: number) => taste(chef, JUDGES.length - 1) + JUDGING.judge;
  const verdict = start(chefs) + 0.3;
  return { start, taste, card, total, verdict, ready: verdict + 1.6 };
}

/** What's happening at `age` seconds into the judging. */
export interface JudgingMoment {
  /** The chef whose dish is on the table (-1 during the drumroll). */
  chef: number;
  /** The judge tasting now, or -1. */
  tasting: number;
  /** How many of each chef's cards are up. */
  shown: number[];
  /** Whether each chef's total is up. */
  totals: boolean[];
  /** Whether the verdict is shown, and a tap can finish. */
  verdict: boolean;
  ready: boolean;
}

export function judgingMoment(age: number, chefs: number): JudgingMoment {
  const times = judgingTimes(chefs);
  let chef = -1;
  for (let c = 0; c < chefs; c++) if (age >= times.start(c)) chef = c;
  const verdict = age >= times.verdict;
  let tasting = -1;
  if (chef >= 0 && !verdict) {
    JUDGES.forEach((_, j) => {
      if (age >= times.taste(chef, j) && age < times.card(chef, j)) tasting = j;
    });
  }
  const shown = Array.from(
    { length: chefs },
    (_, c) => JUDGES.filter((_, j) => age >= times.card(c, j)).length,
  );
  const totals = Array.from({ length: chefs }, (_, c) => age >= times.total(c));
  return { chef, tasting, shown, totals, verdict, ready: age >= times.ready };
}

/**
 * Where a tap during the judging jumps to: the next judge's card flipping
 * up, or once every card is up, the verdict. Never past the verdict, so a
 * tap can hurry the judges but never skip how it ends.
 */
export function hurryTo(age: number, chefs: number): number {
  const times = judgingTimes(chefs);
  if (age >= times.verdict) return age;
  for (let c = 0; c < chefs; c++) {
    for (let j = 0; j < JUDGES.length; j++) {
      const at = times.card(c, j);
      if (at > age + 0.05) return at;
    }
  }
  return times.verdict;
}

// ---------------------------------------------------------------------------
// Where everything goes

/**
 * The box every cook-off page is laid out in, in canvas units: 800×500 in
 * the middle on a computer or a phone held sideways, 600×900 on a phone held
 * upright. The canvas is always at least that big.
 */
export function cookoffBox(layout: Layout): Box & { tall: boolean } {
  const tall = layout.shape === 'tall';
  const w = tall ? 600 : 800;
  const h = tall ? 900 : 500;
  return {
    x: Math.round((layout.width - w) / 2),
    y: Math.round((layout.height - h) / 2),
    w,
    h,
    tall,
  };
}

const offset = (box: Box, b: Box): Box => ({ x: box.x + b.x, y: box.y + b.y, w: b.w, h: b.h });

/** The cook-off's first page: Beat your best or Two chefs, and ✕. */
export function menuPlaces(layout: Layout) {
  const box = cookoffBox(layout);
  const close = closeButton(layout);
  if (box.tall) {
    return {
      close,
      title: { x: box.x + 270, y: box.y + 160 },
      best: offset(box, { x: 40, y: 240, w: 520, h: 300 }),
      duo: offset(box, { x: 40, y: 570, w: 520, h: 300 }),
    };
  }
  return {
    close,
    title: { x: box.x + 400, y: box.y + 84 },
    best: offset(box, { x: 60, y: 140, w: 330, h: 330 }),
    duo: offset(box, { x: 410, y: 140, w: 330, h: 330 }),
  };
}

/** The page where each player picks an animal chef: a cell per chef, and ✕. */
export function chefPlaces(layout: Layout) {
  const box = cookoffBox(layout);
  const area = box.tall
    ? offset(box, { x: 30, y: 210, w: 540, h: 660 })
    : offset(box, { x: 40, y: 120, w: 720, h: 370 });
  return {
    close: closeButton(layout),
    title: { x: box.x + (box.tall ? 270 : 400), y: box.y + (box.tall ? 150 : 70) },
    ...gridFor(area, CHEFS.length),
  };
}

/**
 * A big card between rounds: Chef Bunny's challenge, a chef's turn, or "Pass
 * it to Player 2!". It waits for a tap anywhere.
 */
export function turnCardPlaces(layout: Layout) {
  const box = cookoffBox(layout);
  if (box.tall) {
    return {
      card: offset(box, { x: 30, y: 60, w: 540, h: 780 }),
      figure: { x: box.x + 300, y: box.y + 470, scale: 1.4 },
      dish: { x: box.x + 300, y: box.y + 170, scale: 0.7 },
      lines: [box.y + 570, box.y + 640, box.y + 700].map((y) => ({ x: box.x + 300, y })),
      width: 500,
      tap: { x: box.x + 300, y: box.y + 790 },
    };
  }
  return {
    card: offset(box, { x: 40, y: 30, w: 720, h: 440 }),
    figure: { x: box.x + 200, y: box.y + 380, scale: 1.2 },
    dish: { x: box.x + 540, y: box.y + 140, scale: 0.6 },
    lines: [box.y + 260, box.y + 320, box.y + 370].map((y) => ({ x: box.x + 540, y })),
    width: 400,
    tap: { x: box.x + 400, y: box.y + 436 },
  };
}

/** The judging scene: the judges behind their table, their cards and the chefs' totals. */
export function judgingPlaces(layout: Layout) {
  const box = cookoffBox(layout);
  const at = (x: number, y: number) => ({ x: box.x + x, y: box.y + y });
  if (box.tall) {
    const judges = [110, 300, 490].map((x) => ({ ...at(x, 560), scale: 0.85 }));
    return {
      box,
      ribbon: offset(box, { x: 60, y: 20, w: 480, h: 70 }),
      pills: [
        offset(box, { x: 16, y: 104, w: 276, h: 84 }),
        offset(box, { x: 308, y: 104, w: 276, h: 84 }),
      ],
      judges,
      cards: judges.map((j) => ({ x: j.x, y: box.y + 330, w: 104, h: 90 })),
      bubble: (judge: number) =>
        offset(box, {
          x: Math.min(330, Math.max(10, judges[judge].x - box.x - 130)),
          y: 205,
          w: 260,
          h: 70,
        }),
      table: offset(box, { x: 10, y: 556, w: 580, h: 46 }),
      dish: { ...at(300, 690), scale: 0.75 },
      banner: offset(box, { x: 30, y: 230, w: 540, h: 110 }),
      coins: offset(box, { x: 230, y: 712, w: 140, h: 48 }),
      podium: [
        { ...at(160, 650), scale: 1 },
        { ...at(440, 650), scale: 1 },
      ],
      trophy: { ...at(300, 560), scale: 1.1 },
      button: offset(box, { x: 150, y: 770, w: 300, h: 100 }),
    };
  }
  const judges = [190, 400, 610].map((x) => ({ ...at(x, 318), scale: 0.85 }));
  return {
    box,
    ribbon: offset(box, { x: 210, y: 10, w: 380, h: 58 }),
    pills: [
      offset(box, { x: 10, y: 10, w: 186, h: 64 }),
      offset(box, { x: 604, y: 10, w: 186, h: 64 }),
    ],
    judges,
    cards: judges.map((j) => ({ x: j.x, y: box.y + 116, w: 88, h: 78 })),
    bubble: (judge: number) =>
      offset(box, {
        x: Math.min(560, Math.max(10, judges[judge].x - box.x - 115)),
        y: 84,
        w: 230,
        h: 64,
      }),
    table: offset(box, { x: 30, y: 314, w: 740, h: 40 }),
    dish: { ...at(400, 410), scale: 0.5 },
    banner: offset(box, { x: 150, y: 120, w: 500, h: 96 }),
    coins: offset(box, { x: 10, y: 430, w: 140, h: 48 }),
    podium: [
      { ...at(220, 420), scale: 0.85 },
      { ...at(490, 420), scale: 0.85 },
    ],
    trophy: { ...at(400, 360), scale: 0.9 },
    button: offset(box, { x: 580, y: 410, w: 210, h: 80 }),
  };
}
