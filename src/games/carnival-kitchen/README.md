# Carnival Kitchen

Cook with Chef Bunny. Tap **Tap to cook!** and the kitchen picks a dish at
random from 16 dishes, from pizza and pancakes to sushi, burgers and an ice
cream sundae. Each dish is a whole
recipe, made step by step, and every round is a little different. It's made
for young cooks: everything is slow and forgiving, every grade is kind, and a
voice reads each step out loud for cooks who can't read yet.

## Phones and tablets

On a phone or tablet (a device whose main input is a finger), or in a window
narrower than 600 px, the kitchen fills the whole screen, and a 🏠 button next to the speaker goes back to the midway.
Held upright, it turns tall: the score and recipe sit on top, the cooking in
the middle and Chef Bunny below with bigger hint text. Held sideways, the
kitchen stretches to fill the screen around the cooking. Turning the device
switches between the two. On a computer the game stays in the page as before.

## How to play

Tap **Tap to cook!** on the title screen. There's nothing to choose: the dish
waits under a lid with a "?" on it, and the kitchen picks it when you tap. A
ribbon says what we're making, a
card names each step, a voice reads it out, and Chef Bunny's speech bubble
keeps the hint on screen. The speaker button in the corner turns sound and
the voice off and on.

A round goes like this:

1. **Title screen.** Tap **Tap to cook!** for a surprise dish, or **📖 Recipes**
   to open the recipe book.
2. **The steps**, one card at a time.
3. **Decorate your dish!** The finished dish sits on a cloth with a tray of six
   treats: sprinkles, a cherry, a heart, a star, a flower and a little flag.
   Drag a treat onto the dish, or tap a treat and then tap the dish to add as
   many as you like. Drag one on the dish to move it, or back to the tray to
   take it off. A treat let go anywhere above the tray lands on the dish, so
   nothing can go wrong, and decorating scores nothing. Tap **Done!**, or leave
   it 20 seconds without a touch, to move on. A tap in the first moment does
   nothing, so a last excited tap from the final step doesn't skip it. Up to 30
   treats fit on a dish; another one replaces the oldest. Decorations start
   fresh every round.
4. **The end card**: the dish with its decorations, the stars, Chef Bunny's
   verdict and the points. If the dish earned its first sticker, or more stars
   than its sticker had, a badge says **New sticker!** or **Sticker
   upgraded!** after the stars, and Chef Bunny says so too. After a short
   pause, tap **Cook again!** for another dish, never the same one twice in a
   row.

### The recipe book

Every finished round earns its dish's sticker at the round's stars (1 to 3).
A sticker only ever keeps its best stars. The recipe book, from the title
screen's **📖 Recipes** button, shows all the dishes in a grid with a count
such as "7 of 16 dishes": each cooked dish with its picture, name and best
stars, and the rest under a little lid with a "?". Tap a cooked dish to cook
it again; tap anywhere else, or the ✕, to go back to the title screen. The
grid picks as many columns as make the dishes biggest, so it fits a computer,
a phone held sideways and a phone held upright. Stickers are kept by the
carnival's shared sticker book (`earnSticker` and `stickersFor` from
`src/carnival`), not by the game.

| Dish                             | Steps                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| **Cheesy Pizza**                 | Chop the pepperoni, spread the sauce, add the toppings, bake the pizza              |
| **Fluffy Pancakes**              | Crack the eggs, add flour and milk, mix the batter, flip the pancakes               |
| **Veggie Soup**                  | Chop the carrot, stir the soup, shake the salt                                      |
| **Creamy Dreamy Mac & Cheese**   | Grate the cheese, pour the milk, stir the cheese sauce, sprinkle the crumbs, bake   |
| **Cheesy Pepper Twirl**          | Grate the cheese, shake the pepper, add pasta water, mix the cheese cream, toss     |
| **Strawberry Smoothie**          | Chop the strawberry, chop the banana, add milk, blend                               |
| **Rainbow Fruit Salad**          | Chop the strawberry, chop the banana, mix the fruit, add blueberries, kiwi and mint |
| **Lulu's Pink Bisque**           | Chop the celery, stir the shells and veggies, add sunset splash, blend, add cream   |
| **Omurice with a Ketchup Heart** | Chop the onion, stir the rice, crack the eggs, flip the omelettes, draw ketchup     |
| **Taco Fiesta**                  | Chop the tomato, stir the taco meat, shake the spice, add the toppings              |
| **Spaghetti & Meatballs**        | Chop the tomato, stir the sauce, shake the salt, add meatballs and basil            |
| **Cheeseburger Tower**           | Chop the pickle, flip the patties, stack the burger                                 |
| **Ice Cream Sundae**             | Scoop the ice cream, stack the scoops, drizzle the chocolate, add the toppings      |
| **Sprinkle Cupcakes**            | Crack the eggs, add flour and sugar, mix, bake, add the toppings                    |
| **Cut-out Sugar Cookies**        | Crack the eggs, mix the dough, roll it out, cut the cookies, bake                   |
| **Sushi Rolls**                  | Chop the cucumber, spread the rice, add the fillings, roll the sushi, chop it       |

Lulu's Pink Bisque is made from the shells Lulu the lobster has grown out of
(real lobsters shed theirs), so no lobster is ever cooked.

Each step is one of these:

| Step            | What to do                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Chop**        | A knife glides along the food. Tap when it's over a dotted line. 4 or 5 chops.                                       |
| **Crack**       | An egg floats across. Tap when it's over the bowl. 3 eggs, each a little faster.                                     |
| **Pour**        | Hold to pour into the bowl, pot or blender, and let go when the meter reaches the star. One pour per ingredient.     |
| **Mix or stir** | Hold and draw circles in the bowl or pot. 3 turns in 15 seconds.                                                     |
| **Sauce**       | Hold and draw circles to spread it (sauce, ketchup, rice, chocolate). 3 turns in 15 seconds.                         |
| **Season**      | Hold to shake, and let go when the meter reaches the star. 3 shakes.                                                 |
| **Toppings**    | A topping floats across. Tap when it's over its sparkly spot. Each one a little faster.                              |
| **Bake**        | Hold to bake, and let go when the meter reaches the star and the food looks golden.                                  |
| **Flip**        | Tap when the heart is in the gold. Each one a little faster.                                                         |
| **Grate**       | Hold the cheese and rub it left and right across the grater. 8 strokes in 20 seconds.                                |
| **Toss**        | Hold the pan and swipe left and right. Tossing warms the thermometer, resting cools it. 10 tosses.                   |
| **Blend**       | Hold to whirr the blender, and let go when the smoothness meter reaches the star.                                    |
| **Scoop**       | Hold in the tub and the ball grows. Let go when the meter reaches the star. One scoop per flavour.                   |
| **Stack**       | Each layer swings over the plate. Tap to drop it; the closer to the middle, the better. It always sticks.            |
| **Roll**        | Hold and drag the rolling pin until the dough reaches the dotted line, or push the mat up to roll sushi. 20 seconds. |

Every round is different:

- The dotted lines on the carrot or pepperoni move, and there are 4 or 5.
- The stars for shakes, pours, blends and scoops sit somewhere new, between
  0.4 and 0.8 (the pasta water's between 0.25 and 0.45: just a little).
- The golden zone for each pancake moves, between 0.3 and 0.7.
- The pizza always gets the pepperoni you chopped, plus four of mushroom,
  pineapple, olive, pepper and tomato, each on its own random spot.

Nothing is ever wasted:

- An egg or a topping that floats past comes round again.
- Tapping when the egg is far from the bowl, a topping is far from its spot,
  or the heart is far from the gold, just shows "Not yet!" and lets you try
  again.
- Letting go of the oven while the food is still pale shows "Not yet!": it
  stays in, keeps its heat, and you can hold again. Food left in too long
  comes out by itself, a little crispy. The blender works the same way.
- A quick tap on a shaker, a pour or a scoop that barely does anything doesn't
  use it up: it shows "Not yet!" so you can hold it properly.
- A stacked layer always sticks, however far off: it just leans a little.
- Tossing too hot only makes a few cartoon cheese lumps and a "Not too hot!"
  hint. Grating and rolling never mind how fast you go.
- A chop always cuts the nearest dotted line, and scores something whenever
  the knife is close to it.

## Chef Bunny

Chef Bunny cooks along with you. She's always kind: a miss never gets a sad
face.

- **Idle**, she breathes, blinks every few seconds (now and then twice),
  flicks an ear, and watches your finger or mouse. Every so often she glances
  out at you instead.
- **A good action** (Perfect! or Great!) makes her hop and wave; a Good! gets
  a nod. She looks at where it happened.
- **A streak** of 3, 5, 10, 15... Perfect! in a row (see Combo bonus below)
  is a party: she jumps twice, stars circle her and burst around her, a little
  chime plays, and she says something like "Wow, three in a row!". Each
  milestone gets one party.
- **A miss** (Nice try!) or a **"Not yet!"** gets a soft encouraging face:
  raised brows, a big smile and a cheery paw, looking at where you tapped.
- **While you hold** to pour, shake, bake, blend, scoop, grate or toss, she
  leans in for a peek with an "ooh" face, and leans back when you let go.

Now and then she says a short line out loud, and it shows in her speech
bubble for 2 seconds in place of the hint: always at a streak party, and only
sometimes otherwise (1 in 5 for a cheer, about 1 in 8 for a nod, 1 in 3 for
encouragement or "Not yet!", 1 in 4 when you start holding). She picks from
small lists and never says the same line twice in a row. The step
instructions come first, so she only chats while the step is taking input
(never over the card), at least 4 seconds after the instruction started, at
least 8 seconds after her last line, and only if the voice isn't already
speaking; she never cuts anything off. With the sound off, the line still
shows in her bubble.

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
  and nothing from 0.4 off; letting go below 0.5 is "Not yet!". The blend
  scores the same way, against its star. Scoops score like pours. Stacked
  layers score in full within 20 px of the middle, and nothing from 130 px.
- **Circles** (stirring, sauce and batter) score 50 for finishing, plus up to
  50 for time left. If time runs out you get up to 50 for the turns you made.
  Circles count in either direction, but wiggling back and forth cancels out.
  **Grating** (8 strokes of 60 px, 20 seconds) and **rolling** (20 seconds)
  score the same way: 50 for finishing plus up to 50 for time left.
- **Tossing** scores the share of your tossing time the thermometer stayed
  cosy (below 0.75), so brisk tossing scores 100.
- **Every action gets a kind grade:** Perfect! (90% of its points or more),
  Great! (60% or more), Good! (anything) or Nice try! (nothing).
- **Combo bonus:** each Perfect! after the first in an unbroken streak adds 5
  points. Anything short of perfect breaks the streak. The streak carries from
  one step to the next. Circles, grating, rolling and tossing neither add to
  it nor break it.

The score in the corner counts up as you earn points. Your final score is the
step points plus the combo bonus, and it's saved to the carnival's score board
once, when the round ends (before decorating, which doesn't change it), along
with the dish's sticker. Dishes have three to five steps, so stars and Chef
Bunny's verdict go by your share of what the dish could score (100 a step,
before bonuses):

| Share of the most | Stars | Verdict                |
| ----------------- | ----- | ---------------------- |
| 83% and up        | 3     | You are a Master Chef! |
| 60% to 82%        | 2     | Super yummy!           |
| 50% to 59%        | 2     | Yummy!                 |
| 33% to 49%        | 1     | Yummy!                 |
| Under 33%         | 1     | Good cooking!          |

## How it's built

A round cooks a **dish**. A dish is a list of **steps** (chop, stir, bake...),
and each step says which **ingredients** it uses. Each of the three is a
folder with one file per thing, found automatically:

| Folder         | One file per | Default export | Found by               |
| -------------- | ------------ | -------------- | ---------------------- |
| `dishes/`      | dish         | `Dish`         | `dishes/index.ts`      |
| `steps/`       | kind of step | `Step`         | `steps/index.ts`       |
| `ingredients/` | ingredient   | `Ingredient`   | `ingredients/index.ts` |

The file name is the id: `steps/chop.ts` has the kind `'chop'`,
`ingredients/tomato-sauce.ts` has the id `'tomato-sauce'`. Nothing lists them
anywhere else, so new dishes, steps and ingredients are new files only, and
people adding different ones never edit the same file. The shared machinery
is in `kit/` (import it from `'../kit'`), and the drawing kit is `art.ts`.
Don't edit `kit/`, `art.ts`, `game.ts`, `render.ts` or `sound.ts` to add a
dish, step or ingredient: everything they offer is listed below.

`npm run check` tests every dish in `dishes/` automatically: that each
step's kind and ingredients exist and have the art the step needs, that the
dish can be cooked to the end, and that every step and the end card draw
without errors (on a pretend canvas that throws on NaN). So run it.

## Adding a dish

1. Add `dishes/<id>.ts` whose default export is a `Dish` (from `'../kit'`):

   ```ts
   interface Dish {
     id: string; // the file name
     name: string; // "Cheesy Pizza": the end card, and "You made Cheesy Pizza!"
     steps: RecipeStep[]; // in cooking order
     draw(g: G, time: number, state: KitchenState | null): void; // the end card
   }
   ```

   A recipe step is `{ kind, ...its options }`, type-checked against the step
   file. Every step can also take `title`, `hint` (two lines) and `icon` to
   override its card, such as a `title` of "Shake the pepper!" on a season
   step that shakes a pepper mill.

   | Kind     | Options                                                                                                                                     | Card it makes               |
   | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
   | `chop`   | `item` (chop)                                                                                                                               | Chop the `item`!            |
   | `crack`  | `item` (crack), `count?` = 3                                                                                                                | Crack the `item`s!          |
   | `pour`   | `pours`: ids (pour), one pour each, in order; `into?` (pourInto), the mixing bowl if left out; `inside?` (blended); `targets?`: [low, high] | Add flour and milk!         |
   | `mix`    | `vessel` (vessel), `contents` (stirred)                                                                                                     | Mix the `contents`!         |
   | `stir`   | `vessel` (vessel), `contents` (stirred)                                                                                                     | Stir the `contents`!        |
   | `season` | `shaker` (shaker), `food` (seasoned), `shakes?` = 3                                                                                         | Shake the `shaker`!         |
   | `sauce`  | `base` (sauceBase), `sauce` (spread)                                                                                                        | Spread the `sauce`!         |
   | `top`    | `base` (toppingBase), `always?`: ids, `extras`: ids (topping), `count`                                                                      | Add the toppings!           |
   | `bake`   | `item` (bake)                                                                                                                               | Bake the `item`!            |
   | `flip`   | `item` (flip), `count?` = 4                                                                                                                 | Flip the `item`s!           |
   | `grate`  | `item` (grate), `strokes?` = 8                                                                                                              | Grate the `item`!           |
   | `toss`   | `item` (tossed), `tosses?` = 10                                                                                                             | Toss the `item`!            |
   | `blend`  | `blender` (blender), `contents` (blended), `blends?` = 1                                                                                    | Blend the `contents`!       |
   | `scoop`  | `flavours`: ids (scoop), one scoop each                                                                                                     | Scoop the ice cream!        |
   | `stack`  | `base` (stackBase), `layers`: ids (stack), bottom first                                                                                     | Stack it up!                |
   | `roll`   | `how`: 'dough' or 'mat', `item` (rollOut or rollUp)                                                                                         | Roll out / Roll the `item`! |

   In brackets is the art role each ingredient must have (see "Adding an
   ingredient"). The ones there today:

   | Role          | Ingredients                                                                                                                                                                                                                                                                        |
   | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `chop`        | carrot, pepperoni, strawberry, banana, celery, tomato, onion, cucumber, sushi-roll, pickle                                                                                                                                                                                         |
   | `crack`       | egg                                                                                                                                                                                                                                                                                |
   | `pour`        | flour, milk, sugar, pasta-water, sunset-splash, cream                                                                                                                                                                                                                              |
   | `pourInto`    | pot, blender, pecorino                                                                                                                                                                                                                                                             |
   | `vessel`      | pot, mixing-bowl, rice-pan, fruit-bowl                                                                                                                                                                                                                                             |
   | `stirred`     | soup, batter, cupcake-batter, cookie-dough, cheese-sauce, cheese-cream, fruit-salad, lobster-shells, rice, taco-meat, spaghetti-sauce                                                                                                                                              |
   | `shaker`      | salt, black-pepper, taco-spice                                                                                                                                                                                                                                                     |
   | `seasoned`    | soup, pecorino, taco-meat, spaghetti-sauce                                                                                                                                                                                                                                         |
   | `sauceBase`   | pizza, omelette, nori, sundae-glass                                                                                                                                                                                                                                                |
   | `spread`      | tomato-sauce, ketchup, sushi-rice, chocolate-sauce                                                                                                                                                                                                                                 |
   | `toppingBase` | pizza, casserole, fruit-bowl, taco-shell, spaghetti-plate, cupcake, sundae-glass, cookie-dough, nori                                                                                                                                                                               |
   | `topping`     | pepperoni, mushroom, pineapple, olive, pepper, tomato, breadcrumbs, macaroni, blueberry, kiwi, mint, lettuce, shredded-cheese, avocado, meatball, basil, whipped-cream, sprinkles, cherry, candy-heart, star-cutter, heart-cutter, bunny-cutter, cucumber, carrot-stick, egg-strip |
   | `bake`        | pizza, casserole, cupcake-tray, cookies                                                                                                                                                                                                                                            |
   | `flip`        | pancake, omelette, patty                                                                                                                                                                                                                                                           |
   | `grate`       | cheddar, pecorino                                                                                                                                                                                                                                                                  |
   | `tossed`      | spaghetti                                                                                                                                                                                                                                                                          |
   | `blender`     | blender                                                                                                                                                                                                                                                                            |
   | `blended`     | smoothie, bisque                                                                                                                                                                                                                                                                   |
   | `scoop`       | strawberry-scoop, vanilla-scoop, mint-scoop                                                                                                                                                                                                                                        |
   | `stack`       | bun, patty, cheese-slice, pickle, lettuce-leaf, tomato-slice, strawberry-scoop, vanilla-scoop, mint-scoop                                                                                                                                                                          |
   | `stackBase`   | burger-plate, sundae-glass                                                                                                                                                                                                                                                         |
   | `rollOut`     | cookie-dough                                                                                                                                                                                                                                                                       |
   | `rollUp`      | sushi-roll                                                                                                                                                                                                                                                                         |

   Anything missing (cupcake batter, a taco shell, sprinkles) is a new
   ingredient file: see below. `dishes/pizza.ts` is a good one to copy.

2. **The end card.** `draw` draws the finished dish centred on the origin,
   about 240 wide and 160 tall, with the helpers in `art.ts` (`C`, `oval`,
   `fillStroke`, `face`, `vertical`...) and `drawSteam` from the kit. `time`
   is in seconds, for steam and wobbles. `state` is the round that made it,
   or null, so always draw something sensible without it: the recipe book
   draws every cooked dish small, with null. The same drawing shows while
   decorating, 1.3 times bigger, with the treats on top. To show what the
   round did, find its steps: `findStep<TopState>(state, 'top')?.state.spots`
   (with the step's exported state type). An ingredient's art can be reused,
   such as `drawPizza` from `ingredients/pizza.ts`, or `artOf(id, role)` from
   `'../ingredients'`.

3. That's it: the dish joins the random pick and gets a page in the recipe
   book.

**Working alongside others.** Each new dish, step or ingredient is its own
new file, so several can be added at once without touching the same file.
To keep it that way, don't edit this README or any shared file for one: say
in your pull request what this README should gain (a row in the dishes or
steps table, an ingredient for the roles table), and it's added once they're
all in.

## Adding an ingredient

Add `ingredients/<id>.ts` whose default export is an `Ingredient` (from
`'../kit'`): its basics, and art for each role it can play.

```ts
const sprinkles: Ingredient = {
  id: 'sprinkles', // the file name
  label: 'sprinkles', // in titles: "Chop the carrot!"
  plural: 'sprinkles', // optional; label + 's' if left out: "Crack the eggs!"
  icon: '🌈', // its emoji, for the card and the recipe along the top
  colors: [C.hotPink, C.sky], // crumbs, splashes and sparkles; at least one
  topping: { draw(g) { ... }, faceY: 0 }, // one object per role
};
export default sprinkles;
```

Each role's shape is declared in the step file that uses it, and type-checked
here. What each one draws (all in scene units, see "The scene" below):

| Role (declared in)             | What it draws                                                                                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chop` (`steps/chop.ts`)       | `draw(g, { bounds, cy, x0, x1 })`: lying along the board at height cy, x0 222 to x1 592, about 70 tall, in pieces between `bounds` ([x0, ...cuts, x1]).                                                                                                   |
| `crack` (`steps/crack.ts`)     | `draw(g, mood)`: whole, at the origin, ~52×60, with a face. `drawCracked(g, x, y)`: open in the bowl.                                                                                                                                                     |
| `pour` (`steps/pour.ts`)       | `drawContainer(g, pouring)`: its bag or jug at the origin, ~80×100, upright (the step tips it). `drawInBowl(g, amount)`: 0 to 1 of it in the mixing bowl. `stream`, `grains?`, `meter` colours, `color` (in a pot or blender), `liquid`.                  |
| `pourInto` (`steps/pour.ts`)   | `mouth`: where the stream lands in its opening (below y 200, `POUR_TOP`; the jug tips just above and left). `draw(g, { t, round, inside, poured })`: on the counter, side on, with `inside` (blended art and `smooth`) and each `{ art, amount }` poured. |
| `vessel` (`kit/circles.ts`)    | `draw(g, x, y, radius)`: a pot or bowl from above, empty. `inset`: where its contents start.                                                                                                                                                              |
| `stirred` (`kit/circles.ts`)   | `draw(g, { x, y, r, swirl, done, t })`: what's in the pot filling radius r; `done` 0 to 1 as the turns are made. `spoon`: the spoon's colour.                                                                                                             |
| `shaker` (`steps/season.ts`)   | `draw(g, left, shaking)`: upright at the origin, ~66×110, with a face; `left` is how full, 0 to 1. Its `colors[0]` is the grains'.                                                                                                                        |
| `seasoned` (`steps/season.ts`) | `draw(g, { x, t, specks, speck })`: the food on the counter centred on x, about 260 wide (y 240 to 420), with `specks` grains on top.                                                                                                                     |
| `spread` (`steps/sauce.ts`)    | Colours only: `light`, `main`, `dark` (baked past golden) and `swirl`.                                                                                                                                                                                    |
| `sauceBase` (`steps/sauce.ts`) | `draw(g, { x, y, r, cover, swirl, spread })`: the base from above on its board, up to r across, `cover` (0 to 1) of it spread with `spread`.                                                                                                              |
| `toppingBase` (`steps/top.ts`) | `area`: where it sits ({ x, y, rx, ry }; spots are picked inside). `draw(g, { toppings, t, round })`: at `area`, with these `{ id, x, y }` toppings on. `splash`: landing colours.                                                                        |
| `topping` (`steps/top.ts`)     | `draw(g)`: one piece at the origin, about 26 across. `faceY?`: where the face goes when it floats; `ring?`: a ring (the face goes on a sign).                                                                                                             |
| `bake` (`steps/bake.ts`)       | `draw(g, { x, y, level, baking, t, round })`: on the oven rack centred on (x, y), ~200×70 (the window is 270×150). `level`: 0 raw, `GOLDEN` (0.7) just right, 1 crispy.                                                                                   |
| `grate` (`steps/grate.ts`)     | `drawBlock(g, left, rubbing)`: the block, ~110×70, bottom-centre on the origin. `shreds`: [light, main] colours for the pile.                                                                                                                             |
| `tossed` (`steps/toss.ts`)     | `draw(g, { x, y, r, t, lumps, tossing })`: the food in the pan; `lumps` cartoon lumps when too hot.                                                                                                                                                       |
| `blender` (`steps/blend.ts`)   | `jar { bottom, top, height }`, `drawBase(g, { whirr, t, done })`, `drawJar(g, { whirr, t, open? })` (`open`: no lid).                                                                                                                                     |
| `blended` (`steps/blend.ts`)   | Colours only: `chunks[]`, `chunky`, `smooth`, `light`.                                                                                                                                                                                                    |
| `scoop` (`steps/scoop.ts`)     | `drawBall(g, r, mood)`: the scoop, radius r. `tub`, `top`, `meter` colours. `drawScoopBall` helps.                                                                                                                                                        |
| `stack` (`steps/stack.ts`)     | `size(top)`: `{ w, h }`. `draw(g, { top, mood, t })`: bottom-centre on the origin; `top` for the last layer.                                                                                                                                              |
| `stackBase` (`steps/stack.ts`) | `top`: height of the first layer. `draw(g, t)`, and `drawFront?(g, t)` for a glass rim in front.                                                                                                                                                          |
| `rollOut` (`steps/roll.ts`)    | The dough, drawn growing toward its dotted outline.                                                                                                                                                                                                       |
| `rollUp` (`steps/roll.ts`)     | The filling and roll, drawn rolling up the mat.                                                                                                                                                                                                           |
| `flip` (`steps/flip.ts`)       | `drawInPan(g, { up, flipping })`: at the origin, ~200×90 (the step squashes it to turn it). `drawOnPlate(g, x, y, share)`: one on the stack, 15 apart. `garnish?(g, x, y)`.                                                                               |

Things to know:

- **Colours.** Use the palette `C` from `art.ts`. For colours it doesn't have,
  declare them at the top of your file with `palette` from `art.ts`, as
  `ingredients/egg.ts` does:

  ```ts
  const K = palette({ shellEdge: '#f0dcc6' });
  ```

  That's the only place a colour code goes outside `art.ts`. (This game has
  its own pastel palette instead of the carnival theme, an exception to house
  rule 3 explained under "Notes" below; `palette` keeps those colours in
  one sanctioned place per file.) Pick soft,
  bright colours that sit with the rest. (`rgba(...)` strings for see-through
  white or ink, as the existing art uses, are fine.)

- **Drawing.** Outline shapes in ink with `fillStroke(g, fill, line)`, and give
  anything alive a `face(g, x, y, scale, mood)`. `art.ts` also has `circle`,
  `oval`, `rounded`, `starPath`, `heartPath`, `eggPath`, `vertical` and
  `horizontal` gradients, `blend`, `shadow` and `emoji`. Save and restore the
  context round transforms.
- **Other ingredients.** Art may look up another ingredient with
  `artOf(id, role)` from `'./index'` (the pizza draws its toppings that way), but only
  inside a function, never at the top of the file. Art that shows an earlier
  step's work gets the round (`round`) and finds the step with `findStep`.
- **Bases** (a pizza, a pot, a cupcake case) are ingredients too: anything a
  recipe names.

## Adding a step

Add `steps/<kind>.ts`. It declares its recipe options and any new art roles,
and its default export is a `Step`:

```ts
import { type G } from '../art';
import { artOf, ingredient } from '../ingredients';
import { type Step, type StepBasics } from '../kit';

export interface WhiskOptions extends StepBasics {
  kind: 'whisk';
  item: string; // an ingredient with `whisk` art
}
export interface WhiskArt {
  draw(g: G, frothy: number): void;
}

// Adds the options and the art role to the shared types, without editing them.
declare module '../kit/types' {
  interface StepKinds {
    whisk: WhiskOptions;
  }
  interface IngredientArt {
    whisk: WhiskArt;
  }
}

const whisk: Step<WhiskOptions, WhiskState, WhiskFx> = { kind: 'whisk', ... };
export default whisk;
```

The `Step` interface (`kit/types.ts`; `O` options, `S` state, `F` effect memory):

| Member                           | Does                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `kind`                           | The file name.                                                                                            |
| `uses(o)`                        | `[id, role][]`: the ingredients the options name and the role each needs. Tests check every dish with it. |
| `start(o, random)`               | This step's state, made when the round starts. Roll anything random with `random`, never `Math.random`.   |
| `title(o)`, `hint(o)`, `icon(o)` | The card's title ("Chop the carrot!"), Chef Bunny's two short lines, and an emoji. Read out loud, too.    |
| `progress(turn)`                 | `[total, done]`: the stars under the cooking.                                                             |
| `points?(turn)`                  | Points earned so far in this step, for the score in the corner.                                           |
| `press?(turn, x, y)`             | A tap or the start of a hold, at a scene point. **Return `false` for "Not yet!"**: nothing happened.      |
| `move?(turn, x, y)`              | The pointer moving while held.                                                                            |
| `release?(turn)`                 | Letting go. **Return `'not yet'` for "Not yet!"**, or the points it scored.                               |
| `update?(turn, dt)`              | Advances the step by `dt` seconds.                                                                        |
| `fx?()`                          | Fresh memory for effects (when the last chop was, an egg still falling).                                  |
| `observe?(view)`                 | Each frame, from the step's start to the end of the round: play sounds and throw sparkles on changes.     |
| `draw(view)`                     | Draws the step on the scene.                                                                              |

The game only calls `press`, `move`, `release` and `update` while the step
is being cooked and its card has gone. A `turn` is `{ round, options, state }`:
`round` is the whole `KitchenState` (scores, combo, every step). The rules must
not touch the canvas or the DOM, so they're tested without a browser.

**Scoring and finishing** (`kit/rules.ts`). Each step is worth up to 100
points (`STEP_POINTS`), split between its actions.

- `accuracy(distance, perfect, miss)`: 1 within `perfect`, falling to 0 at
  `miss`.
- `scoreAction(round, share, worth)`: scores one action that earned `share`
  (0 to 1) of `worth` points. It updates the combo (each Perfect! after the
  first in a row adds 5) and shows the popup (`gradeFor`: Perfect! at 90%,
  Great! at 60%, Good!, Nice try!). Returns the points.
- `showGrade(round, points)`: the popup for a whole step, leaving the combo
  alone (circles do this).
- `finishStep(round, points)`: ends the step with its points (kept 0 to 100)
  and moves on to the next card, or the end of the round. Call it once.
- `findStep(round, kind)`, `currentRun(round)`, `between`, `shuffle`,
  `bounce`, `listOf(['flour', 'milk'])` ("flour and milk").

**Ready-made mini-games.** Most steps are one of these, with their own
drawing. Each file says which step to copy.

| Pattern (file)             | Rules                                                                                                                    | Helpers                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Circles (`kit/circles.ts`) | Draw 3 circles round `CIRCLE` in 15s: 50 for finishing + up to 50 for time left; out of time, up to 50.                  | `circleRules` (spread into the Step: start, press, move, release, update, progress, fx, observe), `drawStirring`, `drawCircleControls`, `circleTurns` |
| Hold-meter (`kit/hold.ts`) | Hold to fill a meter, let go at the star; a full meter lets go by itself; too soon is "Not yet!".                        | `startHold(targets)`, `pressHold`, `releaseHold(turn, rules)`, `updateHold`, `holdProgress`, `drawMeter`, `POUR_RULES`, `TARGET_LOW`/`HIGH`, `GOLDEN` |
| Float-tap (`kit/float.ts`) | Things drift left to right; tap when one is over its target x; too far is "Not yet!"; past the end it comes round again. | `startFloat`, `tapFloat(turn, targetX, count, rules)`, `updateFloat`, `floatProgress`, `drawGlowLane`, `drawFallArrows`                               |
| Needle (`kit/needle.ts`)   | A heart swings along a gauge; tap in the gold; far off is "Not yet!".                                                    | `startNeedle`, `tapNeedle(turn, target, count, rules)`, `updateNeedle`, `drawGauge`                                                                   |

Their states (`CircleState`, `HoldState`, `FloatState`, `NeedleState`) can be
extended with more fields, as `CrackState extends FloatState` adds `speeds`.

**Drawing** (`view`, a `StepView`): the turn, plus `g` (the context, in scene
units), `t` (seconds, for bobbing and glowing), `dt`, `pointer` (x, y and
down, in scene units), `taking` (playing and the card has gone: show
prompts only then), `shape` ('page', 'wide' or 'tall'), `fx` (this step's
memory), `fxOf(run)` (another step's) and `effects`. Draw the step's own
equipment (the board and knife, the oven, the pan) in the step file, and ask
ingredients to draw themselves with `artOf(options.item, 'role')`. Scene
pieces shared between steps are in `kit/scene.ts`: `drawMixingBowl` (the
side view, at `BOWL`), `drawSteam`, `COUNTER_Y`.

**Sounds and sparkles** happen in `observe`, by comparing the state with what
`fx` remembers (see `steps/chop.ts`). The kitchen already plays the card's
chime, reads the title and hint out loud, and plays the grade's chime for
every popup. `view.effects` has:

- `sound`: `chop()`, `crack()`, `bloop()`, `shake()`, `whoosh()`, `pop()`,
  `sizzle()`, `ding()` and `boop()`. For a sound of your own, without
  editing `sound.ts`: `tone(freq, seconds, options)` (a note that can
  slide), `hiss(seconds, options)` (filtered noise) and
  `chime(notes, gap, volume)`, with notes from `NOTE` in `sound.ts`. See
  `ToneOptions` and `HissOptions` there.
- `celebrate(x, y)`: sparkles sized by the last popup's grade, and Chef Bunny
  reacts to the grade (see Chef Bunny above) and looks there. Call it where
  the action happened.
- `burst(x, y, count, shapes, colors, speed?, gravity?)`: particles; shapes
  are 'star', 'heart', 'dot', 'confetti', 'shell' and 'salt'. Use the
  ingredient's `colors`.
- `add(particle)`: one particle (grains falling from a shaker).
- `calm()`: Chef Bunny stops cheering (while an egg is still falling).

**Tests.** Add `steps/<kind>.test.ts` next to the step, as the others do.
`test-kit.ts` has `ready(dish, kind)` (a round on that step, its card gone),
`current<State>(state)`, `nextStep`, `seeded`, `circleTurnsOf` and
`pourPerfectly`; drive it with `press`, `move`, `release` and `tick` from
`game.ts`. The automatic tests only cook the dishes in `dishes/`, so until a
dish uses a new step, give it a dish of its own in its test file and run it
through the same checks:

```ts
const state = createState({ ...dishById('soup'), steps: [{ kind: 'whisk', item: 'egg' }] });
const memory = new Map();
playThrough(state, (dt) => drawRound(state, memory, dt)); // plays it, drawing every frame
expect(state.phase).toBe('over');
```

## The scene

Every step draws on an **800×500 scene** (scene units, (0, 0) top left).

- **The counter top** is the line at y 338 (`COUNTER_Y`); cabinets below.
  Things standing on the counter sit on it; the middle of the action is about
  (400, 275) (`CIRCLE`).
- **Keep clear** (on a computer and a phone held sideways): Chef Bunny and her
  speech bubble at the left (x 0 to 210, y 230 down); the sound and home
  buttons top left (to x 125, y 105); the recipe along the top middle (y 50
  to 110); the score and streak top right (x 630 to 785, y 55 to 145); the
  progress stars at the bottom middle (y 465 to 500). The window and shelf
  are just the wall: draw over them if you need to.
- **Phones held upright** ('tall') show only about x 100 to 700, with the
  recipe at the top of the scene (y 0 to 45, the streak at y 60 to 90) and
  Chef Bunny below it, so keep what matters between x 110 and 690 and below
  y 110. `view.shape` says which; `steps/flip.ts` moves its plate for it.
- **On top of the step** come Chef Bunny, the HUD, the popup ("Perfect!",
  centred at (400, 168)), "Not yet!" where the tap was, and while the card
  shows, the card itself.
- Existing places: the meter at x 566 to 634, y 120 to 390; the circles'
  clock at (640, 140); the needle's gauge at y 381 to 429; floating things at
  y 165 to 175, coming from x -40 to 840.

## Files

- `game.ts`: the round (`createState`, `pickDish`, `press`, `move`,
  `release`, `tick`, `liveScore`, `totalScore`, `ratingFor`, `starsFor`),
  passing input to the step being cooked, and the `carnivalKitchen` entry,
  the default export the midway finds.
- `kit/`: what everything shares. `types.ts` (Dish, Step, Ingredient,
  KitchenState, StepView...), `rules.ts` (scoring and finishing),
  `circles.ts`, `hold.ts`, `float.ts`, `needle.ts` (the mini-games) and
  `scene.ts` (shared scene pieces). Import it from `'../kit'`.
- `steps/`: one file per kind of step (its rules, drawing, card and sounds),
  a test next to each, and `index.ts`, which finds them.
- `ingredients/`: one file per ingredient (its art), and `index.ts`, which
  finds them (`ingredient`, `artOf`).
- `dishes/`: one file per dish (its recipe and end card), and `index.ts`.
- `chef.ts`: Chef Bunny's reactions, lines and their cooldowns, and her idle
  blinks, ear flicks and glances: plain functions, tested in `chef.test.ts`.
- `bunny.ts`: drawing Chef Bunny in a pose (mood, blink, ear, gaze, lean).
- `render.ts`: the kitchen, Chef Bunny's place and what she sees, the HUD, the card and popups,
  particles, the title, decorating, end and recipe book screens. It asks the step being cooked to draw
  itself, and every started step to `observe`.
- `art.ts`: the drawing kit: palette, shapes, faces, text.
- `sound.ts`: sound effects made with Web Audio (no files to load) and the
  voice that reads each step out loud, plus `chatter` for Chef Bunny's own
  lines, which only speaks when the voice is free.
- `decorate.ts`: decorating the finished dish: the treats, where the dish,
  tray and **Done!** go for each layout, and plain functions for pressing,
  dragging and letting go. `decorate.test.ts` tests it.
- `book.ts`: the recipe book's count, grid and hit testing, and the title
  screen's book button. `book.test.ts` tests it.
- `layout.ts`: how the canvas fits the screen (page, wide or tall), and
  where the 800×500 cooking scene sits on it. The game logic only ever sees
  scene coordinates. `layout.test.ts` tests it.
- `test-kit.ts`: helpers for tests. `game.test.ts` tests rounds and every
  dish; each folder has tests for its registry.

## Notes

This game uses its own pastel palette and a rounded font instead of the
carnival theme (house rule 3), because it's made for a young player and needed
a softer, brighter look.
