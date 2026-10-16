// Seven elemental prototype attacks. Flame Cone and Frost Orb reuse the existing engine.
// Kept separate from the old generic weapon code so future world reactions can hook in.
let elementalShots = [];
let elementalAreas = [];
let elementalTimers = {};
let orbitFireAngle = 0;

function resetElementalCombat() {
  elementalShots = [];
  elementalAreas = [];
  elementalTimers = {};
  orbitFireAngle = 0;
}

function elementalCooldown(key, seconds) {
  elementalTimers[key] = seconds * weaponCooldownMultiplier();
}
function elementalAim(maxRange = 900) {
  const enemy = nearestEnemy(player.x, player.y, maxRange);
  const dx = enemy ? enemy.x - player.x : player.facingX;
  const dy = enemy ? enemy.y - player.y : player.facingY;
  return { angle: Math.atan2(dy, dx), target: enemy };
}
function elementalShot(type, x, y, angle, speed, radius, damage, lifetime = 2.4) {
  if (elementalShots.length >= 160) return;
  elementalShots.push({
    type, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    r: radius, damage, life: lifetime, hit: new Set(),
  });
}
function elementalCircle(x, y, radius, damage, kind, duration = 0.65) {
  elementalAreas.push({ type: kind, x, y, radius, life: duration, maxLife: duration });
  if (elementalAreas.length > 55) elementalAreas.shift();
  const color = kind === "fire" ? "#ff9657" : kind === "frost" ? "#a5eafa" : "#60bcff";
  puff(x, y, color, 8);
  if (kind === "fire" || kind === "frost") window.addWorldScar?.(kind, x, y, Math.min(150, radius));
  for (const enemy of nearbyEnemies(x, y, radius + 80)) {
    if (enemy.dead) continue;
    const dx = enemy.x - x, dy = enemy.y - y;
    const reach = radius + enemyHitRadius(enemy);
    if (dx * dx + dy * dy > reach * reach) continue;
    damageEnemyElemental(enemy, damage, kind, x, y, kind === "fire" ? "fireball" : "glacialPulse");
  }
}
function damageEnemyElemental(enemy, amount, element, originX, originY, weaponKey = element) {
  if (enemy.dead) return;
  damage(enemy, amount, { x: originX, y: originY, type: weaponKey }, element);
  if (enemy.dead) return;
  if (element === "fire") {
    enemy.burnUntil = Math.max(enemy.burnUntil || 0, time + 2.2);
    enemy.burnWeapon = weaponKey;
    enemy.burnDps = Math.max(enemy.burnDps || 0, 7 + (upgrades.fireball || upgrades.flameOrbit || 1) * 3);
    enemy.nextBurnTick = Math.min(enemy.nextBurnTick || Infinity, time + 0.5);
  } else if (element === "frost") {
    enemy.frostUntil = Math.max(enemy.frostUntil || 0, time + 1.7);
  } else if (element === "water") {
    enemy.soakedUntil = Math.max(enemy.soakedUntil || 0, time + 1.8);
    const dx = enemy.x - originX, dy = enemy.y - originY;
    const length = Math.hypot(dx, dy) || 1;
    const force = enemy === boss ? 35 : 170;
    enemy.knockbackX = (enemy.knockbackX || 0) + dx / length * force;
    enemy.knockbackY = (enemy.knockbackY || 0) + dy / length * force;
  }
}
function updateElementalCombat(dt) {
  for (const key of Object.keys(elementalTimers))
    elementalTimers[key] = Math.max(0, elementalTimers[key] - dt);

  if (upgrades.fireball && !elementalTimers.fireball) {
    const aim = elementalAim(1100);
    if (aim.target) {
      elementalShot("fireball", player.x, player.y, aim.angle, 350, 13,
        (22 + upgrades.fireball * 6) * globalDamageMultiplier(), 2.7);
      elementalCooldown("fireball", Math.max(2.6, 3.6 - upgrades.fireball * 0.2));
    }
  }
  if (upgrades.waterBolt && !elementalTimers.waterBolt) {
    const aim = elementalAim(1100);
    if (aim.target) {
      elementalShot("waterBolt", player.x, player.y, aim.angle, 530, 8,
        (14 + upgrades.waterBolt * 6) * globalDamageMultiplier(), 1.9);
      elementalCooldown("waterBolt", Math.max(0.95, 1.5 - upgrades.waterBolt * 0.1));
    }
  }
  if (upgrades.iceShards && !elementalTimers.iceShards) {
    const aim = elementalAim(950);
    if (aim.target) {
      const count = 3 + (upgrades.iceShards >= 4 ? 2 : 0);
      for (let index = 0; index < count; index++) {
        const offset = (index - (count - 1) / 2) * 0.18;
        elementalShot("iceShards", player.x, player.y, aim.angle + offset, 480, 6,
          (13 + upgrades.iceShards * 4) * globalDamageMultiplier(), 1.7);
      }
      elementalCooldown("iceShards", Math.max(1.75, 2.7 - upgrades.iceShards * 0.17));
    }
  }
  if (upgrades.tidalWave && !elementalTimers.tidalWave) {
    const radius = 180 + upgrades.tidalWave * 17;
    const aim = elementalAim(radius + 20);
    if (aim.target) {
      const spread = 1.7;
      elementalAreas.push({ type: "tidalWave", x: player.x, y: player.y, radius, angle: aim.angle, spread, life: 0.58, maxLife: 0.58 });
      for (const enemy of nearbyEnemies(player.x, player.y, radius + 90)) {
        if (enemy.dead) continue;
        const dx = enemy.x - player.x, dy = enemy.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius + enemyHitRadius(enemy)) continue;
        const diff = Math.atan2(Math.sin(Math.atan2(dy, dx) - aim.angle), Math.cos(Math.atan2(dy, dx) - aim.angle));
        if (Math.abs(diff) > spread / 2) continue;
        damageEnemyElemental(enemy, (17 + upgrades.tidalWave * 8) * globalDamageMultiplier(), "water", player.x, player.y, "tidalWave");
        enemy.knockbackX = (enemy.knockbackX || 0) + Math.cos(aim.angle) * (enemy === boss ? 20 : 145);
        enemy.knockbackY = (enemy.knockbackY || 0) + Math.sin(aim.angle) * (enemy === boss ? 20 : 145);
      }
      elementalCooldown("tidalWave", Math.max(4.4, 5.85 - upgrades.tidalWave * 0.29));
    }
  }
  if (upgrades.whirlpool && !elementalTimers.whirlpool) {
    const aim = elementalAim(800);
    if (aim.target) {
      const radius = 115 + upgrades.whirlpool * 11;
      elementalAreas.push({
        type: "whirlpool", x: aim.target.x, y: aim.target.y, radius,
        life: 2.5 + upgrades.whirlpool * 0.25,
        maxLife: 2.5 + upgrades.whirlpool * 0.25, pulse: 0,
      });
      elementalCooldown("whirlpool", Math.max(7.1, 9.1 - upgrades.whirlpool * 0.4));
    }
  }
  if (upgrades.glacialPulse && !elementalTimers.glacialPulse) {
    const radius = 145 + upgrades.glacialPulse * 19;
    if (nearbyEnemies(player.x, player.y, radius + 20).length) {
      elementalCircle(player.x, player.y, radius,
        (17 + upgrades.glacialPulse * 7) * globalDamageMultiplier(), "frost");
      elementalCooldown("glacialPulse", Math.max(5.3, 6.8 - upgrades.glacialPulse * 0.3));
    }
  }

  // Flame Orbit follows the player; contact cooldowns belong to individual enemies.
  if (upgrades.flameOrbit) {
    orbitFireAngle += dt * 2.5;
    const count = 2 + Math.floor((upgrades.flameOrbit - 1) / 2);
    for (let i = 0; i < count; i++) {
      const angle = orbitFireAngle + i * Math.PI * 2 / count;
      const x = player.x + Math.cos(angle) * (62 + upgrades.flameOrbit * 4);
      const y = player.y + Math.sin(angle) * (62 + upgrades.flameOrbit * 4);
      for (const enemy of nearbyEnemies(x, y, 32)) {
        if (enemy.dead || (enemy.fireOrbitHitUntil || 0) > time) continue;
        const dx = enemy.x - x, dy = enemy.y - y;
        if (dx * dx + dy * dy > (enemyHitRadius(enemy) + 12) ** 2) continue;
        damageEnemyElemental(enemy, (12 + upgrades.flameOrbit * 4) * globalDamageMultiplier(), "fire", x, y, "flameOrbit");
        enemy.fireOrbitHitUntil = time + 0.5;
      }
    }
  }

  // Own light projectiles; they do not interfere with legacy projectiles.
  for (const shot of elementalShots) {
    const steps = Math.max(1, Math.ceil(Math.hypot(shot.vx, shot.vy) * dt / 18));
    for (let step = 0; step < steps && shot.life > 0; step++) {
      shot.x += shot.vx * dt / steps;
      shot.y += shot.vy * dt / steps;
      for (const enemy of nearbyEnemies(shot.x, shot.y, shot.r + 35)) {
        if (enemy.dead || shot.hit.has(enemy)) continue;
        const dx = enemy.x - shot.x, dy = enemy.y - shot.y;
        if (dx * dx + dy * dy > (enemyHitRadius(enemy) + shot.r) ** 2) continue;
        shot.hit.add(enemy);
        if (shot.type === "fireball") {
          elementalCircle(shot.x, shot.y, 65 + upgrades.fireball * 9, shot.damage, "fire");
          shot.life = 0;
        } else {
          const kind = shot.type === "iceShards" ? "frost" : "water";
          damageEnemyElemental(enemy, shot.damage, kind, shot.x - shot.vx * dt, shot.y - shot.vy * dt, shot.type);
          if (shot.type === "waterBolt") {
            elementalAreas.push({ type: "water", x: shot.x, y: shot.y, radius: 37, life: 0.36, maxLife: 0.36 });
            shot.life = 0;
          } else if (shot.hit.size >= 2) shot.life = 0;
        }
        if (!shot.life) break;
      }
    }
    shot.life -= dt;
    if (Math.abs(shot.x - player.x) > W / 2 + 260 || Math.abs(shot.y - player.y) > H / 2 + 260) shot.life = 0;
  }
  elementalShots = elementalShots.filter((shot) => shot.life > 0);

  for (const area of elementalAreas) {
    area.life -= dt;
    if (area.type !== "whirlpool" || area.life <= 0) continue;
    area.pulse -= dt;
    const pulse = area.pulse <= 0;
    if (pulse) area.pulse = 0.45;
    for (const enemy of nearbyEnemies(area.x, area.y, area.radius + 60)) {
      if (enemy.dead) continue;
      const dx = area.x - enemy.x, dy = area.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > area.radius + enemyHitRadius(enemy)) continue;
      const force = enemy === boss ? 60 : 680;
      enemy.knockbackX = (enemy.knockbackX || 0) + dx / distance * force * dt;
      enemy.knockbackY = (enemy.knockbackY || 0) + dy / distance * force * dt;
      enemy.soakedUntil = Math.max(enemy.soakedUntil || 0, time + 0.6);
      if (pulse) damage(enemy, (5 + upgrades.whirlpool * 2) * globalDamageMultiplier(), { x: area.x, y: area.y, type: "whirlpool" }, "water");
    }
  }
  elementalAreas = elementalAreas.filter((area) => area.life > 0).slice(-55);
}

function drawElementalCombat() {
  for (const area of elementalAreas) {
    const alpha = Math.max(0, Math.min(0.55, area.life / area.maxLife * 0.55));
    ctx.save();
    ctx.globalAlpha = alpha;
    const fire = area.type === "fire";
    const frost = area.type === "frost";
    const color = fire ? "#ff955c" : frost ? "#b5f4ff" : "#67bfff";
    ctx.fillStyle = fire ? "#e45722" : frost ? "#8bd5fa" : "#1c7dc3";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow(16);
    ctx.beginPath();
    if (area.type === "tidalWave") {
      ctx.moveTo(area.x, area.y);
      ctx.arc(area.x, area.y, area.radius, area.angle - area.spread / 2, area.angle + area.spread / 2);
      ctx.closePath();
    } else {
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    if (area.type === "whirlpool") {
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius * 0.55, time * 3, time * 3 + Math.PI * 1.55);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const shot of elementalShots) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(Math.atan2(shot.vy, shot.vx));
    const color = shot.type === "fireball" ? "#ff8c4b" : shot.type === "waterBolt" ? "#6fcaff" : "#c5f4ff";
    ctx.shadowColor = color;
    ctx.shadowBlur = glow(18);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (shot.type === "iceShards") {
      ctx.moveTo(shot.r * 2, 0);
      ctx.lineTo(-shot.r, -shot.r);
      ctx.lineTo(-shot.r * 0.4, 0);
      ctx.lineTo(-shot.r, shot.r);
      ctx.closePath();
    } else {
      ctx.ellipse(0, 0, shot.r * 1.5, shot.r, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
  if (upgrades.flameOrbit) {
    const count = 2 + Math.floor((upgrades.flameOrbit - 1) / 2);
    for (let i = 0; i < count; i++) {
      const angle = orbitFireAngle + i * Math.PI * 2 / count;
      ctx.save();
      ctx.fillStyle = "#ffb166";
      ctx.shadowColor = "#ff5423";
      ctx.shadowBlur = glow(19);
      ctx.beginPath();
      ctx.arc(player.x + Math.cos(angle) * (62 + upgrades.flameOrbit * 4),
        player.y + Math.sin(angle) * (62 + upgrades.flameOrbit * 4), 10 + upgrades.flameOrbit, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
