const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function sandbox(){
  const window={},context=vm.createContext({window,Math});
  vm.runInContext(read("js/enemies.js"),context,{filename:"js/enemies.js"});
  vm.runInContext(read("js/encounter-pacing.js"),context,{filename:"js/encounter-pacing.js"});
  return {window,context};
}
test("Standard boss schedule has Beau, Mourning and Bell before The Last Meme",()=>{
  const h=sandbox(),what=(defeated,clock,next=180)=>
    vm.runInContext(`nextBossEncounter("standard",${defeated},${clock},${next})`,h.context);
  assert.equal(what(0,179),null);
  assert.equal(what(0,180),"ordinary");
  assert.equal(what(1,360,360),"ordinary");
  assert.equal(what(2,720,720),"ordinary");
  assert.equal(what(3,720,720),null);
  assert.equal(what(3,1499,900),null);
  assert.equal(what(3,1500,900),"final");
  assert.equal(what(2,1500,900),"ordinary",
    "final boss must not skip Bell if third guardian is still pending");
  assert.equal(vm.runInContext('nextBossEncounter("standard",4,1700,0,true)',h.context),null);
});
test("completed standard guardians cannot cycle back to Beau",()=>{
  const h=sandbox();
  vm.runInContext('var boss=null,runMode="standard",bossNumber=3',h.context);
  assert.equal(vm.runInContext("spawnBoss()",h.context),false);
  assert.equal(vm.runInContext("bossNumber",h.context),3);
  assert.match(read("js/enemies.js"),/STANDARD_BOSS_COUNT = 3/);
  assert.match(read("js/enemies.js"),/bossNumber\s*-\s*1\) % 3/);
  assert.match(read("js/game.js"),/nextBossEncounter\(/);
  assert.match(read("js/enemies.js"),/bossesDefeated>=STANDARD_BOSS_COUNT[\s\S]{0,100}FINAL_BOSS_TIME/);
});
test("Endless Mode still has repeatable ordinary boss fights",()=>{
  const h=sandbox();
  assert.equal(vm.runInContext('nextBossEncounter("endless",7,1800,1800)',h.context),"ordinary");
  assert.equal(vm.runInContext('nextBossEncounter("endless",7,1700,1800)',h.context),null);
});
test("XP per tactical kill rises as fewer enemies appear late in the run",()=>{
  const h=sandbox(),m=h.window.encounterXpMultiplier;
  assert.equal(m(0,"patrol"),2.8);
  assert.ok(m(1020,"patrol")>=4);
  assert.ok(m(1500,"patrol")<=4.8);
  assert.ok(m(900,"wave")>m(0,"wave"));
  assert.ok(m(900,"defense")>m(0,"defense"));
  assert.equal(m(1000,"swarm"),.44);
  assert.match(read("js/enemies.js"),/encounterXpMultiplier\?\.\(growthTime,"wave"\)/);
  assert.match(read("js/world-defense.js"),/encounterXpMultiplier\?\.\(/);
  assert.match(read("js/encounter-pacing.js"),/xpValueMultiplier=xpMultiplier/);
});
function xpThreshold(level){
  let total=0,required=10;
  for(let current=1;current<level;current++){
    total+=required;
    const nextLevel=current+1;
    required=Math.floor(required*(nextLevel<6?1.15:nextLevel<15?1.105:1.085)+4);
  }
  return total;
}
function estimatedRunXP(seconds,m){
  // Design envelope: about one killed tactical pack every 40 seconds,
  // one special wave every 70 seconds, one defensive squad every 125 seconds
  // once conquest starts, three guardian soul drops and a few ambient kills.
  // Some packs can be skipped, so this is an illustrative reachable path,
  // NOT a guarantee for a particular loadout or skill level.
  const stages=[[0,2.6],[180,3.8],[360,8.8],[540,5.4],
    [720,11.8],[900,11.8],[1140,11.8]];
  const base=s=>stages.filter(stage=>s>=stage[0]).at(-1)[1];
  let xp=0;
  for(let t=30;t<seconds;t+=40)xp+=base(t)*m(t,"patrol");
  for(let t=70,n=1;t<seconds;t+=70,n++)xp+=n%4===0?13:base(t)*m(t,"wave");
  for(let t=220;t<seconds;t+=125)xp+=base(t)*m(t,"defense");
  xp+=Math.min(150,Math.floor(seconds/180)*50);
  xp+=seconds/30;
  return xp*.7; // only 70% of earned souls are collected
}
test("two evolution-ready levels are attainable before 25m without restoring spam",()=>{
  const h=sandbox(),m=h.window.encounterXpMultiplier;
  assert.ok(xpThreshold(15)<=estimatedRunXP(1020,m),
    "17-minute XP should allow a focused build to approach two evolutions");
  assert.ok(xpThreshold(18)<=estimatedRunXP(1500,m),
    "25-minute XP should allow at least 17 level-up choices");
  assert.ok(h.window.encounterPopulationCap(1200)<=30);
});
test("second evolution milestone remains 17m, before The Last Meme at 25m",()=>{
  const context=vm.createContext({Math});
  vm.runInContext(read("js/upgrades.js"),context);
  vm.runInContext("var evolutions={}",context);
  assert.equal(vm.runInContext("nextEvolutionTime()",context),600);
  vm.runInContext("evolutions.first=true",context);
  assert.equal(vm.runInContext("nextEvolutionTime()",context),1020);
  assert.equal(vm.runInContext("FINAL_BOSS_TIME",sandbox().context),1500);
  assert.match(read("js/game.js"),/const pickupRange =[\s\S]{0,35}115 \+ upgrades\.magnet/);
});
