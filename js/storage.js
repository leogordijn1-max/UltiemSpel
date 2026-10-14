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
  return {
    version: SAVE_VERSION,
    points: nonNegativeInteger(saved.points),
    hpLevel: Math.min(5, nonNegativeInteger(saved.hpLevel)),
    damageLevel: Math.min(5, nonNegativeInteger(saved.damageLevel)),
    achievements,
    runs,
    records,
    endlessUnlocked: saved.endlessUnlocked === true || wins > 0,
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
