import { describe, expect, it } from 'vitest';
import { BANK } from '../activities/customer-pays';
import { cutQuestion } from '../activities/equal-parts';
import { measureQuestion } from '../activities/measure';
import { trayQuestion } from '../activities/trays';
import { dishById } from '../dishes';
import { createState, move, press, release } from '../game';
import {
  QUIZ_BUBBLE,
  QUIZ_SPEAKER,
  choiceBoxes,
  clockText,
  inCircle,
  middleOf,
  plainPlan,
  quizPlaces,
  type Box,
  type Disc,
  type KitchenState,
  type QuizState,
  type RecipeStep,
} from '../kit';
import type { Shape } from '../layout';
import { cssScale, current, drawRound, keepClear, nextStep, overlaps, seeded } from '../test-kit';
import type { CutOptions } from './cut';
import {
  COINS,
  PAID,
  PAY_CHECK,
  TRAY,
  TRAY_MOST,
  bankSpots,
  payPlaces,
  pileSpots,
  trayCells,
  type CoinId,
  type PayState,
} from './pay';
import { readClockAt } from './read-clock';
import {
  CHECK,
  SET_CLOCK,
  grabHand,
  knobsOf,
  setClockPlaces,
  type SetClockOptions,
  type SetClockState,
} from './set-clock';
import { trayLayout } from './tray';

/**
 * The learning steps with a layout of their own (the clocks, paying, the
 * cut pictures, and the cup and tray pictures) on every canvas shape: clear
 * of the HUD, Chef Bunny and the progress pill, at least about 60 CSS pixels
 * for everything a finger taps on a phone, and a tap hits what's drawn.
 */

const SHAPES: Shape[] = ['page', 'wide', 'tall'];
const PHONES = ['wide', 'tall'] as const;

/** A disc's bounding box. */
const boxOf = (d: Disc): Box => ({ x: d.x - d.r, y: d.y - d.r, w: d.r * 2, h: d.r * 2 });
const inside = (b: Box, outer: Box) =>
  b.x >= outer.x &&
  b.y >= outer.y &&
  b.x + b.w <= outer.x + outer.w &&
  b.y + b.h <= outer.y + outer.h;

/** Expects every box clear of what the shape keeps clear, and of each other. */
function expectClear(shape: Shape, named: Record<string, Box>) {
  const entries = Object.entries(named);
  entries.forEach(([name, b], i) => {
    for (const clear of keepClear(shape))
      expect(overlaps(b, clear), `${shape}: ${name} and ${JSON.stringify(clear)}`).toBe(false);
    for (const [other, c] of entries.slice(i + 1))
      expect(overlaps(b, c), `${shape}: ${name} and ${other}`).toBe(false);
  });
}

/** Soup with `step` first, on it, its card gone. */
function onStep(step: RecipeStep): KitchenState {
  const soup = dishById('soup');
  const dish = { ...soup, steps: [step, ...soup.steps] };
  const state = createState(dish, seeded(), plainPlan(dish));
  nextStep(state);
  return state;
}

describe('read the clock on every shape', () => {
  for (const shape of SHAPES) {
    it(`puts the clock in the quiz's picture, clear of the answers, on ${shape}`, () => {
      const clock = readClockAt(shape);
      const picture = quizPlaces(shape).picture;
      expect(inside(boxOf({ ...clock, r: clock.r * 1.03 }), picture)).toBe(true);
      for (let count = 2; count <= 4; count++)
        for (const b of choiceBoxes(count, 'side', shape))
          expect(overlaps(b, boxOf(clock))).toBe(false);
    });
  }
  it('keeps the computer clock as it was', () => {
    expect(readClockAt('page')).toMatchObject({ x: 372.5, y: 354, r: 100 });
  });
});

describe('the cup and tray pictures on every shape', () => {
  for (const shape of SHAPES) {
    it(`lays the tray out inside the quiz's picture, and taps the answers drawn, on ${shape}`, () => {
      const picture = quizPlaces(shape).picture;
      for (let seed = 1; seed <= 10; seed++) {
        const tray = trayQuestion('cupcake', 2, seeded(seed));
        const { cell, left, top, right } = trayLayout(tray, picture);
        expect(left).toBeGreaterThanOrEqual(picture.x);
        expect(top).toBeGreaterThanOrEqual(picture.y);
        // The running totals' tags go at the right of the rows.
        expect(right + 54).toBeLessThanOrEqual(picture.x + picture.w);
        expect(top + cell * tray.rows).toBeLessThanOrEqual(picture.y + picture.h);
      }
      const { cup } = measureQuestion('milk', 1, seeded());
      const tray = trayQuestion('cookie', 1, seeded());
      for (const step of [cup, tray]) {
        const state = onStep(step);
        drawRound(state, undefined, 1 / 60, shape);
        const q = step.question;
        const at = middleOf(choiceBoxes(q.choices.length, q.layout, shape)[q.answer]);
        press(state, at.x, at.y, shape);
        expect(current<QuizState>(state).picked, `${step.kind} on ${shape}`).toBe(q.answer);
      }
    });
  }
});

describe('the cut pictures on every shape', () => {
  for (const shape of SHAPES) {
    it(`taps the picture drawn on ${shape}`, () => {
      const step: CutOptions = cutQuestion('pizza', 'pizza', 4, 2, seeded());
      const q = step.question;
      expect(q.layout).toBe('row');
      const state = onStep(step);
      drawRound(state, undefined, 1 / 60, shape);
      const boxes = choiceBoxes(q.choices.length, q.layout, shape);
      expectClear(shape, Object.fromEntries(boxes.map((b, i) => [`picture ${i}`, b])));
      const at = middleOf(boxes[q.answer]);
      press(state, at.x, at.y, shape);
      expect(current<QuizState>(state).picked).toBe(q.answer);
    });
  }

  it('makes the pictures big on a phone', () => {
    for (const shape of PHONES) {
      const scale = cssScale(shape);
      for (const b of choiceBoxes(3, 'row', shape)) {
        expect(b.w * scale, shape).toBeGreaterThanOrEqual(85);
        expect(b.h * scale, shape).toBeGreaterThanOrEqual(85);
      }
    }
  });
});

describe('set the clock on every shape', () => {
  const at = (h: number, m: number) => h * 60 + m;

  it('keeps the computer layout as it was', () => {
    expect(setClockPlaces('page')).toEqual({
      bubble: QUIZ_BUBBLE,
      speaker: QUIZ_SPEAKER,
      clock: SET_CLOCK,
      check: CHECK,
    });
  });

  for (const shape of SHAPES) {
    it(`puts the question, the clock and Check! clear of everything on ${shape}`, () => {
      const { bubble, speaker, clock, check } = setClockPlaces(shape);
      // The clock's rim is drawn a little outside its radius.
      expectClear(shape, { bubble, clock: boxOf({ ...clock, r: clock.r * 1.03 }), check });
      expect(inside(boxOf(speaker), bubble), 'the speaker in the bubble').toBe(true);
    });

    it(`drags both hands and checks, where they're drawn, on ${shape}`, () => {
      const target = at(4, 30);
      const step: SetClockOptions = {
        kind: 'set-clock',
        text: `Set the clock to ${clockText(target)}!`,
        target,
        geared: false,
        help: "It's four thirty!",
      };
      const state = onStep(step);
      drawRound(state, undefined, 1 / 60, shape);
      const { clock, check } = setClockPlaces(shape);
      const point = (minute: number, reach: number) => {
        const a = (minute / 60) * Math.PI * 2;
        return {
          x: clock.x + Math.sin(a) * clock.r * reach,
          y: clock.y - Math.cos(a) * clock.r * reach,
        };
      };
      const drag = (reach: number, from: number, to: number) => {
        const start = point(from, reach);
        press(state, start.x, start.y, shape);
        for (let m = from; m <= to; m++) move(state, point(m, reach).x, point(m, reach).y, shape);
        release(state, shape);
      };
      drag(0.74, 0, 30); // the minute hand, from 12 round to 6
      drag(0.45, 0, 22); // the hour hand, from 12 round to half past 4
      expect(clockText(current<SetClockState>(state).time)).toBe('4:30');
      const middle = middleOf(check);
      press(state, middle.x, middle.y, shape);
      expect(current<SetClockState>(state).done).toBe(true);
    });
  }

  it('makes the clock big, and its knobs, Check! and speaker easy to tap, on a phone', () => {
    for (const shape of PHONES) {
      const scale = cssScale(shape);
      const { speaker, clock, check } = setClockPlaces(shape);
      expect(clock.r * 2 * scale, `${shape} clock`).toBeGreaterThanOrEqual(
        shape === 'tall' ? 220 : 175,
      );
      expect(check.w * scale).toBeGreaterThanOrEqual(60);
      expect(check.h * scale).toBeGreaterThanOrEqual(60);
      expect(speaker.r * 2 * scale).toBeGreaterThanOrEqual(60);
      // Anywhere within 30 CSS pixels of a knob grabs its hand.
      const reach = 30 / scale;
      for (const time of [at(3, 0), at(9, 30), at(6, 15), at(1, 45)]) {
        const knobs = knobsOf(clock, time);
        for (const hand of ['hour', 'minute'] as const) {
          const knob = knobs[hand];
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2;
            for (const d of [0, reach / 2, reach]) {
              const x = knob.x + Math.cos(a) * d;
              const y = knob.y + Math.sin(a) * d;
              expect(grabHand(time, x, y, clock), `${shape} ${clockText(time)} ${hand}`).toBe(hand);
            }
          }
        }
      }
    }
  });
});

describe('paying on every shape', () => {
  const banks: CoinId[][] = [BANK[1], BANK[2], ['quarter', 'dime', 'nickel', 'penny']];

  it('keeps the computer layout as it was', () => {
    const places = payPlaces('page');
    expect(places).toMatchObject({
      bubble: QUIZ_BUBBLE,
      speaker: QUIZ_SPEAKER,
      tray: TRAY,
      paid: PAID,
      check: PAY_CHECK,
    });
    const spots = bankSpots(['quarter', 'dime', 'nickel', 'penny']);
    expect(spots.map((s) => [s.x, s.y, s.r])).toEqual([
      [274.375, 414, 43],
      [393.125, 414, 32],
      [511.875, 414, 38],
      [630.625, 414, 35],
    ]);
    expect(spots.map((s) => s.reach)).toEqual([51, 44, 46, 44]);
  });

  for (const shape of SHAPES) {
    it(`puts the tray, the bank, the total and Check! clear of everything on ${shape}`, () => {
      const { bubble, speaker, tray, paid, check } = payPlaces(shape);
      expect(inside(boxOf(speaker), bubble), 'the speaker in the bubble').toBe(true);
      for (const coins of banks) {
        const bank = Object.fromEntries(
          bankSpots(coins, shape).map((c) => [`the ${c.id}`, boxOf(c)]),
        );
        expectClear(shape, { bubble, tray, paid, check, ...bank });
      }
      for (const coins of banks) {
        const cells = trayCells(coins, shape);
        cells.forEach((cell, i) => {
          expect(inside(cell, tray), `tray cell ${i}`).toBe(true);
          cells.slice(i + 1).forEach((other) => expect(overlaps(cell, other)).toBe(false));
          // A full pile stays in its cell.
          for (const at of pileSpots(cell, TRAY_MOST))
            expect(inside(boxOf(at), { ...cell, x: cell.x - 2, w: cell.w + 4 })).toBe(true);
        });
      }
    });

    it(`taps coins in and out, and Check!, where they're drawn, on ${shape}`, () => {
      const coins: CoinId[] = ['quarter', 'dime', 'nickel', 'penny'];
      const state = onStep({ kind: 'pay', price: 50, coins, text: "That's 50¢!" });
      drawRound(state, undefined, 1 / 60, shape);
      const pay = () => current<PayState>(state);
      for (const spot of bankSpots(coins, shape)) {
        // A tap just inside its reach still counts.
        press(state, spot.x + spot.reach - 1, spot.y, shape);
      }
      expect(pay().tray).toEqual(coins);
      const back = middleOf(trayCells(coins, shape)[1]);
      press(state, back.x, back.y, shape);
      expect(pay().tray).toEqual(['quarter', 'nickel', 'penny']);
      const { speaker, check } = payPlaces(shape);
      press(state, speaker.x, speaker.y, shape);
      expect(pay().reads).toBe(1);
      const middle = middleOf(check);
      press(state, middle.x, middle.y, shape);
      expect(pay().wrong).toBe(1);
      expect(pay().short).toBe(50 - 31);
      expect(inCircle(speaker.x, speaker.y, speaker.r, middle.x, middle.y)).toBe(false);
    });
  }

  it('makes coins, Check! and the speaker easy to tap, and the tray readable, on a phone', () => {
    for (const shape of PHONES) {
      const scale = cssScale(shape);
      const { speaker, check } = payPlaces(shape);
      for (const id of Object.keys(COINS) as CoinId[]) {
        const [spot] = bankSpots([id], shape);
        expect(spot.reach * 2 * scale, `${shape} ${id}`).toBeGreaterThanOrEqual(60);
      }
      expect(check.w * scale).toBeGreaterThanOrEqual(60);
      expect(check.h * scale).toBeGreaterThanOrEqual(60);
      expect(speaker.r * 2 * scale).toBeGreaterThanOrEqual(60);
      // Giving a coin back: a tap anywhere on its kind's cell, at least 60 CSS pixels.
      for (const coins of banks) {
        for (const cell of trayCells(coins, shape)) {
          expect(cell.w * scale, `${shape} tray cell`).toBeGreaterThanOrEqual(60);
          expect(cell.h * scale, `${shape} tray cell`).toBeGreaterThanOrEqual(60);
        }
      }
      expect(pileSpots(trayCells(banks[1], shape)[0], 1)[0].r * 2 * scale).toBeGreaterThanOrEqual(
        34,
      );
    }
  });
});
