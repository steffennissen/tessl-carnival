import { describe, expect, it } from 'vitest';
import { cssScale, keepClear, overlaps } from '../test-kit';
import { noteSpot } from './order';
import { QUIZ_BUBBLE, QUIZ_PICTURE, QUIZ_SPEAKER, choiceBoxes, quizPlaces } from './quiz';

describe('quiz places for each shape', () => {
  it('keeps the computer layout as it was', () => {
    expect(quizPlaces('page')).toMatchObject({
      bubble: QUIZ_BUBBLE,
      speaker: QUIZ_SPEAKER,
      picture: QUIZ_PICTURE,
    });
    expect(choiceBoxes(3)).toEqual(choiceBoxes(3, 'side', 'page'));
    expect(choiceBoxes(3)[0]).toEqual({ x: 545, y: 248, w: 145, h: 64 });
    expect(choiceBoxes(3, 'row')[0]).toEqual({ x: 215, y: 300, w: 150, h: 110 });
  });

  for (const shape of ['page', 'wide', 'tall'] as const) {
    for (const layout of ['side', 'row'] as const) {
      for (let count = 2; count <= 4; count++) {
        it(`puts ${count} ${layout} answers clear of everything on ${shape}`, () => {
          const places = quizPlaces(shape);
          const boxes = choiceBoxes(count, layout, shape);
          expect(boxes).toHaveLength(count);
          boxes.forEach((b, i) => {
            expect(overlaps(b, places.bubble), `answer ${i} and the bubble`).toBe(false);
            if (layout === 'side')
              expect(overlaps(b, places.picture), `answer ${i} and the picture`).toBe(false);
            for (const clear of keepClear(shape))
              expect(overlaps(b, clear), `answer ${i}`).toBe(false);
            boxes.slice(i + 1).forEach((c) => expect(overlaps(b, c)).toBe(false));
          });
        });
      }
    }
  }

  it('makes every answer at least 60 CSS pixels tall on a phone, and wider than tall-ish', () => {
    for (const shape of ['wide', 'tall'] as const) {
      const scale = cssScale(shape);
      for (const layout of ['side', 'row'] as const) {
        for (let count = 2; count <= 4; count++) {
          for (const b of choiceBoxes(count, layout, shape)) {
            expect(b.h * scale, `${shape} ${layout} ${count}`).toBeGreaterThanOrEqual(60);
            expect(b.w * scale, `${shape} ${layout} ${count}`).toBeGreaterThanOrEqual(60);
          }
        }
      }
      const { speaker, button } = quizPlaces(shape);
      expect(speaker.r * 2 * scale).toBeGreaterThanOrEqual(60);
      expect(button.h * scale).toBeGreaterThanOrEqual(60);
    }
  });

  it('keeps the speaker inside the bubble, and the picture and button clear', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const { bubble, speaker, picture, button } = quizPlaces(shape);
      expect(speaker.x - speaker.r).toBeGreaterThanOrEqual(bubble.x);
      expect(speaker.y - speaker.r).toBeGreaterThanOrEqual(bubble.y);
      expect(speaker.y + speaker.r).toBeLessThanOrEqual(bubble.y + bubble.h);
      expect(overlaps(picture, bubble)).toBe(false);
      expect(overlaps(button, bubble)).toBe(false);
      for (const clear of keepClear(shape)) {
        expect(overlaps(picture, clear), `${shape} picture`).toBe(false);
        expect(overlaps(button, clear), `${shape} button`).toBe(false);
      }
    }
  });
});

describe('the order note', () => {
  it("hangs under the clock and shelf on a computer and sideways, clear of the toppings' lane", () => {
    for (const shape of ['page', 'wide'] as const) {
      const spot = noteSpot(shape);
      expect(spot.rail).toBe(true);
      // The shelf (x 664 to 792, y 144 to 212) and the clock (to y 238).
      expect(spot.y).toBeGreaterThan(238);
      expect(spot.x + spot.w).toBeLessThanOrEqual(800);
    }
    expect(noteSpot('tall').rail).toBe(false);
    expect(noteSpot('tall').x + noteSpot('tall').w).toBeLessThanOrEqual(700);
  });
});
