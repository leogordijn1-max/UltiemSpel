const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const progression=[0,1,4,2,5,6],stages=[0,0,180,360,540,720];
function harness(){
  const window={
    isBossIsolationActive:()=>false,
    initializeEnemyAdaptation:()=>{},
    enemyOffscreenSpawn:(angle,padding,along=0)=>({x:1800+padding,y:Math.sin(angle)*100+along})
  };
  const context=vm.createContext({window,Math,player:{x:0,y:0},W:1280,H:720,
    growthTime:0, boss:null,enemies:[]});
  for(const file of ["js/enemy-progression.js","js/tactical-encounters.js",
    "js/encounter-tactics.js","js/encounter-pacing.js"])
    vm.runInContext(read(file),context,{filename:file});
  window.resetEnemyProgression();window.resetEncounterTactics();window.resetEncounterPacing();
  context.enemySpawn=(kind,elite=false)=>{
    const enemy={kind,elite,hp:120,r:kind===2?35:16,damage:10,speed:65,x:0,y:0};
    context.enemies.push(enemy);return enemy;
  };
  return {window,context};
}
test("planned tactical packs evolve through all five unlock stages",()=>{
  const h=harness();
  const expected=[
    [0,"BREAK THE LINE",3],[180,"SUPPRESS & POUNCE",3],
    [360,"HAMMER & ANVIL",4],[540,"VOLATILE TRAP",4],
    [720,"LAST DEFENSIVE LINE",5]
  ];
  for(const [seconds,name,size] of expected){
    const plan=h.window.chooseTacticalEncounter(seconds,0);
    assert.equal(plan.name,name);
    assert.equal(plan.members.length,size);
    assert.ok(plan.members.every(m=>progression.some((k,i)=>k===m.kind && stages[i]<=seconds)),
      "no enemy kind may enter before its unlock");
    assert.ok(plan.members.every(m=>typeof m.tactic==="string"&&m.tactic.length>0));
  }
});
test("three distinct plans per progression stage, each with counterplay hints",()=>{
  const h=harness();
  for(const time of [0,180,360,540,720]){
    const plans=[0,1,2].map(i=>h.window.chooseTacticalEncounter(time,i));
    assert.equal(new Set(plans.map(p=>p.name)).size,3);
    assert.ok(plans.every(p=>p.hint));
    assert.ok(plans.every(p=>p.members.length<=5));
    assert.deepEqual(Array.from(plans[0].kinds),Array.from(plans[0].members,x=>x.kind));
  }
});
test("locked heavy kinds never slip into encounter plans",()=>{
  const h=harness();
  h.window.enemyKindAvailable=(kind)=>kind===0||kind===1;
  const plan=h.window.chooseTacticalEncounter(720,0);
  assert.ok(plan.members.every(m=>m.kind===0||m.kind===1));
});
test("director deploys designed units and honors roles, offscreen origin and group size",()=>{
  const h=harness();
  for(const seconds of [0,180,360,540,720]){
    h.window.resetEncounterPacing();h.context.enemies.length=0;
    const result=h.window.spawnEncounterPatrol(0,seconds,
      h.context.player,h.context.enemies,h.context.enemySpawn);
    const selected=h.window.chooseTacticalEncounter(seconds,0);
    assert.equal(result,selected.members.length);
    assert.deepEqual(Array.from(h.context.enemies,e=>e.kind),Array.from(selected.members,m=>m.kind));
    assert.deepEqual(Array.from(h.context.enemies,e=>e.encounterTactic),Array.from(selected.members,m=>m.tactic));
    assert.ok(h.context.enemies.every(e=>e.x>640));
    assert.ok(h.context.enemies.every(e=>e.encounterPartners?.length===selected.members.length));
    assert.ok(h.context.enemies.every(e=>e.encounterPlan===selected.name));
  }
});
test("designer waves use exact plan, stay capped and retain the fourth-wave swarm",()=>{
  const h=harness();
  const code=read("js/enemies.js");
  const start=code.indexOf("const wavePatterns = [");
  const end=code.indexOf("// Shared spatial hash resolution for pickup storage and merging.",start);
  assert.ok(start>0&&end>start);
  vm.runInContext(code.slice(start,end),h.context);
  for(const [seconds,wave] of [[0,1],[185,2],[400,5],[750,9]]){
    h.context.growthTime=seconds;h.context.enemies.length=0;
    const result=h.context.spawnSpecialWave(wave);
    const plan=h.window.chooseTacticalEncounter(seconds,wave-1);
    assert.equal(result.name,plan.name);
    assert.equal(result.hint,plan.hint);
    assert.equal(result.spawned,plan.members.length);
    assert.ok(h.context.enemies.every(e=>e.encounterPlan===plan.name));
    assert.ok(h.context.enemies.every(e=>e.encounterPartners?.length===plan.members.length));
  }
  h.context.enemies.length=0;
  const swarm=h.context.spawnSpecialWave(4);
  assert.equal(swarm.pattern.swarm,true);
  assert.ok(swarm.spawned>=26);
  assert.ok(h.context.enemies.every(e=>e.encounterRole==="swarm"&&!e.encounterTactic));
});
test("binders trigger a synchronized pouncer charge with one boost per pulse",()=>{
  const h=harness(),group=h.window.newEncounterTacticGroup();
  const binder={kind:0,hp:100,x:0,y:0,r:13},pouncer={kind:1,hp:100,x:30,y:0,r:13};
  h.window.assignEncounterTactic(binder,0,group,"binder");
  h.window.assignEncounterTactic(pouncer,1,group,"pouncer");
  assert.equal(h.window.linkEncounterTacticTeam([binder,pouncer]),2);
  const player={x:120,y:0,r:12};
  binder.tacticCooldown=0;
  h.window.updateEncounterTactic(binder,.01,player,0,true,{chill:()=>{}});
  assert.ok(binder.tacticWarning>0);
  pouncer.tacticCooldown=5;
  h.window.updateEncounterTactic(pouncer,.1,player,.1,true);
  assert.ok(pouncer.tacticCooldown<=.45,"pouncer primes during a binder's warning");
  h.window.updateEncounterTactic(binder,.9,player,1,true,{chill:()=>{}});
  assert.equal(binder.tacticPulseAt,1);
  pouncer.tacticCooldown=9;
  h.window.updateEncounterTactic(pouncer,.1,player,1.1,true);
  assert.equal(pouncer.tacticLastBoostAt,1);
  assert.ok(pouncer.tacticComboBoostUntil>1.1);
  pouncer.tacticCooldown=9;
  h.window.updateEncounterTactic(pouncer,.1,player,1.2,true);
  assert.ok(pouncer.tacticCooldown>8,"the same binder pulse must never stack additional boosts");
  binder.dead=true;pouncer.tacticCooldown=9;
  h.window.updateEncounterTactic(pouncer,.1,player,1.4,true);
  assert.ok(pouncer.tacticCooldown>8,"dead allies cannot coordinate");
});
test("crossfire changes its attack spread during a living crusher's warning",()=>{
  const h=harness(),s=h.window.newEncounterTacticGroup();
  const shade={kind:4,hp:100,x:0,y:0,r:13,aimAngle:0};
  const crusher={kind:2,hp:100,x:25,y:0,r:25};
  h.window.assignEncounterTactic(shade,0,s,"crossfire");
  h.window.assignEncounterTactic(crusher,1,s,"crusher");
  h.window.linkEncounterTacticTeam([shade,crusher]);
  const basic=[];h.window.encounterTacticVolley(shade,basic,{x:150,y:0});
  crusher.tacticWarning=.5;
  const combo=[];h.window.encounterTacticVolley(shade,combo,{x:150,y:0});
  assert.equal(combo.length,4);
  assert.ok(Math.abs(combo[0].vy)>Math.abs(basic[0].vy),"synchronized attack must cover wider escape lanes");
  crusher.dead=true;
  const after=[];h.window.encounterTacticVolley(shade,after,{x:150,y:0});
  assert.ok(Math.abs(after[0].vy)<Math.abs(combo[0].vy),"eliminating the crusher breaks coordination");
});
test("combo planner and pact mechanics are wired in gameplay, waves and developer tools",()=>{
  assert.match(read("js/enemies.js"),/chooseTacticalEncounter/);
  assert.match(read("js/enemies.js"),/linkEncounterTacticTeam/);
  assert.match(read("js/encounter-pacing.js"),/chooseTacticalEncounter/);
  assert.match(read("js/encounter-tactics.js"),/encounterPartners/);
  assert.match(read("js/game.js"),/wave\.hint/);
  assert.match(read("index.html"),/tactical-encounters\.js/);
});
