import { recordScore, theme, type CarnivalGame } from '../../carnival';
import { createRenderer, type Pointer } from './render';
import { createSound } from './sound';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

/** Every stage the kitchen knows. Each round's recipe is three of them. */
export const ALL_STAGES = ['chop', 'crack', 'stir', 'season', 'flip'] as const;
export type Stage = (typeof ALL_STAGES)[number];
export const RECIPE_LENGTH = 3;
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
export const CHOP_MARKS = [270, 340, 410, 480, 550];
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

// Season: hold to pour salt, let go at the star.
export const PINCHES = [0.6, 0.45, 0.75];
/** Shaker fill per second while held. */
export const POUR_SPEED = 0.28;
export const SEASON_PERFECT = 0.06;
/** Off the star by this much or more scores nothing. */
export const SEASON_ZONE = 0.35;
/** A pour shorter than this was just a tap, so it doesn't use up a pinch. */
export const MIN_POUR = 0.1;

// Flip: tap when the heart is in the golden zone.
export const FLIPS = [
  { target: 0.5, speed: 0.3 },
  { target: 0.65, speed: 0.34 },
  { target: 0.35, speed: 0.38 },
  { target: 0.55, speed: 0.42 },
];
export const FLIP_PERFECT = 0.06;
export const FLIP_ZONE = 0.3;

/** Every grade is kind: a miss is "Nice try!", never a telling-off. */
export type Grade = 'Perfect!' | 'Great!' | 'Good!' | 'Nice try!';

export interface Feedback {
  grade: Grade;
  points: number;
  combo: number;
  age: number;
}

export interface KitchenState {
  recipe: Stage[];
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
  phase: 'playing' | 'over';
}

/** Picks three different stages, in the kitchen's usual order. */
export function pickRecipe(random: () => number = Math.random): Stage[] {
  const pool = [...ALL_STAGES];
  const picked = new Set<Stage>();
  while (picked.size < RECIPE_LENGTH) {
    const [stage] = pool.splice(Math.floor(random() * pool.length) % pool.length, 1);
    picked.add(stage);
  }
  return ALL_STAGES.filter((stage) => picked.has(stage));
}

export function createState(recipe: Stage[] = pickRecipe()): KitchenState {
  return {
    recipe,
    stageIndex: 0,
    scores: recipe.map(() => 0),
    bonus: 0,
    combo: 0,
    banner: BANNER_TIME,
    feedback: null,
    chop: { knifeX: KNIFE_MIN, dir: 1, cut: CHOP_MARKS.map(() => false), points: 0 },
    crack: { eggX: EGG_START, index: 0, points: 0, results: [] },
    stir: { radians: 0, lastAngle: null, timeLeft: STIR_TIME },
    season: { level: 0, pouring: false, index: 0, points: 0 },
    flip: { needle: 0, dir: 1, index: 0, points: 0, results: [] },
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
  };
  return totalScore(state) + Math.round(running[currentStage(state)]);
}

/** What Chef Bunny says about a final score. Always something nice. */
export function ratingFor(score: number): string {
  if (score >= 250) return 'You are a Master Chef!';
  if (score >= 180) return 'Super yummy!';
  if (score >= 100) return 'Yummy!';
  return 'Good cooking!';
}

/** Stars on the end screen. Every finished dish earns at least one. */
export function starsFor(score: number): number {
  if (score >= 250) return 3;
  if (score >= 150) return 2;
  return 1;
}

export type Dish = 'pancakes' | 'stew' | 'soup';

/** The dish a recipe makes, from its last stage. */
export function dishFor(recipe: readonly Stage[]): Dish {
  const last = recipe[recipe.length - 1];
  if (last === 'flip') return 'pancakes';
  if (last === 'season') return 'stew';
  return 'soup';
}

export const DISH_NAMES: Record<Dish, string> = {
  pancakes: 'Fluffy Pancakes',
  stew: 'Cozy Veggie Stew',
  soup: 'Rainbow Soup',
};

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

function accepting(state: KitchenState, stage: Stage): boolean {
  return state.phase === 'playing' && currentStage(state) === stage && state.banner === 0;
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

function finishStage(state: KitchenState, points: number): void {
  state.scores[state.stageIndex] = Math.round(Math.min(STAGE_POINTS, Math.max(0, points)));
  state.stageIndex += 1;
  if (state.stageIndex < state.recipe.length) {
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
  let nearest = -1;
  for (let i = 0; i < CHOP_MARKS.length; i++) {
    if (c.cut[i]) continue;
    const closer =
      nearest === -1 ||
      Math.abs(CHOP_MARKS[i] - c.knifeX) < Math.abs(CHOP_MARKS[nearest] - c.knifeX);
    if (closer) nearest = i;
  }
  const share = accuracy(Math.abs(CHOP_MARKS[nearest] - c.knifeX), CHOP_PERFECT, CHOP_MISS);
  const points = scoreAction(state, share, STAGE_POINTS / CHOP_MARKS.length);
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

/** Moves the spoon to (x, y) while the pointer is held down. */
export function stir(state: KitchenState, x: number, y: number): void {
  if (!accepting(state, 'stir')) return;
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

/** Starts pouring salt. */
export function startPour(state: KitchenState): void {
  if (!accepting(state, 'season')) return;
  state.season.pouring = true;
}

function endPour(state: KitchenState): number {
  const s = state.season;
  const share = accuracy(Math.abs(s.level - PINCHES[s.index]), SEASON_PERFECT, SEASON_ZONE);
  const points = scoreAction(state, share, STAGE_POINTS / PINCHES.length);
  s.points += points;
  s.index += 1;
  s.level = 0;
  s.pouring = false;
  if (s.index === PINCHES.length) finishStage(state, s.points);
  return points;
}

/**
 * Lets go of the button: lifts the spoon, and stops pouring salt.
 * Returns the points a pour scored, null if nothing was being poured, or
 * 'not yet' for a quick tap that barely poured: that pinch isn't used up.
 */
export function release(state: KitchenState): number | 'not yet' | null {
  state.stir.lastAngle = null;
  if (!accepting(state, 'season') || !state.season.pouring) return null;
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
  const distance = Math.abs(f.needle - FLIPS[f.index].target);
  // Far from the gold: the pancake keeps cooking rather than being wasted.
  if (distance >= FLIP_ZONE) return null;
  const share = accuracy(distance, FLIP_PERFECT, FLIP_ZONE);
  const points = scoreAction(state, share, STAGE_POINTS / FLIPS.length);
  f.results.push(share);
  f.points += points;
  f.index += 1;
  f.needle = 0;
  f.dir = 1;
  if (f.index === FLIPS.length) finishStage(state, f.points);
  return points;
}

/** Presses the button, doing whatever the current stage does on a press. */
/**
 * Returns false for a tap that came too early: the egg or the heart wasn't
 * near the gold yet, so nothing happened.
 */
export function press(state: KitchenState, x: number, y: number): boolean {
  if (state.phase !== 'playing' || state.banner > 0) return true;
  const stage = currentStage(state);
  if (stage === 'chop') chop(state);
  else if (stage === 'crack') return crack(state) !== null;
  else if (stage === 'stir') stir(state, x, y);
  else if (stage === 'season') startPour(state);
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
  } else if (stage === 'stir') {
    const s = state.stir;
    s.timeLeft = Math.max(0, s.timeLeft - dt);
    // Out of time: up to 50 for the turns you managed.
    if (s.timeLeft === 0) finishStirring(state, 50 * (stirTurns(state) / STIR_TURNS));
  } else if (stage === 'season') {
    const s = state.season;
    if (s.pouring) {
      s.level = Math.min(1, s.level + POUR_SPEED * dt);
      if (s.level === 1) endPour(state);
    }
  } else {
    const f = state.flip;
    const needle = bounce(f.needle, f.dir, FLIPS[f.index].speed * dt, 0, 1);
    f.needle = needle.value;
    f.dir = needle.dir;
  }
}

export const carnivalKitchen: CarnivalGame = {
  id: 'carnival-kitchen',
  name: 'Carnival Kitchen',
  description:
    'Cook a surprise three-step recipe. Sharp timing and perfect streaks score the most.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Stirring drags across the canvas, so stop touch screens from scrolling.
    const touchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';

    let state = createState();
    let started = false;
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

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
      pointer.y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    };
    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      toCanvas(event);
      sound.unlock();
      if (renderer.hitSoundButton(pointer.x, pointer.y)) {
        sound.toggle();
        return;
      }
      pointer.down = true;
      activePointer = event.pointerId;
      if (!started) {
        // The first tap starts the round, so sound and speech are allowed.
        started = true;
        state = createState();
        renderer.reset();
      } else if (state.phase === 'over') {
        saveScore();
        state = createState();
        scoreRecorded = false;
        renderer.reset();
      } else {
        if (!press(state, pointer.x, pointer.y)) renderer.notYet(pointer.x, pointer.y);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (activePointer !== null && event.pointerId !== activePointer) return;
      toCanvas(event);
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

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      if (!started) {
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
      canvas.style.touchAction = touchAction;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  },
};

export default carnivalKitchen;
