// 4.4 Beau showcase — node --test tests/beau-encounter.test.cjs
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const code=fs.readFileSync(path.join(__dirname,"../js/beau-encounter.js"),"utf8");
const game=fs.readFileSync(path.join(__dirname,"../js/game.js"),"utf8");
const render=fs.readFileSync(path.join(__dirname,"../js/render.js"),"utf8");
const enemies=fs.readFileSync(path.join(__dirname,"../js/enemies.js"),"utf8");
const index=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
const developer=fs.readFileSync(path.join(__dirname,"../js/developer-mode.js"),"utf8");

function setup(phase=2) {
  const window={bossCombatPredictTarget:(e,p)=>({x:p.x+(p.combatVX||0)*.25,y:p.y})};
  vm.runInNewContext(code,{window,Math});
  const e={
    x:0,y:0,r:48,kind:3,variant:0,isFinalBoss:false,
    phaseTwo:phase>=2,phaseThree:phase>=3,phaseIntro:0,
    chargeWarning:0,chargeActive:0,shotWarning:0,
    chargeCooldown:0,shootCooldown:0,
  };
  window.initializeBeauEncounter(e,0);
  const player={x:300,y:0,r:15,combatVX:0};
  const events={hazards:[],shots:[],warnings:[],puffs:[]};
  const hooks={
    visible:true,
    hazard:(...a)=>events.hazards.push(a),
    projectile:(...a)=>events.shots.push(a),
    notify:(...a)=>events.warnings.push(a),
    puff:(...a)=>events.puffs.push(a),
  };
  return {window,e,player,events,hooks};
}
function run(h,start,end,step=.025){
  for(let t=start;t<end-1e-8;t+=step)
    h.window.updateBeauEncounter(h.e,t,step,h.player,h.hooks);
}
test("Beau keeps normal attacks in phase I and only Beau gets showcase mechanics",()=>{
  const h=setup(1);
  run(h,0,30);
  assert.equal(h.events.hazards.length,0);
  assert.equal(h.e.beauFight.mode,"idle");
  assert.equal(h.window.updateBeauEncounter({...h.e,variant:1},30,.025,h.player,h.hooks),false);
});
test("Hunting Grounds chains three warned rushes and leaves delayed trail hazards",()=>{
  const h=setup(2);
  run(h,0,22);
  assert.ok(h.events.warnings.some(x=>x[0].includes("HUNTING GROUNDS")));
  assert.ok(h.events.hazards.length>=5);
  assert.ok(h.events.shots.length>=9);
  assert.ok(h.e.x>120);
  assert.ok(h.e.specialRecoveryUntil>0);
});
test("Pincer Ambush attacks from two flank locations plus Beau, in two volleys",()=>{
  const h=setup(2);
  h.window.forceBeauEncounter(h.e,"pincer",0);
  run(h,0,8);
  assert.equal(h.events.shots.length,18);
  assert.equal(h.events.hazards.length,6);
  assert.equal(h.e.beauFight.mode,"idle");
  assert.ok(h.events.shots.some(a=>a[0].x!==h.e.x && a[0].x!==0));
});
test("The Final Hunt has a cinematic intro, three waves and one finisher",()=>{
  const h=setup(3);
  run(h,0,18);
  assert.equal(h.e.beauFight.ultimateUsed,true);
  assert.equal(h.e.beauFight.mode,"idle");
  assert.ok(h.events.warnings.some(x=>x[0].includes("FINAL HUNT")));
  assert.equal(h.events.hazards.length,18);
  assert.equal(h.events.shots.length,19);
  assert.ok(h.e.specialRecoveryUntil>0);
  const prev=h.events.warnings.filter(x=>x[0].includes("FINAL HUNT")).length;
  run(h,18,34);
  assert.equal(h.events.warnings.filter(x=>x[0].includes("FINAL HUNT")).length,prev);
});
test("No showcase attack can interrupt telegraphed charge, shot or phase intro",()=>{
  const h=setup(2);
  h.e.shotWarning=.4;
  assert.equal(h.window.updateBeauEncounter(h.e,18,.025,h.player,h.hooks),false);
  h.e.shotWarning=0;h.e.chargeActive=.3;
  assert.equal(h.window.updateBeauEncounter(h.e,18,.025,h.player,h.hooks),false);
  h.e.chargeActive=0;h.e.phaseIntro=.4;
  assert.equal(h.window.updateBeauEncounter(h.e,18,.025,h.player,h.hooks),false);
  h.e.phaseIntro=0;
  assert.equal(h.window.updateBeauEncounter(h.e,18,.025,h.player,h.hooks),true);
});
test("Warning target locks before impact so the player can react",()=>{
  const h=setup(2);
  h.window.forceBeauEncounter(h.e,"pincer",0);
  h.window.updateBeauEncounter(h.e,0,.025,h.player,h.hooks);
  h.player.x=450;h.player.combatVX=80;
  h.window.updateBeauEncounter(h.e,.2,.025,h.player,h.hooks);
  const targetX=h.e.beauFight.target.x;
  h.player.x=900;
  h.window.updateBeauEncounter(h.e,.6,.025,h.player,h.hooks);
  assert.equal(h.e.beauFight.target.x,targetX);
});
test("Ultimate backdrop works in low and high quality without assets",()=>{
  const h=setup(3);
  h.window.updateBeauEncounter(h.e,0,.025,h.player,h.hooks);
  const calls={fills:0,strokes:0,words:0};
  const ctx=new Proxy({
    createRadialGradient(){return {addColorStop(){}};},
    fillRect(){calls.fills++},fillText(){calls.words++},stroke(){calls.strokes++},
    save(){},restore(){},beginPath(){},arc(){},moveTo(){},lineTo(){},fill(){},setLineDash(){},
  },{set(o,k,v){o[k]=v;return true}});
  h.window.drawBeauBackdrop(h.e,ctx,1,h.player,"low",1200,800);
  h.window.drawBeauBackdrop(h.e,ctx,1,h.player,"high",1200,800);
  h.window.drawBeauTelegraph(h.e,ctx,1,"high");
  assert.equal(calls.fills,2);
  assert.ok(calls.strokes>0);
  assert.equal(calls.words,1);
});
test("HP phase transition cancels an active special instead of instant firing",()=>{
  const h=setup(2);
  h.window.forceBeauEncounter(h.e,"pincer",0);
  h.window.updateBeauEncounter(h.e,0,.025,h.player,h.hooks);
  assert.equal(h.e.beauFight.mode,"pincer");
  assert.equal(h.window.interruptBeauEncounter(h.e,.5),true);
  assert.equal(h.e.beauFight.mode,"idle");
  const before=h.events.shots.length;
  h.e.phaseIntro=1;
  h.window.updateBeauEncounter(h.e,1.6,.025,h.player,h.hooks);
  assert.equal(h.events.shots.length,before);
});
test("The Final Hunt clears old boss projectiles at cinematic start",()=>{
  const h=setup(3);
  let cleans=0;
  h.hooks.clearBossAttacks=()=>cleans++;
  h.window.updateBeauEncounter(h.e,0,.025,h.player,h.hooks);
  assert.equal(cleans,1);
  h.window.updateBeauEncounter(h.e,.5,.025,h.player,h.hooks);
  assert.equal(cleans,1);
});
test("Beau showcase is integrated without breaking arena isolation or F8",()=>{
  assert.match(game,/window\.updateBeauEncounter\?\.\(e, time, dt, player, encounterHooks\)/);
  assert.match(game,/if \(beauActive \|\| shadeActive \|\| bellActive\) \{/);
  assert.match(enemies,/window\.initializeBeauEncounter\?\.\(boss, time\)/);
  assert.match(render,/drawBeauBackdrop/);
  assert.match(render,/drawBeauTelegraph/);
  assert.match(developer,/BEAU · THE FINAL HUNT/);
  assert.match(game,/!boss && !window\.isBossIsolationActive\?\.\(\)/);
  assert.ok(index.includes("js/beau-encounter.js?v=5"));
});
