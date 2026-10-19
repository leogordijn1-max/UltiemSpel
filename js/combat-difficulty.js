// Update 22 — difficulty through readable enemy pressure, not encounter spam.
// Pure configuration: does not schedule, spawn or grant XP.
(() => {
  "use strict";
  const tuning = Object.freeze({
    easy: Object.freeze({
      squadHp: .96, squadDamage: .92, squadSpeed: .96,
      rangedTelegraph: .9, rangedCooldownMin: 5.25, rangedCooldownMax: 7,
      burstTelegraph: 1.16, shieldRaised: 2.6, shieldExposed: 2.5
    }),
    normal: Object.freeze({
      squadHp: 1, squadDamage: 1.12, squadSpeed: 1.06,
      rangedTelegraph: .68, rangedCooldownMin: 3.4, rangedCooldownMax: 4.6,
      burstTelegraph: .95, shieldRaised: 3, shieldExposed: 2
    }),
    nightmare: Object.freeze({
      squadHp: 1.04, squadDamage: 1.19, squadSpeed: 1.1,
      rangedTelegraph: .64, rangedCooldownMin: 4.0, rangedCooldownMax: 5.6,
      burstTelegraph: .86, shieldRaised: 3.15, shieldExposed: 1.9
    })
  });
  // Update 32.1: enemies should grow into a threat without increasing their
  // population or making their early-game first hit unfair.
  function enemyThreatMultiplier(seconds=0,difficulty="normal"){
    if(difficulty==="easy")return 1;
    const progress=Math.max(0,Math.min(1,(Math.max(0,seconds)-300)/1200));
    return 1+progress*(difficulty==="nightmare"?.52:.65);
  }
  // Vitality retains max-HP and gradual recovery but must not replace
  // dodging during a run with only a handful of registered enemy hits.
  function vitalityRegenPerSecond(level=0,secondsSinceHit=Infinity){
    const rank=Math.max(0,Math.min(5,Math.floor(Number(level)||0)));
    if(!rank||secondsSinceHit<3)return 0;
    return .25*(1-Math.pow(.70,rank))/.30;
  }
  // Pursuit pressure raises the chance of CONTACT rather than solely scaling
  // damage. No phantom hits, added enemies or direct damage during dodges.
  function enemyPursuitMultiplier(seconds=0,difficulty="normal",distance=0){
    if(difficulty==="easy")return 1;
    const progress=Math.max(0,Math.min(1,(Math.max(0,seconds)-180)/900));
    const distanceFactor=Math.max(0,Math.min(1,(distance-130)/210));
    return 1+progress*(difficulty==="nightmare"?.48:.38)*
      (.48+.52*distanceFactor);
  }
  function get(difficulty) { return tuning[difficulty] || tuning.normal; }
  function applySquad(enemy,difficulty) {
    if (!enemy || enemy.dead || enemy.kind === 3 || enemy.summoned ||
        enemy.encounterDifficultyApplied) return false;
    const profile = get(difficulty);
    enemy.hp *= profile.squadHp;
    enemy.damage *= profile.squadDamage;
    enemy.speed *= profile.squadSpeed;
    enemy.encounterDifficultyApplied = true;
    return true;
  }
  // Explicit weapon-vs-boss guardrails. Normal-enemy weapon behaviour remains
  // unchanged: crowd-control vs tanks shouldn't trivialize Guardian movement.
  function frostMoveMultiplier(enemy, activeBoss) {
    return enemy && enemy === activeBoss ? .78 : .48;
  }
  function flameOrbitDamageMultiplier(enemy, activeBoss) {
    return enemy && enemy === activeBoss ? .82 : 1;
  }
  window.getCombatDifficultyTuning = get;
  window.enemyThreatMultiplier=enemyThreatMultiplier;
  window.vitalityRegenPerSecond=vitalityRegenPerSecond;
  window.enemyPursuitMultiplier=enemyPursuitMultiplier;
  window.applyCombatDifficultyToSquad = applySquad;
  window.frostMoveMultiplier = frostMoveMultiplier;
  window.flameOrbitDamageMultiplier = flameOrbitDamageMultiplier;
})();
