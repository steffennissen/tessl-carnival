import type { Grade } from './kit/types';
import { WORDS_PER_SECOND, speakable, timedWord, wordAtChar, wordsOf } from './kit/words';

/**
 * Sound effects, made on the fly with Web Audio so there are no files to load,
 * and a friendly voice that reads instructions out loud for cooks who can't
 * read yet. Everything here fails quietly: a browser without audio still plays.
 */
export interface Sound {
  /** Browsers only allow audio after a tap, so call this from the first one. */
  unlock(): void;
  readonly muted: boolean;
  toggle(): void;
  chop(): void;
  crack(): void;
  bloop(): void;
  shake(): void;
  whoosh(): void;
  pop(): void;
  /** The oven crackling while the pizza bakes. */
  sizzle(): void;
  /** The oven's bell when the pizza comes out. */
  ding(): void;
  /** A soft "not yet" for a tap that came too early. */
  boop(): void;
  banner(): void;
  grade(grade: Grade, combo: number): void;
  star(index: number): void;
  fanfare(): void;
  /** One click of the dish spinner's reel; `pitch` above 1 sounds brighter. */
  tick(pitch?: number): void;
  /** The dish spinner landing: ta-da! */
  tada(): void;
  say(text: string): void;
  /**
   * Reads `text` out loud like `say`, following which word is being said, so
   * the words can light up as they're read. With the sound off (or no voice
   * in this browser) it still follows along, timed, without a sound.
   */
  read(text: string): Reading;
  /**
   * Chef Bunny's own chatter ("Wow, three in a row!"): said only if the voice
   * isn't already reading something, and never cuts anything off. Returns
   * whether it was free to speak (true when muted: nothing to talk over).
   */
  chatter(text: string): boolean;
  /**
   * A new sound from scratch, for a step that needs one of its own: a note
   * (`freq` in Hz, see NOTE) that can slide to another.
   */
  tone(freq: number, duration: number, options?: ToneOptions): void;
  /** Filtered noise: chops, cracks, sizzles, shakes and whooshes. */
  hiss(duration: number, options?: HissOptions): void;
  /** Notes one after another, `gap` seconds apart, like a little bell. */
  chime(notes: number[], gap: number, volume?: number): void;
  close(): void;
}

/** Words being read out loud by `read`. */
export interface Reading {
  /** How many words. */
  readonly count: number;
  /** The word being said: -1 before it starts, `count` once it's done. */
  word(): number;
  /** Whether it has finished, or was cut off by something else being said. */
  done(): boolean;
}

export interface ToneOptions {
  type?: OscillatorType;
  volume?: number;
  /** Seconds to wait before it starts. */
  delay?: number;
  /** A frequency to slide to by the end. */
  slideTo?: number;
}

export interface HissOptions {
  volume?: number;
  delay?: number;
  filter?: BiquadFilterType;
  /** The filter's frequency at the start, in Hz. */
  from?: number;
  /** And at the end, if it sweeps. */
  to?: number;
}

/** Notes of a C major scale, so every chime sounds happy together. */
export const NOTE = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,
  E6: 1318.5,
  G6: 1568,
  C7: 2093,
};

export function createSound(): Sound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;

  function audio() {
    if (muted || !ctx || !master) return null;
    if (ctx.state === 'suspended') void ctx.resume();
    return { ctx, master };
  }

  function tone(
    freq: number,
    duration: number,
    { type = 'sine', volume = 0.25, delay = 0, slideTo }: ToneOptions = {},
  ) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime + delay;
    const osc = a.ctx.createOscillator();
    const gain = a.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(a.master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  function hiss(
    duration: number,
    { volume = 0.2, delay = 0, filter = 'bandpass', from = 2000, to }: HissOptions = {},
  ) {
    const a = audio();
    if (!a || !noise) return;
    const t = a.ctx.currentTime + delay;
    const source = a.ctx.createBufferSource();
    source.buffer = noise;
    const biquad = a.ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.frequency.setValueAtTime(from, t);
    if (to) biquad.frequency.exponentialRampToValueAtTime(to, t + duration);
    const gain = a.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(biquad).connect(gain).connect(a.master);
    source.start(t, Math.random() * 0.5);
    source.stop(t + duration + 0.05);
  }

  function chime(notes: number[], gap: number, volume = 0.16) {
    notes.forEach((note, i) => {
      tone(note, 0.35, { type: 'triangle', volume, delay: i * gap });
      tone(note * 2, 0.2, { type: 'sine', volume: volume * 0.3, delay: i * gap });
    });
  }

  let voice: SpeechSynthesisVoice | undefined;
  function pickVoice() {
    try {
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      const friendly = [
        'Samantha',
        'Karen',
        'Moira',
        'Tessa',
        'Google UK English Female',
        'Google US English',
      ];
      voice =
        friendly.map((name) => voices.find((v) => v.name.includes(name))).find(Boolean) ??
        voices[0];
    } catch {
      voice = undefined;
    }
  }
  try {
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
  } catch {
    // No speech in this browser.
  }

  /** Whether a tap has started (silent) speech yet, which iOS needs before any other. */
  let voiceUnlocked = false;

  /** Ends the reading being followed, when something else is said over it. */
  let endReading: (() => void) | null = null;
  const now = () => performance.now() / 1000;

  function read(text: string): Reading {
    endReading?.();
    // Said with its fractions as words, each still one word, so they line up.
    const spoken = speakable(text);
    const words = wordsOf(spoken);
    const called = now();
    let started: number | null = null;
    let told = -1;
    let ended = false;
    let silent = muted;
    endReading = () => {
      ended = true;
    };
    const finish = () => {
      ended = true;
    };
    if (!silent) {
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const line = new SpeechSynthesisUtterance(spoken);
        if (voice) line.voice = voice;
        line.rate = 0.95;
        line.pitch = 1.35;
        line.onstart = () => {
          started = now();
        };
        line.onboundary = (event) => {
          if (event.name && event.name !== 'word') return;
          told = wordAtChar(words, event.charIndex);
        };
        line.onend = finish;
        line.onerror = finish;
        synth.speak(line);
      } catch {
        silent = true;
      }
    }
    // Followed by the voice's word events when there are any; else timed from
    // when the voice started, or from now with no voice (or one that never starts).
    const word = () => {
      if (ended && !silent) return words.length;
      if (told >= 0) return told;
      if (started !== null) return timedWord(words.length, now() - started);
      if (silent) return timedWord(words.length, now() - called);
      if (now() - called > 1.5) return timedWord(words.length, now() - called - 1.5);
      return -1;
    };
    const longest = words.length / WORDS_PER_SECOND + 6;
    return {
      count: words.length,
      word,
      done: () => ended || (silent && word() >= words.length) || now() - called > longest,
    };
  }

  return {
    unlock() {
      // Called inside a tap, where iOS Safari allows sound to start: it only
      // lets speech and audio play later (from the animation loop) once
      // they've been started inside a tap. So the first tap speaks a silent
      // word, and every tap wakes the audio if the system put it to sleep.
      if (!voiceUnlocked) {
        voiceUnlocked = true;
        try {
          const synth = window.speechSynthesis;
          const hush = new SpeechSynthesisUtterance(' ');
          hush.volume = 0;
          synth.speak(hush);
        } catch {
          // No speech in this browser.
        }
      }
      if (ctx) {
        if (ctx.state !== 'running') {
          try {
            void ctx.resume().catch(() => undefined);
          } catch {
            // Nothing to wake.
          }
        }
        return;
      }
      try {
        ctx = new AudioContext();
        if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.8;
        master.connect(ctx.destination);
        noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      } catch {
        ctx = null;
      }
    },
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      // Silence sounds already playing or scheduled, not just new ones.
      if (ctx && master) master.gain.setValueAtTime(muted ? 0 : 0.8, ctx.currentTime);
      if (muted) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Nothing to stop.
        }
      }
    },
    chop() {
      tone(180, 0.12, { type: 'triangle', volume: 0.35, slideTo: 90 });
      hiss(0.06, { volume: 0.25, from: 3500 });
    },
    crack() {
      hiss(0.05, { volume: 0.35, from: 4500 });
      hiss(0.04, { volume: 0.25, from: 3000, delay: 0.04 });
      tone(700, 0.18, { volume: 0.3, slideTo: 180, delay: 0.08 });
    },
    bloop() {
      tone(260 + Math.random() * 240, 0.12, { volume: 0.12, slideTo: 600 + Math.random() * 300 });
    },
    shake() {
      hiss(0.07, { volume: 0.12, from: 6000, filter: 'highpass' });
    },
    whoosh() {
      hiss(0.35, { volume: 0.25, from: 400, to: 3000 });
      tone(300, 0.3, { volume: 0.1, slideTo: 900 });
    },
    pop() {
      tone(500, 0.1, { volume: 0.2, slideTo: 1100 });
    },
    sizzle() {
      hiss(0.18, { volume: 0.07, from: 1400, filter: 'lowpass' });
      if (Math.random() < 0.4) hiss(0.03, { volume: 0.12, from: 5000, delay: Math.random() * 0.1 });
    },
    ding() {
      tone(NOTE.C7, 0.9, { volume: 0.18 });
      tone(NOTE.G6, 0.9, { volume: 0.1, type: 'triangle' });
    },
    boop() {
      tone(330, 0.16, { type: 'triangle', volume: 0.16, slideTo: 250 });
    },
    banner() {
      chime([NOTE.G5, NOTE.C6], 0.12, 0.12);
    },
    grade(grade, combo) {
      const lift = Math.min(combo, 6) * 0.04 + 1;
      if (grade === 'Perfect!') {
        chime(
          [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7].map((n) => n * lift),
          0.07,
        );
      } else if (grade === 'Great!') {
        chime([NOTE.C6, NOTE.E6, NOTE.G6], 0.08);
      } else if (grade === 'Good!') {
        chime([NOTE.C6, NOTE.E6], 0.09);
      } else {
        chime([NOTE.E5, NOTE.D5, NOTE.E5], 0.1, 0.1);
      }
    },
    star(index) {
      chime([[NOTE.C6, NOTE.E6, NOTE.G6][index] ?? NOTE.C6], 0.05, 0.2);
      hiss(0.2, { volume: 0.06, from: 8000, filter: 'highpass' });
    },
    fanfare() {
      const tune = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.A5, NOTE.C6];
      const lengths = [0.12, 0.12, 0.12, 0.3, 0.12, 0.5];
      let at = 0;
      tune.forEach((note, i) => {
        tone(note, lengths[i] + 0.15, { type: 'triangle', volume: 0.18, delay: at });
        tone(note / 2, lengths[i] + 0.15, { type: 'sine', volume: 0.12, delay: at });
        at += lengths[i];
      });
    },
    tick(pitch = 1) {
      tone(1100 * pitch, 0.04, { type: 'square', volume: 0.05 });
      hiss(0.025, { volume: 0.08, from: 5000, filter: 'highpass' });
    },
    tada() {
      chime([NOTE.C5, NOTE.E5, NOTE.G5], 0.08, 0.14);
      for (const note of [NOTE.C6, NOTE.E6, NOTE.G6]) {
        tone(note, 0.7, { type: 'triangle', volume: 0.1, delay: 0.26 });
      }
      tone(NOTE.C5 / 2, 0.7, { type: 'sine', volume: 0.12, delay: 0.26 });
      hiss(0.3, { volume: 0.06, from: 8000, filter: 'highpass', delay: 0.26 });
    },
    say(text) {
      if (muted) return;
      endReading?.();
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const line = new SpeechSynthesisUtterance(speakable(text));
        if (voice) line.voice = voice;
        line.rate = 0.95;
        line.pitch = 1.35;
        synth.speak(line);
      } catch {
        // No speech in this browser.
      }
    },
    chatter(text) {
      if (muted) return true;
      try {
        const synth = window.speechSynthesis;
        if (synth.speaking || synth.pending) return false;
        const line = new SpeechSynthesisUtterance(text);
        if (voice) line.voice = voice;
        line.rate = 1;
        line.pitch = 1.45;
        synth.speak(line);
      } catch {
        // No speech in this browser.
      }
      return true;
    },
    read,
    tone,
    hiss,
    chime,
    close() {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
      } catch {
        // Nothing to stop.
      }
      void ctx?.close();
      ctx = null;
    },
  };
}
