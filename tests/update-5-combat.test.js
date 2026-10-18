const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
function load(context, file) {
  context.window ??= {};
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

test("three tactical wave types alternate with a rare fourth-wave swarm", () => {
  const context = vm.createContext({});
  load(context, "js/enemies.js");
  const actual = JSON.parse(vm.runInContext(
    "JSON.stringify([1,2,3,4,5,6,7].map(n => wavePatternFor(n).name))", context,
  ));
  assert.deepEqual(actual, [
    "HARDENED PATROL", "SHIELD ESCORT", "HUNTER PINCER",
    "SWARM · SMALL ENEMIES", "SHIELD ESCORT", "HUNTER PINCER", "HARDENED PATROL",
  ]);
});

test("special waves never exceed the spawn cap and generate legitimate kinds", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let W=800,H=600,player={x:0,y:0},growthTime=750,difficulty='normal',boss=null,enemies=[],rand=(a)=>a;",
    context,
  );
  load(context, "js/enemies.js");
  // Test wave composition in isolation from the full game setup.
  vm.runInContext(`window={isBossIsolationActive:()=>false,initializeEnemyAdaptation:()=>{}};
    enemySpawn=(kind,elite=false)=>{let e={kind,elite,hp:100,damage:10,speed:60,x:0,y:0};enemies.push(e);return e;};`, context);
  vm.runInContext("spawnSpecialWave(4,10)", context);
  assert.equal(vm.runInContext("enemies.length", context), 10);
  assert.equal(vm.runInContext("enemies.every(e => [0,1].includes(e.kind))", context), true);
  assert.equal(vm.runInContext("enemies.every(e => e.hp === 46)", context), true);
});

test("Burstling and Bulwark initialize their abilities and elites receive a trait", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let W=800,H=600,player={x:0,y:0},growthTime=600,difficulty='normal',boss=null,enemies=[],rand=(a)=>a;",
    context,
  );
  load(context, "js/enemies.js");
  vm.runInContext("Math.random = () => 0; enemySpawn(5); enemySpawn(6); enemySpawn(0,true);", context);
  assert.deepEqual(JSON.parse(vm.runInContext(
    "JSON.stringify([enemies[0].burstWarning, enemies[0].armed, enemies[1].shieldActive, enemies[2].elite, enemies[2].eliteTrait])",
    context,
  )), [0, false, true, true, "charger"]);
});

test("Ranged Shade must be visible, and its projectile honors the locked aim", () => {
  const context = vm.createContext({});
  vm.runInContext("let W=800,H=600,player={x:0,y:0},enemyShots=[],rand=(a)=>a;", context);
  load(context, "js/enemies.js");
  vm.runInContext("const shade={x:340,y:0,r:15,aimAngle:Math.PI/2}; enemyFireOrb(shade);", context);
  assert.equal(vm.runInContext("rangedEnemyCanAttack(shade,340)", context), true);
  assert.equal(vm.runInContext("rangedEnemyCanAttack({x:450,y:0,r:15},450)", context), false);
  assert.equal(vm.runInContext("Math.abs(enemyShots[0].vx) < 1e-9", context), true);
  assert.equal(vm.runInContext("enemyShots[0].vy", context), 105);
  assert.ok(vm.runInContext("enemyShots[0].turnRate < 1", context));
});

test("each boss shoots visually distinct projectiles while Beau keeps MarioVis", () => {
  const context = vm.createContext({});
  vm.runInContext("let bossShots=[],player={x:0,y:0},time=240,difficulty='normal';", context);
  load(context, "js/enemies.js");
  const shots = JSON.parse(vm.runInContext(
    "JSON.stringify([0,1,2].map(variant=>{bossShots=[];const e={x:130,y:0,variant,phaseTwo:false,shotAngle:Math.PI,volleyCount:0,shootCooldown:0};bossFire(e);return {type:bossShots[0].visualType,count:bossShots.length,warning:e.shotWarning,ready:e.shootCooldown};}))",
    context,
  ));
  assert.deepEqual(shots.map(x=>x.type), ["fish", "shadow", "bell"]);
  assert.ok(shots.every(x=>x.count>=3 && x.warning===0 && x.ready>0));
  assert.notEqual(shots[0].count, shots[2].count);
});

test("the Bulwark's active shield reduces incoming damage", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let player={x:0,y:0},boss=null,upgrades={},time=0,texts=[],particles=[],playSfx=()=>{},rand=(a)=>a;",
    context,
  );
  load(context, "js/enemies.js");
  vm.runInContext("const guarded={x:15,y:0,hp:100,kind:6,r:24,shieldActive:true,knockbackX:0,knockbackY:0};damage(guarded,10);", context);
  assert.ok(Math.abs(vm.runInContext("guarded.hp", context) - 93.3) < 1e-9);
});
