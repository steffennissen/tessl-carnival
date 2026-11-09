import { describe, expect, it } from 'vitest';
import { C } from '../art';
import { allIngredients } from '../ingredients';
import { CUP_FILL_LEAST, CUP_FILL_SURFACE, contrastWithWhite } from './measure';

describe('the measuring cup fill', () => {
  it('measures contrast with white', () => {
    expect(contrastWithWhite(C.white)).toBeCloseTo(1, 5);
    expect(contrastWithWhite('#000000')).toBeCloseTo(21, 5);
    // The old milk meter faded to white: the glass and the milk looked alike.
    expect(contrastWithWhite(C.skyLight)).toBeLessThan(CUP_FILL_LEAST);
  });

  it('fills with colours that stand out from the white glass', () => {
    const pours = allIngredients().filter((i) => i.pour);
    expect(pours.length).toBeGreaterThan(3);
    for (const { id, pour } of pours) {
      const meter = pour?.meter ?? [];
      expect(contrastWithWhite(meter[0]), `${id} at the surface`).toBeGreaterThanOrEqual(
        CUP_FILL_SURFACE,
      );
      for (const color of meter) {
        expect(contrastWithWhite(color), `${id} ${color}`).toBeGreaterThanOrEqual(CUP_FILL_LEAST);
      }
    }
  });
});
