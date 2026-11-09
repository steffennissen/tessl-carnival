import {
  C,
  CONFETTI,
  type G,
  circle,
  face,
  fillStroke,
  heartPath,
  oval,
  rounded,
  starPath,
  vertical,
} from './art';

/**
 * Drawing Chef Bunny's hats and aprons (wardrobe.ts has the items). Hats
 * are drawn in her head's own units: her head is a circle of radius 42 round
 * (0, 0), and a hat sits on its top at about y -40, between her ears.
 */

/** The classic puffy chef's hat, `tall` stretching it up, in `fill`. */
function toque(g: G, fill: string | CanvasGradient, tall = 0) {
  for (const [hx, hy, r] of [
    [-18, -60 - tall * 0.6, 15],
    [18, -60 - tall * 0.6, 15],
    [0, -70 - tall, 19],
  ]) {
    circle(g, hx, hy, r);
    fillStroke(g, fill, 3.5);
  }
  if (tall > 0) {
    rounded(g, -24, -60 - tall * 0.6, 48, tall * 0.6 + 12, 6);
    fillStroke(g, fill, 3.5);
  }
  rounded(g, -24, -52, 48, 16, 6);
  fillStroke(g, fill, 3.5);
}

/** A little flower: five petals round a butter middle. */
function flower(g: G, x: number, y: number, r: number, petal: string) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    circle(g, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75);
    fillStroke(g, petal, 1.8);
  }
  circle(g, x, y, r * 0.6);
  fillStroke(g, C.butter, 1.8);
}

/**
 * A hat, in her head's units. Most go behind her face (`front` false); the
 * space helmet's glass goes over everything (`front` true).
 */
export function drawHat(g: G, id: string, front = false, t = 0) {
  if (id === 'astronaut-helmet') {
    if (!front) return;
    // A glass bubble round her whole head, ears and all.
    circle(g, 0, -16, 84);
    g.fillStyle = 'rgba(223, 242, 255, 0.28)';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = C.ink;
    g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(0, -16, 70, Math.PI * 1.15, Math.PI * 1.4);
    g.stroke();
    rounded(g, -50, 44, 100, 18, 9);
    fillStroke(g, vertical(g, 44, 62, [C.steel, C.steelDark]), 3.5);
    circle(g, 0, -100, 6);
    fillStroke(g, C.hotPink, 3);
    return;
  }
  if (front) return;
  switch (id) {
    case 'party-hat': {
      g.save();
      g.rotate(0.15);
      g.beginPath();
      g.moveTo(-24, -36);
      g.lineTo(24, -36);
      g.lineTo(0, -112);
      g.closePath();
      fillStroke(g, C.sky, 3.5);
      g.save();
      g.clip();
      g.fillStyle = C.hotPink;
      for (let i = 0; i < 4; i++) g.fillRect(-30, -50 - i * 20, 60, 8);
      g.restore();
      g.beginPath();
      g.moveTo(-24, -36);
      g.lineTo(24, -36);
      g.lineTo(0, -112);
      g.closePath();
      g.lineWidth = 3.5;
      g.strokeStyle = C.ink;
      g.stroke();
      circle(g, 0, -114, 10);
      fillStroke(g, C.butter, 3);
      g.restore();
      return;
    }
    case 'bow': {
      for (const side of [-1, 1]) {
        oval(g, side * 24, -50, 24, 15, side * -0.3);
        fillStroke(g, C.hotPink, 3.5);
        oval(g, side * 22, -50, 10, 6, side * -0.3);
        g.fillStyle = 'rgba(255, 255, 255, 0.5)';
        g.fill();
      }
      circle(g, 0, -50, 10);
      fillStroke(g, C.pink, 3.5);
      return;
    }
    case 'flower-crown': {
      g.strokeStyle = C.leafDark;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(0, 4, 46, Math.PI * 1.12, Math.PI * 1.88);
      g.stroke();
      const petals = [C.pink, C.lavender, C.sky, C.hotPink, C.pink, C.lavender, C.sky];
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.12 + (i / 6) * 0.76);
        const x = Math.cos(a) * 46;
        const y = 4 + Math.sin(a) * 46;
        oval(g, x + 7, y + 4, 6, 3, a);
        fillStroke(g, C.leaf, 1.5);
        flower(g, x, y, 6.5, petals[i]);
      }
      return;
    }
    case 'pirate-hat': {
      g.beginPath();
      g.moveTo(-56, -38);
      g.quadraticCurveTo(-46, -88, -30, -84);
      g.quadraticCurveTo(0, -60, 30, -84);
      g.quadraticCurveTo(46, -88, 56, -38);
      g.quadraticCurveTo(0, -54, -56, -38);
      g.closePath();
      fillStroke(g, vertical(g, -88, -38, [C.panLight, C.panDark]), 3.5);
      g.strokeStyle = C.gold;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-50, -44);
      g.quadraticCurveTo(0, -58, 50, -44);
      g.stroke();
      heartPath(g, 0, -64, 9);
      fillStroke(g, C.white, 2.5);
      return;
    }
    case 'crown': {
      g.beginPath();
      g.moveTo(-32, -38);
      g.lineTo(-36, -82);
      g.lineTo(-18, -62);
      g.lineTo(0, -92);
      g.lineTo(18, -62);
      g.lineTo(36, -82);
      g.lineTo(32, -38);
      g.closePath();
      fillStroke(g, vertical(g, -92, -38, [C.butter, C.gold]), 3.5);
      const gems: [number, number, string][] = [
        [-18, -48, C.hotPink],
        [0, -50, C.sky],
        [18, -48, C.mint],
      ];
      for (const [x, y, c] of gems) {
        circle(g, x, y, 5.5);
        fillStroke(g, c, 2);
      }
      for (const x of [-36, 0, 36]) {
        circle(g, x, x === 0 ? -94 : -84, 5);
        fillStroke(g, C.white, 2);
      }
      return;
    }
    case 'wizard-hat': {
      g.beginPath();
      g.moveTo(-30, -44);
      g.quadraticCurveTo(-8, -90, 22, -132);
      g.quadraticCurveTo(14, -86, 30, -44);
      g.closePath();
      fillStroke(g, vertical(g, -132, -44, [C.lavender, C.purple]), 3.5);
      for (const [x, y, r] of [
        [-8, -62, 6],
        [10, -84, 5],
        [8, -56, 4],
        [18, -112, 4],
      ]) {
        starPath(g, x, y, r, t * 0.5);
        fillStroke(g, C.butter, 1.5);
      }
      oval(g, 0, -42, 50, 11);
      fillStroke(g, C.purple, 3.5);
      return;
    }
    case 'star-toque': {
      toque(g, C.white);
      starPath(g, 0, -44, 9);
      fillStroke(g, C.gold, 2.5);
      return;
    }
    case 'ribbon-toque': {
      toque(g, C.white, 14);
      rounded(g, -24, -52, 48, 12, 5);
      fillStroke(g, C.hotPink, 3);
      for (const side of [-1, 1]) {
        oval(g, 18 + side * 8, -48, 8, 5, side * 0.5);
        fillStroke(g, C.hotPink, 2.5);
      }
      return;
    }
    case 'gold-toque': {
      toque(g, vertical(g, -90, -36, [C.butter, C.gold]), 8);
      starPath(g, 0, -44, 8);
      fillStroke(g, C.white, 2.5);
      return;
    }
    case 'master-toque': {
      toque(g, C.white, 24);
      // A rainbow band.
      g.save();
      rounded(g, -24, -52, 48, 16, 6);
      g.clip();
      CONFETTI.slice(0, 5).forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(-24 + i * 9.6, -52, 9.6, 16);
      });
      g.restore();
      rounded(g, -24, -52, 48, 16, 6);
      g.lineWidth = 3.5;
      g.strokeStyle = C.ink;
      g.stroke();
      // A little crown on top, and sparkles.
      g.beginPath();
      g.moveTo(-12, -104);
      g.lineTo(-14, -122);
      g.lineTo(-5, -112);
      g.lineTo(0, -126);
      g.lineTo(5, -112);
      g.lineTo(14, -122);
      g.lineTo(12, -104);
      g.closePath();
      fillStroke(g, C.gold, 2.5);
      for (const [x, y] of [
        [-34, -96],
        [34, -86],
      ]) {
        starPath(g, x, y, 5 + Math.sin(t * 4 + x) * 1.5, t);
        fillStroke(g, C.butter, 1.5);
      }
      return;
    }
    case '':
      return;
    default:
      toque(g, C.white);
  }
}

/** Colours and pattern of each apron. */
const APRONS: Record<string, { fill: string; mark: 'heart' | 'star' | 'none' }> = {
  'pink-apron': { fill: C.pink, mark: 'heart' },
  'mint-apron': { fill: C.mint, mark: 'heart' },
  'sky-apron': { fill: C.sky, mark: 'star' },
  'polka-apron': { fill: C.lavender, mark: 'none' },
  'strawberry-apron': { fill: C.white, mark: 'none' },
  'rainbow-apron': { fill: C.butter, mark: 'heart' },
  'starry-apron': { fill: C.purple, mark: 'none' },
};

/** Her apron: a rounded bib 56×60 with its top left at (x, y). */
export function drawApron(g: G, id: string, x: number, y: number) {
  const look = APRONS[id] ?? APRONS['pink-apron'];
  const w = 56;
  const h = 60;
  rounded(g, x, y, w, h, 16);
  fillStroke(g, look.fill, 0);
  g.save();
  rounded(g, x, y, w, h, 16);
  g.clip();
  if (id === 'polka-apron') {
    g.fillStyle = C.white;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        circle(g, x + 4 + col * 13 + (row % 2) * 6, y + 6 + row * 13, 3.6);
        g.fill();
      }
    }
  } else if (id === 'strawberry-apron') {
    for (const [sx, sy] of [
      [12, 14],
      [40, 12],
      [26, 32],
      [10, 48],
      [44, 46],
    ]) {
      g.beginPath();
      g.moveTo(x + sx - 6, y + sy - 3);
      g.quadraticCurveTo(x + sx, y + sy - 6, x + sx + 6, y + sy - 3);
      g.quadraticCurveTo(x + sx + 4, y + sy + 8, x + sx, y + sy + 9);
      g.quadraticCurveTo(x + sx - 4, y + sy + 8, x + sx - 6, y + sy - 3);
      g.fillStyle = C.berry;
      g.fill();
      g.fillStyle = C.leaf;
      oval(g, x + sx, y + sy - 5, 5, 2.4);
      g.fill();
    }
  } else if (id === 'rainbow-apron') {
    [C.hotPink, C.carrot, C.butter, C.mint, C.sky, C.lavender].forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(x, y + i * 10, w, 10);
    });
  } else if (id === 'starry-apron') {
    for (const [sx, sy, r] of [
      [12, 12, 5],
      [42, 18, 6],
      [24, 38, 5],
      [46, 48, 4],
      [10, 50, 4],
    ]) {
      starPath(g, x + sx, y + sy, r);
      g.fillStyle = C.butter;
      g.fill();
    }
  }
  g.restore();
  rounded(g, x, y, w, h, 16);
  g.lineWidth = 3.5;
  g.strokeStyle = C.ink;
  g.stroke();
  if (look.mark === 'heart') {
    heartPath(g, x + w / 2, y + 22, 9);
    fillStroke(g, C.white, 2.5);
  } else if (look.mark === 'star') {
    starPath(g, x + w / 2, y + 22, 10);
    fillStroke(g, C.white, 2.5);
  }
}

/**
 * Chef Bunny's head wearing a hat, centred on her head at the origin, for the
 * shop's hat pictures.
 */
export function drawHatIcon(g: G, id: string, t = 0) {
  for (const side of [-1, 1]) {
    oval(g, side * 30, -46, 11, 30, side * 0.55);
    fillStroke(g, C.white);
    oval(g, side * 30, -46, 5, 20, side * 0.55);
    g.fillStyle = C.pink;
    g.fill();
  }
  circle(g, 0, 0, 42);
  fillStroke(g, C.white);
  drawHat(g, id, false, t);
  face(g, 0, 6, 1.2, 'happy');
  drawHat(g, id, true, t);
}
