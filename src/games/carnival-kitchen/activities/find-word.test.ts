import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from '../dishes';
import { createState, press, tick } from '../game';
import { allIngredients, ingredient } from '../ingredients';
import { DEFAULT_SETTINGS, SMART_BONUS, middleOf, quizPlaces, type Level } from '../kit';
import { FIND_SAY, jarBoxes, type FindOptions, type FindState } from '../steps/find';
import { stepOf } from '../steps';
import {
  cssScale,
  current,
  drawRound,
  keepClear,
  nextStep,
  overlaps,
  quietEffects,
  seeded,
} from '../test-kit';
import findWord, {
  PATTERNS,
  WORD_BANK,
  findTargets,
  firstSound,
  jarWords,
  makeFind,
} from './find-word';

describe('the word bank', () => {
  it('has words that practise 2nd-grade patterns, spelled the way they say', () => {
    const spelled: Record<string, (w: string) => boolean> = {
      'silent e': (w) => /[aeiou][^aeiou\s]e(s|\b)/.test(w),
    };
    for (const entry of WORD_BANK) {
      expect(entry.sounds.length, entry.word).toBeGreaterThan(0);
      for (const sound of entry.sounds) {
        expect(PATTERNS).toContain(sound);
        const has = spelled[sound] ?? ((w: string) => w.includes(sound));
        expect(has(entry.word), `${entry.word} has ${sound}`).toBe(true);
      }
      const alike = entry.alike.map((a) => a.word);
      expect(new Set([entry.word, ...alike]).size).toBe(3);
      for (const a of entry.alike) expect(a.picture.length).toBeGreaterThan(0);
    }
    expect(new Set(WORD_BANK.map((w) => w.word)).size).toBe(WORD_BANK.length);
  });

  it("only has words that are an ingredient's label, so none goes stale", () => {
    const labels = new Set(allIngredients().map((i) => i.label));
    for (const entry of WORD_BANK) expect(labels.has(entry.word), entry.word).toBe(true);
  });
});

describe('find the ingredient', () => {
  it('fits dishes with a bank word, before the step that uses it', () => {
    const fits = DISHES.filter((d) => findWord.fits(d)).map((d) => d.id);
    expect(fits).toEqual(expect.arrayContaining(['mac-and-cheese', 'pancakes', 'lobster-bisque']));
    expect(fits).not.toContain('soup');
    for (const dish of DISHES) {
      for (const target of findTargets(dish)) {
        const step = dish.steps[target.step];
        const ids = stepOf(step.kind)
          .uses(step as never)
          .map(([id]) => id);
        expect(ids).toContain(target.id);
        expect(ingredient(target.id).label).toBe(target.word.word);
      }
    }
    // A pizza's mushrooms might not go on, so it isn't asked for.
    expect(findTargets(dishById('pizza'))).toEqual([]);
  });

  it('weaves the jars in just before the step, the same each time for a seed', () => {
    for (let seed = 1; seed < 20; seed++) {
      const steps = findWord.weave({
        dish: dishById('pancakes'),
        level: 1,
        random: seeded(seed),
        start: 900,
      });
      expect(steps.map((s) => s.kind)).toEqual(['crack', 'pour', 'mix', 'find', 'flip']);
      const find = steps[3] as FindOptions;
      expect(find.word).toBe('pancake');
      expect(find.question.text).toBe('Tap the PANCAKE!');
      expect(find.question.choices[find.question.answer]).toBe('pancake');
      expect(find.pictures[find.question.answer]).toBe(ingredient('pancake').icon);
      expect(find.question.layout).toBe('row');
    }
  });

  it('puts three different first letters at Level 1, and look-alikes at Level 2', () => {
    for (const target of WORD_BANK) {
      for (let seed = 1; seed < 15; seed++) {
        const one = jarWords(target, '🧀', 1, seeded(seed));
        expect(one.words).toHaveLength(3);
        expect(new Set(one.words.map((w) => w[0])).size).toBe(3);
        // Different first sounds too: never cream and ketchup together.
        expect(new Set(one.words.map(firstSound)).size).toBe(3);
        expect(one.words[one.answer]).toBe(target.word);
        for (const w of one.words) {
          if (w !== target.word) expect(w).not.toContain(' ');
        }
        const two = jarWords(target, '🧀', 2, seeded(seed));
        expect([...two.words].sort()).toEqual(
          [target.word, ...target.alike.map((a) => a.word)].sort(),
        );
        expect(two.words[two.answer]).toBe(target.word);
        expect(jarWords(target, '🧀', 2, seeded(seed))).toEqual(two);
      }
    }
  });

  it('reads first sounds, not just first letters', () => {
    expect(firstSound('cream')).toBe(firstSound('ketchup'));
    expect(firstSound('cheese')).not.toBe(firstSound('cupcakes'));
    expect(firstSound('shells')).not.toBe(firstSound('sushi'));
    expect(firstSound('whipped cream')).toBe('w');
  });

  it('has real words for every look-alike, and tags only patterns the word has', () => {
    for (const entry of WORD_BANK) {
      for (const alike of entry.alike) expect(alike.word).not.toMatch(/whipped dream|ripped cream/);
      for (const sound of entry.sounds) {
        if (sound === 'silent e') expect(entry.word, entry.word).toMatch(/[aeiou][^aeiou]e(s?)\b/);
        else expect(entry.word).toContain(sound);
      }
    }
    expect(WORD_BANK.find((w) => w.word === 'cheese')?.sounds).not.toContain('silent e');
  });

  it('hints at the letters, and never says the word until shown', () => {
    const cheese = findTargets(dishById('mac-and-cheese'))[0];
    const find = makeFind(cheese, 2 as Level, seeded());
    expect(find.question.hint.join(' ')).toMatch(/find ch and ee!/);
    expect(find.question.hint.join(' ')).not.toMatch(/cheese/i);
    expect(find.question.help).toBe('This one says cheese!');
  });
});

/** A round of mac and cheese at its jars, at `level`. */
function onJars(level: Level = 1, seed = 1) {
  const dish = dishById('mac-and-cheese');
  const steps = findWord.weave({ dish, level, random: seeded(seed), start: 900 });
  const state = createState(dish, seeded(), {
    steps,
    activity: 'find-word',
    settings: { ...DEFAULT_SETTINGS, level },
  });
  nextStep(state);
  return state;
}

const tapJar = (state: ReturnType<typeof onJars>, i: number, shape?: 'page' | 'wide' | 'tall') => {
  const s = current<FindState>(state);
  const at = middleOf(jarBoxes(s.question.choices.length, shape)[i]);
  return press(state, at.x, at.y, shape);
};

describe('the find step', () => {
  it('takes the right jar with a cheer and a bonus, then cooks', () => {
    const state = onJars();
    const s = current<FindState>(state);
    expect(tapJar(state, s.question.answer)).toBe(true);
    expect(s.picked).toBe(s.question.answer);
    expect(state.bonus).toBe(SMART_BONUS);
    tick(state, 2);
    expect(state.stepIndex).toBe(1);
    expect(state.steps[1].kind).toBe('grate');
  });

  it('greys a wrong jar, and shows the right one after two', () => {
    const state = onJars(2);
    const s = current<FindState>(state);
    const wrong = [0, 1, 2].filter((i) => i !== s.question.answer);
    tapJar(state, wrong[0]);
    expect(s.tried).toEqual([wrong[0]]);
    tapJar(state, wrong[1]);
    expect(s.shown).toBe(true);
    tapJar(state, s.question.answer);
    expect(s.outcome).toBe('helped');
    expect(state.bonus).toBe(0);
  });

  it('counts hearing the word on 🔊 as help: no bonus, nothing taken away', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = onJars();
      const s = current<FindState>(state);
      const { speaker } = quizPlaces(shape);
      press(state, speaker.x, speaker.y, shape);
      expect(s.heard).toBe(true);
      expect(s.reads).toBe(1);
      tapJar(state, s.question.answer, shape);
      expect(s.outcome).toBe('helped');
      expect(state.bonus).toBe(0);
      expect(state.learn.answers).toEqual(['helped']);
    }
  });

  it('only ever says "Find the word!" by itself, never the word', () => {
    const state = onJars();
    const said: string[] = [];
    const effects = quietEffects();
    effects.sound = new Proxy(effects.sound, {
      get: (target, prop) =>
        prop === 'say' || prop === 'read'
          ? (text: string) => {
              said.push(text);
              return { count: 0, word: () => -1, done: () => true };
            }
          : Reflect.get(target, prop),
    });
    const run = state.steps[0];
    const step = stepOf('find');
    const view = {
      round: state,
      options: run.options,
      state: run.state,
      g: null as never,
      t: 0,
      dt: 0,
      pointer: { x: 0, y: 0, down: false },
      taking: true,
      shape: 'page' as const,
      fx: step.fx?.(),
      fxOf: () => undefined,
      effects,
    };
    tick(state, 1);
    step.observe?.(view);
    expect(said).toEqual([FIND_SAY]);
  });

  it('has big jars clear of everything in every layout, and draws them', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const boxes = jarBoxes(3, shape);
      boxes.forEach((b, i) => {
        if (shape !== 'page') {
          expect(b.h * cssScale(shape)).toBeGreaterThanOrEqual(60);
          expect(b.w * cssScale(shape)).toBeGreaterThanOrEqual(60);
        }
        for (const clear of keepClear(shape))
          expect(overlaps(b, clear), `${shape} ${i}`).toBe(false);
        boxes.slice(i + 1).forEach((c) => expect(overlaps(b, c)).toBe(false));
      });
      const state = onJars(1, 3);
      const memory = new Map();
      drawRound(state, memory, 1 / 60, shape);
      tapJar(state, (current<FindState>(state).question.answer + 1) % 3, shape);
      drawRound(state, memory, 1 / 60, shape);
      tapJar(state, current<FindState>(state).question.answer, shape);
      tick(state, 0.5);
      drawRound(state, memory, 1 / 60, shape);
    }
  });
});
