import { describe, expect, it } from 'vitest';
import { planRound } from '../activities';
import { DISHES, dishById } from '../dishes';
import { createState, liveScore, press, release, tick, totalScore } from '../game';
import { CIRCLE, DEFAULT_SETTINGS, currentRun, type CircleState, type KitchenState } from '../kit';
import type { Shape } from '../layout';
import { stepOf } from '../steps';
import { current, fakeCanvas, playThrough, quietEffects, ready, seeded } from '../test-kit';
import { CAT, PETS, catMiddle, type CatState } from './cat';
import { CHAOS, chaosOf, planSurprise, surpriseBubble } from './index';
import { BUBBLES, BUBBLE_GAP, RISE_TIME, bubbleAt, type BubblesState } from './bubbles';
import { BACK_TIME, DARK_TIME, FLICKER_TIME, darkness } from './flashlight';
import {
  CHAOS_BONUS,
  CHAOS_CHANCE,
  CHAOS_WAIT,
  finishChaos,
  planChaos,
  type ChaosRun,
} from './rules';
import { createShow, showSurprise, surpriseTilt } from './show';
import { CATCH, SNOW_TIME, SPRINKLE_BOWL, type SprinklesState } from './sprinkles';
import { LEG, TAPS, onLeg, type WobbleState } from './wobble';

const learning = (run: KitchenState['steps'][number]) => !!stepOf(run.kind).learning;

/** A round of `dish` on its `kind` step, its card gone, with surprise `id` due there. */
function withSurprise(dish: string, kind: string, id: string): KitchenState {
  const state = ready(dish, kind);
  state.chaos = {
    id,
    from: state.stepIndex,
    wait: CHAOS_WAIT[0],
    phase: 'waiting',
    step: -1,
    state: null,
    age: 0,
    paid: 0,
    down: false,
    seed: 7,
  };
  return state;
}

/** Ticks until the surprise starts. */
function startIt(state: KitchenState): ChaosRun {
  for (let i = 0; i < 200 && state.chaos?.phase === 'waiting'; i++) tick(state, 0.05);
  const run = state.chaos;
  if (!run || run.phase !== 'on') throw new Error('The surprise did not start');
  return run;
}

/** The surprise's state, typed. */
const chaosState = <S>(state: KitchenState) => state.chaos?.state as S;

describe('kitchen surprises', () => {
  it('has at least five, each in its own file with lines that fit the bubble', () => {
    expect(CHAOS.length).toBeGreaterThanOrEqual(5);
    expect(CHAOS.map((c) => c.id)).toEqual(
      expect.arrayContaining(['bubbles', 'cat', 'flashlight', 'sprinkles', 'wobble']),
    );
    for (const chaos of CHAOS) {
      expect(chaosOf(chaos.id)).toBe(chaos);
      expect(chaos.says.start.length).toBeGreaterThan(0);
      expect(chaos.says.end.length).toBeLessThanOrEqual(20);
    }
    expect(() => chaosOf('nope')).toThrow();
  });

  describe('planning', () => {
    const steps = createState(dishById('pizza'), seeded()).steps;

    it('never comes in the first round of a visit, or with surprises off', () => {
      for (let seed = 1; seed < 200; seed++) {
        const plan = { round: 0, on: true, learning };
        expect(planChaos(steps, CHAOS, seeded(seed), plan)).toBeNull();
        expect(planChaos(steps, CHAOS, seeded(seed), { ...plan, round: 3, on: false })).toBeNull();
      }
    });

    it('comes in about one round in three', () => {
      let count = 0;
      const rounds = 3000;
      const random = seeded(5);
      for (let i = 0; i < rounds; i++) {
        if (planChaos(steps, CHAOS, random, { round: 1 + i, on: true, learning })) count += 1;
      }
      expect(count / rounds).toBeGreaterThan(CHAOS_CHANCE - 0.04);
      expect(count / rounds).toBeLessThan(CHAOS_CHANCE + 0.04);
    });

    it('picks a cooking step after the first that it fits, the same for the same seed', () => {
      for (const dish of DISHES) {
        for (let seed = 1; seed < 40; seed++) {
          const plan = planRound(dish, DEFAULT_SETTINGS, seeded(seed));
          const state = createState(dish, seeded(seed), plan);
          planSurprise(state, seeded(seed), { round: 2, on: true });
          const again = createState(dish, seeded(seed), plan);
          planSurprise(again, seeded(seed), { round: 2, on: true });
          expect(again.chaos).toEqual(state.chaos);
          const run = state.chaos;
          if (!run) continue;
          expect(run.from).toBeGreaterThan(0);
          const step = state.steps[run.from];
          expect(learning(step)).toBe(false);
          expect(chaosOf(run.id).fits(step)).toBe(true);
          expect(run.wait).toBeGreaterThanOrEqual(CHAOS_WAIT[0]);
          expect(run.wait).toBeLessThanOrEqual(CHAOS_WAIT[1]);
        }
      }
    });

    it('only bubbles over in steps with a pot, bowl or blender', () => {
      const bubbles = chaosOf('bubbles');
      const kinds = DISHES.flatMap((d) => d.steps.map((s) => s.kind));
      for (const kind of new Set(kinds)) {
        const run = { kind, options: { kind }, state: null };
        expect(bubbles.fits(run)).toBe(['stir', 'mix', 'pour', 'blend'].includes(kind));
      }
    });
  });

  describe('starting', () => {
    it('waits for the card to go, its step, and nobody holding on', () => {
      const state = withSurprise('soup', 'stir', 'cat');
      state.chaos!.from = 2;
      for (let i = 0; i < 100; i++) tick(state, 0.05);
      expect(state.chaos?.phase).toBe('waiting');
      // On the next step, while its card is up: still waiting.
      state.stepIndex = 2;
      state.banner = 1;
      tick(state, 0.5);
      expect(state.chaos?.phase).toBe('waiting');
      // Held down past its wait: it waits for the let-go.
      tick(state, 0.5);
      press(state, 0, 0);
      tick(state, 1);
      tick(state, 1.5);
      expect(state.chaos?.phase).toBe('waiting');
      release(state);
      tick(state, 0.05);
      expect(state.chaos?.phase).toBe('on');
      expect(state.chaos?.step).toBe(2);
    });

    it('hears a let-go that comes while the next card is up', () => {
      const state = withSurprise('soup', 'stir', 'cat');
      // The press that finishes the step, and its let-go under the next card.
      press(state, CIRCLE.x + 80, CIRCLE.y);
      state.banner = 1;
      release(state);
      expect(state.chaos?.down).toBe(false);
    });

    it('moves on to a later step it fits when its step ends first', () => {
      const state = withSurprise('soup', 'chop', 'cat');
      state.chaos!.wait = 1e9;
      state.chaos!.from = 0;
      for (let i = 0; i < 30; i++) {
        press(state, 400, 275);
        release(state);
        tick(state, 0.5);
      }
      expect(state.stepIndex).toBeGreaterThan(0);
      state.chaos!.wait = 0.1;
      if (state.banner > 0) tick(state, state.banner);
      startIt(state);
      expect(state.chaos?.step).toBe(state.stepIndex);
    });

    it('never starts in a learning step', () => {
      const dish = dishById('pizza');
      const plan = planRound(dish, DEFAULT_SETTINGS, seeded(3));
      const state = createState(dish, seeded(3), plan);
      const i = state.steps.findIndex(learning);
      expect(i).toBeGreaterThanOrEqual(0);
      state.stepIndex = i;
      state.banner = 0;
      state.chaos = { ...withSurprise('soup', 'stir', 'cat').chaos!, from: i };
      for (let k = 0; k < 100; k++) tick(state, 0.1);
      expect(state.chaos.phase).toBe('waiting');
    });
  });

  describe('never punishing', () => {
    it('pauses the step: no timer runs while the cat is on the counter', () => {
      const state = withSurprise('soup', 'stir', 'cat');
      startIt(state);
      const left = current<CircleState>(state).timeLeft;
      for (let i = 0; i < 400; i++) tick(state, 0.05);
      expect(current<CircleState>(state).timeLeft).toBe(left);
      expect(state.chaos?.phase).toBe('on');
    });

    it('keeps taps away from the step, and its score, combo and state as they were', () => {
      const state = withSurprise('soup', 'chop', 'wobble');
      press(state, 400, 275);
      release(state);
      startIt(state);
      const before = JSON.stringify(currentRun(state).state);
      const { combo, scores } = state;
      const score = totalScore(state);
      for (let i = 0; i < 20; i++) {
        expect(press(state, 400, 275)).toBe(true);
        expect(release(state)).toBeNull();
        tick(state, 0.3);
      }
      expect(JSON.stringify(currentRun(state).state)).toBe(before);
      expect(state.combo).toBe(combo);
      expect(state.scores).toEqual(scores);
      expect(totalScore(state)).toBe(score);
    });

    it('adds its bonus once, and cooking carries on', () => {
      const state = withSurprise('soup', 'stir', 'cat');
      const run = startIt(state);
      const before = liveScore(state);
      for (let i = 0; i < PETS; i++) press(state, catMiddle().x, catMiddle().y);
      for (let i = 0; i < 40; i++) tick(state, 0.05);
      expect(run.phase).toBe('over');
      expect(liveScore(state)).toBe(before + CHAOS_BONUS);
      finishChaos(state, run);
      expect(liveScore(state)).toBe(before + CHAOS_BONUS);
      const left = current<CircleState>(state).timeLeft;
      tick(state, 1);
      expect(current<CircleState>(state).timeLeft).toBeCloseTo(left - 1);
    });

    it("shows the surprise's lines in Chef Bunny's bubble while it's on", () => {
      const state = withSurprise('soup', 'stir', 'bubbles');
      expect(surpriseBubble(state)).toBeNull();
      startIt(state);
      expect(surpriseBubble(state)?.[0]).toBe('Bubbling over!');
    });
  });

  describe('flashlight', () => {
    it('flickers, stays dim, then the lights come back', () => {
      expect(darkness(0)).toBe(0);
      expect(darkness(FLICKER_TIME + 1)).toBeGreaterThan(0.5);
      expect(darkness(FLICKER_TIME + DARK_TIME + BACK_TIME)).toBe(0);
    });

    it('lets her keep cooking in the dark, and ends after about 8 seconds', () => {
      const state = withSurprise('soup', 'stir', 'flashlight');
      const run = startIt(state);
      const left = current<CircleState>(state).timeLeft;
      tick(state, 1);
      expect(current<CircleState>(state).timeLeft).toBeCloseTo(left - 1);
      press(state, CIRCLE.x + 80, CIRCLE.y);
      expect(current<CircleState>(state).lastAngle).not.toBeNull();
      release(state);
      // A long-lived pot: keep the step going.
      current<CircleState>(state).timeLeft = 100;
      for (let t = 0; t < FLICKER_TIME + DARK_TIME + BACK_TIME + 0.2; t += 0.05) tick(state, 0.05);
      expect(run.phase).toBe('over');
      expect(run.paid).toBe(CHAOS_BONUS);
    });

    it('still shows its "+5" on the decorate screen when it ends with the round', () => {
      const state = withSurprise('soup', 'season', 'flashlight');
      const show = createShow();
      const context = {
        g: fakeCanvas(),
        t: 1,
        dt: 1 / 20,
        pointer: { x: 400, y: 250, down: false },
        shape: 'page' as const,
        screen: { x: 0, y: 0, w: 800, h: 500 },
        effects: quietEffects(),
      };
      startIt(state);
      expect(showSurprise(show, state, context)?.kind).toBe('start');
      for (let go = 0; go < 20 && state.phase === 'playing'; go++) {
        press(state, 0, 0);
        tick(state, 2);
        release(state);
      }
      expect(state.phase).toBe('over');
      expect(showSurprise(show, state, context)?.kind).toBe('end');
      expect(show.endAge).toBeGreaterThan(0);
      expect(show.line).toBeNull();
    });

    it('ends, with its bonus, when its step does', () => {
      const state = withSurprise('soup', 'season', 'flashlight');
      const run = startIt(state);
      for (let go = 0; go < 20 && state.phase === 'playing'; go++) {
        press(state, 0, 0);
        tick(state, 2);
        release(state);
      }
      expect(state.phase).toBe('over');
      expect(run.phase).toBe('over');
      expect(run.paid).toBe(CHAOS_BONUS);
      // Already in the round's score when it's saved (and its coins counted).
      expect(totalScore(state)).toBe(state.scores.reduce((a, b) => a + b, 0) + state.bonus);
      expect(state.bonus).toBeGreaterThanOrEqual(CHAOS_BONUS);
    });
  });

  describe('counter cat', () => {
    it('hops on, takes three pets (misses do nothing), then hops off', () => {
      const state = withSurprise('pizza', 'top', 'cat');
      const run = startIt(state);
      const cat = chaosState<CatState>(state);
      tick(state, 1);
      expect(cat.phase).toBe('sit');
      press(state, CAT.x + 300, 100);
      expect(cat.pets).toBe(0);
      expect(cat.misses).toBe(1);
      for (let i = 0; i < PETS; i++) press(state, catMiddle().x + 60, catMiddle().y);
      expect(cat.phase).toBe('out');
      press(state, catMiddle().x, catMiddle().y);
      expect(cat.pets).toBe(PETS);
      for (let i = 0; i < 40; i++) tick(state, 0.05);
      expect(run.phase).toBe('over');
    });
  });

  describe('bubbling over', () => {
    it('pops bubbles that are out, one a tap, until they are all gone', () => {
      const state = withSurprise('soup', 'stir', 'bubbles');
      const run = startIt(state);
      const s = chaosState<BubblesState>(state);
      expect(s.bubbles).toHaveLength(BUBBLES);
      // A bubble that hasn't come out yet can't be popped.
      const late = s.bubbles.reduce((a, b) => (b.born > a.born ? b : a));
      press(state, late.x, late.y);
      expect(late.popped).toBe(false);
      for (let t = 0; t < BUBBLES * BUBBLE_GAP + RISE_TIME; t += 0.05) tick(state, 0.05);
      press(state, 790, 490);
      expect(s.bubbles.filter((b) => b.popped)).toHaveLength(0);
      for (const b of s.bubbles) {
        const at = bubbleAt(s, b)!;
        press(state, at.x + b.r, at.y);
      }
      expect(s.bubbles.every((b) => b.popped)).toBe(true);
      expect(run.phase).toBe('over');
      expect(state.bonus).toBe(CHAOS_BONUS);
    });
  });

  describe('sprinkle snow', () => {
    it('catches sprinkles in the bowl that follows the finger', () => {
      const state = withSurprise('soup', 'stir', 'sprinkles');
      const run = startIt(state);
      const s = chaosState<SprinklesState>(state);
      // The bowl stays on the counter, wherever the finger goes.
      press(state, 0, 0);
      expect(s.bowlX).toBe(SPRINKLE_BOWL.left);
      release(state);
      // Chase every sprinkle: the bowl fills well before the snow stops.
      for (let t = 0; t < SNOW_TIME - 1 && run.phase === 'on'; t += 0.05) {
        const lowest = s.sprinkles.reduce<{ x: number; y: number } | null>(
          (a, p) => (!a || p.y > a.y ? p : a),
          null,
        );
        if (lowest) press(state, lowest.x, 300);
        release(state);
        tick(state, 0.05);
      }
      expect(run.phase).toBe('over');
      expect(s.caught).toBe(CATCH);
    });

    it('fills the bowl by itself if it takes a long time', () => {
      const state = withSurprise('soup', 'stir', 'sprinkles');
      const run = startIt(state);
      const s = chaosState<SprinklesState>(state);
      // Never moving the bowl, from the edge.
      press(state, 0, 0);
      release(state);
      for (let t = 0; t < SNOW_TIME + 0.5; t += 0.05) tick(state, 0.05);
      expect(s.caught).toBe(CATCH);
      expect(run.phase).toBe('over');
      expect(run.paid).toBe(CHAOS_BONUS);
    });
  });

  describe('wobbly table', () => {
    it('wobbles until the leg is tapped twice, then settles', () => {
      const state = withSurprise('soup', 'stir', 'wobble');
      const run = startIt(state);
      const s = chaosState<WobbleState>(state);
      expect(surpriseTilt(state, 0.3)).not.toBeNull();
      expect(onLeg(400, 200)).toBe(false);
      press(state, 400, 200);
      expect(s.taps).toBe(0);
      for (let i = 0; i < TAPS; i++) press(state, LEG.x, (LEG.top + LEG.bottom) / 2);
      expect(s.fixedAge).toBe(0);
      for (let i = 0; i < 20; i++) tick(state, 0.05);
      expect(run.phase).toBe('over');
      expect(surpriseTilt(state, 0.3)).toBeNull();
    });
  });

  describe('drawing', () => {
    const shapes: Shape[] = ['page', 'wide', 'tall'];
    for (const chaos of CHAOS) {
      for (const shape of shapes) {
        it(`draws ${chaos.id} on a ${shape} screen without NaN, start to end`, () => {
          const dish = chaos.id === 'bubbles' ? 'soup' : 'pizza';
          const kind = chaos.id === 'bubbles' ? 'stir' : 'top';
          const state = withSurprise(dish, kind, chaos.id);
          const show = createShow();
          const effects = quietEffects();
          const context = {
            g: fakeCanvas(),
            t: 1.5,
            dt: 1 / 20,
            pointer: { x: 420, y: 260, down: false },
            shape,
            screen: { x: -100, y: -200, w: 1000, h: 1300 },
            effects,
          };
          const news: string[] = [];
          for (let frame = 0; frame < 2000 && state.chaos?.phase !== 'over'; frame++) {
            tick(state, 1 / 20);
            const said = showSurprise(show, state, { ...context, t: frame / 20 });
            if (said) news.push(said.kind);
            if (frame === 120 && state.chaos?.phase === 'on') {
              chaos.solve({ round: state, state: state.chaos.state });
            }
            if (frame % 7 === 0 && state.chaos?.phase === 'on') {
              surpriseTilt(state, frame / 20);
              const turn = { round: state, state: state.chaos.state };
              chaos.bubble(turn.state);
            }
          }
          for (let frame = 0; frame < 40; frame++) {
            const said = showSurprise(show, state, context);
            if (said) news.push(said.kind);
          }
          expect(state.chaos?.phase).toBe('over');
          expect(news).toEqual(['start', 'end']);
        });
      }
    }
  });

  it('a whole round with a surprise plays to the end', () => {
    for (const chaos of CHAOS) {
      const state = withSurprise('soup', 'stir', chaos.id);
      state.chaos!.wait = 0;
      tick(state, 0.05);
      expect(state.chaos?.phase).toBe('on');
      // Solve the surprise whenever it's on, as a cook would.
      playThrough(state, () => {
        const run = state.chaos;
        if (run?.phase === 'on' && run.age > 1) {
          chaosOf(run.id).solve({ round: state, state: run.state });
          tick(state, 0);
        }
      });
      expect(state.phase).toBe('over');
      expect(state.chaos?.phase).toBe('over');
    }
  });
});
