import { C, type G, circle, face, fillStroke, oval, palette } from '../art';
import type { Ingredient } from '../kit';

export const PASTA = palette({
  pasta: '#ffe28f',
  pastaLight: '#fff3c9',
  coat: '#fff6dc',
  coatShade: '#f3e2b5',
  lump: '#fffaf0',
  pepper: '#4a3a44',
});

export interface NestLook {
  t: number;
  /** 0 to 1: lumps of cheese from getting too hot. */
  lumps?: number;
  /** Turns the strands, for a twirl. */
  twirl?: number;
  /** How domed the nest is, as a share of r. */
  dome?: number;
  /** Pepper freckles and cheese snow on top. */
  pepper?: boolean;
  snow?: boolean;
  mood?: 'happy' | 'joy' | 'wow' | null;
}

/** A tiny hash, so strands and freckles sit still from frame to frame. */
function hash(i: number): number {
  const v = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * A glossy nest of spaghetti centred on (x, y), r across, seen a little from
 * above (about 0.42 r deep), domed in the middle.
 */
export function drawSpaghettiNest(g: G, x: number, y: number, r: number, look: NestLook) {
  const squash = 0.42;
  const dome = (look.dome ?? 0.12) * r;
  const twirl = look.twirl ?? 0;
  const at = (a: number, rr: number) => {
    const share = rr / r;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * squash - (1 - share * share) * dome];
  };

  // The creamy coat underneath.
  g.beginPath();
  for (let k = 0; k <= 32; k++) {
    const [px, py] = at((k / 32) * Math.PI * 2, r * 0.96);
    g.lineTo(px, py);
  }
  g.closePath();
  fillStroke(g, PASTA.coat, 3);
  oval(g, x, y - dome * 0.6, r * 0.62, r * squash * 0.62 + dome * 0.5);
  g.fillStyle = PASTA.coatShade;
  g.fill();

  // Strands, curling round and round, each with an outline and a shine.
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const strands = 15;
  for (let i = 0; i < strands; i++) {
    const a0 = hash(i) * Math.PI * 2 + twirl;
    const base = r * (0.2 + 0.72 * hash(i + 40));
    const points: number[][] = [];
    for (let k = 0; k <= 14; k++) {
      const a = a0 + k * 0.32;
      const rr = Math.min(r * 0.94, base * (1 + 0.12 * Math.sin(k * 1.4 + i)));
      points.push(at(a, rr));
    }
    for (const [width, color] of [
      [6, 'rgba(91, 59, 79, 0.75)'],
      [3.6, i % 3 === 0 ? PASTA.pastaLight : PASTA.pasta],
    ] as const) {
      g.strokeStyle = color;
      g.lineWidth = width * (r / 92);
      g.beginPath();
      for (const [px, py] of points) g.lineTo(px, py);
      g.stroke();
    }
  }
  // A glossy shine.
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(
    x - r * 0.18,
    y - dome - r * 0.06,
    r * 0.3,
    r * 0.08,
    -0.15,
    Math.PI * 1.1,
    Math.PI * 1.7,
  );
  g.stroke();

  if (look.snow) {
    for (let i = 0; i < 40; i++) {
      const [px, py] = at(hash(i + 7) * Math.PI * 2, r * 0.85 * Math.sqrt(hash(i + 3)));
      circle(g, px, py, 2.2 + hash(i) * 1.6);
      fillStroke(g, C.white, 1, 'rgba(91, 59, 79, 0.35)');
    }
  }
  if (look.pepper) {
    g.fillStyle = PASTA.pepper;
    for (let i = 0; i < 34; i++) {
      const [px, py] = at(hash(i + 70) * Math.PI * 2, r * 0.88 * Math.sqrt(hash(i + 90)));
      g.fillRect(px - 1.4, py - 1.4, 2.8, 2.8);
    }
  }

  // Lumps of cheese when it's too hot: puffy blobs that look surprised.
  const lumps = Math.ceil((look.lumps ?? 0) * 4);
  for (let i = 0; i < lumps; i++) {
    const [px, py] = at(i * 1.7 + 0.6, r * (0.35 + 0.15 * (i % 2)));
    const s = 9 * (r / 92);
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const rr = s * (k % 2 ? 0.85 : 1.05);
      g.lineTo(px + Math.cos(a) * rr * 1.2, py - 4 + Math.sin(a) * rr);
    }
    g.closePath();
    fillStroke(g, PASTA.lump, 2.5);
    face(g, px, py - 4, 0.32 * (r / 92), 'wow');
  }

  if (look.mood) face(g, x, y - dome * 0.7 + 2, 0.8 * (r / 92), look.mood);
}

/** Spaghetti, tossed in the pan with the cheese cream until it's glossy. */
const spaghetti: Ingredient = {
  id: 'spaghetti',
  label: 'spaghetti',
  plural: 'spaghetti',
  icon: '🍝',
  colors: [PASTA.pasta, PASTA.coat, C.white],

  tossed: {
    draw(g, { x, y, r, t, lumps, tossing }) {
      drawSpaghettiNest(g, x, y, r, {
        t,
        lumps,
        twirl: t * (tossing ? 1.2 : 0.1),
        pepper: true,
        mood: lumps > 0 ? 'wow' : tossing ? 'joy' : 'happy',
      });
    },
  },
};

export default spaghetti;
