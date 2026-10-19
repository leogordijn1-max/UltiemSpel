// Encounter pacing 1.0 — fewer disposable enemies, more dangerous small patrols.
// Existing world-defense squads are separate: both share the population budget.
(() => {
  "use strict";
  let running = false, nextPatrol = Infinity, patrols = 0, stage = 0;
  const MAX_LIVE = 30;

  function populationCap(growthSeconds = 0, difficulty = "normal") {
    const time = Math.max(0, Number(growthSeconds) || 0);
    // Survivors face complex teams, not an ever-expanding background horde.
    const base = 20 + Math.min(6, Math.floor(time / 360) * 2);
    // Nightmare challenge comes from the strength and cadence of attacks,
    // never a bigger population budget or hidden catch-up enemy pile.
    const adjustment = difficulty === "easy" ? -3 : 0;
    return Math.min(MAX_LIVE, Math.max(15, base + adjustment));
  }
  // Threat-based soul rewards replace the XP previously earned from horde spam.
  // Tactical enemies take much more effort to defeat, so each kill matters more.
  function xpMultiplier(growthSeconds=0,source="patrol") {
    const elapsed=Math.max(0,Number(growthSeconds)||0);
    if(source==="swarm")return .44;
    // Gentle late-run compensation: a harder squad replaces several old trash
    // spawns, but its rewards should keep the second evolution attainable.
    const late=1+Math.min(.16,Math.max(0,elapsed-600)/900*.16);
    if(source==="wave")return (2.6+Math.min(1.5,elapsed/800))*late;
    if(source==="defense")return (2.0+Math.min(1.5,elapsed/850))*late;
    return (2.8+Math.min(2.0,elapsed/600))*late;
  }
  function ambientInterval(growthSeconds = 0, difficulty = "normal") {
    const time = Math.max(0, Number(growthSeconds) || 0);
    // Ambient spawns become rarer as tactical formations get more demanding.
    if(difficulty==="easy")
      return (7.3+Math.min(3.3,time/550*1.5))*1.18;
    // Constant pressure, even when the last weak enemies die at range.
    // Capped by the live population budget so the game stays performant.
    return Math.max(1.65,2.6-Math.min(.95,time/1300*.95));
  }
  function living(enemies) {
    return Array.isArray(enemies) ? enemies.filter(e => e && !e.dead && e.hp !== 0) : [];
  }
  function groups(enemies) {
    const ids=new Map();
    for(const e of living(enemies)){
      const id=e.defenseSquadId?"defense:"+e.defenseSquadId:
        e.encounterGroup?"patrol:"+e.encounterGroup:null;
      if(id)ids.set(id,(ids.get(id)||0)+1);
    }
    // A single surviving straggler shouldn't lock the next encounter forever.
    return [...ids.values()].filter(size=>size>=2).length;
  }
  function maxGroups(seconds=0) { return seconds>=360?2:1; }
  function ambientLimit(seconds=0,difficulty="normal",enemies=[]) {
    const time=Math.max(0,Number(seconds)||0);
    if(difficulty==="easy"){
      const base=Math.max(4,9-Math.floor(time/180));
      return Math.max(2,Math.min(populationCap(seconds,difficulty)-10,
        base-1-(groups(enemies)>0?3:0)));
    }
    // Preserve a real approaching background during patrols. The global
    // population budget still stops horde/performance explosions.
    const base=10+Math.min(4,Math.floor(time/240));
    return Math.max(6,Math.min(populationCap(seconds,difficulty)-7,base));
  }
  function canStart(enemies,seconds=0,kind="patrol",size=3,difficulty="normal") {
    const alive=living(enemies),count=alive.length,groupCount=groups(alive);
    if(kind==="swarm")return groupCount===0&&count<=8;
    if(groupCount>=maxGroups(seconds))return false;
    if(count+size>populationCap(seconds,difficulty))return false;
    // Hold encounters until most stray enemies have been cleared.
    return count<=12;
  }
  function reset() { running = true; nextPatrol = Infinity; patrols = 0; stage = 0; }
  function clear() { running = false; nextPatrol = Infinity; stage = 0; }
  function patrolCount(growthSeconds) {
    return Math.min(5, 3 + Math.floor(Math.max(0,growthSeconds)/450));
  }
  function spawnPatrol(now, growthSeconds, player, enemies, spawnEnemy,
    difficulty = "normal", sequenceOverride = null) {
    if (!running || !player || typeof spawnEnemy !== "function") return 0;
    const plan=window.chooseTacticalEncounter?.(growthSeconds,
      sequenceOverride??patrols);
    const total=plan?.members?.length || patrolCount(growthSeconds);
    if(!canStart(enemies,growthSeconds,"patrol",total,difficulty))return 0;

    // One tough leader with actual support types, rather than three identical chasers.
    const formations = [[2,1,4,0,6],[6,1,4,0,2],[4,2,1,6,0]];
    const formation = formations[patrols % formations.length];
    const direction = (patrols * 2.399963 + .9) % (Math.PI * 2);
    const distance = Math.max(600,Math.max(player.viewW||0,player.viewH||0)*.65);
    const spawnAt = window.enemyOffscreenSpawn?.(direction, 180);
    const anchorX = spawnAt?.x ?? (player.x + Math.cos(direction)*distance);
    const anchorY = spawnAt?.y ?? (player.y + Math.sin(direction)*distance);
    let added = 0;
    const team=[];
    const tacticGroup=window.newEncounterTacticGroup?.();
    for(let i=0;i<total;i++){
      const member=plan?.members?.[i];
      const preferred=member?.kind ?? formation[i];
      const kind=window.resolveEncounterEnemyKind?.(preferred,growthSeconds,i) ?? preferred;
      const e=spawnEnemy(kind,i===0 && growthSeconds>=480);
      if(!e)break;
      const along=(i-(total-1)/2)*52;
      const position=window.enemyOffscreenSpawn?.(direction,180,along);
      e.x=position?.x ?? (anchorX+Math.cos(direction+Math.PI/2)*along);
      e.y=position?.y ?? (anchorY+Math.sin(direction+Math.PI/2)*along);
      const scale=1.9+Math.min(.95,growthSeconds/1400);
      e.hp*=scale;
      e.speed*=1.18;
      e.damage*=1.26+Math.min(.22,growthSeconds/2100);
      window.applyCombatDifficultyToSquad?.(e, difficulty);
      e.encounterRole="patrol";
      e.xpValueMultiplier=xpMultiplier(growthSeconds,"patrol");
      window.assignEncounterTactic?.(e,i,tacticGroup,member?.tactic);
      // A group identity is needed even if the optional skill module is absent.
      e.encounterGroup ||= tacticGroup || ("director-"+(patrols+1));
      if(plan){e.encounterPlan=plan.name;e.encounterHint=plan.hint;}
      team.push(e);
      // Recheck elemental world affinity after positioning.
      window.initializeEnemyAdaptation?.(e);
      added++;
    }
    if(added){
      window.linkEncounterTacticTeam?.(team);
      patrols++;
      window.notifyEncounterPatrol?.(
        (plan?.name || "PATROL")+" · "+added+" ENEMIES · "+(plan?.hint || "STRONG ENEMIES"));
    }
    return added;
  }
  function update(now,growthSeconds,player,enemies,spawnEnemy,blocked=false,difficulty="normal") {
    if(!running)return 0;
    if(blocked){nextPatrol=Infinity;return 0;}
    if(!Number.isFinite(nextPatrol)){nextPatrol=now+17;return 0;}
    if(now<nextPatrol)return 0;
    // Only one designed confrontation at a time; explicit sandbox spawns
    // still call spawnPatrol directly without the shared rhythm gate.
    if(window.encounterRhythmCanStart?.("patrol",now,enemies)===false){
      nextPatrol=now+6;return 0;
    }
    // Skip missed opportunities rather than dumping packs after a paused boss fight.
    const before=enemies.length;
    const sequence=window.encounterRhythmPlanIndex?.(patrols)??patrols;
    const added=spawnPatrol(now,growthSeconds,player,enemies,spawnEnemy,
      difficulty,sequence);
    if(added>0)window.recordEncounterRhythmSpawn?.(
      "patrol",now,enemies.slice(before),growthSeconds);
    // Retry a blocked encounter once the current pack is defeated; no catch-up burst.
    nextPatrol=now+(added?(difficulty==="easy"
      ?Math.max(25,31-Math.min(5,growthSeconds/300))
      :Math.max(16,20-Math.min(4,growthSeconds/360))):4);
    return added;
  }
  function status(growthSeconds=0,difficulty="normal"){
    return {active:running,patrols,nextPatrol,populationCap:populationCap(growthSeconds,difficulty),
      ambientInterval:ambientInterval(growthSeconds,difficulty)};
  }
  window.resetEncounterPacing=reset;window.clearEncounterPacing=clear;
  window.updateEncounterPacing=update;window.spawnEncounterPatrol=spawnPatrol;
  window.encounterPopulationCap=populationCap;window.encounterAmbientInterval=ambientInterval;
  window.encounterXpMultiplier=xpMultiplier;
  window.encounterAmbientLimit=ambientLimit;window.encounterActiveGroups=groups;
  window.encounterCanStart=canStart;window.encounterMaxGroups=maxGroups;
  window.encounterSwarmLimit=48;
  window.getEncounterPacingStatus=status;
})();