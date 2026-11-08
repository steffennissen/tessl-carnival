import {
  C,
  CONFETTI,
  type G,
  clamp01,
  easeOutBack,
  emoji,
  fillStroke,
  plainText,
  rounded,
  stickerText,
  vertical,
} from '../art';
import type { Shape } from '../layout';
import {
  answer,
  autoReadDelay,
  drawQuestion,
  finishStep,
  fitWords,
  inCircle,
  middleOf,
  startAnswer,
  type AnswerState,
  type Box,
  type Disc,
  type Feedback,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';
import type { Reading } from '../sound';

/**
 * Sequence: put the recipe in order. The dish's step cards lie shuffled in
 * a tray; she drags each one up into its slot (First, Next, Then, Last), or
 * just taps the cards in order and each flies to the next empty slot. A
 * card in the wrong slot slides gently back with a hint; after two wrong
 * tries, the card that comes next glows. Then the cooking follows that
 * order. A learning step, woven in by activities/recipe-order.ts.
 */

export interface SequenceCard {
  /** The step's title: "Chop the carrot!". */
  text: string;
  /** Its emoji, or null for words only (Level 2). */
  icon: string | null;
}

export interface SequenceOptions extends StepBasics {
  kind: 'sequence';
  /** The cards in the recipe's real order. */
  cards: SequenceCard[];
  /** How they lie in the tray, left to right (or top to bottom): indices into `cards`. */
  tray: number[];
}

declare module '../kit/types' {
  interface StepKinds {
    sequence: SequenceOptions;
  }
}

/** What the slots are called, for 3 or 4 cards. */
export function slotNames(count: number): string[] {
  return count <= 3
    ? ['First', 'Next', 'Last'].slice(3 - count)
    : ['First', 'Next', 'Then', 'Last'];
}

/** What the voice reads, and the bubble says. */
export const SEQUENCE_TEXT = 'Put the recipe in order! What do we do first?';

/** A pointer that moves less than this is a tap: the card flies to the next empty slot. */
export const TAP_SLOP = 18;
/** Seconds a card takes to slide back or fly to its slot. */
const GLIDE = 0.35;
/** Seconds of cheering once they're all in order, before cooking starts. */
const OUTRO = 1.6;

export interface SequenceState extends AnswerState {
  /** The card in each slot, or null. Slot i takes card i. */
  slots: (number | null)[];
  /** The card being dragged: where the finger took it, and where it is now. */
  held: {
    card: number;
    /** Where on the card the finger is. */
    dx: number;
    dy: number;
    /** Where the finger went down, and is now. */
    sx: number;
    sy: number;
    x: number;
    y: number;
    /** The farthest it has moved from where it went down. */
    moved: number;
  } | null;
  /** Cards gliding home (back to the tray, or into a slot), from where they were let go. */
  gliding: { card: number; x: number; y: number; age: number }[];
  /** The slot a card last went into. */
  placedAt: number | null;
  /** The slot of the last wrong try, for the hint. */
  missed: number | null;
  /** Taps on the speaker. */
  reads: number;
  /** Cards picked up, to read each one out. */
  lifts: number;
  age: number;
  /** All in order. */
  done: boolean;
  after: number;
}

export interface SequencePlaces {
  bubble: Box;
  speaker: Disc;
  /** Where each slot is, in order. */
  slots: Box[];
  /** Where each tray position is, in order. */
  tray: Box[];
}

/**
 * Where everything goes for `count` cards. On a computer and a phone held
 * sideways: the slots in a row, the tray in a row under them. On a phone
 * held upright: one row per card, its slot at the left and a tray card at
 * the right, as tall as the screen allows.
 */
export function sequencePlaces(count: number, shape: Shape = 'page'): SequencePlaces {
  if (shape === 'tall') {
    const gap = 10;
    const top = 208;
    const h = (545 - top - gap * (count - 1)) / count;
    const rows = Array.from({ length: count }, (_, i) => top + i * (h + gap));
    return {
      bubble: { x: 110, y: 100, w: 580, h: 98 },
      speaker: { x: 169, y: 149, r: 47 },
      // A gap down the middle keeps the progress star at the bottom clear.
      slots: rows.map((y) => ({ x: 110, y, w: 258, h })),
      tray: rows.map((y) => ({ x: 432, y, w: 258, h })),
    };
  }
  const gap = 12;
  const w = Math.min(170, (570 - gap * (count - 1)) / count);
  const left = 500 - (count * w + gap * (count - 1)) / 2;
  const row = (y: number, h: number) =>
    Array.from({ length: count }, (_, i) => ({ x: left + i * (w + gap), y, w, h }));
  return {
    bubble: { x: 215, y: 110, w: 410, h: 90 },
    speaker: shape === 'wide' ? { x: 268, y: 155, r: 39 } : { x: 254, y: 155, r: 26 },
    slots: row(232, 104),
    tray: row(352, 106),
  };
}

export function startSequence(o: SequenceOptions): SequenceState {
  return {
    ...startAnswer(),
    slots: o.cards.map(() => null),
    held: null,
    gliding: [],
    placedAt: null,
    missed: null,
    reads: 0,
    lifts: 0,
    age: 0,
    done: false,
    after: 0,
  };
}

const inBox = (b: Box, x: number, y: number, slop = 0) =>
  x >= b.x - slop && x <= b.x + b.w + slop && y >= b.y - slop && y <= b.y + b.h + slop;

/** Where a card sits now: its slot once it's in, otherwise its place in the tray. */
export function homeOf(o: SequenceOptions, s: SequenceState, card: number, shape?: Shape): Box {
  const places = sequencePlaces(o.cards.length, shape);
  const slot = s.slots.indexOf(card);
  return slot >= 0 ? places.slots[slot] : places.tray[o.tray.indexOf(card)];
}

/** The card that belongs in the first empty slot: the one Chef Bunny shows. */
export function nextCard(s: SequenceState): number {
  return s.slots.findIndex((c) => c === null);
}

export function pressSequence(
  turn: Turn<SequenceOptions, SequenceState>,
  x: number,
  y: number,
): boolean {
  const { options: o, state: s } = turn;
  if (s.done) return true;
  const places = sequencePlaces(o.cards.length, turn.shape);
  if (inCircle(places.speaker.x, places.speaker.y, places.speaker.r, x, y)) {
    s.reads += 1;
    return true;
  }
  // A card still in the tray, a little forgiving round the edges.
  const card = o.tray.find(
    (c) => !s.slots.includes(c) && inBox(places.tray[o.tray.indexOf(c)], x, y, 8),
  );
  if (card === undefined) return true;
  const box = places.tray[o.tray.indexOf(card)];
  s.gliding = s.gliding.filter((g) => g.card !== card);
  s.held = { card, dx: x - box.x, dy: y - box.y, sx: x, sy: y, x, y, moved: 0 };
  s.lifts += 1;
  return true;
}

export function moveSequence(turn: Turn<SequenceOptions, SequenceState>, x: number, y: number) {
  const h = turn.state.held;
  if (!h) return;
  h.moved = Math.max(h.moved, Math.hypot(x - h.sx, y - h.sy));
  h.x = x;
  h.y = y;
}

/**
 * Lets go of the card. A tap sends it to the first empty slot; a drag puts
 * it in the slot under the card's middle (or the nearest one it overlaps).
 * In its own slot it stays; anywhere else it slides back to the tray, and
 * a wrong slot counts as a try (two show the answer). Let go away from
 * every slot, it just slides back.
 */
export function releaseSequence(turn: Turn<SequenceOptions, SequenceState>): null {
  const { options: o, state: s, round } = turn;
  const h = s.held;
  if (!h) return null;
  s.held = null;
  const places = sequencePlaces(o.cards.length, turn.shape);
  const tapped = h.moved < TAP_SLOP;
  // Where the card's middle is now.
  const size = places.tray[o.tray.indexOf(h.card)];
  const at = { x: h.x - h.dx + size.w / 2, y: h.y - h.dy + size.h / 2 };
  const from = { x: h.x - h.dx, y: h.y - h.dy };
  let slot = tapped ? nextCard(s) : places.slots.findIndex((b) => inBox(b, at.x, at.y, 24));
  if (!tapped && slot >= 0 && s.slots[slot] !== null) slot = -1;
  if (slot < 0) {
    if (!tapped) s.gliding.push({ card: h.card, ...from, age: 0 });
    return null;
  }
  if (slot === h.card) {
    s.slots[slot] = h.card;
    s.placedAt = slot;
    s.gliding.push({ card: h.card, ...from, age: 0 });
    s.missed = null;
    if (nextCard(s) < 0) {
      s.done = true;
      answer(round, s, true);
    }
    return null;
  }
  // The wrong slot: it glides there, then back home to the tray.
  const target = places.slots[slot];
  s.gliding.push({
    card: h.card,
    x: tapped ? target.x : from.x,
    y: tapped ? target.y : from.y,
    age: 0,
  });
  s.missed = slot;
  answer(round, s, false);
  return null;
}

export function updateSequence(turn: Turn<SequenceOptions, SequenceState>, dt: number) {
  const s = turn.state;
  s.age += dt;
  for (const g of s.gliding) g.age += dt;
  s.gliding = s.gliding.filter((g) => g.age < GLIDE);
  if (!s.done) return;
  s.after += dt;
  if (s.after >= OUTRO) finishStep(turn.round, 0);
}

/** Chef Bunny's bubble: a hint after a wrong try, where to look when shown, a cheer when done. */
export function sequenceBubble(o: SequenceOptions, s: SequenceState): [string, string] | null {
  if (s.done)
    return s.outcome === 'right'
      ? ['Yes! You are', 'a Smart Chef!']
      : ['Yes! Now', "let's cook it!"];
  if (s.shown) return ['Look for the', 'glowing card!'];
  if (s.missed !== null) {
    const name = slotNames(o.cards.length)[nextCard(s)] ?? 'next';
    return ['Hmm! What do we', `do ${name.toLowerCase()}?`];
  }
  return null;
}

interface SequenceFx {
  reading: Reading | null;
  reads: number;
  autoRead: boolean;
  lifts: number;
  wrong: number;
  placed: number;
  shown: boolean;
  done: boolean;
}

const CHEER: Feedback = { grade: 'Perfect!', points: 0, combo: 0, age: 0 };
const NICE: Feedback = { grade: 'Great!', points: 0, combo: 0, age: 0 };
const ENCOURAGE: Feedback = { grade: 'Nice try!', points: 0, combo: 0, age: 0 };

/** One step card: its emoji (Level 1) and its words, fitted to the box. */
function drawCard(
  g: G,
  card: SequenceCard,
  b: Box,
  look: 'plain' | 'held' | 'placed' | 'glow',
  t: number,
  label?: string,
) {
  g.save();
  if (look === 'glow') {
    const pulse = 1 + Math.sin(t * 6) * 0.04;
    const mid = middleOf(b);
    g.translate(mid.x, mid.y);
    g.scale(pulse, pulse);
    g.translate(-mid.x, -mid.y);
    g.strokeStyle = C.gold;
    g.lineWidth = 7;
    rounded(g, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 22);
    g.stroke();
  }
  if (look === 'held') {
    g.fillStyle = 'rgba(91, 59, 79, 0.18)';
    rounded(g, b.x + 6, b.y + 8, b.w, b.h, 18);
    g.fill();
  }
  rounded(g, b.x, b.y, b.w, b.h, 18);
  const fill =
    look === 'placed'
      ? vertical(g, b.y, b.y + b.h, [C.cabinetLight, C.mint])
      : vertical(g, b.y, b.y + b.h, [C.white, C.cream]);
  fillStroke(g, fill, 4);
  const wide = b.w > b.h * 2.2;
  const icon = card.icon;
  // The emoji at the left of a wide card, or on top of a squarer one.
  const iconSize = Math.min(b.h * (wide ? 0.55 : 0.32), 44);
  let tx = b.x + 10;
  let tw = b.w - 20;
  let ty = b.y + 8;
  let th = b.h - 16;
  if (icon) {
    g.fillStyle = C.ink;
    if (wide) {
      emoji(g, icon, b.x + 12 + iconSize / 2, b.y + b.h / 2 + 2, iconSize);
      tx += iconSize + 6;
      tw -= iconSize + 6;
    } else {
      emoji(g, icon, b.x + b.w / 2, b.y + 8 + iconSize / 2, iconSize);
      ty += iconSize + 4;
      th -= iconSize + 4;
    }
  }
  const fit = fitWords(g, card.text, tw, 24, Math.max(1, Math.floor(th / 21)), 13);
  const gap = fit.size * 1.15;
  const top = ty + th / 2 - ((fit.lines.length - 1) * gap) / 2;
  fit.lines.forEach((line, i) => plainText(g, line, tx + tw / 2, top + i * gap, fit.size, C.ink));
  if (label) {
    // The slot's name, on a little tab at the top corner.
    rounded(g, b.x + 8, b.y - 12, 64, 22, 11);
    fillStroke(g, C.hotPink, 2.5);
    plainText(g, label, b.x + 40, b.y - 1, 14, C.white);
  }
  g.restore();
}

/** An empty slot: a dashed outline with its name. */
function drawSlot(g: G, b: Box, name: string, hot: boolean) {
  g.save();
  rounded(g, b.x, b.y, b.w, b.h, 18);
  g.fillStyle = hot ? 'rgba(255, 229, 138, 0.85)' : 'rgba(255, 255, 255, 0.8)';
  g.fill();
  g.setLineDash([10, 8]);
  g.strokeStyle = hot ? C.gold : C.hotPink;
  g.lineWidth = 4;
  g.stroke();
  g.setLineDash([]);
  stickerText(
    g,
    name,
    b.x + b.w / 2,
    b.y + b.h / 2 + 2,
    Math.min(34, b.h * 0.4),
    C.pink,
    'center',
    b.w - 16,
  );
  g.restore();
}

const sequence: Step<SequenceOptions, SequenceState, SequenceFx> = {
  kind: 'sequence',
  learning: true,
  // The cards are the recipe's own steps, checked where they're cooked.
  uses: () => [],
  start: (o) => startSequence(o),
  title: () => 'Recipe in order!',
  hint: () => ['Drag the cards,', 'or tap them in order!'],
  icon: () => '📋',
  // One star, like a question: a narrow progress pill keeps clear of the cards.
  progress: ({ state }) => [1, state.done ? 1 : 0],
  press: (turn, x, y) => pressSequence(turn, x, y),
  move: (turn, x, y) => moveSequence(turn, x, y),
  release: (turn) => releaseSequence(turn),
  update: (turn, dt) => updateSequence(turn, dt),
  bubble: ({ options, state }) => sequenceBubble(options, state),
  solve(turn) {
    const { options: o, state: s } = turn;
    const places = sequencePlaces(o.cards.length, turn.shape);
    for (let card = 0; card < o.cards.length && !s.done; card++) {
      const at = middleOf(places.tray[o.tray.indexOf(card)]);
      pressSequence(turn, at.x, at.y);
      releaseSequence(turn);
    }
    updateSequence(turn, OUTRO);
  },

  fx: () => ({
    reading: null,
    reads: 0,
    autoRead: false,
    lifts: 0,
    wrong: 0,
    placed: 0,
    shown: false,
    done: false,
  }),

  observe({ state: s, options: o, fx, effects, round, taking, shape }) {
    const { sound } = effects;
    const settings = round.learn.settings;
    const places = sequencePlaces(o.cards.length, shape);
    const delay = autoReadDelay(settings);
    if (taking && !fx.autoRead && delay !== null && s.age >= delay && !s.done) {
      fx.autoRead = true;
      fx.reading = sound.read(SEQUENCE_TEXT);
    }
    if (s.reads > fx.reads) {
      fx.reads = s.reads;
      fx.autoRead = true;
      fx.reading = sound.read(SEQUENCE_TEXT);
    }
    if (s.lifts > fx.lifts) {
      fx.lifts = s.lifts;
      sound.pop();
      // Each card is read out as it's picked up, unless she reads it herself.
      if (s.held && !settings.readMyself) sound.say(o.cards[s.held.card].text);
    }
    const placed = s.slots.filter((c) => c !== null).length;
    if (placed > fx.placed) {
      fx.placed = placed;
      const slot = s.placedAt ?? 0;
      const at = middleOf(places.slots[slot] ?? places.slots[0]);
      sound.chime([1046.5, 1318.5], 0.08, 0.12);
      effects.burst(at.x, at.y, 8, ['star', 'heart'], CONFETTI, 180);
      if (placed < o.cards.length) effects.celebrate(at.x, at.y, NICE);
    }
    if (s.wrong > fx.wrong) {
      fx.wrong = s.wrong;
      const at = middleOf(places.slots[s.missed ?? 0]);
      sound.boop();
      effects.celebrate(at.x, at.y, ENCOURAGE);
      if (!s.shown && !settings.readMyself) {
        const name = slotNames(o.cards.length)[nextCard(s)] ?? 'next';
        sound.say(`Hmm! What do we do ${name.toLowerCase()}?`);
      }
    }
    if (s.shown && !fx.shown) {
      fx.shown = true;
      sound.chime([1046.5, 1318.5], 0.12, 0.12);
      const next = nextCard(s);
      if (!settings.readMyself && next >= 0) {
        sound.say(`${slotNames(o.cards.length)[next]}: ${o.cards[next].text}`);
      }
    }
    if (s.done && !fx.done) {
      fx.done = true;
      const at = middleOf(places.slots[Math.floor(o.cards.length / 2)]);
      sound.chime([1046.5, 1318.5, 1568, 2093], 0.07, 0.16);
      effects.burst(at.x, at.y, 20, ['star', 'heart', 'star', 'dot'], CONFETTI, 260);
      effects.celebrate(at.x, at.y, CHEER);
      sound.say("Yes! That's the recipe! Let's cook!");
    }
  },

  draw({ g, t, state: s, options: o, fx, taking, shape }) {
    if (!taking && s.age === 0) return;
    const places = sequencePlaces(o.cards.length, shape);
    const names = slotNames(o.cards.length);
    const appear = easeOutBack(clamp01(s.age / 0.4));
    const mid = middleOf(places.bubble);
    g.save();
    g.translate(mid.x, mid.y);
    g.scale(appear, appear);
    g.translate(-mid.x, -mid.y);
    drawQuestion(g, SEQUENCE_TEXT, places.bubble, places.speaker, fx.reading, t);
    g.restore();

    // The slot the held card is over lights up.
    let hot = -1;
    if (s.held) {
      const size = places.tray[o.tray.indexOf(s.held.card)];
      const at = { x: s.held.x - s.held.dx + size.w / 2, y: s.held.y - s.held.dy + size.h / 2 };
      hot = places.slots.findIndex((b, i) => s.slots[i] === null && inBox(b, at.x, at.y, 24));
    }
    places.slots.forEach((b, i) => {
      if (s.slots[i] === null) drawSlot(g, b, names[i], i === hot);
    });
    // Empty tray places, a soft dent where a card was.
    places.tray.forEach((b) => {
      rounded(g, b.x + 4, b.y + 4, b.w - 8, b.h - 8, 16);
      g.fillStyle = 'rgba(255, 255, 255, 0.35)';
      g.fill();
    });

    const show = s.shown && !s.done ? nextCard(s) : -1;
    const glide = (card: number, home: Box): Box => {
      const gl = s.gliding.find((x) => x.card === card);
      if (!gl) return home;
      const k = easeOutBack(clamp01(gl.age / GLIDE));
      return { ...home, x: gl.x + (home.x - gl.x) * k, y: gl.y + (home.y - gl.y) * k };
    };
    o.cards.forEach((card, i) => {
      if (s.held?.card === i) return;
      const slot = s.slots.indexOf(i);
      const home = homeOf(o, s, i, shape);
      const pop = easeOutBack(clamp01((s.age - 0.2 - o.tray.indexOf(i) * 0.08) / 0.35));
      if (pop <= 0.01) return;
      const b = glide(i, home);
      const m = middleOf(b);
      g.save();
      g.translate(m.x, m.y);
      g.scale(pop, pop);
      g.translate(-m.x, -m.y);
      drawCard(
        g,
        card,
        b,
        slot >= 0 ? 'placed' : i === show ? 'glow' : 'plain',
        t,
        slot >= 0 ? names[slot] : undefined,
      );
      g.restore();
    });
    if (s.held) {
      const size = places.tray[o.tray.indexOf(s.held.card)];
      const b = { x: s.held.x - s.held.dx, y: s.held.y - s.held.dy, w: size.w, h: size.h };
      const m = middleOf(b);
      g.save();
      g.translate(m.x, m.y);
      g.scale(1.06, 1.06);
      g.rotate(-0.03);
      g.translate(-m.x, -m.y);
      drawCard(g, o.cards[s.held.card], b, 'held', t);
      g.restore();
    }
  },
};

export default sequence;
