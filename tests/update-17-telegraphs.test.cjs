const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),
 fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function harness(){
 const window={};vm.runInNewContext(read("js/encounter-tactics.js"),{window,Math},
   {filename:"js/encounter-tactics.js"});
 window.resetEncounterTactics();
 const player={x:175,y:0,r:12,combatVX:0,combatVY:0};
 const create=(kind,role,x=0,y=0,index=0,group="pack-one")=>{
  const e={kind,x,y,r:kind===2?35:kind===4?15:13,hp:100,speed:76};
  window.assignEncounterTactic(e,index,group,role);return e;
 };
 return {window,player,create};
}
function mockCanvas(){
 let ops=[];
 const ctx=new Proxy({save(){},restore(){},beginPath(){},closePath(){},fill(){},stroke(){},
  setLineDash(){},moveTo(...p){ops.push(["moveTo",...p])},
  lineTo(...p){ops.push(["lineTo",...p])},
  arc(...p){ops.push(["arc",...p])}},
  {get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
 return {ctx,ops};
}
test("pouncer warning is a real corridor with full collision width",()=>{
 const {window:w,player,create}=harness(),p=create(1,"pouncer");
 p.tacticCooldown=0;
 w.updateEncounterTactic(p,.01,player,0,true);
 assert.ok(p.tacticWarning>=.65);
 assert.equal(p.tacticDashWidth,p.r+player.r+4);
 assert.ok(p.tacticDashLength>=270);
 assert.ok(p.tacticWarningDuration>=p.tacticWarning);
 const {ctx,ops}=mockCanvas();
 w.drawEncounterTactic(p,ctx,0,"high");
 const points=ops.filter(v=>v[0]==="lineTo");
 assert.ok(points.length>=5,"warned corridor needs both edges and sweep marker");
 assert.ok(points.some(v=>Math.abs(v[2])>=p.tacticDashWidth-1),
  "the dangerous area has thickness, not just a single line");
});
test("charge heading is locked once warning begins, even when player dodges",()=>{
 const {window:w,player,create}=harness(),p=create(1,"pouncer");
 p.tacticCooldown=0;
 w.updateEncounterTactic(p,.01,player,0,true);
 const warned=p.tacticAngle;
 player.x=0;player.y=200;
 w.updateEncounterTactic(p,.8,player,.8,true);
 assert.equal(p.tacticDashTime,.58);
 const dash=w.updateEncounterTactic(p,.05,player,.85,true);
 assert.equal(dash.angle,warned);
 assert.ok(dash.speedMult>=4.55);
});
test("same pouncer corridor works at low and high graphic settings",()=>{
 const {window:w,player,create}=harness(),p=create(1,"pouncer");
 p.tacticCooldown=0;
 w.updateEncounterTactic(p,.01,player,0,true);
 for(const quality of ["low","medium","high"]){
  const {ctx,ops}=mockCanvas();w.drawEncounterTactic(p,ctx,.1,quality);
  assert.ok(ops.filter(x=>x[0]==="lineTo").length>=4,quality);
 }
});
test("Crusher and Binder circles show the exact skill radius and countdown",()=>{
 const {window:w,player,create}=harness();
 for(const [kind,role,radius] of [[2,"crusher",174],[0,"binder",158]]){
  const e=create(kind,role);
  e.tacticCooldown=0;player.x=110;
  w.updateEncounterTactic(e,.016,player,0,true);
  assert.equal(e.tacticRadius,radius);
  assert.ok(e.tacticWarning>=.8);
  const {ctx,ops}=mockCanvas();w.drawEncounterTactic(e,ctx,.3,"high");
  assert.ok(ops.some(v=>v[0]==="arc"&&v[3]===radius));
  assert.ok(ops.filter(v=>v[0]==="arc").length>=3);
 }
});
test("Crossfire locks warning fan before fire, even if Crusher starts later",()=>{
 const {window:w,player,create}=harness(),shade=create(4,"crossfire",0,0);
 const crusher=create(2,"crusher",25,0,1);
 w.linkEncounterTacticTeam([shade,crusher]);
 shade.aimAngle=.35;
 const planned=w.prepareEncounterTacticVolley(shade);
 assert.equal(planned.length,4);
 crusher.tacticWarning=.5;
 const shots=[];w.encounterTacticVolley(shade,shots,player);
 assert.equal(shots.length,4);
 assert.ok(Math.abs(Math.atan2(shots[0].vy,shots[0].vx)-(-.03))<.001);
 assert.equal(shade.tacticVolleyOffsets,null);
});
test("locked wider Crusher fan stays wide even after the warning stops",()=>{
 const {window:w,player,create}=harness(),shade=create(4,"crossfire");
 const crusher=create(2,"crusher",35,0,1);
 w.linkEncounterTacticTeam([shade,crusher]);
 shade.aimAngle=0;crusher.tacticWarning=.4;
 const offsets=w.prepareEncounterTacticVolley(shade);
 assert.ok(Math.abs(offsets[0])>.5);
 crusher.tacticWarning=0;
 const shots=[];w.encounterTacticVolley(shade,shots,player);
 assert.ok(Math.abs(Math.atan2(shots[0].vy,shots[0].vx))>.5);
});
test("cancelling Crossfire aim removes stale warning directions",()=>{
 const {window:w,player,create}=harness(),shade=create(4,"crossfire");
 shade.aimAngle=0;w.prepareEncounterTacticVolley(shade);
 assert.equal(shade.tacticVolleyOffsets.length,4);
 w.cancelEncounterTacticVolley(shade);
 assert.equal(shade.tacticVolleyOffsets,null);
 assert.equal(shade.tacticVolleyAngle,null);
});
test("Crossfire projectiles honor the existing projectile density cap",()=>{
 const {window:w,player,create}=harness(),shade=create(4,"crossfire");
 const shots=Array.from({length:315},()=>({}));
 w.prepareEncounterTacticVolley(shade);
 assert.equal(w.encounterTacticVolley(shade,shots,player),1);
 assert.equal(shots.length,316);
});
test("stomp and explosive zone draw both radius and internal countdown on Low",()=>{
 const archWindow={};vm.runInNewContext(read("js/enemy-archetypes.js"),{window:archWindow,Math});
 const mike={kind:2,x:0,y:0,r:35,hp:100,stompWarning:.5,stompRadius:149};
 const {ctx,ops}=mockCanvas();archWindow.drawEnemyArchetype(mike,ctx,0,"low");
 assert.ok(ops.filter(o=>o[0]==="arc").length>=2);
 assert.ok(ops.some(o=>o[0]==="arc"&&o[3]===149));
 assert.match(read("js/render.js"),/radius\*\(\.22\+\.78\*progress\)/);
});
test("firing directions and cancellation hooks are called in the real simulation",()=>{
 const code=read("js/game.js");
 assert.match(code,/window\.prepareEncounterTacticVolley\?\.\(e\)/);
 assert.match(code,/window\.cancelEncounterTacticVolley\?\.\(e\)/);
 assert.match(code,/window\.encounterTacticVolley\?\.\(e,enemyShots,player\)/);
 const render=read("js/render.js");
 assert.match(render,/tacticVolleyOffsets/);
 assert.match(render,/attackAngle=angle\+offset/);
 assert.match(read("index.html"),/encounter-tactics\.js\?v=[a-z0-9-]+/);
});
test("no additional enemies, spawns, XP or bosses are introduced by warning visuals",()=>{
 const tactics=read("js/encounter-tactics.js");
 const arch=read("js/enemy-archetypes.js");
 assert.doesNotMatch(tactics,/enemies\.push|spawnEnemy\(/);
 assert.doesNotMatch(arch,/enemies\.push|spawnEnemy\(/);
 assert.match(arch,/if\(!e \|\| e\.dead \|\| !visible \|\| e\.summoned \|\| e\.kind===3/);
});
