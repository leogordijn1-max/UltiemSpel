const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const ELEMENTS={
  fire:["flame","fireball","flameOrbit"],
  water:["waterBolt","tidalWave","whirlpool"],
  frost:["frost","iceShards","glacialPulse"]
};
function extractGameFunctions(){
  const sourceText=source("js/game.js");
  const start=sourceText.indexOf("function showVictory() {");
  const end=sourceText.indexOf("\nfunction end() {",start);
  const finish=sourceText.indexOf("\n// A levelled Death Pulse",end);
  assert.ok(start>0&&end>start&&finish>end,"real victory, Endless and defeat functions found");
  return sourceText.slice(start,finish);
}
function campaign(element="fire",mode="standard"){
  const store=new Map([["shadowDominantWorldV1",JSON.stringify({dominant:"frozen"})]]);
  const notifications=[],trohies=[],panels=[],sounds=[];
  const nodes=new Map();
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{style:{},textContent:"",classList:{toggle(){}},
      append(){},replaceChildren(){},setAttribute(){},remove(){}});
    return nodes.get(id);
  };
  const window={};
  const metaProgress={
    totals:{kills:0,bosses:0,runs:0,wins:0},points:0,
    runs:[],bossLoot:[],achievements:[],endlessUnlocked:false,
    damageLevel:0,weaponMasteries:[],hpLevel:0,weaponMastery:[],
    bestFlawlessSurvival:0
  };
  let saveCount=0;
  const context=vm.createContext({
    window,Math,Map,Set,Number,JSON,Date,
    performance:{now:()=>0},
    document:{
      getElementById:node,
      createElement:()=>({style:{},textContent:"",className:"",
        onclick:null,append(){},setAttribute(){}})
    },
    storageGet:(key,fallback)=>store.has(key)?store.get(key):fallback,
    storageSet:(key,value)=>store.set(key,value),
    currentLivingWorldElement:()=>element,
    $:node,panel:(title,body,callback)=>{
      const parent={append:()=>{}};
      panels.push({title,body});
      callback(parent);
    },
    showMainMenu:()=>{},hud:()=>{},choices:()=>{},
    renderRunSummaryPanel:()=>{},playSfx:key=>sounds.push(key),
    rand:(min,max)=>min,puff:()=>{},trackDiscovery:()=>{},
    notify:(...values)=>notifications.push(values),
    saveMetaProgress:()=>{saveCount++},
    awardBossLoot:(_meta,key)=>{
      const first=!trohies.includes(key);
      if(first)trohies.push(key);
      return {first,points:first?3:0};
    },
    grantAchievement:()=>false,
    updateModeRecord:()=>{},normalizeRunStats:x=>x,
    difficulty:"normal",runMode:mode,menuRunMode:mode,
    active:true,paused:false,choiceScreenOpen:false,gameState:"playing",
    W:1280,H:720,player:{x:0,y:0,r:15,hp:160,maxHp:160,inv:0},
    enemies:[],boss:null,bossNumber:0,bossesDefeated:0,bossShots:[],
    bossHazards:[],enemyShots:[],enemyGrid:new Map(),gemGrid:new Map(),
    texts:[],particles:[],gems:[],kills:0,highest:0,
    time:0,growthTime:0,nextBossTime:180,
    waveTimer:70,spawn:0,finalBossDefeated:false,
    victoryClaimed:false,pendingLevelUps:0,
    weaponTimers:{},selectedWeapons:ELEMENTS[element].slice(),
    unlockedWeapons:[ELEMENTS[element][0]],
    upgrades:{damage:0,critChance:0,knockback:0},
    evolutions:{},recentAchievements:[],
    selectedCharacter:undefined,runStats:null,
    level:1,metaProgress,runDamageTaken:0,
    bossRewardPoints:0,simulationAccumulator:0,
    menuDifficulty:"normal",gameSpeed:1,
    startWeapon:ELEMENTS[element][0],
    endlessStartTime:0
  });
  for(const file of ["js/boss-flow.js","js/world-state.js",
    "js/progression.js","js/upgrades.js","js/enemies.js","js/boss-isolation.js"])
    vm.runInContext(source(file),context,{filename:file});
  vm.runInContext(extractGameFunctions(),context,{filename:"extracted-game-finish.js"});
  // The live UI gets a boss reward modal; replay asserts rewards separately
  // while avoiding a fake human click on a randomly offered card.
  vm.runInContext("showBossReward=()=>{choiceScreenOpen=false;paused=false;gameState='playing'}",context);
  context.window.beginWorldRun();
  return {
    context,window,store,metaProgress,notifications,trophies:trohies,panels,sounds,
    get saveCount(){return saveCount},
    run:script=>vm.runInContext(script,context),
    go:time=>{context.time=time;context.growthTime=time},
    defeatBoss(){
      assert.ok(context.boss,"a Guardian must be alive before an earned kill");
      const id=context.boss.bossName;
      context.damage(context.boss,10000000);
      assert.equal(context.boss,null,"boss isolation clears active boss after death");
      return id;
    }
  };
}
function simulate(element="fire"){
  const h=campaign(element);
  const bossSchedule=[
    {start:180,death:290,id:"BEAU DE HOND",target:15},
    {start:470,death:650,id:"THE MOURNING SHADE",target:50},
    {start:840,death:1025,id:"THE BELL TOWER",target:85}
  ];
  for(let i=0;i<bossSchedule.length;i++){
    const event=bossSchedule[i];
    h.go(event.start);
    assert.equal(h.context.nextBossEncounter(
      "standard",h.context.bossesDefeated,event.start,h.context.nextBossTime,false),"ordinary");
    assert.equal(h.context.spawnBoss(),true);
    assert.equal(h.context.boss.bossName,event.id);
    assert.equal(h.window.isBossIsolationActive(),true);
    assert.equal(h.context.enemies.filter(e=>!e.dead&&!e.summoned).length,1);
    h.go(event.death);
    h.defeatBoss();
    assert.equal(h.context.bossesDefeated,i+1);
    assert.equal(h.window.isBossIsolationActive(),false);
    assert.equal(h.window.getWorldConquest().target,event.target);
    assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"frozen");
    if(i===0){
      // Requirements are earned through upgrades in the actual game; replay
      // directly sets the exact earned levels rather than granting free XP.
      const r=h.run("evolutionRecipes.find(r=>r.weapon===selectedWeapons[0])");
      h.context.upgrades[r.weapon]=5;
      h.context.upgrades[r.support]=3;
      h.go(600);
      assert.equal(h.run("eligibleEvolutions().length"),1);
      assert.equal(h.run("evolveWeapon(eligibleEvolutions()[0],{consumeLevel:false})"),true);
      assert.equal(h.run("Object.values(evolutions).filter(Boolean).length"),1);
      h.go(event.death);
    }
    if(i===2){
      const r=h.run("evolutionRecipes.find(r=>r.weapon===selectedWeapons[1])");
      h.context.unlockedWeapons.push(r.weapon);
      h.context.upgrades[r.weapon]=5;
      h.context.upgrades[r.support]=3;
      h.go(1019);
      assert.equal(h.run("eligibleEvolutions().length"),0,
        "second evolution cannot appear before 17:00");
      h.go(1020);
      assert.equal(h.run("eligibleEvolutions().length"),1);
      assert.equal(h.run("evolveWeapon(eligibleEvolutions()[0],{consumeLevel:false})"),true);
      assert.equal(h.run("Object.values(evolutions).filter(Boolean).length"),2);
      assert.equal(h.run("eligibleEvolutions().length"),0,
        "standard permits precisely two earned evolutions");
      h.go(event.death);
    }
  }
  h.go(1499);
  assert.equal(h.context.nextBossEncounter("standard",3,1499,1500,false),null);
  assert.equal(h.context.spawnFinalBoss(),false);
  h.go(1500);
  assert.equal(h.context.nextBossEncounter("standard",3,1500,1500,false),"final");
  assert.equal(h.context.spawnFinalBoss(),true);
  assert.equal(h.context.boss.bossName,"THE LAST MEME");
  assert.equal(h.context.enemies.filter(e=>!e.dead&&!e.summoned).length,1);
  assert.equal(h.window.isBossIsolationActive(),true);
  h.go(1600);
  h.defeatBoss();
  assert.equal(h.context.gameState,"victory");
  assert.equal(h.context.victoryClaimed,true);
  assert.equal(h.context.finalBossDefeated,true);
  assert.equal(h.window.getWorldConquest().conquered,true);
  const expectedWorld={fire:"burning",water:"flooded",frost:"frozen"}[element];
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,expectedWorld);
  assert.equal(h.metaProgress.totals.wins,1);
  assert.equal(h.metaProgress.totals.runs,1);
  assert.equal(h.metaProgress.endlessUnlocked,true);
  assert.equal(h.metaProgress.runs.length,1);
  assert.equal(h.metaProgress.runs[0].evolutionCount,2);
  assert.equal(h.metaProgress.runs[0].worldImpact,100);
  assert.equal(h.context.bossesDefeated,4);
  return h;
}
test("Fire Standard: 26m40s real-boss campaign reaches two earned evolutions and permanent victory",()=>{
  const h=simulate("fire");
  assert.equal(h.context.runMode,"standard");
  assert.equal(h.trophies.length,4);
  assert.deepEqual(Array.from(h.trophies),["beau","mourning","bell","final"]);
  assert.equal(h.panels.at(-1).title,"VICTORY · THE NIGHT IS YOURS");
});
test("Water Standard: same real boss/evolution campaign conquers frozen world",()=>{
  const h=simulate("water");
  assert.equal(h.window.getWorldConquest().invading,"flooded");
  assert.equal(h.metaProgress.runs[0].runElement,"water");
});
test("Frost Standard: full boss schedule works without fake elemental opposition",()=>{
  const h=simulate("frost");
  assert.equal(h.window.getWorldConquest().invading,"frozen");
  assert.equal(h.metaProgress.runs[0].runElement,"frost");
});
test("after a real victory, Endless restarts with Beau and has no second victory bonus",()=>{
  const h=simulate("fire");
  const points=h.metaProgress.points;
  const recordId=h.metaProgress.runs[0].id;
  assert.equal(h.context.continueEndlessAfterVictory(),true);
  assert.equal(h.context.runMode,"endless");
  assert.equal(h.context.paused,false);
  assert.equal(h.context.gameState,"playing");
  assert.equal(h.context.nextBossTime,1780);
  assert.equal(h.context.continueEndlessAfterVictory(),false);
  h.go(1780);
  assert.equal(h.context.spawnBoss(),true);
  assert.equal(h.context.boss.bossName,"BEAU DE HOND");
  assert.equal(h.metaProgress.totals.wins,1);
  assert.equal(h.metaProgress.totals.runs,1);
  assert.equal(h.metaProgress.runs[0].id,recordId);
  assert.equal(h.metaProgress.points,points);
});
test("Endless death shows the conquered INVADER world, never the old defender",()=>{
  const h=simulate("water");
  assert.equal(h.context.continueEndlessAfterVictory(),true);
  h.go(1800);
  h.context.end();
  assert.equal(h.context.gameState,"game-over");
  assert.match(h.panels.at(-1).body,/World:<\/b> FLOODED · CONQUERED IN STANDARD · ENDLESS ENDED · 100% PEAK INVASION/);
  assert.equal(h.metaProgress.totals.wins,1);
  assert.equal(h.metaProgress.totals.runs,1);
  assert.equal(h.metaProgress.runs[0].id,h.metaProgress.runs[0].id);
  assert.equal(h.metaProgress.runs[0].mode,"endless");
  assert.equal(h.metaProgress.runs[0].victory,true);
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"flooded");
});
test("death before final boss restores native world, respects earned peak, and saves no win",()=>{
  const h=campaign("fire");
  h.go(180);h.context.spawnBoss();
  h.go(280);h.defeatBoss();
  h.go(470);h.context.spawnBoss();
  h.go(625);h.defeatBoss();
  h.go(720);h.context.end();
  assert.equal(h.window.getWorldConquest().restored,true);
  assert.equal(h.window.getWorldConquest().restorationPeak,50);
  assert.equal(h.context.gameState,"game-over");
  assert.match(h.panels.at(-1).body,/FROZEN · DEFENDERS RETAINED THEIR WORLD · 50% PEAK INVASION/);
  assert.equal(h.metaProgress.totals.wins,0);
  assert.equal(h.metaProgress.endlessUnlocked,false);
  assert.equal(h.metaProgress.runs.length,1);
  assert.equal(h.metaProgress.runs[0].worldImpact,50);
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"frozen");
});
test("time skip or boss not earned cannot prematurely unlock the Last Meme",()=>{
  for(const defeats of [0,1,2]){
    const h=campaign("fire");
    h.context.bossesDefeated=defeats;
    h.go(1800);
    assert.equal(h.context.spawnFinalBoss(),false);
    assert.equal(h.context.boss,null);
    assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"frozen");
  }
});
test("3 bosses plus zero evolution prerequisites does not conjure free evolution",()=>{
  const h=campaign("fire");
  h.context.bossesDefeated=3;
  h.go(1400);
  assert.equal(h.run("eligibleEvolutions().length"),0);
  assert.equal(h.run("Object.values(evolutions).filter(Boolean).length"),0);
  assert.equal(h.context.upgrades.flame||0,0);
});
test("no accidental third evolution after legitimately completing two",()=>{
  const h=simulate("water");
  h.context.runMode="endless";
  h.context.unlockedWeapons.push(h.context.selectedWeapons[2]);
  h.context.upgrades.whirlpool=5;
  h.context.upgrades.magnet=3;
  h.go(2600);
  assert.equal(h.run("eligibleEvolutions().length"),0);
});
test("replay uses actual module functions and preserves existing 1x/2x/3x sim timing",()=>{
  const game=source("js/game.js"),elements=source("js/elements.js");
  assert.match(game,/function update\(dt\) \{\s*time \+= dt;/);
  assert.match(game,/simulationAccumulator \+= Math\.min\(elapsed, 0\.1\) \* gameSpeed;/);
  assert.match(game,/const fixedStep = 1 \/ 60;/);
  assert.match(game,/nextBossEncounter\(\s*runMode,bossesDefeated,time,nextBossTime,finalBossDefeated\)/);
  assert.match(game,/if\(encounter==="final"\)spawnFinalBoss\(\)/);
  for(const list of Object.values(ELEMENTS))for(const key of list)
    assert.ok(elements.includes('"'+key+'"'));
});
