import {
  coinsFor,
  earnCoins,
  earnSticker,
  recordScore,
  stickersFor,
  theme,
  type CarnivalGame,
} from '../../carnival';
import { planRound } from './activities';
import { bookButtonFor, bookPlaces, cellAt, inBox, trophyAt } from './book';
import {
  BOSSES,
  CUSTOMERS,
  afterDish,
  bossDishes,
  bossDue,
  claimTrophy,
  createTill,
  createVisit,
  nextDish,
  paidCoins,
  pickGuest,
  roundCoins,
  trophiesOf,
  withGuest,
  type Guest,
  type Visit,
} from './customers';
import {
  moveSurprise,
  planSurprise,
  pressSurprise,
  releaseSurprise,
  settleSurprise,
  tickSurprise,
} from './chaos';
import {
  createDecor,
  decorMove,
  decorPlaces,
  decorPress,
  decorRelease,
  decorTick,
  type DecorState,
} from './decorate';
import type { DISHES } from './dishes';
import {
  GEAR_HOLD,
  grownupPlaces,
  grownupTap,
  loadSettings,
  onGear,
  saveSetting,
  withSetting,
  type GrownupSettings,
} from './grownups';
import {
  CARD_SKIP_AFTER,
  FEEDBACK_TIME,
  STEP_POINTS,
  bannerTime,
  currentRun,
  currentTurn,
  plainPlan,
  smartChef,
  smartSticker,
  startLearn,
  startTime,
  type Dish,
  type KitchenState,
  type Pointer,
  type RoundPlan,
} from './kit';
import { fillsScreen, isTouchDevice, layoutFor, sameLayout, toScene, type Shape } from './layout';
import {
  bookDishes,
  ceremonyDue,
  chefPoints,
  loadCelebrated,
  openDishes,
  playableDishes,
  rankFor,
  rewardsFor,
  saveCelebrated,
  surpriseHint,
} from './ranks';
import { createRenderer, type RoundEnd, type StageKind, type StandEnd } from './render';
import { createShop, pressShop, shopPlaces, titlePlaces } from './shop';
import { createSound } from './sound';
import { stepOf } from './steps';
import { loadOutfit, ownSticker, saveOutfit, type Outfit } from './wardrobe';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

/** The most canvas pixels per CSS pixel, whatever the screen's density. */
export const MOST_PIXELS = 2;

/**
 * The round: which dish, its steps, the score, and passing the pointer and
 * the clock to the step being cooked. Each kind of step is its own file in
 * steps/, each dish in dishes/, each ingredient in ingredients/; the shared
 * rules are in kit/. See README.md.
 */

/**
 * Picks the next dish at random from `dishes` (the dishes open from the
 * start, unless the surprise is unlocked: `playableDishes` in ranks.ts).
 * Never the same dish twice in a row, so every round feels new.
 */
export function pickDish(
  random: () => number = Math.random,
  previous?: Dish,
  dishes: typeof DISHES = openDishes(),
): Dish {
  const choices = dishes.filter((dish) => dish.id !== previous?.id);
  return choices[Math.floor(random() * choices.length) % choices.length];
}

/**
 * A new round of `dish`. Every step rolls what's random about it now. `plan`
 * (from `planRound` in activities/) weaves in a learning moment and carries
 * the grown-ups' settings and the clock's start; without one, the round is
 * the dish's own recipe with no learning, starting at a random time.
 */
export function createState(
  dish: Dish,
  random: () => number = Math.random,
  plan: RoundPlan = plainPlan(dish),
): KitchenState {
  const steps = plan.steps.map((options) => ({
    kind: options.kind,
    options,
    state: stepOf(options.kind).start(options, random),
  }));
  const state: KitchenState = {
    dish,
    steps,
    stepIndex: 0,
    scores: steps.map(() => 0),
    bonus: 0,
    combo: 0,
    banner: 0,
    feedback: null,
    phase: 'playing',
    start: plan.start ?? startTime(plan.settings.level, random),
    learn: startLearn(plan),
  };
  state.banner = bannerTime(state);
  return state;
}

/** Whether a step of the round is a learning step (a ticket, a question), not cooking. */
export function isLearning(state: KitchenState, index: number): boolean {
  const run = state.steps[index] as KitchenState['steps'][number] | undefined;
  return !!run && !!stepOf(run.kind).learning;
}

/** The indices of the round's cooking steps: the recipe along the top, and its step numbers. */
export function cookingSteps(state: KitchenState): number[] {
  return state.steps.flatMap((_, i) => (isLearning(state, i) ? [] : [i]));
}

/**
 * In "Read it myself" mode a step's card waits with this many seconds left
 * until it's tapped (or read out by its speaker), so it never closes under
 * her finger while she's still reading. Let go, it closes in this long.
 */
export const CARD_HOLD = 1;

/**
 * Lets a waiting "Read it myself" card go: it closes by itself in a moment.
 * Used once its speaker has finished reading it out.
 */
export function releaseCard(state: KitchenState): void {
  if (state.banner > 0) state.banner = Math.min(state.banner, CARD_HOLD - 1e-3);
}

/**
 * Keeps a "Read it myself" card up while its speaker reads it, closing a
 * moment after the reading ends (see `releaseCard`).
 */
export function holdCard(state: KitchenState): void {
  if (state.banner > 0) state.banner = Math.max(state.banner, CARD_HOLD - 1e-3);
}

/**
 * In "Read it myself" mode, a tap on a step's card once it has been up a
 * moment moves on to the step. Returns whether it did.
 */
export function skipCard(state: KitchenState): boolean {
  if (!state.learn.settings.readMyself || state.banner <= 0) return false;
  if (bannerTime(state) - state.banner < CARD_SKIP_AFTER - 1e-9) return false;
  state.banner = 0;
  return true;
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

/** The most a round can score, before bonuses: its cooking steps (learning steps score nothing). */
export function maxScore(state: KitchenState): number {
  return cookingSteps(state).length * STEP_POINTS;
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
export function press(state: KitchenState, x: number, y: number, shape?: Shape): boolean {
  if (!taking(state)) return true;
  // A kitchen surprise (chaos/) that's on takes the tap: the step waits.
  if (pressSurprise(state, x, y, shape)) return true;
  const pressed = stepOf(currentKind(state)).press?.({ ...currentTurn(state), shape }, x, y);
  settleSurprise(state);
  return pressed !== false;
}

/** Moves the held-down pointer to (x, y): stirring, mostly. */
export function move(state: KitchenState, x: number, y: number, shape?: Shape): void {
  if (!taking(state)) return;
  if (moveSurprise(state, x, y, shape)) return;
  stepOf(currentKind(state)).move?.({ ...currentTurn(state), shape }, x, y);
}

/**
 * Lets go of the pointer: lifts the spoon, stops pouring, takes the pizza
 * out. Returns the points that scored, 'not yet' for a let-go that came too
 * soon ("Not yet!"), or null. `shape` (on press and move too) is the
 * canvas's, for steps whose buttons are bigger on a phone.
 */
export function release(state: KitchenState, shape?: Shape): number | 'not yet' | null {
  // A surprise hears every let-go (so it knows nobody's holding on), and takes it while it's on.
  const surprised = releaseSurprise(state);
  if (!taking(state) || surprised) return null;
  const released = stepOf(currentKind(state)).release?.({ ...currentTurn(state), shape }) ?? null;
  settleSurprise(state);
  return released;
}

/**
 * A gesture the browser took away (pointercancel: a system swipe, a call):
 * a hold (pouring, shaking, baking) just stops, scoring nothing and using
 * nothing up; anything else lets go as `release` does, so a dragged card or
 * treat is put down.
 */
export function cancel(state: KitchenState, shape?: Shape): number | 'not yet' | null {
  if (!taking(state)) return null;
  const held = currentRun(state).state as { holding?: unknown } | null;
  if (held && typeof held === 'object' && held.holding === true) {
    held.holding = false;
    releaseSurprise(state);
    return null;
  }
  return release(state, shape);
}

/** Advances the game by `dt` seconds. */
export function tick(state: KitchenState, dt: number): void {
  if (state.feedback) {
    state.feedback.age += dt;
    if (state.feedback.age >= FEEDBACK_TIME) state.feedback = null;
  }
  if (state.phase !== 'playing') return;
  if (state.banner > 0) {
    // Read it myself: the card waits at CARD_HOLD until it's tapped or read out.
    const waits = state.learn.settings.readMyself && state.banner >= CARD_HOLD;
    state.banner = Math.max(waits ? CARD_HOLD : 0, state.banner - dt);
    tickSurprise(state, dt);
    return;
  }
  // While a kitchen surprise is on, the step waits: no timer runs, no meter fills.
  if (tickSurprise(state, dt)) return;
  stepOf(currentKind(state)).update?.(currentTurn(state), dt);
  settleSurprise(state);
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
    // What the canvas is, for a screen reader.
    const label = canvas.getAttribute('aria-label');
    canvas.setAttribute(
      'aria-label',
      'Carnival Kitchen: cook a surprise dish step by step with Chef Bunny. Tap, hold and drag to chop, pour, stir and bake.',
    );
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

    /** What the browser says about this device, for the layout. */
    const device = () => ({
      coarse: touchScreen.matches,
      touchPoints: navigator.maxTouchPoints || 0,
      platform: navigator.platform || '',
      viewWidth: window.innerWidth,
    });

    // On a phone or tablet the first tap also asks for real full screen,
    // hiding the browser's bars, where the browser allows it (an iPad or an
    // Android phone does; an iPhone doesn't, and the canvas just fills the
    // page). Asked once; if she leaves full screen it isn't asked again. Left
    // when the game stops.
    let askedFullScreen = false;
    const page = document.documentElement;
    const enterFullScreen = () => {
      if (askedFullScreen || document.fullscreenElement || !isTouchDevice(device())) return;
      askedFullScreen = true;
      const ask =
        page.requestFullscreen?.bind(page) ??
        (
          page as { webkitRequestFullscreen?: () => Promise<void> | void }
        ).webkitRequestFullscreen?.bind(page);
      try {
        const asked = ask?.();
        if (asked instanceof Promise) asked.catch(() => undefined);
      } catch {
        // Not allowed here: the canvas still fills the page.
      }
    };
    const leaveFullScreen = () => {
      if (askedFullScreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
    };

    let layout = layoutFor(0, 0, false);
    /** Sizes the canvas for the screen as it is now: shape, then sharpness. */
    const fit = () => {
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;
      const full = fillsScreen(device());
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
      // Canvas pixels per unit: as many as the screen shows, but at most 2
      // per CSS pixel (and 3 per unit). A 3× phone at full density would mean
      // over twice the pixels to paint every frame, for art that looks the same.
      const shown = full
        ? Math.min(viewWidth / next.width, viewHeight / next.height)
        : canvas.getBoundingClientRect().width / next.width || 1;
      const density = Math.min(MOST_PIXELS, window.devicePixelRatio || 1);
      const pixels = Math.min(3, Math.max(1, shown * density));
      const width = Math.round(next.width * pixels);
      const height = Math.round(next.height * pixels);
      if (sameLayout(layout, next) && canvas.width === width && canvas.height === height) return;
      layout = next;
      canvas.width = width;
      canvas.height = height;
      renderer.setLayout(layout, pixels);
    };

    let state = createState(pickDish());
    // The food stand: the guest being cooked for, and this session's visits
    // so far (a boss never comes in the first two, or twice in a row).
    let visit: Visit | null = null;
    let stand: StandEnd | null = null;
    let visits = 0;
    let lastGuest: Guest | null = null;
    let lastBoss: Guest | null = null;
    let lastWasBoss = false;
    // A stand scene showing between rounds (a guest arriving, a boss, the trophy).
    let staging: StageKind | null = null;
    // The longest perfect streak this round, for the customer's tip.
    let streak = 0;
    // Earns each round's coins once, however often it's asked.
    const till = createTill();
    // The title screen waits for a tap to start cooking; the recipe book
    // opens from it; the kitchen is where the cooking (and decorating) is.
    let screen: 'title' | 'book' | 'grownups' | 'kitchen' | 'shop' | 'ceremony' = 'title';
    // The grown-ups' settings, remembered between visits.
    let settings: GrownupSettings = loadSettings();
    // The last round's learning activity, so the next one is different.
    let lastActivity: string | null = null;
    // Rounds started this visit: the first never has a kitchen surprise.
    let rounds = 0;
    // Seconds the grown-ups' gear has been held on the title screen, or null.
    let gearHeld: number | null = null;
    // The dish spinner is showing which dish was picked. The round waits,
    // its card's clock stopped, until it's done.
    let spinning = false;
    let lastDish: Dish | undefined;
    let scoreRecorded = false;
    // The finished dish's decorations, and the round's sticker news.
    let decor: DecorState = createDecor();
    let sticker: StickerNews = null;
    // Whether the round earned its dish's Smart Chef star.
    let smart = false;
    // The stickers the recipe book shows, read when it opens.
    let bookStickers: Record<string, number> = {};
    const pointer: Pointer = { x: WIDTH / 2, y: HEIGHT / 2, down: false };
    const sound = createSound();
    const renderer = createRenderer(ctx, sound);

    // What she has: stickers, coins, chef points and rank, read again
    // whenever they may have changed (`refresh`); what she wears and has put
    // up in the kitchen; and the last rank celebrated.
    let stickers: Record<string, number> = {};
    let coins = 0;
    let points = 0;
    let rank = 0;
    const refresh = () => {
      stickers = stickersFor(carnivalKitchen.id);
      coins = coinsFor(carnivalKitchen.id);
      points = chefPoints(stickers);
      rank = rankFor(points);
    };
    refresh();
    let outfit: Outfit = loadOutfit(stickers, rank);
    renderer.setOutfit(outfit);
    let celebrated = loadCelebrated();
    // The shop and wardrobe page.
    let shop = createShop();
    // What happens once the rank ceremony is done: cooking.
    let afterCeremony: (() => void) | null = null;

    /**
     * A new rank to celebrate? Then the ceremony first: the rank's hat goes
     * on and its kitchen goes up, and `then` waits until it's over.
     */
    const celebrateOr = (then: () => void) => {
      refresh();
      const due = ceremonyDue(rank, celebrated);
      if (due === null) {
        then();
        return;
      }
      celebrated = due;
      saveCelebrated(due);
      const { hat, kitchen } = rewardsFor(due);
      if (hat) earnSticker(carnivalKitchen.id, ownSticker(hat.id), 1);
      renderer.startCeremony(due);
      const before = outfit;
      outfit = { ...outfit, hat: hat?.id ?? outfit.hat, kitchen: kitchen?.id ?? outfit.kitchen };
      saveOutfit(outfit, before);
      renderer.setOutfit(outfit);
      afterCeremony = then;
      screen = 'ceremony';
    };

    // The finger (or mouse) that's holding the spoon or the shaker. Other
    // fingers pressing, moving or lifting don't touch its gesture.
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
        smart = smartChef(state);
        if (smart) earnSticker(carnivalKitchen.id, smartSticker(state.dish.id), 1);
        // The customer pays: the coins go in the jar.
        if (stand) {
          noteStreak();
          const coins = roundCoins({ stars: level, streak, smart, paid: paidCoins(state) });
          const jar = coinsFor(carnivalKitchen.id);
          const earned = till.settle(state, coins, (n) => earnCoins(carnivalKitchen.id, n));
          if (earned !== null) stand = { ...stand, coins, before: jar };
        }
        scoreRecorded = true;
      }
    };

    /** Keeps the round's longest perfect streak. */
    const noteStreak = () => {
      streak = Math.max(streak, state.combo);
    };

    /** What the renderer shows after the cooking: decorating, serving, the end card. */
    const roundEnd = (): RoundEnd => ({ decor, sticker, smart, stand: stand ?? undefined });

    /** Shows a stand scene: a guest arriving, a boss, "Dish 2 of 3", or the trophy. */
    const showStage = (kind: StageKind, before = 0) => {
      if (!visit) return;
      staging = kind;
      renderer.startStage(kind, visit, before, settings.readMyself);
    };

    /** Whether the finished dish is being decorated, before the stars. */
    const decorating = () => state.phase === 'over' && !decor.done;

    /**
     * Starts cooking `dish`, or the next dish picked at random. A dish picked
     * at random is shown on the dish spinner first (`spin`), which lands on
     * it; a chosen dish starts straight away unless `spin` says otherwise.
     */
    const cook = (dish: Dish, spin: boolean) => {
      lastDish = dish;
      const plan = planRound(dish, settings, Math.random, lastActivity);
      lastActivity = plan.activity ?? lastActivity;
      // An order ticket comes from the guest, and "the customer pays" is them paying.
      const steps = visit ? withGuest(plan.steps, visit.guest) : plan.steps;
      state = createState(dish, Math.random, { ...plan, steps });
      planSurprise(state, Math.random, { round: rounds, on: settings.surprises });
      rounds += 1;
      scoreRecorded = false;
      decor = createDecor();
      sticker = null;
      smart = false;
      streak = 0;
      stand = visit
        ? { visit, coins: null, before: coinsFor(carnivalKitchen.id), next: afterDish(visit) }
        : null;
      screen = 'kitchen';
      staging = null;
      renderer.reset();
      spinning = spin;
      if (spin) renderer.startSpin(dish, playableDishes(stickersFor(carnivalKitchen.id)));
    };

    /**
     * A new visit to the stand. A customer orders `dish`, or a dish picked at
     * random (from the dishes she can cook: the Birthday Cake once it's
     * unlocked) on the dish spinner, and walks up once it lands. Now and then
     * (never for a dish from the recipe book) a boss comes instead, with a
     * fanfare, and orders three of those dishes.
     */
    const newRound = (dish?: Dish) => {
      const reel = playableDishes(stickersFor(carnivalKitchen.id));
      const boss = dish === undefined && bossDue(visits, Math.random, lastWasBoss);
      visits += 1;
      lastWasBoss = boss;
      if (boss) {
        lastBoss = pickGuest(BOSSES, Math.random, lastBoss);
        visit = createVisit(lastBoss, bossDishes(reel, Math.random, lastDish));
        cook(visit.dishes[0], false);
        showStage('entrance');
        return;
      }
      lastGuest = pickGuest(CUSTOMERS, Math.random, lastGuest);
      const next = dish ?? pickDish(Math.random, lastDish, reel);
      visit = createVisit(lastGuest, [next]);
      cook(next, dish === undefined);
      // With the spinner, they walk up once it lands (see the loop).
      if (dish) showStage('arrive');
    };

    /**
     * After a dish's end card: the boss's next dish, their trophy, or (a new
     * rank's ceremony first, if one is due) a new visit. The ceremony never
     * comes in the middle of a boss's visit.
     */
    const afterRound = () => {
      const after = visit ? afterDish(visit) : 'done';
      if (visit && after === 'next dish') {
        cook(nextDish(visit), false);
        showStage('progress');
      } else if (visit && after === 'trophy') {
        const before = coinsFor(carnivalKitchen.id);
        const wins = trophiesOf(stickersFor(carnivalKitchen.id))[visit.guest.id] ?? 0;
        const prize = claimTrophy(visit, wins);
        if (prize) {
          earnSticker(carnivalKitchen.id, prize.sticker, prize.level);
          earnCoins(carnivalKitchen.id, prize.coins);
        }
        showStage('trophy', before);
      } else {
        celebrateOr(() => newRound());
      }
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
    /**
     * A tap on the recipe book: an earned dish cooks it, and so does the
     * surprise once it's unlocked; the wrapped surprise says how many dishes
     * are left; anywhere else closes it.
     */
    const tapBook = (x: number, y: number) => {
      // A trophy on the shelf: Chef Bunny says whose it is.
      const trophy = trophyAt(layout, x, y, BOSSES.length);
      if (trophy >= 0) {
        renderer.sayTrophy(trophy, trophiesOf(bookStickers)[BOSSES[trophy].id] ?? 0);
        return;
      }
      const dishes = bookDishes();
      const i = cellAt(bookPlaces(layout, dishes.length).cells, x, y);
      const dish = dishes[i] as Dish | undefined;
      const hint = surpriseHint(bookStickers);
      if (dish?.locked && hint) {
        sound.boop();
        sound.say(hint);
      } else if (dish && ((bookStickers[dish.id] ?? 0) >= 1 || dish.locked)) {
        sound.pop();
        newRound(dish);
      } else {
        sound.whoosh();
        screen = 'title';
      }
    };
    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      // A second finger while one is down is ignored: the first keeps its gesture.
      if (activePointer !== null && event.pointerId !== activePointer) return;
      const at = track(event);
      sound.unlock();
      enterFullScreen();
      if (renderer.leaveAsked()) {
        // "Leave the kitchen?": ✓ goes back to the midway, anything else stays.
        if (renderer.leaveTap(at.x, at.y) === 'leave') location.hash = '#/';
        return;
      }
      if (screen === 'book') {
        tapBook(at.x, at.y);
        return;
      }
      if (screen === 'ceremony') {
        // Once it's all been shown, a tap goes on to cooking.
        if (renderer.ceremonyReady()) {
          const then = afterCeremony;
          afterCeremony = null;
          screen = 'title';
          then?.();
        }
        return;
      }
      if (screen === 'shop') {
        const tapped = pressShop(shop, shopPlaces(layout), at.x, at.y, {
          stickers,
          rank,
          outfit,
        });
        renderer.shopEvent(tapped.event, shop);
        if (tapped.outfit !== outfit) {
          saveOutfit(tapped.outfit, outfit);
          outfit = tapped.outfit;
          renderer.setOutfit(outfit);
        }
        if (tapped.event?.kind === 'bought') refresh();
        if (tapped.event?.kind === 'close') screen = 'title';
        return;
      }
      if (screen === 'grownups') {
        const tap = grownupTap(grownupPlaces(layout), at.x, at.y);
        if (tap === 'close') {
          sound.whoosh();
          screen = 'title';
        } else if (tap) {
          sound.pop();
          settings = withSetting(settings, tap);
          saveSetting(tap.key, settings[tap.key]);
        }
        return;
      }
      if (renderer.hitHomeButton(at.x, at.y)) {
        // A stray tap on 🏠 mustn't end the round: it asks first.
        renderer.askLeave();
        return;
      }
      if (renderer.hitSoundButton(at.x, at.y)) {
        sound.toggle();
        return;
      }
      if (spinning) {
        // Taps can't stop the spinner, but once it has landed one skips the wait.
        renderer.skipSpin();
        return;
      }
      if (staging) {
        // A guest arriving, a boss, the trophy: a tap moves on once it has
        // shown a moment. Read it myself: the arrival's 🔊 reads the order.
        if (renderer.hitStageSpeaker(at.x, at.y)) renderer.readStage();
        else renderer.skipStage();
        return;
      }
      if (screen === 'kitchen' && state.phase === 'playing' && renderer.hitBadge(at.x, at.y)) {
        // The dish's badge: Chef Bunny says what we're making. Not a step press.
        renderer.sayDish(state.dish);
        return;
      }
      if (screen === 'title' && onGear(layout, at.x, at.y)) {
        // Held long enough, it opens the grown-ups' settings (see the loop).
        gearHeld = 0;
        activePointer = event.pointerId;
        pointer.down = true;
        return;
      }
      if (
        screen === 'kitchen' &&
        state.phase === 'playing' &&
        state.banner > 0 &&
        state.learn.settings.readMyself
      ) {
        // Read it myself: the card's speaker reads it out; a tap elsewhere moves on.
        if (renderer.hitCardSpeaker(at.x, at.y)) renderer.readCard(state);
        else if (!renderer.cardReading()) skipCard(state);
        return;
      }
      if (screen === 'title' && inBox(bookButtonFor(layout), at.x, at.y, 8)) {
        sound.pop();
        bookStickers = stickersFor(carnivalKitchen.id);
        screen = 'book';
        return;
      }
      if (screen === 'title' && inBox(titlePlaces(layout).shop, at.x, at.y, 8)) {
        sound.pop();
        refresh();
        shop = createShop(shop.tab);
        screen = 'shop';
        return;
      }
      if (screen === 'title' && inBox(titlePlaces(layout).rank, at.x, at.y)) {
        refresh();
        renderer.sayRank(points);
        return;
      }
      pointer.down = true;
      activePointer = event.pointerId;
      if (screen === 'title') {
        // A tap starts cooking a dish picked at random (after the ceremony,
        // if she has a new rank). It also unlocks sound and speech, which
        // browsers only allow after a tap.
        celebrateOr(() => newRound());
      } else if (decorating()) {
        const places = decorPlaces(layout.shape);
        const did = decorPress(decor, places, pointer.x, pointer.y);
        if (did === 'pick') sound.pop();
        if (did === 'place') renderer.sparkle(pointer.x, pointer.y);
      } else if (state.phase === 'over') {
        // While serving, a tap hurries on to the end card. Then a short
        // pause, so a last excited tap doesn't skip the stars.
        if (!renderer.endShown()) {
          renderer.skipServe(roundEnd());
          return;
        }
        saveScore();
        afterRound();
      } else {
        if (!press(state, pointer.x, pointer.y, layout.shape))
          renderer.notYet(pointer.x, pointer.y);
        noteStreak();
      }
    };
    const onMove = (event: PointerEvent) => {
      if (activePointer !== null && event.pointerId !== activePointer) return;
      track(event);
      // The mouse moving without a press still steers a surprise (the sprinkle bowl).
      if (!pointer.down && screen === 'kitchen' && !spinning)
        moveSurprise(state, pointer.x, pointer.y);
      if (!pointer.down) return;
      if (decorating()) decorMove(decor, pointer.x, pointer.y);
      else move(state, pointer.x, pointer.y, layout.shape);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      pointer.down = false;
      if (gearHeld !== null) {
        gearHeld = null;
        return;
      }
      if (decorating()) {
        const did = decorRelease(decor, decorPlaces(layout.shape));
        if (did === 'place') renderer.sparkle(pointer.x, pointer.y);
        if (did === 'select' || did === 'unselect') sound.pop();
        if (did === 'remove') sound.whoosh();
      } else if (event.type === 'pointercancel') {
        // Taken away by the browser: a pour or a bake just stops, unscored.
        cancel(state, layout.shape);
      } else if (release(state, layout.shape) === 'not yet') {
        renderer.notYet(pointer.x, pointer.y);
      }
      noteStreak();
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
    let sinceRefresh = 0;
    // Whether the step card was being read out by its speaker last frame.
    let wasReading = false;
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      // While "Leave the kitchen?" is asked, the round waits.
      const paused = renderer.leaveAsked();
      if (screen === 'title') {
        // Coins and stickers can change elsewhere (the food stand): read them now and then.
        sinceRefresh += dt;
        if (sinceRefresh >= 1) {
          sinceRefresh = 0;
          refresh();
        }
        if (gearHeld !== null && !paused) {
          gearHeld += dt;
          if (gearHeld >= GEAR_HOLD) {
            gearHeld = null;
            sound.pop();
            screen = 'grownups';
          }
        }
        renderer.drawTitle(dt, (gearHeld ?? 0) / GEAR_HOLD, { coins, points });
      } else if (screen === 'book') {
        renderer.drawBook(dt, bookStickers);
      } else if (screen === 'grownups') {
        renderer.drawGrownups(dt, settings);
      } else if (screen === 'shop') {
        renderer.drawShop(dt, shop, { coins, stickers, rank, outfit });
      } else if (screen === 'ceremony') {
        renderer.drawCeremony(dt);
      } else if (spinning) {
        // The round doesn't tick while the spinner runs.
        renderer.drawSpin(dt);
        if (renderer.spinDone()) {
          spinning = false;
          // The customer walks up to the counter and asks for the dish.
          showStage('arrive');
        }
      } else if (staging) {
        renderer.drawStage(dt);
        if (renderer.stageDone()) {
          const shown = staging;
          staging = null;
          // After the trophy, a new rank's ceremony if one is due, then the next visit.
          if (shown === 'trophy') celebrateOr(() => newRound());
        }
      } else {
        // A card being read out by its speaker stays up until it's done, then
        // a moment more.
        const reading = renderer.cardReading();
        if (reading) holdCard(state);
        else if (wasReading) releaseCard(state);
        wasReading = reading;
        if (!paused) {
          tick(state, dt);
          noteStreak();
          saveScore();
          if (decorating()) decorTick(decor, dt);
        }
        renderer.draw(state, pointer, dt, roundEnd());
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      leaveFullScreen();
      sound.close();
      canvas.style.cssText = canvasStyle;
      document.body.style.overflow = bodyOverflow;
      if (label === null) canvas.removeAttribute('aria-label');
      else canvas.setAttribute('aria-label', label);
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
