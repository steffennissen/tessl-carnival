/**
 * How the kitchen fits the screen.
 *
 * Every step is cooked on an 800×500 scene, and the game logic only ever sees
 * scene coordinates. The canvas around it changes shape:
 *
 * - **page**: on a computer, the canvas is the scene, inside the carnival page.
 * - **wide**: on a phone or tablet held sideways, the canvas fills the screen
 *   and the kitchen stretches to the sides (or up) around the scene.
 * - **tall**: on a phone held upright, the canvas fills the screen, the cooking
 *   sits in the middle, the score and recipe go on top and Chef Bunny stands
 *   at the bottom.
 *
 * In every shape the scene's middle is the canvas's middle.
 */

/** The scene every step is cooked on. */
export const SCENE = { width: 800, height: 500 } as const;

/** The canvas width of the tall shape, and the height it never goes below. */
export const TALL_WIDTH = 600;
export const TALL_MIN_HEIGHT = 900;

/** Long sides are capped, so an odd window doesn't stretch the kitchen thin. */
export const LONGEST = 1440;

/** Phones held upright are narrower than this (in CSS pixels). */
export const NARROW = 600;

export type Shape = 'page' | 'wide' | 'tall';

/** What the browser says about the device, for `fillsScreen`. */
export interface Device {
  /** Whether the main pointer is a finger: `(pointer: coarse)`. */
  coarse: boolean;
  /** `navigator.maxTouchPoints`. */
  touchPoints: number;
  /** `navigator.platform`, such as 'MacIntel' or 'iPhone'. */
  platform: string;
  /** The window's width, in CSS pixels. */
  viewWidth: number;
}

/**
 * Whether it's a phone or tablet. An iPad says it's a Mac, and with a
 * keyboard or trackpad attached its main pointer isn't a finger, so it's
 * known by being a "Mac" with a touch screen.
 */
export function isTouchDevice(device: Device): boolean {
  const iPad = device.platform === 'MacIntel' && device.touchPoints > 1;
  return device.coarse || iPad;
}

/** Whether the game fills the screen: on phones and tablets, and in a narrow window. */
export function fillsScreen(device: Device): boolean {
  return isTouchDevice(device) || device.viewWidth < NARROW;
}

export interface Layout {
  shape: Shape;
  /** The canvas size, in canvas units. */
  width: number;
  height: number;
  /** Where the scene's top-left corner sits on the canvas. */
  sceneX: number;
  sceneY: number;
}

/**
 * The layout for a screen of this size (in CSS pixels). `full` is whether the
 * game fills the screen, as it does on phones and tablets.
 */
export function layoutFor(viewWidth: number, viewHeight: number, full: boolean): Layout {
  if (!full || viewWidth <= 0 || viewHeight <= 0) {
    return { shape: 'page', width: SCENE.width, height: SCENE.height, sceneX: 0, sceneY: 0 };
  }
  const aspect = viewHeight / viewWidth;
  if (aspect > 1) {
    // Upright: 600 wide, as tall as the screen's shape needs.
    const height = Math.min(LONGEST, Math.max(TALL_MIN_HEIGHT, Math.round(TALL_WIDTH * aspect)));
    const width = Math.min(SCENE.width, Math.max(TALL_WIDTH, Math.round(height / aspect)));
    return {
      shape: 'tall',
      width,
      height,
      sceneX: Math.round((width - SCENE.width) / 2),
      // Taller screens get more wall above and more cabinets below.
      sceneY: 115 + Math.round((height - TALL_MIN_HEIGHT) * 0.5),
    };
  }
  // Sideways: the scene's height, or its width, and the rest is more kitchen.
  const wider = 1 / aspect >= SCENE.width / SCENE.height;
  const width = wider ? Math.min(LONGEST, Math.round(SCENE.height / aspect)) : SCENE.width;
  const height = wider ? SCENE.height : Math.round(SCENE.width * aspect);
  return {
    shape: 'wide',
    width,
    height,
    sceneX: Math.round((width - SCENE.width) / 2),
    sceneY: height - SCENE.height,
  };
}

/** The scene point under a canvas point. */
export function toScene(layout: Layout, x: number, y: number): { x: number; y: number } {
  return { x: x - layout.sceneX, y: y - layout.sceneY };
}

/** Whether two layouts are the same. */
export function sameLayout(a: Layout, b: Layout): boolean {
  return (
    a.shape === b.shape &&
    a.width === b.width &&
    a.height === b.height &&
    a.sceneX === b.sceneX &&
    a.sceneY === b.sceneY
  );
}
