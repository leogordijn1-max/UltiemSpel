// Shared catalog drives weapon selection, upgrade choices, and the encyclopedia.
const weaponCatalog = [
  { key: "arcane", name: "Arcane Bolt", image: "", description: "Automatically fires bolts at nearby enemies.", damage: "14 per bolt", cooldown: "0.95s", evolution: "Level 5 + Phantom Shots level 3 + one boss defeated → Split Dimension" },
  { key: "orbit", name: "Spirit Blades", image: "", description: "Blades orbit the player, damaging enemies and intercepting hostile shots.", damage: "38 on contact", cooldown: "Continuous", evolution: "Level 5 + Ward Blades level 3 + one boss defeated → Aegis Ring" },
  { key: "bomb", name: "Eiad Bom", image: "img/EiadBom.png", description: "Drops a delayed bomb that deals heavy area damage.", damage: "85 base; reduced vs bosses", cooldown: "12s", evolution: "Level 5 + Emmer Mayo level 3 + one boss defeated → Mega Eiad" },
  { key: "chain", name: "Chain Lightning", image: "", description: "Lightning jumps between enemies within a shorter range.", damage: "31 base", cooldown: "~5.6s", evolution: "Level 5 + Emmer Mayo level 3 + one boss defeated → Tempest" },
  { key: "boomerang", name: "Boomerang", image: "", description: "A returning blade pierces enemies on its outbound and return path.", damage: "36 base", cooldown: "5.5s", evolution: "Level 5 + Phantom Shots level 3 + one boss defeated → Returning Storm" },
  { key: "flame", name: "Flame Cone", image: "", description: "A close-range cone burns groups of enemies and applies damage over time.", damage: "55 base + burn", cooldown: "4.45s", evolution: "Level 5 + Emmer Mayo level 3 + one boss defeated → Inferno" },
  { key: "frost", name: "Frost Orb", image: "", description: "Homing orbs burst into a chilling area that slows groups.", damage: "40 + area burst", cooldown: "3.75s", evolution: "Level 5 + Critical Force level 3 + one boss defeated → Glacier" },
  { key: "nova", name: "Death Pulse", image: "", description: "Periodically damages nearby enemies and can slow them.", damage: "33 base", cooldown: "2.5s", evolution: "No weapon evolution; Expanding Aura and Chilling Pulse improve its area." },
];

const opts = [
  ["arcane", "Arcane Bolt", "Fire additional bolts. Works with Phantom Shots."],
  ["orbit", "Spirit Blades", "Add an orbiting blade that damages enemies and can intercept shots."],
  ["bomb", "Eiad Bom", "Increase Eiad Bom damage and blast radius. Damage is reduced against bosses. Cooldown: 12 seconds."],
  ["chain", "Chain Lightning", "Lightning hits up to 2 + half your level in nearby targets. Attacks faster, but chains over a shorter range."],
  ["boomerang", "Boomerang", "A returning blade pierces enemies along its path."],
  ["flame", "Flame Cone", "Blast a wide close-range cone and burn enemies for extra damage."],
  ["frost", "Frost Orb", "Homing orbs damage and chill a group, slowing them for several seconds."],
  ["nova", "Death Pulse", "Unlock a periodic area attack around the player."],
  ["damage", "Emmer Mayo", "Increase all weapon damage by 22% per level."],
  ["speed", "Quickstep", "Move 12% faster per level; levels 3–5 add a small chance to dodge hits."],
  ["rate", "Rapid Casting", "Attack cooldowns are 13% shorter per level."],
  ["magnet", "Soul Magnet", "Increase pickup reach by 55 per level; levels 3–5 also grant up to 18% more XP."],
  ["critChance", "Critical Eye", "Increase critical chance by 5 points per level; levels 3–5 also strengthen critical damage."],
  ["critDamage", "Critical Force", "Increase critical hit damage by 25% per level."],
  ["knockback", "Heavy Impact", "Increase knockback by 20% per level; level 3+ briefly slows regular enemies you hit."],
  ["health", "Vitality", "Add 40 maximum health and regenerate 1.2 health per second per level."],
  ["pierce", "Phantom Shots", "Arcane bolts and Boomerangs pierce one additional enemy."],
  ["bladeBlock", "Ward Blades", "Spirit Blades gain 16 points of projectile block chance per level, with extra protection at levels 3–5."],
  ["bladeSize", "Titan Blades", "Increase Spirit Blade size by 30% per level."],
  ["novaRange", "Expanding Aura", "Increase Death Pulse radius by 25% per level."],
  ["novaSlow", "Chilling Pulse", "Slow enemies inside Death Pulse by 11 percentage points per level."],
];

const evolutionRecipes = [
  { id: "tempest", name: "Tempest", weapon: "chain", support: "damage", supportName: "Emmer Mayo", level: 5, supportLevel: 3, visual: "A storm of branching violet lightning." },
  { id: "returningStorm", name: "Returning Storm", weapon: "boomerang", support: "pierce", supportName: "Phantom Shots", level: 5, supportLevel: 3, visual: "Three teal spectral blades orbit and return." },
  { id: "inferno", name: "Inferno", weapon: "flame", support: "damage", supportName: "Emmer Mayo", level: 5, supportLevel: 3, visual: "A triple-lobed crimson flame wave." },
  { id: "glacier", name: "Glacier", weapon: "frost", support: "critDamage", supportName: "Critical Force", level: 5, supportLevel: 3, visual: "A crystalline ice nova leaves a snowflake field." },
  { id: "splitDimension", name: "Split Dimension", weapon: "arcane", support: "pierce", supportName: "Phantom Shots", level: 5, supportLevel: 3, visual: "Cyan rift bolts split into spectral shards." },
  { id: "aegisRing", name: "Aegis Ring", weapon: "orbit", support: "bladeBlock", supportName: "Ward Blades", level: 5, supportLevel: 3, visual: "A radiant cyan shield ring surrounds the player." },
  { id: "megaEiad", name: "Mega Eiad", weapon: "bomb", support: "damage", supportName: "Emmer Mayo", level: 5, supportLevel: 3, visual: "A purple-starburst blast expands from the original bomb." },
];

function maxUpgradeLevel(key) { return key === "nova" ? 1 : 5; }
function globalDamageMultiplier() {
  return 1 + (upgrades.damage || 0) * 0.22 + (typeof permanentDamageBonus === "number" ? permanentDamageBonus : 0);
}
function calculateBombDamage(level, damageMultiplier, evolved = false, againstBoss = false) {
  return 85 * (1 + (level - 1) * 0.2) * damageMultiplier * (evolved ? 1.25 : 1) * (againstBoss ? 0.42 : 1);
}
function makeStartingWeaponLevels(startKey) {
  return Object.fromEntries(weaponCatalog.map((weapon) => [weapon.key, weapon.key === startKey ? 1 : 0]));
}
function isWeaponKey(key) { return weaponCatalog.some((weapon) => weapon.key === key); }
function isWeaponUnlocked(key) {
  if (Array.isArray(unlockedWeapons)) return unlockedWeapons.includes(key);
  return typeof selectedWeapons !== "undefined" && selectedWeapons.includes(key);
}
function evolutionForWeapon(key) { return evolutionRecipes.find((recipe) => recipe.weapon === key); }
function weaponIsEvolved(key) {
  const recipe = evolutionForWeapon(key);
  return !!(recipe && typeof evolutions !== "undefined" && evolutions[recipe.id]);
}
function eligibleEvolutions() {
  if (typeof bossesDefeated === "undefined" || bossesDefeated < 1 || typeof evolutions === "undefined") return [];
  return evolutionRecipes.filter((recipe) =>
    isWeaponUnlocked(recipe.weapon) && !evolutions[recipe.id] &&
    (upgrades[recipe.weapon] || 0) >= recipe.level && (upgrades[recipe.support] || 0) >= recipe.supportLevel,
  );
}
function eligibleUpgrade(key) {
  if ((upgrades[key] || 0) >= maxUpgradeLevel(key)) return false;
  if (isWeaponKey(key)) {
    if (!selectedWeapons.includes(key) || weaponIsEvolved(key)) return false;
    return !isWeaponUnlocked(key) ? (upgrades[key] || 0) === 0 : true;
  }
  if ((key === "novaRange" || key === "novaSlow") && !isWeaponUnlocked("nova")) return false;
  if ((key === "bladeSize" || key === "bladeBlock") && (!isWeaponUnlocked("orbit") || weaponIsEvolved("orbit"))) return false;
  if (key === "pierce" && !["arcane", "boomerang"].some((weapon) => isWeaponUnlocked(weapon) && !weaponIsEvolved(weapon))) return false;
  return true;
}
function upgradeCategory(key) {
  return weaponCatalog.some((weapon) => weapon.key === key) ? "WEAPON" :
    ["pierce", "bladeBlock", "bladeSize", "novaRange", "novaSlow"].includes(key) ? "WEAPON SUPPORT" : "PASSIVE";
}
function upgradeImage(key) {
  if (key === "damage") return "img/EmmerMayo.png";
  if (key === "bomb") return "img/EiadBom.png";
  return weaponCatalog.find((weapon) => weapon.key === key)?.image || "";
}
function makeUpgradeChoice(option, { levels = 1, rare = false } = {}) {
  const [key, name, description] = option;
  const oldLevel = Math.floor(upgrades[key] || 0);
  const unlocking = isWeaponKey(key) && !isWeaponUnlocked(key);
  const newLevel = unlocking ? 1 : Math.min(maxUpgradeLevel(key), oldLevel + Math.floor(levels));
  const image = upgradeImage(key);
  const recipe = evolutionForWeapon(key);
  const evolutionHint = recipe
    ? `<small>Evolution: level ${recipe.level} + ${recipe.supportName} level ${recipe.supportLevel} + defeat a boss → ${recipe.name}</small>`
    : "";
  const button = document.createElement("button");
  button.className = "choice";
  button.innerHTML = `${image ? `<img class="choice-art" src="${image}" alt="">` : ""}<small class="choice-category">${unlocking ? "WEAPON UNLOCK" : upgradeCategory(key)}${rare ? " · BOSS REWARD" : ""}</small><b>${name}</b><small>${unlocking ? `Unlock ${name} and activate it at level 1.` : description}</small><small>${name} — ${unlocking ? "LOCKED" : `Level ${oldLevel}`} → Level ${newLevel}</small>${evolutionHint}`;
  button.onclick = () => {
    if (unlocking && !unlockedWeapons.includes(key)) unlockedWeapons.push(key);
    upgrades[key] = newLevel;
    if (key === "health") player.maxHp += 40 * (newLevel - oldLevel);
    finishUpgradeChoice(rare);
  };
  return button;
}

function finishUpgradeChoice(rare) {
  if (rare) {
    paused = false;
    $("overlay").style.display = "none";
    if (pendingLevelUps > 0) choices();
    else if (eligibleEvolutions().length) showEvolutionOffer(eligibleEvolutions());
  } else {
    pendingLevelUps--;
    if (pendingLevelUps > 0) choices();
    else if (eligibleEvolutions().length) showEvolutionOffer(eligibleEvolutions());
    else { paused = false; $("overlay").style.display = "none"; }
  }
}

function finishEvolutionChoice({ rare = false, consumeLevel = true } = {}) {
  if (rare) {
    paused = false;
    $("overlay").style.display = "none";
    if (pendingLevelUps > 0) choices();
    return;
  }
  if (consumeLevel) pendingLevelUps--;
  if (pendingLevelUps > 0) choices();
  else if (eligibleEvolutions().length) showEvolutionOffer(eligibleEvolutions());
  else { paused = false; $("overlay").style.display = "none"; }
}

function showEvolutionOffer(recipes = eligibleEvolutions()) {
  if (!recipes.length) return;
  paused = true;
  panel("EVOLUTION READY", "Your weapon and support have reached their final-form requirements.", (el) => {
    recipes.forEach((recipe) => el.append(makeEvolutionChoice(recipe, { consumeLevel: false })));
  });
}

function evolveWeapon(recipe, { rare = false, consumeLevel = true } = {}) {
  if (!eligibleEvolutions().some((entry) => entry.id === recipe.id)) return false;
  evolutions[recipe.id] = true;
  evolutionFlash = { name: recipe.name, started: time, until: time + 2.4 };
  notify(`WEAPON EVOLVED · ${recipe.name}`, "evolution", 5);
  unlockAchievement("evolution", "First Evolution");
  finishEvolutionChoice({ rare, consumeLevel });
  return true;
}

function makeEvolutionChoice(recipe, { rare = false, consumeLevel = !rare } = {}) {
  const button = document.createElement("button");
  button.className = "choice evolution-choice";
  button.innerHTML = `<small class="choice-category">${rare ? "BOSS TROPHY · " : "EVOLUTION · "}WEAPON COMPLETE</small><b>${recipe.name}</b><small>${weaponCatalog.find((weapon) => weapon.key === recipe.weapon).name} becomes its final form. ${recipe.visual}</small><small>Level ${upgrades[recipe.weapon]}/5 · ${recipe.supportName} level ${upgrades[recipe.support]}/5 · Boss defeated</small>`;
  button.onclick = () => evolveWeapon(recipe, { rare, consumeLevel });
  return button;
}

function chooseWeighted(pool, amount) {
  const remaining = [...pool];
  const result = [];
  while (remaining.length && result.length < amount) {
    const weights = remaining.map(([key]) => isWeaponKey(key)
      ? (isWeaponUnlocked(key) ? 2.3 : 3.6)
      : upgradeCategory(key) === "WEAPON SUPPORT" ? 1.2 : 0.8);
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    while (roll >= weights[index]) roll -= weights[index++];
    result.push(remaining.splice(index, 1)[0]);
  }
  return result;
}

function choices() {
  playSfx("level");
  paused = true;
  const eligible = opts.filter(([key]) => eligibleUpgrade(key));
  const lockedPicks = eligible.filter(([key]) => isWeaponKey(key) && !isWeaponUnlocked(key));
  const evolutionPicks = eligibleEvolutions();
  const regularSlots = evolutionPicks.length ? 2 : 3;
  const pick = lockedPicks.length
    ? [lockedPicks[Math.floor(Math.random() * lockedPicks.length)], ...chooseWeighted(eligible.filter(([key]) => !lockedPicks.some(([lockedKey]) => lockedKey === key)), regularSlots - 1)]
    : chooseWeighted(eligible, regularSlots);
  if (!pick.length && !evolutionPicks.length) {
    pendingLevelUps = 0;
    paused = false;
    $("overlay").style.display = "none";
    return;
  }
  panel("LEVEL " + level, "Unlock one of your chosen weapons or improve your active build.", (el) => {
    if (evolutionPicks.length) el.append(makeEvolutionChoice(evolutionPicks[Math.floor(Math.random() * evolutionPicks.length)]));
    pick.forEach((option) => el.append(makeUpgradeChoice(option)));
  });
}

function showBossReward() {
  const evolutionPicks = eligibleEvolutions();
  const rewards = chooseWeighted(
    opts.filter(([key]) => eligibleUpgrade(key) && (!isWeaponKey(key) || isWeaponUnlocked(key))),
    evolutionPicks.length ? 2 : 3,
  );
  if (!rewards.length && !evolutionPicks.length) { player.hp = Math.min(player.maxHp, player.hp + 35); return; }
  paused = true;
  panel("BOSS TROPHY", "Choose a reward for your current build.", (el) => {
    if (evolutionPicks.length) el.append(makeEvolutionChoice(evolutionPicks[Math.floor(Math.random() * evolutionPicks.length)], { rare: true }));
    rewards.forEach((option) => {
      const key = option[0];
      const amount = isWeaponKey(key) ? 1 : 2;
      el.append(makeUpgradeChoice(option, { levels: amount, rare: true }));
    });
  });
}

function addXP(amount) {
  xp += amount;
  while (xp >= needed) {
    xp -= needed;
    needed = Math.floor(needed * 1.12 + 3.5);
    level++;
    pendingLevelUps++;
  }
  if (pendingLevelUps > 0 && !paused) choices();
}

function bladeScale() { return 1.25 * Math.pow(1.3, upgrades.bladeSize || 0); }
function novaRadius() { return 95 * Math.pow(1.25, upgrades.novaRange || 0); }
