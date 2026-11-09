import { titleOf } from '../steps';
import {
  clockHour,
  clockText,
  pick,
  quarterWords,
  sayTime,
  shuffle,
  stepMinutes,
  timeAtStep,
  type Activity,
  type Level,
  type Question,
  type RecipeStep,
  type StepBasics,
} from '../kit';
import type { ReadClockOptions } from '../steps/read-clock';
import type { SetClockOptions } from '../steps/set-clock';

/**
 * Clock time (telling the time on an analog clock), with the kitchen clock's
 * real time in the round. One of three, by level:
 *
 * - **Read it**: "Stirring took 10 minutes. What time is it now?" A big clock
 *   shows the kitchen time, with three times to pick from. The wrong ones are
 *   the classic slips: the hands read the wrong way round, and the hour the
 *   hour hand is nearest to (5:45 for 4:45). At Level 1 the answers are
 *   sometimes words: "half past 4", "quarter to 5".
 * - **Set it**: "Stirring will be done at 4:15. Set the clock to 4:15!" She
 *   drags the hands (geared at Level 1, each on its own at Level 2), then
 *   cooks the step and watches the kitchen clock get there.
 * - **When will it be done?** (Level 2): "Baking takes 15 minutes. It's 3:10
 *   now. When will it be done?" Right before the step (the bake if there is
 *   one), so the kitchen clock then really sweeps those minutes.
 *
 * Level 1 only uses times on the hour, half and quarter; Level 2 any 5
 * minutes. Every dish fits, and it's weighted to come up often.
 */

export type ClockKind = 'read' | 'set' | 'elapsed';

/** What each step is called in a sentence: "Stirring took 10 minutes." */
const DOING: Record<string, string> = {
  chop: 'Chopping',
  crack: 'Cracking the eggs',
  pour: 'Pouring',
  mix: 'Mixing',
  stir: 'Stirring',
  season: 'Shaking',
  sauce: 'Spreading',
  top: 'Adding the toppings',
  bake: 'Baking',
  flip: 'Flipping',
  grate: 'Grating',
  toss: 'Tossing',
  blend: 'Blending',
  scoop: 'Scooping',
  stack: 'Stacking',
  roll: 'Rolling',
};

/** "Stirring", or "Cooking" for a step this doesn't know. */
export function doing(step: StepBasics): string {
  return DOING[step.kind] ?? 'Cooking';
}

const minutesText = (m: number) => `${m} ${m === 1 ? 'minute' : 'minutes'}`;

/** A time a level asks about: on the hour, half or quarter at Level 1; any 5 minutes at Level 2. */
export function fitsLevel(time: number, level: Level): boolean {
  return time % (level === 1 ? 15 : 5) === 0;
}

/** An afternoon time with this clock hour (1 to 12) and minute. */
const afternoon = (hour: number, minute: number) => ((hour % 12) + 12) * 60 + minute;

/**
 * The hands read the wrong way round: the minute hand's number as the hour,
 * and the hour hand's number as the minutes (4:30 read as 6:20).
 */
export function swappedHands(time: number): number {
  const minute = ((time % 60) + 60) % 60;
  return afternoon(minute / 5 || 12, (clockHour(time) * 5) % 60);
}

/**
 * Three times to pick from for a clock showing `time`: it and two classic
 * slips, shuffled. `words` writes them as "half past 4" (for times on the
 * quarter); otherwise "4:30".
 */
export function timeChoices(
  time: number,
  level: Level,
  words: boolean,
  random: () => number,
): { choices: string[]; index: number } {
  const minute = ((time % 60) + 60) % 60;
  const text = (t: number) => (words ? (quarterWords(t) ?? clockText(t)) : clockText(t));
  // The hour hand is nearer the next number from half past: reading that one.
  const nearHour = minute >= 30 ? time + 60 : time - 60;
  const slips = words
    ? [
        // Past and to mixed up, and the hour the hour hand has just passed.
        minute === 45
          ? time - 60
          : minute === 30
            ? time + 60
            : minute === 15
              ? time - 30
              : time + 60,
        minute === 45
          ? time - 30
          : minute === 30
            ? time - 30
            : minute === 15
              ? time + 30
              : time + 30,
        time - 60,
        time + 60,
      ]
    : [
        swappedHands(time),
        nearHour,
        time + (level === 1 ? 15 : 5),
        time - (level === 1 ? 15 : 5),
        time + 60,
      ];
  const answer = text(time);
  const picked: string[] = [];
  for (const slip of slips) {
    const t = text(slip);
    if (t !== answer && !picked.includes(t) && picked.length < 2) picked.push(t);
  }
  const choices = shuffle([answer, ...picked], random);
  return { choices, index: choices.indexOf(answer) };
}

/** Where the hands point at `time`, said out loud: "The short hand is just past the 4..." */
export function handsHelp(time: number): string {
  const minute = ((time % 60) + 60) % 60;
  const hour = clockHour(time);
  const next = clockHour(time + 60);
  const short =
    minute === 0
      ? `The short hand points at the ${hour}`
      : minute < 20
        ? `The short hand is just past the ${hour}`
        : minute === 30
          ? `The short hand is halfway between the ${hour} and the ${next}`
          : minute <= 40
            ? `The short hand is between the ${hour} and the ${next}`
            : `The short hand is almost at the ${next}`;
  const long =
    minute === 0
      ? 'the long hand points straight up at the 12'
      : `the long hand points at the ${minute / 5}: that's ${minute} minutes`;
  const words = quarterWords(time, true);
  return `${short}, and ${long}. It's ${sayTime(time)}${words && minute ? `, ${words}` : ''}!`;
}

/** "What time is it now?" at step `index` of `steps` (before it; after the last step at the end). */
export function readStep(
  steps: readonly RecipeStep[],
  index: number,
  time: number,
  level: Level,
  random: () => number,
): ReadClockOptions {
  const words = level === 1 && quarterWords(time) !== null && random() < 0.5;
  const { choices, index: answer } = timeChoices(time, level, words, random);
  const before = steps[index - 1] as StepBasics | undefined;
  const took = before && stepMinutes(before);
  const lead = !before
    ? "Let's start cooking!"
    : took
      ? `${doing(before)} took ${minutesText(took)}.`
      : 'Look at the clock!';
  const question: Question = {
    text: `${lead} What time is it now?`,
    choices,
    answer,
    hint: ['Short hand: the hour.', 'Long hand: the minutes.'],
    help: handsHelp(time),
  };
  return { kind: 'read-clock', question, time, title: 'What time is it?', icon: '🕒' };
}

/**
 * Where the hands start for setting `target`: at Level 1 on the hour before
 * it (4:00 for 4:30, 3:00 for 4:00), so the minute hand turns the hour
 * hand the last little way; at Level 2 at 12:00, both hands to set.
 */
export function setFrom(target: number, level: Level): number | undefined {
  if (level === 2) return undefined;
  const minute = ((target % 60) + 60) % 60;
  return minute === 0 ? target - 60 : target - minute;
}

/** "Set the clock to 4:15!": the time step `index` will be done, or the start if `index` is null. */
export function setStep(
  steps: readonly RecipeStep[],
  index: number | null,
  start: number,
  level: Level,
  random: () => number,
): SetClockOptions {
  const target = index === null ? start : timeAtStep(steps, start, index + 1);
  const shown =
    level === 1 && random() < 0.5 ? (quarterWords(target) ?? clockText(target)) : clockText(target);
  const lead =
    index === null
      ? `We start cooking at ${clockText(target)}.`
      : `${doing(steps[index])} will be done at ${clockText(target)}.`;
  return {
    kind: 'set-clock',
    text: `${lead} Set the clock to ${shown}!`,
    target,
    geared: level === 1,
    help: `Look! ${handsHelp(target)}`,
    ...(level === 1 ? { from: setFrom(target, level) } : {}),
    title: 'Set the clock!',
    icon: '⏰',
  };
}

/**
 * "Next: Bake the pizza! That takes 15 minutes. It's 3:10 now. When will it
 * be done?", before step `index`. The choices are shuffled.
 */
export function elapsedStep(
  steps: readonly RecipeStep[],
  index: number,
  now: number,
  random: () => number,
): ReadClockOptions {
  const minutes = stepMinutes(steps[index]);
  const done = now + minutes;
  const slips = [done - 5, done + 5, done + 10, done - 10, now + 60].filter(
    (t) => t > now && t !== done,
  );
  const picked: number[] = [];
  while (picked.length < 2 && slips.length) {
    picked.push(slips.splice(Math.floor(random() * slips.length) % slips.length, 1)[0]);
  }
  const times = shuffle([done, ...picked], random);
  const counting: string[] = [];
  for (let t = now + 5; t <= done; t += 5) counting.push(sayTime(t));
  return {
    kind: 'read-clock',
    question: {
      text: `Next: ${titleOf({ kind: steps[index].kind, options: steps[index], state: null })} That takes ${minutesText(minutes)}. It's ${clockText(now)} now. When will it be done?`,
      choices: times.map(clockText),
      answer: times.indexOf(done),
      hint: ['Count on by fives', 'round the clock!'],
      shownLines: ['It will be done', `at ${clockText(done)}!`],
      help: `Start at ${sayTime(now)} and count on by fives: ${counting.join(', ')}. Done at ${sayTime(done)}!`,
    },
    time: now,
    span: minutes,
    title: 'When will it be done?',
    icon: '⏳',
  };
}

/**
 * Steps with step `index` starting on a 5 at Level 2: the step before it
 * (if it takes any minutes) takes a little longer, up to the next 5, so a
 * bake after a 3-minute sauce can still start at 3:10, not 3:13. New
 * objects; the dish's own steps are left alone. Null if it can't.
 */
export function startingOnFive(
  steps: readonly RecipeStep[],
  start: number,
  index: number,
): RecipeStep[] | null {
  const late = timeAtStep(steps, start, index) % 5;
  if (late === 0) return [...steps];
  const before = steps[index - 1] as RecipeStep | undefined;
  if (!before || stepMinutes(before) === 0) return null;
  const longer = { ...before, minutes: stepMinutes(before) + 5 - late };
  return steps.map((s, i) => (i === index - 1 ? longer : s));
}

/**
 * Where the clock question goes, and what it is: `at` is where it's
 * inserted in `steps` (the dish's, or for a "when will it be done?" the
 * dish's with the step before a little longer: see `startingOnFive`). Rolls
 * the kind by level (a "when will it be done?" only at Level 2, before a
 * step of 5 minutes or more, the bake if there is one), then a place where
 * the kitchen time suits the level.
 */
export function planClock(
  dishSteps: readonly RecipeStep[],
  level: Level,
  start: number,
  random: () => number,
): { kind: ClockKind; at: number; step: RecipeStep; steps: RecipeStep[] } {
  const steps = [...dishSteps];
  const time = (i: number) => timeAtStep(steps, start, i);
  const indices = Array.from({ length: steps.length }, (_, i) => i);
  const elapsed = indices.filter((i) => {
    const m = stepMinutes(steps[i]);
    return m >= 5 && m % 5 === 0 && startingOnFive(steps, start, i) !== null;
  });
  const bakes = elapsed.filter((i) => steps[i].kind === 'bake');
  const kinds: ClockKind[] =
    level === 2 && elapsed.length ? ['read', 'set', 'elapsed', 'elapsed'] : ['read', 'set'];
  const kind = pick(kinds, random);
  if (kind === 'elapsed') {
    const i = bakes.length ? pick(bakes, random) : pick(elapsed, random);
    const timed = startingOnFive(steps, start, i) ?? steps;
    const step = elapsedStep(timed, i, timeAtStep(timed, start, i), random);
    return { kind, at: i, step, steps: timed };
  }
  if (kind === 'set') {
    // The time a step will be done, so she watches the kitchen clock get there.
    const ahead = indices.filter((i) => stepMinutes(steps[i]) > 0 && fitsLevel(time(i + 1), level));
    if (ahead.length) {
      const i = pick(ahead, random);
      return { kind, at: i, step: setStep(steps, i, start, level, random), steps };
    }
    return { kind, at: 0, step: setStep(steps, null, start, level, random), steps };
  }
  // After a step if the time suits the level, else at the start (which always does).
  const after = indices.map((i) => i + 1).filter((i) => fitsLevel(time(i), level));
  const at = after.length ? pick(after, random) : 0;
  return { kind, at, step: readStep(steps, at, time(at), level, random), steps };
}

const clockTime: Activity = {
  id: 'clock-time',
  name: 'Clock time',
  skills: ['time'],
  // Telling the time is the one to practise most: it comes up three times as often.
  weight: 3,
  fits: () => true,

  weave({ dish, level, random, start }) {
    const { at, step, steps } = planClock(dish.steps, level, start, random);
    return [...steps.slice(0, at), step, ...steps.slice(at)];
  },
};

export default clockTime;
