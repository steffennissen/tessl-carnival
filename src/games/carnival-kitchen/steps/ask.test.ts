import { describe, expect, it } from 'vitest';
import { createState, maxScore, press, tick, totalScore } from '../game';
import { dishById } from '../dishes';
import {
  QUIZ_OUTRO,
  QUIZ_SPEAKER,
  SMART_BONUS,
  choiceBoxes,
  middleOf,
  plainPlan,
  quizBubble,
  quizPlaces,
  type Question,
  type QuizState,
} from '../kit';
import { current, drawRound, nextStep, playThrough, seeded } from '../test-kit';
import type { AskOptions } from './ask';

const QUESTION: Question = {
  text: 'How many toppings did you put on?',
  choices: ['4', '5', '6'],
  answer: 1,
  hint: ['Point and count', 'them one by one!'],
  help: "Let's count: one, two, three, four, five. Five!",
};
const ASK: AskOptions = { kind: 'ask', question: QUESTION };

/** Soup with a question after its first step, on the question. */
function onQuestion() {
  const soup = dishById('soup');
  const dish = { ...soup, steps: [soup.steps[0], ASK, ...soup.steps.slice(1)] };
  const state = createState(dish, seeded(), plainPlan(dish));
  state.stepIndex = 1;
  nextStep(state);
  return state;
}
const tap = (state: ReturnType<typeof onQuestion>, i: number) => {
  const at = middleOf(choiceBoxes(3)[i]);
  return press(state, at.x, at.y);
};

describe('ask', () => {
  it('takes a right answer with a cheer and a bonus, then moves on', () => {
    const state = onQuestion();
    expect(tap(state, 1)).toBe(true);
    const q = current<QuizState>(state);
    expect(q.picked).toBe(1);
    expect(state.bonus).toBe(SMART_BONUS);
    expect(quizBubble(q)).toEqual(['Yes! You are', 'a Smart Chef!']);
    tick(state, QUIZ_OUTRO);
    expect(state.stepIndex).toBe(2);
    expect(state.scores[1]).toBe(0);
  });

  it('greys a wrong answer with a hint, and shows the answer after two', () => {
    const state = onQuestion();
    tap(state, 0);
    const q = current<QuizState>(state);
    expect(q.tried).toEqual([0]);
    expect(quizBubble(q)).toEqual(QUESTION.hint);
    tap(state, 0); // tried already: nothing
    expect(q.wrong).toBe(1);
    tap(state, 2);
    expect(q.shown).toBe(true);
    expect(quizBubble(q)).toEqual(['It is 5!', 'Tap the 5!']);
    tap(state, 1);
    expect(q.outcome).toBe('helped');
    expect(state.bonus).toBe(0);
  });

  it('never says "Not yet!", and the speaker asks for the question again', () => {
    const state = onQuestion();
    expect(press(state, 10, 10)).toBe(true);
    press(state, QUIZ_SPEAKER.x, QUIZ_SPEAKER.y);
    expect(current<QuizState>(state).reads).toBe(1);
    expect(current<QuizState>(state).wrong).toBe(0);
  });

  it("isn't part of the cooking score or the stars", () => {
    const soup = dishById('soup');
    const dish = { ...soup, steps: [...soup.steps, ASK] };
    const state = createState(dish, seeded(), plainPlan(dish));
    expect(maxScore(state)).toBe(soup.steps.length * 100);
    const memory = new Map();
    playThrough(state, (dt) => drawRound(state, memory, dt));
    expect(state.phase).toBe('over');
    expect(totalScore(state)).toBeGreaterThanOrEqual(SMART_BONUS);
  });

  it('draws in every layout, with its picture', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = onQuestion();
      const memory = new Map();
      drawRound(state, memory, 1 / 60, shape);
      tap(state, 0);
      tap(state, 2);
      drawRound(state, memory, 1 / 60, shape);
    }
  });

  it('takes taps on the bigger buttons and speaker of a phone', () => {
    for (const shape of ['wide', 'tall'] as const) {
      const state = onQuestion();
      const { speaker } = quizPlaces(shape);
      press(state, speaker.x, speaker.y, shape);
      expect(current<QuizState>(state).reads).toBe(1);
      const at = middleOf(choiceBoxes(3, 'side', shape)[1]);
      press(state, at.x, at.y, shape);
      expect(current<QuizState>(state).picked).toBe(1);
    }
  });
});
