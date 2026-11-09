import { describe, expect, it } from 'vitest';
import { dishById } from '../dishes';
import { createState, press, tick } from '../game';
import { currentTurn } from '../kit';
import { current, drawRound, fakeCanvas, playThrough, ready, seeded } from '../test-kit';
import {
  MAX_LEAN,
  TOWER_FINALE,
  TOWER_RULES,
  TOWER_SWING,
  TOWER_WAIT,
  solveTower,
  stiffness,
  swingOf,
  zoomFor,
  type TowerState,
} from './tower';

const tower = current<TowerState>;

/** Puts the swinging scoop `offset` from the tower's top. */
function aim(s: TowerState, offset: number) {
  s.phase = Math.asin(Math.max(-1, Math.min(1, (s.lean + offset) / TOWER_SWING)));
}

describe('tower', () => {
  it('builds the sundae up to ten scoops', () => {
    const state = ready('ice-cream-sundae', 'tower');
    expect(tower(state).scoops.length + 3).toBe(10);
  });

  it('scores a scoop by how near the top it lands, and always keeps it', () => {
    const state = ready('ice-cream-sundae', 'tower');
    const s = tower(state);
    aim(s, 0);
    press(state, 0, 0);
    expect(s.results[0]).toBe(1);
    // The next one is still on its way: "Not yet!".
    expect(press(state, 0, 0)).toBe(false);
    tick(state, TOWER_WAIT);
    aim(s, (TOWER_RULES.perfect + TOWER_RULES.miss) / 2);
    expect(press(state, 0, 0)).toBe(true);
    expect(s.results[1]).toBeCloseTo(0.5);
    tick(state, TOWER_WAIT);
    aim(s, -TOWER_SWING);
    press(state, 0, 0);
    expect(s.results).toHaveLength(3);
  });

  it('gets wobblier as it grows, and never falls: Chef Bunny steadies it', () => {
    expect(stiffness(9)).toBeLessThan(stiffness(1));
    const state = ready('ice-cream-sundae', 'tower');
    const s = tower(state);
    let most = 0;
    while (s.index < s.scoops.length) {
      // As far off as it can be, every time.
      s.phase = s.index % 2 ? Math.PI / 2 : -Math.PI / 2;
      press(state, 0, 0);
      for (let i = 0; i < 12; i++) {
        tick(state, TOWER_WAIT / 12);
        most = Math.max(most, Math.abs(s.lean));
      }
    }
    expect(most).toBeLessThanOrEqual(MAX_LEAN);
    expect(s.steadied).toBeGreaterThan(0);
    tick(state, TOWER_FINALE);
    expect(state.phase).toBe('over');
    expect(state.scores[3]).toBeGreaterThanOrEqual(0);
  });

  it('settles back to the middle', () => {
    const state = ready('ice-cream-sundae', 'tower');
    const s = tower(state);
    aim(s, 60);
    press(state, 0, 0);
    expect(Math.abs(s.swayV)).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) tick(state, 1 / 30);
    expect(Math.abs(s.lean)).toBeLessThan(1);
  });

  it('swings each scoop from the sides in turn, a little faster each time', () => {
    const state = ready('ice-cream-sundae', 'tower');
    const s = tower(state);
    expect(swingOf(s)).toBeCloseTo(-TOWER_SWING);
    const speeds = s.scoops.map((c) => c.speed);
    expect([...speeds].sort((a, b) => a - b)).toEqual(speeds);
  });

  it('solves to full marks, and zooms out so even a tall tower fits', () => {
    const state = ready('ice-cream-sundae', 'tower');
    solveTower(currentTurn(state) as never);
    tick(state, TOWER_FINALE);
    expect(state.scores[3]).toBe(100);
    expect(zoomFor(600)).toBeLessThan(zoomFor(300));
    expect(zoomFor(0)).toBe(1);
  });

  it('cooks and draws to the end in every layout, and the end card shows the tower', () => {
    for (const shape of ['page', 'wide', 'tall'] as const) {
      const state = createState(dishById('ice-cream-sundae'), seeded(5));
      const memory = new Map();
      playThrough(state, (dt) => drawRound(state, memory, dt, shape));
      expect(state.phase).toBe('over');
      for (let i = 0; i < 40; i++) drawRound(state, memory, 0.05, shape);
      dishById('ice-cream-sundae').draw(fakeCanvas(), 2, state);
    }
  });
});
