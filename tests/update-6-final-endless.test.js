const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
function load(context, file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

test("old saves keep progress and unlock the new mode fields safely", () => {
  const old = JSON.stringify({
    version: 2, points: 13, hpLevel: 2, damageLevel: 1,
    totals: { kills: 700, bosses: 5, runs: 4 },
    runs: [{ survived: 700, kills: 120, level: 12, bosses: 2, difficulty: "normal" }],
  });
  const context = vm.createContext({ localStorage: { getItem: () => old, setItem: () => {} } });
  load(context, "js/storage.js");
  const progress = JSON.parse(vm.runInContext("JSON.stringify(loadMetaProgress())", context));
  assert.equal(progress.version, 3);
  assert.equal(progress.points, 13);
  assert.equal(progress.totals.wins, 0);
  assert.equal(progress.endlessUnlocked, false);
  assert.equal(progress.records.standard.normal.survived, 700);
  assert.equal(progress.runs[0].mode, "standard");
});

test("per-mode records never overwrite each other's difficulty records", () => {
  const context = vm.createContext({});
  load(context, "js/storage.js");
  vm.runInContext(
    "let p = { records: emptyModeRecords() }; updateModeRecord(p,'standard','easy',{survived:800,kills:50,bosses:4},true); updateModeRecord(p,'endless','normal',{survived:2000,kills:300,bosses:9});",
    context,
  );
  const snapshot = JSON.parse(vm.runInContext("JSON.stringify(p.records)", context));
  assert.equal(snapshot.standard.easy.wins, 1);
  assert.equal(snapshot.standard.easy.survived, 800);
  assert.equal(snapshot.standard.normal.survived ?? 0, 0);
  assert.equal(snapshot.endless.normal.survived, 2000);
});

test("standard victory grants its unlock and bonus only once", () => {
  const context = vm.createContext({
    localStorage: { getItem: () => null, setItem: () => {} },
    notify: () => {},
  });
  load(context, "js/storage.js");
  vm.runInContext(
    "let metaProgress=loadMetaProgress(),victoryClaimed=false,runRecorded=false,runMode='standard',time=1508,kills=150,level=22,bossesDefeated=7,difficulty='normal',runDamageTaken=5;",
    context,
  );
  load(context, "js/progression.js");
  vm.runInContext("grantFinalVictory(); grantFinalVictory();", context);
  const state = JSON.parse(vm.runInContext(
    "JSON.stringify({p:metaProgress, victoryClaimed, runRecorded, runRewardSettled})", context,
  ));
  assert.equal(state.p.endlessUnlocked, true);
  assert.equal(state.p.totals.wins, 1);
  assert.equal(state.p.totals.runs, 1);
  assert.equal(state.p.points, 12 + Math.floor(150 / 100) + 7 * 3);
  assert.equal(state.p.records.standard.normal.wins, 1);
  assert.equal(state.p.achievements.filter(a => a.id === "finalVictory").length, 1);
  assert.equal(state.p.runs.length, 1);
});

test("continuing the same victory into Endless updates one run and only new points", () => {
  const context = vm.createContext({
    localStorage: { getItem: () => null, setItem: () => {} },
    notify: () => {},
  });
  load(context, "js/storage.js");
  vm.runInContext(
    "let metaProgress=loadMetaProgress(),victoryClaimed=false,runRecorded=false,runMode='standard',time=1503,kills=120,level=21,bossesDefeated=6,difficulty='normal',runDamageTaken=3;",
    context,
  );
  load(context, "js/progression.js");
  vm.runInContext("grantFinalVictory(); runMode='endless'; time=1880; kills=230; bossesDefeated=8; recordRun('defeat');", context);
  const state = JSON.parse(vm.runInContext("JSON.stringify(metaProgress)", context));
  assert.equal(state.totals.runs, 1);
  assert.equal(state.totals.wins, 1);
  assert.equal(state.runs.length, 1);
  assert.equal(state.runs[0].mode, "endless");
  assert.equal(state.runs[0].victory, true);
  assert.equal(state.records.standard.normal.wins, 1);
  assert.equal(state.records.endless.normal.survived, 1880);
  assert.equal(state.points, 12 + Math.floor(230 / 100) + 8 * 3);
});

test("final boss spawns with own phases and blocks the next ordinary boss", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let W=800,H=600,player={x:0,y:0},difficulty='normal',time=1500,boss=null,enemies=[],bossNumber=5,nextBossTime=1500,rand=(a)=>a,particles=[];let notify=()=>{},playSfx=()=>{},$=()=>({style:{},set textContent(v){},set innerHTML(v){}});",
    context,
  );
  load(context, "js/enemies.js");
  vm.runInContext("spawnFinalBoss()", context);
  assert.equal(vm.runInContext("boss.isFinalBoss && boss.finalPhase === 1", context), true);
  assert.equal(vm.runInContext("boss.maxHp > 5000 && enemies.includes(boss)", context), true);
  assert.equal(vm.runInContext("nextBossTime", context), Infinity);
  assert.equal(vm.runInContext("bossCatalog.length", context), 4);
});

test("three final boss projectile patterns are distinct and telegraphed ground attack is queued", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let player={x:0,y:0},time=1500,difficulty='normal',bossShots=[],bossHazards=[];",
    context,
  );
  load(context, "js/enemies.js");
  const counts = [];
  for (let pattern = 0; pattern < 3; pattern++) {
    vm.runInContext(
      `bossShots=[]; bossHazards=[]; var target = {x:120,y:0,isFinalBoss:true,shotAngle:Math.PI,shotRotation:0.4,shotPattern:${pattern},warningX:45,warningY:30,finalPhase:2,volleyCount:1}; finalBossFire(target);`,
      context,
    );
    counts.push(JSON.parse(vm.runInContext("JSON.stringify({shots:bossShots.length,hazards:bossHazards.length,visual:bossShots[0]?.visualType,warning:bossHazards[0]?.warning})", context)));
  }
  assert.equal(counts[0].visual, "rift");
  assert.equal(counts[0].shots, 6);
  assert.equal(counts[1].visual, "shadow");
  assert.ok(counts[1].shots >= 8);
  assert.equal(counts[2].shots, 0);
  assert.equal(counts[2].hazards, 1);
  assert.equal(counts[2].warning > 0, true);
});

test("Endless difficulty scales only after the standard 25-minute period", () => {
  const context = vm.createContext({});
  vm.runInContext("let runMode='endless',time=1200,endlessStartTime=0;", context);
  load(context, "js/enemies.js");
  assert.equal(vm.runInContext("currentEndlessTier()", context), 0);
  vm.runInContext("time=1800;", context);
  assert.equal(vm.runInContext("currentEndlessTier()", context), 2);
  vm.runInContext("endlessStartTime=1800; time=1800;", context);
  assert.equal(vm.runInContext("currentEndlessTier()", context), 0);
  vm.runInContext("time=3600;", context);
  assert.equal(vm.runInContext("currentEndlessTier()", context), 15);
  vm.runInContext("runMode='standard';", context);
  assert.equal(vm.runInContext("currentEndlessTier()", context), 0);
});

test("the final boss death opens Victory instead of a standard boss trophy", () => {
  const context = vm.createContext({});
  vm.runInContext(
    "let boss=null,bossNumber=7,bossesDefeated=6,time=1501,nextBossTime=1500,difficulty='normal',bossShots=[],bossHazards=[],enemies=[],gems=[],gemGrid=new Map(),texts=[],particles=[],player={x:0,y:0},upgrades={},kills=0,highest=0,metaProgress={totals:{kills:0,bosses:6,runs:0,wins:0},achievements:[]},rand=(a)=>a,playSfx=()=>{},storageSet=()=>{},saveMetaProgress=()=>{},unlockAchievement=()=>{},$=()=>({style:{}}),showBossReward=()=>{throw Error('Final boss must not show ordinary reward')},victories=0,showVictory=()=>victories++;",
    context,
  );
  load(context, "js/enemies.js");
  vm.runInContext(
    "boss={x:10,y:0,r:50,hp:1,maxHp:1,kind:3,isFinalBoss:true};enemies.push(boss);damage(boss,10);damage(boss,10);",
    context,
  );
  assert.equal(vm.runInContext("victories", context), 1);
  assert.equal(vm.runInContext("bossesDefeated", context), 7);
  assert.equal(vm.runInContext("metaProgress.totals.bosses", context), 7);
});
