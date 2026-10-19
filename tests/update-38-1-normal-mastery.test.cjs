const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const get=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function windowTools(){
  const window={};
  vm.runInNewContext(get("js/combat-difficulty.js"),{window,Math,Number});
  return window;
}
function almost(a,b){assert.ok(Math.abs(a-b)<1e-9,a+" != "+b);}

test("Normal ramps after four minutes, challenging the middle of a run, without unfair early hits",()=>{
  const w=windowTools(),m=w.enemyThreatMultiplier;
  for(const t of [0,60,180,239,240])almost(m(t,"normal"),1);
  almost(m(600,"normal"),1+(360/1080)*.65);
  almost(m(900,"normal"),1+(660/1080)*.65);
  almost(m(1200,"normal"),1+(960/1080)*.65);
  almost(m(1320,"normal"),1.65);
  almost(m(1800,"normal"),1.65);
  for(const t of [0,240,600,900,1200,1500]){
    almost(m(t,"easy"),1);
    assert.ok(m(t,"normal")>=1&&m(t,"normal")<=1.65);
  }
});

test("Guardian cooldown decreases with phase but never removes warnings or overwhelms the player",()=>{
  const f=windowTools().guardianNormalAttackCooldown;
  const base=[2.55,2.05,1.85];
  for(let phase=1;phase<=3;phase++){
    almost(f(base[phase-1],"easy",phase),base[phase-1]);
    const normal=f(base[phase-1],"normal",phase);
    const nightmare=f(base[phase-1],"nightmare",phase);
    assert.ok(normal<base[phase-1]&&nightmare<=normal);
    assert.ok(normal>=1.35&&nightmare>=1.35);
    if(phase===2)almost(normal,2.05*.89);
    if(phase===3)almost(normal,1.85*.83);
  }
  almost(f(1.5,"normal",3),1.35);
  almost(f(2,"normal",0),1.94);
  almost(f(2,"normal",99),1.66);
  assert.equal(f(NaN,"normal",2),NaN); // invalid input left unchanged
});

test("actual boss scheduler uses existing phase and game difficulty, not a hidden new boss system",()=>{
  const src=get("js/enemies.js");
  const match=src.match(/^function scheduleBossNormalVolley\(e,seconds\) \{[\s\S]*?^\}/m);
  assert.ok(match,"must schedule through the existing shootCooldown");
  const window=windowTools();
  const ctx=vm.createContext({window,difficulty:"normal"});
  vm.runInContext(match[0],ctx);
  const schedule=vm.runInContext("scheduleBossNormalVolley",ctx);
  for(const [enemy,raw,expected] of [
    [{kind:3,phaseTwo:false,phaseThree:false},2.55,2.55*.97],
    [{kind:3,phaseTwo:true},2.05,2.05*.89],
    [{kind:3,phaseThree:true},1.85,1.85*.83],
    [{kind:3,isFinalBoss:true,finalPhase:3},1.5,1.35]
  ]){
    schedule(enemy,raw);
    almost(enemy.shootCooldown,expected);
  }
  ctx.difficulty="easy";
  const easy={kind:3,phaseThree:true};
  schedule(easy,1.85);almost(easy.shootCooldown,1.85);
  // No added volleys, hazards or reward manipulation, only existing timers.
  assert.match(src,/scheduleBossNormalVolley\(e,e\.phaseThree\?1\.85/);
  assert.match(src,/scheduleBossNormalVolley\(e,e\.isFinalBoss\?/);
  assert.match(src,/scheduleBossNormalVolley\(e,Math\.max\(1\.65, 3\.0 - 0\.35 \* phase\)\)/);
});

test("existing boss telegraphs, special recoveries and readable danger geometry stay intact",()=>{
  const game=get("js/game.js"),enemies=get("js/enemies.js");
  assert.match(game,/e\.shotTrackUntil = time \+ \.57/);
  assert.match(game,/window\.prepareGuardianSecondary\?\.\(e,time\)/);
  assert.match(game,/window\.prepareGuardianLateSecondary\?\.\(e,time\)/);
  assert.match(enemies,/window\.fireGuardianSecondary\?\./);
  assert.match(enemies,/window\.fireGuardianLateSecondary\?\./);
  for(const p of ["js/guardian-secondary-attacks.js","js/guardian-late-secondary.js"]){
    const s=get(p);
    assert.match(s,/hooks\.hazard\?\.\(/);
    assert.match(s,/shotWarning>0/);
  }
  assert.match(get("js/boss-combat.js"),/specialRecoveryUntil/);
  assert.match(get("js/guardian-arena-powers.js"),/INITIAL_TELL = 1\.45/);
});

test("Easy stays a learning mode, health pickups and Vitality are never nerfed, and no victory lock exists",()=>{
  const d=get("js/combat-difficulty.js"),enemies=get("js/enemies.js"),game=get("js/game.js");
  const w=windowTools();
  assert.ok(w.vitalityRegenPerSecond(3,4)>.5);
  assert.match(enemies,/e\.elite \? 22 : e\.kind === 1 \? 14 : 16/);
  assert.match(enemies,/player\.hp < player\.maxHp \* \.83/);
  assert.match(game,/player\.hp = Math\.min\(player\.maxHp, player\.hp \+ g\.value\)/);
  assert.doesNotMatch(d,/spawnEnemy|enemies\.push|createWave/);
  const html=get("index.html");
  assert.match(html,/Easy teaches the mechanics/);
  assert.match(html,/Normal is a challenging run/);
  assert.match(html,/Your first victories should feel earned/);
});
