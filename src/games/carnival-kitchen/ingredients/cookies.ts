import {
  C,
  type G,
  type Mood,
  blend,
  circle,
  face,
  fillStroke,
  heartPath,
  horizontal,
  oval,
  rounded,
  shadow,
  vertical,
} from '../art';
import { GOLDEN, findStep, type Ingredient, type KitchenState } from '../kit';
import type { ToppingArt, ToppingSpot } from '../steps/top';

/**
 * Cookies: the cut-out sugar cookies on their baking tray, for the oven.
 * Also the cookie shapes every cutter and the end card draw with:
 * `cookiePath` and `drawCookie`.
 */

export type CookieShape = 'star' | 'heart' | 'bunny';

/** The shape a cutter cuts: 'star-cutter' cuts a star. */
export function shapeOf(id: string): CookieShape {
  if (id.startsWith('heart')) return 'heart';
  if (id.startsWith('bunny')) return 'bunny';
  return 'star';
}

/**
 * A cookie shape centred on (x, y), about `s` from the middle to the edge.
 * The bunny is a head and two ears, so it's several shapes: fill it with
 * `drawShape`, which outlines the whole silhouette once.
 */
export function cookiePath(g: G, shape: CookieShape, x: number, y: number, s: number) {
  if (shape === 'star') {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 1.08 : s * 0.56;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.closePath();
  } else if (shape === 'heart') {
    heartPath(g, x, y + s * 0.08, s * 0.82);
  } else {
    // Each part starts where its ellipse does, so no stray lines join them.
    const part = (cx: number, cy: number, rx: number, ry: number, rot: number) => {
      g.moveTo(cx + Math.cos(rot) * rx, cy + Math.sin(rot) * rx);
      g.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    };
    g.beginPath();
    part(x - s * 0.3, y - s * 0.5, s * 0.22, s * 0.52, -0.22);
    part(x + s * 0.3, y - s * 0.5, s * 0.22, s * 0.52, 0.22);
    part(x, y + s * 0.3, s * 0.66, s * 0.58, 0);
  }
}

/**
 * Fills a cookie shape with an ink outline round its silhouette only (no
 * lines where the bunny's ears meet its head).
 */
export function drawShape(
  g: G,
  shape: CookieShape,
  x: number,
  y: number,
  s: number,
  fill: string | CanvasGradient,
  line = 3,
  stroke: string = C.ink,
) {
  g.lineJoin = 'round';
  if (line > 0) {
    cookiePath(g, shape, x, y, s);
    g.lineWidth = line * 2;
    g.strokeStyle = stroke;
    g.stroke();
  }
  cookiePath(g, shape, x, y, s);
  g.fillStyle = fill;
  g.fill();
}

/** Where the face goes on a cookie shape: the bunny's is on its head. */
export function faceSpot(shape: CookieShape, s: number): number {
  if (shape === 'bunny') return s * 0.32;
  if (shape === 'heart') return -s * 0.12;
  return s * 0.08;
}

/** How a cookie looks at this much baking: pale dough, golden, then a bit crispy. */
export function cookieColor(level: number): { main: string; light: string; edge: string } {
  if (level <= GOLDEN) {
    const p = level / GOLDEN;
    return {
      main: blend([C.dough, C.pancake], p),
      light: blend([C.doughLight, C.pancakeLight], p),
      edge: blend([C.dough, C.crustGold], p),
    };
  }
  const p = (level - GOLDEN) / (1 - GOLDEN);
  return {
    main: blend([C.pancake, C.pancakeDone], p),
    light: blend([C.pancakeLight, C.pancake], p),
    edge: blend([C.crustGold, C.crustBrown], p),
  };
}

/** Where an iced cookie's sprinkles go, clear of its face. */
const SPRINKLES: Record<CookieShape, [number, number, string][]> = {
  star: [
    [0, -0.7, C.hotPink],
    [-0.62, -0.28, C.sky],
    [0.62, -0.28, C.mint],
  ],
  heart: [
    [-0.55, -0.45, C.sky],
    [0.55, -0.45, C.mint],
    [0, 0.55, C.hotPink],
  ],
  bunny: [
    [-0.3, -0.6, C.sky],
    [0.3, -0.6, C.mint],
  ],
};

/** One cookie, baked by `level`, with a face. `icing` adds an icing edge, sprinkles and an icing smile. */
export function drawCookie(
  g: G,
  shape: CookieShape,
  x: number,
  y: number,
  s: number,
  look: { level: number; mood?: Mood; icing?: boolean },
) {
  const color = cookieColor(look.level);
  // Its thickness, then its top.
  drawShape(g, shape, x, y + s * 0.12, s, color.edge, 2.5);
  const grad = g.createRadialGradient(x - s * 0.3, y - s * 0.4, 1, x, y, s * 1.2);
  grad.addColorStop(0, color.light);
  grad.addColorStop(1, color.main);
  drawShape(g, shape, x, y, s, grad, 2.5);
  if (look.icing) {
    const icing = shape === 'heart' ? C.white : shape === 'star' ? C.butter : C.pink;
    g.save();
    cookiePath(g, shape, x, y, s);
    g.clip();
    g.lineWidth = s * 0.2;
    g.strokeStyle = icing;
    cookiePath(g, shape, x, y, s);
    g.stroke();
    g.restore();
    // Sprinkles, clear of the face.
    const sprinkles = SPRINKLES[shape];
    for (const [dx, dy, color] of sprinkles) {
      rounded(g, x + dx * s - 2.5, y + dy * s - 1.2, 5, 2.4, 1.2);
      g.fillStyle = color;
      g.fill();
    }
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.45)';
  oval(g, x - s * 0.3, y - s * 0.32 + (shape === 'bunny' ? s * 0.3 : 0), s * 0.16, s * 0.08, -0.5);
  g.fill();
  if (look.icing) drawIcingFace(g, x, y + faceSpot(shape, s), s / 36);
  else face(g, x, y + faceSpot(shape, s), s / 30, look.mood ?? 'happy');
}

/** Piped icing eyes and a big icing smile, with rosy cheeks. */
function drawIcingFace(g: G, x: number, y: number, k: number) {
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  g.fillStyle = 'rgba(255, 110, 160, 0.5)';
  oval(g, -16, 6, 6, 3.6);
  g.fill();
  oval(g, 16, 6, 6, 3.6);
  g.fill();
  for (const ex of [-9, 9]) {
    circle(g, ex, -1, 3.8);
    g.fillStyle = C.ink;
    g.fill();
    circle(g, ex + 1.2, -2.2, 1.4);
    g.fillStyle = C.white;
    g.fill();
  }
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.lineWidth = 6.5;
  g.beginPath();
  g.arc(0, 3, 7, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  g.strokeStyle = C.white;
  g.lineWidth = 3.5;
  g.stroke();
  g.restore();
}

/** The cutters used in this round, or a star, a heart and a bunny. */
export function cutsIn(round: KitchenState | null): CookieShape[] {
  const top = round && findStep<{ spots: ToppingSpot[] }>(round, 'top');
  const shapes = top?.state.spots.map((spot) => shapeOf(spot.id)) ?? [];
  return shapes.length > 0 ? shapes : ['star', 'heart', 'bunny', 'star'];
}

/** A baking tray seen a little from above, centred on (x, y), `w` wide. */
export function drawTray(g: G, x: number, y: number, w: number, h: number) {
  shadow(g, x + 6, y + h / 2 + 6, w / 2 + 6, 8);
  rounded(g, x - w / 2, y - h / 2, w, h, 12);
  fillStroke(g, horizontal(g, x - w / 2, x + w / 2, [C.steelDark, C.steel, C.white, C.steel]), 3.5);
  rounded(g, x - w / 2 + 9, y - h / 2 + 7, w - 18, h - 14, 8);
  fillStroke(g, vertical(g, y - h / 2, y + h / 2, [C.white, C.steel]), 2, C.steelDark);
  // Little hearts pressed into the rim.
  for (const hx of [x - w / 2 + 5, x + w / 2 - 5]) {
    heartPath(g, hx, y, 3);
    g.fillStyle = C.pink;
    g.fill();
  }
}

/**
 * A cookie cutter's `topping` art: a shiny `color` cutter in this shape,
 * about 26 across. It floats across and cuts its shape out of the dough.
 */
export function cutterArt(shape: CookieShape, color: string): ToppingArt {
  // The bunny is narrower, so it's a little bigger to fit its face.
  const size = shape === 'bunny' ? 14.5 : 12;
  return {
    faceY: faceSpot(shape, size),
    draw(g) {
      g.lineJoin = 'round';
      cookiePath(g, shape, 0, 0, size);
      g.fillStyle = 'rgba(255, 255, 255, 0.55)';
      g.fill();
      g.lineWidth = 7;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 3.6;
      g.strokeStyle = color;
      g.stroke();
      g.lineWidth = 1.2;
      g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      g.save();
      g.translate(-0.8, -0.8);
      cookiePath(g, shape, 0, 0, size);
      g.stroke();
      g.restore();
    },
  };
}

const cookies: Ingredient = {
  id: 'cookies',
  label: 'cookies',
  plural: 'cookies',
  icon: '🍪',
  colors: [C.pancake, C.pink, C.butter],

  /** On a tray in the oven, turning golden. Every cookie the cutters cut goes in. */
  bake: {
    draw(g, { x, y, level, baking, t, round }) {
      drawTray(g, x, y + 16, 214, 52);
      const shapes = cutsIn(round);
      const gap = 180 / shapes.length;
      shapes.forEach((shape, i) => {
        const cx = x - 90 + gap * (i + 0.5);
        const rise = baking ? Math.sin(t * 5 + i) * 1.2 : 0;
        drawCookie(g, shape, cx, y + 6 + rise - (shape === 'bunny' ? 4 : 0), 19, {
          level,
          mood: level >= GOLDEN - 0.07 ? 'joy' : 'happy',
        });
      });
      // A little puff of warmth over each one.
      if (baking) {
        for (let i = 0; i < 4; i++) {
          const phase = (t * 1.2 + i * 0.25) % 1;
          g.fillStyle = `rgba(255, 255, 255, ${0.6 * (1 - phase)})`;
          circle(g, x - 70 + i * 46, y - 18 - phase * 20, 2 + phase * 3);
          g.fill();
        }
      }
    },
  },
};

export default cookies;
