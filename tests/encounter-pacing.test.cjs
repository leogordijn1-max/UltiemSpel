const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const directorSource=read("js/encounter-pacing.js");
function director(){
  const notices=[],enemies=[],player={x:0,y:0},window={
    initializeEnemyAdaptation:e=>{e.adapted=true;},
    notifyEncounterPatrol:x=>notices.push(x)
  };
  vm.runInNewContext(directorSource,{window,Math});
  window.resetEncounterPacing();
  function spawn(kind,elite=false){
    const e={kind,elite,x:0,y:0,speed:55,hp:100,damage:10,r:13};
    enemies.push(e);return e;
  }
  return {window,enemies,notices,player,spawn,
    update:(now=0,growth=0,blocked=false,difficulty="normal")=>
      window.updateEncounterPacing(now,growth,player,enemies,spawn,blocked,difficulty)};
}
function waveHarness(){
  const full=read("js/enemies.js");
  const from=full.indexOf("const wavePatterns = [");
  const to=full.indexOf("// Shared spatial hash resolution for pickup storage and merging.",from);
  assert.ok(from>0&&to>from);
  const enemies=[],calls=[],window={isBossIsolationActive:()=>false,initializeEnemyAdaptation:e=>{e.adapted=true;}};
  const sandbox={boss:null,window,enemies,player:{x:0,y:0},growthTime:500,W:1280,H:720,Math,
    enemySpawn:(kind,elite)=>{
      const e={kind,elite:!!elite,hp:100,damage:10,speed:60,x:0,y:0};
      enemies.push(e);calls.push([kind,elite]);return e;
    }};
  vm.runInNewContext(full.slice(from,to),sandbox);
  return {enemies,calls,sandbox,window};
}
test("Normal ambient pressure steadily approaches, while the population hard-cap stays safe",()=>{
  const h=director();
  assert.equal(h.window.encounterPopulationCap(0,"normal"),20);
  assert.ok(h.window.encounterPopulationCap(1200,"normal")<=30);
  assert.ok(h.window.encounterPopulationCap(1200,"nightmare")<=30);
  assert.ok(h.window.encounterPopulationCap(0,"easy")<20);
  assert.ok(h.window.encounterAmbientInterval(0,"normal")<=2.6);
  assert.ok(h.window.encounterAmbientInterval(1500,"normal")<=1.65);
  assert.ok(h.window.encounterAmbientInterval(1500,"nightmare")<h.window.encounterAmbientInterval(1500,"easy"));
});
test("every 17 seconds the director sends a tightly grouped, stronger patrol",()=>{
  const h=director();
  assert.equal(h.update(0),0);
  assert.equal(h.update(16.9),0);
  assert.equal(h.update(17),3);
  assert.equal(h.enemies.length,3);
  const centroid={x:h.enemies[0].x,y:h.enemies[0].y};
  for(const e of h.enemies){
    assert.ok(Math.hypot(e.x-centroid.x,e.y-centroid.y)<200);
    assert.ok(e.hp>=165);
    assert.ok(e.damage>10);
    assert.equal(e.encounterRole,"patrol");
    assert.equal(e.xpValueMultiplier,h.window.encounterXpMultiplier(0,"patrol"));
    assert.equal(e.adapted,true);
  }
  assert.equal(h.notices.length,1);
});
test("stronger patrols reach five members late into the run",()=>{
  const h=director();const n=h.window.spawnEncounterPatrol(1200,1200,h.player,h.enemies,h.spawn,"normal");
  assert.equal(n,5);
  assert.equal(h.window.getEncounterPacingStatus().patrols,1);
});
test("patrol director pauses through boss isolation and never catch-up-spawns",()=>{
  const h=director();h.update(0);
  assert.equal(h.update(100,500,true),0);
  assert.equal(h.enemies.length,0);
  assert.equal(h.update(100.1,500,false),0);
  assert.equal(h.update(117.2,500,false),3+Math.floor(500/450));
  assert.equal(h.enemies.length,4);
});
test("patrols obey population cap and avoid half-spawned invalid groups",()=>{
  const h=director();
  for(let i=0;i<28;i++)h.enemies.push({hp:1,dead:false});
  assert.equal(h.window.spawnEncounterPatrol(0,0,h.player,h.enemies,h.spawn),0);
  h.enemies.splice(0,17);
  // Only spawn the complete three-unit team when the encounter is calm.
  assert.equal(h.window.spawnEncounterPatrol(0,0,h.player,h.enemies,h.spawn),3);
  assert.equal(h.enemies.length,14);
});
test("reset and clear cannot leave old timers or spawn extra enemies",()=>{
  const h=director();h.update(0);h.update(17);
  h.window.clearEncounterPacing();
  assert.equal(h.update(999),0);
  h.window.resetEncounterPacing();
  assert.equal(h.window.getEncounterPacingStatus().patrols,0);
  assert.equal(h.update(999),0);
});
test("every fourth special wave is a swarm of many weaker drifters and runners",()=>{
  const h=waveHarness();
  assert.equal(h.sandbox.wavePatternFor(4).swarm,true);
  const wave=h.sandbox.spawnSpecialWave(4);
  assert.ok(wave.spawned>=26&&wave.spawned<=42);
  assert.equal(wave.pattern.swarm,true);
  assert.ok(h.enemies.every(e=>e.kind===0||e.kind===1));
  assert.ok(h.enemies.every(e=>e.hp===46&&e.damage===7&&e.encounterRole==="swarm"));
  assert.ok(h.enemies.every(e=>e.xpValueMultiplier===.44));
});
test("normal waves are small challenging patrols, not huge hordes",()=>{
  for(const waveNumber of [1,2,3,5,6,7,9,12]){
    const h=waveHarness();
    const wave=h.sandbox.spawnSpecialWave(waveNumber);
    if(waveNumber%4===0)continue;
    assert.ok(wave.spawned>=4&&wave.spawned<=8);
    assert.ok(h.enemies.every(e=>e.hp>100&&e.damage>10));
    assert.ok(h.enemies.every(e=>e.xpValueMultiplier===2.6&&e.encounterRole==="patrol"));
    assert.ok(h.enemies.some(e=>e.elite));
  }
});
test("wave population hard cap and boss isolation block all extra spawns",()=>{
  const h=waveHarness();
  for(let i=0;i<90;i++)h.enemies.push({x:0,y:0,hp:100});
  const w=h.sandbox.spawnSpecialWave(4,150);
  assert.equal(w.spawned,5);
  assert.equal(h.enemies.length,95);
  h.sandbox.boss={};
  assert.equal(h.sandbox.spawnSpecialWave(8).spawned,0);
  h.sandbox.boss=null;h.window.isBossIsolationActive=()=>true;
  assert.equal(h.sandbox.spawnSpecialWave(9).spawned,0);
});
test("new pacing is connected to gameplay, wave notification, XP and boss isolation",()=>{
  assert.match(read("js/game.js"),/encounterAmbientLimit/);
  assert.match(read("js/game.js"),/encounterAmbientInterval/);
  assert.match(read("js/game.js"),/updateEncounterPacing/);
  assert.match(read("js/game.js"),/spawn = Math.max\(spawn,\.4\)/);
  assert.match(read("js/enemies.js"),/xpValueMultiplier/);
  assert.match(read("index.html"),/encounter-pacing\.js/);
});
