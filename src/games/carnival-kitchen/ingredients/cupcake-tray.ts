import { C, blend, face, fillStroke, oval, palette, rounded, vertical } from '../art';
import { GOLDEN, type Ingredient } from '../kit';

const K = palette({ liner: '#ffc2dc', linerStripe: '#ff8fbf' });

/** A tray of four cupcakes in striped cases, rising and turning golden in the oven. */
const cupcakeTray: Ingredient = {
  id: 'cupcake-tray',
  label: 'cupcakes',
  plural: 'cupcakes',
  icon: '🧁',
  colors: [C.crustGold, C.pink, C.white],

  bake: {
    draw(g, { x, y, level, baking, t }) {
      const rise = Math.min(1, level / GOLDEN);
      const crisp = Math.max(0, (level - GOLDEN) / (1 - GOLDEN));
      const cake =
        level <= GOLDEN
          ? blend([C.doughLight, C.crustGold], rise)
          : blend([C.crustGold, C.crustBrown], crisp);
      const cakeLight = level <= GOLDEN ? C.doughLight : blend([C.dough, C.crustGold], crisp);
      // The tray.
      rounded(g, x - 104, y + 6, 208, 22, 10);
      fillStroke(g, vertical(g, y + 6, y + 28, [C.steel, C.steelDark]), 3.5);
      for (let i = 0; i < 4; i++) {
        const cx = x - 72 + i * 48;
        const bob = baking ? Math.sin(t * 6 + i) * 1.2 : 0;
        // The cake rising out of its case.
        const h = 6 + 18 * rise;
        g.beginPath();
        g.ellipse(cx, y - 18 + bob, 23, h, 0, Math.PI, 0);
        g.closePath();
        const dome = g.createRadialGradient(cx - 6, y - 24, 2, cx, y - 18, 26);
        dome.addColorStop(0, cakeLight);
        dome.addColorStop(1, cake);
        fillStroke(g, dome, 3);
        // The striped case.
        g.beginPath();
        g.moveTo(cx - 22, y - 18);
        g.lineTo(cx + 22, y - 18);
        g.lineTo(cx + 16, y + 10);
        g.lineTo(cx - 16, y + 10);
        g.closePath();
        fillStroke(g, K.liner, 3);
        g.strokeStyle = K.linerStripe;
        g.lineWidth = 2.5;
        for (const sx of [-12, -4, 4, 12]) {
          g.beginPath();
          g.moveTo(cx + sx * 1.25, y - 15);
          g.lineTo(cx + sx, y + 8);
          g.stroke();
        }
        if (rise > 0.6)
          face(g, cx, y - 14 - h * 0.3 + bob, 0.45, level >= GOLDEN * 0.9 ? 'joy' : 'happy');
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.5)';
      oval(g, x - 70, y + 13, 20, 3);
      g.fill();
    },
  },
};

export default cupcakeTray;
