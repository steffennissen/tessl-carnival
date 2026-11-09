import {
  C,
  CONFETTI,
  type G,
  circle,
  clamp01,
  easeOutBack,
  emoji,
  fillStroke,
  rounded,
  stickerText,
  vertical,
} from '../art';
import { artOf } from '../ingredients';
import {
  STEP_POINTS,
  finishStep,
  scoreAction,
  type KitchenState,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';
import type { Shape } from '../layout';

/**
 * Party: a show-off finish for a cake. Candles pop up on it; tap to light
 * each one. Then blow them out: hold the big Blow! button (or anywhere), or
 * tap it puff by puff. Out go the candles, and a crowd of animal friends
 * pops up to sing "Happy cooking to you!" with confetti everywhere. Lighting
 * a candle always works (the nearest one lights); a tap near it is perfect.
 * Blowing never fails. The microphone isn't used: a blow button needs no
 * permission and works everywhere.
 */

export interface PartyOptions extends StepBasics {
  kind: 'party';
  /** The cake: an ingredient with `partyCake` art. */
  cake: string;
  /** How many candles. 4 if left out. */
  candles?: number;
}

/** A cake to have a party with. */
export interface PartyCakeArt {
  /** Draws it in the scene, where it stood for its last step, with the round's toppings. */
  draw(g: G, look: { t: number; round: KitchenState | null }): void;
  /** Where `count` candles stand on it: the bottom of each, in scene units. */
  candles(count: number): { x: number; y: number }[];
}

declare module '../kit/types' {
  interface StepKinds {
    party: PartyOptions;
  }
  interface IngredientArt {
    partyCake: PartyCakeArt;
  }
}

export const PARTY_CANDLES = 4;
/** How tall a candle is, to the wick. */
export const CANDLE_H = 46;
/** A tap this near a candle's flame lights it perfectly; further, the nearest still lights, for less. */
export const LIGHT_NEAR = 70;
export const FAR_SHARE = 0.6;
/** Of the step's points, how many lighting the candles is worth; the blow is the rest. */
export const LIGHT_POINTS = 60;
/** Seconds of blowing to blow them all out; a tap is a puff of this much. */
export const BLOW_TIME = 1.2;
export const PUFF = 0.3;
/** Seconds after the last candle is lit before blowing starts. */
export const LIT_PAUSE = 0.6;
/** Seconds the party lasts: the friends sing, then the step ends. */
export const PARTY_TIME = 6;

export interface PartyState {
  /** Each candle: where it stands, and whether it's lit. */
  candles: { x: number; y: number; lit: boolean; out: boolean }[];
  phase: 'light' | 'blow' | 'party';
  /** Seconds into this phase. */
  time: number;
  /** 0 to 1: how much blowing is done. */
  blow: number;
  holding: boolean;
  points: number;
  /** How many candles are lit, in order of lighting, with each one's share. */
  results: number[];
  /** Which party friend was tapped last, and when, to make them hop. */
  hop: { index: number; time: number } | null;
}

export function startParty(options: PartyOptions): PartyState {
  const spots = artOf(options.cake, 'partyCake').candles(options.candles ?? PARTY_CANDLES);
  return {
    candles: spots.map((p) => ({ ...p, lit: false, out: false })),
    phase: 'light',
    time: 0,
    blow: 0,
    holding: false,
    points: 0,
    results: [],
    hop: null,
  };
}

/** Where the flame of a candle is. */
export function flameOf(c: { x: number; y: number }): { x: number; y: number } {
  return { x: c.x, y: c.y - CANDLE_H - 14 };
}

/** The Blow! button: big, by the cake, and bigger on a phone. */
export function blowButton(shape: Shape = 'page'): { x: number; y: number; r: number } {
  return shape === 'page' ? { x: 610, y: 360, r: 62 } : { x: 600, y: 350, r: 82 };
}

/** Where the party friends stand, from the left. */
export const FRIENDS = [
  { x: 250, y: 330, who: '🐻' },
  { x: 560, y: 320, who: '🐱' },
  { x: 300, y: 412, who: '🐸' },
  { x: 650, y: 410, who: '🐷' },
  { x: 510, y: 420, who: '🐥' },
] as const;

/** Lights the nearest unlit candle: perfectly if the tap was near it. */
export function lightCandle(turn: Turn<PartyOptions, PartyState>, x: number, y: number): boolean {
  const s = turn.state;
  let best = -1;
  let bestD = Infinity;
  s.candles.forEach((c, i) => {
    if (c.lit) return;
    const f = flameOf(c);
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  if (best < 0) return false;
  s.candles[best].lit = true;
  const share = bestD <= LIGHT_NEAR ? 1 : FAR_SHARE;
  s.results.push(share);
  s.points += scoreAction(turn.round, share, LIGHT_POINTS / s.candles.length);
  if (s.candles.every((c) => c.lit)) {
    s.phase = 'blow';
    s.time = 0;
  }
  return true;
}

/** Blows by `amount`, blowing candles out in turn; all out starts the party. */
export function blowBy(turn: Turn<PartyOptions, PartyState>, amount: number): void {
  const s = turn.state;
  if (s.phase !== 'blow' || s.time < LIT_PAUSE) return;
  s.blow = Math.min(1, s.blow + amount);
  const n = s.candles.length;
  s.candles.forEach((c, i) => {
    if (s.blow >= (i + 1) / n - 1e-9) c.out = true;
  });
  if (s.blow >= 1) {
    s.points += scoreAction(turn.round, 1, STEP_POINTS - LIGHT_POINTS);
    s.phase = 'party';
    s.time = 0;
    s.holding = false;
  }
}

export function pressParty(turn: Turn<PartyOptions, PartyState>, x: number, y: number): boolean {
  const s = turn.state;
  if (s.phase === 'light') return lightCandle(turn, x, y);
  if (s.phase === 'blow') {
    if (s.time < LIT_PAUSE) return false;
    s.holding = true;
    blowBy(turn, PUFF);
    return true;
  }
  // The party: a tap makes the nearest friend hop.
  let index = 0;
  FRIENDS.forEach((f, i) => {
    if (Math.hypot(f.x - x, f.y - y) < Math.hypot(FRIENDS[index].x - x, FRIENDS[index].y - y)) {
      index = i;
    }
  });
  s.hop = { index, time: s.time };
  return true;
}

export function updateParty(turn: Turn<PartyOptions, PartyState>, dt: number): void {
  const s = turn.state;
  s.time += dt;
  if (s.phase === 'blow' && s.holding) blowBy(turn, dt / BLOW_TIME);
  if (s.phase === 'party' && s.time >= PARTY_TIME) {
    s.time = PARTY_TIME;
    s.phase = 'party';
    if (turn.round.phase === 'playing') finishStep(turn.round, s.points);
  }
}

/** For tests: lights each candle right on its wick, blows, and waits for the song. */
export function solveParty(turn: Turn<PartyOptions, PartyState>): void {
  const s = turn.state;
  for (const c of s.candles) {
    if (!c.lit) lightCandle(turn, flameOf(c).x, flameOf(c).y);
  }
  s.time = Math.max(s.time, LIT_PAUSE);
  blowBy(turn, 1);
}

// ---------------------------------------------------------------------------
// Drawing

/** "Happy cooking to you": the birthday tune's first two lines, as [note in Hz, beats]. */
const G4 = 392;
const A4 = 440;
const B4 = 493.88;
const C5 = 523.25;
const D5 = 587.33;
export const SONG: [number, number][][] = [
  [
    [G4, 0.75],
    [G4, 0.25],
    [A4, 1],
    [G4, 1],
    [C5, 1],
    [B4, 2],
  ],
  [
    [G4, 0.75],
    [G4, 0.25],
    [A4, 1],
    [G4, 1],
    [D5, 1],
    [C5, 2],
  ],
];
const BEAT = 0.36;

function drawCandle(
  g: G,
  t: number,
  x: number,
  y: number,
  i: number,
  lit: boolean,
  out: boolean,
  outAge: number,
) {
  const stripes = [C.hotPink, C.sky, C.mint, C.lavender, C.gold];
  rounded(g, x - 8, y - CANDLE_H, 16, CANDLE_H, 5);
  fillStroke(g, C.white, 3);
  g.save();
  rounded(g, x - 8, y - CANDLE_H, 16, CANDLE_H, 5);
  g.clip();
  g.strokeStyle = stripes[i % stripes.length];
  g.lineWidth = 5;
  for (let k = -1; k < 6; k++) {
    g.beginPath();
    g.moveTo(x - 10, y - CANDLE_H + k * 11);
    g.lineTo(x + 10, y - CANDLE_H + k * 11 - 9);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = C.ink;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x, y - CANDLE_H);
  g.lineTo(x, y - CANDLE_H - 8);
  g.stroke();
  const f = flameOf({ x, y });
  if (lit && !out) {
    // A flickering cartoon flame.
    const flick = 1 + Math.sin(t * 17 + i * 2) * 0.12 + Math.sin(t * 29 + i) * 0.06;
    const lean = Math.sin(t * 9 + i) * 3;
    const h = 24 * flick;
    g.fillStyle = 'rgba(255, 229, 138, 0.35)';
    circle(g, f.x, f.y, 22 * flick);
    g.fill();
    g.beginPath();
    g.moveTo(f.x - 9, f.y + 6);
    g.quadraticCurveTo(f.x - 10, f.y - h * 0.5, f.x + lean, f.y - h);
    g.quadraticCurveTo(f.x + 10, f.y - h * 0.5, f.x + 9, f.y + 6);
    g.quadraticCurveTo(f.x, f.y + 12, f.x - 9, f.y + 6);
    g.closePath();
    fillStroke(g, vertical(g, f.y - h, f.y + 10, [C.butter, C.gold, C.ember]), 2.5);
  } else if (out && outAge < 2.5) {
    // A curl of smoke where the flame was.
    g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - outAge / 2.5)})`;
    g.lineWidth = 4;
    g.lineCap = 'round';
    g.beginPath();
    for (let k = 0; k <= 8; k++) {
      g.lineTo(f.x + Math.sin(k * 0.9 + t * 3) * 6, f.y - outAge * 20 - k * 5);
    }
    g.stroke();
  } else if (!lit) {
    // A sparkle on the wick: tap here!
    g.fillStyle = C.gold;
    circle(g, f.x, f.y + 4, 4 + Math.sin(t * 6 + i) * 1.5);
    g.fill();
  }
}

/** A party friend popping up to sing, mouth open on the beat. */
function drawFriend(
  g: G,
  t: number,
  x: number,
  y: number,
  who: string,
  appear: number,
  sing: boolean,
  hop: number,
) {
  if (appear <= 0.01) return;
  const bob = sing ? Math.abs(Math.sin(t * 4.4 + x)) * 6 : 0;
  g.save();
  g.translate(x, y - bob - hop * 30);
  g.scale(appear, appear);
  g.fillStyle = C.ink;
  emoji(g, who, 0, 0, 64);
  // A party hat.
  g.beginPath();
  g.moveTo(-14, -26);
  g.lineTo(14, -26);
  g.lineTo(2, -62);
  g.closePath();
  fillStroke(g, CONFETTI[Math.floor(x) % CONFETTI.length], 3);
  circle(g, 2, -64, 6);
  fillStroke(g, C.gold, 2.5);
  if (sing) {
    g.fillStyle = C.ink;
    emoji(g, '♪', 36, -30 - ((t * 40 + x) % 30), 26);
  }
  g.restore();
}

interface PartyFx {
  lit: number;
  phase: PartyState['phase'];
  outs: number;
  outAge: number[];
  /** The party's clock, for the song and confetti. */
  partyAge: number;
  confetti: number;
  sang: number;
  said: boolean;
  puff: number;
}

const party: Step<PartyOptions, PartyState, PartyFx> = {
  kind: 'party',
  uses: (o) => [[o.cake, 'partyCake']],
  start: (o) => startParty(o),

  title: () => 'Party time!',
  hint: () => ['Tap each candle,', 'then blow them out!'],
  icon: () => '🎂',
  progress: ({ state }) => [
    state.candles.length + 1,
    state.results.length + (state.phase === 'party' ? 1 : 0),
  ],
  points: ({ state }) => state.points,
  bubble: ({ state }) =>
    state.phase === 'blow'
      ? ['Now blow them out!', 'Hold the Blow! button.']
      : state.phase === 'party'
        ? ['Happy cooking', 'to you!']
        : null,

  press: (turn, x, y) => pressParty(turn, x, y),
  release: (turn) => {
    turn.state.holding = false;
  },
  update: (turn, dt) => updateParty(turn, dt),
  solve: (turn) => solveParty(turn),

  fx: () => ({
    lit: 0,
    phase: 'light',
    outs: 0,
    outAge: [],
    partyAge: 0,
    confetti: 0,
    sang: 0,
    said: false,
    puff: 0,
  }),

  observe({ state: s, fx, dt, effects }) {
    const lit = s.candles.filter((c) => c.lit).length;
    if (lit > fx.lit) {
      const c = s.candles.filter((k) => k.lit)[lit - 1] ?? s.candles[0];
      const f = flameOf(c);
      effects.sound.tone(660 + lit * 110, 0.18, { type: 'triangle', volume: 0.12 });
      effects.sound.hiss(0.15, { filter: 'highpass', from: 2500, volume: 0.06 });
      effects.burst(f.x, f.y, 8, ['star'], [C.gold, C.butter], 160);
      effects.celebrate(f.x, f.y - 20);
    }
    fx.lit = lit;
    const outs = s.candles.filter((c) => c.out).length;
    while (fx.outAge.length < s.candles.length) fx.outAge.push(0);
    s.candles.forEach((c, i) => {
      if (c.out) fx.outAge[i] += dt;
    });
    if (outs > fx.outs) {
      effects.sound.hiss(0.25, { filter: 'lowpass', from: 1200, to: 300, volume: 0.12 });
    }
    fx.outs = outs;
    if (s.phase === 'blow' && s.holding) {
      fx.puff -= dt;
      if (fx.puff <= 0) {
        effects.sound.hiss(0.3, { filter: 'bandpass', from: 700, to: 400, volume: 0.1 });
        fx.puff = 0.28;
      }
    }

    if (s.phase === 'party') {
      if (fx.phase !== 'party') {
        effects.sound.fanfare();
        effects.calm();
        fx.partyAge = 0;
      }
      fx.partyAge += dt;
      // The song: one line, then "Happy cooking to you!" said with the second.
      let at = 0.4;
      SONG.forEach((line, k) => {
        if (fx.sang === k && fx.partyAge >= at) {
          let delay = 0;
          for (const [note, beats] of line) {
            effects.sound.tone(note, beats * BEAT * 0.95, {
              type: 'triangle',
              volume: 0.16,
              delay,
            });
            effects.sound.tone(note * 2, beats * BEAT * 0.6, { type: 'sine', volume: 0.04, delay });
            delay += beats * BEAT;
          }
          fx.sang = k + 1;
        }
        at += 7 * BEAT;
      });
      if (!fx.said && fx.partyAge >= 0.4 + 7 * BEAT) {
        fx.said = true;
        effects.sound.say('Happy cooking to you!');
      }
      fx.confetti -= dt;
      if (fx.confetti <= 0 && fx.partyAge < PARTY_TIME) {
        effects.burst(
          160 + ((fx.partyAge * 997) % 480),
          120,
          14,
          ['confetti', 'star', 'heart'],
          CONFETTI,
          260,
          160,
        );
        fx.confetti = 0.45;
      }
    }
    fx.phase = s.phase;
  },

  draw({ g, t, state: s, options, round, fx, taking, shape }) {
    const art = artOf(options.cake, 'partyCake');
    const partying = s.phase === 'party';

    // Bunting across the wall.
    g.lineWidth = 3;
    g.strokeStyle = C.ink;
    g.beginPath();
    g.moveTo(230, 118);
    g.quadraticCurveTo(400, 158, 570, 118);
    g.stroke();
    for (let k = 0; k < 7; k++) {
      const p = (k + 0.5) / 7;
      const x = 230 + p * 340;
      const y = 118 + Math.sin(p * Math.PI) * 20 + Math.sin(t * 2 + k) * (partying ? 3 : 1);
      g.beginPath();
      g.moveTo(x - 16, y);
      g.lineTo(x + 16, y);
      g.lineTo(x, y + 30);
      g.closePath();
      fillStroke(g, CONFETTI[k % CONFETTI.length], 2.5);
    }

    // The friends at the back pop up first.
    const friendsAppear = (i: number) =>
      partying ? easeOutBack(clamp01((fx.partyAge - i * 0.15) / 0.4)) : 0;
    const hopOf = (i: number) =>
      s.hop && s.hop.index === i ? Math.sin(clamp01((s.time - s.hop.time) / 0.4) * Math.PI) : 0;
    FRIENDS.slice(0, 2).forEach((f, i) =>
      drawFriend(g, t, f.x, f.y, f.who, friendsAppear(i), partying, hopOf(i)),
    );

    art.draw(g, { t, round });
    s.candles.forEach((c, i) => drawCandle(g, t, c.x, c.y, i, c.lit, c.out, fx.outAge[i] ?? 0));

    FRIENDS.slice(2).forEach((f, i) =>
      drawFriend(g, t, f.x, f.y, f.who, friendsAppear(i + 2), partying, hopOf(i + 2)),
    );

    // Lighting: a finger at the next candle.
    if (taking && s.phase === 'light') {
      const next = s.candles.find((c) => !c.lit);
      if (next) {
        const f = flameOf(next);
        g.fillStyle = C.ink;
        emoji(g, '👆', f.x + 16, f.y + 40 + Math.sin(t * 6) * 6, 40);
      }
    }

    // Blowing: the big Blow! button, puffing as it's held.
    if (s.phase === 'blow' && s.time >= LIT_PAUSE * 0.5) {
      const b = blowButton(shape);
      const pulse = s.holding ? 0.94 : 1 + Math.sin(t * 6) * 0.05;
      g.save();
      g.translate(b.x, b.y);
      g.scale(pulse, pulse);
      circle(g, 0, 0, b.r);
      fillStroke(g, vertical(g, -b.r, b.r, [C.skyLight, C.sky]), 5);
      g.fillStyle = C.ink;
      emoji(g, '💨', 0, -b.r * 0.2, b.r * 0.7);
      stickerText(g, 'Blow!', 0, b.r * 0.48, b.r * 0.42, C.hotPink);
      g.restore();
      // Puffs of breath drifting to the candles while blowing.
      if (s.holding) {
        g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        g.lineWidth = 5;
        g.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const p = (t * 1.6 + k / 3) % 1;
          const x = b.x - 60 - p * 120;
          const y = b.y - 40 - k * 24 - p * 40;
          g.beginPath();
          g.moveTo(x + 30, y);
          g.quadraticCurveTo(x + 10, y - 12, x - 10, y);
          g.stroke();
        }
      }
      if (taking && !s.holding) {
        g.fillStyle = C.ink;
        emoji(g, '👆', b.x + b.r * 0.85, b.y + b.r * 0.95 + Math.sin(t * 6) * 5, 40);
      }
    }

    // The song's words, once the popup for the blow has gone.
    if (partying && fx.partyAge > 1.1) {
      const pop = easeOutBack(clamp01((fx.partyAge - 1.1) / 0.5));
      stickerText(g, 'Happy cooking to you!', 400, 160, 34 * pop + 1, C.hotPink, 'center', 560);
    }
  },
};

export default party;
