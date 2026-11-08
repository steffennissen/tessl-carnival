import { describe, expect, it } from 'vitest';
import { press, tick } from '../game';
import { dishById } from '../dishes';
import { middleOf, type Order } from '../kit';
import { createState } from '../game';
import { current, drawRound, nextStep, seeded } from '../test-kit';
import { TICKET, TICKET_READY, type TicketOptions, type TicketState } from './ticket';
import { plainPlan } from '../kit';

const ORDER: Order = {
  text: 'One pizza with 2 olives and 3 mushrooms, please!',
  lines: [
    { id: 'olive', count: 2, icon: '🫒' },
    { id: 'mushroom', count: 3, icon: '🍄' },
  ],
};

function onTicket() {
  const pizza = dishById('pizza');
  const first: TicketOptions = { kind: 'ticket', order: ORDER };
  const dish = { ...pizza, steps: [first, ...pizza.steps] };
  const state = createState(dish, seeded(), plainPlan(dish));
  nextStep(state);
  return state;
}

describe('ticket', () => {
  it("waits a moment before Let's cook! can be tapped, then moves on", () => {
    const state = onTicket();
    const button = middleOf(TICKET.button);
    expect(press(state, button.x, button.y)).toBe(false);
    tick(state, TICKET_READY);
    expect(press(state, button.x, button.y)).toBe(true);
    expect(current<TicketState>(state).done).toBe(true);
    tick(state, 1);
    expect(state.stepIndex).toBe(1);
    expect(state.scores[0]).toBe(0);
  });

  it('reads itself again from its speaker', () => {
    const state = onTicket();
    press(state, TICKET.speaker.x, TICKET.speaker.y);
    expect(current<TicketState>(state).reads).toBe(1);
  });

  it('draws in every layout', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = onTicket();
      tick(state, 0.3);
      drawRound(state, new Map(), 1 / 60, shape);
    }
  });
});
