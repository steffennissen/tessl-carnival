import { C, circle, clamp01, easeOutBack, fillStroke, rounded } from '../art';
import type { Shape } from '../layout';
import {
  drawClock,
  drawQuiz,
  handAngles,
  observeQuiz,
  pressQuiz,
  quizBubble,
  quizFx,
  quizPlaces,
  solveQuiz,
  startQuiz,
  updateQuiz,
  type Question,
  type QuizFx,
  type QuizState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Read the clock: a question about time ("What time is it now?", "When will
 * it be done?") with a big analog clock beside the answers. It's the quiz
 * from kit/quiz.ts, with a clock for its picture. A learning step: nothing
 * to fail, and no part of the cooking score.
 */

export interface ReadClockOptions extends StepBasics {
  kind: 'read-clock';
  question: Question;
  /** What the big clock shows (minutes since midnight). */
  time: number;
  /**
   * Minutes that go by from `time`, for a "when will it be done?" question:
   * once it's answered (or shown), the clock shades them in, so she can see
   * the minute hand's way round.
   */
  span?: number;
}

declare module '../kit/types' {
  interface StepKinds {
    'read-clock': ReadClockOptions;
  }
}

/**
 * The big clock, in the middle of the quiz's picture for the canvas's shape,
 * as big as fits with a little room round it.
 */
export function readClockAt(shape: Shape = 'page') {
  const box = quizPlaces(shape).picture;
  return {
    box,
    x: box.x + box.w / 2,
    y: box.y + box.h / 2,
    r: Math.min(box.w, box.h) / 2 - 6,
  };
}

const readClock: Step<ReadClockOptions, QuizState, QuizFx> = {
  kind: 'read-clock',
  learning: true,
  uses: () => [],
  start: (o) => startQuiz(o.question),
  title: () => 'Read the clock!',
  hint: () => ['Short hand: the hour.', 'Long hand: the minutes.'],
  icon: () => '🕒',
  progress: ({ state }) => [1, state.picked === null ? 0 : 1],
  press: (turn, x, y) => pressQuiz(turn, x, y),
  update: (turn, dt) => updateQuiz(turn, dt),
  bubble: ({ state }) => quizBubble(state),
  solve: (turn) => solveQuiz(turn),
  fx: quizFx,
  observe: (view) => observeQuiz(view),

  draw(view) {
    const { g, t, options, state, taking, shape } = view;
    if (!taking && state.age === 0) return;
    const { box, x, y, r } = readClockAt(shape);
    const pop = easeOutBack(clamp01(state.age / 0.4));
    g.save();
    g.translate(x, y);
    g.scale(pop, pop);
    g.translate(-x, -y);
    rounded(g, box.x, box.y, box.w, box.h, 24);
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    g.fill();
    drawClock(g, x, y, r, options.time, { t });
    // The minutes going by, shaded in once it's answered or shown.
    if (options.span && (state.shown || state.picked !== null)) {
      const from = handAngles(options.time).minute - Math.PI / 2;
      const to = from + (options.span / 60) * Math.PI * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, r * 0.8, from, to);
      g.closePath();
      g.fillStyle = 'rgba(255, 201, 60, 0.4)';
      g.fill();
      g.strokeStyle = C.gold;
      g.lineWidth = 3;
      g.stroke();
      circle(g, x, y, r * 0.07);
      fillStroke(g, C.hotPink, 2);
    }
    g.restore();
    drawQuiz(view);
  },
};

export default readClock;
