import { recordScore, theme, type CarnivalGame } from '../../carnival';
import { DISHES } from './dishes';
import { NARROW, layoutFor, sameLayout, toScene } from './layout';
import { BAKE_TARGET, PIZZA_VIEW } from './pizza-shape';
import { createRenderer, type Pointer } from './render';
import { createSound } from './sound';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

/**
 * Every step the kitchen knows. A step is one mini-game; dishes are made of
 * steps. A new step needs its rules here (`press`, `release`, `step`), its
 * drawing in render.ts, and a title, hint and icon there too.
 */
export type Stage =
  'chop' | 'crack' | 'pour' | 'mix' | 'stir' | 'season' | 'sauce' | 'top' | 'bake' | 'flip';

/** Steps where you draw circles: stirring soup, spreading sauce, mixing batter. */
export const CIRCLE_STAGES: readonly Stage[] = ['stir', 'sauce', 'mix'];
/** Steps where you hold and let go at the star: shaking salt, pouring flour and milk. */
export const POUR_STAGES: readonly Stage[] = ['season', 'pour'];

/** Things that can be chopped. Each has its own drawing in render.ts. */
export type ChopItem = 'carrot' | 'pepperoni';

/**
 * A dish: a whole recipe, cooked step by step. Each dish lives in its own
 * file in `dishes/`, as that file's default export, and `dishes/index.ts`
 * finds it. Adding a dish never touches any other file.
 */
export interface Dish {
  /** Matches the file name: `dishes/pizza.ts` has the id 'pizza'. */
  id: string;
  /** The name on the end card, and what Chef Bunny says you made. */
  name: string;
  /** The steps, in the order you cook them. */
  steps: Stage[];
  /** What gets chopped, if the steps include 'chop'. */
  chop: ChopItem;
  /** How many times you hold and let go, if the steps include 'season' or 'pour'. */
  pours: number;
  /**
   * Draws the finished dish, centred on the origin, about 240 wide and 160
   * tall, for the end card. `state` is the round that made it, or null for a
   * dish nobody has cooked yet. Helpers to draw with are in art.ts.
   */
  draw(g: CanvasRenderingContext2D, time: number, state: KitchenState | null): void;
}

/**
 * Picks the next dish at random. Never the same dish twice in a row, so
 * every round feels new.
 */
export function pickDish(random: () => number = Math.random, previous?: Dish): Dish {
  const choices = DISHES.filter((dish) => dish.id !== previous?.id);
  return choices[Math.floor(random() * choices.length) % choices.length];
}

/** Each stage is worth up to this many points, before combo bonuses. */
export const STAGE_POINTS = 100;

/**
 * Seconds the "Chop the carrot!" banner shows before a stage takes input.
 * Long enough for the instruction to be read out loud.
 */
export const BANNER_TIME = 2.6;
/** Seconds a "Perfect!" style popup stays on screen. */
export const FEEDBACK_TIME = 1.1;

/** An action this good or better (as a share of its points) is perfect. */
export const PERFECT = 0.9;
/** Bonus for each perfect action after the first in an unbroken streak. */
export const COMBO_BONUS = 5;

// Chop: a knife glides along the carrot; tap when it's over a dotted line.
/** The dotted lines spread between these, 4 or 5 of them, a little different each time. */
export const CHOP_FIRST = 270;
export const CHOP_LAST = 550;
export const CHOP_JITTER = 12;
export const KNIFE_MIN = 220;
export const KNIFE_MAX = 600;
export const KNIFE_SPEED = 105;
/** Within this many pixels of a line scores in full. */
export const CHOP_PERFECT = 14;
/** This many pixels or more from a line scores nothing. */
export const CHOP_MISS = 60;

// Crack: an egg floats over the bowl; tap to drop it in.
export const BOWL_X = WIDTH / 2;
export const EGG_SPEEDS = [95, 110, 125];
export const EGG_START = -40;
export const EGG_END = WIDTH + 40;
export const CRACK_PERFECT = 22;
export const CRACK_MISS = 120;

// Stir: hold and drag the spoon around the pot.
export const POT = { x: WIDTH / 2, y: 275, radius: 140 } as const;
/** How far outside the pot the spoon still counts, so small fingers can be a bit off. */
export const STIR_REACH = 90;
export const STIR_TURNS = 3;
export const STIR_TIME = 15;

// Season and pour: hold to pour, let go at the star. Each star is placed at
// random between these.
export const TARGET_LOW = 0.4;
export const TARGET_HIGH = 0.8;
/** Shaker fill per second while held. */
export const POUR_SPEED = 0.28;
export const SEASON_PERFECT = 0.06;
/** Off the star by this much or more scores nothing. */
export const SEASON_ZONE = 0.35;
/** A pour shorter than this was just a tap, so it doesn't use up a pinch. */
export const MIN_POUR = 0.1;

// Flip: tap when the heart is in the golden zone, which moves each time.
export const FLIP_SPEEDS = [0.3, 0.34, 0.38, 0.42];
export const FLIP_LOW = 0.3;
export const FLIP_HIGH = 0.7;
export const FLIP_PERFECT = 0.06;
export const FLIP_ZONE = 0.3;

// Sauce: the same circles as stirring, drawn on the pizza dough (at POT).

// Toppings: each one floats across; tap when it's over its sparkly spot.
// The pepperoni you chopped always goes on, with four others picked at
// random, each on a random spot.
export type Topping = 'pepperoni' | 'mushroom' | 'pineapple' | 'olive' | 'pepper' | 'tomato';
export const EXTRA_TOPPINGS: Topping[] = ['mushroom', 'pineapple', 'olive', 'pepper', 'tomato'];
export const TOPPING_COUNT = 5;
export const TOPPING_SPEEDS = [90, 98, 106, 114, 122];
export { PIZZA_VIEW };
/** Spots stay this far inside the pizza (as a share of its radius), clear of the crust. */
export const SPOT_REACH = 0.62;
/** Spots keep at least this far apart (as a share of the radius), so toppings don't pile up. */
export const SPOT_GAP = 0.42;
export interface ToppingSpot {
  kind: Topping;
  x: number;
  y: number;
  speed: number;
}
export const TOPPING_START = -40;
export const TOPPING_END = WIDTH + 40;
export const TOPPING_PERFECT = 20;
/** Taps this far or more from the spot are ignored, so no topping is wasted. */
export const TOPPING_MISS = 100;

// Bake: hold to bake, let go when the pizza is golden.
/** Oven heat per second while held. */
export const BAKE_SPEED = 0.18;
export { BAKE_TARGET };
export const BAKE_PERFECT = 0.07;
/** Off the target by this much or more scores nothing. */
export const BAKE_ZONE = 0.4;
/** Letting go this far before the target is "Not yet!": the pizza stays in. */
export const BAKE_EARLY = 0.2;

/** Every grade is kind: a miss is "Nice try!", never a telling-off. */
export type Grade = 'Perfect!' | 'Great!' | 'Good!' | 'Nice try!';

export interface Feedback {
  grade: Grade;
  points: number;
  combo: number;
  age: number;
}

/** Everything that's different from one round to the next. */
export interface Plan {
  /** Where the dotted lines are on the thing being chopped. */
  marks: number[];
  /** Where the star is for each shake of salt, or each pour of flour and milk. */
  pinches: number[];
  flips: { target: number; speed: number }[];
  toppings: ToppingSpot[];
}

export interface KitchenState {
  dish: Dish;
  recipe: Stage[];
  plan: Plan;
  /** Index into `recipe` of the stage being cooked. */
  stageIndex: number;
  /** Points per stage, in recipe order, before bonuses. */
  scores: number[];
  bonus: number;
  /** Perfect actions in a row; any other action resets it. */
  combo: number;
  banner: number;
  feedback: Feedback | null;
  chop: { knifeX: number; dir: 1 | -1; cut: boolean[]; points: number };
  /** `results` holds each egg's share of its points, 0 to 1. */
  crack: { eggX: number; index: number; points: number; results: number[] };
  stir: { radians: number; lastAngle: number | null; timeLeft: number };
  season: { level: number; pouring: boolean; index: number; points: number };
  /** `results` holds each pancake's share of its points, 0 to 1. */
  flip: { needle: number; dir: 1 | -1; index: number; points: number; results: number[] };
  /** `results` holds each topping's share of its points, 0 to 1. */
  top: { x: number; index: number; points: number; results: number[] };
  bake: { level: number; baking: boolean; done: boolean };
  phase: 'playing' | 'over';
}

function between(random: () => number, low: number, high: number): number {
  return low + random() * (high - low);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Random spots on the pizza, spread out so toppings don't land on each other. */
function pizzaSpots(count: number, random: () => number): { x: number; y: number }[] {
  const spots: { nx: number; ny: number }[] = [];
  for (let tries = 0; spots.length < count && tries < 400; tries++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * SPOT_REACH;
    const spot = { nx: Math.cos(a) * r, ny: Math.sin(a) * r };
    // Late on, take any spot rather than loop forever.
    const gap = tries < 300 ? SPOT_GAP : 0;
    if (spots.every((o) => Math.hypot(o.nx - spot.nx, o.ny - spot.ny) >= gap)) spots.push(spot);
  }
  return spots.map(({ nx, ny }) => ({
    x: Math.round(PIZZA_VIEW.x + nx * PIZZA_VIEW.rx),
    y: Math.round(PIZZA_VIEW.y + ny * PIZZA_VIEW.ry),
  }));
}

/** Rolls everything that changes from round to round. */
export function makePlan(dish: Dish, random: () => number = Math.random): Plan {
  const count = random() < 0.5 ? 4 : 5;
  const gap = (CHOP_LAST - CHOP_FIRST) / (count - 1);
  const marks = Array.from({ length: count }, (_, i) =>
    Math.round(CHOP_FIRST + i * gap + between(random, -CHOP_JITTER, CHOP_JITTER)),
  );
  const pinches = Array.from({ length: dish.pours }, () =>
    between(random, TARGET_LOW, TARGET_HIGH),
  );
  const flips = FLIP_SPEEDS.map((speed) => ({
    target: between(random, FLIP_LOW, FLIP_HIGH),
    speed,
  }));
  const kinds = shuffle<Topping>(
    ['pepperoni', ...shuffle(EXTRA_TOPPINGS, random).slice(0, TOPPING_COUNT - 1)],
    random,
  );
  const spots = pizzaSpots(TOPPING_COUNT, random);
  const toppings = kinds.map((kind, i) => ({ kind, ...spots[i], speed: TOPPING_SPEEDS[i] }));
  return { marks, pinches, flips, toppings };
}

type StepStates = Pick<
  KitchenState,
  'chop' | 'crack' | 'stir' | 'season' | 'flip' | 'top' | 'bake'
>;

/** Every step's state, as it is before the step starts. */
function stepStates(plan: Plan): StepStates {
  return {
    chop: { knifeX: KNIFE_MIN, dir: 1, cut: plan.marks.map(() => false), points: 0 },
    crack: { eggX: EGG_START, index: 0, points: 0, results: [] },
    stir: { radians: 0, lastAngle: null, timeLeft: STIR_TIME },
    season: { level: 0, pouring: false, index: 0, points: 0 },
    flip: { needle: 0, dir: 1, index: 0, points: 0, results: [] },
    top: { x: TOPPING_START, index: 0, points: 0, results: [] },
    bake: { level: 0, baking: false, done: false },
  };
}

export function createState(dish: Dish, random: () => number = Math.random): KitchenState {
  const recipe = [...dish.steps];
  const plan = makePlan(dish, random);
  return {
    dish,
    recipe,
    plan,
    stageIndex: 0,
    scores: recipe.map(() => 0),
    bonus: 0,
    combo: 0,
    banner: BANNER_TIME,
    feedback: null,
    ...stepStates(plan),
    phase: 'playing',
  };
}

export function currentStage(state: KitchenState): Stage {
  return state.recipe[state.stageIndex];
}

export function totalScore(state: KitchenState): number {
  return state.scores.reduce((sum, points) => sum + points, 0) + state.bonus;
}

/** The score so far, counting points already earned in the stage being cooked. */
export function liveScore(state: KitchenState): number {
  if (state.phase === 'over') return totalScore(state);
  const running: Record<Stage, number> = {
    chop: state.chop.points,
    crack: state.crack.points,
    stir: 0,
    season: state.season.points,
    flip: state.flip.points,
    sauce: 0,
    top: state.top.points,
    bake: 0,
    pour: state.season.points,
    mix: 0,
  };
  return totalScore(state) + Math.round(running[currentStage(state)]);
}

/** The most a round can score, before combo bonuses. */
export function maxScore(state: KitchenState): number {
  return state.recipe.length * STAGE_POINTS;
}

/** What Chef Bunny says about a final score out of `max`. Always something nice. */
export function ratingFor(score: number, max: number): string {
  const share = score / max;
  if (share >= 0.83) return 'You are a Master Chef!';
  if (share >= 0.6) return 'Super yummy!';
  if (share >= 0.33) return 'Yummy!';
  return 'Good cooking!';
}

/** Stars on the end screen, for a score out of `max`. Every finished dish earns at least one. */
export function starsFor(score: number, max: number): number {
  const share = score / max;
  if (share >= 0.83) return 3;
  if (share >= 0.5) return 2;
  return 1;
}

/** The popup for an action that earned `share` of its points (0 to 1). */
export function gradeFor(share: number): Grade {
  if (share >= PERFECT) return 'Perfect!';
  if (share >= 0.6) return 'Great!';
  if (share > 0) return 'Good!';
  return 'Nice try!';
}

/** 1 up to `perfect` away, falling to 0 at `miss` away. */
export function accuracy(distance: number, perfect: number, miss: number): number {
  if (distance <= perfect) return 1;
  if (distance >= miss) return 0;
  return 1 - (distance - perfect) / (miss - perfect);
}

function accepting(state: KitchenState, ...stages: Stage[]): boolean {
  return state.phase === 'playing' && stages.includes(currentStage(state)) && state.banner === 0;
}

/** Scores one action worth `worth` points, and updates the combo and the popup. */
function scoreAction(state: KitchenState, share: number, worth: number): number {
  const points = share * worth;
  if (share >= PERFECT) {
    state.combo += 1;
    if (state.combo > 1) state.bonus += COMBO_BONUS;
  } else {
    state.combo = 0;
  }
  state.feedback = { grade: gradeFor(share), points, combo: state.combo, age: 0 };
  return points;
}

/**
 * Gives a step fresh state as it starts. Steps of the same kind share their
 * state (stirring, sauce and batter all use `stir`), so a dish with two of a
 * kind gets a clean start for the second one.
 */
function freshStepState(state: KitchenState, stage: Stage): void {
  const fresh = stepStates(state.plan);
  if (stage === 'chop') state.chop = fresh.chop;
  else if (stage === 'crack') state.crack = fresh.crack;
  else if (CIRCLE_STAGES.includes(stage)) state.stir = fresh.stir;
  else if (POUR_STAGES.includes(stage)) state.season = fresh.season;
  else if (stage === 'flip') state.flip = fresh.flip;
  else if (stage === 'top') state.top = fresh.top;
  else if (stage === 'bake') state.bake = fresh.bake;
}

function finishStage(state: KitchenState, points: number): void {
  state.scores[state.stageIndex] = Math.round(Math.min(STAGE_POINTS, Math.max(0, points)));
  state.stageIndex += 1;
  if (state.stageIndex < state.recipe.length) {
    freshStepState(state, currentStage(state));
    state.banner = BANNER_TIME;
  } else {
    state.stageIndex = state.recipe.length - 1;
    state.phase = 'over';
  }
}

/** Brings the knife down on the nearest uncut mark. Returns the points scored, or null. */
export function chop(state: KitchenState): number | null {
  if (!accepting(state, 'chop')) return null;
  const c = state.chop;
  const marks = state.plan.marks;
  let nearest = -1;
  for (let i = 0; i < marks.length; i++) {
    if (c.cut[i]) continue;
    const closer =
      nearest === -1 || Math.abs(marks[i] - c.knifeX) < Math.abs(marks[nearest] - c.knifeX);
    if (closer) nearest = i;
  }
  const share = accuracy(Math.abs(marks[nearest] - c.knifeX), CHOP_PERFECT, CHOP_MISS);
  const points = scoreAction(state, share, STAGE_POINTS / marks.length);
  c.cut[nearest] = true;
  c.points += points;
  if (c.cut.every(Boolean)) finishStage(state, c.points);
  return points;
}

function nextEgg(state: KitchenState, share: number): number {
  const c = state.crack;
  const points = scoreAction(state, share, STAGE_POINTS / EGG_SPEEDS.length);
  c.results.push(share);
  c.points += points;
  c.index += 1;
  c.eggX = EGG_START;
  if (c.index === EGG_SPEEDS.length) finishStage(state, c.points);
  return points;
}

/** Drops the egg into the bowl. Returns the points scored, or null. */
export function crack(state: KitchenState): number | null {
  if (!accepting(state, 'crack')) return null;
  const distance = Math.abs(state.crack.eggX - BOWL_X);
  // Too far from the bowl: the egg keeps floating rather than being wasted.
  if (distance >= CRACK_MISS) return null;
  return nextEgg(state, accuracy(distance, CRACK_PERFECT, CRACK_MISS));
}

/**
 * Moves the spoon to (x, y) while the pointer is held down. Spreading the
 * pizza sauce and mixing the batter are the same circles, so this does all three.
 */
export function stir(state: KitchenState, x: number, y: number): void {
  if (!accepting(state, ...CIRCLE_STAGES)) return;
  const s = state.stir;
  const distance = Math.hypot(x - POT.x, y - POT.y);
  if (distance < 12 || distance > POT.radius + STIR_REACH) {
    s.lastAngle = null;
    return;
  }
  const angle = Math.atan2(y - POT.y, x - POT.x);
  if (s.lastAngle !== null) {
    let delta = angle - s.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    s.radians += delta;
  }
  s.lastAngle = angle;
  if (stirTurns(state) >= STIR_TURNS) {
    // Done in time: 50 for finishing, plus up to 50 for speed.
    finishStirring(state, 50 + 50 * (s.timeLeft / STIR_TIME));
  }
}

function finishStirring(state: KitchenState, points: number): void {
  // Stirring has no single moment to judge, so it shows a grade but leaves the combo alone.
  state.feedback = {
    grade: gradeFor(points / STAGE_POINTS),
    points,
    combo: state.combo,
    age: 0,
  };
  finishStage(state, points);
}

/** Full turns stirred so far, in either direction. Wiggling back and forth cancels out. */
export function stirTurns(state: KitchenState): number {
  return Math.abs(state.stir.radians) / (Math.PI * 2);
}

/** Starts shaking salt, or pouring flour or milk. */
export function startPour(state: KitchenState): void {
  if (!accepting(state, ...POUR_STAGES)) return;
  state.season.pouring = true;
}

function endPour(state: KitchenState): number {
  const s = state.season;
  const pinches = state.plan.pinches;
  const share = accuracy(Math.abs(s.level - pinches[s.index]), SEASON_PERFECT, SEASON_ZONE);
  const points = scoreAction(state, share, STAGE_POINTS / pinches.length);
  s.points += points;
  s.index += 1;
  s.level = 0;
  s.pouring = false;
  if (s.index === pinches.length) finishStage(state, s.points);
  return points;
}

/**
 * Lets go of the button: lifts the spoon, and stops pouring salt.
 * Returns the points a pour scored, null if nothing was being poured, or
 * 'not yet' for a quick tap that barely poured: that pinch isn't used up.
 */
export function release(state: KitchenState): number | 'not yet' | null {
  state.stir.lastAngle = null;
  if (accepting(state, 'bake') && state.bake.baking) return stopBaking(state);
  if (!accepting(state, ...POUR_STAGES) || !state.season.pouring) return null;
  if (state.season.level < MIN_POUR) {
    state.season.pouring = false;
    state.season.level = 0;
    return 'not yet';
  }
  return endPour(state);
}

/** Flips the pancake at the needle's current heat. Returns the points scored, or null. */
export function flip(state: KitchenState): number | null {
  if (!accepting(state, 'flip')) return null;
  const f = state.flip;
  const flips = state.plan.flips;
  const distance = Math.abs(f.needle - flips[f.index].target);
  // Far from the gold: the pancake keeps cooking rather than being wasted.
  if (distance >= FLIP_ZONE) return null;
  const share = accuracy(distance, FLIP_PERFECT, FLIP_ZONE);
  const points = scoreAction(state, share, STAGE_POINTS / flips.length);
  f.results.push(share);
  f.points += points;
  f.index += 1;
  f.needle = 0;
  f.dir = 1;
  if (f.index === flips.length) finishStage(state, f.points);
  return points;
}

/** Drops the topping onto the pizza. Returns the points scored, or null. */
export function addTopping(state: KitchenState): number | null {
  if (!accepting(state, 'top')) return null;
  const t = state.top;
  const toppings = state.plan.toppings;
  const distance = Math.abs(t.x - toppings[t.index].x);
  // Far from its spot: the topping keeps floating rather than being wasted.
  if (distance >= TOPPING_MISS) return null;
  const share = accuracy(distance, TOPPING_PERFECT, TOPPING_MISS);
  const points = scoreAction(state, share, STAGE_POINTS / toppings.length);
  t.results.push(share);
  t.points += points;
  t.index += 1;
  t.x = TOPPING_START;
  if (t.index === toppings.length) finishStage(state, t.points);
  return points;
}

/** Puts the pizza in the oven and turns the heat on. */
export function startBake(state: KitchenState): void {
  if (!accepting(state, 'bake')) return;
  state.bake.baking = true;
}

function stopBaking(state: KitchenState): number | 'not yet' {
  const b = state.bake;
  b.baking = false;
  // Still pale: it keeps its heat and waits for another hold.
  if (b.level < BAKE_TARGET - BAKE_EARLY) return 'not yet';
  return takeOutPizza(state);
}

function takeOutPizza(state: KitchenState): number {
  const b = state.bake;
  b.baking = false;
  b.done = true;
  const share = accuracy(Math.abs(b.level - BAKE_TARGET), BAKE_PERFECT, BAKE_ZONE);
  const points = scoreAction(state, share, STAGE_POINTS);
  finishStage(state, points);
  return points;
}

/**
 * Presses the button, doing whatever the current stage does on a press.
 * Returns false for a tap that came too early: the egg, the topping or the
 * heart wasn't near its spot yet, so nothing happened.
 */
export function press(state: KitchenState, x: number, y: number): boolean {
  if (state.phase !== 'playing' || state.banner > 0) return true;
  const stage = currentStage(state);
  if (stage === 'chop') chop(state);
  else if (stage === 'crack') return crack(state) !== null;
  else if (CIRCLE_STAGES.includes(stage)) stir(state, x, y);
  else if (POUR_STAGES.includes(stage)) startPour(state);
  else if (stage === 'top') return addTopping(state) !== null;
  else if (stage === 'bake') startBake(state);
  else return flip(state) !== null;
  return true;
}

function bounce(value: number, dir: 1 | -1, delta: number, min: number, max: number) {
  let next = value + dir * delta;
  let nextDir = dir;
  if (next > max) {
    next = max - (next - max);
    nextDir = -1;
  } else if (next < min) {
    next = min + (min - next);
    nextDir = 1;
  }
  return { value: Math.min(max, Math.max(min, next)), dir: nextDir };
}

/** Advances the game by `dt` seconds. */
export function step(state: KitchenState, dt: number): void {
  if (state.feedback) {
    state.feedback.age += dt;
    if (state.feedback.age >= FEEDBACK_TIME) state.feedback = null;
  }
  if (state.phase !== 'playing') return;
  if (state.banner > 0) {
    state.banner = Math.max(0, state.banner - dt);
    return;
  }

  const stage = currentStage(state);
  if (stage === 'chop') {
    const c = state.chop;
    const knife = bounce(c.knifeX, c.dir, KNIFE_SPEED * dt, KNIFE_MIN, KNIFE_MAX);
    c.knifeX = knife.value;
    c.dir = knife.dir;
  } else if (stage === 'crack') {
    const c = state.crack;
    c.eggX += EGG_SPEEDS[c.index] * dt;
    // An egg that floats past comes round again.
    if (c.eggX > EGG_END) c.eggX = EGG_START;
  } else if (stage === 'top') {
    const t = state.top;
    t.x += state.plan.toppings[t.index].speed * dt;
    // A topping that floats past comes round again.
    if (t.x > TOPPING_END) t.x = TOPPING_START;
  } else if (stage === 'bake') {
    const b = state.bake;
    if (b.baking) {
      b.level = Math.min(1, b.level + BAKE_SPEED * dt);
      // Fully baked: it comes out by itself, a little crispy.
      if (b.level === 1) takeOutPizza(state);
    }
  } else if (CIRCLE_STAGES.includes(stage)) {
    const s = state.stir;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    // Out of time: up to 50 for the turns you managed.
    if (s.timeLeft === 0) finishStirring(state, 50 * (stirTurns(state) / STIR_TURNS));
  } else if (POUR_STAGES.includes(stage)) {
    const s = state.season;
    if (s.pouring) {
      s.level = Math.min(1, s.level + POUR_SPEED * dt);
      if (s.level === 1) endPour(state);
    }
  } else {
    const f = state.flip;
    const needle = bounce(f.needle, f.dir, state.plan.flips[f.index].speed * dt, 0, 1);
    f.needle = needle.value;
    f.dir = needle.dir;
  }
}

export const carnivalKitchen: CarnivalGame = {
  id: 'carnival-kitchen',
  name: 'Carnival Kitchen',
  description:
    'Cook pizza, pancakes or soup with Chef Bunny. Sharp timing and perfect streaks score the most.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');

    // Stirring drags across the canvas, so stop touch screens from scrolling,
    // and holding a finger down (to pour or bake) mustn't select anything or
    // open a menu. On a phone or tablet the canvas also covers the whole
    // screen. All of it is put back when the game stops.
    const canvasStyle = canvas.style.cssText;
    const bodyOverflow = document.body.style.overflow;
    const touchStyle = () => {
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.setProperty('-webkit-user-select', 'none');
      canvas.style.setProperty('-webkit-touch-callout', 'none');
    };
    touchStyle();
    const noMenu = (event: Event) => event.preventDefault();
    canvas.addEventListener('contextmenu', noMenu);
    const touchScreen = window.matchMedia('(pointer: coarse)');

    let layout = layoutFor(0, 0, false);
    /** Sizes the canvas for the screen as it is now: shape, then sharpness. */
    const fit = () => {
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;
      const full = touchScreen.matches || viewWidth < NARROW;
      const next = layoutFor(viewWidth, viewHeight, full);
      if (full) {
        // As big as fits, in the middle. The layout already matches the
        // screen's shape, unless the screen is an odd one.
        const fitScale = Math.min(viewWidth / next.width, viewHeight / next.height);
        const cssWidth = next.width * fitScale;
        const cssHeight = next.height * fitScale;
        Object.assign(canvas.style, {
          position: 'fixed',
          left: `${(viewWidth - cssWidth) / 2}px`,
          top: `${(viewHeight - cssHeight) / 2}px`,
          width: `${cssWidth}px`,
          height: `${cssHeight}px`,
          borderRadius: '0',
          zIndex: '100',
        });
        document.body.style.overflow = 'hidden';
      } else {
        canvas.style.cssText = canvasStyle;
        touchStyle();
        document.body.style.overflow = bodyOverflow;
      }
      // Canvas pixels per unit: as many as the screen shows, up to 3.
      const shown = full
        ? Math.min(viewWidth / next.width, viewHeight / next.height)
        : canvas.getBoundingClientRect().width / next.width || 1;
      const pixels = Math.min(3, Math.max(1, shown * (window.devicePixelRatio || 1)));
      const width = Math.round(next.width * pixels);
      const height = Math.round(next.height * pixels);
      if (sameLayout(layout, next) && canvas.width === width && canvas.height === height) return;
      layout = next;
      canvas.width = width;
      canvas.height = height;
      renderer.setLayout(layout, pixels);
    };

    let state = createState(pickDish());
    // The title screen, waiting for a tap to start cooking.
    let choosing = true;
    let lastDish: Dish | undefined;
    let scoreRecorded = false;
    const pointer: Pointer = { x: WIDTH / 2, y: HEIGHT / 2, down: false };
    const sound = createSound();
    const renderer = createRenderer(ctx, sound);

    // The finger (or mouse) that's holding the spoon or the shaker. Other
    // fingers moving or lifting don't touch its gesture; a new tap takes over.
    let activePointer: number | null = null;

    /** Saves a finished round's score, once, before anything can replace it. */
    const saveScore = () => {
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(carnivalKitchen.id, totalScore(state));
        scoreRecorded = true;
      }
    };

    /** Starts cooking the next dish, picked at random. */
    const newRound = () => {
      lastDish = pickDish(Math.random, lastDish);
      state = createState(lastDish);
      scoreRecorded = false;
      renderer.reset();
    };

    /** Where the event is, in canvas units. The pointer keeps scene units. */
    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * layout.width,
        y: ((event.clientY - rect.top) / rect.height) * layout.height,
      };
    };
    const track = (event: PointerEvent) => {
      const at = toCanvas(event);
      Object.assign(pointer, toScene(layout, at.x, at.y));
      return at;
    };
    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      const at = track(event);
      sound.unlock();
      if (renderer.hitHomeButton(at.x, at.y)) {
        location.hash = '#/';
        return;
      }
      if (renderer.hitSoundButton(at.x, at.y)) {
        sound.toggle();
        return;
      }
      pointer.down = true;
      activePointer = event.pointerId;
      if (choosing) {
        // A tap starts cooking a dish picked at random. It also unlocks sound
        // and speech, which browsers only allow after a tap.
        choosing = false;
        newRound();
      } else if (state.phase === 'over') {
        // A short pause first, so a last excited tap doesn't skip the stars.
        if (!renderer.endShown()) return;
        saveScore();
        newRound();
      } else {
        if (!press(state, pointer.x, pointer.y)) renderer.notYet(pointer.x, pointer.y);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (activePointer !== null && event.pointerId !== activePointer) return;
      track(event);
      if (pointer.down) stir(state, pointer.x, pointer.y);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      pointer.down = false;
      if (release(state) === 'not yet') renderer.notYet(pointer.x, pointer.y);
      saveScore();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', fit);
    fit();

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      if (choosing) {
        renderer.drawTitle(dt);
        frame = requestAnimationFrame(loop);
        return;
      }
      step(state, dt);
      saveScore();
      renderer.draw(state, pointer, dt);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      sound.close();
      canvas.style.cssText = canvasStyle;
      document.body.style.overflow = bodyOverflow;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('resize', fit);
      canvas.removeEventListener('contextmenu', noMenu);
    };
  },
};

export default carnivalKitchen;
