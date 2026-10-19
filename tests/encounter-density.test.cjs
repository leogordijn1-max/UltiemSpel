const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
function make(tier=85,seconds=1200){
  const enemies=[],notifications=[];
  const window={
    getWorldConquest:()=>({active:true,original:"flooded",invading:"burning",target:tier}),
    getDominantWorld:()=> "flooded",
    enemyOffscreenSpawn:(angle,pad,along=0)=>({x:1000+pad,y:along}),
    notifyEncounterPatrol:x=>notifications.push(x),notifyWorldDefense:x=>notifications.push(x),
    initializeEnemyAdaptation:()=>{},
    isBossIsolationActive:()=>false
  };
  const player={x:0,y:0,r:12};
  const ctx=vm.createContext({window,Math,player,W:1280,H:720,enemies,growthTime:seconds,boss:null,difficulty:"normal"});
  for(const file of ["js/enemy-progression.js","js/tactical-encounters.js","js/encounter-tactics.js",
    "js/encounter-pacing.js","js/world-defense.js"])
    vm.runInContext(source(file),ctx,{filename:file});
  window.resetEnemyProgression();
  window.resetEncounterTactics();
  window.resetEncounterPacing();
  window.resetWorldDefense();
  const spawn=(kind,elite=false)=>{
    const e={kind,elite,hp:100,damage:10,speed:60,r:kind===2?35:15,x:0,y:0};
    enemies.push(e);return e;
  };
  return {window,ctx,enemies,notifications,spawn,player,
    patrol:()=>window.spawnEncounterPatrol(0,seconds,player,enemies,spawn,"normal"),
    defense:(now=0)=>window.updateWorldDefense(now,player,enemies,spawn,false,seconds)};
}
function waveHarness(h){
  const text=source("js/enemies.js"),start=text.indexOf("const wavePatterns = ["),
    end=text.indexOf("// Shared spatial hash resolution for pickup storage and merging.",start);
  h.ctx.enemySpawn=h.spawn;
  vm.runInContext(text.slice(start,end),h.ctx);
  return n=>h.ctx.spawnSpecialWave(n);
}
test("Normal late game sustains more threats without exceeding the bounded population budget",()=>{
  const h=make();
  const budget=h.window.encounterPopulationCap;
  const ambient=h.window.encounterAmbientLimit;
  assert.ok(budget(1800)<=30);
  assert.ok(budget(0)<budget(1200));
  assert.ok(ambient(1500,"normal",[])>=7 && ambient(1500,"normal",[])<=9);
  assert.ok(ambient(1500,"normal",[])>ambient(0,"normal",[]));
  assert.ok(h.window.encounterAmbientInterval(1500)<h.window.encounterAmbientInterval(0));
});
test("intact squads cannot pile up without limit while ambient pressure continues",()=>{
  const h=make();
  const initial=h.patrol();
  assert.equal(initial,4);
  assert.equal(h.window.encounterActiveGroups(h.enemies),1);
  assert.ok(h.window.encounterAmbientLimit(1200,"normal",h.enemies)>=7);
  // The second tactical encounter is allowed later, but a third cannot pile up.
  assert.equal(h.patrol(),4);
  assert.equal(h.window.encounterActiveGroups(h.enemies),2);
  assert.equal(h.patrol(),0);
  assert.equal(h.defense(),false); // Next world defense cannot become an extra horde.
  h.enemies.slice(0,5).forEach(e=>{e.dead=true;e.hp=0;});
  assert.equal(h.window.encounterActiveGroups(h.enemies),1);
  assert.equal(h.patrol(),4);
  assert.equal(h.window.encounterActiveGroups(h.enemies),2);
});
test("last straggler does not hold the tactical budget hostage",()=>{
  const h=make();
  assert.equal(h.patrol(),4);
  h.enemies.slice(0,3).forEach(e=>{e.dead=true;e.hp=0;});
  assert.equal(h.window.encounterActiveGroups(h.enemies),0);
  assert.equal(h.patrol(),4);
  assert.equal(h.window.encounterActiveGroups(h.enemies),1);
});
test("late encounter can't start on top of a dozen stray enemies",()=>{
  const h=make();
  for(let i=0;i<13;i++)h.enemies.push({kind:0,hp:10,dead:false});
  assert.equal(h.patrol(),0);
  h.enemies.slice(0,4).forEach(e=>{e.dead=true;e.hp=0;});
  assert.equal(h.patrol(),4);
  assert.equal(h.enemies.filter(e=>!e.dead).length,13);
});
test("tactical wave defers rather than overlaps a full arena, then resumes after cleanup",()=>{
  const h=make(),wave=waveHarness(h);
  assert.equal(h.patrol(),4);
  assert.equal(h.patrol(),4);
  const before=h.enemies.length;
  const blocked=wave(9);
  assert.equal(blocked.deferred,true);
  assert.equal(blocked.spawned,0);
  assert.equal(h.enemies.length,before);
  h.enemies.forEach(e=>{e.hp=0;e.dead=true;});
  const later=wave(9);
  assert.equal(later.spawned,4);
  assert.ok(h.enemies.filter(e=>!e.dead).every(e=>e.encounterTactic));
});
test("late swarms are smaller, tougher and limited to 24 enemies",()=>{
  const h=make(),wave=waveHarness(h);
  h.patrol();
  assert.equal(wave(4).deferred,true);
  h.enemies.forEach(e=>{e.dead=true;e.hp=0;});
  const crowd=wave(4);
  assert.equal(crowd.pattern.swarm,true);
  assert.ok(crowd.spawned>=10&&crowd.spawned<=15);
  assert.ok(h.enemies.filter(e=>!e.dead).length<=24);
  assert.equal(wave(8).deferred,true); // No second swarm piled on top.
});
test("world defense waits for the existing tactical fight to end before deployment",()=>{
  const h=make();
  assert.equal(h.defense(0),false);
  assert.equal(h.patrol(),4);
  assert.equal(h.patrol(),4);
  assert.equal(h.defense(8),false);
  h.enemies.forEach(e=>{e.dead=true;e.hp=0;});
  assert.equal(h.defense(16),true);
  assert.ok(h.enemies.filter(e=>!e.dead).every(e=>e.defenseSquadId));
});
test("early encounters stay at three enemy kinds; late hard waves never use locked kinds",()=>{
  const h=make(15,0);
  assert.equal(h.patrol(),3);
  assert.ok(h.enemies.every(e=>[0,1].includes(e.kind)));
  const later=make(85,800);
  const pack=later.patrol();
  assert.equal(pack,4);
  assert.ok(later.enemies.every(e=>later.window.enemyKindAvailable(e.kind,800)));
});
test("game loop actively defers wave counter and uses shared density budget across spawners",()=>{
  const game=source("js/game.js");
  assert.match(game,/if\(wave\.deferred\)/);
  assert.match(game,/waveTimer=6/);
  assert.match(game,/encounterAmbientLimit/);
  assert.match(source("js/enemies.js"),/window\.encounterCanStart/);
  assert.match(source("js/world-defense.js"),/window\.encounterCanStart/);
  assert.match(source("js/encounter-pacing.js"),/encounterMaxGroups/);
});
