import {
  C,
  blend,
  circle,
  face,
  fillStroke,
  heartPath,
  horizontal,
  rounded,
  shadow,
  vertical,
} from '../art';
import type { Ingredient } from '../kit';
import { drawBlended, type BlendedArt, type BlenderArt } from '../steps/blend';
import type { PourIntoArt } from '../steps/pour';

/** The jar's inside: 112 wide at its foot, 148 at the top, 140 tall. */
const JAR = { bottom: 112, top: 148, height: 140 };

/**
 * Where it stands to be poured into: a little smaller than for blending, and
 * low on the counter like the mixing bowl, so the jug fits above it.
 */
const POURING = { x: 400, y: 366, scale: 0.8 };
/** How full the jar is with what's inside before anything's poured, and with nothing. */
const START_FULL = 0.3;
const EMPTY = 0.06;
/** How much fuller everything poured makes it. */
const POURED_FULL = 0.32;

const art: BlenderArt = {
  jar: JAR,

  drawBase(g, { whirr, t, done }) {
    shadow(g, 0, 60, 108, 10);
    // Little round feet.
    for (const side of [-1, 1]) {
      rounded(g, side * 62 - 16, 48, 32, 14, 7);
      fillStroke(g, C.lavender, 3);
    }
    // The chunky body, wider at the bottom.
    g.beginPath();
    g.moveTo(-70, -2);
    g.lineTo(70, -2);
    g.quadraticCurveTo(86, -2, 88, 14);
    g.lineTo(92, 40);
    g.quadraticCurveTo(94, 54, 80, 54);
    g.lineTo(-80, 54);
    g.quadraticCurveTo(-94, 54, -92, 40);
    g.lineTo(-88, 14);
    g.quadraticCurveTo(-86, -2, -70, -2);
    g.closePath();
    fillStroke(g, horizontal(g, -92, 92, [C.hotPink, C.pink, C.pink, C.hotPink]), 4);
    // Shine.
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    rounded(g, -78, 6, 12, 34, 6);
    g.fill();
    // The face, joyful while it whirrs and once it's done.
    face(g, -26, 24, 0.85, whirr || done ? 'joy' : 'happy');
    // The heart button glows while it's on; two little dial buttons beside it.
    heartPath(g, 36, 24, 11 + (whirr ? Math.sin(t * 14) * 1.5 : 0));
    fillStroke(g, whirr ? C.gold : C.white, 3);
    if (whirr) {
      g.strokeStyle = `rgba(255, 201, 60, ${0.5 + Math.sin(t * 14) * 0.2})`;
      g.lineWidth = 3;
      circle(g, 36, 22, 18);
      g.stroke();
    }
    for (const bx of [62, 74]) {
      circle(g, bx, 34, 4.5);
      fillStroke(g, C.mint, 2.5);
    }
    // The collar the jar sits in.
    rounded(g, -JAR.bottom / 2 - 12, -14, JAR.bottom + 24, 18, 9);
    fillStroke(g, horizontal(g, -70, 70, [C.lavender, C.lavenderLight, C.lavender]), 3.5);
  },

  drawJar(g, { whirr, t, open }) {
    const { bottom, top, height } = JAR;
    const jar = () => {
      g.beginPath();
      g.moveTo(-bottom / 2, 0);
      g.lineTo(-top / 2, -height);
      g.lineTo(top / 2, -height);
      g.lineTo(bottom / 2, 0);
      g.closePath();
    };
    // The handle, on the right.
    g.beginPath();
    g.moveTo(top / 2 - 6, -height + 22);
    g.bezierCurveTo(top / 2 + 46, -height + 18, bottom / 2 + 50, -30, bottom / 2 - 4, -24);
    g.lineWidth = 20;
    g.strokeStyle = C.ink;
    g.lineCap = 'round';
    g.stroke();
    g.lineWidth = 12;
    g.strokeStyle = C.pink;
    g.stroke();
    // Glass: a soft tint, an ink edge and shine.
    jar();
    g.fillStyle = 'rgba(223, 242, 255, 0.22)';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = C.ink;
    g.lineJoin = 'round';
    g.stroke();
    g.fillStyle = 'rgba(255, 255, 255, 0.5)';
    g.beginPath();
    g.moveTo(-bottom / 2 + 10, -12);
    g.lineTo(-top / 2 + 12, -height + 14);
    g.lineTo(-top / 2 + 26, -height + 14);
    g.lineTo(-bottom / 2 + 22, -12);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.35)';
    g.beginPath();
    g.moveTo(-bottom / 2 + 30, -12);
    g.lineTo(-top / 2 + 34, -height + 14);
    g.lineTo(-top / 2 + 40, -height + 14);
    g.lineTo(-bottom / 2 + 35, -12);
    g.closePath();
    g.fill();
    // Little measuring hearts up the side.
    for (let k = 1; k <= 3; k++) {
      const y = -height * (k / 4);
      const x = bottom / 2 + ((top - bottom) / 2) * (k / 4) - 16;
      heartPath(g, x, y, 4);
      g.fillStyle = 'rgba(255, 255, 255, 0.85)';
      g.fill();
    }
    // The lid, with a knob that bounces while it whirrs.
    if (open) return;
    const hop = whirr ? Math.abs(Math.sin(t * 22)) * 2 : 0;
    rounded(g, -top / 2 - 8, -height - 14 - hop, top + 16, 20, 10);
    fillStroke(g, vertical(g, -height - 14, -height + 6, [C.pink, C.hotPink]), 3.5);
    rounded(g, -16, -height - 28 - hop, 32, 16, 8);
    fillStroke(g, C.mint, 3);
  },
};

/**
 * The blender with its lid off, for pouring into: what's inside sits at the
 * bottom of the jar, and everything poured raises it and tints it.
 */
const pourInto: PourIntoArt = {
  // Just right of the middle, a little below where it starts, so the
  // stream reaches what's in it through the glass.
  mouth: {
    x: POURING.x + 20,
    y: POURING.y - JAR.height * POURING.scale * START_FULL,
  },
  draw(g, { t, inside, poured }) {
    const total = poured.reduce((sum, p) => sum + p.amount, 0) / Math.max(1, poured.length);
    // What's in the jar: what was inside, or the first pour, tinted by every pour.
    const first = poured[0]?.art.color ?? C.white;
    const base: BlendedArt = inside?.art ?? {
      chunks: [],
      chunky: first,
      smooth: first,
      light: C.white,
    };
    const tint = (color: string) =>
      poured.reduce((mixed, p) => blend([mixed, p.art.color], 0.45 * p.amount), color);
    const contents: BlendedArt = {
      ...base,
      chunky: tint(base.chunky),
      smooth: tint(base.smooth),
    };
    const fill = (inside ? START_FULL : EMPTY) + POURED_FULL * total;

    g.save();
    g.translate(POURING.x, POURING.y);
    g.scale(POURING.scale, POURING.scale);
    art.drawBase(g, { whirr: false, t, done: false });
    if (fill > 0) {
      g.save();
      g.beginPath();
      g.moveTo(-JAR.bottom / 2, 0);
      g.lineTo(-JAR.top / 2, -JAR.height);
      g.lineTo(JAR.top / 2, -JAR.height);
      g.lineTo(JAR.bottom / 2, 0);
      g.closePath();
      g.clip();
      drawBlended(g, JAR, contents, {
        smooth: inside?.smooth ?? 1,
        spin: t * 0.8,
        shake: 0,
        t,
        fill,
      });
      g.restore();
    }
    art.drawJar(g, { whirr: false, t, open: true });
    g.restore();
  },
};

/** A chunky pink blender with a smiley face, a see-through jar and a heart button. */
const blender: Ingredient = {
  id: 'blender',
  label: 'blender',
  icon: '🌀',
  colors: [C.pink, C.hotPink, C.white],
  blender: art,
  pourInto,
};

export default blender;
