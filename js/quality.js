// Update 8: run analytics, discovery collection and safe presentation utilities.
// Pure helpers do not depend on browser APIs; the game owns their lifecycle.
const discoveryGroups = ["weapons", "evolutions", "enemies", "bosses", "characters"];
const combatSourceKeys = ["arcane", "orbit", "bomb", "chain", "boomerang", "flame", "frost", "nova", "fireball", "flameOrbit", "waterBolt", "tidalWave", "whirlpool", "iceShards", "glacialPulse", "fish", "other"];

function createRunStats() {
  return {
    damageDealt: 0, damageByWeapon: {},
    damageTaken: 0, healing: 0,
    dodges: 0, blocks: 0, criticalHits: 0,
    xpCollected: 0, soulsCollected: 0,
  };
}
function normalizeRunStats(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const safeNumber = (v) => Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v) * 10) / 10) : 0;
  const damageByWeapon = {};
  for (const key of combatSourceKeys) {
    const amount = safeNumber(input.damageByWeapon?.[key]);
    if (amount > 0) damageByWeapon[key] = amount;
  }
  return {
    damageDealt: safeNumber(input.damageDealt),
    damageByWeapon,
    damageTaken: safeNumber(input.damageTaken),
    healing: safeNumber(input.healing),
    dodges: Math.floor(safeNumber(input.dodges)),
    blocks: Math.floor(safeNumber(input.blocks)),
    criticalHits: Math.floor(safeNumber(input.criticalHits)),
    xpCollected: safeNumber(input.xpCollected),
    soulsCollected: Math.floor(safeNumber(input.soulsCollected)),
  };
}
function weaponDamageSource(type, origin) {
  if (origin?.type && combatSourceKeys.includes(origin.type) && origin.type !== "other") return origin.type;
  const mapping = {
    pulse: "nova", blade: "orbit", bomb: "bomb", lightning: "chain",
    chain: "chain", burn: "flame", flame: "flame", frost: "frost",
    boomerang: "boomerang", arcane: "arcane", fish: "fish",
  };
  if (mapping[type]) return mapping[type];
  const source = origin?.type === "orb" ? "arcane" : origin?.type;
  return mapping[source] || (combatSourceKeys.includes(source) ? source : "other");
}
function recordDamage(stats, damageAmount, type, origin, critical = false) {
  if (!stats || !Number.isFinite(damageAmount) || damageAmount <= 0) return;
  const key = weaponDamageSource(type, origin);
  stats.damageDealt += damageAmount;
  stats.damageByWeapon[key] = (stats.damageByWeapon[key] || 0) + damageAmount;
  if (critical) stats.criticalHits++;
}
function formatGameTime(seconds) {
  const whole = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
function numberForDisplay(value) {
  return Math.round(Math.max(0, Number(value) || 0)).toLocaleString("en-US");
}
function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}
function damageLeaderboard(stats, weaponCatalog = []) {
  const display = Object.fromEntries(weaponCatalog.map((weapon) => [weapon.key, weapon.name]));
  display.fish = "Beau's Fish Barrage";
  display.other = "Other";
  return Object.entries(normalizeRunStats(stats).damageByWeapon)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ key, name: display[key] || key, damage: value }));
}
function emptyDiscoveries() {
  return { weapons: [], evolutions: [], enemies: [], bosses: [], characters: [] };
}
function normalizeDiscoveries(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(discoveryGroups.map((group) => [
    group, Array.isArray(source[group])
      ? [...new Set(source[group].filter((item) => typeof item === "string" && item.length <= 80))].slice(0, 100)
      : [],
  ]));
}
function discover(progress, group, id) {
  if (!progress || !discoveryGroups.includes(group) || typeof id !== "string" || !id || id.length > 80) return false;
  if (!progress.discovered) progress.discovered = emptyDiscoveries();
  if (!Array.isArray(progress.discovered[group])) progress.discovered[group] = [];
  if (progress.discovered[group].includes(id)) return false;
  progress.discovered[group].push(id);
  return true;
}
function isDiscovered(progress, group, id) {
  return !!(progress?.discovered?.[group]?.includes(id));
}
function isKnownEnemyType(kind) {
  return Number.isInteger(kind) && [0, 1, 2, 4, 5, 6].includes(kind);
}
function enemyDiscoveryId(kind) {
  return ({ 0: "drifter", 1: "runner", 2: "zombieMike", 4: "shade", 5: "burstling", 6: "bulwark" })[kind] || null;
}
function runSummaryRows(run, catalog = []) {
  const stats = normalizeRunStats(run?.stats);
  const info = [
    ["Time Survived", formatGameTime(run?.survived)],
    ["Kills", numberForDisplay(run?.kills)],
    ["Level", numberForDisplay(run?.level)],
    ["Bosses", numberForDisplay(run?.bosses)],
    ["Evolutions", numberForDisplay(run?.evolutionCount)],
    ["Damage Dealt", numberForDisplay(stats.damageDealt)],
    ["Damage Taken", numberForDisplay(stats.damageTaken)],
    ["Healing", numberForDisplay(stats.healing)],
    ["Dodges", numberForDisplay(stats.dodges)],
    ["Projectiles Blocked", numberForDisplay(stats.blocks)],
    ["Critical Hits", numberForDisplay(stats.criticalHits)],
    ["XP Collected", numberForDisplay(stats.xpCollected)],
  ];
  if (typeof run?.worldBefore === "string") {
    const source = run.worldBefore.toUpperCase();
    const after = (run.worldAfter || run.worldBefore).toUpperCase();
    const element = (run.runElement || "fire").toUpperCase();
    info.unshift(
      ["World Before", source],
      ["Run Element", element],
      ["World Impact", (Math.max(0, Math.min(100, Number(run.worldImpact) || 0))) + "%"],
      ["World After", after]
    );
  }
  return { info, damage: damageLeaderboard(stats, catalog) };
}
