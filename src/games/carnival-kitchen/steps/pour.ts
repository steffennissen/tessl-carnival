import { type G, circle, rounded } from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  BOWL,
  POUR_RULES,
  TARGET_HIGH,
  TARGET_LOW,
  between,
  drawMeter,
  drawMixingBowl,
  findStep,
  holdProgress,
  listOf,
  pressHold,
  releaseHold,
  startHold,
  updateHold,
  type HoldState,
  type Step,
  type StepBasics,
} from '../kit';
import { drawCrackedEggs, type CrackFx, type CrackOptions, type CrackState } from './crack';

/**
 * Pour: hold to pour each ingredient into the mixing bowl, and let go when
 * the meter reaches the star. Any eggs cracked earlier in the round are
 * already in the bowl.
 */

export interface PourOptions extends StepBasics {
  kind: 'pour';
  /** What's poured, in order: each an ingredient with `pour` art. One pour each. */
  pours: string[];
}

/** How something you pour into the bowl draws itself. */
export interface PourArt {
  /** The stream's colour, from the spout down into the bowl. */
  stream: string;
  /** The colour of specks falling in the stream (flour), if any. */
  grains?: string;
  /** The meter's gradient, top to bottom. */
  meter: string[];
  /** Liquids fill the bowl under everything; anything else heaps up on top. */
  liquid: boolean;
  /**
   * Draws its bag or jug, centred on the origin, about 80 wide and 100
   * tall, upright. The step tips it over the bowl while you hold.
   */
  drawContainer(g: G, pouring: boolean): void;
  /** Draws `amount` of it (0 to 1) in the mixing bowl: see BOWL. */
  drawInBowl(g: G, amount: number): void;
}

declare module '../kit/types' {
  interface StepKinds {
    pour: PourOptions;
  }
  interface IngredientArt {
    pour: PourArt;
  }
}

interface PourFx {
  index: number;
  timer: number;
}

const pour: Step<PourOptions, HoldState, PourFx> = {
  kind: 'pour',
  uses: (o) => o.pours.map((id) => [id, 'pour']),

  start: (o, random) => startHold(o.pours.map(() => between(random, TARGET_LOW, TARGET_HIGH))),

  title: (o) => `Add ${listOf(o.pours.map((id) => ingredient(id).label))}!`,
  hint: () => ['Hold to pour,', 'let go at the star!'],
  icon: (o) => ingredient(o.pours[o.pours.length - 1]).icon,
  progress: holdProgress,
  points: ({ state }) => state.points,

  press: pressHold,
  release: (turn) => releaseHold(turn, POUR_RULES),
  update: (turn, dt) => updateHold(turn, POUR_RULES, dt),

  fx: () => ({ index: 0, timer: 0 }),

  observe({ state: s, fx, dt, effects }) {
    if (s.index > fx.index) {
      effects.sound.pop();
      effects.celebrate(BOWL.x, 290);
    }
    fx.index = s.index;
    // Pouring glugs softly.
    if (s.holding) {
      fx.timer -= dt;
      if (fx.timer <= 0) {
        effects.sound.bloop();
        fx.timer = 0.22;
      }
    }
  },

  draw(view) {
    const { g, t, state: s, options, round } = view;
    const targets = s.targets;
    const index = Math.min(s.index, targets.length - 1);
    const art = artOf(options.pours[index], 'pour');

    // How much of each is in the bowl so far.
    const amounts = targets.map((target, i) =>
      Math.min(1, s.index > i ? 1 : s.index === i ? s.level / Math.max(0.2, target) : 0),
    );

    // The stream, behind the container and into the bowl.
    if (s.holding) {
      const sx = BOWL.x + 26;
      g.fillStyle = art.stream;
      g.strokeStyle = 'rgba(91, 59, 79, 0.25)';
      g.lineWidth = 2;
      const wob = Math.sin(t * 20) * 2;
      rounded(g, sx - 7 + wob, 200, 14, 135, 7);
      g.fill();
      g.stroke();
      if (art.grains) {
        g.fillStyle = art.grains;
        for (let i = 0; i < 6; i++) {
          const y = 200 + ((t * 300 + i * 23) % 135);
          circle(g, sx + Math.sin(i * 2 + t * 9) * 9, y, 3);
          g.fill();
        }
      }
    }

    // The bowl: liquids first, then any eggs cracked earlier, then the rest.
    drawMixingBowl(g);
    const poured = options.pours.map((id, i) => ({ art: artOf(id, 'pour'), amount: amounts[i] }));
    for (const p of poured) if (p.art.liquid && p.amount > 0) p.art.drawInBowl(g, p.amount);
    const crack = findStep<CrackState, CrackOptions>(round, 'crack');
    if (crack) {
      drawCrackedEggs(
        g,
        crack.state,
        artOf(crack.options.item, 'crack'),
        view.fxOf<CrackFx>(crack),
      );
    }
    for (const p of poured) if (!p.art.liquid && p.amount > 0) p.art.drawInBowl(g, p.amount);

    // The bag or jug, tipping over the bowl while you hold.
    g.save();
    g.translate(BOWL.x - 10, s.holding ? 168 : 160 + Math.sin(t * 2.5) * 3);
    g.rotate(s.holding ? 1.15 + Math.sin(t * 16) * 0.04 : Math.sin(t * 2) * 0.05);
    art.drawContainer(g, s.holding);
    g.restore();

    drawMeter(g, t, s.level, targets[index], art.meter);
  },
};

export default pour;
