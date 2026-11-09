import { preferencesFor, savePreference } from '../../carnival';
import { closeButton, type Box } from './book';
import { settingsFrom, type LearnSettings } from './kit';
import type { Layout } from './layout';

/**
 * The grown-ups' settings: Learning on or off, the level, "Read it myself",
 * and kitchen surprises (chaos/) on or off. They open from a small gear on the title screen that has to be
 * held for GEAR_HOLD seconds, so a young cook doesn't wander in by accident
 * but a grown-up finds it easily ("Hold for grown-ups"). They're saved with
 * the carnival's shared preferences, so they're remembered between visits.
 *
 * Everything here is in canvas units and plain functions, so it's tested
 * without a browser. render.ts draws the page, game.ts opens and closes it.
 */

const GAME = 'carnival-kitchen';

/** Seconds the gear must be held to open the settings. */
export const GEAR_HOLD = 1.5;

/**
 * Everything on the grown-ups' page: the learning settings, and whether
 * kitchen surprises happen (see chaos/).
 */
export interface GrownupSettings extends LearnSettings {
  /** Now and then a short, silly surprise in the middle of cooking. On unless turned off. */
  surprises: boolean;
}

/** The page's settings from saved preferences (or anything), checked. */
export function grownupSettingsFrom(saved: Record<string, unknown>): GrownupSettings {
  return {
    ...settingsFrom(saved),
    surprises: typeof saved.surprises === 'boolean' ? saved.surprises : true,
  };
}

/** The settings saved for this game, or the defaults. */
export function loadSettings(): GrownupSettings {
  return grownupSettingsFrom(preferencesFor(GAME));
}

/** Saves one setting, so it's remembered next time. */
export function saveSetting<K extends keyof GrownupSettings>(
  key: K,
  value: GrownupSettings[K],
): void {
  savePreference(GAME, key, value);
}

/** The gear on the title screen, in the bottom right corner. */
export function gearFor(layout: Layout): { x: number; y: number; r: number } {
  if (layout.shape === 'tall') return { x: layout.width - 46, y: layout.height - 46, r: 24 };
  return { x: layout.width - 40, y: layout.height - 40, r: 22 };
}

/** Whether a canvas point is on the gear (with room for a finger). */
export function onGear(layout: Layout, x: number, y: number): boolean {
  const gear = gearFor(layout);
  return Math.hypot(x - gear.x, y - gear.y) <= gear.r + 12;
}

/** One row of the settings page: a setting and its two choices. */
export interface SettingRow<K extends keyof GrownupSettings = keyof GrownupSettings> {
  key: K;
  label: string;
  note: string;
  options: [string, GrownupSettings[K]][];
}

export const SETTING_ROWS: SettingRow[] = [
  {
    key: 'learning',
    label: 'Learning',
    note: 'One math or reading moment each round',
    options: [
      ['On', true],
      ['Off', false],
    ],
  },
  {
    key: 'level',
    label: 'Level',
    note: 'Level 1: early 2nd grade. Level 2: late 2nd grade',
    options: [
      ['Level 1', 1],
      ['Level 2', 2],
    ],
  },
  {
    key: 'readMyself',
    label: 'Read it myself',
    note: 'Words first; the voice reads when 🔊 is tapped',
    options: [
      ['On', true],
      ['Off', false],
    ],
  },
  {
    key: 'surprises',
    label: 'Surprises',
    note: 'Now and then a silly kitchen surprise, never a fail',
    options: [
      ['On', true],
      ['Off', false],
    ],
  },
];

/** Where the settings page's parts go on the canvas, for a layout. */
export function grownupPlaces(layout: Layout) {
  const { width, height } = layout;
  const tall = layout.shape === 'tall';
  const page: Box = { x: 10, y: 10, w: width - 20, h: height - 20 };
  const cw = Math.min(page.w - 60, 700);
  const left = (width - cw) / 2;
  const n = SETTING_ROWS.length;
  // Each row's height: as roomy as before when there's space, closer together when not.
  const gap = tall ? Math.min(205, (height - 280) / n) : Math.min(110, (height - 168) / n);
  const rows = SETTING_ROWS.map((row, i) => {
    if (tall) {
      const top = 150 + i * gap;
      const control: Box = { x: left, y: top + 84, w: cw, h: Math.min(94, gap - 92) };
      return { row, label: { x: left, y: top + 22 }, note: { x: left, y: top + 58 }, control };
    }
    const top = 68 + i * gap;
    const control: Box = { x: left + cw - 300, y: top + 2, w: 300, h: Math.min(80, gap - 4) };
    return { row, label: { x: left, y: top + 28 }, note: { x: left, y: top + 56 }, control };
  });
  const done: Box = tall
    ? { x: width / 2 - 120, y: 150 + n * gap + 4, w: 240, h: 94 }
    : { x: width / 2 - 110, y: Math.min(height - 96, 68 + n * gap + 4), w: 220, h: 80 };
  return {
    page,
    tall,
    title: { x: width / 2, y: tall ? 78 : 46 },
    close: closeButton(layout),
    noteWidth: tall ? cw : cw - 320,
    rows,
    done,
  };
}

/** The two halves of a row's control: one box per choice. */
export function optionBoxes(control: Box): [Box, Box] {
  const w = control.w / 2;
  return [
    { x: control.x, y: control.y, w, h: control.h },
    { x: control.x + w, y: control.y, w, h: control.h },
  ];
}

const inside = (b: Box, x: number, y: number) =>
  x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

/** What a tap on the settings page does: change a setting, close the page, or nothing. */
export type GrownupTap =
  { key: keyof GrownupSettings; value: GrownupSettings[keyof GrownupSettings] } | 'close' | null;

export function grownupTap(
  places: ReturnType<typeof grownupPlaces>,
  x: number,
  y: number,
): GrownupTap {
  if (inside(places.done, x, y)) return 'close';
  const { close } = places;
  if (Math.hypot(x - close.x, y - close.y) <= close.r + 8) return 'close';
  for (const { row, control } of places.rows) {
    const i = optionBoxes(control).findIndex((b) => inside(b, x, y));
    if (i >= 0) return { key: row.key, value: row.options[i][1] };
  }
  return null;
}

/** The settings with one changed. */
export function withSetting(
  settings: GrownupSettings,
  tap: { key: keyof GrownupSettings; value: GrownupSettings[keyof GrownupSettings] },
): GrownupSettings {
  return grownupSettingsFrom({ ...settings, [tap.key]: tap.value });
}
