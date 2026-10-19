const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs"),path=require("node:path");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
function setup(saved="true",browser={}){
  const writes=[];
  const storage={shadowQaRecording:saved};
  const win={isDeveloperRun:()=>false};
  const ctx=vm.createContext({
    window:win,Date,Number,Math,JSON,
    storageGet:(key,fallback)=>storage[key]??fallback,
    storageSet:(key,value)=>{storage[key]=value;writes.push([key,value])},
    ...browser
  });
  vm.runInContext(read("js/run-telemetry.js"),ctx);
  return {win,writes,ctx,storage};
}
const meta={mode:"standard",difficulty:"normal",element:"fire",
  character:"survivor",weapons:["flame","fireball","flameOrbit"]};
test("run data is local and OFF until a real new run, with no pre-run phantom entries",()=>{
  const h=setup();
  assert.equal(h.win.runQaGetReport(),null);
  assert.equal(h.win.runQaNeedsSnapshot(0),false);
  assert.equal(h.win.runQaEvent("boss_spawn",{},180),false);
  assert.equal(h.win.runQaBegin(meta),true);
  const r=h.win.runQaGetReport();
  assert.equal(r.source,"local-browser-runtime-not-manually-verified");
  assert.equal(r.meta.mode,"standard");
  assert.equal(r.meta.element,"fire");
  assert.equal(r.outcome,"in_progress");
  assert.equal(r.sandbox,false);
  assert.equal(r.events.length,0);
});
test("real time checkpoints at 0/30/60/90 seconds never repeat within interval",()=>{
  const h=setup();h.win.runQaBegin(meta);
  assert.equal(h.win.runQaNeedsSnapshot(0),true);
  h.win.runQaSnapshot({time:0,level:1,xp:0,upgrades:{flame:1}});
  assert.equal(h.win.runQaNeedsSnapshot(1),false);
  assert.equal(h.win.runQaNeedsSnapshot(29.99),false);
  assert.equal(h.win.runQaNeedsSnapshot(30),true);
  h.win.runQaSnapshot({time:30,level:4,xp:6,upgrades:{flame:3}});
  assert.equal(h.win.runQaNeedsSnapshot(59.99),false);
  h.win.runQaSnapshot({time:60,level:8,upgrades:{flame:5,damage:3}});
  const r=h.win.runQaGetReport();
  assert.equal(r.checkpoints.length,3);
  assert.deepEqual(Array.from(r.checkpoints.map(x=>x.gameTime)),[0,30,60]);
  assert.equal(r.checkpoints.at(-1).upgrades.damage,3);
  assert.equal(r.lastTime,60);
});
test("XP aggregates without thousands of events, while earned choices are preserved",()=>{
  const h=setup();h.win.runQaBegin(meta);
  for(let i=0;i<5000;i++)h.win.runQaXp(.125,25);
  h.win.runQaEvent("level",{from:1,level:2,gained:1},25);
  h.win.runQaEvent("upgrade_offer",{options:["damage","flame","magnet"]},26);
  h.win.runQaEvent("upgrade_chosen",{key:"flame",from:1,to:2},26);
  h.win.runQaEvent("hit",{amount:12,health:108},27);
  h.win.runQaEvent("evolution",{id:"inferno",weapon:"flame"},600);
  const r=h.win.runQaGetReport();
  assert.equal(r.totals.xpGained,625);
  assert.equal(r.events.length,5);
  assert.equal(r.totals.levelsGained,1);
  assert.equal(r.totals.hitsTaken,1);
  assert.equal(r.totals.damageTaken,12);
  assert.deepEqual(Array.from(r.events[1].data.options),["damage","flame","magnet"]);
});
test("FPS measurements use actual rendered frame seconds and are bounded",()=>{
  const h=setup();h.win.runQaBegin(meta);
  for(let i=0;i<100;i++)
    h.win.runQaFrame(.05,i*.05,{enemyAI:2.2,render:4.7,
      collisions:.9,enemies:125,playerProjectiles:14,enemyProjectiles:9,effects:200});
  let r=h.win.runQaGetReport();
  assert.equal(r.performance.length,1);
  assert.equal(r.performance[0].fps,20);
  assert.equal(r.performance[0].p95FrameMs,50);
  assert.equal(r.performance[0].enemies,125);
  assert.equal(r.performance[0].renderMs,4.7);
  h.win.runQaFrame(2.0,6,{}); // tab-switch / paused frame not a valid sample
  assert.equal(h.win.runQaGetReport().performance.length,1);
  for(let i=0;i<430;i++){
    for(let k=0;k<100;k++)h.win.runQaFrame(.05,10+i*5+k*.05,{});
  }
  r=h.win.runQaGetReport();
  assert.equal(r.performance.length,420);
  assert.ok(r.performance.every(s=>s.p95FrameMs>0));
});
test("boss phase state is logged once per distinct stage, reset for the next boss",()=>{
  const h=setup();h.win.runQaBegin(meta);
  const beau={kind:3,bossName:"BEAU DE HOND",hp:950,maxHp:1000,
    phaseTwo:false,phaseThree:false};
  assert.equal(h.win.runQaBossPhase(beau,180),true);
  assert.equal(h.win.runQaBossPhase(beau,180.2),false);
  beau.hp=400;beau.phaseTwo=true;
  assert.equal(h.win.runQaBossPhase(beau,200),true);
  beau.hp=200;beau.phaseThree=true;
  assert.equal(h.win.runQaBossPhase(beau,211),true);
  assert.equal(h.win.runQaBossPhase(null,212),false);
  const shade={kind:3,bossName:"THE MOURNING SHADE",hp:500,
    maxHp:1000,phaseThree:false};
  assert.equal(h.win.runQaBossPhase(shade,470),true);
  const events=h.win.runQaGetReport().events;
  assert.deepEqual(Array.from(events.map(e=>e.type)),Array(4).fill("boss_phase"));
  assert.deepEqual(Array.from(events.map(e=>e.data.phase)),[1,2,3,1]);
});
test("victory becomes Endless in THE SAME report and a subsequent defeat retains victory",()=>{
  const h=setup();h.win.runQaBegin(meta);
  h.win.runQaSnapshot({time:1600,level:24});
  h.win.runQaEvent("boss_defeated",{name:"THE LAST MEME"},1600);
  assert.equal(h.win.runQaEnd("victory",1600),true);
  assert.equal(h.win.runQaEnd("defeat",1601),false);
  assert.equal(h.win.runQaGetReport().outcome,"victory");
  assert.equal(h.win.runQaContinueEndless(1601),true);
  h.win.runQaSnapshot({time:1630,mode:"endless",level:24});
  assert.equal(h.win.runQaEnd("endless_defeat",1690),true);
  const r=h.win.runQaGetReport();
  assert.equal(r.standardVictory,true);
  assert.equal(r.outcome,"endless_defeat");
  assert.equal(r.checkpoints.length,2);
  assert.equal(r.events.at(-1).type,"endless_continued");
  assert.equal(h.win.runQaContinueEndless(1700),false);
});
test("abandonment, new run reset and developer-sandbox label are honest",()=>{
  const h=setup();h.win.runQaBegin(meta);
  h.win.runQaSnapshot({time:160,level:6});
  assert.equal(h.win.runQaEnd("abandoned",160),true);
  assert.equal(h.win.runQaNeedsSnapshot(180),false);
  const first=h.win.runQaGetReport();
  assert.equal(first.outcome,"abandoned");
  h.win.isDeveloperRun=()=>true;
  h.win.runQaBegin({...meta,mode:"endless"});
  const next=h.win.runQaGetReport();
  assert.equal(next.sandbox,true);
  assert.equal(next.outcome,"in_progress");
  assert.equal(next.checkpoints.length,0);
  assert.equal(next.meta.mode,"endless");
});
test("disable recording preserves collected report and stores only user preference",()=>{
  const h=setup("false");
  assert.equal(h.win.runQaEnabled(),false);
  assert.equal(h.win.runQaBegin(meta),false);
  assert.equal(h.win.runQaGetReport(),null);
  h.win.runQaSetEnabled(true);
  assert.equal(h.win.runQaEnabled(),true);
  h.win.runQaBegin(meta);
  h.win.runQaSnapshot({time:0,level:1});
  h.win.runQaSetEnabled(false);
  assert.equal(h.win.runQaGetReport().outcome,"recording_disabled");
  assert.equal(h.win.runQaNeedsSnapshot(30),false);
  assert.equal(h.win.runQaGetReport().checkpoints.length,1);
  assert.deepEqual(Array.from(h.writes.map(x=>x[0])),
    ["shadowQaRecording","shadowQaRecording"]);
});
test("export can only be initiated explicitly by clicking DOWNLOAD, never automatically",()=>{
  let downloads=0,blobs=0,removed=0,revoked=0;
  const appended=[];
  const browser={
    Blob:class {constructor(parts,opts){this.parts=parts;this.opts=opts;blobs++;}},
    URL:{createObjectURL:()=> "blob:test",revokeObjectURL:()=>{revoked++;}},
    setTimeout:f=>f(),
    document:{
      body:{append:x=>appended.push(x)},
      createElement:tag=>({tag,style:{},textContent:"",
        click(){downloads++},remove(){removed++},
        append(){},onclick:null})
    }
  };
  const h=setup("true",browser);h.win.runQaBegin(meta);
  const parent={children:[],append(x){this.children.push(x)}};
  assert.equal(h.win.appendRunQaExportButtons(parent),true);
  assert.equal(parent.children.length,3);
  assert.equal(downloads,0);
  const btn=parent.children[1];
  assert.match(btn.textContent,/DOWNLOAD QA REPORT/);
  btn.onclick();
  assert.equal(downloads,1);
  assert.equal(blobs,1);
  assert.equal(removed,1);
  assert.equal(revoked,1);
  assert.equal(appended.length,1);
  const payload=JSON.parse(new browser.Blob(["{}"],{}).parts[0]);
  assert.deepEqual(payload,{});
});
test("malformed values are normalized and bounded to avoid huge JSON reports",()=>{
  const h=setup();h.win.runQaBegin(meta);
  h.win.runQaSnapshot({time:0,
    weird:Infinity,bad:-Infinity,
    huge:"A".repeat(1000),array:Array(500).fill("data"),
    upgrades:{flame:5,rate:3},nested:{a:{b:{c:{d:"too deep"}}}}});
  for(let i=0;i<410;i++)h.win.runQaEvent("hit",{amount:1},i);
  const r=h.win.runQaGetReport();
  assert.equal(r.checkpoints[0].weird,null);
  assert.equal(r.checkpoints[0].huge.length,160);
  assert.equal(r.checkpoints[0].array.length,20);
  assert.equal(r.events.length,360);
  assert.equal(r.totals.hitsTaken,410);
  assert.ok(JSON.stringify(r).length<150000);
});
test("wiring observes only real game progression and does NOT alter level choices",()=>{
  const game=read("js/game.js"),upgrade=read("js/upgrades.js"),
    enemies=read("js/enemies.js"),controls=read("js/controls.js"),
    index=read("index.html"),qa=read("js/run-telemetry.js");
  assert.match(game,/window\.runQaBegin\?\.\(\{mode:runMode,difficulty/);
  assert.match(game,/runQaNeedsSnapshot\?\.\(time\)/);
  assert.match(game,/runQaFrame\?\.\(elapsed,time/);
  assert.match(game,/runQaEnd\?\.\("victory",time\)/);
  assert.match(game,/runQaContinueEndless\?\.\(time\)/);
  assert.match(game,/runQaBossPhase\?\.\(boss,time\)/);
  assert.match(upgrade,/runQaEvent\?\.\("upgrade_offer"/);
  assert.match(upgrade,/runQaEvent\?\.\("upgrade_chosen"/);
  assert.match(upgrade,/runQaEvent\?\.\("evolution"/);
  assert.match(upgrade,/runQaXp\?\.\(collected,time\)/);
  assert.match(enemies,/runQaEvent\?\.\("boss_spawn"/);
  assert.match(enemies,/runQaEvent\?\.\("boss_defeated"/);
  assert.match(controls,/runQaSetEnabled\?\.\(qaInput.checked\)/);
  assert.match(controls,/appendRunQaExportButtons\?\.\(parent\)/);
  assert.match(index,/js\/run-telemetry\.js\?v=[a-z0-9-]+/);
  assert.doesNotMatch(qa,/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|storageSet\("shadowQaReport"/);
});
