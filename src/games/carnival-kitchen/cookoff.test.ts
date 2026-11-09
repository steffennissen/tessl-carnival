import { describe, expect, it, vi } from 'vitest';
import { earnSticker, stickersFor } from '../../carnival';
import { type Box, closeButton } from './book';
import {
  CHEFS,
  HIGHEST_CARD,
  JUDGES,
  LOWEST_CARD,
  TIE_MARGIN,
  TRY_COINS,
  WIN_COINS,
  YOU,
  bestDishes,
  bestOf,
  bestSticker,
  cardTotal,
  challengeLines,
  chefPlaces,
  claimCookoffCoins,
  closeLine,
  cookoffCards,
  cookoffPlan,
  createCookoff,
  duoVerdict,
  finishTurn,
  judgeCards,
  judgeLine,
  judgingMoment,
  judgingPlaces,
  judgingTimes,
  hurryTo,
  surprisesOn,
  menuPlaces,
  roundRandom,
  seededRandom,
  turnCardPlaces,
  verdictLine,
  verdictOf,
  type Cookoff,
} from './cookoff';
import {
  type JudgingView,
  drawChefPicker,
  drawCookoffButton,
  drawJudging,
  drawMenu,
  drawTurnCard,
  verdictBanner,
} from './cookoff-draw';
import { createDecor } from './decorate';
import { DISHES, dishById } from './dishes';
import { createState, maxScore, totalScore } from './game';
import { DEFAULT_SETTINGS } from './kit';
import { layoutFor, type Layout } from './layout';
import { titlePlaces } from './shop';
import { cssScale, fakeCanvas, playThrough } from './test-kit';

const pizza = dishById('pizza');

const LAYOUTS: Record<string, Layout> = {
  page: layoutFor(1280, 800, false),
  wide: layoutFor(844, 390, true),
  tall: layoutFor(390, 844, true),
  'short tall': layoutFor(360, 640, true),
  'small tall': layoutFor(600, 900, true),
  'wide tablet': layoutFor(1024, 768, true),
};

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w - 1e-6 &&
  b.x < a.x + a.w - 1e-6 &&
  a.y < b.y + b.h - 1e-6 &&
  b.y < a.y + a.h - 1e-6;
const inside = (b: Box, layout: Layout) =>
  b.x >= 0 && b.y >= 0 && b.x + b.w <= layout.width && b.y + b.h <= layout.height;
const round = (c: { x: number; y: number; r: number }): Box => ({
  x: c.x - c.r,
  y: c.y - c.r,
  w: 2 * c.r,
  h: 2 * c.r,
});

/** A duo cook-off with both chefs' rounds done. */
function duo(scores: [number, number], seed = 42): Cookoff {
  const c = createCookoff('duo', pizza, seed, [CHEFS[0], CHEFS[1]]);
  finishTurn(c, { score: scores[0], max: 400 });
  finishTurn(c, { score: scores[1], max: 400 });
  return c;
}

describe('her best score on each dish', () => {
  it('is kept as a best:<dish> sticker whose level is the best score', () => {
    expect(bestSticker('pizza')).toBe('best:pizza');
    const game = 'cookoff-test';
    earnSticker(game, bestSticker('pizza'), 320);
    earnSticker(game, bestSticker('pizza'), 280);
    expect(bestOf(stickersFor(game), 'pizza')).toBe(320);
    earnSticker(game, bestSticker('pizza'), 380);
    expect(bestOf(stickersFor(game), 'pizza')).toBe(380);
    expect(bestOf(stickersFor(game), 'soup')).toBeNull();
  });

  it('picks from the dishes she has cooked, or any she can cook if none', () => {
    const cooked = bestDishes({ pizza: 2, soup: 1, 'best:tacos': 300 }, DISHES, DISHES);
    expect(cooked.map((d) => d.id).sort()).toEqual(['pizza', 'soup']);
    expect(bestDishes({}, DISHES, DISHES.slice(0, 3))).toEqual(DISHES.slice(0, 3));
  });

  it('has Chef Bunny challenge her with her best, or her first record', () => {
    expect(challengeLines(pizza, 380)).toEqual([
      'Your best Pizza is 380 points.',
      'Can you beat it?',
    ]);
    expect(challengeLines(pizza, null)[0]).toBe("Let's set your first Pizza record!");
  });
});

describe('two chefs', () => {
  it('cook in turn, then the judges come', () => {
    const c = createCookoff('duo', pizza, 7, [CHEFS[0], CHEFS[2]]);
    expect(c.turn).toBe(0);
    expect(finishTurn(c, { score: 300, max: 400 })).toBe('pass');
    expect(c.turn).toBe(1);
    expect(finishTurn(c, { score: 250, max: 400 })).toBe('judges');
    expect(c.results).toEqual([
      { score: 300, max: 400 },
      { score: 250, max: 400 },
    ]);
  });

  it('beat your best has one chef: straight to the judges', () => {
    const c = createCookoff('best', pizza, 7, [YOU], 200);
    expect(finishTurn(c, { score: 300, max: 400 })).toBe('judges');
  });

  for (const learning of [false, true]) {
    it(`gives both chefs the very same round, learning ${learning ? 'on' : 'off'}`, () => {
      const settings = { ...DEFAULT_SETTINGS, learning };
      for (const dish of DISHES) {
        const c = createCookoff('duo', dish, 1234, [CHEFS[0], CHEFS[1]]);
        const plan = cookoffPlan(c, settings);
        expect(cookoffPlan(c, settings, 'clock-time')).toBe(plan);
        const first = createState(dish, roundRandom(c), plan);
        const second = createState(dish, roundRandom(c), cookoffPlan(c, settings));
        expect(second.steps).toEqual(first.steps);
        expect(second.start).toBe(first.start);
        expect(second.learn.activity).toBe(first.learn.activity);
      }
    });
  }

  it('has no kitchen surprises, so the rounds stay the same; beat your best keeps them', () => {
    expect(surprisesOn(true, 'duo')).toBe(false);
    expect(surprisesOn(true, 'best')).toBe(true);
    expect(surprisesOn(true, null)).toBe(true);
    expect(surprisesOn(false, 'best')).toBe(false);
  });

  it('plans a learning moment when learning is on, the same for both', () => {
    const c = createCookoff('duo', pizza, 99, [CHEFS[0], CHEFS[1]]);
    const plan = cookoffPlan(c, { ...DEFAULT_SETTINGS, learning: true });
    expect(plan.activity).toBeTruthy();
  });
});

describe('the judges', () => {
  it('are three, each with kind lines for every card', () => {
    expect(JUDGES).toHaveLength(3);
    for (const judge of JUDGES) {
      for (let card = LOWEST_CARD; card <= HIGHEST_CARD; card++) {
        expect(judgeLine(judge, card, 3).length).toBeGreaterThan(0);
      }
    }
  });

  it('hold up cards from 5 to 10, never below 5', () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const share of [0, 0.1, 0.33, 0.5, 0.8, 1, 1.3]) {
        const cards = judgeCards(share * 400, 400, seededRandom(seed));
        expect(cards).toHaveLength(3);
        for (const card of cards) {
          expect(Number.isInteger(card)).toBe(true);
          expect(card).toBeGreaterThanOrEqual(LOWEST_CARD);
          expect(card).toBeLessThanOrEqual(HIGHEST_CARD);
        }
      }
    }
  });

  it('give better cards for better cooking, with the same taste rolls', () => {
    for (let seed = 1; seed < 100; seed++) {
      let last = [0, 0, 0];
      for (let score = 0; score <= 400; score += 20) {
        const cards = judgeCards(score, 400, seededRandom(seed));
        cards.forEach((card, i) => expect(card).toBeGreaterThanOrEqual(last[i]));
        last = cards;
      }
    }
    // On average, a great round gets a lot more than a shaky one.
    const average = (score: number) => {
      let sum = 0;
      for (let seed = 1; seed <= 100; seed++)
        sum += cardTotal(judgeCards(score, 400, seededRandom(seed)));
      return sum / 100;
    };
    expect(average(400)).toBeGreaterThan(average(100) + 8);
  });

  it('give the same cards every time for the same cook-off', () => {
    const a = cookoffCards(duo([300, 200]));
    const b = cookoffCards(duo([300, 200]));
    expect(a).toEqual(b);
  });
});

describe('the verdict', () => {
  const best = (score: number, previous: number | null) => {
    const c = createCookoff('best', pizza, 5, [YOU], previous);
    finishTurn(c, { score, max: 400 });
    return c;
  };

  it('is a new record when she beats her best, or sets her first', () => {
    expect(verdictOf(best(400, 380))).toEqual({ kind: 'record', score: 400, best: 380 });
    expect(verdictOf(best(120, null))).toEqual({ kind: 'record', score: 120, best: null });
    expect(verdictLine(best(400, 380), verdictOf(best(400, 380)))).toBe(
      'New record! Your best Pizza is now 400 points!',
    );
  });

  it('is a kind "So close!" otherwise, with how many points to go', () => {
    expect(verdictOf(best(360, 380))).toEqual({ kind: 'close', score: 360, best: 380, gap: 20 });
    expect(closeLine(20)).toBe('So close! Only 20 points to go!');
    expect(closeLine(1)).toBe('So close! Only 1 point to go!');
    expect(closeLine(0)).toBe('Just as good as your best! Wow!');
    expect(verdictOf(best(380, 380))).toMatchObject({ kind: 'close', gap: 0 });
  });

  it('for two chefs, goes by the card totals: a win, or a tie when they are close', () => {
    expect(duoVerdict([25, 20])).toEqual({ kind: 'win', winner: 0, totals: [25, 20] });
    expect(duoVerdict([18, 27])).toEqual({ kind: 'win', winner: 1, totals: [18, 27] });
    expect(duoVerdict([22, 22])).toEqual({ kind: 'tie', totals: [22, 22] });
    expect(duoVerdict([22, 22 + TIE_MARGIN]).kind).toBe('tie');
    expect(duoVerdict([22, 23 + TIE_MARGIN]).kind).toBe('win');
    const c = duo([400, 0]);
    expect(verdictOf(c)).toMatchObject({ kind: 'win', winner: 0 });
    expect(verdictLine(c, verdictOf(c))).toBe('Chef Fox wins! Hooray!');
    expect(verdictLine(c, { kind: 'tie', totals: [20, 20] })).toBe('It is a tie! Both chefs win!');
  });

  it('lets a young chef win sometimes against a better grown-up', () => {
    // A grown-up a little better (340 to 300 of 400): over many cook-offs the
    // young chef wins or ties a fair share.
    let wins = 0;
    let ties = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const v = verdictOf(duo([300, 340], seed));
      if (v.kind === 'tie') ties += 1;
      if (v.kind === 'win' && v.winner === 0) wins += 1;
    }
    expect(wins).toBeGreaterThan(20);
    expect(ties).toBeGreaterThan(80);
    // A big difference still goes to the better cook.
    expect(verdictOf(duo([100, 380]))).toMatchObject({ kind: 'win', winner: 1 });
  });
});

describe('coins', () => {
  it('gives 25 for a record or two chefs, 10 for trying, once per cook-off', () => {
    const earn = vi.fn();
    const record = createCookoff('best', pizza, 3, [YOU], 100);
    finishTurn(record, { score: 300, max: 400 });
    expect(claimCookoffCoins(record, earn)).toBe(WIN_COINS);
    expect(claimCookoffCoins(record, earn)).toBeNull();
    expect(earn).toHaveBeenCalledTimes(1);
    expect(earn).toHaveBeenCalledWith(WIN_COINS);

    const close = createCookoff('best', pizza, 3, [YOU], 390);
    finishTurn(close, { score: 300, max: 400 });
    expect(claimCookoffCoins(close, earn)).toBe(TRY_COINS);
    expect(claimCookoffCoins(duo([100, 300]), earn)).toBe(WIN_COINS);
    expect(earn).toHaveBeenCalledTimes(3);
  });
});

describe('the judging scene', () => {
  it('goes drumroll, each chef with each judge tasting then a card, then the verdict', () => {
    for (const chefs of [1, 2]) {
      const times = judgingTimes(chefs);
      expect(judgingMoment(0.5, chefs)).toMatchObject({ chef: -1, tasting: -1, verdict: false });
      for (let c = 0; c < chefs; c++) {
        JUDGES.forEach((_, j) => {
          const tasting = judgingMoment(times.taste(c, j) + 0.1, chefs);
          expect(tasting.chef).toBe(c);
          expect(tasting.tasting).toBe(j);
          expect(tasting.shown[c]).toBe(j);
          const shown = judgingMoment(times.card(c, j) + 0.1, chefs);
          expect(shown.tasting).toBe(-1);
          expect(shown.shown[c]).toBe(j + 1);
        });
        expect(judgingMoment(times.total(c) + 0.01, chefs).totals[c]).toBe(true);
      }
      const end = judgingMoment(times.verdict + 0.01, chefs);
      expect(end.verdict).toBe(true);
      expect(end.ready).toBe(false);
      expect(judgingMoment(times.ready, chefs).ready).toBe(true);
      expect(times.ready).toBeLessThan(25);
    }
  });
});

describe('a tap during the judging', () => {
  it('hurries on to the next card, then the verdict, never past it', () => {
    for (const chefs of [1, 2]) {
      const times = judgingTimes(chefs);
      expect(hurryTo(0, chefs)).toBe(times.card(0, 0));
      expect(hurryTo(times.card(0, 0), chefs)).toBe(times.card(0, 1));
      expect(hurryTo(times.card(chefs - 1, 2), chefs)).toBe(times.verdict);
      expect(hurryTo(times.verdict + 0.5, chefs)).toBe(times.verdict + 0.5);
      let age = 0;
      for (let tap = 0; tap < 20; tap++) {
        const next = hurryTo(age, chefs);
        expect(next).toBeGreaterThanOrEqual(age);
        expect(next).toBeLessThanOrEqual(Math.max(age, times.verdict));
        age = next;
      }
      expect(age).toBe(times.verdict);
    }
  });
});

describe('places', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    describe(name, () => {
      it('fits the menu and the chefs on the page, apart from ✕', () => {
        const m = menuPlaces(layout);
        const close = round(m.close);
        for (const b of [m.best, m.duo]) {
          expect(inside(b, layout)).toBe(true);
          expect(overlaps(b, close)).toBe(false);
        }
        expect(overlaps(m.best, m.duo)).toBe(false);
        const c = chefPlaces(layout);
        expect(c.cells).toHaveLength(CHEFS.length);
        for (const b of c.cells) {
          expect(inside(b, layout)).toBe(true);
          expect(overlaps(b, round(closeButton(layout)))).toBe(false);
        }
      });

      it('fits the card between rounds and the judging scene on the canvas', () => {
        const t = turnCardPlaces(layout);
        expect(inside(t.card, layout)).toBe(true);
        const j = judgingPlaces(layout);
        for (const b of [
          j.ribbon,
          ...j.pills,
          j.table,
          j.banner,
          j.button,
          j.bubble(0),
          j.bubble(2),
        ])
          expect(inside(b, layout)).toBe(true);
        expect(overlaps(j.pills[0], j.pills[1])).toBe(false);
        // The coins sit clear of the judges, the verdict, the chefs and the button.
        expect(inside(j.coins, layout)).toBe(true);
        const judges = j.judges.map((p) => ({
          x: p.x - 50 * p.scale,
          y: p.y - 195 * p.scale,
          w: 100 * p.scale,
          h: 195 * p.scale,
        }));
        const chefs = j.podium.map((p) => ({
          x: p.x - 60,
          y: p.y - 195 * p.scale,
          w: 120,
          h: 195 * p.scale + 56,
        }));
        for (const o of [...judges, ...chefs, j.banner, j.button, ...j.pills])
          expect(overlaps(j.coins, o)).toBe(false);
        for (const p of j.pills) expect(overlaps(p, j.ribbon)).toBe(false);
        for (const c of j.cards) {
          const card = { x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: c.h };
          expect(overlaps(card, j.ribbon)).toBe(false);
          for (const p of j.pills) expect(overlaps(card, p)).toBe(false);
        }
      });
    });
  }

  for (const shape of ['wide', 'tall'] as const) {
    it(`makes everything a finger taps at least 60 CSS pixels, ${shape}`, () => {
      const layout = LAYOUTS[shape];
      const scale = cssScale(shape);
      const m = menuPlaces(layout);
      const c = chefPlaces(layout);
      const j = judgingPlaces(layout);
      for (const b of [m.best, m.duo, ...c.cells, j.button, titlePlaces(layout).cookoff]) {
        expect(b.w * scale).toBeGreaterThanOrEqual(60);
        expect(b.h * scale).toBeGreaterThanOrEqual(60);
      }
      for (const r of [m.close.r, c.close.r]) expect(r * 2 * scale).toBeGreaterThanOrEqual(60);
    });
  }
});

describe('drawing', () => {
  /** A finished round of `dish`, decorated, as the judges' table shows it. */
  function plate(dish = pizza) {
    const state = createState(dish, seededRandom(3));
    playThrough(state);
    const decor = createDecor();
    decor.placed.push({ kind: 'cherry', x: 10, y: -20, rot: 0 });
    return { state, decor, score: Math.round(totalScore(state)), max: maxScore(state) };
  }

  function views(): JudgingView[] {
    const a = plate();
    const b = plate();
    const make = (c: Cookoff, plates: (typeof a)[]): JudgingView => ({
      cookoff: c,
      plates,
      cards: cookoffCards(c),
      verdict: verdictOf(c),
      coins: 25,
      picks: c.results.map(() => [0, 1, 2]),
    });
    const record = createCookoff('best', pizza, 11, [YOU], null);
    finishTurn(record, { score: a.score, max: a.max });
    const close = createCookoff('best', pizza, 11, [YOU], 9999);
    finishTurn(close, { score: a.score, max: a.max });
    const pair = createCookoff('duo', pizza, 11, [CHEFS[3], CHEFS[5]]);
    finishTurn(pair, { score: a.score, max: a.max });
    finishTurn(pair, { score: b.score, max: b.max });
    const tie = { ...make(pair, [a, b]), verdict: { kind: 'tie' as const, totals: [20, 20] } };
    return [make(record, [a]), make(close, [a]), make(pair, [a, b]), tie];
  }

  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`draws every cook-off page without a NaN, ${name}`, () => {
      const g = fakeCanvas();
      drawCookoffButton(g, titlePlaces(layout).cookoff, 1.2);
      drawMenu(g, layout, 1.2);
      drawChefPicker(g, layout, 0, [], 1.2);
      drawChefPicker(g, layout, 1, [2], 1.2);
      const c = createCookoff('duo', pizza, 1, [CHEFS[0], CHEFS[1]]);
      const best = createCookoff('best', pizza, 1, [YOU], 300);
      for (const age of [0, 0.2, 1, 3]) {
        drawTurnCard(
          g,
          layout,
          'turn',
          c,
          ['Player 1: Chef Fox!', 'You cook first!'],
          1,
          age,
          age > 1,
        );
        drawTurnCard(g, layout, 'pass', c, ['Pass it!', 'Go!'], 1, age, age > 1);
        drawTurnCard(g, layout, 'challenge', best, challengeLines(pizza, 300), 1, age, age > 1);
      }
      for (const view of views()) {
        const end = judgingTimes(view.cookoff.chefs.length).ready + 1;
        for (let age = 0; age <= end; age += 0.13) drawJudging(g, layout, view, age, age);
      }
    });
  }

  it('says what the verdict is on its banner', () => {
    const [record, close, pair, tie] = views();
    expect(verdictBanner(record)[0]).toBe('🏆 First record! 🏆');
    expect(verdictBanner(close)[0]).toBe('💖 So close! 💖');
    expect(verdictBanner(pair)[0]).toMatch(/Chef (Penguin|Pig) wins!|Both win/);
    expect(verdictBanner(tie)[0]).toBe('🎉 Both win! 🎉');
  });
});
