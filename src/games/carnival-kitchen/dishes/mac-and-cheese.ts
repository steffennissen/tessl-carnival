import { C, type G, face, fillStroke, oval, palette, vertical } from '../art';
import { crumbsIn, drawCasserole } from '../ingredients/casserole';
import { SAUCE } from '../ingredients/cheese-sauce';
import { drawElbow } from '../ingredients/macaroni';
import { GOLDEN, findStep, type Dish, type HoldState } from '../kit';

const K = palette({ string: '#ffc65c' });

/** Lavender wisps of steam, so they show on the end card's white. */
function steam(g: G, t: number, x: number, y: number, gap: number) {
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.5 + i / 3) % 1;
    g.strokeStyle = `rgba(205, 178, 255, ${0.9 * Math.sin(phase * Math.PI)})`;
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    const wx = x - gap + i * gap;
    for (let k = 0; k <= 8; k++) g.lineTo(wx + Math.sin(k + t * 3 + i) * 6, y - phase * 36 - k * 5);
    g.stroke();
  }
}

const macAndCheese: Dish = {
  id: 'mac-and-cheese',
  name: 'Mac and Cheese',
  steps: [
    { kind: 'grate', item: 'cheddar' },
    { kind: 'pour', pours: ['milk'], into: 'pot', amounts: ['2 cups'], title: 'Pour the milk!' },
    { kind: 'stir', vessel: 'pot', contents: 'cheese-sauce' },
    // Four sprinkles of crumbs, one after another.
    {
      kind: 'top',
      base: 'casserole',
      always: ['breadcrumbs'],
      extras: ['breadcrumbs', 'breadcrumbs', 'breadcrumbs'],
      count: 4,
      title: 'Sprinkle the crumbs!',
      hint: ['Tap when the crumbs', 'are on the sparkle!'],
    },
    { kind: 'bake', item: 'casserole', minutes: 25 },
  ],

  draw(g, t, state) {
    const baked = (state && findStep<HoldState>(state, 'bake')?.state.level) ?? GOLDEN;
    steam(g, t, -40, -30, 40);
    drawCasserole(g, 0, 10, 116, 48, {
      crumbs: crumbsIn(state),
      baked,
      t,
      bubbling: true,
    });

    // A spoonful lifting out, with a long stretchy string of cheese.
    const lift = Math.sin(t * 1.6) * 6;
    const sx = 58;
    const sy = -52 + lift;
    const sag = 10 + Math.sin(t * 1.6) * 4;
    g.lineCap = 'round';
    for (const [width, color] of [
      [9, 'rgba(91, 59, 79, 0.8)'],
      [6, K.string],
    ] as const) {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(sx - 6, sy + 10);
      g.bezierCurveTo(sx - 12 + sag, sy + 30, sx - 30 - sag, sy + 44, sx - 22, 12);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(sx - 7, sy + 14);
    g.bezierCurveTo(sx - 12 + sag, sy + 30, sx - 28 - sag, sy + 40, sx - 22, 6);
    g.stroke();
    g.save();
    g.translate(sx, sy);
    g.rotate(-0.5);
    // The handle, then the bowl of the spoon, heaped with macaroni.
    g.beginPath();
    g.roundRect(14, -6, 78, 12, 6);
    fillStroke(g, vertical(g, -6, 6, [C.white, C.steelDark]), 3);
    oval(g, 0, 0, 22, 14);
    fillStroke(g, vertical(g, -14, 14, [C.white, C.steel]), 3);
    oval(g, 0, -3, 18, 8);
    g.fillStyle = SAUCE.sauce;
    g.fill();
    drawElbow(g, -7, -6, 0.3, 0.9);
    drawElbow(g, 6, -7, 2.2, 0.9);
    g.restore();

    face(g, -62, 60, 0.8, 'joy');
  },
};

export default macAndCheese;
