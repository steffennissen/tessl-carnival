# Carnival Kitchen

Cook with Chef Bunny. Tap **Tap to cook!** and the kitchen picks a dish at
random: a cheesy pizza, fluffy pancakes or a veggie soup. Each dish is a whole
recipe, made step by step, and every round is a little different. It's made
for young cooks: everything is slow and forgiving, every grade is kind, and a
voice reads each step out loud for cooks who can't read yet.

## How to play

Tap **Tap to cook!** on the title screen. A ribbon says what we're making, a
card names each step, a voice reads it out, and Chef Bunny's speech bubble
keeps the hint on screen. Tap **Cook again!** on the end screen for another
dish, never the same one twice in a row. The speaker button in the corner turns
sound and the voice off and on.

| Dish                | Steps                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **Cheesy Pizza**    | Chop the pepperoni, spread the sauce, add the toppings, bake the pizza |
| **Fluffy Pancakes** | Crack the eggs, add flour and milk, mix the batter, flip the pancakes  |
| **Veggie Soup**     | Chop the carrot, stir the soup, shake the salt                         |

| Step                   | What to do                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **Chop**               | A knife glides along the carrot or pepperoni. Tap when it's over a dotted line. 4 or 5 chops. |
| **Crack the eggs**     | An egg floats across. Tap when it's over the bowl. 3 eggs, each a little faster.              |
| **Add flour and milk** | Hold to pour, and let go when the meter reaches the star. Flour first, then milk.             |
| **Mix the batter**     | Hold and draw circles in the bowl until it's smooth. 3 turns in 15 seconds.                   |
| **Flip the pancakes**  | Tap when the heart is in the gold. 4 pancakes, each a little faster.                          |
| **Spread the sauce**   | Hold and draw circles on the pizza. 3 turns in 15 seconds.                                    |
| **Add the toppings**   | A topping floats across. Tap when it's over its sparkly spot. 5 toppings, each faster.        |
| **Bake the pizza**     | Hold to bake, and let go when the meter reaches the star and the pizza looks golden.          |
| **Stir the soup**      | Hold and draw circles in the pot. 3 turns in 15 seconds.                                      |
| **Shake the salt**     | Hold to shake, and let go when the meter reaches the star. 3 shakes.                          |

Every round is different:

- The dotted lines on the carrot or pepperoni move, and there are 4 or 5.
- The stars for salt, flour and milk sit somewhere new, between 0.4 and 0.8.
- The golden zone for each pancake moves, between 0.3 and 0.7.
- The pizza always gets the pepperoni you chopped, plus four of mushroom,
  pineapple, olive, pepper and tomato, each on its own random spot.

Nothing is ever wasted:

- An egg or a topping that floats past comes round again.
- Tapping when the egg is far from the bowl, a topping is far from its spot,
  or the heart is far from the gold, just shows "Not yet!" and lets you try
  again.
- Letting go of the oven while the pizza is still pale shows "Not yet!": the
  pizza stays in, keeps its heat, and you can hold again. A pizza left in too
  long comes out by itself, a little crispy.
- A quick tap on the salt, flour or milk that barely pours anything doesn't
  use up a pour: it shows "Not yet!" so you can hold it properly.
- A chop always cuts the nearest dotted line, and scores something whenever
  the knife is close to it.

## Scoring

- **Each step is worth up to 100 points**, split evenly between its actions:
  20 or 25 a chop, 33⅓ an egg or shake, 50 a pour of flour or milk, 25 a
  pancake, 20 a topping, and 100 the bake.
- **An action scores by how close you were.** Chops score in full within 14 px
  of a line, and nothing from 60 px. Eggs score in full within 22 px of the
  bowl's middle, and the bowl takes any tap within 120 px. Shakes and pours
  score in full within 0.06 of the star and nothing from 0.35 off. Flips score
  in full within 0.06 of the gold's middle, and the pan takes any tap within
  0.3. Toppings score in full within 20 px of their spot, and the pizza takes
  any tap within 100 px. The bake scores in full within 0.07 of the star (0.7)
  and nothing from 0.4 off; letting go below 0.5 is "Not yet!".
- **Circles** (stirring, sauce and batter) score 50 for finishing, plus up to
  50 for time left. If time runs out you get up to 50 for the turns you made.
  Circles count in either direction, but wiggling back and forth cancels out.
- **Every action gets a kind grade:** Perfect! (90% of its points or more),
  Great! (60% or more), Good! (anything) or Nice try! (nothing).
- **Combo bonus:** each Perfect! after the first in an unbroken streak adds 5
  points. Anything short of perfect breaks the streak. The streak carries from
  one step to the next, and circles neither add to it nor break it.

The score in the corner counts up as you earn points. Your final score is the
step points plus the combo bonus, and it's saved to the carnival's score board
when the round ends. Soup has three steps and the others four, so stars and
Chef Bunny's verdict go by your share of what the dish could score (300 or
400, before bonuses):

| Share of the most | Stars | Verdict                |
| ----------------- | ----- | ---------------------- |
| 83% and up        | 3     | You are a Master Chef! |
| 60% to 82%        | 2     | Super yummy!           |
| 50% to 59%        | 2     | Yummy!                 |
| 33% to 49%        | 1     | Yummy!                 |
| Under 33%         | 1     | Good cooking!          |

## Adding a dish

Each dish is its own file in `dishes/`, so dishes can be added side by side
without touching each other or any shared list:

1. Add `dishes/<id>.ts` whose default export is a `Dish` (see `game.ts`): its
   `id` (the file name), `name`, `steps`, what it `chop`s, how many `pours`,
   and `draw`, which draws the finished dish for the end card and the title
   screen. Draw with the helpers in `art.ts`; `dishes/pizza.ts` is a good one
   to copy.
2. That's it: `dishes/index.ts` finds every file in the folder, and the dish
   joins the random pick.

A dish is made from the steps the kitchen already knows. A brand new step
needs its rules in `game.ts` (`press`, `release`, `step`), its drawing in
`render.ts`, and a title, hint and icon there too.

## Files

- `game.ts`: the game logic (`createState`, `makePlan`, `pickDish`, `step`,
  `press`, `release`, and one function per action: `chop`, `crack`, `stir`,
  `startPour`, `flip`, `addTopping`, `startBake`), the scoring helpers, the
  `Dish` shape, and the `carnivalKitchen` entry, the default export the midway
  finds.
- `dishes/`: one file per dish, and `index.ts`, which finds them.
- `art.ts`: the drawing kit: palette, shapes, faces, text, and the pizza.
- `render.ts`: drawing the kitchen, Chef Bunny, each step, the popups,
  particles, and the title and end screens. It also watches the state to know
  when to play a sound.
- `sound.ts`: sound effects made with Web Audio (no files to load) and the
  voice that reads each step out loud.
- `game.test.ts`: tests for the game logic and the dishes.

## Notes

This game uses its own pastel palette and a rounded font instead of the
carnival theme (house rule 3), because it's made for a young player and needed
a softer, brighter look.
