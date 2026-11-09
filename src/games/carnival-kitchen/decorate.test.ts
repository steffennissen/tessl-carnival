import { describe, expect, it } from 'vitest';
import {
  DECORATIONS,
  DECOR_IDLE,
  DECOR_WAIT,
  DISH_REACH,
  MAX_DECORATIONS,
  createDecor,
  decorMove,
  decorPlaces,
  decorPress,
  decorRelease,
  decorTick,
  drawDecoration,
  hitDone,
  trayAt,
  type DecorState,
} from './decorate';
import { cssScale, fakeCanvas, keepClear, overlaps } from './test-kit';

/** Done!'s box. */
const boxOfDone = (p: ReturnType<typeof decorPlaces>) => ({
  x: p.done.x - p.done.w / 2,
  y: p.done.y - p.done.h / 2,
  w: p.done.w,
  h: p.done.h,
});

const places = decorPlaces('page');

/** Decorating, past the moment it ignores taps. */
function ready(): DecorState {
  const d = createDecor();
  decorTick(d, DECOR_WAIT);
  return d;
}

/** Drags the tray's `i`th treat to (x, y) and lets go. */
function drag(d: DecorState, i: number, x: number, y: number) {
  const spot = places.tray[i];
  decorPress(d, places, spot.x, spot.y);
  decorMove(d, (spot.x + x) / 2, (spot.y + y) / 2);
  decorMove(d, x, y);
  return decorRelease(d, places);
}

describe('decorating the dish', () => {
  it('ignores taps for a moment, so a last excited tap does nothing', () => {
    const d = createDecor();
    const done = places.done;
    expect(decorPress(d, places, done.x, done.y)).toBe('none');
    expect(d.done).toBe(false);
    decorTick(d, DECOR_WAIT);
    expect(decorPress(d, places, done.x, done.y)).toBe('done');
    expect(d.done).toBe(true);
  });

  it('drags a treat from the tray onto the dish', () => {
    const d = ready();
    const { dish } = places;
    expect(drag(d, 1, dish.x + 26, dish.y - 13)).toBe('place');
    expect(d.placed).toHaveLength(1);
    expect(d.placed[0]).toMatchObject({ kind: DECORATIONS[1], x: 20, y: -10 });
    expect(d.held).toBeNull();
  });

  it('keeps a treat dropped off the dish on the dish', () => {
    const d = ready();
    drag(d, 0, 5, 5);
    expect(d.placed[0].x).toBe(-DISH_REACH.x);
    expect(d.placed[0].y).toBe(-DISH_REACH.y);
  });

  it('lets a treat dragged back to the tray go back', () => {
    const d = ready();
    const spot = places.tray[3];
    expect(drag(d, 2, spot.x, spot.y)).toBe('none');
    expect(d.placed).toHaveLength(0);
  });

  it('moves a treat on the dish, or takes it off by dragging it to the tray', () => {
    const d = ready();
    const { dish } = places;
    drag(d, 0, dish.x, dish.y);
    expect(decorPress(d, places, dish.x + 5, dish.y + 5)).toBe('pick');
    decorMove(d, dish.x + 65, dish.y);
    expect(decorRelease(d, places)).toBe('place');
    expect(d.placed).toHaveLength(1);
    expect(d.placed[0].x).toBe(50);
    decorPress(d, places, dish.x + 65, dish.y);
    decorMove(d, places.tray[0].x, places.tray[0].y);
    expect(decorRelease(d, places)).toBe('remove');
    expect(d.placed).toHaveLength(0);
  });

  it('taps a treat, then taps the dish to put it there', () => {
    const d = ready();
    const spot = places.tray[4];
    decorPress(d, places, spot.x, spot.y);
    expect(decorRelease(d, places)).toBe('select');
    expect(d.selected).toBe(DECORATIONS[4]);
    const { dish } = places;
    expect(decorPress(d, places, dish.x, dish.y)).toBe('place');
    expect(decorPress(d, places, dish.x + 13, dish.y)).toBe('place');
    decorRelease(d, places);
    expect(d.placed.map((p) => p.kind)).toEqual([DECORATIONS[4], DECORATIONS[4]]);
    // Tapping it again puts it back.
    decorPress(d, places, spot.x, spot.y);
    expect(decorRelease(d, places)).toBe('unselect');
    expect(d.selected).toBeNull();
  });

  it('keeps the dish from overflowing', () => {
    const d = ready();
    for (let i = 0; i < MAX_DECORATIONS + 5; i++) drag(d, i % DECORATIONS.length, 500, 240);
    expect(d.placed).toHaveLength(MAX_DECORATIONS);
  });

  it('finishes by itself after a long rest, but not while a treat is held', () => {
    const d = ready();
    const spot = places.tray[0];
    decorPress(d, places, spot.x, spot.y);
    decorTick(d, DECOR_IDLE + 1);
    expect(d.done).toBe(false);
    decorRelease(d, places);
    decorTick(d, DECOR_IDLE - 1);
    expect(d.done).toBe(false);
    decorTick(d, 1);
    expect(d.done).toBe(true);
    expect(decorPress(d, places, spot.x, spot.y)).toBe('none');
  });

  it('fits every layout: the tray, the dish and Done! are on screen and apart', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const p = decorPlaces(shape);
      // A phone held upright only shows about x 100 to 700.
      const [left, right] = shape === 'tall' ? [100, 700] : [0, 800];
      for (const spot of p.tray) {
        expect(spot.x, shape).toBeGreaterThanOrEqual(left + p.trayRadius);
        expect(spot.x, shape).toBeLessThanOrEqual(right - p.trayRadius);
        expect(spot.y, shape).toBeGreaterThanOrEqual(p.trayTop);
      }
      // Done! sits in the tray's row, or (held sideways) at the top right, clear of the dish.
      expect(p.done.x - p.done.w / 2, shape).toBeGreaterThanOrEqual(left);
      expect(p.done.x + p.done.w / 2, shape).toBeLessThanOrEqual(right);
      const dish = {
        x: p.dish.x - DISH_REACH.x * p.dish.scale,
        y: p.dish.y - DISH_REACH.y * p.dish.scale,
        w: 2 * DISH_REACH.x * p.dish.scale,
        h: 2 * DISH_REACH.y * p.dish.scale,
      };
      expect(overlaps(boxOfDone(p), dish), shape).toBe(false);
      p.tray.forEach((spot, i) => {
        expect(trayAt(p, spot.x, spot.y), shape).toBe(DECORATIONS[i]);
        expect(hitDone(p, spot.x, spot.y), shape).toBe(false);
      });
      expect(trayAt(p, p.done.x, p.done.y), shape).toBeNull();
      // The whole dish sits above the tray.
      expect(p.dish.y + DISH_REACH.y * p.dish.scale, shape).toBeLessThan(p.trayTop);
    }
  });

  it('makes the treats and Done! big enough for a finger on a phone, clear of Chef Bunny', () => {
    for (const shape of ['wide', 'tall'] as const) {
      const p = decorPlaces(shape);
      const scale = cssScale(shape);
      expect(p.trayRadius * 2 * scale, shape).toBeGreaterThanOrEqual(60);
      expect(p.done.w * scale, shape).toBeGreaterThanOrEqual(60);
      expect(p.done.h * scale, shape).toBeGreaterThanOrEqual(60);
      p.tray.slice(1).forEach((spot, i) => {
        expect(spot.x - p.tray[i].x, shape).toBeGreaterThanOrEqual(p.trayRadius * 2);
      });
      // Chef Bunny and the edges of the screen (the HUD isn't drawn while decorating).
      const clear = keepClear(shape).filter((_, i) =>
        shape === 'tall' ? i !== 2 && i < 4 : i === 0 || i === 4,
      );
      const boxes = [
        ...p.tray.map((spot) => ({
          x: spot.x - p.trayRadius,
          y: spot.y - p.trayRadius,
          w: p.trayRadius * 2,
          h: p.trayRadius * 2,
        })),
        boxOfDone(p),
      ];
      for (const box of boxes) for (const c of clear) expect(overlaps(box, c), shape).toBe(false);
    }
  });

  it('draws every treat without errors', () => {
    for (const kind of DECORATIONS) drawDecoration(fakeCanvas(), kind, 10, 20, 1.3, 0.2);
  });
});
