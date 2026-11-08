import { type G } from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  CIRCLE,
  CIRCLE_TURNS,
  circleRules,
  circleTurns,
  drawCircleControls,
  type CircleFx,
  type CircleState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Sauce: hold and draw circles on the base to spread the sauce (tomato on
 * pizza dough today; frosting on a cupcake, ketchup on an omelette...). A
 * circles step: see kit/circles.ts for the rules and scoring.
 */

export interface SauceOptions extends StepBasics {
  kind: 'sauce';
  /** What it's spread on: an ingredient with `sauceBase` art, such as 'pizza'. */
  base: string;
  /** What's spread: an ingredient with `spread` art, such as 'tomato-sauce'. */
  sauce: string;
}

/** The colours of something spread with a spoon. */
export interface SpreadArt {
  light: string;
  main: string;
  /** Its colour once it's baked past golden. */
  dark: string;
  /** The swirl the spoon leaves in it. */
  swirl: string;
}

/** How something you spread sauce on draws itself, seen from above. */
export interface SauceBaseArt {
  /**
   * Draws it centred on (x, y), up to `r` across (on its board or plate),
   * with `spread` covering `cover` of it (0 to 1). `swirl` turns with the
   * spoon. The ring of stars goes round it at r + 16.
   */
  draw(
    g: G,
    look: { x: number; y: number; r: number; cover: number; swirl: number; spread: SpreadArt },
  ): void;
}

declare module '../kit/types' {
  interface StepKinds {
    sauce: SauceOptions;
  }
  interface IngredientArt {
    spread: SpreadArt;
    sauceBase: SauceBaseArt;
  }
}

const sauce: Step<SauceOptions, CircleState, CircleFx> = {
  ...circleRules,
  kind: 'sauce',
  uses: (o) => [
    [o.base, 'sauceBase'],
    [o.sauce, 'spread'],
  ],
  title: (o) => `Spread the ${ingredient(o.sauce).label}!`,
  hint: (o) => ['Hold and draw', `circles on the ${ingredient(o.base).label}!`],
  icon: (o) => ingredient(o.sauce).icon,
  draw(view) {
    const { g, state, options } = view;
    const spread = artOf(options.sauce, 'spread');
    artOf(options.base, 'sauceBase').draw(g, {
      x: CIRCLE.x,
      y: CIRCLE.y,
      r: CIRCLE.radius,
      cover: circleTurns(state) / CIRCLE_TURNS,
      swirl: state.radians * 0.85,
      spread,
    });
    drawCircleControls(view, spread.main);
  },
};

export default sauce;
