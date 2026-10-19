// Enemy progression — new enemy families arrive in the correct Guardian chapter.
// All ambient spawns, patrols, special waves and defense squads share this roster.
(() => {
  "use strict";
  const STAGES = Object.freeze([
    Object.freeze({ seconds:0,   kind:0, name:"DRIFTER" }),
    Object.freeze({ seconds:0,   kind:1, name:"RUNNER" }),
    Object.freeze({ seconds:180, kind:4, name:"RANGED SHADE" }),
    Object.freeze({ seconds:360, kind:2, name:"ZOMBIE MIKE" }),
    Object.freeze({ seconds:540, kind:5, name:"BURSTLING" }),
    Object.freeze({ seconds:720, kind:6, name:"BULWARK" })
  ]);
  let previousUnlocks=2, overrideCount=null;
  function isSandbox(){ return window.isDeveloperRun?.()===true; }
  function unlockCount(seconds=0){
    // Every new species enters its own LV1 era. A delayed boss victory must
    // not let a later species arrive before its birth-chapter Guardian falls.
    // Headless legacy tests may omit the current-boss hook; the time roster
    // remains usable without the full game runtime.
    const defeated=window.enemyRunBossCount?.() ?? Infinity;
    const actual=STAGES.filter(entry=>seconds>=entry.seconds &&
      defeated>=(window.enemyFamilyDebutBossCount?.(entry.kind)??0)).length;
    return isSandbox()&&overrideCount!==null ? Math.max(actual,overrideCount) : actual;
  }
  function unlocked(seconds=0){return STAGES.slice(0,unlockCount(seconds)).map(e=>e.kind);}
  function available(kind,seconds=0){return unlocked(seconds).includes(kind);}
  function resolve(kind,seconds=0,slot=0){
    if(available(kind,seconds))return kind;
    // Preserve early-game diversity if an encounter asks for a future type.
    return slot%2===0?0:1;
  }
  function ambient(seconds=0,roll=Math.random()){
    const candidates=[
      {kind:0,weight:35},{kind:1,weight:27},
      {kind:4,weight:15},{kind:2,weight:13},
      {kind:5,weight:6},{kind:6,weight:4}
    ].filter(entry=>available(entry.kind,seconds));
    const total=candidates.reduce((n,e)=>n+e.weight,0);
    let value=Math.max(0,Math.min(.999999,Number(roll)||0))*total;
    for(const entry of candidates){
      value-=entry.weight;
      if(value<0)return entry.kind;
    }
    return candidates[candidates.length-1]?.kind??0;
  }
  function roleKind(role,seconds=0){
    const target={commander:2,defender:6,hunter:1,ranger:4}[role];
    if(target===undefined)return 0;
    if(available(target,seconds))return target;
    if(role==="commander"||role==="defender")return 0;
    return 1;
  }
  function reset(){previousUnlocks=2;overrideCount=null;}
  function update(seconds,notify){
    const count=unlockCount(seconds);
    if(count<=previousUnlocks)return false;
    for(const entry of STAGES.slice(previousUnlocks,count)){
      notify?.("NEW ENEMY · "+entry.name+" HAS ENTERED THE WORLD");
    }
    previousUnlocks=count;
    return true;
  }
  function developerNext(seconds=0){
    if(!isSandbox())return false;
    const before=unlockCount(seconds);
    if(before===STAGES.length)return false;
    overrideCount=before+1;
    return true;
  }
  function status(seconds=0){
    const count=unlockCount(seconds),next=STAGES[count];
    return {count,total:STAGES.length,unlocked:unlocked(seconds),
      next:next?{kind:next.kind,name:next.name,seconds:next.seconds}:null,
      preview:isSandbox()&&overrideCount!==null};
  }
  window.resetEnemyProgression=reset;
  window.updateEnemyProgression=update;
  window.enemyKindAvailable=available;
  window.resolveEncounterEnemyKind=resolve;
  window.pickAmbientEnemyKind=ambient;
  window.enemyDefenseRoleKind=roleKind;
  window.enemyProgressionStatus=status;
  window.developerUnlockNextEnemy=developerNext;
})();