const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const WORLD={fire:"burning",water:"flooded",frost:"frozen"};
const LOADOUT={
  fire:["flame","fireball","flameOrbit"],
  water:["waterBolt","tidalWave","whirlpool"],
  frost:["frost","iceShards","glacialPulse"]
};
function harness({element="water",saved,blockWorld=false,sandbox=false}={}){
  const store=saved||new Map([["shadowDominantWorldV1",JSON.stringify({version:1,dominant:"frozen"})]]);
  const notifications=[];
  const window={isDeveloperRun:()=>sandbox};
  const localStorage={
    getItem:key=>store.has(key)?store.get(key):null,
    setItem:(key,value)=>{
      if(blockWorld&&key==="shadowDominantWorldV1")throw new Error("Storage unavailable");
      store.set(key,String(value));
    }
  };
  const ctx=vm.createContext({window,localStorage,Date,Math,Number,JSON,
    currentLivingWorldElement:()=>element,notify:(...parts)=>notifications.push(parts)});
  function run(expr){return vm.runInContext(expr,ctx);}
  function load(file){vm.runInContext(source(file),ctx,{filename:file});}
  load("js/storage.js");
  run('let metaProgress=loadMetaProgress(), victoryClaimed=false, runRecorded=false,'+
    'runMode="standard",time=1550,kills=120,level=24,bossesDefeated=4,'+
    'difficulty="normal",runDamageTaken=20,selectedCharacter="survivor",'+
    'selectedWeapons='+JSON.stringify(LOADOUT[element])+','+
    'upgrades={},evolutions={riptideLance:true,maelstrom:true},runStats=null;');
  load("js/progression.js");
  load("js/characters.js");
  load("js/living-world.js");
  load("js/world-state.js");
  return {window,store,ctx,run,notifications};
}
test("v4 migration retains elemental weapons, world history and old versions safely",()=>{
  const store=new Map([["shadowProgress",JSON.stringify({version:3,runs:[
    {id:"water-win",survived:1571,mode:"standard",difficulty:"normal",
      victory:true,runElement:"water",worldBefore:"frozen",worldAfter:"flooded",
      worldImpact:100,weapons:["waterBolt","tidalWave","whirlpool","forged"]},
    {id:"bad-world",survived:90,worldBefore:"other",worldAfter:"other",
      runElement:"unknown",worldImpact:300,weapons:["flame","flame","ghost"]}
  ]})]]);
  const h=harness({saved:store});
  const p=JSON.parse(h.run("JSON.stringify(metaProgress)"));
  assert.equal(p.version,4);
  assert.equal(p.runs[0].id,"water-win");
  assert.deepEqual(p.runs[0].weapons,["waterBolt","tidalWave","whirlpool"]);
  assert.equal(p.runs[0].runElement,"water");
  assert.equal(p.runs[0].worldBefore,"frozen");
  assert.equal(p.runs[0].worldAfter,"flooded");
  assert.equal(p.runs[0].worldImpact,100);
  assert.deepEqual(p.runs[1].weapons,["flame"]);
  assert.equal(p.runs[1].worldBefore,null);
  assert.equal(p.runs[1].runElement,null);
  assert.equal(p.runs[1].worldImpact,100);
  assert.equal(h.run("metaProgress.endlessUnlocked"),false);
});
test("earned 15/50/85 world invasion restores after defeat; reload keeps original",()=>{
  const h=harness();
  h.window.beginWorldRun();
  for(const [count,peak] of [[1,15],[2,50],[3,85]]){
    assert.equal(h.window.onWorldBossDefeated(count,false),true);
    assert.equal(h.window.getWorldConquest().target,peak);
  }
  h.run('victoryClaimed=false;bossesDefeated=3;time=970;recordRun("defeat")');
  assert.equal(h.window.restoreWorldOnDefeat(),true);
  assert.equal(h.window.getWorldConquest().restorationPeak,85);
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"frozen");
  const restarted=harness({saved:h.store});
  assert.equal(restarted.window.getDominantWorld(),"frozen");
  const p=JSON.parse(restarted.run("JSON.stringify(metaProgress)"));
  assert.equal(p.totals.runs,1);
  assert.equal(p.totals.wins,0);
  assert.equal(p.runs.length,1);
  assert.equal(p.runs[0].worldImpact,85);
  assert.equal(p.runs[0].worldBefore,"frozen");
  assert.equal(p.runs[0].worldAfter,"frozen");
  assert.equal(p.endlessUnlocked,false);
});
test("standard Victory saves once, Endlessness edits same saved run and reload preserves it",()=>{
  const h=harness();
  h.window.beginWorldRun();
  h.window.onWorldBossDefeated(1,false);
  h.window.onWorldBossDefeated(2,false);
  h.window.onWorldBossDefeated(3,false);
  assert.equal(h.run("grantFinalVictory()"),true);
  assert.equal(h.window.completeWorldConquest(),true);
  assert.equal(h.window.getWorldConquest().saved,true);
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"flooded");
  assert.equal(h.run("grantFinalVictory()"),false);
  assert.equal(h.run("metaProgress.totals.wins"),1);
  assert.equal(h.run("metaProgress.totals.runs"),1);
  const id=h.run("metaProgress.runs[0].id");
  h.run('runMode="endless";time=2100;kills=430;bossesDefeated=8');
  assert.equal(h.run('recordRun("defeat")'),true);
  assert.equal(h.run('recordRun("defeat")'),false);
  const actual=harness({saved:h.store});
  assert.equal(actual.window.getDominantWorld(),"flooded");
  const p=JSON.parse(actual.run("JSON.stringify(metaProgress)"));
  assert.equal(p.totals.runs,1);
  assert.equal(p.totals.wins,1);
  assert.equal(p.runs.length,1);
  assert.equal(p.runs[0].id,id);
  assert.equal(p.runs[0].mode,"endless");
  assert.equal(p.runs[0].survived,2100);
  assert.equal(p.runs[0].victory,true);
  assert.equal(p.runs[0].worldBefore,"frozen");
  assert.equal(p.runs[0].worldAfter,"flooded");
  assert.equal(p.runs[0].worldImpact,100);
  assert.deepEqual(p.runs[0].weapons,LOADOUT.water);
  assert.equal(p.records.standard.normal.wins,1);
  assert.equal(p.records.endless.normal.survived,2100);
  assert.equal(p.endlessUnlocked,true);
  const scars=JSON.parse(h.store.get("shadowLivingWorldV1"));
  assert.equal(scars.runs,1);
  assert.equal(scars.water,0); // no water weapons levelled in this synthetic setup
  assert.equal(scars.lastRun,id);
});
test("career boss trophy points are first-only, including after page refresh",()=>{
  const h=harness();
  const prize=h.run('awardBossLoot(metaProgress,"beau")');
  assert.equal(prize.first,true);
  assert.equal(prize.points,2);
  h.run("saveMetaProgress()");
  const reload=harness({saved:h.store});
  const again=reload.run('awardBossLoot(metaProgress,"beau")');
  assert.equal(again.first,false);
  assert.equal(again.points,0);
  assert.equal(reload.run("metaProgress.points"),2);
  assert.equal(reload.run('metaProgress.bossLoot.filter(x=>x==="beau").length'),1);
});
test("all nine elemental weapons leave world memory once; Endless does not double-count",()=>{
  for(const [element,levels,key] of [
    ["fire",{flame:3,fireball:2,flameOrbit:1},"fire"],
    ["water",{waterBolt:5,tidalWave:2,whirlpool:3},"water"],
    ["frost",{frost:4,iceShards:1,glacialPulse:2},"frost"]
  ]){
    const h=harness({element});
    h.window.beginWorldRun();
    h.run("upgrades="+JSON.stringify(levels));
    h.run('recordRun("defeat")');
    const id=h.run("metaProgress.runs[0].id");
    const first=JSON.parse(h.store.get("shadowLivingWorldV1"));
    assert.equal(first.runs,1);
    assert.equal(first[key],Object.values(levels).reduce((a,b)=>a+b,0));
    assert.equal(first.lastRun,id);
    assert.equal(h.run('recordRun("defeat")'),false);
    const again=JSON.parse(h.store.get("shadowLivingWorldV1"));
    assert.equal(again.runs,1);
  }
});
test("browser storage rejection never falsely reports a permanent conquest",()=>{
  const h=harness({blockWorld:true});
  h.window.beginWorldRun();
  h.run("victoryClaimed=true");
  assert.equal(h.window.completeWorldConquest(),true);
  assert.equal(h.window.getWorldConquest().conquered,true);
  assert.equal(h.window.getWorldConquest().saved,false);
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"frozen");
  assert.ok(h.notifications.some(msg=>String(msg[0]).includes("SAVE UNAVAILABLE")));
  const fresh=harness({saved:h.store});
  assert.equal(fresh.window.getDominantWorld(),"frozen");
  assert.match(source("js/game.js"),/conquestPersistent \? "100% PERMANENT" : "100% THIS RUN ONLY · SAVE UNAVAILABLE"/);
});
test("developer sandbox may preview but never save conquest, trophies or records",()=>{
  const h=harness({sandbox:true});
  h.window.beginWorldRun();
  h.run("victoryClaimed=true");
  assert.equal(h.window.completeWorldConquest(),true);
  assert.equal(h.window.getWorldConquest().saved,false);
  h.run('recordRun("victory");saveMetaProgress()');
  assert.equal(h.store.has("shadowProgress"),false);
  assert.equal(h.store.has("shadowLivingWorldV1"),false);
  assert.equal(JSON.parse(h.store.get("shadowDominantWorldV1")).dominant,"frozen");
});
test("fresh game runs reset the closed Endless flag",()=>{
  const s=source("js/game.js");
  assert.match(s,/runRewardSettled = 0;\s*endlessRecordClosed = false;\s*bossesDefeated = 0;/);
  assert.match(source("js/progression.js"),/if \(mode === "endless" && won && outcome === "defeat"\) endlessRecordClosed = true;/);
  const html=source("index.html");
  assert.ok(html.indexOf("js/storage.js")<html.indexOf("js/progression.js"));
  assert.ok(html.indexOf("js/progression.js")<html.indexOf("js/game.js"));
  assert.ok(html.indexOf("js/living-world.js")<html.indexOf("js/world-state.js"));
});
