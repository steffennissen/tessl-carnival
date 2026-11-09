import { describe, expect, it } from 'vitest';
import { createState, skipCard } from './game';
import { dishById } from './dishes';
import {
  GEAR_HOLD,
  SETTING_ROWS,
  gearFor,
  grownupPlaces,
  grownupTap,
  loadSettings,
  onGear,
  optionBoxes,
  saveSetting,
  withSetting,
} from './grownups';
import { CARD_SKIP_AFTER, DEFAULT_SETTINGS, NO_LEARNING, plainPlan } from './kit';
import { layoutFor } from './layout';
import { bookButtonFor } from './book';
import { cssScale, seeded } from './test-kit';

const LAYOUTS = {
  page: layoutFor(1200, 800, false),
  wide: layoutFor(844, 390, true),
  tall: layoutFor(390, 844, true),
  'small tall': layoutFor(600, 900, true),
  'wide tablet': layoutFor(1024, 768, true),
};

const middle = (b: { x: number; y: number; w: number; h: number }) => ({
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
});

describe("grown-ups' settings", () => {
  it('starts with learning on, Level 1, the voice reading and surprises on', () => {
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, surprises: true });
  });

  it('remembers what a grown-up chose', () => {
    saveSetting('level', 2);
    saveSetting('readMyself', true);
    saveSetting('surprises', false);
    expect(loadSettings()).toEqual({
      learning: true,
      level: 2,
      readMyself: true,
      surprises: false,
    });
    saveSetting('level', 1);
    saveSetting('readMyself', false);
    saveSetting('surprises', true);
  });

  it('needs the gear held for a moment', () => {
    expect(GEAR_HOLD).toBeGreaterThanOrEqual(1);
  });

  for (const [name, layout] of Object.entries(LAYOUTS)) {
    describe(name, () => {
      it('puts the gear in a corner on the canvas, clear of the book button', () => {
        const gear = gearFor(layout);
        expect(gear.x + gear.r).toBeLessThanOrEqual(layout.width);
        expect(gear.y + gear.r).toBeLessThanOrEqual(layout.height);
        expect(onGear(layout, gear.x, gear.y)).toBe(true);
        const book = middle(bookButtonFor(layout));
        expect(onGear(layout, book.x, book.y)).toBe(false);
        expect(onGear(layout, layout.width / 2, layout.height / 2)).toBe(false);
      });

      it('fits every row and the Done button on the page, without overlaps', () => {
        const p = grownupPlaces(layout);
        const boxes = [...p.rows.flatMap((r) => optionBoxes(r.control)), p.done];
        for (const b of boxes) {
          expect(b.x).toBeGreaterThanOrEqual(p.page.x);
          expect(b.y).toBeGreaterThanOrEqual(p.page.y);
          expect(b.x + b.w).toBeLessThanOrEqual(p.page.x + p.page.w);
          expect(b.y + b.h).toBeLessThanOrEqual(p.page.y + p.page.h);
        }
        boxes.forEach((a, i) =>
          boxes.slice(i + 1).forEach((b) => {
            const apart =
              a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
            expect(apart).toBe(true);
          }),
        );
      });

      it('changes a setting with a tap on its choice, and closes with Done or ✕', () => {
        const p = grownupPlaces(layout);
        p.rows.forEach(({ row, control }) => {
          optionBoxes(control).forEach((b, i) => {
            const at = middle(b);
            expect(grownupTap(p, at.x, at.y)).toEqual({ key: row.key, value: row.options[i][1] });
          });
        });
        const done = middle(p.done);
        expect(grownupTap(p, done.x, done.y)).toBe('close');
        expect(grownupTap(p, p.close.x, p.close.y)).toBe('close');
        expect(grownupTap(p, p.page.x + 2, p.page.y + p.page.h - 2)).toBeNull();
      });
    });
  }

  it('makes every choice and Done at least 60 CSS pixels on a phone', () => {
    for (const shape of ['wide', 'tall'] as const) {
      const p = grownupPlaces(LAYOUTS[shape]);
      for (const b of [...p.rows.flatMap((r) => optionBoxes(r.control)), p.done]) {
        expect(Math.min(b.w, b.h) * cssScale(shape)).toBeGreaterThanOrEqual(60);
      }
    }
  });

  it('has the four settings', () => {
    const settings = { ...DEFAULT_SETTINGS, surprises: true };
    expect(SETTING_ROWS.map((r) => r.key)).toEqual([
      'learning',
      'level',
      'readMyself',
      'surprises',
    ]);
    expect(withSetting(settings, { key: 'level', value: 2 }).level).toBe(2);
    expect(withSetting(settings, { key: 'learning', value: false }).learning).toBe(false);
    expect(withSetting(settings, { key: 'surprises', value: false }).surprises).toBe(false);
  });

  it('lets a card be tapped away only in "Read it myself" mode, after a moment', () => {
    const soup = dishById('soup');
    const plain = createState(soup, seeded());
    expect(plain.learn.settings).toEqual(NO_LEARNING);
    expect(skipCard(plain)).toBe(false);
    const reader = createState(
      soup,
      seeded(),
      plainPlan(soup, { ...DEFAULT_SETTINGS, readMyself: true }),
    );
    expect(skipCard(reader)).toBe(false);
    reader.banner -= CARD_SKIP_AFTER;
    expect(skipCard(reader)).toBe(true);
    expect(reader.banner).toBe(0);
  });
});
