import { describe, expect, it } from 'vitest';
import {
  LONGEST,
  SCENE,
  TALL_MIN_HEIGHT,
  TALL_WIDTH,
  layoutFor,
  sameLayout,
  toScene,
} from './layout';

describe('layoutFor', () => {
  it('keeps the scene as the whole canvas on the page', () => {
    expect(layoutFor(1280, 800, false)).toEqual({
      shape: 'page',
      width: 800,
      height: 500,
      sceneX: 0,
      sceneY: 0,
    });
  });

  it('is tall on a phone held upright, matching its shape', () => {
    const layout = layoutFor(390, 844, true);
    expect(layout.shape).toBe('tall');
    expect(layout.width).toBe(TALL_WIDTH);
    expect(layout.height / layout.width).toBeCloseTo(844 / 390, 2);
  });

  it('keeps the middle of the scene in the middle of a tall canvas', () => {
    const layout = layoutFor(390, 844, true);
    expect(layout.sceneX + SCENE.width / 2).toBe(layout.width / 2);
  });

  it('puts the cooking below the top bar, and leaves room for Chef Bunny', () => {
    for (const [w, h] of [
      [390, 844],
      [360, 640],
      [430, 932],
      [768, 1024],
    ]) {
      const layout = layoutFor(w, h, true);
      // The scene's first drawing is at y 60; the top bar ends near 175.
      expect(layout.sceneY + 60).toBeGreaterThanOrEqual(175);
      // Chef Bunny needs about 260 under the scene's bottom.
      expect(layout.height - (layout.sceneY + SCENE.height)).toBeGreaterThanOrEqual(255);
    }
  });

  it('never makes a tall canvas shorter than the minimum, widening it instead', () => {
    const layout = layoutFor(768, 1024, true);
    expect(layout.height).toBe(TALL_MIN_HEIGHT);
    expect(layout.width).toBe(675);
    expect(layout.sceneX).toBe(-62);
  });

  it('caps a very tall screen', () => {
    expect(layoutFor(100, 1000, true).height).toBe(LONGEST);
  });

  it('is wide on a phone held sideways, with the scene in the middle at the bottom', () => {
    const layout = layoutFor(844, 390, true);
    expect(layout.shape).toBe('wide');
    expect(layout.height).toBe(SCENE.height);
    expect(layout.width).toBe(1082);
    expect(layout.sceneX).toBe(141);
    expect(layout.sceneY).toBe(0);
  });

  it('adds wall above the scene on a squarer screen held sideways', () => {
    const layout = layoutFor(1024, 768, true);
    expect(layout).toMatchObject({ shape: 'wide', width: 800, height: 600, sceneX: 0 });
    expect(layout.sceneY).toBe(100);
  });

  it('falls back to the page for a screen with no size', () => {
    expect(layoutFor(0, 0, true).shape).toBe('page');
  });
});

describe('toScene', () => {
  it('turns a canvas point into a scene point', () => {
    const layout = layoutFor(390, 844, true);
    const point = toScene(layout, layout.width / 2, layout.sceneY + 250);
    expect(point).toEqual({ x: 400, y: 250 });
  });
});

describe('sameLayout', () => {
  it('tells layouts apart', () => {
    expect(sameLayout(layoutFor(390, 844, true), layoutFor(390, 844, true))).toBe(true);
    expect(sameLayout(layoutFor(390, 844, true), layoutFor(844, 390, true))).toBe(false);
  });
});
