import { C, type G, emoji, fillStroke, plainText, rounded } from '../art';

/**
 * An order ticket: what a customer asked for, such as "One pizza with 2
 * olives and 3 mushrooms, please!". The ticket activity writes one at the
 * start of a round, the ticket step shows it, and the step that adds those
 * things (toppings, burger layers) puts on exactly that and shows a little
 * note, pinned up, ticking each line off as it goes on.
 */

export interface OrderLine {
  /** The ingredient. */
  id: string;
  count: number;
  /** Its emoji, for the pinned note. */
  icon: string;
}

export interface Order {
  /** The ticket's sentence, as she reads it. */
  text: string;
  /** What goes on, and how many of each. */
  lines: OrderLine[];
  /** Something the customer doesn't want, crossed out on the note. */
  without?: OrderLine;
}

/** How many things the order has in all. */
export function orderTotal(order: Order): number {
  return order.lines.reduce((sum, line) => sum + line.count, 0);
}

/** How many of each line are on so far, given the ids put on so far. */
export function orderCounts(order: Order, placed: readonly string[]): number[] {
  return order.lines.map((line) => placed.filter((id) => id === line.id).length);
}

/** Where the pinned note goes: at the right, clear of the cooking and the HUD in every layout. */
export const NOTE_SPOT = { x: 606, y: 168, w: 88 } as const;

/**
 * The order's note, pinned up at NOTE_SPOT: each line's emoji and how many
 * are on of how many, with a tick once it's done, and anything the customer
 * doesn't want crossed out. `placed` is the ids put on so far.
 */
export function drawOrderNote(g: G, order: Order, placed: readonly string[], t: number): void {
  const { x, y, w } = NOTE_SPOT;
  const rows = order.lines.length + (order.without ? 1 : 0);
  const h = 40 + rows * 38;
  const counts = orderCounts(order, placed);
  g.save();
  g.translate(x + w / 2, y);
  g.rotate(Math.sin(t * 1.3) * 0.02 + 0.03);
  rounded(g, -w / 2, 0, w, h, 10);
  fillStroke(g, C.cream, 3);
  // A pin at the top.
  g.beginPath();
  g.arc(0, 2, 7, 0, Math.PI * 2);
  fillStroke(g, C.hotPink, 2.5);
  plainText(g, 'Order', 0, 22, 16, C.purple);
  order.lines.forEach((line, i) => {
    const ly = 56 + i * 38;
    const done = counts[i] >= line.count;
    if (done) {
      rounded(g, -w / 2 + 5, ly - 16, w - 10, 32, 10);
      fillStroke(g, C.cabinetLight, 0);
    }
    g.fillStyle = C.ink;
    emoji(g, line.icon, -w / 2 + 20, ly + 1, 22);
    plainText(g, `${Math.min(counts[i], line.count)}/${line.count}`, 12, ly + 1, 18, C.ink);
    if (done) {
      g.strokeStyle = C.leafDark;
      g.lineWidth = 3.5;
      g.beginPath();
      g.moveTo(w / 2 - 20, ly);
      g.lineTo(w / 2 - 15, ly + 6);
      g.lineTo(w / 2 - 7, ly - 6);
      g.stroke();
    }
  });
  if (order.without) {
    const ly = 56 + order.lines.length * 38;
    g.fillStyle = C.ink;
    emoji(g, order.without.icon, -w / 2 + 20, ly + 1, 22);
    plainText(g, 'no', 14, ly + 1, 18, C.hotPink);
    g.strokeStyle = C.hotPink;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-w / 2 + 6, ly + 12);
    g.lineTo(-w / 2 + 34, ly - 10);
    g.stroke();
  }
  g.restore();
}
