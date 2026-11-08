import { C, type G, circle, fillStroke, oval, shadow, vertical } from '../art';

/**
 * Scene pieces more than one step draws. Everything is in scene units: the
 * scene is 800×500 and the counter top is at y 338.
 */

/** The scene's size. */
export const SCENE_W = 800;
export const SCENE_H = 500;
/** The counter top's line: things standing on the counter sit on it. */
export const COUNTER_Y = 338;

/**
 * The blue mixing bowl, seen from the side, on the counter in the middle.
 * Its rim is an oval at (x, rim); things in it go at about y 333 to 338.
 */
export const BOWL = { x: 400, rim: 330 } as const;

/** The empty mixing bowl. Draw what's in it after. */
export function drawMixingBowl(g: G) {
  const x = BOWL.x;
  shadow(g, x, 420, 150, 14);
  g.beginPath();
  g.ellipse(x, 330, 150, 84, 0, 0, Math.PI);
  g.closePath();
  fillStroke(g, vertical(g, 330, 414, [C.sky, C.skyDark]));
  g.save();
  g.beginPath();
  g.ellipse(x, 330, 148, 82, 0, 0, Math.PI);
  g.clip();
  g.fillStyle = 'rgba(255, 255, 255, 0.75)';
  for (let i = 0; i < 14; i++) {
    circle(g, x - 130 + (i % 7) * 44 + Math.floor(i / 7) * 22, 352 + Math.floor(i / 7) * 30, 6);
    g.fill();
  }
  g.restore();
  oval(g, x, 330, 150, 30);
  fillStroke(g, C.white);
  oval(g, x, 333, 134, 21);
  g.fillStyle = C.skyLight;
  g.fill();
}

/**
 * Three wisps of steam rising from about (x, y), `gap` apart. `rise` is how
 * far each drifts up, `length` how many 5px segments it has, and `wiggle`
 * how tightly it curls.
 */
export function drawSteam(
  g: G,
  t: number,
  x: number,
  y: number,
  gap: number,
  { alpha = 0.9, rise = 40, length = 8, wiggle = 1 } = {},
) {
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.5 + i / 3) % 1;
    g.strokeStyle = `rgba(255, 255, 255, ${alpha * Math.sin(phase * Math.PI)})`;
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    const wx = x - gap + i * gap;
    for (let k = 0; k <= length; k++) {
      g.lineTo(wx + Math.sin(k * wiggle + t * 3 + i) * 6, y - phase * rise - k * 5);
    }
    g.stroke();
  }
}
