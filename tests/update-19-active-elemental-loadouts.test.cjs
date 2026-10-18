const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),
 fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const loadoutSource=read("js/elements.js");
function harness(){
 const window={},sources=[];
 const player={x:0,y:0,r:12,facingX:1,facingY:0};
 const targets=[
  {kind:0,x:85,y:0,hp:100,r:12},
  {kind:4,x:120,y:35,hp:100,r:13},
  {kind:0,x:1000,y:0,hp:100,r:12}
 ];
 const ctx=vm.createContext({window,Math,player,W:1280,H:720,
  upgrades:{},evolutions:{},boss:null,time:1,
  elementalTimers:{},weaponCooldownMultiplier:()=>1,globalDamageMultiplier:()=>1,
  nearestEnemy:(x,y,range,exc,include)=>targets.find(e=>Math.hypot(e.x-x,e.y-y)<range&&include(e))||null,
  nearbyEnemies:(x,y,r)=>targets.filter(e=>Math.hypot(e.x-x,e.y-y)<=r),
  enemyHitRadius:e=>e.r,
  damage:(e,d)=>sources.push({e,d}),playSfx:()=>{},glow:x=>x,
  storageGet:()=> "{}",storageSet:()=>{},document:{},});
 vm.runInContext(read("js/weapon-aim.js"),ctx);
 vm.runInContext(read("js/elemental-combat.js"),ctx);
 window.playerWeaponRange=r=>Math.min(r,450);
 window.playerWeaponTargetVisible=e=>e.x<500;
 return {ctx,window,player,targets,sources,run:s=>vm.runInContext(s,ctx)};
}
test("real loadouts are exactly the nine Fire, Water and Frost weapons",()=>{
 const world=vm.createContext({window:{},storageGet:()=> "{}",storageSet:()=>{}});
 vm.runInContext(loadoutSource,world);
 const keys=JSON.parse(vm.runInContext("JSON.stringify(Object.values(livingWorldElements).map(e=>e.weapons))",world));
 assert.deepEqual(keys,[
  ["flame","fireball","flameOrbit"],["waterBolt","tidalWave","whirlpool"],
  ["frost","iceShards","glacialPulse"]
 ]);
 assert.ok(keys.flat().every(key=>!["arcane","boomerang"].includes(key)));
});
test("elemental projectiles prefer the nearby dangerous ranged shade, not a random Drifter",()=>{
 const h=harness();
 const picked=h.run("elementalAim(1000,350)");
 assert.equal(picked.target,h.targets[1]);
 assert.ok(picked.angle>0);
 assert.equal(h.run("elementalAim(1000,0)").target,h.targets[0],
   "area-targeted moves still aim at the nearest opponent");
});
test("the current elemental starter selection does not expose old legacy weapons",()=>{
 const selection=read("js/controls.js");
 assert.match(selection,/livingWorldElements\[currentLivingWorldElement\(\)\]\.weapons/);
 assert.match(selection,/weaponCatalog\.filter\(\(weapon\) => allowedKeys\.includes\(weapon\.key\)\)/);
 assert.match(read("js/game.js"),/selectedWeapons = loadSelectedWeapons\(\)/);
});
test("Fireball, Water Bolt and Ice Shards all use motion-leading",()=>{
 const code=read("js/elemental-combat.js");
 assert.match(code,/const aim = elementalAim\(1100,350\)/);
 assert.match(code,/const aim = elementalAim\(1100,evolutions\.riptideLance\?760:640\)/);
 assert.match(code,/const aim = elementalAim\(950,480\)/);
 assert.match(code,/window\.weaponAimAngle\?\.\(player,enemy,projectileSpeed/);
});
test("elemental shot collision scans the whole travelled segment for slim targets",()=>{
 const code=read("js/elemental-combat.js");
 assert.match(code,/const oldX=shot\.x,oldY=shot\.y/);
 assert.match(code,/shot\.r\+40\+travel\/2/);
 assert.match(code,/window\.weaponSweptHit\?\.\(/);
});
test("water lance can strike a slim target during a fast step without extra damage",()=>{
 const h=harness();
 const runner={kind:1,x:40,y:0,hp:100,r:3};
 h.targets.splice(0,h.targets.length,runner);
 h.run('elementalShots.push({type:"waterBolt",x:0,y:0,vx:760,vy:0,r:3,damage:20,life:1,hit:new Set(),distance:0,pierce:1})');
 // The engine substeps at up to 16px per iteration; the swept test protects
 // a small target between sample endpoints rather than inflating hitbox size.
 h.run("updateElementalCombat(0.12)");
 assert.equal(h.sources.length,1);
 assert.equal(h.sources[0].e,runner);
 assert.equal(h.sources[0].d,20);
});
test("all nine active weapon families are represented in current combat code",()=>{
 const elemental=read("js/elemental-combat.js"),legacy=read("js/weapons.js");
 for(const k of ["fireball","flameOrbit","waterBolt","tidalWave","whirlpool","iceShards","glacialPulse"])
  assert.match(elemental,new RegExp("upgrades\\."+k));
 for(const k of ["flame","frost"])assert.match(legacy,new RegExp("upgrades\\."+k));
});
