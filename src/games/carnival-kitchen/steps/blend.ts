import { C, type G, blend as mixColors, circle, clamp01, emoji, fillStroke } from '../art';
import { artOf, ingredient } from '../ingredients';
import { NOTE } from '../sound';
import {
  COUNTER_Y,
  TARGET_HIGH,
  TARGET_LOW,
  between,
  drawMeter,
  holdProgress,
  pressHold,
  releaseHold,
  startHold,
  updateHold,
  type HoldRules,
  type HoldState,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Blend: hold to whirr the blender, and let go when the smoothness meter
 * reaches the star. The blender wobbles while it runs, and what's in it
 * swirls from chunky to smooth. A hold-meter step (kit/hold.ts): letting go
 * well before the star is "Not yet!" and keeps the smoothness, so you can
 * hold again; a full meter stops by itself.
 */

export interface BlendOptions extends StepBasics {
  kind: 'blend';
  /** What it's blended in: an ingredient with `blender` art, such as 'blender'. */
  blender: string;
  /** What's blended: an ingredient with `blended` art, such as 'smoothie'. */
  contents: string;
  /** How many times to blend, each with its own star. 1 if left out. */
  blends?: number;
}

/** A blender: a motor base, and a see-through jar on top. */
export interface BlenderArt {
  /**
   * The jar's inside, standing on the origin and going up: `bottom` wide at
   * y 0, `top` wide at y -height. What's blended is drawn inside it.
   */
  jar: { bottom: number; top: number; height: number };
  /**
   * Draws the motor base under the jar, its top edge at y 0 and its bottom
   * at about y 60, about 170 wide, with a face. `whirr` is whether it's on.
   */
  drawBase(g: G, look: { whirr: boolean; t: number; done: boolean }): void;
  /** Draws the jar's glass, lid and handle over what's inside. */
  drawJar(g: G, look: { whirr: boolean; t: number }): void;
}

/** What's in the blender: colours only. */
export interface BlendedArt {
  /** The chunky bits before it's blended, such as strawberry and banana. */
  chunks: string[];
  /** The liquid round the chunks at the start. */
  chunky: string;
  /** Its colour once it's smooth. */
  smooth: string;
  /** Its froth and shine once it's smooth. */
  light: string;
}

declare module '../kit/types' {
  interface StepKinds {
    blend: BlendOptions;
  }
  interface IngredientArt {
    blender: BlenderArt;
    blended: BlendedArt;
  }
}

/** Smoothness per second while held. */
export const BLEND_SPEED = 0.22;
/** Within this of the star scores in full. */
export const BLEND_PERFECT = 0.07;
/** Off the star by this much or more scores nothing. */
export const BLEND_ZONE = 0.4;
/** Letting go this far or more below the star is "Not yet!": it keeps its smoothness. */
export const BLEND_EARLY = 0.2;

export const BLEND_RULES: HoldRules = {
  speed: BLEND_SPEED,
  perfect: BLEND_PERFECT,
  zone: BLEND_ZONE,
  tooSoon: (level, target) => level < target - BLEND_EARLY,
  keep: true,
};

/** Where the blender stands: the jar's foot, on top of its base. */
export const BLENDER = { x: 400, y: COUNTER_Y - 58 } as const;

/**
 * The hold rules keep the smoothness between holds (so "Not yet!" loses
 * nothing), but each new blend starts chunky again. The last one stays
 * smooth, for the picture.
 */
function freshBatch(turn: Turn<BlendOptions, HoldState>, index: number) {
  const s = turn.state;
  if (s.index > index && s.index < s.targets.length) s.level = 0;
}

export function releaseBlend(turn: Turn<BlendOptions, HoldState>) {
  const index = turn.state.index;
  const result = releaseHold(turn, BLEND_RULES);
  freshBatch(turn, index);
  return result;
}

export function updateBlend(turn: Turn<BlendOptions, HoldState>, dt: number) {
  const index = turn.state.index;
  updateHold(turn, BLEND_RULES, dt);
  freshBatch(turn, index);
}

interface BlendFx {
  index: number;
  hum: number;
  /** Spin of the swirl, which speeds up while it's on. */
  spin: number;
  /** How hard it wobbles, easing in and out. */
  shake: number;
}

/** How smooth it looks: 0 chunky, 1 just right at the star. */
export function smoothness(state: HoldState): number {
  const target = state.targets[Math.min(state.index, state.targets.length - 1)];
  if (state.index >= state.targets.length) return 1;
  return clamp01(state.level / target);
}

/** Draws what's in the jar: chunky bits swirling, melting into one smooth colour. */
function drawContents(
  g: G,
  jar: BlenderArt['jar'],
  art: BlendedArt,
  look: { smooth: number; spin: number; shake: number; t: number },
) {
  const { smooth, spin, shake, t } = look;
  const h = jar.height;
  // It fills about two thirds of the jar, and swirls up the sides while it spins.
  const fill = h * (0.62 + 0.06 * shake);
  const top = -fill;
  const widthAt = (y: number) => jar.bottom + (jar.top - jar.bottom) * (-y / h);
  const dip = 16 * shake;

  // The liquid, with a vortex dipping in the middle while it spins.
  const half = widthAt(top) / 2 + 8;
  g.beginPath();
  g.moveTo(-half, top - dip * 0.6);
  g.quadraticCurveTo(0, top + dip * 2, half, top - dip * 0.6);
  g.lineTo(half, 4);
  g.lineTo(-half, 4);
  g.closePath();
  const base = mixColors([art.chunky, art.smooth], smooth);
  const liquid = g.createLinearGradient(0, top, 0, 0);
  liquid.addColorStop(0, mixColors([base, art.light], 0.35));
  liquid.addColorStop(1, base);
  g.fillStyle = liquid;
  g.fill();
  // Its surface, edged so it reads against the glass.
  g.beginPath();
  g.moveTo(-half, top - dip * 0.6);
  g.quadraticCurveTo(0, top + dip * 2, half, top - dip * 0.6);
  g.strokeStyle = 'rgba(91, 59, 79, 0.35)';
  g.lineWidth = 3;
  g.stroke();

  // Swirl lines going round.
  g.lineCap = 'round';
  for (let j = 0; j < 4; j++) {
    const y = top + 18 + j * ((fill - 30) / 3);
    const w = widthAt(y) / 2 - 10;
    const a = spin * (1.4 - j * 0.15) + j * 1.7;
    g.strokeStyle = `rgba(255, 255, 255, ${0.25 + 0.35 * smooth})`;
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(0, y, w, 7, 0, a % (Math.PI * 2), (a % (Math.PI * 2)) + 1.6);
    g.stroke();
  }

  // Chunks that tumble round and shrink away as it gets smooth.
  const chunks = 14;
  for (let i = 0; i < chunks; i++) {
    const left = 1 - smooth * 1.05 + (i % 5) * 0.03;
    if (left <= 0) continue;
    const y = top + 14 + ((i * 37) % Math.max(1, fill - 26));
    const w = widthAt(y) / 2 - 16;
    const a = spin * (1 + (i % 3) * 0.3) + i * 2.4;
    const x = Math.cos(a) * w;
    const size = (9 + (i % 3) * 3) * Math.min(1, left);
    const color = art.chunks[i % art.chunks.length];
    g.save();
    g.translate(x, y + Math.sin(a) * 4);
    g.rotate(a);
    g.beginPath();
    g.roundRect(-size, -size * 0.8, size * 2, size * 1.6, size * 0.5);
    fillStroke(g, color, Math.min(2.5, size * 0.25));
    g.restore();
  }

  // Once it's smooth: a frothy top with little bubbles.
  if (smooth > 0.5) {
    const froth = clamp01((smooth - 0.5) * 2);
    g.fillStyle = mixColors([base, art.light], 0.7);
    g.globalAlpha = froth;
    for (let k = -2; k <= 2; k++) {
      circle(g, k * (half / 2.6), top - dip * 0.3 + Math.sin(t * 4 + k) * 2, 12);
      g.fill();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const phase = (t * 0.9 + i * 0.31) % 1;
      const bx = (i - 2.5) * (half / 3.2);
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase) * froth})`;
      g.lineWidth = 2;
      circle(g, bx, -fill * phase * 0.9 - 8, 2 + phase * 4);
      g.stroke();
    }
  }
}

const blendStep: Step<BlendOptions, HoldState, BlendFx> = {
  kind: 'blend',
  uses: (o) => [
    [o.blender, 'blender'],
    [o.contents, 'blended'],
  ],

  start: (o, random) =>
    startHold(
      Array.from({ length: o.blends ?? 1 }, () => between(random, TARGET_LOW, TARGET_HIGH)),
    ),

  title: (o) => `Blend the ${ingredient(o.contents).label}!`,
  hint: () => ['Hold to blend, let go', 'at the star!'],
  icon: (o) => ingredient(o.contents).icon,
  progress: holdProgress,
  points: ({ state }) => state.points,

  press: pressHold,
  release: releaseBlend,
  update: updateBlend,

  fx: () => ({ index: 0, hum: 0, spin: 0, shake: 0 }),

  observe({ state: s, options, fx, dt, effects }) {
    if (s.index > fx.index) {
      effects.sound.chime([NOTE.C6, NOTE.E6, NOTE.G6], 0.08, 0.12);
      effects.celebrate(BLENDER.x, 200);
      effects.burst(
        BLENDER.x,
        160,
        12,
        ['heart', 'star'],
        ingredient(options.contents).colors,
        240,
      );
    }
    fx.index = s.index;
    // The swirl and wobble ease in and out, so it spins down after a let-go.
    fx.shake += ((s.holding ? 1 : 0) - fx.shake) * Math.min(1, dt * 6);
    fx.spin += dt * (1 + fx.shake * 14);
    // A whirring hum that rises as it gets smoother.
    if (s.holding) {
      fx.hum -= dt;
      if (fx.hum <= 0) {
        const pitch = 140 + smoothness(s) * 160;
        effects.sound.tone(pitch, 0.2, { type: 'triangle', volume: 0.07, slideTo: pitch * 1.15 });
        effects.sound.hiss(0.18, {
          volume: 0.05,
          from: 600 + smoothness(s) * 900,
          filter: 'lowpass',
        });
        fx.hum = 0.15;
      }
    }
  },

  draw({ g, t, state: s, options, fx, taking }) {
    const art = artOf(options.blender, 'blender');
    const contents = artOf(options.contents, 'blended');
    const shake = fx.shake;
    const smooth = smoothness(s);
    const done = s.index >= s.targets.length;
    const { bottom, top, height } = art.jar;

    // Motion lines either side while it whirrs.
    if (shake > 0.1) {
      g.strokeStyle = `rgba(255, 255, 255, ${0.85 * shake})`;
      g.lineWidth = 5;
      g.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (let k = 0; k < 3; k++) {
          const x = BLENDER.x + side * (top / 2 + 26 + k * 4);
          const y = BLENDER.y - height * 0.75 + k * 32 + Math.sin(t * 30 + k) * 3;
          g.beginPath();
          g.arc(
            x - side * 30,
            y,
            30,
            side > 0 ? -0.5 : Math.PI - 0.5,
            side > 0 ? 0.5 : Math.PI + 0.5,
          );
          g.stroke();
        }
      }
    }

    g.save();
    // A wobble while it runs, from its foot.
    g.translate(BLENDER.x + Math.sin(t * 41) * 2.5 * shake, BLENDER.y + 60);
    g.rotate(Math.sin(t * 33) * 0.035 * shake);
    g.translate(0, -60 + Math.abs(Math.sin(t * 27)) * -3 * shake);

    art.drawBase(g, { whirr: s.holding, t, done });

    // What's inside, clipped to the jar.
    g.save();
    g.beginPath();
    g.moveTo(-bottom / 2, 0);
    g.lineTo(-top / 2, -height);
    g.lineTo(top / 2, -height);
    g.lineTo(bottom / 2, 0);
    g.closePath();
    g.clip();
    drawContents(g, art.jar, contents, { smooth, spin: fx.spin, shake, t });
    g.restore();

    art.drawJar(g, { whirr: s.holding, t });
    g.restore();

    // The smoothness meter, with its star.
    const target = s.targets[Math.min(s.index, s.targets.length - 1)];
    drawMeter(g, t, s.level, target, [contents.smooth, contents.light]);

    if (taking && !s.holding && !done) {
      const bob = Math.sin(t * 5) * 6;
      g.fillStyle = C.ink;
      emoji(g, '👆', BLENDER.x + 130, 300 + bob, 46);
    }
  },
};

export default blendStep;
