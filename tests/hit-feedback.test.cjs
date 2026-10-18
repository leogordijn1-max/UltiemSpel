const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function harness(){
  const window={};
  vm.runInNewContext(read("js/hit-feedback.js"),{window,Math},{filename:"js/hit-feedback.js"});
  return window;
}
function hit(overrides={}){return {x:100,y:200,radius:15,damage:10,targetKey:"a",now:1,visible:true,nearby:true,direct:true,...overrides};}
test("ordinary hits use discreet white impact; critical hits glow gold",()=>{
  const w=harness();
  assert.deepEqual(w.recordEnemyHitFeedback(hit()),{camera:0,sound:null,kind:"hit"});
  const c=w.recordEnemyHitFeedback(hit({critical:true,now:1.1}));
  assert.equal(c.kind,"critical");assert.equal(c.sound,"crit");assert.ok(c.camera>0);
});
test("heavy impacts have a distinct hit sound and light camera response",()=>{
  const w=harness();
  const response=w.recordEnemyHitFeedback(hit({damage:40,now:2}));
  assert.equal(response.kind,"heavy");
  assert.equal(response.sound,"impact");
  assert.ok(response.camera>0&&response.camera<3);
});
test("kill, boss kill and critical categories never become ordinary hits",()=>{
  const w=harness();
  const killed=w.recordEnemyHitFeedback(hit({killed:true,now:1.1}));
  assert.equal(killed.kind,"kill");
  assert.equal(killed.sound,null);
  assert.ok(killed.camera>0);
  const boss=w.recordEnemyHitFeedback(hit({boss:true,killed:true,now:1.2}));
  assert.equal(boss.kind,"boss");
  assert.equal(boss.sound,"boss");
  assert.ok(boss.camera>killed.camera);
});
test("offscreen, zero-damage and ambient damage never shake the camera",()=>{
  const w=harness();
  assert.equal(w.recordEnemyHitFeedback(hit({visible:false,critical:true})).camera,0);
  assert.equal(w.recordEnemyHitFeedback(hit({damage:0,killed:true})).camera,0);
  const burn=w.recordEnemyHitFeedback(hit({critical:true,direct:false,now:2}));
  assert.equal(burn.camera,0);
  const distant=w.recordEnemyHitFeedback(hit({critical:true,nearby:false,now:2.2}));
  assert.equal(distant.camera,0);
  assert.equal(w.hitFeedbackStatus().cameraKick,0);
});
test("damage-over-time impacts cannot spam huge trails or sound",()=>{
  const w=harness();
  const first=w.recordEnemyHitFeedback(hit({now:1}));
  assert.equal(first.kind,"hit");
  const repeated=w.recordEnemyHitFeedback(hit({now:1.01}));
  assert.deepEqual(repeated,{camera:0,sound:null});
  assert.equal(w.hitFeedbackStatus().active,1);
  const different=w.recordEnemyHitFeedback(hit({targetKey:"b",now:1.02}));
  assert.equal(different.kind,"hit");
  assert.equal(w.hitFeedbackStatus().active,2);
});
test("impact rings and throttling have hard memory limits",()=>{
  const w=harness();
  for(let i=0;i<200;i++)
    w.recordEnemyHitFeedback(hit({targetKey:i,now:1+i*.005,critical:true}));
  assert.ok(w.hitFeedbackStatus().active<=38);
  assert.ok(w.hitFeedbackStatus().recent<=16);
});
test("all effects decay on simulation time and stop while paused",()=>{
  const w=harness();
  w.recordEnemyHitFeedback(hit({critical:true,now:1}));
  w.updateHitFeedback(.1,1.1);
  assert.ok(w.hitFeedbackStatus().active>=1);
  assert.ok(w.hitFeedbackStatus().cameraKick<2);
  w.updateHitFeedback(.1,2);
  assert.equal(w.hitFeedbackStatus().active,0);
  assert.equal(w.hitFeedbackStatus().recent,0);
  w.resetHitFeedback();
  assert.equal(w.hitFeedbackStatus().cameraKick,0);
});
test("high-quality visual sparks render while low quality stays readable",()=>{
  const w=harness();
  w.recordEnemyHitFeedback(hit({critical:true,now:1}));
  w.recordEnemyHitFeedback(hit({targetKey:"normal",now:1.03}));
  let rings=0,strokes=0;
  const ctx=new Proxy({save(){},restore(){},beginPath(){},arc(){rings++},stroke(){strokes++}},
    {get(o,key){return key in o?o[key]:()=>{};},set(o,key,value){o[key]=value;return true;}});
  w.drawHitFeedback(ctx,1.06,"high");
  const high=rings;
  w.drawHitFeedback(ctx,1.06,"low");
  assert.ok(high>=2);
  assert.ok(rings>high);
  assert.ok(strokes>rings);
});
test("missing inputs cannot produce NaN geometry or new impacts",()=>{
  const w=harness();
  assert.equal(w.recordEnemyHitFeedback(null).sound,null);
  assert.equal(w.recordEnemyHitFeedback({x:NaN,y:0,damage:5}).camera,0);
  assert.equal(w.recordEnemyHitFeedback({x:0,y:0,damage:Infinity}).camera,0);
  assert.equal(w.hitFeedbackStatus().active,0);
});
test("impact effects are cosmetic: damage/XP and boss isolation remain separate",()=>{
  const enemy=read("js/enemies.js"),game=read("js/game.js"),render=read("js/render.js");
  assert.match(enemy,/recordEnemyHitFeedback\?\.\(/);
  assert.match(enemy,/effectiveDamage = Math\.min/);
  assert.match(enemy,/e\.hp -= finalDamage/);
  assert.match(game,/resetHitFeedback\?\.\(\)/);
  assert.match(game,/updateHitFeedback\?\.\(dt,time\)/);
  assert.match(render,/drawHitFeedback\?\.\(ctx,time,graphicsQuality\)/);
  assert.match(read("index.html"),/hit-feedback\.js\?v=13/);
});
test("critical and heavy sounds have their own rate-limited audio presets",()=>{
  const a=read("js/audio.js");
  assert.match(a,/crit: \[385, 0\.13, "triangle"\]/);
  assert.match(a,/impact: \[115, 0\.13, "sawtooth"\]/);
  assert.match(a,/name === "crit" \? \.16 : name === "impact" \? \.19/);
});
