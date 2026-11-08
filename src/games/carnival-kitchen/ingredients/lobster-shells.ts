import { C, type G, circle, face, fillStroke, heartPath, oval, palette } from '../art';
import type { Ingredient } from '../kit';
import { drawCelerySlice } from './celery';

/** This file's own colours: see `palette` in art.ts. */
export const LULU = palette({
  light: '#ffb3a6',
  main: '#ff7f70',
  dark: '#e85d54',
  belly: '#ffe0d6',
  broth: '#ffc9a8',
  brothLight: '#ffe6d2',
});

/**
 * One of Lulu's claws, its hinge at (x, y), pointing along `angle`, `s`
 * its size. Open a little, like a wave.
 */
export function drawClaw(g: G, x: number, y: number, s: number, angle: number) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  // The arm.
  g.beginPath();
  g.roundRect(-s * 0.1, -s * 0.12, s * 0.62, s * 0.24, s * 0.12);
  fillStroke(g, LULU.main, Math.max(2, s * 0.07));
  // The pincer: a big top half and a smaller bottom half, a little open.
  g.save();
  g.translate(s * 0.6, 0);
  g.rotate(-0.25);
  g.beginPath();
  g.ellipse(s * 0.32, -s * 0.06, s * 0.36, s * 0.22, 0, Math.PI * 0.95, Math.PI * 2.05);
  g.closePath();
  fillStroke(g, LULU.main, Math.max(2, s * 0.07));
  g.restore();
  g.save();
  g.translate(s * 0.6, 0);
  g.rotate(0.3);
  g.beginPath();
  g.ellipse(s * 0.26, s * 0.04, s * 0.28, s * 0.16, 0, -0.05, Math.PI * 1.05);
  g.closePath();
  fillStroke(g, LULU.light, Math.max(2, s * 0.07));
  g.restore();
  g.restore();
}

/**
 * Lulu the lobster, centred on her face at (x, y), `s` about her head's
 * half-width. She waves her right claw. `wave` is the time in seconds.
 */
export function drawLulu(g: G, x: number, y: number, s: number, wave: number) {
  g.save();
  g.translate(x, y);
  // Curly feelers.
  g.lineCap = 'round';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * s * 0.35, -s * 0.8);
    g.bezierCurveTo(
      side * s * 0.6,
      -s * 1.9,
      side * s * 1.5,
      -s * 1.6 + Math.sin(wave * 3 + side) * s * 0.1,
      side * s * 1.25,
      -s * 1.15,
    );
    g.lineWidth = Math.max(4, s * 0.14);
    g.strokeStyle = C.ink;
    g.stroke();
    g.lineWidth = Math.max(2, s * 0.07);
    g.strokeStyle = LULU.dark;
    g.stroke();
  }
  // The tail fan, then the body.
  for (const k of [-1, 0, 1]) {
    oval(g, k * s * 0.32, s * 1.45, s * 0.24, s * 0.32, k * 0.4);
    fillStroke(g, LULU.light, Math.max(2, s * 0.07));
  }
  oval(g, 0, s * 0.95, s * 0.58, s * 0.5);
  fillStroke(g, LULU.main, Math.max(2, s * 0.08));
  g.strokeStyle = 'rgba(232, 93, 84, 0.7)';
  g.lineWidth = Math.max(1.5, s * 0.05);
  for (const by of [0.85, 1.12]) {
    g.beginPath();
    g.ellipse(0, s * by, s * 0.5, s * 0.14, 0, 0.2, Math.PI - 0.2);
    g.stroke();
  }
  // Her claws: the left resting, the right waving.
  drawClaw(g, -s * 0.85, s * 0.35, s * 1.1, Math.PI + 0.5);
  drawClaw(g, s * 0.85, s * 0.2, s * 1.1, -0.9 + Math.sin(wave * 6) * 0.35);
  // Her head.
  oval(g, 0, 0, s, s * 0.86);
  const head = g.createRadialGradient(-s * 0.3, -s * 0.35, s * 0.1, 0, 0, s);
  head.addColorStop(0, LULU.light);
  head.addColorStop(1, LULU.main);
  fillStroke(g, head, Math.max(2.5, s * 0.08));
  oval(g, 0, s * 0.38, s * 0.5, s * 0.3);
  g.fillStyle = LULU.belly;
  g.fill();
  face(g, 0, s * 0.05, s / 28, 'joy');
  // A little pink bow on top.
  heartPath(g, -s * 0.55, -s * 0.62, s * 0.18);
  fillStroke(g, C.hotPink, Math.max(1.5, s * 0.05));
  heartPath(g, -s * 0.3, -s * 0.72, s * 0.18);
  fillStroke(g, C.hotPink, Math.max(1.5, s * 0.05));
  g.restore();
}

/** A curved piece of outgrown shell, centred on (x, y), `s` across. */
export function drawShellPiece(g: G, x: number, y: number, s: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.arc(0, s * 0.35, s * 0.6, Math.PI * 1.1, Math.PI * 1.9);
  g.arc(0, s * 0.35, s * 0.3, Math.PI * 1.9, Math.PI * 1.1, true);
  g.closePath();
  fillStroke(g, LULU.main, Math.max(1.5, s * 0.08));
  g.strokeStyle = LULU.light;
  g.lineWidth = Math.max(1, s * 0.06);
  g.beginPath();
  g.arc(0, s * 0.35, s * 0.45, Math.PI * 1.25, Math.PI * 1.75);
  g.stroke();
  g.restore();
}

/**
 * The shells Lulu the lobster has outgrown (real lobsters moult), for the
 * pot, with celery and carrot. Lulu watches from beside the pot.
 */
const lobsterShells: Ingredient = {
  id: 'lobster-shells',
  label: 'shells',
  plural: 'shells',
  icon: '🦞',
  colors: [LULU.main, LULU.light, C.leaf],

  stirred: {
    spoon: C.wood,
    draw(g, { x: px, y: py, r, swirl, done, t }) {
      circle(g, px, py, r);
      const broth = g.createRadialGradient(px - 20, py - 20, 10, px, py, r);
      broth.addColorStop(0, LULU.brothLight);
      broth.addColorStop(1, LULU.broth);
      g.fillStyle = broth;
      g.fill();
      g.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.beginPath();
        g.arc(px, py, 30 + j * 28, swirl + j * 2.1, swirl + j * 2.1 + 1.3);
        g.stroke();
      }
      // Bubbles as it gets going.
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.8 + i * 0.37) % 1;
        const a = i * 1.3 + 0.4;
        const br = 20 + i * 15;
        g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase) * (0.3 + done * 0.7)})`;
        g.lineWidth = 2;
        circle(g, px + Math.cos(a) * br, py + Math.sin(a) * br, 3 + phase * 5);
        g.stroke();
      }
      // Shells, celery and carrot going round.
      for (let i = 0; i < 14; i++) {
        const ring = 24 + ((i * 31) % 74);
        const a = i * 0.9 + swirl * (1.1 - ring / 160) + t * 0.05;
        const bx = px + Math.cos(a) * ring;
        const by = py + Math.sin(a) * ring;
        const kind = i % 3;
        if (kind === 0) drawShellPiece(g, bx, by, 44, a + i);
        else if (kind === 1) drawCelerySlice(g, bx, by, 12, a);
        else {
          circle(g, bx, by, 8);
          fillStroke(g, C.carrot, 2.5);
          circle(g, bx, by, 4);
          g.fillStyle = C.carrotLight;
          g.fill();
        }
      }
      // Lulu, beside the pot, waving.
      drawLulu(g, px + 214, py + 58, 36, t);
      if (done >= 1) {
        heartPath(g, px + 262, py - 4 - ((t * 20) % 20), 9);
        fillStroke(g, C.hotPink, 2.5);
      }
    },
  },
};

export default lobsterShells;
