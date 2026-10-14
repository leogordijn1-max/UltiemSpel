// Enemy creation and shared combat effects.
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
  { name: "Ranged Shade", image: "", hp: "Drifter base", damage: "6 + ranged orb", speed: "34–42 + time scaling", ability: "Keeps distance and fires homing orbs.", xp: "2 souls" },
];
const bossCatalog = [
  { name: "Beau de Hond", image: "img/BeauDeHond.png", attacks: "Fish shotgun fan and a telegraphed charge.", phase: "Below half HP, adds radial shots and summons minions." },
  { name: "The Mourning Shade", image: "", attacks: "Radial projectile rings and a charge.", phase: "Below half HP, increases ring size and summons minions." },
  { name: "The Bell Tower", image: "", attacks: "Aimed projectile fan and a charge.", phase: "Below half HP, adds a radial volley and summons minions." },
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
  const minX = Math.floor((x - radius) / ENEMY_GRID_SIZE);
  const maxX = Math.floor((x + radius) / ENEMY_GRID_SIZE);
  const minY = Math.floor((y - radius) / ENEMY_GRID_SIZE);
  const maxY = Math.floor((y + radius) / ENEMY_GRID_SIZE);
  const radiusSquared = radius * radius;
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

function nearestEnemy(x, y, radius = 1500) {
  let closest = null;
  let closestSquared = radius * radius;
  for (const enemy of nearbyEnemies(x, y, radius)) {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < closestSquared) { closest = enemy; closestSquared = distanceSquared; }
  }
  return closest;
}

function enemySpawn() {
  let a = rand(0, Math.PI * 2),
    r = Math.max(W, H) * 0.72;
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  let type = Math.random(),
    e = {
      x: player.x + Math.cos(a) * r,
      y: player.y + Math.sin(a) * r,
      r: 13,
      hp: (20 + growthTime * 0.08) * profile.enemyHealth,
      speed: rand(43, 63) + growthTime * 0.06,
      damage: 8,
      kind: 0,
      hit: 0,
      knockbackX: 0,
      knockbackY: 0,
      noXp: !!boss,
    };
  if (type < Math.min(0.32, growthTime / 200)) {
    e.kind = 1;
    e.r = 10;
    e.hp *= 0.55;
    e.speed *= 1.85;
    e.damage = 6;
  } else if (type > 0.94) {
    e.kind = 2;
    e.r = 35;
    e.hp *= 4;
    e.speed *= 0.7;
    e.damage = 14;
  } else if (type > 0.88) {
    e.kind = 4;
    e.r = 15;
    e.hp *= 1;
    e.speed = rand(34, 42) + growthTime * 0.025;
    e.damage = 6;
    e.shootCooldown = rand(4.5, 7);
  }
  e.damage *= profile.enemyDamage;
  e.damage += growthTime * 0.004 * profile.enemyDamage;

  const eliteChance = Math.min(0.12, 0.02 + growthTime / 12000);
  if (Math.random() < eliteChance) {
    e.elite = true;
    e.hp *= 2.2;
    e.damage *= 1.45;
    e.speed *= 1.08;
  }

  enemies.push(e);
}

function puff(x, y, color, n = 8) {
  const particleLimit = 600;
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

function damage(e, d, origin = player) {
  if (!e || e.dead) return;

  const critical =
    (upgrades.critChance || 0) > 0 &&
    Math.random() < (upgrades.critChance || 0) * 0.05;
  const criticalMultiplier = 1.5 + (upgrades.critDamage || 0) * 0.25 + Math.max(0, (upgrades.critChance || 0) - 2) * 0.05;
  const finalDamage = d * (critical ? criticalMultiplier : 1);
  e.hp -= finalDamage;
  e.hit = 0.12;

  // Tanks and bosses resist knockback; regular enemies are easier to push away.
  const knockbackX = e.x - origin.x;
  const knockbackY = e.y - origin.y;
  const knockbackLength = Math.hypot(knockbackX, knockbackY);
  if (knockbackLength > 0) {
    const resistance =
      e.kind === 3 ? 0.12 : e.kind === 2 ? 0.45 : e.elite ? 0.6 : 1;
    const force = 145 * resistance * (1 + (upgrades.knockback || 0) * 0.2);
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
    // Mark the enemy immediately so later hits in this frame cannot reward it twice.
    e.dead = true;
    kills++;
    puff(e.x, e.y, e.kind === 3 ? "#f6b4ff" : "#c75aab", 9);
    if (e === boss || !e.noXp) {
      const soulValue =
        e.kind === 3
          ? 14 + bossNumber * 18
          : e.kind === 4
            ? 2
            : e.kind === 2
              ? 5
              : e.kind === 1
                ? 0.8
                : 1;
      gems.push({
        x: e.x,
        y: e.y,
        r: e.kind === 3 ? 10 : e.kind === 2 ? 8 : e.kind === 1 ? 4 : 6,
        value:
          soulValue *
          (difficultyProfiles[difficulty] || difficultyProfiles.normal).xpReward *
          (e.elite ? 2.5 : 1),
      });
    }
    const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
    if (e.kind === 1 && Math.random() < profile.healthDropChance) {
      gems.push({ x: e.x, y: e.y, r: 7, kind: "health", value: 2 });
    }
    if (e === boss) {
      bossesDefeated++;
      nextBossTime = time + 180;
      boss = null;
      $("bossHud").style.display = "none";
      bossShots = [];
      showBossReward();
    }
    if (kills > highest) {
      highest = kills;
      localStorage.setItem("shadowHigh", highest);
    }
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
  if (enemy.kind === 1) return enemy.r * 1.1;
  return enemy.r;
}
// Player weapons choose visible targets and create projectiles.
function fire() {
  if (!upgrades.arcane) return;
  const targets = nearbyEnemies(player.x, player.y, Math.hypot(W, H) * 0.65)
    .filter((e) => !e.dead && visibleEnemy(e, 18))
    .sort((a, b) => dist(a, player) - dist(b, player));
  if (!targets.length) return;
  const missileCount = Math.min(Math.max(1, upgrades.arcane) + (evolutions.splitDimension ? 2 : 0), 7);
  const missilesPerTarget = Math.floor(missileCount / targets.length);
  const extraMissiles = missileCount % targets.length;
  const bonusTargets = [...targets]
    .sort(() => Math.random() - 0.5)
    .slice(0, extraMissiles);
  const assignments = targets.flatMap((target) =>
    Array(missilesPerTarget + (bonusTargets.includes(target) ? 1 : 0)).fill(
      target,
    ),
  );
  for (const target of assignments) {
    if (bullets.length >= 300) break;
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
      d: 14 * globalDamageMultiplier() * (evolutions.splitDimension ? 1.25 : 1),
      pierce: upgrades.pierce + 1,
      hit: new Set(),
    });
  }
}
// Enemy and boss projectile attacks.
function enemyFireOrb(e) {
  if (enemyShots.length >= 320) return;
  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  enemyShots.push({
    type: "enemyOrb",
    x: e.x,
    y: e.y,
    vx: Math.cos(angle) * 85,
    vy: Math.sin(angle) * 85,
    speed: 85,
    turnRate: 1.15,
    life: 9,
    r: 8,
    damage: 9,
  });
}

function spawnBoss() {
  bossNumber++;
  const variant = (bossNumber - 1) % 3;
  const bossNames = bossCatalog.map((entry) => entry.name.toUpperCase());
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  const a = rand(0, Math.PI * 2),
    radius = Math.hypot(W, H) * 0.65 + 90;
  const hp =
    (800 + bossNumber * 210 + growthTime * 0.4) *
    1.18 *
    profile.bossHealth;
  boss = {
    x: player.x + Math.cos(a) * radius,
    y: player.y + Math.sin(a) * radius,
    r: (43 + bossNumber * 4) * (1 + bossNumber * 0.06),
    hp,
    maxHp: hp,
    speed: 48 + bossNumber * 3,
    damage: (24 + growthTime * 0.01) * profile.enemyDamage,
    knockbackX: 0,
    knockbackY: 0,
    kind: 3,
    variant,
    bossName: bossNames[variant],
    facing: 1,
    hit: 0,
    shootCooldown: 1.3,
    shotAngle: 0,
    chargeCooldown: 4,
    chargeWarning: 0,
    chargeActive: 0,
    phaseTwo: false,
  };
  enemies.push(boss);
  puff(boss.x, boss.y, "#cf7cff", 28);
  $("bossHud").style.display = "block";
  $("bossName").textContent = boss.bossName;
  playSfx("boss");
  $("bossFill").style.width = "100%";
}

function bossFire(e) {
  // Boss patterns rotate while preserving Beau's original fish-shotgun attack.
  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  if (e.variant === 1 || e.phaseTwo) {
    const count = e.phaseTwo ? 12 : 10;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + time * 0.2;
      if (bossShots.length < 180) bossShots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 125, vy: Math.sin(a) * 125, r: 7, life: 4.5 });
    }
  } else {
    const offsets = e.variant === 2 ? [-0.3, -0.1, 0.1, 0.3] : [-0.24, -0.12, 0, 0.12, 0.24];
    for (const offset of offsets) {
      const a = angle + offset;
      if (bossShots.length >= 180) break;
      bossShots.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * 165,
        vy: Math.sin(a) * 165,
        r: 7,
        life: 4.5,
      });
    }
  }
  e.shootCooldown = 2.4;
}
