const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../js/world-defense.js"),"utf8");
const WORLDS={fire:"burning",water:"flooded",frost:"frozen"};
function harness(percent=15,original="frozen",element="fire"){
  const state={percent,original,element,blocked:false},enemies=[],messages=[];
  const window={
    getWorldConquest:()=>({active:true,original:state.original,invading:WORLDS[state.element],target:state.percent}),
    initializeEnemyAdaptation:(e,world)=>{e.worldAffinity=world;},
    notifyWorldDefense:message=>messages.push(message)
  };
  vm.runInNewContext(src,{window,Math});
  window.resetWorldDefense();
  const player={x:0,y:0,r:12};
  function spawn(kind){
    const e={x:0,y:0,r:kind===2?35:kind===6?24:14,hp:100,damage:8,
      speed:65,kind,knockbackX:0,knockbackY:0};
    enemies.push(e);return e;
  }
  return{window,state,enemies,messages,player,spawn,
    force:(now=0)=>window.forceWorldDefense(now,player,enemies,spawn,state.blocked),
    update:(now=0)=>window.updateWorldDefense(now,player,enemies,spawn,state.blocked)};
}
function group(h){return h.enemies.filter(x=>x.defenseSquadId&&!x.dead);}
test("no squad at 0% or when the player already owns the world",()=>{
  const h=harness(0);
  assert.equal(h.force(),false);h.update(100);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,0);
  h.state.percent=85;h.state.original="burning";
  assert.equal(h.force(),false);
});
test("a 15% squad spawns a leader, shield, two flanking hunters and a ranged supporter",()=>{
  const h=harness(15),result=h.force();
  assert.equal(result,true);
  assert.deepEqual(group(h).map(x=>x.defenseRole),["commander","defender","hunter","hunter","ranger"]);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,1);
  assert.equal(h.messages.length,1);
  assert.ok(group(h).every(x=>x.worldAffinity==="frozen"));
  assert.equal(h.force(),false); // one active squad maximum in tier 1
});
test("defenders protect the commander and nearby allies, but not distant members",()=>{
  const h=harness(50);h.force();
  const members=group(h),commander=members.find(x=>x.defenseRole==="commander");
  const defender=members.find(x=>x.defenseRole==="defender");
  const hunter=members.find(x=>x.defenseRole==="hunter");
  defender.x=0;defender.y=0;commander.x=12;commander.y=10;hunter.x=20;hunter.y=0;
  assert.equal(h.window.worldDefenseDamageMultiplier(commander),.7);
  assert.equal(h.window.worldDefenseDamageMultiplier(hunter),.7);
  assert.equal(h.window.worldDefenseDamageMultiplier(defender),1);
  hunter.x=500;assert.equal(h.window.worldDefenseDamageMultiplier(hunter),1);
  hunter.x=10;defender.dead=true;
  const second=members.find(x=>x.defenseRole==="defender"&&x!==defender);
  second.x=1000;second.y=1000;
  assert.equal(h.window.worldDefenseDamageMultiplier(hunter),1);
});
test("commander rally buff disappears on death or when troops leave command radius",()=>{
  const h=harness(50);h.force();
  const commander=group(h).find(x=>x.defenseRole==="commander");
  const hunter=group(h).find(x=>x.defenseRole==="hunter");
  commander.x=0;commander.y=0;hunter.x=10;hunter.y=0;
  assert.equal(h.window.worldDefenseAttackMultiplier(hunter),1.14);
  hunter.x=2000;assert.equal(h.window.worldDefenseAttackMultiplier(hunter),1);
  hunter.x=10;commander.dead=true;
  assert.equal(h.window.worldDefenseAttackMultiplier(hunter),1);
});
test("hunters flank rather than just run straight at the player",()=>{
  const h=harness(15);h.force();
  const g=group(h),commander=g.find(x=>x.defenseRole==="commander");
  const hunters=g.filter(x=>x.defenseRole==="hunter");
  commander.x=-260;commander.y=0;
  for(const e of hunters){e.x=-230;e.y=0;}
  const angles=hunters.map(e=>h.window.worldDefenseMovement(e,h.player,10).angle);
  assert.ok(angles[0]*angles[1]<0,"different hunters should approach opposite flanks");
});
test("automatic squads deploy only after the conquest has started, with a cooldown",()=>{
  const h=harness(0);
  h.update(0);h.update(99);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,0);
  h.state.percent=15;
  assert.equal(h.update(100),false);
  assert.equal(h.update(107.9),false);
  assert.equal(h.update(108),true);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,1);
  h.update(1000);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,1);
});
test("50% can deploy two squads and 85% can deploy three",()=>{
  const h=harness(50);
  assert.equal(h.force(),true);assert.equal(h.force(),true);
  assert.equal(h.force(),false);
  h.state.percent=85;
  assert.equal(h.force(),true);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,3);
  assert.equal(h.window.getWorldDefenseStatus().members,19);
});
test("boss isolation blocks spawn, pruning removes dead squads, reset clears counters",()=>{
  const h=harness(85);h.force();
  h.state.blocked=true;assert.equal(h.force(),false);
  h.update(25);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,1);
  for(const e of group(h))e.dead=true;
  h.state.blocked=false;h.update(26);
  assert.equal(h.window.getWorldDefenseStatus().activeSquads,0);
  h.window.resetWorldDefense();
  assert.equal(h.window.getWorldDefenseStatus().spawned,0);
});
test("defense formation renders role identity without sprites and drops on reset",()=>{
  const h=harness(15);h.force();
  let rings=0;
  const noop=()=>{};
  const ctx={save:noop,restore:noop,beginPath:noop,arc:()=>rings++,stroke:noop,
    fill:noop,moveTo:noop,lineTo:noop,closePath:noop};
  for(const e of group(h))h.window.drawWorldDefense(e,ctx,0,"high");
  assert.ok(rings>=5);
  h.window.clearWorldDefense();assert.equal(h.window.getWorldDefenseStatus().activeSquads,0);
});
test("squad AI is integrated with spawning, collision, visuals, boss arenas and test controls",()=>{
  const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
  assert.match(read("js/game.js"),/updateWorldDefense/);
  assert.match(read("js/game.js"),/worldDefenseMovement/);
  assert.match(read("js/game.js"),/worldDefenseAttackMultiplier/);
  assert.match(read("js/enemies.js"),/worldDefenseDamageMultiplier/);
  assert.match(read("js/render.js"),/drawWorldDefense/);
  assert.match(read("js/boss-isolation.js"),/resetWorldDefense/);
  assert.match(read("js/developer-mode.js"),/SPAWN DEFENSE SQUAD/);
  assert.match(read("index.html"),/world-defense.js/);
});
