const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
test("Water Bolt applies just one movement impulse, retaining elemental damage",()=>{
  const enemy=read("js/enemies.js"),element=read("js/elemental-combat.js");
  assert.match(enemy,/knockbackLength > 0 && !\(damageType==="water" && origin\?\.type==="waterBolt"\)/);
  assert.match(element,/damage\(enemy, combo\.damage,/);
  assert.match(element,/weaponKey==="waterBolt"\?"waterBolt":"water"/);
  assert.match(element,/dx\/length\*\(force\+\(combo\.bonusKnockback\|\|0\)\)/);
});
test("Water Bolt cannot machine-gun past the 0.98s cap at Rapid Casting V",()=>{
  const s=read("js/elemental-combat.js");
  const fn=s.match(/function elementalCooldown\(key, seconds\) \{[\s\S]*?\n\}/);
  assert.ok(fn);
  const timers={},context=vm.createContext({Math,elementalTimers:timers,weaponCooldownMultiplier:()=>.2});
  vm.runInContext(fn[0],context);
  vm.runInContext('elementalCooldown("waterBolt",1.1)',context);
  assert.equal(timers.waterBolt,.98);
  vm.runInContext('elementalCooldown("fireball",1.1)',context);
  assert.ok(Math.abs(timers.fireball-.22)<1e-8);
  assert.match(s,/shot\.pierce = evolutions\.riptideLance \? 3 : 2/);
  assert.match(s,/\(12 \+ upgrades\.waterBolt \* 5\)/);
});
test("Vitality L2 heals less than observed 0.595 HP/s, while remaining useful",()=>{
  const w={};vm.runInNewContext(read("js/combat-difficulty.js"),{window:w,Math,Number});
  const v=w.vitalityRegenPerSecond;
  assert.equal(v(0,500),0);
  assert.equal(v(2,2.9),0);
  assert.ok(v(2,4)>.38 && v(2,4)<.43);
  assert.ok(v(1,4)>0);
  assert.ok(v(5,4)<.7);
});
test("Beau and Shade normal attack patterns have readable aimed lanes with active safe gaps",()=>{
  const w={};vm.runInNewContext(read("js/guardian-secondary-attacks.js"),{window:w,Math,Number});
  for(const variant of [0,1]){
    const e={kind:3,variant,dead:false,isFinalBoss:false,
      x:0,y:0,r:50,shotAngle:0,warningX:350,warningY:0,
      shotWarning:1.05,beauFight:{nextAt:0},shadeFight:{nextAt:0},specialNextAt:0};
    for(let i=0;i<2;i++){
      w.prepareGuardianSecondary(e,i*10);
      const marks=w.guardianSecondaryDangerPoints(e);
      const shots=[],hazards=[];
      e.shotWarning=0;
      assert.equal(w.fireGuardianSecondary(e,{
        projectile:(...args)=>shots.push(args),
        hazard:(...args)=>hazards.push(args)
      }),true);
      assert.equal(shots.length,3);
      assert.equal(hazards.length,marks.length);
      assert.ok(shots.some(shot=>shot[2]>380));
      for(let j=0;j<marks.length;j++){
        assert.equal(hazards[j][0],marks[j].x);
        assert.equal(hazards[j][1],marks[j].y);
        assert.ok(hazards[j][3]>=.76);
      }
      e.shotWarning=1.05;
    }
  }
});
test("Bell and final Meme retain two alternating warned attacks, not five overlapping rays",()=>{
  const w={};vm.runInNewContext(read("js/guardian-late-secondary.js"),{window:w,Math,Number});
  for(const variant of [2,3]){
    const e={kind:3,variant,isFinalBoss:variant===3,dead:false,
      x:0,y:0,r:60,shotAngle:0,warningX:350,warningY:0,shotWarning:1.1,
      finalPhase:1,phaseTwo:false,phaseThree:false,specialNextAt:0};
    const counts=[];
    for(let i=0;i<2;i++){
      w.prepareGuardianLateSecondary(e,i*10);
      const planned=w.guardianLateSecondaryShots(e);
      const danger=w.guardianLateSecondaryDanger(e);
      const shots=[],hazards=[];
      e.shotWarning=0;
      assert.equal(w.fireGuardianLateSecondary(e,{
        projectile:(...a)=>shots.push(a),hazard:(...a)=>hazards.push(a)
      },i*10+1.1),true);
      counts.push(shots.length);
      assert.equal(hazards.length,danger.length);
      for(let k=0;k<danger.length;k++){
        assert.equal(hazards[k][0],danger[k].x);
        assert.equal(hazards[k][1],danger[k].y);
      }
      e.shotWarning=1.1;
    }
    assert.deepEqual(counts,variant===2?[3,5]:[3,3]);
  }
});
