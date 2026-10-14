// Active weapon abilities beyond Arcane Bolt and Spirit Blades.
function chainLightningCooldown(level) {
  return Math.max(2.45, (7 - level * 0.55) * (0.88 / 1.15));
}

function updateSpecialWeapons(dt) {
  for (const weapon of Object.keys(weaponTimers)) {
    weaponTimers[weapon] = Math.max(0, weaponTimers[weapon] - dt * (1 + upgrades.rate * 0.13));
  }

  for (const segment of lightningSegments) segment.life -= dt;
  lightningSegments = lightningSegments.filter((segment) => segment.life > 0);

  for (const burst of flameBursts) burst.life -= dt;
  flameBursts = flameBursts.filter((burst) => burst.life > 0);
  for (const zone of frostZones) zone.life -= dt;
  frostZones = frostZones.filter((zone) => zone.life > 0);

  if (upgrades.chain && weaponTimers.chain <= 0) castChainLightning();
  if (upgrades.boomerang && weaponTimers.boomerang <= 0) throwBoomerangs();
  if (upgrades.flame && weaponTimers.flame <= 0) castFlameBurst();
  if (upgrades.frost && weaponTimers.frost <= 0) fireFrostOrb();
}

function castChainLightning() {
  weaponTimers.chain = chainLightningCooldown(upgrades.chain);
  const initialTargets = nearbyEnemies(player.x, player.y, 820)
    .sort((a, b) => dist(a, player) - dist(b, player));
  if (!initialTargets.length) return;
  const evolved = evolutions.tempest;
  const chainDamage = (22 + upgrades.chain * 9) * globalDamageMultiplier();
  const hitByVolley = new Set();
  const attackCount = evolved ? 2 : 1;
  for (let attack = 0; attack < attackCount; attack++) {
    const initial = initialTargets.find((enemy) => !hitByVolley.has(enemy)) || initialTargets[0];
    const visited = new Set();
    let source = player;
    let target = initial;
    const jumpCount = 2 + Math.floor(upgrades.chain / 2) + (evolved ? 1 : 0);
    for (let jump = 0; target && jump < jumpCount; jump++) {
      visited.add(target);
      hitByVolley.add(target);
      lightningSegments.push({ x1: source.x, y1: source.y, x2: target.x, y2: target.y, life: 0.24, evolved });
      damage(target, chainDamage, source);
      source = target;
      target = nearbyEnemies(source.x, source.y, evolved ? 295 : 220)
        .filter((enemy) => !visited.has(enemy) && (!hitByVolley.has(enemy) || initialTargets.length === 1))
        .sort((a, b) => dist(a, source) - dist(b, source))[0];
    }
  }
}

function throwBoomerangs() {
  const target = enemies
    .filter((enemy) => !enemy.dead && dist(enemy, player) < 1100)
    .sort((a, b) => dist(a, player) - dist(b, player))[0];
  weaponTimers.boomerang = Math.max(2.5, 6 - upgrades.boomerang * 0.5);
  if (!target) return;

  const evolved = evolutions.returningStorm;
  const count = 1 + (upgrades.boomerang >= 4 ? 1 : 0) + (evolved ? 1 : 0);
  const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
  for (let i = 0; i < count; i++) {
    if (bullets.length >= 300) break;
    const spread = (i - (count - 1) / 2) * 0.22;
    const angle = baseAngle + spread;
    const speed = 310;
    bullets.push({
      type: "boomerang",
      evolved,
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      speed,
      turnRate: 3.8,
      life: 5,
      age: 0,
      returning: false,
      target,
      r: 10,
      d:
        (28 + upgrades.boomerang * 8) *
        globalDamageMultiplier() *
        (evolved ? 1.35 : 1),
      pierce: 99,
      hit: new Set(),
    });
  }
}

function castFlameBurst() {
  const evolved = evolutions.inferno;
  const spread = evolved ? 1.9 : 1.35;
  const radius = (165 + upgrades.flame * 28) * (evolved ? 1.2 : 1);
  const angle = Math.atan2(player.facingY, player.facingX);
  const damageValue = (42 + upgrades.flame * 13) * globalDamageMultiplier() * (evolved ? 1.35 : 1);
  const burnDps = 8 + upgrades.flame * 5;
  const burnDuration = evolved ? 3.6 : 2.6 + upgrades.flame * 0.18;
  flameBursts.push({ x: player.x, y: player.y, angle, spread, radius, life: 0.42, evolved, lobes: evolved ? 3 : 1 });

  for (const enemy of nearbyEnemies(player.x, player.y, radius + 50)) {
    if (dist(enemy, player) > radius + enemyHitRadius(enemy)) continue;
    const direction = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    const difference = Math.atan2(
      Math.sin(direction - angle),
      Math.cos(direction - angle),
    );
    if (Math.abs(difference) <= spread / 2) {
      damage(
        enemy,
        damageValue,
        player,
      );
      if (!enemy.dead) {
        enemy.burnUntil = Math.max(enemy.burnUntil || 0, time + burnDuration);
        enemy.burnDps = Math.max(enemy.burnDps || 0, burnDps);
        enemy.nextBurnTick = Math.min(enemy.nextBurnTick || Infinity, time + 0.5);
      }
    }
  }
  weaponTimers.flame = Math.max(1.8, 4.8 - upgrades.flame * 0.35);
}

function fireFrostOrb() {
  weaponTimers.frost = Math.max(1.5, 4.2 - upgrades.frost * 0.45);
  const targets = nearbyEnemies(player.x, player.y, 1300).sort((a, b) => dist(a, player) - dist(b, player));
  const count = 1 + Math.floor((upgrades.frost - 1) / 2);
  const damagePerHit = (28 + upgrades.frost * 12) * globalDamageMultiplier();
  for (const target of targets.slice(0, count)) {
    if (bullets.length >= 300) break;
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const speed = 205;
    bullets.push({ type: "frost", evolved: evolutions.glacier, x: player.x, y: player.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, speed, turnRate: 3.2, life: 7, r: 13, d: damagePerHit, pierce: 1 + Math.floor(upgrades.frost / 2), frostRadius: 90 + upgrades.frost * 18, hit: new Set() });
  }
}

function applyFrostBurst(x, y, projectile) {
  const radius = projectile.frostRadius * (evolutions.glacier ? 1.25 : 1);
  frostZones.push({ x, y, radius, life: 1.4, evolved: !!evolutions.glacier });
  for (const enemy of nearbyEnemies(x, y, radius + 70)) {
    if (dist(enemy, { x, y }) > radius + enemyHitRadius(enemy)) continue;
    enemy.frostUntil = Math.max(enemy.frostUntil || 0, time + (evolutions.glacier ? 5.2 : 3.5 + upgrades.frost * 0.25));
    if (enemy !== projectile.hitTarget) damage(enemy, projectile.d * 0.45, projectile);
  }
}
