import type { Grade } from './kit';

/**
 * Chef Bunny's mind: how she reacts to what you do, what she says about it
 * and when, and her little idle habits (blinking, ear flicks, glances). Plain
 * functions with no canvas, so they're tested without a browser. render.ts
 * feeds her what happens and bunny.ts draws her.
 *
 * She is always kind: a miss gets an encouraging face, never a sad one. And
 * she reads every step out loud for cooks who can't read yet, so her own
 * chatter is rare and short, and never talks over an instruction.
 */

export type BunnyMood = 'idle' | 'cheer' | 'nod' | 'party' | 'encourage';

/** Seconds each mood lasts before she's back to idle. */
export const MOOD_TIME: Record<BunnyMood, number> = {
  idle: Infinity,
  cheer: 1.2,
  nod: 1,
  party: 2.2,
  encourage: 1.6,
};

/** Seconds between two things she says on her own. */
export const CHATTER_GAP = 8;
/** Seconds after a step's instruction starts before she may chat. */
export const INSTRUCTION_QUIET = 4;

/** What she might say, by what just happened. Short, kind, and never twice in a row. */
export const LINES = {
  cheer: ['Yay!', 'Wow!', 'So yummy!', 'You did it!', 'Hooray!', 'Super!'],
  nod: ['Nice!', 'Good job!', 'Well done!', 'Looking good!'],
  encourage: ['Almost!', 'You can do it!', 'Nearly there!', 'Keep going!', 'Good try!'],
  notYet: ['Almost time!', 'Wait for it!', 'Not quite yet!', 'Nearly!'],
  peek: ['Ooh!', 'Ooh, yummy!', 'Smells good!', 'Look at that!'],
} as const;

/** How likely she is to say something, when she's allowed to. */
export const CHANCE = {
  party: 1,
  cheer: 0.2,
  nod: 0.12,
  encourage: 0.35,
  notYet: 0.3,
  peek: 0.25,
} as const;

const NUMBERS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
];

/** A number as she'd say it: "three", or 15 as "15". */
export function spoken(n: number): string {
  return NUMBERS[n] ?? String(n);
}

/** Her lines for a streak of `combo` perfect actions. */
export function partyLines(combo: number): string[] {
  const n = spoken(combo);
  const N = n[0].toUpperCase() + n.slice(1);
  return [`Wow, ${n} in a row!`, `${N} in a row, yay!`, `${N} perfect ones!`];
}

/**
 * Whether a streak of `combo` perfect actions is worth a party: 3, 5, then
 * every 5. Rare on purpose, so it stays special.
 */
export function isMilestone(combo: number): boolean {
  return combo === 3 || combo === 5 || (combo >= 10 && combo % 5 === 0);
}

/** What she can react to. */
export type ChefEvent =
  /** An action scored, with its grade and the streak after it. */
  | { kind: 'hit'; grade: Grade; combo: number }
  /** A tap or a let-go that came too early. */
  | { kind: 'not yet' }
  /** You started holding: pouring, shaking, baking... She leans in to look. */
  | { kind: 'peek' };

/** Her blinks, ear flicks and glances, each counting down to the next. */
export interface Idle {
  blinkIn: number;
  /** Seconds since the last blink started. */
  blinkAge: number;
  /** Blinks left in a double blink. */
  blinksLeft: number;
  earIn: number;
  earAge: number;
  earSide: -1 | 1;
  glanceIn: number;
  glanceAge: number;
}

export interface Chef {
  mood: BunnyMood;
  moodAge: number;
  /** The last thing she said, so she never says it twice in a row. */
  lastLine: string | null;
  /** When she last said something on her own, in seconds of the clock. */
  lastChatter: number;
  /** When the current step's instruction started being read out. */
  lastInstruction: number;
  /** The streak she last had a party for, so each milestone gets one. */
  partyCombo: number;
  /** Whether you were holding last frame. */
  holding: boolean;
  /** How far she leans in to look, 0 to 1. */
  lean: number;
  idle: Idle;
}

export const BLINK_TIME = 0.13;
export const EAR_TIME = 0.5;
export const GLANCE_TIME = 1.2;

/** A random number between `low` and `high`. */
function between(random: () => number, low: number, high: number) {
  return low + random() * (high - low);
}

export function createChef(random: () => number = Math.random): Chef {
  return {
    mood: 'idle',
    moodAge: 9,
    lastLine: null,
    lastChatter: -Infinity,
    lastInstruction: -Infinity,
    partyCombo: 0,
    holding: false,
    lean: 0,
    idle: {
      blinkIn: between(random, 1.5, 4),
      blinkAge: 9,
      blinksLeft: 0,
      earIn: between(random, 3, 7),
      earAge: 9,
      earSide: 1,
      glanceIn: between(random, 5, 9),
      glanceAge: 9,
    },
  };
}

/** One of `lines` at random, but never `previous` (unless it's the only one). */
export function pickLine(
  lines: readonly string[],
  previous: string | null,
  random: () => number = Math.random,
): string {
  const choices = lines.length > 1 ? lines.filter((line) => line !== previous) : lines;
  return choices[Math.floor(random() * choices.length) % choices.length];
}

/** Whether she may chat at `now`: long enough since her last line and the step's instruction. */
export function canChatter(chef: Chef, now: number): boolean {
  return now - chef.lastChatter >= CHATTER_GAP && now - chef.lastInstruction >= INSTRUCTION_QUIET;
}

/** How she reacts to an event: her mood (if it changes), and what she might say. */
export function reactionFor(
  chef: Chef,
  event: ChefEvent,
): { mood: BunnyMood | null; lines: readonly string[]; chance: number } {
  if (event.kind === 'not yet') {
    return { mood: 'encourage', lines: LINES.notYet, chance: CHANCE.notYet };
  }
  if (event.kind === 'peek') return { mood: null, lines: LINES.peek, chance: CHANCE.peek };
  if (event.grade === 'Perfect!' && isMilestone(event.combo) && event.combo !== chef.partyCombo) {
    return { mood: 'party', lines: partyLines(event.combo), chance: CHANCE.party };
  }
  if (event.grade === 'Perfect!' || event.grade === 'Great!') {
    return { mood: 'cheer', lines: LINES.cheer, chance: CHANCE.cheer };
  }
  if (event.grade === 'Good!') return { mood: 'nod', lines: LINES.nod, chance: CHANCE.nod };
  return { mood: 'encourage', lines: LINES.encourage, chance: CHANCE.encourage };
}

/**
 * Chef Bunny reacts to `event` at `now`: sets her mood, and returns a line to
 * say out loud, or null to stay quiet. `open` is whether talking is allowed
 * at all right now (the step is taking input, and the voice isn't busy).
 * A party isn't cut short by a smaller cheer.
 */
export function react(
  chef: Chef,
  event: ChefEvent,
  now: number,
  open: boolean,
  random: () => number = Math.random,
): string | null {
  const { mood, lines, chance } = reactionFor(chef, event);
  if (event.kind === 'hit') {
    if (mood === 'party') chef.partyCombo = event.combo;
    else if (event.grade !== 'Perfect!') chef.partyCombo = 0;
  }
  const partying = chef.mood === 'party' && chef.moodAge < MOOD_TIME.party;
  if (mood && !(partying && mood !== 'party')) {
    chef.mood = mood;
    chef.moodAge = 0;
  }
  if (!open || !canChatter(chef, now) || random() >= chance) return null;
  const line = pickLine(lines, chef.lastLine, random);
  chef.lastLine = line;
  chef.lastChatter = now;
  return line;
}

/** A step's instruction is being read out at `now`: she keeps quiet for a while. */
export function instructionStarted(chef: Chef, now: number): void {
  chef.lastInstruction = now;
}

/**
 * Advances her by `dt` seconds: moods wear off, she blinks (sometimes twice),
 * flicks an ear and now and then glances about, and leans in while you hold.
 */
export function tickChef(
  chef: Chef,
  dt: number,
  holding: boolean,
  random: () => number = Math.random,
): void {
  chef.moodAge += dt;
  if (chef.mood !== 'idle' && chef.moodAge >= MOOD_TIME[chef.mood]) chef.mood = 'idle';
  chef.holding = holding;
  chef.lean += ((holding ? 1 : 0) - chef.lean) * Math.min(1, dt * 5);

  const idle = chef.idle;
  idle.blinkAge += dt;
  idle.earAge += dt;
  idle.glanceAge += dt;
  idle.blinkIn -= dt;
  if (idle.blinkIn <= 0) {
    idle.blinkAge = 0;
    if (idle.blinksLeft > 0) {
      idle.blinksLeft -= 1;
      idle.blinkIn = between(random, 2.2, 5);
    } else if (random() < 0.25) {
      // A quick double blink.
      idle.blinksLeft = 1;
      idle.blinkIn = 0.28;
    } else {
      idle.blinkIn = between(random, 2.2, 5);
    }
  }
  idle.earIn -= dt;
  if (idle.earIn <= 0) {
    idle.earAge = 0;
    idle.earSide = random() < 0.5 ? -1 : 1;
    idle.earIn = between(random, 3.5, 8);
  }
  idle.glanceIn -= dt;
  if (idle.glanceIn <= 0) {
    idle.glanceAge = 0;
    idle.glanceIn = between(random, 6, 11);
  }
}

/** Whether her eyes are shut for a blink right now. */
export function blinking(chef: Chef): boolean {
  return chef.idle.blinkAge < BLINK_TIME;
}

/** How far an ear is flicked right now, 0 to 1, and which one. */
export function earFlick(chef: Chef): { side: -1 | 1; amount: number } {
  const age = chef.idle.earAge;
  const amount =
    age < EAR_TIME ? Math.sin((age / EAR_TIME) * Math.PI * 2) * (1 - age / EAR_TIME) : 0;
  return { side: chef.idle.earSide, amount };
}

/** Whether she's glancing out at you right now, rather than at the cooking. */
export function glancing(chef: Chef): boolean {
  return chef.idle.glanceAge < GLANCE_TIME;
}

/**
 * Where her pupils move, from her eyes at `from` toward `to`: up to `reach`
 * units, less when it's close.
 */
export function gaze(
  from: { x: number; y: number },
  to: { x: number; y: number },
  reach: number,
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1e-6) return { x: 0, y: 0 };
  const scale = (reach * Math.min(1, distance / 150)) / distance;
  return { x: dx * scale, y: dy * scale };
}

/**
 * Whether a step's state is being held: hold-style steps (pouring, shaking,
 * baking, blending, scooping, grating, tossing) keep a `holding` flag.
 */
export function isHolding(state: unknown): boolean {
  return (
    typeof state === 'object' && state !== null && (state as { holding?: unknown }).holding === true
  );
}
