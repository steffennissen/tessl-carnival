import {
  coinsFor,
  earnSticker,
  preferencesFor,
  savePreference,
  spendCoins,
  type PreferenceValue,
} from '../../carnival';

/**
 * Chef Bunny's wardrobe and the kitchen's decorations: everything the shop
 * sells, what she owns, and what's being worn. Coins come from the
 * carnival's shared wallet (`coinsFor`, `spendCoins`), what she owns is kept
 * as stickers (`own:<item>`, by `earnSticker`), and what's worn is saved with
 * the shared preferences, one per slot. Nothing here draws: outfit-art.ts
 * draws the hats and aprons, kitchens.ts the kitchens and decorations.
 */

const GAME = 'carnival-kitchen';

/** Where an item goes: one of each is worn or shown at a time. */
export type Slot = 'hat' | 'apron' | 'wallpaper' | 'bunting' | 'shelf' | 'lights' | 'kitchen';
export const SLOTS: Slot[] = ['hat', 'apron', 'wallpaper', 'bunting', 'shelf', 'lights', 'kitchen'];

/** The shop's tabs. */
export type Tab = 'hats' | 'aprons' | 'decor' | 'kitchens';
export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hats', label: 'Hats', icon: '👑' },
  { id: 'aprons', label: 'Aprons', icon: '🎀' },
  { id: 'decor', label: 'Kitchen', icon: '🐠' },
  { id: 'kitchens', label: 'Places', icon: '🏰' },
];

export interface Item {
  id: string;
  /** Said and shown: "the Crown". */
  name: string;
  slot: Slot;
  /** Coins in the shop; 0 for things she has from the start or earns by rank. */
  price: number;
  /** The chef rank (1 Junior to 4 Master) that gives it for free. */
  rank?: number;
}

const item = (slot: Slot, id: string, name: string, price: number, rank?: number): Item => ({
  id,
  name,
  slot,
  price,
  ...(rank ? { rank } : {}),
});

/**
 * Everything, in the order the shop shows it. Prices are small enough that a
 * few rounds at the food stand buys something.
 */
export const ITEMS: Item[] = [
  item('hat', 'chef-hat', 'Chef Hat', 0),
  item('hat', 'party-hat', 'Party Hat', 15),
  item('hat', 'bow', 'Big Bow', 20),
  item('hat', 'flower-crown', 'Flower Crown', 30),
  item('hat', 'pirate-hat', 'Pirate Hat', 45),
  item('hat', 'crown', 'Crown', 60),
  item('hat', 'wizard-hat', 'Wizard Hat', 80),
  item('hat', 'astronaut-helmet', 'Space Helmet', 120),
  item('hat', 'star-toque', 'Star Chef Hat', 0, 1),
  item('hat', 'ribbon-toque', 'Ribbon Chef Hat', 0, 2),
  item('hat', 'gold-toque', 'Golden Chef Hat', 0, 3),
  item('hat', 'master-toque', 'Master Chef Hat', 0, 4),

  item('apron', 'pink-apron', 'Pink Apron', 0),
  item('apron', 'mint-apron', 'Mint Apron', 15),
  item('apron', 'sky-apron', 'Sky Apron', 15),
  item('apron', 'polka-apron', 'Polka Dot Apron', 25),
  item('apron', 'strawberry-apron', 'Strawberry Apron', 35),
  item('apron', 'rainbow-apron', 'Rainbow Apron', 50),
  item('apron', 'starry-apron', 'Starry Apron', 65),

  item('wallpaper', 'hearts-wallpaper', 'Heart Wallpaper', 0),
  item('wallpaper', 'stars-wallpaper', 'Star Wallpaper', 20),
  item('wallpaper', 'stripes-wallpaper', 'Stripy Wallpaper', 25),
  item('wallpaper', 'dots-wallpaper', 'Dotty Wallpaper', 25),
  item('wallpaper', 'flowers-wallpaper', 'Flower Wallpaper', 30),
  item('bunting', 'rainbow-bunting', 'Rainbow Flags', 0),
  item('bunting', 'berry-bunting', 'Berry Flags', 15),
  item('bunting', 'ocean-bunting', 'Ocean Flags', 15),
  item('bunting', 'gold-bunting', 'Golden Flags', 30),
  item('lights', 'fairy-lights', 'Fairy Lights', 40),
  item('shelf', 'goldfish', 'Goldfish Bowl', 50),

  item('kitchen', 'tent', 'Carnival Tent', 0),
  item('kitchen', 'candy', 'Candy Castle', 0, 1),
  item('kitchen', 'space', 'Space Station', 0, 2),
  item('kitchen', 'underwater', 'Under the Sea', 0, 3),
  item('kitchen', 'palace', 'Golden Palace', 0, 4),
];

/** What she wears and shows when nothing else is picked. Shelf and lights start empty. */
export const DEFAULT_OUTFIT: Outfit = {
  hat: 'chef-hat',
  apron: 'pink-apron',
  wallpaper: 'hearts-wallpaper',
  bunting: 'rainbow-bunting',
  shelf: '',
  lights: '',
  kitchen: 'tent',
};

/** One item id per slot ('' for an empty shelf or no lights). */
export type Outfit = Record<Slot, string>;

export function itemById(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function tabOf(slot: Slot): Tab {
  if (slot === 'hat') return 'hats';
  if (slot === 'apron') return 'aprons';
  if (slot === 'kitchen') return 'kitchens';
  return 'decor';
}

/** The items on a tab, in shop order. */
export function itemsOn(tab: Tab): Item[] {
  return ITEMS.filter((i) => tabOf(i.slot) === tab);
}

/** Items the shop sells for coins. */
export const FOR_SALE = ITEMS.filter((i) => i.price > 0);

/** The sticker that says she owns an item. */
export const ownSticker = (id: string) => `own:${id}`;

/**
 * Whether she has an item: it's free from the start, she bought it (its
 * `own:` sticker), or her chef rank gives it.
 */
export function owns(item: Item, stickers: Record<string, number>, rank: number): boolean {
  if (item.rank !== undefined) return rank >= item.rank;
  return item.price === 0 || (stickers[ownSticker(item.id)] ?? 0) >= 1;
}

/** Whether an item waits for a chef rank she hasn't reached. */
export function lockedByRank(item: Item, rank: number): boolean {
  return item.rank !== undefined && rank < item.rank;
}

export function canAfford(item: Item, coins: number): boolean {
  return coins >= item.price;
}

/** How many more coins she needs for it (0 when she can buy it). */
export function coinsShort(item: Item, coins: number): number {
  return Math.max(0, item.price - coins);
}

/** The kind line for something she can't buy yet: "Save up 12 more coins!". */
export function saveUpLine(item: Item, coins: number): string {
  const short = coinsShort(item, coins);
  return `Save up ${short} more ${short === 1 ? 'coin' : 'coins'}!`;
}

/** The wallet and sticker book, so tests can buy without the real ones. */
export interface Purse {
  coins(): number;
  spend(amount: number): boolean;
  own(id: string): void;
}

export const carnivalPurse: Purse = {
  coins: () => coinsFor(GAME),
  spend: (amount) => spendCoins(GAME, amount),
  own: (id) => void earnSticker(GAME, ownSticker(id), 1),
};

export type BuyResult = 'bought' | 'owned' | 'short' | 'locked' | 'not for sale';

/**
 * Buys an item: spends its price and records that she owns it. Nothing
 * changes unless it's 'bought'.
 */
export function buy(
  item: Item,
  stickers: Record<string, number>,
  rank: number,
  purse: Purse = carnivalPurse,
): BuyResult {
  if (owns(item, stickers, rank)) return 'owned';
  if (lockedByRank(item, rank)) return 'locked';
  if (item.price <= 0) return 'not for sale';
  if (!purse.spend(item.price)) return 'short';
  purse.own(item.id);
  return 'bought';
}

/**
 * The outfit with `item` put on. An item already on in a slot that can be
 * empty (the goldfish, the fairy lights) comes off instead.
 */
export function equip(outfit: Outfit, item: Item): Outfit {
  const on = outfit[item.slot] === item.id;
  const canEmpty = DEFAULT_OUTFIT[item.slot] === '';
  return { ...outfit, [item.slot]: on && canEmpty ? '' : item.id };
}

/**
 * The outfit saved in the preferences, with anything unknown, in the wrong
 * slot or not owned put back to the default.
 */
export function outfitFrom(
  saved: Record<string, PreferenceValue>,
  stickers: Record<string, number>,
  rank: number,
): Outfit {
  const outfit = { ...DEFAULT_OUTFIT };
  for (const slot of SLOTS) {
    const value = saved[slotKey(slot)];
    if (typeof value !== 'string') continue;
    if (value === '' && DEFAULT_OUTFIT[slot] === '') {
      outfit[slot] = '';
      continue;
    }
    const found = itemById(value);
    if (found && found.slot === slot && owns(found, stickers, rank)) outfit[slot] = value;
  }
  return outfit;
}

/** The preference key a slot is saved under. */
export const slotKey = (slot: Slot) => `wear-${slot}`;

/** The outfit saved for this game. */
export function loadOutfit(stickers: Record<string, number>, rank: number): Outfit {
  return outfitFrom(preferencesFor(GAME), stickers, rank);
}

/** Saves every slot that differs from `before`. */
export function saveOutfit(outfit: Outfit, before?: Outfit): void {
  for (const slot of SLOTS) {
    if (!before || before[slot] !== outfit[slot]) savePreference(GAME, slotKey(slot), outfit[slot]);
  }
}
