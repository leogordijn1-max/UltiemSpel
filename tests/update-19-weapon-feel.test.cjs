const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),
 fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function aim(){
 const window={};vm.runInNewContext(read("js/weapon-aim.js"),{window,Math},
   {filename:"js/weapon-aim.js"});
 return window;
}
test("Arcane prioritizes close and dangerous targets over arbitrary collection order",()=>{
 const w=aim(),player={x:0,y:0};
 const far={x:300,y:0,kind:0,hp:10};
 const near={x:85,y:0,kind:0,hp:10};
 const boss={x:310,y:0,kind:3,hp:800};
 const ranged={x:105,y:0,kind:4,hp:100};
 const got=w.weaponAimTargets(player,[far,near,boss,ranged],3,400,()=>true);
 assert.equal(got.length,3);
 assert.equal(got[0],boss);
 assert.equal(got[1],ranged);
 assert.equal(got[2],near);
});
test("targets respect range, visibility, defeated state and exact missile count",()=>{
 const w=aim(),p={x:0,y:0};
 const visible={x:110,y:0,hp:10,kind:0};
 const hidden={x:50,y:0,hp:10,kind:0,hidden:true};
 const dead={x:40,y:0,hp:0,kind:0};
 const distant={x:500,y:0,hp:10,kind:0};
 const candidates=[distant,dead,hidden,visible];
 assert.deepEqual([...w.weaponAimTargets(p,candidates,5,300,e=>!e.hidden)],[visible]);
 assert.equal(w.weaponAimTargets(p,candidates,1,1000,()=>true).length,1);
});
test("shot distribution is deterministic and never produces missing targets",()=>{
 const w=aim(),a={x:1},b={x:2};
 assert.deepEqual([...w.weaponDistributeShots([a,b],5)],[a,b,a,b,a]);
 assert.equal(w.weaponDistributeShots([],7).length,0);
 assert.equal(w.weaponDistributeShots([a],3).length,3);
});
test("lead direction follows measured lateral movement, not enemy approach guess",()=>{
 const w=aim(),player={x:0,y:0},enemy={
   kind:1,x:200,y:0,speed:100,combatVX:0,combatVY:140
 };
 const a=w.weaponAimAngle(player,enemy,560,{maxLead:.33});
 assert.ok(a>0.06&&a<.28,"must anticipate measured upward movement");
 enemy.combatVY=-140;
 assert.ok(w.weaponAimAngle(player,enemy,560,{maxLead:.33})<-.06);
});
test("intercept prediction is capped for charging enemies and offscreen shots",()=>{
 const w=aim(),p={x:0,y:0},enemy={kind:1,x:300,y:0,combatVX:0,combatVY:9999};
 const a=w.weaponAimAngle(p,enemy,560,{maxLead:.33});
 assert.ok(a<.31&&a>0);
 assert.ok(Math.abs(w.weaponAimAngle(p,{...enemy,kind:3},560))<1e-9);
});
test("slow boomerangs lead more than fast Arcane shots, but stay capped",()=>{
 const w=aim(),p={x:0,y:0},e={kind:1,x:215,y:0,combatVX:0,combatVY:130};
 const bolt=w.weaponAimAngle(p,e,560,{maxLead:.33});
 const slow=w.weaponAimAngle(p,e,310,{maxLead:.42});
 assert.ok(slow>bolt);
 assert.ok(slow<.5);
});
test("stationary/ranged enemies and zero-length aim remain safe",()=>{
 const w=aim(),p={x:0,y:0};
 assert.equal(w.weaponAimAngle(p,{kind:4,x:100,y:0,speed:60},560),0);
 assert.equal(w.weaponAimAngle(p,{kind:0,x:0,y:0,speed:100},560),0);
 assert.ok(Number.isFinite(w.weaponAimAngle(p,{kind:1,x:0,y:0,combatVX:NaN},560)));
});
test("swept hit catches small enemies skipped by a high-speed frame",()=>{
 const w=aim(),enemy={x:30,y:0};
 assert.equal(w.weaponSweptHit(0,0,80,0,enemy,5),true);
 assert.equal(w.weaponSweptHit(0,10,80,10,enemy,5),false);
 assert.equal(w.weaponSweptHit(0,0,0,0,{x:0,y:0},5),true);
 assert.equal(w.weaponSweptHit(0,0,80,0,{x:95,y:0},5),false);
});
test("two fast projectiles do not require extra shots or bigger damage",()=>{
 const code=read("js/enemies.js"),loop=read("js/game.js");
 assert.match(code,/weaponAimTargets\?\.\(player, near, count, range/);
 assert.match(code,/weaponDistributeShots\?\.\(targets,count\)/);
 assert.match(code,/weaponAimAngle\?\.\(player,target,560/);
 assert.match(code,/Math\.min\(Math\.max\(1, upgrades\.arcane\)/);
 assert.match(code,/bullets\.length>=300/);
 assert.match(loop,/previousBulletX=b\.x,previousBulletY=b\.y/);
 assert.match(loop,/weaponSweptHit\?\.\(/);
});
test("elemental projectile families share predictive aim; homing Frost remains homing",()=>{
 const a=read("js/elemental-combat.js"),w=read("js/weapons.js");
 assert.match(a,/elementalAim\(1100,350\)/);
 assert.match(a,/elementalAim\(900,evolutions\.riptideLance\?760:640\)/);
 assert.match(a,/elementalAim\(950,480\)/);
 assert.match(a,/weaponAimAngle\?\.\(player,enemy,projectileSpeed/);
 assert.match(w,/weaponAimAngle\?\.\(/);
 assert.match(w,/type: "frost"/);
 assert.match(w,/turnRate: 4\.0/);
 assert.match(w,/target,/);
});
test("the game uses measured movement while bosses and summoned units retain normal rules",()=>{
 const game=read("js/game.js"),catalog=read("js/enemies.js");
 assert.match(game,/e\.combatVX=\(e\.x-enemyPositionBeforeX\)\/dt/);
 assert.match(game,/e!==boss && !e\.summoned/);
 assert.match(read("js/weapon-aim.js"),/if\(!target\|\|target\.kind===3\|\|target\.isFinalBoss\)/);
 assert.match(read("index.html"),/weapon-aim\.js\?v=19/);
 assert.match(catalog,/window\.playerWeaponTargetVisible\(e\)/);
});
