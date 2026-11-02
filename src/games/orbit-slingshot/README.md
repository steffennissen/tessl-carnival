# Orbit Slingshot

Launch a ball from the pad on the left and bend it around the planets to hit the
target on the right.

## How to play

- Press anywhere on the canvas, drag back and let go. The ball flies the opposite
  way to your drag, faster the further you pull, up to a full pull of 140 px.
  It works with a mouse or a finger, and you can let go outside the canvas.
- While you pull, dots show where the ball will go for the first 0.75 s.
- A drag shorter than 12 px cancels the shot, and so does a cancelled touch.
- Every planet pulls the ball towards it, harder the closer the ball gets.
  Hitting a planet crashes the ball.
- A ball that swings more than 150 px off screen, or is still flying after 7 s,
  is lost.
- You start with 5 balls. Reaching the target costs no ball and moves you to the
  next level. A crash or a lost ball costs one ball, and you try the same level
  again. The round ends when the last ball is gone.
- Click on the game over screen to play a new round with new levels.

## Scoring

A shot that reaches the target scores:

- 100 points times the level number,
- plus 100 if it was your first shot at this level,
- plus 50 for each planet the ball grazed: passed within 24 px of its surface,
  shown by the dashed ring around it. Each planet counts once per shot.

A shot that misses scores nothing, even if it grazed a planet.

Your final score is saved to the carnival's score board when the round ends, and
it can win a prize:

| Score | Prize            |
| ----- | ---------------- |
| 500   | Paper Moon       |
| 1500  | Comet Keychain   |
| 3000  | Plush Planet     |
| 6000  | Golden Telescope |

## How levels get harder

Every level is built from the round's seed, so a level is the same each time you
retry it.

- Level `n` has `min(1 + floor(n / 2), 5)` planets: one at level 1, up to five
  from level 8.
- The target's radius is `max(36 - 2n, 18)` px: 34 px at level 1, down to 18 px
  from level 9.
- From level 2 on, a level is only kept if a full-power shot straight at the
  target misses, and the shot that wins is at least 15° away from it. You have to
  aim away from the target and let gravity bring the ball round. If 40 layouts
  in a row fail, the level drops to one planet and this rule, so it can still be
  built.

A level is built by firing one shot past the planets first and putting the
target on its path, so every level has a shot that wins. If no layout works
after 60 tries, the level falls back to one planet beside a straight shot.

## Files

- `game.ts`: the game logic (`createState`, `createLevel`, `launch`, `step`,
  `simulate`, `predictPath`, `scoreForClear` and the constants) and the
  `orbitSlingshot` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
