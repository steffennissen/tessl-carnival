import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BunnyPose, drawBunny } from './bunny';
import { calmPose } from './bunny';
import { THEMES, drawKitchen } from './kitchens';
import { type Layout, layoutFor } from './layout';
import { drawApron, drawHat, drawHatIcon } from './outfit-art';
import { createRenderer } from './render';
import { createShop } from './shop';
import { fakeCanvas, quiet } from './test-kit';
import { DEFAULT_OUTFIT, ITEMS, TABS, itemsOn, type Outfit } from './wardrobe';
import { DISHES } from './dishes';

/**
 * Drawing the wardrobe, the kitchens, the shop and the rank ceremony, on a
 * pretend canvas that throws on NaN, in every layout.
 */

const LAYOUTS: Record<string, Layout> = {
  page: layoutFor(1280, 800, false),
  wide: layoutFor(844, 390, true),
  tall: layoutFor(390, 844, true),
  'wide tablet': layoutFor(1024, 768, true),
};

const of = (slot: string) => ITEMS.filter((i) => i.slot === slot).map((i) => i.id);

beforeEach(() => {
  // The renderer paints the kitchen and the clocks' faces into canvases of their own.
  vi.stubGlobal('document', {
    createElement: () => ({ width: 0, height: 0, getContext: () => fakeCanvas() }),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('drawing the wardrobe', () => {
  it('draws Chef Bunny in every hat and apron, bowing and with her hat dropping on', () => {
    const poses: BunnyPose[] = [
      calmPose(1.2),
      calmPose(1.2, 'party', 0.4),
      { ...calmPose(2), bow: 0.6, hatLift: 120 },
      { ...calmPose(2), bow: 1, hatLift: 0 },
    ];
    for (const hat of [...of('hat'), '']) {
      for (const apron of of('apron')) {
        for (const pose of poses) {
          expect(() =>
            drawBunny(fakeCanvas(), { x: 86, y: 392 }, pose, { hat, apron }),
          ).not.toThrow();
        }
      }
      expect(() => drawHatIcon(fakeCanvas(), hat, 1)).not.toThrow();
      expect(() => drawHat(fakeCanvas(), hat, true, 1)).not.toThrow();
    }
    expect(() => drawApron(fakeCanvas(), 'no-such-apron', 0, 0)).not.toThrow();
  });

  it('draws every kitchen with every decoration, in every layout', () => {
    for (const layout of Object.values(LAYOUTS)) {
      for (const kitchen of Object.keys(THEMES)) {
        for (const wallpaper of of('wallpaper')) {
          for (const bunting of of('bunting')) {
            const look = { kitchen, wallpaper, bunting, shelf: 'goldfish', lights: 'fairy-lights' };
            expect(() => drawKitchen(fakeCanvas(), layout, look, true)).not.toThrow();
          }
        }
        const bare = { ...DEFAULT_OUTFIT, kitchen };
        expect(() => drawKitchen(fakeCanvas(), layout, bare, false)).not.toThrow();
      }
    }
    expect(Object.keys(THEMES)).toEqual(['tent', 'candy', 'space', 'underwater', 'palace']);
  });
});

describe('the renderer', () => {
  const info = (outfit: Outfit, coins: number) => ({
    coins,
    stickers: { 'own:crown': 1 },
    rank: 2,
    outfit,
  });

  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`draws the title, the shop on every tab and the ceremony, ${name}`, () => {
      const renderer = createRenderer(fakeCanvas(), quiet);
      renderer.setLayout(layout, 2);
      const outfit = { ...DEFAULT_OUTFIT, hat: 'crown', shelf: 'goldfish', kitchen: 'space' };
      renderer.setOutfit(outfit);
      for (const points of [0, 7, 30, 999]) renderer.drawTitle(1 / 60, 0.5, { coins: 123, points });

      const shop = createShop();
      for (const tab of TABS) {
        shop.tab = tab.id;
        for (const item of itemsOn(tab.id)) {
          shop.tried = item.id;
          renderer.drawShop(1 / 60, shop, info(outfit, 40));
        }
        shop.confirm = itemsOn(tab.id)[1].id;
        renderer.drawShop(1 / 60, shop, info(outfit, 999));
        shop.confirm = null;
      }
      // Every kind of tap's sounds and sparkles, then the purchase's animation.
      shop.tab = 'hats';
      const crown = ITEMS.find((i) => i.id === 'crown');
      if (!crown) throw new Error('no crown');
      for (const event of [
        { kind: 'tab', tab: 'hats' },
        { kind: 'wear', item: crown },
        { kind: 'off', item: crown },
        { kind: 'ask', item: crown },
        { kind: 'short', item: crown, short: 3 },
        { kind: 'locked', item: crown },
        { kind: 'cancel' },
        { kind: 'close' },
        { kind: 'bought', item: crown },
      ] as const) {
        renderer.shopEvent(event, shop);
      }
      for (let i = 0; i < 60; i++) renderer.drawShop(1 / 30, shop, info(outfit, 0));

      for (const rank of [1, 2, 3, 4]) {
        renderer.startCeremony(rank);
        expect(renderer.ceremonyReady()).toBe(false);
        for (let i = 0; i < 6 * 20; i++) renderer.drawCeremony(0.05);
        expect(renderer.ceremonyReady()).toBe(true);
      }
    });

    it(`draws the recipe book with the surprise wrapped and unwrapped, ${name}`, () => {
      const renderer = createRenderer(fakeCanvas(), quiet);
      renderer.setLayout(layout, 1);
      const all = Object.fromEntries(DISHES.filter((d) => !d.locked).map((d) => [d.id, 2]));
      for (const stickers of [{}, { pizza: 1 }, all, { ...all, 'birthday-cake': 3 }]) {
        for (let i = 0; i < 3; i++) renderer.drawBook(0.1, stickers);
      }
    });
  }
});
