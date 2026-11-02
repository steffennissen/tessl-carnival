# Carnival Stack

Pieces fall into a well. Fit them together to fill whole rows: a full row
clears, and everything above it drops down. The round ends when the well fills up.

## How to play

A round starts as soon as the game opens.

| Key          | Action                   |
| ------------ | ------------------------ |
| Left / Right | Move                     |
| Down         | Soft drop                |
| Up or X      | Rotate clockwise         |
| Z            | Rotate counter-clockwise |
| Space        | Hard drop                |
| C or Shift   | Hold                     |
| P            | Pause and resume         |
| Enter        | New round, at game over  |

- The well is 10 columns wide and 20 rows tall, with 2 hidden rows above it.
- The seven four-cell pieces come in bags: all seven, shuffled, then a new bag.
  The panel on the right shows the next 3, and the outline in the well shows
  where the current piece will land.
- Holding Left or Right moves once, waits 170ms, then moves every 50ms. Holding
  Down drops one row every 50ms, at every level.
- Rotation uses the Super Rotation System, with its wall kicks. O never rotates.
- A piece on the ground locks after 500ms. Each move or rotation on the ground
  restarts that wait, up to 15 times per piece, and reaching a new lowest row
  gives all 15 back. Hard drop locks at once.
- Hold swaps the current piece with the held one, or takes the next piece if
  hold is empty. You can hold once per piece, until it locks.
- P, switching to another window or hiding the page pauses. Only P resumes, and
  keys held through the pause need pressing again. Time spent paused never
  counts as play.
- Keys pressed with Meta, Control or Alt held are left to the browser, but
  letting go of a key always stops its action, whichever of those are held.
- The round ends when a new piece spawns on top of locked cells, or a piece locks
  entirely in the hidden rows without clearing a row. Leaving mid-round abandons
  it, and no score is recorded.

## Scoring

| Lines cleared at once | Points      |
| --------------------- | ----------- |
| 1                     | 100 × level |
| 2                     | 300 × level |
| 3                     | 500 × level |
| 4                     | 800 × level |

- The level is `1 + floor(lines / 10)`. A clear scores at the level from before
  its lines count, and the new level starts with the next piece.
- Soft drop scores 1 point for each row fallen while Down is held. Hard drop
  scores 2 points for each row the piece moves. Neither is multiplied by level.
- A piece falls one row every `max(1000 × 0.8^(level - 1), 50)` milliseconds.

Your final score is saved to the carnival's score board when the round ends, and
the game over screen shows it beside your best.

## Look

The game is drawn as the inside of a circus tent, the Big Top. Each piece has
its own pattern as well as its colour, so all seven can be told apart by pattern
alone. Every clear throws a 1.6 second burst of confetti behind the pieces; it
is skipped when the system asks for reduced motion, and it never affects play.

## Files

- `game.ts`: the game logic (`createState`, `press`, `release`, `step`, `blur`
  and helpers such as `ghostY` and `gravityInterval`), the play clock and key
  mapping the browser loop uses (`createClock`, `pressAt`, `frameAt`,
  `pressActionFor`, `releaseActionFor`), the confetti burst
  (`createConfetti`, `stepConfetti`, `confettiPieces`) and the `carnivalStack`
  entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
