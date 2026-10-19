const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function setup(variant=0){
  const window={bossCombatPredictTarget:(boss,player)=>({x:player.x,y:player.y})};
  const ctx=vm.createContext({window,Math,Number});
  vm.runInContext(read("js/guardian-arena-powers.js"),ctx);
  vm.runInContext(read("js/combat-hud.js"),ctx);
  const boss={kind:3,variant,isFinalBoss:variant===3,x:0,y:0,r:48,
    phaseTwo:true,phaseThree:true,finalPhase:3};
  const player={x:250,y:0,r:15};
  return {window,ctx,boss,player,run:x=>vm.runInContext(x,ctx)};
}
function canvas(){
  const calls={saves:0,restores:0,lines:0,arcs:0};
  const ctx={save(){calls.saves++},restore(){calls.restores++},
    beginPath(){},moveTo(){},lineTo(){calls.lines++},
    stroke(){},fill(){},setLineDash(){},
    arc(){calls.arcs++}};
  return {ctx,calls};
}
test("no boss, dead boss or unrelated enemy creates a danger callout",()=>{
  const h=setup();
  assert.equal(h.window.combatHudDescribe(null,h.player,0,0).visible,false);
  assert.equal(h.window.combatHudDescribe({kind:1},h.player,0,0).visible,false);
  h.boss.dead=true;
  assert.equal(h.window.combatHudDescribe(h.boss,h.player,0,0).visible,false);
});
test("Guardian countdown is real simulation time, three beats and dash status",()=>{
  const h=setup();
  h.window.beginGuardianArenaPower(h.boss,10,h.player);
  const initial=h.window.combatHudDescribe(h.boss,h.player,10,0);
  assert.equal(initial.stage,"warning");
  assert.match(initial.detail,/BEAT 1\/3 · IMPACT IN 1\.5s/);
  assert.match(initial.instruction,/TARGET TRACKING/);
  assert.equal(initial.subtext,"DASH READY · SHIFT");
  assert.ok(Math.abs(initial.progress)<1e-8,"floating-point countdown begins effectively at zero");
  h.window.updateGuardianArenaPower(h.boss,10.4,h.player);
  const locked=h.window.combatHudDescribe(h.boss,h.player,10.4,1.5);
  assert.match(locked.detail,/1\.1s/);
  assert.ok(locked.progress>20&&locked.progress<35);
  assert.match(locked.subtext,/DASH 1\.5s/);
  h.window.updateGuardianArenaPower(h.boss,11.46,h.player);
  assert.equal(h.window.combatHudDescribe(h.boss,h.player,11.46).stage,"impact");
  h.window.updateGuardianArenaPower(h.boss,11.76,h.player);
  assert.equal(h.window.combatHudDescribe(h.boss,h.player,11.76).stage,"rest");
  h.window.updateGuardianArenaPower(h.boss,12.08,h.player);
  const second=h.window.combatHudDescribe(h.boss,h.player,12.08);
  assert.match(second.detail,/BEAT 2\/3/);
  assert.ok(second.progress>=0&&second.progress<10);
});
test("all four arena powers have a reachable marker strictly outside the actual hitzone",()=>{
  for(let v=0;v<4;v++){
    const h=setup(v);
    h.window.beginGuardianArenaPower(h.boss,2,h.player);
    h.window.updateGuardianArenaPower(h.boss,2.4,h.player);
    const current=h.window.guardianArenaPowerStatus();
    assert.equal(h.window.guardianArenaPowerThreat(current,h.player.x,h.player.y,h.player.r),true);
    const desc=h.window.combatHudDescribe(h.boss,h.player,2.4);
    assert.equal(desc.visible,true);
    assert.equal(desc.tone,"danger");
    assert.equal(desc.route?.kind,"route","Guardian "+v+" must offer a safe destination");
    assert.match(desc.instruction,/SAFE FROM THIS POWER/);
    const target=desc.route;
    assert.ok(target.distance<=370,"marker must not be across the whole arena");
    assert.equal(h.window.guardianArenaPowerThreat(current,target.x,target.y,h.player.r+10),false);
    assert.ok(target.x!==h.player.x||target.y!==h.player.y);
  }
});
test("tracking attack must never draw a misleading fixed escape arrow",()=>{
  const h=setup(2);
  h.window.beginGuardianArenaPower(h.boss,5,h.player);
  const before=h.window.combatHudDescribe(h.boss,h.player,5.1,0);
  assert.equal(before.route?.kind,"tracking");
  const {ctx,calls}=canvas();
  h.window.drawCombatHudEscape(ctx,h.boss,h.player,5.1,"low");
  assert.equal(calls.lines,0);
  assert.equal(calls.arcs,0);
  h.window.updateGuardianArenaPower(h.boss,5.6,h.player);
  h.window.drawCombatHudEscape(ctx,h.boss,h.player,5.6,"low");
  assert.ok(calls.lines>0&&calls.arcs>0,"route appears after lock");
  assert.equal(calls.saves,calls.restores);
});
test("moving away from the power should say only THIS power is safe",()=>{
  const h=setup(2);
  h.window.beginGuardianArenaPower(h.boss,0,h.player);
  h.window.updateGuardianArenaPower(h.boss,.55,h.player);
  h.player.x=700;h.player.y=700;
  const s=h.window.combatHudDescribe(h.boss,h.player,.6);
  assert.equal(s.tone,"clear");
  assert.equal(s.route.kind,"clear");
  assert.match(s.instruction,/OUTSIDE THIS POWER'S HITZONE/);
  assert.ok(!/\bALL ATTACKS SAFE\b/i.test(s.instruction));
  const {ctx,calls}=canvas();
  h.window.drawCombatHudEscape(ctx,h.boss,h.player,.6,"high");
  assert.equal(calls.lines,0,"no route to a place the player has already escaped");
});
test("guardian attacks take visual precedence over all normal warnings",()=>{
  const h=setup(0);
  h.boss.chargeWarning=3;
  h.boss.shotWarning=2;
  h.boss.specialRecoveryUntil=5;
  h.window.beginGuardianArenaPower(h.boss,0,h.player);
  const s=h.window.combatHudDescribe(h.boss,h.player,0.5);
  assert.equal(s.title,"HOUND'S KILL ZONES");
  assert.match(s.detail,/IMPACT IN/);
  assert.ok(!/COUNTERATTACK/.test(s.title));
});
test("real counterattack multiplier, normal hazards and phase skills have distinct cues",()=>{
  const h=setup(0);
  h.window.bossCombatDamageMultiplier=()=>1.42;
  h.boss.specialRecoveryUntil=9;
  const recovery=h.window.combatHudDescribe(h.boss,h.player,7.5,0);
  assert.equal(recovery.tone,"recovery");
  assert.match(recovery.title,/COUNTERATTACK/);
  assert.match(recovery.detail,/1\.5s REMAINING/);
  h.boss.specialRecoveryUntil=0;
  h.boss.shotWarning=.75;
  const volley=h.window.combatHudDescribe(h.boss,h.player,8,0);
  assert.equal(volley.title,"PROJECTILE VOLLEY");
  assert.match(volley.detail,/0\.8s/);
  h.boss.shotWarning=0;h.boss.chargeWarning=.63;
  assert.equal(h.window.combatHudDescribe(h.boss,h.player,8).title,"CHARGE INCOMING");
  h.boss.chargeWarning=0;
  h.boss.beauFight={mode:"ultimate",stage:"ultimateFinalTell",until:9};
  const showcase=h.window.combatHudDescribe(h.boss,h.player,8.5);
  assert.equal(showcase.stage,"special");
  assert.match(showcase.detail,/BOSS SPECIAL/);
});
test("route cache resets, invalidates on another beat or player movement",()=>{
  const h=setup(3);
  h.window.beginGuardianArenaPower(h.boss,2,h.player);
  h.window.updateGuardianArenaPower(h.boss,2.4,h.player);
  let a=h.window.combatHudDescribe(h.boss,h.player,2.4);
  assert.equal(a.route?.kind,"route");
  h.player.x+=70;
  let b=h.window.combatHudDescribe(h.boss,h.player,2.41);
  assert.notEqual(b.route?.x,a.route?.x,"moving must recalculate route");
  h.window.resetCombatHud();
  let c=h.window.combatHudDescribe(h.boss,h.player,2.42);
  assert.equal(c.visible,true);
  h.window.resetGuardianArenaPower();
  assert.equal(h.window.combatHudDescribe(h.boss,h.player,2.5).visible,false);
});
test("DOM CSS and render loop prioritize boss cues without mutating gameplay",()=>{
  const index=read("index.html"),game=read("js/game.js"),
    render=read("js/render.js"),css=read("styles.css");
  assert.match(index,/id="bossCombatCue"/);
  assert.match(index,/id="bossCueAdvice"/);
  assert.match(index,/id="bossCueFill"/);
  assert.ok(index.indexOf("js/guardian-arena-powers.js")<
    index.indexOf("js/combat-hud.js"));
  assert.match(game,/const combatCue=\$\("bossCombatCue"\)/);
  assert.match(game,/if\(combatCue\)combatCue\.hidden=true/);
  assert.match(game,/resetCombatHud\?\.\(\)/);
  assert.match(render,/drawCombatHudEscape\?\.\(ctx,e,player,time,graphicsQuality\)/);
  assert.match(css,/#bossCombatCue\[hidden\]/);
  assert.match(css,/@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(read("js/combat-hud.js"),/Math\.random|damage\(|spawnEnemy|enemies\.push|awardBossLoot|localStorage/);
});
