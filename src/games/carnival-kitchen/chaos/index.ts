import type { KitchenState, StepRun } from '../kit';
import type { Shape } from '../layout';
import { stepOf } from '../steps';
import {
  activeChaos,
  moveChaos,
  planChaos,
  pressChaos,
  releaseChaos,
  settleChaos,
  tickChaos,
  type Chaos,
} from './rules';

/**
 * Every kitchen surprise: each file in this folder whose default export is a
 * `Chaos` (rules.ts has the shape and the rules). Vite finds them when it
 * builds, so adding one never touches this file. See "Kitchen surprises" in
 * the README.
 *
 * The rest of this file is what game.ts calls: the round's surprise, looked
 * up by its id, with the step registry's idea of a learning step.
 */
const found = import.meta.glob<Chaos | undefined>(
  ['./*.ts', '!./index.ts', '!./rules.ts', '!./show.ts', '!./*.test.ts'],
  { eager: true, import: 'default' },
);

export const CHAOS: Chaos[] = Object.keys(found)
  .sort()
  .map((path) => {
    const chaos = found[path];
    if (!chaos) throw new Error(`${path} needs a default export of its Chaos`);
    const file = path.slice(2, -3);
    if (chaos.id !== file) {
      throw new Error(`${path} exports a surprise with id "${chaos.id}", not "${file}"`);
    }
    return chaos;
  });

/** The surprise with this id. Throws for an id with no file. */
export function chaosOf(id: string): Chaos {
  const chaos = CHAOS.find((c) => c.id === id);
  if (!chaos) throw new Error(`No surprise "${id}" in chaos/`);
  return chaos;
}

/** Learning steps (a ticket, a question) never get a surprise. */
const learning = (run: StepRun) => !!stepOf(run.kind).learning;

/** The round's surprise's event, or null. */
function eventOf(round: KitchenState): Chaos | null {
  return round.chaos ? chaosOf(round.chaos.id) : null;
}

/**
 * Gives a new round its surprise, or none (see `planChaos`): `round` is how
 * many rounds this session came before it, `on` the grown-ups' "Surprises".
 */
export function planSurprise(
  state: KitchenState,
  random: () => number,
  { round, on }: { round: number; on: boolean },
): void {
  state.chaos = planChaos(state.steps, CHAOS, random, { round, on, learning });
}

/** Advances the surprise. Returns whether cooking waits this frame. */
export function tickSurprise(state: KitchenState, dt: number): boolean {
  return tickChaos(state, eventOf(state), dt, learning);
}

/** After the step had its go: a surprise that lets cooking go on ends with its step. */
export function settleSurprise(state: KitchenState): void {
  settleChaos(state, eventOf(state));
}

/** A press on the cooking. Returns whether the surprise took it. */
export function pressSurprise(state: KitchenState, x: number, y: number, shape?: Shape): boolean {
  return pressChaos(state, eventOf(state), x, y, shape);
}

/** The pointer moving, held or not. Returns whether the surprise took it. */
export function moveSurprise(state: KitchenState, x: number, y: number, shape?: Shape): boolean {
  return moveChaos(state, eventOf(state), x, y, shape);
}

/** Letting go. Returns whether the surprise took it. */
export function releaseSurprise(state: KitchenState): boolean {
  return releaseChaos(state, eventOf(state));
}

/** Chef Bunny's two lines while a surprise is on, or null. */
export function surpriseBubble(state: KitchenState): [string, string] | null {
  const run = activeChaos(state);
  return run ? chaosOf(run.id).bubble(run.state) : null;
}
