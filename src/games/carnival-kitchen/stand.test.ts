import { describe, expect, it } from 'vitest';
import { BOSSES, CUSTOMERS, roundCoins, trophyCoins } from './customers';
import { dishById } from './dishes';
import { layoutFor } from './layout';
import { placesFor } from './render';
import {
  GUEST,
  SERVE,
  STAGE,
  coinArc,
  coinsLanded,
  countedSoFar,
  drawCoinDrop,
  drawGuest,
  drawJar,
  drawOrderCard,
  drawTrophy,
  drawTrophyShadow,
  drawWallet,
  guestSpot,
  serveTimes,
  stageSpot,
  stillPose,
  walletSpot,
} from './stand';
import type { Box } from './kit';
import { fakeCanvas, overlaps } from './test-kit';

const LAYOUTS = {
  page: layoutFor(1200, 800, false),
  'wide phone': layoutFor(844, 390, true),
  'wide laptop': layoutFor(1280, 800, true),
  'wide tablet': layoutFor(1024, 768, true),
  'tall phone': layoutFor(390, 844, true),
  'small tall': layoutFor(600, 900, true),
  'tall tablet': layoutFor(768, 1024, true),
};

/** The HUD and Chef Bunny on the canvas, in canvas units. */
function hud(layout: ReturnType<typeof layoutFor>): Box[] {
  const p = placesFor(layout);
  const r = p.buttonR;
  const boxes: Box[] = [
    { x: p.sound.x - r, y: p.sound.y - r, w: 2 * r, h: 2 * r },
    { x: p.score.x, y: p.score.y, w: 150, h: 44 },
    p.badge,
    // Chef Bunny, from her ears to her feet, and her speech bubble.
    { x: p.bunny.x - 60, y: p.bunny.y - 92, w: 120, h: 222 },
    { x: p.speech.x, y: p.speech.y, w: p.speech.w, h: 82 },
  ];
  if (p.home) boxes.push({ x: p.home.x - r, y: p.home.y - r, w: 2 * r, h: 2 * r });
  return boxes;
}

describe('where the stand goes', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    const places = placesFor(layout);

    it(`puts the waiting customer clear of the HUD, Chef Bunny and the clock (${name})`, () => {
      const spot = guestSpot(layout, places);
      const w = GUEST.w * spot.scale;
      const h = GUEST.h * spot.scale;
      const guest = { x: spot.x - w / 2, y: spot.y - h, w, h };
      expect(spot.scale).toBeGreaterThanOrEqual(0.5);
      expect(guest.x).toBeGreaterThanOrEqual(0);
      expect(guest.x + guest.w).toBeLessThanOrEqual(layout.width);
      expect(guest.y + guest.h).toBeLessThanOrEqual(layout.height);
      for (const box of hud(layout)) expect(overlaps(guest, box), JSON.stringify(box)).toBe(false);
      const { clock } = places;
      const reach = clock.r * 1.08;
      const face = { x: clock.x - reach, y: clock.y - reach, w: 2 * reach, h: 2 * reach };
      expect(overlaps(guest, face)).toBe(false);
      if (layout.shape === 'tall') {
        // Below the cooking, not on it.
        expect(guest.y).toBeGreaterThan(layout.sceneY + 500);
      }
    });

    it(`puts the coins in the jar on the HUD, clear of the buttons and score (${name})`, () => {
      const box = walletSpot(layout, places);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(layout.width);
      for (const other of hud(layout))
        expect(overlaps(box, other), JSON.stringify(other)).toBe(false);
      // Clear of the recipe along the top.
      const recipe = { x: places.recipe.x - 190, y: places.recipe.y - 32, w: 380, h: 64 };
      expect(overlaps(box, recipe)).toBe(false);
    });

    it(`fits the stand's scenes on the canvas (${name})`, () => {
      const at = stageSpot(layout, places);
      const left = at.x + (STAGE.x - 400) * at.scale;
      const right = at.x + (STAGE.x + STAGE.w - 400) * at.scale;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(layout.width);
      expect(at.y - 250 * at.scale).toBeGreaterThanOrEqual(0);
      expect(at.y + 250 * at.scale).toBeLessThanOrEqual(layout.height);
      if (layout.shape === 'tall') {
        // Above Chef Bunny, and bigger than on a computer.
        expect(at.y + 250 * at.scale).toBeLessThanOrEqual(places.bunny.y - 90);
        expect(at.scale).toBeGreaterThan(1);
      }
    });
  }
});

describe('serving and the jar', () => {
  it('lands the coins one by one, counting them up', () => {
    const coins = roundCoins({ stars: 3, streak: 3, smart: true, paid: null });
    const n = coins.drops.length;
    const at = (age: number) => coinsLanded(age, n, SERVE.coins, SERVE.gap, SERVE.fly);
    expect(at(0)).toBe(0);
    expect(at(SERVE.coins + SERVE.fly - 0.01)).toBe(0);
    expect(at(SERVE.coins + SERVE.fly)).toBe(1);
    expect(at(SERVE.coins + SERVE.fly + SERVE.gap)).toBe(2);
    const { coinsEnd, leave, end } = serveTimes(n, false);
    expect(at(coinsEnd)).toBe(n);
    expect(countedSoFar(coins.drops, at(coinsEnd))).toBe(coins.total);
    expect(countedSoFar(coins.drops, 2)).toBe(20);
    expect(leave).toBeGreaterThan(coinsEnd);
    expect(end).toBeGreaterThan(leave);
    // A boss stays for the next dish, so serving is shorter.
    expect(serveTimes(n, true).end).toBeLessThan(end);
  });

  it('throws each coin in an arc from the paw to the jar', () => {
    const from = { x: 500, y: 330 };
    const to = { x: 270, y: 190 };
    expect(coinArc(from, to, 0)).toEqual(from);
    expect(coinArc(from, to, 1).x).toBeCloseTo(to.x);
    expect(coinArc(from, to, 1).y).toBeCloseTo(to.y);
    expect(coinArc(from, to, 0.5).y).toBeLessThan(Math.min(from.y, to.y));
  });
});

describe('drawing the stand', () => {
  it('draws every guest in every mood, the coins, the jar and the trophies', () => {
    const g = fakeCanvas();
    for (const guest of [...CUSTOMERS, ...BOSSES]) {
      for (const mood of ['idle', 'happy', 'wow'] as const) {
        drawGuest(g, guest, 100, 200, 0.8, {
          ...stillPose(1.3),
          mood,
          age: 0.4,
          walk: 0.7,
          wave: true,
        });
      }
    }
    for (const drop of [
      ...roundCoins({ stars: 2, streak: 4, smart: true, paid: ['quarter', 'penny'] }).drops,
      ...trophyCoins().drops,
    ]) {
      drawCoinDrop(g, drop, 10, 10, 20);
    }
    drawJar(g, 100, 300, 1, 0.5, 2);
    drawTrophy(g, 200, 200, 1, '👑', 2, 0.5);
    drawTrophyShadow(g, 200, 200, 0.5);
    drawWallet(g, { x: 0, y: 0, w: 112, h: 34 }, 140, 0.5);
    drawOrderCard(
      g,
      { x: 186, y: 344, w: 428, h: 152 },
      ['pizza', 'soup', 'tacos'].map(dishById),
      1,
      1,
      2,
    );
  });
});
