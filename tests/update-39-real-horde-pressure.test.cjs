const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function environment(){
  const window={};const ctx=vm.createContext({window,Math,Number});
  for(const p of ["js/encounter-rhythm.js","js/encounter-pacing.js"])
    vm.runInContext(src(p),ctx,{filename:p});
  window.resetEncounterRhythm();window.resetEncounterPacing();
  return window;
}
const enemy=()=>({hp:100,dead:false});

test("Update 39 Normal stops going completely quiet between cleared patrols",()=>{
  const w=environment(),pack=Array.from({length:4},enemy);
  assert.equal(w.recordEncounterRhythmSpawn("patrol",10,pack,400),true);
  assert.equal(w.encounterRhythmAmbientLimit(10,pack,12,"normal"),12);
  assert.equal(w.encounterRhythmCanStart("wave",10,pack),false);
  for(let i=0;i<3;i++)pack[i].dead=true;
  w.updateEncounterRhythm(25,pack,false,400,"normal");
  const status=w.getEncounterRhythmStatus(25);
  assert.equal(status.phase,"recover");
  assert.ok(status.remaining>=2.5&&status.remaining<=3.4);
  assert.equal(w.encounterRhythmAmbientLimit(26,pack,12,"normal"),12);
  w.updateEncounterRhythm(status.until,pack,false,400,"normal");
  assert.equal(w.encounterRhythmCanStart("wave",status.until,pack),true);
  const easy=environment(),easypack=Array.from({length:4},enemy);
  easy.recordEncounterRhythmSpawn("patrol",10,easypack,400);
  easypack.slice(0,3).forEach(e=>e.dead=true);
  easy.updateEncounterRhythm(25,easypack,false,400,"easy");
  assert.ok(easy.getEncounterRhythmStatus(25).remaining>=11);
  assert.equal(easy.encounterRhythmAmbientLimit(26,easypack,12,"easy"),2);
});

test("boss isolation still suppresses field spawns without delayed catch-up",()=>{
  const w=environment(),pack=Array.from({length:3},enemy);
  w.recordEncounterRhythmSpawn("patrol",10,pack,100);
  w.updateEncounterRhythm(20,pack,true,100,"normal");
  assert.equal(w.getEncounterRhythmStatus(20).phase,"boss");
  assert.equal(w.encounterRhythmAmbientLimit(20,pack,12,"normal"),0);
  assert.equal(w.encounterRhythmCanStart("wave",20,pack),false);
  w.updateEncounterRhythm(400,pack,false,100,"normal");
  assert.equal(w.getEncounterRhythmStatus(400).remaining,3);
  assert.equal(w.encounterRhythmCanStart("patrol",400,pack),false);
});

test("10–14 live ordinary threats are permitted, but never bypass the global 30 cap",()=>{
 const w=environment(),ambient=w.encounterAmbientLimit;
 assert.ok(ambient(0,"normal",[])>=10);
 assert.ok(ambient(1200,"normal",[])>=14);
 assert.ok(ambient(1200,"normal",[])<=w.encounterPopulationCap(1200,"normal"));
 assert.ok(w.encounterPopulationCap(2400,"normal")<=30);
 assert.ok(w.encounterAmbientInterval(0,"normal")<=2.6);
 assert.ok(w.encounterAmbientInterval(1500,"normal")<2);
 assert.ok(w.encounterAmbientInterval(1500,"easy")>7);
 assert.ok(w.encounterAmbientLimit(0,"easy",[])<ambient(0,"normal",[]));
});

test("production ambient mini-packs are capped, originate offscreen and retain boss isolation",()=>{
 const s=src("js/game.js");
 assert.match(s,/Math\.min\(ambientCap-enemies\.length,enemies\.length<5\?4:enemies\.length<9\?2:1\)/);
 assert.match(s,/if \(!boss && !window\.isBossIsolationActive\?\.\(\)\)/);
 assert.match(s,/const ambient=enemySpawn\(\)/);
 assert.match(s,/ambient\.hp\*=1\.55\+\.35\*depth/);
 assert.match(s,/waveTimer = difficulty==="easy"\?70:46/);
 assert.match(s,/Math\.max\(38,48-waveNumber\*2\)/);
 assert.match(src("js/enemies.js"),/function enemyOffscreenSpawn\(/);
 assert.match(src("js/encounter-pacing.js"),/const MAX_LIVE = 30/);
});

function guardian(variant){
  const file=variant<2?"js/guardian-secondary-attacks.js":"js/guardian-late-secondary.js";
  const window={};vm.runInNewContext(src(file),{window,Math,Number});
  const e={kind:3,variant,isFinalBoss:variant===3,dead:false,phaseTwo:false,phaseThree:false,
    finalPhase:1,shotAngle:0,shotWarning:1.05,warningX:320,warningY:0,
    x:0,y:0,r:50,beauFight:{nextAt:0},shadeFight:{nextAt:0},
    bellFight:{nextAt:0},memeFight:{nextAt:0},specialNextAt:0};
  const prepare=variant<2?window.prepareGuardianSecondary:window.prepareGuardianLateSecondary;
  const marks=variant<2?window.guardianSecondaryDangerPoints:window.guardianLateSecondaryDanger;
  const fire=variant<2?window.fireGuardianSecondary:window.fireGuardianLateSecondary;
  const patterns=[];
  for(let i=0;i<2;i++){
    e.shotWarning=1.05;
    assert.equal(prepare(e,i*10),true);
    const areas=marks(e).map(m=>[m.x,m.y,m.r]);
    const projectiles=[],hazards=[];
    e.shotWarning=0;
    assert.equal(fire(e,{projectile:(...x)=>projectiles.push(x),
      hazard:(...x)=>hazards.push(x)},i*10+1.05),true);
    assert.ok(projectiles.length>=3 && projectiles.length<=5);
    assert.equal(areas.length,hazards.length);
    for(let k=0;k<areas.length;k++){
      assert.deepEqual(hazards[k].slice(0,3),areas[k],
        "warning must equal actual collider for every attack");
      assert.ok(hazards[k][3]>=.5);
      assert.ok(hazards[k][4]>=20);
    }
    const retreat=[[-430,0],[430,0],[0,-430],[0,430]].some(([x,y])=>
      areas.every(([xx,yy,r])=>Math.hypot(xx-320-x,yy-y)>r+18));
    assert.equal(retreat,true,"severe fights need an actual readable counter");
    patterns.push(areas.map(a=>a.join(":")).join("|"));
  }
  return patterns;
}
test("all four Guardian openers demand visibly different movements, not more copies of a centre circle",()=>{
  const openers=Array.from({length:4},(_,v)=>guardian(v));
  assert.equal(new Set(openers.map(p=>p[0])).size,4,"4 bosses need distinct opening silhouettes");
  for(const p of openers)assert.notEqual(p[0],p[1],"each boss alternates different geometries");
  assert.ok(openers[0][0].includes("206:0"),"Beau attack runs along the approach");
  assert.ok(openers[1][0].includes("320:-153"),"Shade opening blocks the flank");
  assert.ok(openers[2][0].includes("181:0"),"Bell opening forms a cross");
  assert.ok(openers[3][0].includes("185:-135"),"Meme opening is a diagonal fracture");
});

test("Vitality is NOT nerfed to hide the missing encounter pressure",()=>{
 const window={};
 vm.runInNewContext(src("js/combat-difficulty.js"),{window,Math,Number});
 assert.ok(window.vitalityRegenPerSecond(1,4)>=.25);
 assert.match(src("js/enemies.js"),/e\.elite \? 22 : e\.kind === 1 \? 14 : 16/);
 const html=src("index.html");
 for(const filename of ["encounter-rhythm.js","encounter-pacing.js","guardian-secondary-attacks.js",
 "guardian-late-secondary.js","game.js","enemies.js"]){
  assert.ok(html.includes(filename+"?v="),"browser cache version must change for "+filename);
 }
});
