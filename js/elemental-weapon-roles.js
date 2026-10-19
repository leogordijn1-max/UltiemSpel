// Update 38 — nine elemental weapons, four physical enemy roles.
// Pure, bounded damage specialties. The shield's directional block, Anchor
// resistance, Phase Stalker exposure and enemy archetype weaknesses still
// apply independently. No artificial player damage, spawns, XP or auto-heals.
(() => {
  "use strict";
  const ROLE_DAMAGE = Object.freeze({
    flame:        Object.freeze({regular:1, runner:1.08, heavy:.97, shield:.95}),
    fireball:     Object.freeze({regular:1, runner:.94, heavy:1.12, shield:1.05}),
    flameOrbit:   Object.freeze({regular:1, runner:1.08, heavy:.98, shield:1.08}),
    waterBolt:    Object.freeze({regular:1, runner:.94, heavy:.82, shield:.86}),
    tidalWave:    Object.freeze({regular:1, runner:1.12, heavy:.90, shield:.95}),
    whirlpool:    Object.freeze({regular:1, runner:.93, heavy:1.08, shield:1.05}),
    frost:        Object.freeze({regular:1, runner:1.04, heavy:.90, shield:.90}),
    iceShards:    Object.freeze({regular:1, runner:1.08, heavy:1.06, shield:.93}),
    glacialPulse: Object.freeze({regular:1, runner:1.00, heavy:1.12, shield:1.02})
  });
  const LOADOUTS = Object.freeze({
    fire:Object.freeze(["flame","fireball","flameOrbit"]),
    water:Object.freeze(["waterBolt","tidalWave","whirlpool"]),
    frost:Object.freeze(["frost","iceShards","glacialPulse"])
  });
  function roleOf(enemy){
    if(!enemy || enemy.dead || enemy.kind===3 || enemy.isFinalBoss || enemy.summoned)
      return "excluded";
    if(enemy.kind===2 || enemy.counterRole==="anchor")return "heavy";
    if(enemy.kind===6 || enemy.counterRole==="warden")return "shield";
    if(enemy.kind===1 || enemy.counterRole==="phaseStalker")return "runner";
    return "regular"; // Drifter, Burstling and Ranged Shade
  }
  function damageFactor(enemy,weapon){
    const role=roleOf(enemy);
    if(role==="excluded")return 1;
    return ROLE_DAMAGE[weapon]?.[role] ?? 1;
  }
  function frostOrbChillDuration(level=1,evolved=false,enemy={},now=0){
    const rank=Math.max(1,Math.min(5,Math.floor(Number(level)||1)));
    const base=2.0 + .14*rank + (evolved?.5:0);
    // Repeat chill on the same target has diminishing control, never an
    // indefinite permanent slow at max casting rate.
    return (enemy.frostOrbResistUntil||0)>now ? base*.55 : base;
  }
  function frostSlowFactor(enemy,activeBoss,now=0){
    if(enemy===activeBoss || enemy?.kind===3)return .78;
    if((enemy?.frostOtherUntil||0)>now)return .48; // Ice Shards/Pulse retain own control.
    if((enemy?.frostOrbChillUntil||0)>now)return .70;
    return .48;
  }
  window.elementalRoleDamageMultiplier=damageFactor;
  window.elementalEnemyRole=roleOf;
  window.elementalWeaponProfiles=ROLE_DAMAGE;
  window.elementalWeaponLoadouts=LOADOUTS;
  window.frostOrbChillDuration=frostOrbChillDuration;
  window.frostSlowFactor=frostSlowFactor;
})();
