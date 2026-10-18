// Enemy creation, combat effects and boss encounter health.
const difficultyProfiles = {
  easy: {
    enemyHealth: 0.8,
    enemyDamage: 0.82,
    spawnRate: 0.82,
    xpReward: 1.05,
    healthDropChance: 0.18,
    bossHealth: 0.85,
  },
  normal: {
    enemyHealth: 1,
    enemyDamage: 1,
    spawnRate: 1,
    xpReward: 1,
    healthDropChance: 0.15,
    bossHealth: 1,
  },
  nightmare: {
    enemyHealth: 1.28,
    enemyDamage: 1.18,
    spawnRate: 1.18,
    xpReward: 1.1,
    healthDropChance: 0.1,
    bossHealth: 1.2,
  },
};

const enemyCatalog = [
  { name: "Drifter", image: "", hp: "20 + time scaling", damage: "8 + time scaling", speed: "43–63 + time scaling", ability: "Moves toward the player.", xp: "1 soul" },
  { name: "Runner", image: "", hp: "55% of Drifter", damage: "6 + time scaling", speed: "1.85× Drifter", ability: "Fast, low-health melee attacker.", xp: "0.8 soul" },
  { name: "Zombie Mike", image: "img/ZombieMike.png", hp: "4× Drifter", damage: "14 + time scaling", speed: "0.7× Drifter", ability: "Large tank enemy.", xp: "5 souls" },
  { name: "Ranged Shade", image: "", hp: "Drifter base", damage: "6 + ranged orb", speed: "34–42 + time scaling", ability: "Keeps distance, warns before shooting and fires moderately homing orbs.", xp: "2 souls" },
  { name: "Burstling", image: "", hp: "70% of Drifter", damage: "Area blast on detonation", speed: "1.25× Drifter", ability: "Stops near the player, flashes a warning circle, then explodes. Can be killed first.", xp: "1.6 souls" },
  { name: "Bulwark", image: "", hp: "3× Drifter", damage: "11 + time scaling", speed: "0.75× Drifter", ability: "Alternates between shielded and vulnerable phases.", xp: "3 souls" },
];
const bossCatalog = [
  { name: "Beau de Hond", image: "img/BeauDeHond.png", attacks: "MarioVis shotgun and targeted charge; Hunting Grounds triple rush and Pincer Ambush fish crossfire and delayed blast corridor.", phase: "Phase II unlocks signature chains. Below 33% HP, The Final Hunt darkens the arena with three hunts and a massive finale." },
  { name: "The Mourning Shade", image: "", attacks: "Shadow Collapse ring salvos and Phantom Execution rotating execution seals with changing escape routes.", phase: "Phase II unlocks multi-beat specials; below 33% HP Eternal Eclipse darkens the arena for three marked strikes." },
  { name: "The Bell Tower", image: "", attacks: "Resonant Sweep threatens five changing lanes; Clockwork Judgment forms rotating chime seals with gaps.", phase: "In phase III, The Grand Peal darkens the arena and delivers four escalating marked strikes." },
  { name: "The Last Meme", image: "", attacks: "Final encounter: Reality Scissors lane cuts and Broken Orbit rotating seals.", phase: "Three phases culminating in The End of Everything four-wave cinematic ultimate. Appears around minute 25 in Standard Mode." },
];

const ENEMY_GRID_SIZE = 140;
function rebuildEnemyGrid() {
  enemyGrid = new Map();
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const cellX = Math.floor(enemy.x / ENEMY_GRID_SIZE);
    const cellY = Math.floor(enemy.y / ENEMY_GRID_SIZE);
    const key = `${cellX},${cellY}`;
    if (!enemyGrid.has(key)) enemyGrid.set(key, []);
    enemyGrid.get(key).push(enemy);
  }
}

function nearbyEnemies(x, y, radius) {
  const found = [];
  const radiusSquared = radius * radius;
  if (radius > ENEMY_GRID_SIZE * 3) {
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - x, dy = enemy.y - y;
      if (dx * dx + dy * dy <= radiusSquared) found.push(enemy);
    }
    return found;
  }
  const minX = Math.floor((x - radius) / ENEMY_GRID_SIZE);
  const maxX = Math.floor((x + radius) / ENEMY_GRID_SIZE);
  const minY = Math.floor((y - radius) / ENEMY_GRID_SIZE);
  const maxY = Math.floor((y + radius) / ENEMY_GRID_SIZE);
  for (let cellX = minX; cellX <= maxX; cellX++) {
    for (let cellY = minY; cellY <= maxY; cellY++) {
      for (const enemy of enemyGrid.get(`${cellX},${cellY}`) || []) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        if (!enemy.dead && dx * dx + dy * dy <= radiusSquared) found.push(enemy);
      }
    }
  }
  return found;
}

// Select nearest targets without allocating or sorting a full candidate list.
function nearestEnemy(x, y, radius = 1500, excluded = null, include = null) {
  let closest = null;
  let closestSquared = radius * radius;
  if (radius > ENEMY_GRID_SIZE * 3) {
    for (const enemy of enemies) {
      if (enemy.dead || excluded?.has(enemy) || (include && !include(enemy))) continue;
      const dx = enemy.x - x, dy = enemy.y - y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < closestSquared) { closest = enemy; closestSquared = distanceSquared; }
    }
    return closest;
  }
  const minX = Math.floor((x - radius) / ENEMY_GRID_SIZE);
  const maxX = Math.floor((x + radius) / ENEMY_GRID_SIZE);
  const minY = Math.floor((y - radius) / ENEMY_GRID_SIZE);
  const maxY = Math.floor((y + radius) / ENEMY_GRID_SIZE);
  for (let cellX = minX; cellX <= maxX; cellX++) {
    for (let cellY = minY; cellY <= maxY; cellY++) {
      for (const enemy of enemyGrid.get(`${cellX},${cellY}`) || []) {
        if (enemy.dead || excluded?.has(enemy) || (include && !include(enemy))) continue;
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < closestSquared) { closest = enemy; closestSquared = distanceSquared; }
      }
    }
  }
  return closest;
}

function nearestEnemies(x, y, radius, limit, include = null) {
  const closest = [];
  const distances = [];
  const radiusSquared = radius * radius;
  const minX = Math.floor((x - radius) / ENEMY_GRID_SIZE);
  const maxX = Math.floor((x + radius) / ENEMY_GRID_SIZE);
  const minY = Math.floor((y - radius) / ENEMY_GRID_SIZE);
  const maxY = Math.floor((y + radius) / ENEMY_GRID_SIZE);
  if (radius > ENEMY_GRID_SIZE * 3) {
    for (const enemy of enemies) {
      if (enemy.dead || (include && !include(enemy))) continue;
      const dx = enemy.x - x, dy = enemy.y - y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared > radiusSquared) continue;
      let index = 0;
      while (index < distances.length && distances[index] <= distanceSquared) index++;
      if (index >= limit) continue;
      distances.splice(index, 0, distanceSquared);
      closest.splice(index, 0, enemy);
      if (closest.length > limit) { closest.pop(); distances.pop(); }
    }
    return closest;
  }
  for (let cellX = minX; cellX <= maxX; cellX++) {
    for (let cellY = minY; cellY <= maxY; cellY++) {
      for (const enemy of enemyGrid.get(`${cellX},${cellY}`) || []) {
        if (enemy.dead || (include && !include(enemy))) continue;
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > radiusSquared) continue;
        let index = 0;
        while (index < distances.length && distances[index] <= distanceSquared) index++;
        if (index >= limit) continue;
        distances.splice(index, 0, distanceSquared);
        closest.splice(index, 0, enemy);
        if (closest.length > limit) { closest.pop(); distances.pop(); }
      }
    }
  }
  return closest;
}

const FINAL_BOSS_TIME = 25 * 60;
function currentEndlessTier() {
  if (typeof runMode === "undefined" || runMode !== "endless" || typeof time !== "number") return 0;
  const startingAt = Math.max(FINAL_BOSS_TIME, typeof endlessStartTime === "number" ? endlessStartTime : 0);
  return Math.min(16, Math.floor(Math.max(0, time - startingAt) / 120));
}

// Special waves can request a type; ordinary spawns retain a mixed distribution.
function enemySpawn(preferredKind = null, forceElite = false) {
  // Only the boss itself may summon enemies during an isolated encounter.
  if (boss || window.isBossIsolationActive?.()) return null;
  const angle = rand(0, Math.PI * 2);
  const distance = Math.max(W, H) * 0.72;
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  const roll = Math.random();
  const kind = Number.isInteger(preferredKind) ? preferredKind
    : roll < Math.min(0.32, growthTime / 200) ? 1
    : roll > 0.96 ? 2
    : roll > 0.89 ? 4
    : growthTime >= 480 && roll > 0.85 ? 6
    : growthTime >= 240 && roll > 0.81 ? 5 : 0;
  const e = {
    x: player.x + Math.cos(angle) * distance,
    y: player.y + Math.sin(angle) * distance,
    r: 13,
    hp: (20 + growthTime * 0.08) * profile.enemyHealth,
    speed: rand(43, 63) + growthTime * 0.06,
    damage: 8,
    kind,
    hit: 0,
    knockbackX: 0,
    knockbackY: 0,
    noXp: !!boss,
  };
  if (kind === 1) {
    e.r = 10; e.hp *= 0.55; e.speed *= 1.85; e.damage = 6;
  } else if (kind === 2) {
    e.r = 35; e.hp *= 4; e.speed *= 0.7; e.damage = 14;
  } else if (kind === 4) {
    e.r = 15; e.speed = rand(34, 42) + growthTime * 0.025;
    e.damage = 6; e.shootCooldown = rand(2.6, 4.2); e.shotWarning = 0;
  } else if (kind === 5) {
    e.r = 12; e.hp *= 0.7; e.speed *= 1.25; e.damage = 16;
    e.burstWarning = 0; e.burstRadius = 86; e.armed = false;
  } else if (kind === 6) {
    e.r = 24; e.hp *= 3; e.speed *= 0.75; e.damage = 11;
    e.guardTimer = 3; e.shieldActive = true;
  }
  e.damage = (e.damage + growthTime * 0.004) * profile.enemyDamage;
  const tier = currentEndlessTier();
  if (tier) {
    e.hp *= 1 + tier * 0.17;
    e.damage *= 1 + tier * 0.065;
    e.speed *= 1 + Math.min(0.3, tier * 0.022);
  }
  if (forceElite || Math.random() < Math.min(0.18, 0.02 + growthTime / 12000 + tier * 0.007)) {
    makeEliteEnemy(e);
  }
  // Adaptation is determined by the actual world patch at the spawn point.
  window.initializeEnemyAdaptation?.(e);
  enemies.push(e);
  if (typeof trackDiscovery === "function") {
    const seen = typeof enemyDiscoveryId === "function" ? enemyDiscoveryId(e.kind) : null;
    if (seen) trackDiscovery("enemies", seen);
  }
  return e;
}

// Elites receive distinct gameplay traits, not just scaled stats.
function makeEliteEnemy(e) {
  if (e.elite) return e;
  e.elite = true;
  e.hp *= 2.0;
  e.damage *= 1.28;
  e.speed *= 1.06;
  // Chargers only apply to melee enemies; ranged elites use armor or bursts.
  const options = e.kind === 4 || e.kind === 5 ? ["armored", "swift"] : ["charger", "armored", "swift"];
  e.eliteTrait = options[Math.floor(Math.random() * options.length)];
  if (e.eliteTrait === "charger") {
    e.eliteChargeCooldown = 5.5; e.eliteChargeWarning = 0; e.eliteChargeActive = 0;
  } else if (e.eliteTrait === "swift") {
    e.eliteSprintTimer = 2.2; e.eliteSprintActive = 0;
  }
  return e;
}

// Three tactical waves followed by a rare rush of fragile enemies.
// Small patrol waves have fewer, sturdier enemies with greater soul rewards.
const wavePatterns = [
  { name: "HARDENED PATROL", kinds: [0, 2, 1, 4, 0], elite: true },
  { name: "SHIELD ESCORT", kinds: [6, 0, 4, 1, 2], elite: true },
  { name: "HUNTER PINCER", kinds: [1, 1, 4, 2, 6], elite: true },
];
const swarmPattern = { name: "SWARM · SMALL ENEMIES", kinds: [0,1,0,1,1,0], swarm: true };
function wavePatternFor(number) {
  const index = Math.max(1,Math.floor(number));
  return index % 4 === 0 ? swarmPattern : wavePatterns[(index - 1) % wavePatterns.length];
}
function spawnSpecialWave(number, cap = 95) {
  // Defensive guard: even swarm waves never enter a boss arena.
  if (boss || window.isBossIsolationActive?.())
    return { name: "BOSS ARENA · WAVES PAUSED", spawned: 0, pattern: null };
  const pattern = wavePatternFor(number);
  const swarm = !!pattern.swarm;
  const waveSize = swarm
    ? Math.min(42, 26 + Math.floor(number * 1.2))
    : Math.min(8, 4 + Math.floor(number / 3));
  // A swarm can temporarily exceed the normal ambient cap, but not this hard limit.
  const hardCap = Math.min(95, Math.max(0,cap));
  let spawned = 0;
  const waveAngle = (number * 2.399963) % (Math.PI * 2);
  const distance = Math.max(W,H) * .68;
  const centerX = player.x + Math.cos(waveAngle) * distance;
  const centerY = player.y + Math.sin(waveAngle) * distance;
  for (let i = 0; i < waveSize && enemies.length < hardCap; i++) {
    const kind = pattern.kinds[i % pattern.kinds.length];
    const e = enemySpawn(kind, !swarm && (i === 0 || (number >= 6 && i === 3)));
    if (!e) break;
    if (swarm) {
      // Three loosely separated entry lanes, no single giant overlapping blob.
      const lane = i % 3;
      const angle = waveAngle + (lane - 1) * .5;
      const radius = distance + Math.floor(i / 3) * 9;
      e.x = player.x + Math.cos(angle)*radius;
      e.y = player.y + Math.sin(angle)*radius;
      e.hp *= .46;e.damage *= .7;e.speed *= 1.1;
      e.xpValueMultiplier = .44;
      e.encounterRole = "swarm";
    } else {
      const spread = (i-(waveSize-1)/2)*58;
      e.x = centerX - Math.sin(waveAngle)*spread;
      e.y = centerY + Math.cos(waveAngle)*spread;
      e.hp *= 1.45 + Math.min(.65,number*.06);
      e.damage *= 1.12 + Math.min(.22,number*.02);
      e.xpValueMultiplier = 1.9;
      e.encounterRole = "patrol";
    }
    window.initializeEnemyAdaptation?.(e);
    spawned++;
  }
  return { name: pattern.name, spawned, pattern };
}

// Shared spatial hash resolution for pickup storage and merging.
const GEM_GRID_SIZE = 120;

function gemCellKey(x, y) {
  return `${Math.floor(x / GEM_GRID_SIZE)},${Math.floor(y / GEM_GRID_SIZE)}`;
}

function addGemToGrid(gem) {
  const key = gemCellKey(gem.x, gem.y);
  let cell = gemGrid.get(key);
  if (!cell) gemGrid.set(key, (cell = []));
  cell.push(gem);
  gem.gridKey = key;
}

function removeGemFromGrid(gem) {
  const cell = gemGrid.get(gem.gridKey || gemCellKey(gem.x, gem.y));
  if (!cell) return;
  const index = cell.indexOf(gem);
  if (index >= 0) {
    const last = cell.pop();
    if (index < cell.length) cell[index] = last;
  }
  if (!cell.length) gemGrid.delete(gem.gridKey);
  gem.gridKey = null;
}

function updateGemGridPosition(gem, oldX, oldY) {
  const nextKey = gemCellKey(gem.x, gem.y);
  if (nextKey === (gem.gridKey || gemCellKey(oldX, oldY))) return;
  removeGemFromGrid(gem);
  addGemToGrid(gem);
}

function nearbyGems(x, y, radius) {
  const found = [];
  const minX = Math.floor((x - radius) / GEM_GRID_SIZE), maxX = Math.floor((x + radius) / GEM_GRID_SIZE);
  const minY = Math.floor((y - radius) / GEM_GRID_SIZE), maxY = Math.floor((y + radius) / GEM_GRID_SIZE);
  const radiusSquared = radius * radius;
  for (let cellX = minX; cellX <= maxX; cellX++) {
    for (let cellY = minY; cellY <= maxY; cellY++) {
      for (const gem of gemGrid.get(`${cellX},${cellY}`) || []) {
        const dx = gem.x - x, dy = gem.y - y;
        if (!gem.dead && dx * dx + dy * dy <= radiusSquared) found.push(gem);
      }
    }
  }
  return found;
}

function dropGem(gem) {
  // Merge nearby XP of the same tier; summed value remains exact, health drops stay separate.
  if (gem.kind !== "health") {
    const mergeRadiusSquared = 34 * 34;
    const cellX = Math.floor(gem.x / GEM_GRID_SIZE), cellY = Math.floor(gem.y / GEM_GRID_SIZE);
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        for (const existing of gemGrid.get(`${x},${y}`) || []) {
          if (existing.dead || existing.kind !== gem.kind) continue;
          const dx = existing.x - gem.x, dy = existing.y - gem.y;
          if (dx * dx + dy * dy > mergeRadiusSquared) continue;
          const oldX = existing.x, oldY = existing.y;
          const combinedValue = existing.value + gem.value;
          existing.x = (existing.x * existing.value + gem.x * gem.value) / combinedValue;
          existing.y = (existing.y * existing.value + gem.y * gem.value) / combinedValue;
          existing.value = combinedValue;
          existing.r = Math.min(18, Math.sqrt(existing.r * existing.r + gem.r * gem.r * 0.32));
          updateGemGridPosition(existing, oldX, oldY);
          return existing;
        }
      }
    }
  }
  gems.push(gem);
  addGemToGrid(gem);
  return gem;
}

function puff(x, y, color, n = 8) {
  const quality = typeof graphicsQuality === "undefined" ? "high" : graphicsQuality;
  const particleLimit = quality === "low" ? 260 : quality === "medium" ? 420 : 600;
  const particleCount = Math.min(n, Math.max(0, particleLimit - particles.length));
  for (let i = 0; i < particleCount; i++)
    particles.push({
      x,
      y,
      vx: rand(-110, 110),
      vy: rand(-110, 110),
      life: rand(0.2, 0.65),
      max: 0.65,
      color,
      r: rand(2, 5),
    });
}

function damage(e, d, origin = player, damageType = "direct") {
  if (!e || e.dead) return;

  const critical =
    (upgrades.critChance || 0) > 0 &&
    Math.random() < (upgrades.critChance || 0) * 0.05;
  const criticalMultiplier = 1.5 + (upgrades.critDamage || 0) * 0.25 + Math.max(0, (upgrades.critChance || 0) - 2) * 0.05;
  const slowedAreaBonus = e.impactSlowUntil > time && (damageType === "bomb" || damageType === "flame" || damageType === "frost" || damageType === "pulse") ? 1.15 : 1;
  const elementalBonus = damageType === "flame" && e.frostUntil > time || damageType === "frost" && e.burnUntil > time ? 1.2 : 1;
  const defense = (e.kind === 6 && e.shieldActive ? 0.67 : 1) * (e.eliteTrait === "armored" ? 0.82 : 1);
  const worldResistance = window.enemyWorldResistance?.(e, damageType) ?? 1;
  const guardianResistance = window.guardianWorldResistance?.(e, damageType) ?? 1;
  const finalDamage = d * (critical ? criticalMultiplier : 1) * slowedAreaBonus * elementalBonus * defense * worldResistance * guardianResistance * (window.worldDefenseDamageMultiplier?.(e) ?? 1) * (window.bossCombatDamageMultiplier?.(e, time) ?? 1);
  const effectiveDamage = Math.min(Math.max(0, e.hp), Math.max(0, finalDamage));
  e.hp -= finalDamage;
  if (typeof runStats !== "undefined" && typeof recordDamage === "function") {
    recordDamage(runStats, effectiveDamage, damageType, origin, critical);
  }
  e.hit = 0.12;

  // Tanks and bosses resist knockback; regular enemies are easier to push away.
  const knockbackX = e.x - origin.x;
  const knockbackY = e.y - origin.y;
  const knockbackLength = Math.hypot(knockbackX, knockbackY);
  if (knockbackLength > 0) {
    const resistance =
      e.kind === 3 ? 0.12 : e.kind === 2 ? 0.45 : e.elite ? 0.6 : 1;
    const force = 145 * resistance * (1 + (upgrades.knockback || 0) * 0.25);
    e.knockbackX = (e.knockbackX || 0) + (knockbackX / knockbackLength) * force;
    e.knockbackY = (e.knockbackY || 0) + (knockbackY / knockbackLength) * force;
    if (upgrades.knockback >= 3 && e.kind !== 3) {
      e.impactSlowUntil = Math.max(e.impactSlowUntil || 0, time + 0.25 + (upgrades.knockback - 2) * 0.12);
    }
  }

  if (e === boss) {
    $("bossFill").style.width = (100 * Math.max(0, e.hp)) / e.maxHp + "%";
  }
  if (texts.length >= 240) texts.shift();
  texts.push({
    x: e.x,
    y: e.y - 15,
    n: Math.ceil(finalDamage),
    life: 0.65,
    color: critical ? "#ffe17d" : "#fff1ba",
  });
  if (critical) puff(e.x, e.y, "#ffe17d", 5);
  if (e.hp <= 0) playSfx(e === boss ? "boss" : "kill");
  else playSfx("hit");
  if (e.hp <= 0) {
    // Keep one terrain trail per heavy/elite death, never for bosses or summons.
    window.enemyWorldOnDeath?.(e);
    // Mark the enemy immediately so later hits in this frame cannot reward it twice.
    e.dead = true;
    if(window.recordWorldDestruction?.(e,player,time)) {
      const reaction = window.getWorldRetaliationStatus?.().lastReaction;
      notify("ELEMENTAL CLASH · " + (reaction?.name || "WORLD REACTION"),"wave",2.7);
    }
    kills++;
    // Character kill thresholds trigger abilities independently of the weapon build.
    if (typeof selectedCharacter !== "undefined" && typeof characterRuntime !== "undefined") {
      if (progressCharacterKills(selectedCharacter, characterRuntime)) {
        const activeAbility = getCharacter(selectedCharacter).ability;
        if (typeof notify === "function") notify(`ABILITY · ${activeAbility}`, "evolution", 2.5);
        puff(player.x, player.y, selectedCharacter === "mayoMaster" ? "#ffe38d" : "#8fffea", 12);
      }
    }
    puff(e.x, e.y, e.kind === 3 ? "#f6b4ff" : "#c75aab", 9);
    if (e === boss || !e.noXp) {
      const soulValue =
        e.kind === 3
          ? 14 + bossNumber * 18
          : e.kind === 4 ? 2
            : e.kind === 6 ? 3
              : e.kind === 5 ? 1.6
                : e.kind === 2 ? 5
                  : e.kind === 1 ? 0.8 : 1;
      dropGem({
        x: e.x,
        y: e.y,
        r: e.kind === 3 ? 10 : e.kind === 2 ? 8 : e.kind === 1 ? 4 : 6,
        value:
          soulValue *
          (difficultyProfiles[difficulty] || difficultyProfiles.normal).xpReward *
          (e.elite ? 2.5 : 1) * (e.xpValueMultiplier || 1),
      });
    }
    const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
    if (e.kind === 1 && Math.random() < profile.healthDropChance) {
      dropGem({ x: e.x, y: e.y, r: 7, kind: "health", value: 2 });
    }
    const killedFinalBoss = e === boss && e.isFinalBoss;
    if (e === boss) {
      bossesDefeated++;
      if (!killedFinalBoss) window.onWorldBossDefeated?.(bossesDefeated, false);
      if (typeof awardBossLoot === "function" && typeof metaProgress !== "undefined") {
        const lootKey = e.isFinalBoss ? "final" : ["beau", "mourning", "bell"][e.variant] || null;
        const trophy = awardBossLoot(metaProgress, lootKey);
        if (trophy.first && typeof notify === "function") {
          notify(`BOSS TROPHY · ${e.bossName || lootKey.toUpperCase()} · ${trophy.points ? "+" + trophy.points + " PTS" : "COLLECTED"}`, "achievement", 4);
          if (trophy.characterUnlocked) {
            notify("NEW CHARACTER · BEAU DE HOND UNLOCKED", "achievement", 5);
            if (typeof unlockAchievement === "function") unlockAchievement("beauTrophy", "Good Dog");
          }
        }
        if (trophy.first && typeof saveMetaProgress === "function") saveMetaProgress();
      }
      nextBossTime = time + 180;
      window.finishBossIsolation?.(e);
      boss = null;
      $("bossHud").style.display = "none";
      bossShots = [];
      if (typeof bossHazards !== "undefined") bossHazards = [];
      // Developer boss deletion must not open a modal behind the F9 panel.
      // Keep the sandbox in its existing paused/playing state so all test
      // controls remain available and F9 can resume the simulation.
      if (!killedFinalBoss && !window.isDeveloperRun?.()) showBossReward();
    }
    if (kills > highest) {
      highest = kills;
      storageSet("shadowHigh", highest);
    }
    metaProgress.totals.kills++;
    if (metaProgress.totals.kills >= 100) unlockAchievement("kills100", "100 Kills");
    if (metaProgress.totals.kills >= 1000) unlockAchievement("kills1000", "1000 Kills");
    if (kills % 10 === 0) saveMetaProgress();
    if (e.kind === 3) {
      metaProgress.totals.bosses++;
      if (metaProgress.totals.bosses >= 1) unlockAchievement("boss1", "First Boss");
      if (metaProgress.totals.bosses >= 3) unlockAchievement("boss3", "Boss Hunter");
      saveMetaProgress();
    }
    if (killedFinalBoss && typeof showVictory === "function") showVictory();
  }
}

function visibleEnemy(e, margin = 0) {
  return (
    Math.abs(e.x - player.x) <= W / 2 - margin - e.r &&
    Math.abs(e.y - player.y) <= H / 2 - margin - e.r
  );
}

const RANGED_ENEMY_ATTACK_RANGE = 430;
const RANGED_ENEMY_RETREAT_RANGE = 300;
const RANGED_ENEMY_SCREEN_MARGIN = 32;

function rangedEnemyCanAttack(enemy, playerDistance) {
  return playerDistance <= RANGED_ENEMY_ATTACK_RANGE && visibleEnemy(enemy, RANGED_ENEMY_SCREEN_MARGIN);
}

function rangedEnemyMovementMode(enemy, playerDistance) {
  if (!visibleEnemy(enemy, RANGED_ENEMY_SCREEN_MARGIN) || playerDistance > RANGED_ENEMY_ATTACK_RANGE) return "approach";
  if (playerDistance < RANGED_ENEMY_RETREAT_RANGE) return "retreat";
  return "hold";
}

// Match collision sizes to the larger drawn silhouettes of ranged enemies and bosses.
function enemyHitRadius(enemy) {
  if (enemy.kind === 3) return enemy.r * 1.4;
  if (enemy.kind === 4) return enemy.r * 1.5;
  if (enemy.kind === 6) return enemy.r * 1.1;
  if (enemy.kind === 1) return enemy.r * 1.1;
  return enemy.r;
}
// Player weapons choose visible targets and create projectiles.
function fire() {
  if (!upgrades.arcane) return;
  const range = Math.hypot(W, H) * 0.65;
  const candidates = nearbyEnemies(player.x, player.y, range);
  let visibleCount = 0;
  for (const enemy of candidates) {
    if (visibleEnemy(enemy, 18)) candidates[visibleCount++] = enemy;
  }
  candidates.length = visibleCount;
  const missileCount = Math.min(Math.max(1, upgrades.arcane) + (evolutions.splitDimension ? 2 : 0), 7);
  const targets = visibleCount > missileCount
    ? candidates
    : nearestEnemies(player.x, player.y, range, missileCount, (enemy) => visibleEnemy(enemy, 18));
  if (!targets.length) return;
  const missilesPerTarget = Math.floor(missileCount / targets.length);
  const extraMissiles = missileCount % targets.length;
  // Partial Fisher–Yates shuffle selects the uneven bonus targets without sorting.
  for (let i = 0; i < extraMissiles; i++) {
    const pick = i + Math.floor(Math.random() * (targets.length - i));
    [targets[i], targets[pick]] = [targets[pick], targets[i]];
  }
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    const assignedCount = missilesPerTarget + (index < extraMissiles ? 1 : 0);
    for (let missile = 0; missile < assignedCount && bullets.length < 300; missile++) {
    const lead = Math.min(0.35, dist(target, player) / 560),
      tx =
        target.x +
        (target === boss
          ? 0
          : ((player.x - target.x) / Math.max(1, dist(target, player))) *
            target.speed *
            lead),
      ty =
        target.y +
        (target === boss
          ? 0
          : ((player.y - target.y) / Math.max(1, dist(target, player))) *
            target.speed *
            lead),
      a = Math.atan2(ty - player.y, tx - player.x);
    bullets.push({
      type: evolutions.splitDimension ? "split" : "arcane",
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * 560,
      vy: Math.sin(a) * 560,
      life: 1.8,
      r: 5,
      d: (12 + upgrades.arcane * 2) * globalDamageMultiplier() * (evolutions.splitDimension ? 1.25 : 1),
      pierce: upgrades.pierce + 1,
      hit: new Set(),
    });
    }
  }
}
// Enemy and boss projectile attacks.
function enemyFireOrb(e) {
  if (enemyShots.length >= 320) return;
  const angle = Number.isFinite(e.aimAngle) ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);
  enemyShots.push({
    type: "enemyOrb",
    x: e.x,
    y: e.y,
    vx: Math.cos(angle) * 105,
    vy: Math.sin(angle) * 105,
    speed: 105,
    turnRate: 0.8,
    life: 6.8,
    r: 8,
    damage: 9,
  });
}

function spawnBoss() {
  if (boss) return false;
  window.beginBossIsolation?.();
  bossNumber++;
  const variant = (bossNumber - 1) % 3;
  const bossNames = bossCatalog.map((entry) => entry.name.toUpperCase());
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  const a = rand(0, Math.PI * 2),
    radius = Math.hypot(W, H) * 0.65 + 90;
  const tier = currentEndlessTier();
  const baseHp =
    (800 + bossNumber * 210 + growthTime * 0.4) *
    1.18 * profile.bossHealth * (1 + tier * 0.18);
  const hp = window.bossCombatMaxHealth?.(baseHp, {index:bossNumber}) ?? baseHp;
  boss = {
    x: player.x + Math.cos(a) * radius,
    y: player.y + Math.sin(a) * radius,
    r: (43 + bossNumber * 4) * (1 + bossNumber * 0.06),
    hp,
    maxHp: hp,
    speed: (48 + bossNumber * 3) * (1 + Math.min(0.3, tier * 0.02)),
    damage: (24 + growthTime * 0.01) * profile.enemyDamage * (1 + tier * 0.065),
    knockbackX: 0,
    knockbackY: 0,
    kind: 3,
    variant,
    bossName: bossNames[variant],
    facing: 1,
    hit: 0,
    shootCooldown: 1.3,
    shotWarning: 0,
    volleyCount: 0,
    phaseIntro: 0,
    shotAngle: 0,
    chargeCooldown: 4,
    chargeWarning: 0,
    chargeActive: 0,
    phaseTwo: false,
    phaseThree: false,
  };
  window.initializeBossCombat?.(boss, time);
  window.initializeBeauEncounter?.(boss, time);
  window.initializeShadeEncounter?.(boss, time);
  window.initializeBellEncounter?.(boss, time);
  window.initializeGuardianWorld?.(boss);
  enemies.push(boss);
  if (typeof trackDiscovery === "function") trackDiscovery("bosses", ["beau", "mourning", "bell"][variant]);
  puff(boss.x, boss.y, "#cf7cff", 28);
  $("bossHud").style.display = "block";
  $("bossName").textContent = boss.bossName;
  playSfx("boss");
  $("bossFill").style.width = "100%";
  if (typeof notify === "function") notify(`BOSS INCOMING · ${boss.bossName} · THE HORDE RETREATS`, "boss", 4);
  return true;
}

// The Last Meme is intentionally drawn in Canvas until its custom meme asset exists.
function spawnFinalBoss() {
  if (boss) return false;
  window.beginBossIsolation?.();
  bossNumber++;
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  const angle = rand(0, Math.PI * 2);
  const radius = Math.max(W, H) * 0.56 + 160;
  const baseHp = (6000 + Math.min(2400, bossNumber * 200)) * profile.bossHealth;
  const hp = window.bossCombatMaxHealth?.(baseHp, {final:true,index:bossNumber}) ?? baseHp;
  boss = {
    x: player.x + Math.cos(angle) * radius,
    y: player.y + Math.sin(angle) * radius,
    r: 70,
    hp, maxHp: hp,
    speed: 83,
    damage: 28 * profile.enemyDamage,
    knockbackX: 0, knockbackY: 0,
    kind: 3,
    variant: 3,
    isFinalBoss: true,
    bossName: "THE LAST MEME",
    facing: 1, hit: 0,
    finalPhase: 1,
    phaseTwo: false,
    phaseIntro: 2.2,
    finalIntro: 2.2,
    shootCooldown: 2.2,
    shotWarning: 0,
    shotAngle: 0,
    shotPattern: 0,
    shotRotation: 0,
    volleyCount: 0,
    warningX: 0,
    warningY: 0,
    chargeCooldown: 5,
    chargeWarning: 0,
    chargeActive: 0,
    minionCooldown: 13,
  };
  window.initializeBossCombat?.(boss, time);
  window.initializeMemeEncounter?.(boss, time);
  window.initializeGuardianWorld?.(boss);
  enemies.push(boss);
  if (typeof trackDiscovery === "function") trackDiscovery("bosses", "final");
  nextBossTime = Infinity;
  $("bossHud").style.display = "block";
  $("bossName").textContent = "THE LAST MEME · PHASE I";
  $("bossFill").style.width = "100%";
  playSfx("boss");
  puff(boss.x, boss.y, "#f5a5ff", 35);
  notify("FINAL BOSS · THE LAST MEME · SURVIVE THE CHAOS", "boss", 5);
  return true;
}

// Boss projectiles remember their variant so only Beau uses the original fish sprite.
function addBossProjectile(e, angle, speed, damage = 13, type = "shadow") {
  if (bossShots.length >= 180) return;
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  bossShots.push({
    x: e.x, y: e.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: type === "fish" ? 8 : 7,
    life: 4.5,
    damage: damage * profile.enemyDamage,
    visualType: type,
  });
}

function bossFire(e) {
  if (e.isFinalBoss) return finalBossFire(e);
  const angle = Number.isFinite(e.shotAngle) ? e.shotAngle : Math.atan2(player.y - e.y, player.x - e.x);
  e.volleyCount = (e.volleyCount || 0) + 1;
  if (e.variant === 0) {
    // Beau's trademark MarioVis shotgun. In phase two, add an occasional ring.
    const offsets = e.phaseThree ? [-0.62,-0.42,-0.23,0,0.23,0.42,0.62]
      : e.phaseTwo ? [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48]
      : [-0.3, -0.15, 0, 0.15, 0.3];
    // Central shot is aimed at the player and fast enough to catch a runner
    // who refuses to change direction. Fans still have readable openings.
    for (const offset of offsets) addBossProjectile(e, angle + offset, e.phaseThree ? 340 : e.phaseTwo ? 320 : 290, 13, "fish");
    if (e.phaseTwo && e.volleyCount % 2 === 0) {
      for (let i = 0; i < 8; i++) addBossProjectile(e, i * Math.PI / 4 + time * 0.2, 128, 9, "shadow");
    }
  } else if (e.variant === 1) {
    // Old ring opened directly toward the player, allowing them to stand
    // still safely. Its exit is now off-axis, with a clearly warned lance.
    const count = e.phaseThree ? 16 : e.phaseTwo ? 14 : 10;
    const gapAngle = angle + Math.PI * .72;
    for (let i = 0; i < count; i++) {
      const shotAngle = angle + i * Math.PI * 2 / count;
      const gap = Math.atan2(Math.sin(shotAngle - gapAngle), Math.cos(shotAngle - gapAngle));
      if (Math.abs(gap) < Math.PI * 2 / count * 1.18) continue;
      addBossProjectile(e, shotAngle, e.phaseThree ? 260 : e.phaseTwo ? 240 : 215, e.phaseTwo ? 12 : 10, "shadow");
    }
    const spears = e.phaseTwo ? [-.16,0,.16] : [0];
    for (const offset of spears)
      addBossProjectile(e, angle+offset, e.phaseThree ? 365 : e.phaseTwo ? 345 : 320, 11, "shadow");
  } else {
    // A fast bell-bolt down the centre means the player must dodge rather
    // than camp in the safe channel from the old pattern.
    const offsets = e.phaseThree ? [-.68,-.46,-.23,0,.23,.46,.68]
      : e.phaseTwo ? [-.55,-.29,0,.29,.55] : [-.39,0,.39];
    for (const offset of offsets)
      addBossProjectile(e, angle + offset, e.phaseThree ? 355 : e.phaseTwo ? 330 : 305, 12, "bell");
    if (e.phaseTwo && e.volleyCount % 2 === 0) {
      addBossProjectile(e, angle - 1.05, 130, 9, "bell");
      addBossProjectile(e, angle + 1.05, 130, 9, "bell");
    }
  }
  e.shotWarning = 0;
  e.shootCooldown = e.phaseThree ? 2.08 : e.phaseTwo ? 2.35 : 2.9;
}

// Alternate visibly different patterns; all aim directions/target points were locked
// when the attack warning began. Safe gaps remain where the warning indicates.
function finalBossFire(e) {
  const phase = e.finalPhase || 1;
  const pattern = e.shotPattern || 0;
  const angle = e.shotAngle || 0;
  if (pattern === 0) {
    // Direct rift pressure, with wider edges the player can dash between.
    const offsets = phase === 3 ? [-.82,-.57,-.29,0,.29,.57,.82]
      : [-.65,-.36,0,.36,.65];
    for (const offset of offsets)
      addBossProjectile(e, angle + offset, 285 + 17 * phase, 11 + phase, "rift");
  } else if (pattern === 1) {
    // Side-facing safe exit plus a central lance; no free safe spot where
    // the player was standing at the beginning of the windup.
    const count = phase === 3 ? 16 : phase === 2 ? 14 : 12;
    const exitAngle = angle + Math.PI * .72;
    for (let i = 0; i < count; i++) {
      const direction = angle + i * Math.PI * 2 / count;
      const relative = Math.atan2(Math.sin(direction - exitAngle), Math.cos(direction - exitAngle));
      if (Math.abs(relative) < Math.PI * 2 / count * 1.35) continue;
      addBossProjectile(e, direction, 225 + 12 * phase, 11 + phase, "shadow");
    }
    addBossProjectile(e, angle, 325 + 12 * phase, 11 + phase, "rift");
  } else {
    // The boss marked this point during wind-up; players can leave the blast area.
    if (typeof bossHazards !== "undefined" && bossHazards.length < 14) {
      bossHazards.push({
        x: e.warningX, y: e.warningY,
        radius: 104 + phase * 12,
        warning: 0.24,
        damage: (15 + 3 * phase) * (difficultyProfiles[difficulty] || difficultyProfiles.normal).enemyDamage,
      });
    }
  }
  e.volleyCount = (e.volleyCount || 0) + 1;
  e.shotWarning = 0;
  e.shootCooldown = Math.max(1.65, 3.0 - 0.35 * phase);
}
