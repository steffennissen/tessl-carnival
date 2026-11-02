# Balloon Hop

Hop a balloon on a string through the gaps in the striped carnival poles.

The booth is drawn as a cut-paper carnival: flat card layers of clouds, hills,
big top tents and bunting, each with a soft offset shadow, drifting past at
their own speeds behind the poles.

## How to play

- Click or tap the game, or press Space or ArrowUp, to hop. Holding a key down
  hops once: press again for the next hop.
- Every hop sets the balloon rising at the same speed, however fast it was
  falling. Gravity pulls it back down.
- The balloon bobs in place until your first press, which starts the round and
  hops at the same time.
- Touching a pole or the boardwalk ends the round. The top of the screen only
  stops the balloon rising.
- After a round ends, presses are ignored for half a second so a stray hop
  doesn't skip the result. The next press shows a new course, and the press
  after that starts it.
- Switching to another tab pauses the game. Press to carry on.

## Scoring

You score 1 point for every pole you pass, at the moment the middle of the pole
reaches the balloon. The step that hits a pole scores nothing.

The course never gets harder: every gap is 130 px tall, the poles are 200 px
apart, and each gap centre is at most 110 px higher or lower than the last.

Your final score is saved to the carnival's score board when the round ends,
and you win a prize at these scores:

| Score | Prize            |
| ----- | ---------------- |
| 10    | Paper Pennant    |
| 20    | Plush Monkey     |
| 30    | Giant Teddy Bear |
| 40    | Golden Ticket    |

## Files

- `game.ts`: the game logic (`createState`, `hop`, `step`, `pump`, `nextRandom`,
  `nextGapY`, `circleHitsRect` and the constants) and the `balloonHop` entry, the
  default export the midway finds. The simulation runs in fixed steps of 1/120 s,
  so it plays the same at 10 frames a second or faster. Each frame feeds it at
  most 0.1 s, so below 10 frames a second the game runs slower.
- `game.test.ts`: tests for the game logic.
