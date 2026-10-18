// Boss Isolation 4.4A — run: node --test tests/boss-isolation.test.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/boss-isolation.js"), "utf8");
const gameSource = fs.readFileSync(path.join(__dirname, "../js/game.js"), "utf8");
const enemiesSource = fs.readFileSync(path.join(__dirname, "../js/enemies.js"), "utf8");
const developerSource = fs.readFileSync(path.join(__dirname, "../js/developer-mode.js"), "utf8");
const index = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");

function setup() {
  let gridBuilds = 0, scarResets = 0;
  const context = vm.createContext({
    window: { resetWorldScars() { scarResets++; } },
    enemies: [
      { kind: 0, x: 0, y: 0 },
      { kind: 1, x: 15, y: 15 },
      { kind: 6, elite: true, x: 35, y: 25 },
    ],
    enemyShots: [{type: "shade"}],
    bossShots: [{type: "old-boss"}],
    bossHazards: [{type: "rift"}],
    enemyGrid: new Map(),
    boss: null,
    spawn: -3,
    waveTimer: 42,
    waveNumber: 4,
    kills: 88,
    xp: 120,
    metaProgress: {points: 321, totals: {kills: 88}},
    rebuildEnemyGrid() { gridBuilds++; },
  });
  vm.runInContext(source, context, {filename: "boss-isolation.js"});
  return {
    context,
    get gridBuilds() { return gridBuilds; },
    get scarResets() { return scarResets; },
  };
}

test("boss entrance clears the horde and stray enemy attacks, never rewards XP", () => {
  const h = setup(), c = h.context;
  assert.equal(c.window.beginBossIsolation(), true);
  assert.equal(c.enemies.length, 0);
  assert.equal(c.enemyShots.length, 0);
  assert.equal(c.bossShots.length, 0);
  assert.equal(c.bossHazards.length, 0);
  assert.equal(c.kills, 88);
  assert.equal(c.xp, 120);
  assert.equal(c.metaProgress.points, 321);
  assert.equal(c.metaProgress.totals.kills, 88);
  assert.equal(c.waveTimer, 42);
  assert.equal(c.waveNumber, 4);
  assert.equal(c.spawn, .65);
  assert.equal(h.scarResets, 1);
  assert.equal(c.window.bossIsolationStatus().clearedOnEntry, 3);
});

test("isolated arena allows only the boss and explicitly summoned minions", () => {
  const h = setup(), c = h.context;
  c.window.beginBossIsolation();
  const guardian = {kind: 3, bossName: "Beau de Hond"};
  const minion = {kind: 1, summoned: true, noXp: true};
  c.boss = guardian;
  c.enemies.push(guardian, minion);
  assert.equal(c.window.bossIsolationStatus().allowedEnemies, 2);
  assert.equal(c.window.beginBossIsolation(), false);
  assert.equal(c.enemies.length, 2);
  assert.ok(!minion.dead);
});

test("defeating boss cleans summons/projectiles/scars and preserves wave timer", () => {
  const h = setup(), c = h.context;
  c.window.beginBossIsolation();
  const guardian = {kind: 3, hp: 0, dead: true};
  const minion = {kind: 0, summoned: true};
  const minion2 = {kind: 4, summoned: true};
  c.boss = guardian;
  c.enemies.push(guardian, minion, minion2);
  c.enemyShots.push({type: "projectile"});
  c.bossShots.push({type: "boss-shot"});
  c.bossHazards.push({type: "boss-hazard"});
  c.spawn = -2;
  assert.equal(c.window.finishBossIsolation(guardian), true);
  c.boss = null;
  assert.equal(c.enemies.length, 0);
  assert.equal(c.enemyShots.length, 0);
  assert.equal(c.bossShots.length, 0);
  assert.equal(c.bossHazards.length, 0);
  assert.equal(c.window.isBossIsolationActive(), false);
  assert.equal(c.waveTimer, 42);
  assert.equal(c.spawn, .65);
  assert.equal(c.kills, 88);
  assert.equal(h.scarResets, 2);
  assert.equal(c.window.finishBossIsolation(guardian), false);
});

test("restart and menu exit cannot leave the next run in an isolated arena", () => {
  const h = setup(), c = h.context;
  c.window.beginBossIsolation();
  c.window.resetBossIsolation();
  assert.equal(c.window.isBossIsolationActive(), false);
  assert.equal(c.window.beginBossIsolation(), true);
  assert.equal(c.window.bossIsolationStatus().clearedOnEntry, 0);
});

test("the actual game spawn loop is skipped completely while boss exists", () => {
  assert.match(gameSource, /if \(!boss && !window\.isBossIsolationActive\?\.\(\)\) \{[\s\S]*?const ambientCap=window\.encounterAmbientLimit/);
  assert.match(gameSource, /while \(spawn <= 0 && enemies\.length < ambientCap\)/);
  assert.match(gameSource, /updateEncounterPacing\?\.\(time,growthTime,player,enemies/);
  assert.match(gameSource, /if \(!boss\) \{\s*waveTimer -= dt;/);
  assert.match(enemiesSource, /if \(boss \|\| window\.isBossIsolationActive\?\.\(\)\) return null;/);
  assert.match(enemiesSource, /BOSS ARENA · WAVES PAUSED/);
});

test("regular and final bosses both enter isolation before constructing entity", () => {
  assert.match(enemiesSource, /function spawnBoss\(\) \{\s*if \(boss\) return false;\s*window\.beginBossIsolation\?\.\(\);/);
  assert.match(enemiesSource, /function spawnFinalBoss\(\) \{\s*if \(boss\) return false;\s*window\.beginBossIsolation\?\.\(\);/);
  assert.match(enemiesSource, /window\.finishBossIsolation\?\.\(e\);\s*boss = null;/);
  assert.match(gameSource, /function reset\(\) \{\s*window\.resetBossIsolation\?\.\(\);/);
});

test("boss phase summons are the only entities explicitly created mid-encounter", () => {
  assert.match(gameSource, /summoned: true,/);
  assert.match(gameSource, /window\.initializeEnemyAdaptation\?\.\(minion\);\s*enemies\.push\(minion\);/);
  assert.match(developerSource, /if \(!available\(\) \|\| !player \|\| boss \|\| window\.isBossIsolationActive\?\.\(\)\) return;/);
  assert.match(developerSource, /"SPAWN 12 " \+ id\.toUpperCase\(\), \(\) => spawnEnemyVariant\(id\), !!boss/);
  assert.match(index, /js\/boss-isolation\.js\?v=/);
});
