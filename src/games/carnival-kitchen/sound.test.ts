import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSound } from './sound';

/** A pretend speechSynthesis, keeping what it was asked to say. */
function fakeSpeech() {
  const spoken: { text: string; volume: number }[] = [];
  const synth = {
    speaking: false,
    pending: false,
    speak: vi.fn((line: { text: string; volume: number }) => spoken.push(line)),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  class Utterance {
    volume = 1;
    rate = 1;
    pitch = 1;
    constructor(public text: string) {}
  }
  return { synth, spoken, Utterance };
}

/** A pretend AudioContext that starts asleep, as iOS's does. */
function fakeAudio() {
  const made: { state: string; resume: ReturnType<typeof vi.fn> }[] = [];
  class Context {
    state = 'suspended';
    sampleRate = 100;
    currentTime = 0;
    destination = {};
    resume = vi.fn(() => {
      this.state = 'running';
      return Promise.resolve();
    });
    constructor() {
      made.push(this);
    }
    createGain() {
      return { gain: { value: 1, setValueAtTime: vi.fn() }, connect: vi.fn() };
    }
    createBuffer(_channels: number, length: number) {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    }
    close() {
      return Promise.resolve();
    }
  }
  return { Context, made };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('unlocking sound inside the first tap', () => {
  it('speaks a silent word once, so iOS lets the voice speak later', () => {
    const { synth, spoken, Utterance } = fakeSpeech();
    const { Context, made } = fakeAudio();
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
    vi.stubGlobal('AudioContext', Context);
    const sound = createSound();
    sound.unlock();
    expect(spoken).toHaveLength(1);
    expect(spoken[0].volume).toBe(0);
    expect(spoken[0].text.trim()).toBe('');
    // The audio is woken inside the tap too.
    expect(made).toHaveLength(1);
    expect(made[0].resume).toHaveBeenCalled();
    // Later taps don't speak again, but do wake audio the system put to sleep.
    made[0].state = 'interrupted';
    sound.unlock();
    expect(spoken).toHaveLength(1);
    expect(made[0].resume).toHaveBeenCalledTimes(2);
    expect(made).toHaveLength(1);
    // And then the voice speaks for real.
    sound.say('Chop the carrot!');
    expect(spoken.map((line) => line.text)).toEqual([' ', 'Chop the carrot!']);
  });

  it('is safe in a browser with no speech and no audio', () => {
    vi.stubGlobal('window', {});
    const sound = createSound();
    expect(() => sound.unlock()).not.toThrow();
    expect(() => sound.unlock()).not.toThrow();
    expect(() => sound.say('Hello!')).not.toThrow();
    expect(sound.chatter('Yay!')).toBe(true);
    expect(() => sound.close()).not.toThrow();
  });
});
