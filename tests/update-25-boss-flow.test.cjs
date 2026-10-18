const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function flow(){
  const window={},context=vm.createContext({window,Math,Number});
  vm.runInContext(src("js/boss-flow.js"),context);
  return window;
}
function arenaState(mode="standard"){
  const window={};let entered=0,notifications=[],trophies=[],lootSaves=0;
  const ui={style:{},textContent:""};
  const ctx=vm.createContext({
    window,Math,Number,
    W:1100,H:750,
    player:{x:0,y:0,r:15},
    enemies:[],boss:null,bossNumber:0,bossesDefeated:0,
    bossShots:[],bossHazards:[],enemyShots:[],
    growthTime:180,time:180,runMode:mode,finalBossDefeated:false,
    difficulty:"normal",difficultyProfiles:{normal:{bossHealth:1,enemyDamage:1}},
    bossCatalog:[{name:"Beau de Hond"},{name:"Mourning Shade"},{name:"Bell Tower"}],
    nextBossTime:180,
    rand:(min,max)=>min,puff:()=>{},notify:(...a)=>notifications.push(a),
    $:()=>ui,playSfx:()=>{},trackDiscovery:()=>{},
    metaProgress:{totals:{kills:0,bosses:0},achievements:[],bossLoot:[],points:0},
    saveMetaProgress:()=>{lootSaves++},unlockAchievement:()=>{},
    awardBossLoot:(_p,key)=>{trophies.push(key);return{first:trophies.filter(x=>x===key).length===1,points:2}},
    showBossReward:()=>{},showVictory:()=>{},storageSet:()=>{},
    kills:0,highest:0,upgrades:{},texts:[],particles:[],gems:[],gemGrid:new Map(),
    runStats:null,nearbyEnemies:()=>[],bossRewardPoints:0
  });
  vm.runInContext(src("js/boss-flow.js"),ctx);
  window.beginBossIsolation=()=>{entered++;return true};
  window.finishBossIsolation=()=>true;
  vm.runInContext(src("js/enemies.js"),ctx);
  return {ctx,window,run:x=>vm.runInContext(x,ctx),
    get entered(){return entered},get notifications(){return notifications},
    get trophies(){return trophies},get lootSaves(){return lootSaves}};
}
function isolated(){
  const window=flow(),ctx=vm.createContext({window,Math,Map,
    enemies:[{kind:0,dead:false},{kind:1,dead:false}],boss:null,
    enemyShots:[],bossShots:[],bossHazards:[],
    enemyGrid:new Map(),waveTimer:0,spawn:-10,runMode:"standard",
    rebuildEnemyGrid:()=>{}});
  vm.runInContext(src("js/boss-isolation.js"),ctx);
  return {window,ctx};
}
test("standard guardians are Beau, Shade, Bell, then final after 25 minutes",()=>{
  const h=flow();
  for(const [defeated,clock,ordinaryAt,expected] of [
    [0,179,180,null],[0,180,180,"ordinary"],
    [1,360,360,"ordinary"],[2,540,540,"ordinary"],
    [3,1499,0,null],[3,1500,0,"final"],[2,1500,0,"ordinary"]
  ]) assert.equal(h.bossFlowSchedule("standard",defeated,clock,ordinaryAt),expected);
  assert.equal(h.bossFlowSchedule("standard",4,1500,0,true),null);
  assert.deepEqual(Array.from(h.bossFlowBossNames),
    ["BEAU DE HOND","MOURNING SHADE","BELL TOWER","THE LAST MEME"]);
});
test("the finale cannot be spawned early or twice, but developer sandbox may quick-test",()=>{
  const f=flow(),can=f.bossFlowCanFinale;
  for(const at of [180,540,1499]){
    assert.equal(can("standard",3,at,false,false),false);
  }
  assert.equal(can("standard",2,1500,false,false),false);
  assert.equal(can("standard",3,1500,false,false),true);
  assert.equal(can("standard",3,1500,true,false),false);
  assert.equal(can("endless",3,1600,false,false),false);
  assert.equal(can("standard",0,0,false,true),true);
  assert.equal(can("endless",0,1500,false,true),false);
});
test("actual final-boss spawn rejects pre-finale game state without opening arena",()=>{
  const h=arenaState();
  assert.equal(h.run("spawnFinalBoss()"),false);
  assert.equal(h.entered,0);
  assert.equal(h.run("bossNumber"),0);
  h.run("bossesDefeated=3;time=1499");
  assert.equal(h.run("spawnFinalBoss()"),false);
  assert.equal(h.entered,0);
  h.run("time=1500");
  assert.equal(h.run("spawnFinalBoss()"),true);
  assert.equal(h.run("boss.bossName"),"THE LAST MEME");
  assert.equal(h.run("bossNumber"),1);
  assert.equal(h.entered,1);
  assert.equal(h.run("spawnFinalBoss()"),false);
  assert.equal(h.entered,1);
});
test("real boss identities align with earned guardians in Normal Standard",()=>{
  const h=arenaState();
  for(let i=0;i<3;i++){
    h.run("spawnBoss()");
    assert.equal(h.run("boss.variant"),i);
    assert.equal(h.run("boss.bossName"),
      ["BEAU DE HOND","MOURNING SHADE","BELL TOWER"][i]);
    h.run("boss=null;enemies=[];bossesDefeated++");
  }
  assert.equal(h.run("spawnBoss()"),false);
  assert.equal(h.run("bossNumber"),3);
  assert.equal(h.entered,3);
});
test("Endless starts a FRESH Beau-then-Shade-then-Bell rotation after the Last Meme",()=>{
  const h=flow();
  const expected=["BEAU DE HOND","MOURNING SHADE","BELL TOWER"];
  for(let i=0;i<3;i++){
    assert.equal(h.bossFlowOrdinaryVariant("standard",i+1),i);
    assert.equal(h.bossFlowOrdinaryVariant("endless",i+1),i);
    assert.equal(h.bossFlowOrdinaryVariant("endless",i+5),i);
    assert.equal(h.bossFlowNextName("endless",9,i+4),expected[i]);
  }
  assert.equal(h.bossFlowOrdinaryVariant("endless",8),0);
  const game=arenaState("endless");
  game.run("bossNumber=4");
  assert.equal(game.run("spawnBoss()"),true);
  assert.equal(game.run("boss.bossName"),"BEAU DE HOND");
});
test("real boss death counts and awards the trophy only once",()=>{
  const h=arenaState();
  h.run("bossNumber=3;bossesDefeated=2;time=740;spawnBoss()");
  const id=h.run("boss");
  assert.equal(h.run("boss.bossName"),"BEAU DE HOND",
    "sandbox direct-spawn uses the incremented boss index and cycles only in Endless");
  // Reset to a real third ordinary boss, with just enough health to be defeated.
  h.run("boss=null;enemies=[];bossNumber=2;bossesDefeated=2;spawnBoss()");
  assert.equal(h.run("boss.bossName"),"BELL TOWER");
  h.run("boss.hp=1;damage(boss,1000)");
  assert.equal(h.run("bossesDefeated"),3);
  assert.equal(h.run("nextBossTime"),1500);
  assert.equal(h.trophies.filter(x=>x==="bell").length,1);
  assert.equal(h.run("metaProgress.totals.bosses"),1);
  // The same dead entity is already marked; another hit cannot award again.
  h.run("damage(enemies.find(e=>e.dead),1000)");
  assert.equal(h.trophies.length,1);
});
test("isolation drops regular horde without XP, keeps summons exclusive to the boss",()=>{
  const h=isolated();
  h.ctx.kills=20;h.ctx.xp=53;
  assert.equal(h.window.beginBossIsolation(),true);
  assert.equal(h.ctx.enemies.length,0);
  assert.equal(h.ctx.kills,20);
  assert.equal(h.ctx.xp,53);
  h.ctx.boss={kind:3,hp:500};
  h.ctx.enemies.push(h.ctx.boss,{kind:1,summoned:true});
  assert.equal(h.window.bossIsolationStatus().allowedEnemies,2);
  assert.equal(h.window.beginBossIsolation(),false);
  assert.equal(h.ctx.enemies.length,2);
});
test("boss exit removes minions, residual projectiles and prevents catch-up waves",()=>{
  const h=isolated();
  h.window.beginBossIsolation();
  h.ctx.boss={kind:3,dead:true,hp:0};
  h.ctx.enemies.push(h.ctx.boss,{kind:1,summoned:true});
  h.ctx.bossShots.push({danger:true});
  h.ctx.bossHazards.push({danger:true});
  h.ctx.waveTimer=-17;
  assert.equal(h.window.finishBossIsolation(h.ctx.boss),true);
  assert.equal(h.ctx.waveTimer,12);
  assert.equal(h.ctx.enemies.length,0);
  assert.equal(h.ctx.bossShots.length,0);
  assert.equal(h.ctx.bossHazards.length,0);
  assert.equal(h.window.isBossIsolationActive(),false);
  assert.equal(h.window.finishBossIsolation(h.ctx.boss),false);
  assert.equal(h.ctx.waveTimer,12);
  const h2=isolated();
  h2.ctx.runMode="endless";
  h2.window.beginBossIsolation();
  h2.ctx.waveTimer=0;
  h2.window.finishBossIsolation();
  assert.equal(h2.ctx.waveTimer,8);
});
test("the UI names the actual NEXT guardian during Standard and Endless modes",()=>{
  const f=flow();
  assert.equal(f.bossFlowNextName("standard",0,0),"BEAU DE HOND");
  assert.equal(f.bossFlowNextName("standard",1,1),"MOURNING SHADE");
  assert.equal(f.bossFlowNextName("standard",2,2),"BELL TOWER");
  assert.equal(f.bossFlowNextName("standard",3,3),"THE LAST MEME");
  assert.equal(f.bossFlowNextName("standard",4,4,true),"WORLD CONQUERED");
  const game=src("js/game.js");
  assert.match(game,/window\.bossFlowNextName\?\.\(/);
  assert.match(game,/NEXT \\"\+nextName|NEXT \$\{nextName\}|\\?" · NEXT \\"/);
});
test("victory saving and endless continuing retain one run record and award",()=>{
  const progression=src("js/progression.js"),game=src("js/game.js");
  assert.match(progression,/if \(typeof victoryClaimed !== "undefined" && victoryClaimed\) return false;/);
  assert.match(progression,/recordRun\("victory"\);/);
  assert.match(progression,/if \(wasRecorded && !\(mode === "endless" && won\)\) return false;/);
  assert.match(game,/if \(gameState !== "victory" \|\| !victoryClaimed\) return false;/);
  assert.match(game,/endlessStartTime = time;/);
  assert.match(game,/nextBossTime = time \+ 180;/);
  assert.match(game,/window\.completeWorldConquest\?\.\(\);/);
  assert.match(src("js/enemies.js"),/window\.finishBossIsolation\?\.\(e\);\s*boss = null;/);
  assert.match(src("index.html"),/js\/boss-flow\.js\?v=25/);
});
