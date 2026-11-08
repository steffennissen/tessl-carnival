import { describe, expect, it } from 'vitest';
import { press, tick } from '../game';
import { BOWL, POUR_SPEED, TARGET_HIGH, TARGET_LOW, type HoldState } from '../kit';
import { current, drawRound, nextStep, pourPerfectly, ready, seeded } from '../test-kit';
import pour, { insideSmoothness, mouthOf, POUR_TOP, type PourOptions } from './pour';

const meter = current<HoldState>;

describe('pour', () => {
  it('puts a star somewhere new for each pour', () => {
    const options: PourOptions = { kind: 'pour', pours: ['flour', 'milk'] };
    const targets = pour.start(options, seeded()).targets;
    expect(targets).toHaveLength(2);
    for (const p of targets) {
      expect(p).toBeGreaterThanOrEqual(TARGET_LOW);
      expect(p).toBeLessThanOrEqual(TARGET_HIGH);
    }
  });

  it('uses each pour, and what it goes into and what is inside when given', () => {
    expect(pour.uses({ kind: 'pour', pours: ['flour', 'milk'] })).toEqual([
      ['flour', 'pour'],
      ['milk', 'pour'],
    ]);
    expect(
      pour.uses({ kind: 'pour', pours: ['milk'], into: 'blender', inside: 'smoothie' }),
    ).toEqual([
      ['milk', 'pour'],
      ['blender', 'pourInto'],
      ['smoothie', 'blended'],
    ]);
  });

  it('pours into the mixing bowl unless told otherwise', () => {
    expect(mouthOf({ kind: 'pour', pours: ['milk'] })).toEqual({ x: BOWL.x + 26, y: 335 });
  });

  it('lands the stream inside whatever it pours into, below where it starts', () => {
    for (const into of ['pot', 'blender', 'pecorino']) {
      const mouth = mouthOf({ kind: 'pour', pours: ['milk'], into });
      expect(mouth.y, into).toBeGreaterThan(POUR_TOP + 30);
      expect(mouth.x, into).toBeGreaterThan(300);
      expect(mouth.x, into).toBeLessThan(500);
    }
  });

  it('pours the smoothie milk into the blender, onto the chunky fruit', () => {
    const state = ready('strawberry-smoothie', 'pour');
    const options = state.steps[state.stepIndex].options as PourOptions;
    expect(options.into).toBe('blender');
    expect(insideSmoothness(state, 'smoothie')).toBe(0);
  });

  it('pours the cream into the pot once the bisque is blended smooth', () => {
    const state = ready('lobster-bisque', 'pour');
    expect(insideSmoothness(state, 'bisque')).toBe(0);
    pourPerfectly(state);
    nextStep(state);
    // Blend it, then the cream.
    const blend = meter(state);
    press(state, 0, 0);
    tick(state, 10);
    expect(blend.index).toBe(blend.targets.length);
    nextStep(state);
    const cream = state.steps[state.stepIndex].options as PourOptions;
    expect(cream.pours).toEqual(['cream']);
    expect(cream.into).toBe('pot');
    expect(insideSmoothness(state, 'bisque')).toBe(1);
  });

  it('draws every dish that pours, at every stage of the pour', () => {
    for (const id of [
      'pancakes',
      'cupcakes',
      'strawberry-smoothie',
      'lobster-bisque',
      'mac-and-cheese',
      'cacio-e-pepe',
    ]) {
      const state = ready(id, 'pour');
      const memory = new Map();
      drawRound(state, memory);
      press(state, 0, 0);
      tick(state, 0.5 / POUR_SPEED / 2);
      expect(() => drawRound(state, memory), id).not.toThrow();
      tick(state, 10);
      expect(() => drawRound(state, memory), id).not.toThrow();
    }
  });
});
