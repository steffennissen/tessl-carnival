import { describe, expect, it } from 'vitest';
import { preferencesFor } from '../../carnival';
import { bookButtonFor, closeButton, type Box } from './book';
import { gearFor } from './grownups';
import { layoutFor } from './layout';
import { placesFor } from './render';
import { createShop, pressShop, previewOutfit, shopPlaces, titlePlaces } from './shop';
import { cssScale } from './test-kit';
import {
  DEFAULT_OUTFIT,
  FOR_SALE,
  ITEMS,
  type Purse,
  TABS,
  buy,
  canAfford,
  coinsShort,
  equip,
  itemById,
  itemsOn,
  loadOutfit,
  outfitFrom,
  ownSticker,
  owns,
  saveOutfit,
  saveUpLine,
  slotKey,
} from './wardrobe';

const item = (id: string) => {
  const found = itemById(id);
  if (!found) throw new Error(`No item ${id}`);
  return found;
};

/** A pretend wallet and sticker book. */
function purse(coins: number, stickers: Record<string, number> = {}) {
  const p: Purse & { left: number; stickers: Record<string, number> } = {
    left: coins,
    stickers,
    coins: () => p.left,
    spend: (amount) => {
      if (p.left < amount) return false;
      p.left -= amount;
      return true;
    },
    own: (id) => {
      p.stickers[ownSticker(id)] = 1;
    },
  };
  return p;
}

/** Whether two boxes overlap, by more than a rounding error. */
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w - 1e-6 &&
  b.x < a.x + a.w - 1e-6 &&
  a.y < b.y + b.h - 1e-6 &&
  b.y < a.y + a.h - 1e-6;
const middle = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

describe('the shop catalog', () => {
  it('sells hats, aprons and kitchen decorations: at least 18 things', () => {
    expect(FOR_SALE.length).toBeGreaterThanOrEqual(18);
    for (const slot of ['hat', 'apron', 'wallpaper', 'bunting', 'shelf', 'lights'] as const) {
      expect(
        FOR_SALE.some((i) => i.slot === slot),
        slot,
      ).toBe(true);
    }
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['crown', 'flower-crown', 'pirate-hat', 'wizard-hat', 'astronaut-helmet']) {
      expect(itemById(id)?.slot).toBe('hat');
    }
    expect(itemById('goldfish')?.slot).toBe('shelf');
    expect(itemById('fairy-lights')?.slot).toBe('lights');
  });

  it('prices things so a few rounds buys something', () => {
    for (const i of FOR_SALE) {
      expect(i.price, i.id).toBeGreaterThanOrEqual(15);
      expect(i.price, i.id).toBeLessThanOrEqual(120);
      expect(Number.isInteger(i.price)).toBe(true);
    }
    expect(Math.min(...FOR_SALE.map((i) => i.price))).toBe(15);
  });

  it('puts every item on a tab, and fits the fullest tab', () => {
    const shown = TABS.flatMap((t) => itemsOn(t.id));
    expect(shown).toHaveLength(ITEMS.length);
  });

  it('has the defaults from the start, for free', () => {
    for (const id of Object.values(DEFAULT_OUTFIT).filter(Boolean)) {
      expect(owns(item(id), {}, 0), id).toBe(true);
    }
  });
});

describe('buying', () => {
  it('knows what she can afford, and says kindly how much more she needs', () => {
    expect(canAfford(item('crown'), 60)).toBe(true);
    expect(canAfford(item('crown'), 59)).toBe(false);
    expect(coinsShort(item('crown'), 48)).toBe(12);
    expect(coinsShort(item('crown'), 80)).toBe(0);
    expect(saveUpLine(item('crown'), 48)).toBe('Save up 12 more coins!');
    expect(saveUpLine(item('crown'), 59)).toBe('Save up 1 more coin!');
  });

  it('spends the price and records that she owns it', () => {
    const p = purse(70);
    expect(buy(item('crown'), p.stickers, 0, p)).toBe('bought');
    expect(p.left).toBe(10);
    expect(p.stickers['own:crown']).toBe(1);
    expect(owns(item('crown'), p.stickers, 0)).toBe(true);
    // Owned now: buying again costs nothing.
    expect(buy(item('crown'), p.stickers, 0, p)).toBe('owned');
    expect(p.left).toBe(10);
  });

  it("doesn't buy what she can't afford, or a rank's hat, or the defaults", () => {
    const p = purse(10);
    expect(buy(item('crown'), {}, 0, p)).toBe('short');
    expect(p.left).toBe(10);
    expect(p.stickers).toEqual({});
    expect(buy(item('star-toque'), {}, 0, p)).toBe('locked');
    expect(buy(item('chef-hat'), {}, 0, p)).toBe('owned');
  });

  it('works with the carnival wallet and sticker book too', () => {
    // No coins in this test's wallet.
    expect(buy(item('party-hat'), {}, 0)).toBe('short');
  });
});

describe('the wardrobe', () => {
  it('puts on one thing per slot', () => {
    const on = equip(DEFAULT_OUTFIT, item('crown'));
    expect(on.hat).toBe('crown');
    expect(equip(on, item('wizard-hat')).hat).toBe('wizard-hat');
    expect(equip(on, item('mint-apron'))).toEqual({ ...on, apron: 'mint-apron' });
    // Tapping the hat she has on keeps it on.
    expect(equip(on, item('crown')).hat).toBe('crown');
  });

  it('takes the goldfish and the fairy lights away with a second tap', () => {
    const fish = equip(DEFAULT_OUTFIT, item('goldfish'));
    expect(fish.shelf).toBe('goldfish');
    expect(equip(fish, item('goldfish')).shelf).toBe('');
    const lit = equip(fish, item('fairy-lights'));
    expect(lit.lights).toBe('fairy-lights');
    expect(equip(lit, item('fairy-lights')).lights).toBe('');
  });

  it('reads what she wore, putting back anything unknown or not hers', () => {
    const stickers = { 'own:crown': 1, 'own:goldfish': 1 };
    const saved = {
      [slotKey('hat')]: 'crown',
      [slotKey('apron')]: 'rainbow-apron', // not hers
      [slotKey('wallpaper')]: 'crown', // the wrong slot
      [slotKey('bunting')]: 'no-such-thing',
      [slotKey('shelf')]: 'goldfish',
      [slotKey('lights')]: '',
      [slotKey('kitchen')]: 'space', // a rank she hasn't reached
    };
    expect(outfitFrom(saved, stickers, 0)).toEqual({
      ...DEFAULT_OUTFIT,
      hat: 'crown',
      shelf: 'goldfish',
    });
    expect(outfitFrom(saved, stickers, 2).kitchen).toBe('space');
    expect(outfitFrom({}, {}, 0)).toEqual(DEFAULT_OUTFIT);
  });

  it('saves what she wears, and remembers it', () => {
    const stickers = { 'own:pirate-hat': 1 };
    const outfit = { ...DEFAULT_OUTFIT, hat: 'pirate-hat', kitchen: 'candy' };
    saveOutfit(outfit, DEFAULT_OUTFIT);
    expect(preferencesFor('carnival-kitchen')[slotKey('hat')]).toBe('pirate-hat');
    // Only the slots that changed were saved.
    expect(preferencesFor('carnival-kitchen')[slotKey('apron')]).toBeUndefined();
    expect(loadOutfit(stickers, 1)).toEqual(outfit);
    saveOutfit(DEFAULT_OUTFIT);
    expect(loadOutfit(stickers, 1)).toEqual(DEFAULT_OUTFIT);
  });
});

const LAYOUTS = {
  page: layoutFor(1280, 800, false),
  wide: layoutFor(844, 390, true),
  tall: layoutFor(390, 844, true),
  'short tall': layoutFor(360, 640, true),
  'small tall': layoutFor(600, 900, true),
  'wide tablet': layoutFor(1024, 768, true),
};

describe('the shop page', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    describe(name, () => {
      const p = shopPlaces(layout);
      const inside = (b: Box) =>
        b.x >= p.page.x &&
        b.y >= p.page.y &&
        b.x + b.w <= p.page.x + p.page.w &&
        b.y + b.h <= p.page.y + p.page.h;

      it('fits the tabs, the items and her picture on the page, apart', () => {
        const boxes = [p.coins, p.preview, ...p.tabs, ...p.grid.cells];
        for (const b of boxes) expect(inside(b)).toBe(true);
        boxes.forEach((a, i) =>
          boxes.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)),
        );
        const close = { x: p.close.x - p.close.r, y: p.close.y - p.close.r, w: 2 * p.close.r };
        for (const b of boxes) expect(overlaps(b, { ...close, h: close.w })).toBe(false);
        // Chef Bunny, hat and feet, inside her picture.
        const s = p.bunny.scale;
        expect(p.bunny.y - 132 * s).toBeGreaterThanOrEqual(p.preview.y - 2);
        expect(p.bunny.y + 130 * s).toBeLessThanOrEqual(p.preview.y + p.preview.h);
        // Every tab's items fit the grid.
        for (const tab of TABS)
          expect(itemsOn(tab.id).length).toBeLessThanOrEqual(p.grid.cells.length);
      });

      it('puts the "Buy it?" card on the canvas with ✓ and ✕ inside it', () => {
        expect(p.card.x).toBeGreaterThanOrEqual(0);
        expect(p.card.x + p.card.w).toBeLessThanOrEqual(layout.width);
        for (const b of [p.yes, p.no]) {
          expect(b.x - b.r).toBeGreaterThanOrEqual(p.card.x);
          expect(b.x + b.r).toBeLessThanOrEqual(p.card.x + p.card.w);
          expect(b.y + b.r).toBeLessThanOrEqual(p.card.y + p.card.h);
        }
      });
    });
  }

  for (const shape of ['wide', 'tall'] as const) {
    it(`makes everything a finger taps at least 60 CSS pixels, ${shape}`, () => {
      const layout = LAYOUTS[shape];
      const scale = cssScale(shape);
      const p = shopPlaces(layout);
      for (const b of [...p.tabs, ...p.grid.cells.slice(0, 12)]) {
        expect(b.w * scale).toBeGreaterThanOrEqual(60);
        expect(b.h * scale).toBeGreaterThanOrEqual(60);
      }
      for (const r of [p.yes.r, p.no.r, p.close.r])
        expect(r * 2 * scale).toBeGreaterThanOrEqual(60);
      const { shop, rank } = titlePlaces(layout);
      for (const b of [shop, rank]) {
        expect(b.w * scale).toBeGreaterThanOrEqual(60);
        expect(b.h * scale).toBeGreaterThanOrEqual(60);
      }
      expect(gearFor(layout).r * 2 * scale).toBeGreaterThanOrEqual(60);
    });
  }
});

describe('the title screen', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`puts the shop button and rank badge clear of the other buttons, ${name}`, () => {
      const { shop, rank } = titlePlaces(layout);
      const places = placesFor(layout);
      const round = (c: { x: number; y: number }, r: number): Box => ({
        x: c.x - r,
        y: c.y - r,
        w: 2 * r,
        h: 2 * r,
      });
      const gear = gearFor(layout);
      const others: Box[] = [
        bookButtonFor(layout),
        round(places.sound, places.buttonR),
        round(gear, gear.r + 12),
      ];
      if (places.home) others.push(round(places.home, places.buttonR));
      for (const b of [shop, rank]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(layout.width);
        for (const o of others) expect(overlaps(b, o)).toBe(false);
      }
      expect(overlaps(shop, rank)).toBe(false);
      // The title's words and the covered dish sit below the badges on the scene.
      const title: Box = {
        x: layout.sceneX + (layout.shape === 'tall' ? 400 : 440) - 150,
        y: layout.sceneY + 80,
        w: 300,
        h: 100,
      };
      for (const b of [shop, rank]) expect(overlaps(b, title)).toBe(false);
    });
  }
});

describe('a tap in the shop', () => {
  const layout = LAYOUTS.tall;
  const p = shopPlaces(layout);
  const cellOf = (tab: Parameters<typeof itemsOn>[0], id: string) =>
    middle(p.grid.cells[itemsOn(tab).findIndex((i) => i.id === id)]);

  it('changes tab', () => {
    const shop = createShop();
    const at = middle(p.tabs[1]);
    const { event } = pressShop(shop, p, at.x, at.y, {
      stickers: {},
      rank: 0,
      outfit: DEFAULT_OUTFIT,
    });
    expect(event).toEqual({ kind: 'tab', tab: 'aprons' });
    expect(shop.tab).toBe('aprons');
  });

  it('asks before buying, then buys and puts it on', () => {
    const shop = createShop();
    const wallet = purse(100);
    const world = { stickers: wallet.stickers, rank: 0, outfit: DEFAULT_OUTFIT, purse: wallet };
    const at = cellOf('hats', 'crown');
    const asked = pressShop(shop, p, at.x, at.y, world);
    expect(asked.event?.kind).toBe('ask');
    expect(shop.confirm).toBe('crown');
    expect(wallet.left).toBe(100);
    // She tries it on while it asks.
    expect(previewOutfit(shop, DEFAULT_OUTFIT).hat).toBe('crown');
    const done = pressShop(shop, p, p.yes.x, p.yes.y, world);
    expect(done.event?.kind).toBe('bought');
    expect(done.outfit.hat).toBe('crown');
    expect(wallet.left).toBe(40);
    expect(wallet.stickers['own:crown']).toBe(1);
    expect(shop.confirm).toBeNull();
  });

  it('keeps her coins when she says no', () => {
    const shop = createShop();
    const wallet = purse(100);
    const world = { stickers: {}, rank: 0, outfit: DEFAULT_OUTFIT, purse: wallet };
    const at = cellOf('hats', 'crown');
    pressShop(shop, p, at.x, at.y, world);
    const no = pressShop(shop, p, p.no.x, p.no.y, world);
    expect(no.event).toEqual({ kind: 'cancel' });
    expect(no.outfit).toBe(DEFAULT_OUTFIT);
    expect(wallet.left).toBe(100);
  });

  it("says how many more coins she needs for what she can't buy yet", () => {
    const shop = createShop();
    const wallet = purse(48);
    const at = cellOf('hats', 'crown');
    const { event } = pressShop(shop, p, at.x, at.y, {
      stickers: {},
      rank: 0,
      outfit: DEFAULT_OUTFIT,
      purse: wallet,
    });
    expect(event).toEqual({ kind: 'short', item: item('crown'), short: 12 });
    expect(shop.confirm).toBeNull();
  });

  it("wears what she has, and says which rank gives what she hasn't", () => {
    const shop = createShop();
    const world = { stickers: { 'own:wizard-hat': 1 }, rank: 0, outfit: DEFAULT_OUTFIT };
    const wizard = cellOf('hats', 'wizard-hat');
    const worn = pressShop(shop, p, wizard.x, wizard.y, world);
    expect(worn.event?.kind).toBe('wear');
    expect(worn.outfit.hat).toBe('wizard-hat');
    const star = cellOf('hats', 'star-toque');
    expect(pressShop(shop, p, star.x, star.y, world).event?.kind).toBe('locked');
    shop.tab = 'kitchens';
    const candy = cellOf('kitchens', 'candy');
    expect(pressShop(shop, p, candy.x, candy.y, world).event?.kind).toBe('locked');
    const castle = pressShop(shop, p, candy.x, candy.y, { ...world, rank: 1 });
    expect(castle.event?.kind).toBe('wear');
    expect(castle.outfit.kitchen).toBe('candy');
  });

  it('closes with ✕', () => {
    const close = closeButton(layout);
    const { event } = pressShop(createShop(), p, close.x, close.y, {
      stickers: {},
      rank: 0,
      outfit: DEFAULT_OUTFIT,
    });
    expect(event).toEqual({ kind: 'close' });
  });
});
