import type { Dish } from '../game';

/**
 * Every dish in the kitchen: each file in this folder whose default export is
 * a Dish. Vite finds them when it builds, so adding a dish never touches this
 * file, and dishes added at the same time don't clash here.
 */
const found = import.meta.glob<Dish | undefined>(['./*.ts', '!./index.ts', '!./*.test.ts'], {
  eager: true,
  import: 'default',
});

export const DISHES: Dish[] = Object.keys(found)
  .sort()
  .map((path) => {
    const dish = found[path];
    if (!dish) throw new Error(`${path} needs a default export of its Dish`);
    const file = path.slice(2, -3);
    if (dish.id !== file) {
      throw new Error(`${path} exports a dish with id "${dish.id}", not "${file}"`);
    }
    return dish;
  });

/** The dish with this id. Throws for an id with no file, so tests catch typos. */
export function dishById(id: string): Dish {
  const dish = DISHES.find((d) => d.id === id);
  if (!dish) throw new Error(`No dish "${id}" in dishes/`);
  return dish;
}
