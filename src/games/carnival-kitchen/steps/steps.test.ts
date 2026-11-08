import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STEPS, stepOf } from './index';

describe('steps', () => {
  it('finds one step per file in steps/, named by its kind', () => {
    const files = readdirSync(import.meta.dirname)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
      .map((f) => f.slice(0, -3));
    expect(STEPS.map((s) => s.kind).sort()).toEqual(files.sort());
  });

  it('throws for a kind with no file', () => {
    expect(() => stepOf('juggle')).toThrow('No step "juggle"');
  });
});
