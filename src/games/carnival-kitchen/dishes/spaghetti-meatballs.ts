import { C, face, fillStroke, horizontal, oval, rounded } from '../art';
import { artOf } from '../ingredients';
import { drawPieceAt, drawPlate, drawSpaghetti } from '../ingredients/spaghetti-plate';
import { drawSteam, type Dish } from '../kit';

const spaghettiMeatballs: Dish = {
  id: 'spaghetti-meatballs',
  name: 'Spaghetti & Meatballs',
  steps: [
    { kind: 'chop', item: 'tomato' },
    { kind: 'stir', vessel: 'pot', contents: 'spaghetti-sauce' },
    { kind: 'season', shaker: 'salt', food: 'spaghetti-sauce' },
    {
      kind: 'top',
      base: 'spaghetti-plate',
      always: ['meatball', 'meatball', 'meatball', 'basil', 'basil'],
      extras: [],
      count: 5,
    },
  ],

  draw(g, t) {
    drawSteam(g, t, -20, -30, 40);
    drawPlate(g, -10, 34, 128, 52);
    drawSpaghetti(g, -10, 20, 104, 44);

    // Meatballs and basil on top; the middle one smiles.
    const meatball = artOf('meatball', 'topping');
    const basil = artOf('basil', 'topping');
    drawPieceAt(g, basil, -62, 8, 1.4, -0.5);
    drawPieceAt(g, basil, 36, 30, 1.3, 2.6);
    drawPieceAt(g, meatball, -42, 20, 1.5, 0);
    drawPieceAt(g, meatball, 20, 2, 1.5, 0);
    drawPieceAt(g, meatball, -10, 30, 1.8, 0);
    face(g, -10, 40, 0.65, 'joy');

    // A fork on the right, twirling a bundle of noodles.
    g.save();
    g.translate(92, -8);
    g.rotate(0.35);
    // The handle and neck.
    rounded(g, -7, -84, 14, 58, 7);
    fillStroke(g, horizontal(g, -7, 7, [C.pink, C.hotPink]), 3);
    rounded(g, -4, -30, 8, 26, 3);
    fillStroke(g, horizontal(g, -4, 4, [C.steelDark, C.white, C.steel]), 2.5);
    // The twirl, going round and round.
    oval(g, 0, 10, 24, 18);
    fillStroke(g, C.pancakeLight, 3);
    g.save();
    oval(g, 0, 10, 24, 18);
    g.clip();
    g.strokeStyle = 'rgba(219, 151, 67, 0.75)';
    g.lineWidth = 2.5;
    for (let k = 0; k < 5; k++) {
      const yy = ((k * 8 + t * 18) % 40) - 10;
      g.beginPath();
      g.ellipse(0, yy, 26, 5, 0.25, 0, Math.PI);
      g.stroke();
    }
    g.restore();
    // A noodle trailing down to the plate.
    g.strokeStyle = C.ink;
    g.lineWidth = 5.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-16, 22);
    g.quadraticCurveTo(-22 + Math.sin(t * 3) * 3, 40, -14, 54);
    g.stroke();
    g.strokeStyle = C.pancakeLight;
    g.lineWidth = 3;
    g.stroke();
    // The steel tines poking out under the twirl.
    g.fillStyle = C.steel;
    g.strokeStyle = C.ink;
    g.lineWidth = 2;
    for (const tx of [-9, -3, 3, 9]) {
      rounded(g, tx - 1.8, 24, 3.6, 10, 1.8);
      g.fill();
      g.stroke();
    }
    g.restore();
  },
};

export default spaghettiMeatballs;
