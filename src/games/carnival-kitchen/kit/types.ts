import type { G } from '../art';
import type { Shape } from '../layout';
import type { Sound } from '../sound';

/**
 * The shapes everything in the kitchen shares: dishes, steps, ingredients and
 * the round being cooked. This file only has types, so anything can import it.
 *
 * Two of them are open: each step file adds to them, so adding a step never
 * edits this file.
 *
 * - `StepKinds` maps a step's kind to its recipe options.
 * - `IngredientArt` maps an art role to what an ingredient must draw to play
 *   it (chop: something you can chop, topping: something that goes on top...).
 *
 * A step file adds its own with module augmentation:
 *
 *     declare module '../kit/types' {
 *       interface StepKinds { chop: ChopOptions }
 *       interface IngredientArt { chop: ChopArt }
 *     }
 */

/** Every grade is kind: a miss is "Nice try!", never a telling-off. */
export type Grade = 'Perfect!' | 'Great!' | 'Good!' | 'Nice try!';

/** The "Perfect!" style popup for the last action. */
export interface Feedback {
  grade: Grade;
  points: number;
  combo: number;
  age: number;
}

/**
 * Every kind of step's recipe options, by kind. Empty here: each step file
 * adds its own (see the top of this file).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StepKinds {}

/** What every step in a recipe can say, whatever its kind. */
export interface StepBasics {
  /** The step file's name: 'chop' is `steps/chop.ts`. */
  kind: string;
  /** Overrides the card's title, such as "Shake the pepper!". */
  title?: string;
  /** Overrides Chef Bunny's two-line hint. */
  hint?: [string, string];
  /** Overrides the emoji on the card and in the recipe along the top. */
  icon?: string;
  /**
   * Minutes this step takes on the kitchen clock. Leave it out for the
   * kind's usual (DEFAULT_MINUTES in kit/clock.ts: chop 5, bake 15...).
   */
  minutes?: number;
}

/** One step of a recipe: `{ kind: 'chop', item: 'carrot' }`. */
export type RecipeStep = StepKinds[keyof StepKinds];

/**
 * Every art role an ingredient can play, by name. Empty here: each step file
 * adds the roles it draws with (see the top of this file).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IngredientArt {}

/** What every ingredient has. */
export interface IngredientBasics {
  /** The file name: `ingredients/carrot.ts` has the id 'carrot'. */
  id: string;
  /** Its name in a title, without "the": "Chop the carrot!". */
  label: string;
  /** Its name for more than one: "Crack the eggs!". Defaults to `label` + 's'. */
  plural?: string;
  /** Its emoji, for the step card and the recipe along the top. */
  icon: string;
  /** Its colours, for crumbs, splashes and sparkles. At least one. */
  colors: string[];
  /**
   * A real amount for one pour or shake of it, shown by the meter: "1 cup",
   * "¼ teaspoon". A recipe can say its own (`amounts` on pour, `amount` on season).
   */
  amount?: string;
}

/**
 * An ingredient: anything a recipe names, from a carrot to the pot it's
 * cooked in. It has the basics, and art for each role it can play.
 */
export type Ingredient = IngredientBasics & Partial<IngredientArt>;

/**
 * A dish: a whole recipe, cooked step by step. Each dish lives in its own
 * file in `dishes/`, as that file's default export, and `dishes/index.ts`
 * finds it.
 */
export interface Dish {
  /** Matches the file name: `dishes/pizza.ts` has the id 'pizza'. */
  id: string;
  /** The name on the end card, and what Chef Bunny says you made. */
  name: string;
  /** The steps, in the order you cook them, each with what it uses. */
  steps: RecipeStep[];
  /**
   * Steps that could just as well be cooked in either order, as indices into
   * `steps`, each group next to each other: `[[0, 1]]` when it doesn't matter
   * whether the strawberry or the banana is chopped first. Putting the
   * recipe in order (activities/recipe-order.ts) takes any order within a
   * group; the cooking itself keeps `steps`' order.
   */
  either?: number[][];
  /**
   * A surprise dish: it isn't picked at random, and its page in the recipe
   * book stays wrapped, until every other dish has its sticker
   * (`playableDishes` in ranks.ts). The Birthday Cake is one.
   */
  locked?: boolean;
  /**
   * Draws the finished dish, centred on the origin, about 240 wide and 160
   * tall, for the end card. `state` is the round that made it, or null for a
   * dish nobody has cooked yet. `time` is in seconds, for steam and wobbles.
   */
  draw(g: G, time: number, state: KitchenState | null): void;
}

/** A step of the round being cooked: its recipe options and its own state. */
export interface StepRun<O extends StepBasics = StepBasics, S = unknown> {
  kind: string;
  options: O;
  state: S;
}

/** A round in the kitchen, from the first step to the end card. */
export interface KitchenState {
  dish: Dish;
  /** One per recipe step, each with the state its step's `start` made. */
  steps: StepRun[];
  /** Index into `steps` of the step being cooked. */
  stepIndex: number;
  /** Points per step, in recipe order, before bonuses. */
  scores: number[];
  bonus: number;
  /** Perfect actions in a row; any other action resets it. */
  combo: number;
  /** Seconds left of the step's title card. Steps take no input until it's 0. */
  banner: number;
  feedback: Feedback | null;
  phase: 'playing' | 'over';
  /** The kitchen clock when the round started, in minutes since midnight (see kit/clock.ts). */
  start: number;
  /** The round's learning moment, if any, and the grown-ups' settings (see kit/learn.ts). */
  learn: LearnRound;
}

/** Level 1 is early 2nd grade, Level 2 late 2nd grade. */
export type Level = 1 | 2;

/** What a grown-up chose in the grown-ups' settings. */
export interface LearnSettings {
  /** One learning moment (math or reading) woven into each round. */
  learning: boolean;
  level: Level;
  /** Step cards and questions show their text, and the voice only reads when asked. */
  readMyself: boolean;
}

/** How a learning question went: right on her own, or after Chef Bunny showed the answer. */
export type Outcome = 'right' | 'helped';

/** The learning side of a round. */
export interface LearnRound {
  settings: LearnSettings;
  /** The activity woven into this round (its file name in activities/), or null. */
  activity: string | null;
  /** Each learning question answered so far, in order. */
  answers: Outcome[];
}

/** What a step's rules get: the round, and this step's options and state. */
export interface Turn<O extends StepBasics = StepBasics, S = unknown> {
  /** The whole round: for scoring, finishing, and looking at earlier steps. */
  round: KitchenState;
  options: O;
  state: S;
  /**
   * The canvas's shape, when the game knows it ('page' if left out, as in
   * most tests): for a step whose buttons are bigger on a phone, so its
   * `press` hits the same boxes its `draw` shows.
   */
  shape?: Shape;
}

/** The pointer, in scene units. */
export interface Pointer {
  x: number;
  y: number;
  down: boolean;
}

export type ParticleShape = 'star' | 'heart' | 'dot' | 'confetti' | 'shell' | 'salt';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  max: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rot: number;
  spin: number;
}

/** Sounds and sparkles a step can set off while it watches its state. */
export interface Effects {
  /** Sound effects; see sound.ts. `tone`, `hiss` and `chime` make new ones. */
  sound: Sound;
  /**
   * Sparkles for a scored action, sized by its grade, and Chef Bunny cheers
   * or nods. Uses the round's popup unless given one; does nothing without.
   */
  celebrate(x: number, y: number, feedback?: Feedback | null): void;
  /** Throws `count` particles from (x, y), cycling through shapes and colours. */
  burst(
    x: number,
    y: number,
    count: number,
    shapes: ParticleShape[],
    colors: string[],
    speed?: number,
    gravity?: number,
  ): void;
  /** Adds one particle, such as a grain of salt. */
  add(particle: Particle): void;
  /** Chef Bunny stops cheering (say, while an egg is still falling). */
  calm(): void;
}

/** What a step's drawing and `observe` get, every frame. */
export interface StepView<O extends StepBasics = StepBasics, S = unknown, F = unknown> extends Turn<
  O,
  S
> {
  /** Draws in scene units: 800×500, (0, 0) at the scene's top left. */
  g: G;
  /** Seconds since the kitchen opened, for bobbing, wobbling and glowing. */
  t: number;
  /** Seconds since the last frame. */
  dt: number;
  pointer: Pointer;
  /** Whether the round is taking input: playing, and the title card has gone. */
  taking: boolean;
  /** The canvas's shape. 'tall' is a phone held upright: see README. */
  shape: Shape;
  /** This step's own memory for effects, made by its `fx`. */
  fx: F;
  /** Another step's effect memory, for a step that shows what an earlier one did. */
  fxOf<T>(run: StepRun): T | undefined;
  effects: Effects;
}

/**
 * A kind of step: one mini-game. Each lives in its own file in `steps/`, as
 * that file's default export, and `steps/index.ts` finds it.
 *
 * The rules (`start`, `press`, `move`, `release`, `update`, `points`,
 * `progress`) never touch the canvas, so they're tested without a browser.
 * The rest (`fx`, `observe`, `draw`) only run in the browser.
 */
export interface Step<O extends StepBasics = StepBasics, S = unknown, F = unknown> {
  /** Matches the file name: `steps/chop.ts` has the kind 'chop'. */
  kind: O['kind'];
  /** The ingredients these options name, and the art role each must have. */
  uses(options: O): [id: string, role: keyof IngredientArt][];
  /** This step's state, before it starts. Roll anything random here. */
  start(options: O, random: () => number): S;
  /** The card's title, such as "Chop the carrot!". */
  title(options: O): string;
  /** Chef Bunny's two-line hint, such as ["Tap when the knife", "is on a dotted line!"]. */
  hint(options: O): [string, string];
  /** The emoji on the card and in the recipe along the top. */
  icon(options: O): string;
  /** The stars under the cooking: how many actions in all, and how many done. */
  progress(turn: Turn<O, S>): [total: number, done: number];
  /** Points earned so far in this step, for the score in the corner. */
  points?(turn: Turn<O, S>): number;
  /** A tap or the start of a hold. Return false for "Not yet!": nothing happened. */
  press?(turn: Turn<O, S>, x: number, y: number): boolean | void;
  /** The pointer moving while it's held down. */
  move?(turn: Turn<O, S>, x: number, y: number): void;
  /** Letting go. Return 'not yet' for "Not yet!", or the points it scored. */
  release?(turn: Turn<O, S>): number | 'not yet' | null | void;
  /** Advances the step by `dt` seconds. */
  update?(turn: Turn<O, S>, dt: number): void;
  /** Fresh memory for effects, such as when the last chop was. */
  fx?(): F;
  /**
   * Watches the state each frame to play sounds and throw sparkles. Runs for
   * this step from when it starts to the end of the round, so effects that
   * outlast the step (an egg still falling) can finish.
   */
  observe?(view: StepView<O, S, F>): void;
  /** Draws the step on the scene. Chef Bunny, the HUD and popups go on top. */
  draw(view: StepView<O, S, F>): void;
  /**
   * A learning moment (a question, an order ticket) rather than cooking: its
   * card says "Learning time!" instead of a step number, it isn't in the recipe
   * along the top, and it doesn't count toward the cooking score or stars.
   */
  learning?: boolean;
  /**
   * Chef Bunny's two lines right now, instead of the hint: for a step whose
   * hint changes as it goes, such as a question after a wrong try.
   */
  bubble?(turn: Turn<O, S>): [string, string] | null;
  /**
   * For tests: does what a cook who knows the answer would do, such as
   * tapping the right answer. Learning steps have one, so `playThrough` can
   * finish any round.
   */
  solve?(turn: Turn<O, S>): void;
}
