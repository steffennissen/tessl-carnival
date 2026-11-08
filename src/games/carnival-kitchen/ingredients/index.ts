import type { Ingredient, IngredientArt } from '../kit/types';

/**
 * Every ingredient: each file in this folder whose default export is an
 * Ingredient. Vite finds them when it builds, so adding one never touches
 * this file, and ingredients added at the same time don't clash here.
 *
 * The list is built the first time it's asked for, not when this file
 * loads. So an ingredient file may import this one to look up another
 * ingredient (the pizza draws its toppings), as long as it only looks them
 * up inside its functions, never at the top of its file.
 */
const modules = import.meta.glob<{ default?: Ingredient }>(
  ['./*.ts', '!./index.ts', '!./*.test.ts'],
  { eager: true },
);

let byId: Map<string, Ingredient> | null = null;

function registry(): Map<string, Ingredient> {
  if (byId) return byId;
  const map = new Map<string, Ingredient>();
  for (const path of Object.keys(modules).sort()) {
    const found = modules[path].default;
    if (!found) throw new Error(`${path} needs a default export of its Ingredient`);
    const file = path.slice(2, -3);
    if (found.id !== file) {
      throw new Error(`${path} exports an ingredient with id "${found.id}", not "${file}"`);
    }
    map.set(file, found);
  }
  byId = map;
  return map;
}

/** Every ingredient, by file name. */
export function allIngredients(): Ingredient[] {
  return [...registry().values()];
}

/** The ingredient with this id. Throws for an id with no file, so tests catch typos. */
export function ingredient(id: string): Ingredient {
  const found = registry().get(id);
  if (!found) throw new Error(`No ingredient "${id}" in ingredients/`);
  return found;
}

/**
 * An ingredient's art for one role, such as `artOf('carrot', 'chop')`.
 * Throws if it doesn't have that role, so tests catch a recipe that asks a
 * step to use something it can't.
 */
export function artOf<R extends keyof IngredientArt>(id: string, role: R): IngredientArt[R] {
  const art = (ingredient(id) as Partial<IngredientArt>)[role];
  if (!art) throw new Error(`ingredients/${id}.ts has no "${String(role)}" art`);
  return art as IngredientArt[R];
}

/** Its name for more than one: "eggs", "pancakes". */
export function pluralOf(found: Ingredient): string {
  return found.plural ?? `${found.label}s`;
}
