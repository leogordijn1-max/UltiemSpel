const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function sandbox(){
  const messages=[];
  const window={notifyEncounterPatrol:text=>messages.push(text)};
  vm.runInNewContext(read("js/encounter-tactics.js"),{window,Math},{filename:"js/encounter-tactics.js"});
  window.resetEncounterTactics();
  const player={x:200,y:0,r:12,combatVX:0,combatVY:0};
  const create=(kind,role,index=0,group="pack-1",x=0,y=0)=>{
    const enemy={kind,x,y,r:kind===2?35:14,hp:100,damage:10};
    window.assignEncounterTactic(enemy,index,group,role);
    return enemy;
  };
  const link=(...members)=>window.linkEncounterTacticTeam(members);
  return {window,messages,player,create,link};
}
test("guard moves to intercept the player between their ranged ally",()=>{
  const h=sandbox();
  const guard=h.create(0,"vanguard",0,"a",0,0);
  const ranged=h.create(4,"crossfire",1,"a",80,0);
  h.link(guard,ranged);
  const response=h.window.updateEncounterTactic(guard,.016,h.player,1,true);
  assert.ok(response,"defender needs to position rather than chase the player directly");
  assert.ok(Math.abs(response.angle)<.1);
  assert.ok(response.speedMult>1);
  guard.x=135;
  assert.equal(h.window.updateEncounterTactic(guard,.016,h.player,1.1,true),null,
    "once positioned, the guard is allowed to return to ordinary movement");
});
test("guard tries to protect the binder if no ranged ally exists",()=>{
  const h=sandbox();
  const guard=h.create(6,"ward",0,"a",0,0);
  const binder=h.create(0,"binder",1,"a",70,0);
  h.link(guard,binder);
  assert.ok(h.window.updateEncounterTactic(guard,.016,h.player,1,true));
  binder.dead=true;
  assert.equal(h.window.updateEncounterTactic(guard,.016,h.player,1.1,true),null);
});
test("guards do not protect enemies from a different tactical group",()=>{
  const h=sandbox();
  const guard=h.create(0,"vanguard",0,"a");
  const foreign=h.create(4,"crossfire",1,"b",100,0);
  h.link(guard,foreign);
  assert.equal(h.window.updateEncounterTactic(guard,.016,h.player,1,true),null);
});
test("skirmishers predict player direction but keep opposite flanking lanes",()=>{
  const h=sandbox();
  const left=h.create(1,"skirmisher",0,"a");
  const right=h.create(1,"skirmisher",1,"a");
  const before=h.window.updateEncounterTactic(left,.016,h.player,1,true);
  h.player.combatVY=200;
  const after=h.window.updateEncounterTactic(left,.016,h.player,1.1,true);
  const opposite=h.window.updateEncounterTactic(right,.016,h.player,1.1,true);
  assert.ok(after.angle>before.angle);
  assert.ok(after.angle<0&&opposite.angle>0);
  assert.equal(after.speedMult,1.32);
  assert.ok(h.window.updateEncounterTactic(left,.016,h.player,1.2,false)===null);
});
test("binder and crusher telegraphs are staggered, never surprise-doublecast",()=>{
  const h=sandbox();
  h.player.x=100;
  const binder=h.create(0,"binder",0,"a");
  const crusher=h.create(2,"crusher",1,"a");
  h.link(binder,crusher);
  binder.tacticCooldown=0;crusher.tacticCooldown=0;
  assert.ok(h.window.updateEncounterTactic(binder,.016,h.player,0,true));
  assert.ok(binder.tacticWarning>0);
  assert.equal(h.window.updateEncounterTactic(crusher,.016,h.player,.02,true),null);
  assert.equal(crusher.tacticWarning,0);
  h.window.updateEncounterTactic(binder,.9,h.player,1,true,{chill:()=>{}});
  assert.equal(binder.tacticWarning,0);
  assert.ok(h.window.updateEncounterTactic(crusher,.016,h.player,1.02,true));
  assert.ok(crusher.tacticWarning>0);
});
test("defeating a ward removes protection and gives three seconds of bonus damage",()=>{
  const h=sandbox();
  const guard=h.create(6,"ward",0,"a",0,0);
  const ally=h.create(1,"pouncer",1,"a",40,0);
  const outsider=h.create(1,"pouncer",1,"b",40,0);
  h.link(guard,ally);
  const all=[guard,ally,outsider];
  assert.equal(h.window.encounterTacticDamageMultiplier(ally,all,2),.77);
  guard.dead=true;guard.hp=0;
  assert.equal(h.window.onTacticalEnemyDeath(guard,2.2,true),true);
  assert.equal(h.window.encounterTacticDamageMultiplier(ally,all,2.5),1.16);
  assert.equal(h.window.encounterTacticDamageMultiplier(ally,all,5.3),1);
  assert.equal(h.window.encounterTacticDamageMultiplier(outsider,all,2.5),1);
  assert.equal(h.messages.length,1);
  assert.match(h.messages[0],/FORMATION BROKEN/);
});
test("guard death primes pouncer but still requires a readable warning",()=>{
  const h=sandbox();
  const guard=h.create(0,"vanguard",0,"a");
  const pouncer=h.create(1,"pouncer",1,"a",40,0);
  h.link(guard,pouncer);
  pouncer.tacticCooldown=6;guard.dead=true;
  h.window.onTacticalEnemyDeath(guard,2,true);
  assert.ok(pouncer.tacticCooldown<=.65);
  h.player.x=200;
  h.window.updateEncounterTactic(pouncer,.7,h.player,2.7,true);
  assert.ok(pouncer.tacticWarning>0);
  assert.equal(pouncer.tacticDashTime,0);
});
test("dead binder cannot maintain boosted pouncer charges",()=>{
  const h=sandbox();
  const binder=h.create(0,"binder",0,"a");
  const pouncer=h.create(1,"pouncer",1,"a");
  h.link(binder,pouncer);
  pouncer.tacticComboBoostUntil=100;
  binder.dead=true;
  h.window.onTacticalEnemyDeath(binder,5,true);
  assert.equal(pouncer.tacticComboBoostUntil,0);
  pouncer.tacticCooldown=9;
  h.window.updateEncounterTactic(pouncer,.1,h.player,5.1,true);
  assert.ok(pouncer.tacticCooldown>8);
});
test("offscreen guard death cannot generate notification spam",()=>{
  const h=sandbox();
  const guard=h.create(0,"vanguard",0,"a");
  const ward=h.create(6,"ward",1,"a");
  const ally=h.create(1,"pouncer",2,"a");
  h.link(guard,ward,ally);
  guard.dead=true;
  h.window.onTacticalEnemyDeath(guard,1,false);
  assert.equal(h.messages.length,0);
  ward.dead=true;
  h.window.onTacticalEnemyDeath(ward,2,true);
  assert.equal(h.messages.length,1);
  h.window.onTacticalEnemyDeath(ward,2,true);
  assert.equal(h.messages.length,1);
});
test("exposed state has visible highlight without extra particles on Low quality",()=>{
  const h=sandbox();
  const ally=h.create(1,"pouncer",0,"a");
  ally.tacticExposedUntil=3;
  let rings=0;
  const ctx=new Proxy({save(){},restore(){},beginPath(){},arc(){rings++},stroke(){}},
    {get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
  h.window.drawEncounterTactic(ally,ctx,1,"low");
  assert.ok(rings>=2);
});
test("bosses, summoned units and ambient enemies never gain team-vulnerability powers",()=>{
  const h=sandbox();
  const boss={kind:3,x:0,y:0,hp:1000};
  const summoned={kind:1,x:0,y:0,hp:25,summoned:true};
  const ambient={kind:1,x:0,y:0,hp:100};
  h.window.assignEncounterTactic(boss,0,"a");
  h.window.assignEncounterTactic(summoned,0,"a");
  assert.ok(!boss.encounterTactic&&!summoned.encounterTactic);
  assert.equal(h.window.onTacticalEnemyDeath(boss,1,true),false);
  assert.equal(h.window.onTacticalEnemyDeath(ambient,1,true),false);
  assert.equal(h.window.encounterTacticDamageMultiplier(ambient,[ambient],1),1);
});
test("real kill flow applies guard death and live damage checks exposed window",()=>{
  assert.match(read("js/enemies.js"),/onTacticalEnemyDeath\?\.\(e,time,hitVisible\)/);
  assert.match(read("js/enemies.js"),/encounterTacticDamageMultiplier\?\.\(e,enemies,time\)/);
  assert.match(read("js/encounter-pacing.js"),/linkEncounterTacticTeam/);
  assert.match(read("js/enemies.js"),/linkEncounterTacticTeam/);
  assert.match(read("js/game.js"),/updateEncounterTactic/);
  assert.match(read("index.html"),/encounter-tactics\.js\?v=[a-z0-9-]+/);
});
