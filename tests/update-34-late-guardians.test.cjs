const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function setup(variant=2,phase=1){
  const qa=[];
  const window={runQaEvent:(type,data,time)=>qa.push({type,data,time})};
  vm.runInNewContext(source("js/guardian-late-secondary.js"),{window,Math,Number});
  const boss={kind:3,variant,isFinalBoss:variant===3,dead:false,
    x:0,y:0,r:variant===3?70:54,shotAngle:0,shotWarning:variant===3?1.2:1.05,
    warningX:320,warningY:0,finalPhase:variant===3?phase:1,
    phaseTwo:variant===2&&phase>=2,phaseThree:variant===2&&phase>=3,
    bossName:variant===3?"THE LAST MEME":"THE BELL TOWER",
    bellFight:{nextAt:0},memeFight:{nextAt:0},specialNextAt:0
  };
  const shots=[],hazards=[],puffs=[];
  const hooks={
    projectile:(...args)=>shots.push(args),
    hazard:(...args)=>hazards.push(args),
    puff:(...args)=>puffs.push(args)
  };
  return {window,boss,qa,shots,hazards,puffs,hooks};
}
function fire(h,now=5){
 h.boss.shotWarning=1.1;
 assert.equal(h.window.prepareGuardianLateSecondary(h.boss,now),true);
 h.boss.shotWarning=0;
 assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,now+1.1),true);
}
test("only actual Bell and Final Meme accept prepared attacks",()=>{
 for(const variant of [2,3]){
  const h=setup(variant);
  assert.equal(h.window.prepareGuardianLateSecondary(h.boss,0),true);
 }
 for(const [variant,props] of [[0,{}],[1,{}],[2,{dead:true}],[3,{kind:0}],
   [2,{isFinalBoss:true}],[3,{isFinalBoss:false}]]){
  const h=setup(variant);
  Object.assign(h.boss,props);
  assert.equal(h.window.prepareGuardianLateSecondary(h.boss,0),false);
  assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,0),false);
 }
});
test("Bell and Meme alternate two memorable normal attacks with real QA events",()=>{
 for(const variant of [2,3]){
  const h=setup(variant),seen=[];
  for(let i=0;i<4;i++){fire(h,20+i*15);seen.push(h.qa.at(-1).data.mode);}
  assert.deepEqual(seen,[seen[0],seen[1],seen[0],seen[1]]);
  assert.notEqual(seen[0],seen[1]);
  assert.equal(h.qa.length,4);
  assert.ok(h.qa.every(x=>x.type==="boss_secondary_attack"));
  assert.ok(h.qa.every(x=>x.data.boss===h.boss.bossName));
 }
});
test("pre-warning or duplicate firing cannot create invisible damage",()=>{
 const h=setup(3);
 assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks),false);
 h.window.prepareGuardianLateSecondary(h.boss,60);
 assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks),false);
 assert.equal(h.shots.length,0);assert.equal(h.hazards.length,0);
 h.boss.shotWarning=0;
 assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,61.2),true);
 assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks),false);
});
test("Bell Clapper's Verdict fires three variable-speed bell strikes and warns both flanks",()=>{
 const h=setup(2,1);
 h.window.prepareGuardianLateSecondary(h.boss,1);
 const marks=h.window.guardianLateSecondaryDanger(h.boss).map(x=>({...x}));
 const shots=h.window.guardianLateSecondaryShots(h.boss);
 assert.equal(marks.length,2);assert.ok(marks[0].y<0&&marks[1].y>0);
 assert.equal(shots.length,3);assert.ok(shots[1].speed>shots[0].speed);
 h.boss.shotWarning=0;h.window.fireGuardianLateSecondary(h.boss,h.hooks);
 assert.equal(h.shots.length,3);assert.equal(h.hazards.length,2);
 assert.ok(h.shots.every(s=>s[4]==="bell"));
 for(let i=0;i<marks.length;i++)
  assert.deepEqual(h.hazards[i].slice(0,3),[marks[i].x,marks[i].y,marks[i].r]);
 assert.ok(h.hazards.every(x=>x[3]>=.8));
});
test("Bell Split Hour spawns two visible off-centre chimes and centre strike",()=>{
 const h=setup(2,2);
 fire(h,1);
 h.shots.length=0;h.hazards.length=0;
 h.boss.shotWarning=1.05;
 h.window.prepareGuardianLateSecondary(h.boss,18);
 assert.equal(h.boss.lateSecondary.mode,"splitHour");
 const marks=h.window.guardianLateSecondaryDanger(h.boss);
 assert.equal(marks.length,1);assert.equal(marks[0].x,320);
 const planned=h.window.guardianLateSecondaryShots(h.boss);
 assert.equal(planned.length,5);
 assert.equal(planned.filter(s=>s.origin!==h.boss).length,2);
 assert.ok(planned.every(s=>Math.hypot(s.origin.x-320,s.origin.y)>130));
 h.boss.shotWarning=0;h.window.fireGuardianLateSecondary(h.boss,h.hooks,19.05);
 assert.equal(h.shots.length,5);assert.equal(h.hazards.length,1);
 assert.ok(h.puffs.length>=2);
 assert.ok(h.boss.bellFight.nextAt>19);
});
test("Meme Pixel Rip marks two diagonal side strikes and paints its fast central shot",()=>{
 const h=setup(3,1);
 h.window.prepareGuardianLateSecondary(h.boss,1500);
 assert.equal(h.boss.lateSecondary.mode,"pixelRip");
 const marks=h.window.guardianLateSecondaryDanger(h.boss);
 assert.equal(marks.length,2);
 assert.ok(marks[0].x<320&&marks[1].x>320);
 assert.ok(marks[0].y<0&&marks[1].y>0);
 const shots=h.window.guardianLateSecondaryShots(h.boss);
 assert.equal(shots.length,5);
 assert.ok(shots[2].speed>shots[0].speed);
 h.boss.shotWarning=0;h.window.fireGuardianLateSecondary(h.boss,h.hooks,1501.2);
 assert.equal(h.shots.length,5);assert.equal(h.hazards.length,2);
 assert.ok(h.shots.every(s=>s[4]==="rift"));
});
test("Meme Glitch Double uses two announced mirrors and leaves side dodge lanes",()=>{
 const h=setup(3,2);
 fire(h,0);h.shots.length=0;h.hazards.length=0;
 h.boss.shotWarning=1.05;
 h.window.prepareGuardianLateSecondary(h.boss,10);
 assert.equal(h.boss.lateSecondary.mode,"glitchDouble");
 const shots=h.window.guardianLateSecondaryShots(h.boss);
 assert.equal(shots.length,5);
 assert.equal(shots.filter(s=>s.origin!==h.boss).length,4);
 const marks=h.window.guardianLateSecondaryDanger(h.boss);
 assert.equal(marks.length,2);
 assert.equal(marks[0].y,0);assert.equal(marks[1].y,0);
 h.boss.shotWarning=0;
 h.window.fireGuardianLateSecondary(h.boss,h.hooks,11);
 assert.equal(h.shots.length,5);assert.equal(h.hazards.length,2);
 assert.ok(h.puffs.length>=3);
 assert.ok(h.boss.memeFight.nextAt>11);
});
test("all normal attacks preserve dodgeable gaps and modest projectile counts",()=>{
 for(const variant of [2,3]){
  const h=setup(variant);
  for(let i=0;i<2;i++){
   h.boss.shotWarning=1.05;
   h.window.prepareGuardianLateSecondary(h.boss,i*20);
   const areas=h.window.guardianLateSecondaryDanger(h.boss);
   const count=h.window.guardianLateSecondaryShots(h.boss).length;
   assert.ok(count<=5);
   assert.ok(areas.length<=2);
   const candidates=[-1,1].map(sign=>({x:320,y:sign*360}));
   assert.ok(candidates.some(p=>areas.every(z=>
     Math.hypot(p.x-z.x,p.y-z.y)>z.r+18)),
     "not every lateral escape can be covered by the area hazards");
   h.boss.shotWarning=0;
   assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,i*20+1.05),true);
  }
 }
});
test("once the player's target is locked, the same geometry drives both warning and impact",()=>{
 const h=setup(3,2);
 h.window.prepareGuardianLateSecondary(h.boss,100);
 h.boss.shotAngle=.31;h.boss.warningX=460;h.boss.warningY=65;
 const marks=h.window.guardianLateSecondaryDanger(h.boss).map(p=>({...p}));
 const shots=h.window.guardianLateSecondaryShots(h.boss).map(s=>({
  x:s.origin.x,y:s.origin.y,a:s.angle,speed:s.speed
 }));
 h.boss.shotWarning=0;
 h.window.fireGuardianLateSecondary(h.boss,h.hooks,101.2);
 for(let i=0;i<marks.length;i++)
  assert.deepEqual(h.hazards[i].slice(0,3),[marks[i].x,marks[i].y,marks[i].r]);
 for(let i=0;i<shots.length;i++)
  assert.deepEqual(h.shots[i].slice(0,3),
    [{x:shots[i].x,y:shots[i].y},shots[i].a,shots[i].speed]);
});
test("phase transitions and death stop the old pattern before a new phase begins",()=>{
 for(const variant of [2,3]){
  const h=setup(variant,2);
  h.window.prepareGuardianLateSecondary(h.boss,5);
  assert.equal(h.window.cancelGuardianLateSecondary(h.boss),true);
  assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,6),false);
  assert.equal(h.window.cancelGuardianLateSecondary(h.boss),false);
  h.window.prepareGuardianLateSecondary(h.boss,7);
  if(variant===3)h.boss.finalPhase=3;else h.boss.phaseThree=true;
  h.boss.shotWarning=0;
  assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,8),false);
  h.boss.dead=true;
  assert.equal(h.window.fireGuardianLateSecondary(h.boss,h.hooks,8),false);
 }
});
test("on Low/High exact circles and outgoing shots are drawn; old cone must be hidden",()=>{
 const h=setup(3,2),draws={strokes:0,circles:0,lines:0,words:0};
 const ctx=new Proxy({
  save(){},restore(){},beginPath(){},setLineDash(){},
  arc(){draws.circles++},stroke(){draws.strokes++},
  lineTo(){draws.lines++},moveTo(){},fillText(){draws.words++}
 },{set(o,k,v){o[k]=v;return true;}});
 h.window.prepareGuardianLateSecondary(h.boss,20);
 h.window.drawGuardianLateSecondary(h.boss,ctx,20.2,"low");
 assert.ok(draws.circles>=3);
 assert.ok(draws.lines>=3);
 assert.equal(draws.words,0);
 h.window.drawGuardianLateSecondary(h.boss,ctx,20.4,"high");
 assert.equal(draws.words,1);
 h.boss.shotWarning=0;
 const before=draws.strokes;
 h.window.drawGuardianLateSecondary(h.boss,ctx,21.3,"high");
 assert.equal(before,draws.strokes);
 assert.match(source("js/render.js"),/!e\.secondaryVolley && !e\.lateSecondary/);
});
test("one delayed strike blocks premature giant showcase but never removes ultimate",()=>{
 for(const variant of [2,3]){
  const h=setup(variant,3);h.boss.shotWarning=1;
  h.window.prepareGuardianLateSecondary(h.boss,30);
  h.boss.shotWarning=0;
  h.window.fireGuardianLateSecondary(h.boss,h.hooks,31);
  assert.ok(h.boss.specialNextAt>=32.55);
  const fight=variant===2?h.boss.bellFight:h.boss.memeFight;
  assert.ok(fight.nextAt>=32.55);
 }
 for(const file of ["js/bell-encounter.js","js/meme-encounter.js"]){
  const s=source(file);
  assert.match(s,/beginGuardianArenaPower\?\.\(e,t,p\)/);
  assert.match(s,/ultimateUsed=true/);
  assert.match(s,/clearBossAttacks\?\.\(\)/);
 }
});
test("production uses exact same real projectile/hazard APIs without touching boss ordering",()=>{
 const game=source("js/game.js"),enemies=source("js/enemies.js"),
  render=source("js/render.js"),html=source("index.html");
 assert.ok(html.indexOf("js/boss-combat.js")<html.indexOf("js/guardian-late-secondary.js?v=34"));
 assert.ok(html.indexOf("js/guardian-late-secondary.js?v=34")<html.indexOf("js/bell-encounter.js"));
 assert.match(game,/window\.prepareGuardianLateSecondary\?\.\(e,time\)/);
 assert.ok((game.match(/window\.cancelGuardianLateSecondary\?\.\(e\)/g)||[]).length>=3);
 assert.match(enemies,/window\.fireGuardianLateSecondary\?\.\(e,\{/);
 assert.match(enemies,/bossHazards\.length<14/);
 assert.match(enemies,/addBossProjectile\(source,a,s,d,type\)/);
 assert.match(render,/window\.drawGuardianLateSecondary\?\.\(e,ctx,time,graphicsQuality\)/);
 assert.match(source("js/boss-flow.js"),/THE LAST MEME/);
 assert.match(source("js/game.js"),/finalBossDefeated/);
});
