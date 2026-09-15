# Sword & Poker

A browser-based fan recreation of the core loop from the 2010 mobile game
*Sword & Poker* — swap cards, build poker hands, and hack your way through
a run of enemies. Original artwork, code, and assets are not used; this is
an independent reimplementation of the gameplay concept.

## How to play

1. Open `index.html` in a browser (no build step, no dependencies).
2. Start a run from the title screen.
3. In battle, a 5×5 grid of cards sits above your enemy. The bottom row
   (highlighted in gold) is your **attack hand**.
4. Click a card, then click an orthogonally adjacent card to swap them.
   You get a limited number of swaps per turn — spend them arranging the
   bottom row into the strongest poker hand you can.
5. Hit **Attack!** to unleash the hand. Better hands (pairs, straights,
   flushes, full houses...) hit harder. A dominant suit in your hand also
   triggers a bonus effect:
   - **♠ Spades** — bonus damage
   - **♥ Hearts** — heal HP
   - **♦ Diamonds** — bonus gold
   - **♣ Clubs** — guard up (halves the enemy's next hit)
6. After you attack, the enemy strikes back, the grid cascades down with a
   fresh row on top, and your swaps reset.
7. Defeat enemies for gold and experience. Between fights, visit camp to
   sharpen your sword (more damage) or rest (heal up) before continuing.
8. Defeat the Ancient Dragon to win — or keep going in Endless Mode against
   ever-tougher scaled encounters.

## Project structure

```
index.html      Screen markup (title, camp, battle, game over, victory)
css/style.css   Mobile-first styling
js/game.js      Game state, poker hand evaluation, battle logic, rendering
```

No build tooling or external dependencies — it's plain HTML/CSS/JS, so it
also works served from any static file host.
