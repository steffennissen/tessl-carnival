import { preferencesFor, savePreference } from '../../carnival';
import type { Box } from './book';
import { settingsFrom, type LearnSettings } from './kit';
import type { Layout } from './layout';

/**
 * The grown-ups' settings: Learning on or off, the level, and "Read it
 * myself". They open from a small gear on the title screen that has to be
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

/** The settings saved for this game, or the defaults. */
export function loadSettings(): LearnSettings {
  return settingsFrom(preferencesFor(GAME));
}

/** Saves one setting, so it's remembered next time. */
export function saveSetting<K extends keyof LearnSettings>(key: K, value: LearnSettings[K]): void {
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
export interface SettingRow<K extends keyof LearnSettings = keyof LearnSettings> {
  key: K;
  label: string;
  note: string;
  options: [string, LearnSettings[K]][];
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
];

/** Where the settings page's parts go on the canvas, for a layout. */
export function grownupPlaces(layout: Layout) {
  const { width, height } = layout;
  const tall = layout.shape === 'tall';
  const page: Box = { x: 10, y: 10, w: width - 20, h: height - 20 };
  const cw = Math.min(page.w - 60, 700);
  const left = (width - cw) / 2;
  const rows = SETTING_ROWS.map((row, i) => {
    if (tall) {
      const top = 150 + i * 200;
      const control: Box = { x: left, y: top + 88, w: cw, h: 72 };
      return { row, label: { x: left, y: top + 22 }, note: { x: left, y: top + 58 }, control };
    }
    const top = 86 + i * 110;
    const control: Box = { x: left + cw - 300, y: top + 18, w: 300, h: 64 };
    return { row, label: { x: left, y: top + 32 }, note: { x: left, y: top + 66 }, control };
  });
  const done: Box = tall
    ? { x: width / 2 - 120, y: 150 + 3 * 200 + 10, w: 240, h: 66 }
    : { x: width / 2 - 100, y: Math.min(height - 72, 424), w: 200, h: 54 };
  return {
    page,
    tall,
    title: { x: width / 2, y: tall ? 78 : 46 },
    close: { x: width - 52, y: 52, r: 30 },
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
  { key: keyof LearnSettings; value: LearnSettings[keyof LearnSettings] } | 'close' | null;

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
  settings: LearnSettings,
  tap: { key: keyof LearnSettings; value: LearnSettings[keyof LearnSettings] },
): LearnSettings {
  return settingsFrom({ ...settings, [tap.key]: tap.value });
}
