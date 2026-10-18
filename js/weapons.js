// Active weapon abilities beyond Arcane Bolt and Spirit Blades.
function chainLightningCooldown(level) {
  return Math.max(2.45, (7 - level * 0.55) * (0.88 / 1.15));
}

function updateSpecialWeapons(dt) {
  for (const weapon of Object.keys(weaponTimers)) {
    weaponTimers[weapon] = Math.max(0, weaponTimers[weapon] - dt / weaponCooldownMultiplier());
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

// Only choose enemies the player can actually see, with compact auto-aim range.
function playerVisibleTarget(x,y,range,excluded=null) {
  const max=typeof window!=="undefined"
    ? window.playerWeaponRange?.(range) ?? range : range;
  return nearestEnemy(x,y,max,excluded,enemy=>
    (typeof window!=="undefined" && window.playerWeaponTargetVisible
      ? window.playerWeaponTargetVisible(enemy)
      : typeof visibleEnemy!=="function" || visibleEnemy(enemy,50)));
}

function castChainLightning() {
  weaponTimers.chain = chainLightningCooldown(upgrades.chain);
  const firstTarget = playerVisibleTarget(player.x, player.y, 600);
  if (!firstTarget) return;
  if (typeof playSfx === "function") playSfx("lightning");
  const evolved = evolutions.tempest;
  const chainDamage = (22 + upgrades.chain * 9) * globalDamageMultiplier();
  const hitByVolley = new Set();
  const attackCount = evolved ? 2 : 1;
  for (let attack = 0; attack < attackCount; attack++) {
    const initial = playerVisibleTarget(player.x, player.y, 600, hitByVolley) || firstTarget;
    const visited = new Set();
    let source = player;
    let target = initial;
    const jumpCount = 2 + Math.floor(upgrades.chain / 2) + (evolved ? 1 : 0);
    for (let jump = 0; target && jump < jumpCount; jump++) {
      visited.add(target);
      hitByVolley.add(target);
      lightningSegments.push({ x1: source.x, y1: source.y, x2: target.x, y2: target.y, life: 0.24, evolved });
      damage(target, chainDamage, source, "lightning");
      source = target;
      target = nearestEnemy(
        source.x,source.y,
        evolved ? 255 : 195,
        visited,
        enemy => (!hitByVolley.has(enemy) || enemy===firstTarget) &&
          (typeof window!=="undefined" && window.playerWeaponTargetVisible
            ? window.playerWeaponTargetVisible(enemy)
            : typeof visibleEnemy!=="function" || visibleEnemy(enemy,50))
      );
    }
  }
}

function throwBoomerangs() {
  const target = playerVisibleTarget(player.x, player.y, 1100);
  weaponTimers.boomerang = Math.max(2.5, 6 - upgrades.boomerang * 0.5);
  if (!target) return;
  if (typeof playSfx === "function") playSfx("boomerang");

  const evolved = evolutions.returningStorm;
  const count = 1 + (upgrades.boomerang >= 4 ? 1 : 0) + (evolved ? 1 : 0);
  const baseAngle=window.weaponAimAngle?.(
    player,target,310,{maxLead:.42}) ??
    Math.atan2(target.y-player.y,target.x-player.x);
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
  if (typeof playSfx === "function") playSfx("flame");
  const evolved = evolutions.inferno;
  const spread = evolved ? 1.9 : 1.35;
  const radius = (165 + upgrades.flame * 28) * (evolved ? 1.2 : 1);
  // Aim the cone at a nearby enemy, using facing direction if the arena is empty.
  const flameTarget = playerVisibleTarget(player.x, player.y, radius + 55);
  const targetDx = flameTarget ? flameTarget.x - player.x : player.facingX;
  const targetDy = flameTarget ? flameTarget.y - player.y : player.facingY;
  const targetLength = Math.hypot(targetDx, targetDy) || 1;
  const facingX = targetDx / targetLength, facingY = targetDy / targetLength;
  const angle = Math.atan2(facingY, facingX);
  const coneThreshold = Math.cos(spread / 2);
  const damageValue = (42 + upgrades.flame * 13) * globalDamageMultiplier() * (evolved ? 1.35 : 1);
  const burnDps = 8 + upgrades.flame * 5;
  const burnDuration = evolved ? 3.6 : 2.6 + upgrades.flame * 0.18;
  flameBursts.push({ x: player.x, y: player.y, angle, spread, radius, life: 0.42, evolved, lobes: evolved ? 3 : 1 });
  window.addWorldScar?.("fire", player.x + facingX * radius * .58, player.y + facingY * radius * .58, radius);

  for (const enemy of nearbyEnemies(player.x, player.y, radius + 50)) {
    const dx = enemy.x - player.x, dy = enemy.y - player.y;
    const hitRadius = radius + enemyHitRadius(enemy);
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared > hitRadius * hitRadius) continue;
    if (distanceSquared === 0 || dx * facingX + dy * facingY >= coneThreshold * Math.sqrt(distanceSquared)) {
      const combo=window.triggerElementalSynergy?.(
        enemy,"fire","flame",damageValue,time,enemy===boss) || {damage:damageValue,activated:false};
      damage(enemy, combo.damage, player, "flame");
      if(combo.activated)window.emitWeaponVfxImpact?.("flame",enemy.x,enemy.y,time);
      if (!enemy.dead) {
        enemy.burnUntil = Math.max(enemy.burnUntil || 0, time + burnDuration + (combo.bonusBurn || 0));
        enemy.burnWeapon = "flame";
        enemy.burnDps = Math.max(enemy.burnDps || 0, burnDps);
        enemy.nextBurnTick = Math.min(enemy.nextBurnTick || Infinity, time + 0.5);
      }
    }
  }
  weaponTimers.flame = Math.max(1.8, 4.8 - upgrades.flame * 0.35);
}

function fireFrostOrb() {
  // Frost Orb controls crowds rather than multiplying direct hits at high levels.
  // One homing projectile per volley; level-ups improve chill radius and modestly
  // improve cast frequency. Phantom Shots does not grant Frost Orb pierce.
  const level = Math.max(1, upgrades.frost);
  weaponTimers.frost = Math.max(3.2, 4.1 - level * 0.18);
  const target = playerVisibleTarget(player.x, player.y, 1300);
  if (!target || bullets.length >= 300) return;
  if (typeof playSfx === "function") playSfx("frost");
  // Frost is the deliberate homing/control weapon, unlike predicted Arcane.
  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const speed = 245;
  bullets.push({
    type: "frost", evolved: !!evolutions.glacier,
    x: player.x, y: player.y,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    speed, turnRate: 4.0, life: 7, r: 13, target,
    d: (24 + level * 4) * globalDamageMultiplier(),
    pierce: 1, // Detonates on its first impact, even with Phantom Shots.
    frostRadius: 88 + level * 12,
    hit: new Set(),
  });
}

function applyFrostBurst(x, y, projectile) {
  const radius = projectile.frostRadius * (evolutions.glacier ? 1.25 : 1);
  frostZones.push({ x, y, radius, life: 1.4, evolved: !!evolutions.glacier });
  window.emitWeaponVfxImpact?.("frost", x, y, time);
  window.addWorldScar?.("frost", x, y, radius);
  for (const enemy of nearbyEnemies(x, y, radius + 70)) {
    const dx = enemy.x - x, dy = enemy.y - y;
    const hitRadius = radius + enemyHitRadius(enemy);
    if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
    enemy.frostUntil = Math.max(enemy.frostUntil || 0, time + (evolutions.glacier ? 5.2 : 3.5 + upgrades.frost * 0.25));
    window.markElementalSynergy?.(enemy,"frost","frost",time);
    if (enemy !== projectile.hitTarget) {
      // No extra AoE damage to the directly hit enemy. Glacier gains a modest
      // splash bonus, but neither version gains additional piercing projectiles.
      const splashMultiplier = evolutions.glacier ? 0.32 : 0.25;
      damage(enemy, projectile.d * splashMultiplier, projectile, "frost");
    }
  }
}
