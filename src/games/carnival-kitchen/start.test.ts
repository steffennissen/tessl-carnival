import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as carnival from '../../carnival';
import type { G } from './art';
import { CIRCLE } from './kit';
import { gearFor } from './grownups';
import { layoutFor } from './layout';
import { leavePlaces, placesFor } from './render';
import { carnivalKitchen } from './game';
import { chefPlaces, judgingTimes, menuPlaces, bestSticker } from './cookoff';
import {
  RANKS,
  bookDishes,
  chefPoints,
  loadCelebrated,
  openDishes,
  rankFor,
  saveCelebrated,
} from './ranks';
import { shopPlaces, titlePlaces } from './shop';
import { itemsOn } from './wardrobe';

/**
 * The game's `start`, run without a browser: a pretend window, document and
 * canvas, pointer events sent by hand, and animation frames run one by one.
 */

vi.mock('../../carnival', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../carnival')>();
  return {
    ...real,
    recordScore: vi.fn(real.recordScore),
    earnCoins: vi.fn(real.earnCoins),
  };
});
// Plain cooking, so a round can be played without answering questions.
vi.mock('./grownups', async (importOriginal) => {
  const real = await importOriginal<typeof import('./grownups')>();
  return { ...real, loadSettings: () => ({ learning: false, level: 1, readMyself: false }) };
});

/** A pretend 2D context that keeps every piece of text drawn. */
function recordingCanvas(texts: string[]): G {
  return new Proxy({} as G, {
    get: (_target, prop) => {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: () => undefined });
      }
      if (prop === 'measureText') return (text: string) => ({ width: text.length * 10 });
      if (prop === 'fillText') return (text: string) => texts.push(text);
      return () => undefined;
    },
    set: () => true,
  });
}

type Listener = (event: Partial<PointerEvent>) => void;

/** A pretend browser: a phone 390×844, held upright, with a finger. */
function phone() {
  const texts: string[] = [];
  const listeners = { window: new Map<string, Listener>(), canvas: new Map<string, Listener>() };
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 1;
  const attributes = new Map<string, string>([['aria-label', 'Old label']]);
  const style: Record<string, unknown> = {
    cssText: '',
    setProperty: () => undefined,
  };
  const canvas = {
    width: 800,
    height: 500,
    style,
    getContext: () => recordingCanvas(texts),
    addEventListener: (type: string, fn: Listener) => listeners.canvas.set(type, fn),
    removeEventListener: (type: string, fn: Listener) => {
      if (listeners.canvas.get(type) === fn) listeners.canvas.delete(type);
    },
    getBoundingClientRect: () => ({
      left: parseFloat(String(style.left ?? 0)),
      top: parseFloat(String(style.top ?? 0)),
      width: parseFloat(String(style.width ?? 390)),
      height: parseFloat(String(style.height ?? 844)),
    }),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    removeAttribute: (name: string) => attributes.delete(name),
  };
  const location = { hash: '#/play/carnival-kitchen' };
  vi.stubGlobal('window', {
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 3,
    matchMedia: () => ({ matches: true }),
    addEventListener: (type: string, fn: Listener) => listeners.window.set(type, fn),
    removeEventListener: (type: string, fn: Listener) => {
      if (listeners.window.get(type) === fn) listeners.window.delete(type);
    },
  });
  vi.stubGlobal('navigator', { maxTouchPoints: 5, platform: 'iPhone' });
  vi.stubGlobal('document', {
    body: { style: {} },
    documentElement: {},
    fullscreenElement: null,
    createElement: () => ({ width: 0, height: 0, getContext: () => recordingCanvas([]) }),
  });
  vi.stubGlobal('location', location);
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    frames.set(nextFrame, fn);
    return nextFrame++;
  });
  const cancelled: number[] = [];
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    cancelled.push(id);
    frames.delete(id);
  });

  let time = performance.now();
  /** Runs `seconds` of animation frames, 50 ms apart. */
  const run = (seconds: number) => {
    for (let i = 0; i < seconds * 20; i++) {
      time += 50;
      const due = [...frames.entries()];
      frames.clear();
      for (const [, fn] of due) fn(time);
    }
  };

  const layout = layoutFor(390, 844, true);
  /** A pointer event at a canvas point, for finger `id`. */
  const at = (x: number, y: number, id = 1): Partial<PointerEvent> => {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: rect.left + (x / layout.width) * rect.width,
      clientY: rect.top + (y / layout.height) * rect.height,
      pointerId: id,
      preventDefault: () => undefined,
    };
  };
  const down = (x: number, y: number, id = 1) =>
    listeners.canvas.get('pointerdown')?.(at(x, y, id));
  const move = (x: number, y: number, id = 1) =>
    listeners.canvas.get('pointermove')?.(at(x, y, id));
  const up = (x: number, y: number, id = 1, type = 'pointerup') =>
    listeners.window.get(type)?.({ ...at(x, y, id), type });
  const tap = (x: number, y: number, id = 1) => {
    down(x, y, id);
    up(x, y, id);
  };
  /** A scene point in canvas units. */
  const scene = (x: number, y: number) => [x + layout.sceneX, y + layout.sceneY] as const;

  return {
    canvas,
    texts,
    listeners,
    frames,
    cancelled,
    attributes,
    location,
    layout,
    run,
    down,
    move,
    up,
    tap,
    scene,
  };
}

/** Cooks the round on screen without knowing its steps, until `done` says it's over. */
function cookUntil(p: ReturnType<typeof phone>, done: () => boolean) {
  const [cx, cy] = p.scene(CIRCLE.x, CIRCLE.y);
  for (let go = 0; go < 400 && !done(); go++) {
    p.down(...p.scene(480, 275));
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      p.move(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
    }
    p.run(0.05 * (1 + (go % 20)));
    p.up(...p.scene(480, 275));
    p.run(0.1);
  }
}

const middleOf = (b: { x: number; y: number; w: number; h: number }) =>
  [b.x + b.w / 2, b.y + b.h / 2] as const;

beforeEach(() => {
  vi.mocked(carnival.recordScore).mockClear();
  vi.mocked(carnival.earnCoins).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('start', () => {
  it('labels the canvas, caps its pixels at 2×, and cleans up after itself', () => {
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    expect(p.attributes.get('aria-label')).toMatch(/Carnival Kitchen/);
    // A 3× phone gets 2 canvas pixels per CSS pixel, not 3.
    const shown = parseFloat(String(p.canvas.style.width));
    expect(p.canvas.width / shown).toBeCloseTo(2, 1);
    expect(p.listeners.canvas.size).toBeGreaterThan(0);
    expect(p.listeners.window.size).toBeGreaterThan(0);
    p.run(0.2);
    stop();
    expect(p.listeners.canvas.size).toBe(0);
    expect(p.listeners.window.size).toBe(0);
    expect(p.frames.size).toBe(0);
    expect(p.cancelled.length).toBeGreaterThan(0);
    expect(p.attributes.get('aria-label')).toBe('Old label');
  });

  it('records the score and earns the coins once per round', () => {
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    // Tap to cook, then wait for the dish spinner, and the customer to order.
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.texts.length = 0;
    // The spinner takes up to 4.6 seconds, and the customer talks once they've walked up.
    p.run(7);
    expect(p.texts.some((text) => text.startsWith("Hi! I'm"))).toBe(true);
    expect(p.texts.some((text) => /^Can I have .+, please\?$/.test(text))).toBe(true);
    p.run(3);
    const [cx, cy] = p.scene(CIRCLE.x, CIRCLE.y);
    const record = vi.mocked(carnival.recordScore);
    // Cook without knowing the steps: taps, holds and stirring circles.
    for (let go = 0; go < 400 && record.mock.calls.length === 0; go++) {
      p.down(...p.scene(480, 275));
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        p.move(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
      }
      p.run(0.05 * (1 + (go % 20)));
      p.up(...p.scene(480, 275));
      p.run(0.1);
    }
    expect(record).toHaveBeenCalledTimes(1);
    // Her best score on the dish is kept, for a cook-off's beat your best.
    const [, score] = record.mock.calls[0];
    const bests = Object.entries(carnival.stickersFor('carnival-kitchen')).filter(([id]) =>
      id.startsWith('best:'),
    );
    expect(bests.some(([, best]) => best >= Math.round(score))).toBe(true);
    const earn = vi.mocked(carnival.earnCoins);
    expect(earn).toHaveBeenCalledTimes(1);
    const [, coins] = earn.mock.calls[0];
    expect(coins).toBeGreaterThanOrEqual(10);
    expect(coins).toBeLessThanOrEqual(40);
    // Decorating, serving the dish, the stars and more frames don't record it again.
    p.texts.length = 0;
    p.run(30);
    expect(p.texts).toContain(`+${coins}`);
    expect(p.texts.some((text) => text.includes(`🪙 +${coins}`))).toBe(true);
    p.tap(...p.scene(400, 250));
    p.run(1);
    expect(record).toHaveBeenCalledTimes(1);
    expect(earn).toHaveBeenCalledTimes(1);
    stop();
  });

  it('ignores a second finger while the first is down', () => {
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    // The first finger holds the grown-ups' gear...
    const gear = gearFor(p.layout);
    p.down(gear.x, gear.y, 1);
    p.run(0.5);
    // ...and a second finger taps "Tap to cook!" and lifts. It's ignored.
    p.tap(p.layout.width / 2, p.layout.height / 2, 2);
    p.texts.length = 0;
    p.run(1.2);
    // The first finger's hold went on, and opened the grown-ups' page.
    expect(p.texts).toContain('⚙️ For grown-ups');
    p.up(gear.x, gear.y, 1);
    stop();
  });

  it('asks before leaving the kitchen when 🏠 is tapped', () => {
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    const home = placesFor(p.layout).home;
    expect(home).not.toBeNull();
    if (!home) return;
    const card = leavePlaces(p.layout);
    p.tap(home.x, home.y);
    p.texts.length = 0;
    p.run(0.5);
    expect(p.texts).toContain('Leave the kitchen?');
    expect(p.location.hash).toBe('#/play/carnival-kitchen');
    // ✕ stays.
    p.tap(card.no.x, card.no.y);
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).not.toContain('Leave the kitchen?');
    expect(p.location.hash).toBe('#/play/carnival-kitchen');
    // ✓ leaves.
    p.tap(home.x, home.y);
    p.run(0.2);
    p.tap(card.yes.x, card.yes.y);
    expect(p.location.hash).toBe('#/');
    stop();
  });

  it('buys a crown in the shop with taps, asking first', () => {
    carnival.earnCoins('carnival-kitchen', 200);
    const before = carnival.coinsFor('carnival-kitchen');
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    const button = titlePlaces(p.layout).shop;
    p.tap(button.x + button.w / 2, button.y + button.h / 2);
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('🛍️ Shop');
    const shop = shopPlaces(p.layout);
    const cell = shop.grid.cells[itemsOn('hats').findIndex((i) => i.id === 'crown')];
    p.tap(cell.x + cell.w / 2, cell.y + cell.h / 2);
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('Buy the Crown?');
    expect(carnival.coinsFor('carnival-kitchen')).toBe(before);
    p.tap(shop.yes.x, shop.yes.y);
    expect(carnival.coinsFor('carnival-kitchen')).toBe(before - 60);
    expect(carnival.stickersFor('carnival-kitchen')['own:crown']).toBe(1);
    expect(carnival.preferencesFor('carnival-kitchen')['wear-hat']).toBe('crown');
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('✓ On');
    // ✕ goes back to the title screen.
    p.tap(shop.close.x, shop.close.y);
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('Tap to cook!');
    stop();
  });

  it('celebrates a new rank once, before cooking', () => {
    carnival.earnSticker('carnival-kitchen', 'pizza', 3);
    carnival.earnSticker('carnival-kitchen', 'soup', 2);
    expect(loadCelebrated()).toBe(0);
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.texts.length = 0;
    p.run(0.5);
    expect(p.texts).toContain('Drumroll...');
    p.texts.length = 0;
    p.run(2);
    expect(p.texts).toContain('⭐ Junior Chef!');
    expect(loadCelebrated()).toBe(1);
    expect(carnival.preferencesFor('carnival-kitchen')['wear-kitchen']).toBe('candy');
    // A tap too soon does nothing; once it's all shown, a tap goes on to cook.
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.run(3);
    p.texts.length = 0;
    p.run(0.1);
    expect(p.texts).toContain('⭐ Junior Chef!');
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.texts.length = 0;
    p.run(0.3);
    expect(p.texts).not.toContain('⭐ Junior Chef!');
    stop();
    // Next time, no ceremony: straight to the dish spinner.
    const again = phone();
    const stop2 = carnivalKitchen.start(again.canvas as unknown as HTMLCanvasElement);
    again.run(0.2);
    again.tap(again.layout.width / 2, again.layout.height / 2);
    again.texts.length = 0;
    again.run(0.5);
    expect(again.texts).not.toContain('Drumroll...');
    stop2();
  });

  it('serves a customer, shows the coins in the shop, and celebrates a new rank before the next customer', () => {
    const id = 'carnival-kitchen';
    // Start one point short of the next rank, with this rank celebrated.
    let points = chefPoints(carnival.stickersFor(id));
    saveCelebrated(rankFor(points));
    const next = RANKS[rankFor(points) + 1];
    const fresh = openDishes().filter((d) => !(carnival.stickersFor(id)[d.id] >= 1));
    const [dish, ...fillers] = fresh;
    for (let i = 0; points < next.points - 2; i++) {
      carnival.earnSticker(id, `smart:filler-${i}`, 1);
      points = chefPoints(carnival.stickersFor(id));
    }
    if (points < next.points - 1) carnival.earnSticker(id, fillers[0].id, 1);
    expect(chefPoints(carnival.stickersFor(id))).toBe(next.points - 1);

    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    // Tap to cook: the spinner lands on a dish without a sticker yet.
    const choices = openDishes();
    const roll = vi
      .spyOn(Math, 'random')
      .mockReturnValue((choices.indexOf(dish) + 0.5) / choices.length);
    p.tap(p.layout.width / 2, p.layout.height / 2);
    roll.mockRestore();
    p.run(10);
    const [cx, cy] = p.scene(CIRCLE.x, CIRCLE.y);
    const record = vi.mocked(carnival.recordScore);
    for (let go = 0; go < 400 && record.mock.calls.length === 0; go++) {
      p.down(...p.scene(480, 275));
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        p.move(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
      }
      p.run(0.05 * (1 + (go % 20)));
      p.up(...p.scene(480, 275));
      p.run(0.1);
    }
    const earn = vi.mocked(carnival.earnCoins);
    expect(earn).toHaveBeenCalledTimes(1);
    expect(carnival.stickersFor(id)[dish.id]).toBeGreaterThanOrEqual(1);
    // Decorating (it times out), serving and the end card; then a tap: the
    // rank's ceremony, before the next customer.
    p.run(30);
    p.tap(...p.scene(400, 250));
    p.texts.length = 0;
    p.run(2.5);
    expect(p.texts).toContain(`${next.icon} ${next.name}!`);
    expect(p.texts.some((text) => text.startsWith("Hi! I'm"))).toBe(false);
    p.run(3);
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.texts.length = 0;
    p.run(7);
    expect(p.texts.some((text) => text.startsWith("Hi! I'm"))).toBe(true);
    expect(earn).toHaveBeenCalledTimes(1);
    stop();

    // Next time on the title screen, the shop's badge and page show the coins earned.
    const jar = String(carnival.coinsFor(id));
    const again = phone();
    const stop2 = carnivalKitchen.start(again.canvas as unknown as HTMLCanvasElement);
    again.run(0.2);
    expect(again.texts).toContain(jar);
    const button = titlePlaces(again.layout).shop;
    again.tap(button.x + button.w / 2, button.y + button.h / 2);
    again.texts.length = 0;
    again.run(0.2);
    expect(again.texts).toContain('🛍️ Shop');
    expect(again.texts.some((text) => text.includes(jar))).toBe(true);
    stop2();
  });

  it('plays a two chefs cook-off: picking chefs, passing the iPad, and the judges', () => {
    const id = 'carnival-kitchen';
    const stickers = carnival.stickersFor(id);
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    p.tap(...middleOf(titlePlaces(p.layout).cookoff));
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('🏆 Cook-off! 🏆');
    p.tap(...middleOf(menuPlaces(p.layout).duo));
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('Player 1: pick your chef!');
    const cells = chefPlaces(p.layout).cells;
    p.tap(...middleOf(cells[0]));
    p.texts.length = 0;
    p.run(0.2);
    expect(p.texts).toContain('Player 2: pick your chef!');
    // Player 1's chef is taken; another one starts the cook-off.
    p.tap(...middleOf(cells[0]));
    p.run(0.2);
    expect(p.texts).toContain('Player 2: pick your chef!');
    p.tap(...middleOf(cells[1]));
    // The spinner, then Player 1's card, which waits for a tap.
    p.texts.length = 0;
    p.run(7);
    expect(p.texts).toContain('Player 1: Chef Fox!');
    expect(p.texts.some((text) => text.startsWith("Hi! I'm"))).toBe(false);
    p.tap(p.layout.width / 2, p.layout.height / 2);
    const record = vi.mocked(carnival.recordScore);
    const earn = vi.mocked(carnival.earnCoins);
    cookUntil(p, () => record.mock.calls.length === 1);
    expect(record).toHaveBeenCalledTimes(1);
    // Decorating times out; then the pass card, with no customer or coins yet.
    p.texts.length = 0;
    p.run(25);
    expect(p.texts).toContain('Pass the iPad to Player 2!');
    expect(earn).not.toHaveBeenCalled();
    p.run(1);
    p.tap(p.layout.width / 2, p.layout.height / 2);
    cookUntil(p, () => record.mock.calls.length === 2);
    expect(record).toHaveBeenCalledTimes(2);
    // Decorating times out again, then the judges.
    p.run(21);
    expect(earn).toHaveBeenCalledTimes(1);
    p.texts.length = 0;
    p.run(judgingTimes(2).ready);
    // The judges: a drumroll, each chef's dish, their cards, the verdict.
    expect(p.texts).toContain('🥁 The judges! 🥁');
    expect(
      p.texts.some((text) => text.startsWith('Chef Fox')) && p.texts.includes('Chef Bear'),
    ).toBe(true);
    expect(p.texts.some((text) => / wins! 🏆$/.test(text) || text === '🎉 Both win! 🎉')).toBe(
      true,
    );
    expect(p.texts).toContain('All done! 🎉');
    // 25 coins, once; and two chefs' rounds earn her no stickers.
    expect(earn).toHaveBeenCalledTimes(1);
    expect(earn.mock.calls[0][1]).toBe(25);
    expect(carnival.stickersFor(id)).toEqual(stickers);
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.texts.length = 0;
    p.run(0.3);
    expect(p.texts).toContain('Tap to cook!');
    expect(earn).toHaveBeenCalledTimes(1);
    stop();
  });

  it('plays a beat your best: the challenge, the judges, and a kind "So close!"', () => {
    const id = 'carnival-kitchen';
    // A best no round can reach, on every dish she could get.
    for (const dish of bookDishes()) carnival.earnSticker(id, bestSticker(dish.id), 5000);
    const p = phone();
    const stop = carnivalKitchen.start(p.canvas as unknown as HTMLCanvasElement);
    p.run(0.2);
    p.tap(...middleOf(titlePlaces(p.layout).cookoff));
    p.run(0.2);
    p.tap(...middleOf(menuPlaces(p.layout).best));
    p.texts.length = 0;
    p.run(7);
    expect(p.texts.some((text) => /^Your best .+ is 5000 points\.$/.test(text))).toBe(true);
    expect(p.texts).toContain('Can you beat it?');
    p.tap(p.layout.width / 2, p.layout.height / 2);
    const record = vi.mocked(carnival.recordScore);
    const earn = vi.mocked(carnival.earnCoins);
    cookUntil(p, () => record.mock.calls.length === 1);
    p.texts.length = 0;
    p.run(25 + judgingTimes(1).ready);
    expect(p.texts).toContain('🥁 The judges! 🥁');
    expect(p.texts).toContain('💖 So close! 💖');
    expect(p.texts.some((text) => /^Only \d+ points to go!$/.test(text))).toBe(true);
    expect(earn).toHaveBeenCalledTimes(1);
    expect(earn.mock.calls[0][1]).toBe(10);
    // Her best stays; the dish keeps its sticker.
    for (const dish of bookDishes()) {
      expect(carnival.stickersFor(id)[bestSticker(dish.id)]).toBe(5000);
    }
    p.tap(p.layout.width / 2, p.layout.height / 2);
    p.texts.length = 0;
    p.run(0.3);
    expect(p.texts).toContain('Tap to cook!');
    stop();
  });
});
