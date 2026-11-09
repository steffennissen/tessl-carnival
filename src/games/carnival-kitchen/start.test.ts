import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as carnival from '../../carnival';
import type { G } from './art';
import { CIRCLE } from './kit';
import { gearFor } from './grownups';
import { layoutFor } from './layout';
import { leavePlaces, placesFor } from './render';
import { carnivalKitchen } from './game';

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
    p.run(5);
    expect(p.texts.some((text) => text.startsWith("Hi! I'm"))).toBe(true);
    expect(p.texts.some((text) => /^Can I have .+, please\?$/.test(text))).toBe(true);
    p.run(5);
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
});
