import {
  C,
  type G,
  circle,
  clamp01,
  easeOutBack,
  emoji,
  face,
  fillStroke,
  heartPath,
  oval,
  plainText,
  rounded,
  starPath,
  stickerText,
  vertical,
} from './art';
import type { Box } from './book';
import { type BunnyLook, calmPose, drawBunny } from './bunny';
import {
  CHEFS,
  JUDGES,
  JUDGING,
  cardTotal,
  chefPlaces,
  judgeLine,
  judgingMoment,
  judgingPlaces,
  judgingTimes,
  menuPlaces,
  turnCardPlaces,
  type Cookoff,
  type CookoffChef,
  type Verdict,
} from './cookoff';
import { CUSTOMERS, type Guest, type GuestKind } from './customers';
import { type DecorState, drawDecorations } from './decorate';
import type { KitchenState } from './kit';
import type { Layout } from './layout';
import { drawGuest, drawTrophy, drawSaying, drawRibbon, type GuestPose } from './stand';

/**
 * Drawing the cook-off (see cookoff.ts): the title screen's button, the
 * menu, picking animal chefs, the cards between rounds, and the judging
 * scene with its three judges. Places come from cookoff.ts, so a tap hits
 * what's drawn. render.ts calls these and plays the sounds.
 */

/** A guest of the stand to draw as a chef (two chefs) or a judge (Lulu). */
function guestOf(kind: GuestKind): Guest {
  return CUSTOMERS.find((c) => c.kind === kind) ?? CUSTOMERS[0];
}

const still = (t: number, mood: GuestPose['mood'] = 'idle', age = 9): GuestPose => ({
  t,
  mood,
  age,
  walk: 0,
  wave: false,
});

/** Each player's colour: Player 1 pink, Player 2 blue. */
const TEAM = [C.pink, C.sky] as const;

/** The title screen's Cook-off button. */
export function drawCookoffButton(g: G, box: Box, t: number) {
  const wiggle = Math.sin(t * 2.2 + 2) * 0.03;
  g.save();
  g.translate(box.x + box.w / 2, box.y + box.h / 2);
  g.rotate(wiggle);
  rounded(g, -box.w / 2, -box.h / 2, box.w, box.h, box.h / 2);
  fillStroke(g, vertical(g, -box.h / 2, box.h / 2, [C.lavenderLight, C.lavender]), 4);
  g.fillStyle = C.ink;
  const icon = Math.min(36, box.h * 0.45);
  emoji(g, '🏆', -box.w / 2 + icon * 0.85, 2, icon);
  const left = -box.w / 2 + icon * 1.6;
  const right = box.w / 2 - 12;
  stickerText(
    g,
    'Cook-off',
    (left + right) / 2,
    2,
    Math.min(30, box.h * 0.36),
    C.hotPink,
    'center',
    right - left,
  );
  g.restore();
}

/** A cook-off page's background and its ✕. */
function drawPage(g: G, layout: Layout, close?: { x: number; y: number; r: number }) {
  rounded(g, 10, 10, layout.width - 20, layout.height - 20, 32);
  fillStroke(g, C.cream, 5, C.purple);
  if (close) {
    circle(g, close.x, close.y, close.r);
    fillStroke(g, C.white, 3.5);
    plainText(g, '✕', close.x, close.y + 1, close.r * 0.9, C.ink);
  }
}

/** A chef: an animal from the stand, or (for her) Chef Bunny, feet at (x, y). */
function drawChef(
  g: G,
  chef: CookoffChef,
  x: number,
  y: number,
  scale: number,
  pose: GuestPose,
  look?: BunnyLook,
) {
  if (chef.kind) {
    drawGuest(g, guestOf(chef.kind), x, y, scale, pose);
    return;
  }
  g.save();
  g.translate(x, y);
  g.scale(scale * 0.62, scale * 0.62);
  drawBunny(
    g,
    { x: 0, y: -150 },
    calmPose(pose.t, pose.mood === 'idle' ? 'idle' : 'cheer', pose.age),
    look,
  );
  g.restore();
}

/** The cook-off's first page: Beat your best, or Two chefs. */
export function drawMenu(g: G, layout: Layout, t: number) {
  const p = menuPlaces(layout);
  drawPage(g, layout, p.close);
  stickerText(
    g,
    '🏆 Cook-off! 🏆',
    p.title.x,
    p.title.y,
    layout.shape === 'tall' ? 50 : 46,
    vertical(g, p.title.y - 24, p.title.y + 24, [C.gold, C.hotPink]),
    'center',
    layout.shape === 'tall' ? 400 : 520,
  );
  const choices: [Box, string, string, string[]][] = [
    [p.best, 'Beat your best', 'Can you beat your best score?', [C.butter, C.gold]],
    [p.duo, 'Two chefs', 'Cook, pass, and the judges decide!', [C.skyLight, C.sky]],
  ];
  choices.forEach(([box, name, line, colours], i) => {
    const bob = Math.sin(t * 2.4 + i * 1.7) * 3;
    rounded(g, box.x, box.y + bob, box.w, box.h, 34);
    fillStroke(g, vertical(g, box.y, box.y + box.h, colours), 5);
    const cx = box.x + box.w / 2;
    const top = box.y + bob;
    const pic = Math.min(box.h * 0.55, 190);
    if (i === 0) {
      drawTrophy(g, cx, top + 30 + pic * 0.55, pic / 190, '⭐', t, (t * 0.5) % 1.6);
    } else {
      const s = pic / 190;
      drawGuest(g, guestOf('fox'), cx - 62 * s, top + 22 + pic, s, still(t));
      drawGuest(g, guestOf('bear'), cx + 62 * s, top + 22 + pic, s, still(t + 1));
    }
    stickerText(g, name, cx, top + box.h - 76, 34, C.hotPink, 'center', box.w - 30);
    stickerText(g, line, cx, top + box.h - 32, 20, C.purple, 'center', box.w - 30);
  });
}

/** Picking a chef: Player 1 first, then Player 2 (Player 1's is taken). */
export function drawChefPicker(g: G, layout: Layout, picking: number, taken: number[], t: number) {
  const p = chefPlaces(layout);
  drawPage(g, layout, p.close);
  stickerText(
    g,
    `Player ${picking + 1}: pick your chef!`,
    p.title.x,
    p.title.y,
    layout.shape === 'tall' ? 40 : 38,
    TEAM[picking] === C.pink ? C.hotPink : C.skyDark,
    'center',
    layout.shape === 'tall' ? 420 : 560,
  );
  p.cells.forEach((cell, i) => {
    const chef = CHEFS[i];
    const by = taken.indexOf(i);
    const pad = 6;
    rounded(g, cell.x + pad, cell.y + pad, cell.w - 2 * pad, cell.h - 2 * pad, 24);
    fillStroke(g, by >= 0 ? TEAM[by] : C.white, 4);
    g.globalAlpha = by >= 0 ? 0.55 : 1;
    const s = Math.min((cell.h - 70) / 175, (cell.w - 20) / 140);
    if (chef.kind) {
      drawGuest(g, guestOf(chef.kind), cell.x + cell.w / 2, cell.y + cell.h - 46, s, still(t + i));
    }
    g.globalAlpha = 1;
    stickerText(
      g,
      chef.name,
      cell.x + cell.w / 2,
      cell.y + cell.h - 26,
      Math.min(22, cell.h * 0.13),
      C.purple,
      'center',
      cell.w - 20,
    );
    if (by >= 0) {
      circle(g, cell.x + cell.w - 30, cell.y + 30, 22);
      fillStroke(g, C.white, 3);
      plainText(g, `P${by + 1}`, cell.x + cell.w - 30, cell.y + 31, 18, C.ink);
    }
  });
}

/** Which card is up between rounds. */
export type TurnCardKind = 'challenge' | 'turn' | 'pass';

/**
 * The card between rounds: Chef Bunny's challenge, Player 1's turn, or
 * "Pass it to Player 2!". `age` is how long it has been up; once
 * `ready`, it says to tap.
 */
export function drawTurnCard(
  g: G,
  layout: Layout,
  kind: TurnCardKind,
  cookoff: Cookoff,
  lines: [string, string],
  t: number,
  age: number,
  ready: boolean,
  look?: BunnyLook,
) {
  const p = turnCardPlaces(layout);
  const pop = easeOutBack(clamp01(age / 0.4));
  const { card } = p;
  g.fillStyle = 'rgba(91, 59, 79, 0.35)';
  g.fillRect(0, 0, layout.width, layout.height);
  g.save();
  g.translate(card.x + card.w / 2, card.y + card.h / 2);
  g.scale(pop, pop);
  g.translate(-(card.x + card.w / 2), -(card.y + card.h / 2));
  rounded(g, card.x, card.y, card.w, card.h, 40);
  const team = kind === 'pass' ? TEAM[1] : kind === 'turn' ? TEAM[0] : C.butter;
  fillStroke(g, vertical(g, card.y, card.y + card.h, [C.white, team]), 6, C.ink);
  // The dish they'll cook.
  g.save();
  g.translate(p.dish.x, p.dish.y);
  g.scale(p.dish.scale, p.dish.scale);
  cookoff.dish.draw(g, t, null);
  g.restore();
  // Who's cooking: Chef Bunny with her challenge, or the player's chef.
  const chef = kind === 'challenge' ? null : cookoff.chefs[kind === 'pass' ? 1 : 0];
  const hop = still(t, ready ? 'happy' : 'idle', ready ? age % 1.6 : 9);
  if (chef) drawChef(g, chef, p.figure.x, p.figure.y, p.figure.scale, hop);
  else drawChef(g, { kind: null, name: '' }, p.figure.x, p.figure.y, p.figure.scale, hop, look);
  stickerText(g, lines[0], p.lines[0].x, p.lines[0].y, 34, C.hotPink, 'center', p.width);
  stickerText(g, lines[1], p.lines[1].x, p.lines[1].y, 30, C.purple, 'center', p.width);
  plainText(g, `🍽️ ${cookoff.dish.name}`, p.lines[2].x, p.lines[2].y, 24, C.ink);
  if (ready) {
    const pulse = 1 + Math.sin(t * 4) * 0.05;
    g.save();
    g.translate(p.tap.x, p.tap.y);
    g.scale(pulse, pulse);
    stickerText(
      g,
      kind === 'pass' ? "Tap when you're ready! 👆" : 'Tap to start! 👆',
      0,
      0,
      30,
      C.hotPink,
    );
    g.restore();
  }
  g.restore();
}

// ---------------------------------------------------------------------------
// The judges

/** How a judge looks right now. */
export interface JudgePose {
  t: number;
  /** Chewing: 0 to 1 through a bite, or -1 when not. */
  chew: number;
  /** Delighted (after tasting, as the card goes up). */
  happy: boolean;
}

/** Duchess Purrington: a fancy white cat with a monocle and pearls. */
function drawCat(g: G, pose: JudgePose) {
  const { t, chew } = pose;
  // A curly tail.
  g.lineWidth = 12;
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.beginPath();
  g.moveTo(34, -30);
  g.quadraticCurveTo(70, -40 + Math.sin(t * 2) * 6, 58, -84);
  g.stroke();
  g.lineWidth = 7;
  g.strokeStyle = C.white;
  g.stroke();
  for (const side of [-1, 1]) {
    oval(g, side * 17, -6, 15, 9);
    fillStroke(g, C.white, 3.5);
  }
  oval(g, 0, -48, 38, 44);
  fillStroke(g, C.white);
  oval(g, 0, -40, 24, 26);
  g.fillStyle = C.cream;
  g.fill();
  // Pearls.
  for (let i = -3; i <= 3; i++) {
    circle(g, i * 9, -86 + Math.abs(i) * -1.5 + 4, 4.2);
    fillStroke(g, C.lavenderLight, 1.5);
  }
  // Ears, head and a pink bow.
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * 14, -150);
    g.lineTo(side * 34, -190);
    g.lineTo(side * 42, -136);
    g.closePath();
    fillStroke(g, C.white);
    g.beginPath();
    g.moveTo(side * 22, -150);
    g.lineTo(side * 33, -178);
    g.lineTo(side * 37, -146);
    g.closePath();
    g.fillStyle = C.pink;
    g.fill();
  }
  circle(g, 0, -118, 42);
  fillStroke(g, C.white);
  heartPath(g, -24, -156, 9);
  fillStroke(g, C.hotPink, 2.5);
  face(g, 0, -114, 1.15, pose.happy ? 'joy' : 'happy');
  // Whiskers.
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  for (const side of [-1, 1]) {
    for (const dy of [-4, 3]) {
      g.beginPath();
      g.moveTo(side * 24, -106 + dy);
      g.lineTo(side * 48, -110 + dy * 2);
      g.stroke();
    }
  }
  // The monocle, on a little gold chain.
  circle(g, 11, -114, 11);
  g.fillStyle = 'rgba(255, 255, 255, 0.35)';
  g.fill();
  g.lineWidth = 3.5;
  g.strokeStyle = C.gold;
  g.stroke();
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(21, -108);
  g.quadraticCurveTo(34, -92, 26, -80);
  g.stroke();
  if (chew >= 0) chewMouth(g, 0, -103, 1, chew);
}

/** Hugo the Hippo: a big, hungry hippo with a napkin bib. */
function drawHippo(g: G, pose: JudgePose) {
  const { chew } = pose;
  for (const side of [-1, 1]) {
    oval(g, side * 20, -6, 17, 10);
    fillStroke(g, C.lavender, 3.5);
  }
  oval(g, 0, -50, 46, 48);
  fillStroke(g, C.lavender);
  oval(g, 0, -42, 30, 30);
  g.fillStyle = C.lavenderLight;
  g.fill();
  // The napkin bib, with dots.
  g.beginPath();
  g.moveTo(-30, -92);
  g.lineTo(30, -92);
  g.lineTo(0, -48);
  g.closePath();
  fillStroke(g, C.white, 3);
  for (const [dx, dy] of [
    [-12, -82],
    [10, -80],
    [0, -66],
  ]) {
    circle(g, dx, dy, 3.4);
    g.fillStyle = C.sky;
    g.fill();
  }
  // A big head: little ears, eyes up top, and a wide snout.
  for (const side of [-1, 1]) {
    circle(g, side * 32, -160, 11);
    fillStroke(g, C.lavender, 3.5);
    circle(g, side * 32, -160, 5);
    g.fillStyle = C.pink;
    g.fill();
  }
  oval(g, 0, -128, 46, 38);
  fillStroke(g, C.lavender);
  oval(g, 0, -102, 44, 26);
  fillStroke(g, C.lavenderLight);
  for (const side of [-1, 1]) {
    oval(g, side * 12, -110, 4, 3);
    g.fillStyle = C.ink;
    g.fill();
  }
  g.fillStyle = C.ink;
  for (const side of [-1, 1]) {
    if (pose.happy) {
      g.strokeStyle = C.ink;
      g.lineWidth = 2.6;
      g.beginPath();
      g.arc(side * 16, -138, 5, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    } else {
      circle(g, side * 16, -138, 4.5);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(255, 110, 160, 0.45)';
  for (const side of [-1, 1]) {
    oval(g, side * 34, -118, 7, 4);
    g.fill();
  }
  if (chew >= 0) chewMouth(g, 0, -90, 1.5, chew);
  else {
    g.strokeStyle = C.ink;
    g.lineWidth = 2.6;
    g.beginPath();
    g.arc(0, -96, 12, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
  }
}

/** A mouth munching: open and shut a few times through a bite. */
function chewMouth(g: G, x: number, y: number, s: number, chew: number) {
  const open = Math.abs(Math.sin(chew * Math.PI * 5));
  oval(g, x, y, 7 * s, (1.5 + open * 6) * s);
  fillStroke(g, C.ink, 0);
  if (open > 0.4) {
    oval(g, x, y + 2 * s * open, 4 * s, 2 * s * open);
    g.fillStyle = C.hotPink;
    g.fill();
  }
}

/** A judge (0 the Duchess, 1 Hugo, 2 Lulu), feet at (x, y). */
export function drawJudge(
  g: G,
  judge: number,
  x: number,
  y: number,
  scale: number,
  pose: JudgePose,
) {
  if (judge === 2) {
    const chewing = pose.chew >= 0;
    drawGuest(g, guestOf('lobster'), x, y, scale, {
      t: pose.t,
      mood: pose.happy ? 'happy' : chewing ? 'wow' : 'idle',
      age: pose.happy ? pose.t % 1.4 : chewing ? pose.chew : 9,
      walk: 0,
      wave: false,
    });
    return;
  }
  const bob = pose.chew >= 0 ? Math.sin(pose.chew * Math.PI * 5) * 3 : Math.sin(pose.t * 2.2) * 1.5;
  const hop = pose.happy ? -Math.abs(Math.sin(pose.t * 7)) * 8 : 0;
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.fillStyle = C.shadow;
  oval(g, 0, 2, 48, 8);
  g.fill();
  g.translate(0, bob + hop);
  if (judge === 0) drawCat(g, pose);
  else drawHippo(g, pose);
  g.restore();
}

/** Each judge's paw colour, holding up their card. */
const PAWS = [C.white, C.lavender, C.carrotLight] as const;

/**
 * A score card on a stick, centred on (x, y), `w` by `h`. `flip` (0 to 1)
 * turns it round: its starry back first, then the number. The stick slants
 * down to a paw beside the judge's head, so it never covers their face.
 */
export function drawScoreCard(
  g: G,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  flip: number,
  paw: string = C.white,
) {
  const turn = Math.cos(clamp01(flip) * Math.PI);
  const front = flip >= 0.5;
  const px = x + w * 0.6;
  const py = y + h / 2 + 34;
  g.lineCap = 'round';
  g.strokeStyle = C.ink;
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(x + w * 0.2, y + h / 2 - 4);
  g.lineTo(px, py);
  g.stroke();
  g.strokeStyle = C.woodLight;
  g.lineWidth = 5;
  g.stroke();
  circle(g, px, py, 11);
  fillStroke(g, paw, 3);
  g.save();
  g.translate(x, y);
  g.scale(Math.max(0.04, Math.abs(turn)), 1);
  rounded(g, -w / 2, -h / 2, w, h, 14);
  if (front) {
    fillStroke(g, C.white, 4);
    rounded(g, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 10);
    g.strokeStyle = C.gold;
    g.lineWidth = 3;
    g.stroke();
    stickerText(g, String(value), 0, 3, h * 0.62, value >= 9 ? C.hotPink : C.purple);
  } else {
    fillStroke(g, vertical(g, -h / 2, h / 2, [C.lavender, C.purple]), 4);
    starPath(g, 0, 0, h * 0.28);
    fillStroke(g, C.butter, 2.5);
  }
  g.restore();
}

// ---------------------------------------------------------------------------
// The judging scene

/** A chef's finished dish, and its decorations, to put on the judges' table. */
export interface Plate {
  state: KitchenState;
  decor: DecorState;
}

/** What the judging scene shows. */
export interface JudgingView {
  cookoff: Cookoff;
  plates: Plate[];
  /** Each chef's three cards (cookoffCards). */
  cards: number[][];
  verdict: Verdict;
  /** The coins it earned, shown with the verdict. */
  coins: number;
  /** A roll per judge per chef, for what they say. */
  picks: number[][];
}

/** The banner and the line under it, for the verdict. */
export function verdictBanner(view: JudgingView): [string, string] {
  const { verdict, cookoff } = view;
  switch (verdict.kind) {
    case 'record':
      return verdict.best === null
        ? ['🏆 First record! 🏆', `${verdict.score} points!`]
        : ['🏆 New record! 🏆', `${verdict.score} points! Your best was ${verdict.best}.`];
    case 'close':
      return [
        verdict.gap > 0 ? '💖 So close! 💖' : '💖 Just as good! 💖',
        verdict.gap > 0
          ? `Only ${verdict.gap} ${verdict.gap === 1 ? 'point' : 'points'} to go!`
          : `${verdict.score} points, like your best!`,
      ];
    case 'win':
      return [`🏆 ${cookoff.chefs[verdict.winner].name} wins! 🏆`, verdict.totals.join('  to  ')];
    case 'tie':
      return ['🎉 Both win! 🎉', 'The judges love both dishes!'];
  }
}

/** What a judge says tasting `chef`'s dish. */
export function tasteLine(view: JudgingView, chef: number, judge: number): string {
  return judgeLine(JUDGES[judge], view.cards[chef][judge], view.picks[chef][judge]);
}

/** Draws the judging scene `age` seconds in. */
export function drawJudging(g: G, layout: Layout, view: JudgingView, age: number, t: number) {
  const p = judgingPlaces(layout);
  const chefs = view.cookoff.chefs.length;
  const now = judgingMoment(age, chefs);
  const times = judgingTimes(chefs);
  const best = view.cookoff.mode === 'best';

  g.fillStyle = 'rgba(91, 59, 79, 0.3)';
  g.fillRect(0, 0, layout.width, layout.height);

  // The ribbon: whose dish it is, or a drumroll.
  const ribbon =
    now.chef < 0
      ? '🥁 The judges! 🥁'
      : best
        ? `Your ${view.cookoff.dish.name}!`
        : `${view.cookoff.chefs[now.chef].name}'s ${view.cookoff.dish.name}`;
  drawRibbon(g, p.ribbon, ribbon);

  // The chefs' pills: who, and their totals once the judges are done.
  const pills: [string, string, string][] = best
    ? [
        ['🧑‍🍳', 'You', now.totals[0] ? `⭐ ${view.cookoff.results[0].score}` : '⭐ ...'],
        ['🏆', 'Best', view.cookoff.best === null ? 'New!' : `⭐ ${view.cookoff.best}`],
      ]
    : view.cookoff.chefs.map((chef, c) => [
        '',
        chef.name,
        now.totals[c] ? `⭐ ${cardTotal(view.cards[c])}` : '...',
      ]);
  pills.forEach(([icon, name, total], c) => {
    const b = p.pills[c];
    rounded(g, b.x, b.y, b.w, b.h, b.h / 2);
    fillStroke(g, best && c === 1 ? C.butter : TEAM[c], 4);
    const chef = view.cookoff.chefs[c] as CookoffChef | undefined;
    const ax = b.x + b.h * 0.55;
    if (!best && chef?.kind) {
      drawGuest(g, guestOf(chef.kind), ax, b.y + b.h - 6, (b.h - 10) / 175, still(t + c));
    } else {
      g.fillStyle = C.ink;
      emoji(g, icon, ax, b.y + b.h / 2 + 1, b.h * 0.5);
    }
    const tx = (b.x + b.h + b.x + b.w - 10) / 2;
    const room = b.w - b.h - 16;
    stickerText(g, name, tx, b.y + b.h * 0.32, b.h * 0.3, C.purple, 'center', room);
    stickerText(g, total, tx, b.y + b.h * 0.7, b.h * 0.28, C.hotPink, 'center', room);
  });

  // The table, then the judges behind... the judges first, then the table in front.
  p.judges.forEach((j, i) => {
    const chef = now.chef;
    const tasting = now.tasting === i;
    const taste = chef >= 0 ? (age - times.taste(chef, i)) / JUDGING.taste : -1;
    const shown = chef >= 0 && now.shown[chef] > i;
    drawJudge(g, i, j.x, j.y, j.scale, {
      t: t + i,
      chew: tasting ? clamp01((taste - 0.3) / 0.7) : -1,
      happy: shown && age - times.card(chef, i) < 1.4,
    });
  });
  const tb = p.table;
  rounded(g, tb.x, tb.y, tb.w, tb.h, 14);
  fillStroke(g, vertical(g, tb.y, tb.y + tb.h, [C.white, C.lavenderLight]), 4);
  g.fillStyle = C.hotPink;
  for (let x = tb.x + 24; x < tb.x + tb.w - 10; x += 48) {
    heartPath(g, x, tb.y + tb.h / 2, 6);
    g.fill();
  }

  // Each judge's cards for the chef on the table (or the last chef's, at the verdict).
  const showing = now.chef;
  if (showing >= 0 && !now.verdict) {
    p.cards.forEach((c, i) => {
      if (now.shown[showing] <= i) return;
      const flip = clamp01((age - times.card(showing, i)) / JUDGING.flip);
      drawScoreCard(g, c.x, c.y, c.w, c.h, view.cards[showing][i], flip, PAWS[i]);
    });
  }

  // The dish on the table, sliding in from the left.
  if (showing >= 0 && !now.verdict) {
    const plate = view.plates[showing] as Plate | undefined;
    const slide = clamp01((age - times.start(showing)) / 0.6);
    const ease = 1 - Math.pow(1 - slide, 3);
    if (plate) {
      g.save();
      g.translate(p.dish.x - (1 - ease) * layout.width, p.dish.y);
      g.scale(p.dish.scale, p.dish.scale);
      plate.state.dish.draw(g, t, plate.state);
      drawDecorations(g, plate.decor.placed);
      g.restore();
    }
    // The fork, carrying a bite from the dish to the judge tasting.
    if (now.tasting >= 0) {
      const j = p.judges[now.tasting];
      const q = clamp01((age - times.taste(showing, now.tasting)) / (JUDGING.taste * 0.3));
      const mouthY = j.y - (now.tasting === 2 ? 100 : 104) * j.scale;
      const fx = p.dish.x + (j.x + 26 * j.scale - p.dish.x) * q;
      const fy = p.dish.y - 20 + (mouthY - p.dish.y + 20) * q - Math.sin(q * Math.PI) * 40;
      if (q < 1) drawFork(g, fx, fy);
      const b = p.bubble(now.tasting);
      drawSaying(g, b, [tasteLine(view, showing, now.tasting)], j.x, j.y - 150 * j.scale);
    }
  }

  if (now.verdict) drawVerdict(g, layout, view, age - times.verdict, t, now.ready);
}

/** A fork with a bite of food on it. */
function drawFork(g: G, x: number, y: number) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.5);
  rounded(g, -4, 0, 8, 46, 4);
  fillStroke(g, C.steel, 3);
  rounded(g, -10, -20, 20, 22, 4);
  fillStroke(g, C.steel, 3);
  circle(g, 0, -22, 10);
  fillStroke(g, C.butter, 3);
  g.restore();
}

/** The verdict: a new record's trophy, a kind "So close!", or the winner (or both). */
function drawVerdict(
  g: G,
  layout: Layout,
  view: JudgingView,
  age: number,
  t: number,
  ready: boolean,
) {
  const p = judgingPlaces(layout);
  const pop = easeOutBack(clamp01(age / 0.5));
  const [top, bottom] = verdictBanner(view);
  g.fillStyle = 'rgba(91, 59, 79, 0.25)';
  g.fillRect(0, 0, layout.width, layout.height);

  const v = view.verdict;
  if (v.kind === 'record') {
    const rise = easeOutBack(clamp01(age / 0.7));
    drawTrophy(
      g,
      p.trophy.x,
      p.trophy.y + (1 - rise) * 80,
      p.trophy.scale * rise,
      '⭐',
      t,
      (t * 0.6) % 1.6,
    );
  } else if (v.kind === 'close') {
    const beat = 1 + Math.sin(t * 5) * 0.06;
    g.save();
    g.translate(p.trophy.x, p.trophy.y - 40);
    g.scale(pop * beat, pop * beat);
    heartPath(g, 0, 0, 60);
    fillStroke(g, vertical(g, -60, 60, [C.pink, C.hotPink]), 5);
    stickerText(g, 'You can', 0, -10, 22, C.white);
    stickerText(g, 'do it!', 0, 16, 22, C.white);
    g.restore();
  } else {
    view.cookoff.chefs.forEach((chef, c) => {
      const spot = p.podium[c];
      const wins = v.kind === 'tie' || v.winner === c;
      drawChef(
        g,
        chef,
        spot.x,
        spot.y,
        spot.scale,
        still(t, wins ? 'happy' : 'idle', wins ? age % 1.4 : 9),
      );
      // Their cards' total at their feet, and a crown for a winner.
      const total = cardTotal(view.cards[c]);
      const ty = spot.y + 30;
      rounded(g, spot.x - 60, ty - 24, 120, 48, 24);
      fillStroke(g, TEAM[c], 3.5);
      stickerText(g, `⭐ ${total}`, spot.x, ty + 2, 28, C.white);
      if (wins) {
        g.fillStyle = C.ink;
        emoji(g, '👑', spot.x, spot.y - 196 * spot.scale + Math.sin(t * 4) * 4, 40);
      }
    });
  }

  const b = p.banner;
  g.save();
  g.translate(b.x + b.w / 2, b.y + b.h / 2);
  g.scale(pop, pop);
  rounded(g, -b.w / 2, -b.h / 2, b.w, b.h, 30);
  fillStroke(g, vertical(g, -b.h / 2, b.h / 2, [C.hotPink, C.purple]), 5);
  stickerText(g, top, 0, -b.h * 0.18, b.h * 0.34, C.white, 'center', b.w - 30);
  stickerText(g, bottom, 0, b.h * 0.26, b.h * 0.2, C.butter, 'center', b.w - 30);
  g.restore();
  if (age > 0.6) {
    const c = p.coins;
    rounded(g, c.x, c.y, c.w, c.h, c.h / 2);
    fillStroke(g, C.white, 3.5);
    plainText(g, `🪙 +${view.coins}`, c.x + c.w / 2, c.y + c.h / 2 + 1, 26, C.ink);
  }

  if (ready) {
    const btn = p.button;
    const pulse = 1 + Math.sin(t * 4) * 0.04;
    g.save();
    g.translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
    g.scale(pulse, pulse);
    rounded(g, -btn.w / 2, -btn.h / 2, btn.w, btn.h, btn.h / 2);
    fillStroke(g, vertical(g, -btn.h / 2, btn.h / 2, [C.cabinetLight, C.mint]), 4);
    plainText(g, 'All done! 🎉', 0, 1, Math.min(30, btn.h * 0.36), C.ink);
    g.restore();
  }
}
