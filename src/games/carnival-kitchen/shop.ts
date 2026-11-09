import { type Box, bookButtonFor, closeButton, gridFor, inBox } from './book';
import type { Layout } from './layout';
import {
  type Item,
  type Outfit,
  type Purse,
  type Tab,
  TABS,
  buy,
  canAfford,
  carnivalPurse,
  coinsShort,
  equip,
  itemById,
  itemsOn,
  lockedByRank,
  owns,
} from './wardrobe';

/**
 * The shop and wardrobe page, and the title screen's shop button and rank
 * badge: where everything goes for a layout, and what a tap does, as plain
 * functions tested without a browser. render.ts draws them, game.ts opens
 * and closes the page.
 *
 * One page does both: things she has are worn with a tap, things she hasn't
 * are bought (a tap, then ✓ on "Buy it?"), and things for a rank she hasn't
 * reached say which rank. Everything a finger taps is at least 60 CSS pixels
 * on a phone.
 */

/** The title screen's shop button, rank badge and cook-off button, in canvas units. */
export function titlePlaces(layout: Layout): { shop: Box; rank: Box; cookoff: Box } {
  if (layout.shape === 'tall') {
    // Under the home and sound buttons, either side. The cook-off beside
    // Chef Bunny, under the big start button and clear of the gear.
    const h = layout.height >= 1000 ? 100 : 72;
    const bunnyY = Math.min(layout.height - 150, layout.sceneY + 635);
    return {
      rank: { x: 16, y: 114, w: 290, h },
      shop: { x: layout.width - 16 - 250, y: 114, w: 250, h },
      cookoff: { x: 200, y: bunnyY - 90, w: layout.width - 216, h: 100 },
    };
  }
  // The shop and the cook-off under the book button at the right. On a
  // computer the badge sits above the title; on a phone held sideways, where
  // it's bigger for a finger, at the left under 🏠, above Chef Bunny.
  const book = bookButtonFor(layout);
  const h = layout.shape === 'wide' ? 80 : 60;
  const shop = { x: book.x, y: book.y + book.h + 12, w: book.w, h };
  // Clear of the coins on the shop button's corner, and a little wider, for its words.
  const cookoff = { x: book.x - 40, y: shop.y + h + 26, w: book.w + 40, h };
  if (layout.shape === 'wide') {
    return { shop, cookoff, rank: { x: 16, y: layout.sceneY + 112, w: 270, h: 80 } };
  }
  return {
    shop,
    cookoff,
    rank: { x: layout.sceneX + 290, y: layout.sceneY + 8, w: 300, h: 62 },
  };
}

/** The shop page's view: its tab, the item last tapped, and a "Buy it?" waiting. */
export interface ShopState {
  tab: Tab;
  /** The item last tapped: Chef Bunny shows it, and its name is under her. */
  tried: string | null;
  /** The item "Buy it?" is asking about, or null. */
  confirm: string | null;
}

export function createShop(tab: Tab = 'hats'): ShopState {
  return { tab, tried: null, confirm: null };
}

/** Where the shop page's parts go on the canvas, for a layout. */
export function shopPlaces(layout: Layout) {
  const { width, height } = layout;
  const tall = layout.shape === 'tall';
  const wide = layout.shape === 'wide';
  const page: Box = { x: 10, y: 10, w: width - 20, h: height - 20 };
  const close = closeButton(layout);
  const items = Math.max(...TABS.map((t) => itemsOn(t.id).length));
  if (tall) {
    const big = height >= 1000;
    const coins: Box = { x: 22, y: 22, w: 210, h: big ? 84 : 70 };
    const top = Math.max(coins.y + coins.h, close.y + close.r) + 10;
    const previewH = big ? 300 : 230;
    const preview: Box = { x: 22, y: top, w: width - 44, h: previewH };
    const tabH = big ? 100 : 76;
    const tabsTop = top + previewH + 10;
    const tabs = tabBoxes({ x: 22, y: tabsTop, w: width - 44, h: tabH });
    const area: Box = { x: 22, y: tabsTop + tabH + 14, w: width - 44, h: 0 };
    area.h = height - 24 - area.y;
    return {
      page,
      tall,
      close,
      coins,
      title: { x: (coins.x + coins.w + close.x - close.r) / 2, y: coins.y + coins.h / 2 },
      preview,
      bunny: {
        x: preview.x + preview.w * 0.28,
        y: preview.y + 134 * (previewH / 300),
        scale: previewH / 300,
      },
      caption: { x: preview.x + preview.w * 0.52, y: preview.y + 20, w: preview.w * 0.48 - 8 },
      tabs,
      grid: gridFor(area, items),
      area,
      ...confirmPlaces(layout),
    };
  }
  const coins: Box = { x: 24, y: 22, w: 190, h: wide ? 74 : 56 };
  const side = Math.min(240, Math.max(180, width * 0.24));
  const preview: Box = { x: 22, y: coins.y + coins.h + 10, w: side, h: height - coins.h - 64 };
  const tabH = wide ? 80 : 60;
  const left = preview.x + preview.w + 14;
  const tabs = tabBoxes({ x: left, y: 22 + (wide ? 74 : 56) + 10, w: width - 24 - left, h: tabH });
  const area: Box = { x: left, y: tabs[0].y + tabH + 10, w: width - 24 - left, h: 0 };
  area.h = height - 22 - area.y;
  const scale = Math.min(1, (preview.h - 90) / 260);
  return {
    page,
    tall,
    close,
    coins,
    title: { x: (left + close.x - close.r) / 2, y: coins.y + coins.h / 2 },
    preview,
    bunny: { x: preview.x + preview.w / 2, y: preview.y + 134 * scale, scale },
    caption: { x: preview.x + 6, y: preview.y + preview.h - 76, w: preview.w - 12 },
    tabs,
    grid: gridFor(area, items),
    area,
    ...confirmPlaces(layout),
  };
}

/** The tabs, side by side across a row. */
function tabBoxes(row: Box): Box[] {
  const gap = 10;
  const w = (row.w - gap * (TABS.length - 1)) / TABS.length;
  return TABS.map((_, i) => ({ x: row.x + i * (w + gap), y: row.y, w, h: row.h }));
}

/** The "Buy it?" card: the item, its price, ✓ and ✕. */
function confirmPlaces(layout: Layout) {
  const tall = layout.shape === 'tall';
  const w = Math.min(layout.width - 40, tall ? 520 : 460);
  const h = tall ? 420 : 330;
  const cx = layout.width / 2;
  const cy = tall ? layout.height * 0.45 : layout.height / 2;
  const r = tall ? 58 : 48;
  const card: Box = { x: cx - w / 2, y: cy - h / 2, w, h };
  return {
    card,
    yes: { x: cx - w * 0.22, y: card.y + h - r - 26, r },
    no: { x: cx + w * 0.22, y: card.y + h - r - 26, r },
  };
}

export type ShopPlaces = ReturnType<typeof shopPlaces>;

/** What happened on a tap, for sounds, words and sparkles. */
export type ShopEvent =
  | { kind: 'close' }
  | { kind: 'tab'; tab: Tab }
  | { kind: 'wear'; item: Item }
  | { kind: 'off'; item: Item }
  | { kind: 'ask'; item: Item }
  | { kind: 'bought'; item: Item }
  | { kind: 'short'; item: Item; short: number }
  | { kind: 'locked'; item: Item }
  | { kind: 'cancel' }
  | null;

/** What a tap on the shop needs to know, and what it may change. */
export interface ShopWorld {
  stickers: Record<string, number>;
  rank: number;
  outfit: Outfit;
  purse?: Purse;
}

/**
 * A tap on the shop page at a canvas point. Changes the shop's view, and
 * returns what happened and the outfit after it: buying something puts it
 * on, and so does tapping something she has. A bought item's sticker and
 * the coins are dealt with by `purse` (the carnival's wallet and sticker
 * book unless a test gives its own).
 */
export function pressShop(
  shop: ShopState,
  places: ShopPlaces,
  x: number,
  y: number,
  world: ShopWorld,
): { event: ShopEvent; outfit: Outfit } {
  const { stickers, rank, outfit } = world;
  const purse = world.purse ?? carnivalPurse;
  if (shop.confirm) {
    const item = itemById(shop.confirm);
    shop.confirm = null;
    const { yes } = places;
    if (item && Math.hypot(x - yes.x, y - yes.y) <= yes.r + 8) {
      const result = buy(item, stickers, rank, purse);
      if (result === 'bought')
        return { event: { kind: 'bought', item }, outfit: equip(outfit, item) };
      if (result === 'short') {
        return { event: { kind: 'short', item, short: coinsShort(item, purse.coins()) }, outfit };
      }
    }
    return { event: { kind: 'cancel' }, outfit };
  }
  const { close } = places;
  if (Math.hypot(x - close.x, y - close.y) <= close.r + 8)
    return { event: { kind: 'close' }, outfit };
  const tab = places.tabs.findIndex((b) => inBox(b, x, y));
  if (tab >= 0) {
    shop.tab = TABS[tab].id;
    return { event: { kind: 'tab', tab: shop.tab }, outfit };
  }
  const items = itemsOn(shop.tab);
  const i = places.grid.cells.findIndex((c) => inBox(c, x, y));
  const item = items[i] as Item | undefined;
  if (!item) return { event: null, outfit };
  shop.tried = item.id;
  if (owns(item, stickers, rank)) {
    const next = equip(outfit, item);
    const off = next[item.slot] !== item.id;
    return { event: { kind: off ? 'off' : 'wear', item }, outfit: next };
  }
  if (lockedByRank(item, rank)) return { event: { kind: 'locked', item }, outfit };
  const coins = purse.coins();
  if (canAfford(item, coins)) {
    shop.confirm = item.id;
    return { event: { kind: 'ask', item }, outfit };
  }
  return { event: { kind: 'short', item, short: coinsShort(item, coins) }, outfit };
}

/** What Chef Bunny wears in the shop's picture: what's on, with the tried hat or apron. */
export function previewOutfit(shop: ShopState, outfit: Outfit): Outfit {
  const tried = shop.confirm ?? shop.tried;
  const item = tried ? itemById(tried) : undefined;
  if (!item || (item.slot !== 'hat' && item.slot !== 'apron')) return outfit;
  return { ...outfit, [item.slot]: item.id };
}
