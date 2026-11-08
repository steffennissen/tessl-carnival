import { describe, expect, it } from 'vitest';
import { fakeCanvas } from '../test-kit';
import { drawWords, fitWords, numberWord, timedWord, wordAtChar, wordsOf } from './words';

describe('words', () => {
  it('splits text into words, with where each starts', () => {
    expect(wordsOf('One  pizza, please!')).toEqual([
      { word: 'One', start: 0 },
      { word: 'pizza,', start: 5 },
      { word: 'please!', start: 12 },
    ]);
  });

  it('finds the word a spoken character is in', () => {
    const words = wordsOf('Tap the cheese');
    expect(wordAtChar(words, 0)).toBe(0);
    expect(wordAtChar(words, 4)).toBe(1);
    expect(wordAtChar(words, 3)).toBe(0);
    expect(wordAtChar(words, 99)).toBe(2);
  });

  it('times the words when the voice cannot say where it is', () => {
    expect(timedWord(5, -1)).toBe(-1);
    expect(timedWord(5, 0)).toBe(0);
    expect(timedWord(5, 1)).toBe(2);
    expect(timedWord(5, 60)).toBe(5);
  });

  it('says numbers as words up to twenty', () => {
    expect(numberWord(3)).toBe('three');
    expect(numberWord(20)).toBe('twenty');
    expect(numberWord(21)).toBe('21');
  });

  it('fits and draws words without errors', () => {
    const g = fakeCanvas();
    const fit = fitWords(g, 'One pizza with 2 olives and 3 mushrooms, please!', 200, 30, 3);
    expect(fit.lines.length).toBeLessThanOrEqual(3);
    drawWords(g, fit.lines, 400, 200, fit.size, 30, { highlight: 2, color: '#000' });
  });
});
