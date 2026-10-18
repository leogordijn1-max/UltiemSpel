const test=require("node:test"),assert=require("node:assert/strict"),
  fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function director(){
  const window={};
  vm.runInNewContext(read("js/encounter-rhythm.js"),{window,Math},
    {filename:"js/encounter-rhythm.js"});
  window.resetEncounterRhythm();
  const enemy=(hp=100)=>({hp,dead:false});
  return {w:window,enemy};
}
test("starts ready, one scheduled source wins the slot, others must wait",()=>{
  const {w,enemy}=director(),team=[enemy(),enemy(),enemy()];
  assert.equal(w.getEncounterRhythmStatus(0).phase,"ready");
  assert.equal(w.encounterRhythmCanStart("patrol",0,[]),true);
  assert.equal(w.recordEncounterRhythmSpawn("patrol",10,team),true);
  assert.equal(w.encounterRhythmCanStart("wave",10,team),false);
  assert.equal(w.encounterRhythmCanStart("defense",10,team),false);
  assert.equal(w.getEncounterRhythmStatus(10).survivors,3);
});
test("killing most of a small squad unlocks a clear breathing period",()=>{
  const {w,enemy}=director(),team=[enemy(),enemy(),enemy(),enemy()];
  w.recordEncounterRhythmSpawn("wave",10,team);
  team[0].dead=true;team[1].hp=0;team[2].dead=true;
  w.updateEncounterRhythm(30,team,false,360);
  const s=w.getEncounterRhythmStatus(30);
  assert.equal(s.phase,"recover");
  assert.equal(s.cleared,1);
  assert.ok(s.remaining>=11&&s.remaining<=17);
  assert.equal(w.encounterRhythmCanStart("patrol",31,team),false);
  w.updateEncounterRhythm(s.until-.01,team,false,360);
  assert.equal(w.encounterRhythmCanStart("wave",s.until-.01,team),false);
  w.updateEncounterRhythm(s.until,team,false,360);
  assert.equal(w.encounterRhythmCanStart("defense",s.until,team),true);
});
test("recovering never takes longer than seventeen seconds even in late game",()=>{
  const {w,enemy}=director(),team=[enemy(),enemy()];
  w.recordEncounterRhythmSpawn("defense",50,team);
  team[0].dead=true;
  w.updateEncounterRhythm(58,team,false,2000);
  assert.equal(w.getEncounterRhythmStatus(58).remaining,17);
});
test("rare swarm stays a set piece until almost all are defeated",()=>{
  const {w,enemy}=director(),swarm=Array.from({length:36},()=>enemy());
  w.recordEncounterRhythmSpawn("swarm",20,swarm);
  for(let i=0;i<32;i++)swarm[i].dead=true;
  w.updateEncounterRhythm(30,swarm,false,600);
  assert.equal(w.getEncounterRhythmStatus(30).phase,"engaged");
  swarm[32].dead=true;
  w.updateEncounterRhythm(31,swarm,false,600);
  assert.equal(w.getEncounterRhythmStatus(31).phase,"recover");
});
test("loss of a boss fight never produces queued delayed packs on exit",()=>{
  const {w,enemy}=director(),team=[enemy(),enemy()];
  w.recordEncounterRhythmSpawn("patrol",2,team);
  w.updateEncounterRhythm(20,team,true,200);
  assert.equal(w.getEncounterRhythmStatus(20).phase,"boss");
  assert.equal(w.encounterRhythmCanStart("wave",20,team),false);
  w.updateEncounterRhythm(100,team,false,200);
  const s=w.getEncounterRhythmStatus(100);
  assert.equal(s.phase,"recover");assert.equal(s.remaining,12);
  assert.equal(s.survivors,0);
  w.updateEncounterRhythm(112,team,false,200);
  assert.equal(w.getEncounterRhythmStatus(112).phase,"ready");
});
test("ambient enemies are reduced during active encounter and recovery",()=>{
  const {w,enemy}=director(),team=[enemy(),enemy(),enemy()];
  assert.equal(w.encounterRhythmAmbientLimit(0,[],8),8);
  w.recordEncounterRhythmSpawn("patrol",1,team);
  assert.equal(w.encounterRhythmAmbientLimit(2,team,8),2);
  team[0].dead=team[1].dead=true;
  w.updateEncounterRhythm(3,team,false,100);
  assert.equal(w.encounterRhythmAmbientLimit(3,team,8),2);
  w.updateEncounterRhythm(15,team,false,100);
  assert.equal(w.encounterRhythmAmbientLimit(15,team,8),8);
});
test("pacing sequence alternates formations across wave and patrol counters",()=>{
  const {w,enemy}=director();
  assert.equal(w.encounterRhythmPlanIndex(0),0);
  w.recordEncounterRhythmSpawn("wave",1,[enemy(),enemy()]);
  assert.equal(w.encounterRhythmPlanIndex(0),1);
  assert.equal(w.encounterRhythmPlanIndex(1),2);
});
test("controller rejects empty encounters instead of entering permanent combat",()=>{
  const {w}=director();
  assert.equal(w.recordEncounterRhythmSpawn("wave",1,[]),false);
  assert.equal(w.recordEncounterRhythmSpawn("wave",1,[{hp:0}]),false);
  assert.equal(w.getEncounterRhythmStatus(1).phase,"ready");
});
test("clearing the controller turns it off without a stale cooldown",()=>{
  const {w,enemy}=director();
  w.recordEncounterRhythmSpawn("patrol",2,[enemy(),enemy()]);
  w.clearEncounterRhythm();
  assert.equal(w.getEncounterRhythmStatus(3).active,false);
  assert.equal(w.encounterRhythmCanStart("wave",3,[]),true);
  w.resetEncounterRhythm();
  assert.equal(w.getEncounterRhythmStatus(3).encounters,0);
  assert.equal(w.getEncounterRhythmStatus(3).phase,"ready");
});
test("actual scheduled patrols are delayed, sandbox spawn API still works",()=>{
  const window={initializeEnemyAdaptation:()=>{}};
  vm.runInNewContext(read("js/encounter-rhythm.js"),{window,Math});
  vm.runInNewContext(read("js/encounter-pacing.js"),{window,Math});
  window.resetEncounterRhythm();window.resetEncounterPacing();
  const enemies=[],player={x:0,y:0};
  const spawn=(kind)=>{
    const e={kind,x:0,y:0,hp:100,damage:8,speed:55,r:12};enemies.push(e);return e;
  };
  const update=now=>window.updateEncounterPacing(now,0,player,enemies,spawn,false,"normal");
  assert.equal(update(0),0);assert.equal(update(17),3);
  assert.equal(window.getEncounterRhythmStatus(17).phase,"engaged");
  enemies[0].dead=enemies[1].dead=true;
  window.updateEncounterRhythm(18,enemies,false,0);
  assert.equal(window.getEncounterRhythmStatus(18).phase,"recover");
  assert.equal(update(50),0,"scheduled patrol respects phase until observer advances");
  window.updateEncounterRhythm(50,enemies,false,0);
  assert.equal(update(56),3);
});
test("same state machine is wired into all three real automatic spawners",()=>{
  const game=read("js/game.js"),patrol=read("js/encounter-pacing.js"),
    defense=read("js/world-defense.js");
  assert.match(game,/updateEncounterRhythm\?\.\(/);
  assert.match(game,/encounterRhythmCanStart\?\.\("wave"/);
  assert.match(game,/recordEncounterRhythmSpawn\?\.\(/);
  assert.match(game,/encounterRhythmAmbientLimit\?\.\(/);
  assert.match(patrol,/encounterRhythmCanStart\?\.\("patrol"/);
  assert.match(patrol,/recordEncounterRhythmSpawn\?\.\(/);
  assert.match(defense,/encounterRhythmCanStart\?\.\("defense"/);
  assert.match(defense,/recordEncounterRhythmSpawn\?\.\(/);
  assert.match(read("index.html"),/encounter-rhythm\.js\?v=18/);
});
test("fewer tough groups earn a modest XP premium without free experience",()=>{
 const {w,enemy}=director(),squad=[enemy(),enemy(),enemy()];
 for(const e of squad)e.xpValueMultiplier=3;
 w.recordEncounterRhythmSpawn("patrol",100,squad,900);
 assert.ok(squad.every(e=>e.xpValueMultiplier>3.5&&e.xpValueMultiplier<4.2));
 assert.ok(squad.every(e=>e.rhythmXpAdjusted));
 assert.equal(w.getEncounterRhythmStatus(101).encounters,1);
 // Re-recording cannot stack multipliers while a squad remains alive.
 const xp=squad[0].xpValueMultiplier;
 w.recordEncounterRhythmSpawn("patrol",102,squad,900);
 assert.equal(squad[0].xpValueMultiplier,xp);
 const other=[enemy(),enemy(),enemy()];
 w.recordEncounterRhythmSpawn("swarm",103,other,900);
 assert.ok(other.every(e=>e.xpValueMultiplier===1));
});
test("boss fights, force-spawn developer buttons, population caps and XP stay distinct",()=>{
  const pacing=read("js/encounter-pacing.js"),defense=read("js/world-defense.js");
  assert.match(pacing,/function spawnPatrol\(/);
  assert.match(pacing,/function update\(/);
  assert.match(defense,/function force\(/);
  assert.match(defense,/if\(budgeted&&window\.encounterCanStart/);
  assert.match(pacing,/const MAX_LIVE = 30/);
  assert.match(read("js/enemies.js"),/window\.encounterCanStart/);
  assert.match(read("js/game.js"),/if \(!boss && !window\.isBossIsolationActive\?\.\(\)\)/);
});
