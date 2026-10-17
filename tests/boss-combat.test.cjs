// Shadow Survivor 4.4B — node --test tests/boss-combat.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname,"../js/boss-combat.js"),"utf8");
const game = fs.readFileSync(path.join(__dirname,"../js/game.js"),"utf8");
const enemies = fs.readFileSync(path.join(__dirname,"../js/enemies.js"),"utf8");
const render = fs.readFileSync(path.join(__dirname,"../js/render.js"),"utf8");
const dev = fs.readFileSync(path.join(__dirname,"../js/developer-mode.js"),"utf8");
const html = fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");

function harness(variant=0,final=false) {
  const window={};
  vm.runInNewContext(source,{window,Math});
  const calls={hazards:[],projectiles:[],notifications:[],puffs:[]};
  const hooks={
    visible:true,
    hazard:(...args)=>calls.hazards.push(args),
    projectile:(...args)=>calls.projectiles.push(args),
    notify:(...args)=>calls.notifications.push(args),
    puff:(...args)=>calls.puffs.push(args),
  };
  const boss={
    kind:3,x:0,y:0,r:50,hp:1000,maxHp:1000,variant,
    isFinalBoss:final,phaseTwo:false,phaseThree:false,
    finalPhase:1,phaseIntro:0,chargeWarning:0,chargeActive:0,
    shotWarning:0,shootCooldown:0,chargeCooldown:0,
  };
  window.initializeBossCombat(boss,0);
  return {window,boss,calls,hooks,player:{x:300,y:0,r:15}};
}

test("normal and final bosses gain bounded HP without changing other enemies",()=>{
  const h=harness();
  assert.equal(h.window.bossCombatMaxHealth(1000,{index:1}),2050);
  assert.ok(h.window.bossCombatMaxHealth(1000,{index:7})<=2500);
  assert.equal(h.window.bossCombatMaxHealth(1000,{final:true}),1780);
  assert.equal(h.window.bossCombatDamageMultiplier({kind:0},15),1);
});

test("signature starts with warning, not immediate damage",()=>{
  const h=harness();
  assert.equal(h.window.updateBossCombat(h.boss,7.6,h.player,h.hooks),true);
  assert.equal(h.calls.hazards.length,0);
  assert.equal(h.calls.notifications.length,1);
  assert.ok(h.boss.specialWarningUntil>7.6);
  assert.equal(h.window.isBossCombatBusy(h.boss,7.65),true);
});

test("Beau locks three targeted ambush areas and has a timed counterattack",()=>{
  const h=harness(0);
  h.window.updateBossCombat(h.boss,7.5,h.player,h.hooks);
  h.player.x=900;h.player.y=900;
  h.window.updateBossCombat(h.boss,8.8,h.player,h.hooks);
  assert.equal(h.calls.hazards.length,3);
  assert.equal(h.calls.hazards[1][0],300);
  assert.equal(h.calls.hazards[1][1],0);
  assert.equal(h.window.bossCombatDamageMultiplier(h.boss,8.9),1.42);
  assert.equal(h.window.bossCombatDamageMultiplier(h.boss,12),1);
  h.window.updateBossCombat(h.boss,8.9,h.player,h.hooks);
  assert.equal(h.calls.hazards.length,3);
});

test("Mourning Shade leaves a safe gap in its projectile ring",()=>{
  const h=harness(1);
  h.window.updateBossCombat(h.boss,7.6,h.player,h.hooks);
  h.window.updateBossCombat(h.boss,9,h.player,h.hooks);
  assert.equal(h.calls.hazards.length,0);
  assert.ok(h.calls.projectiles.length>=9);
  for(const shot of h.calls.projectiles)
    assert.ok(Math.abs(shot[1])>0.4);
});

test("Bell Tower displays a split fan and one locked impact marker",()=>{
  const h=harness(2);
  h.window.updateBossCombat(h.boss,7.6,h.player,h.hooks);
  h.window.updateBossCombat(h.boss,9,h.player,h.hooks);
  assert.equal(h.calls.projectiles.length,6);
  assert.equal(h.calls.hazards.length,1);
  assert.equal(h.calls.hazards[0][0],300);
});

test("final boss reality break leaves a dodgeable central square",()=>{
  const h=harness(3,true);
  h.window.updateBossCombat(h.boss,7.6,h.player,h.hooks);
  h.window.updateBossCombat(h.boss,9.3,h.player,h.hooks);
  assert.equal(h.calls.hazards.length,4);
  assert.ok(h.calls.hazards.every(p=>p[0]!==300 && p[1]!==0));
});

test("special windup waits for regular charge or shots to finish",()=>{
  const h=harness();
  h.boss.shotWarning=1;
  assert.equal(h.window.updateBossCombat(h.boss,8,h.player,h.hooks),false);
  h.boss.shotWarning=0;h.boss.chargeActive=.2;
  assert.equal(h.window.updateBossCombat(h.boss,8,h.player,h.hooks),false);
  h.boss.chargeActive=0;
  assert.equal(h.window.updateBossCombat(h.boss,8,h.player,h.hooks),true);
});

test("phase changes shorten the gap to next special and retain the same boss",()=>{
  const h=harness();
  h.boss.specialNextAt=999;
  h.boss.phaseTwo=true;
  h.window.updateBossCombat(h.boss,5,h.player,h.hooks);
  assert.equal(h.boss.combatPhase,2);
  assert.equal(h.boss.specialNextAt,8.2);
  h.boss.phaseThree=true;
  h.window.updateBossCombat(h.boss,5.2,h.player,h.hooks);
  assert.equal(h.boss.combatPhase,3);
});

test("low-quality warning and recovery both produce a clear visual cue",()=>{
  const h=harness(),calls={strokes:0};
  const ctx=new Proxy({
    stroke(){calls.strokes++},save(){},restore(){},beginPath(){},arc(){},moveTo(){},lineTo(){},setLineDash(){},
  },{set(o,k,v){o[k]=v;return true}});
  h.window.updateBossCombat(h.boss,7.6,h.player,h.hooks);
  h.window.drawBossCombat(h.boss,ctx,7.8,"low");
  h.window.updateBossCombat(h.boss,9,h.player,h.hooks);
  h.window.drawBossCombat(h.boss,ctx,9.1,"low");
  assert.ok(calls.strokes>=4);
});

test("gameplay wiring covers phases, signature warnings and developer shortcuts",()=>{
  assert.match(game,/e\.phaseThree = true/);
  assert.match(game,/window\.updateBossCombat\?\.\(e, time, player/);
  assert.match(game,/!window\.isBossCombatBusy\?\.\(e, time\)/);
  assert.match(enemies,/window\.initializeBossCombat\?\.\(boss, time\)/);
  assert.match(enemies,/bossCombatDamageMultiplier/);
  assert.match(render,/window\.drawBossCombat\?\.\(e, ctx, time, graphicsQuality\)/);
  assert.match(dev,/TRIGGER SIGNATURE ATTACK/);
  assert.match(dev,/FORCE BOSS PHASE III/);
  assert.ok(html.includes("js/boss-combat.js?v=1"));
});
