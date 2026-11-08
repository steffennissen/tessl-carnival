/**
 * Stickers: things a player has collected in a game, each with a level, such
 * as the stars earned on each dish. A game keeps its collection here instead
 * of in local storage itself. Earning a sticker again only ever raises its
 * level.
 */

type StickerStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Each game's stickers: sticker id to its best level. */
type Collections = Record<string, Record<string, number>>;

const STORAGE_KEY = 'tessl-carnival:stickers';

function memoryStorage(): StickerStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createStickerBook(storage: StickerStorage) {
  let store = storage;

  function load(): Collections {
    try {
      const parsed: unknown = JSON.parse(store.getItem(STORAGE_KEY) ?? '{}');
      return isRecord(parsed) ? (parsed as Collections) : {};
    } catch {
      return {};
    }
  }

  /** Every sticker `gameId` has earned, with its best level. */
  function stickers(gameId: string): Record<string, number> {
    const mine = load()[gameId];
    if (!isRecord(mine)) return {};
    const clean: Record<string, number> = {};
    for (const [id, level] of Object.entries(mine)) {
      if (typeof level === 'number' && Number.isFinite(level)) clean[id] = level;
    }
    return clean;
  }

  /**
   * Earns `sticker` in `gameId` at `level`. Keeps the best level earned so
   * far, and returns true when this is a new sticker or a better level.
   */
  function earn(gameId: string, sticker: string, level: number): boolean {
    if (!Number.isFinite(level) || level < 0) {
      throw new Error(`Sticker level must be a non-negative number, got ${level}`);
    }
    const all = load();
    const mine = stickers(gameId);
    if (sticker in mine && mine[sticker] >= level) return false;
    const value = JSON.stringify({ ...all, [gameId]: { ...mine, [sticker]: level } });
    try {
      store.setItem(STORAGE_KEY, value);
    } catch {
      // Storage can refuse a write, for example when it's full or blocked.
      // Keep stickers for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, value);
    }
    return true;
  }

  return { earn, stickers };
}

function browserStorage(): StickerStorage {
  try {
    return window.localStorage;
  } catch {
    // Private windows and test runs: keep stickers for this page load only.
    return memoryStorage();
  }
}

const book = createStickerBook(browserStorage());

/** A game records each sticker a player earns through here. */
export const earnSticker = book.earn;
/** Every sticker a game's player has earned, with its best level. */
export const stickersFor = book.stickers;
