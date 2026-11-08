import { describe, expect, it } from 'vitest';
import {
  MEASURE_FULLEST,
  amountText,
  fractionText,
  labelled,
  measureScale,
  measureTarget,
  parseAmount,
} from './measure';
import { speakable, wordsOf } from './words';

describe('real amounts', () => {
  it('reads amounts the way recipes write them', () => {
    expect(parseAmount('1½ cups')).toEqual({ value: 1.5, unit: 'cup' });
    expect(parseAmount('½ cup')).toEqual({ value: 0.5, unit: 'cup' });
    expect(parseAmount('2 cups')).toEqual({ value: 2, unit: 'cup' });
    expect(parseAmount('¼ teaspoon')).toEqual({ value: 0.25, unit: 'teaspoon' });
    expect(parseAmount('1 tablespoon')).toEqual({ value: 1, unit: 'tablespoon' });
    expect(parseAmount('a pinch')).toBeNull();
    expect(parseAmount('15 minutes')).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });

  it('writes them back the same way', () => {
    for (const text of ['¼ cup', '½ cup', '¾ cup', '1 cup', '1½ cups', '2 cups', '¼ teaspoon']) {
      const amount = parseAmount(text);
      expect(amount && amountText(amount)).toBe(text);
    }
    expect(fractionText(2.5)).toBe('2½');
    expect(fractionText(3)).toBe('3');
  });

  it('picks a measuring cup with room above the star, and a line on the amount', () => {
    for (const value of [0.25, 0.5, 0.75, 1, 1.5, 2, 3]) {
      const scale = measureScale(value);
      const target = measureTarget(value);
      expect(target, `${value}`).toBeGreaterThanOrEqual(0.4);
      expect(target, `${value}`).toBeLessThanOrEqual(MEASURE_FULLEST);
      expect(scale.marks, `${value}`).toContain(value);
      expect(scale.marks[scale.marks.length - 1]).toBe(scale.capacity);
    }
    expect(measureScale(1).marks).toEqual([0.5, 1, 1.5, 2]);
    expect(measureScale(0.5).marks).toEqual([0.25, 0.5, 0.75, 1]);
    // Questions use a 1 cup measure at least.
    expect(measureScale(0.25, 1).capacity).toBe(1);
  });

  it('numbers only whole cups (and ½ in a small cup) on a Level 2 cup', () => {
    const small = measureScale(0.75);
    expect(small.marks.filter((v) => labelled(v, small, 'some'))).toEqual([0.5, 1]);
    const jug = measureScale(1.5);
    expect(jug.marks.filter((v) => labelled(v, jug, 'some'))).toEqual([1, 2]);
  });

  it('says fractions as words, one word each, so reading along still lines up', () => {
    expect(speakable('Pour 1½ cups and ¼ cup')).toBe(
      'Pour one-and-a-half cups and one-quarter cup',
    );
    expect(speakable('¾ cup, 2½ cups')).toBe('three-quarters cup, two-and-a-half cups');
    const text = 'We need 1½ cups of milk and have ½ cup.';
    expect(wordsOf(speakable(text))).toHaveLength(wordsOf(text).length);
  });
});
