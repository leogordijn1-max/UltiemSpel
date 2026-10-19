const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function setup(variant=0,phase=1){
 const qa=[],window={runQaEvent:(type,data,now)=>qa.push({type,data,now})};
 vm.runInNewContext(source("js/guardian-secondary-attacks.js"),{window,Math,Number});
 const boss={kind:3,variant,x:0,y:0,r:50,dead:false,isFinalBoss:false,
   bossName:variant===0?"BEAU DE HOND":"THE MOURNING SHADE",
   phaseTwo:phase>=2,phaseThree:phase>=3,shotAngle:0,shotWarning:1.05,
   warningX:320,warningY:0,specialNextAt:0,
   beauFight:{nextAt:0},shadeFight:{nextAt:0}};
 const shots=[],hazards=[],puffs=[];
 const hooks={projectile:(...v)=>shots.push(v),hazard:(...v)=>hazards.push(v),
   puff:(...v)=>puffs.push(v)};
 return {window,boss,qa,shots,hazards,puffs,hooks};
}
function prepareAndFire(h,t){
 h.boss.shotWarning=1.05;
 assert.equal(h.window.prepareGuardianSecondary(h.boss,t),true);
 h.boss.shotWarning=0;
 assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),true);
}
test("only Beau and Mourning Shade get the new normal volleys",()=>{
 for(const v of [0,1])assert.equal(setup(v).window.prepareGuardianSecondary(setup(v).boss,1),true);
 for(const [variant,extra] of [[2,{}],[3,{}],[0,{isFinalBoss:true}],[1,{dead:true}],[0,{kind:1}]]){
  const h=setup(variant);
  Object.assign(h.boss,extra);
  assert.equal(h.window.prepareGuardianSecondary(h.boss,10),false);
  assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),false);
 }
});
test("both guardians alternate two named patterns, never RNG-spam",()=>{
 for(const v of [0,1]){
  const h=setup(v),names=[];
  for(let i=0;i<4;i++){
   prepareAndFire(h,i*12);
   names.push(h.qa.at(-1).data.mode);
  }
  assert.notEqual(names[0],names[1]);
  assert.deepEqual(names,[names[0],names[1],names[0],names[1]]);
  assert.equal(h.qa.length,4);
  assert.ok(h.qa.every(x=>x.type==="boss_secondary_attack"));
 }
});
test("a real warning must finish before projectile or hazard can spawn",()=>{
 const h=setup(0);
 h.window.prepareGuardianSecondary(h.boss,7);
 assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),false);
 assert.equal(h.shots.length,0);assert.equal(h.hazards.length,0);
 h.boss.shotWarning=0;
 assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),true);
 assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),false);
 assert.ok(h.shots.length>0);
});
test("Beau Fang Sweep paints exactly its delayed flank trap and fires 5 fish",()=>{
 const h=setup(0,1);
 h.window.prepareGuardianSecondary(h.boss,1);
 const marked=h.window.guardianSecondaryDangerPoints(h.boss);
 assert.equal(marked.length,1);
 assert.equal(marked[0].r,62);
 assert.ok(Math.abs(marked[0].y)>150);
 h.boss.shotWarning=0;
 h.window.fireGuardianSecondary(h.boss,h.hooks);
 assert.equal(h.shots.length,3);
 assert.ok(h.shots.every(s=>s[4]==="fish"));
 assert.equal(h.hazards.length,1);
 assert.deepEqual(h.hazards[0].slice(0,3),[marked[0].x,marked[0].y,marked[0].r]);
 assert.ok(h.hazards[0][3]>=.7,"real hazard must allow a second visible dodge");
});
test("Beau crossfire telegraphs two side casters, then gives a real recovery gap",()=>{
 const h=setup(0,2);
 prepareAndFire(h,1); // fang sweep
 h.shots.length=0;h.hazards.length=0;
 h.boss.shotWarning=1.05;
 h.window.prepareGuardianSecondary(h.boss,10);
 assert.equal(h.boss.secondaryVolley.mode,"houndCrossfire");
 const g=h.window.guardianSecondaryGeometry(h.boss);
 const mark=h.window.guardianSecondaryDangerPoints(h.boss);
 assert.equal(mark.length,1);assert.equal(mark[0].x,320);
 h.boss.shotWarning=0;
 h.window.fireGuardianSecondary(h.boss,h.hooks);
 assert.equal(h.shots.length,3);
 assert.equal(h.hazards.length,1);
 assert.ok(h.shots.some(s=>s[0].x!==0));
 assert.ok(h.shots.some(s=>s[0].y!==0));
 assert.ok(h.boss.beauFight.nextAt>11);
 assert.ok(h.boss.specialNextAt>11);
 assert.equal(g.mode,"houndCrossfire");
});
test("Shade Mourning Lances use contrasting projectile speeds and a warned side trap",()=>{
 const h=setup(1);
 h.window.prepareGuardianSecondary(h.boss,12);
 const marked=h.window.guardianSecondaryDangerPoints(h.boss);
 h.boss.shotWarning=0;h.window.fireGuardianSecondary(h.boss,h.hooks);
 assert.equal(h.shots.length,3);
 assert.equal(h.hazards.length,1);
 assert.deepEqual(h.hazards[0].slice(0,3),[marked[0].x,marked[0].y,marked[0].r]);
 assert.ok(h.shots.some(s=>s[2]>=390),"the aimed lance should be genuinely dangerous");
 assert.ok(h.shots.some(s=>s[2]<300),"flanks are intentionally staggered");
 assert.ok(h.shots.every(s=>s[4]==="shadow"));
});
test("Shade Phantom Mirrors send real projectiles from visible flanking positions",()=>{
 const h=setup(1,2);
 prepareAndFire(h,0);
 h.shots.length=0;h.hazards.length=0;
 h.boss.shotWarning=1.05;
 h.window.prepareGuardianSecondary(h.boss,9);
 const marks=h.window.guardianSecondaryDangerPoints(h.boss);
 assert.equal(marks.length,2);
 assert.ok(marks[0].y<0&&marks[1].y>0);
 h.boss.shotWarning=0;h.window.fireGuardianSecondary(h.boss,h.hooks);
 assert.equal(h.shots.length,3);
 assert.equal(h.hazards.length,2);
 assert.ok(h.shots.filter(s=>s[0].y!==0).length===2);
 for(let i=0;i<2;i++)
  assert.deepEqual(h.hazards[i].slice(0,3),[marks[i].x,marks[i].y,marks[i].r]);
});
test("all variants preserve a broad walk/dash escape outside their hazard circles",()=>{
 for(const v of [0,1]){
  const h=setup(v);
  for(let j=0;j<2;j++){
   h.boss.shotWarning=1.05;
   h.window.prepareGuardianSecondary(h.boss,10+j*12);
   const marks=h.window.guardianSecondaryDangerPoints(h.boss);
   assert.ok(marks.length<=2);
   const escapes=[-1,1].map(s=>({x:h.boss.warningX,y:h.boss.warningY+s*390}));
   assert.ok(escapes.some(p=>marks.every(m=>
     Math.hypot(p.x-m.x,p.y-m.y)>m.r+15)),
     "all dangerzones must leave a real escape outside the player's radius");
   h.boss.shotWarning=0;h.window.fireGuardianSecondary(h.boss,h.hooks);
  }
 }
});
test("late movement changes only the tracked warning coordinates; locked geometry remains consistent",()=>{
 const h=setup(0);
 h.window.prepareGuardianSecondary(h.boss,4);
 h.boss.warningX=410;h.boss.warningY=80;h.boss.shotAngle=.2;
 const marks=h.window.guardianSecondaryDangerPoints(h.boss).map(x=>({...x}));
 h.boss.shotWarning=0;
 h.window.fireGuardianSecondary(h.boss,h.hooks);
 assert.equal(h.hazards.length,marks.length);
 for(let i=0;i<marks.length;i++)
  assert.deepEqual(h.hazards[i].slice(0,3),[marks[i].x,marks[i].y,marks[i].r]);
});
test("phase-change cancellation and boss death cannot leave active planned attacks",()=>{
 for(const v of [0,1]){
  const h=setup(v);
  h.window.prepareGuardianSecondary(h.boss,0);
  assert.equal(h.window.cancelGuardianSecondary(h.boss),true);
  assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),false);
  assert.equal(h.window.cancelGuardianSecondary(h.boss),false);
  h.window.prepareGuardianSecondary(h.boss,11);
  h.boss.dead=true;h.boss.shotWarning=0;
  assert.equal(h.window.fireGuardianSecondary(h.boss,h.hooks),false);
 }
});
test("warning is actually drawn on Low and High and never draws outside live windup",()=>{
 const h=setup(1),calls={stroke:0,words:0};
 const ctx=new Proxy({
  save(){},restore(){},beginPath(){},arc(){},moveTo(){},lineTo(){},setLineDash(){},
  stroke(){calls.stroke++},fillText(){calls.words++}
 },{set(o,k,v){o[k]=v;return true;}});
 h.window.prepareGuardianSecondary(h.boss,10);
 h.window.drawGuardianSecondary(h.boss,ctx,10.2,"low");
 assert.ok(calls.stroke>=6);
 assert.equal(calls.words,0);
 h.window.drawGuardianSecondary(h.boss,ctx,10.3,"high");
 assert.equal(calls.words,1);
 h.boss.shotWarning=0;
 const before=calls.stroke;
 h.window.drawGuardianSecondary(h.boss,ctx,11.1,"high");
 assert.equal(calls.stroke,before);
});
test("signature modules and cinematic phase III powers remain unmodified",()=>{
 const beau=source("js/beau-encounter.js"),shade=source("js/shade-encounter.js");
 assert.match(beau,/mode==="ultimate"/);
 assert.match(beau,/PINCER AMBUSH/);
 assert.match(beau,/HUNTING GROUNDS/);
 assert.match(shade,/PHANTOM EXECUTION/);
 assert.match(shade,/SHADOW COLLAPSE/);
 assert.match(shade,/ETERNAL ECLIPSE/);
 assert.match(source("js/guardian-arena-powers.js"),/beginGuardianArenaPower|const NAMES/);
});
test("production code prepares, fires, renders and cancels real secondary attacks",()=>{
 const html=source("index.html"),game=source("js/game.js"),
  enemies=source("js/enemies.js"),render=source("js/render.js");
 assert.ok(html.indexOf("guardian-secondary-attacks.js?v=33")>=0);
 assert.ok(html.indexOf("boss-combat.js")<html.indexOf("guardian-secondary-attacks.js"));
 assert.ok(html.indexOf("guardian-secondary-attacks.js")<html.indexOf("beau-encounter.js"));
 assert.match(game,/window\.prepareGuardianSecondary\?\.\(e,time\)/);
 assert.ok((game.match(/window\.cancelGuardianSecondary\?\.\(e\)/g)||[]).length>=2);
 assert.match(enemies,/window\.fireGuardianSecondary\?\.\(e,\{/);
 assert.match(enemies,/bossHazards\.length<14/);
 assert.match(render,/window\.drawGuardianSecondary\?\.\(e,ctx,time,graphicsQuality\)/);
});
