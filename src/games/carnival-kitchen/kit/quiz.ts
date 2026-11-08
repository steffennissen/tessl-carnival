import {
  C,
  CONFETTI,
  type G,
  clamp01,
  easeOutBack,
  fillStroke,
  rounded,
  starPath,
  stickerText,
  vertical,
} from '../art';
import type { Shape } from '../layout';
import type { Reading } from '../sound';
import { type AnswerState, SMART_BONUS, answer, autoReadDelay, startAnswer } from './learn';
import { finishStep } from './rules';
import type { Feedback, StepBasics, StepView, Turn } from './types';
import { drawSpeaker, drawWords, fitWords, inCircle } from './words';

/**
 * Quiz: a question with big answer buttons, the fifth ready-made mini-game,
 * for learning moments. The question sits in a bubble at the top with a
 * speaker button, a picture can go on the left, and two to four answers on
 * the right (or in a row under the question). Answering follows the shared
 * rules in learn.ts: a wrong answer greys out with a hint, after two Chef
 * Bunny shows the answer, and a right one gets a cheer before the step ends.
 *
 * steps/ask.ts is the one to copy.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A question with answer buttons. */
export interface Question {
  /** What she reads, and what the voice reads out: "How many toppings did you put on?" */
  text: string;
  /** The answers on the buttons, in order: short ("5", "cheese"). Two to four. */
  choices: string[];
  /** Which choice is right. */
  answer: number;
  /** Chef Bunny's two lines after a wrong try: ["Count them", "one by one!"]. */
  hint: [string, string];
  /** What she says when she shows the answer: "Let's count: one, two, three. Three!" */
  help: string;
  /** Buttons down the right beside a picture ('side', the default), or in a row under the question. */
  layout?: 'side' | 'row';
}

/** Seconds a right answer is cheered before the step moves on. */
export const QUIZ_OUTRO = 1.6;

/** A round button, such as the speaker: its middle and radius, in scene units. */
export interface Disc {
  x: number;
  y: number;
  r: number;
}

/**
 * Where the question's bubble goes, and its speaker button, on a computer
 * ('page'). Clear of the HUD in every layout. A phone gets bigger ones: use
 * `quizPlaces(view.shape)`, which has these for the page.
 */
export const QUIZ_BUBBLE: Box = { x: 215, y: 150, w: 470, h: 88 };
export const QUIZ_SPEAKER: Disc = { x: 254, y: 194, r: 24 };
/**
 * Where a picture goes beside 'side' answers on a computer and a phone held
 * sideways. A phone held upright has its own: `quizPlaces('tall').picture`.
 */
export const QUIZ_PICTURE: Box = { x: 215, y: 248, w: 315, h: 212 };

/** Where a question's pieces go for a canvas shape (see `quizPlaces`). */
export interface QuizPlaces {
  bubble: Box;
  speaker: Disc;
  /** A picture beside 'side' answers. */
  picture: Box;
  /** One big button under the question, such as "Let's cook!" or "Check!". */
  button: Box;
}

/**
 * Where the question's bubble, speaker, picture and a big button go, for the
 * canvas's shape. On a computer they're as they always were; on a phone
 * everything a finger taps is at least about 60 CSS pixels: the speaker is
 * bigger, and held upright the bubble spans the screen with the picture
 * under it at the left.
 */
export function quizPlaces(shape: Shape = 'page'): QuizPlaces {
  if (shape === 'tall') {
    return {
      bubble: { x: 110, y: 100, w: 580, h: 104 },
      speaker: { x: 169, y: 152, r: 47 },
      picture: { x: 110, y: 214, w: 340, h: 246 },
      button: { x: 220, y: 350, w: 360, h: 106 },
    };
  }
  return {
    bubble: QUIZ_BUBBLE,
    speaker: shape === 'wide' ? { x: 268, y: 194, r: 40 } : QUIZ_SPEAKER,
    picture: QUIZ_PICTURE,
    button:
      shape === 'wide' ? { x: 320, y: 378, w: 260, h: 84 } : { x: 340, y: 400, w: 220, h: 58 },
  };
}

/** `count` boxes filling `area` in `cols` columns, row by row; a last odd one is centred. */
function grid(area: Box, count: number, cols: number, gap: number): Box[] {
  const rows = Math.ceil(count / cols);
  const w = (area.w - gap * (cols - 1)) / cols;
  const h = (area.h - gap * (rows - 1)) / rows;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const left = area.x + (area.w - (inRow * w + gap * (inRow - 1))) / 2;
    return { x: left + (i % cols) * (w + gap), y: area.y + row * (h + gap), w, h };
  });
}

/**
 * The answer buttons for `count` choices, in scene units, for the canvas's
 * shape. On a computer: down the right of the picture, or a row under the
 * question. On a phone held sideways the side buttons fill the room at the
 * right, two to a row; held upright they're stacked beside the picture (two
 * to a row for four), and a row's buttons are much taller. Clear of the
 * bubble, the picture, Chef Bunny and the HUD in every shape.
 */
export function choiceBoxes(
  count: number,
  layout: Question['layout'] = 'side',
  shape: Shape = 'page',
): Box[] {
  if (layout === 'row') {
    if (shape === 'tall') {
      const gap = 14;
      const w = Math.min(190, (580 - gap * (count - 1)) / count);
      const left = 400 - (count * w + gap * (count - 1)) / 2;
      return Array.from({ length: count }, (_, i) => ({
        x: left + i * (w + gap),
        y: 250,
        w,
        h: 170,
      }));
    }
    const gap = 10;
    const w = Math.min(150, (470 - gap * (count - 1)) / count);
    const left = 450 - (count * w + gap * (count - 1)) / 2;
    return Array.from({ length: count }, (_, i) => ({
      x: left + i * (w + gap),
      y: 300,
      w,
      h: 110,
    }));
  }
  if (shape === 'wide') {
    return grid({ x: 545, y: 248, w: 245, h: 214 }, count, count <= 2 ? 1 : 2, 12);
  }
  if (shape === 'tall') {
    return grid({ x: 460, y: 214, w: 230, h: 326 }, count, count <= 3 ? 1 : 2, 12);
  }
  const gap = 10;
  const top = QUIZ_PICTURE.y;
  const h = (QUIZ_PICTURE.h - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => ({ x: 545, y: top + i * (h + gap), w: 145, h }));
}

export interface QuizState extends AnswerState {
  question: Question;
  /** Wrong choices tried, greyed out. */
  tried: number[];
  /** The right choice, once tapped. */
  picked: number | null;
  /** Taps on the speaker button: each one reads the question again. */
  reads: number;
  /** Seconds since the question showed. */
  age: number;
  /** Seconds since the right answer; the step ends at QUIZ_OUTRO. */
  after: number;
}

export function startQuiz(question: Question): QuizState {
  return { ...startAnswer(), question, tried: [], picked: null, reads: 0, age: 0, after: 0 };
}

const inBox = (b: Box, x: number, y: number) =>
  x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6;

/**
 * A tap: the speaker reads the question again, an answer button answers.
 * Never "Not yet!": a tap anywhere else just does nothing.
 */
export function pressQuiz(turn: Turn<StepBasics, QuizState>, x: number, y: number): boolean {
  const s = turn.state;
  if (s.picked !== null) return true;
  const { speaker } = quizPlaces(turn.shape);
  if (inCircle(speaker.x, speaker.y, speaker.r, x, y)) {
    s.reads += 1;
    return true;
  }
  const q = s.question;
  const i = choiceBoxes(q.choices.length, q.layout, turn.shape).findIndex((b) => inBox(b, x, y));
  if (i < 0 || s.tried.includes(i) || (s.shown && i !== q.answer)) return true;
  const result = answer(turn.round, s, i === q.answer);
  if (result === 'right') s.picked = i;
  else s.tried.push(i);
  return true;
}

/** The clock: after a right answer, a moment of cheering, then the next step. */
export function updateQuiz(turn: Turn<StepBasics, QuizState>, dt: number): void {
  const s = turn.state;
  s.age += dt;
  if (s.picked === null) return;
  s.after += dt;
  if (s.after >= QUIZ_OUTRO) finishStep(turn.round, 0);
}

/** Chef Bunny's bubble: the hint after a wrong try, the answer when shown, a cheer when right. */
export function quizBubble(s: QuizState): [string, string] | null {
  const right = s.question.choices[s.question.answer];
  if (s.picked !== null)
    return s.outcome === 'right' ? ['Yes! You are', 'a Smart Chef!'] : ['Yes, it is', `${right}!`];
  if (s.shown) return [`It is ${right}!`, `Tap the ${right}!`];
  if (s.wrong > 0) return s.question.hint;
  return null;
}

/** For tests: taps the right answer and waits for the step to end. */
export function solveQuiz(turn: Turn<StepBasics, QuizState>): void {
  const q = turn.state.question;
  const b = choiceBoxes(q.choices.length, q.layout, turn.shape)[q.answer];
  pressQuiz(turn, b.x + b.w / 2, b.y + b.h / 2);
  updateQuiz(turn, QUIZ_OUTRO);
}

// ---------------------------------------------------------------------------
// Sounds, the voice and Chef Bunny

/** The quiz's effect memory: what it has seen, and the question being read out. */
export interface QuizFx {
  reading: Reading | null;
  reads: number;
  autoRead: boolean;
  tried: number;
  shown: boolean;
  picked: boolean;
}

export function quizFx(): QuizFx {
  return { reading: null, reads: 0, autoRead: false, tried: 0, shown: false, picked: false };
}

const CHEER: Feedback = { grade: 'Perfect!', points: 0, combo: 0, age: 0 };
const ENCOURAGE: Feedback = { grade: 'Nice try!', points: 0, combo: 0, age: 0 };
const PRAISE = ['Yes!', 'You got it!', "That's right!", 'Smart chef!'];

/** The middle of a box. */
export const middleOf = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/**
 * Reads the question out (when the settings say it reads itself; `pause`
 * waits a little at Level 2 so she can try first) and again for each tap on
 * the speaker, and reacts to answers: a soft boop and an encouraging Chef
 * Bunny for a wrong one, her help when she shows it, a cheer for a right one.
 */
export function observeQuiz(
  view: StepView<StepBasics, QuizState, QuizFx>,
  { pause = false }: { pause?: boolean } = {},
): void {
  const { state: s, fx, effects, round, taking } = view;
  const { sound } = effects;
  const settings = round.learn.settings;
  const q = s.question;
  const boxes = choiceBoxes(q.choices.length, q.layout, view.shape);
  const delay = autoReadDelay(settings, pause);
  if (taking && !fx.autoRead && delay !== null && s.age >= delay && s.picked === null) {
    fx.autoRead = true;
    fx.reading = sound.read(q.text);
  }
  if (s.reads > fx.reads) {
    fx.reads = s.reads;
    fx.autoRead = true;
    fx.reading = sound.read(q.text);
  }
  if (s.tried.length > fx.tried) {
    fx.tried = s.tried.length;
    const at = middleOf(boxes[s.tried[s.tried.length - 1]]);
    sound.boop();
    effects.celebrate(at.x, at.y, ENCOURAGE);
    if (!s.shown && !settings.readMyself) sound.say(`Try again! ${q.hint.join(' ')}`);
  }
  if (s.shown && !fx.shown) {
    fx.shown = true;
    sound.chime([1046.5, 1318.5], 0.12, 0.12);
    if (!settings.readMyself) sound.say(q.help);
  }
  if (s.picked !== null && !fx.picked) {
    fx.picked = true;
    const at = middleOf(boxes[s.picked]);
    sound.chime([1046.5, 1318.5, 1568, 2093], 0.07, 0.16);
    effects.burst(at.x, at.y, 18, ['star', 'heart', 'star', 'dot'], CONFETTI, 260);
    effects.celebrate(at.x, at.y, CHEER);
    sound.say(`${PRAISE[Math.floor(s.age * 7) % PRAISE.length]} ${q.choices[s.picked]}!`);
  }
}

/** The word of `reading` being said now, or -1. */
export function wordNow(reading: Reading | null): number {
  return reading && !reading.done() ? reading.word() : -1;
}

/**
 * The question's bubble: a speaker button to hear it, and the text, the
 * word being read lit up. Used by the quiz; any learning step can use it.
 */
export function drawQuestion(
  g: G,
  text: string,
  box: Box,
  speaker: { x: number; y: number; r: number },
  reading: Reading | null,
  t: number,
): void {
  rounded(g, box.x, box.y, box.w, box.h, 22);
  fillStroke(g, C.white, 4, C.hotPink);
  const highlight = wordNow(reading);
  drawSpeaker(g, speaker.x, speaker.y, speaker.r, highlight >= 0, t);
  const left = speaker.x + speaker.r + 12;
  const width = box.x + box.w - 16 - left;
  const fit = fitWords(g, text, width, 28, Math.max(1, Math.floor(box.h / 36)));
  const gap = fit.size * 1.3;
  const top = box.y + box.h / 2 - ((fit.lines.length - 1) * gap) / 2;
  drawWords(g, fit.lines, left + width / 2, top, fit.size, gap, { highlight, color: C.ink });
}

/** One answer button: plain, tried (greyed), shown (glowing) or right (mint, with a tick). */
export function drawChoice(
  g: G,
  text: string,
  b: Box,
  look: 'plain' | 'tried' | 'shown' | 'right',
  t: number,
  age = 0,
) {
  g.save();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  g.translate(cx, cy);
  if (look === 'shown') g.scale(1 + Math.sin(t * 6) * 0.05, 1 + Math.sin(t * 6) * 0.05);
  if (look === 'right') {
    const pop = 1 + 0.15 * Math.sin(clamp01(age / 0.4) * Math.PI);
    g.scale(pop, pop);
  }
  if (look === 'shown') {
    g.strokeStyle = C.gold;
    g.lineWidth = 7;
    rounded(g, -b.w / 2 - 7, -b.h / 2 - 7, b.w + 14, b.h + 14, 26);
    g.stroke();
  }
  g.globalAlpha = look === 'tried' ? 0.45 : 1;
  rounded(g, -b.w / 2, -b.h / 2, b.w, b.h, 20);
  const fill =
    look === 'right'
      ? vertical(g, -b.h / 2, b.h / 2, [C.cabinetLight, C.mint])
      : look === 'tried'
        ? C.lavenderLight
        : look === 'shown'
          ? vertical(g, -b.h / 2, b.h / 2, [C.white, C.butter])
          : vertical(g, -b.h / 2, b.h / 2, [C.white, C.pink]);
  fillStroke(g, fill, 4);
  const size = Math.min(40, b.h * 0.5);
  stickerText(g, text, 0, 2, size, look === 'tried' ? C.lavender : C.hotPink, 'center', b.w - 16);
  if (look === 'right') {
    starPath(g, b.w / 2 - 8, -b.h / 2 + 6, 13, t);
    fillStroke(g, C.gold, 2.5);
  }
  g.globalAlpha = 1;
  g.restore();
}

/**
 * Draws the quiz: the question's bubble, then the answers. Draw any
 * picture first (in QUIZ_PICTURE for 'side' answers).
 */
export function drawQuiz(view: StepView<StepBasics, QuizState, QuizFx>): void {
  const { g, t, state: s, fx, taking, shape } = view;
  const q = s.question;
  const appear = easeOutBack(clamp01(s.age / 0.4));
  if (!taking && s.age === 0) return;
  const { bubble, speaker } = quizPlaces(shape);
  const boxes = choiceBoxes(q.choices.length, q.layout, shape);
  const mid = middleOf(bubble);
  g.save();
  g.translate(mid.x, mid.y);
  g.scale(appear, appear);
  g.translate(-mid.x, -mid.y);
  drawQuestion(g, q.text, bubble, speaker, fx.reading, t);
  g.restore();
  boxes.forEach((b, i) => {
    const look =
      s.picked === i
        ? 'right'
        : s.tried.includes(i) || (s.picked !== null && i !== s.picked)
          ? 'tried'
          : s.shown && i === q.answer
            ? 'shown'
            : 'plain';
    const pop = easeOutBack(clamp01((s.age - 0.15 - i * 0.08) / 0.35));
    if (pop <= 0.01) return;
    g.save();
    g.translate(b.x + b.w / 2, b.y + b.h / 2);
    g.scale(pop, pop);
    g.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    drawChoice(g, q.choices[i], b, look, t, s.after);
    g.restore();
  });
  if (s.picked !== null) {
    const b = boxes[s.picked];
    const pop = easeOutBack(clamp01(s.after / 0.35));
    g.save();
    g.translate(b.x + b.w / 2, b.y - 18);
    g.scale(pop, pop);
    g.rotate(-0.08);
    stickerText(g, s.outcome === 'right' ? `Yes! +${SMART_BONUS}` : 'Yes!', 0, 0, 30, C.hotPink);
    g.restore();
  }
}
