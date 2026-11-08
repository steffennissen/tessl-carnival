import { describe, expect, it } from 'vitest';
import { createState, press, release, tick } from '../game';
import { POUR_SPEED, TARGET_HIGH, TARGET_LOW, type Dish } from '../kit';
import { current, drawRound, playThrough, pourPerfectly, ready } from '../test-kit';
import { dishById } from '../dishes';
import scoop, { ballRadius, type ScoopState } from './scoop';

const tubs = current<ScoopState>;
const flavours = ['strawberry-scoop', 'vanilla-scoop', 'mint-scoop'];
const dish: Dish = {
  ...dishById('pancakes'),
  id: 'scoops',
  steps: [{ kind: 'scoop', flavours }],
};

describe('scoop', () => {
  it('puts a star size somewhere new for each flavour', () => {
    const s = scoop.start({ kind: 'scoop', flavours }, () => 0.25);
    expect(s.targets).toHaveLength(3);
    for (const target of s.targets) {
      expect(target).toBeGreaterThanOrEqual(TARGET_LOW);
      expect(target).toBeLessThanOrEqual(TARGET_HIGH);
    }
    expect(ballRadius(1)).toBeGreaterThan(ballRadius(0.5));
  });

  it('scores in full for letting go at the star, and keeps how big each scoop was', () => {
    const state = ready(dish);
    pourPerfectly(state);
    const s = tubs(state);
    expect(state.phase).toBe('over');
    expect(state.scores).toEqual([100]);
    expect(s.sizes).toHaveLength(3);
    s.sizes.forEach((size, i) => expect(size).toBeCloseTo(s.targets[i], 1));
  });

  it('says "Not yet!" to a quick tap, and uses no scoop up', () => {
    const state = ready(dish);
    press(state, 0, 0);
    tick(state, 0.1);
    expect(release(state)).toBe('not yet');
    expect(tubs(state).index).toBe(0);
    expect(tubs(state).sizes).toEqual([]);
  });

  it('lets a scoop held too long go by itself, as big as it gets', () => {
    const state = ready(dish);
    press(state, 0, 0);
    tick(state, 1.2 / POUR_SPEED);
    const s = tubs(state);
    expect(s.index).toBe(1);
    expect(s.sizes).toEqual([1]);
    expect(s.points).toBeGreaterThanOrEqual(0);
  });

  it('plays and draws to the end, upright too', () => {
    for (const shape of ['page', 'tall'] as const) {
      const state = createState(dish);
      const memory = new Map();
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      for (let i = 0; i < 20; i++) drawRound(state, memory, 0.05, shape);
      expect(state.phase).toBe('over');
    }
  });
});
