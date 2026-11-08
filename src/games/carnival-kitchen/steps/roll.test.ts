import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, currentKind, move, press, release, tick } from '../game';
import { current, drawRound, playThrough, ready, seeded } from '../test-kit';
import {
  DOUGH,
  DOUGH_DISTANCE,
  DOUGH_REACH,
  ROLL_STEP_MAX,
  ROLL_TIME,
  rollGain,
  type RollState,
} from './roll';

const pin = current<RollState>;

/** Rolls the pin up and down over the dough, `pixels` in all, in small moves. */
function rollDough(state: ReturnType<typeof ready>, pixels: number) {
  press(state, DOUGH.x, DOUGH.y);
  let y = DOUGH.y;
  let dir = 1;
  for (let done = 0; done < pixels; done += 10) {
    if (Math.abs(y + dir * 10 - DOUGH.y) > 80) dir = -dir;
    y += dir * 10;
    move(state, DOUGH.x, y);
  }
  release(state);
}

describe('roll', () => {
  describe('dough', () => {
    it('spreads the dough as the pin rolls, any direction', () => {
      const state = ready('sugar-cookies', 'roll');
      rollDough(state, DOUGH_DISTANCE / 2);
      expect(pin(state).rolled).toBeCloseTo(0.5, 1);
      press(state, 300, 250);
      move(state, 340, 250);
      expect(pin(state).rolled).toBeGreaterThan(0.5);
    });

    it('stops at the outline and scores 100 for finishing straight away', () => {
      const state = ready('sugar-cookies', 'roll');
      const index = state.stepIndex;
      rollDough(state, DOUGH_DISTANCE * 3);
      expect(state.steps[index].state).toMatchObject({ rolled: 1, done: true });
      expect(state.scores[index]).toBe(100);
      expect(currentKind(state)).toBe('top');
    });

    it('scores 50 for finishing with no time left, and up to 50 for progress when time runs out', () => {
      const late = ready('sugar-cookies', 'roll');
      tick(late, ROLL_TIME - 0.001);
      rollDough(late, DOUGH_DISTANCE * 2);
      expect(late.scores[late.stepIndex - 1]).toBe(50);

      const slow = ready('sugar-cookies', 'roll');
      const index = slow.stepIndex;
      rollDough(slow, DOUGH_DISTANCE / 2);
      for (let t = 0; t <= ROLL_TIME; t += 0.1) tick(slow, 0.1);
      expect(slow.scores[index]).toBe(25);
      expect(currentKind(slow)).toBe('top');
    });

    it('does not count a jump, or rolling far from the dough', () => {
      expect(rollGain('dough', { x: 400, y: 285 }, 400, 485)).toBe(ROLL_STEP_MAX / DOUGH_DISTANCE);
      const far = DOUGH.x + DOUGH_REACH + 10;
      expect(rollGain('dough', { x: far, y: DOUGH.y }, far + 20, DOUGH.y)).toBe(0);
    });

    it('starts a fresh stroke after the finger is lifted', () => {
      const state = ready('sugar-cookies', 'roll');
      press(state, 400, 200);
      release(state);
      press(state, 400, 380);
      expect(pin(state).rolled).toBe(0);
    });
  });

  it('draws both ways, on a wide and a tall screen, to the end', () => {
    for (const id of ['sugar-cookies']) {
      for (const shape of ['page', 'tall'] as const) {
        const state = createState(dishById(id), seeded(3));
        const memory = new Map();
        playThrough(state, (dt) => drawRound(state, memory, dt, shape));
        expect(state.phase).toBe('over');
      }
    }
  });
});
