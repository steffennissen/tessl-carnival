import { C, fillStroke, heartPath, oval, vertical } from '../art';
import { cutsIn, drawCookie, type CookieShape } from '../ingredients/cookies';
import { GOLDEN, findStep, type Dish, type HoldState } from '../kit';

/** Where the cookies sit on the end card's tray: two rows of three. */
const SPOTS = [
  [-72, -22],
  [0, -26],
  [72, -22],
  [-72, 30],
  [0, 26],
  [72, 30],
] as const;

const sugarCookies: Dish = {
  id: 'sugar-cookies',
  name: 'Cut-out Sugar Cookies',
  steps: [
    { kind: 'crack', item: 'egg' },
    { kind: 'mix', vessel: 'mixing-bowl', contents: 'cookie-dough' },
    { kind: 'roll', how: 'dough', item: 'cookie-dough' },
    // A star always, plus a heart, a bunny and a star in any order.
    {
      kind: 'top',
      base: 'cookie-dough',
      always: ['star-cutter'],
      extras: ['star-cutter', 'heart-cutter', 'bunny-cutter'],
      count: 4,
      title: 'Cut the cookies!',
      hint: ['Tap when the cutter', 'is on the sparkle!'],
      icon: '⭐',
    },
    { kind: 'bake', item: 'cookies', minutes: 10 },
  ],

  draw(g, t, state) {
    // The tray, with the shapes you cut and a few more, iced with smiles.
    oval(g, 0, 70, 130, 14);
    g.fillStyle = C.shadow;
    g.fill();
    g.beginPath();
    g.roundRect(-128, -66, 256, 136, 18);
    fillStroke(g, vertical(g, -66, 70, [C.white, C.steel, C.steelDark]));
    g.beginPath();
    g.roundRect(-116, -56, 232, 116, 12);
    fillStroke(g, vertical(g, -56, 60, [C.pink, C.wallBottom]), 2.5);
    const cut = cutsIn(state);
    const more: CookieShape[] = ['heart', 'bunny', 'star'];
    const level = (state && findStep<HoldState>(state, 'bake')?.state.level) ?? GOLDEN;
    SPOTS.forEach(([x, y], i) => {
      const shape = i < cut.length ? cut[i] : more[i % more.length];
      const wobble = Math.sin(t * 3 + i) * 1.5;
      drawCookie(g, shape, x, y + wobble, 24, {
        level: Math.min(level, 0.85),
        icing: true,
        mood: i % 2 === 0 ? 'joy' : 'happy',
      });
    });
    // A heart sticker on the tray.
    heartPath(g, 108, -56, 10 + Math.sin(t * 4));
    fillStroke(g, C.hotPink, 2.5);
  },
};

export default sugarCookies;
