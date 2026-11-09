import { describe, expect, it } from 'vitest';
import {
  CELL,
  bookButtonFor,
  bookCount,
  bookPlaces,
  cellAt,
  countLine,
  gridFor,
  inBox,
  starsOf,
  twoLines,
  trophyAt,
  trophyShelf,
} from './book';
import { DISHES } from './dishes';
import { layoutFor } from './layout';
import { bookDishes } from './ranks';

const LAYOUTS = {
  page: layoutFor(1200, 800, false),
  wide: layoutFor(844, 390, true),
  tall: layoutFor(390, 844, true),
  'small tall': layoutFor(600, 900, true),
  'wide tablet': layoutFor(1024, 768, true),
};

describe('recipe book', () => {
  it('counts the dishes with a sticker', () => {
    const stickers = { pizza: 3, soup: 1, 'not-a-dish': 2, pancakes: 0 };
    expect(bookCount(stickers, DISHES)).toEqual({ earned: 2, total: DISHES.length });
    expect(countLine(stickers, DISHES)).toBe(`2 of ${DISHES.length} dishes`);
    expect(countLine({}, DISHES)).toBe(`0 of ${DISHES.length} dishes`);
  });

  it('shows 1 to 3 stars for a cooked dish, and none for the rest', () => {
    expect(starsOf({ pizza: 2 }, 'pizza')).toBe(2);
    expect(starsOf({ pizza: 7 }, 'pizza')).toBe(3);
    expect(starsOf({ pizza: 2 }, 'soup')).toBe(0);
  });

  it('puts a long name on two lines', () => {
    expect(twoLines('Veggie Soup')).toEqual(['Veggie Soup']);
    expect(twoLines('Omurice with a Ketchup Heart')).toEqual(['Omurice with a', 'Ketchup Heart']);
    expect(twoLines('Supercalifragilistic')).toEqual(['Supercalifragilistic']);
  });

  it('picks the columns that make the cells biggest', () => {
    const { cells, scale } = gridFor({ x: 0, y: 0, w: 6 * CELL.w, h: 3 * CELL.h }, 16);
    expect(scale).toBe(1);
    expect(cells).toHaveLength(16);
    // Three rows: six, six, and four in the middle of the last.
    expect(cells[12].x).toBe(CELL.w);
    expect(cells[15].y).toBe(2 * CELL.h);
  });

  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`fits all ${DISHES.length} dishes on the page, apart, in the ${name} layout`, () => {
      const b = bookPlaces(layout, DISHES.length);
      expect(b.cells).toHaveLength(DISHES.length);
      expect(b.scale).toBeGreaterThan(0.7);
      b.cells.forEach((cell, i) => {
        expect(cell.x).toBeGreaterThanOrEqual(b.page.x);
        expect(cell.y).toBeGreaterThan(b.count.y);
        expect(cell.x + cell.w).toBeLessThanOrEqual(b.page.x + b.page.w);
        expect(cell.y + cell.h).toBeLessThanOrEqual(b.page.y + b.page.h);
        expect(cellAt(b.cells, cell.x + cell.w / 2, cell.y + cell.h / 2)).toBe(i);
      });
      expect(cellAt(b.cells, b.close.x, b.close.y)).toBe(-1);
      expect(cellAt(b.cells, 1, 1)).toBe(-1);
    });

    it(`fits the trophy shelf beside the dishes and the surprise in the ${name} layout`, () => {
      const count = bookDishes().length;
      const b = bookPlaces(layout, count);
      const { box, slots } = trophyShelf(layout, 3);
      expect(b.cells).toHaveLength(count);
      expect(b.scale).toBeGreaterThan(0.7);
      expect(box.x).toBeGreaterThanOrEqual(b.page.x);
      expect(box.y).toBeGreaterThanOrEqual(b.page.y);
      expect(box.x + box.w).toBeLessThanOrEqual(b.page.x + b.page.w);
      expect(box.y + box.h).toBeLessThanOrEqual(b.page.y + b.page.h);
      const apart = (a: typeof box, c: typeof box) =>
        a.x + a.w <= c.x || c.x + c.w <= a.x || a.y + a.h <= c.y || c.y + c.h <= a.y;
      // Clear of every dish's cell (the wrapped surprise too) and the ✕.
      for (const cell of b.cells) expect(apart(box, cell)).toBe(true);
      const { close } = b;
      expect(
        apart(box, { x: close.x - close.r, y: close.y - close.r, w: 2 * close.r, h: 2 * close.r }),
      ).toBe(true);
      // Beside the title, not under it: the title has the middle of the page.
      if (layout.shape !== 'tall') expect(box.x + box.w).toBeLessThan(b.title.x - 150);
      slots.forEach((slot, i) => {
        expect(trophyAt(layout, slot.x + slot.w / 2, slot.y + slot.h / 2)).toBe(i);
        expect(cellAt(b.cells, slot.x + slot.w / 2, slot.y + slot.h / 2)).toBe(-1);
      });
    });

    it(`puts the book button on the canvas in the ${name} layout`, () => {
      const box = bookButtonFor(layout);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(layout.width);
      expect(box.h).toBeGreaterThanOrEqual(56);
      expect(inBox(box, box.x + box.w / 2, box.y + box.h / 2)).toBe(true);
      expect(inBox(box, box.x - 20, box.y)).toBe(false);
    });
  }
});
