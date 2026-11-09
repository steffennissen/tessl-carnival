# Carnival Kitchen

Cook with Chef Bunny. Tap **Tap to cook!** and the kitchen picks a dish at
random from 16 dishes, from pizza and pancakes to sushi, burgers and an ice
cream sundae (and a surprise 17th, once all 16 are in the recipe book).
Coins buy Chef Bunny hats and aprons and decorations for the kitchen in the
shop, and chef ranks open new kitchens. Each dish is a whole
recipe, made step by step, and every round is a little different. It's made
for young cooks: everything is slow and forgiving, every grade is kind, and a
voice reads each step out loud for cooks who can't read yet.

## Phones and tablets

On a phone or tablet (a device whose main input is a finger, or an iPad,
even with a keyboard or trackpad attached), or in a window narrower than
600 px, the kitchen fills the whole screen, with a 🏠 button in the top left
corner, well apart from the speaker. A tap on 🏠 doesn't leave straight away:
a little card asks "Leave the kitchen?" (and says it), and only ✓ goes back to
the midway; ✕, or a tap anywhere else, stays, so a stray tap never ends a
round. The round waits while the card is up. On a phone or tablet the first tap also
asks the browser for real full screen, hiding its bars where it allows that
(an iPad or an Android phone; an iPhone keeps its bars). If she leaves full
screen, it isn't asked for again until the game starts again, and leaving the
game leaves full screen.
Held upright, it turns tall: the score and recipe sit on top, the cooking in
the middle and Chef Bunny below with bigger hint text. Held sideways, the
kitchen stretches to fill the screen around the cooking. Turning the device
switches between the two. On a computer the game stays in the page as before.

## How to play

Tap **Tap to cook!** on the title screen. There's nothing to choose: the dish
waits under a lid with a "?" on it, and the kitchen picks it when you tap.
The speaker button in the corner turns sound and the voice off and on. The
gear in the bottom corner, "Hold for grown-ups", opens the grown-ups'
settings when it's held for 1.5 seconds (see "Learning" below). The title
screen also has **🛍️ Shop**, with her coins on it (see "The shop"), and her
chef rank's badge (see "Chef ranks and kitchens"): tap the badge and Chef
Bunny says her rank and what comes next.

A round goes like this:

1. **Title screen.** Tap **Tap to cook!** for a surprise dish, **📖 Recipes**
   to open the recipe book, or **🛍️ Shop**. If her chef rank has gone up,
   the rank ceremony comes first.
2. **The dish spinner.** A carnival slot machine with a reel of dish pictures
   spins fast, ticks slower and slower, and lands with a bounce and sparkles on
   the dish that was picked, with its big picture and name, while Chef Bunny
   says "Let's make ...!". It takes about 4 seconds; once it has landed, a tap
   skips the rest of the wait, and taps before that do nothing. A dish picked
   from the recipe book skips the spinner. Then a customer walks up to the
   stand and orders it (see "The food stand").
3. **The steps**, one card at a time. A ribbon on the first card says what
   we're making, a card names each step with its number and how many
   minutes it takes ("Step 1 of 4 · ⏰ 5 min"), a voice reads it out, and Chef
   Bunny's speech bubble keeps the hint on screen. With learning on, one
   learning moment is woven in, such as an order ticket to read first and a
   counting question after the toppings (see "Learning").
4. **Decorate your dish!** The finished dish sits on a cloth with a tray of six
   treats: sprinkles, a cherry, a heart, a star, a flower and a little flag.
   Drag a treat onto the dish, or tap a treat and then tap the dish to add as
   many as you like. Drag one on the dish to move it, or back to the tray to
   take it off. A treat let go anywhere above the tray lands on the dish, so
   nothing can go wrong, and decorating scores nothing. On a phone the treats
   and **Done!** are at least 60 CSS pixels (held sideways **Done!** waits at
   the cloth's top right). Tap **Done!**, or leave
   it 20 seconds without a touch, to move on. A tap in the first moment does
   nothing, so a last excited tap from the final step doesn't skip it. Up to 30
   treats fit on a dish; another one replaces the oldest. Decorations start
   fresh every round.
5. **The end card**: the dish with its decorations, the stars, Chef Bunny's
   verdict, when you started and finished ("You started at 4:00 and finished
   at 4:35!", on two little clocks, and said out loud) and the points. A
   learning moment answered on her own adds a **Smart Chef** badge. If the dish earned its first sticker, or more stars
   than its sticker had, a badge says **New sticker!** or **Sticker
   upgraded!** after the stars, and Chef Bunny says so too. After a short
   pause, tap **Cook again!** for another dish, never the same one twice in a
   row, picked on the spinner again (after the rank ceremony, if the round
   made her rank go up).

While you cook, a badge shows the dish you're making: its finished picture
and its name. On the page it sits in the strip above the recipe; on a phone
held sideways it stands in the kitchen to the left of the cooking (or above
it, if there's no room at the side); held upright it hangs on the wall
between the score and the recipe, big when there's room and small between
the buttons and the score when there isn't. Tap it and Chef Bunny says
"We're making ...!": a tap on the badge never counts as a cooking tap.

### The recipe book

Every finished round earns its dish's sticker at the round's stars (1 to 3).
A sticker only ever keeps its best stars. The recipe book, from the title
screen's **📖 Recipes** button, shows all the dishes in a grid with a count
such as "7 of 16 dishes · 9 more dishes to unlock a surprise!": each cooked
dish with its picture, name and best stars, and the rest under a little lid
with a "?". The last page is a wrapped present (see "The surprise: a
Birthday Cake"); a tap on it says how many dishes are left. A dish whose learning moment was answered on her
own also has a purple Smart Chef star (🎓) in its corner. Tap a cooked dish to cook
it again; tap anywhere else, or the ✕, to go back to the title screen. The
grid picks as many columns as make the dishes biggest, so it fits a computer,
a phone held sideways and a phone held upright. Stickers are kept by the
carnival's shared sticker book (`earnSticker` and `stickersFor` from
`src/carnival`), not by the game.

| Dish                         | Steps                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| **Pizza**                    | Chop the pepperoni, spread the sauce, add the toppings, bake the pizza              |
| **Pancakes**                 | Crack the eggs, add flour and milk, mix the batter, flip the pancakes               |
| **Vegetable Soup**           | Chop the carrot, stir the soup, shake the salt                                      |
| **Mac and Cheese**           | Grate the cheese, pour the milk, stir the cheese sauce, sprinkle the crumbs, bake   |
| **Cacio e Pepe**             | Grate the cheese, shake the pepper, add pasta water, mix the cheese cream, toss     |
| **Strawberry Smoothie**      | Chop the strawberry, chop the banana, add milk, blend                               |
| **Fruit Salad**              | Chop the strawberry, chop the banana, mix the fruit, add blueberries, kiwi and mint |
| **Lobster Bisque**           | Chop the celery, stir the shells and veggies, add seafood stock, blend, add cream   |
| **Omurice**                  | Chop the onion, stir the rice, crack the eggs, flip the omelettes, draw ketchup     |
| **Tacos**                    | Chop the tomato, stir the taco meat, shake the spice, add the toppings              |
| **Spaghetti & Meatballs**    | Chop the tomato, stir the sauce, shake the salt, add meatballs and basil            |
| **Cheeseburger**             | Chop the pickle, flip the patties, stack the burger                                 |
| **Ice Cream Sundae**         | Scoop the ice cream, stack the scoops, drizzle the chocolate, add the toppings      |
| **Cupcakes**                 | Crack the eggs, add flour and sugar, mix, bake, add the toppings                    |
| **Sugar Cookies**            | Crack the eggs, mix the dough, roll it out, cut the cookies, bake                   |
| **Sushi Rolls**              | Chop the cucumber, spread the rice, add the fillings, roll the sushi, chop it       |
| **Birthday Cake** (surprise) | Crack the eggs, add flour and sugar, mix, bake the cake, add candles and toppings   |

Lobster Bisque is made from the shells Lulu the lobster has grown out of
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
- The stars for shakes, blends and scoops sit somewhere new, between 0.4
  and 0.8. A pour's star sits on its real amount's line on the measuring
  cup (see "Learning"), which is always between 0.4 and 0.8 too.
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

## The food stand

Every round is cooked for a customer at Chef Bunny's food stand
(`customers.ts` for who comes and what they pay, `stand.ts` for their
drawing and places, and the scenes in `render.ts`).

- **A customer walks up.** Once the dish spinner lands (or a dish is picked
  from the recipe book, the Birthday Cake too once it's unlocked), a little bell rings and a customer walks up to the
  counter and asks for it, out loud and in a speech bubble: "Hi! I'm Benny
  Bear. Can I have Pizza, please?", with the dish in a thought cloud and
  their name tag and a line about them ("I love honey on everything!"). A tap
  after a moment moves on; otherwise cooking starts after 5 seconds. With
  "Read it myself" on, the order isn't read out: it waits for a tap, like
  the step cards, and a 🔊 beside the customer (at least 60 CSS pixels on a
  phone) reads it. The
  customers are Benny Bear, Fifi Fox, Kiki Kitten, Pip Penguin, Freddie Frog,
  Ellie Elephant, Polly Pig, Ollie Owl and Lulu the Lobster, never the same
  one twice in a row.
- **They watch her cook,** small and out of the way: in the kitchen window
  above Chef Bunny on a computer, beside the scene under the kitchen clock on
  a wide phone held sideways, and below Chef Bunny (or beside her, under her
  speech bubble) held upright. A Perfect! or Great! makes them hop for joy.
  An order ticket is theirs ("🧾 Benny Bear's order"), and "the customer
  pays" is them paying ("Benny pays 45¢. Tap the coins to pay!").
- **Serving.** After decorating, the dish slides over to them and they're
  delighted, more with more stars, and never disappointed: 1 star is "Yummy,
  thank you!", 2 "Super yummy! Thank you!", 3 "Wow! The best Pizza ever!".
  Then they pay: the coins fly one by one into the coin jar, each with a
  clink, and a number above the jar counts them up. A customer waves and
  walks off, and the end card shows the coins earned and how many are in the
  jar ("🪙 +25 · Jar: 140"), and Chef Bunny says "You earned 25 coins!". A
  tap while serving skips to the end card.
- **The coins** (`roundCoins`): 10 for each star, 5 more for a perfect
  streak (3 Perfect! in a row at some point, Chef Bunny's party) and 5 for a
  Smart Chef round, so 10 to 40, all in tens and fives. When the customer
  paid, the coins she counted into the tray are the payment instead of the
  stars' tens (45¢ is 45 coins, quarters and dimes flying into the jar), plus
  the tip and the Smart Chef 5. They're earned once per round, when the round
  ends, with the carnival's shared wallet (`earnCoins` in `src/carnival`),
  and the jar's total is also on the HUD while she cooks, small, along the
  top near the buttons (under the score on a phone held upright).

### Bosses

About one visit in six (`BOSS_CHANCE`), a boss comes instead: never in the
first two visits of a session, never twice in a row, and never for a dish
from the recipe book. The bosses are the Carnival King (a lion with a big
mane, round ears, a muzzle, a crown and a cape), Sparky the Dragon and Lulu's Grandma (with glasses and a lace
cap).

- **The entrance** replaces the dish spinner: the kitchen goes dark, a
  spotlight sweeps about to a drumroll, then the boss pops up in it with a
  fanfare and confetti, and says their order out loud: three different
  dishes, shown numbered on an order card. They're picked from the dishes a
  round can pick (`playableDishes`), so the Birthday Cake only once it's
  unlocked. Every guest is drawn wholly on
  the screen in every layout, wings and claws too (`guestReach`,
  `onStageX`).
- **Three dishes in a row,** each a whole round with its stars, sticker,
  learning moment and coins, served to the boss (who stays). Between them a
  card says "Dish 2 of 3", ticks off the dishes served and lights up the
  next; the end card's button says "Next dish!", and after the last one
  "Trophy time!".
- **The trophy ceremony.** Whatever the stars (a boss can't be failed), a
  drumroll, then a golden trophy with the boss's badge rises in the
  spotlight with a fanfare, and a bonus of 50 coins (`TROPHY_COINS`) drops
  into the jar as five tens. The trophy is the sticker `trophy:<boss id>`
  (`trophy:king`, `trophy:dragon`, `trophy:grandma`), its level how many
  times it was won; it and the bonus are given once per boss visit
  (`claimTrophy`). A trophy is worth 3 chef points, so it can bring a new
  rank: its ceremony comes after the trophy, before the next visit, and
  never in the middle of a boss's three dishes. A tap then starts the next
  visit.
- **The trophy shelf** in the recipe book shows each boss's golden trophy
  ("×2" when won more than once), or a grey "?" for one not won yet: at the
  top left of the page beside the title, or along the bottom on a phone held
  upright, clear of the dishes and the wrapped surprise. Tapping a trophy
  has Chef Bunny say whose it is.

## The shop

The title screen's **🛍️ Shop** button (with her coins on a little badge)
opens one page that is both the shop and Chef Bunny's wardrobe. Coins come
from the carnival's shared wallet (`coinsFor` and `spendCoins` from
`src/carnival`), which the kitchen's customers fill. At the top are her coins
and a ✕; at the side Chef Bunny tries on whatever was tapped last, with its
name and what it needs ("40 coins: tap to buy!", "Save up 12 more coins!",
"Become a Sous Chef!", "You have it on!"); then four tabs (Hats, Aprons,
Kitchen, Places) and the things on them.

- **Something she has** is put on (or put up) with a tap, and says "✓ On".
  One hat, one apron, one wallpaper, one set of flags and one kitchen at a
  time; the goldfish and the fairy lights come off again with a second tap.
- **Something she can buy** asks first: a card with its picture, "Buy the
  Crown?", its price, ✓ and ✕. ✓ spends the coins, coins fly to it, it
  sparkles with a "Yay!", Chef Bunny jumps for joy and says "You bought the
  Crown!", and she's wearing it. ✕, or a tap anywhere else, keeps the coins.
- **Something she can't afford yet** shows its price faded, and a tap on it
  has Chef Bunny say kindly how many more coins to save up.
- **Something a chef rank gives** shows 🔒 and the rank, and a tap says which
  rank to reach.

What she owns is kept as stickers (`own:<item>`, with `earnSticker`), and
what she wears as preferences (`wear-hat`, `wear-apron`, `wear-wallpaper`,
`wear-bunting`, `wear-shelf`, `wear-lights` and `wear-kitchen`, with
`savePreference`), never in local storage directly. Chef Bunny wears her
outfit everywhere (title, cooking, decorating, the end card), and the
kitchen shows its decorations behind the cooking in every layout.

| Tab     | Things, and their price in coins                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hats    | Chef Hat (free), Party Hat 15, Big Bow 20, Flower Crown 30, Pirate Hat 45, Crown 60, Wizard Hat 80, Space Helmet 120; the Star, Ribbon, Golden and Master Chef Hats from ranks |
| Aprons  | Pink (free), Mint 15, Sky 15, Polka Dot 25, Strawberry 35, Rainbow 50, Starry 65                                                                                               |
| Kitchen | Wallpaper: Hearts (free), Stars 20, Stripes 25, Dots 25, Flowers 30. Flags: Rainbow (free), Berry 15, Ocean 15, Golden 30. Fairy Lights 40. A Goldfish Bowl on the sill, 50    |
| Places  | The kitchens: Carnival Tent (free), Candy Castle, Space Station, Under the Sea and Golden Palace, one for each rank                                                            |

On a phone the tabs, the things, ✓, ✕ and the shop button are all at least 60
CSS pixels. `wardrobe.ts` has the catalog, buying (`buy`), owning (`owns`)
and wearing (`equip`, `loadOutfit`, `saveOutfit`); `shop.ts` has the page's
places and what a tap does (`pressShop`); `outfit-art.ts` draws the hats and
aprons. They're plain functions, tested in `shop.test.ts`.

## Chef ranks and kitchens

Her chef rank comes from **chef points**, worked out from stickers she already
has (`chefPoints` in `ranks.ts`): each star on a dish's sticker is a point,
each Smart Chef mark (`smart:<dish>`) 2, and each trophy (`trophy:<boss>`) 3.

| Rank        | Chef points | What it gives                  |
| ----------- | ----------- | ------------------------------ |
| Kid Chef    | 0           | The Carnival Tent kitchen      |
| Junior Chef | 5           | Star Chef Hat, Candy Castle    |
| Sous Chef   | 14          | Ribbon Chef Hat, Space Station |
| Head Chef   | 26          | Golden Chef Hat, Under the Sea |
| Master Chef | 42          | Master Chef Hat, Golden Palace |

So Junior Chef comes in a first sitting, Sous Chef after about six dishes,
and Master Chef once most of the book is cooked well with a few Smart Chef
marks: days, not weeks. The title screen's badge shows the rank and a bar to
the next one.

**The ceremony.** When her rank has gone up, the next **Tap to cook!** or
**Cook again!** starts a ceremony before the round: a drumroll, then the rank
on a ribbon ("Sous Chef!"), Chef Bunny bowing as her new hat drops onto her
head, confetti, and "You're a Sous Chef now!" out loud, then a card with the
new kitchen. Once it's all shown (about 4.5 seconds), a tap goes on to cook.
The new hat goes on and the new kitchen goes up straight away; the shop
changes them back. The last rank celebrated is saved (the `rank-celebrated`
preference), so each rank's ceremony happens once, and jumping two ranks at
once is one ceremony, for the higher.

**Kitchens.** Each is drawn around the scene in every layout (`kitchens.ts`):
its wall, its window and the view out of it, the counter, the cabinets and
their knobs, and a touch of its own. Walls stay light, so the steps drawn on
top stay easy to read; the steps' art doesn't change.

| Kitchen       | Window                            | Its touch                                    |
| ------------- | --------------------------------- | -------------------------------------------- |
| Carnival Tent | A sunny sky                       | The pink kitchen, with heart knobs           |
| Candy Castle  | Candy hills and a gumdrop castle  | Icing dripping over the counter, candy knobs |
| Space Station | A porthole on a ringed planet     | Panels and rivets, a glowing stripe, stars   |
| Under the Sea | A porthole with Lulu the lobster  | Bubbles, seaweed, a sandy counter, shells    |
| Golden Palace | An arched window on golden towers | Gold rails, a marble counter, crown knobs    |

**The surprise: a Birthday Cake.** `dishes/birthday-cake.ts` is a `locked`
dish: it isn't in the random pick or on the spinner's reel, and its page in
the recipe book is a wrapped present, until every other dish has its sticker
(`playableDishes` and `surpriseHint` in `ranks.ts`). Then the present bounces
("Tap me!"), a tap on it cooks the cake, and it joins the random pick. It
uses the usual steps, with a cake that rises in a round tin
(`ingredients/birthday-cake.ts`) and candles to put on
(`ingredients/candle.ts`).

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

## Kitchen surprises

Now and then something silly happens in the middle of cooking: a short
surprise that's fun, never a fail. At most one comes in a round, in about 1
round in 3 (`CHAOS_CHANCE`), and never in the first round of a visit. It
waits for a cooking step after the first one, 2 to 3.5 seconds after that
step's card has gone (so its instruction has been read out), and starts once
she isn't holding anything. Learning moments, the dish spinner, decorating
and the step cards never get one. If its step ends first, it tries the next
cooking step it fits. The grown-ups' **Surprises** setting turns them off.

| Surprise          | What happens                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Flashlight**    | The lights flicker and go dim, and a soft circle of light follows her finger (or the mouse) while she keeps cooking. After 8 seconds, or when the step ends, the lights come back: "Phew!". |
| **Counter cat**   | A cat hops onto the counter and sits on the work. Tap her 3 times to pet her: hearts and a purr each time, then she hops off. Taps anywhere else do nothing.                                |
| **Bubbling over** | Only when stirring, mixing, pouring or blending: foam spills over the rim and 8 big bubbles float up. Tap each one to pop it (a tap a little outside a bubble counts).                      |
| **Sprinkle snow** | It snows sprinkles! A bowl follows her finger (or the mouse) along the counter: catch 10. Missed ones just melt away, and after 20 seconds the last ones jump in by themselves.             |
| **Wobbly table**  | Everything on the counter wobbles. Tap the wobbly table leg twice to push a wedge under it, and it settles.                                                                                 |

Nothing is ever lost:

- While the cat, the bubbles, the sprinkles or the wobble is on, the step
  waits: every tap goes to the surprise, and no timer runs and no meter
  fills (the stirring clock stops, a floating egg holds still). The step's
  own state, the score and the streak aren't touched.
- The flashlight doesn't stop anything: she cooks on in its light.
- Finishing a surprise adds 5 points (`CHAOS_BONUS`), once, with a "+5"
  and sparkles. A flashlight that ends with the last step shows its "+5"
  on the decorate screen.

Chef Bunny reacts: raised brows and a big smile, and "Oh no, the lights! Use your
flashlight!" as it starts, her bubble saying what to do while it's on ("A
kitty! Tap her / 3 more times!"), and a cheer at the end ("Bye bye,
kitty!"). Her lines are said like her other chatter: only when the voice is
free (she waits up to 3 seconds for it), so she never talks over an
instruction.

**Adding a surprise** is one new file, `chaos/<id>.ts`, whose default export
is a `Chaos` (`chaos/rules.ts`); `chaos/index.ts` finds it. It says which
steps it `fits`, whether it `interrupts` the cooking, its `start`, `update`,
`press` and `move` rules, when it's `done`, Chef Bunny's `says` and
`bubble` lines, how to `draw` itself over the cooking (and `observe` for its
sounds), and `solve` for tests. `tilt` can rock the cooking itself, as the
wobbly table does. Everything it rolls comes from the `random` its `start`
gets, seeded by the round, so tests repeat. `chaos/chaos.test.ts` checks the
planning, the pausing, each surprise from start to end, and draws each one
in all three layouts.

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

- **Learning moments never cost points.** Learning steps (a ticket, a
  question) aren't part of the cooking score or the stars: the stars go by
  the cooking steps only. A learning question answered right on her own
  (first or second try) adds a 10 point bonus (`SMART_BONUS`); after Chef
  Bunny has shown the answer, it adds nothing, and takes nothing away.

The score in the corner counts up as you earn points. Your final score is the
step points plus the combo bonus, and it's saved to the carnival's score board
once, when the round ends (before decorating, which doesn't change it), along
with the dish's sticker. Dishes have three to five cooking steps, so stars and Chef
Bunny's verdict go by your share of what the dish could score (100 a cooking
step, before bonuses):

| Share of the most | Stars | Verdict                |
| ----------------- | ----- | ---------------------- |
| 83% and up        | 3     | You are a Master Chef! |
| 60% to 82%        | 2     | Super yummy!           |
| 50% to 59%        | 2     | Yummy!                 |
| 33% to 49%        | 1     | Yummy!                 |
| Under 33%         | 1     | Good cooking!          |

## Learning

Carnival Kitchen is made for a young cook in 2nd grade, so it weaves a little
math and reading into the cooking, and keeps real time and real amounts on
screen all the time.

### Always there: the kitchen clock and real amounts

- **The kitchen clock.** An analog clock with the numbers 1 to 12, a tick for
  every minute, a short hour hand and a long minute hand hangs in the kitchen
  in every layout: on the wall at the right on a computer, beside the cooking
  on a wide screen (as big as fits, so its numbers are about 11 CSS pixels on
  a phone held sideways), and big in the drawers below Chef Bunny on a phone
  held upright. Each round starts at a real afternoon time (2:00 to 5:30; on the
  hour or half hour at Level 1, any 5 minutes at Level 2) and each step takes
  real minutes. When a step is done, the minute hand sweeps on to the new
  time with a tick every 5 minutes, and the clock grows a little while it
  moves, so she can watch the time go by. The end card says when she started
  and finished. It's always on, whatever the settings: it only shows things
  as they are, it asks nothing.
- **Minutes per step.** Every recipe step can say `minutes`; left out, it's
  the kind's usual (`DEFAULT_MINUTES` in `kit/clock.ts`): chop 5, crack 2,
  pour 2, mix 5, stir 10, season 1, sauce 3, top 5, bake 15, flip 5, grate 3,
  toss 5, blend 2, scoop 3, stack 3, roll 5. Learning steps take none. Give a
  dish its real times where a real recipe has them, such as
  `{ kind: 'bake', item: 'cookies', minutes: 10 }`.
- **Real amounts.** The meter shows a real amount under it: the pour's ("1
  cup", "½ cup"), the shake's ("¼ teaspoon"), and the bake's time ("15
  minutes"). An ingredient says its usual amount for one pour or shake with
  `amount`; a recipe can say its own with `amounts` on a pour (one per pour)
  or `amount` on a season step. Use cups for flour, milk and water,
  tablespoons and teaspoons for small things, and the fractions ¼, ½ and ¾.
  Every dish's pours and shakes say their real amounts (pancakes 1½ cups of
  flour and 1 cup of milk, mac & cheese 2 cups of milk...).
- **The measuring cup.** A pour with a real amount fills a see-through
  measuring cup instead of a plain meter, with a line and a number for each
  ¼ cup (a ½ or 1 cup measure) or each ½ cup (a 2 or 3 cup jug), and the
  star exactly on the recipe's amount: 1 cup fills a 2 cup jug to the 1
  line. `measureScale` in `kit/measure.ts` picks the smallest cup the amount
  fills no more than 0.8 of the way, so the star always sits between 0.4 and
  0.8, like other meters, and scoring is unchanged. What's in the cup is
  coloured from its surface down, with a dark line along the top, in its
  ingredient's `meter` colours, which must stand out from the white glass
  (milk is soft blue, flour tan, sugar pink; `kit/cup-fill.test.ts` checks
  every pour's contrast), so even ¼ cup is plain to see. On a phone the
  cup's numbers are bigger. Chef Bunny's bubble says
  each pour's amount ("1½ cups of flour,"), and says the next one out loud.
- **Baking time.** A bake step's hint says its minutes ("Bake for 10
  minutes!"), and the oven's meter has a numbered line every 5 minutes with
  the star on the recipe's time: cookies 10, pizza 15, cupcakes 20, mac &
  cheese 25.
- **Fractions out loud.** The voice says "1½ cups" as "one and a half
  cups" (`speakable` in `kit/words.ts`), keeping each fraction one word so
  the words still light up in step.

### The grown-ups' settings

Hold the gear on the title screen for 1.5 seconds (a ring fills round it)
and a page for grown-ups opens. On a phone the gear is 60 CSS pixels across,
easy to find, but it still has to be held. A quick tap does nothing, so a young cook
doesn't wander in.

| Setting        | Choices          | Default | What it does                                                                                                  |
| -------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| Learning       | On, Off          | On      | One learning moment (math or reading) woven into each round. Off: just cooking.                               |
| Level          | Level 1, Level 2 | Level 1 | Level 1 is early 2nd grade, Level 2 late 2nd grade: bigger numbers, harder words.                             |
| Read it myself | On, Off          | Off     | Cards and questions show their words and wait; the voice only reads when 🔊 is tapped, lighting up each word. |
| Surprises      | On, Off          | On      | Now and then a short, silly kitchen surprise (see "Kitchen surprises"). Off: none.                            |

They're saved with the carnival's shared preferences (`savePreference`), so
they're remembered between visits. `grownups.ts` has the page's layout and
hit testing as plain functions, tested in `grownups.test.ts`.

**Read it myself.** Step cards grow to show the hint too and stay up until
she taps (a tap on the card after a moment moves on), however long she takes
to read, with a 🔊 button: tap it and the voice reads the card, each word
lighting up as it's said, and the card closes by itself a moment
(`CARD_HOLD`, 1 second) after the reading ends, unless she taps first. Questions and tickets show their words with a
🔊 too, and nothing reads itself. With it off, everything is read out as
before, and questions light up their words as they're read too. Chef Bunny's
cheers and the end card still speak.

### A learning moment

With learning on, each round gets at most one learning moment: one of the
activities that fit the dish, picked at random, but never the same one as
last round when another one fits. A dish nothing fits is just cooked.
Nothing can be failed:

- A wrong answer greys out, Chef Bunny gives an encouraging face and a hint
  ("Point and count them one by one!"), and she tries again.
- After two wrong tries Chef Bunny shows the answer: it glows, she says how
  to get it ("Let's count: one, two, three. Three!"), and a tap on it carries
  on.
- A right answer gets sparkles, a cheer and "Yes! +10". Chef Bunny says "You
  are a Smart Chef!" only while the round is still earning its star (this
  answer and every one before it right on her own; `cheerLines` in
  `kit/learn.ts`), otherwise "Yes! You got it!".
- A round whose every question was answered on her own earns the dish's
  **Smart Chef** star (the sticker `smart:<dish id>`, kept by `earnSticker`),
  shown on the end card and in the recipe book.
- A learning step's card says "🎓 Learning time!" under its title.
- Where the right answer sits never gives it away: choices are shuffled, and
  numbers (counts, trays) stay smallest first with the answer as likely
  first, middle or last (`spreadChoices` in `kit/learn.ts`). A test checks
  every activity in every dish at both levels.

**Order tickets** (`activities/ticket.ts`: reading and counting) fit dishes
with toppings you can count, and the burger. The round starts with a
customer's ticket: "A pizza with 2 olives and 3 pepperoni slices, please!". She
reads it (Level 1 reads itself out straight away; Level 2 waits 4 seconds
first, so she gets the first go; 🔊 reads it any time) and taps **Let's
cook!**. The toppings (or the burger's layers) are then exactly what the
ticket says, one piece each so they can be counted, with the ticket's note
ticking each line off: clipped to a little ticket rail under the kitchen
clock and the shelf on a computer or a phone held sideways, pinned up at the
right on a phone held upright. Right after comes a counting
question with a picture of what she made: "How many toppings did you put
on?", or "You put on 5 toppings. Add 2 more. How many is that?". A burger's
question counts the layers between the buns, as the ticket's note does:
"How many layers did you put between the buns?". Tickets use words that fit
the food (`TICKET_WORDS` in `activities/ticket.ts`): "pepperoni slices",
"avocado slices", "carrot sticks", "egg strips", and "a taco", "a sushi
roll" or "a fruit salad", not "a bowl".

| Level | Ticket                                                            | Question                                   |
| ----- | ----------------------------------------------------------------- | ------------------------------------------ |
| 1     | Digits, usually two kinds (one now and then), 2 to 5 things       | Count them, or add 1 to 3 more (within 10) |
| 2     | Number words, two or three kinds, up to 7, and "No tomatoes!" too | Add 3 to 9 more (within 20)                |

Anything chopped earlier is always on the ticket (the pizza's pepperoni), and
a burger always has one or two patties.

**Clock time** (`activities/clock-time.ts`: telling the time) fits every
dish, and has `weight: 3`, so the planner picks it three times as often as
an activity without a weight (it still never comes twice in a row). It uses
the round's real kitchen time, and is one of:

- **What time is it?** (`steps/read-clock.ts`) A big clock shows the kitchen
  time right after a step ("Stirring took 10 minutes. What time is it now?"),
  or at the start, with three times to pick from. The wrong ones are classic
  slips: the hands read the wrong way round (6:20 for 4:30) and the hour the
  hour hand is nearest (5:45 for 4:45). At Level 1 the answers are sometimes
  words: "half past 4", "quarter to 5".
- **Set the clock** (`steps/set-clock.ts`) "Stirring will be done at 4:15.
  Set the clock to 4:15!" A big clock starts on the hour before the time at
  Level 1 (4:00 for 4:15, 3:00 for 4:00), so the minute hand turns the hour
  hand the last little way, and at 12:00 at Level 2. Touching the face
  grabs the nearer hand (the outer ring is the minute hand's), the minute
  hand snaps to the 5-minute marks, and **Check!** checks it. At Level 1 the
  hands are geared like a real clock: turning the minute hand past 12 moves
  the hour hand on. At Level 2 each hand is set on its own. Every wrong check
  says which hand is off ("The short hand shows the hour."), and that hand
  glows (both take turns); after two, Chef Bunny says it once more and the
  hands sweep to the time. Then she cooks the step and watches the kitchen
  clock get there.
- **When will it be done?** (Level 2) "Next: Bake the cookies! That takes 15
  minutes. It's 3:10 now. When will it be done?", naming the very step next,
  right before the bake (or another step of 5 minutes or more), so the
  kitchen clock then really sweeps those minutes. Shown, Chef Bunny says "It
  will be done at 3:25!". Once answered, the big clock shades the minutes in.
  So the bake can start on a 5, the step before it may take a few minutes
  longer than usual.

| Level | Times                         | Kinds                                   | The hands            |
| ----- | ----------------------------- | --------------------------------------- | -------------------- |
| 1     | On the hour, half and quarter | What time is it?, Set the clock         | Geared, like a clock |
| 2     | Any 5 minutes                 | All three, "When will it be done?" most | Each set on its own  |

Chef Bunny says times the way people do ("four thirty", "half past four",
"quarter to five": `sayTime` and `quarterWords` in `kit/clock.ts`), and
when she shows an answer she says where the hands point: the short hand
"just past the 4" up to 4:15, "between the 4 and the 5" from 4:20 to 4:40
("halfway" at 4:30), and "almost at the 5" after.

**The customer pays** (`activities/customer-pays.ts`, `steps/pay.ts`:
money) fits every dish. After the last step, before decorating, a customer
buys the dish: "That's 45¢. Tap the coins to pay!" She taps coins in the bank
(sized like the real coins) into the tray, and a total counts up. Each kind of coin
piles up in its own cell of the tray ("×3" when there are several), and a
tap anywhere on a cell gives one of its coins back. Paying exactly right checks itself, whether
the last tap added a coin or gave one back; too much gets a gentle "Oops,
too much!"; a **Check!** that's short says how much more is needed. A full
tray (16 coins) says "The tray is full! Try bigger coins.". After two wrong
checks, Chef Bunny lays out the fewest coins and counts them on.

| Level | Price      | Coins                             | On the coins                                   |
| ----- | ---------- | --------------------------------- | ---------------------------------------------- |
| 1     | 10¢ to 50¢ | Dimes, nickels and pennies        | Value and name                                 |
| 2     | 26¢ to 99¢ | Quarters, dimes, nickels, pennies | Name only; the values show after a wrong check |

#### Measure it, Equal parts and Tray arrays (math)

- **Measure it** (`activities/measure.ts`, step `cup`) fits dishes that pour
  ½ cup or more of something (pancakes, cupcakes, mac & cheese, smoothie,
  bisque). Just before that pour, a big measuring cup with the ingredient in
  it and its bag or jug beside it: "How much milk is in the measuring cup?".
  The pour after it then pours that amount, its star on the same line. The
  cup is a 1 cup measure with a line every ¼ cup for up to 1 cup, else a jug
  with a line every ½ cup, so what's in it and the star are always on a line
  (a test checks every question).

  "How much more?" is always a whole or half cup more (½ to 1, 1 to 2, ½ to
  2...): counting on along the cup, not taking fractions away. The pour after
  it starts with what we have already in its cup ("½ cup more milk, up to
  the star!") and fills it up to the star on what we need.

  | Level | Question                                                                                                                                                                     |
  | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | 1     | ½, 1 or 2 cups, every line numbered; the answers are always ½ cup, 1 cup, 2 cups                                                                                             |
  | 2     | ¼, ¾ or 1½ cups with only whole cups (and ½) numbered, or half the time "We need 1 cup of milk and have ½ cup. How much more?" (a star on the need line), then pour the rest |

- **Equal parts** (`activities/equal-parts.ts`, step `cut`, then an `ask`)
  fits the pizza, the pancakes and the mac & cheese, once they're cooked.
  Three pictures of it on the answer buttons: cut into equal pieces, cut
  into the same number of pieces that aren't equal, and cut into a different
  number of equal pieces. The pieces are honest: equal ones really are the
  same size (a test measures them), and unequal ones clearly aren't (a tenth
  beside a half). The cuts are wide gaps edged in ink, so they read small on
  a phone. Then a question beside the food, big and cut the right way. At
  Level 1 its three names come in any order; "one third" is never the answer
  there, only a name to think past.

  | Level | Pick the picture                                   | Then                                                  |
  | ----- | -------------------------------------------------- | ----------------------------------------------------- |
  | 1     | "Which pizza is cut into 4 equal pieces?" (2 or 4) | "What is each piece?" one half, one third, one fourth |
  | 2     | "Which pizza is cut into thirds?" (2, 3 or 4)      | "How many thirds make the whole pizza?" 2, 3, 4       |

- **Tray arrays** (`activities/trays.ts`, step `tray`) fits the cupcakes and
  cookies after baking, and the sushi after it's cut: they sit on a tray in
  rows, and a question asks how many. The wrong answers are a row more or
  less (or one off), smallest first, the answer first, middle or last as
  often.

  | Level | Tray                                                               | Help                                                                        |
  | ----- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
  | 1     | Rows of 2, 5 or 10: "3 rows of 5 cupcakes. Count by 5s! How many?" | After a wrong try, each row but the last shows its running total (5, 10...) |
  | 2     | 2 to 5 rows of 2 to 5: "4 rows of 3 cookies. How many cookies?"    | Chef Bunny shows it as adding: "3 + 3 + 3 + 3 = 12"                         |

**Find the ingredient** (`activities/find-word.ts`: phonics and sight
words) fits dishes that use an ingredient from its word bank for sure.
Just before the step that uses it, "Tap the CHEESE!": three jars with a word
on each label and a "?" where the picture goes, so it takes reading, not
matching pictures. Once she's found it the pictures pop in, and the step
that uses it comes next ("Grate the cheese!"). The voice only ever says
"Find the word!" by itself, never the word: tapping 🔊 reads "Tap the
cheese!", and hearing it counts as help (a right answer then carries on
without the bonus or the Smart Chef star; nothing is taken away). A wrong
jar greys out with a hint about the letters ("Look at the letters: find ch
and ee!").

| Level | The jars                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | The word and two other ingredient words, all starting with different letters and sounds (cheese, rice, pancake; never cream with ketchup) |
| 2     | The word and two real words that look and sound like it (cheese, chess, cherry; whipped cream, ice cream, sour cream)                     |

The word bank (`WORD_BANK`) has the ingredient labels that practise a 2nd-grade
pattern (ch, sh, th, wh, ee, ea, oa, ai, ay, igh, ow, silent e): cheese,
cherry, shells, cream, meatball, rice, pancake, cupcakes, sushi, smoothie,
ketchup and whipped cream, each with its patterns (only the ones it really
has: cheese is ch and ee, not a silent e) and two real look-alikes. A new
ingredient whose label is in the bank can be found with no other change. The
tests check every word has its patterns and is still an ingredient's label.

**Put the recipe in order** (`activities/recipe-order.ts`: sequencing and
reading) fits dishes with three or four cooking steps. The round starts with
the dish's step cards ("Chop the pepperoni!", with its emoji at Level 1,
words only at Level 2) shuffled in a tray, never with the first step first.
She drags each card up into its slot (First, Next, Then, Last; three cards
have First, Next, Last), or just taps the cards in order and each flies to
the next empty slot. A card dropped near a slot counts for it; one let go
away from the slots just slides back. A card in the wrong slot slides
gently back with "Hmm! What do we do next?". Steps that could just as well
go either way take either order: a dish marks them with `either` (fruit
salad and smoothie chop either fruit first, pancakes take the eggs or the
flour and milk first, the sundae's chocolate goes on before or after the
toppings). The whole order is one question by the shared rules: one slip
still earns the Smart Chef star; the second means Chef Bunny helps (the card
that comes next glows, and each one after it) and the star is gone. Each
card is read out as it's picked up (unless "Read it myself" is on). While
she does, the recipe along the top shows a "?" for each step, so it doesn't
give the order away. Then she cooks the dish, in the recipe's order. On a phone
held upright each card has its own row, slot at the left and tray at the
right.

**On a phone**, everything a finger taps in a learning moment is at least
about 60 CSS pixels: answer buttons, the 🔊 speaker (and the step card's,
for "Read it myself"), **Let's cook!**, the jars, **Check!**, the coins in
the bank, the tray's cells (to give a coin back) and the clock's hands (a
touch near a hand's knob grabs it). So are the 🏠 and sound buttons, the grown-ups' gear,
the shop button, the rank badge, everything in the shop, the
"Leave the kitchen?" card's ✓ and ✕, the decorating treats and **Done!**, the
recipe book's and the grown-ups' ✕, and the grown-ups' choices and **Done**. Held
sideways, the side answers fill the room at the right two to a row; held
upright, the question spans the screen with the picture under it and the
answers beside it. Setting the clock, the clock is as big as fits: held
upright it fills the left of the screen from the question down (about 220
pixels across), with the question and **Check!** stacked beside it; held
sideways it's at the right under the question, with **Check!** at the left.
Paying held upright, the tray spans the screen, the bank's coins are bigger,
and the total and **Check!** sit either side of the progress pill. The recipe cards are the one exception: four of
them on an upright phone are about 50 pixels tall (and 168 wide), with a
generous drop zone.

### How it's built

| Piece                   | What it is                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activities/`           | One file per activity, default export an `Activity`; `activities/index.ts` finds them and has `planRound`.                                                                                   |
| `kit/learn.ts`          | Settings (`settingsFrom`, `DEFAULT_SETTINGS`), `Activity`, `RoundPlan`, answering (`answer`), `smartChef`.                                                                                   |
| `kit/quiz.ts`           | The quiz mini-game: a question with answer buttons, its drawing, voice and Chef Bunny reactions, and `quizPlaces(shape)`; `observeAnswer`, the sounds and popups every learning step shares. |
| `kit/words.ts`          | Reading: `wordsOf`, `numberWord`, `fitWords`, `drawWords` (with the word being read lit up), `drawSpeaker`.                                                                                  |
| `kit/clock.ts`          | Kitchen time: `stepMinutes`, `roundTime`, `startTime`, `drawClock`, and the maths for dragging a clock's hands.                                                                              |
| `kit/order.ts`          | Order tickets: `Order`, `drawOrderNote`.                                                                                                                                                     |
| `kit/measure.ts`        | Real amounts: `parseAmount`, `amountText`, `measureScale`, `measureTarget`, `drawMeasuringCup`.                                                                                              |
| `kit/picture-quiz.ts`   | `pictureQuiz(kind, picture)`: a step that plays like `ask` with a picture of its own (the cup and tray steps).                                                                               |
| `steps/ask.ts`          | A question step with a picture of the step before. Most activities use it as is.                                                                                                             |
| `steps/ticket.ts`       | The order ticket step.                                                                                                                                                                       |
| `sound.ts` `read(text)` | Reads out loud like `say`, and follows the word being said (or times it), for lighting words up.                                                                                             |

A round's steps can include **learning steps** (a `Step` with
`learning: true`): they're not in the recipe along the top, their card says
"🎓 Learning time!" instead of a step number, and they score nothing toward the
stars. `createState(dish, random, plan)` takes the plan from `planRound`;
without one it's the dish's own recipe with learning off, so tests and old
code work as before. `state.learn` has the settings, the activity and the
answers so far; `state.start` is the clock's start time.

### Adding a learning activity

An activity is one new file, `activities/<id>.ts`, and usually that's all.

1. **Decide where it goes.** Most activities are a question at the right
   moment, as an `ask` step inserted in the recipe; some change an existing
   step's options too (the ticket changes the top step's toppings); a few
   need a step of their own (setting a clock by dragging its hands, paying
   with coins).
2. **Write the activity:**

   ```ts
   import { nearChoices, type Activity } from '../kit';
   import type { AskOptions } from '../steps/ask';

   const trays: Activity = {
     id: 'trays', // the file name
     name: 'Tray arrays',
     skills: ['math'],
     fits: (dish) => dish.steps.some((s) => s.kind === 'bake' && s.item === 'cupcake-tray'),
     weave({ dish, level, random, start }) {
       const rows = level === 1 ? 2 : 3;
       const cols = 2 + (Math.floor(random() * 3) % 3);
       const { choices, index } = nearChoices(rows * cols, random, 1);
       const ask: AskOptions = {
         kind: 'ask',
         title: 'Count the cupcakes!',
         icon: '🧁',
         question: {
           text: `${rows} rows of ${cols}. How many cupcakes?`,
           choices: choices.map(String),
           answer: index,
           hint: ['Count one row,', 'then the next!'],
           help: `${rows} rows of ${cols} makes ${rows * cols}!`,
         },
       };
       const i = dish.steps.findIndex((s) => s.kind === 'bake');
       return [...dish.steps.slice(0, i + 1), ask, ...dish.steps.slice(i + 1)];
     },
   };
   export default trays;
   ```

   `weave` gets the dish, the level, `random` (roll everything with it, so
   tests repeat) and the clock's start time (`timeAtStep(steps, start, i)`
   says what the clock shows at step i). It returns the round's steps: new
   objects, never the dish's own changed.

3. **The question** (`Question` in `kit/quiz.ts`): `text` (read out and lit
   up), 2 to 4 short `choices` with the `answer`'s index, a two-line `hint`
   for after a wrong try, and the `help` Chef Bunny says when she shows it.
   `layout: 'row'` puts the answers in a row under the question instead of
   beside a picture (for words, such as "Tap the CHEESE"). An `ask` step's
   picture is the step before it, as it was left; `picture: 'none'` leaves
   it out, and `tag` puts a sticker on it ("+5 🍄").
4. **A step of its own**, when a question isn't enough: a step file with
   `learning: true`, a `solve(turn)` that does what someone who knows would
   do (tests use it), and the shared rules: keep an `AnswerState` in its
   state and call `answer(round, state, correct)`, which returns 'right',
   'try again' or 'show'. Use `autoReadDelay(settings, pause)` for when to
   read itself out, `sound.read` and `drawWords` for lit-up words,
   `drawSpeaker` for its 🔊, and `effects.celebrate` to make Chef Bunny
   cheer (a 'Perfect!' feedback) or encourage ('Nice try!'). `steps/ask.ts`
   and `kit/quiz.ts` show all of it. Scene space for questions comes from
   `quizPlaces(shape)`: the `bubble` and its `speaker`, a `picture`, and a
   big `button` ("Check!"); `choiceBoxes(count, layout, shape)` has the
   answers. They're clear of Chef Bunny and the HUD in every layout, and
   on a phone big enough for a finger. Use the same shape when drawing
   (`view.shape`) and pressing (`turn.shape`, which the game passes to
   `press`, `move` and `release`; it's undefined, meaning 'page', in most
   tests), so a tap hits what's drawn. `QUIZ_BUBBLE` and `QUIZ_PICTURE` are
   the computer's. A picture beside the answers (`pictureQuiz` in
   `kit/picture-quiz.ts`, the read-clock's clock, `drawQuestion` for the
   bubble) goes in `quizPlaces(view.shape)` too. A step with a layout of
   its own has a pure function of the shape for its places, used by both
   its `press` and its `draw`, and tested like `kit/quiz.test.ts` (clear of
   `keepClear(shape)`, and at least 60 CSS pixels via `cssScale(shape)` from
   `test-kit.ts`): `jarBoxes` (`steps/find.ts`), `sequencePlaces`
   (`steps/sequence.ts`, drag-and-drop cards), `setClockPlaces`
   (`steps/set-clock.ts`, the clock and Check!) and `payPlaces`
   (`steps/pay.ts`, the tray, the coin bank and Check!).
   `steps/learning-places.test.ts` checks the clocks, paying and the cut,
   cup and tray pictures on every shape.
5. **Time activities** build on `drawClock(g, x, y, r, time, { glow })`
   (any size) and the plain maths in `kit/clock.ts`: `angleAt` (a drag to an
   angle), `minuteFromAngle(angle, 5)` (snapped), `hourFromAngle`,
   `withMinuteHand` and `withHourHand` (setting a time hand by hand),
   `turnMinuteHand` (the same, geared), `sameClockTime`, `clockText`
   ("4:05"), `sayTime` ("four oh five"), `quarterWords` ("quarter to 5")
   and `timeAtStep`. The `read-clock` and `set-clock` steps are ready to use.
   An activity can say `weight` (1 if left out) to come up more often.
6. **Run `npm run check`.** `activities/activities.test.ts` weaves every
   activity into every dish it fits, at both levels, checks the same seed
   weaves the same round, cooks it to the end and draws every frame in all
   three layouts. Add `activities/<id>.test.ts` for the activity's own
   rules (its numbers stay within the level, the answer is right).

Like dishes, a new activity needs no change anywhere else, so several can be
added at once. Say in the pull request what this section should gain (a
paragraph like "Order tickets" above), and it's added once they're all in.

## How it's built

A round cooks a **dish**. A dish is a list of **steps** (chop, stir, bake...),
and each step says which **ingredients** it uses. Each of the three is a
folder with one file per thing, found automatically:

| Folder         | One file per      | Default export | Found by               |
| -------------- | ----------------- | -------------- | ---------------------- |
| `dishes/`      | dish              | `Dish`         | `dishes/index.ts`      |
| `steps/`       | kind of step      | `Step`         | `steps/index.ts`       |
| `ingredients/` | ingredient        | `Ingredient`   | `ingredients/index.ts` |
| `activities/`  | learning activity | `Activity`     | `activities/index.ts`  |

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

A new dish is usually one file. Here's the quickest way from "I want to make
French toast!" to playing it.

**1. Write the recipe in kid steps.** Three to five steps, each one thing you
can do with a tap, a hold or a drag. Match each to a step kind in the table
below:

| French toast       | Step kind                        |
| ------------------ | -------------------------------- |
| Crack the eggs     | `crack`, item `egg`              |
| Pour the milk      | `pour`, pours `milk`             |
| Flip the toast     | `flip`, a new `french-toast`     |
| Add berries on top | `top`, a new base, with toppings |

**2. Check the ingredients.** The roles table below lists what each step can
use today. Anything missing is a new file in `ingredients/` that draws it (see
"Adding an ingredient"). Reusing what's there is the fastest: egg, milk and
blueberry already exist.

**3. Add `dishes/<id>.ts`.** Copy `dishes/pancakes.ts` or `dishes/pizza.ts`,
change the id, name and steps, and draw the finished dish for the end card.

**4. Try it.** Run `npm run check`: the tests cook every dish to the end and
draw every screen, so a missing ingredient or role fails here. Then
`npm run dev` and tap to cook until the spinner lands on it (or cook it once,
then pick it from the recipe book).

The new dish joins the spinner, the random pick and the recipe book by
itself. Nothing else needs to change.

**Asking an agent.** A prompt like this is enough: _"Add French toast to
Carnival Kitchen: crack eggs, pour milk, flip the toast, top with
berries. Follow 'Adding a dish' in its README, reuse existing ingredients
where you can, and check it in the browser on desktop and on a phone size."_

The details:

1. Add `dishes/<id>.ts` whose default export is a `Dish` (from `'../kit'`):

   ```ts
   interface Dish {
     id: string; // the file name
     name: string; // "Pizza": the end card, and "You made Pizza!"
     steps: RecipeStep[]; // in cooking order
     locked?: boolean; // a surprise: only once every other dish has a sticker
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

   Every step can also take `minutes` (on the kitchen clock), a pour
   `amounts` (one per pour: "1 cup") and a season step `amount` ("¼
   teaspoon"): see "Learning". The learning steps (`ticket`, `ask`,
   `find`, `sequence`, `cup`, `tray`, `cut`, `read-clock`, `set-clock` and
   `pay`) are woven in by activities, not written in recipes.

   In brackets is the art role each ingredient must have (see "Adding an
   ingredient"). The ones there today:

   | Role          | Ingredients                                                                                                                                                                                                                                                                                |
   | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `chop`        | carrot, pepperoni, strawberry, banana, celery, tomato, onion, cucumber, sushi-roll, pickle                                                                                                                                                                                                 |
   | `crack`       | egg                                                                                                                                                                                                                                                                                        |
   | `pour`        | flour, milk, sugar, pasta-water, sunset-splash, cream                                                                                                                                                                                                                                      |
   | `pourInto`    | pot, blender, pecorino                                                                                                                                                                                                                                                                     |
   | `vessel`      | pot, mixing-bowl, rice-pan, fruit-bowl                                                                                                                                                                                                                                                     |
   | `stirred`     | soup, batter, cupcake-batter, cookie-dough, cheese-sauce, cheese-cream, fruit-salad, lobster-shells, rice, taco-meat, spaghetti-sauce                                                                                                                                                      |
   | `shaker`      | salt, black-pepper, taco-spice                                                                                                                                                                                                                                                             |
   | `seasoned`    | soup, pecorino, taco-meat, spaghetti-sauce                                                                                                                                                                                                                                                 |
   | `sauceBase`   | pizza, omelette, nori, sundae-glass                                                                                                                                                                                                                                                        |
   | `spread`      | tomato-sauce, ketchup, sushi-rice, chocolate-sauce                                                                                                                                                                                                                                         |
   | `toppingBase` | pizza, casserole, fruit-bowl, taco-shell, spaghetti-plate, cupcake, sundae-glass, cookie-dough, nori, birthday-cake                                                                                                                                                                        |
   | `topping`     | pepperoni, mushroom, pineapple, olive, pepper, tomato, breadcrumbs, macaroni, blueberry, kiwi, mint, lettuce, shredded-cheese, avocado, meatball, basil, whipped-cream, sprinkles, cherry, candy-heart, star-cutter, heart-cutter, bunny-cutter, cucumber, carrot-stick, egg-strip, candle |
   | `bake`        | pizza, casserole, cupcake-tray, cookies, birthday-cake                                                                                                                                                                                                                                     |
   | `flip`        | pancake, omelette, patty                                                                                                                                                                                                                                                                   |
   | `grate`       | cheddar, pecorino                                                                                                                                                                                                                                                                          |
   | `tossed`      | spaghetti                                                                                                                                                                                                                                                                                  |
   | `blender`     | blender                                                                                                                                                                                                                                                                                    |
   | `blended`     | smoothie, bisque                                                                                                                                                                                                                                                                           |
   | `scoop`       | strawberry-scoop, vanilla-scoop, mint-scoop                                                                                                                                                                                                                                                |
   | `stack`       | bun, patty, cheese-slice, pickle, lettuce-leaf, tomato-slice, strawberry-scoop, vanilla-scoop, mint-scoop                                                                                                                                                                                  |
   | `stackBase`   | burger-plate, sundae-glass                                                                                                                                                                                                                                                                 |
   | `rollOut`     | cookie-dough                                                                                                                                                                                                                                                                               |
   | `rollUp`      | sushi-roll                                                                                                                                                                                                                                                                                 |

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
  // amount: '1 cup', // optional: a real amount for one pour or shake, under the meter
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
| `learning?`                      | A learning step (a ticket, a question): see "Learning".                                                   |
| `bubble?(turn)`                  | Chef Bunny's two lines right now, instead of the hint (after a wrong answer, say).                        |
| `solve?(turn)`                   | For tests: does what someone who knows would do. Learning steps have one, for `playThrough`.              |

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
| Quiz (`kit/quiz.ts`)       | A question with answer buttons; wrong greys out with a hint, two wrong shows it, right cheers then moves on.             | `startQuiz`, `pressQuiz`, `updateQuiz`, `quizBubble`, `solveQuiz`, `observeQuiz`, `drawQuiz`, `choiceBoxes`, `quizPlaces`                             |

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
- **The kitchen clock** hangs at x 700 to 784, y 154 to 238 on a computer
  (where the shelf would be); steps draw over it. The order note hangs at x
  704 to 792 from y 252 (`noteSpot` in `kit/order.ts`; at x 606 on a phone
  held upright).
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
  `circles.ts`, `hold.ts`, `float.ts`, `needle.ts`, `quiz.ts` (the mini-games),
  `scene.ts` (shared scene pieces), `learn.ts`, `words.ts`, `order.ts` (learning)
  and `clock.ts` (kitchen time). Import it from `'../kit'`.
- `steps/`: one file per kind of step (its rules, drawing, card and sounds),
  a test next to each, and `index.ts`, which finds them.
- `ingredients/`: one file per ingredient (its art), and `index.ts`, which
  finds them (`ingredient`, `artOf`).
- `dishes/`: one file per dish (its recipe and end card), and `index.ts`.
- `chef.ts`: Chef Bunny's reactions, lines and their cooldowns, and her idle
  blinks, ear flicks and glances: plain functions, tested in `chef.test.ts`.
- `bunny.ts`: drawing Chef Bunny in a pose (mood, blink, ear, gaze, lean,
  and the ceremony's bow and dropping hat), wearing her hat and apron.
- `outfit-art.ts`: her hats and aprons, and the shop's pictures of them.
- `wardrobe.ts`: the shop's catalog, buying, owning and wearing (see "The
  shop"). `shop.ts`: the shop page's and the title buttons' places, and what
  a tap does. Both tested in `shop.test.ts`.
- `ranks.ts`: chef points, ranks, the ceremony's once-a-rank rule, what each
  rank gives, and the surprise dish's unlock. Tested in `ranks.test.ts`.
- `kitchens.ts`: the kitchens and their decorations, drawn behind
  everything. `wardrobe-draw.test.ts` draws every kitchen, hat and apron, the
  shop and the ceremony in every layout.
- `render.ts`: painting the kitchen (`kitchens.ts` draws it), Chef Bunny's place and what she sees, the HUD (with the badge of the dish being made), the card and popups,
  particles, the title, decorating, end, recipe book and shop screens, the rank ceremony, and running the dish spinner. It asks the step being cooked to draw
  itself, and every started step to `observe`.
- `spinner.ts`: the dish spinner's drawing, and its landing maths as plain
  functions (`spinEnd`, `reelPosition`, `reelIndex`, `holdFor`), which
  `spinner.test.ts` checks always land on the picked dish. The dish is picked
  before the spin; the spinner only shows it. In `game.ts`, `newRound(dish?,
{ spin })` starts a round: with no dish it picks one and spins; with a
  dish it starts cooking it straight away unless `spin` is true.
- `art.ts`: the drawing kit: palette, shapes, faces, text.
- `sound.ts`: sound effects made with Web Audio (no files to load) and the
  voice that reads each step out loud, plus `chatter` for Chef Bunny's own
  lines, which only speaks when the voice is free. `unlock()` runs inside
  every tap: the first one speaks a silent word and every one wakes the
  audio, because iOS Safari only lets speech and sound started later (from
  the animation loop) play once they've been started inside a tap. The
  renderer holds Chef Bunny's chatter to the end of the frame and drops it
  if an instruction was said in the meantime, so she never starts a line
  that's cut off at once; only cheers show in her bubble, so after "Not
  yet!" or while holding, the bubble keeps the step's instruction.
- **Fingers and the canvas.** One finger at a time: while one is down, a
  second finger's taps, moves and lifts are ignored. A gesture the browser
  takes away (`pointercancel`, such as a system swipe) stops a pour, shake
  or bake without scoring it (`cancel` in `game.ts`); anything else lets go
  as usual. The canvas has an `aria-label` describing the game. It's drawn at
  most 2 canvas pixels per CSS pixel (`MOST_PIXELS`), so a 3× phone paints
  less than half the pixels for the same look, and the clocks' faces and
  numbers are drawn once into small canvases of their own and stamped every
  frame (`drawClock` in `kit/clock.ts`).
- `decorate.ts`: decorating the finished dish: the treats, where the dish,
  tray and **Done!** go for each layout, and plain functions for pressing,
  dragging and letting go. `decorate.test.ts` tests it.
- `book.ts`: the recipe book's count, grid, trophy shelf and hit testing, and
  the title screen's book button. `book.test.ts` tests it.
- `customers.ts`: the food stand's guests and bosses, when a boss comes, a
  visit's dishes and trophy, what they say, and the coins a round brings in.
  `customers.test.ts` tests it.
- `stand.ts`: drawing the guests, the coin jar, coins and the trophy, and
  where the stand goes in each layout (`guestSpot`, `walletSpot`,
  `stageSpot`) and its timings. `stand.test.ts` tests it.
- `grownups.ts`: the grown-ups' settings: the gear, the page's layout and
  hit testing, and loading and saving them. `grownups.test.ts` tests it.
- `chaos/`: the kitchen surprises, one file each, `rules.ts` (planning,
  pausing, the bonus: plain functions), `index.ts` (finds them, and what
  `game.ts` calls) and `show.ts` (drawing them, and Chef Bunny's cue). See
  "Kitchen surprises".
- `activities/`: one file per learning activity, and `index.ts`, which finds
  them and plans each round (`planRound`). See "Learning".
- `layout.ts`: how the canvas fits the screen (page, wide or tall), and
  where the 800×500 cooking scene sits on it. The game logic only ever sees
  scene coordinates. `layout.test.ts` tests it.
- `test-kit.ts`: helpers for tests. `game.test.ts` tests rounds and every
  dish; each folder has tests for its registry.

## Notes

This game uses its own pastel palette and a rounded font instead of the
carnival theme (house rule 3), because it's made for a young player and needed
a softer, brighter look.
