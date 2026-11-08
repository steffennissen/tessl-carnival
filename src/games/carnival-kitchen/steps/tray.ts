import {
  C,
  type G,
  circle,
  fillStroke,
  palette,
  rounded,
  starPath,
  stickerText,
  vertical,
} from '../art';
import { type Box, type QuizState, pictureQuiz, type PictureQuizOptions } from '../kit';

/**
 * Tray: a question about a tray of things in rows, an array ("3 rows of 4
 * cupcakes. How many?"), drawn beside the answers. With `skip` (counting by
 * 2s, 5s or 10s), each row's running total appears at its end after a wrong
 * try (all but the last), and all of them once it's answered or shown. A
 * learning step, woven in by activities/trays.ts.
 */

/** The sushi's seaweed and rice, as ingredients/nori.ts draws them. */
const K = palette({ nori: '#3f6b55', rice: '#fffdf7' });

export type TrayItem = 'cupcake' | 'cookie' | 'sushi';

export interface TrayOptions extends PictureQuizOptions {
  kind: 'tray';
  rows: number;
  cols: number;
  item: TrayItem;
  /** Skip counting: running totals at the ends of the rows, as help. */
  skip: boolean;
}

declare module '../kit/types' {
  interface StepKinds {
    tray: TrayOptions;
  }
}

/** How many rows show their running total: none at first, all but the last after a wrong try, all once it's done. */
export function rowTotalsShown(options: TrayOptions, state: QuizState): number {
  if (!options.skip) return state.picked !== null || state.shown ? options.rows : 0;
  if (state.picked !== null || state.shown) return options.rows;
  return state.wrong > 0 ? options.rows - 1 : 0;
}

/** Where each thing sits on the tray in `box`, row by row, and how big. */
export function trayLayout(options: TrayOptions, box: Box) {
  const tags = 46;
  const pad = 22;
  const w = box.w - pad * 2 - tags;
  const h = box.h - pad * 2;
  const cell = Math.min(w / options.cols, h / options.rows, 64);
  const left = box.x + pad + (w - cell * options.cols) / 2;
  const top = box.y + pad + (h - cell * options.rows) / 2;
  const spots = Array.from({ length: options.rows }, (_, r) =>
    Array.from({ length: options.cols }, (_, c) => ({
      x: left + cell * (c + 0.5),
      y: top + cell * (r + 0.5),
    })),
  );
  return { cell, left, top, right: left + cell * options.cols, spots };
}

function drawItem(g: G, item: TrayItem, x: number, y: number, r: number) {
  if (item === 'cupcake') {
    g.beginPath();
    g.moveTo(x - r * 0.8, y);
    g.lineTo(x + r * 0.8, y);
    g.lineTo(x + r * 0.55, y + r * 0.9);
    g.lineTo(x - r * 0.55, y + r * 0.9);
    g.closePath();
    fillStroke(g, C.sky, 2);
    g.beginPath();
    g.arc(x, y + 1, r * 0.9, Math.PI, 0);
    g.closePath();
    fillStroke(g, C.pink, 2);
    circle(g, x, y - r * 0.85, r * 0.25);
    fillStroke(g, C.berry, 1.5);
  } else if (item === 'cookie') {
    starPath(g, x, y, r, 0);
    fillStroke(g, C.cheeseGold, 2);
  } else {
    circle(g, x, y, r);
    fillStroke(g, K.nori, 2);
    circle(g, x, y, r * 0.72);
    g.fillStyle = K.rice;
    g.fill();
    for (const [dx, color] of [
      [-0.25, C.pepper],
      [0, C.carrot],
      [0.25, C.yolk],
    ] as const) {
      circle(g, x + dx * r, y, r * 0.18);
      g.fillStyle = color;
      g.fill();
    }
  }
}

const tray = pictureQuiz<TrayOptions>(
  'tray',
  ({ g, options, state }, box) => {
    const { cell, left, top, right, spots } = trayLayout(options, box);
    // The baking tray, or a plate's wooden board for sushi.
    rounded(g, left - 12, top - 10, right - left + 24, cell * options.rows + 20, 16);
    fillStroke(
      g,
      options.item === 'sushi'
        ? vertical(g, top, top + cell * options.rows, [C.woodLight, C.wood])
        : vertical(g, top, top + cell * options.rows, [C.steel, C.steelDark]),
      3,
    );
    spots.forEach((row, r) => {
      // A soft stripe behind each row, so rows read as rows.
      rounded(g, left - 4, row[0].y - cell * 0.46, right - left + 8, cell * 0.92, cell * 0.3);
      g.fillStyle = 'rgba(255, 255, 255, 0.35)';
      g.fill();
      for (const spot of row) drawItem(g, options.item, spot.x, spot.y, cell * 0.36);
      if (r < rowTotalsShown(options, state)) {
        const total = (r + 1) * options.cols;
        rounded(g, right + 14, row[0].y - 14, 40, 28, 14);
        fillStroke(g, C.butter, 2.5);
        stickerText(g, String(total), right + 34, row[0].y + 1, 18, C.hotPink, 'center', 36);
      }
    });
  },
  {
    title: () => 'Count the tray!',
    icon: (o) => (o.item === 'cupcake' ? '🧁' : o.item === 'cookie' ? '🍪' : '🍣'),
  },
);

export default tray;
