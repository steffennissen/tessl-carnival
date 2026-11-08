import { describe, expect, it } from 'vitest';
import { type BunnyPose, drawBunny } from './bunny';
import {
  CHATTER_GAP,
  INSTRUCTION_QUIET,
  LINES,
  MOOD_TIME,
  blinking,
  canChatter,
  createChef,
  earFlick,
  gaze,
  glancing,
  instructionStarted,
  isHolding,
  isMilestone,
  partyLines,
  pickLine,
  react,
  spoken,
  tickChef,
  type BunnyMood,
} from './chef';
import { fakeCanvas, seeded } from './test-kit';

const always = () => 0;
const never = () => 0.999;

/** A chef who's been quiet long enough to chat. */
function readyChef() {
  return createChef(always);
}

describe('pickLine', () => {
  it('never picks the same line twice in a row', () => {
    const random = seeded(7);
    let previous: string | null = null;
    for (let i = 0; i < 200; i++) {
      const line = pickLine(LINES.cheer, previous, random);
      expect(line).not.toBe(previous);
      expect(LINES.cheer).toContain(line);
      previous = line;
    }
  });

  it('uses the only line there is, even if it was the last one', () => {
    expect(pickLine(['Yay!'], 'Yay!', always)).toBe('Yay!');
  });

  it('can pick every line', () => {
    const random = seeded(3);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickLine(LINES.nod, null, random));
    expect(seen.size).toBe(LINES.nod.length);
  });
});

describe('milestones', () => {
  it('parties at 3 and 5 in a row, then every 5', () => {
    const parties = Array.from({ length: 21 }, (_, n) => n).filter(isMilestone);
    expect(parties).toEqual([3, 5, 10, 15, 20]);
  });

  it('says the streak in words', () => {
    expect(spoken(3)).toBe('three');
    expect(spoken(15)).toBe('15');
    expect(partyLines(3)).toContain('Wow, three in a row!');
    expect(partyLines(5)).toContain('Five in a row, yay!');
  });
});

describe('react', () => {
  const hit = (grade: 'Perfect!' | 'Great!' | 'Good!' | 'Nice try!', combo = 0) =>
    ({ kind: 'hit', grade, combo }) as const;

  it('cheers for a good hit, nods for an okay one', () => {
    const chef = readyChef();
    react(chef, hit('Great!'), 100, true, never);
    expect(chef.mood).toBe('cheer');
    react(chef, hit('Good!'), 100, true, never);
    expect(chef.mood).toBe('nod');
  });

  it('encourages on a miss or "Not yet!", never anything sad', () => {
    const chef = readyChef();
    react(chef, hit('Nice try!'), 100, true, never);
    expect(chef.mood).toBe('encourage');
    const other = readyChef();
    react(other, { kind: 'not yet' }, 100, true, never);
    expect(other.mood).toBe('encourage');
  });

  it('has a party with a spoken line at a milestone streak, once per milestone', () => {
    const chef = readyChef();
    expect(react(chef, hit('Perfect!', 3), 100, true, never)).toMatch(/three/i);
    expect(chef.mood).toBe('party');
    tickChef(chef, MOOD_TIME.party, false, always);
    // The same streak again (one action celebrated twice) is no new party.
    react(chef, hit('Perfect!', 3), 200, true, never);
    expect(chef.mood).toBe('cheer');
    react(chef, hit('Perfect!', 4), 300, true, never);
    expect(chef.mood).toBe('cheer');
    react(chef, hit('Perfect!', 5), 400, true, always);
    expect(chef.mood).toBe('party');
  });

  it('parties again for the same streak length after a break', () => {
    const chef = readyChef();
    react(chef, hit('Perfect!', 3), 100, true, always);
    react(chef, hit('Good!', 0), 200, true, always);
    tickChef(chef, MOOD_TIME.party, false, always);
    react(chef, hit('Perfect!', 3), 300, true, always);
    expect(chef.mood).toBe('party');
  });

  it("doesn't let a smaller cheer cut a party short", () => {
    const chef = readyChef();
    react(chef, hit('Perfect!', 3), 100, true, always);
    tickChef(chef, 0.5, false, always);
    react(chef, hit('Perfect!', 4), 100.5, true, always);
    expect(chef.mood).toBe('party');
  });

  it('only says something now and then, by chance', () => {
    const chef = readyChef();
    expect(react(chef, hit('Great!'), 100, true, never)).toBeNull();
    expect(react(chef, hit('Great!'), 100, true, always)).not.toBeNull();
  });

  it('keeps quiet while talking is not allowed', () => {
    const chef = readyChef();
    expect(react(chef, hit('Perfect!', 3), 100, false, always)).toBeNull();
    expect(chef.mood).toBe('party');
  });

  it('waits between lines, and after an instruction', () => {
    const chef = readyChef();
    expect(react(chef, hit('Great!'), 100, true, always)).not.toBeNull();
    expect(react(chef, hit('Great!'), 100 + CHATTER_GAP - 0.1, true, always)).toBeNull();
    expect(react(chef, hit('Great!'), 100 + CHATTER_GAP, true, always)).not.toBeNull();

    const fresh = readyChef();
    instructionStarted(fresh, 50);
    expect(canChatter(fresh, 50 + INSTRUCTION_QUIET - 0.1)).toBe(false);
    expect(react(fresh, { kind: 'not yet' }, 50 + 1, true, always)).toBeNull();
    expect(canChatter(fresh, 50 + INSTRUCTION_QUIET)).toBe(true);
  });

  it('never says the same thing twice in a row', () => {
    const chef = readyChef();
    const random = seeded(11);
    let previous: string | null = null;
    for (let i = 0; i < 50; i++) {
      const line = react(chef, { kind: 'peek' }, i * CHATTER_GAP, true, () =>
        // Always chat, but pick lines at random.
        Math.min(0.2, random()),
      );
      expect(line).not.toBeNull();
      expect(line).not.toBe(previous);
      previous = line;
    }
  });

  it("a peek doesn't change her mood", () => {
    const chef = readyChef();
    react(chef, hit('Great!'), 100, true, never);
    react(chef, { kind: 'peek' }, 100, true, never);
    expect(chef.mood).toBe('cheer');
  });
});

describe('tickChef', () => {
  it('lets moods wear off', () => {
    const chef = readyChef();
    react(chef, { kind: 'not yet' }, 0, true, never);
    tickChef(chef, MOOD_TIME.encourage - 0.1, false, never);
    expect(chef.mood).toBe('encourage');
    tickChef(chef, 0.2, false, never);
    expect(chef.mood).toBe('idle');
  });

  it('leans in while you hold, and back when you let go', () => {
    const chef = readyChef();
    for (let i = 0; i < 60; i++) tickChef(chef, 1 / 60, true, never);
    expect(chef.lean).toBeGreaterThan(0.9);
    expect(chef.holding).toBe(true);
    for (let i = 0; i < 60; i++) tickChef(chef, 1 / 60, false, never);
    expect(chef.lean).toBeLessThan(0.1);
  });

  it('blinks, flicks an ear and glances now and then', () => {
    const chef = createChef(seeded(5));
    const random = seeded(9);
    let blinks = 0;
    let wasBlinking = false;
    let flicked = false;
    let glanced = false;
    for (let i = 0; i < 60 * 30; i++) {
      tickChef(chef, 1 / 60, false, random);
      const now = blinking(chef);
      if (now && !wasBlinking) blinks += 1;
      wasBlinking = now;
      if (earFlick(chef).amount !== 0) flicked = true;
      if (glancing(chef)) glanced = true;
    }
    // About every 2 to 5 seconds over 30 seconds: often, but not all the time.
    expect(blinks).toBeGreaterThanOrEqual(6);
    expect(blinks).toBeLessThanOrEqual(20);
    expect(flicked).toBe(true);
    expect(glanced).toBe(true);
  });
});

describe('gaze', () => {
  it('looks toward the target, never further than its reach', () => {
    const look = gaze({ x: 0, y: 0 }, { x: 300, y: 0 }, 3);
    expect(look.x).toBeCloseTo(3);
    expect(look.y).toBeCloseTo(0);
    const near = gaze({ x: 0, y: 0 }, { x: 30, y: 40 }, 3);
    expect(Math.hypot(near.x, near.y)).toBeLessThan(3);
    expect(gaze({ x: 5, y: 5 }, { x: 5, y: 5 }, 3)).toEqual({ x: 0, y: 0 });
  });
});

describe('isHolding', () => {
  it('spots a hold-style step being held', () => {
    expect(isHolding({ holding: true, level: 0.3 })).toBe(true);
    expect(isHolding({ holding: false })).toBe(false);
    expect(isHolding({ turns: 2 })).toBe(false);
    expect(isHolding(null)).toBe(false);
  });
});

describe('drawBunny', () => {
  it('draws every mood, blinking, flicking and leaning, without bad numbers', () => {
    const moods: BunnyMood[] = ['idle', 'cheer', 'nod', 'party', 'encourage'];
    for (const mood of moods) {
      for (const age of [0, 0.3, 1, 3]) {
        for (const lean of [-1, 0, 0.6, 1]) {
          const pose: BunnyPose = {
            mood,
            age,
            t: age * 3,
            blink: age === 0.3,
            ear: { side: -1, amount: 0.7 },
            look: { x: 2, y: -1 },
            lean,
          };
          expect(() => drawBunny(fakeCanvas(), { x: 86, y: 392 }, pose)).not.toThrow();
        }
      }
    }
  });
});
