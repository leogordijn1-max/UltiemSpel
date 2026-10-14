// Safe, versioned localStorage access shared by the game and its menus.
const SAVE_VERSION = 3;

function storageGet(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

function storageNumber(key, fallback, min = -Infinity, max = Infinity) {
  const value = Number(storageGet(key, fallback));
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function grantAchievement(progress, id, title, date = new Date().toLocaleDateString()) {
  if (!Array.isArray(progress.achievements)) progress.achievements = [];
  if (!progress.achievements.some((entry) => entry.id === id)) {
    progress.achievements.push({ id, title, date });
    return true;
  }
  return false;
}

function emptyModeRecords() {
  return {
    standard: { easy: {}, normal: {}, nightmare: {} },
    endless: { easy: {}, normal: {}, nightmare: {} },
  };
}
function normalizeModeRecord(record) {
  const source = record && typeof record === "object" ? record : {};
  return {
    survived: nonNegativeInteger(source.survived),
    kills: nonNegativeInteger(source.kills),
    bosses: nonNegativeInteger(source.bosses),
    wins: nonNegativeInteger(source.wins),
  };
}
function updateModeRecord(progress, mode, difficulty, snapshot, isWin = false) {
  const key = mode === "endless" ? "endless" : "standard";
  const levelKey = ["easy", "normal", "nightmare"].includes(difficulty) ? difficulty : "normal";
  if (!progress.records) progress.records = emptyModeRecords();
  const previous = normalizeModeRecord(progress.records[key]?.[levelKey]);
  const incoming = normalizeModeRecord(snapshot);
  progress.records[key][levelKey] = {
    survived: Math.max(previous.survived, incoming.survived),
    kills: Math.max(previous.kills, incoming.kills),
    bosses: Math.max(previous.bosses, incoming.bosses),
    wins: previous.wins + (isWin ? 1 : 0),
  };
  return progress.records[key][levelKey];
}

function loadMetaProgress() {
  let saved = {};
  try {
    saved = JSON.parse(storageGet("shadowProgress", "{}") || "{}") || {};
  } catch {
    saved = {};
  }
  if (typeof saved !== "object" || Array.isArray(saved)) saved = {};

  const achievements = Array.isArray(saved.achievements)
    ? [...new Map(saved.achievements
      .filter((entry) => entry && typeof entry.id === "string")
      .map((entry) => [entry.id, {
        id: entry.id,
        title: typeof entry.title === "string" ? entry.title : entry.id,
        date: typeof entry.date === "string" ? entry.date : "",
      }])).values()]
    : [];
  const runs = Array.isArray(saved.runs)
    ? saved.runs.filter((run) => run && typeof run === "object").map((run) => ({
      survived: nonNegativeInteger(run.survived),
      kills: nonNegativeInteger(run.kills),
      level: Math.max(1, nonNegativeInteger(run.level)),
      bosses: nonNegativeInteger(run.bosses),
      difficulty: ["easy", "normal", "nightmare"].includes(run.difficulty) ? run.difficulty : "normal",
      mode: run.mode === "endless" ? "endless" : "standard",
      character: ["survivor", "zombieMike", "beau", "mayoMaster"].includes(run.character) ? run.character : "survivor",
      victory: run.victory === true,
      id: typeof run.id === "string" ? run.id.slice(0, 80) : "",
    })).sort((a, b) => b.survived - a.survived).slice(0, 30)
    : [];
  const totals = saved.totals && typeof saved.totals === "object" ? saved.totals : {};
  const records = emptyModeRecords();
  for (const mode of ["standard", "endless"]) {
    for (const difficulty of ["easy", "normal", "nightmare"]) {
      records[mode][difficulty] = normalizeModeRecord(saved.records?.[mode]?.[difficulty]);
    }
  }
  // Old saves had a top-run list, but no per-mode record data.
  if (!saved.records) {
    for (const run of runs) {
      const rec = records[run.mode][run.difficulty];
      rec.survived = Math.max(rec.survived, run.survived);
      rec.kills = Math.max(rec.kills, run.kills);
      rec.bosses = Math.max(rec.bosses, run.bosses);
    }
  }
  const wins = nonNegativeInteger(totals.wins);
  const statPurchaseCosts = {};
  for (const [key, max, legacyCost] of [
    ["hpLevel", 5, 2], ["damageLevel", 5, 3],
    ["speedLevel", 3, 5], ["magnetLevel", 3, 4], ["xpLevel", 3, 5], ["dashLevel", 3, 5],
  ]) {
    const level = Math.min(max, nonNegativeInteger(saved[key]));
    const savedPrices = Array.isArray(saved.statPurchaseCosts?.[key]) ? saved.statPurchaseCosts[key] : [];
    statPurchaseCosts[key] = Array.from({ length: level }, (_, i) => {
      const value = Number(savedPrices[i]);
      return Number.isFinite(value) && value >= 0 ? Math.min(1000, Math.floor(value)) : legacyCost;
    });
  }
  return {
    version: SAVE_VERSION,
    points: nonNegativeInteger(saved.points),
    hpLevel: Math.min(5, nonNegativeInteger(saved.hpLevel)),
    damageLevel: Math.min(5, nonNegativeInteger(saved.damageLevel)),
    achievements,
    runs,
    records,
    endlessUnlocked: saved.endlessUnlocked === true || wins > 0,
    statPurchaseCosts,
    speedLevel: Math.min(3, nonNegativeInteger(saved.speedLevel)),
    magnetLevel: Math.min(3, nonNegativeInteger(saved.magnetLevel)),
    xpLevel: Math.min(3, nonNegativeInteger(saved.xpLevel)),
    dashLevel: Math.min(3, nonNegativeInteger(saved.dashLevel)),
    // Existing characters and weapons are never removed when saves are migrated.
    ownedCharacters: [...new Set((Array.isArray(saved.ownedCharacters) ? saved.ownedCharacters : [])
      .filter((id) => id === "mayoMaster"))],
    weaponMasteries: [...new Set((Array.isArray(saved.weaponMasteries) ? saved.weaponMasteries : [])
      .filter((id) => ["arcane", "orbit", "bomb", "chain", "boomerang", "flame", "frost", "nova"].includes(id)))],
    bossLoot: [...new Set((Array.isArray(saved.bossLoot) ? saved.bossLoot : [])
      .filter((id) => ["beau", "mourning", "bell", "final"].includes(id)))],
    cosmetics: [...new Set(["classic", ...(Array.isArray(saved.cosmetics) ? saved.cosmetics : [])
      .filter((id) => ["neon", "gold", "void"].includes(id))])],
    selectedCosmetic: ["classic", "neon", "gold", "void"].includes(saved.selectedCosmetic) &&
      (saved.selectedCosmetic === "classic" || (Array.isArray(saved.cosmetics) && saved.cosmetics.includes(saved.selectedCosmetic)))
      ? saved.selectedCosmetic : "classic",
    bestFlawlessSurvival: nonNegativeInteger(saved.bestFlawlessSurvival),
    totals: {
      kills: nonNegativeInteger(totals.kills),
      bosses: nonNegativeInteger(totals.bosses),
      runs: nonNegativeInteger(totals.runs),
      wins,
    },
  };
}

function saveMetaProgress() {
  try {
    metaProgress.version = SAVE_VERSION;
    return storageSet("shadowProgress", JSON.stringify(metaProgress));
  } catch {
    return false;
  }
}
