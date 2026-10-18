const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function harness(){
  const window={};
  vm.runInNewContext(read("js/player-movement.js"),{window,Math},{filename:"js/player-movement.js"});
  return window;
}
test("input normalizes diagonals and cancels opposite directions",()=>{
  const w=harness(),diagonal=w.normalizedPlayerInput(1,1);
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-8);
  assert.equal(w.normalizedPlayerInput(0,0).active,false);
  assert.equal(w.normalizedPlayerInput(1-1,0).x,0);
  assert.equal(w.normalizedPlayerInput(.5,0).x,.5);
});
test("movement accelerates promptly without a full-speed instant snap",()=>{
  const w=harness(),frame=w.nextPlayerMotion(1/60,1,0,235);
  assert.ok(frame.vx>50&&frame.vx<235);
  assert.equal(frame.vy,0);
  let result=frame;
  for(let i=0;i<20;i++)result=w.nextPlayerMotion(1/60,1,0,235);
  assert.ok(result.vx>234&&result.vx<=235);
});
test("releasing input stops cleanly without long slippery drift",()=>{
  const w=harness();
  for(let i=0;i<30;i++)w.nextPlayerMotion(1/60,1,0,235);
  const first=w.nextPlayerMotion(1/60,0,0,235);
  assert.ok(first.vx<200&&first.vx>0);
  for(let i=0;i<15;i++)w.nextPlayerMotion(1/60,0,0,235);
  assert.ok(w.playerMovementStatus().velocityX<1);
});
test("smooth movement is approximately invariant across 60fps vs 120fps",()=>{
  function travel(fps){
    const w=harness();let x=0;
    for(let i=0;i<fps;i++)x+=w.nextPlayerMotion(1/fps,1,0,235).vx/fps;
    return x;
  }
  assert.ok(Math.abs(travel(60)-travel(120))<3);
});
test("dashes remain mainly locked to input direction despite perpendicular steering",()=>{
  const w=harness();
  const moving=w.nextPlayerMotion(1/60,0,1,235,true,1,0);
  assert.ok(moving.vx>900,"dash keeps speed despite steering");
  assert.ok(moving.vy>0&&moving.vy<200,"small steering is allowed");
  assert.ok(Math.abs(Math.hypot(moving.vx,moving.vy)-235*4.35)<.001);
  const idle=w.nextPlayerMotion(1/60,0,0,235,true,1,0);
  assert.equal(idle.vy,0);
  assert.ok(idle.vx>1000);
});
test("dash creates a short-lived readable trail and separate landing feedback",()=>{
  const w=harness();const duration=w.beginPlayerDash(0,0,1,0,0);
  assert.equal(duration,.26);
  assert.equal(w.playerMovementStatus().ghostCount,1);
  w.trackPlayerMovement(35,0,.04,true,1,0);
  w.trackPlayerMovement(70,0,.08,true,1,0);
  assert.equal(w.playerMovementStatus().ghostCount,3);
  w.trackPlayerMovement(140,0,.3,false,1,0);
  assert.ok(w.playerMovementStatus().ringCount>=1);
  w.trackPlayerMovement(140,0,1,false,1,0);
  assert.equal(w.playerMovementStatus().ghostCount,0);
  assert.equal(w.playerMovementStatus().ringCount,0);
});
test("visual snapshots have fixed memory limits even under high frame rate",()=>{
  const w=harness();w.beginPlayerDash(0,0,1,0,0);
  for(let i=1;i<250;i++)w.trackPlayerMovement(i*3,0,i/250,true,1,0);
  assert.ok(w.playerMovementStatus().ghostCount<=9);
  assert.ok(w.playerMovementStatus().ringCount<=4);
});
test("render works across graphics settings without mutating game state",()=>{
  const w=harness();w.beginPlayerDash(0,0,1,0,0);
  w.trackPlayerMovement(55,0,.04,true,1,0);
  let shapes=0;
  const ctx=new Proxy({save(){},restore(){},beginPath(){},ellipse(){shapes++},arc(){shapes++},
    stroke(){},fill(){}},{get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
  for(const q of ["high","medium","low"])w.drawPlayerMovement(ctx,.09,q);
  assert.ok(shapes>=6);
});
test("reset and blur-clear never leak old movement into a new run",()=>{
  const w=harness();w.nextPlayerMotion(.2,1,0,235);w.beginPlayerDash(0,0,1,0,0);
  w.clearPlayerMovementInput();
  assert.equal(w.playerMovementStatus().velocityX,0);
  w.resetPlayerMovement();
  assert.equal(w.playerMovementStatus().ghostCount,0);
  assert.equal(w.playerMovementStatus().ringCount,0);
  assert.equal(w.nextPlayerMotion(1/60,0,0,235).vx,0);
});
test("integration applies dash invulnerability for full duration and feeds measured combat speed",()=>{
  const game=read("js/game.js"),render=read("js/render.js"),controls=read("js/controls.js");
  assert.match(game,/beginPlayerDash\?\.\(/);
  assert.match(game,/player\.inv = Math\.max\(player\.inv,dashTimer \+ \.04\)/);
  assert.match(game,/nextPlayerMotion\?\.\(/);
  assert.match(game,/trackPlayerMovement\?\.\(/);
  assert.match(game,/player\.combatVX = \(player\.x - previousPlayerX\)/);
  assert.match(render,/drawPlayerMovement\?\.\(ctx,time,graphicsQuality\)/);
  assert.match(controls,/clearPlayerMovementInput\?\.\(\)/);
  assert.match(read("index.html"),/player-movement\.js\?v=12/);
});
