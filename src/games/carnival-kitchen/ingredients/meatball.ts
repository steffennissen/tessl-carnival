import { C, circle, fillStroke, oval, palette } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: a browned meatball. */
const K = palette({ light: '#c98552', main: '#a3603a', dark: '#7a4226' });

/** A round meatball with a dab of sauce, for on top. */
const meatball: Ingredient = {
  id: 'meatball',
  label: 'meatball',
  icon: '🧆',
  colors: [K.main, K.light],

  topping: {
    draw(g) {
      circle(g, 0, 0, 12);
      const ball = g.createRadialGradient(-4, -5, 1, 0, 0, 13);
      ball.addColorStop(0, K.light);
      ball.addColorStop(0.65, K.main);
      ball.addColorStop(1, K.dark);
      fillStroke(g, ball, 2.4);
      // Bumpy, browned bits.
      g.fillStyle = 'rgba(122, 66, 38, 0.6)';
      for (const [dx, dy] of [
        [-6, 3],
        [4, 6],
        [6, -2],
        [-1, -7],
        [-7, -3],
      ]) {
        circle(g, dx, dy, 1.4);
        g.fill();
      }
      // A dab of sauce on top, and a shine.
      g.beginPath();
      g.moveTo(-8, -6);
      g.quadraticCurveTo(0, -14, 8, -6);
      g.quadraticCurveTo(5, -2, 2, -4);
      g.quadraticCurveTo(0, 0, -3, -4);
      g.quadraticCurveTo(-6, -2, -8, -6);
      g.closePath();
      fillStroke(g, C.sauce, 1.6);
      g.fillStyle = 'rgba(255, 255, 255, 0.7)';
      oval(g, -3, -8, 2.4, 1.2, -0.4);
      g.fill();
    },
    // The face goes under the sauce.
    faceY: 8,
  },
};

export default meatball;
