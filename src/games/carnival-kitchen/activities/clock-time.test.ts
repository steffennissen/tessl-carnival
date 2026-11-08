import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from '../dishes';
import { createState } from '../game';
import {
  DEFAULT_SETTINGS,
  clockText,
  currentRun,
  quarterWords,
  roundTime,
  stepMinutes,
  timeAtStep,
  type Level,
  type RecipeStep,
} from '../kit';
import { stepOf } from '../steps';
import type { ReadClockOptions } from '../steps/read-clock';
import type { SetClockOptions } from '../steps/set-clock';
import { seeded } from '../test-kit';
import clockTime, {
  elapsedStep,
  fitsLevel,
  handsHelp,
  planClock,
  readStep,
  swappedHands,
  timeChoices,
} from './clock-time';
import { planRound } from './index';

const at = (h: number, m: number) => h * 60 + m;

describe('clock time', () => {
  it('fits every dish, and comes up more often than other activities', () => {
    expect(DISHES.every((d) => clockTime.fits(d))).toBe(true);
    expect(clockTime.weight).toBeGreaterThan(1);
    expect(clockTime.skills).toContain('time');
  });

  it('offers the time and two classic slips: hands swapped, the next hour', () => {
    expect(clockText(swappedHands(at(16, 30)))).toBe('6:20');
    expect(clockText(swappedHands(at(15, 0)))).toBe('12:15');
    for (let seed = 1; seed < 30; seed++) {
      const { choices, index } = timeChoices(at(16, 45), 1, false, seeded(seed));
      expect(choices[index]).toBe('4:45');
      expect([...choices].sort()).toEqual(['4:45', '5:45', '9:20']);
      const words = timeChoices(at(16, 45), 1, true, seeded(seed));
      expect(words.choices[words.index]).toBe('quarter to 5');
      expect([...words.choices].sort()).toEqual(['quarter past 4', 'quarter to 4', 'quarter to 5']);
    }
    for (let time = at(14, 0); time < at(19, 0); time += 5) {
      for (const level of [1, 2] as Level[]) {
        for (const words of level === 1 && quarterWords(time) ? [false, true] : [false]) {
          const { choices, index } = timeChoices(time, level, words, seeded(time));
          expect(new Set(choices).size).toBe(3);
          expect(choices[index]).toBe(words ? quarterWords(time) : clockText(time));
        }
      }
    }
  });

  it('says where the hands point when it shows the answer', () => {
    expect(handsHelp(at(16, 30))).toBe(
      "The short hand is halfway between the 4 and the 5, and the long hand points at the 6: that's 30 minutes. It's four thirty, half past four!",
    );
    expect(handsHelp(at(15, 0))).toMatch(/points at the 3, and the long hand points straight up/);
    expect(handsHelp(at(15, 50))).toMatch(/^The short hand is almost at the 4/);
  });

  it('asks "When will it be done?" with the minutes counted on by fives', () => {
    const steps: RecipeStep[] = [{ kind: 'bake', item: 'cookies', minutes: 15 }];
    const step = elapsedStep(steps, 0, at(15, 10), seeded());
    expect(step.question.text).toBe(
      "Baking takes 15 minutes. It's 3:10 now. When will it be done?",
    );
    expect(step.question.choices[step.question.answer]).toBe('3:25');
    expect(step.question.choices).toHaveLength(3);
    expect(step.question.help).toBe(
      'Start at three ten and count on by fives: three fifteen, three twenty, three twenty-five. Done at three twenty-five!',
    );
    expect(step.span).toBe(15);
  });

  it('asks about the real kitchen time, within the level', () => {
    const kinds: Record<Level, Set<string>> = { 1: new Set(), 2: new Set() };
    for (const dish of DISHES) {
      for (const level of [1, 2] as Level[]) {
        for (let seed = 1; seed <= 12; seed++) {
          const random = seeded(seed);
          const start = level === 1 ? at(14, 30) : at(15, 5);
          const plan = planClock(dish.steps, level, start, random);
          kinds[level].add(plan.kind);
          const steps = [...plan.steps.slice(0, plan.at), plan.step, ...plan.steps.slice(plan.at)];
          // Only a "when will it be done?" changes a step: the one before, a little longer.
          plan.steps.forEach((s, i) => {
            if (s !== dish.steps[i]) {
              expect(plan.kind).toBe('elapsed');
              expect(i).toBe(plan.at - 1);
              expect(stepMinutes(s)).toBeGreaterThan(stepMinutes(dish.steps[i]));
            }
          });
          // The kitchen clock when the question comes up.
          const now = timeAtStep(steps, start, plan.at);
          if (plan.kind === 'set') {
            const set = plan.step as SetClockOptions;
            expect(set.geared).toBe(level === 1);
            expect(fitsLevel(set.target, level)).toBe(true);
            // The time the next step is done, or the start.
            expect([now, timeAtStep(steps, start, plan.at + 2)]).toContain(set.target);
            expect(set.text).toMatch(/Set the clock to /);
          } else {
            const read = plan.step as ReadClockOptions;
            expect(read.time).toBe(now);
            const q = read.question;
            if (plan.kind === 'elapsed') {
              expect(level).toBe(2);
              const cooking = steps[plan.at + 1];
              expect(stepMinutes(cooking)).toBe(read.span);
              expect(q.choices[q.answer]).toBe(clockText(timeAtStep(steps, start, plan.at + 2)));
            } else {
              expect(fitsLevel(now, level)).toBe(true);
              expect([clockText(now), quarterWords(now)]).toContain(q.choices[q.answer]);
            }
          }
        }
      }
    }
    expect([...kinds[1]].sort()).toEqual(['read', 'set']);
    expect([...kinds[2]].sort()).toEqual(['elapsed', 'read', 'set']);
  });

  it('puts "When will it be done?" right before the bake when there is one', () => {
    const cookies = dishById('sugar-cookies');
    for (let seed = 1; seed <= 20; seed++) {
      const plan = planClock(cookies.steps, 2, at(15, 10), seeded(seed));
      if (plan.kind === 'elapsed') expect(cookies.steps[plan.at].kind).toBe('bake');
    }
    // Every dish that bakes gets its question before the bake at Level 2.
    for (const dish of DISHES.filter((d) => d.steps.some((s) => s.kind === 'bake'))) {
      const kinds = new Set<string>();
      for (let seed = 1; seed <= 30; seed++) {
        const plan = planClock(dish.steps, 2, at(15, 5), seeded(seed));
        if (plan.kind !== 'elapsed') continue;
        kinds.add(dish.steps[plan.at].kind);
        expect(timeAtStep(plan.steps, at(15, 5), plan.at) % 5).toBe(0);
      }
      expect([...kinds]).toEqual(['bake']);
    }
  });

  it('reads the "took" minutes of the step before', () => {
    const soup = dishById('soup');
    const step = readStep(soup.steps, 2, at(14, 45), 2, seeded());
    expect(step.question.text).toBe('Stirring took 10 minutes. What time is it now?');
    expect(readStep(soup.steps, 0, at(14, 30), 2, seeded()).question.text).toBe(
      "Let's start cooking! What time is it now?",
    );
  });

  it('shows the same time as the kitchen clock on the wall when the question comes up', () => {
    for (const dish of DISHES.slice(0, 8)) {
      for (let seed = 1; seed <= 6; seed++) {
        const settings = { ...DEFAULT_SETTINGS, level: (seed % 2 ? 1 : 2) as Level };
        const plan = planRound(dish, settings, seeded(seed), null, [clockTime]);
        const state = createState(dish, seeded(seed), plan);
        const index = state.steps.findIndex((run) => stepOf(run.kind).learning);
        // On the question, every step before it cooked.
        state.stepIndex = index;
        const run = currentRun(state);
        if (run.kind === 'read-clock') {
          expect((run.options as ReadClockOptions).time).toBe(roundTime(state));
        }
      }
    }
  });
});
