const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function roles(){
 const window={};
 vm.runInNewContext(source("js/elemental-weapon-roles.js"),{window,Math,Number});
 return window;
}
const weapons={
 fire:["flame","fireball","flameOrbit"],
 water:["waterBolt","tidalWave","whirlpool"],
 frost:["frost","iceShards","glacialPulse"]
};
const kinds={regular:0,runner:1,heavy:2,shield:6};
test("Update 38 covers every selected elemental weapon in each of four actual enemy roles",()=>{
 const w=roles(),all=Object.values(weapons).flat();
 assert.deepEqual(Object.keys(w.elementalWeaponProfiles).sort(),[...all].sort());
 assert.equal(new Set(all).size,9);
 for(const [element,keys] of Object.entries(weapons))
   assert.deepEqual(Array.from(w.elementalWeaponLoadouts[element]),keys);
 for(const key of all){
  const factors=[];
  for(const [role,kind] of Object.entries(kinds)){
   const value=w.elementalRoleDamageMultiplier({kind},key);
   assert.ok(Number.isFinite(value)&&value>=.8&&value<=1.15,key+" vs "+role);
   factors.push(value);
  }
  assert.ok(new Set(factors).size>=3,key+" requires real meaningful matchups");
 }
});
function sim(){
 const window=roles();
 const ctx=vm.createContext({window,Math,Number,
   upgrades:{critChance:0,critDamage:0,knockback:0},
   player:{x:0,y:0},enemies:[],boss:null,time:100,
   texts:[],puff:()=>{},playSfx:()=>{}});
 const code=source("js/enemies.js").match(/^function damage\([^\n]+\) \{[\s\S]*?^}\s*$/m)?.[0];
 assert.ok(code,"production damage() must be extractable");
 vm.runInContext(code,ctx);
 return ctx;
}
test("actual production damage() honors each weapon's four roles, not only a display table",()=>{
 const ctx=sim();
 for(const key of Object.values(weapons).flat()){
  for(const [role,kind] of Object.entries(kinds)){
   const expected=ctx.window.elementalWeaponProfiles[key][role];
   const e={kind,x:100,y:0,r:14,hp:10000,shieldActive:false};
   ctx.e=e;
   const kindDamage={flame:"flame",fireball:"fire",flameOrbit:"fire",
     waterBolt:"water",tidalWave:"water",whirlpool:"water",
     frost:"direct",iceShards:"frost",glacialPulse:"frost"}[key];
   ctx.weapon=key;ctx.damageType=kindDamage;
   vm.runInContext('damage(e,100,{x:0,y:0,type:weapon},damageType)',ctx);
   assert.ok(Math.abs((10000-e.hp)-100*expected)<1e-7,key+" "+role);
  }
 }
});
test("old boss, summons, and status damage are exempt from the per-weapon specialty",()=>{
 const ctx=sim();
 for(const enemy of [{kind:3},{kind:1,summoned:true},{kind:2,dead:true}]){
  const m=ctx.window.elementalRoleDamageMultiplier(enemy,"fireball");
  assert.equal(m,1);
 }
 const e={kind:2,hp:10000,x:100,y:0,r:15};
 ctx.e=e;vm.runInContext('damage(e,100,{x:0,y:0,type:"fireball"},"burn")',ctx);
 assert.ok(Math.abs(e.hp-9900)<1e-7,"burn damage must stay identical");
 assert.equal(ctx.window.elementalRoleDamageMultiplier({kind:6},"notAWeapon"),1);
});
test("existing facing shield and specialty stacking remain functional",()=>{
 const ctx=sim();const enemy={kind:6,x:100,y:0,hp:10000,r:24,shieldActive:true};
 ctx.e=enemy;ctx.window.bulwarkShieldMultiplier=()=>.55;
 vm.runInContext('damage(e,100,{x:0,y:0,type:"fireball"},"fire")',ctx);
 assert.ok(Math.abs(10000-enemy.hp-100*1.05*.55)<1e-7);
});
test("Water Bolt caps repeated shots and leaves smaller wet marks while Tidal/Whirlpool keep distinct physics",()=>{
 const s=source("js/elemental-combat.js"),en=source("js/enemies.js");
 assert.match(s,/Math\.max\(1\.12,effective\)/);
 assert.match(s,/shot\.pierce = evolutions\.riptideLance \? 2 : 1/);
 assert.match(s,/markWetGround\(shot\.x, shot\.y, evolutions\.riptideLance \? 80 : 54\)/);
 assert.match(s,/shot\.nextWaterMark = \(shot\.nextWaterMark \|\| 195\) \+ 290/);
 assert.match(s,/weaponKey === "waterBolt" \? 75 : 170/);
 assert.match(s,/launchTidalWave\(aim\.angle/);
 assert.match(s,/area\.type !== "whirlpool"/);
 assert.match(en,/weaponRoleDamage/);
});
test("Frost Orb has real 2.65s rate floor at Rate V, separate ordinary Ice control",()=>{
 const s=source("js/weapons.js"),w=roles(),enemy={kind:1};
 assert.match(s,/2\.65 \/ Math\.max\(\.2,rate\)/);
 assert.match(s,/pierce: 1/);
 assert.match(s,/frostRadius: 82 \+ level \* 10/);
 assert.match(s,/playerVisibleTarget\(player\.x, player\.y, 850\)/);
 const base=w.frostOrbChillDuration(5,false,enemy,100);
 enemy.frostOrbResistUntil=105;
 assert.ok(w.frostOrbChillDuration(5,false,enemy,101)<base*.6);
 assert.ok(base<=2.8 && base>=2.5);
 enemy.frostOrbChillUntil=107;
 assert.equal(w.frostSlowFactor(enemy,null,102),.70);
 enemy.frostOtherUntil=105;
 assert.equal(w.frostSlowFactor(enemy,null,102),.48);
 assert.equal(w.frostSlowFactor({kind:3}, {kind:3},102),.78);
 assert.match(source("js/game.js"),/frostSlowFactor\?\.\(e,boss,time\)/);
 assert.match(source("js/elemental-combat.js"),/enemy\.frostOtherUntil=/);
});
test("evolutions, passive Vitality and real late-game threat remain unchanged",()=>{
 const upgrade=source("js/upgrades.js"),difficulty=source("js/combat-difficulty.js");
 assert.match(upgrade,/nextEvolutionTime\(\)/);
 assert.match(upgrade,/eligibleEvolutions\(\)/);
 assert.match(upgrade,/riptideLance/);
 assert.match(upgrade,/glacier/);
 assert.match(difficulty,/function vitalityRegenPerSecond/);
 assert.match(difficulty,/window\.enemyPursuitMultiplier=enemyPursuitMultiplier/);
 const html=source("index.html");
 const i=html.indexOf('js/elemental-weapon-roles.js?v=38');
 assert.ok(i>0&&i<html.indexOf('js/enemies.js?v='));
});
