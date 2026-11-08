import { describe, expect, it } from 'vitest';
import { createStickerBook } from './stickers';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('sticker book', () => {
  it('has no stickers for a game nobody has played', () => {
    const book = createStickerBook(memoryStorage());
    expect(book.stickers('carnival-kitchen')).toEqual({});
  });

  it('keeps the best level of each sticker, per game', () => {
    const book = createStickerBook(memoryStorage());
    expect(book.earn('carnival-kitchen', 'pizza', 2)).toBe(true);
    expect(book.earn('carnival-kitchen', 'pizza', 1)).toBe(false);
    expect(book.earn('carnival-kitchen', 'pizza', 2)).toBe(false);
    expect(book.earn('carnival-kitchen', 'pizza', 3)).toBe(true);
    book.earn('carnival-kitchen', 'soup', 1);
    book.earn('ring-toss', 'gold-ring', 1);
    expect(book.stickers('carnival-kitchen')).toEqual({ pizza: 3, soup: 1 });
    expect(book.stickers('ring-toss')).toEqual({ 'gold-ring': 1 });
  });

  it('counts a sticker earned at level 0 as new', () => {
    const book = createStickerBook(memoryStorage());
    expect(book.earn('carnival-kitchen', 'pizza', 0)).toBe(true);
    expect(book.stickers('carnival-kitchen')).toEqual({ pizza: 0 });
  });

  it('remembers stickers across page loads', () => {
    const storage = memoryStorage();
    createStickerBook(storage).earn('carnival-kitchen', 'pizza', 2);
    expect(createStickerBook(storage).stickers('carnival-kitchen')).toEqual({ pizza: 2 });
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem('tessl-carnival:stickers', '{not json');
    const book = createStickerBook(storage);
    expect(book.stickers('carnival-kitchen')).toEqual({});
    book.earn('carnival-kitchen', 'pizza', 1);
    expect(book.stickers('carnival-kitchen')).toEqual({ pizza: 1 });

    storage.setItem('tessl-carnival:stickers', JSON.stringify({ 'carnival-kitchen': [1, 2] }));
    expect(book.stickers('carnival-kitchen')).toEqual({});
    storage.setItem(
      'tessl-carnival:stickers',
      JSON.stringify({ 'carnival-kitchen': { pizza: 'lots', soup: 2 } }),
    );
    expect(book.stickers('carnival-kitchen')).toEqual({ soup: 2 });
  });

  it('keeps working when storage refuses a write', () => {
    const storage = memoryStorage();
    storage.setItem('tessl-carnival:stickers', JSON.stringify({ 'ring-toss': { gold: 1 } }));
    const book = createStickerBook({
      getItem: storage.getItem,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => book.earn('carnival-kitchen', 'pizza', 2)).not.toThrow();
    expect(book.stickers('carnival-kitchen')).toEqual({ pizza: 2 });
    expect(book.stickers('ring-toss')).toEqual({ gold: 1 });
  });

  it('rejects negative and non-numeric levels', () => {
    const book = createStickerBook(memoryStorage());
    expect(() => book.earn('carnival-kitchen', 'pizza', -1)).toThrow();
    expect(() => book.earn('carnival-kitchen', 'pizza', Number.NaN)).toThrow();
  });
});
