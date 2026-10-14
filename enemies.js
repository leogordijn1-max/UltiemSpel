function enemySpawn() {
  let a = rand(0, Math.PI * 2),
    r = Math.max(W, H) * 0.72;
  let type = Math.random(),
    e = {
      x: player.x + Math.cos(a) * r,
      y: player.y + Math.sin(a) * r,
      r: 13,
      hp: 20 + growthTime * 0.08,
      speed: rand(43, 63) + growthTime * 0.06,
      damage: 8,
      kind: 0,
      hit: 0,
      noXp: !!boss,
    };
  if (type < Math.min(0.32, growthTime / 200)) {
    e.kind = 1;
    e.r = 10;
    e.hp *= 0.55;
    e.speed *= 1.75;
    e.damage = 6;
  } else if (type > 0.94) {
    e.kind = 2;
    e.r = 23;
    e.hp *= 4;
    e.speed *= 0.7;
    e.damage = 14;
  } else if (type > 0.88) {
    e.kind = 4;
    e.r = 15;
    e.hp *= 1.25;
    e.speed = rand(34, 42) + growthTime * 0.025;
    e.damage = 6;
    e.shootCooldown = rand(4.5, 7);
  }
  e.damage += growthTime * 0.004;
  enemies.push(e);
}
function puff(x, y, color, n = 8) {
  for (let i = 0; i < n; i++)
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
function damage(e, d) {
  e.hp -= d;
  e.hit = 0.12;
  if (e === boss) {
    $("bossFill").style.width = (100 * Math.max(0, e.hp)) / e.maxHp + "%";
  }
  texts.push({ x: e.x, y: e.y - 15, n: Math.ceil(d), life: 0.65 });
  if (e.hp <= 0) {
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
        value: soulValue,
      });
    }
    if (e.kind === 1 && Math.random() < 0.15) {
      gems.push({ x: e.x, y: e.y, r: 7, kind: "health", value: 2 });
    }
    e.dead = true;
    if (e === boss) {
      nextBossTime = time + 180;
      boss = null;
      $("bossHud").style.display = "none";
      bossShots = [];
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
function fire() {
  const targets = enemies
    .filter((e) => !e.dead && visibleEnemy(e, 18))
    .sort((a, b) => dist(a, player) - dist(b, player));
  if (!targets.length) return;
  for (let i = 0; i < Math.min(upgrades.arcane, 5); i++) {
    const target = targets[i % targets.length],
      lead = Math.min(0.35, dist(target, player) / 560),
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
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * 560,
      vy: Math.sin(a) * 560,
      life: 1.8,
      r: 5,
      d: 14 * (1 + upgrades.damage * 0.28),
      pierce: upgrades.pierce + 1,
      hit: new Set(),
    });
  }
}
function enemyFireOrb(e) {
  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  enemyShots.push({
    type: "enemyOrb",
    x: e.x,
    y: e.y,
    vx: Math.cos(angle) * 105,
    vy: Math.sin(angle) * 105,
    speed: 105,
    turnRate: 1.15,
    life: 9,
    r: 8,
    damage: 9,
  });
}
function spawnBoss() {
  bossNumber++;
  const a = rand(0, Math.PI * 2),
    radius = Math.hypot(W, H) * 0.65 + 90;
  const hp = (800 + bossNumber * 210 + growthTime * 0.4) * 1.18;
  boss = {
    x: player.x + Math.cos(a) * radius,
    y: player.y + Math.sin(a) * radius,
    r: (43 + bossNumber * 4) * (1 + bossNumber * 0.06),
    hp,
    maxHp: hp,
    speed: 48 + bossNumber * 3,
    damage: 24 + growthTime * 0.01,
    kind: 3,
    facing: 1,
    hit: 0,
    shootCooldown: 1.3,
    shotAngle: 0,
  };
  enemies.push(boss);
  $("bossHud").style.display = "block";
  $("bossFill").style.width = "100%";
}
function bossFire(e) {
  // Fire a short, aimed fan toward the player's current position.
  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  for (const offset of [-0.12, 0, 0.12]) {
    const a = angle + offset;
    bossShots.push({
      x: e.x,
      y: e.y,
      vx: Math.cos(a) * 165,
      vy: Math.sin(a) * 165,
      r: 7,
      life: 4.5,
    });
  }
  e.shootCooldown = 2.4;
}
