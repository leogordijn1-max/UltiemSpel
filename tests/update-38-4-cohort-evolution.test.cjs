const test=require("node:test"),assert=require("node:assert/strict"),
 fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
function harness(){
 const state={bosses:0,developer:false},window={
  enemyRunBossCount:()=>state.bosses,
  isDeveloperRun:()=>state.developer
 };
 const context=vm.createContext({window,Math});
 for(const file of ["js/enemy-evolution.js","js/enemy-progression.js"])
  vm.runInContext(source(file),context,{filename:file});
 const roster=seconds=>Array.from(window.enemyProgressionStatus(seconds).unlocked);
 return {state,window,roster};
}
const body=kind=>({kind,x:0,y:0,hp:100,damage:12,speed:100,r:15});

test("family introductions require BOTH time unlock AND actual Guardian victory",()=>{
 const h=harness();
 assert.deepEqual(h.roster(900),[0,1]);
 h.state.bosses=1;
 assert.deepEqual(h.roster(180),[0,1,4]);
 assert.deepEqual(h.roster(360),[0,1,4,2]);
 assert.deepEqual(h.roster(900),[0,1,4,2]);
 h.state.bosses=2;
 assert.deepEqual(h.roster(540),[0,1,4,2,5]);
 assert.deepEqual(h.roster(720),[0,1,4,2,5,6]);
 h.state.bosses=3;
 assert.deepEqual(h.roster(900),[0,1,4,2,5,6]);
});
test("ambient, forced patrol kinds, and defense roles respect the actual chapter roster",()=>{
 const h=harness();for(const bosses of [0,1,2,3]){
  h.state.bosses=bosses;
  const valid=h.roster(900);
  for(let i=0;i<100;i++){
   assert.ok(valid.includes(h.window.pickAmbientEnemyKind(900,i/100)));
   for(const kind of [0,1,2,4,5,6])
    assert.ok(valid.includes(h.window.resolveEncounterEnemyKind(kind,900,i)));
   for(const role of ["commander","defender","hunter","ranger"])
    assert.ok(valid.includes(h.window.enemyDefenseRoleKind(role,900)));
  }
 }
});
test("delayed boss rewards introduce a group together and announce each only once",()=>{
 const h=harness(),messages=[];
 const announce=x=>messages.push(x);
 h.window.updateEnemyProgression(900,announce);
 assert.equal(messages.length,0);
 h.state.bosses=1;h.window.updateEnemyProgression(900,announce);
 assert.equal(messages.length,2);
 assert.match(messages[0],/RANGED SHADE/);assert.match(messages[1],/ZOMBIE MIKE/);
 h.window.updateEnemyProgression(900,announce);
 assert.equal(messages.length,2);
 h.state.bosses=2;h.window.updateEnemyProgression(900,announce);
 assert.equal(messages.length,4);
 assert.match(messages[2],/BURSTLING/);assert.match(messages[3],/BULWARK/);
 h.window.updateEnemyProgression(900,announce);assert.equal(messages.length,4);
});
test("birth-era is not family LV: a LV1 Burstling joins a LV3 Drifter with matching world colour",()=>{
 const h=harness();h.state.bosses=2;
 const drifter=body(0),shade=body(4),burst=body(5),bulwark=body(6);
 for(const e of [drifter,shade,burst,bulwark])h.window.applyEnemyEvolution(e,h.state.bosses);
 assert.deepEqual([drifter.evolutionLevel,shade.evolutionLevel,burst.evolutionLevel,bulwark.evolutionLevel],
  [3,2,1,1]);
 assert.ok([drifter,shade,burst,bulwark].every(e=>e.worldThreatTier===2));
 assert.equal(h.window.enemyFamilyDebutBossCount(5),2);
 assert.equal(h.window.enemyFamilyDebutBossCount(6),2);
 h.state.bosses=3;
 const next=body(5);h.window.applyEnemyEvolution(next,h.state.bosses);
 assert.equal(next.evolutionLevel,2);
 assert.equal(next.worldThreatTier,3);
});
test("developer preview remains possible without mutating the real run chapter",()=>{
 const h=harness();h.state.developer=true;
 assert.deepEqual(h.roster(0),[0,1]);
 assert.equal(h.window.developerUnlockNextEnemy(0),true);
 assert.deepEqual(h.roster(0),[0,1,4]);
 const preview=body(4);h.window.applyEnemyEvolution(preview,0);
 assert.equal(preview.evolutionLevel,1);
 assert.equal(preview.worldThreatTier,0);
 h.state.developer=false;
 assert.deepEqual(h.roster(0),[0,1]);
});
test("the real game supplies current boss kills to both roster and spawn evolutions",()=>{
 const game=source("js/game.js"),enemies=source("js/enemies.js"),
  index=source("index.html");
 assert.match(game,/window\.enemyRunBossCount=\(\)=>bossesDefeated/);
 assert.match(enemies,/window\.applyEnemyEvolution\?\.\(e,bossesDefeated,difficulty\)/);
 assert.ok(index.indexOf("js/enemy-progression.js")<index.indexOf("js/enemy-evolution.js"));
 assert.ok(index.indexOf("js/enemy-evolution.js")<index.indexOf("js/beau-encounter.js"));
});
