import {
  C,
  circle,
  fillStroke,
  heartPath,
  horizontal,
  oval,
  rounded,
  shadow,
  starPath,
  vertical,
} from '../art';
import { drawSteam, type Ingredient } from '../kit';

/** Veggie soup, with carrots, peas, stars and hearts in it. */
const soup: Ingredient = {
  id: 'soup',
  label: 'soup',
  icon: '🍲',
  colors: [C.soup, C.soupLight],

  /** In the pot while it's stirred, seen from above. */
  stirred: {
    spoon: C.wood,
    draw(g, { x: px, y: py, r, swirl, t }) {
      circle(g, px, py, r);
      const soup = g.createRadialGradient(px - 20, py - 20, 10, px, py, r);
      soup.addColorStop(0, C.soupLight);
      soup.addColorStop(0.7, C.soup);
      soup.addColorStop(1, C.soupDark);
      g.fillStyle = soup;
      g.fill();

      g.strokeStyle = 'rgba(255, 220, 190, 0.8)';
      g.lineWidth = 5;
      g.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        g.beginPath();
        g.arc(px, py, 28 + j * 28, swirl + j * 2.1, swirl + j * 2.1 + 1.4);
        g.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.8 + i * 0.37) % 1;
        const a = i * 1.3 + 0.4;
        const br = 20 + i * 15;
        g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
        g.lineWidth = 2;
        circle(g, px + Math.cos(a) * br, py + Math.sin(a) * br, 3 + phase * 6);
        g.stroke();
      }

      const bits: [number, number, 'carrot' | 'pea' | 'star' | 'heart'][] = [
        [0, 60, 'carrot'],
        [0.7, 88, 'pea'],
        [1.4, 36, 'star'],
        [2.1, 82, 'heart'],
        [2.8, 62, 'carrot'],
        [3.5, 90, 'pea'],
        [4.2, 48, 'heart'],
        [4.9, 84, 'star'],
        [5.6, 26, 'pea'],
      ];
      for (const [a0, br, kind] of bits) {
        const a = a0 + swirl + t * 0.05;
        const bx = px + Math.cos(a) * br;
        const by = py + Math.sin(a) * br;
        if (kind === 'carrot') {
          circle(g, bx, by, 9);
          fillStroke(g, C.carrot, 2.5);
          circle(g, bx, by, 4.5);
          g.fillStyle = C.carrotLight;
          g.fill();
        } else if (kind === 'pea') {
          circle(g, bx, by, 6.5);
          fillStroke(g, C.leaf, 2.5);
        } else if (kind === 'star') {
          starPath(g, bx, by, 10, a);
          fillStroke(g, C.butter, 2.5);
        } else {
          heartPath(g, bx, by, 7);
          fillStroke(g, C.pink, 2.5);
        }
      }
    },
  },

  /** In a steaming purple pot on the counter, seen from the side, while it's seasoned. */
  seasoned: {
    draw(g, { x: px, t, specks, speck }) {
      drawSteam(g, t, px, 290, 50, { alpha: 0.8, rise: 50, length: 10, wiggle: 0.8 });

      shadow(g, px, 420, 130, 14);
      for (const side of [-1, 1]) {
        rounded(g, px + side * 120 - 17, 318, 34, 18, 9);
        fillStroke(g, C.lavender, 3.5);
      }
      g.beginPath();
      g.moveTo(px - 118, 300);
      g.lineTo(px - 118, 370);
      g.quadraticCurveTo(px - 118, 414, px - 76, 414);
      g.lineTo(px + 76, 414);
      g.quadraticCurveTo(px + 118, 414, px + 118, 370);
      g.lineTo(px + 118, 300);
      g.closePath();
      fillStroke(
        g,
        horizontal(g, px - 118, px + 118, [C.purple, C.lavender, C.lavender, C.purple]),
      );
      g.fillStyle = 'rgba(255, 255, 255, 0.4)';
      rounded(g, px - 100, 318, 12, 70, 6);
      g.fill();
      heartPath(g, px, 364, 15);
      fillStroke(g, C.pink, 3);
      oval(g, px, 300, 124, 24);
      fillStroke(g, C.lavenderLight);
      oval(g, px, 302, 106, 15);
      g.fillStyle = vertical(g, 288, 316, [C.stewLight, C.stew]);
      g.fill();
      for (const [dx, dy, color] of [
        [-60, 0, C.carrot],
        [-20, 5, C.leaf],
        [30, -3, C.carrot],
        [70, 3, C.leaf],
      ] as const) {
        oval(g, px + dx, 302 + dy, 8, 4);
        fillStroke(g, color, 2);
      }
      g.fillStyle = speck;
      for (let i = 0; i < specks; i++) {
        g.fillRect(px + ((i * 73) % 170) - 85, 296 + ((i * 37) % 14) - 3, 3, 3);
      }
    },
  },
};

export default soup;
