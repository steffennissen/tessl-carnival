/**
 * The step kit: everything a step, an ingredient or a dish shares. Import
 * from here: `import { scoreAction, circleRules, type Step } from '../kit'`.
 *
 * - types.ts: the shapes (Step, Dish, Ingredient, KitchenState, StepView...).
 * - rules.ts: scoring, the combo, the popup, finishing a step, random rolls.
 * - circles.ts, hold.ts, float.ts, needle.ts: the four ready-made mini-games.
 * - scene.ts: scene pieces more than one step draws, and the scene's size.
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
