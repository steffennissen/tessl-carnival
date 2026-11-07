import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from './dishes';
import {
  BAKE_EARLY,
  BAKE_SPEED,
  BAKE_TARGET,
  BANNER_TIME,
  BOWL_X,
  CHOP_FIRST,
  CHOP_LAST,
  CHOP_MISS,
  CHOP_PERFECT,
  COMBO_BONUS,
  CRACK_MISS,
  EGG_END,
  EGG_START,
  EGG_SPEEDS,
  FEEDBACK_TIME,
  FLIP_HIGH,
  FLIP_LOW,
  KNIFE_MAX,
  KNIFE_MIN,
  PIZZA_VIEW,
  POT,
  POUR_SPEED,
  SPOT_REACH,
  STIR_REACH,
  STIR_TIME,
  STIR_TURNS,
  TARGET_HIGH,
  TARGET_LOW,
  TOPPING_COUNT,
  TOPPING_END,
  TOPPING_MISS,
  TOPPING_START,
  accuracy,
  addTopping,
  chop,
  crack,
  createState,
  currentStage,
  flip,
  gradeFor,
  liveScore,
  makePlan,
  maxScore,
  pickDish,
  press,
  ratingFor,
  release,
  startBake,
  startPour,
  starsFor,
  step,
  stir,
  stirTurns,
  totalScore,
  type KitchenState,
  type Stage,
} from './game';

const pizza = dishById('pizza');
const pancakes = dishById('pancakes');
const soup = dishById('soup');

/** A seeded random, so a test's round is the same every run. */
function seeded(seed = 1): () => number {
  let s = seed;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  // Small seeds start with tiny numbers, so skip a few first.
  for (let i = 0; i < 5; i++) next();
  return next;
}

/** A round of `dish` with its banner finished, on the given step. */
function ready(dish = soup, stage?: Stage): KitchenState {
  const state = createState(dish, seeded());
  if (stage) state.stageIndex = state.recipe.indexOf(stage);
  step(state, BANNER_TIME);
  return state;
}

function chopPerfectly(state: KitchenState) {
  for (const mark of state.plan.marks) {
    state.chop.knifeX = mark;
    chop(state);
  }
}

/**
 * Drags the spoon round the pot in small steps, `turns` times. The last step
 * goes a hair past, so rounding never leaves the stir just short.
 */
function stirTurnsOf(state: KitchenState, turns: number, radius = 80) {
  const steps = turns * 36;
  for (let i = 0; i <= steps; i++) {
    const a = (i / 36) * Math.PI * 2 + (i === steps ? 0.001 : 0);
    stir(state, POT.x + Math.cos(a) * radius, POT.y + Math.sin(a) * radius);
  }
}

/** Holds and lets go exactly at each star of a salt or pour step. */
function pourPerfectly(state: KitchenState) {
  for (const pinch of state.plan.pinches) {
    press(state, 0, 0);
    step(state, pinch / POUR_SPEED);
    release(state);
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

    it('gives every dish a name, some steps, and what each step needs', () => {
      for (const dish of DISHES) {
        expect(dish.name.trim(), dish.id).not.toBe('');
        expect(dish.steps.length, dish.id).toBeGreaterThan(0);
        if (dish.steps.includes('season') || dish.steps.includes('pour')) {
          expect(dish.pours, dish.id).toBeGreaterThan(0);
        }
      }
    });

    it('makes pizza, pancakes and soup step by step', () => {
      expect(pizza.steps).toEqual(['chop', 'sauce', 'top', 'bake']);
      expect(pizza.chop).toBe('pepperoni');
      expect(pancakes.steps).toEqual(['crack', 'pour', 'mix', 'flip']);
      expect(soup.steps).toEqual(['chop', 'stir', 'season']);
    });

    it('picks dishes at random, never the same one twice in a row', () => {
      const random = seeded(7);
      const seen = new Set<string>();
      let previous = pickDish(random);
      for (let i = 0; i < 60; i++) {
        const next = pickDish(random, previous);
        expect(next.id).not.toBe(previous.id);
        seen.add(next.id);
        previous = next;
      }
      expect([...seen].sort()).toEqual(DISHES.map((d) => d.id).sort());
    });

    it('starts on the first step with no score, waiting for the banner', () => {
      const state = createState(soup, seeded());
      expect(currentStage(state)).toBe('chop');
      expect(totalScore(state)).toBe(0);
      expect(state.phase).toBe('playing');
      expect(chop(state)).toBeNull();
    });
  });

  describe('every round is different', () => {
    it('rolls 4 or 5 chop lines, spread along the board', () => {
      const counts = new Set<number>();
      for (let seed = 1; seed < 30; seed++) {
        const { marks } = makePlan(soup, seeded(seed));
        counts.add(marks.length);
        expect(marks[0]).toBeGreaterThan(CHOP_FIRST - 20);
        expect(marks[marks.length - 1]).toBeLessThan(CHOP_LAST + 20);
        for (let i = 1; i < marks.length; i++) {
          // Far enough apart to see, and to aim at, separately.
          expect(marks[i] - marks[i - 1]).toBeGreaterThanOrEqual(40);
        }
      }
      expect([...counts].sort()).toEqual([4, 5]);
    });

    it('puts the stars for salt, flour and milk somewhere new', () => {
      const a = makePlan(soup, seeded(1)).pinches;
      const b = makePlan(soup, seeded(2)).pinches;
      expect(a).toHaveLength(soup.pours);
      expect(a).not.toEqual(b);
      for (const p of [...a, ...b]) {
        expect(p).toBeGreaterThanOrEqual(TARGET_LOW);
        expect(p).toBeLessThanOrEqual(TARGET_HIGH);
      }
      expect(makePlan(pancakes, seeded(1)).pinches).toHaveLength(pancakes.pours);
    });

    it('moves the golden zone for each pancake', () => {
      const { flips } = makePlan(pancakes, seeded(3));
      for (const f of flips) {
        expect(f.target).toBeGreaterThanOrEqual(FLIP_LOW);
        expect(f.target).toBeLessThanOrEqual(FLIP_HIGH);
      }
    });

    it('picks the pepperoni and four other toppings, each on its own spot on the pizza', () => {
      const kinds = new Set<string>();
      for (let seed = 1; seed < 20; seed++) {
        const { toppings } = makePlan(pizza, seeded(seed));
        expect(toppings).toHaveLength(TOPPING_COUNT);
        expect(toppings.map((t) => t.kind)).toContain('pepperoni');
        expect(new Set(toppings.map((t) => t.kind)).size).toBe(TOPPING_COUNT);
        for (const t of toppings) {
          kinds.add(t.kind);
          const nx = (t.x - PIZZA_VIEW.x) / PIZZA_VIEW.rx;
          const ny = (t.y - PIZZA_VIEW.y) / PIZZA_VIEW.ry;
          expect(Math.hypot(nx, ny)).toBeLessThanOrEqual(SPOT_REACH + 0.02);
        }
      }
      expect(kinds.size).toBe(6);
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
  });

  describe('chop', () => {
    it('scores 100 for perfect chops on every line and moves on', () => {
      const state = ready(soup);
      chopPerfectly(state);
      expect(state.scores[0]).toBe(100);
      expect(currentStage(state)).toBe('stir');
      expect(state.banner).toBe(BANNER_TIME);
    });

    it('forgives a chop that is a little off', () => {
      const state = ready(soup);
      state.chop.knifeX = state.plan.marks[0] + CHOP_PERFECT;
      expect(chop(state)).toBe(100 / state.plan.marks.length);
    });

    it('cuts the nearest uncut line, and scores less the further off it is', () => {
      const state = ready(soup);
      state.chop.knifeX = state.plan.marks[2] + 30;
      const points = chop(state) ?? 0;
      expect(state.chop.cut[2]).toBe(true);
      expect(state.chop.cut.filter(Boolean)).toHaveLength(1);
      expect(points).toBeGreaterThan(0);
      expect(points).toBeLessThan(100 / state.plan.marks.length);
    });

    it('scores nothing from the miss distance', () => {
      const state = ready(soup);
      const last = state.plan.marks.length - 1;
      state.chop.cut = state.plan.marks.map((_, i) => i !== last);
      state.chop.knifeX = state.plan.marks[last] - CHOP_MISS;
      expect(chop(state)).toBe(0);
      expect(state.feedback?.grade).toBe('Nice try!');
    });

    it('glides the knife back and forth', () => {
      const state = ready(soup);
      step(state, 0.05);
      expect(state.chop.knifeX).toBeGreaterThan(KNIFE_MIN);
      state.chop.knifeX = KNIFE_MAX - 1;
      step(state, 0.05);
      expect(state.chop.dir).toBe(-1);
      expect(state.chop.knifeX).toBeLessThanOrEqual(KNIFE_MAX);
    });
  });

  describe('crack', () => {
    it('scores when the egg is over the bowl', () => {
      const state = ready(pancakes);
      state.crack.eggX = BOWL_X;
      expect(crack(state)).toBeCloseTo(100 / EGG_SPEEDS.length);
      expect(state.crack.index).toBe(1);
      expect(state.crack.results).toEqual([1]);
    });

    it('brings an egg that floats past back round', () => {
      const state = ready(pancakes);
      state.crack.eggX = EGG_END - 1;
      step(state, 0.05);
      expect(state.crack.eggX).toBe(EGG_START);
      expect(state.crack.index).toBe(0);
    });

    it('ignores a tap far from the bowl, so no egg is wasted', () => {
      const state = ready(pancakes);
      state.crack.eggX = BOWL_X - CRACK_MISS;
      expect(crack(state)).toBeNull();
      expect(press(state, 0, 0)).toBe(false);
      expect(state.crack.index).toBe(0);
      expect(state.feedback).toBeNull();
    });

    it('scores something for any egg that lands in the bowl', () => {
      const state = ready(pancakes);
      state.crack.eggX = BOWL_X + CRACK_MISS - 1;
      expect(crack(state)).toBeGreaterThan(0);
    });
  });

  describe('circles: stirring, sauce and batter', () => {
    it('counts turns in either direction', () => {
      const state = ready(soup, 'stir');
      stirTurnsOf(state, 2);
      expect(state.stir.radians).toBeCloseTo(Math.PI * 4);
    });

    it('counts a spoon a little outside the pot', () => {
      const state = ready(soup, 'stir');
      stirTurnsOf(state, 1, POT.radius + STIR_REACH - 5);
      expect(stirTurns(state)).toBeCloseTo(1);
    });

    it('scores 100 for finishing instantly and moves on', () => {
      const state = ready(soup, 'stir');
      stirTurnsOf(state, STIR_TURNS);
      expect(state.scores[1]).toBe(100);
      expect(currentStage(state)).toBe('season');
    });

    it('scores up to 50 for the turns made when time runs out', () => {
      const state = ready(soup, 'stir');
      stirTurnsOf(state, 2);
      release(state);
      for (let t = 0; t < STIR_TIME; t += 0.05) step(state, 0.05);
      step(state, 0.05);
      expect(state.scores[1]).toBe(Math.round(50 * (2 / STIR_TURNS)));
      expect(currentStage(state)).toBe('season');
    });

    it('starts a fresh stroke after the spoon is lifted', () => {
      const state = ready(soup, 'stir');
      stir(state, POT.x + 80, POT.y);
      release(state);
      stir(state, POT.x - 80, POT.y);
      expect(state.stir.radians).toBe(0);
    });

    it('spreads the sauce and mixes the batter the same way', () => {
      for (const [dish, stage] of [
        [pizza, 'sauce'],
        [pancakes, 'mix'],
      ] as const) {
        const state = ready(dish, stage);
        stirTurnsOf(state, STIR_TURNS);
        expect(state.scores[dish.steps.indexOf(stage)], stage).toBe(100);
      }
    });
  });

  describe('hold and let go: salt, flour and milk', () => {
    it('scores when you let go at the star', () => {
      const state = ready(soup, 'season');
      startPour(state);
      step(state, state.plan.pinches[0] / POUR_SPEED);
      expect(release(state)).toBeCloseTo(100 / state.plan.pinches.length);
      expect(state.season.index).toBe(1);
    });

    it('overflows to nothing if you never let go', () => {
      const state = ready(soup, 'season');
      startPour(state);
      for (let i = 0; i < 100; i++) step(state, 0.05);
      expect(state.season.index).toBe(1);
      expect(state.season.points).toBe(0);
    });

    it('ignores a release that poured nothing', () => {
      const state = ready(soup, 'season');
      expect(release(state)).toBeNull();
    });

    it('does not use up a shake on a quick tap', () => {
      const state = ready(soup, 'season');
      startPour(state);
      step(state, 0.05);
      expect(release(state)).toBe('not yet');
      expect(state.season.index).toBe(0);
      expect(state.season.level).toBe(0);
      expect(state.feedback).toBeNull();
    });

    it('pours flour then milk into the pancake bowl', () => {
      const state = ready(pancakes, 'pour');
      pourPerfectly(state);
      expect(state.scores[1]).toBe(100);
      expect(currentStage(state)).toBe('mix');
    });
  });

  describe('flip', () => {
    it('scores in full on the target', () => {
      const state = ready(pancakes, 'flip');
      state.flip.needle = state.plan.flips[0].target;
      expect(flip(state)).toBeCloseTo(100 / state.plan.flips.length);
      expect(state.flip.results).toEqual([1]);
    });

    it('ignores a tap far from the gold, so no pancake is wasted', () => {
      const state = ready(pancakes, 'flip');
      state.flip.needle = state.plan.flips[0].target > 0.5 ? 0 : 1;
      expect(flip(state)).toBeNull();
      expect(state.flip.index).toBe(0);
    });

    it('ends the round after the last pancake', () => {
      const state = ready(pancakes, 'flip');
      for (const f of state.plan.flips) {
        state.flip.needle = f.target;
        flip(state);
      }
      expect(state.phase).toBe('over');
      expect(state.scores[3]).toBe(100);
      expect(flip(state)).toBeNull();
    });
  });

  describe('toppings', () => {
    it('scores a topping dropped on its spot', () => {
      const state = ready(pizza, 'top');
      state.top.x = state.plan.toppings[0].x;
      expect(addTopping(state)).toBeCloseTo(100 / TOPPING_COUNT);
      expect(state.top.results).toEqual([1]);
      expect(state.top.x).toBe(TOPPING_START);
    });

    it('ignores a tap far from the spot, so no topping is wasted', () => {
      const state = ready(pizza, 'top');
      state.top.x = state.plan.toppings[0].x + TOPPING_MISS;
      expect(addTopping(state)).toBeNull();
      expect(press(state, 0, 0)).toBe(false);
      expect(state.top.index).toBe(0);
    });

    it('brings a topping that floats past back round', () => {
      const state = ready(pizza, 'top');
      state.top.x = TOPPING_END - 1;
      step(state, 0.05);
      expect(state.top.x).toBe(TOPPING_START);
    });
  });

  describe('bake', () => {
    it('scores a pizza taken out when it is golden', () => {
      const state = ready(pizza, 'bake');
      startBake(state);
      step(state, BAKE_TARGET / BAKE_SPEED);
      expect(release(state)).toBeCloseTo(100);
      expect(state.bake.done).toBe(true);
      expect(state.phase).toBe('over');
    });

    it('keeps a pale pizza in the oven: "not yet", and the heat stays', () => {
      const state = ready(pizza, 'bake');
      startBake(state);
      step(state, (BAKE_TARGET - BAKE_EARLY - 0.1) / BAKE_SPEED);
      const level = state.bake.level;
      expect(release(state)).toBe('not yet');
      expect(state.bake.level).toBe(level);
      expect(state.phase).toBe('playing');
      startBake(state);
      step(state, (BAKE_TARGET - level) / BAKE_SPEED);
      expect(release(state)).toBeCloseTo(100);
    });

    it('takes a forgotten pizza out by itself, still worth something', () => {
      const state = ready(pizza, 'bake');
      startBake(state);
      for (let i = 0; i < 200; i++) step(state, 0.05);
      expect(state.bake.done).toBe(true);
      expect(state.bake.level).toBe(1);
      expect(state.scores[3]).toBeGreaterThan(0);
      expect(state.phase).toBe('over');
    });
  });

  describe('combos', () => {
    it('adds a bonus for each perfect action after the first in a row', () => {
      const state = ready(soup);
      chopPerfectly(state);
      const chops = state.plan.marks.length;
      expect(state.combo).toBe(chops);
      expect(state.bonus).toBe(COMBO_BONUS * (chops - 1));
      expect(totalScore(state)).toBe(100 + state.bonus);
    });

    it('breaks the streak on anything short of perfect', () => {
      const state = ready(soup);
      const marks = state.plan.marks;
      state.chop.knifeX = marks[0];
      chop(state);
      state.chop.knifeX = marks[1] + 25;
      chop(state);
      expect(state.combo).toBe(0);
      state.chop.knifeX = marks[2];
      chop(state);
      expect(state.combo).toBe(1);
      expect(state.bonus).toBe(0);
    });

    it('carries a streak across steps, and stirring leaves it alone', () => {
      const state = ready(soup);
      chopPerfectly(state);
      const chops = state.plan.marks.length;
      step(state, BANNER_TIME);
      stirTurnsOf(state, STIR_TURNS);
      expect(state.combo).toBe(chops);
      step(state, BANNER_TIME);
      startPour(state);
      step(state, state.plan.pinches[0] / POUR_SPEED);
      release(state);
      expect(state.combo).toBe(chops + 1);
    });
  });

  it('counts points in the live score as soon as they are earned', () => {
    const state = ready(soup);
    state.chop.knifeX = state.plan.marks[0];
    chop(state);
    expect(totalScore(state)).toBe(0);
    expect(liveScore(state)).toBe(Math.round(100 / state.plan.marks.length));
  });

  it('fades the feedback popup', () => {
    const state = ready(soup);
    state.chop.knifeX = state.plan.marks[0];
    chop(state);
    expect(state.feedback?.grade).toBe('Perfect!');
    step(state, FEEDBACK_TIME);
    expect(state.feedback).toBeNull();
  });

  describe('whole rounds through press', () => {
    it('makes soup', () => {
      const state = ready(soup);
      chopPerfectly(state);
      step(state, BANNER_TIME);
      stirTurnsOf(state, STIR_TURNS);
      step(state, BANNER_TIME);
      pourPerfectly(state);
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100]);
    });

    it('makes pancakes', () => {
      const state = ready(pancakes);
      for (let i = 0; i < EGG_SPEEDS.length; i++) {
        state.crack.eggX = BOWL_X;
        press(state, 0, 0);
      }
      step(state, BANNER_TIME);
      pourPerfectly(state);
      step(state, BANNER_TIME);
      stirTurnsOf(state, STIR_TURNS);
      step(state, BANNER_TIME);
      for (const f of state.plan.flips) {
        state.flip.needle = f.target;
        press(state, 0, 0);
      }
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100, 100]);
    });

    it('makes pizza', () => {
      const state = ready(pizza);
      chopPerfectly(state);
      step(state, BANNER_TIME);
      stirTurnsOf(state, STIR_TURNS);
      step(state, BANNER_TIME);
      for (const spot of state.plan.toppings) {
        state.top.x = spot.x;
        expect(press(state, 0, 0)).toBe(true);
      }
      step(state, BANNER_TIME);
      press(state, 0, 0);
      step(state, BAKE_TARGET / BAKE_SPEED);
      release(state);
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100, 100]);
      expect(liveScore(state)).toBe(totalScore(state));
    });
  });
});
