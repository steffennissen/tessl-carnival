import { C, type G, circle, clamp01, easeOutBack, fillStroke, rounded, stickerText } from '../art';
import {
  SMART_BONUS,
  choiceBoxes,
  drawChoice,
  drawQuestion,
  middleOf,
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
 * Cut: "Which pizza is cut into 4 equal pieces?" Three pictures of the food,
 * cut different ways, on the answer buttons: one in equal pieces, one in
 * the same number of pieces that aren't equal, and one in a different
 * number of equal pieces. Tap the right one. It plays by the quiz's rules
 * (a hint, another go, shown after two), and the picture is honest: equal
 * pieces really are the same size. Drawn after it (by an `ask` step), it
 * shows the food big, cut the right way. Woven in by activities/equal-parts.ts.
 */

export type CutFood = 'pizza' | 'pancake' | 'casserole';

/** One way to cut it: into `parts` pieces, equal or not. */
export interface CutPicture {
  parts: number;
  equal: boolean;
}

export interface CutOptions extends StepBasics {
  kind: 'cut';
  food: CutFood;
  /** The question; its choices are what Chef Bunny says about each picture ("4 equal pieces"). */
  question: Question;
  /** One per choice, in order. */
  pictures: CutPicture[];
}

declare module '../kit/types' {
  interface StepKinds {
    cut: CutOptions;
  }
}

/** A straight cut, in units of the food's size from its middle: [x1, y1, x2, y2]. */
export type Line = [number, number, number, number];

/** Whether the food is round (pizza, pancake) or a rectangle (a casserole, 2 wide and 1.3 tall). */
export function isRound(food: CutFood): boolean {
  return food !== 'casserole';
}

/** Where a rectangle's long lines go, as shares across it, for unequal pieces. */
const UNEQUAL_STRIPS: Record<number, number[]> = { 2: [0.3], 3: [0.2, 0.45], 4: [0.15, 0.35, 0.6] };

/**
 * The cuts for a picture, in units of the food's size (a round food's radius,
 * half a rectangle's width). Equal pieces: lines through the middle (radii a
 * third of a turn apart for thirds of a round food); unequal ones: lines off
 * the middle.
 */
export function cutLines(food: CutFood, picture: CutPicture): Line[] {
  const { parts, equal } = picture;
  const far = 1.5;
  if (isRound(food)) {
    if (equal) {
      if (parts === 3) {
        return [-90, 30, 150].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return [0, 0, Math.cos(a) * far, Math.sin(a) * far];
        });
      }
      return parts === 2
        ? [[0, -far, 0, far]]
        : [
            [0, -far, 0, far],
            [-far, 0, far, 0],
          ];
    }
    if (parts === 2) return [[0.45, -far, 0.45, far]];
    if (parts === 3) {
      // A half and two quarters: three pieces, but not equal ones.
      return [
        [0, 0, 0, -far],
        [0, 0, far, 0],
        [0, 0, 0, far],
      ];
    }
    return [
      [0.4, -far, 0.4, far],
      [-far, 0.3, far, 0.3],
    ];
  }
  if (equal && parts === 4) {
    return [
      [0, -far, 0, far],
      [-far, 0, far, 0],
    ];
  }
  const shares = equal
    ? Array.from({ length: parts - 1 }, (_, k) => (k + 1) / parts)
    : UNEQUAL_STRIPS[parts];
  return shares.map((share) => [-1 + 2 * share, -far, -1 + 2 * share, far]);
}

/** Half a casserole's height, in units of its size. */
export const CASSEROLE_HEIGHT = 0.65;

/** The food's outline, centred on (x, y), `size` its radius or half its width. */
function foodPath(g: G, food: CutFood, x: number, y: number, size: number) {
  if (isRound(food)) circle(g, x, y, size);
  else
    rounded(
      g,
      x - size,
      y - size * CASSEROLE_HEIGHT,
      size * 2,
      size * 2 * CASSEROLE_HEIGHT,
      size * 0.12,
    );
}

/** Draws the food from above, cut as `picture` says. */
export function drawCutFood(
  g: G,
  food: CutFood,
  x: number,
  y: number,
  size: number,
  picture: CutPicture,
): void {
  const line = Math.max(2, size * 0.04);
  if (food === 'pizza') {
    circle(g, x, y, size);
    fillStroke(g, C.crustGold, line);
    circle(g, x, y, size * 0.84);
    fillStroke(g, C.sauce, 0);
    circle(g, x, y, size * 0.76);
    fillStroke(g, C.cheese, 0);
    // Pepperoni round the middle, between where the cuts go.
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      circle(g, x + Math.cos(a) * size * 0.5, y + Math.sin(a) * size * 0.5, size * 0.11);
      fillStroke(g, C.pepperoni, 0);
    }
  } else if (food === 'pancake') {
    circle(g, x, y, size);
    fillStroke(g, C.pancakeDark, line);
    circle(g, x, y, size * 0.88);
    fillStroke(g, C.pancake, 0);
    // A soft golden middle, right in the centre so every piece gets the same.
    circle(g, x, y, size * 0.5);
    fillStroke(g, C.pancakeLight, 0);
  } else {
    foodPath(g, food, x, y, size);
    fillStroke(g, C.crustGold, line);
    rounded(
      g,
      x - size * 0.9,
      y - size * (CASSEROLE_HEIGHT - 0.1),
      size * 1.8,
      size * 2 * (CASSEROLE_HEIGHT - 0.1),
      size * 0.08,
    );
    fillStroke(g, C.cheeseGold, 0);
    for (let k = 0; k < 10; k++) {
      const cx = x + size * (-0.8 + (k % 5) * 0.4);
      const cy = y + size * (k < 5 ? -0.25 : 0.25);
      circle(g, cx, cy, size * 0.06);
      fillStroke(g, C.cheeseBrown, 0);
    }
  }
  // The cuts: gaps of plate showing through, clipped to the food.
  g.save();
  foodPath(g, food, x, y, size + line);
  g.clip();
  g.lineCap = 'round';
  g.strokeStyle = C.white;
  g.lineWidth = Math.max(3, size * 0.08);
  for (const [x1, y1, x2, y2] of cutLines(food, picture)) {
    g.beginPath();
    g.moveTo(x + x1 * size, y + y1 * size);
    g.lineTo(x + x2 * size, y + y2 * size);
    g.stroke();
  }
  g.restore();
  foodPath(g, food, x, y, size);
  g.lineWidth = line;
  g.strokeStyle = C.ink;
  g.stroke();
}

/** The right picture: the one the question asks for. */
export function rightPicture(options: CutOptions): CutPicture {
  return options.pictures[options.question.answer];
}

/** How the food draws in a box: as big as fits. */
function sizeIn(food: CutFood, w: number, h: number): number {
  return isRound(food) ? Math.min(w, h) * 0.4 : Math.min(w * 0.42, (h * 0.4) / CASSEROLE_HEIGHT);
}

const cut: Step<CutOptions, QuizState, QuizFx> = {
  kind: 'cut',
  learning: true,
  uses: () => [],
  start: (o) => startQuiz(o.question),
  title: () => 'Equal pieces!',
  hint: () => ['Tap the picture!', 'Tap 🔊 to hear it.'],
  icon: () => '🔪',
  progress: ({ state }) => [1, state.picked === null ? 0 : 1],
  press: (turn, x, y) => pressQuiz(turn, x, y),
  update: (turn, dt) => updateQuiz(turn, dt),
  bubble: ({ options, state }) =>
    state.shown && state.picked === null
      ? ['This one has', `${rightPicture(options).parts} equal pieces!`]
      : quizBubble(state),
  solve: (turn) => solveQuiz(turn),
  fx: quizFx,
  observe: (view) => observeQuiz(view),

  draw(view) {
    const { g, t, options, state: s, fx, taking, round, shape } = view;
    const current = round.phase === 'playing' && round.steps[round.stepIndex]?.state === s;
    if (!current) {
      // Drawn after it's done (an ask step's picture): the food, big, cut right.
      if (s.picked === null && !s.shown) return;
      drawCutFood(
        g,
        options.food,
        400,
        312,
        isRound(options.food) ? 120 : 150,
        rightPicture(options),
      );
      return;
    }
    if (!taking && s.age === 0) return;
    const q = options.question;
    const { bubble, speaker } = quizPlaces(shape);
    const appear = easeOutBack(clamp01(s.age / 0.4));
    const mid = middleOf(bubble);
    g.save();
    g.translate(mid.x, mid.y);
    g.scale(appear, appear);
    g.translate(-mid.x, -mid.y);
    drawQuestion(g, q.text, bubble, speaker, fx.reading, t);
    g.restore();
    // The quiz's own answer boxes for the shape, so a tap (pressQuiz) hits what's drawn.
    const boxes = choiceBoxes(q.choices.length, q.layout, shape);
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
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      g.save();
      g.translate(cx, cy);
      g.scale(pop, pop);
      g.translate(-cx, -cy);
      drawChoice(g, '', b, look, t, s.after);
      g.globalAlpha = look === 'tried' ? 0.45 : 1;
      const grow = look === 'right' ? 1 + 0.15 * Math.sin(clamp01(s.after / 0.4) * Math.PI) : 1;
      drawCutFood(
        g,
        options.food,
        cx,
        cy,
        sizeIn(options.food, b.w, b.h) * grow,
        options.pictures[i],
      );
      g.globalAlpha = 1;
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
  },
};

export default cut;
