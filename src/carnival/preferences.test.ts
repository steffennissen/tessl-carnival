import { describe, expect, it } from 'vitest';
import { createPreferences } from './preferences';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('preferences', () => {
  it('has none for a game that saved nothing', () => {
    expect(createPreferences(memoryStorage()).all('carnival-kitchen')).toEqual({});
  });

  it('saves and replaces settings per game', () => {
    const prefs = createPreferences(memoryStorage());
    prefs.save('carnival-kitchen', 'learning', true);
    prefs.save('carnival-kitchen', 'level', 1);
    prefs.save('carnival-kitchen', 'level', 2);
    prefs.save('ring-toss', 'speed', 'fast');
    expect(prefs.all('carnival-kitchen')).toEqual({ learning: true, level: 2 });
    expect(prefs.all('ring-toss')).toEqual({ speed: 'fast' });
  });

  it('remembers settings across page loads', () => {
    const storage = memoryStorage();
    createPreferences(storage).save('carnival-kitchen', 'level', 2);
    expect(createPreferences(storage).all('carnival-kitchen')).toEqual({ level: 2 });
  });

  it('survives corrupt storage and drops bad values', () => {
    const storage = memoryStorage();
    storage.setItem('tessl-carnival:preferences', '{not json');
    const prefs = createPreferences(storage);
    expect(prefs.all('carnival-kitchen')).toEqual({});
    storage.setItem(
      'tessl-carnival:preferences',
      JSON.stringify({ 'carnival-kitchen': { level: 2, bad: { a: 1 }, worse: null } }),
    );
    expect(prefs.all('carnival-kitchen')).toEqual({ level: 2 });
  });

  it('keeps working when storage refuses a write', () => {
    const prefs = createPreferences({
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(() => prefs.save('carnival-kitchen', 'level', 1)).not.toThrow();
    expect(prefs.all('carnival-kitchen')).toEqual({ level: 1 });
  });

  it('rejects values that are not strings, numbers or booleans', () => {
    const prefs = createPreferences(memoryStorage());
    expect(() => prefs.save('carnival-kitchen', 'level', Number.NaN)).toThrow();
  });
});
