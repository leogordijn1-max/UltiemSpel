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
    [3, 0, 21, 2, 1],
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
      "let enemies = [], bossShots = [], gems = [], gemGrid = new Map(), texts = [], particles = [];",
      "let player = { x: 0, y: 0 }, upgrades = {};",
      "let kills = 0, highest = 0;",
      "let rand = (min) => min;",
      "let achievementUnlocks = []; let metaProgress = { totals: { kills: 99, bosses: 0, runs: 0 }, achievements: [], points: 0, hpLevel: 0, damageLevel: 0, runs: [], bestFlawlessSurvival: 0 };",
      "let storageSet = () => {}, saveMetaProgress = () => {}, unlockAchievement = (id,title) => achievementUnlocks.push([id,title]);",
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
  assert.equal(vm.runInContext("metaProgress.totals.kills", context), 100);
  assert.equal(vm.runInContext("achievementUnlocks[0][0]", context), "kills100");
});

test("the game resumes when every upgrade is capped", () => {
  const context = vm.createContext({});
  vm.runInContext(
    [
      "let upgrades = {",
      "  arcane: 5, damage: 5, rate: 5, health: 5, orbit: 5, chain: 5, boomerang: 5, flame: 5, frost: 5,",
      "  bladeBlock: 5, bladeSize: 5, pierce: 5, bomb: 5, speed: 5, magnet: 5, knockback: 5,",
      "  nova: 5, novaRange: 5, novaSlow: 5, critChance: 5, critDamage: 5",
      "};",
      "let paused = true, pendingLevelUps = 1, level = 6, choiceScreenOpen = false, active = true, gameState = 'level-up';",
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
      "let enemies = [], bossShots = [], gems = [], gemGrid = new Map(), texts = [], particles = [];",
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

test("boss defeat updates career progress and grants its achievement immediately", () => {
  const context = vm.createContext({ localStorage: { getItem: () => "0", setItem: () => {} } });
  vm.runInContext(
    [
      "let boss = null, bossNumber = 1, bossesDefeated = 0, time = 180, nextBossTime = 180, difficulty = 'normal';",
      "let enemies = [], bossShots = [], gems = [], gemGrid = new Map(), texts = [], particles = [];",
      "let player = { x: 0, y: 0 }, upgrades = {}, kills = 0, highest = 0;",
      "let metaProgress = { totals: { kills: 0, bosses: 0, runs: 0 }, achievements: [], points: 0, hpLevel: 0, damageLevel: 0, runs: [], bestFlawlessSurvival: 0 };",
      "let unlocked = [], storageSet = () => {}, saveMetaProgress = () => {}, unlockAchievement = (id) => unlocked.push(id);",
      "let rand = (min) => min, $ = () => ({ style: {} }), playSfx = () => {}, showBossReward = () => {};",
      "boss = { x: 10, y: 0, hp: 1, maxHp: 1, kind: 3, noXp: false }; enemies.push(boss);",
    ].join("\n"),
    context,
  );
  loadScript(context, "js/enemies.js");
  vm.runInContext("damage(boss, 1)", context);
  assert.equal(vm.runInContext("metaProgress.totals.bosses", context), 1);
  assert.equal(vm.runInContext("bossesDefeated", context), 1);
  assert.equal(vm.runInContext("unlocked.includes('boss1')", context), true);
});

test("weapon evolutions require level 5, support level 3, and a defeated boss", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let upgrades = { chain: 5, damage: 3 }, evolutions = {}, selectedWeapons = ['chain'], unlockedWeapons = ['chain'], bossesDefeated = 0, time = 0;",
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
  assert.equal(vm.runInContext("eligibleEvolutions().length", context), 0);
  vm.runInContext("time = 600", context);
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
    "let upgrades = { arcane: 1, orbit: 0, bomb: 0, chain: 0, boomerang: 0, flame: 0, frost: 0, nova: 0, damage: 0, pierce: 0, bladeBlock: 0, bladeSize: 0, critDamage: 0 }; let selectedWeapons = ['arcane', 'orbit', 'bomb']; let unlockedWeapons = ['arcane']; let evolutions = {}; let bossesDefeated = 0, paused = true, active = true, gameState = 'level-up', choiceScreenOpen = false, pendingLevelUps = 1, level = 1, time = 600, evolutionFlash = null; let player = { maxHp: 140 }; let $overlay = { style: { display: 'flex' } }; let $ = () => $overlay;",
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
    Array.from({ length: 8 }, () => [5, 3, true]),
  );
  assert.equal(vm.runInContext("new Set(evolutionRecipes.map((r) => r.visual)).size", context), 8);
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
  assert.ok(Math.abs(vm.runInContext("globalDamageMultiplier()", context) - 2.03) < 1e-10);
  assert.equal(vm.runInContext("upgrades.damage", context), 3);
});

test("XP curve grows steadily and keeps higher-level thresholds below runaway growth", () => {
  const context = vm.createContext({});
  loadScript(context, "js/upgrades.js");
  const thresholds = JSON.parse(vm.runInContext(`JSON.stringify((() => {
    let need = 10, total = 0, result = {};
    for (let level = 1; level <= 25; level++) {
      result[level] = total;
      total += need;
      need = nextLevelXpRequirement(need, level + 1);
    }
    return result;
  })())`, context));
  assert.deepEqual([thresholds[1], thresholds[5], thresholds[10], thresholds[15], thresholds[20], thresholds[25]], [0, 74, 334, 872, 1809, 3325]);
  assert.equal(vm.runInContext("nextLevelXpRequirement(406, 26)", context), 444);
});

test("Rapid Casting applies one shared multiplicative cooldown modifier", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = { rate: 3 }; let weaponTimers = { chain: 1, flame: 1, frost: 1, boomerang: 1 }; let lightningSegments = [], flameBursts = [], frostZones = [];", context);
  loadScript(context, "js/upgrades.js");
  loadScript(context, "js/weapons.js");
  vm.runInContext("updateSpecialWeapons(0.1)", context);
  assert.ok(Math.abs(vm.runInContext("weaponTimers.chain", context) - (1 - 0.1 / Math.pow(0.9, 3))) < 1e-10);
  assert.ok(Math.abs(vm.runInContext("weaponCooldownMultiplier()", context) - Math.pow(0.9, 3)) < 1e-10);
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
      "let dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), nearbyEnemies = (x,y,r) => targets.filter(e => Math.hypot(e.x-x,e.y-y) <= r), nearestEnemy = (x,y,r,excluded,include) => nearbyEnemies(x,y,r).filter(e => !excluded?.has(e) && (!include || include(e))).sort((a,b) => (a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2))[0] || null;",
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

test("Chain Lightning does not target enemies outside the 600 pixel range", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let upgrades = { chain: 1, damage: 0, rate: 0 }, evolutions = {}; let player = { x: 0, y: 0 }, weaponTimers = { chain: 0 }, lightningSegments = []; let enemy = { x: 900, y: 0 }; let dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), nearbyEnemies = (x,y,r) => Math.hypot(enemy.x-x,enemy.y-y) <= r ? [enemy] : [], nearestEnemy = (x,y,r) => Math.hypot(enemy.x-x,enemy.y-y) <= r ? enemy : null, damage = () => {};",
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

test("spatial targeting returns nearest live enemies and refreshes after movement", () => {
  const context = vm.createContext({});
  vm.runInContext("let enemies = [], enemyGrid = new Map();", context);
  loadScript(context, "js/enemies.js");
  vm.runInContext("enemies = [{x:20,y:0},{x:80,y:0},{x:500,y:0}]; rebuildEnemyGrid();", context);
  assert.equal(vm.runInContext("nearestEnemy(0,0,150).x", context), 20);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(nearestEnemies(0,0,150,2).map(e => e.x))", context)), [20, 80]);
  vm.runInContext("enemies[0].x = 900; rebuildEnemyGrid();", context);
  assert.equal(vm.runInContext("nearestEnemy(0,0,150).x", context), 80);
  vm.runInContext("enemies[1].dead = true;", context);
  assert.equal(vm.runInContext("nearestEnemy(0,0,150)", context), null);
});

test("nearby XP gems merge without losing value and health drops remain separate", () => {
  const context = vm.createContext({});
  vm.runInContext("let gems = [], gemGrid = new Map();", context);
  loadScript(context, "js/enemies.js");
  vm.runInContext("dropGem({x:0,y:0,r:6,value:1}); dropGem({x:12,y:0,r:6,value:5}); dropGem({x:8,y:0,r:7,kind:'health',value:2});", context);
  assert.equal(vm.runInContext("gems.length", context), 2);
  assert.equal(vm.runInContext("gems.find(g => g.kind !== 'health').value", context), 6);
  assert.equal(vm.runInContext("gems.find(g => g.kind === 'health').value", context), 2);
  assert.equal(vm.runInContext("nearbyGems(0,0,100).length", context), 2);
  vm.runInContext("const gem = gems.find(g => g.kind !== 'health'), oldX = gem.x, oldY = gem.y; gem.x = 220; updateGemGridPosition(gem, oldX, oldY);", context);
  assert.equal(vm.runInContext("nearbyGems(0,0,100).length", context), 1);
  assert.equal(vm.runInContext("nearbyGems(220,0,100).length", context), 1);
});

test("legacy progress loads with normalized values and keeps existing totals", () => {
  const stored = JSON.stringify({
    points: 14,
    hpLevel: 3.8,
    damageLevel: 4.9,
    achievements: [{ id: "kills100", title: "First Blood" }, { id: "kills100", title: "duplicate" }],
    runs: [{ survived: 320.8, kills: 100.7, level: 8, bosses: 1, difficulty: "normal" }],
    totals: { kills: 840, bosses: 2, runs: 9 },
  });
  const context = vm.createContext({ localStorage: { getItem: () => stored, setItem: () => {} } });
  loadScript(context, "js/storage.js");
  const progress = JSON.parse(vm.runInContext("JSON.stringify(loadMetaProgress())", context));
  assert.deepEqual(progress.hpLevel, 3);
  assert.deepEqual(progress.damageLevel, 4);
  assert.deepEqual(progress.totals, { kills: 840, bosses: 2, runs: 9, wins: 0 });
  assert.equal(progress.version, 3);
  assert.equal(progress.achievements.length, 1);
  assert.equal(progress.runs[0].survived, 320);
});

test("achievement grants are idempotent", () => {
  const context = vm.createContext({});
  loadScript(context, "js/storage.js");
  vm.runInContext("let progress = { achievements: [] }; grantAchievement(progress, 'boss1', 'First Boss', 'today'); grantAchievement(progress, 'boss1', 'First Boss', 'tomorrow');", context);
  assert.equal(vm.runInContext("progress.achievements.length", context), 1);
  assert.equal(vm.runInContext("progress.achievements[0].date", context), "today");
});

test("unavailable localStorage safely falls back to defaults", () => {
  const context = vm.createContext({});
  loadScript(context, "js/storage.js");
  const progress = JSON.parse(vm.runInContext("JSON.stringify(loadMetaProgress())", context));
  assert.equal(progress.version, 3);
  assert.deepEqual(progress.totals, { kills: 0, bosses: 0, runs: 0, wins: 0 });
  assert.equal(vm.runInContext("storageSet('key', 'value')", context), false);
});

test("run records are once-only and Untouched requires a five-minute no-damage run", () => {
  const context = vm.createContext({ notify: () => {}, localStorage: { getItem: () => null, setItem: () => {} } });
  loadScript(context, "js/storage.js");
  vm.runInContext(
    "let metaProgress = { points: 0, achievements: [], runs: [], bestFlawlessSurvival: 0, totals: { kills: 0, bosses: 0, runs: 0 } }; let runRecorded = false, time = 240, kills = 10, level = 4, bossesDefeated = 0, difficulty = 'normal', runDamageTaken = 0;",
    context,
  );
  loadScript(context, "js/progression.js");
  vm.runInContext("recordRun(); recordRun();", context);
  assert.equal(vm.runInContext("metaProgress.totals.runs", context), 1);
  assert.equal(vm.runInContext("metaProgress.achievements.some(a => a.id === 'flawless')", context), false);
  vm.runInContext("runRecorded = false; time = 320; recordRun();", context);
  assert.equal(vm.runInContext("metaProgress.totals.runs", context), 2);
  assert.equal(vm.runInContext("metaProgress.bestFlawlessSurvival", context), 320);
  assert.equal(vm.runInContext("metaProgress.achievements.some(a => a.id === 'flawless')", context), true);
});

test("survival achievements unlock as soon as their run-time threshold is reached", () => {
  const writes = [];
  const context = vm.createContext({ notify: () => {}, localStorage: { getItem: () => null, setItem: (...args) => writes.push(args) } });
  loadScript(context, "js/storage.js");
  vm.runInContext("let metaProgress = { achievements: [], points: 0, hpLevel: 0, damageLevel: 0, runs: [], bestFlawlessSurvival: 0, totals: { kills: 0, bosses: 0, runs: 0 } }; let time = 300, runDamageTaken = 0;", context);
  loadScript(context, "js/progression.js");
  vm.runInContext("checkRunAchievements(); checkRunAchievements();", context);
  assert.equal(vm.runInContext("metaProgress.achievements.filter(a => a.id === 'survive5').length", context), 1);
  assert.equal(vm.runInContext("metaProgress.achievements.filter(a => a.id === 'flawless').length", context), 1);
  assert.equal(vm.runInContext("recentAchievements.filter(title => title === 'Five Minutes').length", context), 1);
  assert.equal(writes.length, 2);
});

test("boss reward at level 4 applies its remaining level and converts overflow", () => {
  const context = vm.createContext({
    document: { createElement: () => ({}) },
    notify: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
  });
  loadScript(context, "js/storage.js");
  vm.runInContext(
    "let upgrades = { damage: 4 }, selectedWeapons = [], unlockedWeapons = [], evolutions = {}, bossesDefeated = 1, active = true, gameState = 'boss-reward', choiceScreenOpen = true, pendingLevelUps = 0, paused = true, level = 1, time = 300, evolutionFlash = null; let metaProgress = { points: 2, achievements: [], totals: { kills: 0, bosses: 1, runs: 1 }, runs: [], bestFlawlessSurvival: 0 }; let bossRewardPoints = 0, player = { hp: 50, maxHp: 100 }; let overlay = { style: { display: 'flex' } }, $ = () => overlay;",
    context,
  );
  loadScript(context, "js/upgrades.js");
  vm.runInContext("let saved = 0; const originalSave = saveMetaProgress; saveMetaProgress = () => { saved++; return originalSave(); };", context);
  const button = vm.runInContext("makeUpgradeChoice(opts.find(([key]) => key === 'damage'), { levels: 2, rare: true })", context);
  assert.match(button.innerHTML, /Level 4 → Level 5 \(\+1; overflow → \+1 permanent point\)/);
  button.onclick();
  assert.equal(vm.runInContext("upgrades.damage", context), 5);
  assert.equal(vm.runInContext("metaProgress.points", context), 3);
  assert.equal(vm.runInContext("bossRewardPoints", context), 1);
  assert.equal(vm.runInContext("saved", context), 1);
});

test("a level-up screen stays open once and keeps exactly three valid choices", () => {
  const context = vm.createContext({
    document: { createElement: () => ({}) },
  });
  vm.runInContext(
    "let upgrades = { arcane: 0, orbit: 0, bomb: 0, chain: 0, boomerang: 0, flame: 0, frost: 0, nova: 0, damage: 0, speed: 0, rate: 0, magnet: 0, health: 0, critChance: 0, critDamage: 0, knockback: 0 }; let selectedWeapons = [], unlockedWeapons = [], evolutions = {}, bossesDefeated = 0, active = true, gameState = 'playing', choiceScreenOpen = false, paused = false, pendingLevelUps = 1, level = 3; let panelCalls = 0, renderedChoices = 0, playSfx = () => {}, panel = (title, body, render) => { panelCalls++; const children = []; render({ append: (item) => children.push(item) }); renderedChoices = children.length; };",
    context,
  );
  loadScript(context, "js/upgrades.js");
  vm.runInContext("choices(); choices();", context);
  assert.equal(vm.runInContext("panelCalls", context), 1);
  assert.equal(vm.runInContext("renderedChoices", context), 3);
  assert.equal(vm.runInContext("paused && choiceScreenOpen && gameState === 'level-up'", context), true);
});

test("level-up choices guarantee one selected locked weapon and contain no duplicates", () => {
  const context = vm.createContext({ document: { createElement: () => ({}) } });
  vm.runInContext(
    "let upgrades = { arcane: 1, orbit: 0, bomb: 0, chain: 0, boomerang: 0, flame: 0, frost: 0, nova: 0, damage: 0, speed: 0, rate: 0, magnet: 0, health: 0, critChance: 0, critDamage: 0, knockback: 0, pierce: 0, bladeBlock: 0, bladeSize: 0, novaRange: 0, novaSlow: 0 }; let selectedWeapons = ['arcane', 'orbit', 'bomb']; let unlockedWeapons = ['arcane']; let evolutions = {}, bossesDefeated = 0, time = 0, active = true, gameState = 'playing', choiceScreenOpen = false, paused = false, pendingLevelUps = 1, level = 2; let chosen = []; let panel = (_title, _body, render) => render({ append: (item) => chosen.push(item) }); let playSfx = () => {};",
    context,
  );
  loadScript(context, "js/upgrades.js");
  vm.runInContext("choices()", context);
  const html = JSON.parse(vm.runInContext("JSON.stringify(chosen.map(choice => choice.innerHTML))", context));
  assert.equal(html.length, 3);
  assert.equal(new Set(html).size, 3);
  assert.equal(html.filter((choice) => choice.includes("WEAPON UNLOCK") && choice.includes("LOCKED → UNLOCKED")).length, 1);
  assert.equal(html.some((choice) => choice.includes("<b>Spirit Blades</b>") || choice.includes("<b>Eiad Bom</b>")), true);
});

test("upgrade levels clamp at zero and five", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = { damage: -2, chain: 7, nova: 3 };", context);
  loadScript(context, "js/upgrades.js");
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify([currentUpgradeLevel('damage'), currentUpgradeLevel('chain'), currentUpgradeLevel('nova')])", context)),
    [0, 5, 3],
  );
});

test("Death Pulse reaches level 5 and unlocks Eclipse with Expanding Aura", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = { nova: 5, novaRange: 3 }, evolutions = {}, selectedWeapons = ['nova'], unlockedWeapons = ['nova'], bossesDefeated = 1, time = 600;", context);
  loadScript(context, "js/upgrades.js");
  assert.equal(vm.runInContext("maxUpgradeLevel('nova')", context), 5);
  assert.equal(vm.runInContext("eligibleEvolutions().some(r => r.id === 'eclipse')", context), true);
  assert.equal(vm.runInContext("eligibleUpgrade('nova')", context), false);
  vm.runInContext("evolutions.eclipse = true", context);
  assert.equal(vm.runInContext("eligibleEvolutions().some(r => r.id === 'eclipse')", context), false);
  assert.equal(vm.runInContext("novaRadius() > 95", context), true);
});

test("all eight weapons have their own evolution and maximum level five", () => {
  const context = vm.createContext({});
  vm.runInContext("let upgrades = {}, evolutions = {}, selectedWeapons = [], unlockedWeapons = [];", context);
  loadScript(context, "js/upgrades.js");
  assert.equal(vm.runInContext("weaponCatalog.length", context), 8);
  assert.equal(vm.runInContext("evolutionRecipes.length", context), 8);
  assert.equal(vm.runInContext("evolutionRecipes.every(r => maxUpgradeLevel(r.weapon) === 5)", context), true);
  assert.equal(vm.runInContext("new Set(evolutionRecipes.map(r => r.weapon)).size", context), 8);
});
