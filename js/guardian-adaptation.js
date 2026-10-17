// World Guardians — the bosses defend the *existing* world, not the
// player's invading element. Phase II and later unlock a telegraphed power.
// Use existing projectile, collision and terrain systems; no boss rewrite.
(() => {
  "use strict";
  const guardians = Object.freeze({
    frozen: { name:"GLACIAL WARD", color:"#a5ecff", radius:205, cooldown:11.5 },
    burning: { name:"EMBER SALVO", color:"#ffab70", radius:240, cooldown:11 },
    flooded: { name:"TIDAL REPULSE", color:"#76ddeb", radius:220, cooldown:12 },
  });
  const isWorld = value => Object.prototype.hasOwnProperty.call(guardians,value);
  function initialize(e, override) {
    if (!e || e.kind !== 3) return false;
    const world = isWorld(override) ? override : window.getDominantWorld?.() || "frozen";
    e.guardianWorld = isWorld(world) ? world : "frozen";
    e.guardianCooldownAt = Infinity;
    e.guardianWarningUntil = 0;
    e.guardianNextAvailable = false;
    e.guardianCastUntil = 0;
    return true;
  }
  function activePhase(e) {
    return !!e && e.kind===3 && !!(e.phaseTwo || (e.isFinalBoss && e.finalPhase>=2));
  }
  function resist(e, type) {
    if (!e || e.kind!==3) return 1;
    if (e.guardianWorld==="frozen" && type==="frost") return .84;
    if (e.guardianWorld==="burning" && ["fire","flame","burn"].includes(type)) return .86;
    if (e.guardianWorld==="flooded" && type==="water") return .86;
    return 1;
  }
  function speed(e, ground) {
    if (!e || e.kind!==3 || !activePhase(e)) return 1;
    if (e.guardianWorld==="frozen" && ground==="frost") return 1.1;
    if (e.guardianWorld==="burning" && ground==="fire") return 1.13;
    if (e.guardianWorld==="flooded" && ground==="water") return 1.26;
    return 1;
  }
  function execute(e, gameTime, player, hooks={}) {
    const world=e.guardianWorld, data=guardians[world];
    if (!data) return;
    e.guardianCastUntil = gameTime + .6;
    const dx=player.x-e.x,dy=player.y-e.y;
    const len=Math.hypot(dx,dy)||1;
    const inRange=len < data.radius + (player.r||0);
    if (world==="frozen") {
      hooks.scar?.("frost",e.x,e.y,155);
      if (inRange) player.guardianChillUntil=Math.max(player.guardianChillUntil||0,gameTime+2);
    } else if (world==="burning") {
      hooks.scar?.("fire",e.x,e.y,150);
      const angle=Math.atan2(dy,dx);
      for(const offset of [-.38,0,.38])
        hooks.projectile?.(e,angle+offset,250,e.isFinalBoss?12:9,"shadow");
    } else if (world==="flooded") {
      hooks.scar?.("water",e.x,e.y,150);
      if (inRange) {
        // Brief directional surge instead of teleporting the player.
        player.guardianTidePushX=(dx/len)*250;
        player.guardianTidePushY=(dy/len)*250;
        player.guardianTidePushUntil=gameTime+.28;
      }
    }
  }
  function tick(e, gameTime, player, hooks={}) {
    if (!activePhase(e) || !isWorld(e.guardianWorld) || !player ||
        !hooks.visible) return false;
    const data=guardians[e.guardianWorld];
    if (!Number.isFinite(e.guardianCooldownAt)) e.guardianCooldownAt=gameTime+4;
    if (e.guardianWarningUntil>0) {
      if (gameTime<e.guardianWarningUntil) return false;
      e.guardianWarningUntil=0;
      execute(e,gameTime,player,hooks);
      e.guardianCooldownAt=gameTime+data.cooldown;
      return true;
    }
    if (gameTime < e.guardianCooldownAt) return false;
    e.guardianWarningUntil=gameTime+1.05;
    e.guardianNextAvailable=true;
    hooks.warn?.("WORLD GUARDIAN · "+data.name,"boss",3);
    return false;
  }
  function drawWarning(e,ctx,gameTime,lowGraphics) {
    const entry=guardians[e?.guardianWorld];
    if (!entry || e.kind!==3 ||
        !(e.guardianWarningUntil>gameTime || e.guardianCastUntil>gameTime)) return;
    const winding=e.guardianWarningUntil>gameTime;
    const pulse= .65+ .2*Math.sin(gameTime*12);
    ctx.save();
    ctx.strokeStyle=entry.color;
    ctx.globalAlpha=winding?pulse:.35;
    ctx.lineWidth=3.1;
    if(!lowGraphics){ctx.shadowBlur=14;ctx.shadowColor=entry.color}
    ctx.setLineDash(winding?[9,7]:[]);
    ctx.beginPath();
    ctx.arc(e.x,e.y,entry.radius,0,Math.PI*2);
    ctx.stroke();
    if(!lowGraphics){
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(e.x,e.y,entry.radius*.55,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }
  window.guardianWorldCatalog=guardians;
  window.initializeGuardianWorld=initialize;
  window.guardianWorldResistance=resist;
  window.guardianWorldSpeed=speed;
  window.updateGuardianWorld=tick;
  window.drawGuardianWorldWarning=drawWarning;
})();
