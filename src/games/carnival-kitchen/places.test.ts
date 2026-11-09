import { describe, expect, it } from 'vitest';
import recipeOrder from './activities/recipe-order';
import { dishById } from './dishes';
import { createState } from './game';
import { plainPlan } from './kit';
import { layoutFor } from './layout';
import { closeButton } from './book';
import { grownupPlaces, optionBoxes } from './grownups';
import { badgeNameSize, cardSpeakerAt, leavePlaces, placesFor, recipeVeiled } from './render';
import { cssScale, nextStep, playThrough, seeded } from './test-kit';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const screens: [string, number, number, boolean][] = [
  ['the page', 1280, 800, false],
  ['a phone held sideways', 844, 390, true],
  ['a tablet held sideways', 1024, 768, true],
  ['a phone held upright', 390, 844, true],
  ['a short phone held upright', 360, 640, true],
  ['a big phone held upright', 430, 932, true],
  ['a tablet held upright', 768, 1024, true],
];

describe('the badge of the dish being made', () => {
  for (const [name, w, h, full] of screens) {
    it(`fits on ${name} without covering the buttons, score, recipe or Chef Bunny`, () => {
      const layout = layoutFor(w, h, full);
      const places = placesFor(layout);
      const { badge } = places;
      expect(badge.w).toBeGreaterThanOrEqual(110);
      expect(badge.h).toBeGreaterThanOrEqual(40);
      expect(badge.x).toBeGreaterThanOrEqual(0);
      expect(badge.y).toBeGreaterThanOrEqual(0);
      expect(badge.x + badge.w).toBeLessThanOrEqual(layout.width);
      expect(badge.y + badge.h).toBeLessThanOrEqual(layout.height);

      const r = places.buttonR + 4;
      const button = (spot: { x: number; y: number }) => ({
        x: spot.x - r,
        y: spot.y - r,
        w: 2 * r,
        h: 2 * r,
      });
      const blocked: Box[] = [
        button(places.sound),
        { ...places.score, w: 150, h: 44 },
        // The longest recipe (five steps), with the ring round the current one.
        { x: places.recipe.x - 2 * 78 - 33, y: places.recipe.y - 33, w: 4 * 78 + 66, h: 66 },
        { x: places.speech.x - 22, y: places.speech.y, w: places.speech.w + 22, h: 104 },
        { x: places.bunny.x - 60, y: places.bunny.y - 110, w: 120, h: 240 },
      ];
      if (places.home) blocked.push(button(places.home));
      for (const box of blocked) expect(overlaps(badge, box)).toBe(false);
    });
  }
});

describe("the step card's speaker (Read it myself)", () => {
  it('is at least 60 CSS pixels across on a phone, and as it was on a computer', () => {
    expect(cardSpeakerAt('page')).toEqual({ x: 200, y: 302, r: 28 });
    for (const shape of ['wide', 'tall'] as const) {
      expect(cardSpeakerAt(shape).r * 2 * cssScale(shape), shape).toBeGreaterThanOrEqual(60);
    }
  });
});

describe('the recipe along the top', () => {
  it('hides its pictures while she puts the recipe in order, and only then', () => {
    const soup = dishById('soup');
    const steps = recipeOrder.weave({ dish: soup, level: 1, random: seeded(), start: 900 });
    const dish = { ...soup, steps };
    const state = createState(dish, seeded(), plainPlan(dish));
    expect(state.steps[0].kind).toBe('sequence');
    expect(recipeVeiled(state)).toBe(true);
    nextStep(state);
    expect(recipeVeiled(state)).toBe(true);
    const seen: boolean[] = [];
    playThrough(state, () => seen.push(recipeVeiled(state)));
    expect(seen).toContain(false);
    expect(state.phase).not.toBe('playing');
    expect(recipeVeiled(state)).toBe(false);
  });
});

describe('buttons a finger taps on a phone', () => {
  const phones = [
    ['tall', 390, 844],
    ['wide', 844, 390],
  ] as const;

  for (const [shape, w, h] of phones) {
    const layout = layoutFor(w, h, true);
    const scale = cssScale(shape);

    it(`makes 🏠 and 🔊 at least 60 CSS pixels and well apart, ${shape}`, () => {
      const p = placesFor(layout);
      const { home, sound, buttonR } = p;
      expect(home).not.toBeNull();
      if (!home) return;
      expect(buttonR * 2 * scale).toBeGreaterThanOrEqual(60);
      for (const b of [home, sound]) {
        expect(b.x - buttonR).toBeGreaterThanOrEqual(0);
        expect(b.y - buttonR).toBeGreaterThanOrEqual(0);
        expect(b.x + buttonR).toBeLessThanOrEqual(layout.width);
      }
      // At least 15 CSS pixels of gap between them.
      expect(
        (Math.hypot(home.x - sound.x, home.y - sound.y) - 2 * buttonR) * scale,
      ).toBeGreaterThanOrEqual(15);
    });

    it(`asks "Leave the kitchen?" with ✓ and ✕ at least 60 CSS pixels, ${shape}`, () => {
      const card = leavePlaces(layout);
      for (const b of [card.yes, card.no]) {
        expect(b.r * 2 * scale).toBeGreaterThanOrEqual(60);
        expect(b.x - b.r).toBeGreaterThanOrEqual(card.box.x);
        expect(b.x + b.r).toBeLessThanOrEqual(card.box.x + card.box.w);
        expect(b.y + b.r).toBeLessThanOrEqual(card.box.y + card.box.h);
      }
      expect(card.box.x).toBeGreaterThanOrEqual(0);
      expect(card.box.x + card.box.w).toBeLessThanOrEqual(layout.width);
      expect(card.no.x - card.yes.x - card.yes.r - card.no.r).toBeGreaterThan(20);
    });

    it(`makes the book's and the grown-ups' buttons at least 60 CSS pixels, ${shape}`, () => {
      const close = closeButton(layout);
      expect(close.r * 2 * scale).toBeGreaterThanOrEqual(60);
      expect(close.x + close.r).toBeLessThanOrEqual(layout.width);
      expect(close.y - close.r).toBeGreaterThanOrEqual(0);
      const g = grownupPlaces(layout);
      for (const b of [...g.rows.flatMap((r) => optionBoxes(r.control)), g.done]) {
        expect(b.w * scale).toBeGreaterThanOrEqual(60);
        expect(b.h * scale).toBeGreaterThanOrEqual(60);
      }
    });

    it(`writes the dish's name on its badge at about 14 CSS pixels or more, ${shape}`, () => {
      const { badge } = placesFor(layout);
      if (badge.h >= 100) expect(badgeNameSize(badge.w) * scale).toBeGreaterThanOrEqual(14);
    });
  }
});
