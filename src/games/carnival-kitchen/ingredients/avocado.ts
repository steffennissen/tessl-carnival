import { circle, eggPath, fillStroke, palette } from '../art';
import type { Ingredient } from '../kit';

/** This file's own colours: an avocado's skin, flesh and pit. */
const K = palette({
  skin: '#3f8f4a',
  flesh: '#d8f29a',
  fleshEdge: '#a8d86a',
  pit: '#a0663c',
  pitLight: '#c98a58',
});

/** Half an avocado, for on top, with its round pit. */
const avocado: Ingredient = {
  id: 'avocado',
  label: 'avocado',
  icon: '🥑',
  colors: [K.fleshEdge, K.skin],

  topping: {
    draw(g) {
      eggPath(g, 0, 1, 11, 12);
      fillStroke(g, K.skin, 2.2);
      eggPath(g, 0, 1.5, 8.5, 9.5);
      const flesh = g.createRadialGradient(0, -1, 1, 0, 2, 11);
      flesh.addColorStop(0, K.flesh);
      flesh.addColorStop(1, K.fleshEdge);
      g.fillStyle = flesh;
      g.fill();
      circle(g, 0, -2, 4.6);
      const pit = g.createRadialGradient(-1.5, -3.5, 0.5, 0, -2, 5);
      pit.addColorStop(0, K.pitLight);
      pit.addColorStop(1, K.pit);
      fillStroke(g, pit, 1.8);
      g.fillStyle = 'rgba(255, 255, 255, 0.7)';
      circle(g, -1.6, -3.6, 1.2);
      g.fill();
    },
    // The face goes on the flesh, under the pit.
    faceY: 14,
  },
};

export default avocado;
