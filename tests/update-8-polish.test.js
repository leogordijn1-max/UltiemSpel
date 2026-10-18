const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
function load(context, file) {
  context.window ??= {};
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}
function evalJSON(context, code) {
  return JSON.parse(vm.runInContext("JSON.stringify(" + code + ")", context));
}
function contextWithStats() {
  const context = vm.createContext({});
  load(context, "js/quality.js");
  return context;
}

test("run statistics initialize with zero counters and no weapon damage", () => {
  const c = contextWithStats();
  assert.deepEqual(evalJSON(c, "createRunStats()"), {
    damageDealt: 0, damageByWeapon: {}, damageTaken: 0, healing: 0,
    dodges: 0, blocks: 0, criticalHits: 0, xpCollected: 0, soulsCollected: 0,
  });
});

test("damage is recorded per existing weapon, with distinct fish and burn sources", () => {
  const c = contextWithStats();
  vm.runInContext(`const stats = createRunStats();
    recordDamage(stats, 28, "lightning", null);
    recordDamage(stats, 11, "direct", {type:"fish"});
    recordDamage(stats, 13, "burn", null);
    recordDamage(stats, 22, "direct", {type:"frost"}, true);
    recordDamage(stats, 17, "blade", null);`, c);
  assert.deepEqual(evalJSON(c, "stats.damageByWeapon"), {
    chain: 28, fish: 11, flame: 13, frost: 22, orbit: 17,
  });
  assert.equal(vm.runInContext("stats.damageDealt", c), 91);
  assert.equal(vm.runInContext("stats.criticalHits", c), 1);
});

test("invalid damage and large over-the-limit values cannot corrupt stats", () => {
  const c = contextWithStats();
  vm.runInContext(`let s = createRunStats();
    recordDamage(s, NaN, "arcane", null);
    recordDamage(s, -10, "bomb", null);
    recordDamage(s, Infinity, "flame", null);`, c);
  assert.equal(vm.runInContext("s.damageDealt", c), 0);
  assert.deepEqual(evalJSON(c, "s.damageByWeapon"), {});
});

test("normalization sanitizes negative or malformed existing run statistics", () => {
  const c = contextWithStats();
  const cleaned = evalJSON(c, `normalizeRunStats({
    damageDealt: -2, damageTaken: "45.3", healing: -10,
    dodges: 2.9, blocks: 4, criticalHits: 0, xpCollected: "abc",
    damageByWeapon: {arcane: 123.34, bogus: 999, nova: -1}
  })`);
  assert.equal(cleaned.damageDealt, 0);
  assert.equal(cleaned.damageTaken, 45.3);
  assert.equal(cleaned.dodges, 2);
  assert.equal(cleaned.blocks, 4);
  assert.deepEqual(cleaned.damageByWeapon, { arcane: 123.3 });
  assert.equal(cleaned.xpCollected, 0);
});

test("damage leaderboard ranks real weapon damage and has friendly display names", () => {
  const c = contextWithStats();
  const entries = evalJSON(c, `damageLeaderboard({
    damageByWeapon: {fish: 20, arcane: 120, bomb: 40, other: 0}
  }, [{key:"arcane", name:"Arcane Bolt"}, {key:"bomb", name:"Eiad Bom"}])`);
  assert.deepEqual(entries.map((entry) => entry.name), ["Arcane Bolt", "Eiad Bom", "Beau's Fish Barrage"]);
  assert.deepEqual(entries.map((entry) => entry.damage), [120, 40, 20]);
});

test("first-time discoveries are idempotent and grouped", () => {
  const c = contextWithStats();
  vm.runInContext(`let progress = {discovered: emptyDiscoveries()};`, c);
  assert.equal(vm.runInContext("discover(progress,'bosses','beau')",c),true);
  assert.equal(vm.runInContext("discover(progress,'bosses','beau')",c),false);
  assert.equal(vm.runInContext("discover(progress,'unknown','oops')",c),false);
  assert.equal(vm.runInContext("isDiscovered(progress,'bosses','beau')",c),true);
  assert.equal(vm.runInContext("isDiscovered(progress,'bosses','final')",c),false);
  assert.deepEqual(evalJSON(c, "progress.discovered.bosses"), ["beau"]);
});

test("discoveries are normalized from partially corrupted old saved data", () => {
  const c = contextWithStats();
  const result = evalJSON(c, `normalizeDiscoveries({
    enemies: ["shade", "shade", 123, null, "drifter"],
    bosses: ["beau", "final"],
    weapons: false
  })`);
  assert.deepEqual(result.enemies, ["shade", "drifter"]);
  assert.deepEqual(result.bosses, ["beau", "final"]);
  assert.deepEqual(result.weapons, []);
  assert.deepEqual(result.evolutions, []);
});

test("enemy discovery IDs match the six catalog entries", () => {
  const c = contextWithStats();
  assert.deepEqual(evalJSON(c, "[0,1,2,4,5,6].map(enemyDiscoveryId)"),
    ["drifter", "runner", "zombieMike", "shade", "burstling", "bulwark"]);
  assert.equal(vm.runInContext("enemyDiscoveryId(3)", c), null);
  assert.equal(vm.runInContext("isKnownEnemyType(6)", c), true);
});

test("time and number formatting remain safe with legacy and invalid records", () => {
  const c = contextWithStats();
  assert.equal(vm.runInContext("formatGameTime(1531.9)", c), "25:31");
  assert.equal(vm.runInContext("formatGameTime(-50)", c), "0:00");
  assert.equal(vm.runInContext("formatGameTime('not a number')", c), "0:00");
  assert.equal(vm.runInContext("numberForDisplay(-3)", c), "0");
});

test("HTML-unsafe text is escaped before any templating", () => {
  const c = contextWithStats();
  assert.equal(vm.runInContext("htmlEscape('<script>\"hello\" & goodbye</script>')", c),
    "&lt;script&gt;&quot;hello&quot; &amp; goodbye&lt;/script&gt;");
});

test("new saves retain discoveries and weapon damage from each run", () => {
  const saved = JSON.stringify({
    points: 16, version: 3, discoveries: "legacy",
    discovered: {enemies:["drifter"], bosses:["beau"]},
    runs: [{
      id:"run-test-1", survived: 1500, kills: 220, level: 24, bosses: 4,
      difficulty:"normal", mode:"standard", character:"beau",
      weapons:["arcane","frost","bomb"], evolutionCount: 2,
      stats: {damageDealt:1000, damageByWeapon:{arcane:400,frost:300,bomb:300}, dodges:5}
    }],
  });
  const context = vm.createContext({ localStorage: {getItem:()=>saved,setItem:()=>{}} });
  load(context,"js/quality.js");
  load(context,"js/storage.js");
  const state = evalJSON(context,"loadMetaProgress()");
  assert.equal(state.points,16);
  assert.deepEqual(state.discovered.enemies,["drifter"]);
  assert.deepEqual(state.discovered.bosses,["beau"]);
  assert.deepEqual(state.runs[0].weapons,["arcane","frost","bomb"]);
  assert.equal(state.runs[0].evolutionCount,2);
  assert.equal(state.runs[0].stats.damageDealt,1000);
  assert.equal(state.runs[0].stats.dodges,5);
});

test("old runs without damage logging show as legacy, not fabricated combat numbers", () => {
  const saved=JSON.stringify({version: 2, points:3, runs:[
    {survived: 600,kills:22,level:9,bosses:1,difficulty:"normal"}
  ]});
  const c=vm.createContext({localStorage:{getItem:()=>saved,setItem:()=>{}}});
  load(c,"js/quality.js");load(c,"js/storage.js");
  const progress=evalJSON(c,"loadMetaProgress()");
  assert.equal(progress.runs[0].stats, null);
  assert.equal(progress.runs[0].survived, 600);
});

test("recordRun saves tracked damage and evolution count without duplicating run records", () => {
  const c = vm.createContext({
    notify:()=>{},localStorage:{getItem:()=>null,setItem:()=>{}},
  });
  load(c,"js/quality.js");
  load(c,"js/storage.js");
  vm.runInContext(`let metaProgress=loadMetaProgress(),runRecorded=false,time=800,kills=200,
    level=18,bossesDefeated=3,difficulty='normal',runMode='standard',runDamageTaken=16,
    selectedCharacter='survivor',selectedWeapons=['arcane','orbit','nova'],
    evolutions={aegisRing:true},runStats=createRunStats(),victoryClaimed=false;
    runStats.damageDealt=1500;runStats.damageByWeapon.arcane=900;runStats.damageByWeapon.orbit=600;
    runStats.damageTaken=16;`,c);
  load(c,"js/progression.js");
  vm.runInContext("recordRun();recordRun();",c);
  const progress=evalJSON(c,"metaProgress");
  assert.equal(progress.totals.runs,1);
  assert.equal(progress.runs.length,1);
  assert.equal(progress.runs[0].evolutionCount,1);
  assert.equal(progress.runs[0].stats.damageByWeapon.arcane,900);
  assert.equal(progress.runs[0].stats.damageTaken,16);
});

test("encounters, evolutions and characters are all discoverable", () => {
  const c=contextWithStats();
  load(c,"js/enemies.js");
  load(c,"js/upgrades.js");
  load(c,"js/characters.js");
  assert.equal(vm.runInContext("enemyCatalog.length",c), 6);
  assert.equal(vm.runInContext("bossCatalog.length",c), 4);
  assert.equal(vm.runInContext("evolutionRecipes.length",c),15);
  assert.equal(vm.runInContext("characterCatalog.length",c),4);
  assert.equal(vm.runInContext("weaponCatalog.length",c),15);
});

test("important sounds exist alongside per-effect spam protection", () => {
  const c=vm.createContext({storageNumber:()=>0.25,storageGet:()=>false,window:{}});
  load(c,"js/audio.js");
  assert.equal(vm.runInContext("soundPresets.victory.length",c),3);
  assert.equal(vm.runInContext("soundPresets.evolution.length",c),3);
  assert.equal(vm.runInContext("soundPresets.boss.length",c),3);
  assert.equal(vm.runInContext("soundPresets.lightning.length",c),3);
  assert.equal(vm.runInContext("soundPresets.fish.length",c),3);
});
