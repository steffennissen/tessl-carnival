import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { startQuiz, type Level } from '../kit';
import { rowTotalsShown, type TrayOptions } from '../steps/tray';
import { seeded } from '../test-kit';
import trays, { SKIP_ROWS, trayChoices, trayQuestion } from './trays';

describe('tray arrays', () => {
  it('fits cupcakes, cookies and sushi, after they are baked or cut', () => {
    expect(trays.fits(dishById('cupcakes'))).toBe(true);
    expect(trays.fits(dishById('sugar-cookies'))).toBe(true);
    expect(trays.fits(dishById('sushi-rolls'))).toBe(true);
    expect(trays.fits(dishById('soup'))).toBe(false);
    const steps = trays.weave({
      dish: dishById('cupcakes'),
      level: 1,
      random: seeded(),
      start: 900,
    });
    expect(steps.map((s) => s.kind)).toEqual(['crack', 'pour', 'mix', 'bake', 'tray', 'top']);
    const sushi = trays.weave({
      dish: dishById('sushi-rolls'),
      level: 2,
      random: seeded(),
      start: 900,
    });
    expect(sushi[sushi.length - 1].kind).toBe('tray');
  });

  it('counts by 2s, 5s or 10s at Level 1, and up to 5 by 5 at Level 2', () => {
    const counts = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const one = trayQuestion('cupcake', 1, seeded(seed));
      expect([2, 5, 10]).toContain(one.cols);
      expect(one.rows).toBeGreaterThanOrEqual(2);
      expect(one.rows).toBeLessThanOrEqual(SKIP_ROWS[one.cols]);
      expect(one.skip).toBe(true);
      expect(one.question.text).toContain(`Count by ${one.cols}s!`);
      counts.add(one.cols);
      const two = trayQuestion('cookie', 2, seeded(seed));
      for (const n of [two.rows, two.cols]) {
        expect(n).toBeGreaterThanOrEqual(2);
        expect(n).toBeLessThanOrEqual(5);
      }
      expect(two.skip).toBe(false);
    }
    expect(counts.size).toBe(3);
  });

  it('has the right answer among three different choices', () => {
    for (const level of [1, 2] as Level[]) {
      for (let seed = 1; seed <= 40; seed++) {
        const t = trayQuestion('sushi', level, seeded(seed));
        const q = t.question;
        expect(Number(q.choices[q.answer])).toBe(t.rows * t.cols);
        expect(new Set(q.choices).size).toBe(3);
        for (const c of q.choices) expect(Number(c)).toBeGreaterThan(0);
      }
    }
    // Level 1's wrong answers are a row more and a row less.
    expect(trayChoices(3, 5, 1, seeded())).toEqual({ choices: [10, 15, 20], index: 1 });
  });

  it('says how to get it: skip counting, or adding the rows', () => {
    const one = trayQuestion('cupcake', 1, seeded(3));
    const counts = Array.from({ length: one.rows }, (_, r) => (r + 1) * one.cols);
    expect(one.question.help).toBe(`${counts.join(', ')}. ${one.rows * one.cols} cupcakes!`);
    const two = trayQuestion('cookie', 2, seeded(3));
    expect(two.question.help).toContain(' + ');
  });

  it('shows the running totals after a wrong try, all but the last row', () => {
    const options: TrayOptions = trayQuestion('cupcake', 1, seeded(2));
    const state = startQuiz(options.question);
    expect(rowTotalsShown(options, state)).toBe(0);
    state.wrong = 1;
    expect(rowTotalsShown(options, state)).toBe(options.rows - 1);
    state.shown = true;
    expect(rowTotalsShown(options, state)).toBe(options.rows);
  });
});
