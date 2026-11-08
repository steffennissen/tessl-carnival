import { C, type G, circle, fillStroke, oval, starPath, vertical } from '../art';
import type { Ingredient } from '../kit';
import type { ChopArt } from '../steps/chop';

/**
 * Round things lying in a row along the chopping board, a little
 * overlapping, cut into pieces between `bounds`. Each piece is the row
 * clipped between two cuts, with a fresh cut face on its left side.
 *
 * `drawRound` draws one whole round thing at (x, cy), `r` big. `drawCut`
 * draws a cut face at x, `h` up and down from cy.
 */
export function drawChopRow(
  g: G,
  cut: Parameters<ChopArt['draw']>[1],
  count: number,
  r: number,
  drawRound: (g: G, x: number, r: number) => void,
  drawCut: (g: G, x: number, h: number) => void,
) {
  const { bounds, cy, x0, x1 } = cut;
  const gap = (x1 - x0 - 2 * r) / (count - 1);
  const xs = Array.from({ length: count }, (_, i) => x0 + r + i * gap);
  const heightAt = (x: number) =>
    Math.max(0, ...xs.map((cx) => Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx)))));

  for (let k = 0; k < bounds.length - 1; k++) {
    const first = k === 0;
    const last = k === bounds.length - 2;
    const a = first ? x0 - 80 : bounds[k] + 3;
    const b = last ? x1 + 80 : bounds[k + 1] - 3;
    g.save();
    g.beginPath();
    g.rect(a, cy - r - 60, b - a, 2 * r + 120);
    g.clip();
    for (const x of xs) drawRound(g, x, r);
    if (!first) drawCut(g, a, heightAt(a));
    g.restore();
  }
}

/** Tomatoes: a row on the board to chop, and slices for on top. The sauce is tomato-sauce.ts. */
const tomato: Ingredient = {
  id: 'tomato',
  label: 'tomato',
  plural: 'tomatoes',
  icon: '🍅',
  colors: [C.berry, C.sauceLight],

  chop: {
    draw(g, look) {
      const { cy } = look;
      drawChopRow(
        g,
        look,
        5,
        38,
        (g, x, r) => {
          circle(g, x, cy, r);
          const skin = g.createRadialGradient(x - r * 0.35, cy - r * 0.4, 3, x, cy, r);
          skin.addColorStop(0, C.sauceLight);
          skin.addColorStop(0.6, C.berry);
          skin.addColorStop(1, C.pepperoniDark);
          fillStroke(g, skin, 3.5);
          g.fillStyle = 'rgba(255, 255, 255, 0.6)';
          oval(g, x - r * 0.4, cy - r * 0.45, r * 0.22, r * 0.12, -0.6);
          g.fill();
          // The green star of leaves on top.
          starPath(g, x + 4, cy - r + 8, 12, 0.3);
          fillStroke(g, vertical(g, cy - r - 4, cy - r + 20, [C.leaf, C.leafDark]), 2.5);
        },
        (g, x, h) => {
          if (h < 3) return;
          oval(g, x, cy, 7, h);
          fillStroke(g, C.sauceLight, 2.5);
          g.fillStyle = 'rgba(255, 230, 160, 0.95)';
          for (const share of [-0.5, 0, 0.5]) {
            oval(g, x, cy + h * share, 2, 3);
            g.fill();
          }
        },
      );
    },
  },

  topping: {
    draw(g) {
      circle(g, 0, 0, 12);
      fillStroke(g, vertical(g, -12, 12, [C.sauceLight, C.berry]), 2.5);
      g.fillStyle = 'rgba(255, 230, 160, 0.9)';
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        oval(g, Math.cos(a) * 6, Math.sin(a) * 6, 2.6, 1.6, a);
        g.fill();
      }
    },
  },
};

export default tomato;
