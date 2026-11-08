/**
 * The step kit: everything a step, an ingredient or a dish shares. Import
 * from here: `import { scoreAction, circleRules, type Step } from '../kit'`.
 *
 * - types.ts: the shapes (Step, Dish, Ingredient, KitchenState, StepView...).
 * - rules.ts: scoring, the combo, the popup, finishing a step, random rolls.
 * - circles.ts, hold.ts, float.ts, needle.ts: the four ready-made mini-games.
 * - scene.ts: scene pieces more than one step draws, and the scene's size.
 * - learn.ts: learning moments' shared rules (settings, answering, Smart Chef).
 * - quiz.ts: the question-and-answers mini-game; words.ts: reading helpers;
 *   order.ts: order tickets.
 * - clock.ts: the kitchen clock (round times, step minutes, drawing a clock).
 *
 * Nothing here imports a registry (steps/, ingredients/ or dishes/), so any
 * file can import the kit without a loop.
 */
export * from './types';
export * from './rules';
export * from './circles';
export * from './hold';
export * from './float';
export * from './needle';
export * from './scene';
export * from './learn';
export * from './quiz';
export * from './words';
export * from './order';
export * from './clock';
