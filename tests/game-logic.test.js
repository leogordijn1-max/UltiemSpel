const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadScript(context, relativePath) {
  const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

test("one XP pickup queues a separate choice for every level gained", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let xp = 0, needed = 10, level = 1, pendingLevelUps = 0, paused = false; let choiceCount = 0; let playSfx = () => {};",
    context,
  );
  loadScript(context, "js/upgrades.js");
  vm.runInContext("choices = () => { choiceCount++; }; addXP(25);", context);

  assert.deepEqual(
    JSON.parse(
      vm.runInContext(
        "JSON.stringify([level, xp, needed, pendingLevelUps, choiceCount])",
        context,
      ),
    ),
    [3, 1, 19, 2, 1],
  );
});

test("a defeated enemy can only award damage results and rewards once", () => {
  const context = vm.createContext({
    localStorage: {
      getItem: () => "0",
      setItem: () => {},
    },
  });
  vm.runInContext(
    [
      "let boss = null, bossNumber = 0, time = 0, nextBossTime = 180, difficulty = 'normal';",
      "let enemies = [], bossShots = [], gems = [], texts = [], particles = [];",
      "let player = { x: 0, y: 0 }, upgrades = {};",
      "let kills = 0, highest = 0;",
      "let rand = (min) => min;",
      "let $ = () => ({ style: {} });",
      "let playSfx = () => {};",
    ].join("\n"),
    context,
  );
  loadScript(context, "js/enemies.js");
  vm.runInContext(
    [
      "const victim = { x: 0, y: 0, hp: 1, kind: 0, noXp: false };",
      "damage(victim, 1);",
      "damage(victim, 1);",
    ].join("\n"),
    context,
  );

  assert.deepEqual(
    JSON.parse(
      vm.runInContext(
        "JSON.stringify([kills, gems.length, texts.length])",
        context,
      ),
    ),
    [1, 1, 1],
  );
});

test("the game resumes when every upgrade is capped", () => {
  const context = vm.createContext({});
  vm.runInContext(
    [
      "let upgrades = {",
      "  arcane: 5, damage: 5, rate: 5, health: 5, orbit: 5, chain: 5, boomerang: 5, flame: 5, frost: 5,",
      "  bladeBlock: 5, bladeSize: 5, pierce: 5, bomb: 5, speed: 5, magnet: 5, knockback: 5,",
      "  nova: 1, novaRange: 5, novaSlow: 5, critChance: 5, critDamage: 5",
      "};",
      "let paused = true, pendingLevelUps = 1, level = 6;",
      "let overlay = { style: { display: 'flex' } };",
      "let $ = () => overlay;",
      "let panel = () => { throw new Error('No choices should be displayed.'); };",
      "let playSfx = () => {};",
    ].join("\n"),
    context,
  );
  loadScript(context, "js/upgrades.js");
  vm.runInContext("choices();", context);

  assert.equal(vm.runInContext("paused", context), false);
  assert.equal(vm.runInContext("pendingLevelUps", context), 0);
  assert.equal(vm.runInContext("overlay.style.display", context), "none");
});

test("Normal difficulty preserves the original enemy and spawn balance", () => {
  const context = vm.createContext({});
  loadScript(context, "js/enemies.js");

  assert.deepEqual(
    JSON.parse(
      vm.runInContext(
        "JSON.stringify([difficultyProfiles.easy.enemyHealth, difficultyProfiles.normal.enemyHealth, difficultyProfiles.nightmare.enemyHealth, difficultyProfiles.easy.spawnRate, difficultyProfiles.normal.spawnRate, difficultyProfiles.nightmare.spawnRate])",
        context,
      ),
    ),
    [0.8, 1, 1.28, 0.82, 1, 1.18],
  );
});

test("critical hits apply bonus damage and use a distinct damage-text color", () => {
  const context = vm.createContext({
    localStorage: { getItem: () => "0", setItem: () => {} },
  });
  vm.runInContext(
    [
      "let boss = null, bossNumber = 0, time = 0, nextBossTime = 180;",
      "let enemies = [], bossShots = [], gems = [], texts = [], particles = [];",
      "let player = { x: 0, y: 0 }, upgrades = { critChance: 1, critDamage: 0 };",
      "let kills = 0, highest = 0, rand = (min) => min;",
      "let $ = () => ({ style: {} });",
      "let playSfx = () => {};",
      "Math.random = () => 0;",
    ].join("\n"),
    context,
  );
  loadScript(context, "js/enemies.js");
  vm.runInContext(
    "const target = { x: 10, y: 0, hp: 100, kind: 0 }; damage(target, 10);",
    context,
  );

  assert.equal(vm.runInContext("texts[0].n", context), 15);
  assert.equal(vm.runInContext("texts[0].color", context), "#ffe17d");
});

test("bosses spawn with health scaling and telegraphed charge state", () => {
  const context = vm.createContext({
    W: 800,
    H: 600,
    player: { x: 0, y: 0 },
    enemies: [],
    particles: [],
    difficulty: "normal",
    growthTime: 240,
    bossNumber: 0,
    rand: (min) => min,
    $: () => ({ style: {} }),
    playSfx: () => {},
  });
  loadScript(context, "js/enemies.js");
  vm.runInContext("spawnBoss()", context);

  assert.equal(vm.runInContext("boss.kind", context), 3);
  assert.equal(vm.runInContext("boss.chargeCooldown", context), 4);
  assert.equal(vm.runInContext("boss.maxHp > 0 && boss.hp === boss.maxHp", context), true);
  assert.equal(vm.runInContext("enemies.includes(boss)", context), true);
});

test("weapon evolutions require level 5, support level 3, and a defeated boss", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let upgrades = { chain: 5, damage: 3 }, evolutions = {}, selectedWeapons = ['chain'], unlockedWeapons = ['chain'], bossesDefeated = 0;",
    context,
  );
  loadScript(context, "js/upgrades.js");
  assert.equal(vm.runInContext("eligibleEvolutions().length", context), 0);
  vm.runInContext("upgrades.chain = 4", context);
  assert.equal(vm.runInContext("eligibleEvolutions().length", context), 0);
  vm.runInContext("upgrades.chain = 5; upgrades.damage = 2; bossesDefeated = 1", context);
  assert.equal(vm.runInContext("eligibleEvolutions().length", context), 0);
  vm.runInContext("upgrades.damage = 3; bossesDefeated = 0", context);
  assert.equal(vm.runInContext("eligibleEvolutions().length", context), 0);
  vm.runInContext("bossesDefeated = 1", context);
  assert.equal(vm.runInContext("eligibleEvolutions()[0].name", context), "Tempest");
  assert.equal(vm.runInContext("eligibleUpgrade('chain')", context), false);
  vm.runInContext("evolutions.tempest = true", context);
  assert.equal(vm.runInContext("eligibleEvolutions().length", context), 0);
});

test("weapon upgrades only enter the pool for selected weapons and compatible support", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = { frost: 1, nova: 0, orbit: 0, arcane: 0 }; let selectedWeapons = ['frost', 'arcane', 'orbit']; let unlockedWeapons = ['frost']; let evolutions = {};", context);
  loadScript(context, "js/upgrades.js");

  assert.equal(vm.runInContext("eligibleUpgrade('frost')", context), true);
  assert.equal(vm.runInContext("eligibleUpgrade('arcane')", context), true);
  assert.equal(vm.runInContext("eligibleUpgrade('chain')", context), false);
  assert.equal(vm.runInContext("eligibleUpgrade('pierce')", context), false);
  vm.runInContext("unlockedWeapons.push('arcane')", context);
  assert.equal(vm.runInContext("eligibleUpgrade('pierce')", context), true);
  assert.equal(vm.runInContext("eligibleUpgrade('novaRange')", context), false);
  vm.runInContext("evolutions.glacier = true", context);
  assert.equal(vm.runInContext("eligibleUpgrade('frost')", context), false);
});

test("a run unlocks only its two reserves and lets one weapon reach its final evolution", () => {
  const context = vm.createContext({
    document: { createElement: () => ({}) },
    notify: () => {},
    unlockAchievement: () => {},
  });
  vm.runInContext(
    "let upgrades = { arcane: 1, orbit: 0, bomb: 0, chain: 0, boomerang: 0, flame: 0, frost: 0, nova: 0, damage: 0, pierce: 0, bladeBlock: 0, bladeSize: 0, critDamage: 0 }; let selectedWeapons = ['arcane', 'orbit', 'bomb']; let unlockedWeapons = ['arcane']; let evolutions = {}; let bossesDefeated = 0, paused = true, pendingLevelUps = 1, level = 1, time = 200, evolutionFlash = null; let player = { maxHp: 140 }; let $overlay = { style: { display: 'flex' } }; let $ = () => $overlay;",
    context,
  );
  loadScript(context, "js/upgrades.js");
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(Object.values(makeStartingWeaponLevels('arcane'))) ", context)),
    [1, 0, 0, 0, 0, 0, 0, 0],
  );
  vm.runInContext(
    "function take(key) { pendingLevelUps = 1; const button = makeUpgradeChoice(opts.find(([id]) => id === key)); button.onclick(); } take('orbit'); take('bomb'); for (let i = 0; i < 4; i++) take('arcane'); for (let i = 0; i < 3; i++) take('pierce'); bossesDefeated = 1;",
    context,
  );

  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify([unlockedWeapons, selectedWeapons.length, upgrades.arcane, upgrades.pierce, eligibleEvolutions().map((e) => e.id)])", context)), [
    ["arcane", "orbit", "bomb"], 3, 5, 3, ["splitDimension"],
  ]);

  vm.runInContext("evolveWeapon(eligibleEvolutions()[0])", context);
  assert.equal(vm.runInContext("evolutions.splitDimension", context), true);
  assert.equal(vm.runInContext("eligibleUpgrade('arcane')", context), false);
  assert.equal(vm.runInContext("eligibleUpgrade('damage')", context), true);
  assert.equal(vm.runInContext("unlockedWeapons.length <= 3", context), true);
});

test("Frost Orb and Flame Cone define distinct crowd-control and burn roles", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = {}; let selectedWeapons = [];", context);
  loadScript(context, "js/upgrades.js");

  assert.match(vm.runInContext("weaponCatalog.find((w) => w.key === 'frost').description", context), /slow/i);
  assert.match(vm.runInContext("opts.find(([key]) => key === 'frost')[2]", context), /chill|slow/i);
  assert.match(vm.runInContext("opts.find(([key]) => key === 'flame')[2]", context), /burn/i);
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(evolutionRecipes.map((r) => [r.level, r.supportLevel, !!r.visual]))", context)),
    Array.from({ length: 7 }, () => [5, 3, true]),
  );
  assert.equal(vm.runInContext("new Set(evolutionRecipes.map((r) => r.visual)).size", context), 7);
});

test("off-screen enemies are excluded from the visible arena bounds", () => {
  const context = vm.createContext({ W: 800, H: 600, player: { x: 100, y: -50 } });
  loadScript(context, "js/enemies.js");
  assert.equal(vm.runInContext("visibleEnemy({ x: 250, y: 30, r: 12 })", context), true);
  assert.equal(vm.runInContext("visibleEnemy({ x: 600, y: 30, r: 12 })", context), false);
});

test("permanent Mayo bonus stays separate from integer upgrade levels", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = { damage: 3 }; let permanentDamageBonus = 0.49;", context);
  loadScript(context, "js/upgrades.js");
  assert.ok(Math.abs(vm.runInContext("globalDamageMultiplier()", context) - 2.15) < 1e-10);
  assert.equal(vm.runInContext("upgrades.damage", context), 3);
});

test("Eiad Bom scales gently and deals less than two-bomb lethal damage to a boss", () => {
  const context = vm.createContext({});
  loadScript(context, "js/upgrades.js");
  const damage = vm.runInContext("calculateBombDamage(5, 1 + 5 * 0.22, true)", context);
  const bossDamage = vm.runInContext("calculateBombDamage(5, 1 + 5 * 0.22, true, true)", context);
  assert.ok(damage > bossDamage * 2);
  assert.ok(bossDamage * 2 < 1191); // First normal boss at the three-minute mark.
});

test("Tempest launches two independently chained attacks with separate first targets", () => {
  const context = vm.createContext({});
  vm.runInContext(
    [
      "let upgrades = { chain: 5, damage: 0, rate: 0 }, evolutions = { tempest: true };",
      "let player = { x: 0, y: 0 }, weaponTimers = { chain: 0 }, lightningSegments = [];",
      "let targets = Array.from({length: 12}, (_, i) => ({ x: (i + 1) * 10 * (i % 2 ? -1 : 1), y: 0 }));",
      "let dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), nearbyEnemies = (x,y,r) => targets.filter(e => Math.hypot(e.x-x,e.y-y) <= r);",
      "let damage = (target) => {};",
    ].join("\n"),
    context,
  );
  loadScript(context, "js/upgrades.js");
  loadScript(context, "js/weapons.js");
  vm.runInContext("castChainLightning()", context);
  assert.equal(vm.runInContext("lightningSegments.length >= 2", context), true);
  assert.notEqual(
    vm.runInContext("lightningSegments[0].x2", context),
    vm.runInContext("lightningSegments[5].x2", context),
  );
  assert.equal(vm.runInContext("lightningSegments.every(segment => segment.evolved)", context), true);
  assert.ok(Math.abs(vm.runInContext("weaponTimers.chain", context) - (4.25 * 0.88 / 1.15)) < 1e-10);
});

test("Chain Lightning's opening target range is limited to 820 pixels", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let upgrades = { chain: 1, damage: 0, rate: 0 }, evolutions = {}; let player = { x: 0, y: 0 }, weaponTimers = { chain: 0 }, lightningSegments = []; let enemy = { x: 900, y: 0 }; let dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), nearbyEnemies = (x,y,r) => Math.hypot(enemy.x-x,enemy.y-y) <= r ? [enemy] : [], damage = () => {};",
    context,
  );
  loadScript(context, "js/upgrades.js");
  loadScript(context, "js/weapons.js");
  vm.runInContext("castChainLightning()", context);
  assert.equal(vm.runInContext("lightningSegments.length", context), 0);
  assert.ok(Math.abs(vm.runInContext("weaponTimers.chain", context) - (6.45 * 0.88 / 1.15)) < 1e-10);
});

test("Chain Lightning cooldown is 15% shorter on every level without a second base-speed factor", () => {
  const context = vm.createContext({});
  loadScript(context, "js/weapons.js");
  for (let level = 1; level <= 5; level++) {
    const result = vm.runInContext(`chainLightningCooldown(${level}) * 1.15`, context);
    const previousCooldown = (7 - level * 0.55) * 0.88;
    assert.ok(Math.abs(result - previousCooldown) < 1e-10);
  }
});

test("Ranged Shades approach before attacking and only fire visibly inside their range", () => {
  const context = vm.createContext({ W: 800, H: 600, player: { x: 0, y: 0 } });
  loadScript(context, "js/enemies.js");
  assert.equal(vm.runInContext("rangedEnemyMovementMode({x:0,y:280,r:15}, 280)", context), "approach");
  assert.equal(vm.runInContext("rangedEnemyCanAttack({x:0,y:280,r:15}, 280)", context), false);
  assert.equal(vm.runInContext("rangedEnemyCanAttack({x:340,y:0,r:15}, 340)", context), true);
  assert.equal(vm.runInContext("rangedEnemyMovementMode({x:340,y:0,r:15}, 340)", context), "hold");
  assert.equal(vm.runInContext("rangedEnemyMovementMode({x:250,y:0,r:15}, 250)", context), "retreat");
  assert.equal(vm.runInContext("rangedEnemyCanAttack({x:450,y:0,r:15}, 450)", context), false);
});
