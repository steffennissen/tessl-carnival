import { C, type G, rounded } from '../art';
import {
  type Box,
  type Question,
  type QuizFx,
  type QuizState,
  drawQuiz,
  observeQuiz,
  pressQuiz,
  quizBubble,
  quizFx,
  quizPlaces,
  solveQuiz,
  startQuiz,
  updateQuiz,
} from './quiz';
import type { Step, StepBasics, StepView } from './types';

/**
 * A question with a picture of its own beside the answers: a measuring cup,
 * a tray of cupcakes. It plays exactly like the `ask` step (steps/ask.ts);
 * only the picture differs, drawn by `picture` into the quiz's picture box
 * for the canvas's shape (`quizPlaces(shape).picture`), so it sits beside
 * the answers on a phone too. A step file makes one with
 * `pictureQuiz('tray', drawTray)`; `more` replaces any of the step's
 * members, such as `uses` or `icon`.
 */

/** What every picture question's recipe options have. */
export interface PictureQuizOptions extends StepBasics {
  question: Question;
}

export function pictureQuiz<O extends PictureQuizOptions>(
  kind: O['kind'],
  picture: (view: StepView<O, QuizState, QuizFx>, box: Box) => void,
  more: Partial<Step<O, QuizState, QuizFx>> = {},
): Step<O, QuizState, QuizFx> {
  return {
    kind,
    learning: true,
    uses: () => [],
    start: (o) => startQuiz(o.question),
    title: () => 'Think about it!',
    hint: () => ['Tap the answer!', 'Tap 🔊 to hear it.'],
    icon: () => '🤔',
    progress: ({ state }) => [1, state.picked === null ? 0 : 1],
    press: (turn, x, y) => pressQuiz(turn, x, y),
    update: (turn, dt) => updateQuiz(turn, dt),
    bubble: ({ state, round }) => quizBubble(state, round),
    solve: (turn) => solveQuiz(turn),
    fx: quizFx,
    observe: (view) => observeQuiz(view),
    draw(view) {
      const { g, state, taking, shape } = view;
      if (!taking && state.age === 0) return;
      const box = quizPlaces(shape).picture;
      drawPictureCard(g, box);
      g.save();
      picture(view, box);
      g.restore();
      drawQuiz(view);
    },
    ...more,
  };
}

/** The soft white card a picture sits on, as the ask step's. */
export function drawPictureCard(g: G, box: Box): void {
  rounded(g, box.x, box.y, box.w, box.h, 24);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.fill();
  g.strokeStyle = C.white;
  g.lineWidth = 3;
  g.stroke();
}
