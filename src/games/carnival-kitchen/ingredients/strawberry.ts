import { C, type G, face, fillStroke, oval, palette, vertical, type Mood } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
export const BERRY = palette({
  light: '#ff8f9c',
  main: '#ff5a6e',
  dark: '#e23a55',
  inside: '#ffc4cc',
  core: '#fff0f2',
  seed: '#ffe58a',
});

/**
 * Draws something chopped along the board in pieces, by clipping the whole
 * thing to each piece. `outline` builds the whole thing's path, `paint` fills
 * it (and adds any details while it's clipped), `mid(x)` and `radius(x)` give
 * its middle and half-height at x, for the cut faces, and `cut(x)` paints a
 * cut face there. Banana and celery draw with it too.
 */
export function drawChopPieces(
  g: G,
  bounds: number[],
  look: {
    outline: () => void;
    paint: () => void;
    mid: (x: number) => number;
    radius: (x: number) => number;
    cut: (x: number) => void;
  },
) {
  for (let k = 0; k < bounds.length - 1; k++) {
    const first = k === 0;
    const last = k === bounds.length - 2;
    const a = first ? bounds[k] - 120 : bounds[k] + 3;
    const b = last ? bounds[k + 1] + 120 : bounds[k + 1] - 3;
    g.save();
    g.beginPath();
    g.rect(a, -1000, b - a, 3000);
    g.clip();
    look.outline();
    look.paint();
    g.restore();
    if (!last) {
      // The cut edge on the left piece's right.
      const r = look.radius(b);
      g.strokeStyle = C.ink;
      g.lineWidth = 3.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(b, look.mid(b) - r);
      g.lineTo(b, look.mid(b) + r);
      g.stroke();
    }
    if (!first) look.cut(a);
  }
}

/** The berry's shape: round shoulders at the top, a soft point at the bottom. */
function berryPath(g: G, s: number) {
  g.beginPath();
  g.moveTo(0, s);
  g.bezierCurveTo(-s * 1.15, s * 0.35, -s * 1.1, -s * 0.8, 0, -s * 0.62);
  g.bezierCurveTo(s * 1.1, -s * 0.8, s * 1.15, s * 0.35, 0, s);
  g.closePath();
}

/** The green leafy cap: five pointy leaves round a stalk. */
function drawCap(g: G, x: number, y: number, s: number) {
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.92 + i * 0.29);
    g.save();
    g.translate(x, y);
    g.rotate(a + Math.PI / 2);
    g.beginPath();
    g.moveTo(-s * 0.18, 0);
    g.quadraticCurveTo(0, -s * 0.75, s * 0.18, 0);
    g.closePath();
    fillStroke(g, C.leaf, Math.max(1.5, s * 0.08));
    g.restore();
  }
  g.beginPath();
  g.moveTo(x, y - s * 0.1);
  g.quadraticCurveTo(x + s * 0.05, y - s * 0.45, x + s * 0.18, y - s * 0.55);
  g.lineWidth = Math.max(2, s * 0.12);
  g.strokeStyle = C.leafDark;
  g.stroke();
}

/** A whole strawberry centred on (x, y), `s` about its half-height, with a face if given a mood. */
export function drawStrawberry(g: G, x: number, y: number, s: number, mood?: Mood) {
  g.save();
  g.translate(x, y);
  berryPath(g, s);
  const body = g.createRadialGradient(-s * 0.35, -s * 0.3, s * 0.1, 0, 0, s * 1.2);
  body.addColorStop(0, BERRY.light);
  body.addColorStop(0.55, BERRY.main);
  body.addColorStop(1, BERRY.dark);
  fillStroke(g, body, Math.max(2, s * 0.1));
  g.fillStyle = BERRY.seed;
  for (const [sx, sy] of [
    [-0.5, -0.25],
    [0, -0.3],
    [0.5, -0.25],
    [-0.3, 0.15],
    [0.3, 0.15],
    [-0.62, 0.05],
    [0.62, 0.05],
    [0, 0.5],
    [-0.15, 0.75],
    [0.15, 0.75],
  ]) {
    if (mood && Math.abs(sx) < 0.45 && sy > -0.35 && sy < 0.3) continue;
    oval(g, sx * s, sy * s, s * 0.05, s * 0.08);
    g.fill();
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  oval(g, -s * 0.45, -s * 0.3, s * 0.12, s * 0.22, 0.5);
  g.fill();
  if (mood) face(g, 0, 0, s / 30, mood);
  g.restore();
  drawCap(g, x, y - s * 0.62, s);
}

/** A strawberry cut in half, seen from the cut side: pink inside with a pale heart. */
export function drawStrawberryHalf(g: G, x: number, y: number, s: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  berryPath(g, s);
  fillStroke(g, BERRY.main, Math.max(1.5, s * 0.1));
  g.save();
  g.scale(0.8, 0.8);
  berryPath(g, s);
  g.restore();
  g.fillStyle = BERRY.inside;
  g.fill();
  g.save();
  g.scale(0.4, 0.5);
  berryPath(g, s);
  g.restore();
  g.fillStyle = BERRY.core;
  g.fill();
  g.restore();
}

const strawberry: Ingredient = {
  id: 'strawberry',
  label: 'strawberry',
  plural: 'strawberries',
  icon: '🍓',
  colors: [BERRY.main, BERRY.light, BERRY.seed],

  /** A big strawberry lying on its side: the point on the left, the leafy cap on the right. */
  chop: {
    draw(g, { bounds, cy, x0, x1 }) {
      const span = x1 - x0;
      const radius = (x: number) => {
        const u = Math.min(1, Math.max(0, (x - x0) / span));
        if (u < 0.62) return 5 + 37 * Math.sin((u / 0.62) * (Math.PI / 2)) ** 0.6;
        const v = (u - 0.62) / 0.38;
        return 42 * Math.sqrt(Math.max(0, 1 - v ** 4 * 0.85));
      };
      const outline = () => {
        g.beginPath();
        for (let i = 0; i <= 48; i++) {
          const x = x0 + (span * i) / 48;
          g.lineTo(x, cy - radius(x));
        }
        for (let i = 48; i >= 0; i--) {
          const x = x0 + (span * i) / 48;
          g.lineTo(x, cy + radius(x));
        }
        g.closePath();
      };
      drawChopPieces(g, bounds, {
        outline,
        mid: () => cy,
        radius,
        paint() {
          fillStroke(g, vertical(g, cy - 38, cy + 38, [BERRY.light, BERRY.main, BERRY.dark]), 3.5);
          g.fillStyle = BERRY.seed;
          for (let i = 0; i < 26; i++) {
            const x = x0 + 30 + ((i * 53) % (span - 60));
            const r = radius(x);
            const y = cy + (((i * 37) % 100) / 100 - 0.5) * r * 1.4;
            if (x > 548 && Math.abs(y - cy) < 14) continue;
            oval(g, x, y, 2.4, 3.6, 0.3);
            g.fill();
          }
          g.fillStyle = 'rgba(255, 255, 255, 0.45)';
          oval(g, x0 + span * 0.55, cy - 22, 50, 6, -0.05);
          g.fill();
        },
        cut(x) {
          const r = radius(x);
          oval(g, x, cy, 5, r);
          fillStroke(g, BERRY.inside, 2.5);
          oval(g, x, cy, 2.5, r * 0.45);
          g.fillStyle = BERRY.core;
          g.fill();
        },
      });
      // The leafy cap, laid over its shoulders, and a little stalk.
      for (const angle of [-1.25, 1.25, -0.62, 0.62, 0]) {
        g.save();
        g.translate(x1 - 2, cy);
        g.rotate(angle);
        g.beginPath();
        g.moveTo(0, -9);
        g.quadraticCurveTo(44, 0, 0, 9);
        g.closePath();
        fillStroke(g, vertical(g, -9, 9, [C.leaf, C.leafDark]), 3);
        g.restore();
      }
      g.beginPath();
      g.roundRect(x1 + 20, cy - 5, 22, 10, 5);
      fillStroke(g, C.leafDark, 3);
    },
  },
};

export default strawberry;
