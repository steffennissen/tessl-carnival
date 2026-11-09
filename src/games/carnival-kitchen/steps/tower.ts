import {
  C,
  type G,
  type Mood,
  clamp01,
  easeOutBack,
  fillStroke,
  oval,
  starPath,
  stickerText,
} from '../art';
import { artOf, ingredient } from '../ingredients';
import {
  STEP_POINTS,
  accuracy,
  drawFallArrows,
  finishStep,
  scoreAction,
  type KitchenState,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';

/**
 * Tower: a show-off finish. Scoop after scoop swings over a dish that's
 * already made (the sundae, chocolate and all), and she taps to drop each
 * one on top, building a wobbly tower. The finishing touch (the cream and
 * cherry) rides up on top as it grows. Each scoop scores by how near the
 * tower's top it landed; an off one gives the tower a bigger wobble. The
 * wobble is a spring, softer the taller the tower, and it never falls: lean
 * too far and Chef Bunny reaches in with a paw to steady it. The kitchen
 * zooms out as the tower grows, so it always fits.
 */

export interface TowerOptions extends StepBasics {
  kind: 'tower';
  /** What the tower grows on: an ingredient with `towerBase` art (the finished sundae). */
  base: string;
  /** The scoops, bottom first, one per tap: ingredients with `stack` art. */
  scoops: string[];
}

/** A finished dish a tower grows on. All in its own units: its foot's middle at the origin. */
export interface TowerBaseArt {
  /** How far above its foot the first new layer sits (the top of what's there). */
  height(round: KitchenState | null): number;
  /** Draws the dish as it is, without its finishing touch. */
  draw(g: G, look: { t: number; round: KitchenState | null }): void;
  /** How many scoops (or layers) it has already, to count the tower up from. */
  count?(round: KitchenState | null): number;
  /** The finishing touch (a cherry on top), drawn with the tower's top at the origin. */
  drawCap?(g: G, look: { t: number; round: KitchenState | null }): void;
}

declare module '../kit/types' {
  interface StepKinds {
    tower: TowerOptions;
  }
  interface IngredientArt {
    towerBase: TowerBaseArt;
  }
}

/** How far either side of the middle a scoop swings, in the tower's units. */
export const TOWER_SWING = 110;
/** The first scoop's swing in radians a second, and how much faster each next one is. */
export const TOWER_SPEED = 1;
export const TOWER_SPEEDUP = 0.07;
/** Within `perfect` of the tower's top scores in full, nothing from `miss`. */
export const TOWER_RULES = { perfect: 26, miss: 140 } as const;
/** Seconds after a drop before the next scoop swings in. Taps meanwhile are "Not yet!". */
export const TOWER_WAIT = 0.5;
/** The spring: how stiff a tower of no scoops is, how much each scoop softens it, and damping. */
export const SPRING = 28;
export const SOFTEN = 0.22;
export const DAMPING = 1.3;
/** How hard a scoop landing `offset` off-centre kicks the tower. */
export const KICK = 2.6;
/** The most the tower's top leans, in its units: any more and Chef Bunny steadies it. */
export const MAX_LEAN = 34;
/** Seconds Chef Bunny holds it steady. */
export const STEADY_TIME = 1.1;
/** How far a scoop sits off the tower's middle, at most, for how far off it landed. */
export const SCOOP_SHIFT = 0.25;
export const MAX_SHIFT = 14;
/** Seconds the finished tower is shown off before the step ends. */
export const TOWER_FINALE = 1.8;

export interface TowerState {
  /** Each scoop, with its swing speed. */
  scoops: { id: string; speed: number }[];
  /** The swinging scoop is at TOWER_SWING × sin(phase). */
  phase: number;
  /** Which scoop is swinging; the count once they're all on. */
  index: number;
  /** How far off the top each scoop landed (left is negative). */
  offsets: number[];
  results: number[];
  points: number;
  wait: number;
  /** The tower's top: how far it leans, and how fast it's moving. */
  lean: number;
  swayV: number;
  /** Seconds left of Chef Bunny's paw holding it steady. */
  steady: number;
  /** How many times she's had to steady it. */
  steadied: number;
  finale: number;
}

export function startTower(options: TowerOptions): TowerState {
  return {
    scoops: options.scoops.map((id, i) => ({
      id,
      speed: Math.round((TOWER_SPEED + i * TOWER_SPEEDUP) * 100) / 100,
    })),
    phase: -Math.PI / 2,
    index: 0,
    offsets: [],
    results: [],
    points: 0,
    wait: 0,
    lean: 0,
    swayV: 0,
    steady: 0,
    steadied: 0,
    finale: -1,
  };
}

/** Where the swinging scoop is, across the tower. */
export function swingOf(s: TowerState): number {
  return TOWER_SWING * Math.sin(s.phase);
}

/** How far a scoop that landed `offset` off sits from the tower's middle. */
export function shiftOf(offset: number): number {
  return Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, offset * SCOOP_SHIFT));
}

/** How stiff the tower is with `count` scoops on: softer, so wobblier, as it grows. */
export function stiffness(count: number): number {
  return SPRING / (1 + SOFTEN * count);
}

/**
 * Drops the swinging scoop on the tower. It always sticks, scoring by how
 * near the tower's top it was, and kicks the tower into a wobble. Returns
 * the points, or null ("Not yet!") while the next scoop is still coming.
 */
export function dropScoop(turn: Turn<TowerOptions, TowerState>): number | null {
  const s = turn.state;
  if (s.wait > 0 || s.index >= s.scoops.length || s.finale >= 0) return null;
  const offset = swingOf(s) - s.lean;
  const share = accuracy(Math.abs(offset), TOWER_RULES.perfect, TOWER_RULES.miss);
  const points = scoreAction(turn.round, share, STEP_POINTS / s.scoops.length);
  s.offsets.push(offset);
  s.results.push(share);
  s.points += points;
  s.index += 1;
  s.wait = TOWER_WAIT;
  s.phase = s.index % 2 === 0 ? -Math.PI / 2 : Math.PI / 2;
  // Every landing gives it a wobble; an off one a bigger one, the taller the more.
  const kick = (offset >= 0 ? 1 : -1) * Math.max(12, Math.abs(offset));
  s.swayV += kick * KICK * (1 + 0.1 * s.index);
  if (s.index === s.scoops.length) s.finale = TOWER_FINALE;
  return points;
}

/** The wobble: a spring pulling the top back to the middle. It never falls. */
export function updateTower(turn: Turn<TowerOptions, TowerState>, dt: number): void {
  const s = turn.state;
  // Small steps keep the spring steady even on a slow frame.
  let left = dt;
  while (left > 0) {
    const h = Math.min(left, 1 / 120);
    left -= h;
    const damping = DAMPING + (s.steady > 0 ? 7 : 0);
    s.swayV += (-stiffness(s.results.length) * s.lean - damping * s.swayV) * h;
    s.lean += s.swayV * h;
    if (Math.abs(s.lean) > MAX_LEAN) {
      // Whoa! Chef Bunny's paw catches it.
      s.lean = Math.sign(s.lean) * MAX_LEAN;
      s.swayV = 0;
      if (s.steady <= 0) s.steadied += 1;
      s.steady = STEADY_TIME;
    }
    s.steady = Math.max(0, s.steady - h);
  }

  if (s.finale >= 0) {
    s.finale -= dt;
    if (s.finale <= 0) {
      s.finale = 0;
      finishStep(turn.round, s.points);
    }
    return;
  }
  const waited = Math.min(s.wait, dt);
  s.wait -= waited;
  if (s.wait > 0) return;
  const scoop = s.scoops[s.index];
  if (scoop) s.phase += scoop.speed * (dt - waited);
}

/** For tests: taps each scoop right on the tower's top. */
export function solveTower(turn: Turn<TowerOptions, TowerState>): void {
  const s = turn.state;
  while (s.index < s.scoops.length) {
    s.wait = 0;
    s.phase = Math.asin(Math.max(-1, Math.min(1, s.lean / TOWER_SWING)));
    dropScoop(turn);
  }
}

// ---------------------------------------------------------------------------
// Drawing

export interface TowerLook {
  t: number;
  round: KitchenState | null;
  /** How far the top leans; each layer leans its share by height. */
  lean: number;
  /** The face on each new scoop; happy if left out. */
  mood?: (index: number) => Mood;
  /** Squashes one scoop as it lands, by `amount` 0 to 1. */
  squash?: { index: number; amount: number };
}

/** The x of a layer `y` up a tower `height` tall whose top leans `lean`: it bends more near the top. */
export function bendAt(y: number, height: number, lean: number): number {
  const f = clamp01(y / Math.max(1, height));
  return lean * f * f;
}

/**
 * Draws a tower with its foot's middle at the origin: `base` as it is, the
 * scoops landed so far (each `{ id, shift }`), and the cap riding on top.
 * Returns how tall it is, without the cap. Dishes use it for their end card.
 */
export function drawTower(
  g: G,
  base: string,
  scoops: readonly { id: string; shift: number }[],
  look: TowerLook,
): number {
  const art = artOf(base, 'towerBase');
  const start = art.height(look.round);
  const height = start + scoops.reduce((h, s) => h + artOf(s.id, 'stack').size(false).h, 0);
  art.draw(g, { t: look.t, round: look.round });
  let bottom = start;
  scoops.forEach((scoop, i) => {
    const stackArt = artOf(scoop.id, 'stack');
    const x = bendAt(bottom, height, look.lean) + scoop.shift;
    g.save();
    g.translate(x, -bottom);
    g.rotate((look.lean / Math.max(1, height)) * 1.4 * clamp01(bottom / height));
    if (look.squash?.index === i) {
      const a = clamp01(look.squash.amount);
      g.scale(1 + a * 0.22, 1 - a * 0.3);
    }
    stackArt.draw(g, { top: false, mood: look.mood?.(i) ?? 'happy', t: look.t });
    g.restore();
    bottom += stackArt.size(false).h;
  });
  if (art.drawCap) {
    g.save();
    g.translate(look.lean + (scoops[scoops.length - 1]?.shift ?? 0), -height);
    g.rotate(look.lean / Math.max(1, height));
    art.drawCap(g, { t: look.t, round: look.round });
    g.restore();
  }
  return height;
}

/** Where the tower stands in the scene: its foot's middle. */
export const TOWER_X = 400;
export const TOWER_FOOT = 440;
/** The scene height the tower and its swinging scoop fit into, above the foot. */
const ROOM = 310;
/** How far above the tower's top the scoop swings (its bottom), in the tower's units. */
const SWING_ABOVE = 96;
const DROP_TIME = 0.3;

/** How far the kitchen zooms out to fit a tower `height` tall with a scoop swinging over it. */
export function zoomFor(height: number): number {
  return Math.min(1, ROOM / (height + SWING_ABOVE + 70));
}

interface TowerFx {
  count: number;
  zoom: number;
  drop: { x: number; y: number; index: number; age: number } | null;
  landAge: number;
  landIndex: number;
  prevX: number;
  steadied: number;
  pawAge: number;
  finale: boolean;
  boing: number;
}

/** Chef Bunny's paw coming in from the side to hold the tower steady. */
function drawPaw(g: G, x: number, y: number, side: number, reach: number) {
  const from = x + side * (130 + 110 * (1 - reach));
  const to = x + side * 34;
  g.lineCap = 'round';
  g.lineWidth = 46;
  g.strokeStyle = C.ink;
  g.beginPath();
  g.moveTo(from + side * 160, y + 30);
  g.quadraticCurveTo(from, y + 20, to + side * 20, y);
  g.stroke();
  g.lineWidth = 38;
  g.strokeStyle = C.white;
  g.stroke();
  oval(g, to, y, 30, 26);
  fillStroke(g, C.white, 4);
  g.fillStyle = C.pink;
  oval(g, to + side * 4, y + 6, 11, 9);
  g.fill();
  for (const dy of [-14, -2, 10]) {
    oval(g, to - side * 14, y + dy, 5, 4);
    g.fill();
  }
}

const tower: Step<TowerOptions, TowerState, TowerFx> = {
  kind: 'tower',
  uses: (o) => [[o.base, 'towerBase'], ...o.scoops.map((id): [string, 'stack'] => [id, 'stack'])],
  start: (o) => startTower(o),

  title: () => 'Build a tower!',
  hint: () => ['Tap when the scoop', 'is over the top!'],
  icon: () => '🗼',
  progress: ({ state }) => [state.scoops.length, state.results.length],
  points: ({ state }) => state.points,

  press: (turn) => dropScoop(turn) !== null || turn.state.finale >= 0,
  update: (turn, dt) => updateTower(turn, dt),
  solve: (turn) => solveTower(turn),

  fx: () => ({
    count: 0,
    zoom: 1,
    drop: null,
    landAge: 9,
    landIndex: -1,
    prevX: 0,
    steadied: 0,
    pawAge: 9,
    finale: false,
    boing: 0,
  }),

  observe({ state: s, options, round, fx, dt, effects }) {
    const base = artOf(options.base, 'towerBase');
    const heights = (count: number) =>
      base.height(round) +
      s.scoops.slice(0, count).reduce((h, sc) => h + artOf(sc.id, 'stack').size(false).h, 0);
    const count = s.results.length;
    if (count > fx.count) {
      fx.drop = { x: fx.prevX, y: heights(count - 1) + SWING_ABOVE, index: count - 1, age: 0 };
      effects.sound.whoosh();
      effects.calm();
    }
    fx.count = count;
    if (fx.drop) {
      fx.drop.age += dt;
      if (fx.drop.age >= DROP_TIME) {
        const i = fx.drop.index;
        const top = heights(i + 1);
        const sx = TOWER_X + s.lean * fx.zoom;
        const sy = TOWER_FOOT - top * fx.zoom;
        effects.sound.pop();
        // A boing that's lower and longer the taller it gets.
        effects.sound.tone(520 - i * 25, 0.35, {
          type: 'sine',
          volume: 0.14,
          slideTo: 260 - i * 10,
        });
        effects.burst(sx, sy, 8, ['dot', 'heart'], ingredient(s.scoops[i].id).colors, 190);
        effects.celebrate(sx, sy - 20);
        fx.landAge = 0;
        fx.landIndex = i;
        fx.drop = null;
      }
    }
    if (s.steadied > fx.steadied) {
      fx.pawAge = 0;
      effects.sound.tone(700, 0.2, { type: 'triangle', volume: 0.1, slideTo: 500 });
      effects.sound.chatter('Whoa! I got it!');
    }
    fx.steadied = s.steadied;
    fx.pawAge += dt;
    // A soft creak while it wobbles hard.
    fx.boing -= dt;
    if (Math.abs(s.swayV) > 60 && fx.boing <= 0) {
      effects.sound.tone(180 + Math.abs(s.lean) * 4, 0.12, { type: 'triangle', volume: 0.05 });
      fx.boing = 0.25;
    }
    if (s.finale >= 0 && !fx.finale) {
      fx.finale = true;
      effects.sound.fanfare();
      effects.burst(
        TOWER_X,
        160,
        34,
        ['confetti', 'star'],
        [C.hotPink, C.gold, C.mint, C.sky],
        380,
      );
    }
    // Zoom out smoothly as the tower grows.
    // Once it's done, nothing swings over it: zoom in to show it off.
    const want =
      s.finale >= 0 ? Math.min(1, ROOM / (heights(count) + 60)) : zoomFor(heights(count));
    fx.zoom += (want - fx.zoom) * Math.min(1, dt * 3);
    fx.landAge += dt;
    fx.prevX = swingOf(s);
  },

  draw({ g, t, state: s, options, round, fx, taking, shape }) {
    const base = artOf(options.base, 'towerBase');
    const landed = s.results.length - (fx.drop ? 1 : 0);
    const scoops = s.offsets
      .slice(0, landed)
      .map((offset, i) => ({ id: s.scoops[i].id, shift: shiftOf(offset) }));
    // A little sway on top of the spring, more the taller it is.
    const lean = s.lean + Math.sin(t * 2.3) * landed * 0.6;

    g.save();
    g.translate(TOWER_X, TOWER_FOOT);
    g.scale(fx.zoom, fx.zoom);
    const squashT = fx.landAge / 0.3;
    const height = drawTower(g, options.base, scoops, {
      t,
      round,
      lean,
      mood: (i) => (i === fx.landIndex && fx.landAge < 0.9 ? 'joy' : 'happy'),
      squash:
        squashT < 1 ? { index: fx.landIndex, amount: Math.sin(squashT * Math.PI) } : undefined,
    });

    // Chef Bunny's paw, when she's steadying it.
    if (s.steady > 0 || fx.pawAge < 0.4) {
      const reach =
        s.steady > 0
          ? easeOutBack(clamp01(fx.pawAge / 0.3))
          : clamp01(1 - (fx.pawAge - STEADY_TIME) / 0.4);
      const side = s.lean >= 0 ? 1 : -1;
      const y = -height * 0.7;
      drawPaw(g, bendAt(height * 0.7, height, lean), y, side, reach);
    }

    const swinging = round.phase === 'playing' && s.index < s.scoops.length && s.finale < 0;
    const swingBottom = height + SWING_ABOVE;
    if (swinging) {
      const x = swingOf(s);
      const near = Math.abs(x - s.lean) <= TOWER_RULES.perfect + 8;
      if (taking && s.wait === 0) {
        g.setLineDash([0.1, 12]);
        g.lineCap = 'round';
        g.lineWidth = 6;
        g.strokeStyle = near ? C.gold : 'rgba(255, 255, 255, 0.9)';
        g.beginPath();
        g.moveTo(x, -swingBottom + 10);
        g.lineTo(x, -height - 10);
        g.stroke();
        g.setLineDash([]);
        drawFallArrows(g, t, lean, -swingBottom + 20, Math.max(10, SWING_ABOVE - 40), 2);
        g.setLineDash([8, 7]);
        g.lineDashOffset = -t * 30;
        g.lineWidth = 5;
        g.strokeStyle = C.gold;
        oval(g, lean, -height - 4, 46 + Math.sin(t * 6) * 2, 12);
        g.stroke();
        g.setLineDash([]);
        g.lineDashOffset = 0;
      }
      const appear = easeOutBack(clamp01(1 - s.wait / TOWER_WAIT));
      if (appear > 0.01) {
        g.save();
        g.translate(x, -swingBottom + Math.sin(t * 3) * 4);
        g.rotate(-Math.cos(s.phase) * 0.08);
        g.scale(appear, appear);
        artOf(s.scoops[s.index].id, 'stack').draw(g, {
          top: false,
          mood: near ? 'wow' : 'happy',
          t,
        });
        g.restore();
      }
    }

    // A dropped scoop falling onto the tower.
    if (fx.drop) {
      const i = fx.drop.index;
      const p = clamp01(fx.drop.age / DROP_TIME);
      const below =
        base.height(round) +
        s.scoops.slice(0, i).reduce((h, sc) => h + artOf(sc.id, 'stack').size(false).h, 0);
      const tx = bendAt(below, below, lean) + shiftOf(s.offsets[i]);
      g.save();
      g.translate(fx.drop.x + (tx - fx.drop.x) * p, -(fx.drop.y + (below - fx.drop.y) * p * p));
      artOf(s.scoops[i].id, 'stack').draw(g, { top: false, mood: 'wow', t });
      g.restore();
    }
    g.restore();

    // How many scoops tall, counting up.
    const lx = shape === 'tall' ? 580 : 600;
    if (landed > 0) {
      const total = landed + (base.count?.(round) ?? 0);
      const label = `${total} scoop${total === 1 ? '' : 's'}!`;
      stickerText(g, label, lx, 250, 30 + (fx.landAge < 0.3 ? 6 : 0), C.hotPink);
    }
    if (s.finale >= 0) {
      for (let k = 0; k < 5; k++) {
        const a = t * 2 + (k / 5) * Math.PI * 2;
        starPath(g, lx + Math.cos(a) * 70, 250 + Math.sin(a) * 34, 9, t * 3);
        fillStroke(g, C.gold, 2.5);
      }
    }
  },
};

export default tower;
