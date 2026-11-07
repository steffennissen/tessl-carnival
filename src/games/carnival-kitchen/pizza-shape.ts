/**
 * Pizza numbers that both the rules (game.ts) and the drawing (art.ts,
 * dishes/pizza.ts) need. They live here, in a file that imports nothing, so
 * the drawing never has to load the rules: dish files can be loaded first.
 */

/** Where the pizza sits while the toppings go on, seen a little from the side. */
export const PIZZA_VIEW = { x: 400, y: 335, rx: 170, ry: 80 } as const;

/** How baked a golden pizza is, from 0 (raw) to 1 (crispy). */
export const BAKE_TARGET = 0.7;
