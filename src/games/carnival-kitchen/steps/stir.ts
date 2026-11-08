import { artOf, ingredient } from '../ingredients';
import {
  circleRules,
  drawStirring,
  type CircleFx,
  type CircleState,
  type Step,
  type StepBasics,
} from '../kit';

/**
 * Stir: hold and draw circles in the pot. A circles step: see kit/circles.ts
 * for the rules and scoring.
 */

export interface StirOptions extends StepBasics {
  kind: 'stir';
  /** What it's stirred in: an ingredient with `vessel` art, such as 'pot'. */
  vessel: string;
  /** What's stirred: an ingredient with `stirred` art, such as 'soup'. */
  contents: string;
}

declare module '../kit/types' {
  interface StepKinds {
    stir: StirOptions;
  }
}

const stir: Step<StirOptions, CircleState, CircleFx> = {
  ...circleRules,
  kind: 'stir',
  uses: (o) => [
    [o.vessel, 'vessel'],
    [o.contents, 'stirred'],
  ],
  title: (o) => `Stir the ${ingredient(o.contents).label}!`,
  hint: (o) => ['Hold and draw', `circles in the ${ingredient(o.vessel).label}!`],
  icon: () => '🥄',
  draw(view) {
    const { vessel, contents } = view.options;
    drawStirring(view, artOf(vessel, 'vessel'), artOf(contents, 'stirred'));
  },
};

export default stir;
