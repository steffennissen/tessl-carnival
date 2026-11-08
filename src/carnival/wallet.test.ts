import { describe, expect, it } from 'vitest';
import { createWallets } from './wallet';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('wallets', () => {
  it('starts empty', () => {
    expect(createWallets(memoryStorage()).balance('carnival-kitchen')).toBe(0);
  });

  it('earns and spends per game', () => {
    const wallets = createWallets(memoryStorage());
    expect(wallets.earn('carnival-kitchen', 30)).toBe(30);
    expect(wallets.earn('carnival-kitchen', 15)).toBe(45);
    wallets.earn('ring-toss', 5);
    expect(wallets.spend('carnival-kitchen', 40)).toBe(true);
    expect(wallets.balance('carnival-kitchen')).toBe(5);
    expect(wallets.balance('ring-toss')).toBe(5);
  });

  it("doesn't spend more than there is", () => {
    const wallets = createWallets(memoryStorage());
    wallets.earn('carnival-kitchen', 10);
    expect(wallets.spend('carnival-kitchen', 11)).toBe(false);
    expect(wallets.balance('carnival-kitchen')).toBe(10);
    expect(wallets.spend('carnival-kitchen', 10)).toBe(true);
    expect(wallets.balance('carnival-kitchen')).toBe(0);
  });

  it('remembers coins across page loads', () => {
    const storage = memoryStorage();
    createWallets(storage).earn('carnival-kitchen', 12);
    expect(createWallets(storage).balance('carnival-kitchen')).toBe(12);
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem('tessl-carnival:wallets', '{not json');
    const wallets = createWallets(storage);
    expect(wallets.balance('carnival-kitchen')).toBe(0);
    storage.setItem(
      'tessl-carnival:wallets',
      JSON.stringify({ 'carnival-kitchen': -5, 'ring-toss': 2.5, 'water-cannon': 'lots' }),
    );
    expect(wallets.balance('carnival-kitchen')).toBe(0);
    expect(wallets.balance('ring-toss')).toBe(0);
    expect(wallets.balance('water-cannon')).toBe(0);
    expect(wallets.earn('carnival-kitchen', 3)).toBe(3);
  });

  it('keeps working when storage refuses a write', () => {
    const wallets = createWallets({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => wallets.earn('carnival-kitchen', 8)).not.toThrow();
    expect(wallets.balance('carnival-kitchen')).toBe(8);
  });

  it('rejects amounts that are not whole numbers of 0 or more', () => {
    const wallets = createWallets(memoryStorage());
    expect(() => wallets.earn('carnival-kitchen', -1)).toThrow();
    expect(() => wallets.earn('carnival-kitchen', 1.5)).toThrow();
    expect(() => wallets.spend('carnival-kitchen', Number.NaN)).toThrow();
  });
});
