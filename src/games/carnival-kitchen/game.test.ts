import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from './dishes';
import {
  createState,
  currentKind,
  liveScore,
  maxScore,
  pickDish,
  press,
  ratingFor,
  release,
  starsFor,
  stickerFor,
  stickerNews,
  tick,
  totalScore,
} from './game';
import { artOf, ingredient } from './ingredients';
import {
  CIRCLE_TURNS,
  COMBO_BONUS,
  FEEDBACK_TIME,
  POUR_SPEED,
  accuracy,
  circleTurns,
  findStep,
  gradeFor,
  listOf,
  type CircleState,
  type Dish,
  type HoldState,
  type KitchenState,
} from './kit';
import { BAKE_SPEED, BAKE_TARGET } from './steps/bake';
import type { ChopState } from './steps/chop';
import type { CrackState } from './steps/crack';
import type { FlipState } from './steps/flip';
import type { TopState } from './steps/top';
import { hintOf, iconOf, stepOf, titleOf } from './steps';
import {
  circleTurnsOf,
  current,
  drawRound,
  fakeCanvas,
  nextStep,
  playThrough,
  pourPerfectly,
  ready,
  seeded,
} from './test-kit';

const pizza = dishById('pizza');
const pancakes = dishById('pancakes');
const soup = dishById('soup');

function chopPerfectly(state: KitchenState) {
  const chop = current<ChopState>(state);
  for (const mark of chop.marks) {
    chop.knifeX = mark;
    press(state, 0, 0);
  }
}

describe('carnival kitchen', () => {
  describe('dishes', () => {
    it('finds one dish per file in dishes/', () => {
      const files = readdirSync(join(import.meta.dirname, 'dishes'))
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
        .map((f) => f.slice(0, -3));
      expect(DISHES.map((d) => d.id).sort()).toEqual(files.sort());
    });

    it('gives every dish a name and some steps', () => {
      for (const dish of DISHES) {
        expect(dish.name.trim(), dish.id).not.toBe('');
        expect(dish.steps.length, dish.id).toBeGreaterThan(0);
      }
    });

    it('only uses steps the kitchen knows, with ingredients that can play their part', () => {
      for (const dish of DISHES) {
        for (const options of dish.steps) {
          const where = `${dish.id}: ${options.kind}`;
          const step = stepOf(options.kind);
          for (const [id, role] of step.uses(options)) {
            expect(() => ingredient(id), where).not.toThrow();
            expect(() => artOf(id, role), `${where}: ${id} as ${role}`).not.toThrow();
          }
        }
      }
    });

    it('titles, hints and icons every step', () => {
      for (const dish of DISHES) {
        const state = createState(dish, seeded());
        for (const run of state.steps) {
          expect(titleOf(run).trim(), dish.id).not.toBe('');
          expect(hintOf(run)).toHaveLength(2);
          expect(iconOf(run).trim(), dish.id).not.toBe('');
        }
      }
    });

    it('makes pizza, pancakes and soup step by step, with the same cards as ever', () => {
      const cards = (dish: Dish) =>
        createState(dish, seeded()).steps.map((run) => [titleOf(run), iconOf(run)]);
      expect(cards(pizza)).toEqual([
        ['Chop the pepperoni!', '🔪'],
        ['Spread the sauce!', '🍅'],
        ['Add the toppings!', '🍄'],
        ['Bake the pizza!', '🔥'],
      ]);
      expect(cards(pancakes)).toEqual([
        ['Crack the eggs!', '🥚'],
        ['Add flour and milk!', '🥛'],
        ['Mix the batter!', '🥣'],
        ['Flip the pancakes!', '🥞'],
      ]);
      expect(cards(soup)).toEqual([
        ['Chop the carrot!', '🥕'],
        ['Stir the soup!', '🥄'],
        ['Shake the salt!', '🧂'],
      ]);
      const hints = (dish: Dish) => createState(dish, seeded()).steps.map(hintOf);
      expect(hints(soup)).toEqual([
        ['Tap when the knife', 'is on a dotted line!'],
        ['Hold and draw', 'circles in the pot!'],
        ['Hold to shake,', 'let go at the star!'],
      ]);
      expect(hints(pancakes)[2]).toEqual(['Hold and draw', 'circles in the bowl!']);
      expect(hints(pizza)[1]).toEqual(['Hold and draw', 'circles on the pizza!']);
    });

    it('finds the latest step of a kind cooked so far, not a later repeat', () => {
      const dish: Dish = {
        id: 'repeat',
        name: 'Repeat',
        steps: [
          { kind: 'crack', item: 'egg' },
          { kind: 'pour', pours: ['milk'] },
          { kind: 'crack', item: 'egg' },
        ],
        draw() {},
      };
      const state = createState(dish, seeded());
      state.stepIndex = 1;
      expect(findStep(state, 'crack')).toBe(state.steps[0]);
      state.stepIndex = 2;
      expect(findStep(state, 'crack')).toBe(state.steps[2]);
      expect(findStep(state, 'bake')).toBeUndefined();
    });

    it('picks dishes at random, never the same one twice in a row', () => {
      const random = seeded(7);
      const seen = new Set<string>();
      let previous = pickDish(random);
      for (let i = 0; i < 400; i++) {
        const next = pickDish(random, previous);
        expect(next.id).not.toBe(previous.id);
        seen.add(next.id);
        previous = next;
      }
      // Every dish but the surprise, which waits for a full recipe book.
      const open = DISHES.filter((d) => !d.locked);
      expect(open.length).toBeLessThan(DISHES.length);
      expect([...seen].sort()).toEqual(open.map((d) => d.id).sort());
      const all = new Set<string>();
      for (let i = 0; i < 400; i++) all.add(pickDish(random, undefined, DISHES).id);
      expect([...all].sort()).toEqual(DISHES.map((d) => d.id).sort());
    });

    it('starts on the first step with no score, waiting for the card', () => {
      const state = createState(soup, seeded());
      expect(currentKind(state)).toBe('chop');
      expect(totalScore(state)).toBe(0);
      expect(state.phase).toBe('playing');
      const knife = current<ChopState>(state).knifeX;
      expect(press(state, 0, 0)).toBe(true);
      expect(current<ChopState>(state).cut.some(Boolean)).toBe(false);
      tick(state, 0.5);
      expect(current<ChopState>(state).knifeX).toBe(knife);
    });

    it('can be cooked to the end, whatever its steps', () => {
      for (const dish of DISHES) {
        const state = createState(dish, seeded());
        playThrough(state);
        expect(state.phase, dish.id).toBe('over');
        expect(totalScore(state), dish.id).toBeGreaterThan(0);
      }
    });

    it('draws every step of every dish, and the finished dish', () => {
      for (const dish of DISHES) {
        for (const shape of ['page', 'tall'] as const) {
          const state = createState(dish, seeded());
          const memory = new Map();
          drawRound(state, memory, 1 / 60, shape);
          playThrough(state, (dt) => drawRound(state, memory, dt, shape));
          // Effects that outlast the last step, under the end card.
          for (let i = 0; i < 40; i++) drawRound(state, memory, 0.05, shape);
          dish.draw(fakeCanvas(), 1.5, state);
        }
        dish.draw(fakeCanvas(), 1.5, null);
      }
    });
  });

  describe('scoring helpers', () => {
    it('falls off linearly between perfect and miss', () => {
      expect(accuracy(0, 4, 30)).toBe(1);
      expect(accuracy(4, 4, 30)).toBe(1);
      expect(accuracy(17, 4, 30)).toBeCloseTo(0.5);
      expect(accuracy(30, 4, 30)).toBe(0);
    });

    it('only ever grades kindly', () => {
      expect(gradeFor(1)).toBe('Perfect!');
      expect(gradeFor(0.9)).toBe('Perfect!');
      expect(gradeFor(0.7)).toBe('Great!');
      expect(gradeFor(0.2)).toBe('Good!');
      expect(gradeFor(0)).toBe('Nice try!');
    });

    it('judges the score against what the dish could score, with at least one star', () => {
      expect(maxScore(createState(soup))).toBe(300);
      expect(maxScore(createState(pizza))).toBe(400);
      expect(ratingFor(300, 300)).toBe('You are a Master Chef!');
      expect(ratingFor(240, 400)).toBe('Super yummy!');
      expect(ratingFor(100, 300)).toBe('Yummy!');
      expect(ratingFor(0, 300)).toBe('Good cooking!');
      expect(starsFor(0, 400)).toBe(1);
      expect(starsFor(200, 400)).toBe(2);
      expect(starsFor(340, 400)).toBe(3);
    });

    it('lists words the way you would say them', () => {
      expect(listOf(['flour'])).toBe('flour');
      expect(listOf(['flour', 'milk'])).toBe('flour and milk');
      expect(listOf(['flour', 'sugar', 'milk'])).toBe('flour, sugar and milk');
    });
  });

  describe('combos', () => {
    it('adds a bonus for each perfect action after the first in a row', () => {
      const state = ready(soup);
      chopPerfectly(state);
      const chops = state.steps[0].state as ChopState;
      expect(state.combo).toBe(chops.marks.length);
      expect(state.bonus).toBe(COMBO_BONUS * (chops.marks.length - 1));
      expect(totalScore(state)).toBe(100 + state.bonus);
    });

    it('breaks the streak on anything short of perfect', () => {
      const state = ready(soup);
      const chop = current<ChopState>(state);
      chop.knifeX = chop.marks[0];
      press(state, 0, 0);
      chop.knifeX = chop.marks[1] + 25;
      press(state, 0, 0);
      expect(state.combo).toBe(0);
      chop.knifeX = chop.marks[2];
      press(state, 0, 0);
      expect(state.combo).toBe(1);
      expect(state.bonus).toBe(0);
    });

    it('carries a streak across steps, and stirring leaves it alone', () => {
      const state = ready(soup);
      chopPerfectly(state);
      const chops = (state.steps[0].state as ChopState).marks.length;
      nextStep(state);
      circleTurnsOf(state, CIRCLE_TURNS);
      expect(state.combo).toBe(chops);
      nextStep(state);
      press(state, 0, 0);
      tick(state, current<HoldState>(state).targets[0] / POUR_SPEED);
      release(state);
      expect(state.combo).toBe(chops + 1);
    });
  });

  it('counts points in the live score as soon as they are earned', () => {
    const state = ready(soup);
    const chop = current<ChopState>(state);
    chop.knifeX = chop.marks[0];
    press(state, 0, 0);
    expect(totalScore(state)).toBe(0);
    expect(liveScore(state)).toBe(Math.round(100 / chop.marks.length));
  });

  it('fades the feedback popup', () => {
    const state = ready(soup);
    const chop = current<ChopState>(state);
    chop.knifeX = chop.marks[0];
    press(state, 0, 0);
    expect(state.feedback?.grade).toBe('Perfect!');
    tick(state, FEEDBACK_TIME);
    expect(state.feedback).toBeNull();
  });

  it('gives each step a fresh start, so a dish can use a kind of step twice', () => {
    const twice: Dish = {
      ...soup,
      id: 'twice',
      steps: [
        ...soup.steps,
        { kind: 'stir', vessel: 'pot', contents: 'soup' },
        { kind: 'season', shaker: 'salt', food: 'soup', shakes: 2 },
      ],
    };
    const state = ready(twice);
    chopPerfectly(state);
    nextStep(state);
    circleTurnsOf(state, CIRCLE_TURNS);
    nextStep(state);
    pourPerfectly(state);
    nextStep(state);
    expect(currentKind(state)).toBe('stir');
    expect(circleTurns(current<CircleState>(state))).toBe(0);
    circleTurnsOf(state, CIRCLE_TURNS);
    nextStep(state);
    expect(current<HoldState>(state).index).toBe(0);
    expect(current<HoldState>(state).targets).toHaveLength(2);
    pourPerfectly(state);
    expect(state.phase).toBe('over');
    expect(state.scores).toEqual([100, 100, 100, 100, 100]);
  });

  it('lets a recipe give a step its own title, hint and icon', () => {
    const state = createState({
      ...soup,
      steps: [
        {
          kind: 'season',
          shaker: 'salt',
          food: 'soup',
          title: 'Shake the pepper!',
          hint: ['Hold to grind,', 'let go at the star!'],
          icon: '🌶️',
        },
      ],
    });
    const run = state.steps[0];
    expect(titleOf(run)).toBe('Shake the pepper!');
    expect(hintOf(run)).toEqual(['Hold to grind,', 'let go at the star!']);
    expect(iconOf(run)).toBe('🌶️');
  });

  describe('stickers', () => {
    it("earns the dish's sticker at the round's stars", () => {
      const state = ready(soup);
      chopPerfectly(state);
      nextStep(state);
      circleTurnsOf(state, CIRCLE_TURNS);
      nextStep(state);
      pourPerfectly(state);
      expect(stickerFor(state)).toEqual({ id: 'soup', level: 3 });
      state.scores = [0, 0, 100];
      expect(stickerFor(state)).toEqual({ id: 'soup', level: 1 });
    });

    it('says whether the sticker is new, better, or nothing new', () => {
      expect(stickerNews(undefined, true)).toBe('new');
      expect(stickerNews(1, true)).toBe('better');
      expect(stickerNews(3, false)).toBeNull();
    });
  });

  describe('whole rounds through press', () => {
    it('makes soup', () => {
      const state = ready(soup);
      chopPerfectly(state);
      nextStep(state);
      circleTurnsOf(state, CIRCLE_TURNS);
      nextStep(state);
      pourPerfectly(state);
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100]);
    });

    it('makes pancakes', () => {
      const state = ready(pancakes);
      const eggs = current<CrackState>(state);
      for (let i = 0; i < eggs.speeds.length; i++) {
        eggs.x = 400;
        press(state, 0, 0);
      }
      nextStep(state);
      pourPerfectly(state);
      nextStep(state);
      circleTurnsOf(state, CIRCLE_TURNS);
      nextStep(state);
      const pan = current<FlipState>(state);
      for (const go of pan.goes) {
        pan.needle = go.target;
        press(state, 0, 0);
      }
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100, 100]);
    });

    it('makes pizza', () => {
      const state = ready(pizza);
      chopPerfectly(state);
      nextStep(state);
      circleTurnsOf(state, CIRCLE_TURNS);
      nextStep(state);
      const top = current<TopState>(state);
      for (const spot of top.spots) {
        top.x = spot.x;
        expect(press(state, 0, 0)).toBe(true);
      }
      nextStep(state);
      press(state, 0, 0);
      tick(state, BAKE_TARGET / BAKE_SPEED);
      release(state);
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100, 100]);
      expect(liveScore(state)).toBe(totalScore(state));
    });
  });
});
