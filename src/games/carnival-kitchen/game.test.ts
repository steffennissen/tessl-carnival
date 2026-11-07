import { describe, expect, it } from 'vitest';
import {
  ALL_STAGES,
  BAKE_EARLY,
  BAKE_SPEED,
  BAKE_TARGET,
  BANNER_TIME,
  BOWL_X,
  CHOP_MARKS,
  CHOP_MISS,
  CHOP_PERFECT,
  COMBO_BONUS,
  CRACK_MISS,
  EGG_END,
  EGG_START,
  EGG_SPEEDS,
  FEEDBACK_TIME,
  FLIPS,
  KNIFE_MAX,
  KNIFE_MIN,
  PINCHES,
  PIZZA_STAGES,
  POT,
  POUR_SPEED,
  RECIPE_LENGTH,
  STIR_REACH,
  STIR_TIME,
  STIR_TURNS,
  TOPPINGS,
  TOPPING_END,
  TOPPING_MISS,
  TOPPING_START,
  accuracy,
  addTopping,
  chop,
  crack,
  createState,
  currentStage,
  dishFor,
  flip,
  gradeFor,
  liveScore,
  pickRecipe,
  press,
  ratingFor,
  recipeFor,
  release,
  starsFor,
  startBake,
  startPour,
  step,
  stir,
  stirTurns,
  totalScore,
  type KitchenState,
  type Stage,
} from './game';

/** A state whose banner has finished, ready for input. */
function ready(recipe: Stage[]): KitchenState {
  const state = createState(recipe);
  step(state, BANNER_TIME);
  return state;
}

function chopPerfectly(state: KitchenState) {
  for (const mark of CHOP_MARKS) {
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

describe('carnival kitchen', () => {
  describe('recipes', () => {
    it('picks three different stages in kitchen order', () => {
      for (const seed of [0, 0.2, 0.5, 0.99]) {
        const recipe = pickRecipe(() => seed);
        expect(recipe).toHaveLength(RECIPE_LENGTH);
        expect(new Set(recipe).size).toBe(RECIPE_LENGTH);
        const order = recipe.map((s) => (ALL_STAGES as readonly Stage[]).indexOf(s));
        expect(order).toEqual([...order].sort((a, b) => a - b));
      }
    });

    it('can pick every stage', () => {
      const seen = new Set<Stage>();
      for (let i = 0; i < 50; i++) pickRecipe(() => (i * 0.137) % 1).forEach((s) => seen.add(s));
      expect([...seen].sort()).toEqual([...ALL_STAGES].sort());
    });

    it('names the dish after the last stage', () => {
      expect(dishFor(['chop', 'crack', 'flip'])).toBe('pancakes');
      expect(dishFor(['chop', 'stir', 'season'])).toBe('stew');
      expect(dishFor(['chop', 'crack', 'stir'])).toBe('soup');
    });

    it('starts on the first stage with no score, waiting for the banner', () => {
      const state = createState(['chop', 'stir', 'flip']);
      expect(currentStage(state)).toBe('chop');
      expect(totalScore(state)).toBe(0);
      expect(state.phase).toBe('playing');
      expect(chop(state)).toBeNull();
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

    it('always has something nice to say, and at least one star', () => {
      expect(ratingFor(300)).toBe('You are a Master Chef!');
      expect(ratingFor(180)).toBe('Super yummy!');
      expect(ratingFor(100)).toBe('Yummy!');
      expect(ratingFor(0)).toBe('Good cooking!');
      expect(starsFor(0)).toBe(1);
      expect(starsFor(150)).toBe(2);
      expect(starsFor(250)).toBe(3);
    });
  });

  describe('chop', () => {
    it('scores 100 for five perfect chops and moves to the next stage', () => {
      const state = ready(['chop', 'stir', 'flip']);
      chopPerfectly(state);
      expect(state.scores[0]).toBe(100);
      expect(currentStage(state)).toBe('stir');
      expect(state.banner).toBe(BANNER_TIME);
    });

    it('forgives a chop that is a little off', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.chop.knifeX = CHOP_MARKS[0] + CHOP_PERFECT;
      expect(chop(state)).toBe(100 / CHOP_MARKS.length);
    });

    it('cuts the nearest uncut mark, and scores less the further off it is', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.chop.knifeX = CHOP_MARKS[2] + 30;
      const points = chop(state) ?? 0;
      expect(state.chop.cut).toEqual([false, false, true, false, false]);
      expect(points).toBeGreaterThan(0);
      expect(points).toBeLessThan(100 / CHOP_MARKS.length);
    });

    it('scores nothing from the miss distance', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.chop.cut = [true, true, true, true, false];
      state.chop.knifeX = CHOP_MARKS[4] - CHOP_MISS;
      expect(chop(state)).toBe(0);
      expect(state.feedback?.grade).toBe('Nice try!');
    });

    it('glides the knife back and forth', () => {
      const state = ready(['chop', 'stir', 'flip']);
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
      const state = ready(['crack', 'stir', 'flip']);
      state.crack.eggX = BOWL_X;
      expect(crack(state)).toBeCloseTo(100 / EGG_SPEEDS.length);
      expect(state.crack.index).toBe(1);
      expect(state.crack.results).toEqual([1]);
    });

    it('brings an egg that floats past back round', () => {
      const state = ready(['crack', 'stir', 'flip']);
      state.crack.eggX = EGG_END - 1;
      step(state, 0.05);
      expect(state.crack.eggX).toBe(EGG_START);
      expect(state.crack.index).toBe(0);
    });

    it('ignores a tap far from the bowl, so no egg is wasted', () => {
      const state = ready(['crack', 'stir', 'flip']);
      state.crack.eggX = BOWL_X - CRACK_MISS;
      expect(crack(state)).toBeNull();
      expect(state.crack.index).toBe(0);
      expect(state.feedback).toBeNull();
    });

    it('scores something for any egg that lands in the bowl', () => {
      const state = ready(['crack', 'stir', 'flip']);
      state.crack.eggX = BOWL_X + CRACK_MISS - 1;
      expect(crack(state)).toBeGreaterThan(0);
    });
  });

  describe('stir', () => {
    it('counts turns in either direction', () => {
      const state = ready(['stir', 'season', 'flip']);
      stirTurnsOf(state, 2);
      expect(state.stir.radians).toBeCloseTo(Math.PI * 4);
    });

    it('counts a spoon a little outside the pot', () => {
      const state = ready(['stir', 'season', 'flip']);
      stirTurnsOf(state, 1, POT.radius + STIR_REACH - 5);
      expect(stirTurns(state)).toBeCloseTo(1);
    });

    it('scores 100 for finishing instantly and moves on', () => {
      const state = ready(['stir', 'season', 'flip']);
      stirTurnsOf(state, STIR_TURNS);
      expect(state.scores[0]).toBe(100);
      expect(currentStage(state)).toBe('season');
    });

    it('scores up to 50 for the turns made when time runs out', () => {
      const state = ready(['stir', 'season', 'flip']);
      stirTurnsOf(state, 2);
      release(state);
      for (let t = 0; t < STIR_TIME; t += 0.05) step(state, 0.05);
      step(state, 0.05);
      expect(state.scores[0]).toBe(Math.round(50 * (2 / STIR_TURNS)));
      expect(currentStage(state)).toBe('season');
    });

    it('starts a fresh stroke after the spoon is lifted', () => {
      const state = ready(['stir', 'season', 'flip']);
      stir(state, POT.x + 80, POT.y);
      release(state);
      stir(state, POT.x - 80, POT.y);
      expect(state.stir.radians).toBe(0);
    });
  });

  describe('season', () => {
    it('scores when you let go at the star', () => {
      const state = ready(['chop', 'season', 'flip']);
      state.stageIndex = 1;
      startPour(state);
      step(state, PINCHES[0] / POUR_SPEED);
      expect(release(state)).toBeCloseTo(100 / PINCHES.length);
      expect(state.season.index).toBe(1);
    });

    it('overflows to nothing if you never let go', () => {
      const state = ready(['chop', 'season', 'flip']);
      state.stageIndex = 1;
      startPour(state);
      for (let i = 0; i < 100; i++) step(state, 0.05);
      expect(state.season.index).toBe(1);
      expect(state.season.points).toBe(0);
    });

    it('ignores a release that poured nothing', () => {
      const state = ready(['chop', 'season', 'flip']);
      state.stageIndex = 1;
      expect(release(state)).toBeNull();
    });

    it('does not use up a shake on a quick tap', () => {
      const state = ready(['chop', 'season', 'flip']);
      state.stageIndex = 1;
      startPour(state);
      step(state, 0.05);
      expect(release(state)).toBe('not yet');
      expect(state.season.index).toBe(0);
      expect(state.season.level).toBe(0);
      expect(state.feedback).toBeNull();
    });
  });

  describe('flip', () => {
    it('scores in full on the target', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.stageIndex = 2;
      state.flip.needle = FLIPS[0].target;
      expect(flip(state)).toBeCloseTo(100 / FLIPS.length);
      expect(state.flip.results).toEqual([1]);
    });

    it('ignores a tap far from the gold, so no pancake is wasted', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.stageIndex = 2;
      state.flip.needle = 0;
      expect(flip(state)).toBeNull();
      expect(state.flip.index).toBe(0);
    });

    it('ends the round after the last pancake', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.stageIndex = 2;
      for (const f of FLIPS) {
        state.flip.needle = f.target;
        flip(state);
      }
      expect(state.phase).toBe('over');
      expect(state.scores[2]).toBe(100);
      expect(flip(state)).toBeNull();
    });
  });

  describe('pizza', () => {
    const PIZZA = [...PIZZA_STAGES];

    it('has its own recipe and dish', () => {
      expect(recipeFor('pizza')).toEqual(['sauce', 'top', 'bake']);
      expect(recipeFor('surprise', () => 0)).toEqual(pickRecipe(() => 0));
      expect(dishFor(PIZZA)).toBe('pizza');
    });

    it('spreads the sauce with the same circles as stirring', () => {
      const state = ready(PIZZA);
      stirTurnsOf(state, STIR_TURNS);
      expect(state.scores[0]).toBe(100);
      expect(currentStage(state)).toBe('top');
    });

    it('scores a topping dropped on its spot', () => {
      const state = ready(PIZZA);
      state.stageIndex = 1;
      state.top.x = TOPPINGS[0].x;
      expect(addTopping(state)).toBeCloseTo(100 / TOPPINGS.length);
      expect(state.top.results).toEqual([1]);
      expect(state.top.x).toBe(TOPPING_START);
    });

    it('ignores a tap far from the spot, so no topping is wasted', () => {
      const state = ready(PIZZA);
      state.stageIndex = 1;
      state.top.x = TOPPINGS[0].x + TOPPING_MISS;
      expect(addTopping(state)).toBeNull();
      expect(press(state, 0, 0)).toBe(false);
      expect(state.top.index).toBe(0);
    });

    it('brings a topping that floats past back round', () => {
      const state = ready(PIZZA);
      state.stageIndex = 1;
      state.top.x = TOPPING_END - 1;
      step(state, 0.05);
      expect(state.top.x).toBe(TOPPING_START);
    });

    it('scores a pizza taken out when it is golden', () => {
      const state = ready(PIZZA);
      state.stageIndex = 2;
      startBake(state);
      step(state, BAKE_TARGET / BAKE_SPEED);
      expect(release(state)).toBeCloseTo(100);
      expect(state.bake.done).toBe(true);
      expect(state.phase).toBe('over');
    });

    it('keeps a pale pizza in the oven: "not yet", and the heat stays', () => {
      const state = ready(PIZZA);
      state.stageIndex = 2;
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
      const state = ready(PIZZA);
      state.stageIndex = 2;
      startBake(state);
      for (let i = 0; i < 200; i++) step(state, 0.05);
      expect(state.bake.done).toBe(true);
      expect(state.bake.level).toBe(1);
      expect(state.scores[2]).toBeGreaterThan(0);
      expect(state.phase).toBe('over');
    });

    it('plays a whole pizza through press', () => {
      const state = ready(PIZZA);
      stirTurnsOf(state, STIR_TURNS);
      step(state, BANNER_TIME);
      for (const spot of TOPPINGS) {
        state.top.x = spot.x;
        expect(press(state, 0, 0)).toBe(true);
      }
      step(state, BANNER_TIME);
      press(state, 0, 0);
      step(state, BAKE_TARGET / BAKE_SPEED);
      release(state);
      expect(state.phase).toBe('over');
      expect(state.scores).toEqual([100, 100, 100]);
      expect(liveScore(state)).toBe(totalScore(state));
    });
  });

  describe('combos', () => {
    it('adds a bonus for each perfect action after the first in a row', () => {
      const state = ready(['chop', 'stir', 'flip']);
      chopPerfectly(state);
      expect(state.combo).toBe(CHOP_MARKS.length);
      expect(state.bonus).toBe(COMBO_BONUS * (CHOP_MARKS.length - 1));
      expect(totalScore(state)).toBe(100 + state.bonus);
    });

    it('breaks the streak on anything short of perfect', () => {
      const state = ready(['chop', 'stir', 'flip']);
      state.chop.knifeX = CHOP_MARKS[0];
      chop(state);
      state.chop.knifeX = CHOP_MARKS[1] + 25;
      chop(state);
      expect(state.combo).toBe(0);
      state.chop.knifeX = CHOP_MARKS[2];
      chop(state);
      expect(state.combo).toBe(1);
      expect(state.bonus).toBe(0);
    });

    it('carries a streak across stages, and stirring leaves it alone', () => {
      const state = ready(['chop', 'stir', 'flip']);
      chopPerfectly(state);
      step(state, BANNER_TIME);
      stirTurnsOf(state, STIR_TURNS);
      expect(state.combo).toBe(CHOP_MARKS.length);
      step(state, BANNER_TIME);
      state.flip.needle = FLIPS[0].target;
      flip(state);
      expect(state.combo).toBe(CHOP_MARKS.length + 1);
    });
  });

  it('counts points in the live score as soon as they are earned', () => {
    const state = ready(['chop', 'stir', 'flip']);
    state.chop.knifeX = CHOP_MARKS[0];
    chop(state);
    expect(totalScore(state)).toBe(0);
    expect(liveScore(state)).toBe(100 / CHOP_MARKS.length);
  });

  it('fades the feedback popup', () => {
    const state = ready(['chop', 'stir', 'flip']);
    state.chop.knifeX = CHOP_MARKS[0];
    chop(state);
    expect(state.feedback?.grade).toBe('Perfect!');
    step(state, FEEDBACK_TIME);
    expect(state.feedback).toBeNull();
  });

  it('tells the caller when a press came too early', () => {
    const state = ready(['crack', 'stir', 'flip']);
    state.crack.eggX = 0;
    expect(press(state, 0, 0)).toBe(false);
    state.crack.eggX = BOWL_X;
    expect(press(state, 0, 0)).toBe(true);
  });

  it('plays a whole round through press', () => {
    const state = ready(['crack', 'season', 'flip']);
    for (let i = 0; i < EGG_SPEEDS.length; i++) {
      state.crack.eggX = BOWL_X;
      press(state, 0, 0);
    }
    step(state, BANNER_TIME);
    for (const pinch of PINCHES) {
      press(state, 0, 0);
      step(state, pinch / POUR_SPEED);
      release(state);
    }
    step(state, BANNER_TIME);
    for (const f of FLIPS) {
      state.flip.needle = f.target;
      press(state, 0, 0);
    }
    expect(state.phase).toBe('over');
    expect(state.scores).toEqual([100, 100, 100]);
    expect(totalScore(state)).toBe(300 + state.bonus);
  });
});
