import {
  C,
  CONFETTI,
  type G,
  circle,
  fillStroke,
  heartPath,
  oval,
  palette,
  rounded,
  starPath,
  vertical,
} from './art';
import { drawLulu } from './ingredients/lobster-shells';
import type { Layout } from './layout';
import type { Outfit } from './wardrobe';

/**
 * The kitchens and their decorations: the wall, the window and its view,
 * the counter and cabinets, the shelf, the bunting, and what she's put up
 * from the shop (wallpaper, flags, fairy lights, a goldfish). Each chef rank
 * opens a kitchen (ranks.ts); wardrobe.ts has what's picked.
 *
 * Everything is drawn once into the kitchen's own canvas (render.ts
 * `paintKitchen`), behind the cooking. Walls stay light in every kitchen, so
 * the steps drawn on top stay easy to read.
 */

const K = palette({
  candyTop: '#e3fbf1',
  candyBottom: '#ffd9ec',
  candyCounter: '#fff0f7',
  spaceTop: '#eef0fd',
  spaceBottom: '#d5dbf6',
  spaceSky: '#2e2358',
  spaceSkyLow: '#5a4796',
  spaceCabinet: '#c3cff0',
  spaceCabinetLight: '#e2e8fb',
  spaceGlow: '#7ff3ff',
  seaTop: '#e0f8f7',
  seaBottom: '#b9eaf0',
  seaDeep: '#3f9fd8',
  sand: '#f6dfa8',
  seaCabinet: '#9fe0d0',
  seaCabinetLight: '#cff3ea',
  palaceTop: '#fff8e2',
  palaceBottom: '#ffe8b3',
  palaceSky: '#ffd27a',
  palaceCabinet: '#fff7ee',
  palaceCabinetLight: '#ffffff',
  water: '#bfe6ff',
  fish: '#ff9a3d',
});

/** What a kitchen looks like. Its window's view is drawn by `drawView`. */
export interface Theme {
  id: string;
  wall: [string, string];
  counterTop: string;
  counterFront: string;
  counterEdge: string;
  cabinet: string;
  cabinetLight: string;
  knob: 'heart' | 'candy' | 'star' | 'shell' | 'crown';
  window: 'square' | 'round' | 'arch';
  frame: string;
  curtain: string;
  rod: string;
}

export const THEMES: Record<string, Theme> = {
  tent: {
    id: 'tent',
    wall: [C.wallTop, C.wallBottom],
    counterTop: C.counterTop,
    counterFront: C.cream,
    counterEdge: C.counterEdge,
    cabinet: C.cabinet,
    cabinetLight: C.cabinetLight,
    knob: 'heart',
    window: 'square',
    frame: C.white,
    curtain: C.pink,
    rod: C.hotPink,
  },
  candy: {
    id: 'candy',
    wall: [K.candyTop, K.candyBottom],
    counterTop: K.candyCounter,
    counterFront: C.white,
    counterEdge: C.pink,
    cabinet: C.lavender,
    cabinetLight: C.lavenderLight,
    knob: 'candy',
    window: 'square',
    frame: C.pink,
    curtain: C.mint,
    rod: C.hotPink,
  },
  space: {
    id: 'space',
    wall: [K.spaceTop, K.spaceBottom],
    counterTop: C.steel,
    counterFront: C.white,
    counterEdge: C.steelDark,
    cabinet: K.spaceCabinet,
    cabinetLight: K.spaceCabinetLight,
    knob: 'star',
    window: 'round',
    frame: C.steel,
    curtain: C.lavender,
    rod: C.purple,
  },
  underwater: {
    id: 'underwater',
    wall: [K.seaTop, K.seaBottom],
    counterTop: K.sand,
    counterFront: C.cream,
    counterEdge: C.woodLight,
    cabinet: K.seaCabinet,
    cabinetLight: K.seaCabinetLight,
    knob: 'shell',
    window: 'round',
    frame: C.gold,
    curtain: C.sky,
    rod: C.skyDark,
  },
  palace: {
    id: 'palace',
    wall: [K.palaceTop, K.palaceBottom],
    counterTop: C.white,
    counterFront: C.cream,
    counterEdge: C.gold,
    cabinet: K.palaceCabinet,
    cabinetLight: K.palaceCabinetLight,
    knob: 'crown',
    window: 'arch',
    frame: C.gold,
    curtain: C.hotPink,
    rod: C.gold,
  },
};

export const themeOf = (id: string): Theme => THEMES[id] ?? THEMES.tent;

/** The bunting's flag colours for each set of flags. */
export const BUNTING: Record<string, string[]> = {
  'rainbow-bunting': [C.hotPink, C.butter, C.mint, C.sky, C.lavender],
  'berry-bunting': [C.hotPink, C.pink, C.white, C.berry],
  'ocean-bunting': [C.sky, C.skyDark, C.white, C.mint],
  'gold-bunting': [C.gold, C.butter, C.white],
};

/** What the kitchen shows: its slots of the outfit. */
export type KitchenLook = Pick<Outfit, 'kitchen' | 'wallpaper' | 'bunting' | 'shelf' | 'lights'>;

export const PLAIN_KITCHEN: KitchenLook = {
  kitchen: 'tent',
  wallpaper: 'hearts-wallpaper',
  bunting: 'rainbow-bunting',
  shelf: '',
  lights: '',
};

/** Whether two kitchen looks are the same, so the kitchen isn't painted again for nothing. */
export function sameKitchen(a: KitchenLook, b: KitchenLook): boolean {
  return (
    a.kitchen === b.kitchen &&
    a.wallpaper === b.wallpaper &&
    a.bunting === b.bunting &&
    a.shelf === b.shelf &&
    a.lights === b.lights
  );
}

// ---------------------------------------------------------------------------
// Pieces

/** The wallpaper's pattern over a wall from (0, top) to (width, bottom). */
export function drawWallpaper(g: G, id: string, width: number, top: number, bottom: number) {
  const rows = Math.floor((bottom - top) / 36) + 1;
  const cols = Math.ceil(width / 40) + 1;
  if (id === 'stripes-wallpaper') {
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let x = 10; x < width; x += 56) g.fillRect(x, 0, 24, bottom);
    g.fillStyle = 'rgba(255, 95, 162, 0.12)';
    for (let x = 38; x < width; x += 56) g.fillRect(x, 0, 6, bottom);
    return;
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * 40 + (row % 2) * 20;
      const y = top + row * 36;
      const mark = (row + col) % 3 === 0;
      if (id === 'stars-wallpaper') {
        starPath(g, x, y, mark ? 7 : 4, (row + col) * 0.4);
        g.fillStyle = mark ? 'rgba(255, 201, 60, 0.35)' : 'rgba(255, 255, 255, 0.75)';
        g.fill();
      } else if (id === 'dots-wallpaper') {
        if ((row + col) % 2) continue;
        circle(g, x, y, 9);
        g.globalAlpha = 0.22;
        g.fillStyle = CONFETTI[(row * 3 + col) % CONFETTI.length];
        g.fill();
        g.globalAlpha = 1;
      } else if (id === 'flowers-wallpaper') {
        if (mark) {
          g.fillStyle = 'rgba(255, 255, 255, 0.8)';
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            circle(g, x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4);
            g.fill();
          }
          g.fillStyle = 'rgba(255, 201, 60, 0.6)';
          circle(g, x, y, 3);
          g.fill();
        } else {
          g.fillStyle = 'rgba(111, 214, 122, 0.25)';
          oval(g, x, y, 5, 2.4, 0.6);
          g.fill();
        }
      } else if (mark) {
        g.fillStyle = 'rgba(255, 95, 162, 0.13)';
        heartPath(g, x, y, 6);
        g.fill();
      } else {
        g.fillStyle = 'rgba(255, 255, 255, 0.7)';
        circle(g, x, y, 2.6);
        g.fill();
      }
    }
  }
}

/** The window's inner shape, in the window's own units (the scene's at the left). */
function windowPath(g: G, shape: Theme['window'], inset: number) {
  if (shape === 'round') {
    circle(g, 101, 166, 48 + inset);
  } else if (shape === 'arch') {
    g.beginPath();
    g.moveTo(36 - inset, 210 + inset);
    g.lineTo(36 - inset, 160);
    g.arc(101, 160, 65 + inset, Math.PI, 0);
    g.lineTo(166 + inset, 210 + inset);
    g.closePath();
  } else {
    rounded(g, 36 - inset, 122 - inset, 130 + 2 * inset, 88 + 2 * inset, 12 + inset * 0.6);
  }
}

/** What's outside the window: sky, candy hills, space, the sea with Lulu, a palace. */
export function drawView(g: G, id: string) {
  const x0 = 30;
  const x1 = 172;
  if (id === 'candy') {
    g.fillStyle = vertical(g, 90, 214, [C.lavenderLight, C.pink]);
    g.fillRect(x0, 90, x1 - x0, 124);
    oval(g, 70, 222, 58, 36);
    fillStroke(g, C.mint, 3);
    oval(g, 150, 226, 52, 34);
    fillStroke(g, C.pink, 3);
    // A gumdrop castle.
    rounded(g, 112, 158, 40, 46, 4);
    fillStroke(g, C.hotPink, 3);
    for (const tx of [112, 152]) {
      g.beginPath();
      g.moveTo(tx - 9, 160);
      g.lineTo(tx, 136);
      g.lineTo(tx + 9, 160);
      g.closePath();
      fillStroke(g, C.lavender, 3);
    }
    rounded(g, 126, 182, 12, 22, 6);
    fillStroke(g, C.butter, 2.5);
    // A lollipop tree.
    g.strokeStyle = C.white;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(66, 200);
    g.lineTo(66, 168);
    g.stroke();
    circle(g, 66, 160, 12);
    fillStroke(g, C.butter, 3);
    g.strokeStyle = C.hotPink;
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(66, 160, 6, 0, Math.PI * 1.6);
    g.stroke();
    return;
  }
  if (id === 'space') {
    g.fillStyle = vertical(g, 110, 222, [K.spaceSky, K.spaceSkyLow]);
    g.fillRect(x0, 100, x1 - x0, 124);
    g.fillStyle = C.white;
    for (const [sx, sy, r] of [
      [62, 134, 1.6],
      [80, 190, 1.2],
      [140, 196, 1.8],
      [96, 128, 1.1],
      [70, 168, 1],
      [150, 128, 1.4],
      [118, 202, 1],
    ]) {
      circle(g, sx, sy, r);
      g.fill();
    }
    starPath(g, 78, 150, 5);
    fillStroke(g, C.butter, 1.5);
    // A ringed planet and a little moon.
    circle(g, 124, 162, 17);
    fillStroke(g, C.pink, 3);
    oval(g, 124, 162, 30, 7, -0.3);
    g.lineWidth = 3;
    g.strokeStyle = C.butter;
    g.stroke();
    circle(g, 84, 196, 8);
    fillStroke(g, C.steel, 2.5);
    return;
  }
  if (id === 'underwater') {
    g.fillStyle = vertical(g, 110, 222, [C.sky, K.seaDeep]);
    g.fillRect(x0, 100, x1 - x0, 124);
    oval(g, 101, 226, 70, 22);
    fillStroke(g, K.sand, 2.5);
    g.strokeStyle = C.leafDark;
    g.lineWidth = 4;
    g.lineCap = 'round';
    for (const sx of [64, 138]) {
      g.beginPath();
      for (let k = 0; k <= 5; k++) g.lineTo(sx + Math.sin(k * 1.4) * 5, 212 - k * 11);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    g.lineWidth = 1.8;
    for (const [bx, by, r] of [
      [128, 130, 4],
      [136, 142, 3],
      [74, 136, 3.5],
    ]) {
      circle(g, bx, by, r);
      g.stroke();
    }
    drawLulu(g, 101, 178, 13, 0.4);
    return;
  }
  if (id === 'palace') {
    g.fillStyle = vertical(g, 92, 214, [K.palaceSky, C.pink]);
    g.fillRect(x0, 90, x1 - x0, 124);
    circle(g, 70, 190, 18);
    g.fillStyle = C.butter;
    g.fill();
    // Golden towers with pink flags.
    for (const [tx, top, w] of [
      [96, 150, 18],
      [122, 132, 22],
      [148, 156, 18],
    ]) {
      g.strokeStyle = C.ink;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(tx, top - 14);
      g.lineTo(tx, top - 26);
      g.stroke();
      g.beginPath();
      g.moveTo(tx, top - 26);
      g.lineTo(tx + 10, top - 22);
      g.lineTo(tx, top - 18);
      g.closePath();
      fillStroke(g, C.hotPink, 1.5);
      g.beginPath();
      g.moveTo(tx - w / 2 - 3, top);
      g.lineTo(tx, top - 14);
      g.lineTo(tx + w / 2 + 3, top);
      g.closePath();
      fillStroke(g, C.hotPink, 2.5);
      g.beginPath();
      g.rect(tx - w / 2, top, w, 214 - top);
      fillStroke(g, C.gold, 2.5);
    }
    return;
  }
  // The carnival tent's: a sunny sky with clouds.
  g.fillStyle = vertical(g, 122, 210, [C.sky, C.skyLight]);
  g.fillRect(x0, 100, x1 - x0, 124);
  g.fillStyle = C.butter;
  circle(g, 140, 146, 14);
  g.fill();
  g.fillStyle = C.white;
  for (const [x, y, r] of [
    [62, 160, 11],
    [76, 154, 14],
    [92, 162, 10],
    [100, 190, 8],
    [112, 186, 11],
    [124, 192, 8],
  ]) {
    circle(g, x, y, r);
    g.fill();
  }
}

/** The window, in its kitchen's shape, with its view, bars and curtains. */
export function drawWindow(g: G, theme: Theme) {
  windowPath(g, theme.window, 10);
  fillStroke(g, theme.frame);
  g.save();
  windowPath(g, theme.window, 0);
  g.clip();
  drawView(g, theme.id);
  g.restore();
  windowPath(g, theme.window, 0);
  g.lineWidth = 3;
  g.strokeStyle = C.ink;
  g.stroke();
  if (theme.window === 'round') {
    // Rivets round a porthole.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      circle(g, 101 + Math.cos(a) * 53, 166 + Math.sin(a) * 53, 2.6);
      fillStroke(g, C.white, 1.5);
    }
    return;
  }
  if (theme.id === 'tent' || theme.id === 'candy') {
    g.strokeStyle = theme.frame;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(101, 122);
    g.lineTo(101, 210);
    g.moveTo(36, 166);
    g.lineTo(166, 166);
    g.stroke();
  }
  for (const side of [-1, 1]) {
    const x = side < 0 ? 22 : 180;
    g.beginPath();
    g.moveTo(x, 104);
    g.lineTo(x + side * -46, 104);
    g.quadraticCurveTo(x + side * -18, 150, x + side * -6, 226);
    g.lineTo(x, 226);
    g.closePath();
    fillStroke(g, theme.curtain, 3.5);
  }
  rounded(g, 12, 98, 178, 12, 6);
  fillStroke(g, theme.rod, 3.5);
}

/** A cabinet door's knob, in its kitchen's style. */
function drawKnob(g: G, knob: Theme['knob'], x: number, y: number) {
  if (knob === 'candy') {
    circle(g, x, y, 7);
    fillStroke(g, C.white, 2.5);
    g.strokeStyle = C.hotPink;
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(x, y, 3.5, 0, Math.PI * 1.5);
    g.stroke();
  } else if (knob === 'star') {
    starPath(g, x, y, 8);
    fillStroke(g, C.butter, 2.5);
  } else if (knob === 'shell') {
    g.beginPath();
    g.moveTo(x - 8, y + 5);
    g.quadraticCurveTo(x, y - 12, x + 8, y + 5);
    g.closePath();
    fillStroke(g, C.pink, 2.5);
  } else if (knob === 'crown') {
    g.beginPath();
    g.moveTo(x - 8, y + 5);
    g.lineTo(x - 9, y - 5);
    g.lineTo(x - 4, y);
    g.lineTo(x, y - 7);
    g.lineTo(x + 4, y);
    g.lineTo(x + 9, y - 5);
    g.lineTo(x + 8, y + 5);
    g.closePath();
    fillStroke(g, C.gold, 2.5);
  } else {
    heartPath(g, x, y, 6);
    fillStroke(g, C.hotPink, 2.5);
  }
}

/** The bunting's flags along the top: `sag` is the string's height at x. */
function drawBunting(g: G, width: number, colors: string[]) {
  const sag = (x: number) => 10 + Math.sin((Math.PI * x) / width) * 22;
  g.strokeStyle = C.ink;
  g.lineWidth = 2.5;
  g.beginPath();
  for (let x = 0; x <= width; x += 10) g.lineTo(x, sag(x));
  g.stroke();
  const count = Math.round((width - 25) / 47.5) + 1;
  const step = (width - 50) / (count - 1);
  for (let i = 0; i < count; i++) {
    const x = 25 + i * step;
    const y = sag(x);
    g.beginPath();
    g.moveTo(x - 17, y);
    g.lineTo(x + 17, sag(x + 17));
    g.lineTo(x, y + 32);
    g.closePath();
    fillStroke(g, colors[i % colors.length], 3);
  }
}

/** Fairy lights strung under the bunting, glowing. */
export function drawLights(g: G, width: number, y0 = 58) {
  const sag = (x: number) => y0 + Math.sin((Math.PI * x * 3) / width) * 8;
  g.strokeStyle = C.leafDark;
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 0; x <= width; x += 8) g.lineTo(x, sag(x));
  g.stroke();
  const bulbs = [C.butter, C.hotPink, C.sky, C.mint, C.lavender];
  let i = 0;
  for (let x = 14; x < width; x += 34) {
    const y = sag(x) + 6;
    const glow = g.createRadialGradient(x, y, 1, x, y, 15);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    g.fillStyle = glow;
    circle(g, x, y, 15);
    g.fill();
    oval(g, x, y, 4.5, 6);
    fillStroke(g, bulbs[i++ % bulbs.length], 1.8);
  }
}

/** A goldfish in a round bowl, sitting on its bottom at (x, y). */
export function drawFishbowl(g: G, x: number, y: number, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  oval(g, 0, 0, 20, 4);
  g.fillStyle = C.shadow;
  g.fill();
  circle(g, 0, -20, 21);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.fill();
  g.save();
  circle(g, 0, -20, 21);
  g.clip();
  g.fillStyle = K.water;
  g.fillRect(-22, -30, 44, 32);
  g.fillStyle = K.sand;
  g.fillRect(-22, -6, 44, 8);
  g.restore();
  // A little weed and the fish.
  g.strokeStyle = C.leafDark;
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(-10, -4);
  g.quadraticCurveTo(-15, -12, -9, -20);
  g.stroke();
  g.beginPath();
  g.moveTo(10, -18);
  g.lineTo(18, -24);
  g.lineTo(18, -12);
  g.closePath();
  fillStroke(g, K.fish, 1.8);
  oval(g, 3, -18, 9, 6.5);
  fillStroke(g, K.fish, 1.8);
  g.fillStyle = C.ink;
  circle(g, -1, -19, 1.6);
  g.fill();
  circle(g, 0, -20, 21);
  g.lineWidth = 2.5;
  g.strokeStyle = C.ink;
  g.stroke();
  oval(g, 0, -40, 13, 3.5);
  fillStroke(g, C.white, 2);
  g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, -20, 15, Math.PI * 1.1, Math.PI * 1.35);
  g.stroke();
  g.restore();
}

/** The shelf of jars and a little plant, at the scene's right. */
function drawShelf(g: G, dx: number, dy: number) {
  g.save();
  g.translate(dx, dy);
  rounded(g, 664, 198, 128, 14, 6);
  fillStroke(g, C.wood, 3.5);
  rounded(g, 676, 152, 34, 46, 10);
  fillStroke(g, C.mint, 3.5);
  rounded(g, 672, 144, 42, 12, 5);
  fillStroke(g, C.hotPink, 3);
  heartPath(g, 693, 175, 7);
  fillStroke(g, C.white, 2);
  rounded(g, 718, 162, 30, 36, 9);
  fillStroke(g, C.butter, 3.5);
  rounded(g, 715, 155, 36, 10, 5);
  fillStroke(g, C.lavender, 3);
  starPath(g, 733, 181, 7);
  fillStroke(g, C.white, 2);
  for (const [x, y, rot] of [
    [764, 150, -0.6],
    [776, 144, 0],
    [788, 150, 0.6],
  ]) {
    oval(g, x, y, 6, 13, rot);
    fillStroke(g, C.leaf, 3);
  }
  g.beginPath();
  g.moveTo(760, 166);
  g.lineTo(792, 166);
  g.lineTo(787, 198);
  g.lineTo(765, 198);
  g.closePath();
  fillStroke(g, C.hotPink, 3.5);
  g.restore();
}

/** Something special on each kitchen's walls, kept to the edges and the counter. */
function drawTrim(g: G, theme: Theme, width: number, counter: number, part: 'wall' | 'counter') {
  if (part === 'counter') {
    if (theme.id === 'space') {
      g.fillStyle = K.spaceGlow;
      g.fillRect(0, counter + 40, width, 5);
    }
    if (theme.id !== 'candy') return;
  }
  if (theme.id === 'candy') {
    if (part === 'wall') return;
    // Pink icing dripping over the counter's edge.
    g.fillStyle = C.pink;
    g.beginPath();
    g.moveTo(0, counter);
    for (let x = 0; x <= width; x += 30) {
      g.lineTo(x, counter + 8);
      g.quadraticCurveTo(x + 7, counter + 22 + ((x / 30) % 3) * 5, x + 14, counter + 8);
    }
    g.lineTo(width, counter);
    g.closePath();
    g.fill();
  } else if (theme.id === 'space') {
    // Panels and rivets, and a glowing stripe along the counter.
    g.strokeStyle = 'rgba(91, 59, 79, 0.1)';
    g.lineWidth = 3;
    for (let x = 120; x < width; x += 240) {
      g.beginPath();
      g.moveTo(x, 70);
      g.lineTo(x, counter);
      g.stroke();
    }
    g.fillStyle = 'rgba(91, 59, 79, 0.14)';
    for (let x = 120; x < width; x += 240) {
      for (let y = 90; y < counter; y += 60) {
        circle(g, x - 10, y, 2.5);
        g.fill();
        circle(g, x + 10, y, 2.5);
        g.fill();
      }
    }
  } else if (theme.id === 'underwater') {
    // Bubbles rising up the wall, and seaweed at the ends of the counter.
    g.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    g.lineWidth = 2;
    for (let i = 0; i < Math.ceil(width / 70); i++) {
      const x = 35 + i * 70 + (i % 2) * 18;
      const y = 90 + ((i * 53) % Math.max(60, counter - 140));
      circle(g, x, y, 4 + (i % 3) * 2);
      g.stroke();
    }
    g.strokeStyle = C.leafDark;
    g.lineWidth = 7;
    g.lineCap = 'round';
    for (const sx of [14, width - 14]) {
      g.beginPath();
      for (let k = 0; k <= 8; k++) g.lineTo(sx + Math.sin(k * 1.2) * 8, counter - k * 16);
      g.stroke();
    }
  } else if (theme.id === 'palace') {
    // Gold rails along the wall.
    g.fillStyle = C.gold;
    g.fillRect(0, counter - 26, width, 5);
    g.fillRect(0, 74, width, 4);
  }
}

// ---------------------------------------------------------------------------
// The whole kitchen

/**
 * The kitchen, filling a canvas of any layout. The counter lines up with the
 * scene's counter, and the window and shelf sit where the scene expects them.
 * `shelf` is whether there's room for the shelf (render.ts `placesFor`).
 */
export function drawKitchen(
  g: G,
  layout: Layout,
  look: KitchenLook = PLAIN_KITCHEN,
  shelf = false,
) {
  const { width, height, sceneX } = layout;
  const counter = layout.sceneY + 338;
  const theme = themeOf(look.kitchen);

  // The wall, with its wallpaper.
  g.fillStyle = vertical(g, 0, counter + 2, theme.wall);
  g.fillRect(0, 0, width, counter + 2);
  drawWallpaper(g, look.wallpaper, width, 60, counter);
  drawTrim(g, theme, width, counter, 'wall');

  // The window at the scene's left (or the canvas's, if the scene is wider
  // than the canvas), and the goldfish on its sill.
  g.save();
  g.translate(Math.max(0, sceneX), counter - 338);
  drawWindow(g, theme);
  if (look.shelf === 'goldfish') {
    rounded(g, 16, 222, 172, 10, 5);
    fillStroke(g, C.wood, 3);
    drawFishbowl(g, 150, 224, 0.95);
  }
  g.restore();

  if (shelf) drawShelf(g, sceneX, counter - 338);

  // The counter top and the cabinets below it.
  g.fillStyle = vertical(g, counter, counter + 92, [theme.counterTop, theme.counterFront]);
  g.fillRect(0, counter, width, 92);
  drawTrim(g, theme, width, counter, 'counter');
  g.strokeStyle = C.ink;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, counter);
  g.lineTo(width, counter);
  g.stroke();
  rounded(g, -10, counter + 86, width + 20, 16, 8);
  fillStroke(g, theme.counterEdge);
  g.fillStyle = theme.cabinet;
  g.fillRect(0, counter + 102, width, height - counter - 102);
  const doors = Math.max(1, Math.round(width / 197));
  const left = (width - (doors * 197 - 16)) / 2;
  for (let y = counter + 114; y < height; y += 84) {
    for (let i = 0; i < doors; i++) {
      const x = left + i * 197;
      rounded(g, x, y, 181, 70, 14);
      fillStroke(g, theme.cabinetLight, 3.5);
      drawKnob(g, theme.knob, x + 90.5, y + 14);
    }
  }

  drawBunting(g, width, BUNTING[look.bunting] ?? BUNTING['rainbow-bunting']);
  if (look.lights === 'fairy-lights') drawLights(g, width);
}

// ---------------------------------------------------------------------------
// The shop's pictures of decorations and kitchens

/** A picture of a decoration or a kitchen, centred on the origin, about 100×80. */
export function drawDecorIcon(g: G, id: string, slot: string) {
  if (slot === 'kitchen') {
    g.save();
    g.scale(0.62, 0.62);
    g.translate(-101, -166);
    const theme = themeOf(id);
    rounded(g, 8, 226, 186, 20, 8);
    fillStroke(g, theme.counterEdge, 3);
    drawWindow(g, theme);
    g.restore();
    return;
  }
  if (slot === 'wallpaper') {
    g.save();
    rounded(g, -46, -36, 92, 72, 14);
    g.fillStyle = vertical(g, -36, 36, [C.wallTop, C.wallBottom]);
    g.fill();
    g.clip();
    g.translate(-46, -36);
    g.scale(1.5, 1.5);
    drawWallpaper(g, id, 66, 8, 50);
    g.restore();
    rounded(g, -46, -36, 92, 72, 14);
    g.lineWidth = 3;
    g.strokeStyle = C.ink;
    g.stroke();
    return;
  }
  if (slot === 'bunting') {
    g.save();
    g.translate(-50, -26);
    drawBunting(g, 100, BUNTING[id] ?? BUNTING['rainbow-bunting']);
    g.restore();
    return;
  }
  if (slot === 'lights') {
    g.save();
    g.translate(-50, -16);
    drawLights(g, 100, 0);
    g.restore();
    return;
  }
  if (slot === 'shelf') drawFishbowl(g, 0, 30, 1.4);
}
