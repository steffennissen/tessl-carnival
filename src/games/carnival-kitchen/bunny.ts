import { C, type G, circle, fillStroke, oval, starPath } from './art';
import type { BunnyMood } from './chef';
import { drawApron, drawHat } from './outfit-art';

/**
 * Drawing Chef Bunny. What she feels and when is in chef.ts; this only draws
 * a pose: her mood, a blink, an ear flick, where she looks and how far she
 * leans in.
 */

export interface BunnyPose {
  mood: BunnyMood;
  /** Seconds since the mood started. */
  age: number;
  /** Seconds of the clock, for breathing and bobbing. */
  t: number;
  blink: boolean;
  /** An ear flick: which ear, and how far (-1 to 1). */
  ear: { side: -1 | 1; amount: number };
  /** Where her pupils move, in head units (a few at most). */
  look: { x: number; y: number };
  /** How far she leans in to look, -1 (left) to 1 (right). */
  lean: number;
  /** How far into a bow she is, 0 (standing) to 1 (head down): the rank ceremony. */
  bow?: number;
  /** How far above her head her hat floats, as it drops on at the ceremony. */
  hatLift?: number;
}

/** What she wears (wardrobe.ts): a hat ('' for none) and an apron. */
export interface BunnyLook {
  hat: string;
  apron: string;
}

export const PLAIN_LOOK: BunnyLook = { hat: 'chef-hat', apron: 'pink-apron' };

/** A still, happy pose: for the title screen's first frame and the end card. */
export function calmPose(t: number, mood: BunnyMood = 'idle', age = 9): BunnyPose {
  return { mood, age, t, blink: false, ear: { side: 1, amount: 0 }, look: { x: 0, y: 0 }, lean: 0 };
}

/**
 * Her face, drawn round (0, 0) on her head. Eyes are dots that follow `look`,
 * or happy arcs when she's cheering, or shut lines for a blink. Peeking (the
 * lean) opens an "ooh" mouth; encouraging lifts her brows and gives a big
 * soft smile. Never a frown.
 */
function drawFace(g: G, pose: BunnyPose) {
  const { mood, blink, look } = pose;
  const peeking = Math.abs(pose.lean) > 0.35 && mood === 'idle';
  const joyful = mood === 'cheer' || mood === 'party';
  g.save();
  g.translate(0, 4);
  g.scale(1.3, 1.3);

  // Cheeks, a little rosier when she's happy.
  g.fillStyle = joyful ? 'rgba(255, 110, 160, 0.6)' : 'rgba(255, 110, 160, 0.45)';
  oval(g, -15, 6, 6, 3.6);
  g.fill();
  oval(g, 15, 6, 6, 3.6);
  g.fill();

  g.fillStyle = C.ink;
  g.strokeStyle = C.ink;
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  if (joyful) {
    for (const ex of [-9, 9]) {
      g.beginPath();
      g.arc(ex, 2, 4, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    }
  } else if (blink) {
    for (const ex of [-9, 9]) {
      g.beginPath();
      g.moveTo(ex - 3.6, 0.5);
      g.quadraticCurveTo(ex, 2.4, ex + 3.6, 0.5);
      g.stroke();
    }
  } else {
    const r = peeking ? 4.4 : 3.8;
    for (const ex of [-9, 9]) {
      circle(g, ex + look.x, look.y, r);
      g.fill();
    }
    g.fillStyle = C.white;
    for (const ex of [-9, 9]) {
      circle(g, ex + look.x + 1.2, look.y - 1.4, 1.4);
      g.fill();
    }
  }

  // Kind, raised brows: "you can do it!".
  if (mood === 'encourage') {
    g.lineWidth = 2;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(
        side * 9,
        -2,
        6,
        Math.PI * (side < 0 ? 1.25 : 1.45),
        Math.PI * (side < 0 ? 1.55 : 1.75),
      );
      g.stroke();
    }
    g.lineWidth = 2.6;
  }

  g.fillStyle = C.ink;
  if (peeking) {
    // "Ooh!"
    oval(g, 0, 8.5, 2.8 + pose.lean * 0.6, 3.4 + pose.lean * 0.8);
    g.fill();
  } else if (joyful || mood === 'encourage') {
    // A big open smile.
    g.beginPath();
    g.arc(0, 4.5, 5.2, Math.PI * 0.05, Math.PI * 0.95);
    g.closePath();
    g.fill();
    g.fillStyle = C.hotPink;
    oval(g, 0, 8, 2.6, 1.4);
    g.fill();
  } else {
    g.beginPath();
    g.arc(0, 4.5, 4.5, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
  }
  g.restore();
}

/** Chef Bunny, with her head at (x, y). */
export function drawBunny(
  g: G,
  at: { x: number; y: number },
  pose: BunnyPose,
  look: BunnyLook = PLAIN_LOOK,
) {
  const { mood, age, t } = pose;
  const bow = Math.max(0, Math.min(1, pose.bow ?? 0));
  const cheering = mood === 'cheer';
  const partying = mood === 'party';
  // Two big jumps for a party, little hops for a cheer, breathing otherwise.
  const hop = partying
    ? -Math.abs(Math.sin(Math.min(age, 1.4) * Math.PI * (2 / 1.4))) * 24
    : cheering
      ? -Math.abs(Math.sin(age * 9)) * 16
      : Math.sin(t * 2) * 2;
  const nod = mood === 'nod' ? Math.sin(age * 10) * 0.12 * Math.max(0, 1 - age) : 0;
  // Encouraging: a slow, friendly head tilt.
  const tilt = mood === 'encourage' ? Math.sin(Math.min(age, 1) * Math.PI) * 0.12 : 0;
  // A twirl of the head mid-party.
  const twirl = partying && age < 1.4 ? Math.sin((age / 1.4) * Math.PI * 2) * 0.1 : 0;
  const x = at.x;
  // Bowing, her head dips toward you.
  const y = at.y + hop + bow * 16;

  g.save();
  // Leaning in, from her feet.
  g.translate(x, at.y + 124);
  g.rotate(pose.lean * 0.14);
  g.translate(-x, -at.y - 124);

  // Party sparkles: a ring of little stars turning round her.
  if (partying && age < 1.8) {
    const fade = Math.min(1, (1.8 - age) / 0.5);
    g.globalAlpha = fade;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + age * 3;
      const r = 72 + Math.sin(age * 6 + i) * 6;
      starPath(g, x + Math.cos(a) * r, y + 10 + Math.sin(a) * r * 0.8, 8, a);
      fillStroke(g, i % 2 ? C.gold : C.pink, 2);
    }
    g.globalAlpha = 1;
  }

  // Body and apron (the body stays put while she bows).
  const body = at.y + hop;
  oval(g, x, body + 82, 50, 46);
  fillStroke(g, C.white);
  drawApron(g, look.apron, x - 28, body + 54);

  g.save();
  g.translate(x, y);
  g.rotate(nod + tilt + twirl + pose.lean * 0.06 + bow * 0.18);
  if (bow > 0) g.scale(1, 1 - bow * 0.08);

  // Ears, splayed out from under the hat.
  for (const side of [-1, 1]) {
    let wiggle = Math.sin(t * 1.5 + side) * 0.04;
    if (cheering) wiggle = Math.sin(age * 18) * 0.15;
    if (partying) wiggle = Math.sin(age * 22 + side) * 0.25;
    if (mood === 'encourage') wiggle = side * 0.08;
    if (side === pose.ear.side) wiggle += pose.ear.amount * 0.3;
    oval(g, side * 30, -46, 11, 30, side * 0.55 + wiggle);
    fillStroke(g, C.white);
    oval(g, side * 30, -46, 5, 20, side * 0.55 + wiggle);
    g.fillStyle = C.pink;
    g.fill();
  }

  circle(g, 0, 0, 42);
  fillStroke(g, C.white);

  // Her hat, floating down onto her head at the ceremony.
  const lift = pose.hatLift ?? 0;
  g.save();
  g.translate(0, -lift);
  drawHat(g, look.hat, false, t);
  g.restore();

  // Eyes shut while she bows.
  drawFace(g, bow > 0.4 ? { ...pose, blink: true, mood: 'idle', lean: 0 } : pose);
  g.fillStyle = C.hotPink;
  oval(g, 0, 2, 3.4, 2.4);
  g.fill();
  g.save();
  g.translate(0, -lift);
  drawHat(g, look.hat, true, t);
  g.restore();
  g.restore();

  // Paws: up and waving for a cheer or a party, one raised in a cheery fist
  // to encourage, together near the pot while she peeks, or resting.
  const peeking = Math.abs(pose.lean) > 0.35 && mood === 'idle';
  for (const side of [-1, 1]) {
    const wave = Math.sin(age * 14 + side) * 8;
    let px = x + side * 32;
    let py = y + 46;
    if (cheering || partying) {
      px = x + side * (partying ? 56 : 50);
      py = y - (partying ? 26 : 12) + wave;
    } else if (mood === 'encourage' && side === 1) {
      px = x + 50;
      py = y + 8 + Math.sin(age * 8) * 5;
    } else if (peeking) {
      px = x + side * 22 + pose.lean * 8;
      py = y + 40;
    } else if (bow > 0) {
      // A bow: paws together over her tummy.
      px = x + side * (32 - bow * 18);
      py = body + 46 + bow * 22;
    }
    circle(g, px, py, 12);
    fillStroke(g, C.white, 3.5);
  }
  g.restore();
}
