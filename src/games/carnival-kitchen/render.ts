import { DISHES } from './dishes';
import {
  BAKE_TARGET,
  BANNER_TIME,
  BOWL_X,
  CRACK_PERFECT,
  EGG_SPEEDS,
  FEEDBACK_TIME,
  PIZZA_VIEW,
  POT,
  STIR_TIME,
  STIR_TURNS,
  TOPPING_PERFECT,
  currentStage,
  liveScore,
  maxScore,
  ratingFor,
  starsFor,
  stirTurns,
  totalScore,
  type ChopItem,
  type Dish,
  type Feedback,
  type KitchenState,
  type Stage,
  type Topping,
} from './game';
import {
  C,
  CONFETTI,
  type G,
  H,
  W,
  blend,
  circle,
  clamp01,
  drawPizza,
  easeOutBack,
  eggPath,
  emoji,
  face,
  fillStroke,
  heartPath,
  horizontal,
  oval,
  plainText,
  rounded,
  shadow,
  starPath,
  stickerText,
  toppingPiece,
  vertical,
} from './art';
import type { Sound } from './sound';

/**
 * Drawing for Carnival Kitchen: sticker-style art with soft ink outlines,
 * a pastel kitchen, Chef Bunny, particles and the end-of-round celebration.
 *
 * Nothing in here changes the game's state. It watches the state from frame
 * to frame to know when to play a sound or throw some sparkles.
 */

const TITLES: Record<Stage, string> = {
  chop: 'Chop the carrot!',
  crack: 'Crack the eggs!',
  pour: 'Add flour and milk!',
  mix: 'Mix the batter!',
  stir: 'Stir the soup!',
  season: 'Shake the salt!',
  flip: 'Flip the pancakes!',
  sauce: 'Spread the sauce!',
  top: 'Add the toppings!',
  bake: 'Bake the pizza!',
};
const HINTS: Record<Stage, [string, string]> = {
  chop: ['Tap when the knife', 'is on a dotted line!'],
  crack: ['Tap when the egg', 'is over the bowl!'],
  pour: ['Hold to pour,', 'let go at the star!'],
  mix: ['Hold and draw', 'circles in the bowl!'],
  stir: ['Hold and draw', 'circles in the pot!'],
  season: ['Hold to shake,', 'let go at the star!'],
  flip: ['Tap when the heart', 'is in the gold!'],
  sauce: ['Hold and draw', 'circles on the pizza!'],
  top: ['Tap when it is over', 'the sparkly spot!'],
  bake: ['Hold to bake, let go', 'when it is golden!'],
};
const ICONS: Record<Stage, string> = {
  chop: '🥕',
  crack: '🥚',
  pour: '🥛',
  mix: '🥣',
  stir: '🥄',
  season: '🧂',
  flip: '🥞',
  sauce: '🍅',
  top: '🍄',
  bake: '🔥',
};

/** The title and icon for chopping each thing that can be chopped. */
const CHOP_ITEMS: Record<ChopItem, { title: string; icon: string }> = {
  carrot: { title: 'Chop the carrot!', icon: '🥕' },
  pepperoni: { title: 'Chop the pepperoni!', icon: '🔪' },
};

/** The card title for a step: chopping depends on what's being chopped. */
function titleFor(dish: Dish, stage: Stage): string {
  return stage === 'chop' ? CHOP_ITEMS[dish.chop].title : TITLES[stage];
}

function iconFor(dish: Dish, stage: Stage): string {
  return stage === 'chop' ? CHOP_ITEMS[dish.chop].icon : ICONS[stage];
}

/** The big start button on the title screen. */
const START_BUTTON = { x: W / 2 + 40, y: 392, w: 300, h: 70 };

const SOUND_BUTTON = { x: 40, y: 80, r: 24 };

export interface Pointer {
  x: number;
  y: number;
  down: boolean;
}

type Mood = 'idle' | 'cheer' | 'nod';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  max: number;
  size: number;
  color: string;
  shape: 'star' | 'heart' | 'dot' | 'confetti' | 'shell' | 'salt';
  rot: number;
  spin: number;
}

// ---------------------------------------------------------------------------
// The kitchen behind everything, drawn once

function drawKitchen(g: G) {
  // Wall, with a pattern of dots and little hearts.
  g.fillStyle = vertical(g, 0, 340, [C.wallTop, C.wallBottom]);
  g.fillRect(0, 0, W, 340);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 21; col++) {
      const x = col * 40 + (row % 2) * 20;
      const y = 60 + row * 36;
      if ((row + col) % 3 === 0) {
        g.fillStyle = 'rgba(255, 95, 162, 0.13)';
        heartPath(g, x, y, 6);
        g.fill();
      } else {
        g.fillStyle = 'rgba(255, 255, 255, 0.7)';
        circle(g, x, y, 2.6);
        g.fill();
      }
    }
  }

  // A window with a sunny sky.
  rounded(g, 26, 112, 150, 108, 18);
  fillStroke(g, C.white);
  rounded(g, 36, 122, 130, 88, 12);
  fillStroke(g, vertical(g, 122, 210, [C.sky, C.skyLight]), 3);
  g.fillStyle = C.butter;
  circle(g, 140, 146, 14);
  g.fill();
  g.fillStyle = C.white;
  for (const [x, y, r] of [
    [62, 160, 11],
    [76, 154, 14],
    [92, 162, 10],
    [100, 190, 8],
    [112, 186, 11],
    [124, 192, 8],
  ]) {
    circle(g, x, y, r);
    g.fill();
  }
  g.strokeStyle = C.white;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(101, 122);
  g.lineTo(101, 210);
  g.moveTo(36, 166);
  g.lineTo(166, 166);
  g.stroke();
  for (const side of [-1, 1]) {
    const x = side < 0 ? 22 : 180;
    g.beginPath();
    g.moveTo(x, 104);
    g.lineTo(x + side * -46, 104);
    g.quadraticCurveTo(x + side * -18, 150, x + side * -6, 226);
    g.lineTo(x, 226);
    g.closePath();
    fillStroke(g, C.pink, 3.5);
  }
  rounded(g, 12, 98, 178, 12, 6);
  fillStroke(g, C.hotPink, 3.5);

  // A shelf with jars and a little plant.
  rounded(g, 664, 198, 128, 14, 6);
  fillStroke(g, C.wood, 3.5);
  rounded(g, 676, 152, 34, 46, 10);
  fillStroke(g, C.mint, 3.5);
  rounded(g, 672, 144, 42, 12, 5);
  fillStroke(g, C.hotPink, 3);
  heartPath(g, 693, 175, 7);
  fillStroke(g, C.white, 2);
  rounded(g, 718, 162, 30, 36, 9);
  fillStroke(g, C.butter, 3.5);
  rounded(g, 715, 155, 36, 10, 5);
  fillStroke(g, C.lavender, 3);
  starPath(g, 733, 181, 7);
  fillStroke(g, C.white, 2);
  for (const [x, y, rot] of [
    [764, 150, -0.6],
    [776, 144, 0],
    [788, 150, 0.6],
  ]) {
    oval(g, x, y, 6, 13, rot);
    fillStroke(g, C.leaf, 3);
  }
  g.beginPath();
  g.moveTo(760, 166);
  g.lineTo(792, 166);
  g.lineTo(787, 198);
  g.lineTo(765, 198);
  g.closePath();
  fillStroke(g, C.hotPink, 3.5);

  // The counter top and the cabinets below it.
  g.fillStyle = vertical(g, 338, 430, [C.counterTop, C.cream]);
  g.fillRect(0, 338, W, 92);
  g.strokeStyle = C.ink;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, 338);
  g.lineTo(W, 338);
  g.stroke();
  rounded(g, -10, 424, W + 20, 16, 8);
  fillStroke(g, C.counterEdge);
  g.fillStyle = C.cabinet;
  g.fillRect(0, 440, W, H - 440);
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * 197;
    rounded(g, x, 452, 181, 70, 14);
    fillStroke(g, C.cabinetLight, 3.5);
    heartPath(g, x + 90.5, 466, 6);
    fillStroke(g, C.hotPink, 2.5);
  }

  // Bunting along the top.
  const sag = (x: number) => 10 + Math.sin((Math.PI * x) / W) * 22;
  g.strokeStyle = C.ink;
  g.lineWidth = 2.5;
  g.beginPath();
  for (let x = 0; x <= W; x += 10) g.lineTo(x, sag(x));
  g.stroke();
  const flags = [C.hotPink, C.butter, C.mint, C.sky, C.lavender];
  for (let i = 0; i < 17; i++) {
    const x = 25 + i * 47.5;
    const y = sag(x);
    g.beginPath();
    g.moveTo(x - 17, y);
    g.lineTo(x + 17, sag(x + 17));
    g.lineTo(x, y + 32);
    g.closePath();
    fillStroke(g, flags[i % flags.length], 3);
  }
}

// ---------------------------------------------------------------------------
// Chef Bunny

function drawBunny(g: G, t: number, mood: Mood, moodAge: number) {
  const cheering = mood === 'cheer';
  const hop = cheering ? -Math.abs(Math.sin(moodAge * 9)) * 16 : Math.sin(t * 2) * 2;
  const tilt = mood === 'nod' ? Math.sin(moodAge * 10) * 0.12 * Math.max(0, 1 - moodAge) : 0;
  const x = 86;
  const y = 392 + hop;

  // Body and apron.
  oval(g, x, y + 82, 50, 46);
  fillStroke(g, C.white);
  rounded(g, x - 28, y + 54, 56, 60, 16);
  fillStroke(g, C.pink, 3.5);
  heartPath(g, x, y + 76, 9);
  fillStroke(g, C.white, 2.5);

  g.save();
  g.translate(x, y);
  g.rotate(tilt);

  // Ears, splayed out from under the hat.
  for (const side of [-1, 1]) {
    const wiggle = cheering ? Math.sin(moodAge * 18) * 0.15 : Math.sin(t * 1.5 + side) * 0.04;
    oval(g, side * 30, -46, 11, 30, side * 0.55 + wiggle);
    fillStroke(g, C.white);
    oval(g, side * 30, -46, 5, 20, side * 0.55 + wiggle);
    g.fillStyle = C.pink;
    g.fill();
  }

  circle(g, 0, 0, 42);
  fillStroke(g, C.white);

  // Chef's hat.
  for (const [hx, hy, r] of [
    [-18, -60, 15],
    [18, -60, 15],
    [0, -70, 19],
  ]) {
    circle(g, hx, hy, r);
    fillStroke(g, C.white, 3.5);
  }
  rounded(g, -24, -52, 48, 16, 6);
  fillStroke(g, C.white, 3.5);

  const blink = mood === 'idle' && t % 3.4 < 0.14;
  face(g, 0, 4, 1.3, cheering || blink ? 'joy' : 'happy');
  g.fillStyle = C.hotPink;
  oval(g, 0, 2, 3.4, 2.4);
  g.fill();
  g.restore();

  // Paws: waving when cheering, resting on the counter otherwise.
  for (const side of [-1, 1]) {
    const wave = Math.sin(moodAge * 14 + side) * 8;
    const px = cheering ? x + side * 50 : x + side * 32;
    const py = cheering ? y - 12 + wave : y + 46;
    circle(g, px, py, 12);
    fillStroke(g, C.white, 3.5);
  }
}

function drawSpeech(g: G, lines: [string, string]) {
  rounded(g, 12, 230, 188, 82, 20);
  fillStroke(g, C.white, 3.5);
  g.beginPath();
  g.moveTo(72, 308);
  g.lineTo(84, 334);
  g.lineTo(98, 308);
  g.fillStyle = C.white;
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 3.5;
  g.beginPath();
  g.moveTo(72, 311.5);
  g.lineTo(84, 334);
  g.lineTo(98, 311.5);
  g.stroke();
  plainText(g, lines[0], 106, 257, 16, C.ink);
  plainText(g, lines[1], 106, 284, 16, C.hotPink);
}

// ---------------------------------------------------------------------------
// The renderer

export function createRenderer(ctx: G, sound: Sound) {
  let kitchen: HTMLCanvasElement | null = null;

  const fresh = () => ({
    time: 0,
    particles: [] as Particle[],
    seen: null as KitchenState | null,
    stageIndex: -1,
    feedback: null as Feedback | null,
    cuts: 0,
    eggs: 0,
    flips: 0,
    pinches: 0,
    prevEggX: 0,
    chopAge: 9,
    flipAge: 9,
    drop: null as { x: number; age: number } | null,
    mood: 'idle' as Mood,
    moodAge: 9,
    overAge: -1,
    starsPlayed: 0,
    shakeTimer: 0,
    bloopAt: 0,
    shownScore: 0,
    notYet: null as { x: number; y: number; age: number } | null,
    tops: 0,
    prevTopX: 0,
    topDrop: null as { x: number; index: number; age: number } | null,
    baked: false,
    sizzleTimer: 0,
  });
  let fx = fresh();

  function burst(
    x: number,
    y: number,
    count: number,
    shapes: Particle['shape'][],
    colors: string[],
    speed = 220,
    gravity = 380,
  ) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      const max = 0.6 + Math.random() * 0.5;
      fx.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.5,
        gravity,
        life: max,
        max,
        size: 6 + Math.random() * 7,
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  }

  function celebrate(x: number, y: number, feedback: Feedback) {
    const counts = { 'Perfect!': 20, 'Great!': 13, 'Good!': 8, 'Nice try!': 5 };
    const shapes: Particle['shape'][] =
      feedback.grade === 'Nice try!' ? ['heart'] : ['star', 'heart', 'star', 'dot'];
    burst(x, y, counts[feedback.grade], shapes, CONFETTI);
    fx.mood = feedback.grade === 'Perfect!' || feedback.grade === 'Great!' ? 'cheer' : 'nod';
    fx.moodAge = 0;
  }

  /** Watches the state for things that just happened. */
  function observe(state: KitchenState, dt: number) {
    if (fx.seen !== state) {
      const keep = fx.particles;
      fx = fresh();
      fx.particles = keep;
      fx.seen = state;
      fx.prevEggX = state.crack.eggX;
      fx.prevTopX = state.top.x;
    }

    if (state.phase === 'playing' && state.stageIndex !== fx.stageIndex) {
      fx.stageIndex = state.stageIndex;
      const stage = currentStage(state);
      sound.banner();
      // The first step also says what we're making.
      const intro = state.stageIndex === 0 ? `Let's make ${state.dish.name}! ` : '';
      sound.say(`${intro}${titleFor(state.dish, stage)} ${HINTS[stage].join(' ')}`);
    }

    const cuts = state.chop.cut.filter(Boolean).length;
    const eggs = state.crack.results.length;
    const flips = state.flip.results.length;
    const pinches = state.season.index;
    const tops = state.top.results.length;

    if (state.feedback && state.feedback !== fx.feedback) {
      const feedback = state.feedback;
      sound.grade(feedback.grade, feedback.combo);
      if (tops > fx.tops) {
        fx.topDrop = { x: fx.prevTopX, index: tops - 1, age: 0 };
        sound.whoosh();
      } else if (state.bake.done && !fx.baked) {
        sound.ding();
        celebrate(380, 300, feedback);
        burst(380, 300, 12, ['heart', 'star'], [C.cheeseGold, C.sauceLight, C.white], 260);
      } else if (cuts > fx.cuts) {
        fx.chopAge = 0;
        sound.chop();
        celebrate(state.chop.knifeX, 290, feedback);
        const bits =
          state.dish.chop === 'pepperoni'
            ? [C.pepperoni, C.pepperoniDark]
            : [C.carrot, C.carrotLight];
        burst(state.chop.knifeX, 290, 5, ['dot'], bits, 160);
      } else if (eggs > fx.eggs) {
        if (state.crack.results[eggs - 1] > 0) {
          fx.drop = { x: fx.prevEggX, age: 0 };
          fx.mood = 'idle';
        } else {
          celebrate(fx.prevEggX, 175, feedback);
        }
      } else if (flips > fx.flips) {
        fx.flipAge = 0;
        sound.whoosh();
        celebrate(350, 200, feedback);
      } else if (pinches > fx.pinches) {
        sound.pop();
        celebrate(currentStage(state) === 'pour' ? BOWL_X : 380, 290, feedback);
      } else {
        // Stirring finished.
        celebrate(POT.x, POT.y, feedback);
      }
    }
    fx.feedback = state.feedback;
    fx.cuts = cuts;
    fx.eggs = eggs;
    fx.flips = flips;
    fx.pinches = pinches;
    fx.tops = tops;
    fx.baked = state.bake.done;

    // A falling topping lands on its spot with a little splat.
    if (fx.topDrop) {
      fx.topDrop.age += dt;
      if (fx.topDrop.age >= 0.3) {
        const spot = state.plan.toppings[fx.topDrop.index];
        sound.pop();
        burst(spot.x, spot.y, 6, ['dot'], [C.cheese, C.sauceLight], 150);
        if (state.feedback) celebrate(spot.x, spot.y - 20, state.feedback);
        fx.topDrop = null;
      }
    }

    if (state.phase === 'playing' && currentStage(state) === 'bake' && state.bake.baking) {
      fx.sizzleTimer -= dt;
      if (fx.sizzleTimer <= 0) {
        sound.sizzle();
        fx.sizzleTimer = 0.2;
      }
    }

    // A falling egg cracks when it lands in the bowl.
    if (fx.drop) {
      fx.drop.age += dt;
      if (fx.drop.age >= 0.32) {
        const landX = Math.min(BOWL_X + 90, Math.max(BOWL_X - 90, fx.drop.x));
        sound.crack();
        burst(landX, 330, 8, ['shell'], [C.white, C.cream], 200);
        if (state.feedback) celebrate(landX, 320, state.feedback);
        fx.drop = null;
      }
    }

    // Pouring flour or milk glugs softly.
    if (state.phase === 'playing' && currentStage(state) === 'pour' && state.season.pouring) {
      fx.shakeTimer -= dt;
      if (fx.shakeTimer <= 0) {
        sound.bloop();
        fx.shakeTimer = 0.22;
      }
    }

    if (state.phase === 'playing' && currentStage(state) === 'season' && state.season.pouring) {
      fx.shakeTimer -= dt;
      if (fx.shakeTimer <= 0) {
        sound.shake();
        fx.shakeTimer = 0.12;
      }
      for (let i = 0; i < 3; i++) {
        fx.particles.push({
          x: 380 + (Math.random() - 0.5) * 30,
          y: 240,
          vx: (Math.random() - 0.5) * 30,
          vy: 140 + Math.random() * 60,
          gravity: 500,
          life: 0.32,
          max: 0.32,
          size: 3,
          color: Math.random() < 0.7 ? C.white : C.steelDark,
          shape: 'salt',
          rot: 0,
          spin: 0,
        });
      }
    }

    if (Math.abs(state.stir.radians - fx.bloopAt) > 0.7) {
      fx.bloopAt = state.stir.radians;
      sound.bloop();
    }

    if (state.phase === 'over') {
      if (fx.overAge < 0) {
        fx.overAge = 0;
        sound.fanfare();
        const dish = state.dish.name;
        sound.say(`${ratingFor(totalScore(state), maxScore(state))} You made ${dish}!`);
      }
      fx.overAge += dt;
      fx.mood = 'cheer';
      const stars = starsFor(totalScore(state), maxScore(state));
      while (fx.starsPlayed < 3 && fx.overAge >= 0.9 + fx.starsPlayed * 0.45) {
        if (fx.starsPlayed < stars) {
          sound.star(fx.starsPlayed);
          burst(
            400 + (fx.starsPlayed - 1) * 90,
            305,
            10,
            ['star', 'dot'],
            [C.gold, C.butter, C.white],
            200,
          );
        }
        fx.starsPlayed += 1;
      }
      if (fx.overAge < 3 && Math.random() < 0.6) {
        fx.particles.push({
          x: Math.random() * W,
          y: -10,
          vx: (Math.random() - 0.5) * 60,
          vy: 90 + Math.random() * 80,
          gravity: 40,
          life: 4,
          max: 4,
          size: 9,
          color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
          shape: 'confetti',
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 10,
        });
      }
    }

    fx.prevEggX = state.crack.eggX;
    fx.prevTopX = state.top.x;
  }

  function update(dt: number) {
    fx.time += dt;
    fx.chopAge += dt;
    fx.flipAge += dt;
    fx.moodAge += dt;
    if (fx.notYet) fx.notYet.age += dt;
    if (fx.mood !== 'idle' && fx.moodAge > 1.2) fx.mood = 'idle';
    for (const p of fx.particles) {
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      p.life -= dt;
    }
    fx.particles = fx.particles.filter((p) => p.life > 0 && p.y < H + 30);
  }

  // -------------------------------------------------------------------------
  // Stages

  /** A carrot in pieces between the cuts: the tip points left, leaves on the right. */
  function drawCarrot(bounds: number[], cy: number, x0: number, x1: number) {
    const g = ctx;
    const radius = (x: number) => 9 + ((x - x0) / (x1 - x0)) * 25;
    for (const angle of [-0.55, 0, 0.55]) {
      const lx = x1 + 6 + Math.cos(angle) * 26;
      const ly = cy + Math.sin(angle) * 26;
      oval(g, lx, ly, 28, 10, angle);
      fillStroke(g, vertical(g, ly - 10, ly + 10, [C.leaf, C.leafDark]), 3);
      g.strokeStyle = C.leafDark;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x1 + 6, cy);
      g.lineTo(lx + Math.cos(angle) * 18, ly + Math.sin(angle) * 18);
      g.stroke();
    }
    const body = vertical(g, cy - 34, cy + 34, [C.carrotLight, C.carrot, C.carrotDark]);
    const ridges = [252, 300, 362, 425, 452, 515, 570];
    for (let k = 0; k < bounds.length - 1; k++) {
      const first = k === 0;
      const last = k === bounds.length - 2;
      const a = bounds[k] + (first ? 0 : 3);
      const b = bounds[k + 1] - (last ? 0 : 3);
      g.beginPath();
      g.moveTo(a, cy - radius(a));
      g.lineTo(b, cy - radius(b));
      if (last) g.arc(b, cy, radius(b), -Math.PI / 2, Math.PI / 2);
      else g.lineTo(b, cy + radius(b));
      g.lineTo(a, cy + radius(a));
      if (first) g.quadraticCurveTo(a - 22, cy, a, cy - radius(a));
      g.closePath();
      fillStroke(g, body, 3.5);
      g.strokeStyle = C.carrotDark;
      g.lineWidth = 2.5;
      ridges.forEach((x, i) => {
        if (x < a + 6 || x > b - 6) return;
        const side = i % 2 === 0 ? -1 : 1;
        const y = cy + side * radius(x) * 0.5;
        g.beginPath();
        g.moveTo(x - 5, y);
        g.quadraticCurveTo(x, y - side * 4, x + 5, y);
        g.stroke();
      });
      if (!first) {
        oval(g, a, cy, 5, radius(a));
        fillStroke(g, C.carrotLight, 2.5);
      }
    }
  }

  /** A pepperoni sausage in slices between the cuts, tied with string at the right. */
  function drawSausage(bounds: number[], cy: number) {
    const g = ctx;
    const r = 31;
    const body = vertical(g, cy - r, cy + r, [C.sauceLight, C.pepperoni, C.pepperoniDark]);
    const specks = [240, 268, 300, 331, 357, 389, 418, 446, 477, 505, 534, 560];
    for (let k = 0; k < bounds.length - 1; k++) {
      const first = k === 0;
      const last = k === bounds.length - 2;
      const a = bounds[k] + (first ? 0 : 3);
      const b = bounds[k + 1] - (last ? 0 : 3);
      g.beginPath();
      if (first) {
        g.moveTo(a + r, cy - r);
        g.arc(a + r, cy, r, -Math.PI / 2, Math.PI / 2, true);
      } else {
        g.moveTo(a, cy - r);
        g.lineTo(a, cy + r);
      }
      if (last) {
        g.lineTo(b - r, cy + r);
        g.arc(b - r, cy, r, Math.PI / 2, -Math.PI / 2, true);
      } else {
        g.lineTo(b, cy + r);
        g.lineTo(b, cy - r);
      }
      g.closePath();
      fillStroke(g, body, 3.5);
      g.fillStyle = 'rgba(255, 240, 230, 0.75)';
      specks.forEach((x, i) => {
        if (x < a + 6 || x > b - 6) return;
        oval(g, x, cy + ((i * 7) % 3) * 9 - 9, 3, 2);
        g.fill();
      });
      g.fillStyle = 'rgba(255, 255, 255, 0.35)';
      rounded(g, Math.max(a + 6, bounds[0] + 14), cy - r + 6, Math.max(0, b - a - 18), 6, 3);
      g.fill();
      if (!first) {
        // A fresh slice face: pink with fatty dots.
        oval(g, a, cy, 7, r);
        fillStroke(g, C.pink, 2.5);
        g.fillStyle = C.white;
        for (const dy of [-12, 0, 11]) {
          circle(g, a, cy + dy, 1.8);
          g.fill();
        }
      }
    }
    // The string tied round the end.
    const end = bounds[bounds.length - 1];
    g.strokeStyle = C.cream;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(end - 14, cy - r + 2);
    g.lineTo(end - 14, cy + r - 2);
    g.stroke();
    g.beginPath();
    g.moveTo(end, cy);
    g.quadraticCurveTo(end + 14, cy - 12, end + 22, cy - 4);
    g.stroke();
  }

  function drawChop(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const c = state.chop;
    const marks = state.plan.marks;
    const item = state.dish.chop;
    const cy = 290;
    const x0 = 222;
    const x1 = 592;

    rounded(g, 198, 234, 450, 145, 30);
    g.fillStyle = C.shadow;
    g.fill();
    rounded(g, 190, 222, 450, 145, 30);
    fillStroke(g, vertical(g, 222, 367, [C.woodLight, C.wood]));
    g.strokeStyle = 'rgba(211, 141, 80, 0.35)';
    g.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const y = 246 + i * 30;
      g.beginPath();
      g.moveTo(214, y);
      g.bezierCurveTo(320, y - 8, 420, y + 10, 590, y - 2);
      g.stroke();
    }

    const cutXs = marks.filter((_, i) => c.cut[i]);
    const bounds = [x0, ...cutXs, x1];
    if (item === 'carrot') drawCarrot(bounds, cy, x0, x1);
    else drawSausage(bounds, cy);
    face(g, 572, cy + 2, 0.85, cutXs.length > 0 && fx.chopAge < 0.8 ? 'joy' : 'happy');

    // Dotted lines on the marks still to cut; the nearest one glows.
    let nearest = -1;
    marks.forEach((x, i) => {
      if (c.cut[i]) return;
      if (nearest === -1 || Math.abs(x - c.knifeX) < Math.abs(marks[nearest] - c.knifeX))
        nearest = i;
    });
    marks.forEach((x, i) => {
      if (c.cut[i]) return;
      const glow = i === nearest;
      if (glow) {
        g.fillStyle = `rgba(255, 201, 60, ${0.28 + Math.sin(t * 6) * 0.1})`;
        rounded(g, x - 14, cy - 54, 28, 108, 14);
        g.fill();
      }
      g.setLineDash([0.1, 9]);
      g.lineCap = 'round';
      g.lineWidth = 5;
      g.strokeStyle = C.hotPink;
      g.beginPath();
      g.moveTo(x, cy - 46);
      g.lineTo(x, cy + 46);
      g.stroke();
      g.setLineDash([]);
      heartPath(g, x, cy - 60, glow ? 9 + Math.sin(t * 6) : 7);
      fillStroke(g, C.hotPink, 2.5);
    });

    // The knife, which drops for a chop and bobs while it waits.
    const ca = fx.chopAge;
    const down = ca < 0.07 ? ca / 0.07 : ca < 0.3 ? 1 - (ca - 0.07) / 0.23 : 0;
    const tip = 222 + down * (cy + 8 - 222) + (down === 0 ? Math.sin(t * 5) * 3 : 0);
    const x = c.knifeX;
    const top = tip - 80;
    shadow(g, x + 6, 356, 16, 5);
    g.setLineDash([0.1, 8]);
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    g.beginPath();
    g.moveTo(x, tip + 8);
    g.lineTo(x, cy + 54);
    g.stroke();
    g.setLineDash([]);
    g.beginPath();
    g.moveTo(x - 15, top);
    g.lineTo(x + 15, top);
    g.lineTo(x + 13, tip - 30);
    g.quadraticCurveTo(x + 10, tip - 8, x, tip);
    g.quadraticCurveTo(x - 10, tip - 8, x - 13, tip - 30);
    g.closePath();
    fillStroke(g, horizontal(g, x - 15, x + 15, [C.steelDark, C.white, C.steel, C.steelDark]), 3.5);
    g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x - 7, top + 8);
    g.lineTo(x - 6, tip - 34);
    g.stroke();
    rounded(g, x - 18, top - 10, 36, 12, 5);
    fillStroke(g, C.gold, 3);
    rounded(g, x - 12, top - 64, 24, 56, 12);
    fillStroke(g, horizontal(g, x - 12, x + 12, [C.hotPink, C.pink, C.hotPink]), 3.5);
    g.fillStyle = C.white;
    for (const ry of [top - 48, top - 26]) {
      circle(g, x, ry, 3.5);
      g.fill();
    }
  }

  /**
   * The mixing bowl, with the yolks of the eggs cracked so far, then flour
   * and milk: `flour` and `milk` are how full each is, 0 to 1.
   */
  function drawBowl(state: KitchenState, flour = 0, milk = 0) {
    const g = ctx;
    const c = state.crack;
    shadow(g, BOWL_X, 420, 150, 14);
    g.beginPath();
    g.ellipse(BOWL_X, 330, 150, 84, 0, 0, Math.PI);
    g.closePath();
    fillStroke(g, vertical(g, 330, 414, [C.sky, C.skyDark]));
    g.save();
    g.beginPath();
    g.ellipse(BOWL_X, 330, 148, 82, 0, 0, Math.PI);
    g.clip();
    g.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 14; i++) {
      circle(
        g,
        BOWL_X - 130 + (i % 7) * 44 + Math.floor(i / 7) * 22,
        352 + Math.floor(i / 7) * 30,
        6,
      );
      g.fill();
    }
    g.restore();
    oval(g, BOWL_X, 330, 150, 30);
    fillStroke(g, C.white);
    oval(g, BOWL_X, 333, 134, 21);
    g.fillStyle = C.skyLight;
    g.fill();

    // Milk fills the bowl from the edges in, creamy yellow from the eggs.
    if (milk > 0) {
      oval(g, BOWL_X, 333, 134 * (0.5 + 0.5 * milk), 21 * (0.5 + 0.5 * milk));
      g.fillStyle = blend([C.white, C.pancakeLight], 0.35);
      g.fill();
    }

    // Yolks of the eggs already in the bowl, under the flour and milk.
    const spots = [
      [-52, 2],
      [48, 4],
      [0, -3],
    ];
    c.results.forEach((share, i) => {
      if (share === 0) return;
      if (fx.drop && i === c.results.length - 1) return;
      const [dx, dy] = spots[i];
      oval(g, BOWL_X + dx, 334 + dy, 30, 11);
      fillStroke(g, C.white, 2.5);
      circle(g, BOWL_X + dx, 331 + dy, 11);
      const yolk = g.createRadialGradient(BOWL_X + dx - 3, 327 + dy, 1, BOWL_X + dx, 331 + dy, 11);
      yolk.addColorStop(0, C.yolkLight);
      yolk.addColorStop(1, C.yolk);
      fillStroke(g, yolk, 2.5);
      face(g, BOWL_X + dx, 332 + dy, 0.4, 'joy');
    });

    // A soft mound of flour that grows as it's poured.
    if (flour > 0) {
      const h = 10 + 26 * flour;
      const w = 40 + 50 * flour;
      g.beginPath();
      g.moveTo(BOWL_X - w, 338);
      g.quadraticCurveTo(BOWL_X - w * 0.4, 338 - h * 1.3, BOWL_X, 338 - h);
      g.quadraticCurveTo(BOWL_X + w * 0.4, 338 - h * 1.3, BOWL_X + w, 338);
      g.closePath();
      fillStroke(g, vertical(g, 338 - h, 338, [C.white, C.cream]), 2.5);
    }
  }

  function drawCrack(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const c = state.crack;
    drawBowl(state);

    const active = state.phase === 'playing' && state.banner === 0 && c.index < EGG_SPEEDS.length;
    if (active) {
      // The drop zone over the bowl.
      g.fillStyle = `rgba(255, 201, 60, ${0.2 + Math.sin(t * 5) * 0.08})`;
      rounded(g, BOWL_X - CRACK_PERFECT - 6, 132, (CRACK_PERFECT + 6) * 2, 186, 26);
      g.fill();
      g.setLineDash([10, 8]);
      g.lineDashOffset = -t * 30;
      g.lineWidth = 4;
      g.strokeStyle = C.gold;
      circle(g, BOWL_X, 175, 44);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.9 + i / 3) % 1;
        const y = 236 + phase * 60;
        g.globalAlpha = Math.sin(phase * Math.PI);
        g.strokeStyle = C.gold;
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(BOWL_X - 12, y - 7);
        g.lineTo(BOWL_X, y + 4);
        g.lineTo(BOWL_X + 12, y - 7);
        g.stroke();
        g.globalAlpha = 1;
      }
    }

    const drawEgg = (x: number, y: number, rot: number, mood: 'happy' | 'joy' | 'wow') => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      eggPath(g, 0, 0, 26, 30);
      const shell = g.createRadialGradient(-8, -12, 2, 0, 0, 36);
      shell.addColorStop(0, C.white);
      shell.addColorStop(0.6, C.cream);
      shell.addColorStop(1, '#f0dcc6');
      fillStroke(g, shell, 3.5);
      face(g, 0, 4, 0.8, mood);
      g.restore();
    };

    if (fx.drop) {
      const p = clamp01(fx.drop.age / 0.32);
      const landX = Math.min(BOWL_X + 90, Math.max(BOWL_X - 90, fx.drop.x));
      const x = fx.drop.x + (landX - fx.drop.x) * p;
      drawEgg(x, 175 + (318 - 175) * p * p, p * 2, 'wow');
    }
    if (active) {
      const near = Math.abs(c.eggX - BOWL_X) <= CRACK_PERFECT + 10;
      drawEgg(c.eggX, 175 + Math.sin(t * 4) * 6, Math.sin(t * 3) * 0.12, near ? 'wow' : 'happy');
    }
  }

  function drawStir(state: KitchenState, pointer: Pointer) {
    const g = ctx;
    const t = fx.time;
    const s = state.stir;
    const { x: px, y: py, radius: R } = POT;
    const swirl = s.radians * 0.85;

    shadow(g, px + 8, py + R - 4, R, 22);
    for (const side of [-1, 1]) {
      rounded(g, px + side * (R + 4) - 22, py - 14, 44, 28, 14);
      fillStroke(g, C.hotPink);
    }
    circle(g, px, py, R);
    fillStroke(g, vertical(g, py - R, py + R, [C.pink, C.hotPink]));
    circle(g, px, py, R - 16);
    fillStroke(g, C.steel, 3);
    circle(g, px, py, R - 26);
    const soup = g.createRadialGradient(px - 20, py - 20, 10, px, py, R - 26);
    soup.addColorStop(0, C.soupLight);
    soup.addColorStop(0.7, C.soup);
    soup.addColorStop(1, C.soupDark);
    g.fillStyle = soup;
    g.fill();

    g.strokeStyle = 'rgba(255, 220, 190, 0.8)';
    g.lineWidth = 5;
    g.lineCap = 'round';
    for (let j = 0; j < 3; j++) {
      g.beginPath();
      g.arc(px, py, 28 + j * 28, swirl + j * 2.1, swirl + j * 2.1 + 1.4);
      g.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const phase = (t * 0.8 + i * 0.37) % 1;
      const a = i * 1.3 + 0.4;
      const r = 20 + i * 15;
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
      g.lineWidth = 2;
      circle(g, px + Math.cos(a) * r, py + Math.sin(a) * r, 3 + phase * 6);
      g.stroke();
    }

    const bits: [number, number, 'carrot' | 'pea' | 'star' | 'heart'][] = [
      [0, 60, 'carrot'],
      [0.7, 88, 'pea'],
      [1.4, 36, 'star'],
      [2.1, 82, 'heart'],
      [2.8, 62, 'carrot'],
      [3.5, 90, 'pea'],
      [4.2, 48, 'heart'],
      [4.9, 84, 'star'],
      [5.6, 26, 'pea'],
    ];
    for (const [a0, r, kind] of bits) {
      const a = a0 + swirl + t * 0.05;
      const bx = px + Math.cos(a) * r;
      const by = py + Math.sin(a) * r;
      if (kind === 'carrot') {
        circle(g, bx, by, 9);
        fillStroke(g, C.carrot, 2.5);
        circle(g, bx, by, 4.5);
        g.fillStyle = C.carrotLight;
        g.fill();
      } else if (kind === 'pea') {
        circle(g, bx, by, 6.5);
        fillStroke(g, C.leaf, 2.5);
      } else if (kind === 'star') {
        starPath(g, bx, by, 10, a);
        fillStroke(g, C.butter, 2.5);
      } else {
        heartPath(g, bx, by, 7);
        fillStroke(g, C.pink, 2.5);
      }
    }

    drawStirControls(state, pointer, C.wood);
  }

  /** The ring of stars, the spoon or the circling finger, and the clock. */
  function drawStirControls(state: KitchenState, pointer: Pointer, spoon: string) {
    const g = ctx;
    const t = fx.time;
    const s = state.stir;
    const { x: px, y: py, radius: R } = POT;

    // A ring that fills up, with a star for every full turn.
    const turns = stirTurns(state);
    g.lineCap = 'round';
    g.lineWidth = 10;
    g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    circle(g, px, py, R + 16);
    g.stroke();
    if (turns > 0) {
      g.strokeStyle = C.gold;
      g.beginPath();
      g.arc(
        px,
        py,
        R + 16,
        -Math.PI / 2,
        -Math.PI / 2 + Math.min(1, turns / STIR_TURNS) * Math.PI * 2,
      );
      g.stroke();
    }
    for (let k = 1; k <= STIR_TURNS; k++) {
      const a = -Math.PI / 2 + (k / STIR_TURNS) * Math.PI * 2;
      const lit = turns >= k;
      starPath(g, px + Math.cos(a) * (R + 16), py + Math.sin(a) * (R + 16), lit ? 15 : 12, 0);
      fillStroke(g, lit ? C.gold : C.white, 3);
    }

    const playing = state.phase === 'playing' && state.banner === 0;
    if (playing && pointer.down) {
      const dir = Math.atan2(pointer.y - py, pointer.x - px);
      g.save();
      g.translate(pointer.x, pointer.y);
      g.rotate(dir);
      rounded(g, 12, -7, 150, 14, 7);
      fillStroke(g, C.wood, 3.5);
      oval(g, 0, 0, 22, 16);
      fillStroke(g, vertical(g, -16, 16, [C.woodLight, spoon]), 3.5);
      g.restore();
    } else if (playing) {
      const a = t * 2.2;
      g.setLineDash([2, 12]);
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      circle(g, px, py, 80);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = C.ink;
      emoji(g, '👆', px + Math.cos(a) * 80, py + Math.sin(a) * 80 + 14, 40);
    }

    // A gentle clock: a pie that empties.
    const cx = 640;
    const cy = 140;
    circle(g, cx, cy, 24);
    fillStroke(g, C.white, 3.5);
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + (s.timeLeft / STIR_TIME) * Math.PI * 2);
    g.closePath();
    g.fillStyle = C.mint;
    g.fill();
  }

  function drawSauce(state: KitchenState, pointer: Pointer) {
    const g = ctx;
    const { x: px, y: py, radius: R } = POT;
    // A wooden pizza board under the dough.
    shadow(g, px + 8, py + R - 2, R + 4, 20);
    rounded(g, px + R - 6, py - 16, 120, 32, 16);
    fillStroke(g, horizontal(g, px + R, px + R + 120, [C.wood, C.woodLight]));
    circle(g, px, py, R);
    fillStroke(g, vertical(g, py - R, py + R, [C.woodLight, C.wood]));
    const r = R - 14;
    drawPizza(g, px, py, r, r, {
      sauce: stirTurns(state) / STIR_TURNS,
      cheese: false,
      toppings: [],
      baked: 0,
      swirl: state.stir.radians * 0.85,
    });
    // A happy face on the dough until the sauce covers it.
    if (stirTurns(state) < STIR_TURNS * 0.4) face(g, px, py + 6, 1.1, 'happy');
    drawStirControls(state, pointer, C.sauce);
  }

  function drawTop(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const top = state.top;
    const { x, y, rx, ry } = PIZZA_VIEW;

    // A board, then the pizza with the toppings placed so far.
    oval(g, x, y + 14, rx + 26, ry + 22);
    fillStroke(g, vertical(g, y - ry, y + ry + 30, [C.woodLight, C.wood]));
    const toppings = state.plan.toppings;
    const placed = top.results.length - (fx.topDrop ? 1 : 0);
    drawPizza(g, x, y, rx, ry, {
      sauce: 1,
      cheese: true,
      toppings: toppings.slice(0, placed),
      baked: 0,
    });

    const active = state.phase === 'playing' && state.banner === 0 && top.index < toppings.length;
    if (active) {
      const spot = toppings[top.index];
      // A glowing lane down to the spot, and a sparkly ring on the pizza.
      g.fillStyle = `rgba(255, 201, 60, ${0.2 + Math.sin(t * 5) * 0.08})`;
      rounded(g, spot.x - TOPPING_PERFECT - 8, 128, (TOPPING_PERFECT + 8) * 2, spot.y - 128, 26);
      g.fill();
      g.setLineDash([8, 7]);
      g.lineDashOffset = -t * 30;
      g.lineWidth = 4;
      g.strokeStyle = C.gold;
      oval(g, spot.x, spot.y, 30 + Math.sin(t * 6) * 2, 15 + Math.sin(t * 6));
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      for (const [sx, sy, r] of [
        [-36, -12, 7],
        [34, -16, 6],
        [0, -26, 5],
      ]) {
        starPath(g, spot.x + sx, spot.y + sy, r + Math.sin(t * 7 + sx) * 1.5, t * 2);
        fillStroke(g, C.gold, 2);
      }
      for (let i = 0; i < 2; i++) {
        const phase = (t * 0.9 + i / 2) % 1;
        const ay = 220 + phase * (spot.y - 260);
        g.globalAlpha = Math.sin(phase * Math.PI);
        g.strokeStyle = C.gold;
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(spot.x - 12, ay - 7);
        g.lineTo(spot.x, ay + 4);
        g.lineTo(spot.x + 12, ay - 7);
        g.stroke();
        g.globalAlpha = 1;
      }
    }

    const drawFloating = (kind: Topping, fx0: number, fy: number, rot: number, near: boolean) => {
      g.save();
      g.translate(fx0, fy);
      g.rotate(rot);
      toppingPiece(g, kind, 0, 0, 2.6);
      const faceY = kind === 'mushroom' ? -12 : kind === 'pineapple' ? 6 : 0;
      if (kind === 'olive' || kind === 'pepper') {
        // Rings have a hole in the middle, so the face sits on a little sign.
        circle(g, 0, -40, 15);
        fillStroke(g, C.white, 2.5);
        face(g, 0, -40, 0.55, near ? 'wow' : 'happy');
      } else {
        face(g, 0, faceY, 0.75, near ? 'wow' : 'happy');
      }
      g.restore();
    };

    if (fx.topDrop) {
      const spot = toppings[fx.topDrop.index];
      const p = clamp01(fx.topDrop.age / 0.3);
      const dx = fx.topDrop.x + (spot.x - fx.topDrop.x) * p;
      const dy = 165 + (spot.y - 165) * p * p;
      const s = 1 - p * 0.55;
      g.save();
      g.translate(dx, dy);
      g.scale(s, s);
      drawFloating(spot.kind, 0, 0, p * 3, true);
      g.restore();
    }
    if (active) {
      const spot = toppings[top.index];
      const near = Math.abs(top.x - spot.x) <= TOPPING_PERFECT + 10;
      shadow(g, top.x, 238, 26, 6);
      drawFloating(spot.kind, top.x, 165 + Math.sin(t * 4) * 6, Math.sin(t * 3) * 0.15, near);
    }
  }

  function drawBake(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const b = state.bake;
    const ox = 380;
    const left = ox - 165;
    const width = 330;
    const heat = b.baking ? 1 : 0;

    // Heat shimmer above the oven while it's on.
    if (b.baking) {
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.8 + i / 3) % 1;
        g.strokeStyle = `rgba(255, 138, 61, ${0.6 * Math.sin(phase * Math.PI)})`;
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.beginPath();
        for (let k = 0; k <= 8; k++) {
          g.lineTo(ox - 60 + i * 60 + Math.sin(k * 0.9 + t * 6 + i) * 6, 128 - phase * 30 - k * 4);
        }
        g.stroke();
      }
    }

    // The oven.
    shadow(g, ox + 6, 408, 170, 14);
    for (const fxX of [left + 30, left + width - 30]) {
      rounded(g, fxX - 14, 392, 28, 18, 6);
      fillStroke(g, C.lavender, 3);
    }
    rounded(g, left, 136, width, 262, 34);
    fillStroke(g, vertical(g, 136, 398, [C.white, '#ffe3ef']), 4.5);
    // Control panel with knobs and a little heart light.
    rounded(g, left + 14, 148, width - 28, 40, 18);
    fillStroke(g, horizontal(g, left, left + width, [C.pink, C.hotPink]), 3.5);
    [-110, -70, 70, 110].forEach((dx, i) => {
      circle(g, ox + dx, 168, 12);
      fillStroke(g, C.white, 3);
      const a = b.baking ? t * 3 + i : -Math.PI / 2;
      g.strokeStyle = C.ink;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(ox + dx, 168);
      g.lineTo(ox + dx + Math.cos(a) * 8, 168 + Math.sin(a) * 8);
      g.stroke();
    });
    heartPath(g, ox, 169, 11 + (b.baking ? Math.sin(t * 10) * 1.5 : 0));
    fillStroke(g, b.baking ? C.gold : C.white, 3);
    // Door handle.
    rounded(g, ox - 70, 198, 140, 14, 7);
    fillStroke(g, horizontal(g, ox - 70, ox + 70, [C.gold, C.butter, C.gold]), 3);

    // The window, glowing while it bakes, with the pizza inside.
    const wx = left + 30;
    const wy = 222;
    const ww = width - 60;
    const wh = 150;
    rounded(g, wx, wy, ww, wh, 24);
    fillStroke(g, vertical(g, wy, wy + wh, [C.glassLight, C.glass]), 4);
    g.save();
    rounded(g, wx + 4, wy + 4, ww - 8, wh - 8, 20);
    g.clip();
    const flicker = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
    const glow = g.createRadialGradient(ox, wy + wh, 10, ox, wy + wh, 200);
    glow.addColorStop(0, `rgba(255, 170, 70, ${(0.35 + 0.5 * heat) * flicker})`);
    glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
    g.fillStyle = glow;
    g.fillRect(wx, wy, ww, wh);
    // Rack and the glowing element below it.
    g.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(wx, wy + 108);
    g.lineTo(wx + ww, wy + 108);
    g.stroke();
    g.strokeStyle = b.baking ? C.ember : 'rgba(255, 255, 255, 0.25)';
    g.lineWidth = 5;
    g.beginPath();
    for (let k = 0; k <= 12; k++) g.lineTo(wx + 20 + k * ((ww - 40) / 12), wy + 134 + (k % 2) * 6);
    g.stroke();
    const rise = b.baking ? Math.sin(t * 5) * 1.5 : 0;
    drawPizza(g, ox, wy + 92 + rise, 100, 34, {
      sauce: 1,
      cheese: true,
      toppings: state.plan.toppings,
      baked: b.level,
    });
    // Cheese bubbles while it bakes.
    if (b.baking) {
      for (let i = 0; i < 5; i++) {
        const phase = (t * 1.4 + i * 0.27) % 1;
        g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
        g.lineWidth = 2;
        circle(g, ox - 60 + i * 30, wy + 86 - phase * 18, 2 + phase * 4);
        g.stroke();
      }
    }
    g.restore();
    // Shine on the glass.
    g.fillStyle = 'rgba(255, 255, 255, 0.18)';
    g.beginPath();
    g.moveTo(wx + 30, wy + 6);
    g.lineTo(wx + 80, wy + 6);
    g.lineTo(wx + 30, wy + 90);
    g.lineTo(wx + 8, wy + 90);
    g.closePath();
    g.fill();

    // The meter, with a star where it's golden.
    drawMeter(b.level, BAKE_TARGET, [C.hotPink, C.ember, C.butter]);

    if (state.phase === 'playing' && state.banner === 0 && !b.baking) {
      const bob = Math.sin(t * 5) * 6;
      g.fillStyle = C.ink;
      emoji(g, '👆', ox + 120, 330 + bob, 46);
    }
  }

  /** A tall meter with a star to stop at, beside the stage. */
  function drawMeter(level: number, target: number, fill: string[]) {
    const g = ctx;
    const t = fx.time;
    const mx = 588;
    const top = 126;
    const height = 258;
    rounded(g, mx, top - 6, 46, height + 12, 23);
    fillStroke(g, C.white);
    g.save();
    rounded(g, mx + 6, top, 34, height, 17);
    g.clip();
    const ty = top + height * (1 - target);
    g.fillStyle = 'rgba(255, 201, 60, 0.4)';
    g.fillRect(mx, ty - height * 0.08, 46, height * 0.16);
    const fillTop = top + height * (1 - level);
    g.fillStyle = vertical(g, top, top + height, fill);
    g.fillRect(mx, fillTop, 46, height);
    g.restore();
    g.setLineDash([6, 6]);
    g.strokeStyle = C.gold;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(mx + 4, ty);
    g.lineTo(mx + 42, ty);
    g.stroke();
    g.setLineDash([]);
    starPath(g, mx - 22, ty, 17 + Math.sin(t * 5) * 1.5, Math.sin(t * 2) * 0.2);
    fillStroke(g, C.gold, 3.5);
  }

  /** Mixing the batter: lumpy flour and streaks of yolk turn smooth and golden. */
  function drawMix(state: KitchenState, pointer: Pointer) {
    const g = ctx;
    const t = fx.time;
    const { x: px, y: py, radius: R } = POT;
    const swirl = state.stir.radians * 0.85;
    const smooth = Math.min(1, stirTurns(state) / STIR_TURNS);

    // The blue bowl from above.
    shadow(g, px + 8, py + R - 4, R, 22);
    circle(g, px, py, R);
    fillStroke(g, vertical(g, py - R, py + R, [C.sky, C.skyDark]));
    circle(g, px, py, R - 14);
    fillStroke(g, C.white, 3);
    circle(g, px, py, R - 24);
    const batter = g.createRadialGradient(px - 20, py - 20, 10, px, py, R - 24);
    batter.addColorStop(0, blend([C.cream, C.pancakeLight], smooth));
    batter.addColorStop(1, blend([C.cream, C.pancake], smooth));
    g.fillStyle = batter;
    g.fill();

    // Yolk streaks swirling round, fading as the batter comes together.
    g.lineCap = 'round';
    for (let j = 0; j < 3; j++) {
      g.strokeStyle = `rgba(255, 197, 61, ${0.85 * (1 - smooth * 0.8)})`;
      g.lineWidth = 9 - j * 2;
      g.beginPath();
      g.arc(px, py, 30 + j * 26, swirl + j * 2.1, swirl + j * 2.1 + 1.6);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    g.lineWidth = 3;
    for (let j = 0; j < 2; j++) {
      g.beginPath();
      g.arc(px, py, 45 + j * 38, swirl * 1.2 + j * 3, swirl * 1.2 + j * 3 + 1.1);
      g.stroke();
    }
    // Lumps of flour that melt away.
    const lumps = [
      [0.3, 70, 13],
      [1.5, 40, 11],
      [2.6, 88, 12],
      [3.7, 58, 14],
      [4.8, 82, 10],
      [5.7, 30, 9],
    ];
    lumps.forEach(([a0, r, size], i) => {
      const left = 1 - smooth * 1.15 + i * 0.03;
      if (left <= 0) return;
      const a = a0 + swirl + t * 0.04;
      circle(g, px + Math.cos(a) * r, py + Math.sin(a) * r, size * Math.min(1, left));
      fillStroke(g, C.white, 2);
    });
    // Little bubbles once it's smooth.
    if (smooth > 0.6) {
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.8 + i * 0.37) % 1;
        const a = i * 1.3 + 0.4;
        const r = 20 + i * 15;
        g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - phase)})`;
        g.lineWidth = 2;
        circle(g, px + Math.cos(a) * r, py + Math.sin(a) * r, 2 + phase * 5);
        g.stroke();
      }
    }
    if (smooth >= 1) face(g, px, py + 6, 1.1, 'joy');

    drawStirControls(state, pointer, C.pancake);
  }

  /** Pouring flour, then milk, into the bowl: hold, and let go at the star. */
  function drawPour(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const s = state.season;
    const pinches = state.plan.pinches;
    const index = Math.min(s.index, pinches.length - 1);
    const milkTurn = s.index >= 1;

    const flour = s.index >= 1 ? 1 : s.level / Math.max(0.2, pinches[0]);
    const milk = s.index >= 2 ? 1 : milkTurn ? s.level / Math.max(0.2, pinches[1]) : 0;

    // The stream, behind the container and into the bowl.
    if (s.pouring) {
      const sx = BOWL_X + 26;
      g.fillStyle = milkTurn ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 247, 236, 0.95)';
      g.strokeStyle = 'rgba(91, 59, 79, 0.25)';
      g.lineWidth = 2;
      const wob = Math.sin(t * 20) * 2;
      rounded(g, sx - 7 + wob, 200, 14, 135, 7);
      g.fill();
      g.stroke();
      if (!milkTurn) {
        g.fillStyle = C.white;
        for (let i = 0; i < 6; i++) {
          const y = 200 + ((t * 300 + i * 23) % 135);
          circle(g, sx + Math.sin(i * 2 + t * 9) * 9, y, 3);
          g.fill();
        }
      }
    }

    drawBowl(state, Math.min(1, flour), Math.min(1, milk));

    // The flour bag or the milk jug, tipping over the bowl while you hold.
    const pouring = s.pouring;
    g.save();
    g.translate(BOWL_X - 10, pouring ? 168 : 160 + Math.sin(t * 2.5) * 3);
    g.rotate(pouring ? 1.15 + Math.sin(t * 16) * 0.04 : Math.sin(t * 2) * 0.05);
    if (!milkTurn) {
      // A paper flour bag with a heart.
      g.beginPath();
      g.moveTo(-34, -44);
      g.lineTo(34, -44);
      g.lineTo(38, 46);
      g.quadraticCurveTo(0, 54, -38, 46);
      g.closePath();
      fillStroke(g, vertical(g, -44, 50, [C.cream, C.woodLight]));
      rounded(g, -34, -52, 68, 14, 6);
      fillStroke(g, C.woodLight, 3);
      heartPath(g, 0, 18, 10);
      fillStroke(g, C.pink, 2.5);
      face(g, 0, -12, 0.75, pouring ? 'joy' : 'happy');
    } else {
      // A milk jug with a spout and a handle.
      g.beginPath();
      g.arc(-40, 0, 20, Math.PI * 0.6, Math.PI * 1.4);
      g.lineWidth = 9;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = C.white;
      g.stroke();
      g.beginPath();
      g.moveTo(-30, -44);
      g.lineTo(26, -44);
      g.lineTo(40, -56);
      g.lineTo(34, -36);
      g.lineTo(34, 40);
      g.quadraticCurveTo(0, 52, -34, 40);
      g.closePath();
      fillStroke(g, vertical(g, -56, 50, [C.white, C.skyLight]));
      rounded(g, -30, -2, 64, 16, 8);
      g.fillStyle = C.sky;
      g.fill();
      face(g, 0, -18, 0.75, pouring ? 'joy' : 'happy');
    }
    g.restore();

    drawMeter(s.level, pinches[index], milkTurn ? [C.sky, C.white] : [C.woodLight, C.cream]);
  }

  function drawSeason(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const s = state.season;
    const px = 380;

    // Steam.
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.5 + i / 3) % 1;
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * Math.sin(phase * Math.PI)})`;
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      const x = px - 50 + i * 50;
      for (let k = 0; k <= 10; k++) {
        const y = 290 - phase * 50 - k * 5;
        g.lineTo(x + Math.sin(k * 0.8 + t * 3 + i) * 6, y);
      }
      g.stroke();
    }

    shadow(g, px, 420, 130, 14);
    for (const side of [-1, 1]) {
      rounded(g, px + side * 120 - 17, 318, 34, 18, 9);
      fillStroke(g, C.lavender, 3.5);
    }
    g.beginPath();
    g.moveTo(px - 118, 300);
    g.lineTo(px - 118, 370);
    g.quadraticCurveTo(px - 118, 414, px - 76, 414);
    g.lineTo(px + 76, 414);
    g.quadraticCurveTo(px + 118, 414, px + 118, 370);
    g.lineTo(px + 118, 300);
    g.closePath();
    fillStroke(g, horizontal(g, px - 118, px + 118, [C.purple, C.lavender, C.lavender, C.purple]));
    g.fillStyle = 'rgba(255, 255, 255, 0.4)';
    rounded(g, px - 100, 318, 12, 70, 6);
    g.fill();
    heartPath(g, px, 364, 15);
    fillStroke(g, C.pink, 3);
    oval(g, px, 300, 124, 24);
    fillStroke(g, C.lavenderLight);
    oval(g, px, 302, 106, 15);
    g.fillStyle = vertical(g, 288, 316, [C.stewLight, C.stew]);
    g.fill();
    for (const [dx, dy, color] of [
      [-60, 0, C.carrot],
      [-20, 5, C.leaf],
      [30, -3, C.carrot],
      [70, 3, C.leaf],
    ] as const) {
      oval(g, px + dx, 302 + dy, 8, 4);
      fillStroke(g, color, 2);
    }
    const specks = s.index * 12 + Math.floor(s.level * 14);
    g.fillStyle = C.white;
    for (let i = 0; i < specks; i++) {
      g.fillRect(px + ((i * 73) % 170) - 85, 296 + ((i * 37) % 14) - 3, 3, 3);
    }

    // The shaker, which turns over and shakes while you hold.
    const pouring = s.pouring;
    g.save();
    g.translate(px, pouring ? 178 : 168 + Math.sin(t * 2.5) * 3);
    g.rotate(pouring ? Math.PI + Math.sin(t * 38) * 0.16 : Math.sin(t * 2) * 0.05);
    rounded(g, -30, -38, 60, 82, 20);
    fillStroke(g, 'rgba(255, 255, 255, 0.8)');
    const pinches = state.plan.pinches;
    const left = 1 - (s.index + s.level) / (pinches.length + 1);
    g.save();
    rounded(g, -27, -35, 54, 76, 17);
    g.clip();
    g.fillStyle = C.cream;
    g.fillRect(-30, 44 - 74 * left, 60, 80);
    g.fillStyle = C.steelDark;
    for (let i = 0; i < 10; i++)
      g.fillRect(-22 + ((i * 13) % 44), 40 - ((i * 29) % Math.max(1, 70 * left)), 2, 2);
    g.restore();
    g.fillStyle = 'rgba(255, 255, 255, 0.9)';
    rounded(g, -22, -28, 7, 50, 4);
    g.fill();
    face(g, 2, 6, 0.85, pouring ? 'joy' : 'happy');
    rounded(g, -33, -62, 66, 28, 12);
    fillStroke(g, C.hotPink);
    g.fillStyle = C.white;
    for (const hx of [-14, 0, 14]) {
      circle(g, hx, -50, 3);
      g.fill();
    }
    g.restore();

    // The meter, with a star to stop at.
    drawMeter(s.level, pinches[Math.min(s.index, pinches.length - 1)], [C.lavender, C.sky]);
  }

  function drawFlip(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const f = state.flip;
    const px = 350;
    const py = 250;

    shadow(g, px + 6, py + 74, 150, 16);
    rounded(g, px + 128, py - 13, 168, 28, 14);
    fillStroke(g, horizontal(g, px + 128, px + 296, [C.hotPink, C.pink]));
    circle(g, px + 276, py + 1, 6);
    fillStroke(g, C.wallBottom, 3);
    oval(g, px, py, 150, 72);
    fillStroke(g, vertical(g, py - 72, py + 72, [C.panLight, C.pan, C.panDark]));
    oval(g, px, py - 5, 128, 56);
    const inner = g.createRadialGradient(px - 30, py - 20, 10, px, py - 5, 128);
    inner.addColorStop(0, C.pan);
    inner.addColorStop(1, C.panDark);
    g.fillStyle = inner;
    g.fill();
    for (let i = 0; i < 8; i++) {
      const phase = (t * 1.6 + i * 0.29) % 1;
      const a = i * 0.8;
      g.fillStyle = `rgba(255, 255, 255, ${0.7 * (1 - phase)})`;
      circle(g, px + Math.cos(a) * 112, py - 6 + Math.sin(a) * 46 - phase * 8, 2 + phase * 2);
      g.fill();
    }

    const flipping = fx.flipAge < 0.6;
    const flips = state.plan.flips;
    const waiting = f.index < flips.length && state.phase === 'playing';
    if (flipping || waiting) {
      const p = flipping ? fx.flipAge / 0.6 : 0;
      const lift = flipping ? -Math.sin(Math.PI * p) * 140 : 0;
      const turn = flipping ? Math.cos(Math.PI * 2 * p) : 1;
      g.save();
      g.translate(px, py - 8 + lift);
      g.rotate(flipping ? Math.sin(Math.PI * p) * 0.3 : 0);
      g.scale(1, Math.max(0.1, Math.abs(turn)));
      oval(g, 0, 9, 98, 40);
      fillStroke(g, C.pancakeDark, 3.5);
      oval(g, 0, 0, 98, 40);
      const top = g.createRadialGradient(-20, -10, 6, 0, 0, 100);
      if (turn >= 0) {
        top.addColorStop(0, C.pancakeLight);
        top.addColorStop(0.6, C.pancake);
        top.addColorStop(1, C.pancakeDark);
      } else {
        top.addColorStop(0, C.pancake);
        top.addColorStop(1, C.pancakeDark);
      }
      fillStroke(g, top, 3.5);
      if (turn >= 0) {
        g.save();
        g.rotate(-0.15);
        rounded(g, -16, -22, 30, 18, 6);
        fillStroke(g, C.butter, 2.5);
        g.restore();
        face(g, 0, 10, 1, flipping ? 'joy' : 'happy');
      } else {
        g.fillStyle = 'rgba(180, 110, 40, 0.35)';
        for (const [sx, sy] of [
          [-40, -5],
          [10, 8],
          [45, -10],
          [-10, -18],
        ]) {
          oval(g, sx, sy, 10, 5);
          g.fill();
        }
      }
      g.restore();
    }

    // The plate, stacking up the pancakes you've flipped.
    const sx = 700;
    const sy = 372;
    oval(g, sx, sy, 76, 22);
    fillStroke(g, C.white);
    oval(g, sx, sy - 2, 56, 13);
    g.strokeStyle = C.sky;
    g.lineWidth = 3;
    g.stroke();
    const landed = f.results.length - (flipping ? 1 : 0);
    for (let i = 0; i < landed; i++) {
      const share = f.results[i];
      const y = sy - 10 - i * 15;
      oval(g, sx, y + 6, 58, 17);
      fillStroke(g, C.pancakeDark, 3);
      oval(g, sx, y, 58, 17);
      fillStroke(g, share >= 0.6 ? C.pancake : share > 0 ? C.pancakeDark : C.pancakeDone, 3);
    }
    if (landed === flips.length) {
      const y = sy - 10 - (landed - 1) * 15;
      for (const [cx, cy, r] of [
        [-14, -8, 10],
        [8, -10, 12],
        [0, -18, 10],
      ]) {
        circle(g, sx + cx, y + cy, r);
        fillStroke(g, C.white, 3);
      }
      g.save();
      g.translate(sx + 2, y - 30);
      g.rotate(Math.PI);
      heartPath(g, 0, 0, 12);
      fillStroke(g, C.berry, 3);
      g.restore();
    }

    // The heat gauge: tap when the heart is in the gold.
    const x0 = 200;
    const width = 400;
    const gy = 405;
    rounded(g, x0 - 8, gy - 24, width + 16, 48, 24);
    fillStroke(g, C.white);
    rounded(g, x0, gy - 15, width, 30, 15);
    g.fillStyle = horizontal(g, x0, x0 + width, [C.sky, C.mint, C.butter, C.pink, C.hotPink]);
    g.fill();
    const target = flips[Math.min(f.index, flips.length - 1)].target;
    rounded(g, x0 + (target - 0.1) * width, gy - 20, 0.2 * width, 40, 14);
    g.fillStyle = `rgba(255, 201, 60, ${0.75 + Math.sin(t * 6) * 0.15})`;
    g.fill();
    g.lineWidth = 3.5;
    g.strokeStyle = C.ink;
    g.stroke();
    starPath(g, x0 + target * width, gy - 34, 12, Math.sin(t * 3) * 0.3);
    fillStroke(g, C.gold, 3);
    const hx = x0 + f.needle * width;
    heartPath(g, hx, gy + 2, 16);
    fillStroke(g, C.hotPink, 3.5);
    g.fillStyle = 'rgba(255, 255, 255, 0.8)';
    oval(g, hx - 7, gy - 6, 4, 3, -0.5);
    g.fill();
  }

  // -------------------------------------------------------------------------
  // Overlays

  function drawHudSoundButton() {
    const g = ctx;
    circle(g, SOUND_BUTTON.x, SOUND_BUTTON.y, SOUND_BUTTON.r);
    fillStroke(g, C.white, 3.5);
    g.fillStyle = C.ink;
    emoji(g, sound.muted ? '🔇' : '🔊', SOUND_BUTTON.x, SOUND_BUTTON.y + 1, 22);
  }

  function drawHud(state: KitchenState) {
    const g = ctx;
    const t = fx.time;

    drawHudSoundButton();

    // The recipe: one bubble per stage.
    const n = state.recipe.length;
    state.recipe.forEach((stage, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * 78;
      const y = 80;
      const done = i < state.stageIndex || state.phase === 'over';
      const current = i === state.stageIndex && state.phase === 'playing';
      if (i < n - 1) {
        g.strokeStyle = done ? C.mint : 'rgba(255, 255, 255, 0.9)';
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(x + 26, y);
        g.lineTo(x + 52, y);
        g.stroke();
      }
      if (current) {
        g.strokeStyle = C.gold;
        g.lineWidth = 5;
        circle(g, x, y, 31 + Math.sin(t * 5) * 2);
        g.stroke();
      }
      circle(g, x, y, 25);
      fillStroke(g, done ? C.mint : current ? C.white : 'rgba(255, 255, 255, 0.6)', 3.5);
      g.globalAlpha = done || current ? 1 : 0.55;
      g.fillStyle = C.ink;
      emoji(g, iconFor(state.dish, stage), x, y + 2, 26);
      g.globalAlpha = 1;
      if (done) {
        circle(g, x + 18, y - 18, 10);
        fillStroke(g, C.hotPink, 3);
        g.strokeStyle = C.white;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x + 13, y - 18);
        g.lineTo(x + 17, y - 14);
        g.lineTo(x + 23, y - 22);
        g.stroke();
      }
    });

    // Score, counting up.
    rounded(g, W - 168, 58, 150, 44, 22);
    fillStroke(g, C.white, 3.5);
    g.fillStyle = C.ink;
    emoji(g, '⭐', W - 140, 81, 24);
    plainText(g, String(Math.round(fx.shownScore)), W - 82, 81, 26, C.hotPink);

    if (state.combo >= 2 && state.phase === 'playing') {
      const pulse = 1 + Math.sin(t * 8) * 0.04;
      g.save();
      g.translate(W - 93, 126);
      g.scale(pulse, pulse);
      rounded(g, -75, -16, 150, 32, 16);
      fillStroke(g, C.hotPink, 3);
      plainText(g, `✨ ${state.combo} in a row!`, 0, 1, 16, C.white);
      g.restore();
    }

    if (state.phase === 'playing') {
      const [total, done] = progress(state);
      const width = total * 30;
      rounded(g, W / 2 - width / 2 - 12, 468, width + 24, 30, 15);
      fillStroke(g, C.white, 3);
      for (let i = 0; i < total; i++) {
        const x = W / 2 - width / 2 + 15 + i * 30;
        if (i < done) {
          starPath(g, x, 483, 11);
          fillStroke(g, C.gold, 2.5);
        } else {
          circle(g, x, 483, 6);
          fillStroke(g, C.lavenderLight, 2.5);
        }
      }
    }
  }

  function progress(state: KitchenState): [number, number] {
    switch (currentStage(state)) {
      case 'chop':
        return [state.plan.marks.length, state.chop.cut.filter(Boolean).length];
      case 'crack':
        return [EGG_SPEEDS.length, state.crack.results.length];
      case 'stir':
      case 'sauce':
      case 'mix':
        return [STIR_TURNS, Math.min(STIR_TURNS, Math.floor(stirTurns(state)))];
      case 'top':
        return [state.plan.toppings.length, state.top.results.length];
      case 'bake':
        return [1, state.bake.done ? 1 : 0];
      case 'season':
      case 'pour':
        return [state.plan.pinches.length, state.season.index];
      case 'flip':
        return [state.plan.flips.length, state.flip.results.length];
    }
  }

  function drawNotYet() {
    const n = fx.notYet;
    if (!n) return;
    if (n.age > 0.8) {
      fx.notYet = null;
      return;
    }
    const g = ctx;
    const wobble = Math.sin(n.age * 30) * 0.12 * (1 - n.age / 0.8);
    g.globalAlpha = clamp01((0.8 - n.age) / 0.3);
    g.save();
    g.translate(Math.min(W - 90, Math.max(90, n.x)), Math.max(40, n.y - 40 - n.age * 20));
    g.rotate(wobble);
    stickerText(g, 'Not yet!', 0, 0, 26, C.skyDark);
    g.restore();
    g.globalAlpha = 1;
  }

  function drawParticles() {
    const g = ctx;
    for (const p of fx.particles) {
      g.globalAlpha = clamp01((p.life / p.max) * 2);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      if (p.shape === 'star') {
        starPath(g, 0, 0, p.size);
        fillStroke(g, p.color, 2);
      } else if (p.shape === 'heart') {
        heartPath(g, 0, 0, p.size * 0.7);
        fillStroke(g, p.color, 2);
      } else if (p.shape === 'dot') {
        circle(g, 0, 0, p.size * 0.45);
        fillStroke(g, p.color, 2);
      } else if (p.shape === 'confetti') {
        g.fillStyle = p.color;
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'shell') {
        g.beginPath();
        g.moveTo(-p.size / 2, p.size / 3);
        g.lineTo(0, -p.size / 2);
        g.lineTo(p.size / 2, p.size / 3);
        g.closePath();
        fillStroke(g, p.color, 1.5);
      } else {
        g.fillStyle = p.color;
        g.fillRect(-1.5, -1.5, p.size, p.size);
      }
      g.restore();
    }
    g.globalAlpha = 1;
  }

  function drawFeedback(feedback: Feedback, y: number) {
    const g = ctx;
    const age = feedback.age;
    const pop = age < 0.2 ? easeOutBack(age / 0.2) : 1;
    const fadeFrom = FEEDBACK_TIME * 0.65;
    g.globalAlpha = age > fadeFrom ? clamp01(1 - (age - fadeFrom) / (FEEDBACK_TIME - fadeFrom)) : 1;
    g.save();
    g.translate(W / 2, y - age * 18);
    g.scale(pop, pop);
    const fills: Record<Feedback['grade'], string | CanvasGradient> = {
      'Perfect!': vertical(g, -26, 26, [C.gold, C.hotPink]),
      'Great!': C.hotPink,
      'Good!': C.purple,
      'Nice try!': C.skyDark,
    };
    stickerText(g, feedback.grade, 0, 0, 52, fills[feedback.grade]);
    if (feedback.points > 0) stickerText(g, `+${Math.round(feedback.points)}`, 0, 44, 26, C.gold);
    if (feedback.combo >= 2 && feedback.grade === 'Perfect!') {
      stickerText(g, `✨ ${feedback.combo} in a row! ✨`, 0, 78, 22, C.purple);
    }
    g.restore();
    g.globalAlpha = 1;
  }

  function drawBanner(state: KitchenState) {
    const g = ctx;
    const stage = currentStage(state);
    const elapsed = BANNER_TIME - state.banner;
    const scale = easeOutBack(clamp01(elapsed / 0.45));
    const fade = state.banner < 0.3 ? state.banner / 0.3 : 1;
    g.globalAlpha = fade;
    g.fillStyle = 'rgba(91, 59, 79, 0.22)';
    g.fillRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, 250);
    g.scale(scale, scale);
    rounded(g, -260, -82, 520, 164, 38);
    fillStroke(g, C.white, 6, C.hotPink);
    g.setLineDash([10, 9]);
    rounded(g, -246, -68, 492, 136, 28);
    g.lineWidth = 3;
    g.strokeStyle = C.lavender;
    g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(-172, 2);
    g.rotate(Math.sin(fx.time * 3) * 0.12);
    g.fillStyle = C.ink;
    emoji(g, iconFor(state.dish, stage), 0, 0, 76);
    g.restore();
    stickerText(
      g,
      titleFor(state.dish, stage),
      50,
      -16,
      38,
      vertical(g, -36, 4, [C.hotPink, C.purple]),
    );
    plainText(g, `Step ${state.stageIndex + 1} of ${state.recipe.length}`, 50, 36, 20, C.purple);
    // The first step says what we're making, on a ribbon above the card.
    if (state.stageIndex === 0) {
      rounded(g, -190, -122, 380, 50, 25);
      fillStroke(g, horizontal(g, -190, 190, [C.purple, C.lavender, C.purple]), 4);
      stickerText(g, `Let's make ${state.dish.name}!`, 0, -97, 26, C.white);
    }
    g.restore();
    g.globalAlpha = 1;
  }

  function drawEnd(state: KitchenState) {
    const g = ctx;
    const t = fx.time;
    const age = fx.overAge;
    const score = totalScore(state);
    const stars = starsFor(score, maxScore(state));

    g.fillStyle = `rgba(91, 59, 79, ${0.35 * clamp01(age / 0.4)})`;
    g.fillRect(0, 0, W, H);

    const scale = easeOutBack(clamp01(age / 0.5));
    g.save();
    g.translate(W / 2, 250);
    g.scale(scale, scale);
    rounded(g, -250, -196, 500, 392, 38);
    fillStroke(g, C.white);

    // Sun rays behind the dish.
    g.save();
    g.translate(0, -66);
    g.rotate(t * 0.3);
    g.fillStyle = 'rgba(255, 229, 138, 0.55)';
    for (let i = 0; i < 12; i++) {
      g.rotate(Math.PI / 6);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-18, -140);
      g.lineTo(18, -140);
      g.closePath();
      g.fill();
    }
    g.restore();

    g.save();
    g.translate(0, -66);
    state.dish.draw(g, t, state);
    g.restore();

    rounded(g, -200, -226, 400, 58, 29);
    fillStroke(g, horizontal(g, -200, 200, [C.hotPink, C.pink, C.hotPink]));
    stickerText(g, `${state.dish.name}!`, 0, -197, 30, C.white);

    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 92;
      const y = i === 1 ? 52 : 62;
      const r = i === 1 ? 36 : 30;
      const shownAt = 0.9 + i * 0.45;
      const earned = i < stars && age >= shownAt;
      starPath(g, x, y, r, 0);
      fillStroke(g, C.lavenderLight, 4, '#d9c8ef');
      if (earned) {
        const s = easeOutBack(clamp01((age - shownAt) / 0.35));
        g.save();
        g.translate(x, y);
        g.scale(s, s);
        starPath(g, 0, 0, r, Math.sin(t * 2 + i) * 0.08);
        fillStroke(g, vertical(g, -r, r, [C.butter, C.gold]), 4);
        g.restore();
      }
    }
    stickerText(
      g,
      ratingFor(score, maxScore(state)),
      0,
      122,
      32,
      vertical(g, 104, 140, [C.hotPink, C.purple]),
    );
    plainText(g, `⭐ ${score} points`, 0, 158, 20, C.purple);

    const pulse = 1 + Math.sin(t * 4) * 0.04;
    g.save();
    g.translate(0, 196);
    g.scale(pulse, pulse);
    rounded(g, -118, -26, 236, 52, 26);
    fillStroke(g, vertical(g, -26, 26, [C.cabinetLight, C.mint]));
    plainText(g, 'Cook again! 🔁', 0, 1, 24, C.ink);
    g.restore();

    g.restore();
  }

  function drawTitle() {
    const g = ctx;
    const t = fx.time;
    g.fillStyle = 'rgba(91, 59, 79, 0.18)';
    g.fillRect(0, 0, W, H);
    g.save();
    g.translate(W / 2 + 40, 150);
    g.rotate(Math.sin(t * 1.5) * 0.02);
    stickerText(g, 'Carnival', 0, -44, 46, vertical(g, -66, -22, [C.hotPink, C.purple]));
    stickerText(g, 'Kitchen', 0, 14, 64, vertical(g, -18, 46, [C.gold, C.hotPink]));
    g.restore();
    for (const [x, y, r] of [
      [250, 100, 16],
      [630, 96, 20],
      [660, 190, 12],
      [240, 200, 12],
    ]) {
      starPath(g, x, y, r + Math.sin(t * 4 + x) * 2, t + x);
      fillStroke(g, C.gold, 3);
    }

    // Every dish the kitchen can make, hopping in turn: which one will it be?
    const spread = Math.min(170, 500 / DISHES.length);
    DISHES.forEach((dish, i) => {
      const x = START_BUTTON.x + (i - (DISHES.length - 1) / 2) * spread;
      const hop = Math.max(0, Math.sin(t * 3 - i * 1.2)) * 12;
      g.save();
      g.translate(x, 282 - hop);
      g.scale(0.42, 0.42);
      dish.draw(g, t, null);
      g.restore();
    });
    stickerText(g, '?', START_BUTTON.x + 4, 232 + Math.sin(t * 4) * 4, 40, C.hotPink);

    // One big button: the dish is a surprise.
    const pulse = 1 + Math.sin(t * 4) * 0.05;
    g.save();
    g.translate(START_BUTTON.x, START_BUTTON.y);
    g.scale(pulse, pulse);
    rounded(g, -START_BUTTON.w / 2, -START_BUTTON.h / 2, START_BUTTON.w, START_BUTTON.h, 35);
    fillStroke(g, vertical(g, -35, 35, [C.pink, C.hotPink]), 5);
    stickerText(g, 'Tap to cook!', 0, 2, 34, C.white);
    g.restore();
  }

  return {
    reset() {
      const keep = fx.particles;
      fx = fresh();
      fx.particles = keep;
    },

    /** Shows a gentle "Not yet!" where a too-early tap landed. */
    notYet(x: number, y: number) {
      fx.notYet = { x, y, age: 0 };
      sound.boop();
    },

    hitSoundButton(x: number, y: number) {
      return Math.hypot(x - SOUND_BUTTON.x, y - SOUND_BUTTON.y) <= SOUND_BUTTON.r + 8;
    },

    /** Whether the end card has been up long enough to leave it. */
    endShown() {
      return fx.overAge >= 1.2;
    },

    /** Draws the title screen, waiting for a tap to start cooking. */
    drawTitle(dt: number) {
      update(dt);
      if (!kitchen) kitchen = paintKitchen();
      ctx.drawImage(kitchen, 0, 0);
      drawBunny(ctx, fx.time, fx.mood, fx.moodAge);
      drawTitle();
      drawHudSoundButton();
      drawParticles();
    },

    draw(state: KitchenState, pointer: Pointer, dt: number) {
      observe(state, dt);
      update(dt);
      fx.shownScore += (liveScore(state) - fx.shownScore) * Math.min(1, dt * 8);

      if (!kitchen) kitchen = paintKitchen();
      ctx.drawImage(kitchen, 0, 0);

      const stage = currentStage(state);
      if (stage === 'chop') drawChop(state);
      else if (stage === 'crack') drawCrack(state);
      else if (stage === 'stir') drawStir(state, pointer);
      else if (stage === 'season') drawSeason(state);
      else if (stage === 'pour') drawPour(state);
      else if (stage === 'mix') drawMix(state, pointer);
      else if (stage === 'sauce') drawSauce(state, pointer);
      else if (stage === 'top') drawTop(state);
      else if (stage === 'bake') drawBake(state);
      else drawFlip(state);

      drawBunny(ctx, fx.time, fx.mood, fx.moodAge);
      if (state.phase === 'playing' && state.banner === 0) drawSpeech(ctx, HINTS[stage]);
      drawHud(state);
      if (state.phase === 'playing') drawParticles();
      // The last action's popup floats above the next stage's banner.
      if (state.phase === 'playing' && state.banner > 0) drawBanner(state);
      if (state.phase === 'playing' && state.feedback) {
        drawFeedback(state.feedback, state.banner > 0 ? 112 : 168);
      }
      if (state.phase === 'playing') drawNotYet();
      if (state.phase === 'over') {
        drawEnd(state);
        drawBunny(ctx, fx.time, 'cheer', fx.overAge);
        drawParticles();
      }
    },
  };
}

function paintKitchen() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (g) drawKitchen(g);
  return canvas;
}
