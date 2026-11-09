import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, press, tick } from '../game';
import {
  QUIZ_OUTRO,
  SMART_BONUS,
  currentTurn,
  middleOf,
  plainPlan,
  type KitchenState,
} from '../kit';
import { current, drawRound, nextStep, playThrough, seeded } from '../test-kit';
import pay, {
  PAY_CHECK,
  TRAY_MOST,
  bankSpots,
  coinTotal,
  countOn,
  fewestCoins,
  paidText,
  trayCells,
  valuesShown,
  type CoinId,
  type PayOptions,
  type PayState,
} from './pay';

const BANK: CoinId[] = ['quarter', 'dime', 'nickel', 'penny'];

/** Soup, then "That's 45¢", on the paying. */
function onPay(price = 45, coins: CoinId[] = BANK): KitchenState {
  const soup = dishById('soup');
  const step: PayOptions = { kind: 'pay', price, coins, text: `That's ${price}¢!` };
  const dish = { ...soup, steps: [...soup.steps, step] };
  const state = createState(dish, seeded(), plainPlan(dish));
  state.stepIndex = dish.steps.length - 1;
  nextStep(state);
  return state;
}
const tapCoin = (state: KitchenState, id: CoinId) => {
  const spot = bankSpots(current<PayState>(state) && options(state).coins).find((c) => c.id === id);
  if (!spot) throw new Error(`No ${id} in the bank`);
  return press(state, spot.x, spot.y);
};
const options = (state: KitchenState) => state.steps[state.stepIndex].options as PayOptions;
const check = (state: KitchenState) =>
  press(state, PAY_CHECK.x + PAY_CHECK.w / 2, PAY_CHECK.y + PAY_CHECK.h / 2);

describe('the customer pays', () => {
  it('counts coins and finds the fewest that make a price', () => {
    expect(coinTotal(['quarter', 'dime', 'penny'])).toBe(36);
    expect(fewestCoins(68, BANK)).toEqual([
      'quarter',
      'quarter',
      'dime',
      'nickel',
      'penny',
      'penny',
      'penny',
    ]);
    expect(fewestCoins(45, ['dime', 'nickel', 'penny'])).toEqual([
      'dime',
      'dime',
      'dime',
      'dime',
      'nickel',
    ]);
    expect(countOn(['quarter', 'dime'])).toBe(
      "Let's count on: quarter, 25. dime, 35. That's 35 cents!",
    );
  });

  it('takes the coins tapped, and checks itself when they make the price', () => {
    const state = onPay(45);
    const s = current<PayState>(state);
    tapCoin(state, 'quarter');
    tapCoin(state, 'dime');
    tapCoin(state, 'nickel');
    expect(s.tray).toEqual(['quarter', 'dime', 'nickel']);
    expect(s.done).toBe(false);
    tapCoin(state, 'nickel');
    expect(s.done).toBe(true);
    expect(s.outcome).toBe('right');
    expect(state.bonus).toBe(SMART_BONUS);
    tick(state, QUIZ_OUTRO);
    // The last step: the round is over, ready for decorating.
    expect(state.phase).toBe('over');
  });

  it('says "too much" gently, and a coin tapped in the tray goes back', () => {
    const state = onPay(30);
    const s = current<PayState>(state);
    tapCoin(state, 'quarter');
    tapCoin(state, 'dime');
    expect(coinTotal(s.tray)).toBe(35);
    const ctx = { round: state, options: options(state), state: s };
    expect(pay.bubble?.(ctx)).toEqual(['Oops, too much!', 'Tap a coin to give it back.']);
    expect(s.wrong).toBe(0);
    const dime = middleOf(trayCells(BANK)[1]);
    press(state, dime.x, dime.y);
    expect(s.tray).toEqual(['quarter']);
    tapCoin(state, 'nickel');
    expect(s.done).toBe(true);
  });

  it('hints how much more on a short Check!, and lays out the coins after two', () => {
    const state = onPay(42, ['dime', 'nickel', 'penny']);
    const s = current<PayState>(state);
    check(state); // an empty tray isn't a try
    expect(s.wrong).toBe(0);
    tapCoin(state, 'dime');
    check(state);
    expect(s.wrong).toBe(1);
    expect(pay.bubble?.({ round: state, options: options(state), state: s })).toEqual([
      'We need 32¢ more!',
      'Tap more coins.',
    ]);
    check(state);
    expect(s.shown).toBe(true);
    expect(s.tray).toEqual(['dime', 'dime', 'dime', 'dime', 'penny', 'penny']);
    expect(s.done).toBe(false);
    tapCoin(state, 'penny'); // the coins stay put now
    expect(coinTotal(s.tray)).toBe(42);
    check(state);
    expect(s.outcome).toBe('helped');
    expect(state.bonus).toBe(0);
  });

  it(`holds at most ${TRAY_MOST} coins`, () => {
    const state = onPay(99);
    for (let i = 0; i < TRAY_MOST; i++) tapCoin(state, 'penny');
    // Not "Not yet!": Chef Bunny says the tray is full.
    expect(tapCoin(state, 'penny')).toBe(true);
    expect(current<PayState>(state).tray).toHaveLength(TRAY_MOST);
    expect(current<PayState>(state).full).toBe(1);
    expect(pay.bubble?.(currentTurn(state) as never)).toEqual([
      'The tray is full!',
      'Try bigger coins.',
    ]);
  });

  it('finishes when giving a coin back makes it exactly right', () => {
    const state = onPay(30);
    tapCoin(state, 'quarter');
    tapCoin(state, 'dime'); // 35¢: too much
    const s = current<PayState>(state);
    expect(s.done).toBe(false);
    tapCoin(state, 'nickel'); // 40¢
    const dime = middleOf(trayCells(BANK)[1]);
    press(state, dime.x, dime.y); // the dime back: 30¢, exactly right
    expect(coinTotal(s.tray)).toBe(30);
    expect(s.done).toBe(true);
    expect(s.outcome).toBe('right');
  });

  it('shows coin values from the start at Level 1, at Level 2 only after a wrong check', () => {
    const state = onPay(45);
    const s = current<PayState>(state);
    expect(valuesShown(options(state), s)).toBe(true);
    const level2 = { ...options(state), values: false };
    expect(valuesShown(level2, s)).toBe(false);
    s.wrong = 1;
    expect(valuesShown(level2, s)).toBe(true);
  });

  it('keeps the cents paid a secret at Level 2 until a wrong check, counting coins instead', () => {
    const state = onPay(45);
    const s = current<PayState>(state);
    const level2 = { ...options(state), values: false };
    tapCoin(state, 'quarter');
    expect(paidText(options(state), s)).toEqual(['Paid', '25¢']);
    expect(paidText(level2, s)).toEqual(['Coins', '1']);
    tapCoin(state, 'dime');
    expect(paidText(level2, s)).toEqual(['Coins', '2']);
    s.wrong = 1;
    expect(paidText(level2, s)).toEqual(['Paid', '35¢']);
  });

  it('plays through and draws in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = onPay(67);
      const memory = new Map();
      tapCoin(state, 'quarter');
      tapCoin(state, 'quarter');
      tapCoin(state, 'quarter');
      for (let i = 0; i < 30; i++) drawRound(state, memory, 1 / 60, shape);
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      expect(state.phase).toBe('over');
    }
  });
});
