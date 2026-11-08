import { earnSticker, recordScore, stickersFor, theme, type CarnivalGame } from '../../carnival';
import { bookButtonFor, bookPlaces, cellAt, inBox } from './book';
import {
  createDecor,
  decorMove,
  decorPlaces,
  decorPress,
  decorRelease,
  decorTick,
  type DecorState,
} from './decorate';
import { DISHES } from './dishes';
import {
  BANNER_TIME,
  FEEDBACK_TIME,
  STEP_POINTS,
  currentRun,
  currentTurn,
  type Dish,
  type KitchenState,
  type Pointer,
} from './kit';
import { NARROW, layoutFor, sameLayout, toScene } from './layout';
import { createRenderer } from './render';
import { createSound } from './sound';
import { stepOf } from './steps';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

/**
 * The round: which dish, its steps, the score, and passing the pointer and
 * the clock to the step being cooked. Each kind of step is its own file in
 * steps/, each dish in dishes/, each ingredient in ingredients/; the shared
 * rules are in kit/. See README.md.
 */

/**
 * Picks the next dish at random. Never the same dish twice in a row, so
 * every round feels new.
 */
export function pickDish(random: () => number = Math.random, previous?: Dish): Dish {
  const choices = DISHES.filter((dish) => dish.id !== previous?.id);
  return choices[Math.floor(random() * choices.length) % choices.length];
}

/** A new round of `dish`. Every step rolls what's random about it now. */
export function createState(dish: Dish, random: () => number = Math.random): KitchenState {
  const steps = dish.steps.map((options) => ({
    kind: options.kind,
    options,
    state: stepOf(options.kind).start(options, random),
  }));
  return {
    dish,
    steps,
    stepIndex: 0,
    scores: steps.map(() => 0),
    bonus: 0,
    combo: 0,
    banner: BANNER_TIME,
    feedback: null,
    phase: 'playing',
  };
}

/** The kind of step being cooked, such as 'chop'. */
export function currentKind(state: KitchenState): string {
  return currentRun(state).kind;
}

export function totalScore(state: KitchenState): number {
  return state.scores.reduce((sum, points) => sum + points, 0) + state.bonus;
}

/** The score so far, counting points already earned in the step being cooked. */
export function liveScore(state: KitchenState): number {
  if (state.phase === 'over') return totalScore(state);
  const turn = currentTurn(state);
  const running = stepOf(currentKind(state)).points?.(turn) ?? 0;
  return totalScore(state) + Math.round(running);
}

/** The most a round can score, before combo bonuses. */
export function maxScore(state: KitchenState): number {
  return state.steps.length * STEP_POINTS;
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

/** The sticker a finished round earns: its dish, at its stars. */
export function stickerFor(state: KitchenState): { id: string; level: number } {
  return { id: state.dish.id, level: starsFor(totalScore(state), maxScore(state)) };
}

/**
 * What the end card says about the round's sticker: a dish's first sticker,
 * more stars than before, or nothing new.
 */
export type StickerNews = 'new' | 'better' | null;

export function stickerNews(before: number | undefined, earned: boolean): StickerNews {
  if (!earned) return null;
  return before === undefined ? 'new' : 'better';
}

/** Whether the step being cooked: playing, and its card has gone. */
function taking(state: KitchenState): boolean {
  return state.phase === 'playing' && state.banner === 0;
}

/**
 * Presses the pointer at (x, y), doing whatever the step being cooked does
 * on a press. Returns false for a tap that came too early ("Not yet!"): the
 * egg, the topping or the heart wasn't near its spot yet, so nothing happened.
 */
export function press(state: KitchenState, x: number, y: number): boolean {
  if (!taking(state)) return true;
  return stepOf(currentKind(state)).press?.(currentTurn(state), x, y) !== false;
}

/** Moves the held-down pointer to (x, y): stirring, mostly. */
export function move(state: KitchenState, x: number, y: number): void {
  if (!taking(state)) return;
  stepOf(currentKind(state)).move?.(currentTurn(state), x, y);
}

/**
 * Lets go of the pointer: lifts the spoon, stops pouring, takes the pizza
 * out. Returns the points that scored, 'not yet' for a let-go that came too
 * soon ("Not yet!"), or null.
 */
export function release(state: KitchenState): number | 'not yet' | null {
  if (!taking(state)) return null;
  return stepOf(currentKind(state)).release?.(currentTurn(state)) ?? null;
}

/** Advances the game by `dt` seconds. */
export function tick(state: KitchenState, dt: number): void {
  if (state.feedback) {
    state.feedback.age += dt;
    if (state.feedback.age >= FEEDBACK_TIME) state.feedback = null;
  }
  if (state.phase !== 'playing') return;
  if (state.banner > 0) {
    state.banner = Math.max(0, state.banner - dt);
    return;
  }
  stepOf(currentKind(state)).update?.(currentTurn(state), dt);
}

export const carnivalKitchen: CarnivalGame = {
  id: 'carnival-kitchen',
  name: 'Carnival Kitchen',
  description:
    'Cook a surprise dish with Chef Bunny, from pizza to sushi. Sharp timing and perfect streaks score the most.',

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
    // The title screen waits for a tap to start cooking; the recipe book
    // opens from it; the kitchen is where the cooking (and decorating) is.
    let screen: 'title' | 'book' | 'kitchen' = 'title';
    let lastDish: Dish | undefined;
    let scoreRecorded = false;
    // The finished dish's decorations, and the round's sticker news.
    let decor: DecorState = createDecor();
    let sticker: StickerNews = null;
    // The stickers the recipe book shows, read when it opens.
    let bookStickers: Record<string, number> = {};
    const pointer: Pointer = { x: WIDTH / 2, y: HEIGHT / 2, down: false };
    const sound = createSound();
    const renderer = createRenderer(ctx, sound);

    // The finger (or mouse) that's holding the spoon or the shaker. Other
    // fingers moving or lifting don't touch its gesture; a new tap takes over.
    let activePointer: number | null = null;

    /**
     * Saves a finished round's score and earns its dish's sticker, once,
     * before anything can replace the round.
     */
    const saveScore = () => {
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(carnivalKitchen.id, totalScore(state));
        const { id, level } = stickerFor(state);
        const before = stickersFor(carnivalKitchen.id)[id];
        sticker = stickerNews(before, earnSticker(carnivalKitchen.id, id, level));
        scoreRecorded = true;
      }
    };

    /** Whether the finished dish is being decorated, before the stars. */
    const decorating = () => state.phase === 'over' && !decor.done;

    /** Starts cooking `dish`, or the next dish picked at random. */
    const newRound = (dish?: Dish) => {
      lastDish = dish ?? pickDish(Math.random, lastDish);
      state = createState(lastDish);
      scoreRecorded = false;
      decor = createDecor();
      sticker = null;
      screen = 'kitchen';
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
    /** A tap on the recipe book: an earned dish cooks it, anywhere else closes it. */
    const tapBook = (x: number, y: number) => {
      const i = cellAt(bookPlaces(layout, DISHES.length).cells, x, y);
      const dish = DISHES[i] as Dish | undefined;
      if (dish && (bookStickers[dish.id] ?? 0) >= 1) {
        sound.pop();
        newRound(dish);
      } else {
        sound.whoosh();
        screen = 'title';
      }
    };
    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      const at = track(event);
      sound.unlock();
      if (screen === 'book') {
        tapBook(at.x, at.y);
        return;
      }
      if (renderer.hitHomeButton(at.x, at.y)) {
        location.hash = '#/';
        return;
      }
      if (renderer.hitSoundButton(at.x, at.y)) {
        sound.toggle();
        return;
      }
      if (screen === 'title' && inBox(bookButtonFor(layout), at.x, at.y, 8)) {
        sound.pop();
        bookStickers = stickersFor(carnivalKitchen.id);
        screen = 'book';
        return;
      }
      pointer.down = true;
      activePointer = event.pointerId;
      if (screen === 'title') {
        // A tap starts cooking a dish picked at random. It also unlocks sound
        // and speech, which browsers only allow after a tap.
        newRound();
      } else if (decorating()) {
        const places = decorPlaces(layout.shape);
        const did = decorPress(decor, places, pointer.x, pointer.y);
        if (did === 'pick') sound.pop();
        if (did === 'place') renderer.sparkle(pointer.x, pointer.y);
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
      if (!pointer.down) return;
      if (decorating()) decorMove(decor, pointer.x, pointer.y);
      else move(state, pointer.x, pointer.y);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      pointer.down = false;
      if (decorating()) {
        const did = decorRelease(decor, decorPlaces(layout.shape));
        if (did === 'place') renderer.sparkle(pointer.x, pointer.y);
        if (did === 'select' || did === 'unselect') sound.pop();
        if (did === 'remove') sound.whoosh();
      } else if (release(state) === 'not yet') {
        renderer.notYet(pointer.x, pointer.y);
      }
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
      if (screen === 'title') {
        renderer.drawTitle(dt);
      } else if (screen === 'book') {
        renderer.drawBook(dt, bookStickers);
      } else {
        tick(state, dt);
        saveScore();
        if (decorating()) decorTick(decor, dt);
        renderer.draw(state, pointer, dt, { decor, sticker });
      }
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
