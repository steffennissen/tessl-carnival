import { C, plainText, rounded, stickerText } from '../art';
import {
  QUIZ_PICTURE,
  drawQuiz,
  observeQuiz,
  pressQuiz,
  quizBubble,
  quizFx,
  solveQuiz,
  startQuiz,
  updateQuiz,
  type Question,
  type QuizFx,
  type QuizState,
  type Step,
  type StepBasics,
  type StepRun,
  type StepView,
} from '../kit';
import { stepOf } from './index';

/**
 * Ask: a learning question with big answer buttons ("How many toppings did
 * you put on?"), with a picture of the step before it as it was left, such
 * as the pizza with its toppings. It's a learning step: nothing to fail, and
 * no part of the cooking score. See "Learning" in the README.
 */

export interface AskOptions extends StepBasics {
  kind: 'ask';
  question: Question;
  /** The picture beside the answers: the step before, as it was left (the default), or none. */
  picture?: 'previous' | 'none';
  /** A sticker over the picture, such as "+5 🍄". */
  tag?: string;
}

declare module '../kit/types' {
  interface StepKinds {
    ask: AskOptions;
  }
}

/** The part of the scene the picture shows, scaled into QUIZ_PICTURE. */
const SOURCE = { x: 200, y: 170, w: 400, h: 290 };

/** Draws an earlier step as it was left, scaled down into the picture's box. */
function drawPrevious(view: StepView<AskOptions, QuizState, QuizFx>, run: StepRun) {
  const { g } = view;
  const box = QUIZ_PICTURE;
  const step = stepOf(run.kind);
  const scale = Math.min(box.w / SOURCE.w, box.h / SOURCE.h);
  rounded(g, box.x, box.y, box.w, box.h, 24);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.fill();
  g.save();
  rounded(g, box.x, box.y, box.w, box.h, 24);
  g.clip();
  g.translate(box.x + box.w / 2, box.y + box.h / 2);
  g.scale(scale, scale);
  g.translate(-(SOURCE.x + SOURCE.w / 2), -(SOURCE.y + SOURCE.h / 2));
  step.draw({
    ...view,
    options: run.options,
    state: run.state,
    fx: view.fxOf(run) ?? step.fx?.(),
    taking: false,
  });
  g.restore();
}

const ask: Step<AskOptions, QuizState, QuizFx> = {
  kind: 'ask',
  learning: true,
  uses: () => [],
  start: (o) => startQuiz(o.question),
  title: () => 'Think about it!',
  hint: () => ['Tap the answer!', 'Tap 🔊 to hear it.'],
  icon: () => '🤔',
  progress: ({ state }) => [1, state.picked === null ? 0 : 1],
  press: (turn, x, y) => pressQuiz(turn, x, y),
  update: (turn, dt) => updateQuiz(turn, dt),
  bubble: ({ state }) => quizBubble(state),
  solve: (turn) => solveQuiz(turn),
  fx: quizFx,
  observe: (view) => observeQuiz(view),

  draw(view) {
    const { g, options, round, state, taking } = view;
    if (!taking && state.age === 0) return;
    const side = (options.question.layout ?? 'side') === 'side';
    if (side && options.picture !== 'none') {
      const index = round.steps.findIndex((run) => run.state === state);
      const before = round.steps[index - 1];
      if (before) drawPrevious(view, before);
    }
    if (side && options.tag) {
      g.save();
      g.translate(QUIZ_PICTURE.x + QUIZ_PICTURE.w - 70, QUIZ_PICTURE.y + 30);
      g.rotate(0.1);
      rounded(g, -62, -24, 124, 48, 24);
      g.fillStyle = C.butter;
      g.fill();
      stickerText(g, options.tag, 0, 1, 26, C.hotPink, 'center', 116);
      g.restore();
    } else if (side && options.picture === 'none') {
      plainText(g, '🤔', QUIZ_PICTURE.x + QUIZ_PICTURE.w / 2, QUIZ_PICTURE.y + 100, 80, C.ink);
    }
    drawQuiz(view);
  },
};

export default ask;
