# Carnival Kitchen

Cook with Chef Bunny: pick **Pizza!** or a **Surprise!** recipe. A surprise
picks three of five cooking steps and makes fluffy pancakes, a cozy veggie
stew or a rainbow soup. Pizza always takes the same three steps. It's made for young cooks: everything is slow and forgiving,
every grade is kind, and a voice reads each step out loud for cooks who
can't read yet.

## How to play

Tap **Pizza!** or **Surprise!** on the title screen. A card names each step, a
voice reads it out, and Chef Bunny's speech bubble keeps the hint on screen.

| Step                  | What to do                                                                       |
| --------------------- | -------------------------------------------------------------------------------- |
| **Chop the carrot**   | A knife glides along the carrot. Tap when it's over a dotted line. 5 chops.      |
| **Crack the eggs**    | An egg floats across. Tap when it's over the bowl. 3 eggs, each a little faster. |
| **Stir the soup**     | Hold and draw circles in the pot. 3 turns in 15 seconds.                         |
| **Shake the salt**    | Hold to shake, and let go when the meter reaches the star. 3 shakes.             |
| **Flip the pancakes** | Tap when the heart is in the gold. 4 pancakes, each a little faster.             |

Pizza:

| Step                 | What to do                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Spread the sauce** | Hold and draw circles on the pizza, just like stirring. 3 turns in 15 seconds.         |
| **Add the toppings** | A topping floats across. Tap when it's over its sparkly spot. 5 toppings, each faster. |
| **Bake the pizza**   | Hold to bake, and let go when the meter reaches the star and the pizza looks golden.   |

A surprise's steps always run in the order of the first table, so a round
might be chop, stir, flip or crack, shake, flip. Tap **Cook again!** on the end
screen to go back to the title screen and pick again.
The speaker button in the corner turns sound and the voice off and on.

Nothing is ever wasted:

- An egg or a topping that floats past comes round again.
- Tapping when the egg is far from the bowl, a topping is far from its spot,
  or the heart is far from the gold, just shows "Not yet!" and lets you try
  again.
- Letting go of the oven while the pizza is still pale shows "Not yet!": the
  pizza stays in, keeps its heat, and you can hold again. A pizza left in too
  long comes out by itself, a little crispy.
- A chop always cuts the nearest dotted line, and scores something whenever
  the knife is close to it.
- A quick tap on the salt shaker that barely pours anything doesn't use up a
  shake: it shows "Not yet!" so you can hold it properly.

## Scoring

- **Each step is worth up to 100 points**, split evenly between its actions
  (20 a chop or topping, 33⅓ an egg or shake, 25 a pancake, 100 the bake).
- **An action scores by how close you were.** Chops score in full within 14 px
  of a line, and nothing from 60 px. Eggs score in full within 22 px of the
  bowl's middle, and the bowl takes any tap within 120 px. Shakes score in full
  within 0.06 of the star and nothing from 0.35 off. Flips score in full within
  0.06 of the gold's middle, and the pan takes any tap within 0.3. Toppings
  score in full within 20 px of their spot, and the pizza takes any tap
  within 100 px. The bake scores in full within 0.07 of the star (0.7) and
  nothing from 0.4 off; letting go below 0.5 is "Not yet!".
- **Stirring** (and spreading the sauce) scores 50 for finishing, plus up to 50 for time left. If time
  runs out you get up to 50 for the turns you made. Circles count in either
  direction, but wiggling back and forth cancels out.
- **Every action gets a kind grade:** Perfect! (90% of its points or more),
  Great! (60% or more), Good! (anything) or Nice try! (nothing).
- **Combo bonus:** each Perfect! after the first in an unbroken streak adds 5
  points. Anything short of perfect breaks the streak. The streak carries from
  one step to the next, and stirring neither adds to it nor breaks it.

The score in the corner counts up as you earn points. Your final score is the
step points plus the combo bonus, and it's saved to the carnival's score board
when the round ends. Chef Bunny's verdict:

| Score      | Stars | Verdict                |
| ---------- | ----- | ---------------------- |
| 250 and up | 3     | You are a Master Chef! |
| 180 to 249 | 2     | Super yummy!           |
| 150 to 179 | 2     | Yummy!                 |
| 100 to 149 | 1     | Yummy!                 |
| Under 100  | 1     | Good cooking!          |

## Files

- `game.ts`: the game logic (`createState`, `recipeFor`, `pickRecipe`, `step`,
  `press`, `release`, and one function per action: `chop`, `crack`, `stir`,
  `startPour`, `flip`, `addTopping`, `startBake`), the scoring helpers, and the `carnivalKitchen` entry, the default
  export the midway finds.
- `render.ts`: all the drawing: the kitchen, Chef Bunny, the pizza, each step, the
  popups, particles, and the title and end screens. It also watches the state
  to know when to play a sound.
- `sound.ts`: sound effects made with Web Audio (no files to load) and the
  voice that reads each step out loud.
- `game.test.ts`: tests for the game logic.

## Notes

This game uses its own pastel palette and a rounded font instead of the
carnival theme (house rule 3), because it's made for a young player and needed
a softer, brighter look.
