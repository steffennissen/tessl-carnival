import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISHES } from '../dishes';
import { createState, maxScore } from '../game';
import { ingredient } from '../ingredients';
import { DEFAULT_SETTINGS, NO_LEARNING, type Activity, type Level } from '../kit';
import { stepOf } from '../steps';
import { drawRound, playThrough, seeded } from '../test-kit';
import { ACTIVITIES, activityOf, pickWeighted, planRound } from './index';

/**
 * Every activity in this folder, woven into every dish it fits, at both
 * levels: its steps exist, it can be cooked to the end (answering as someone
 * who knows), every frame draws in every layout, and the cooking score is
 * what the dish alone could score. New activities are checked here for free.
 */
describe('learning activities', () => {
  it('finds one activity per file in activities/', () => {
    const files = readdirSync(import.meta.dirname)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
      .map((f) => f.slice(0, -3));
    expect(ACTIVITIES.map((a) => a.id).sort()).toEqual(files.sort());
    expect(() => activityOf('juggling')).toThrow('No activity "juggling"');
  });

  for (const activity of ACTIVITIES) {
    describe(activity.id, () => {
      it('fits at least one dish', () => {
        expect(DISHES.filter((d) => activity.fits(d)).length).toBeGreaterThan(0);
      });

      for (const dish of DISHES.filter((d) => activity.fits(d))) {
        for (const level of [1, 2] as Level[]) {
          it(`weaves into ${dish.id} at Level ${level}, and cooks and draws to the end`, () => {
            for (let seed = 1; seed <= 4; seed++) {
              const settings = { ...DEFAULT_SETTINGS, level };
              const plan = planRound(dish, settings, seeded(seed), null, [activity]);
              expect(plan.activity).toBe(activity.id);
              // The same seed weaves the same round.
              expect(planRound(dish, settings, seeded(seed), null, [activity])).toEqual(plan);
              // The dish's own recipe is left alone.
              expect(dish.steps).toBe(DISHES.find((d) => d.id === dish.id)?.steps);
              for (const step of plan.steps) {
                for (const [id, role] of stepOf(step.kind).uses(step as never)) {
                  expect(ingredient(id)[role], `${id} as ${role}`).toBeDefined();
                }
              }
              expect(plan.steps.some((s) => stepOf(s.kind).learning)).toBe(true);
              for (const shape of ['page', 'wide', 'tall'] as const) {
                const state = createState(dish, seeded(seed), plan);
                expect(maxScore(state)).toBe(
                  plan.steps.filter((s) => !stepOf(s.kind).learning).length * 100,
                );
                const memory = new Map();
                playThrough(state, (dt) => drawRound(state, memory, dt, shape));
                expect(state.phase).toBe('over');
                expect(state.learn.answers.every((a) => a === 'right')).toBe(true);
              }
            }
          });
        }
      }
    });
  }
});

describe('planning a round', () => {
  const fake = (id: string, fits = true): Activity => ({
    id,
    name: id,
    skills: ['math'],
    fits: () => fits,
    weave: ({ dish }) => dish.steps,
  });
  const dish = DISHES[0];

  it('weaves in nothing when learning is off', () => {
    const plan = planRound(dish, NO_LEARNING, seeded(), null, [fake('a')]);
    expect(plan.activity).toBeNull();
    expect(plan.steps).toBe(dish.steps);
    expect(plan.start).toBeGreaterThan(0);
  });

  it('weaves in nothing when no activity fits the dish', () => {
    expect(
      planRound(dish, DEFAULT_SETTINGS, seeded(), null, [fake('a', false)]).activity,
    ).toBeNull();
  });

  it('never picks the same activity twice in a row when another fits', () => {
    const from = [fake('a'), fake('b'), fake('c')];
    let previous: string | null = null;
    const seen = new Set<string>();
    for (let seed = 1; seed < 40; seed++) {
      const plan = planRound(dish, DEFAULT_SETTINGS, seeded(seed), previous, from);
      expect(plan.activity).not.toBe(previous);
      seen.add(plan.activity ?? '');
      previous = plan.activity;
    }
    expect(seen.size).toBe(3);
    // The only one that fits may come again.
    expect(planRound(dish, DEFAULT_SETTINGS, seeded(), 'a', [fake('a')]).activity).toBe('a');
  });

  it('picks by weight: an activity with weight 3 comes three times as often', () => {
    const from = [fake('a'), { ...fake('b'), weight: 3 }];
    expect(pickWeighted(from, 0)).toBe(0);
    expect(pickWeighted(from, 0.24)).toBe(0);
    expect(pickWeighted(from, 0.26)).toBe(1);
    expect(pickWeighted(from, 0.999)).toBe(1);
    // Equal weights split evenly, as before weights.
    const even = [fake('a'), fake('b'), fake('c')];
    expect([0, 0.34, 0.67].map((r) => pickWeighted(even, r))).toEqual([0, 1, 2]);
    const counts = { a: 0, b: 0 };
    for (let seed = 1; seed <= 400; seed++) {
      const plan = planRound(dish, DEFAULT_SETTINGS, seeded(seed), null, from);
      counts[plan.activity as 'a' | 'b'] += 1;
    }
    expect(counts.b / counts.a).toBeGreaterThan(2);
    expect(counts.b / counts.a).toBeLessThan(4.5);
  });

  it("doesn't give the answer away by where it sits", () => {
    // Every question every activity asks, in every dish, at both levels: the
    // right answer is first, middle or last about as often as each other.
    for (const activity of ACTIVITIES) {
      const at = [0, 0, 0];
      for (const dish of DISHES.filter((d) => activity.fits(d))) {
        for (const level of [1, 2] as Level[]) {
          for (let seed = 1; seed <= 60; seed++) {
            const random = seeded(seed * 7919 + level);
            const steps = activity.weave({ dish, level, random, start: 900 });
            for (const step of steps) {
              const q = (step as { question?: { choices: string[]; answer: number } }).question;
              if (q?.choices.length === 3) at[q.answer] += 1;
            }
          }
        }
      }
      const total = at[0] + at[1] + at[2];
      if (!total) continue;
      for (const n of at) {
        expect(n / total, `${activity.id}: ${at.join(', ')}`).toBeLessThan(0.6);
        expect(n / total, `${activity.id}: ${at.join(', ')}`).toBeGreaterThan(0.15);
      }
    }
  });
});
