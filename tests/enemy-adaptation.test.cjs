// Regression suite: node --test tests/enemy-adaptation.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness() {
  let current = "frozen";
  let developer = false;
  const marks = [];
  const window = {
    worldBiomeAt: (x) => x >= 200 ? "burning" : current,
    getDominantWorld: () => current,
    isDeveloperRun: () => developer,
    addWorldScar(type, x, y, radius) { marks.push({type, x, y, radius}); },
  };
  const context = vm.createContext({ window, Math });
  const filename = path.join(__dirname, "..", "js", "enemy-adaptation.js");
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
  return {
    window, marks,
    setWorld(v) { current = v; },
    setDeveloper(v) { developer = v; },
  };
}

test("enemy origin follows the defending world, not 85% invaded terrain", () => {
  const h = harness();
  const frost = {x: 0, y: 0, kind: 0};
  const invaded = {x: 220, y: 0, kind: 1};
  h.window.initializeEnemyAdaptation(frost);
  h.window.initializeEnemyAdaptation(invaded);
  assert.equal(frost.worldAffinity, "frozen");
  assert.equal(invaded.worldAffinity, "frozen");
});

test("native enemies stay loyal when walking across converted terrain", () => {
  const h = harness();
  const enemy = {x: 10, y: 20, kind: 2};
  h.window.initializeEnemyAdaptation(enemy);
  enemy.x = 230;
  h.window.refreshEnemyAdaptation(enemy, 2, true, "burning");
  assert.equal(enemy.worldAffinity, "frozen");
  enemy.x = 0;
  h.window.refreshEnemyAdaptation(enemy, 2.5, true, "frozen");
  assert.equal(enemy.worldAffinity, "frozen");
});

test("only a persistently conquered world changes the next generation of enemies", () => {
  const h = harness(),old = {x:220,y:0,kind:0};
  h.window.initializeEnemyAdaptation(old);
  assert.equal(old.worldAffinity, "frozen");
  h.setWorld("burning"); // Simulates the NEXT run after permanent conquest.
  const newcomer = {x:0,y:0,kind:1};
  h.window.initializeEnemyAdaptation(newcomer);
  assert.equal(newcomer.worldAffinity, "burning");
  h.window.refreshEnemyAdaptation(old, 1, true);
  assert.equal(old.worldAffinity, "burning"); // Unchanged within a run; reset occurs across runs.
});

test("offscreen enemy updates are skipped and do not change affinity", () => {
  const h = harness();
  const enemy = {x: 0, y: 0, kind: 1};
  h.window.initializeEnemyAdaptation(enemy);
  enemy.x = 230;
  h.window.refreshEnemyAdaptation(enemy, 5, false);
  assert.equal(enemy.worldAffinity, "frozen");
});

test("damage resistances affect the matching element only", () => {
  const h = harness();
  const e = {kind: 0};
  h.window.initializeEnemyAdaptation(e, "frozen");
  assert.equal(h.window.enemyWorldResistance(e, "frost"), .66);
  assert.equal(h.window.enemyWorldResistance(e, "fire"), 1);
  h.window.initializeEnemyAdaptation(e, "burning");
  assert.equal(h.window.enemyWorldResistance(e, "fire"), .67);
  assert.equal(h.window.enemyWorldResistance(e, "burn"), .67);
  assert.equal(h.window.enemyWorldResistance(e, "water"), 1);
  h.window.initializeEnemyAdaptation(e, "flooded");
  assert.equal(h.window.enemyWorldResistance(e, "water"), .72);
  assert.equal(h.window.enemyWorldResistance(e, "frost"), 1);
  assert.equal(h.window.enemyWorldResistance({kind:3, worldAffinity:"burning"}, "fire"), 1);
});

test("native terrain creates different movement patterns without new enemy AI", () => {
  const h = harness();
  const frozen = {kind:1, worldAffinity:"frozen"};
  const burning = {kind:1, worldAffinity:"burning"};
  const flooded = {kind:0, worldAffinity:"flooded"};
  assert.ok(h.window.enemyWorldMovement(frozen, "frost", 0, .016) > 1.35);
  assert.equal(h.window.enemyWorldMovement(frozen, "water", 0, .016), 1);
  assert.ok(h.window.enemyWorldMovement(burning, "fire", 0, .016) > 1.2);
  assert.equal(h.window.enemyWorldMovement(burning, "frost", 0, .016), 1);
  assert.equal(h.window.enemyWorldMovement(flooded, "water", 1, .016), 1.65);
  assert.ok(h.window.enemyWorldMovement(flooded, "water", 2, .016) < 1.65);
});

test("only heavy or elite ordinary enemies spread terrain on death", () => {
  const h = harness();
  h.window.enemyWorldOnDeath({kind:1,x:0,y:0,worldAffinity:"frozen"});
  h.window.enemyWorldOnDeath({kind:3,x:0,y:0,worldAffinity:"burning"});
  h.window.enemyWorldOnDeath({kind:6,x:0,y:0,worldAffinity:"water",summoned:true});
  assert.equal(h.marks.length,0);
  h.window.enemyWorldOnDeath({kind:2,x:14,y:25,worldAffinity:"frozen"});
  h.window.enemyWorldOnDeath({kind:6,x:18,y:25,worldAffinity:"flooded"});
  h.window.enemyWorldOnDeath({kind:1,x:40,y:25,worldAffinity:"burning",elite:true});
  assert.deepEqual(h.marks.map(m=>m.type), ["frost","water","fire"]);
});

test("sandbox specimens can preview another element without permanent mutations", () => {
  const h = harness();
  h.setDeveloper(true);
  const specimen = {kind:0,x:0,y:0,developerForcedAffinity:"flooded"};
  h.window.initializeEnemyAdaptation(specimen, "flooded");
  h.window.refreshEnemyAdaptation(specimen, 3, true);
  assert.equal(specimen.worldAffinity,"flooded");
  h.setDeveloper(false);
  h.window.refreshEnemyAdaptation(specimen, 5, true);
  assert.equal(specimen.worldAffinity,"frozen");
});

test("world aura is visible with low graphics quality", () => {
  const h = harness();
  let strokes=0;
  const context = new Proxy({stroke(){strokes++}}, {
    get(obj,key) {return key in obj ? obj[key] : ()=>{};},
    set(obj,key,value) {obj[key]=value;return true;}
  });
  for (const world of ["frozen","burning","flooded"]) {
    const enemy = {x:0,y:0,r:13,kind:0,worldAffinity:world};
    h.window.drawEnemyWorldAura(enemy,context,1,"low");
  }
  assert.equal(strokes,3);
});
