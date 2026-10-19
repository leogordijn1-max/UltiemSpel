const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function setup(){
 const window={},ctx=vm.createContext({window,Math,Number,Set});
 for(const file of ["js/enemy-counter-roles.js","js/crowd-control.js","js/encounter-tactics.js"])
  vm.runInContext(source(file),ctx);
 return window;
}
const enemy=(kind,extra={})=>({kind,dead:false,hp:100,x:0,y:0,
 r:kind===2?35:kind===6?24:12,shieldActive:true,
 knockbackX:0,knockbackY:0,...extra});
function approx(a,b){assert.ok(Math.abs(a-b)<1e-8,String(a)+" != "+String(b));}
test("roles reuse original enemy kinds only, without adding new spawns",()=>{
 const w=setup(),mobs=[
  enemy(2),enemy(1,{encounterTactic:"pouncer"}),enemy(1),
  enemy(6,{encounterTactic:"ward"}),enemy(6),enemy(3),
  enemy(2,{summoned:true})];
 mobs.forEach(m=>w.initializeEnemyCounterRole(m));
 assert.equal(mobs[0].counterRole,"anchor");
 assert.equal(mobs[1].counterRole,"phaseStalker");
 assert.equal(mobs[2].counterRole,null);
 assert.equal(mobs[3].counterRole,"warden");
 assert.equal(mobs[4].counterRole,null);
 assert.equal(mobs[5].counterRole,undefined);
 assert.equal(mobs[6].counterRole,undefined);
 assert.equal(Object.keys(w.enemyCounterRoleNames).length,3);
});
test("Anchor cannot be dragged by Whirlpool like a light mob",()=>{
 const w=setup(),a=enemy(2),normal=enemy(0);
 w.initializeEnemyCounterRole(a);
 approx(w.enemyCrowdControlResistance(a,"whirlpool",9),.12*.35);
 approx(w.enemyCrowdControlResistance(a,"waterBolt",9),.12*.65*.7);
 approx(w.enemyCrowdControlResistance(normal,"whirlpool",9),1);
 w.applyEnemyCrowdControl(a,680,0,"whirlpool",9);
 assert.ok(a.knockbackX<29);
 assert.equal(a.hp,100);
});
test("Anchor's rapid recoil diminishes, recovers and cannot delete damage",()=>{
 const w=setup(),a=enemy(2);w.initializeEnemyCounterRole(a);
 w.applyEnemyCrowdControl(a,170,0,"waterBolt",5);
 const first=a.knockbackX;
 w.applyEnemyCrowdControl(a,170,0,"waterBolt",5.3);
 const second=a.knockbackX-first;
 assert.ok(second<first*.5);
 w.applyEnemyCrowdControl(a,170,0,"waterBolt",6.6);
 approx(a.knockbackX-first-second,first);
 assert.equal(a.hp,100);
});
test("bombs crack Anchor's armor for 2.6 seconds, restoring counterplay",()=>{
 const w=setup(),a=enemy(2);w.initializeEnemyCounterRole(a);
 approx(w.enemyCounterDamageMultiplier(a,"direct",20),1);
 assert.equal(w.enemyCounterOnDamaged(a,"flame",20),false);
 assert.equal(w.enemyCounterOnDamaged(a,"bomb",20),true);
 approx(w.enemyCounterDamageMultiplier(a,"direct",21),1.2);
 approx(w.enemyCounterDamageMultiplier(a,"frost",21),1.2);
 approx(w.enemyCounterDamageMultiplier(a,"burn",21),1);
 approx(w.enemyCounterDamageMultiplier(a,"direct",23),1);
});
test("Warden protects only two LIVE squadmates within 155px",()=>{
 const w=setup(),guard=enemy(6,{encounterTactic:"ward",encounterGroup:"g"}),
 a=enemy(0,{x:50,y:15,encounterGroup:"g"}),
 b=enemy(1,{x:130,encounterGroup:"g"}),
 c=enemy(4,{x:145,encounterGroup:"g"});
 [guard,a,b,c].forEach(m=>w.initializeEnemyCounterRole(m));
 const squad=[guard,a,b,c];squad.forEach(m=>m.encounterPartners=squad);
 assert.equal(w.enemyCounterProtectedAllies(guard).length,2);
 assert.equal(w.enemyCounterWardFor(a),guard);
 assert.equal(w.enemyCounterWardFor(b),guard);
 assert.equal(w.enemyCounterWardFor(c),null);
 approx(w.enemyCounterMovementFactor(a,"whirlpool",3),.33);
 approx(w.enemyCounterMovementFactor(c,"whirlpool",3),1);
 approx(w.enemyCrowdControlResistance(a,"waterBolt",3),.7*.33);
});
test("shield-down, death, wrong group and distance remove Warden protection immediately",()=>{
 const w=setup(),guard=enemy(6,{encounterTactic:"ward",encounterGroup:"g"}),
 a=enemy(0,{x:50,encounterGroup:"g"});
 w.initializeEnemyCounterRole(guard);
 guard.encounterPartners=[guard,a];a.encounterPartners=[guard,a];
 approx(w.enemyCounterMovementFactor(a,"whirlpool",6),.33);
 guard.shieldActive=false;approx(w.enemyCounterMovementFactor(a,"whirlpool",6),1);
 guard.shieldActive=true;guard.dead=true;
 approx(w.enemyCounterMovementFactor(a,"whirlpool",6),1);
 guard.dead=false;guard.x=-250;
 approx(w.enemyCounterMovementFactor(a,"whirlpool",6),1);
 guard.x=0;a.encounterGroup="another";
 approx(w.enemyCounterMovementFactor(a,"whirlpool",6),1);
});
test("Warden shields movement, never weapon damage, HP or XP",()=>{
 const w=setup(),guard=enemy(6,{encounterTactic:"ward",encounterGroup:"g"}),
 a=enemy(0,{x:45,encounterGroup:"g",hp:80});
 w.initializeEnemyCounterRole(guard);
 guard.encounterPartners=[guard,a];a.encounterPartners=[guard,a];
 w.applyEnemyCrowdControl(a,200,0,"whirlpool",10);
 approx(a.knockbackX,66);
 assert.equal(a.hp,80);
 approx(w.enemyCounterDamageMultiplier(a,"water",10),1);
});
test("Phase Stalker pouncer gets a fully warned diagonal dash, not instant damage",()=>{
 const w=setup(),stalker=enemy(1,{speed:100}),p={x:220,y:0,r:12};
 w.assignEncounterTactic(stalker,0,"team","pouncer");
 assert.equal(stalker.counterRole,"phaseStalker");
 stalker.tacticCooldown=0;
 const move=w.updateEncounterTactic(stalker,.02,p,100,true);
 assert.equal(move.speedMult,0);
 approx(stalker.tacticWarning,.86);
 assert.ok(Math.abs(stalker.tacticAngle)>.35);
 assert.ok(stalker.tacticDashLength>=270);
 assert.ok(stalker.tacticDashWidth>0);
});
test("Phase Stalker is vulnerable on 1.6s post-dash recovery",()=>{
 const w=setup(),stalker=enemy(1,{speed:90}),p={x:220,y:0,r:12};
 w.assignEncounterTactic(stalker,0,"group","pouncer");
 const hits=[],hooks={damage:n=>hits.push(n)};
 stalker.tacticCooldown=0;
 w.updateEncounterTactic(stalker,.02,p,1,true,hooks);
 let out=w.updateEncounterTactic(stalker,.4,p,1.4,true,hooks);
 assert.equal(out.speedMult,0);
 out=w.updateEncounterTactic(stalker,.48,p,1.9,true,hooks);
 assert.equal(out.speedMult,0);
 assert.ok(stalker.tacticDashTime>0);
 out=w.updateEncounterTactic(stalker,.4,p,2.3,true,hooks);
 assert.ok(out.speedMult>=4.25);
 approx(w.enemyCounterDamageMultiplier(stalker,"direct",2.3),1);
 w.updateEncounterTactic(stalker,.21,p,2.51,true,hooks);
 assert.ok(stalker.counterExposureUntil>2.51);
 approx(w.enemyCounterDamageMultiplier(stalker,"frost",2.6),1.2);
 approx(w.enemyCounterDamageMultiplier(stalker,"frost",5),1);
 assert.equal(hits.length,0);
});
test("bosses and summons never gain regular enemy-counter abilities",()=>{
 const w=setup(),boss=enemy(3),summon=enemy(2,{summoned:true});
 w.initializeEnemyCounterRole(boss);w.initializeEnemyCounterRole(summon);
 approx(w.enemyCounterMovementFactor(boss,"whirlpool",10),1);
 approx(w.enemyCounterDamageMultiplier(summon,"direct",10),1);
});
test("Low/High draw massive Anchor feet, Stalker ghosts and honest Warden links",()=>{
 const w=setup(),ops={line:0,arc:0,stroke:0,dash:0};
 const ctx=new Proxy({
  save(){},restore(){},beginPath(){},moveTo(){},lineTo(){ops.line++},
  arc(){ops.arc++},stroke(){ops.stroke++},setLineDash(){ops.dash++}
 },{set(o,k,v){o[k]=v;return true;}});
 const a=enemy(2);w.initializeEnemyCounterRole(a);
 const s=enemy(1,{encounterTactic:"pouncer",tacticAngle:.7,
  counterExposureUntil:6});w.initializeEnemyCounterRole(s);
 const ward=enemy(6,{encounterTactic:"ward",encounterGroup:"g"});
 const ally=enemy(0,{x:60,encounterGroup:"g"});
 w.initializeEnemyCounterRole(ward);
 ward.encounterPartners=[ward,ally];ally.encounterPartners=[ward,ally];
 for(const quality of ["low","high"]){
  w.drawEnemyCounterRole(a,ctx,1,quality);
  w.drawEnemyCounterRole(s,ctx,1,quality);
  w.drawEnemyCounterRole(ward,ctx,1,quality);
 }
 assert.ok(ops.line>=20);assert.ok(ops.arc>=5);
 assert.ok(ops.stroke>=12);assert.ok(ops.dash>=2);
});
test("live code integrates physics, tactical team roles and Canvas cues",()=>{
 const html=source("index.html"),enemyCode=source("js/enemies.js"),
  game=source("js/game.js"),render=source("js/render.js"),
  crowd=source("js/crowd-control.js"),tactics=source("js/encounter-tactics.js");
 assert.ok(html.includes("js/enemy-counter-roles.js?v=35"));
 assert.ok(html.indexOf("js/encounter-tactics.js")<html.indexOf("js/enemy-counter-roles.js"));
 assert.match(enemyCode,/initializeEnemyCounterRole\?\.\(e\)/);
 assert.match(enemyCode,/enemyCounterDamageMultiplier\?\.\(e,damageType,time\)/);
 assert.match(enemyCode,/enemyCounterOnDamaged\?\.\(e,damageType,time\)/);
 assert.match(crowd,/enemyCounterMovementFactor\?\.\(enemy,source,now\)/);
 assert.match(tactics,/initializeEnemyCounterRole\?\.\(e\)/);
 assert.match(tactics,/counterExposureUntil=now\+1\.6/);
 assert.match(render,/drawEnemyCounterRole\?\.\(e,ctx,time,graphicsQuality\)/);
 assert.doesNotMatch(source("js/enemy-counter-roles.js"),/enemies\.push|spawnEnemy\(|enemySpawn\(/);
 assert.match(game,/updateEncounterTactic\?\.\(e,dt,player,time,onScreen/);
});
