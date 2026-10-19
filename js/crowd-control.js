// Update 32 — one resistance model for all physical push / pull sources.
// Strong Water builds remain fun, but cannot pin heavy defenders forever.
// Only movement changes: this module never suppresses hits, damage or XP.
(() => {
  "use strict";
  function resistance(enemy, source="generic", now=0) {
    if(!enemy || enemy.dead)return 0;
    const kind=enemy.kind;
    // A visually huge enemy anchors its feet. The boss and the Bulwark
    // also resist push, but neither is immune to the weapon's damage.
    const baseline=kind===3?.10:kind===2?.12:
      kind===6?.55:enemy.elite?.55:1;
    let multiplier=baseline;
    if(source==="waterHit")multiplier*=.80;
    if(source==="waterBolt"){
      multiplier*=.70;
      // Diminishing *additional* Water Bolt recoil when rapid casting
      // hits the same target; normal damage / Water status are untouched.
      if(Number.isFinite(now) && now<(enemy.waterBoltRecoilUntil||0))
        multiplier*=.42;
    }
    if(source==="tidalWave")multiplier*=.85;
    return Math.max(0,Math.min(1,multiplier));
  }
  function push(enemy,x,y,source="generic",now=0){
    if(!enemy || enemy.dead || !Number.isFinite(x) ||
       !Number.isFinite(y))return false;
    const strength=resistance(enemy,source,now);
    enemy.knockbackX=(enemy.knockbackX||0)+x*strength;
    enemy.knockbackY=(enemy.knockbackY||0)+y*strength;
    if(source==="waterBolt" && Number.isFinite(now))
      enemy.waterBoltRecoilUntil=now+.9;
    return strength>0;
  }
  window.enemyCrowdControlResistance=resistance;
  window.applyEnemyCrowdControl=push;
})();
