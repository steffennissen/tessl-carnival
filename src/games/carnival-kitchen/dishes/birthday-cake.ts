import { CONFETTI, starPath } from '../art';
import { cakeToppings, drawBirthdayCake } from '../ingredients/birthday-cake';
import { findStep, type Dish } from '../kit';
import type { PartyState } from '../steps/party';
import type { TopState } from '../steps/top';

/** The toppings, in the cake's own units, when nobody put any on. */
const TOPPINGS = [
  { id: 'candle', x: -46, y: -4 },
  { id: 'candle', x: 0, y: -12 },
  { id: 'candle', x: 46, y: -4 },
  { id: 'sprinkles', x: -30, y: 14 },
  { id: 'cherry', x: 34, y: 14 },
];

/**
 * The surprise dish: a birthday cake. It's `locked`, so it joins the random
 * pick, and its page in the recipe book unwraps, once every other dish has
 * its sticker.
 */
const birthdayCake: Dish = {
  id: 'birthday-cake',
  name: 'Birthday Cake',
  locked: true,
  steps: [
    { kind: 'crack', item: 'egg' },
    { kind: 'pour', pours: ['flour', 'sugar'], amounts: ['2 cups', '1 cup'] },
    { kind: 'mix', vessel: 'mixing-bowl', contents: 'cupcake-batter' },
    { kind: 'bake', item: 'birthday-cake', minutes: 30 },
    // The candles go on (and get lit and blown out) at the party.
    {
      kind: 'top',
      base: 'birthday-cake',
      always: ['sprinkles', 'cherry'],
      extras: ['candy-heart', 'heart-cutter', 'star-cutter'],
      count: 4,
    },
    { kind: 'party', cake: 'birthday-cake', candles: 5, minutes: 5 },
  ],

  draw(g, time, state) {
    const top = state && findStep<TopState>(state, 'top');
    // The party's candles stand on it too, where they were lit.
    const party = state && findStep<PartyState>(state, 'party');
    const candles = cakeToppings(
      (party?.state.candles ?? []).map((c) => ({ id: 'candle', x: c.x, y: c.y - 16 })),
    );
    g.save();
    g.translate(0, -10);
    g.scale(0.62, 0.62);
    drawBirthdayCake(g, top ? [...cakeToppings(top.state.spots), ...candles] : TOPPINGS, 'joy');
    g.restore();

    // Party stars twinkling round it.
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (110 + (i % 3) * 8);
      const y = 50 - Math.floor(i / 2) * 34;
      starPath(g, x, y, 6 + Math.abs(Math.sin(time * 3 + i)) * 4, time + i);
      g.fillStyle = CONFETTI[i % CONFETTI.length];
      g.fill();
    }
  },
};

export default birthdayCake;
