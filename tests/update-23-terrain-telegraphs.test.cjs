const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const PAIRS=[
  ["fire","flooded"],["fire","frozen"],["water","burning"],
  ["water","frozen"],["frost","flooded"],["frost","burning"]
];
const WORLD={fire:"burning",water:"flooded",frost:"frozen"};
function setup(element="fire",original="flooded",percent=85){
  const window={getWorldConquest:()=>({active:true,target:percent,
    invading:WORLD[element],original}),addWorldScar:()=>{}};
  vm.runInNewContext(source("js/world-retaliation.js"),{window,Math});
  window.resetWorldRetaliation();
  const p={x:0,y:0,r:15,inv:0};
  assert.equal(window.forceWorldReaction(p),true);
  const r=window.getWorldRetaliationStatus().rifts[0];
  return {window,p,r};
}
function phase(h){return h.window.getWorldRetaliationStatus().rifts[0]}
function context(){
  const seen={arcs:[],dashes:[],colors:[],fills:0,stroke:0,save:0,restore:0};
  const ctx={beginPath(){},moveTo(){},lineTo(){},save(){seen.save++},
    restore(){seen.restore++},fill(){seen.fills++},stroke(){seen.stroke++},
    arc(x,y,r){seen.arcs.push(r)},setLineDash(list){seen.dashes.push([...list])}};
  return {seen,ctx};
}
test("all 18 reaction hazards retain original stages and first-warning durations",()=>{
  for(const [element,original] of PAIRS)for(const percent of [15,50,85]){
    const h=setup(element,original,percent),r=phase(h);
    assert.equal(r.warningPhase,"forming");
    assert.equal(r.currentlyDangerous,false);
    assert.equal(r.warning,percent===85?3.1:percent===50?2.6:2.2);
    assert.equal(r.secondsUntilChange,r.warning);
    assert.equal(r.effects.length>0,true);
  }
});
test("initial warning countdown precedes any damaging or nonlethal terrain effects",()=>{
  const h=setup(),r=phase(h);
  h.p.x=r.x;h.p.y=r.y;
  const hits={damage:0,push:0,chill:0};
  const hooks={damage:()=>hits.damage++,push:()=>hits.push++,chill:()=>hits.chill++};
  h.window.updateWorldRetaliation(r.warning-.10,h.p,hooks);
  assert.equal(phase(h).warningPhase,"forming");
  assert.equal(hits.damage,0);
  h.window.updateWorldRetaliation(.11,h.p,hooks);
  assert.equal(phase(h).warningPhase,"active");
  assert.equal(phase(h).currentlyDangerous,true);
  assert.equal(hits.damage,1);
});
test("repeating eruptions signal recovery and a separate 0.95s rearm warning",()=>{
  const h=setup(),r=phase(h);
  h.p.x=r.x;h.p.y=r.y;
  let hits=0;
  const hooks={damage:()=>hits++,push:()=>{}};
  h.window.updateWorldRetaliation(r.warning+.16,h.p,hooks);
  assert.equal(hits,1);
  assert.equal(phase(h).warningPhase,"active");
  h.window.updateWorldRetaliation(1.0,h.p,hooks);
  assert.equal(phase(h).warningPhase,"recovering");
  assert.equal(phase(h).currentlyDangerous,false);
  h.window.updateWorldRetaliation(1.78,h.p,hooks);
  assert.equal(phase(h).warningPhase,"charging");
  assert.equal(phase(h).currentlyDangerous,false);
  assert.ok(phase(h).secondsUntilChange>=.8 && phase(h).secondsUntilChange<.9);
  assert.equal(hits,1,"charging terrain is genuinely safe");
  h.window.updateWorldRetaliation(.86,h.p,hooks);
  assert.equal(phase(h).warningPhase,"active");
  assert.equal(hits,2,"new eruption occurs only after the full charge");
});
test("burst reaction phases are deterministic for all six elemental world matchups",()=>{
  for(const [element,original] of PAIRS){
    const h=setup(element,original,85);
    h.window.updateWorldRetaliation(h.r.warning+.1,{x:99999,y:99999});
    assert.equal(phase(h).warningPhase,"active");
    h.window.updateWorldRetaliation(1.25,{x:99999,y:99999});
    assert.equal(phase(h).warningPhase,"recovering");
    h.window.updateWorldRetaliation(1.55,{x:99999,y:99999});
    assert.equal(phase(h).warningPhase,"charging");
    h.window.updateWorldRetaliation(.95,{x:99999,y:99999});
    assert.equal(phase(h).warningPhase,"active");
  }
});
test("tier-two persistent terrain remains visibly and mechanically active",()=>{
  for(const [element,original] of PAIRS){
    const h=setup(element,original,50);
    const r=phase(h);h.p.x=r.x;h.p.y=r.y;
    h.window.updateWorldRetaliation(r.warning+.05,h.p,{damage:()=>true});
    assert.equal(phase(h).warningPhase,"active");
    assert.equal(phase(h).currentlyDangerous,true);
    h.window.updateWorldRetaliation(12,{x:99999,y:99999});
    assert.equal(phase(h).warningPhase,"active");
    assert.equal(phase(h).currentlyDangerous,true);
  }
});
test("low graphics still shows a contracting countdown for initial and repeat warnings",()=>{
  const h=setup(),r=phase(h);
  h.window.updateWorldRetaliation(r.warning*.55,{x:99999,y:99999});
  let g=context();
  h.window.drawWorldRetaliation(g.ctx,2,"low");
  assert.ok(g.seen.arcs.length>=3,"warning needs outline, countdown ring and inner mark");
  assert.ok(g.seen.stroke>=3);
  assert.equal(g.seen.save,g.seen.restore);
  h.window.updateWorldRetaliation(1.85,{x:99999,y:99999});
  h.window.updateWorldRetaliation(2.65,{x:99999,y:99999});
  assert.equal(phase(h).warningPhase,"charging");
  g=context();h.window.drawWorldRetaliation(g.ctx,4,"low");
  assert.ok(g.seen.arcs.length>=3,"rearm countdown is visible on Low");
  assert.equal(g.seen.save,g.seen.restore);
});
test("recovering rifts draw a dashed, dimmed SAFE outline",()=>{
  const h=setup(),r=phase(h);
  h.window.updateWorldRetaliation(r.warning+1.3,{x:99999,y:99999});
  assert.equal(phase(h).warningPhase,"recovering");
  const g=context();h.window.drawWorldRetaliation(g.ctx,5,"low");
  assert.ok(g.seen.dashes.some(a=>a.length===2));
  assert.ok(g.seen.dashes.some(a=>a.length===0));
});
test("offscreen rifts skip Canvas drawing without erasing persistent hazards",()=>{
  const h=setup();
  const g=context();
  h.window.drawWorldRetaliation(g.ctx,3,"high",
    {left:10000,top:10000,width:300,height:300});
  assert.equal(g.seen.arcs.length,0);
  assert.equal(g.seen.save,g.seen.restore);
  assert.equal(h.window.getWorldRetaliationStatus().active,1);
});
test("pausing hazards during boss isolation freezes charging time and preserves fields",()=>{
  const h=setup(),r=phase(h);
  h.window.updateWorldRetaliation(r.warning+2.9,{x:99999,y:99999});
  assert.equal(phase(h).warningPhase,"charging");
  const before=phase(h).secondsUntilChange;
  h.window.updateWorldRetaliation(65,h.p,{suspended:true,damage:()=>assert.fail("boss isolated")});
  assert.equal(phase(h).secondsUntilChange,before);
  assert.equal(h.window.getWorldRetaliationStatus().active,1);
});
test("rendering and game keep existing elemental world and player-invulnerability hooks",()=>{
  const render=source("js/render.js"),game=source("js/game.js");
  assert.match(render,/drawWorldRetaliation\?\.\(ctx, time, graphicsQuality,/);
  assert.match(render,/\{left,top,width:W,height:H\}/);
  assert.match(game,/updateWorldRetaliation\?\.\(dt, player/);
  assert.match(game,/player\.inv > 0 \|\| window\.developerInvincible/);
  assert.match(source("js/world-retaliation.js"),/if \(r\.elapsed-r\.lastHit < cooldown\) continue/);
  assert.match(source("index.html"),/world-retaliation\.js\?v=terrain-23/);
});
