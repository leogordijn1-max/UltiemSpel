"use strict";
// Offline only: analyze locally exported browser QA performance JSON.
const fs=require("node:fs");
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const round=n=>Math.round(n*100)/100;
function analyzeRun(report){
  const samples=(Array.isArray(report?.performance)?report.performance:[])
    .filter(s=>s&&finite(s.fps)&&s.fps>0&&finite(s.p95FrameMs)&&s.p95FrameMs>0);
  const groups=new Map();
  for(const s of samples){
    const k=(s.graphicsQuality||"unknown")+" | "+(s.gameSpeed??"?")+"x | "+(s.encounter||"?");
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(s);
  }
  function stats(a){
    if(!a.length)return null;
    const values=k=>a.map(x=>x[k]).filter(finite);
    const mean=k=>{const v=values(k);return v.length?round(v.reduce((x,y)=>x+y,0)/v.length):null;};
    const timed=a.every(x=>finite(x.frameCount)&&finite(x.measuredSeconds)&&x.measuredSeconds>0);
    const fps=timed?a.reduce((x,y)=>x+y.frameCount,0)/a.reduce((x,y)=>x+y.measuredSeconds,0):mean("fps");
    const heap=values("heapUsedMB");
    return {windows:a.length,fps:round(fps),meanWindowP95Ms:mean("p95FrameMs"),
      worstWindowP95Ms:Math.max(...values("p95FrameMs")),
      peakFrameMs:values("peakFrameMs").length?Math.max(...values("peakFrameMs")):null,
      framesOver33ms:values("framesOver33ms").length?values("framesOver33ms").reduce((x,y)=>x+y,0):null,
      aiMs:mean("aiMs"),collisionMs:mean("collisionMs"),renderMs:mean("renderMs"),
      maxEnemies:values("enemies").length?Math.max(...values("enemies")):null,
      heapFirstMB:heap.length?heap[0]:null,heapLastMB:heap.length?heap.at(-1):null};
  }
  return {samples:samples.length,overall:stats(samples),
    byContext:Object.fromEntries([...groups].map(([k,v])=>[k,stats(v)]))};
}
function print(a,file){
  console.log(file+" · "+a.samples+" windows");
  for(const [key,r] of [["ALL",a.overall],...Object.entries(a.byContext)]){
    if(!r)continue;
    console.log(key+" : "+r.fps+" FPS, P95 mean/worst "+
      r.meanWindowP95Ms+"/"+r.worstWindowP95Ms+" ms, AI/hit/draw "+
      r.aiMs+"/"+r.collisionMs+"/"+r.renderMs+" ms, max enemies "+
      r.maxEnemies+", heap "+(r.heapFirstMB??"unavailable")+" -> "+(r.heapLastMB??"unavailable")+" MB");
  }
  console.log("P95 = per-window, not run-wide; heap growth alone is not leak proof.");
}
if(require.main===module){
  if(process.argv.length<3){console.error("Usage: node scripts/performance-report.cjs <qa.json> [more.json]");process.exitCode=1;}
  for(const file of process.argv.slice(2)){
    try{print(analyzeRun(JSON.parse(fs.readFileSync(file,"utf8"))),file);}
    catch(e){console.error(file+": "+e.message);process.exitCode=1;}
  }
}
module.exports={analyzeRun};
