// Update 18 — shared encounter rhythm. Wave, patrol and defense timers
// compete for one staged slot instead of piling onto the same encounter.
// Explicit Developer Mode spawns remain independent of the automatic director.
(() => {
  "use strict";
  let running=false,phase="ready",until=0,tracked=[],lastKind=null;
  let encounters=0,cleared=0,previousAt=-Infinity,announcedAt=-Infinity;
  const REST_BASE=11,REST_LATE=17;
  const live=e=>!!e&&!e.dead&&(e.hp===undefined||e.hp>0);
  function reset(){
    running=true;phase="ready";until=0;tracked=[];
    lastKind=null;encounters=0;cleared=0;
    previousAt=-Infinity;announcedAt=-Infinity;
  }
  function clear(){
    running=false;phase="ready";until=0;tracked=[];
    lastKind=null;encounters=0;cleared=0;
  }
  function rest(now,growth=0){
    phase="recover";
    tracked=[];
    const length=REST_BASE+Math.min(REST_LATE-REST_BASE,
      Math.max(0,(Number(growth)||0)/240));
    until=now+length;
    cleared++;
  }
  function advance(now,enemies,blocked=false,growth=0){
    if(!running||!Number.isFinite(now))return;
    if(blocked){
      // Do not bring back deferred waves immediately after a boss fight.
      if(phase!=="boss"){
        phase="boss";tracked=[];until=Infinity;
      }
      return;
    }
    if(phase==="boss"){
      phase="recover";tracked=[];until=now+12;
      return;
    }
    if(phase==="engaged"){
      const survivors=tracked.filter(live);
      // One lingering straggler shouldn't delay XP collection and the next
      // staged encounter indefinitely. A large swarm must be mostly cleared.
      const threshold=tracked.length>=20?3:1;
      if(survivors.length<=threshold)rest(now,growth);
    }
    if(phase==="recover"&&now>=until){phase="ready";until=0;}
  }
  function canStart(kind,now,enemies){
    if(!running)return true;
    // Gate all automatic sources on the same phase; their normal population
    // cap remains the final authority on the actual number of enemies.
    return phase==="ready";
  }
  function started(kind,now,members,growthSeconds=0){
    if(!running||!Array.isArray(members)||!members.some(live))return false;
    phase="engaged";tracked=members.filter(live);
    lastKind=kind;encounters++;previousAt=now;
    // The denser previous schedule has become deliberate solo set pieces.
    // Reward clearing a difficult squad instead of replacing it with trash mobs.
    // XP still needs to be earned by killing and picking up souls.
    const bonus=kind==="swarm"?1:
      1.18+Math.min(.20,Math.max(0,growthSeconds)/1200*.20);
    for(const e of tracked){
      if(e.rhythmXpAdjusted)continue;
      e.xpValueMultiplier=(e.xpValueMultiplier||1)*bonus;
      e.rhythmXpAdjusted=true;
    }
    return true;
  }
  function ambientLimit(now,enemies,base){
    if(!running)return base;
    if(phase==="boss")return 0;
    // Combat is about the active squad. During recovery leave just enough
    // ambient enemies for movement and XP without restarting the fight.
    if(phase==="engaged")return Math.min(base,2);
    if(phase==="recover")return Math.min(base,2);
    return base;
  }
  function planIndex(base=0){
    // Use total completed encounters for varied compositions; patrol and wave
    // counters by themselves often pick identical first variants.
    return encounters+(Math.max(0,Math.floor(Number(base)||0))%3);
  }
  function state(now=0){
    return {phase,active:running,encounters,cleared,lastKind,
      survivors:tracked.filter(live).length,
      remaining:phase==="recover"?Math.max(0,until-now):0,
      previousAt,until};
  }
  window.resetEncounterRhythm=reset;
  window.clearEncounterRhythm=clear;
  window.updateEncounterRhythm=advance;
  window.encounterRhythmCanStart=canStart;
  window.recordEncounterRhythmSpawn=started;
  window.encounterRhythmAmbientLimit=ambientLimit;
  window.encounterRhythmPlanIndex=planIndex;
  window.getEncounterRhythmStatus=state;
})();
