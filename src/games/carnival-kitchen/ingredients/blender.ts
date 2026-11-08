import {
  C,
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

/** The jar's inside: 112 wide at its foot, 148 at the top, 140 tall. */
const JAR = { bottom: 112, top: 148, height: 140 };

/** A chunky pink blender with a smiley face, a see-through jar and a heart button. */
const blender: Ingredient = {
  id: 'blender',
  label: 'blender',
  icon: '🌀',
  colors: [C.pink, C.hotPink, C.white],

  blender: {
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

    drawJar(g, { whirr, t }) {
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
      const hop = whirr ? Math.abs(Math.sin(t * 22)) * 2 : 0;
      rounded(g, -top / 2 - 8, -height - 14 - hop, top + 16, 20, 10);
      fillStroke(g, vertical(g, -height - 14, -height + 6, [C.pink, C.hotPink]), 3.5);
      rounded(g, -16, -height - 28 - hop, 32, 16, 8);
      fillStroke(g, C.mint, 3);
    },
  },
};

export default blender;
