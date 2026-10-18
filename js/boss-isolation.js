// Boss Isolation 4.4A — only the Guardian and its own summons enter the arena.
// Clear ordinary enemies without calling damage(): no XP, kills, loot or stats.
// This module is loaded after the game files, before the first run begins.
(() => {
  "use strict";
  let isolated = false;
  let removedOnEntry = 0;
  let removedOnExit = 0;

  function clearEnemies(predicate) {
    let cleared = 0;
    for (const enemy of enemies) {
      if (!predicate(enemy)) continue;
      // Mark stale snapshots dead before filtering, so loops already iterating
      // these objects will not process them later in the same simulation tick.
      enemy.dead = true;
      cleared++;
    }
    enemies = enemies.filter(e => !e.dead);
    rebuildEnemyGrid();
    return cleared;
  }
  function clearArenaProjectiles() {
    // Enemy shots and old boss attacks shouldn't survive the phase boundary.
    enemyShots = [];
    bossShots = [];
    bossHazards = [];
  }
  function begin() {
    if (isolated || boss) return false;
    window.resetGuardianArenaPower?.();
    isolated = true;
    removedOnEntry = clearEnemies(() => true);
    window.resetWorldDefense?.();
    removedOnExit = 0;
    clearArenaProjectiles();
    // Local scars left by the horde must not create unavoidable boss hazards.
    // The persistent world mosaic remains unchanged.
    window.resetWorldScars?.();
    spawn = Math.max(0.65, spawn);
    return true;
  }
  function finish(defeatedBoss = null) {
    if (!isolated) return false;
    window.interruptGuardianArenaPower?.(defeatedBoss);
    window.resetCombatHud?.();
    // Only summons belong to this encounter. The actual boss death is
    // processed by damage(), so this cleanup never awards a second kill.
    removedOnExit = clearEnemies(() => true);
    window.resetWorldDefense?.();
    clearArenaProjectiles();
    window.resetWorldScars?.();
    // Avoid instantly dumping a backlog of enemies after the rewards screen.
    spawn = Math.max(spawn, 0.65);
    // No catch-up wave should begin when the boss reward closes.
    const floor=window.bossFlowRecoveryFloor?.(
      typeof runMode==="string"?runMode:"standard") ?? 12;
    waveTimer = Math.max(waveTimer, floor);
    isolated = false;
    return true;
  }
  function reset() {
    window.resetGuardianArenaPower?.();
    window.resetCombatHud?.();
    isolated = false;
    removedOnEntry = 0;
    removedOnExit = 0;
  }
  function status() {
    return Object.freeze({
      isolated,
      clearedOnEntry: removedOnEntry,
      clearedOnExit: removedOnExit,
      allowedEnemies: isolated ? enemies.filter(e => !e.dead &&
        (e === boss || e.summoned)).length : 0,
    });
  }
  window.beginBossIsolation = begin;
  window.finishBossIsolation = finish;
  window.resetBossIsolation = reset;
  window.bossIsolationStatus = status;
  window.isBossIsolationActive = () => isolated;
})();
