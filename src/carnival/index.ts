export { createRegistry, type CarnivalGame } from './registry';
export { recordScore, bestScore, topScores, createScoreBoard, type ScoreEntry } from './scores';
export { earnSticker, stickersFor, createStickerBook } from './stickers';
export {
  savePreference,
  preferencesFor,
  createPreferences,
  type PreferenceValue,
} from './preferences';
export { prizeFor, type PrizeTier } from './prizes';
export { theme, canvasFont, applyTheme } from './theme';
