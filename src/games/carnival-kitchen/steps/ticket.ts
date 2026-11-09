import {
  C,
  clamp01,
  easeOutBack,
  fillStroke,
  plainText,
  rounded,
  stickerText,
  vertical,
} from '../art';
import {
  autoReadDelay,
  drawSpeaker,
  drawWords,
  finishStep,
  fitWords,
  inCircle,
  wordNow,
  type Feedback,
  type Order,
  type Step,
  type StepBasics,
  type Turn,
} from '../kit';
import type { Shape } from '../layout';
import type { Reading } from '../sound';

/**
 * Ticket: an order ticket at the start of the round, such as "A pizza with
 * 2 olives and 3 pepperoni slices, please!". She reads it (or taps 🔊 to hear it),
 * then taps "Let's cook!". The step that adds the toppings or layers then
 * puts on exactly what it says, with its note pinned up. A learning step:
 * there's nothing to get wrong here, and it's no part of the cooking score.
 *
 * Unless "Read it myself" is on, the ticket reads itself out: straight away
 * at Level 1, and after a short pause at Level 2, so she gets the first go.
 */

export interface TicketOptions extends StepBasics {
  kind: 'ticket';
  order: Order;
}

declare module '../kit/types' {
  interface StepKinds {
    ticket: TicketOptions;
  }
}

/** Seconds before "Let's cook!" can be tapped, so a tap from the card doesn't skip the ticket. */
export const TICKET_READY = 1.5;
/** Seconds of cheering after "Let's cook!" before the next step. */
const OUTRO = 0.6;

export interface TicketState {
  /** Seconds since the ticket showed. */
  age: number;
  /** Taps on the speaker. */
  reads: number;
  /** "Let's cook!" was tapped. */
  done: boolean;
  after: number;
}

interface TicketFx {
  reading: Reading | null;
  reads: number;
  autoRead: boolean;
  done: boolean;
}

/** The ticket's paper, its speaker and its button, in scene units, on a computer. */
export const TICKET = {
  paper: { x: 235, y: 150, w: 430, h: 236 },
  speaker: { x: 276, y: 192, r: 24 },
  button: { x: 340, y: 400, w: 220, h: 58 },
} as const;

/**
 * The ticket's places for the canvas's shape: on a phone the speaker and
 * "Let's cook!" are bigger (at least about 60 CSS pixels), and held upright
 * the paper spans the screen.
 */
export function ticketPlaces(shape: Shape = 'page'): {
  paper: { x: number; y: number; w: number; h: number };
  speaker: { x: number; y: number; r: number };
  button: { x: number; y: number; w: number; h: number };
} {
  if (shape === 'tall') {
    return {
      paper: { x: 110, y: 100, w: 580, h: 236 },
      speaker: { x: 172, y: 154, r: 47 },
      // Above the progress star at the bottom.
      button: { x: 220, y: 350, w: 360, h: 106 },
    };
  }
  if (shape === 'wide') {
    return {
      paper: { x: 235, y: 146, w: 430, h: 222 },
      speaker: { x: 283, y: 188, r: 39 },
      button: { x: 320, y: 378, w: 260, h: 84 },
    };
  }
  return TICKET;
}

export function pressTicket(turn: Turn<TicketOptions, TicketState>, x: number, y: number) {
  const s = turn.state;
  if (s.done) return true;
  const { speaker, button } = ticketPlaces(turn.shape);
  if (inCircle(speaker.x, speaker.y, speaker.r, x, y)) {
    s.reads += 1;
    return true;
  }
  const onButton =
    x >= button.x - 8 &&
    x <= button.x + button.w + 8 &&
    y >= button.y - 8 &&
    y <= button.y + button.h + 8;
  if (onButton) {
    if (s.age < TICKET_READY) return false;
    s.done = true;
  }
  return true;
}

const CHEER: Feedback = { grade: 'Great!', points: 0, combo: 0, age: 0 };

const ticket: Step<TicketOptions, TicketState, TicketFx> = {
  kind: 'ticket',
  learning: true,
  // The order's things are checked where they go on: the top or stack step.
  uses: () => [],
  start: () => ({ age: 0, reads: 0, done: false, after: 0 }),
  title: () => 'Read the order!',
  hint: () => ['Read the ticket,', "then tap Let's cook!"],
  icon: () => '🧾',
  progress: ({ state }) => [1, state.done ? 1 : 0],
  press: (turn, x, y) => pressTicket(turn, x, y),
  update(turn, dt) {
    const s = turn.state;
    s.age += dt;
    if (!s.done) return;
    s.after += dt;
    if (s.after >= OUTRO) finishStep(turn.round, 0);
  },
  solve(turn) {
    turn.state.age = Math.max(turn.state.age, TICKET_READY);
    const b = ticketPlaces(turn.shape).button;
    pressTicket(turn, b.x + b.w / 2, b.y + b.h / 2);
    ticket.update?.(turn, OUTRO);
  },

  fx: () => ({ reading: null, reads: 0, autoRead: false, done: false }),

  observe({ state: s, options, fx, effects, round, taking, shape }) {
    const delay = autoReadDelay(round.learn.settings, true);
    if (taking && !fx.autoRead && delay !== null && s.age >= delay && !s.done) {
      fx.autoRead = true;
      fx.reading = effects.sound.read(options.order.text);
    }
    if (s.reads > fx.reads) {
      fx.reads = s.reads;
      fx.autoRead = true;
      fx.reading = effects.sound.read(options.order.text);
    }
    if (s.done && !fx.done) {
      fx.done = true;
      const b = ticketPlaces(shape).button;
      effects.sound.pop();
      effects.burst(b.x + b.w / 2, b.y, 12, ['star', 'heart'], [C.gold, C.hotPink, C.mint], 220);
      effects.celebrate(b.x + b.w / 2, b.y, CHEER);
    }
  },

  draw({ g, t, state: s, options, fx, taking, shape }) {
    if (!taking && s.age === 0) return;
    const { paper, speaker, button } = ticketPlaces(shape);
    const slide = easeOutBack(clamp01(s.age / 0.5));
    g.save();
    g.translate(0, (1 - slide) * -260);
    g.rotate(-0.015);
    // The paper, with a zigzag torn bottom.
    g.beginPath();
    g.moveTo(paper.x, paper.y);
    g.lineTo(paper.x + paper.w, paper.y);
    const bottom = paper.y + paper.h;
    const teeth = 14;
    for (let i = teeth; i >= 0; i--) {
      g.lineTo(paper.x + (paper.w / teeth) * i, bottom - (i % 2 ? 0 : 10));
    }
    g.closePath();
    fillStroke(g, C.cream, 3.5);
    g.fillStyle = C.pink;
    g.fillRect(paper.x + 2, paper.y + 2, paper.w - 4, 12);
    stickerText(g, '🧾 Order', paper.x + paper.w / 2 + 10, paper.y + 40, 30, C.purple);
    const highlight = wordNow(fx.reading);
    drawSpeaker(g, speaker.x, speaker.y, speaker.r, highlight >= 0, t);
    // Dashes under the heading (and the speaker), like a real ticket.
    const rule = Math.max(paper.y + 72, speaker.y + speaker.r + 6);
    g.setLineDash([6, 6]);
    g.strokeStyle = C.lavender;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(paper.x + 20, rule);
    g.lineTo(paper.x + paper.w - 20, rule);
    g.stroke();
    g.setLineDash([]);
    const lines = Math.max(3, Math.floor((paper.y + paper.h - rule - 20) / 46));
    const fit = fitWords(g, options.order.text, paper.w - 50, 34, lines, 18);
    const gap = fit.size * 1.35;
    const middle = (rule + paper.y + paper.h - 10) / 2;
    drawWords(
      g,
      fit.lines,
      paper.x + paper.w / 2,
      middle - ((fit.lines.length - 1) * gap) / 2,
      fit.size,
      gap,
      { highlight, color: C.ink },
    );
    g.restore();

    // Let's cook! Faded until it can be tapped.
    const ready = clamp01((s.age - TICKET_READY + 0.3) / 0.3);
    const pulse = s.done ? 1.1 : 1 + Math.sin(t * 4) * 0.04 * ready;
    g.save();
    g.globalAlpha = 0.35 + 0.65 * ready;
    g.translate(button.x + button.w / 2, button.y + button.h / 2);
    g.scale(pulse, pulse);
    rounded(g, -button.w / 2, -button.h / 2, button.w, button.h, button.h / 2);
    fillStroke(g, vertical(g, -button.h / 2, button.h / 2, [C.cabinetLight, C.mint]), 4);
    plainText(g, "Let's cook! 👍", 0, 2, Math.min(36, button.h * 0.45), C.ink);
    g.restore();
    g.globalAlpha = 1;
  },
};

export default ticket;
