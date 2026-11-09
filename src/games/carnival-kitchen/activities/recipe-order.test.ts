import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from '../dishes';
import { createState, move, press, release, tick } from '../game';
import { DEFAULT_SETTINGS, SMART_BONUS, middleOf, type Level } from '../kit';
import {
  TAP_SLOP,
  cardForNext,
  homeOf,
  sequenceBubble,
  sequencePlaces,
  slotNames,
  type SequenceOptions,
  type SequenceState,
} from '../steps/sequence';
import { cssScale, current, drawRound, keepClear, nextStep, overlaps, seeded } from '../test-kit';
import recipeOrder, { recipeCards, recipeGroups, shuffledTray } from './recipe-order';

describe('put the recipe in order', () => {
  it('fits dishes with three or four steps that read differently', () => {
    const fits = DISHES.filter((d) => recipeOrder.fits(d)).map((d) => d.id);
    expect(fits).toEqual(expect.arrayContaining(['pizza', 'pancakes', 'soup', 'cheeseburger']));
    // Five steps is too many.
    expect(fits).not.toContain('mac-and-cheese');
  });

  it('makes cards from the recipe: emoji and words at Level 1, words only at Level 2', () => {
    const one = recipeCards(dishById('pizza'), 1);
    expect(one.map((c) => c.text)).toEqual([
      'Chop the pepperoni!',
      'Spread the sauce!',
      'Add the toppings!',
      'Bake the pizza!',
    ]);
    expect(one[0].icon).toBe('🔪');
    expect(recipeCards(dishById('pizza'), 2).every((c) => c.icon === null)).toBe(true);
  });

  it('never lays the tray out with the first step first, and repeats for a seed', () => {
    for (let seed = 1; seed < 60; seed++) {
      for (const count of [3, 4]) {
        const tray = shuffledTray(count, seeded(seed));
        expect([...tray].sort()).toEqual(Array.from({ length: count }, (_, i) => i));
        expect(tray[0]).not.toBe(0);
        expect(shuffledTray(count, seeded(seed))).toEqual(tray);
      }
    }
  });

  it('starts the round with the cards, then cooks the real recipe', () => {
    const dish = dishById('soup');
    const steps = recipeOrder.weave({ dish, level: 1, random: seeded(), start: 900 });
    expect(steps.map((s) => s.kind)).toEqual(['sequence', ...dish.steps.map((s) => s.kind)]);
    expect(slotNames(3)).toEqual(['First', 'Next', 'Last']);
    expect(slotNames(4)).toEqual(['First', 'Next', 'Then', 'Last']);
  });
});

/** A round of pizza on its cards. */
function onCards(level: Level = 1, seed = 1, id = 'pizza') {
  const dish = dishById(id);
  const steps = recipeOrder.weave({ dish, level, random: seeded(seed), start: 900 });
  const state = createState(dish, seeded(), {
    steps,
    activity: 'recipe-order',
    settings: { ...DEFAULT_SETTINGS, level },
  });
  nextStep(state);
  return state;
}
type Shape = 'page' | 'wide' | 'tall';
const opts = (state: ReturnType<typeof onCards>) => state.steps[0].options as SequenceOptions;

/** Where card `card` is in the tray. */
function trayAt(state: ReturnType<typeof onCards>, card: number, shape: Shape = 'page') {
  const o = opts(state);
  return middleOf(sequencePlaces(o.cards.length, shape).tray[o.tray.indexOf(card)]);
}

/** Taps a card in the tray. */
function tapCard(state: ReturnType<typeof onCards>, card: number, shape: Shape = 'page') {
  const at = trayAt(state, card, shape);
  press(state, at.x, at.y, shape);
  release(state, shape);
}

/** Drags a card from the tray to a slot, in small moves. */
function dragCard(
  state: ReturnType<typeof onCards>,
  card: number,
  slot: number,
  shape: Shape = 'page',
) {
  const from = trayAt(state, card, shape);
  const to = middleOf(sequencePlaces(opts(state).cards.length, shape).slots[slot]);
  press(state, from.x, from.y, shape);
  for (let i = 1; i <= 10; i++) {
    move(state, from.x + ((to.x - from.x) * i) / 10, from.y + ((to.y - from.y) * i) / 10, shape);
  }
  release(state, shape);
}

describe('the sequence step', () => {
  it('takes taps in order into the next slot, cheers, and starts cooking', () => {
    const state = onCards();
    const s = current<SequenceState>(state);
    for (let card = 0; card < 4; card++) tapCard(state, card);
    expect(s.slots).toEqual([0, 1, 2, 3]);
    expect(s.done).toBe(true);
    expect(state.bonus).toBe(SMART_BONUS);
    expect(sequenceBubble(opts(state), s)).toEqual(['Yes! You are', 'a Smart Chef!']);
    tick(state, 2);
    expect(state.stepIndex).toBe(1);
    expect(state.steps[1].kind).toBe('chop');
  });

  it('takes a card dragged to its own slot, in any order', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = onCards(2);
      const s = current<SequenceState>(state);
      dragCard(state, 3, 3, shape);
      dragCard(state, 0, 0, shape);
      expect(s.slots).toEqual([0, null, null, 3]);
      expect(s.wrong).toBe(0);
    }
  });

  it('slides a wrong card back with a hint, and shows the next one after two', () => {
    const state = onCards();
    const s = current<SequenceState>(state);
    dragCard(state, 2, 0);
    expect(s.slots).toEqual([null, null, null, null]);
    expect(s.wrong).toBe(1);
    expect(s.gliding.map((g) => g.card)).toEqual([2]);
    expect(sequenceBubble(opts(state), s)).toEqual(['Hmm! What do we', 'do first?']);
    // A tap sends a card to the first empty slot: the bake isn't first either.
    tapCard(state, 3);
    expect(s.shown).toBe(true);
    expect(sequenceBubble(opts(state), s)).toEqual(['Look for the', 'glowing card!']);
    for (let card = 0; card < 4; card++) tapCard(state, card);
    expect(s.done).toBe(true);
    expect(s.outcome).toBe('helped');
    expect(state.bonus).toBe(0);
  });

  it('takes steps that could go either way in either order', () => {
    // Fruit salad and smoothie chop either fruit first; pancakes take the
    // eggs or the flour and milk first; the sundae's chocolate goes on before or
    // after the toppings.
    expect(recipeGroups(dishById('fruit-salad'))).toEqual([0, 0, 2, 3]);
    expect(recipeGroups(dishById('strawberry-smoothie'))).toEqual([0, 0, 2, 3]);
    expect(recipeGroups(dishById('pancakes'))).toEqual([0, 0, 2, 3]);
    expect(recipeGroups(dishById('ice-cream-sundae'))).toEqual([0, 1, 2, 2]);
    expect(recipeGroups(dishById('pizza'))).toBeUndefined();
    for (const shape of ['page', 'tall'] as const) {
      const state = onCards(1, 1, 'fruit-salad');
      const s = current<SequenceState>(state);
      // The banana first, then the strawberry: both right.
      dragCard(state, 1, 0, shape);
      tapCard(state, 0, shape);
      expect(s.slots).toEqual([1, 0, null, null]);
      expect(s.wrong).toBe(0);
      tapCard(state, 2, shape);
      tapCard(state, 3, shape);
      expect(s.done).toBe(true);
      expect(s.outcome).toBe('right');
      // The cooking keeps the recipe's order.
      tick(state, 2);
      expect(state.steps.slice(1).map((r) => r.options)).toEqual(dishById('fruit-salad').steps);
    }
    // Still not the mix before the chopping.
    const state = onCards(1, 1, 'fruit-salad');
    dragCard(state, 2, 1);
    expect(current<SequenceState>(state).wrong).toBe(1);
  });

  it('keeps the Smart Chef star with one slip, not two', () => {
    const one = onCards();
    tapCard(one, 2);
    for (let card = 0; card < 4; card++) tapCard(one, card);
    expect(current<SequenceState>(one).outcome).toBe('right');
    const two = onCards();
    tapCard(two, 2);
    tapCard(two, 0);
    tapCard(two, 3);
    expect(current<SequenceState>(two).shown).toBe(true);
    // Helped now: the card that comes next glows.
    expect(cardForNext(opts(two), current<SequenceState>(two))).toBe(1);
  });

  it('lets a card dropped away from the slots slide back, with no try used', () => {
    const state = onCards();
    const s = current<SequenceState>(state);
    const from = trayAt(state, 1);
    press(state, from.x, from.y);
    move(state, from.x + TAP_SLOP * 3, from.y + 10);
    release(state);
    expect(s.wrong).toBe(0);
    expect(s.slots.every((c) => c === null)).toBe(true);
    expect(s.gliding).toHaveLength(1);
    tick(state, 1);
    expect(s.gliding).toHaveLength(0);
    expect(homeOf(opts(state), s, 1)).toEqual(sequencePlaces(4).tray[opts(state).tray.indexOf(1)]);
  });

  it('has big cards clear of everything, and draws while dragging, in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      for (const count of [3, 4]) {
        const places = sequencePlaces(count, shape);
        const boxes = [...places.slots, ...places.tray];
        boxes.forEach((b, i) => {
          if (shape === 'wide' || (shape === 'tall' && count === 3)) {
            expect(b.h * cssScale(shape)).toBeGreaterThanOrEqual(60);
          }
          if (shape === 'tall') expect(b.h * cssScale(shape)).toBeGreaterThanOrEqual(48);
          expect(overlaps(b, places.bubble)).toBe(false);
          for (const clear of keepClear(shape))
            expect(overlaps(b, clear), `${shape} ${i}`).toBe(false);
          boxes.slice(i + 1).forEach((c) => expect(overlaps(b, c)).toBe(false));
        });
        if (shape !== 'page')
          expect(places.speaker.r * 2 * cssScale(shape)).toBeGreaterThanOrEqual(60);
      }
      const state = onCards(1, 2);
      const memory = new Map();
      drawRound(state, memory, 1 / 60, shape);
      const from = trayAt(state, 0, shape);
      press(state, from.x, from.y, shape);
      move(state, from.x - 40, from.y - 60, shape);
      drawRound(state, memory, 1 / 60, shape);
      release(state, shape);
      dragCard(state, 2, 1, shape);
      tick(state, 0.1);
      drawRound(state, memory, 1 / 60, shape);
    }
  });
});
