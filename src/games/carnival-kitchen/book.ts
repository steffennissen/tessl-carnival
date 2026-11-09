import { smartSticker, type Dish } from './kit';
import type { Layout } from './layout';

/**
 * The recipe book: a page with a sticker for every dish. A dish's sticker is
 * earned when a round of it ends, at that round's stars, and only ever goes
 * up (the carnival's shared sticker book keeps them). The book shows each
 * earned dish with its best stars, and a covered dish for the rest.
 *
 * Everything here is in canvas units and plain functions, so it's tested
 * without a browser. render.ts draws the book, game.ts opens and closes it.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The size a book cell is designed at; cells are this, scaled. */
export const CELL = { w: 130, h: 140 } as const;
/** The biggest cells get, so a few dishes on a big screen don't turn huge. */
const MAX_SCALE = 1.5;

/** How many of `dishes` have a sticker, out of how many. */
export function bookCount(stickers: Record<string, number>, dishes: Dish[]) {
  const earned = dishes.filter((dish) => (stickers[dish.id] ?? 0) >= 1).length;
  return { earned, total: dishes.length };
}

/** The line the book shows at its top, such as "7 of 16 dishes". */
export function countLine(stickers: Record<string, number>, dishes: Dish[]): string {
  const { earned, total } = bookCount(stickers, dishes);
  return `${earned} of ${total} dishes`;
}

/** Stars on a dish's sticker: 0 for a dish not cooked yet, else 1 to 3. */
export function starsOf(stickers: Record<string, number>, id: string): number {
  return Math.max(0, Math.min(3, Math.round(stickers[id] ?? 0)));
}

/** Whether a dish has its Smart Chef star: a learning moment answered on her own. */
export function smartOf(stickers: Record<string, number>, id: string): boolean {
  return (stickers[smartSticker(id)] ?? 0) >= 1;
}

/**
 * A dish's name on one line, or two when it's long, split at the space
 * nearest the middle.
 */
export function twoLines(name: string, longest = 14): [string] | [string, string] {
  if (name.length <= longest || !name.includes(' ')) return [name];
  const middle = name.length / 2;
  let split = -1;
  for (let i = 0; i < name.length; i++) {
    if (name[i] === ' ' && (split < 0 || Math.abs(i - middle) < Math.abs(split - middle))) {
      split = i;
    }
  }
  return [name.slice(0, split), name.slice(split + 1)];
}

/**
 * Lays out `count` cells in `area`, in as many columns as make them biggest.
 * Rows are centred, and so is a last row that isn't full.
 */
export function gridFor(area: Box, count: number): { cells: Box[]; scale: number } {
  let best = { cols: 1, scale: 0 };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const scale = Math.min(area.w / cols / CELL.w, area.h / rows / CELL.h, MAX_SCALE);
    if (scale > best.scale) best = { cols, scale };
  }
  const { cols, scale } = best;
  const rows = Math.ceil(count / cols);
  const w = CELL.w * scale;
  const h = CELL.h * scale;
  const top = area.y + (area.h - rows * h) / 2;
  const cells: Box[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const left = area.x + (area.w - inRow * w) / 2;
    cells.push({ x: left + (i % cols) * w, y: top + row * h, w, h });
  }
  return { cells, scale };
}

/**
 * The ✕ that closes a page (the book, the grown-ups' page): in the top right
 * corner, at least 60 CSS pixels across on a phone.
 */
export function closeButton(layout: Layout): { x: number; y: number; r: number } {
  const r = layout.shape === 'tall' ? 50 : layout.shape === 'wide' ? 42 : 30;
  return { x: layout.width - 14 - r, y: 14 + r, r };
}

/** Where the book's parts go on the canvas, for a layout. */
export function bookPlaces(layout: Layout, count: number) {
  const { width, height } = layout;
  const page: Box = { x: 10, y: 10, w: width - 20, h: height - 20 };
  const tall = layout.shape === 'tall';
  const header = tall ? 150 : 100;
  const area: Box = { x: 22, y: 10 + header, w: width - 44, h: height - header - 30 };
  return {
    page,
    title: { x: width / 2, y: tall ? 62 : 46 },
    count: { x: width / 2, y: tall ? 114 : 86 },
    close: closeButton(layout),
    ...gridFor(area, count),
  };
}

/** The book's cell under a canvas point, or -1. */
export function cellAt(cells: Box[], x: number, y: number): number {
  return cells.findIndex((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
}

/**
 * The book button on the title screen: a big pill at the top right, where
 * the score sits while cooking.
 */
export function bookButtonFor(layout: Layout): Box {
  const w = 156;
  const h = 60;
  if (layout.shape === 'tall') return { x: layout.width - w - 16, y: 22, w, h };
  return { x: layout.sceneX + 800 - w - 14, y: layout.sceneY + 46, w, h };
}

export function inBox(box: Box, x: number, y: number, slop = 0): boolean {
  return (
    x >= box.x - slop && x <= box.x + box.w + slop && y >= box.y - slop && y <= box.y + box.h + slop
  );
}
