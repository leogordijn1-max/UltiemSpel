// Update 37.2: regression checks from the real 26:42 Water playtest.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const load=(p)=>{const window={};vm.runInNewContext(source(p),{window,Math,Number});return window;};
test("Water Bolt cannot suppress enemies with the old cooldown, damage, pierce and wet slow",()=>{
 const s=source("js/elemental-combat.js");
 const fn=s.match(/function elementalCooldown\(key, seconds\) \{[\s\S]*?\n\}/)?.[0];
 assert.ok(fn,"the runtime cooldown function must exist");
 const context=vm.createContext({Math,elementalTimers:{},weaponCooldownMultiplier:()=>.2});
 vm.runInContext(fn,context);
 vm.runInContext('elementalCooldown("waterBolt",1.05);elementalCooldown("fireball",1.05)',context);
 assert.equal(context.elementalTimers.waterBolt,1.12);
 assert.ok(Math.abs(context.elementalTimers.fireball-.21)<1e-10);
 assert.match(s,/\(10 \+ upgrades\.waterBolt \* 4\)/);
 assert.match(s,/shot\.pierce = evolutions\.riptideLance \? 2 : 1/);
 assert.match(s,/weaponKey === "waterBolt" \? \.65 : 1\.8/);
 assert.match(s,/weaponKey === "waterBolt" \? 75 : 170/);
});
test("Normal enemies gain pursuit while Easy stays unchanged and Guardians are isolated",()=>{
 const w=load("js/combat-difficulty.js"),f=w.enemyPursuitMultiplier;
 assert.equal(f(2000,"easy",400),1);
 assert.equal(f(0,"normal",400),1);
 assert.ok(f(1500,"normal",400)>=1.35);
 assert.ok(f(1500,"normal",150)<f(1500,"normal",400));
 assert.ok(f(1500,"nightmare",400)>f(1500,"normal",400));
 const s=source("js/game.js");
 assert.match(s,/if \(e !== boss && e\.kind !== 4 && !e\.summoned\)/);
 assert.match(s,/moveSpeed \*= window\.enemyPursuitMultiplier/);
 assert.match(s,/e\.shotTrackUntil = time \+ \.57/);
});
test("Normal enemies grow more threatening in damage without spawning more monsters",()=>{
 const w=load("js/combat-difficulty.js");
 assert.equal(w.enemyThreatMultiplier(239,"normal"),1);
 assert.ok(w.enemyThreatMultiplier(299,"normal")>1);
 assert.equal(w.enemyThreatMultiplier(1500,"normal"),1.65);
 assert.equal(w.enemyThreatMultiplier(1500,"easy"),1);
 const n=w.getCombatDifficultyTuning("normal"),h=w.getCombatDifficultyTuning("nightmare");
 assert.ok(n.rangedCooldownMin<h.rangedCooldownMax);
 assert.ok(h.rangedCooldownMin<n.rangedCooldownMin);
 assert.ok(h.squadDamage>n.squadDamage && h.squadSpeed>n.squadSpeed);
 assert.doesNotMatch(source("js/combat-difficulty.js"),/spawnEnemy|enemies\.push|createWave/);
});
test("Vitality is preserved and modestly stronger; actual healing requires pickup",()=>{
 const w=load("js/combat-difficulty.js");
 assert.equal(w.vitalityRegenPerSecond(3,2.9),0);
 assert.ok(w.vitalityRegenPerSecond(1,3)>.23);
 assert.ok(w.vitalityRegenPerSecond(3,4)>.5);
 assert.ok(w.vitalityRegenPerSecond(5,4)<1);
 const enemy=source("js/enemies.js"),game=source("js/game.js");
 assert.match(enemy,/player\.hp < player\.maxHp \* \.83/);
 assert.match(enemy,/kind: "health"/);
 assert.match(enemy,/e\.elite \? 22 : e\.kind === 1 \? 14 : 16/);
 assert.match(game,/if \(g\.kind === "health"\)/);
 assert.match(game,/player\.hp = Math\.min\(player\.maxHp, player\.hp \+ g\.value\)/);
});
test("all Guardians threaten aimed centre without covering both wide dodge routes",()=>{
 for(const [file,variants] of [
  ["js/guardian-secondary-attacks.js",[0,1]],
  ["js/guardian-late-secondary.js",[2,3]]
 ]){
  const w=load(file);
  for(const variant of variants){
   const boss={kind:3,variant,isFinalBoss:variant===3,dead:false,
    x:0,y:0,r:55,shotAngle:0,warningX:350,warningY:0,
    shotWarning:1.05,phaseTwo:false,phaseThree:false,finalPhase:1};
   for(let i=0;i<2;i++){
    boss.shotWarning=1.05;
    const prepare=variant<2?w.prepareGuardianSecondary:w.prepareGuardianLateSecondary;
    const getMarks=variant<2?w.guardianSecondaryDangerPoints:w.guardianLateSecondaryDanger;
    const fire=variant<2?w.fireGuardianSecondary:w.fireGuardianLateSecondary;
    assert.equal(prepare(boss,i*10),true);
    const marks=getMarks(boss);
    assert.ok(marks.some(mark=>Math.hypot(mark.x-350,mark.y)<=5),file+" "+variant+" centre");
    assert.ok(marks.every(mark=>mark.r>=60&&mark.r<=85));
    assert.ok([-1,1].some(sign=>marks.every(mark=>
      Math.hypot(mark.x-350,mark.y-sign*420)>mark.r+18)),"must leave walk/dash exit");
    const shots=[],hazards=[];
    boss.shotWarning=0;
    assert.equal(fire(boss,{projectile:(...x)=>shots.push(x),hazard:(...x)=>hazards.push(x)},i*10+1.05),true);
    assert.equal(hazards.length,marks.length);
    assert.ok(shots.length>=3&&shots.length<=5);
    assert.ok(shots.some(x=>x[2]>390),"actual aimed projectile must be fast");
    for(let j=0;j<marks.length;j++){
     assert.deepEqual(hazards[j].slice(0,3),[marks[j].x,marks[j].y,marks[j].r]);
     assert.ok(hazards[j][3]>=.76,"marked hazard must give reaction time");
    }
   }
  }
 }
});
test("boss signatures and ultimate modules remain intact",()=>{
 for(const s of ["js/beau-encounter.js","js/shade-encounter.js","js/bell-encounter.js","js/meme-encounter.js"])
  assert.ok(source(s).includes("ultimate"),s);
 assert.match(source("js/game.js"),/window\.prepareGuardianSecondary\?\.\(e,time\)/);
 assert.match(source("js/game.js"),/window\.prepareGuardianLateSecondary\?\.\(e,time\)/);
});
test("schema 2 QA can tell enemy and boss damage sources apart",()=>{
 const s=source("js/game.js");
 assert.match(s,/function recordPlayerHit\(amount, source = "unknown"\)/);
 assert.match(s,/window\.runQaEvent\?\.\("hit",\{amount,health:player\?\.hp,source\},time\)/);
 for(const key of ["enemy_contact","enemy_projectile","guardian_contact","guardian_projectile","guardian_hazard"])
  assert.ok(s.includes('"'+key+'"'));
});
