// Living World — adaptive enemy affinities. Runs on the existing enemies and AI.
// Minions and regular spawns share the same rules. Bosses keep their own mechanics.
(() => {
  "use strict";
  const variants = Object.freeze({
    frozen: Object.freeze({ name: "FROSTBOUND", color: "#99e9ff", dark: "#1d536d", description: "Resists frost, travels freely on ice and spreads frost on death." }),
    burning: Object.freeze({ name: "CINDERBORN", color: "#ffad68", dark: "#762f22", description: "Resists fire and burn; fire strengthens its sprint. Some leave embers." }),
    flooded: Object.freeze({ name: "TIDEBORN", color: "#69d9e9", dark: "#174963", description: "Resists water and surges through puddles. Some leave pools." }),
  });
  const valid = id => Object.prototype.hasOwnProperty.call(variants, id);
  // Affinity is a population identity, determined when a run starts.
  // Conquest changes the ground but cannot mutate a defender into an invader.
  // Once victory persists the new dominant world, the NEXT run will inherit it.
  function biomeAt(x, y) {
    const world = window.getDominantWorld?.() || "frozen";
    return valid(world) ? world : "frozen";
  }
  function assign(e, world = biomeAt(e?.x, e?.y)) {
    if (!e || e.kind === 3) return e;
    const value = valid(world) ? world : "frozen";
    if (e.worldAffinity !== value) {
      e.worldAffinity = value;
      // Each variant keeps its own timer between boundary crossings.
      if (e.worldSurgeCooldown === undefined) e.worldSurgeCooldown = 0;
    }
    return e;
  }
  function refresh(e, gameTime, onScreen, sampledBiome) {
    if (!e || e.kind === 3 || e.dead || !onScreen) return;
    if (gameTime < (e.nextBiomeCheck || 0)) return;
    // A deliberately chosen sandbox specimen may showcase a different affinity.
    // Every normal creature keeps its native world, regardless of conquest %.
    const forced = window.isDeveloperRun?.() && valid(e.developerForcedAffinity)
      ? e.developerForcedAffinity : null;
    assign(e, forced || biomeAt(e.x, e.y));
    // Sample 3-4x per second, stagger across enemies using position.
    e.nextBiomeCheck = gameTime + .28 + (Math.abs(e.x*.0027+e.y*.0019)% .12);
  }
  function resistance(e, type) {
    const affinity = e?.worldAffinity;
    if (e?.kind === 3) return 1;
    if (affinity === "frozen" && type === "frost") return .66;
    if (affinity === "burning" && ["fire", "flame", "burn"].includes(type)) return .67;
    if (affinity === "flooded" && type === "water") return .72;
    return 1;
  }
  function groundEffect(e, ground, gameTime, dt) {
    if (!e || e.kind === 3) return 1;
    const affinity = e.worldAffinity;
    const onNativeGround = (affinity === "frozen" && ground === "frost") ||
      (affinity === "burning" && ground === "fire") ||
      (affinity === "flooded" && ground === "water");
    if (affinity === "frozen" && ground === "frost") return 1.42; // Cancels normal ice slowdown and gives a slight edge.
    if (affinity === "burning" && ground === "fire") return e.kind === 1 ? 1.32 : 1.16;
    if (affinity === "flooded" && ground === "water") {
      e.worldSurgeCooldown = Math.max(0, (e.worldSurgeCooldown || 0) - dt);
      if (e.worldSurgeCooldown <= 0 && !e.armed) {
        e.worldSurgeUntil = gameTime + .65;
        e.worldSurgeCooldown = 5.5;
      }
      return e.worldSurgeUntil > gameTime ? 1.65 : 1.28;
    }
    if (!onNativeGround) e.worldSurgeUntil = Math.min(e.worldSurgeUntil || 0, gameTime);
    return 1;
  }
  // Lightweight terrain-aware steering, not full pathfinding. A subset of
  // visible enemies checks two flanks at most twice a second. Never applied
  // to bosses, exploding Burstlings or telegraphed elite charges.
  function terrainSteer(e, heading, onScreen, playerDistanceSquared, gameTime) {
    if (!e || !onScreen || ![1,2,4,6].includes(e.kind) || e.dead ||
        e.eliteChargeWarning > 0 || e.eliteChargeActive > 0 ||
        (e.kind === 4 && e.shotWarning > 0)) return heading;
    if (playerDistanceSquared < 135*135) return heading;
    if (gameTime >= (e.nextTerrainDecision || 0)) {
      e.nextTerrainDecision = gameTime + .48 + (Math.abs(e.x*.0019+e.y*.0021) % .16);
      const desired = {frozen:"frost",burning:"fire",flooded:"water"}[e.worldAffinity];
      if (!desired) {e.terrainTurn=0;return heading;}
      const nativeAt=(angle)=>{
        const x=e.x+Math.cos(angle)*125, y=e.y+Math.sin(angle)*125;
        const scar=window.terrainAt?.(x,y);
        const world=window.worldBiomeAt?.(x,y) || e.worldAffinity;
        const ground=scar || ({frozen:"frost",burning:"fire",flooded:"water"}[world]);
        return ground===desired;
      };
      // Favor a native patch only if it is visible one step away; avoid
      // constant zigzagging when the world is uniform.
      e.terrainTurn=0;
      if (!nativeAt(heading)) {
        const left=nativeAt(heading-.62),right=nativeAt(heading+.62);
        if (left || right) e.terrainTurn=left && right
          ? ((Math.floor(e.x+e.y)&1) ? -.62:.62)
          : left ? -.62 : .62;
      }
    }
    return heading + (e.terrainTurn || 0);
  }
  function onDeath(e) {
    if (!e || e.kind === 3 || !e.worldAffinity || e.summoned || e.noXp) return;
    // Only heavy or elite enemies leave lingering terrain. No chain reaction
    // from already-dead enemies; terrain writes have a bounded 140-mark budget.
    if (e.kind !== 2 && e.kind !== 6 && !e.elite) return;
    const scar = { frozen: "frost", burning: "fire", flooded: "water" }[e.worldAffinity];
    if (scar) window.addWorldScar?.(scar, e.x, e.y, 105);
  }
  function drawAura(e, ctx, gameTime, quality) {
    const entry = variants[e?.worldAffinity];
    if (!entry || e.kind === 3) return;
    const r = Math.max(11, e.r * 1.1) + 5;
    ctx.save();
    ctx.strokeStyle = entry.color;
    ctx.lineWidth = quality === "low" ? 1.6 : 2.3;
    ctx.globalAlpha = .52;
    // One cheap ring on low quality, even with hundreds of visible enemies.
    if (quality === "low") {
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (quality === "high") {
      ctx.shadowColor = entry.color;
      ctx.shadowBlur = 9;
    }
    ctx.beginPath();
    if (e.worldAffinity === "frozen") {
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const x = e.x + Math.cos(angle) * r, y = e.y + Math.sin(angle) * r;
        ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4);
        ctx.moveTo(x - 4, y + 4); ctx.lineTo(x + 4, y - 4);
      }
    } else if (e.worldAffinity === "burning") {
      ctx.arc(e.x, e.y, r + Math.sin(gameTime * 4 + e.x) * 1.4, -.3, 2.6);
      ctx.moveTo(e.x - r*.4, e.y - r*1.3);
      ctx.lineTo(e.x, e.y - r*1.7);
      ctx.lineTo(e.x + r*.28, e.y - r*1.3);
    } else {
      ctx.ellipse(e.x, e.y, r*1.15, r*.6, 0, 0, Math.PI*2);
      ctx.moveTo(e.x-r*.5, e.y+r*.8);
      ctx.quadraticCurveTo(e.x, e.y+r*1.15, e.x+r*.5,e.y+r*.8);
    }
    ctx.stroke();
    ctx.restore();
  }
  window.enemyWorldVariants = variants;
  window.enemyWorldBiomeAt = biomeAt;
  window.initializeEnemyAdaptation = assign;
  window.refreshEnemyAdaptation = refresh;
  window.enemyWorldResistance = resistance;
  window.enemyWorldMovement = groundEffect;
  window.enemyTerrainSteer = terrainSteer;
  window.enemyWorldOnDeath = onDeath;
  window.drawEnemyWorldAura = drawAura;
})();
