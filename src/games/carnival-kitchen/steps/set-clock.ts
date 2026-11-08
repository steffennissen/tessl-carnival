import {
  C,
  CONFETTI,
  circle,
  clamp01,
  easeOutBack,
  emoji,
  fillStroke,
  rounded,
  stickerText,
  vertical,
} from '../art';
import type { Shape } from '../layout';
import {
  QUIZ_OUTRO,
  SMART_BONUS,
  angleAt,
  answer,
  autoReadDelay,
  clockText,
  drawClock,
  drawQuestion,
  finishStep,
  handAngles,
  inCircle,
  middleOf,
  quizPlaces,
  sameClockTime,
  sayTime,
  startAnswer,
  turnMinuteHand,
  withHourHand,
  withMinuteHand,
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
 * Set the clock: "Set the clock to 4:30!" A big clock starts at 12:00; she
 * drags its hands (any touch on the face grabs the nearer hand, and the
 * minute hand snaps to the 5-minute marks), then taps Check!. With `geared`
 * (Level 1) the hour hand turns along with the minute hand, as on a real
 * clock; without it (Level 2) each hand is set on its own.
 *
 * The shared answer rules: a wrong check gets a hint about the hand that's
 * off and another go; after two, Chef Bunny turns the hands to the time and
 * Check! carries on. A learning step: no part of the cooking score.
 */

export interface SetClockOptions extends StepBasics {
  kind: 'set-clock';
  /** What she reads, and the voice reads out: "Set the clock to 4:30!" */
  text: string;
  /** The time to set (minutes since midnight); am or pm doesn't matter on a clock. */
  target: number;
  /** The hour hand turns with the minute hand, like a real clock (Level 1). */
  geared: boolean;
  /** What Chef Bunny says when she shows it. */
  help: string;
  /** Where the hands start: 12:00 if left out. */
  from?: number;
}

declare module '../kit/types' {
  interface StepKinds {
    'set-clock': SetClockOptions;
  }
}

/** The big clock and the Check! button on a computer, in scene units. */
export const SET_CLOCK: Disc = { x: 340, y: 354, r: 104 };
export const CHECK: Box = { x: 482, y: 296, w: 200, h: 104 };

/** Where the question, its speaker, the clock and Check! go. */
export interface SetClockPlaces {
  bubble: Box;
  speaker: Disc;
  clock: Disc;
  check: Box;
}

/**
 * Where everything goes for the canvas's shape, clear of Chef Bunny, the
 * HUD and the progress pill. On a computer, the quiz's bubble with the clock
 * under it and Check! beside. On a phone held sideways the clock fills the
 * room at the right, under the bubble, and Check! is at the left. Held
 * upright the clock is as big as the screen's width allows, at the left,
 * from the top, with the question and Check! stacked beside it.
 */
export function setClockPlaces(shape: Shape = 'page'): SetClockPlaces {
  if (shape === 'tall') {
    return {
      bubble: { x: 466, y: 100, w: 224, h: 300 },
      speaker: { x: 578, y: 154, r: 47 },
      clock: { x: 286, y: 276, r: 170 },
      check: { x: 466, y: 410, w: 224, h: 134 },
    };
  }
  const { bubble, speaker } = quizPlaces(shape);
  if (shape === 'wide') {
    return {
      bubble,
      speaker,
      clock: { x: 672, y: 362, r: 114 },
      check: { x: 250, y: 290, w: 240, h: 120 },
    };
  }
  return { bubble, speaker, clock: SET_CLOCK, check: CHECK };
}

/** The knobs on the hands' ends, to grab: where they are, and how big, on `clock`. */
export function knobsOf(clock: Disc, time: number) {
  const hands = handAngles(time);
  const at = (angle: number, length: number) => ({
    x: clock.x + Math.sin(angle) * length,
    y: clock.y - Math.cos(angle) * length,
  });
  return {
    hour: { ...at(hands.hour, clock.r * 0.45), r: clock.r * 0.145 },
    minute: { ...at(hands.minute, clock.r * 0.74), r: clock.r * 0.125 },
  };
}

/** Which hand a touch is off: for the hint. */
export type HandOff = 'hour' | 'minute' | 'both';

export interface SetClockState extends AnswerState {
  /** What the clock shows now. */
  time: number;
  /** The hand being dragged. */
  holding: 'hour' | 'minute' | null;
  /** Whether she has moved a hand yet (the pointing finger goes away). */
  moved: boolean;
  /** Which hand was off at the last wrong check. */
  off: HandOff | null;
  /** Checked right. */
  done: boolean;
  reads: number;
  age: number;
  after: number;
}

export function startSetClock(o: SetClockOptions): SetClockState {
  return {
    ...startAnswer(),
    time: o.from ?? 12 * 60,
    holding: null,
    moved: false,
    off: null,
    done: false,
    reads: 0,
    age: 0,
    after: 0,
  };
}

/** How far apart two angles are, 0 to π. */
function apart(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/**
 * The hand a touch at (x, y) grabs, or null off the clock. On or near a
 * hand's knob, that hand (the nearer knob, if both); near a hand's line,
 * that hand (both near: the outer part of the face is the minute hand's);
 * anywhere else on the face, the outer ring is the minute hand's and the
 * middle the hour hand's.
 */
export function grabHand(
  time: number,
  x: number,
  y: number,
  clock: Disc = SET_CLOCK,
): 'hour' | 'minute' | null {
  const { x: cx, y: cy, r } = clock;
  const d = Math.hypot(x - cx, y - cy);
  if (d > r * 1.25) return null;
  const knobs = knobsOf(clock, time);
  const toHour = Math.hypot(x - knobs.hour.x, y - knobs.hour.y);
  const toMinute = Math.hypot(x - knobs.minute.x, y - knobs.minute.y);
  if (Math.min(toHour, toMinute) <= r * 0.35) return toHour < toMinute ? 'hour' : 'minute';
  const angle = angleAt(cx, cy, x, y);
  const hands = handAngles(time);
  const nearHour = apart(angle, hands.hour) < 0.45;
  const nearMinute = apart(angle, hands.minute) < 0.45;
  if (nearHour !== nearMinute) return nearHour ? 'hour' : 'minute';
  return d >= r * 0.6 ? 'minute' : 'hour';
}

/** Which hand is off from the target, or null if the clock shows it. */
export function handOff(time: number, target: number): HandOff | null {
  if (sameClockTime(time, target)) return null;
  const minuteOff = ((time % 60) + 60) % 60 !== ((target % 60) + 60) % 60;
  const hourOff = !sameClockTime(time - (time % 60), target - (target % 60));
  if (minuteOff && hourOff) return 'both';
  return minuteOff ? 'minute' : 'hour';
}

const inBox = (b: Box, x: number, y: number) =>
  x >= b.x - 8 && x <= b.x + b.w + 8 && y >= b.y - 8 && y <= b.y + b.h + 8;

/** Turns the held hand to point at (x, y). */
function turnHand(turn: Turn<SetClockOptions, SetClockState>, x: number, y: number) {
  const s = turn.state;
  if (!s.holding) return;
  const { clock } = setClockPlaces(turn.shape);
  const angle = angleAt(clock.x, clock.y, x, y);
  if (s.holding === 'hour') s.time = withHourHand(s.time, angle);
  else s.time = turn.options.geared ? turnMinuteHand(s.time, angle) : withMinuteHand(s.time, angle);
  s.moved = true;
}

export function pressSetClock(
  turn: Turn<SetClockOptions, SetClockState>,
  x: number,
  y: number,
): boolean {
  const s = turn.state;
  if (s.done) return true;
  const { speaker, clock, check } = setClockPlaces(turn.shape);
  if (inCircle(speaker.x, speaker.y, speaker.r, x, y)) {
    s.reads += 1;
    return true;
  }
  if (inBox(check, x, y)) {
    const off = handOff(s.time, turn.options.target);
    const result = answer(turn.round, s, off === null);
    if (result === 'right') s.done = true;
    else {
      s.off = off;
      // Chef Bunny shows it: the hands turn to the time, and Check! carries on.
      if (result === 'show') s.time = turn.options.target;
    }
    return true;
  }
  // Once she's been shown the time, the hands stay put.
  if (s.shown) return true;
  s.holding = grabHand(s.time, x, y, clock);
  turnHand(turn, x, y);
  return true;
}

interface SetClockFx {
  reading: Reading | null;
  reads: number;
  autoRead: boolean;
  wrong: number;
  shown: boolean;
  done: boolean;
  /** The time the hands show while sweeping round to the answer. */
  shownTime: number | null;
  /** The time last frame, for the ticks. */
  time: number | null;
}

const CHEER: Feedback = { grade: 'Perfect!', points: 0, combo: 0, age: 0 };
const ENCOURAGE: Feedback = { grade: 'Nice try!', points: 0, combo: 0, age: 0 };

const setClock: Step<SetClockOptions, SetClockState, SetClockFx> = {
  kind: 'set-clock',
  learning: true,
  uses: () => [],
  start: (o) => startSetClock(o),
  title: () => 'Set the clock!',
  hint: () => ['Drag the hands,', 'then tap Check!'],
  icon: () => '⏰',
  progress: ({ state }) => [1, state.done ? 1 : 0],
  press: (turn, x, y) => pressSetClock(turn, x, y),
  move: (turn, x, y) => turnHand(turn, x, y),
  release(turn) {
    turn.state.holding = null;
    return null;
  },
  update(turn, dt) {
    const s = turn.state;
    s.age += dt;
    if (!s.done) return;
    s.after += dt;
    if (s.after >= QUIZ_OUTRO) finishStep(turn.round, 0);
  },
  bubble({ state: s, options }) {
    const target = clockText(options.target);
    if (s.done)
      return s.outcome === 'right'
        ? ['Yes! You are', 'a Smart Chef!']
        : ['Yes, that is', `${target}!`];
    if (s.shown) return [`That's ${target}!`, 'Tap Check!'];
    if (s.off === 'minute') return ['The long hand', 'shows the minutes!'];
    if (s.off === 'hour') return ['The short hand', 'shows the hour!'];
    if (s.off === 'both') return ['Long hand: minutes.', 'Short hand: the hour.'];
    return null;
  },
  solve(turn) {
    turn.state.time = turn.options.target;
    const middle = middleOf(setClockPlaces(turn.shape).check);
    pressSetClock(turn, middle.x, middle.y);
    setClock.update?.(turn, QUIZ_OUTRO);
  },

  fx: () => ({
    reading: null,
    reads: 0,
    autoRead: false,
    wrong: 0,
    shown: false,
    done: false,
    shownTime: null,
    time: null,
  }),

  observe({ state: s, options, fx, effects, round, taking, dt, shape }) {
    const places = setClockPlaces(shape);
    const { sound } = effects;
    const settings = round.learn.settings;
    const delay = autoReadDelay(settings);
    if (taking && !fx.autoRead && delay !== null && s.age >= delay && !s.done) {
      fx.autoRead = true;
      fx.reading = sound.read(options.text);
    }
    if (s.reads > fx.reads) {
      fx.reads = s.reads;
      fx.autoRead = true;
      fx.reading = sound.read(options.text);
    }
    // A soft tick for every 5 minutes the hands are turned.
    if (fx.time !== null && fx.time !== s.time && !s.shown) sound.tick(1.3);
    fx.time = s.time;
    // The hands sweep round to the time when Chef Bunny shows it.
    if (fx.shownTime === null) fx.shownTime = s.time;
    if (s.shown) {
      const gap = s.time - fx.shownTime;
      fx.shownTime +=
        Math.sign(gap) * Math.min(Math.abs(gap), dt * Math.max(60, Math.abs(gap) * 2));
    } else fx.shownTime = s.time;
    const middle = middleOf(places.check);
    if (s.wrong > fx.wrong && !s.shown) {
      fx.wrong = s.wrong;
      sound.boop();
      effects.celebrate(middle.x, middle.y, ENCOURAGE);
      const tip =
        s.off === 'minute'
          ? 'The long hand shows the minutes.'
          : s.off === 'hour'
            ? 'The short hand shows the hour.'
            : 'The long hand shows the minutes, and the short hand shows the hour.';
      if (!settings.readMyself) sound.say(`Not quite! ${tip} Try again!`);
    }
    if (s.shown && !fx.shown) {
      fx.shown = true;
      sound.chime([1046.5, 1318.5], 0.12, 0.12);
      if (!settings.readMyself) sound.say(options.help);
    }
    if (s.done && !fx.done) {
      fx.done = true;
      sound.chime([1046.5, 1318.5, 1568, 2093], 0.07, 0.16);
      effects.burst(
        places.clock.x,
        places.clock.y,
        20,
        ['star', 'heart', 'star', 'dot'],
        CONFETTI,
        280,
      );
      effects.celebrate(middle.x, middle.y, CHEER);
      sound.say(`Yes! It's ${sayTime(options.target)}!`);
    }
  },

  draw({ g, t, state: s, options, fx, taking, shape }) {
    if (!taking && s.age === 0) return;
    const places = setClockPlaces(shape);
    const appear = easeOutBack(clamp01(s.age / 0.4));
    const mid = middleOf(places.bubble);
    g.save();
    g.translate(mid.x, mid.y);
    g.scale(appear, appear);
    g.translate(-mid.x, -mid.y);
    drawQuestion(g, options.text, places.bubble, places.speaker, fx.reading, t);
    g.restore();

    // The clock, with big knobs on the hands' ends to grab.
    const { x, y, r } = places.clock;
    const time = s.shown ? (fx.shownTime ?? s.time) : s.time;
    const pop = easeOutBack(clamp01((s.age - 0.1) / 0.4));
    g.save();
    g.translate(x, y);
    g.scale(pop, pop);
    g.translate(-x, -y);
    drawClock(g, x, y, r, time, { t, glow: s.holding ?? (s.shown ? 'minute' : null) });
    const knobs = knobsOf(places.clock, time);
    const knob = (at: Disc, color: string, held: boolean) => {
      circle(g, at.x, at.y, at.r * (held ? 1.25 : 1));
      fillStroke(g, color, 3.5);
      circle(g, at.x - at.r * 0.3, at.y - at.r * 0.3, at.r * 0.28);
      g.fillStyle = 'rgba(255, 255, 255, 0.7)';
      g.fill();
    };
    knob(knobs.hour, C.hotPink, s.holding === 'hour');
    knob(knobs.minute, C.purple, s.holding === 'minute');
    g.restore();
    if (taking && !s.moved && !s.shown) {
      const bob = Math.sin(t * 5) * 6;
      g.fillStyle = C.ink;
      emoji(g, '👆', x + 22 * (r / 104), y - r * 0.74 + 34 * (r / 104) + bob, 40 * (r / 104));
    }

    // Check!
    const glow = s.shown && !s.done;
    const press = s.done ? 1 + 0.1 * Math.sin(clamp01(s.after / 0.4) * Math.PI) : 1;
    const b = places.check;
    g.save();
    g.translate(b.x + b.w / 2, b.y + b.h / 2);
    const throb = glow ? 1 + Math.sin(t * 6) * 0.05 : press;
    g.scale(throb, throb);
    if (glow) {
      g.strokeStyle = C.gold;
      g.lineWidth = 7;
      rounded(g, -b.w / 2 - 7, -b.h / 2 - 7, b.w + 14, b.h + 14, 30);
      g.stroke();
    }
    rounded(g, -b.w / 2, -b.h / 2, b.w, b.h, 26);
    fillStroke(g, vertical(g, -b.h / 2, b.h / 2, [C.cabinetLight, C.mint]), 4);
    stickerText(g, 'Check! ✔', 0, 2, Math.min(44, b.h * 0.35), C.hotPink, 'center', b.w - 20);
    g.restore();
    if (s.done) {
      const up = easeOutBack(clamp01(s.after / 0.35));
      g.save();
      g.translate(b.x + b.w / 2, b.y - 20);
      g.scale(up, up);
      g.rotate(-0.08);
      stickerText(g, s.outcome === 'right' ? `Yes! +${SMART_BONUS}` : 'Yes!', 0, 0, 30, C.hotPink);
      g.restore();
    }
  },
};

export default setClock;
