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
 * Mix: hold and draw circles in the bowl until the batter is smooth. A
 * circles step: see kit/circles.ts for the rules and scoring.
 */

export interface MixOptions extends StepBasics {
  kind: 'mix';
  /** What it's mixed in: an ingredient with `vessel` art, such as 'mixing-bowl'. */
  vessel: string;
  /** What's mixed: an ingredient with `stirred` art, such as 'batter'. */
  contents: string;
}

declare module '../kit/types' {
  interface StepKinds {
    mix: MixOptions;
  }
}

const mix: Step<MixOptions, CircleState, CircleFx> = {
  ...circleRules,
  kind: 'mix',
  uses: (o) => [
    [o.vessel, 'vessel'],
    [o.contents, 'stirred'],
  ],
  title: (o) => `Mix the ${ingredient(o.contents).label}!`,
  hint: (o) => ['Hold and draw', `circles in the ${ingredient(o.vessel).label}!`],
  icon: () => '🥣',
  draw(view) {
    const { vessel, contents } = view.options;
    drawStirring(view, artOf(vessel, 'vessel'), artOf(contents, 'stirred'));
  },
};

export default mix;
