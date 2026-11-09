import { C, circle, fillStroke, rounded } from '../art';
import { NOTE } from '../sound';
import type { Chaos } from './rules';

/**
 * Flashlight: the lights flicker and go dim, and a soft circle of light
 * follows her finger (or the mouse) while she keeps cooking. After DARK_TIME
 * the lights come back: "Phew!". Cooking never waits, and if the step ends
 * first, the lights come back then.
 */

/** Seconds the lights flicker before they go dim. */
export const FLICKER_TIME = 1.2;
/** Seconds they stay dim. */
export const DARK_TIME = 8;
/** Seconds they take to come back. */
export const BACK_TIME = 0.5;
/** How dark the kitchen gets, 0 to 1: dim, never black, so she can still see. */
export const DARKNESS = 0.72;
/** The light's radius, in scene units. */
export const LIGHT_RADIUS = 135;

export interface FlashlightState {
  /** Seconds since the lights started flickering. */
  age: number;
}

/** How dark the kitchen is `age` seconds in: flickering, dim, then light again. */
export function darkness(age: number): number {
  if (age < FLICKER_TIME) {
    // On, off, on, off... a bit faster each time, then out.
    const blinks = [0.15, 0.3, 0.42, 0.55, 0.66, 0.78, 0.88, 0.97, 1.05, 1.12];
    const off = blinks.filter((b) => b <= age).length % 2 === 1;
    return off ? DARKNESS : 0;
  }
  const back = age - FLICKER_TIME - DARK_TIME;
  if (back < 0) return DARKNESS;
  return DARKNESS * Math.max(0, 1 - back / BACK_TIME);
}

interface FlashlightFx {
  /** Whether it was dark last frame. */
  dark: boolean;
  /** Whether the lights-on chime has played. */
  back: boolean;
}

const flashlight: Chaos<FlashlightState, FlashlightFx> = {
  id: 'flashlight',
  name: 'Flashlight',
  fits: () => true,
  interrupts: false,
  start: () => ({ age: 0 }),
  update(turn, dt) {
    turn.state.age += dt;
  },
  done: (s) => s.age >= FLICKER_TIME + DARK_TIME + BACK_TIME,
  says: { start: 'Oh no, the lights! Use your flashlight!', end: 'Phew! Lights on!' },
  bubble: (s) =>
    s.age < FLICKER_TIME + DARK_TIME
      ? ['Oh no, the lights!', 'Keep on cooking!']
      : ['Phew!', 'The lights are back!'],
  fx: () => ({ dark: false, back: false }),
  observe({ effects, age }, fx) {
    // A little buzz each time the lights flicker, and a bright note when they're back.
    const dark = darkness(age) > 0;
    if (dark !== fx.dark && age < FLICKER_TIME) {
      effects.sound.hiss(0.06, { volume: 0.08, from: 2400, filter: 'bandpass' });
    }
    fx.dark = dark;
    if (!fx.back && age >= FLICKER_TIME + DARK_TIME) {
      fx.back = true;
      effects.sound.tone(NOTE.E5, 0.14, { type: 'sine', volume: 0.1, slideTo: NOTE.E6 });
    }
  },
  draw({ g, state, pointer, screen, t }) {
    const dark = darkness(state.age);
    if (dark <= 0) return;
    const { x, y } = pointer;
    const r = LIGHT_RADIUS + Math.sin(t * 3) * 3;
    // The dark, with a soft round hole of light where the finger is.
    const light = g.createRadialGradient(x, y, r * 0.55, x, y, r);
    light.addColorStop(0, 'rgba(255, 244, 196, 0.08)');
    light.addColorStop(1, `rgba(32, 22, 54, ${dark})`);
    g.fillStyle = light;
    g.fillRect(screen.x, screen.y, screen.w, screen.h);
    if (state.age >= FLICKER_TIME) {
      // A warm ring at the light's edge, and a tiny torch under the finger.
      g.save();
      g.globalAlpha = dark / DARKNESS;
      circle(g, x, y, r * 0.98);
      g.strokeStyle = 'rgba(255, 229, 138, 0.35)';
      g.lineWidth = 6;
      g.stroke();
      g.translate(x + r * 0.72, y + r * 0.72);
      g.rotate(-Math.PI / 4);
      rounded(g, -9, 0, 18, 34, 6);
      fillStroke(g, C.lavender, 3);
      g.beginPath();
      g.moveTo(-14, 0);
      g.lineTo(14, 0);
      g.lineTo(9, -10);
      g.lineTo(-9, -10);
      g.closePath();
      fillStroke(g, C.butter, 3);
      g.restore();
    }
  },
  solve(turn) {
    turn.state.age = FLICKER_TIME + DARK_TIME + BACK_TIME;
  },
};

export default flashlight;
