import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { amountText, measureScale, parseAmount, type Level } from '../kit';
import type { CupOptions } from '../steps/cup';
import { cupScale } from '../steps/cup';
import { pourLines, type PourOptions } from '../steps/pour';
import { seeded } from '../test-kit';
import measure, {
  LEVEL_1_CUPS,
  LEVEL_2_CUPS,
  MORE_PAIRS,
  measurable,
  measureQuestion,
} from './measure';

const weave = (id: string, level: Level, seed: number) =>
  measure.weave({ dish: dishById(id), level, random: seeded(seed), start: 900 });

describe('measure it', () => {
  it('fits dishes that pour cups of something, not a splash of pasta water', () => {
    expect(measure.fits(dishById('pancakes'))).toBe(true);
    expect(measure.fits(dishById('mac-and-cheese'))).toBe(true);
    expect(measure.fits(dishById('cacio-e-pepe'))).toBe(false);
    expect(measure.fits(dishById('pizza'))).toBe(false);
    expect(measurable(dishById('lobster-bisque'))).toHaveLength(2);
  });

  it('reads ½, 1 or 2 cups at Level 1, every line numbered', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 30; seed++) {
      const { cup, pour } = measureQuestion('milk', 1, seeded(seed));
      expect(LEVEL_1_CUPS).toContain(cup.have);
      expect(cup.labels).toBe('all');
      expect(cup.need).toBeUndefined();
      expect(cup.question.choices).toEqual(['½ cup', '1 cup', '2 cups']);
      expect(cup.question.choices[cup.question.answer]).toBe(
        amountText({ value: cup.have, unit: 'cup' }),
      );
      expect(pour).toBe(cup.have);
      seen.add(cup.have);
    }
    expect(seen.size).toBe(3);
  });

  it('reads ¼, ¾ or 1½ cups at Level 2, or works out how much more', () => {
    let more = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { cup, pour, start } = measureQuestion('flour', 2, seeded(seed));
      const q = cup.question;
      expect(cup.labels).toBe('some');
      expect(new Set(q.choices).size).toBe(3);
      const answer = parseAmount(q.choices[q.answer]);
      if (cup.need === undefined) {
        expect(LEVEL_2_CUPS).toContain(cup.have);
        expect(answer?.value).toBe(cup.have);
      } else {
        more += 1;
        expect(MORE_PAIRS).toContainEqual([cup.need, cup.have]);
        expect(answer?.value).toBe(cup.need - cup.have);
        expect(q.text).toContain('How much more?');
        // The pour then fills from what we have up to what we need.
        expect(pour).toBe(cup.need);
        expect(start).toBe(cup.have);
      }
      if (cup.need === undefined) expect(pour).toBe(answer?.value);
    }
    expect(more).toBeGreaterThan(5);
  });

  it('keeps every amount on a line of the cup drawn, and asks only whole or half cups more', () => {
    for (const level of [1, 2] as Level[]) {
      for (let seed = 1; seed <= 300; seed++) {
        const { cup, pour, start } = measureQuestion('milk', level, seeded(seed));
        const on = (marks: number[], v: number) => marks.some((m) => Math.abs(m - v) < 1e-9);
        const marks = cupScale(cup).marks;
        expect(on(marks, cup.have), `have ${cup.have}`).toBe(true);
        if (cup.need !== undefined) {
          expect(on(marks, cup.need), `need ${cup.need}`).toBe(true);
          // Counting on by whole and half cups, not taking away quarters.
          expect(((cup.need - cup.have) * 2) % 1).toBe(0);
        }
        // The pour's cup has its star and its start on lines too.
        const pourMarks = measureScale(pour).marks;
        expect(on(pourMarks, pour)).toBe(true);
        if (start) expect(on(pourMarks, start)).toBe(true);
      }
    }
  });

  it('asks just before the pour, which then pours that amount', () => {
    for (const level of [1, 2] as Level[]) {
      for (let seed = 1; seed <= 6; seed++) {
        const steps = weave('pancakes', level, seed);
        const at = steps.findIndex((s) => s.kind === 'cup');
        const cup = steps[at] as CupOptions;
        const pour = steps[at + 1] as PourOptions;
        expect(pour.kind).toBe('pour');
        const i = pour.pours.indexOf(cup.item);
        const answer = parseAmount(cup.question.choices[cup.question.answer]);
        const amount = parseAmount(pour.amounts?.[i])?.value;
        if (cup.need === undefined) {
          expect(amount).toBe(answer?.value);
          expect(pour.starts).toBeUndefined();
        } else {
          // How much more: the cup starts with what we have, the star on what we need.
          expect(amount).toBe(cup.need);
          expect(parseAmount(pour.starts?.[i])?.value).toBe(cup.have);
          expect(pourLines(pour, i)?.[0]).toBe(
            `${cup.question.choices[cup.question.answer]} more ${cup.item},`,
          );
        }
        // The other pour keeps the recipe's amount.
        expect(pour.amounts?.[1 - i]).toBe(['1½ cups', '1 cup'][1 - i]);
      }
    }
    // The dish's own recipe is left alone.
    expect((dishById('pancakes').steps[1] as PourOptions).starts).toBeUndefined();
    expect((dishById('pancakes').steps[1] as PourOptions).amounts).toEqual(['1½ cups', '1 cup']);
  });
});
