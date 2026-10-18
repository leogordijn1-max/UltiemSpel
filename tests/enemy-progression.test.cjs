const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
function harness(developer=false){
  const messages=[],enemies=[],player={x:0,y:0},state={developer,percent:15};
  const window={
    isDeveloperRun:()=>state.developer,
    getWorldConquest:()=>({active:true,target:state.percent,original:"frozen",invading:"burning"}),
    initializeEnemyAdaptation:e=>{e.adapted=true;},
    notifyEncounterPatrol:message=>messages.push(message),
    notifyWorldDefense:message=>messages.push(message)
  };
  const context=vm.createContext({window,Math});
  for(const name of ["js/enemy-progression.js","js/encounter-pacing.js","js/world-defense.js"])
    vm.runInContext(read(name),context,{filename:name});
  window.resetEnemyProgression();
  window.resetEncounterPacing();
  window.resetWorldDefense();
  function spawn(kind,elite=false){
    const e={kind,elite,x:0,y:0,hp:100,speed:55,damage:10,r:15};
    enemies.push(e);return e;
  }
  return {window,state,messages,enemies,player,spawn};
}
const kindsAt=(h,seconds)=>Array.from(h.window.enemyProgressionStatus(seconds).unlocked);
test("run starts with exactly Drifter and Runner",()=>{
  const h=harness();
  assert.deepEqual(kindsAt(h,0),[0,1]);
  assert.deepEqual(kindsAt(h,179.99),[0,1]);
  for(let i=0;i<=100;i++)assert.ok([0,1].includes(h.window.pickAmbientEnemyKind(0,i/100)));
});
test("one new enemy type appears every three minutes, in deliberate difficulty order",()=>{
  const h=harness();
  const stages=[
    [180,[0,1,4]],[360,[0,1,4,2]],
    [540,[0,1,4,2,5]],[720,[0,1,4,2,5,6]]
  ];
  for(const [seconds,expected] of stages){
    assert.deepEqual(kindsAt(h,seconds),expected);
    assert.deepEqual(kindsAt(h,seconds-.01),expected.slice(0,-1));
  }
});
test("ambient random selection never draws a locked future enemy",()=>{
  const h=harness();
  for(const seconds of [0,100,180,290,360,500,540,610,720,1300])
    for(let i=0;i<=100;i++)
      assert.ok(kindsAt(h,seconds).includes(h.window.pickAmbientEnemyKind(seconds,i/100)),
        "illegal spawn at "+seconds+" with roll "+i);
});
test("patrol requests and squad roles never promote future enemies early",()=>{
  const h=harness();
  for(const seconds of [0,180,360,540,720]){
    for(const kind of [0,1,2,4,5,6]){
      const candidate=h.window.resolveEncounterEnemyKind(kind,seconds,3);
      assert.ok(kindsAt(h,seconds).includes(candidate));
    }
    for(const role of ["commander","defender","hunter","ranger"])
      assert.ok(kindsAt(h,seconds).includes(h.window.enemyDefenseRoleKind(role,seconds)));
  }
  assert.deepEqual(["commander","defender","hunter","ranger"].map(r=>h.window.enemyDefenseRoleKind(r,0)),[0,0,1,1]);
  assert.deepEqual(["commander","defender","hunter","ranger"].map(r=>h.window.enemyDefenseRoleKind(r,720)),[2,6,1,4]);
});
test("new introductions announce exactly once, even if frames skip thresholds",()=>{
  const h=harness(),names=[];
  const notify=x=>names.push(x);
  assert.equal(h.window.updateEnemyProgression(0,notify),false);
  assert.equal(h.window.updateEnemyProgression(179,notify),false);
  assert.equal(h.window.updateEnemyProgression(181,notify),true);
  h.window.updateEnemyProgression(181,notify);
  h.window.updateEnemyProgression(721,notify);
  h.window.updateEnemyProgression(900,notify);
  assert.equal(names.length,4);
  assert.match(names[0],/RANGED SHADE/);
  assert.match(names[1],/ZOMBIE MIKE/);
  assert.match(names[2],/BURSTLING/);
  assert.match(names[3],/BULWARK/);
});
test("developer can preview types early, while a normal run cannot",()=>{
  const h=harness();
  assert.equal(h.window.developerUnlockNextEnemy(0),false);
  h.state.developer=true;
  assert.equal(h.window.developerUnlockNextEnemy(0),true);
  assert.deepEqual(kindsAt(h,0),[0,1,4]);
  assert.equal(h.window.developerUnlockNextEnemy(0),true);
  assert.deepEqual(kindsAt(h,0),[0,1,4,2]);
  h.state.developer=false;
  assert.deepEqual(kindsAt(h,0),[0,1]);
  h.state.developer=true;
  h.window.resetEnemyProgression();
  assert.deepEqual(kindsAt(h,0),[0,1]);
});
test("early patrols use only Drifters and Runners despite late-game pattern",()=>{
  const h=harness();
  const n=h.window.spawnEncounterPatrol(0,0,h.player,h.enemies,h.spawn,"normal");
  assert.equal(n,3);
  assert.ok(h.enemies.every(e=>[0,1].includes(e.kind)));
  assert.ok(h.enemies.every(e=>e.encounterRole==="patrol"));
});
test("midgame patrols first gain ranged support then stronger melee types",()=>{
  const h=harness();
  const n=h.window.spawnEncounterPatrol(180,180,h.player,h.enemies,h.spawn,"normal");
  assert.equal(n,3);
  assert.ok(h.enemies.some(e=>e.kind===4));
  assert.ok(h.enemies.every(e=>e.kind!==2&&e.kind!==6));
  h.window.resetEncounterPacing();h.enemies.length=0;
  h.window.spawnEncounterPatrol(420,420,h.player,h.enemies,h.spawn,"normal");
  assert.ok(h.enemies.some(e=>e.kind===2));
  assert.ok(h.enemies.every(e=>e.kind!==6));
});
test("world-defense roles start as basic enemies and upgrade when unlocked",()=>{
  const early=harness();assert.equal(early.window.forceWorldDefense(0,early.player,early.enemies,early.spawn,false,0),true);
  assert.ok(early.enemies.every(e=>[0,1].includes(e.kind)));
  assert.deepEqual(early.enemies.map(e=>e.defenseRole),["commander","defender","hunter","hunter","ranger"]);
  const late=harness();assert.equal(late.window.forceWorldDefense(720,late.player,late.enemies,late.spawn,false,720),true);
  assert.deepEqual(late.enemies.map(e=>e.kind),[2,6,1,1,4]);
});
test("first waves only show and spawn early enemy types",()=>{
  const source=read("js/enemies.js"),from=source.indexOf("const wavePatterns = ["),
    to=source.indexOf("// Shared spatial hash resolution for pickup storage and merging.",from);
  assert.ok(from>0 && to>from);
  const h=harness(),context=vm.createContext({
    window:h.window,Math,boss:null,growthTime:75,player:h.player,
    W:1280,H:720,enemies:h.enemies,enemySpawn:h.spawn
  });
  vm.runInContext(source.slice(from,to),context);
  const banner=vm.runInContext("wavePatternFor(1).name",context);
  assert.match(banner,/DRIFTER/);
  vm.runInContext("spawnSpecialWave(1)",context);
  assert.ok(h.enemies.every(e=>e.kind===0||e.kind===1));
  h.enemies.length=0;
  context.growthTime=150;
  assert.match(vm.runInContext("wavePatternFor(2).name",context),/RUNNER/);
  vm.runInContext("spawnSpecialWave(2)",context);
  assert.ok(h.enemies.every(e=>e.kind===0||e.kind===1));
});
test("the central roster is used by actual spawn, patrol, wave and defense modules",()=>{
  assert.match(read("js/enemies.js"),/pickAmbientEnemyKind/);
  assert.match(read("js/enemies.js"),/resolveEncounterEnemyKind/);
  assert.match(read("js/encounter-pacing.js"),/resolveEncounterEnemyKind/);
  assert.match(read("js/world-defense.js"),/enemyDefenseRoleKind/);
  assert.match(read("js/game.js"),/updateEnemyProgression/);
  assert.match(read("js/game.js"),/resetEnemyProgression/);
  assert.match(read("js/developer-mode.js"),/UNLOCK NEXT ENEMY TYPE/);
  assert.match(read("index.html"),/enemy-progression\.js/);
});
