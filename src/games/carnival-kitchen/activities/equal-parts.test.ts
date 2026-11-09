import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import type { Level } from '../kit';
import { CASSEROLE_HEIGHT, cutLines, isRound, type CutFood, type CutPicture } from '../steps/cut';
import { seeded } from '../test-kit';
import equalParts, { PART_NAMES, cutQuestion, partsFor, pieceQuestion } from './equal-parts';

/**
 * The pieces a cut makes and their sizes, by colouring a grid over the food:
 * every point inside it that isn't on a cut, grouped into connected pieces.
 */
function pieceSizes(food: CutFood, picture: CutPicture): number[] {
  const n = 240;
  const lines = cutLines(food, picture);
  const inside = (x: number, y: number) =>
    isRound(food) ? x * x + y * y <= 1 : Math.abs(x) <= 1 && Math.abs(y) <= CASSEROLE_HEIGHT;
  const onCut = (x: number, y: number) =>
    lines.some(([x1, y1, x2, y2]) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(x - x1 - t * dx, y - y1 - t * dy) < 0.02;
    });
  const at = (i: number) => (i / (n - 1)) * 2.2 - 1.1;
  const piece = new Int32Array(n * n).fill(-1);
  const sizes: number[] = [];
  for (let start = 0; start < n * n; start++) {
    const sx = at(start % n);
    const sy = at(Math.floor(start / n));
    if (piece[start] !== -1 || !inside(sx, sy) || onCut(sx, sy)) continue;
    const id = sizes.length;
    sizes.push(0);
    const stack = [start];
    piece[start] = id;
    while (stack.length) {
      const k = stack.pop() as number;
      sizes[id] += 1;
      const i = k % n;
      const j = Math.floor(k / n);
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= n || nj >= n) continue;
        const nk = nj * n + ni;
        if (piece[nk] !== -1 || !inside(at(ni), at(nj)) || onCut(at(ni), at(nj))) continue;
        piece[nk] = id;
        stack.push(nk);
      }
    }
  }
  return sizes.filter((s) => s > 20);
}

describe('equal parts', () => {
  it('fits the pizza, the pancakes and the mac and cheese, after they are cooked', () => {
    expect(equalParts.fits(dishById('pizza'))).toBe(true);
    expect(equalParts.fits(dishById('pancakes'))).toBe(true);
    expect(equalParts.fits(dishById('mac-and-cheese'))).toBe(true);
    expect(equalParts.fits(dishById('soup'))).toBe(false);
    const steps = equalParts.weave({
      dish: dishById('pizza'),
      level: 1,
      random: seeded(),
      start: 900,
    });
    expect(steps.map((s) => s.kind)).toEqual([
      'chop',
      'dough-toss',
      'sauce',
      'top',
      'bake',
      'cut',
      'ask',
    ]);
  });

  it('draws honest pieces: equal ones really are equal, unequal ones really are not', () => {
    for (const food of ['pizza', 'casserole'] as CutFood[]) {
      for (const parts of [2, 3, 4]) {
        const equal = pieceSizes(food, { parts, equal: true });
        expect(equal, `${food} ${parts} equal`).toHaveLength(parts);
        const mean = equal.reduce((a, b) => a + b, 0) / parts;
        for (const size of equal) expect(Math.abs(size - mean) / mean).toBeLessThan(0.05);
        const unequal = pieceSizes(food, { parts, equal: false });
        expect(unequal, `${food} ${parts} unequal`).toHaveLength(parts);
        expect(Math.max(...unequal) / Math.min(...unequal)).toBeGreaterThan(1.4);
      }
    }
  });

  it('cuts into halves or fourths at Level 1, and thirds too at Level 2', () => {
    const one = new Set<number>();
    const two = new Set<number>();
    for (let seed = 1; seed <= 30; seed++) {
      one.add(partsFor(1, seeded(seed)));
      two.add(partsFor(2, seeded(seed)));
    }
    expect([...one].sort()).toEqual([2, 4]);
    expect([...two].sort()).toEqual([2, 3, 4]);
  });

  it('shows the right cut, the same number not equal, and another number equal', () => {
    for (const level of [1, 2] as Level[]) {
      for (let seed = 1; seed <= 20; seed++) {
        const parts = partsFor(level, seeded(seed));
        const cut = cutQuestion('pizza', 'pizza', parts, level, seeded(seed));
        const q = cut.question;
        expect(q.layout).toBe('row');
        expect(cut.pictures).toHaveLength(3);
        expect(cut.pictures[q.answer]).toEqual({ parts, equal: true });
        expect(cut.pictures).toContainEqual({ parts, equal: false });
        const other = cut.pictures.find((p) => p.equal && p.parts !== parts);
        expect(other).toBeDefined();
        if (level === 1) expect([2, 4]).toContain(other?.parts);
        expect(q.text).toContain(level === 1 ? `${parts} equal pieces` : PART_NAMES[parts].many);
      }
    }
  });

  it('then names the pieces at Level 1, or counts how many make the whole at Level 2', () => {
    const one = pieceQuestion('pizza', 4, 1, seeded()).question;
    expect([...one.choices].sort()).toEqual(['one fourth', 'one half', 'one third']);
    expect(one.choices[one.answer]).toBe('one fourth');
    // The names come in any order, so where the answer sits gives nothing away.
    const places = new Set<number>();
    for (let seed = 1; seed <= 30; seed++)
      places.add(pieceQuestion('pizza', 2, 1, seeded(seed)).question.answer);
    expect(places.size).toBe(3);
    const two = pieceQuestion('pancake', 3, 2, seeded()).question;
    expect(two.text).toBe('How many thirds make the whole pancake?');
    expect(two.choices[two.answer]).toBe('3');
  });
});
