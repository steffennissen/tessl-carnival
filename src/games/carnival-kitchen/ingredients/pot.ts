import { C, blend, circle, fillStroke, heartPath, oval, rounded, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';

/**
 * The pot seen from the side, standing on the counter like the mixing bowl,
 * for pouring into. Its opening is an oval at (x, rim).
 */
const SIDE = { x: 400, rim: 262, rx: 132, ry: 24, foot: 412 } as const;
/** The inside of the opening, where what's in it shows. */
const INSIDE = { y: SIDE.rim + 4, rx: SIDE.rx - 12, ry: SIDE.ry - 7 } as const;

/** A pink soup pot with handles. */
const pot: Ingredient = {
  id: 'pot',
  label: 'pot',
  icon: '🍲',
  colors: [C.pink, C.hotPink],

  /** Seen from above, for stirring. */
  vessel: {
    inset: 26,
    draw(g, px, py, R) {
      shadow(g, px + 8, py + R - 4, R, 22);
      for (const side of [-1, 1]) {
        rounded(g, px + side * (R + 4) - 22, py - 14, 44, 28, 14);
        fillStroke(g, C.hotPink);
      }
      circle(g, px, py, R);
      fillStroke(g, vertical(g, py - R, py + R, [C.pink, C.hotPink]));
      circle(g, px, py, R - 16);
      fillStroke(g, C.steel, 3);
    },
  },

  /**
   * Seen from the side, for pouring into. What was inside fills the
   * opening, and each pour spreads in a pool where the stream lands; with
   * nothing inside, the pours fill it from the middle out.
   */
  pourInto: {
    mouth: { x: SIDE.x + 26, y: SIDE.rim + 6 },
    draw(g, { t, inside, poured }) {
      const { x, rim, rx, ry, foot } = SIDE;
      shadow(g, x, foot + 6, rx + 14, 12);
      for (const side of [-1, 1]) {
        rounded(g, x + side * (rx + 6) - 22, rim + 20, 44, 24, 12);
        fillStroke(g, C.hotPink);
      }
      g.beginPath();
      g.moveTo(x - rx, rim);
      g.lineTo(x - rx + 8, foot - 18);
      g.quadraticCurveTo(x - rx + 10, foot, x - rx + 30, foot);
      g.lineTo(x + rx - 30, foot);
      g.quadraticCurveTo(x + rx - 10, foot, x + rx - 8, foot - 18);
      g.lineTo(x + rx, rim);
      g.closePath();
      fillStroke(g, vertical(g, rim, foot, [C.pink, C.hotPink]));
      heartPath(g, x, rim + 84, 16);
      fillStroke(g, C.white, 3);
      oval(g, x, rim, rx + 4, ry + 2);
      fillStroke(g, C.pink);
      oval(g, x, rim + 2, INSIDE.rx, INSIDE.ry);
      fillStroke(g, C.steelDark, 3);

      // What's in it, inside the opening.
      g.save();
      oval(g, x, rim + 2, INSIDE.rx, INSIDE.ry);
      g.clip();
      if (inside) {
        oval(g, x, INSIDE.y, INSIDE.rx, INSIDE.ry);
        g.fillStyle = blend([inside.art.chunky, inside.art.smooth], inside.smooth);
        g.fill();
      }
      const px = SIDE.x + 10;
      for (const { art, amount } of poured) {
        if (amount <= 0) continue;
        // Into what's there: a pool where the stream lands. Into an empty
        // pot: filling it from the middle out.
        const grow = inside ? amount * 0.75 : 0.4 + 0.6 * amount;
        oval(g, inside ? px : x, INSIDE.y, INSIDE.rx * grow, INSIDE.ry * grow);
        g.fillStyle = art.color;
        g.fill();
        g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(px, INSIDE.y, 50 * amount + 6, 6 * amount + 2, 0, t * 2, t * 2 + Math.PI * 1.5);
        g.stroke();
      }
      // Chunky bits bobbing on top, until it's blended smooth.
      if (inside && inside.smooth < 1 && inside.art.chunks.length > 0) {
        const chunks = inside.art.chunks;
        for (let i = 0; i < 9; i++) {
          const size = (7 + (i % 3) * 2) * (1 - inside.smooth);
          const cx = x - 92 + i * 23 + Math.sin(t * 1.5 + i) * 3;
          const cy = INSIDE.y + ((i * 5) % 3) * 4 - 4 + Math.sin(t * 2 + i * 1.7) * 1.5;
          g.save();
          g.translate(cx, cy);
          g.rotate(i * 1.3 + Math.sin(t + i) * 0.2);
          rounded(g, -size, -size * 0.6, size * 2, size * 1.2, size * 0.5);
          fillStroke(g, chunks[i % chunks.length], 2);
          g.restore();
        }
      }
      g.restore();
    },
  },
};

export default pot;
