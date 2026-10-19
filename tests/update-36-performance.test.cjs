const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const {analyzeRun}=require("../scripts/performance-report.cjs");
function setup(memory){
  const w={isDeveloperRun:()=>false};
  const ctx=vm.createContext({window:w,Date,Math,Number,JSON,
    storageGet:()=>"true",performance:memory?{memory}:{}});
  vm.runInContext(read("js/run-telemetry.js"),ctx);
  w.runQaBegin({mode:"standard",difficulty:"normal",element:"water"});
  return w;
}
function frames(w,fn){for(let i=0;i<100;i++)w.runQaFrame(.05,i*.05,fn(i));}
test("5s stats average CPU and preserve quality/speed/boss identity",()=>{
  const w=setup();frames(w,i=>({graphicsQuality:"high",gameSpeed:2,
    bossName:"BEAU",enemyAI:i%2?2:4,collisions:1,render:6,enemies:240}));
  const s=w.runQaGetReport().performance[0];
  assert.equal(s.fps,20);assert.equal(s.p95FrameMs,50);
  assert.equal(s.frameCount,100);assert.equal(s.peakFrameMs,50);
  assert.equal(s.framesOver33ms,100);assert.equal(s.aiMs,3);
  assert.equal(s.renderMs,6);assert.equal(s.encounter,"BEAU");
  assert.equal(s.graphicsQuality,"high");assert.equal(s.gameSpeed,2);
  assert.equal(s.heapUsedMB,null);
});
test("changed settings are marked mixed and reset in next window",()=>{
  const w=setup();
  frames(w,i=>({graphicsQuality:i<40?"low":"high",gameSpeed:i<60?1:3,
    bossName:i<80?null:"BELL"}));
  const a=w.runQaGetReport().performance[0];
  assert.equal(a.graphicsQuality,"mixed");assert.equal(a.gameSpeed,"mixed");
  assert.equal(a.encounter,"mixed");
  frames(w,()=>({graphicsQuality:"medium",gameSpeed:3,bossName:"BELL"}));
  const b=w.runQaGetReport().performance[1];
  assert.equal(b.graphicsQuality,"medium");assert.equal(b.gameSpeed,3);
  assert.equal(b.encounter,"BELL");
});
test("nonstandard Chromium heap is optional and never fake-zero",()=>{
  const yes=setup({usedJSHeapSize:104857600});frames(yes,()=>({}));
  assert.equal(yes.runQaGetReport().performance[0].heapUsedMB,100);
  const no=setup();frames(no,()=>({}));
  assert.equal(no.runQaGetReport().performance[0].heapUsedMB,null);
});
test("tab-gap ignored and perf samples capped at 420",()=>{
  const w=setup();assert.equal(w.runQaFrame(.8,0,{}),false);
  for(let j=0;j<422;j++)frames(w,()=>({}));
  assert.equal(w.runQaGetReport().performance.length,420);
});
test("offline report groups quality and boss with optional memory",()=>{
  const p={performance:[
    {fps:60,p95FrameMs:17,graphicsQuality:"low",gameSpeed:1,encounter:"field",heapUsedMB:100},
    {fps:30,p95FrameMs:40,graphicsQuality:"low",gameSpeed:1,encounter:"field",heapUsedMB:110},
    {fps:45,p95FrameMs:28,graphicsQuality:"high",gameSpeed:3,encounter:"BELL",heapUsedMB:null}]};
  const a=analyzeRun(p);
  assert.equal(a.byContext["low | 1x | field"].fps,45);
  assert.equal(a.byContext["low | 1x | field"].heapLastMB,110);
  assert.equal(a.byContext["high | 3x | BELL"].heapFirstMB,null);
});
test("effect compaction avoids fresh arrays without changing order",()=>{
  const s=read("js/game.js"),m=s.match(/function compactLiveEffects\(items\)\s*\{[\s\S]*?\n\}/);
  assert.ok(m);const c=vm.createContext({});vm.runInContext(m[0],c);
  const items=[{id:1,life:1},{id:2,life:0},{id:3,life:2}];
  assert.equal(vm.runInContext("compactLiveEffects",c)(items),items);
  assert.deepEqual(items.map(x=>x.id),[1,3]);
  assert.match(s,/compactLiveEffects\(particles\)/);
  assert.match(s,/compactLiveEffects\(texts\)/);
});
test("browser loads the updated telemetry and gameplay assets",()=>{
  assert.match(read("index.html"),/js\/run-telemetry\.js\?v=36/);
  assert.match(read("index.html"),/js\/game\.js\?v=39-ux-evolution/);
});
