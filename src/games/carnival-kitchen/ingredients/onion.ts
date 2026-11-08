import { C, fillStroke, oval, palette } from '../art';
import type { Ingredient } from '../kit';
import { drawChopRow } from './tomato';

/** This file's own colours: soft purple onions. */
const K = palette({ skin: '#b98ee8', skinDark: '#8f63c9', ring: '#d9c2f7' });

/** Purple onions to chop, in a row on the board. */
const onion: Ingredient = {
  id: 'onion',
  label: 'onion',
  icon: '🧅',
  colors: [K.skin, K.ring, C.white],

  chop: {
    draw(g, look) {
      const { cy } = look;
      drawChopRow(
        g,
        look,
        5,
        37,
        (g, x, r) => {
          // A little tuft of roots underneath.
          g.strokeStyle = C.mushroomDark;
          g.lineWidth = 2.5;
          g.lineCap = 'round';
          for (const dx of [-6, 0, 6]) {
            g.beginPath();
            g.moveTo(x + dx * 0.5, cy + r - 4);
            g.lineTo(x + dx, cy + r + 8);
            g.stroke();
          }
          // The bulb, pointing up to its papery tip.
          g.beginPath();
          g.moveTo(x, cy - r - 12);
          g.bezierCurveTo(x + r * 0.35, cy - r * 0.75, x + r * 1.05, cy - r * 0.5, x + r, cy);
          g.bezierCurveTo(x + r * 0.95, cy + r * 0.75, x + r * 0.45, cy + r, x, cy + r);
          g.bezierCurveTo(x - r * 0.45, cy + r, x - r * 0.95, cy + r * 0.75, x - r, cy);
          g.bezierCurveTo(x - r * 1.05, cy - r * 0.5, x - r * 0.35, cy - r * 0.75, x, cy - r - 12);
          g.closePath();
          const skin = g.createRadialGradient(x - r * 0.35, cy - r * 0.3, 3, x, cy, r * 1.1);
          skin.addColorStop(0, K.ring);
          skin.addColorStop(0.55, K.skin);
          skin.addColorStop(1, K.skinDark);
          fillStroke(g, skin, 3.5);
          // Soft stripes from the tip down, and a shine.
          g.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          g.lineWidth = 2;
          for (const bend of [-0.55, 0.55]) {
            g.beginPath();
            g.moveTo(x, cy - r - 6);
            g.quadraticCurveTo(x + r * bend * 1.3, cy, x + r * bend * 0.4, cy + r - 3);
            g.stroke();
          }
          g.fillStyle = 'rgba(255, 255, 255, 0.6)';
          oval(g, x - r * 0.45, cy - r * 0.3, r * 0.12, r * 0.22, 0.3);
          g.fill();
        },
        (g, x, h) => {
          if (h < 3) return;
          // A fresh cut: rings inside rings.
          oval(g, x, cy, 7, h);
          fillStroke(g, C.white, 2.5);
          g.strokeStyle = K.ring;
          g.lineWidth = 1.8;
          for (const share of [0.7, 0.42]) {
            oval(g, x, cy, 7 * share, h * share);
            g.stroke();
          }
        },
      );
    },
  },
};

export default onion;
