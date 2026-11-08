import { C, blend, face, fillStroke, oval, palette, rounded, starPath } from '../art';
import { BOWL, type Ingredient } from '../kit';

/** This file's own colours: see `palette` in art.ts. */
const SUN = palette({
  light: '#fff1b0',
  gold: '#ffcf4a',
  amber: '#ffa94d',
  coral: '#ff8f7a',
});

/**
 * Sunset splash: a golden, sparkly cooking splash in a round bottle (it
 * stands in for the sherry a real bisque has).
 */
const sunsetSplash: Ingredient = {
  id: 'sunset-splash',
  label: 'sunset splash',
  plural: 'sunset splash',
  icon: '✨',
  colors: [SUN.gold, SUN.light, C.white],

  pour: {
    stream: 'rgba(255, 207, 74, 0.95)',
    grains: SUN.light,
    meter: [SUN.coral, SUN.gold, SUN.light],
    liquid: true,
    /** A round golden bottle with a pink stopper, glittering, with a face. */
    drawContainer(g, pouring) {
      // Neck and stopper.
      rounded(g, -10, -52, 20, 24, 6);
      fillStroke(g, SUN.gold, 3.5);
      rounded(g, -13, -64, 26, 14, 6);
      fillStroke(g, C.hotPink, 3.5);
      // The round body.
      g.beginPath();
      g.ellipse(0, 8, 36, 40, 0, 0, Math.PI * 2);
      const body = g.createRadialGradient(-12, -8, 4, 0, 8, 44);
      body.addColorStop(0, SUN.light);
      body.addColorStop(0.5, SUN.gold);
      body.addColorStop(1, SUN.amber);
      fillStroke(g, body, 4);
      // Glitter inside.
      for (const [sx, sy, r] of [
        [-18, 22, 4],
        [20, 26, 3.5],
        [14, -14, 3],
        [-22, -6, 3],
        [2, 36, 3],
      ]) {
        starPath(g, sx, sy, r, pouring ? sx : 0);
        g.fillStyle = C.white;
        g.fill();
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.55)';
      oval(g, -20, -10, 6, 13, 0.4);
      g.fill();
      face(g, 0, 8, 0.75, pouring ? 'joy' : 'happy');
    },
    /** Golden and glowing, like a sunset in the bowl. */
    drawInBowl(g, amount) {
      oval(g, BOWL.x, 333, 134 * (0.5 + 0.5 * amount), 21 * (0.5 + 0.5 * amount));
      g.fillStyle = blend([SUN.gold, SUN.amber, SUN.coral], 0.3 + amount * 0.4);
      g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 6; i++) {
        starPath(g, BOWL.x - 70 + i * 28, 330 + ((i * 7) % 8), 3 * amount + 1, i);
        g.fill();
      }
    },
  },
};

export default sunsetSplash;
