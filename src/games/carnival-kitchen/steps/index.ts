import type { Step, StepRun } from '../kit';

/**
 * Every kind of step the kitchen knows: each file in this folder whose
 * default export is a Step. Vite finds them when it builds, so adding a step
 * never touches this file, and steps added at the same time don't clash here.
 */
const found = import.meta.glob<Step | undefined>(['./*.ts', '!./index.ts', '!./*.test.ts'], {
  eager: true,
  import: 'default',
});

export const STEPS: Step[] = Object.keys(found)
  .sort()
  .map((path) => {
    const step = found[path];
    if (!step) throw new Error(`${path} needs a default export of its Step`);
    const file = path.slice(2, -3);
    if (step.kind !== file) {
      throw new Error(`${path} exports a step with kind "${step.kind}", not "${file}"`);
    }
    return step;
  });

/** The step of this kind. Throws for a kind with no file, so tests catch typos. */
export function stepOf(kind: string): Step {
  const step = STEPS.find((s) => s.kind === kind);
  if (!step) throw new Error(`No step "${kind}" in steps/`);
  return step;
}

/** A recipe step's card title: the recipe's own, or its step's. */
export function titleOf(run: StepRun): string {
  return run.options.title ?? stepOf(run.kind).title(run.options);
}

/** A recipe step's two-line hint: the recipe's own, or its step's. */
export function hintOf(run: StepRun): [string, string] {
  return run.options.hint ?? stepOf(run.kind).hint(run.options);
}

/** A recipe step's emoji: the recipe's own, or its step's. */
export function iconOf(run: StepRun): string {
  return run.options.icon ?? stepOf(run.kind).icon(run.options);
}
