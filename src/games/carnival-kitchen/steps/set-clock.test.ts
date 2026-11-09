import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, maxScore, move, press, release, tick, totalScore } from '../game';
import {
  QUIZ_OUTRO,
  SMART_BONUS,
  clockText,
  currentTurn,
  plainPlan,
  type AnswerFx,
  type KitchenState,
} from '../kit';
import type { Sound } from '../sound';
import { current, drawRound, nextStep, playThrough, quietEffects, seeded } from '../test-kit';
import setClock, {
  CHECK,
  SET_CLOCK,
  glowingHand,
  grabHand,
  handOff,
  type SetClockOptions,
  type SetClockState,
} from './set-clock';

const at = (h: number, m: number) => h * 60 + m;

/** Soup with "Set the clock to 4:30!" first, on it. */
function onClock(geared: boolean, target = at(16, 30)): KitchenState {
  const soup = dishById('soup');
  const step: SetClockOptions = {
    kind: 'set-clock',
    text: `Set the clock to ${clockText(target)}!`,
    target,
    geared,
    help: "Look! It's four thirty!",
  };
  const dish = { ...soup, steps: [step, ...soup.steps] };
  const state = createState(dish, seeded(), plainPlan(dish));
  nextStep(state);
  return state;
}

/** A point on the clock at `minute` (0 to 60) round the face, `reach` of the way out. */
function onFace(minute: number, reach: number) {
  const a = (minute / 60) * Math.PI * 2;
  return {
    x: SET_CLOCK.x + Math.sin(a) * SET_CLOCK.r * reach,
    y: SET_CLOCK.y - Math.cos(a) * SET_CLOCK.r * reach,
  };
}

/** Drags a hand from its knob round to `minute` on the face, a little at a time. */
function drag(state: KitchenState, hand: 'hour' | 'minute', from: number, to: number) {
  const reach = hand === 'minute' ? 0.74 : 0.45;
  const start = onFace(from, reach);
  press(state, start.x, start.y);
  const step = to >= from ? 1 : -1;
  for (let m = from; m !== to + step; m += step) {
    const p = onFace(m, reach);
    move(state, p.x, p.y);
  }
  release(state);
}

const check = (state: KitchenState) => press(state, CHECK.x + CHECK.w / 2, CHECK.y + CHECK.h / 2);

describe('set the clock', () => {
  it('grabs the hand nearer the touch, the outer face for the minute hand', () => {
    const noon = at(12, 0);
    const three = at(15, 0);
    expect(grabHand(three, onFace(0, 0.8).x, onFace(0, 0.8).y)).toBe('minute');
    expect(grabHand(three, onFace(15, 0.4).x, onFace(15, 0.4).y)).toBe('hour');
    expect(grabHand(three, onFace(15, 0.9).x, onFace(15, 0.9).y)).toBe('hour');
    // Both hands up: the outer part is the minute hand's.
    expect(grabHand(noon, onFace(0, 0.9).x, onFace(0, 0.9).y)).toBe('minute');
    expect(grabHand(noon, onFace(0, 0.3).x, onFace(0, 0.3).y)).toBe('hour');
    // Nowhere near either hand: by how far out.
    expect(grabHand(three, onFace(40, 0.9).x, onFace(40, 0.9).y)).toBe('minute');
    expect(grabHand(three, 0, 0)).toBeNull();
  });

  it('says which hand is off', () => {
    expect(handOff(at(16, 30), at(4, 30))).toBeNull();
    expect(handOff(at(16, 0), at(16, 30))).toBe('minute');
    expect(handOff(at(15, 30), at(16, 30))).toBe('hour');
    expect(handOff(at(12, 0), at(16, 30))).toBe('both');
  });

  it('turns the hour hand along with the minute hand at Level 1 (geared)', () => {
    const state = onClock(true);
    // From 12:00, four and a half turns of the minute hand make 4:30.
    let minute = 0;
    for (let turn = 0; turn < 9; turn++) {
      drag(state, 'minute', minute, minute + 30);
      minute = (minute + 30) % 60;
    }
    expect(clockText(current<SetClockState>(state).time)).toBe('4:30');
    check(state);
    expect(current<SetClockState>(state).done).toBe(true);
    expect(state.bonus).toBe(SMART_BONUS);
    tick(state, QUIZ_OUTRO);
    expect(state.stepIndex).toBe(1);
    expect(maxScore(state)).toBe(300);
  });

  it('sets each hand on its own at Level 2', () => {
    const state = onClock(false, at(16, 45));
    drag(state, 'minute', 0, 45);
    // Past the 12 and on: the hour doesn't move without its hand.
    expect(clockText(current<SetClockState>(state).time)).toBe('12:45');
    // At a quarter to 5 the hour hand is almost at the 5: pointing it at
    // the 4 makes a quarter to 4.
    drag(state, 'hour', 0, 20);
    expect(clockText(current<SetClockState>(state).time)).toBe('3:45');
    drag(state, 'hour', 20, 24);
    expect(clockText(current<SetClockState>(state).time)).toBe('4:45');
    check(state);
    expect(current<SetClockState>(state).outcome).toBe('right');
  });

  it('gives a hint about the hand that is off, and shows it after two tries', () => {
    const state = onClock(false);
    const s = current<SetClockState>(state);
    drag(state, 'minute', 0, 30);
    check(state);
    expect(s.off).toBe('hour');
    expect(setClock.bubble?.({ round: state, options: currentOptions(state), state: s })).toEqual([
      'The short hand',
      'shows the hour!',
    ]);
    expect(s.done).toBe(false);
    check(state);
    expect(s.shown).toBe(true);
    expect(clockText(s.time)).toBe('4:30');
    // The hands stay put now; Check! carries on, without the bonus.
    drag(state, 'minute', 30, 10);
    expect(clockText(s.time)).toBe('4:30');
    check(state);
    expect(s.outcome).toBe('helped');
    expect(state.bonus).toBe(0);
    tick(state, QUIZ_OUTRO);
    expect(state.stepIndex).toBe(1);
    expect(totalScore(state)).toBe(0);
  });

  it('says which hand is off at every wrong check, the show too, and makes it glow', () => {
    const state = onClock(false);
    const s = current<SetClockState>(state);
    const said: string[] = [];
    const sound = new Proxy({} as Sound, {
      get: (_target, prop) =>
        prop === 'say'
          ? (text: string) => said.push(text)
          : prop === 'read'
            ? () => ({ count: 0, word: () => -1, done: () => true })
            : prop === 'muted'
              ? false
              : () => undefined,
    });
    const effects = { ...quietEffects(), sound };
    const fx = setClock.fx?.() as AnswerFx;
    const observe = () =>
      setClock.observe?.({
        ...currentTurn(state),
        g: null as never,
        t: 0,
        dt: 1 / 60,
        pointer: { x: 0, y: 0, down: false },
        taking: true,
        fx,
        fxOf: () => undefined,
        effects,
      } as never);
    drag(state, 'minute', 0, 30);
    expect(glowingHand(s, 0)).toBeNull();
    check(state);
    observe();
    expect(said.at(-1)).toBe('Not quite! The short hand shows the hour. Try again!');
    expect(glowingHand(s, 0)).toBe('hour');
    check(state);
    observe();
    expect(s.shown).toBe(true);
    expect(said.at(-1)).toBe("Not quite! The short hand shows the hour. Look! It's four thirty!");
    expect(glowingHand(s, 0)).toBe('hour');
  });

  it('plays through and draws in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = onClock(true);
      const memory = new Map();
      drag(state, 'minute', 0, 20);
      drawRound(state, memory, 1 / 60, shape);
      check(state);
      check(state);
      for (let i = 0; i < 30; i++) drawRound(state, memory, 1 / 60, shape);
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      expect(state.phase).toBe('over');
    }
  });
});

function currentOptions(state: KitchenState): SetClockOptions {
  return state.steps[state.stepIndex].options as SetClockOptions;
}
