/**
 * Preferences: settings a game remembers between visits, such as a grown-up
 * choosing a difficulty. A game keeps its settings here instead of in local
 * storage itself. Values are strings, numbers or booleans.
 */

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type PreferenceValue = string | number | boolean;

const STORAGE_KEY = 'tessl-carnival:preferences';

function memoryStorage(): PreferenceStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValue(value: unknown): value is PreferenceValue {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

export function createPreferences(storage: PreferenceStorage) {
  let store = storage;

  function load(): Record<string, unknown> {
    try {
      const parsed: unknown = JSON.parse(store.getItem(STORAGE_KEY) ?? '{}');
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  /** Every preference `gameId` has saved. */
  function all(gameId: string): Record<string, PreferenceValue> {
    const mine = load()[gameId];
    if (!isRecord(mine)) return {};
    const clean: Record<string, PreferenceValue> = {};
    for (const [key, value] of Object.entries(mine)) if (isValue(value)) clean[key] = value;
    return clean;
  }

  /** Saves `value` as `gameId`'s `key` preference. */
  function save(gameId: string, key: string, value: PreferenceValue): void {
    if (!isValue(value)) throw new Error(`Preference must be a string, number or boolean`);
    const saved = JSON.stringify({ ...load(), [gameId]: { ...all(gameId), [key]: value } });
    try {
      store.setItem(STORAGE_KEY, saved);
    } catch {
      // Storage can refuse a write, for example when it's full or blocked.
      // Keep preferences for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, saved);
    }
  }

  return { save, all };
}

function browserStorage(): PreferenceStorage {
  try {
    return window.localStorage;
  } catch {
    // Private windows and test runs: keep preferences for this page load only.
    return memoryStorage();
  }
}

const preferences = createPreferences(browserStorage());

/** A game saves a setting it should remember between visits through here. */
export const savePreference = preferences.save;
/** Every setting a game has saved. */
export const preferencesFor = preferences.all;
