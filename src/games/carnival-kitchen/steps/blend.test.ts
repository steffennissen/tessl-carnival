import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, press, release, tick } from '../game';
import { TARGET_HIGH, TARGET_LOW, type HoldState } from '../kit';
import { current, drawRound, playThrough, ready, seeded } from '../test-kit';
import blend, { BLEND_EARLY, BLEND_SPEED, smoothness } from './blend';

const jar = current<HoldState>;

describe('blend', () => {
  it('puts the star somewhere new each round, one per blend', () => {
    const options = { kind: 'blend', blender: 'blender', contents: 'smoothie' } as const;
    const a = blend.start(options, seeded(1)).targets;
    const b = blend.start(options, seeded(2)).targets;
    expect(a).toHaveLength(1);
    expect(a).not.toEqual(b);
    for (const p of [...a, ...b]) {
      expect(p).toBeGreaterThanOrEqual(TARGET_LOW);
      expect(p).toBeLessThanOrEqual(TARGET_HIGH);
    }
    expect(blend.start({ ...options, blends: 3 }, seeded()).targets).toHaveLength(3);
  });

  it('scores in full when you let go at the star', () => {
    const state = ready('strawberry-smoothie', 'blend');
    const s = jar(state);
    press(state, 0, 0);
    tick(state, s.targets[0] / BLEND_SPEED);
    expect(smoothness(s)).toBeCloseTo(1);
    expect(release(state)).toBeCloseTo(100);
    expect(state.feedback?.grade).toBe('Perfect!');
    expect(state.phase).toBe('over');
  });

  it('says "Not yet!" to a quick tap, and keeps what it blended', () => {
    const state = ready('strawberry-smoothie', 'blend');
    const s = jar(state);
    press(state, 0, 0);
    tick(state, 0.1);
    const level = s.level;
    expect(level).toBeGreaterThan(0);
    expect(release(state)).toBe('not yet');
    expect(s.level).toBe(level);
    expect(s.index).toBe(0);
    expect(state.feedback).toBeNull();
    // Holding again carries on from there.
    press(state, 0, 0);
    tick(state, (s.targets[0] - level) / BLEND_SPEED);
    expect(release(state)).toBeCloseTo(100);
  });

  it('gives something for letting go a little early or late', () => {
    const early = ready('strawberry-smoothie', 'blend');
    press(early, 0, 0);
    tick(early, (jar(early).targets[0] - BLEND_EARLY + 0.01) / BLEND_SPEED);
    const points = release(early);
    expect(points).toBeGreaterThan(0);
    expect(points).toBeLessThan(100);
  });

  it('stops by itself when the meter is full, still worth something', () => {
    const state = ready('strawberry-smoothie', 'blend');
    const s = jar(state);
    press(state, 0, 0);
    for (let i = 0; i < 200; i++) tick(state, 0.05);
    expect(s.index).toBe(1);
    expect(s.level).toBe(1);
    expect(state.phase).toBe('over');
    expect(state.scores[3]).toBeGreaterThan(0);
  });

  it('starts each new blend chunky again, and keeps the last one smooth', () => {
    const dish = {
      ...dishById('strawberry-smoothie'),
      steps: [{ kind: 'blend', blender: 'blender', contents: 'smoothie', blends: 2 } as const],
    };
    const state = ready(dish);
    const s = jar(state);
    press(state, 0, 0);
    tick(state, s.targets[0] / BLEND_SPEED);
    release(state);
    expect(s.index).toBe(1);
    expect(s.level).toBe(0);
    press(state, 0, 0);
    tick(state, s.targets[1] / BLEND_SPEED);
    release(state);
    expect(state.phase).toBe('over');
    expect(s.level).toBeGreaterThan(0);
    expect(smoothness(s)).toBe(1);

    const played = createState(dish, seeded());
    const memory = new Map();
    playThrough(played, (dt) => drawRound(played, memory, dt));
    expect(played.phase).toBe('over');
  });
});
