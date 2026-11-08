import { describe, expect, it } from 'vitest';
import { currentKind, press, tick } from '../game';
import { BANNER_TIME } from '../kit';
import { current, ready, seeded } from '../test-kit';
import chop, {
  CHOP_FIRST,
  CHOP_LAST,
  CHOP_MISS,
  CHOP_PERFECT,
  KNIFE_MAX,
  KNIFE_MIN,
  type ChopState,
} from './chop';

const knife = current<ChopState>;

describe('chop', () => {
  it('rolls 4 or 5 lines, spread along the board', () => {
    const counts = new Set<number>();
    for (let seed = 1; seed < 30; seed++) {
      const { marks } = chop.start({ kind: 'chop', item: 'carrot' }, seeded(seed));
      counts.add(marks.length);
      expect(marks[0]).toBeGreaterThan(CHOP_FIRST - 20);
      expect(marks[marks.length - 1]).toBeLessThan(CHOP_LAST + 20);
      for (let i = 1; i < marks.length; i++) {
        // Far enough apart to see, and to aim at, separately.
        expect(marks[i] - marks[i - 1]).toBeGreaterThanOrEqual(40);
      }
    }
    expect([...counts].sort()).toEqual([4, 5]);
  });

  it('scores 100 for perfect chops on every line and moves on', () => {
    const state = ready('soup');
    const c = knife(state);
    for (const mark of c.marks) {
      c.knifeX = mark;
      press(state, 0, 0);
    }
    expect(state.scores[0]).toBe(100);
    expect(currentKind(state)).toBe('stir');
    expect(state.banner).toBe(BANNER_TIME);
  });

  it('forgives a chop that is a little off', () => {
    const state = ready('soup');
    const c = knife(state);
    c.knifeX = c.marks[0] + CHOP_PERFECT;
    press(state, 0, 0);
    expect(c.points).toBe(100 / c.marks.length);
  });

  it('cuts the nearest uncut line, and scores less the further off it is', () => {
    const state = ready('soup');
    const c = knife(state);
    c.knifeX = c.marks[2] + 30;
    press(state, 0, 0);
    expect(c.cut[2]).toBe(true);
    expect(c.cut.filter(Boolean)).toHaveLength(1);
    expect(c.points).toBeGreaterThan(0);
    expect(c.points).toBeLessThan(100 / c.marks.length);
  });

  it('scores nothing from the miss distance', () => {
    const state = ready('soup');
    const c = knife(state);
    const last = c.marks.length - 1;
    c.cut = c.marks.map((_, i) => i !== last);
    c.knifeX = c.marks[last] - CHOP_MISS;
    press(state, 0, 0);
    expect(state.feedback?.points).toBe(0);
    expect(state.feedback?.grade).toBe('Nice try!');
  });

  it('glides the knife back and forth', () => {
    const state = ready('soup');
    const c = knife(state);
    tick(state, 0.05);
    expect(c.knifeX).toBeGreaterThan(KNIFE_MIN);
    c.knifeX = KNIFE_MAX - 1;
    tick(state, 0.05);
    expect(c.dir).toBe(-1);
    expect(c.knifeX).toBeLessThanOrEqual(KNIFE_MAX);
  });
});
