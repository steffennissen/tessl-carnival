import { describe, expect, it } from 'vitest';
import { DISHES, dishById } from '../dishes';
import { createState } from '../game';
import { DEFAULT_SETTINGS, orderTotal, type Level } from '../kit';
import type { AskOptions } from '../steps/ask';
import type { StackOptions } from '../steps/stack';
import type { TopOptions, TopState } from '../steps/top';
import { current, nextStep, seeded } from '../test-kit';
import ticket, { countQuestion, makeOrder, ticketTarget, ticketWords } from './ticket';

describe('order tickets', () => {
  it('fits dishes with countable toppings, and the burger', () => {
    const fits = DISHES.filter((d) => ticket.fits(d)).map((d) => d.id);
    expect(fits).toContain('pizza');
    expect(fits).toContain('cheeseburger');
    expect(fits).not.toContain('soup');
    expect(fits).not.toContain('mac-and-cheese');
    expect(ticketTarget(dishById('cheeseburger'))?.kind).toBe('stack');
  });

  it('writes Level 1 tickets with digits and up to 5 things, Level 2 with words and a "No"', () => {
    for (let seed = 1; seed < 40; seed++) {
      const one = makeOrder(dishById('pizza'), 1, seeded(seed));
      expect(one).not.toBeNull();
      if (!one) continue;
      expect(orderTotal(one)).toBeLessThanOrEqual(5);
      expect(one.lines.length).toBeLessThanOrEqual(2);
      expect(one.text).toMatch(/^A pizza with \d/);
      // Toppings by their ticket words: slices of pepperoni, not whole pepperonis.
      expect(one.text).not.toMatch(/pepperonis|\d pepperoni(?! slice)/);
      // The pepperoni chopped earlier always goes on.
      expect(one.lines.map((l) => l.id)).toContain('pepperoni');
      expect(one.without).toBeUndefined();

      const two = makeOrder(dishById('pizza'), 2, seeded(seed));
      if (!two) continue;
      expect(orderTotal(two)).toBeLessThanOrEqual(7);
      expect(two.text).not.toMatch(/\d/);
      expect(two.without).toBeDefined();
      expect(two.text).toMatch(/ No [\w ]+!$/);
      expect(two.lines.map((l) => l.id)).not.toContain(two.without?.id);
    }
    const level2 = makeOrder(dishById('cheeseburger'), 2, seeded(3))?.text;
    expect(level2).toMatch(/^A burger with (one|two) patt(y|ies)/);
  });

  it('writes tickets in words that fit the food', () => {
    expect(ticketWords('pepperoni')).toEqual({ one: 'pepperoni slice', many: 'pepperoni slices' });
    expect(ticketWords('avocado').many).toBe('avocado slices');
    expect(ticketWords('carrot-stick').many).toBe('carrot sticks');
    expect(ticketWords('egg-strip').many).toBe('egg strips');
    expect(ticketWords('olive').many).toBe('olives');
    for (let seed = 1; seed <= 20; seed++) {
      expect(makeOrder(dishById('tacos'), 1, seeded(seed))?.text).toMatch(/^A taco with /);
      expect(makeOrder(dishById('fruit-salad'), 1, seeded(seed))?.text).toMatch(
        /^A fruit salad with /,
      );
      const sushi = makeOrder(dishById('sushi-rolls'), 2, seeded(seed))?.text ?? '';
      expect(sushi).toMatch(/^A sushi roll with /);
      expect(sushi).not.toMatch(/\b(carrots|eggs|cucumbers)\b/);
    }
  });

  it("counts a burger's layers between the buns, as the ticket's note does", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const order = makeOrder(dishById('cheeseburger'), 1, seeded(seed));
      if (!order) continue;
      const { question, tag } = countQuestion(order, 'stack', 1, seeded(seed));
      expect(question.text).toContain('between the buns');
      if (!tag) expect(Number(question.choices[question.answer])).toBe(orderTotal(order));
    }
  });

  it('usually asks for two kinds of things at Level 1', () => {
    for (const dish of ['pizza', 'tacos', 'cupcakes', 'cheeseburger']) {
      let two = 0;
      for (let seed = 1; seed <= 50; seed++) {
        const order = makeOrder(dishById(dish), 1, seeded(seed));
        if (order && order.lines.length === 2) two += 1;
      }
      expect(two, dish).toBeGreaterThanOrEqual(30);
    }
  });

  it('puts exactly the ticket on the pizza, its note pinned up, then asks about it', () => {
    const plan = ticket.weave({
      dish: dishById('pizza'),
      level: 1,
      random: seeded(2),
      start: 900,
    });
    expect(plan.map((s) => s.kind)).toEqual([
      'ticket',
      'chop',
      'dough-toss',
      'sauce',
      'top',
      'ask',
      'bake',
    ]);
    const top = plan[4] as TopOptions;
    const order = top.order;
    expect(order).toBeDefined();
    if (!order) return;
    expect(top.count).toBe(orderTotal(order));
    const state = createState(dishById('pizza'), seeded(), {
      steps: plan,
      activity: 'ticket',
      settings: DEFAULT_SETTINGS,
    });
    state.stepIndex = 4;
    nextStep(state);
    const ids = current<TopState>(state)
      .spots.map((s) => s.id)
      .sort();
    const want = order.lines.flatMap((l) => Array(l.count).fill(l.id)).sort();
    expect(ids).toEqual(want);
    const ask = plan[5] as AskOptions;
    expect(ask.question.choices[ask.question.answer]).toMatch(/^\d+$/);
  });

  it('builds a burger from the ticket, between two buns', () => {
    const plan = ticket.weave({
      dish: dishById('cheeseburger'),
      level: 2,
      random: seeded(4),
      start: 900,
    });
    const stack = plan.find((s): s is StackOptions => s.kind === 'stack');
    expect(stack?.layers[0]).toBe('bun');
    expect(stack?.layers[stack.layers.length - 1]).toBe('bun');
    expect(stack?.layers).toContain('patty');
    for (let seed = 1; seed < 30; seed++) {
      for (const level of [1, 2] as Level[]) {
        const order = makeOrder(dishById('cheeseburger'), level, seeded(seed));
        expect(order?.lines.length).toBeGreaterThanOrEqual(2);
        expect(order?.lines.find((l) => l.id === 'patty')?.count).toBeLessThanOrEqual(2);
      }
    }
    expect(stack && stack.layers.length - 2).toBe(stack?.order && orderTotal(stack.order));
  });

  it('asks counting within 10 at Level 1 and adding within 20 at Level 2', () => {
    for (const level of [1, 2] as Level[]) {
      for (let seed = 1; seed < 40; seed++) {
        const order = makeOrder(dishById('pizza'), level, seeded(seed));
        if (!order) continue;
        const { question, tag } = countQuestion(order, 'top', level, seeded(seed + 100));
        const right = Number(question.choices[question.answer]);
        expect(right).toBeLessThanOrEqual(level === 1 ? 10 : 20);
        expect(right).toBeGreaterThanOrEqual(orderTotal(order));
        if (level === 2) expect(tag).toMatch(/^\+\d/);
        if (!tag) expect(right).toBe(orderTotal(order));
        expect(question.choices).toHaveLength(3);
      }
    }
  });
});
