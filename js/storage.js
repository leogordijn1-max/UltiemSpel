// Safe, versioned localStorage access shared by the game and its menus.
const SAVE_VERSION = 2;

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
      difficulty: typeof run.difficulty === "string" ? run.difficulty : "normal",
    })).sort((a, b) => b.survived - a.survived).slice(0, 5)
    : [];
  const totals = saved.totals && typeof saved.totals === "object" ? saved.totals : {};

  return {
    version: SAVE_VERSION,
    points: nonNegativeInteger(saved.points),
    hpLevel: Math.min(5, nonNegativeInteger(saved.hpLevel)),
    damageLevel: Math.min(5, nonNegativeInteger(saved.damageLevel)),
    achievements,
    runs,
    bestFlawlessSurvival: nonNegativeInteger(saved.bestFlawlessSurvival),
    totals: {
      kills: nonNegativeInteger(totals.kills),
      bosses: nonNegativeInteger(totals.bosses),
      runs: nonNegativeInteger(totals.runs),
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
