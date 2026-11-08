import { C, circle, fillStroke, oval, palette, vertical } from '../art';
import type { Ingredient } from '../kit';

const K = palette({ cherry: '#ff3d6b', cherryDark: '#c9214b', stem: '#6aa84f' });

/** A shiny cherry with a curly stem and a leaf. */
const cherry: Ingredient = {
  id: 'cherry',
  label: 'cherry',
  plural: 'cherries',
  icon: '🍒',
  colors: [K.cherry, C.pink],

  topping: {
    draw(g) {
      g.strokeStyle = K.stem;
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0, -6);
      g.quadraticCurveTo(2, -16, 9, -19);
      g.stroke();
      oval(g, 12, -16, 6, 3, -0.6);
      fillStroke(g, C.leaf, 2);
      circle(g, 0, 3, 11);
      fillStroke(g, vertical(g, -8, 14, [K.cherry, K.cherryDark]), 2.5);
      g.fillStyle = 'rgba(255, 255, 255, 0.75)';
      oval(g, -4, -2, 3.5, 2, -0.5);
      g.fill();
    },
    faceY: 5,
  },
};

export default cherry;
