import { C, fillStroke, heartPath, oval, shadow, vertical } from '../art';
import type { Ingredient } from '../kit';

/** The plate a burger is built on, with little hearts round its rim. */
const burgerPlate: Ingredient = {
  id: 'burger-plate',
  label: 'burger',
  icon: '🍔',
  colors: [C.white, C.sky],

  stackBase: {
    top: 10,
    draw(g) {
      shadow(g, 6, 10, 124, 16);
      oval(g, 0, 0, 120, 24);
      fillStroke(g, vertical(g, -24, 24, [C.white, C.skyLight]));
      oval(g, 0, -3, 92, 15);
      g.strokeStyle = C.sky;
      g.lineWidth = 3;
      g.stroke();
      for (const a of [0.25, 0.75, 1.25, 1.75, 2.35, 2.9]) {
        const x = Math.cos(a * Math.PI) * 106;
        const y = Math.sin(a * Math.PI) * 19;
        heartPath(g, x, y, 4.5);
        g.fillStyle = C.pink;
        g.fill();
      }
    },
  },
};

export default burgerPlate;
