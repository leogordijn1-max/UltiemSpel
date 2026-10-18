// Encounter pacing 1.0 — fewer disposable enemies, more dangerous small patrols.
// Existing world-defense squads are separate: both share the population budget.
(() => {
  "use strict";
  let running = false, nextPatrol = Infinity, patrols = 0, stage = 0;
  const MAX_LIVE = 62;

  function populationCap(growthSeconds = 0, difficulty = "normal") {
    const time = Math.max(0, Number(growthSeconds) || 0);
    const base = 28 + Math.min(26, Math.floor(time / 240) * 4);
    const adjustment = difficulty === "nightmare" ? 8 : difficulty === "easy" ? -4 : 0;
    return Math.min(MAX_LIVE, Math.max(20, base + adjustment));
  }
  function ambientInterval(growthSeconds = 0, difficulty = "normal") {
    const time = Math.max(0, Number(growthSeconds) || 0);
    const base = Math.max(4.4, 7.3 - time * .002);
    return base * (difficulty === "nightmare" ? .88 : difficulty === "easy" ? 1.18 : 1);
  }
  function reset() { running = true; nextPatrol = Infinity; patrols = 0; stage = 0; }
  function clear() { running = false; nextPatrol = Infinity; stage = 0; }
  function patrolCount(growthSeconds) {
    return Math.min(5, 3 + Math.floor(Math.max(0,growthSeconds)/450));
  }
  function spawnPatrol(now, growthSeconds, player, enemies, spawnEnemy, difficulty = "normal") {
    if (!running || !player || typeof spawnEnemy !== "function") return 0;
    const cap = populationCap(growthSeconds, difficulty);
    const remaining = cap - enemies.filter(e => !e.dead).length;
    const total = Math.min(patrolCount(growthSeconds), remaining);
    if (total <= 0) return 0;

    // One tough leader with actual support types, rather than three identical chasers.
    const formations = [[2,1,4,0,6],[6,1,4,0,2],[4,2,1,6,0]];
    const formation = formations[patrols % formations.length];
    const direction = (patrols * 2.399963 + .9) % (Math.PI * 2);
    const distance = Math.max(600,Math.max(player.viewW||0,player.viewH||0)*.65);
    const anchorX = player.x + Math.cos(direction)*distance;
    const anchorY = player.y + Math.sin(direction)*distance;
    let added = 0;
    const tacticGroup=window.newEncounterTacticGroup?.();
    for(let i=0;i<total;i++){
      const preferred=formation[i];
      const kind=window.resolveEncounterEnemyKind?.(preferred,growthSeconds,i) ?? preferred;
      const e=spawnEnemy(kind,i===0 && growthSeconds>=480);
      if(!e)break;
      e.x=anchorX+Math.cos(direction+Math.PI/2)*(i-(total-1)/2)*52;
      e.y=anchorY+Math.sin(direction+Math.PI/2)*(i-(total-1)/2)*52;
      const scale=1.65+Math.min(.85,growthSeconds/1400);
      e.hp*=scale;
      e.speed*=1.03;
      e.damage*=1.13+Math.min(.18,growthSeconds/2100);
      e.encounterRole="patrol";
      e.xpValueMultiplier=2.15;
      window.assignEncounterTactic?.(e,i,tacticGroup);
      // Recheck elemental world affinity after positioning.
      window.initializeEnemyAdaptation?.(e);
      added++;
    }
    if(added){patrols++;window.notifyEncounterPatrol?.("PATROL · "+added+" ELITE DEFENDERS");}
    return added;
  }
  function update(now,growthSeconds,player,enemies,spawnEnemy,blocked=false,difficulty="normal") {
    if(!running)return 0;
    if(blocked){nextPatrol=Infinity;return 0;}
    if(!Number.isFinite(nextPatrol)){nextPatrol=now+17;return 0;}
    if(now<nextPatrol)return 0;
    // Skip missed opportunities rather than dumping packs after a paused boss fight.
    nextPatrol=now+Math.max(19,26-Math.min(6,growthSeconds/260));
    return spawnPatrol(now,growthSeconds,player,enemies,spawnEnemy,difficulty);
  }
  function status(growthSeconds=0,difficulty="normal"){
    return {active:running,patrols,nextPatrol,populationCap:populationCap(growthSeconds,difficulty),
      ambientInterval:ambientInterval(growthSeconds,difficulty)};
  }
  window.resetEncounterPacing=reset;window.clearEncounterPacing=clear;
  window.updateEncounterPacing=update;window.spawnEncounterPatrol=spawnPatrol;
  window.encounterPopulationCap=populationCap;window.encounterAmbientInterval=ambientInterval;
  window.getEncounterPacingStatus=status;
})();