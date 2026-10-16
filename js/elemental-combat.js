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
  if (elementalShots.length >= 160) return null;
  const shot = {
    type, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    r: radius, damage, life: lifetime, hit: new Set(), distance: 0,
  };
  elementalShots.push(shot);
  return shot;
}
function markWetGround(x, y, radius = 70) {
  window.addWorldScar?.("water", x, y, radius);
}
function launchTidalWave(angle, level, { delay = 0, evolved = false } = {}) {
  if (elementalAreas.length > 50) return;
  const radius = (170 + level * 24) * (evolved ? 1.28 : 1);
  elementalAreas.push({
    type: "tidalWave", x: player.x, y: player.y,
    radius: 0, maxRadius: radius, angle, spread: evolved ? 2.2 : 1.45,
    life: 0.95, maxLife: 0.95, delay, hit: new Set(), scarClock: 0,
    evolved,
  });
}
function fireOrbitPositions() {
  if (!upgrades.flameOrbit) return [];
  const level = upgrades.flameOrbit;
  const evolved = !!evolutions.solarCrown;
  const positions = [];
  const rings = evolved
    ? [{ count: 3 + Math.floor(level / 2), radius: 68 + level * 5, direction: 1 },
       { count: 3, radius: 36 + level * 2, direction: -1 }]
    : [{ count: 2 + Math.floor((level - 1) / 2), radius: 62 + level * 4, direction: 1 }];
  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const a = orbitFireAngle * ring.direction + i * Math.PI * 2 / ring.count;
      positions.push({ x: player.x + Math.cos(a) * ring.radius,
        y: player.y + Math.sin(a) * ring.radius,
        r: evolved ? 12 + level : 10 + level });
    }
  }
  return positions;
}
function elementalCircle(x, y, radius, damage, kind, duration = 0.65) {
  elementalAreas.push({ type: kind, x, y, radius, life: duration, maxLife: duration });
  if (elementalAreas.length > 55) elementalAreas.shift();
  const color = kind === "fire" ? "#ff9657" : kind === "frost" ? "#a5eafa" : "#60bcff";
  puff(x, y, color, 8);
  window.addWorldScar?.(kind, x, y, Math.min(150, radius));
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
    enemy.frostUntil = Math.max(enemy.frostUntil || 0, time + (evolutions.absoluteZero && weaponKey === "glacialPulse" ? 3 : 1.7));
    if (evolutions.absoluteZero && weaponKey === "glacialPulse" && enemy !== boss)
      enemy.deepFreezeUntil = Math.max(enemy.deepFreezeUntil || 0, time + 0.85);
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
      const shot = elementalShot("waterBolt", player.x, player.y, aim.angle, evolutions.riptideLance ? 760 : 640, evolutions.riptideLance ? 10 : 7,
        (14 + upgrades.waterBolt * 6) * globalDamageMultiplier() * (evolutions.riptideLance ? 1.2 : 1), 1.65);
      if (shot) shot.pierce = evolutions.riptideLance ? 5 : 2;
      elementalCooldown("waterBolt", Math.max(0.95, 1.5 - upgrades.waterBolt * 0.1));
    }
  }
  if (upgrades.iceShards && !elementalTimers.iceShards) {
    const aim = elementalAim(950);
    if (aim.target) {
      const count = 3 + (upgrades.iceShards >= 4 ? 2 : 0) + (evolutions.crystalStorm ? 2 : 0);
      for (let index = 0; index < count; index++) {
        const offset = (index - (count - 1) / 2) * 0.18;
        elementalShot("iceShards", player.x, player.y, aim.angle + offset, 480, 6,
          (13 + upgrades.iceShards * 4) * globalDamageMultiplier(), 1.7);
      }
      elementalCooldown("iceShards", Math.max(1.75, 2.7 - upgrades.iceShards * 0.17));
    }
  }
  if (upgrades.tidalWave && !elementalTimers.tidalWave) {
    const aim = elementalAim(340 + upgrades.tidalWave * 30);
    if (aim.target) {
      launchTidalWave(aim.angle, upgrades.tidalWave, { evolved: !!evolutions.tsunami });
      if (evolutions.tsunami) launchTidalWave(aim.angle, upgrades.tidalWave, { delay: 0.3, evolved: true });
      elementalCooldown("tidalWave", Math.max(4.4, 5.85 - upgrades.tidalWave * 0.29));
    }
  }
  if (upgrades.whirlpool && !elementalTimers.whirlpool) {
    const aim = elementalAim(800);
    if (aim.target) {
      const evolved = !!evolutions.maelstrom;
      const radius = (115 + upgrades.whirlpool * 11) * (evolved ? 1.25 : 1);
      const positions = evolved
        ? [{x:aim.target.x-85,y:aim.target.y-35},{x:aim.target.x+85,y:aim.target.y+35}]
        : [{x:aim.target.x,y:aim.target.y}];
      for(const p of positions) {
        if(elementalAreas.length>=54)break;
        const duration=(2.5 + upgrades.whirlpool * 0.25) * (evolved ? 1.4 : 1);
        elementalAreas.push({
          type: "whirlpool", x: p.x, y: p.y, radius,
          life: duration, maxLife: duration, pulse: 0, evolved,
        });
        markWetGround(p.x,p.y,radius);
      }
      elementalCooldown("whirlpool", Math.max(7.1, 9.1 - upgrades.whirlpool * 0.4));
    }
  }
  if (upgrades.glacialPulse && !elementalTimers.glacialPulse) {
    const radius = 145 + upgrades.glacialPulse * 19;
    if (nearbyEnemies(player.x, player.y, radius + 20).length) {
      elementalCircle(player.x, player.y, radius * (evolutions.absoluteZero ? 1.18 : 1),
        (17 + upgrades.glacialPulse * 7) * globalDamageMultiplier() * (evolutions.absoluteZero ? 1.2 : 1), "frost");
      if (evolutions.absoluteZero && elementalAreas.length < 50)
        elementalAreas.push({ type:"frostEcho", x:player.x, y:player.y, radius:radius*1.35,
          life:0.5, maxLife:0.5, delay:0.5, damage:(17+upgrades.glacialPulse*7)*globalDamageMultiplier()*0.6 });
      elementalCooldown("glacialPulse", Math.max(5.3, 6.8 - upgrades.glacialPulse * 0.3));
    }
  }

  // Flame Orbit follows the player; contact cooldowns belong to individual enemies.
  if (upgrades.flameOrbit) {
    orbitFireAngle += dt * (evolutions.solarCrown ? 3.15 : 2.5);
    for (const orb of fireOrbitPositions()) {
      for (const enemy of nearbyEnemies(orb.x, orb.y, 36)) {
        if (enemy.dead || (enemy.fireOrbitHitUntil || 0) > time) continue;
        const dx = enemy.x - orb.x, dy = enemy.y - orb.y;
        if (dx * dx + dy * dy > (enemyHitRadius(enemy) + orb.r) ** 2) continue;
        damageEnemyElemental(enemy, (12 + upgrades.flameOrbit * 4) * globalDamageMultiplier() *
          (evolutions.solarCrown ? 1.25 : 1), "fire", orb.x, orb.y, "flameOrbit");
        enemy.fireOrbitHitUntil = time + (evolutions.solarCrown ? 0.42 : 0.5);
      }
    }
  }

  // Elemental projectiles and terrain. Effects are bounded to protect horde FPS.
  const shardFragments = [];
  for (const shot of elementalShots) {
    const steps = Math.max(1, Math.ceil(Math.hypot(shot.vx, shot.vy) * dt / 16));
    for (let step = 0; step < steps && shot.life > 0; step++) {
      const vx = shot.vx * dt / steps, vy = shot.vy * dt / steps;
      shot.x += vx;
      shot.y += vy;
      shot.distance += Math.hypot(vx, vy);
      if (shot.type === "waterBolt" && shot.distance >= (shot.nextWaterMark || 155)) {
        markWetGround(shot.x, shot.y, evolutions.riptideLance ? 104 : 70);
        shot.nextWaterMark = (shot.nextWaterMark || 155) + 210;
      }
      for (const enemy of nearbyEnemies(shot.x, shot.y, shot.r + 40)) {
        if (enemy.dead || shot.hit.has(enemy)) continue;
        const dx = enemy.x - shot.x, dy = enemy.y - shot.y;
        if (dx * dx + dy * dy > (enemyHitRadius(enemy) + shot.r) ** 2) continue;
        shot.hit.add(enemy);
        if (shot.type === "fireball") {
          elementalCircle(shot.x, shot.y, 65 + upgrades.fireball * 9, shot.damage, "fire");
          if (evolutions.meteorRain) {
            for (let i = 0; i < 3 && elementalAreas.length < 52; i++) {
              const angle = time * 2 + i * Math.PI * 2 / 3;
              const distance = 48 + i * 30;
              elementalAreas.push({
                type:"meteorWarning", x:shot.x+Math.cos(angle)*distance,
                y:shot.y+Math.sin(angle)*distance, radius:72,
                life:0.25+i*0.17, maxLife:0.25+i*0.17,
                damage:shot.damage*0.65,
              });
            }
          }
          shot.life = 0;
        } else {
          const kind = shot.type === "iceShards" ? "frost" : "water";
          damageEnemyElemental(enemy, shot.damage, kind,
            shot.x - vx, shot.y - vy, shot.type);
          if (shot.type === "waterBolt") {
            markWetGround(shot.x, shot.y, evolutions.riptideLance ? 100 : 65);
            elementalAreas.push({ type: "water", x: shot.x, y: shot.y,
              radius: 34, life: 0.27, maxLife: 0.27 });
            if (elementalAreas.length > 55) elementalAreas.shift();
            if (shot.hit.size >= (shot.pierce || 2)) shot.life = 0;
          } else {
            window.addWorldScar?.("frost", shot.x, shot.y, 55);
            // Crystal Storm fragments fork in two directions, once per main shard.
            if (evolutions.crystalStorm && !shot.fragment && shardFragments.length < 30) {
              const base = Math.atan2(shot.vy, shot.vx);
              for (const dir of [-1, 1]) shardFragments.push({
                x:shot.x,y:shot.y,angle:base+dir*.68,damage:shot.damage*.48,
              });
            }
            if (shot.hit.size >= (shot.fragment ? 1 : 2)) shot.life = 0;
          }
        }
        if (!shot.life) break;
      }
    }
    shot.life -= dt;
    if (Math.abs(shot.x - player.x) > W / 2 + 260 ||
        Math.abs(shot.y - player.y) > H / 2 + 260) shot.life = 0;
  }
  elementalShots = elementalShots.filter((shot) => shot.life > 0);
  for (const s of shardFragments) {
    const child = elementalShot("iceShards", s.x, s.y, s.angle, 410, 5, s.damage, .65);
    if (child) child.fragment = true;
  }

  for (const area of elementalAreas) {
    if ((area.delay || 0) > 0) {
      area.delay -= dt;
      if (area.delay > 0) continue;
    }
    area.life -= dt;
    if (area.type === "meteorWarning") {
      if (area.life <= 0) {
        elementalCircle(area.x,area.y,area.radius,area.damage,"fire",.38);
      }
      continue;
    }
    if (area.type === "frostEcho") {
      if (area.life <= 0)
        elementalCircle(area.x,area.y,area.radius,area.damage,"frost",.85);
      continue;
    }
    if (area.life <= 0) continue;
    if (area.type === "tidalWave") {
      const progress = 1 - area.life / area.maxLife;
      area.radius = area.maxRadius * Math.max(0,progress);
      area.scarClock = (area.scarClock || 0) - dt;
      if (area.scarClock <= 0 && area.radius > 40) {
        area.scarClock = .23;
        for (const offset of [-.65,0,.65]) {
          const a = area.angle + offset * area.spread / 2;
          markWetGround(area.x + Math.cos(a)*area.radius,
            area.y + Math.sin(a)*area.radius,area.evolved?120:94);
        }
      }
      for (const enemy of nearbyEnemies(area.x,area.y,area.radius + 80)) {
        if (enemy.dead || area.hit.has(enemy)) continue;
        const dx=enemy.x-area.x, dy=enemy.y-area.y;
        const dist=Math.hypot(dx,dy);
        const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-area.angle),
          Math.cos(Math.atan2(dy,dx)-area.angle));
        if (Math.abs(diff)>area.spread/2 ||
            Math.abs(dist-area.radius)>enemyHitRadius(enemy)+32) continue;
        area.hit.add(enemy);
        damageEnemyElemental(enemy, (17+upgrades.tidalWave*8)*globalDamageMultiplier()*
          (area.evolved?1.12:1),"water",area.x,area.y,"tidalWave");
        enemy.knockbackX = (enemy.knockbackX || 0)+
          Math.cos(area.angle)*(enemy===boss?20:185);
        enemy.knockbackY = (enemy.knockbackY || 0)+
          Math.sin(area.angle)*(enemy===boss?20:185);
      }
      continue;
    }
    if (area.type !== "whirlpool") continue;
    area.pulse -= dt;
    const pulse = area.pulse <= 0;
    if (pulse) area.pulse = area.evolved ? 0.33 : 0.45;
    for (const enemy of nearbyEnemies(area.x,area.y,area.radius + 60)) {
      if (enemy.dead) continue;
      const dx=area.x-enemy.x,dy=area.y-enemy.y;
      const distance=Math.hypot(dx,dy)||1;
      if (distance>area.radius+enemyHitRadius(enemy)) continue;
      const force=enemy===boss?60:(area.evolved?920:680);
      enemy.knockbackX=(enemy.knockbackX||0)+dx/distance*force*dt;
      enemy.knockbackY=(enemy.knockbackY||0)+dy/distance*force*dt;
      enemy.soakedUntil=Math.max(enemy.soakedUntil||0,time+.6);
      if(pulse) damage(enemy,(5+upgrades.whirlpool*2)*globalDamageMultiplier()*
        (area.evolved?1.2:1),{x:area.x,y:area.y,type:"whirlpool"},"water");
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
