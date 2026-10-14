// Playable characters, long-term unlocks and the permanent store.
// This file is intentionally independent of the Canvas and browser DOM.
const characterCatalog = [
  {
    id: "survivor", name: "The Survivor", image: "",
    ability: "Soul Rush", unlock: "Available immediately",
    description: "Every 20 kills, gain a short burst of movement speed.",
    accent: "#f0e4c8",
  },
  {
    id: "zombieMike", name: "Zombie Mike", image: "img/ZombieMike.png",
    ability: "Undead Rage", unlock: "Achievement: Boss Hunter (3 lifetime bosses)",
    description: "Below 45% HP, deal 17% extra damage. Slightly tougher but slower.",
    accent: "#a6df82",
  },
  {
    id: "beau", name: "Beau de Hond", image: "img/BeauDeHond.png",
    ability: "Fish Barrage", unlock: "Boss trophy: defeat Beau de Hond",
    description: "Automatically shoots a small MarioVis volley every 12 seconds. No extra weapon slot.",
    accent: "#ffbf9a",
  },
  {
    id: "mayoMaster", name: "The Mayo Master", image: "img/EmmerMayo.png",
    ability: "Mayo Madness", unlock: "Buy in the Characters shop (24 points)",
    description: "Every 25 kills, temporarily gain 15% damage. Reduced starting HP.",
    accent: "#f4e2a0",
  },
];

const cosmeticCatalog = [
  { id: "classic", name: "Classic", cost: 0, color: "#f1e6cb", glow: "#d7c49b", description: "Original survivor colors." },
  { id: "neon", name: "Neon Mayhem", cost: 8, color: "#8ff8f6", glow: "#47dadf", description: "Electric-cyan player aura." },
  { id: "gold", name: "Golden Survivor", cost: 14, color: "#ffe3a0", glow: "#ffbf4f", description: "Golden glow and highlights." },
  { id: "void", name: "Void Walker", cost: 20, color: "#d7a6ff", glow: "#a462ee", description: "Purple shadow aura.", requirement: "finalVictory" },
];

const statShopCatalog = [
  { id: "hpLevel", name: "Starting Health +8", description: "8 extra starting HP per level.", baseCost: 2, max: 5 },
  { id: "damageLevel", name: "Starting Damage +~10%", description: "Roughly 10% global starting damage per level.", baseCost: 3, max: 5 },
  { id: "speedLevel", name: "Quick Feet +2%", description: "2% extra movement per level, up to 6%.", baseCost: 5, max: 3 },
  { id: "magnetLevel", name: "Soul Reach +12", description: "12 pixels of extra XP pickup range per level.", baseCost: 4, max: 3 },
  { id: "xpLevel", name: "Soul Study +2%", description: "2% more XP from each pickup per level.", baseCost: 5, max: 3 },
  { id: "dashLevel", name: "Dash Training -0.2s", description: "Reduce dash cooldown by 0.2 seconds per level.", baseCost: 5, max: 3 },
];

const masteryCatalog = [
  { id: "arcane", name: "Arcane Bolt" },
  { id: "orbit", name: "Spirit Blades" },
  { id: "bomb", name: "Eiad Bom" },
  { id: "chain", name: "Chain Lightning" },
  { id: "boomerang", name: "Boomerang" },
  { id: "flame", name: "Flame Cone" },
  { id: "frost", name: "Frost Orb" },
  { id: "nova", name: "Death Pulse" },
];

function getCharacter(id) {
  return characterCatalog.find((character) => character.id === id) || characterCatalog[0];
}

function hasAchievement(progress, id) {
  return Array.isArray(progress?.achievements) && progress.achievements.some((entry) => entry.id === id);
}

function isCharacterUnlocked(progress, id) {
  if (id === "survivor") return true;
  if (id === "zombieMike") return hasAchievement(progress, "boss3") || (progress?.totals?.bosses || 0) >= 3;
  if (id === "beau") return Array.isArray(progress?.bossLoot) && progress.bossLoot.includes("beau");
  if (id === "mayoMaster") return Array.isArray(progress?.ownedCharacters) && progress.ownedCharacters.includes("mayoMaster");
  return false;
}

function isMasteryOwned(progress, weaponKey) {
  return Array.isArray(progress?.weaponMasteries) && progress.weaponMasteries.includes(weaponKey);
}

function isCosmeticOwned(progress, cosmeticId) {
  return cosmeticId === "classic" || (Array.isArray(progress?.cosmetics) && progress.cosmetics.includes(cosmeticId));
}

function shopStatCost(stat, level) {
  return stat.baseCost + Math.max(0, level) * Math.max(1, Math.ceil(stat.baseCost * 0.5));
}

function shopEntries(category) {
  if (category === "Stats") return statShopCatalog.map((item) => ({ ...item, kind: "stat" }));
  if (category === "Characters") return [{
    id: "mayoMaster", kind: "character", name: "The Mayo Master",
    description: "Unlock Mayo Madness and a unique playable meme character.", cost: 24,
  }];
  if (category === "Weapons") return masteryCatalog.map((item) => ({
    id: item.id, kind: "mastery", name: item.name + " Mastery",
    description: "Begin a run at weapon level 2 when this is your chosen start weapon (still uses one slot).",
    cost: ["bomb", "nova", "chain"].includes(item.id) ? 18 : 14,
  }));
  if (category === "Cosmetics") return cosmeticCatalog.filter((item) => item.id !== "classic").map((item) => ({
    ...item, kind: "cosmetic",
  }));
  return [];
}

function shopEntryStatus(progress, item) {
  if (!item || !Number.isFinite(progress?.points)) return { state: "unavailable", cost: Infinity };
  if (item.kind === "stat") {
    const level = Math.max(0, Math.floor(progress[item.id] || 0));
    return { state: level >= item.max ? "maxed" : "available", cost: shopStatCost(item, level), level };
  }
  const alreadyOwned = item.kind === "character" ? isCharacterUnlocked(progress, item.id)
    : item.kind === "mastery" ? isMasteryOwned(progress, item.id)
      : item.kind === "cosmetic" ? isCosmeticOwned(progress, item.id) : false;
  if (alreadyOwned) return { state: "owned", cost: 0 };
  if (item.requirement && !hasAchievement(progress, item.requirement)) return { state: "locked", cost: item.cost };
  return { state: "available", cost: item.cost };
}

// Pure purchase function: all mutations happen only after validation succeeds.
function purchaseShopEntry(progress, item) {
  const status = shopEntryStatus(progress, item);
  if (status.state !== "available") return false;
  if (!Number.isFinite(status.cost) || progress.points < status.cost) return false;
  if (item.kind === "stat") progress[item.id] = (status.level || 0) + 1;
  else {
    const key = item.kind === "character" ? "ownedCharacters"
      : item.kind === "mastery" ? "weaponMasteries" : "cosmetics";
    if (!Array.isArray(progress[key])) progress[key] = [];
    progress[key].push(item.id);
  }
  progress.points -= status.cost;
  return true;
}

function equipCosmetic(progress, cosmeticId) {
  if (!cosmeticCatalog.some((cosmetic) => cosmetic.id === cosmeticId) || !isCosmeticOwned(progress, cosmeticId)) return false;
  progress.selectedCosmetic = cosmeticId;
  return true;
}

// The first kill of each named boss earns its own collectible trophy.
// Beating Beau also unlocks the playable Beau, even when no shop points are spent.
function awardBossLoot(progress, bossId) {
  if (!["beau", "mourning", "bell", "final"].includes(bossId)) return { first: false, points: 0 };
  if (!Array.isArray(progress.bossLoot)) progress.bossLoot = [];
  if (progress.bossLoot.includes(bossId)) return { first: false, points: 0 };
  progress.bossLoot.push(bossId);
  const points = bossId === "final" ? 0 : 2;
  progress.points += points;
  return { first: true, points, characterUnlocked: bossId === "beau" ? "beau" : null };
}

function makeCharacterRuntime() {
  return { killStreak: 0, procCooldown: 0, activeBoost: 0, fishCooldown: 8 };
}

// These functions remain playable without an extra weapon slot.
function characterMovementMultiplier(id, runtime, hp, maxHp) {
  if (id === "survivor" && runtime.activeBoost > 0) return 1.25;
  if (id === "beau") return 1.05;
  if (id === "zombieMike") return 0.97;
  return 1;
}
function characterDamageMultiplier(id, runtime, hp, maxHp) {
  if (id === "zombieMike" && maxHp > 0 && hp <= maxHp * 0.45) return 1.17;
  if (id === "mayoMaster") return runtime.activeBoost > 0 ? 1.15 : 1;
  return 1;
}

function progressCharacterKills(id, runtime, amount = 1) {
  if ((id !== "survivor" && id !== "mayoMaster") || !runtime) return false;
  runtime.killStreak += Math.max(0, amount);
  const threshold = id === "survivor" ? 20 : 25;
  if (runtime.killStreak < threshold || runtime.procCooldown > 0) return false;
  runtime.killStreak -= threshold;
  runtime.activeBoost = id === "survivor" ? 3 : 4;
  runtime.procCooldown = id === "survivor" ? 10 : 14;
  return true;
}
function updateCharacterTimers(runtime, dt) {
  runtime.procCooldown = Math.max(0, runtime.procCooldown - dt);
  runtime.activeBoost = Math.max(0, runtime.activeBoost - dt);
  runtime.fishCooldown = Math.max(0, runtime.fishCooldown - dt);
}
