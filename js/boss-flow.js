// Update 25 — guardian progression and safe arena transitions.
// This module never spawns enemies or awards loot; existing battle code remains
// the single source of truth for damage, actual kills and rewards.
(() => {
  "use strict";
  const STANDARD = Object.freeze([
    "BEAU DE HOND","THE MOURNING SHADE","BELL TOWER","THE LAST MEME"
  ]);
  const ORDINARY_COUNT = 3;
  const FINALE_AT = 25*60;

  function next(mode,defeated,clock,nextOrdinaryTime,finalDefeated=false) {
    if(!Number.isFinite(clock)||!Number.isFinite(nextOrdinaryTime))return null;
    if(mode==="standard"){
      if(finalDefeated)return null;
      if(defeated>=ORDINARY_COUNT)return clock>=FINALE_AT?"final":null;
      return clock>=nextOrdinaryTime?"ordinary":null;
    }
    return clock>=nextOrdinaryTime?"ordinary":null;
  }
  function ordinaryVariant(mode,number) {
    const index=Math.max(1,Math.floor(Number(number)||1));
    // Standard: 1=Beau, 2=Shade, 3=Bell.
    // Endless launched from a completed run: 4=the Last Meme and
    // 5=Beau again; not Mourning Shade by accident.
    if(mode==="endless"&&index>=5)return (index-5)%ORDINARY_COUNT;
    return (index-1)%ORDINARY_COUNT;
  }
  function canFinale(mode,defeated,clock,alreadyDefeated=false,developer=false){
    if(alreadyDefeated)return false;
    if(developer)return mode==="standard";
    return mode==="standard"&&defeated===ORDINARY_COUNT&&
      Number.isFinite(clock)&&clock>=FINALE_AT;
  }
  function nextName(mode,defeated,number,alreadyDefeated=false){
    if(mode==="standard"){
      if(alreadyDefeated)return "WORLD CONQUERED";
      return STANDARD[Math.min(ORDINARY_COUNT,Math.max(0,Math.floor(Number(defeated)||0)))];
    }
    return STANDARD[ordinaryVariant("endless",Math.max(0,Number(number)||0)+1)];
  }
  // Boss-isolation cooldown must be applied by the runtime immediately after
  // the arena is cleared. Keep timers bounded: no instant catch-up waves.
  function recoveryFloor(mode){
    return mode==="endless"?8:12;
  }
  window.bossFlowSchedule = next;
  window.bossFlowOrdinaryVariant = ordinaryVariant;
  window.bossFlowCanFinale = canFinale;
  window.bossFlowNextName = nextName;
  window.bossFlowRecoveryFloor = recoveryFloor;
  window.bossFlowBossNames = STANDARD;
})();
