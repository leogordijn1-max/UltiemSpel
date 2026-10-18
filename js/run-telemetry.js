// Update 31 — local, opt-out run QA recorder. No server, uploads, gameplay
// changes, or fabricated browser evidence. Export is EXPLICITLY user-triggered.
(() => {
  "use strict";
  const MAX_EVENTS=360,MAX_CHECKPOINTS=160,MAX_PERF=420,FRAME_WINDOW=120;
  const VERSION=1;
  const finite=n=>typeof n==="number" && Number.isFinite(n);
  const number=(n,digits=2)=>finite(n)?Number(n.toFixed(digits)):0;
  const clean=(v,depth=0)=>{
    if(depth>3)return null;
    if(v===null||v===undefined)return null;
    if(typeof v==="string")return v.slice(0,160);
    if(typeof v==="number")return finite(v)?number(v):null;
    if(typeof v==="boolean")return v;
    if(Array.isArray(v))return v.slice(0,20).map(x=>clean(x,depth+1));
    if(typeof v==="object"){
      const result={};
      for(const key of Object.keys(v).slice(0,36)){
        if(!/^[a-zA-Z0-9_-]{1,40}$/.test(key))continue;
        result[key]=clean(v[key],depth+1);
      }
      return result;
    }
    return null;
  };
  let enabled=true;
  try{
    if(typeof storageGet==="function")
      enabled=storageGet("shadowQaRecording","true")!=="false";
  }catch{}
  let current=null,completed=null;
  let nextSnapshot=0,perfElapsed=0,perfFrames=0,perfIndex=0;
  let frameRing=[],lastBoss=null,lastBossPhase=0;
  const telemetryTime=()=>finite(current?.lastTime)?current.lastTime:0;
  function begin(meta={}){
    // The previous report stays available until a NEW run intentionally begins.
    completed=null;
    frameRing=[];perfIndex=0;perfElapsed=0;perfFrames=0;
    nextSnapshot=0;lastBoss=null;lastBossPhase=0;
    current=enabled?{
      schema:VERSION,source:"local-browser-runtime-not-manually-verified",
      startedAt:new Date().toISOString(),
      sandbox:!!window.isDeveloperRun?.(),
      meta:clean(meta),outcome:"in_progress",
      standardVictory:false,lastTime:0,
      totals:{xpGained:0,levelsGained:0,hitsTaken:0,damageTaken:0},
      checkpoints:[],events:[],performance:[]
    }:null;
    return !!current;
  }
  function needsSnapshot(t){
    return !!(current&&current.outcome==="in_progress"&&finite(t)&&t>=nextSnapshot);
  }
  function snapshot(state={}){
    if(!current||current.outcome!=="in_progress")return false;
    const t=finite(state.time)?state.time:telemetryTime();
    current.lastTime=Math.max(telemetryTime(),t);
    const snap=clean(state);
    snap.gameTime=number(t);
    if(current.checkpoints.length>=MAX_CHECKPOINTS)
      current.checkpoints.shift();
    current.checkpoints.push(snap);
    nextSnapshot=Math.floor(t/30)*30+30;
    return true;
  }
  function event(type,data={},t=null){
    if(!current||current.outcome!=="in_progress")return false;
    if(current.events.length>=MAX_EVENTS)current.events.shift();
    const timestamp=finite(t)?t:telemetryTime();
    current.lastTime=Math.max(telemetryTime(),timestamp);
    current.events.push({time:number(timestamp),type:String(type).slice(0,48),
      data:clean(data)});
    if(type==="xp") {
      current.totals.xpGained=number(current.totals.xpGained+
        Math.max(0,Number(data.collected)||0));
    }
    if(type==="level")current.totals.levelsGained+=Math.max(0,Number(data.gained)||0);
    if(type==="hit"){
      current.totals.hitsTaken++;
      current.totals.damageTaken=number(current.totals.damageTaken+
        Math.max(0,Number(data.amount)||0));
    }
    return true;
  }
  function xp(collected,t){
    if(!current||current.outcome!=="in_progress"||!finite(collected)||collected<=0)return false;
    // Aggregates every soul, without creating an event for each small pickup.
    current.totals.xpGained=number(current.totals.xpGained+collected);
    if(finite(t))current.lastTime=Math.max(current.lastTime,t);
    return true;
  }
  function frame(seconds,t,metrics=null){
    if(!current||current.outcome!=="in_progress"||!finite(seconds)||
      seconds<=0||seconds>.5)return false;
    const ms=seconds*1000;
    if(frameRing.length<FRAME_WINDOW)frameRing.push(ms);
    else {frameRing[perfIndex]=ms;perfIndex=(perfIndex+1)%FRAME_WINDOW;}
    perfFrames++;perfElapsed+=seconds;
    if(perfElapsed<5)return false;
    const ordered=[...frameRing].sort((a,b)=>a-b);
    const p95=ordered[Math.max(0,Math.ceil(ordered.length*.95)-1)]||0;
    if(current.performance.length>=MAX_PERF)current.performance.shift();
    current.performance.push({
      gameTime:number(t),fps:number(perfFrames/perfElapsed,1),
      p95FrameMs:number(p95,1),
      aiMs:number(metrics?.enemyAI||0,2),
      collisionMs:number(metrics?.collisions||0,2),
      renderMs:number(metrics?.render||0,2),
      enemies:Math.max(0,Math.floor(metrics?.enemies||0)),
      playerProjectiles:Math.max(0,Math.floor(metrics?.playerProjectiles||0)),
      enemyProjectiles:Math.max(0,Math.floor(metrics?.enemyProjectiles||0)),
      effects:Math.max(0,Math.floor(metrics?.effects||0))
    });
    perfFrames=0;perfElapsed=0;
    return true;
  }
  function bossPhase(boss,t){
    if(!current||current.outcome!=="in_progress")return false;
    if(!boss){lastBoss=null;lastBossPhase=0;return false;}
    const phase=Math.max(1,Math.floor(boss.finalPhase||
      (boss.phaseThree?3:boss.phaseTwo?2:1)));
    if(boss===lastBoss&&phase===lastBossPhase)return false;
    lastBoss=boss;lastBossPhase=phase;
    return event("boss_phase",{name:boss.bossName,phase,
      health:number(boss.hp||0),maxHealth:number(boss.maxHp||0),
      final:!!boss.isFinalBoss},t);
  }
  function end(outcome,t){
    if(!current)return false;
    if(current.outcome!=="in_progress")return false;
    if(finite(t))current.lastTime=Math.max(telemetryTime(),t);
    current.outcome=String(outcome).slice(0,64);
    if(outcome==="victory")current.standardVictory=true;
    current.endedAt=new Date().toISOString();
    completed=current;
    return true;
  }
  function continueEndless(t){
    if(!current||current.outcome!=="victory")return false;
    current.standardVictory=true;
    current.outcome="in_progress";
    delete current.endedAt;
    nextSnapshot=Math.floor((finite(t)?t:current.lastTime)/30)*30+30;
    event("endless_continued",{},t);
    return true;
  }
  function getReport(){
    const report=current||completed;
    return report?JSON.parse(JSON.stringify(report)):null;
  }
  function summary(){
    const r=getReport();
    if(!r)return "NO QA RUN DATA YET. Enable QA recording in Settings and start a run.";
    const last=r.checkpoints.at(-1)||{};
    const progress=r.events.filter(x=>x.type==="evolution").length;
    const bosses=r.events.filter(x=>x.type==="boss_defeated").length;
    const avg=r.performance.length?
      number(r.performance.reduce((s,p)=>s+p.fps,0)/r.performance.length,1):null;
    return [
      "SHADOW SURVIVOR · LOCAL QA REPORT (not independently verified)",
      "Outcome: "+r.outcome+(r.standardVictory?" · Standard victory earned":""),
      "Mode / difficulty / element: "+(r.meta?.mode||"?")+" / "+
        (r.meta?.difficulty||"?")+" / "+(r.meta?.element||"?"),
      "Game time: "+number(r.lastTime,1)+"s; last level: "+(last.level||"?")+
        "; bosses defeated: "+bosses+"; evolutions: "+progress,
      "XP collected: "+r.totals.xpGained+
        "; HP damage taken: "+r.totals.damageTaken,
      "Mean captured FPS: "+(avg??"not yet sampled"),
      "Snapshots: "+r.checkpoints.length+"; events: "+r.events.length+
        "; performance samples: "+r.performance.length,
      "Sandbox/dev test: "+r.sandbox,
      "Manual browser-QA status: OPEN until a player reviews the run."
    ].join("\n");
  }
  function filename(){
    const r=current||completed,tag=String(r?.meta?.element||"unknown")
      .replace(/[^a-z0-9-]/gi,"").toLowerCase().slice(0,16);
    return "shadow-survivor-qa-"+tag+"-"+Math.floor(r?.lastTime||0)+"s.json";
  }
  function download(){
    const r=getReport();
    if(!r||typeof document==="undefined"||typeof Blob==="undefined"||
      typeof URL==="undefined"||typeof URL.createObjectURL!=="function")return false;
    const blob=new Blob([JSON.stringify(r,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename();a.style.display="none";
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    return true;
  }
  function attach(parent){
    if(!parent||!current)return false;
    const info=document.createElement("p");
    info.className="qa-report-summary";
    info.textContent="QA RECORDING · "+current.outcome.toUpperCase()+
      " · "+Math.floor(current.lastTime)+"s · "+
      current.checkpoints.length+" snapshots";
    parent.append(info);
    const button=document.createElement("button");
    button.type="button";
    button.textContent="DOWNLOAD QA REPORT · JSON";
    button.onclick=()=>{
      if(!download())info.textContent="Report could not be downloaded in this browser.";
    };
    parent.append(button);
    const copy=document.createElement("button");
    copy.type="button";
    copy.textContent="COPY QA SUMMARY";
    copy.onclick=()=>{
      const value=summary();
      if(typeof navigator!=="undefined"&&navigator.clipboard?.writeText){
        navigator.clipboard.writeText(value).then(()=>{
          info.textContent="QA summary copied to clipboard.";
        }).catch(()=>{info.textContent=value;});
      } else {
        info.textContent=value;
      }
    };
    parent.append(copy);
    return true;
  }
  function setEnabled(value){
    enabled=!!value;
    try{if(typeof storageSet==="function")
      storageSet("shadowQaRecording",enabled?"true":"false");
    }catch{}
    // Disabling during a run stops collection, but keeps the collected report
    // available for export. Enabling begins on the NEXT run.
    if(!enabled&&current&&current.outcome==="in_progress")
      end("recording_disabled");
    return enabled;
  }
  window.runQaBegin=begin;
  window.runQaNeedsSnapshot=needsSnapshot;
  window.runQaSnapshot=snapshot;
  window.runQaEvent=event;
  window.runQaXp=xp;
  window.runQaFrame=frame;
  window.runQaBossPhase=bossPhase;
  window.runQaEnd=end;
  window.runQaContinueEndless=continueEndless;
  window.runQaGetReport=getReport;
  window.runQaSummary=summary;
  window.runQaDownload=download;
  window.appendRunQaExportButtons=attach;
  window.runQaEnabled=()=>enabled;
  window.runQaSetEnabled=setEnabled;
})();
