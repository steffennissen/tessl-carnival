import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout';
import { placesFor } from './render';

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

      const button = (spot: { x: number; y: number }) => ({
        x: spot.x - 28,
        y: spot.y - 28,
        w: 56,
        h: 56,
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
