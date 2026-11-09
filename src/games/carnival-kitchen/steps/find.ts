import {
  C,
  type G,
  clamp01,
  easeOutBack,
  emoji,
  fillStroke,
  rounded,
  starPath,
  stickerText,
  vertical,
} from '../art';
import type { Shape } from '../layout';
import {
  SMART_BONUS,
  answer,
  answerFx,
  drawQuestion,
  finishStep,
  inBox,
  inCircle,
  observeAnswer,
  middleOf,
  quizBubble,
  quizPlaces,
  startQuiz,
  type AnswerFx,
  type AnswerResult,
  type Box,
  type KitchenState,
  type Question,
  type QuizState,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Find: "Tap the CHEESE!" before a step that uses it. Three jars, each with
 * a word on its label and its picture hidden under a "?", so finding the
 * right one takes reading, not matching a picture. Once she's found it, the
 * pictures pop in. A learning step (see "Learning" in the README), woven in
 * by activities/find-word.ts.
 *
 * The voice only says "Find the word!", never the word itself, unless she
 * taps 🔊: then it reads "Tap the cheese!". Hearing it is a hint, so a right
 * answer after it carries on without the Smart Chef bonus. Nothing to fail:
 * a wrong jar greys out with a hint about its letters, and after two Chef
 * Bunny shows the right one.
 */

export interface FindOptions extends StepBasics {
  kind: 'find';
  /** The word to find, its jar labels and answer. `question.text` is "Tap the CHEESE!". */
  question: Question;
  /** The word to find, as it's said when 🔊 is tapped. */
  word: string;
  /** Each jar's picture (an emoji), shown once she's found the word. */
  pictures: string[];
}

declare module '../kit/types' {
  interface StepKinds {
    find: FindOptions;
  }
}

/** What the voice says by itself: never the word. */
export const FIND_SAY = 'Find the word!';
/** Seconds a right answer is cheered before the step moves on. */
const OUTRO = 1.8;

export interface FindState extends QuizState {
  /** She tapped 🔊 and heard the word before finding it. */
  heard: boolean;
}

/**
 * The jars for `count` words, in scene units: in a row under the question,
 * tall enough for a picture over the label. Bigger on a phone held upright.
 */
export function jarBoxes(count: number, shape: Shape = 'page'): Box[] {
  const [mid, most, gap, y, h] =
    shape === 'tall'
      ? [400, 180, 20, 220, 240]
      : shape === 'wide'
        ? [500, 170, 14, 250, 208]
        : [450, 150, 12, 250, 208];
  const room = shape === 'tall' ? 580 : shape === 'wide' ? 560 : 470;
  const w = Math.min(most, (room - gap * (count - 1)) / count);
  const left = mid - (count * w + gap * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => ({ x: left + i * (w + gap), y, w, h }));
}

/**
 * Answers with the shared rules, except that a right answer after hearing
 * the word is 'helped': no bonus, no Smart Chef star, nothing taken away.
 */
export function answerFind(round: KitchenState, s: FindState, correct: boolean): AnswerResult {
  if (correct && s.heard && s.outcome === null) {
    s.outcome = 'helped';
    round.learn.answers.push('helped');
    return 'right';
  }
  return answer(round, s, correct);
}

export function pressFind(turn: Turn<FindOptions, FindState>, x: number, y: number): boolean {
  const s = turn.state;
  if (s.picked !== null) return true;
  const { speaker } = quizPlaces(turn.shape);
  if (inCircle(speaker.x, speaker.y, speaker.r, x, y)) {
    s.reads += 1;
    s.heard = true;
    return true;
  }
  const q = s.question;
  const i = jarBoxes(q.choices.length, turn.shape).findIndex((b) => inBox(b, x, y));
  if (i < 0 || s.tried.includes(i) || (s.shown && i !== q.answer)) return true;
  const result = answerFind(turn.round, s, i === q.answer);
  if (result === 'right') s.picked = i;
  else s.tried.push(i);
  return true;
}

/** A jar with a lid, its picture (or a "?") in the glass and its word on the label. */
function drawJar(
  g: G,
  b: Box,
  word: string,
  picture: string | null,
  look: 'plain' | 'tried' | 'shown' | 'right',
  t: number,
  reveal: number,
) {
  const { x, y, w, h } = b;
  g.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  g.translate(cx, cy);
  if (look === 'shown') g.scale(1 + Math.sin(t * 6) * 0.04, 1 + Math.sin(t * 6) * 0.04);
  g.translate(-cx, -cy);
  g.globalAlpha = look === 'tried' ? 0.45 : 1;
  if (look === 'shown' || look === 'right') {
    g.strokeStyle = look === 'shown' ? C.gold : C.mint;
    g.lineWidth = 7;
    rounded(g, x - 7, y - 7, w + 14, h + 14, 30);
    g.stroke();
  }
  // The glass, and the lid on top.
  const lid = Math.min(30, h * 0.14);
  rounded(g, x + 4, y + lid - 4, w - 8, h - lid + 4, 26);
  fillStroke(
    g,
    look === 'tried' ? C.lavenderLight : vertical(g, y, y + h, [C.white, C.skyLight]),
    4,
  );
  rounded(g, x + w * 0.12, y, w * 0.76, lid, 10);
  fillStroke(g, look === 'right' ? C.mint : C.hotPink, 3.5);
  // A shine down the glass.
  g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x + 18, y + lid + 18);
  g.lineTo(x + 18, y + h * 0.5);
  g.stroke();
  // The label, with the word.
  const labelH = Math.min(70, h * 0.32);
  const labelY = y + h - labelH - 14;
  rounded(g, x + 10, labelY, w - 20, labelH, 14);
  fillStroke(g, C.cream, 3);
  const size = Math.min(38, labelH * 0.62);
  stickerText(
    g,
    word,
    cx,
    labelY + labelH / 2 + 2,
    size,
    look === 'tried' ? C.lavender : C.ink,
    'center',
    w - 32,
  );
  // The picture: a "?" until she has found the word, then it pops in.
  const py = y + lid + (labelY - y - lid) / 2;
  const room = Math.min(w - 30, labelY - y - lid - 10);
  if (picture && reveal > 0) {
    const pop = easeOutBack(clamp01(reveal));
    g.save();
    g.translate(cx, py);
    g.scale(pop, pop);
    g.fillStyle = C.ink;
    emoji(g, picture, 0, 2, room * 0.75);
    g.restore();
  } else {
    stickerText(g, '?', cx, py + Math.sin(t * 3 + x) * 3, room * 0.6, C.lavender);
  }
  if (look === 'right') {
    starPath(g, x + w - 10, y + 8, 14, t);
    fillStroke(g, C.gold, 2.5);
  }
  g.globalAlpha = 1;
  g.restore();
}

const find: Step<FindOptions, FindState, AnswerFx> = {
  kind: 'find',
  learning: true,
  // The word's ingredient is checked where it's used: the next step.
  uses: () => [],
  start: (o) => ({ ...startQuiz(o.question), heard: false }),
  title: () => 'Find the word!',
  hint: () => ['Read the jars,', 'tap the right one!'],
  icon: () => '🔤',
  progress: ({ state }) => [1, state.picked === null ? 0 : 1],
  press: (turn, x, y) => pressFind(turn, x, y),
  update(turn, dt) {
    const s = turn.state;
    s.age += dt;
    if (s.picked === null) return;
    s.after += dt;
    if (s.after >= OUTRO) finishStep(turn.round, 0);
  },
  bubble: ({ state, round }) => quizBubble(state, round),
  solve(turn) {
    const q = turn.state.question;
    const b = jarBoxes(q.choices.length, turn.shape)[q.answer];
    pressFind(turn, b.x + b.w / 2, b.y + b.h / 2);
    find.update?.(turn, OUTRO);
  },

  fx: answerFx,

  observe(view) {
    const { state: s, options, shape } = view;
    const boxes = jarBoxes(options.question.choices.length, shape);
    observeAnswer(view, s, view.fx, {
      read: `Tap the ${options.word}!`,
      // Never the word itself when it reads by itself: that's what she reads.
      autoSay: FIND_SAY,
      done: s.picked !== null,
      wrongAt: () => middleOf(boxes[s.tried[s.tried.length - 1] ?? 0]),
      wrongSay: () => 'Try again! Look at the letters.',
      helpSay: () => options.question.help,
      doneAt: () => middleOf(boxes[s.picked ?? options.question.answer]),
      doneSay: () => `Yes! ${options.word}!`,
    });
  },

  draw({ g, t, state: s, options, fx, taking, shape }) {
    if (!taking && s.age === 0) return;
    const q = s.question;
    const { bubble, speaker } = quizPlaces(shape);
    const mid = middleOf(bubble);
    const appear = easeOutBack(clamp01(s.age / 0.4));
    g.save();
    g.translate(mid.x, mid.y);
    g.scale(appear, appear);
    g.translate(-mid.x, -mid.y);
    drawQuestion(g, q.text, bubble, speaker, fx.reading, t);
    g.restore();
    const boxes = jarBoxes(q.choices.length, shape);
    boxes.forEach((b, i) => {
      const look =
        s.picked === i
          ? 'right'
          : s.tried.includes(i) || (s.picked !== null && i !== s.picked)
            ? 'tried'
            : s.shown && i === q.answer
              ? 'shown'
              : 'plain';
      const pop = easeOutBack(clamp01((s.age - 0.15 - i * 0.1) / 0.35));
      if (pop <= 0.01) return;
      const at = middleOf(b);
      g.save();
      g.translate(at.x, at.y);
      g.scale(pop, pop);
      g.translate(-at.x, -at.y);
      // The pictures pop in one after another once she's found the word.
      const reveal =
        s.picked === null ? 0 : (s.after - (i === s.picked ? 0 : 0.25 + i * 0.1)) / 0.35;
      drawJar(g, b, q.choices[i], options.pictures[i] ?? null, look, t, reveal);
      g.restore();
    });
    if (s.picked !== null) {
      const b = boxes[s.picked];
      const pop = easeOutBack(clamp01(s.after / 0.35));
      g.save();
      g.translate(b.x + b.w / 2, b.y - 16);
      g.scale(pop, pop);
      g.rotate(-0.08);
      stickerText(g, s.outcome === 'right' ? `Yes! +${SMART_BONUS}` : 'Yes!', 0, 0, 30, C.hotPink);
      g.restore();
    }
  },
};

export default find;
