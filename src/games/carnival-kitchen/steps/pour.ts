import { type G, circle, rounded } from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  BOWL,
  CUP_METER,
  amountText,
  type KitchenState,
  POUR_RULES,
  TARGET_HIGH,
  TARGET_LOW,
  between,
  drawMeasuringCup,
  drawMeter,
  drawMixingBowl,
  findStep,
  holdProgress,
  listOf,
  measureScale,
  measureTarget,
  parseAmount,
  pressHold,
  releaseHold,
  startHold,
  updateHold,
  type HoldState,
  type Step,
  type StepBasics,
} from '../kit';
import { smoothness, type BlendOptions, type BlendedArt } from './blend';
import { drawCrackedEggs, type CrackFx, type CrackOptions, type CrackState } from './crack';

/**
 * Pour: hold to pour each ingredient into something (the mixing bowl, the
 * pot, the blender), and let go when the meter reaches the star. In the
 * mixing bowl, any eggs cracked earlier in the round are already there.
 */

export interface PourOptions extends StepBasics {
  kind: 'pour';
  /** What's poured, in order: each an ingredient with `pour` art. One pour each. */
  pours: string[];
  /**
   * What it's poured into: an ingredient with `pourInto` art, such as 'pot'
   * or 'blender'. The mixing bowl if left out.
   */
  into?: string;
  /**
   * What's already in it from earlier steps: an ingredient with `blended`
   * art, such as 'smoothie' (the chopped fruit). It's chunky, or smooth once
   * a blend step earlier in the round has blended it.
   */
  inside?: string;
  /**
   * Where the stars may sit, low to high, for a pour with no real amount.
   * Defaults to TARGET_LOW to TARGET_HIGH.
   */
  targets?: [number, number];
  /**
   * The real amount of each pour ("1½ cups"); each ingredient's `amount` if
   * left out. The meter is a measuring cup with its lines, and the star sits
   * on this amount's line (see kit/measure.ts).
   */
  amounts?: string[];
  /**
   * What's already in the measuring cup for each pour ("½ cup", or "" for
   * none): it starts there, and fills up to its amount's star. For "We have
   * ½ cup, how much more?".
   */
  starts?: string[];
}

/** How something you pour into the bowl draws itself. */
export interface PourArt {
  /** The stream's colour, from the spout down into the bowl. */
  stream: string;
  /** The colour of specks falling in the stream (flour), if any. */
  grains?: string;
  /** The meter's gradient, top to bottom. */
  meter: string[];
  /** Its colour once it's in a pot or blender: a C colour or a palette one. */
  color: string;
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

/** Something poured so far: its art, and how much of it is in (0 to 1). */
export interface Poured {
  art: PourArt;
  amount: number;
}

/** Something you pour into other than the mixing bowl, seen from the side. */
export interface PourIntoArt {
  /**
   * Where the stream lands, in scene units: inside its opening. The stream
   * falls from y POUR_TOP, and the bag or jug tips over it from just above
   * and to the left, so keep the opening below that.
   */
  mouth: { x: number; y: number };
  /**
   * Draws it on the counter with what's in it: `inside` (from earlier steps,
   * `smooth` 0 chunky to 1 blended) under the pours so far, each in its
   * `color`. `round` is there for anything else earlier steps did.
   */
  draw(
    g: G,
    look: {
      t: number;
      round: KitchenState;
      inside: { art: BlendedArt; smooth: number } | null;
      poured: Poured[];
    },
  ): void;
}

declare module '../kit/types' {
  interface StepKinds {
    pour: PourOptions;
  }
  interface IngredientArt {
    pour: PourArt;
    pourInto: PourIntoArt;
  }
}

/** Where the stream starts falling, just under the tipped bag or jug. */
export const POUR_TOP = 200;
/** Where the stream lands in the mixing bowl. */
const BOWL_MOUTH = { x: BOWL.x + 26, y: 335 };

/** Where the stream lands for these options. */
export function mouthOf(options: PourOptions): { x: number; y: number } {
  return options.into ? artOf(options.into, 'pourInto').mouth : BOWL_MOUTH;
}

/**
 * How blended `inside` is: 1 once a blend step earlier in the round has
 * blended it smooth, 0 (chunky) before.
 */
export function insideSmoothness(round: KitchenState, inside: string): number {
  const blend = findStep<HoldState, BlendOptions>(round, 'blend');
  return blend && blend.options.contents === inside ? smoothness(blend.state) : 0;
}

/** The real amount of pour `i`: the recipe's, or the ingredient's usual. */
export function amountOf(options: PourOptions, i: number): string | undefined {
  return options.amounts?.[i] ?? ingredient(options.pours[i]).amount;
}

/** What's in pour `i`'s measuring cup when it starts, in its unit: 0 for an empty one. */
export function startOf(options: PourOptions, i: number): number {
  return parseAmount(options.starts?.[i])?.value ?? 0;
}

/**
 * Chef Bunny's lines for pour `i`: ["1½ cups of flour,", "let go at the
 * star!"], or for a cup with some in it already, how much more: ["½ cup
 * more milk,", "up to the star!"].
 */
export function pourLines(options: PourOptions, i: number): [string, string] | null {
  const amount = amountOf(options, i);
  if (!amount) return null;
  const label = ingredient(options.pours[i]).label;
  const start = startOf(options, i);
  const real = parseAmount(amount);
  if (start > 0 && real) {
    return [
      `${amountText({ value: real.value - start, unit: real.unit })} more ${label},`,
      'up to the star!',
    ];
  }
  return [`${amount} of ${label},`, 'let go at the star!'];
}

interface PourFx {
  index: number;
  timer: number;
}

const pour: Step<PourOptions, HoldState, PourFx> = {
  kind: 'pour',
  uses: (o) => [
    ...o.pours.map((id): [string, 'pour'] => [id, 'pour']),
    ...(o.into ? [[o.into, 'pourInto'] as [string, 'pourInto']] : []),
    ...(o.inside ? [[o.inside, 'blended'] as [string, 'blended']] : []),
  ],

  start: (o, random) => {
    const [low, high] = o.targets ?? [TARGET_LOW, TARGET_HIGH];
    const reals = o.pours.map((_, i) => parseAmount(amountOf(o, i)));
    return startHold(
      reals.map((real) => (real ? measureTarget(real.value) : between(random, low, high))),
      o.starts?.some((x) => x)
        ? reals.map((real, i) => (real ? startOf(o, i) / measureScale(real.value).capacity : 0))
        : undefined,
    );
  },

  title: (o) => `Add ${listOf(o.pours.map((id) => ingredient(id).label))}!`,
  hint: (o) => pourLines(o, 0) ?? ['Hold to pour,', 'let go at the star!'],
  // Each pour says its own amount: "1½ cups of flour," then "1 cup of milk,".
  bubble: ({ options, state }) =>
    pourLines(options, Math.min(state.index, options.pours.length - 1)),
  icon: (o) => ingredient(o.pours[o.pours.length - 1]).icon,
  progress: holdProgress,
  points: ({ state }) => state.points,

  press: pressHold,
  release: (turn) => releaseHold(turn, POUR_RULES),
  update: (turn, dt) => updateHold(turn, POUR_RULES, dt),

  fx: () => ({ index: 0, timer: 0 }),

  observe({ state: s, options, fx, dt, effects, round }) {
    if (s.index > fx.index) {
      const mouth = mouthOf(options);
      effects.sound.pop();
      effects.celebrate(mouth.x - 26, mouth.y - 45);
      // The next pour's amount, said out loud (its words are in Chef Bunny's bubble too).
      const next = s.index < options.pours.length ? pourLines(options, s.index) : null;
      if (next && !round.learn.settings.readMyself) {
        effects.sound.say(`Now ${next[0].replace(/,$/, '')}!`);
      }
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

    // The stream, behind the container and into its opening.
    const mouth = mouthOf(options);
    const fall = mouth.y - POUR_TOP;
    if (s.holding) {
      const sx = mouth.x;
      g.fillStyle = art.stream;
      g.strokeStyle = 'rgba(91, 59, 79, 0.25)';
      g.lineWidth = 2;
      const wob = Math.sin(t * 20) * 2;
      rounded(g, sx - 7 + wob, POUR_TOP, 14, fall, 7);
      g.fill();
      g.stroke();
      if (art.grains) {
        g.fillStyle = art.grains;
        for (let i = 0; i < 6; i++) {
          const y = POUR_TOP + ((t * 300 + i * 23) % fall);
          circle(g, sx + Math.sin(i * 2 + t * 9) * 9, y, 3);
          g.fill();
        }
      }
    }

    const poured = options.pours.map((id, i) => ({ art: artOf(id, 'pour'), amount: amounts[i] }));
    if (options.into) {
      artOf(options.into, 'pourInto').draw(g, {
        t,
        round,
        inside: options.inside
          ? {
              art: artOf(options.inside, 'blended'),
              smooth: insideSmoothness(round, options.inside),
            }
          : null,
        poured,
      });
    } else {
      // The bowl: liquids first, then any eggs cracked earlier, then the rest.
      drawMixingBowl(g);
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
    }

    // The bag or jug, tipping over the opening while you hold.
    g.save();
    g.translate(mouth.x - 36, s.holding ? POUR_TOP - 32 : POUR_TOP - 40 + Math.sin(t * 2.5) * 3);
    g.rotate(s.holding ? 1.15 + Math.sin(t * 16) * 0.04 : Math.sin(t * 2) * 0.05);
    art.drawContainer(g, s.holding);
    g.restore();

    // A measuring cup with its lines when the pour has a real amount; else a plain meter.
    const amount = amountOf(options, index);
    const real = parseAmount(amount);
    if (real) {
      const scale = measureScale(real.value);
      drawMeasuringCup(g, {
        ...CUP_METER,
        scale,
        unit: real.unit,
        level: s.level,
        fill: art.meter,
        target: targets[index],
        label: amount,
        t,
        big: view.shape !== 'page',
      });
    } else {
      drawMeter(g, t, s.level, targets[index], art.meter, amount);
    }
  },
};

export default pour;
