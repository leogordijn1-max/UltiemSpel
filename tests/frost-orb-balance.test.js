const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
function load(context, file) {
  context.window ??= {};
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

test("Frost Orb fires exactly one homing projectile at every level and cannot pierce", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    let upgrades = { frost: 1, pierce: 0 };
    let weaponTimers = { frost: 0 };
    let player = { x: 0, y: 0 };
    let bullets = [], evolutions = {};
    let globalDamageMultiplier = () => 1;
    let nearestEnemy = () => ({ x: 120, y: 20 });
    let playSfx = () => {};
  `, context);
  load(context, "js/weapons.js");

  const expected = [
    { level: 1, damage: 28, radius: 100, cooldown: 3.92 },
    { level: 2, damage: 32, radius: 112, cooldown: 3.74 },
    { level: 3, damage: 36, radius: 124, cooldown: 3.56 },
    { level: 4, damage: 40, radius: 136, cooldown: 3.38 },
    { level: 5, damage: 44, radius: 148, cooldown: 3.2 },
  ];
  for (const expectedLevel of expected) {
    // Even Phantom Shots level 5 must not enable Frost piercing.
    vm.runInContext(`upgrades.frost = ${expectedLevel.level}; upgrades.pierce = 5; bullets = []; fireFrostOrb();`, context);
    const actual = JSON.parse(vm.runInContext(
      "JSON.stringify({ count: bullets.length, pierce: bullets[0].pierce, damage: bullets[0].d, radius: bullets[0].frostRadius, cooldown: weaponTimers.frost, turnRate: bullets[0].turnRate })",
      context,
    ));
    assert.equal(actual.count, 1, "exactly one orb regardless of level");
    assert.equal(actual.pierce, 1, "a Frost Orb must detonate on the first enemy");
    assert.equal(actual.damage, expectedLevel.damage);
    assert.equal(actual.radius, expectedLevel.radius);
    assert.ok(Math.abs(actual.cooldown - expectedLevel.cooldown) < 1e-10);
    assert.equal(actual.turnRate, 4, "keep the existing homing");
  }
});

test("Frost Orb also stays single-hit after Glacier evolution", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    let upgrades = { frost: 5, pierce: 5 };
    let weaponTimers = { frost: 0 }, player = { x: 0, y: 0 };
    let bullets = [], evolutions = { glacier: true };
    let globalDamageMultiplier = () => 1.5;
    let nearestEnemy = () => ({ x: 95, y: 0 });
  `, context);
  load(context, "js/weapons.js");
  vm.runInContext("fireFrostOrb()", context);
  const result = JSON.parse(vm.runInContext(
    "JSON.stringify({ count:bullets.length, pierce:bullets[0].pierce, evolved:bullets[0].evolved, damage:bullets[0].d })",
    context,
  ));
  assert.deepEqual(result, { count: 1, pierce: 1, evolved: true, damage: 66 });
});

test("normal Frost Orb makes one modest splash without damaging its direct target twice", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    let time = 100, upgrades = { frost: 5 };
    let evolutions = {}, frostZones = [], hits = [];
    let primary = { x: 0, y: 0 };
    let nearby = { x: 55, y: 0 };
    let outside = { x: 260, y: 0 };
    let nearbyEnemies = () => [primary, nearby, outside];
    let enemyHitRadius = () => 10;
    let damage = (enemy, amount, origin, type) => hits.push({ enemy, amount, type });
  `, context);
  load(context, "js/weapons.js");
  vm.runInContext(
    "applyFrostBurst(0, 0, { d: 44, frostRadius: 148, hitTarget: primary })",
    context,
  );
  const state = JSON.parse(vm.runInContext(
    "JSON.stringify({ count: hits.length, amount: hits[0]?.amount, enemy: hits[0]?.enemy === nearby, primarySlow: primary.frostUntil, nearbySlow: nearby.frostUntil, outsideSlow: outside.frostUntil || 0, radius: frostZones[0].radius })",
    context,
  ));
  assert.equal(state.count, 1);
  assert.equal(state.amount, 11); // 25% splash
  assert.equal(state.enemy, true);
  assert.ok(state.primarySlow > 100);
  assert.ok(state.nearbySlow > 100);
  assert.equal(state.outsideSlow, 0);
  assert.equal(state.radius, 148);
});

test("Glacier keeps a bigger chill radius but does not restore multi-hit piercing", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    let time = 100, upgrades = { frost: 5 };
    let evolutions = { glacier: true }, frostZones = [], hits = [];
    let primary = { x: 0, y: 0 }, adjacent = { x: 175, y: 0 };
    let nearbyEnemies = () => [primary, adjacent];
    let enemyHitRadius = () => 10;
    let damage = (enemy, amount, origin, type) => hits.push({ enemy, amount, type });
  `, context);
  load(context, "js/weapons.js");
  vm.runInContext(
    "applyFrostBurst(0, 0, { d: 44, frostRadius: 148, hitTarget: primary })",
    context,
  );
  const state = JSON.parse(vm.runInContext(
    "JSON.stringify({ radius:frostZones[0].radius, splash:hits[0].amount, count:hits.length, glacierSlow:adjacent.frostUntil })",
    context,
  ));
  assert.equal(state.radius, 185);
  assert.equal(state.splash, 44 * 0.32);
  assert.equal(state.count, 1);
  assert.equal(state.glacierSlow, 105.2);
});

test("Frost upgrade cards accurately describe damage, radius and cooldown", () => {
  const context = vm.createContext({});
  load(context, "js/upgrades.js");
  const [level1, level5] = JSON.parse(vm.runInContext(
    "JSON.stringify([upgradeEffectAtLevel('frost',1), upgradeEffectAtLevel('frost',5)])",
    context,
  ));
  assert.match(level1, /28 base damage/);
  assert.match(level1, /100px chill radius/);
  assert.match(level1, /3\.92s cooldown/);
  assert.match(level5, /44 base damage/);
  assert.match(level5, /148px chill radius/);
  assert.match(level5, /3\.20s cooldown/);
  assert.match(level5, /no pierce/);
});

test("Frost Orb does not create a projectile when no target is nearby", () => {
  const context = vm.createContext({});
  vm.runInContext(`
    let upgrades = { frost: 5 }, weaponTimers = { frost: 0 };
    let player = { x: 0, y: 0 }, bullets = [], evolutions = {};
    let nearestEnemy = () => null;
  `, context);
  load(context, "js/weapons.js");
  vm.runInContext("fireFrostOrb()", context);
  assert.equal(vm.runInContext("bullets.length", context), 0);
  assert.ok(vm.runInContext("weaponTimers.frost > 0", context));
});
