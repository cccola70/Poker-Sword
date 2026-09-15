"use strict";

/* ============================== Cards ============================== */

const SUITS = ["spades", "hearts", "diamonds", "clubs"];
const SUIT_SYMBOL = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const SUIT_COLOR = { spades: "black", hearts: "red", diamonds: "red", clubs: "black" };
const RANK_LABEL = { 11: "J", 12: "Q", 13: "K", 14: "A" };

function randomCard() {
  const value = 2 + Math.floor(Math.random() * 13); // 2..14
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { value, suit };
}

function rankLabel(value) {
  return RANK_LABEL[value] || String(value);
}

/* ============================== Poker Evaluation ============================== */

const HAND_NAMES = [
  "High Card", "Pair", "Two Pair", "Three of a Kind", "Straight",
  "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush",
];

const HAND_BASE_DAMAGE = [5, 10, 18, 28, 40, 50, 65, 90, 150, 250];

function evaluateHand(cards) {
  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  const groups = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (b.count - a.count) || (b.value - a.value));

  const uniqueSorted = [...new Set(values)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;
  if (uniqueSorted.length === 5) {
    if (uniqueSorted[0] - uniqueSorted[4] === 4) {
      isStraight = true;
      straightHigh = uniqueSorted[0];
    } else if (uniqueSorted.join(",") === "14,5,4,3,2") {
      isStraight = true;
      straightHigh = 5; // wheel: A-2-3-4-5
    }
  }

  const kicker = values.reduce((sum, v) => sum + v, 0);
  let rank = 0;

  if (isStraight && isFlush) {
    rank = straightHigh === 14 ? 9 : 8;
  } else if (groups[0].count === 4) {
    rank = 7;
  } else if (groups[0].count === 3 && groups[1] && groups[1].count === 2) {
    rank = 6;
  } else if (isFlush) {
    rank = 5;
  } else if (isStraight) {
    rank = 4;
  } else if (groups[0].count === 3) {
    rank = 3;
  } else if (groups[0].count === 2 && groups[1] && groups[1].count === 2) {
    rank = 2;
  } else if (groups[0].count === 2) {
    rank = 1;
  } else {
    rank = 0;
  }

  return { rank, name: HAND_NAMES[rank], kicker };
}

function dominantSuit(cards) {
  const buckets = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  for (const c of cards) buckets[c.suit] += 1;
  let best = null;
  let bestCount = 0;
  for (const suit of SUITS) {
    if (buckets[suit] > bestCount) {
      best = suit;
      bestCount = buckets[suit];
    }
  }
  return bestCount >= 2 ? { suit: best, count: bestCount } : null;
}

/* ============================== Enemies ============================== */

const ENEMY_LIST = [
  { name: "Straw Dummy", emoji: "🎯", maxHp: 40, atk: 4, gold: 15, exp: 20 },
  { name: "Forest Goblin", emoji: "👺", maxHp: 68, atk: 6, gold: 25, exp: 35 },
  { name: "Skeleton Soldier", emoji: "💀", maxHp: 95, atk: 9, gold: 40, exp: 55 },
  { name: "Orc Brute", emoji: "👹", maxHp: 140, atk: 13, gold: 60, exp: 80 },
  { name: "Dark Knight", emoji: "🛡️", maxHp: 200, atk: 18, gold: 90, exp: 120 },
  { name: "Ancient Dragon", emoji: "🐉", maxHp: 320, atk: 26, gold: 200, exp: 250, boss: true },
];

function buildEnemy(index) {
  const base = ENEMY_LIST[index % ENEMY_LIST.length];
  const loop = Math.floor(index / ENEMY_LIST.length);
  const scale = 1 + loop * 0.35;
  const suffix = loop > 0 ? ` (Lv.${loop + 1})` : "";
  return {
    name: base.name + suffix,
    emoji: base.emoji,
    maxHp: Math.round(base.maxHp * scale),
    hp: Math.round(base.maxHp * scale),
    atk: Math.round(base.atk * scale),
    gold: Math.round(base.gold * scale),
    exp: Math.round(base.exp * scale),
    boss: !!base.boss,
  };
}

/* ============================== Game State ============================== */

const GRID_SIZE = 5;
const BASE_SWAPS = 6;

function freshPlayer() {
  return {
    level: 1,
    hp: 60,
    maxHp: 60,
    exp: 0,
    expToNext: 60,
    gold: 20,
    swordLevel: 1,
  };
}

const state = {
  screen: "title",
  player: freshPlayer(),
  enemyIndex: 0,
  enemy: null,
  grid: [],
  selected: null,
  swapsLeft: BASE_SWAPS,
  blockActive: false,
  seenVictory: false,
};

function maxSwaps() {
  return BASE_SWAPS + Math.floor(state.player.swordLevel / 2);
}

function makeGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) row.push(randomCard());
    grid.push(row);
  }
  return grid;
}

function upgradeCost() {
  return 30 + state.player.swordLevel * 25;
}

function healCost() {
  return 15 + state.player.level * 5;
}

/* ============================== Logging ============================== */

function pushLog(elId, message, max = 6) {
  const el = document.getElementById(elId);
  const line = document.createElement("div");
  line.textContent = message;
  el.appendChild(line);
  while (el.children.length > max) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

/* ============================== Screen Management ============================== */

function showScreen(name) {
  state.screen = name;
  for (const id of ["title", "town", "battle", "gameover", "victory"]) {
    document.getElementById(`screen-${id}`).classList.toggle("hidden", id !== name);
  }
}

/* ============================== Rendering ============================== */

function renderTown() {
  const p = state.player;
  document.getElementById("town-level").textContent = p.level;
  document.getElementById("town-hp").textContent = `${p.hp} / ${p.maxHp}`;
  document.getElementById("town-exp").textContent = `${p.exp} / ${p.expToNext}`;
  document.getElementById("town-gold").textContent = `💰 ${p.gold}`;
  document.getElementById("town-sword").textContent = `Lv.${p.swordLevel}`;

  document.getElementById("upgrade-cost").textContent = `💰${upgradeCost()}`;
  document.getElementById("heal-cost").textContent = `💰${healCost()}`;
  document.getElementById("btn-upgrade").disabled = p.gold < upgradeCost();
  document.getElementById("btn-heal").disabled = p.gold < healCost() || p.hp >= p.maxHp;

  const preview = buildEnemy(state.enemyIndex);
  const el = document.getElementById("next-enemy-preview");
  el.innerHTML = `Next foe: <span class="name">${preview.emoji} ${preview.name}</span><br>HP ${preview.maxHp} &middot; ATK ${preview.atk}`;
}

function cardEl(card, opts) {
  const div = document.createElement("div");
  div.className = `card ${SUIT_COLOR[card.suit]}`;
  if (opts.selected) div.classList.add("selected");
  if (opts.handRow) div.classList.add("hand-row");
  div.innerHTML = `
    <div class="rank">${rankLabel(card.value)}<br>${SUIT_SYMBOL[card.suit]}</div>
    <div class="suit-big">${SUIT_SYMBOL[card.suit]}</div>
    <div class="rank bottom">${rankLabel(card.value)}<br>${SUIT_SYMBOL[card.suit]}</div>
  `;
  div.addEventListener("click", () => onCardClick(opts.r, opts.c));
  return div;
}

function renderGrid() {
  const gridEl = document.getElementById("grid");
  gridEl.innerHTML = "";
  const bottomRow = GRID_SIZE - 1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const card = state.grid[r][c];
      const selected = !!(state.selected && state.selected.r === r && state.selected.c === c);
      gridEl.appendChild(cardEl(card, { r, c, selected, handRow: r === bottomRow }));
    }
  }

  let label = document.getElementById("hand-label");
  if (!label) {
    label = document.createElement("div");
    label.id = "hand-label";
    label.className = "hand-label";
    label.textContent = "▼ Attack Hand ▼";
    gridEl.parentElement.insertBefore(label, gridEl);
  }

  let preview = document.getElementById("hand-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.id = "hand-preview";
    preview.className = "hand-preview";
    gridEl.parentElement.appendChild(preview);
  }

  const handResult = evaluateHand(state.grid[bottomRow]);
  const suitInfo = dominantSuit(state.grid[bottomRow]);
  const suitNote = suitInfo ? ` &middot; ${SUIT_SYMBOL[suitInfo.suit]} ${suitEffectLabel(suitInfo.suit)}` : "";
  preview.innerHTML = `<strong>${handResult.name}</strong>${suitNote}`;
}

function suitEffectLabel(suit) {
  switch (suit) {
    case "spades": return "Power Strike";
    case "hearts": return "Heal";
    case "diamonds": return "Gold Find";
    case "clubs": return "Guard Up";
    default: return "";
  }
}

function renderBattle() {
  const p = state.player;
  const e = state.enemy;

  document.getElementById("enemy-emoji").textContent = e.emoji;
  document.getElementById("enemy-name").textContent = e.name;
  document.getElementById("enemy-hp-fill").style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;
  document.getElementById("enemy-hp-text").textContent = `${Math.max(0, e.hp)} / ${e.maxHp}`;

  document.getElementById("player-level").textContent = p.level;
  document.getElementById("player-hp-fill").style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  document.getElementById("player-hp-text").textContent = `${Math.max(0, p.hp)} / ${p.maxHp}`;
  document.getElementById("player-gold").textContent = p.gold;
  document.getElementById("player-sword").textContent = p.swordLevel;
  document.getElementById("block-indicator").classList.toggle("hidden", !state.blockActive);

  document.getElementById("swaps-left").textContent = state.swapsLeft;
  document.getElementById("btn-attack").disabled = false;

  renderGrid();
}

/* ============================== Battle Flow ============================== */

function startBattle() {
  state.enemy = buildEnemy(state.enemyIndex);
  state.grid = makeGrid();
  state.selected = null;
  state.swapsLeft = maxSwaps();
  state.blockActive = false;
  showScreen("battle");
  document.getElementById("battle-log").innerHTML = "";
  pushLog("battle-log", `A ${state.enemy.name} appears!`);
  renderBattle();
}

function onCardClick(r, c) {
  if (state.screen !== "battle") return;

  if (!state.selected) {
    state.selected = { r, c };
    renderGrid();
    return;
  }

  if (state.selected.r === r && state.selected.c === c) {
    state.selected = null;
    renderGrid();
    return;
  }

  const dr = Math.abs(state.selected.r - r);
  const dc = Math.abs(state.selected.c - c);
  const adjacent = dr + dc === 1;

  if (!adjacent) {
    state.selected = { r, c };
    renderGrid();
    return;
  }

  if (state.swapsLeft <= 0) {
    state.selected = null;
    renderGrid();
    return;
  }

  const { r: r0, c: c0 } = state.selected;
  const tmp = state.grid[r0][c0];
  state.grid[r0][c0] = state.grid[r][c];
  state.grid[r][c] = tmp;
  state.swapsLeft -= 1;
  state.selected = null;
  renderBattle();
}

function doAttack() {
  if (state.screen !== "battle") return;
  const bottomRow = GRID_SIZE - 1;
  const hand = state.grid[bottomRow];
  const result = evaluateHand(hand);
  const suitInfo = dominantSuit(hand);
  const p = state.player;
  const e = state.enemy;

  let damage = HAND_BASE_DAMAGE[result.rank] * (1 + p.swordLevel * 0.15) + result.kicker * 0.5;
  let effectMsg = "";

  if (suitInfo) {
    switch (suitInfo.suit) {
      case "spades":
        damage *= 1 + suitInfo.count * 0.06;
        effectMsg = ` ${SUIT_SYMBOL.spades} Power Strike boosts the blow!`;
        break;
      case "hearts": {
        const healAmt = Math.round(suitInfo.count * 4 * (1 + p.level * 0.1));
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        effectMsg = ` ${SUIT_SYMBOL.hearts} You recover ${healAmt} HP!`;
        break;
      }
      case "diamonds": {
        const goldAmt = Math.round(suitInfo.count * 5 * (1 + p.level * 0.1));
        p.gold += goldAmt;
        effectMsg = ` ${SUIT_SYMBOL.diamonds} You find ${goldAmt} gold!`;
        break;
      }
      case "clubs":
        state.blockActive = true;
        effectMsg = ` ${SUIT_SYMBOL.clubs} You raise your guard!`;
        break;
    }
  }

  damage *= 0.9 + Math.random() * 0.2;
  damage = Math.max(1, Math.round(damage));

  e.hp -= damage;
  pushLog("battle-log", `You play ${result.name} — ${damage} damage!${effectMsg}`);

  if (e.hp <= 0) {
    pushLog("battle-log", `${e.name} is defeated!`);
    return endBattleVictory();
  }

  const enemyRaw = e.atk * (0.85 + Math.random() * 0.3);
  let enemyDamage = Math.round(enemyRaw);
  if (state.blockActive) {
    enemyDamage = Math.round(enemyDamage * 0.5);
    pushLog("battle-log", `Your guard absorbs some of the blow!`);
  }
  state.blockActive = false;
  p.hp -= enemyDamage;
  pushLog("battle-log", `${e.name} strikes back for ${enemyDamage} damage.`);

  cascadeGrid();

  if (p.hp <= 0) {
    p.hp = 0;
    renderBattle();
    return endGameOver();
  }

  state.swapsLeft = maxSwaps();
  renderBattle();
}

function cascadeGrid() {
  for (let r = GRID_SIZE - 1; r > 0; r--) {
    state.grid[r] = state.grid[r - 1];
  }
  const newRow = [];
  for (let c = 0; c < GRID_SIZE; c++) newRow.push(randomCard());
  state.grid[0] = newRow;
  state.selected = null;
}

function endBattleVictory() {
  const p = state.player;
  const e = state.enemy;
  p.gold += e.gold;
  p.exp += e.exp;

  let leveledUp = false;
  while (p.exp >= p.expToNext) {
    p.exp -= p.expToNext;
    p.level += 1;
    p.maxHp += 15;
    p.hp = p.maxHp;
    p.expToNext = 60 + (p.level - 1) * 40;
    leveledUp = true;
    if (p.level % 3 === 0) p.swordLevel += 1;
  }

  const wasBoss = e.boss && !state.seenVictory;
  state.enemyIndex += 1;

  if (wasBoss) {
    state.seenVictory = true;
    document.getElementById("victory-stats").textContent =
      `Level ${p.level} · ${p.gold} gold earned so far.`;
    showScreen("victory");
    return;
  }

  showScreen("town");
  document.getElementById("town-log").innerHTML = "";
  pushLog("town-log", `Victory! +${e.gold} gold, +${e.exp} exp.`);
  if (leveledUp) pushLog("town-log", `You leveled up! Now level ${p.level}.`);
  renderTown();
}

function endGameOver() {
  document.getElementById("gameover-stats").textContent =
    `You reached level ${state.player.level} with ${state.player.gold} gold.`;
  showScreen("gameover");
}

/* ============================== Menu Actions ============================== */

function newGame() {
  state.player = freshPlayer();
  state.enemyIndex = 0;
  state.seenVictory = false;
  showScreen("town");
  document.getElementById("town-log").innerHTML = "";
  pushLog("town-log", "Your journey begins. Prepare yourself at camp.");
  renderTown();
}

function upgradeSword() {
  const cost = upgradeCost();
  if (state.player.gold < cost) return;
  state.player.gold -= cost;
  state.player.swordLevel += 1;
  pushLog("town-log", `Sword sharpened to Lv.${state.player.swordLevel}!`);
  renderTown();
}

function healAtCamp() {
  const cost = healCost();
  if (state.player.gold < cost || state.player.hp >= state.player.maxHp) return;
  state.player.gold -= cost;
  state.player.hp = state.player.maxHp;
  pushLog("town-log", "You rest and recover fully.");
  renderTown();
}

/* ============================== Wiring ============================== */

document.getElementById("btn-new-game").addEventListener("click", newGame);
document.getElementById("btn-upgrade").addEventListener("click", upgradeSword);
document.getElementById("btn-heal").addEventListener("click", healAtCamp);
document.getElementById("btn-next-battle").addEventListener("click", startBattle);
document.getElementById("btn-attack").addEventListener("click", doAttack);
document.getElementById("btn-restart").addEventListener("click", newGame);
document.getElementById("btn-endless").addEventListener("click", startBattle);

showScreen("title");
