import {
  plainPlan,
  startTime,
  type Activity,
  type Dish,
  type LearnSettings,
  type RoundPlan,
} from '../kit';

/**
 * Every learning activity: each file in this folder whose default export is
 * an Activity. Vite finds them when it builds, so adding an activity never
 * touches this file. See "Learning" in the README.
 */
const found = import.meta.glob<Activity | undefined>(['./*.ts', '!./index.ts', '!./*.test.ts'], {
  eager: true,
  import: 'default',
});

export const ACTIVITIES: Activity[] = Object.keys(found)
  .sort()
  .map((path) => {
    const activity = found[path];
    if (!activity) throw new Error(`${path} needs a default export of its Activity`);
    const file = path.slice(2, -3);
    if (activity.id !== file) {
      throw new Error(`${path} exports an activity with id "${activity.id}", not "${file}"`);
    }
    return activity;
  });

/** The activity with this id. Throws for an id with no file. */
export function activityOf(id: string): Activity {
  const activity = ACTIVITIES.find((a) => a.id === id);
  if (!activity) throw new Error(`No activity "${id}" in activities/`);
  return activity;
}

/** The activities that fit a dish. */
export function activitiesFor(dish: Dish, from: readonly Activity[] = ACTIVITIES): Activity[] {
  return from.filter((a) => a.fits(dish));
}

/**
 * Plans a round: the kitchen clock's start time, and at most one learning
 * moment. None when learning is off or nothing fits the dish. Otherwise one
 * of the activities that fit, picked at random, but not `previous` (the last
 * round's) when another one fits too, so the same one doesn't come twice in
 * a row. `from` is for tests.
 */
export function planRound(
  dish: Dish,
  settings: LearnSettings,
  random: () => number,
  previous: string | null = null,
  from: readonly Activity[] = ACTIVITIES,
): RoundPlan {
  const start = startTime(settings.level, random);
  if (!settings.learning) return { ...plainPlan(dish, settings), start };
  const fits = activitiesFor(dish, from);
  const fresh = fits.length > 1 ? fits.filter((a) => a.id !== previous) : fits;
  if (!fresh.length) return { ...plainPlan(dish, settings), start };
  const activity = fresh[Math.floor(random() * fresh.length) % fresh.length];
  const steps = activity.weave({ dish, level: settings.level, random, start });
  return { steps, activity: activity.id, settings, start };
}
