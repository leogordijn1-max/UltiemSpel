const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs"),path=require("node:path");
const source=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const PAIRS=[
  ["burning","frozen"],["burning","flooded"],
  ["flooded","burning"],["flooded","frozen"],
  ["frozen","burning"],["frozen","flooded"]
];
function harness(initial={original:"frozen",invading:"burning",target:0,active:true}){
  let conquest={...initial},ground=initial.original;
  const window={
    getWorldConquest:()=>conquest,
    worldBiomeAt:()=>ground,
    getWorldRetaliationStatus:()=>({active:3}),
    getWorldDefenseStatus:()=>({activeSquads:2})
  };
  vm.runInNewContext(source("js/world-consequences.js"),{window,Number,Math});
  const set=(fields)=>{conquest={...conquest,...fields}};
  return {window,set,ground:value=>{ground=value},conquest:()=>conquest};
}
function worldRun(element="fire",saved="frozen"){
  const disk={shadowDominantWorldV1:JSON.stringify({dominant:saved})},messages=[];
  const ctx=vm.createContext({
    window:{}, Math, Date, JSON,
    storageGet:(key,fallback)=>disk[key]??fallback,
    storageSet:(key,value)=>{disk[key]=value},
    currentLivingWorldElement:()=>element,
    notify:(message,type)=>messages.push({message,type}),
    runMode:"standard",victoryClaimed:false,
    performance:{now:()=>1000}
  });
  vm.runInContext(source("js/world-state.js"),ctx);
  ctx.window.getWorldRetaliationStatus=()=>({active:4});
  ctx.window.getWorldDefenseStatus=()=>({activeSquads:1});
  vm.runInContext(source("js/world-consequences.js"),ctx);
  const start=()=>ctx.window.beginWorldRun();
  return {ctx,window:ctx.window,start,disk,messages,eval:x=>vm.runInContext(x,ctx)};
}
test("all six ordered invasion / defending-world pairs get distinct names at each conquest tier",()=>{
  const titles=new Set();
  for(const [invading,original] of PAIRS){
    const h=harness({original,invading,target:0,active:true});
    let last=0;
    for(const [percent,stage] of [[0,0],[15,1],[50,2],[85,3]]){
      h.set({target:percent});
      const s=h.window.getWorldConsequenceSnapshot({x:0,y:0});
      assert.equal(s.stage,stage);
      assert.equal(s.coverage,percent);
      assert.equal(s.original,original);
      assert.equal(s.invading,invading);
      if(stage) {
        assert.notEqual(s.status,"THE DEFENDERS HOLD");
        assert.ok(!titles.has(original+"/"+invading+"/"+s.status));
        titles.add(original+"/"+invading+"/"+s.status);
        assert.equal(s.territory,"ON DEFENDER GROUND · ENEMIES HOLD THE LINE");
      } else assert.equal(s.status,"THE DEFENDERS HOLD");
      assert.ok(s.hazardCount===3&&s.defenseSquads===2);
      last=stage;
    }
    assert.equal(last,3);
  }
  assert.equal(titles.size,18);
});
test("defenders are off-balance only on INVADER territory, in three capped steps",()=>{
  const h=harness(),e={kind:1,worldAffinity:"frozen",speed:100};
  for(const [percent,factor] of [[0,1],[14,1],[15,.94],[50,.91],[85,.88],[100,.88]]){
    h.set({target:percent});
    assert.equal(h.window.worldOccupationMovement(e,"burning"),factor);
    assert.equal(h.window.worldOccupationMovement(e,"frozen"),1);
  }
  h.set({target:85});
  h.ground("burning");
  const info=h.window.getWorldConsequenceSnapshot({x:40,y:20});
  assert.equal(info.occupied,true);
  assert.match(info.territory,/DEFENDERS EXPOSED/);
  h.ground("frozen");
  assert.equal(h.window.getWorldConsequenceSnapshot({x:40,y:20}).occupied,false);
});
test("occupying an identical-element world grants no phantom advantage",()=>{
  const h=harness({original:"burning",invading:"burning",target:85,active:true});
  const e={kind:0,worldAffinity:"burning"};
  const s=h.window.getWorldConsequenceSnapshot({x:0,y:0});
  assert.equal(s.contested,false);
  assert.equal(s.stage,0);
  assert.equal(h.window.worldOccupationMovement(e,"burning"),1);
  assert.match(h.window.worldConsequenceHudText({x:0,y:0},1),/NO INVASION/);
});
test("bosses, summons, foreign affinity, dead enemies and restored runs are unaffected",()=>{
  const h=harness({original:"frozen",invading:"flooded",target:85,active:true});
  const forms=[
    {kind:3,worldAffinity:"frozen"},
    {kind:1,summoned:true,worldAffinity:"frozen"},
    {kind:1,dead:true,worldAffinity:"frozen"},
    {kind:1,worldAffinity:"burning"}
  ];
  for(const e of forms)assert.equal(h.window.worldOccupationMovement(e,"flooded"),1);
  const regular={kind:1,worldAffinity:"frozen"};
  h.set({conquered:true});
  assert.equal(h.window.worldOccupationMovement(regular,"flooded"),1);
  h.set({conquered:false,restored:true});
  assert.equal(h.window.worldOccupationMovement(regular,"flooded"),1);
  h.set({restored:false,active:false});
  assert.equal(h.window.worldOccupationMovement(regular,"flooded"),1);
});
test("world front status shows opposing sides, hazards, defense squads and territorial changes",()=>{
  const h=harness();
  h.set({target:50});
  const first=h.window.worldConsequenceHudText({x:0,y:0},10);
  assert.match(first,/FROZEN DEFENDS vs BURNING/);
  assert.match(first,/50% INVADED/);
  assert.match(first,/RIFTS 3/);
  assert.match(first,/DEFENSE 2/);
  h.ground("burning");
  assert.equal(h.window.worldConsequenceHudText({x:0,y:0},10.1),first,
    "HUD updates are throttled to avoid per-frame allocation");
  const next=h.window.worldConsequenceHudText({x:0,y:0},10.5);
  assert.match(next,/ON INVADED GROUND/);
});
test("each earned boss kill announces exactly one increasing invasion stage",()=>{
  const h=harness();
  h.window.resetWorldConsequences();
  const none=h.window.worldConsequenceBossStage(1);
  assert.equal(none,null);
  for(const [count,percent] of [[1,15],[2,50],[3,85]]){
    h.set({target:percent});
    const result=h.window.worldConsequenceBossStage(count);
    assert.equal(result.stage,count);
    assert.match(result.message,/THE WORLD FIGHTS BACK/);
    assert.match(result.message,/FROZEN DEFENDERS/);
    assert.equal(h.window.worldConsequenceBossStage(count),null);
  }
  h.window.resetWorldConsequences();
  h.set({target:15});
  assert.equal(h.window.worldConsequenceBossStage(1)?.stage,1);
});
test("true boss stages update world but only FINAL VICTORY persists the world",()=>{
  const h=worldRun("fire","frozen"); h.start();
  assert.equal(h.window.getWorldConquest().target,0);
  for(const [i,target] of [[1,15],[2,50],[3,85]]){
    assert.equal(h.window.onWorldBossDefeated(i,false),true);
    assert.equal(h.window.getWorldConquest().target,target);
    assert.equal(JSON.parse(h.disk.shadowDominantWorldV1).dominant,"frozen");
  }
  assert.equal(h.window.onWorldBossDefeated(3,false),true,
    "legacy stage handler allows repeats, but notification is deduplicated");
  assert.equal(h.messages.filter(x=>x.message.includes("WORLD FIGHTS BACK")).length,3);
  const pre=h.window.worldConsequenceEndReport();
  assert.equal(pre.peak,85);
  assert.equal(pre.saved,false);
  assert.equal(h.window.completeWorldConquest(),false,
    "victory flag gate prevents winning by invoking the API");
  h.eval("victoryClaimed=true");
  assert.equal(h.window.completeWorldConquest(),true);
  assert.equal(JSON.parse(h.disk.shadowDominantWorldV1).dominant,"burning");
  const won=h.window.worldConsequenceEndReport();
  assert.equal(won.outcome,"PERMANENTLY CONQUERED");
  assert.equal(won.after,"BURNING");
  assert.equal(won.peak,100);
});
test("failure restores the defending world and reports peak invasion honestly",()=>{
  const h=worldRun("water","frozen");h.start();
  assert.equal(h.window.onWorldBossDefeated(1,false),true);
  assert.equal(h.window.onWorldBossDefeated(2,false),true);
  const before=h.window.worldConsequenceEndReport();
  assert.equal(before.peak,50);
  assert.equal(h.window.restoreWorldOnDefeat(),true);
  assert.equal(h.window.worldConsequenceEndReport().after,"FROZEN");
  assert.equal(h.window.worldConsequenceEndReport().outcome,"RECLAIMED BY THE DEFENDERS");
  assert.equal(h.window.worldConsequenceEndReport().peak,50,
    "earned boss-stage invasion counts even if visual transition has not finished");
  assert.equal(JSON.parse(h.disk.shadowDominantWorldV1).dominant,"frozen");
  assert.equal(h.window.onWorldBossDefeated(3,false),false);
  assert.equal(h.window.completeWorldConquest(),false);
  h.window.abandonWorldRun();
  assert.equal(h.window.worldConsequenceEndReport(),null);
});
test("live game and result screen consume status and territorial movement",()=>{
  const game=source("js/game.js"),controls=source("js/controls.js"),
    world=source("js/world-state.js"),index=source("index.html");
  assert.match(game,/window\.worldOccupationMovement\?\.\(e,e\.groundBiome\)/);
  assert.match(game,/window\.getWorldConquest\?\.\(\)\.coverage/);
  assert.match(game,/window\.resetWorldConsequences\?\.\(\)/);
  assert.match(world,/window\.worldConsequenceBossStage\?\.\(count\)/);
  assert.match(controls,/window\.worldConsequenceEndReport\?\.\(\)/);
  assert.match(controls,/THE WORLD REMEMBERS/);
  assert.match(index,/id="worldFront"/);
  assert.match(index,/js\/world-consequences\.js\?v=24/);
});
test("no free damage, spawning, saved-world mutation or global randomness in module",()=>{
  const script=source("js/world-consequences.js");
  assert.doesNotMatch(script,/\bMath\.random\b|spawnEnemy\b|enemies\.push|localStorage|storageSet\(|dropGem\(/);
  assert.match(script,/\.94,\.91,\.88/);
});
