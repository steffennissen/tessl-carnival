import { artOf } from '../ingredients';
import {
  drawMeasuringCup,
  measureScale,
  pictureQuiz,
  type PictureQuizOptions,
  type Unit,
} from '../kit';

/**
 * Cup: a measuring question with a big measuring cup beside the answers,
 * filled with an ingredient ("How much milk is in the cup?"), and maybe a
 * star on the line it needs to reach ("We need 1 cup. How much more?").
 * A learning step, woven in by activities/measure.ts.
 */

export interface CupOptions extends PictureQuizOptions {
  kind: 'cup';
  /** What's in the cup: an ingredient with `pour` art (its jug and colours). */
  item: string;
  unit: Unit;
  /** How much is in the cup, in `unit`. */
  have: number;
  /** A star on this line, for "how much more?", if any. */
  need?: number;
  /** Numbers on every line, or only on whole cups (and ½): Level 2 reads between the lines. */
  labels: 'all' | 'some';
}

declare module '../kit/types' {
  interface StepKinds {
    cup: CupOptions;
  }
}

/**
 * The cup for these options: a 1 cup measure, with a line every ¼ cup, for
 * up to 1 cup (filled right to its top line for 1 cup), else a jug with a
 * line every ½ cup. Either way what's in it and the star are on lines.
 */
export function cupScale(options: CupOptions) {
  const most = Math.max(options.have, options.need ?? 0);
  return most <= 1 ? measureScale(most, 1, 1) : measureScale(most, 1);
}

const cup = pictureQuiz<CupOptions>(
  'cup',
  ({ g, t, options }, box) => {
    const art = artOf(options.item, 'pour');
    // The bag or jug it came from, beside the cup.
    g.save();
    g.translate(box.x + 72, box.y + 120);
    g.scale(0.9, 0.9);
    art.drawContainer(g, false);
    g.restore();
    const scale = cupScale(options);
    drawMeasuringCup(g, {
      x: box.x + 180,
      top: box.y + 40,
      w: 76,
      h: 150,
      scale,
      unit: options.unit,
      level: options.have / scale.capacity,
      fill: art.meter,
      target: options.need === undefined ? null : options.need / scale.capacity,
      labels: options.labels,
      t,
    });
  },
  {
    uses: (o) => [[o.item, 'pour']],
    title: () => 'Measure it!',
    icon: () => '🥛',
  },
);

export default cup;
