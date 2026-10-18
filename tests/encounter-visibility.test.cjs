const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function geometry(W=1280,H=720){
  const full=src("js/enemies.js"),from=full.indexOf("function enemyOffscreenSpawn("),to=full.indexOf("// Special waves can request",from);
  assert.ok(from>0&&to>from);
  const ctx={W,H,player:{x:100,y:-40,r:12},window:{},Math,visibleEnemy:e=>Math.abs(e.x-100)<=W/2-50-e.r&&Math.abs(e.y+40)<=H/2-50-e.r};
  vm.runInNewContext(full.slice(from,to),ctx);
  return ctx;
}
const fullyOffscreen=(e,ctx)=>Math.abs(e.x-ctx.player.x)>=ctx.W/2+e.r||Math.abs(e.y-ctx.player.y)>=ctx.H/2+e.r;
test("individual spawn locations are always completely beyond the visible screen",()=>{
  for(const [W,H] of [[1920,1080],[1280,720],[820,520],[520,900]]){
    const c=geometry(W,H);
    for(let n=0;n<48;n++){
      const e={...c.window.enemyOffscreenSpawn(n*Math.PI/24,100),r:35};
      assert.equal(fullyOffscreen(e,c),true,JSON.stringify({W,H,n,e}));
    }
  }
});
test("large patrols and full seven-person defense formations never appear on screen",()=>{
  for(const [W,H] of [[1920,1080],[1280,720],[600,1000]]){
    const c=geometry(W,H);
    for(let n=0;n<16;n++){
      const angle=n*Math.PI/8;
      for(let i=0;i<7;i++){
        const e={...c.window.enemyOffscreenSpawn(angle,185,(i-3)*54),r:35};
        assert.equal(fullyOffscreen(e,c),true);
      }
    }
  }
});
test("weapon targeting has a smaller visible radius and excludes hidden enemies",()=>{
  const c=geometry(1280,720);
  assert.ok(c.window.playerWeaponRange(1300)<500);
  assert.equal(c.window.playerWeaponRange(200),200);
  const onscreen={x:420,y:0,r:13};
  const invisible={x:740,y:0,r:13};
  assert.equal(c.window.playerWeaponTargetVisible(onscreen),true);
  assert.equal(c.window.playerWeaponTargetVisible(invisible),false);
});
test("normal waves and swarm use the same offscreen spawn rule",()=>{
  const c=geometry(1280,720),full=src("js/enemies.js");
  const from=full.indexOf("const wavePatterns = ["),
    to=full.indexOf("// Shared spatial hash resolution for pickup storage and merging.",from);
  const enemies=[];
  Object.assign(c,{enemies,boss:null,growthTime:500,
    enemySpawn(kind,elite){const e={kind,elite,r:kind===2?35:13,hp:100,damage:10,speed:60,x:0,y:0};enemies.push(e);return e;}});
  c.window.initializeEnemyAdaptation=()=>{};
  c.window.isBossIsolationActive=()=>false;
  vm.runInNewContext(full.slice(from,to),c);
  for(const wave of [1,2,3,4,5,6,7,8]){
    enemies.length=0;
    c.spawnSpecialWave(wave);
    assert.ok(enemies.length>0);
    assert.ok(enemies.every(e=>fullyOffscreen(e,c)), "wave "+wave+" must start outside screen");
  }
});
test("patrol and defense modules use shared offscreen placements",()=>{
  for(const p of ["js/encounter-pacing.js","js/world-defense.js"]){
    assert.match(src(p),/window\.enemyOffscreenSpawn\?\.\(/);
  }
  assert.match(src("js/enemies.js"),/const spawnPoint = enemyOffscreenSpawn\(angle, 100\)/);
});
test("weapon scars no longer passively harm approaching enemies",()=>{
  const game=src("js/game.js");
  assert.doesNotMatch(game,/groundElement==="fire" && time >=/);
  assert.match(game,/Weapon-created terrain scars are visual/);
  assert.match(game,/e\.burnUntil > time/);
  assert.match(src("js/weapons.js"),/window\.triggerElementalSynergy\?\.\(/);
  assert.match(src("js/weapons.js"),/damage\(enemy, combo\.damage, player, "flame"\)/);
  assert.match(src("js/world-retaliation.js"),/\["damage","push"\]/);
  assert.match(src("js/world-visuals.js"),/window\.addWorldScar/);
});
test("all aimed weapon families prefer nearby enemies the player can see",()=>{
  assert.match(src("js/weapons.js"),/playerVisibleTarget/);
  assert.match(src("js/weapons.js"),/window\.playerWeaponTargetVisible/);
  assert.match(src("js/elemental-combat.js"),/window\.playerWeaponTargetVisible/);
  assert.match(src("js/game.js"),/window\.playerWeaponRange/);
});
