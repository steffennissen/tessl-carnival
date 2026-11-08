import { C, face, fillStroke, oval, starPath, vertical } from '../art';
import { artOf } from '../ingredients';
import { drawKetchupHeart } from '../ingredients/omelette';
import { riceColor } from '../ingredients/rice';
import { drawSteam, findStep, type Dish } from '../kit';
import type { SauceOptions } from '../steps/sauce';

const omurice: Dish = {
  id: 'omurice',
  name: 'Omurice with a Ketchup Heart',
  steps: [
    { kind: 'chop', item: 'onion' },
    { kind: 'stir', vessel: 'rice-pan', contents: 'rice' },
    { kind: 'crack', item: 'egg' },
    { kind: 'flip', item: 'omelette', count: 3 },
    { kind: 'sauce', base: 'omelette', sauce: 'ketchup', title: 'Draw a ketchup heart!' },
  ],

  draw(g, t, state) {
    const sauce = state && findStep<unknown, SauceOptions>(state, 'sauce');
    const ketchup = artOf(sauce?.options.sauce ?? 'ketchup', 'spread');

    drawSteam(g, t, -10, -54, 40);

    // The plate.
    oval(g, 0, 46, 122, 30);
    fillStroke(g, C.white);
    oval(g, 0, 44, 96, 20);
    g.strokeStyle = C.sky;
    g.lineWidth = 3;
    g.stroke();

    // Rosy rice peeking out under the omelette.
    oval(g, 0, 36, 100, 18);
    fillStroke(g, riceColor(1), 3);
    for (let i = 0; i < 14; i++) {
      const gx = -88 + i * 13.5;
      oval(g, gx, 40 + (i % 2) * 5, 5, 2.6, i * 0.9);
      fillStroke(g, C.cream, 1.2, 'rgba(91, 59, 79, 0.45)');
    }

    // The golden omelette dome.
    g.beginPath();
    g.moveTo(-94, 34);
    g.bezierCurveTo(-100, -40, -40, -62, 0, -62);
    g.bezierCurveTo(40, -62, 100, -40, 94, 34);
    g.quadraticCurveTo(0, 46, -94, 34);
    g.closePath();
    fillStroke(g, vertical(g, -62, 40, [C.yolkLight, C.yolk, C.pancakeDark]));
    g.fillStyle = 'rgba(255, 255, 255, 0.6)';
    oval(g, -50, -34, 18, 8, -0.6);
    g.fill();
    g.strokeStyle = 'rgba(200, 120, 40, 0.35)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(-70, 20);
    g.quadraticCurveTo(0, 32, 70, 20);
    g.stroke();

    // The ketchup heart, and a happy face.
    drawKetchupHeart(g, 0, -24, 20 + Math.sin(t * 3) * 0.8, ketchup);
    face(g, 0, 12, 0.9, 'joy');

    // A little flag on a toothpick.
    g.strokeStyle = C.woodDark;
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(42, -46);
    g.lineTo(48, -98);
    g.stroke();
    const wave = Math.sin(t * 4) * 3;
    g.beginPath();
    g.moveTo(47, -98);
    g.quadraticCurveTo(68, -100 + wave, 86, -88 + wave);
    g.lineTo(46, -74);
    g.closePath();
    fillStroke(g, vertical(g, -100, -74, [C.pink, C.hotPink]), 3);
    starPath(g, 60, -87 + wave * 0.5, 6, 0);
    fillStroke(g, C.butter, 1.8);
  },
};

export default omurice;
