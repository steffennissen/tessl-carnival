/**
 * Wallets: coins a player earns in a game and spends in it, such as on
 * prizes in a shop. Each game has its own wallet, kept here instead of in
 * local storage by the game itself. The balance never goes below zero.
 */

type WalletStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'tessl-carnival:wallets';

function memoryStorage(): WalletStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function createWallets(storage: WalletStorage) {
  let store = storage;

  function load(): Record<string, unknown> {
    try {
      const parsed: unknown = JSON.parse(store.getItem(STORAGE_KEY) ?? '{}');
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(gameId: string, coins: number) {
    const value = JSON.stringify({ ...load(), [gameId]: coins });
    try {
      store.setItem(STORAGE_KEY, value);
    } catch {
      // Storage can refuse a write, for example when it's full or blocked.
      // Keep coins for this page load only.
      store = memoryStorage();
      store.setItem(STORAGE_KEY, value);
    }
  }

  /** How many coins `gameId`'s player has. */
  function balance(gameId: string): number {
    const coins = load()[gameId];
    return isAmount(coins) ? coins : 0;
  }

  /** Adds `amount` coins to `gameId`'s wallet, and returns the new balance. */
  function earn(gameId: string, amount: number): number {
    if (!isAmount(amount)) {
      throw new Error(`Coins earned must be a whole number of 0 or more, got ${amount}`);
    }
    const coins = balance(gameId) + amount;
    save(gameId, coins);
    return coins;
  }

  /**
   * Spends `amount` coins from `gameId`'s wallet if there are enough, and
   * returns whether it did. Nothing changes when there aren't enough.
   */
  function spend(gameId: string, amount: number): boolean {
    if (!isAmount(amount)) {
      throw new Error(`Coins spent must be a whole number of 0 or more, got ${amount}`);
    }
    const coins = balance(gameId);
    if (coins < amount) return false;
    save(gameId, coins - amount);
    return true;
  }

  return { balance, earn, spend };
}

function browserStorage(): WalletStorage {
  try {
    return window.localStorage;
  } catch {
    // Private windows and test runs: keep coins for this page load only.
    return memoryStorage();
  }
}

const wallets = createWallets(browserStorage());

/** How many coins a game's player has. */
export const coinsFor = wallets.balance;
/** A game adds coins its player earned through here. */
export const earnCoins = wallets.earn;
/** A game spends its player's coins through here; false if there aren't enough. */
export const spendCoins = wallets.spend;
