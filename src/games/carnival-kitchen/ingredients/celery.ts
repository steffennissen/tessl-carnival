import { C, type G, fillStroke, oval, palette, vertical } from '../art';
import type { Ingredient } from '../kit';
import { drawChopPieces } from './strawberry';

/** This file's own colours: see `palette` in art.ts. */
export const CELERY = palette({
  light: '#d6f5a8',
  main: '#a6e07a',
  dark: '#74c25a',
  inside: '#eefbd8',
});

/** A celery slice, a little green "C", centred on (x, y), `r` its radius, turned by `rot`. */
export function drawCelerySlice(g: G, x: number, y: number, r: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.arc(0, 0, r, Math.PI * 1.15, Math.PI * 1.85 + Math.PI);
  g.quadraticCurveTo(0, r * 0.1, Math.cos(Math.PI * 1.15) * r, Math.sin(Math.PI * 1.15) * r);
  g.closePath();
  fillStroke(g, CELERY.main, Math.max(1.5, r * 0.18));
  g.beginPath();
  g.arc(0, r * 0.1, r * 0.6, Math.PI * 0.1, Math.PI * 0.9);
  g.strokeStyle = CELERY.inside;
  g.lineWidth = Math.max(1, r * 0.18);
  g.stroke();
  g.restore();
}

const celery: Ingredient = {
  id: 'celery',
  label: 'celery',
  plural: 'celery',
  icon: '🥬',
  colors: [CELERY.main, CELERY.light],

  /** A long celery stalk along the board, with its leafy top on the right. */
  chop: {
    draw(g, { bounds, cy, x0, x1 }) {
      const span = x1 - x0;
      const radius = (x: number) => 18 + 6 * ((x - x0) / span);
      // The leaves, poking out on the right.
      for (const [angle, len] of [
        [-0.8, 38],
        [-0.25, 42],
        [0.25, 40],
        [0.8, 36],
      ]) {
        g.save();
        g.translate(x1 - 2, cy);
        g.rotate(angle);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(len * 0.5, 0);
        g.strokeStyle = CELERY.dark;
        g.lineWidth = 4;
        g.stroke();
        for (const [lx, ly] of [
          [len * 0.55, -7],
          [len * 0.75, 6],
          [len, 0],
        ]) {
          oval(g, lx, ly, 14, 9, ly * 0.05);
          fillStroke(g, vertical(g, ly - 7, ly + 7, [C.leaf, C.leafDark]), 2.5);
        }
        g.restore();
      }
      const outline = () => {
        g.beginPath();
        g.moveTo(x0, cy - radius(x0) + 4);
        g.quadraticCurveTo(x0 - 6, cy, x0, cy + radius(x0) - 2);
        g.lineTo(x1, cy + radius(x1));
        g.lineTo(x1, cy - radius(x1));
        g.closePath();
      };
      drawChopPieces(g, bounds, {
        outline,
        mid: () => cy,
        radius,
        paint() {
          fillStroke(
            g,
            vertical(g, cy - 24, cy + 24, [CELERY.light, CELERY.main, CELERY.dark]),
            3.5,
          );
          // Ridges along the stalk.
          g.strokeStyle = 'rgba(116, 194, 90, 0.7)';
          g.lineWidth = 2.5;
          for (const k of [-0.5, 0.45]) {
            g.beginPath();
            g.moveTo(x0 + 10, cy + k * radius(x0));
            g.lineTo(x1 - 4, cy + k * radius(x1));
            g.stroke();
          }
          g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          g.lineWidth = 4;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(x0 + 30, cy - 12);
          g.lineTo(x0 + span * 0.5, cy - 14);
          g.stroke();
        },
        cut(x) {
          const r = radius(x);
          oval(g, x, cy, 5, r);
          fillStroke(g, CELERY.inside, 2.5);
        },
      });
    },
  },
};

export default celery;
