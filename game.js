const c = document.getElementById("game"),
  ctx = c.getContext("2d");
const bossImage = new Image();
bossImage.src = "img/BeauDeHond.png";
const fishBulletImage = new Image();
fishBulletImage.src = "img/MarioVis.png";
const redEnemyImage = new Image();
redEnemyImage.src = "img/Groene Rokerige Cartoonkop.png";
const bombImage = new Image();
bombImage.src = "img/EiadBom.png";
let W, H, dpr;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();
const $ = (id) => document.getElementById(id),
  rand = (a, b) => a + Math.random() * (b - a),
  dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let player,
  enemies = [],
  bullets = [],
  enemyShots = [],
  bombs = [],
  explosions = [],
  gems = [],
  particles = [],
  texts = [],
  time = 0,
  growthTime = 0,
  kills = 0,
  level = 1,
  xp = 0,
  needed = 10,
  paused = true,
  active = false,
  spawn = 0,
  shot = 0,
  bombTimer = 0,
  orbitAngle = 0,
  shake = 0,
  novaTimer = 0,
  novaFlash = 0,
  damageFlash = 0,
  last = 0,
  highest = +(localStorage.getItem("shadowHigh") || 0);
const keys = {};
let upgrades = {},
  gameSpeed = 1,
  boss = null,
  bossShots = [],
  nextBossTime = 180,
  bossNumber = 0;
function reset() {
  player = { x: 0, y: 0, r: 15, hp: 140, maxHp: 140, speed: 235, inv: 0 };
  enemies = [];
  bullets = [];
  enemyShots = [];
  bombs = [];
  explosions = [];
  bossShots = [];
  boss = null;
  nextBossTime = 180;
  bossNumber = 0;
  gems = [];
  particles = [];
  texts = [];
  time = 0;
  growthTime = 0;
  kills = 0;
  level = 1;
  xp = 0;
  needed = 10;
  spawn = 0;
  shot = 0;
  bombTimer = 0;
  orbitAngle = 0;
  shake = 0;
  novaTimer = 0;
  novaFlash = 0;
  damageFlash = 0;
  upgrades = {
    arcane: 1,
    damage: 0,
    speed: 0,
    rate: 0,
    health: 0,
    orbit: 0,
    bladeBlock: 0,
    magnet: 0,
    pierce: 0,
    bomb: 0,
    nova: 0,
    novaRange: 0,
    novaSlow: 0,
    bladeSize: 0,
  };
  active = true;
  paused = false;
  gameSpeed = 1;
  updateSpeedButtons();
  $("speedControls").style.display = "flex";
  $("bossHud").style.display = "none";
  $("bossCountdown").style.display = "block";
  $("overlay").style.display = "none";
  $("pause").style.display = "block";
  hud();
}
function updateSpeedButtons() {
  document
    .querySelectorAll("[data-speed]")
    .forEach((b) =>
      b.classList.toggle("selected", Number(b.dataset.speed) === gameSpeed),
    );
}
document.querySelectorAll("[data-speed]").forEach(
  (b) =>
    (b.onclick = () => {
      gameSpeed = Number(b.dataset.speed);
      updateSpeedButtons();
    }),
);
function hud() {
  const remaining = Math.max(0, nextBossTime - time);
  $("countText").textContent = boss
    ? "BOSS ACTIVE"
    : `BOSS IN ${Math.floor(remaining / 60)}:${String(Math.ceil(remaining % 60)).padStart(2, "0")}`;
  $("countFill").style.width =
    `${100 * Math.min(1, (time - (nextBossTime - 180)) / 180)}%`;
  $("bossCountdown").style.display = boss ? "none" : "block";
  $("healthText").textContent = Math.ceil(player.hp) + " / " + player.maxHp;
  $("hp").style.width = (100 * player.hp) / player.maxHp + "%";
  $("levelText").textContent = level;
  $("xp").style.width = (100 * xp) / needed + "%";
  $("stats").textContent =
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}  ·  ${kills} KILLS  ·  BEST ${highest}  ·  ${enemies.length} ENEMIES`;
}
function panel(title, body, buttons) {
  $("overlay").style.display = "flex";
  $("panel").innerHTML =
    `<h1>${title}</h1><p>${body}</p><div id="choices"></div>`;
  buttons($("choices"));
}
function end() {
  active = false;
  paused = true;
  panel(
    "KKR SUKKEL",
    `You survived ${Math.floor(time / 60)}m ${Math.floor(time % 60)}s, reached level ${level}, and defeated ${kills} monsters.<br>Best kills: ${highest}`,
    (el) => {
      let b = document.createElement("button");
      b.textContent = "TRY AGAIN";
      b.onclick = reset;
      el.append(b);
    },
  );
  $("pause").style.display = "none";
  $("speedControls").style.display = "none";
  $("bossHud").style.display = "none";
  $("bossCountdown").style.display = "none";
}
function update(dt) {
  time += dt;
  if (!boss) growthTime += dt;
  if (upgrades.health) {
    player.hp = Math.min(player.maxHp, player.hp + upgrades.health * 1.2 * dt);
  }
  if (!boss && time >= nextBossTime) spawnBoss();
  player.inv = Math.max(0, player.inv - dt);
  damageFlash = Math.max(0, damageFlash - dt);
  novaFlash = Math.max(0, novaFlash - dt);
  novaTimer += dt;
  if (upgrades.nova && novaTimer >= 2.5) {
    novaTimer %= 2.5;
    novaFlash = 0.18;
    for (const target of enemies) {
      if (!target.dead && dist(target, player) < novaRadius() + target.r) {
        damage(target, 33 * upgrades.nova * (1 + upgrades.damage * 0.28));
      }
    }
  }
  let dx =
      (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0),
    dy = (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0),
    mag = Math.hypot(dx, dy) || 1;
  player.x += (dx / mag) * player.speed * (1 + upgrades.speed * 0.12) * dt;
  player.y += (dy / mag) * player.speed * (1 + upgrades.speed * 0.12) * dt;
  spawn -= dt;
  let interval = Math.max(0.12, 1.6 - growthTime * 0.0026) * (boss ? 2 : 1);
  const enemyLimit = boss ? 60 : 300;
  while (spawn <= 0 && enemies.length < enemyLimit) {
    enemySpawn();
    spawn += interval;
  }
  shot -= dt;
  if (shot <= 0) {
    fire();
    shot = 0.95 * Math.pow(0.87, upgrades.rate);
  }
  orbitAngle += dt * 2.2;
  for (const e of enemies) {
    if (e === boss && Math.abs(player.x - e.x) > 1) {
      e.facing = player.x > e.x ? 1 : -1;
    }
    let a = Math.atan2(player.y - e.y, player.x - e.x);
    const insidePulse =
      upgrades.nova &&
      upgrades.novaSlow &&
      dist(e, player) < novaRadius() + e.r;
    let moveAngle = a;
    let moveSpeed = e.speed * (insidePulse ? 1 - upgrades.novaSlow * 0.11 : 1);
    if (e.kind === 4) {
      const playerDistance = dist(e, player);
      if (playerDistance < 330) moveAngle += Math.PI;
      else if (playerDistance <= 470) moveSpeed = 0;
      else moveSpeed *= 0.65;
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0) {
        enemyFireOrb(e);
        e.shootCooldown = rand(4.5, 7);
      }
    }
    e.x += Math.cos(moveAngle) * moveSpeed * dt;
    e.y += Math.sin(moveAngle) * moveSpeed * dt;
    e.hit = Math.max(0, e.hit - dt);
    if (e === boss) {
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0) bossFire(e);
    }
    if (dist(e, player) < e.r + player.r && player.inv <= 0) {
      player.hp -= e.damage;
      player.inv = 0.85;
      damageFlash = 0.55;
      shake = 13;
      puff(player.x, player.y, "#f76685", 12);
      if (player.hp <= 0) {
        end();
        return;
      }
    }
    if (upgrades.orbit) {
      for (let i = 0; i < upgrades.orbit; i++) {
        let a = orbitAngle + (i * Math.PI * 2) / upgrades.orbit,
          ox = player.x + Math.cos(a) * 67,
          oy = player.y + Math.sin(a) * 67;
        if (
          Math.hypot(e.x - ox, e.y - oy) < e.r + 12 * bladeScale() &&
          (!e.bladeHit || time - e.bladeHit > 0.35)
        ) {
          damage(e, 38 * (1 + upgrades.damage * 0.28));
          e.bladeHit = time;
        }
      }
    }
  }
  enemies = enemies.filter((e) => !e.dead);
  for (const b of bullets) {
    if (b.type === "orb") {
      if (!b.target || b.target.dead) {
        b.target = enemies
          .filter((e) => !e.dead && dist(e, b) < 1500)
          .sort((a, c) => dist(a, b) - dist(c, b))[0];
      }
      if (b.target) {
        const desired = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        const current = Math.atan2(b.vy, b.vx);
        const difference = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
        const angle = current + Math.max(-b.turnRate * dt, Math.min(b.turnRate * dt, difference));
        b.vx = Math.cos(angle) * b.speed;
        b.vy = Math.sin(angle) * b.speed;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    for (const e of enemies) {
      if (!b.hit.has(e) && Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
        damage(e, b.d);
        b.hit.add(e);
        b.pierce--;
        puff(b.x, b.y, "#9b9aff", 3);
        if (b.pierce <= 0) {
          b.life = 0;
          break;
        }
      }
    }
  }
  bullets = bullets.filter((b) => b.life > 0);
  if (upgrades.bomb) {
    bombTimer -= dt;
    if (bombTimer <= 0) {
      bombs.push({
        x: player.x,
        y: player.y,
        fuse: 1.5,
        radius: 150 + upgrades.bomb * 24,
        damage: 180 * (1 + (upgrades.bomb - 1) * 0.42) * (1 + upgrades.damage * 0.28),
      });
      bombTimer = 12;
    }
  }
  const waitingBombs = [];
  for (const bomb of bombs) {
    bomb.fuse -= dt;
    if (bomb.fuse > 0) {
      waitingBombs.push(bomb);
      continue;
    }
    for (const target of enemies) {
      if (!target.dead && dist(target, bomb) < bomb.radius + target.r) {
        damage(target, bomb.damage);
      }
    }
    puff(bomb.x, bomb.y, "#e6a96a", 26);
    explosions.push({ x: bomb.x, y: bomb.y, radius: bomb.radius, life: 0.55, maxLife: 0.55 });
  }
  bombs = waitingBombs;
  for (const explosion of explosions) explosion.life -= dt;
  explosions = explosions.filter((explosion) => explosion.life > 0);
  for (const shot of enemyShots) {
    const desired = Math.atan2(player.y - shot.y, player.x - shot.x);
    const current = Math.atan2(shot.vy, shot.vx);
    const difference = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const angle = current + Math.max(-shot.turnRate * dt, Math.min(shot.turnRate * dt, difference));
    shot.vx = Math.cos(angle) * shot.speed;
    shot.vy = Math.sin(angle) * shot.speed;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (Math.hypot(shot.x - player.x, shot.y - player.y) < shot.r + player.r && player.inv <= 0) {
      player.hp -= shot.damage;
      player.inv = 0.7;
      damageFlash = 0.4;
      shake = 8;
      shot.life = 0;
      puff(player.x, player.y, "#b5a779", 7);
      if (player.hp <= 0) {
        end();
        return;
      }
    }
  }
  enemyShots = enemyShots.filter((shot) => shot.life > 0);
  for (const b of bossShots) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (upgrades.orbit) {
      for (let i = 0; i < upgrades.orbit; i++) {
        const a = orbitAngle + (i * Math.PI * 2) / upgrades.orbit;
        const bladeX = player.x + Math.cos(a) * 67;
        const bladeY = player.y + Math.sin(a) * 67;
        if (
          Math.hypot(b.x - bladeX, b.y - bladeY) < b.r + 10 * bladeScale() &&
          Math.random() < upgrades.bladeBlock * 0.15
        ) {
          b.life = 0;
          puff(b.x, b.y, "#d4b5ff", 4);
          break;
        }
      }
    }
    if (b.life <= 0) continue;
    if (
      Math.hypot(b.x - player.x, b.y - player.y) < b.r + player.r &&
      player.inv <= 0
    ) {
      player.hp -= 13;
      player.inv = 0.7;
      damageFlash = 0.55;
      shake = 13;
      b.life = 0;
      puff(player.x, player.y, "#ff75d0", 9);
      if (player.hp <= 0) {
        end();
        return;
      }
    }
  }
  bossShots = bossShots.filter((b) => b.life > 0);
  enemies = enemies.filter((e) => !e.dead);
  for (const g of gems) {
    let d = dist(g, player),
      range = 90 + upgrades.magnet * 40;
    if (d < range) {
      let speed = Math.max(180, 650 * (1 - d / range));
      g.x += ((player.x - g.x) / (d || 1)) * speed * dt;
      g.y += ((player.y - g.y) / (d || 1)) * speed * dt;
    }
    if (d < player.r + g.r + 5) {
      g.dead = true;
      if (g.kind === "health") {
        player.hp = Math.min(player.maxHp, player.hp + g.value);
      } else {
        addXP(g.value);
        if (paused) break;
      }
    }
  }
  gems = gems.filter((g) => !g.dead);
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
  for (const t of texts) {
    t.y -= 35 * dt;
    t.life -= dt;
  }
  texts = texts.filter((t) => t.life > 0);
  shake = Math.max(0, shake - 35 * dt);
  hud();
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  const backdrop = ctx.createLinearGradient(0, 0, W, H);
  backdrop.addColorStop(0, "#111017");
  backdrop.addColorStop(0.52, "#1a1720");
  backdrop.addColorStop(1, "#1a1c22");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, W, H);
  const ambient = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, Math.max(W, H) * 0.72);
  ambient.addColorStop(0, "rgba(112, 79, 100, 0.12)");
  ambient.addColorStop(0.6, "rgba(80, 93, 105, 0.07)");
  ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, W, H);
  if (!player) return;
  ctx.save();
  const visibleShake = active && !paused ? shake : 0;
  ctx.translate(
    W / 2 - player.x + rand(-visibleShake, visibleShake),
    H / 2 - player.y + rand(-visibleShake, visibleShake),
  );
  const left = player.x - W / 2,
    top = player.y - H / 2,
    fieldStep = 620;
  // Soft, irregular nebula pools and sparse drifting motes replace the old grid.
  for (
    let x = Math.floor(left / fieldStep) * fieldStep;
    x < left + W + fieldStep;
    x += fieldStep
  ) {
    for (
      let y = Math.floor(top / fieldStep) * fieldStep;
      y < top + H + fieldStep;
      y += fieldStep
    ) {
      const seed = Math.abs(Math.sin(x * 0.0017 + y * 0.0023) * 43758.5453) % 1;
      const cx = x + fieldStep * (0.25 + seed * 0.5);
      const cy = y + fieldStep * (0.25 + ((seed * 7.13) % 1) * 0.5);
      const radius = fieldStep * (0.48 + seed * 0.16);
      const cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      cloud.addColorStop(0, seed > 0.5 ? "rgba(116, 77, 101, 0.11)" : "rgba(92, 105, 111, 0.09)");
      cloud.addColorStop(1, "rgba(14, 13, 19, 0)");
      ctx.fillStyle = cloud;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      const moteX = x + ((seed * 13.7) % 1) * fieldStep;
      const moteY = y + ((seed * 31.9) % 1) * fieldStep;
      const twinkle = 0.08 + (Math.sin(time * 0.8 + seed * 30) + 1) * 0.08;
      ctx.fillStyle = `rgba(219, 197, 132, ${twinkle})`;
      ctx.shadowColor = "#a18b56";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(moteX, moteY, 1 + seed * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  for (const g of gems) {
    ctx.fillStyle =
      g.kind === "health"
        ? "#ff526b"
        : g.value >= 20
          ? "#ffc56b"
          : g.value >= 5
            ? "#e48aff"
            : g.value <= 1
              ? "#8ad9a1"
              : "#5be4fa";
    ctx.shadowBlur = 7;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - g.r - 2);
    ctx.lineTo(g.x + g.r, g.y);
    ctx.lineTo(g.x, g.y + g.r + 2);
    ctx.lineTo(g.x - g.r, g.y);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const bomb of bombs) {
    const blink = bomb.fuse < 0.35 && Math.sin(time * 38) > 0;
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    if (bombImage.complete && bombImage.naturalWidth > 0) {
      const size = 52;
      ctx.shadowColor = blink ? "#ff7145" : "#8a6942";
      ctx.shadowBlur = blink ? 16 : 5;
      ctx.drawImage(bombImage, -size / 2, -size / 2, size, size);
      ctx.restore();
      continue;
    }
    ctx.fillStyle = "#211c25";
    ctx.strokeStyle = blink ? "#ffb45f" : "#927451";
    ctx.lineWidth = 2;
    ctx.shadowColor = blink ? "#ff7145" : "#8a6942";
    ctx.shadowBlur = blink ? 16 : 5;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c89a5a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -9);
    ctx.lineTo(7, -15);
    ctx.stroke();
    ctx.fillStyle = blink ? "#fff1a1" : "#ff9458";
    ctx.beginPath();
    ctx.arc(8, -16, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const e of enemies) {
    if (e.kind === 2) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (redEnemyImage.complete && redEnemyImage.naturalWidth > 0) {
        const imageHeight = e.r * 3;
        const imageWidth =
          imageHeight * (redEnemyImage.naturalWidth / redEnemyImage.naturalHeight);
        ctx.shadowBlur = 8;
        ctx.shadowColor = e.hit ? "#fff" : "#91b84c";
        ctx.drawImage(
          redEnemyImage,
          -imageWidth / 2,
          -imageHeight / 2,
          imageWidth,
          imageHeight,
        );
      }
      ctx.restore();
      continue;
    }
    if (e.kind === 3 && bossImage.complete && bossImage.naturalWidth > 0) {
      const imageHeight = e.r * 2.8;
      const imageWidth =
        imageHeight * (bossImage.naturalWidth / bossImage.naturalHeight);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(e.facing || 1, 1);
      ctx.shadowBlur = 22;
      ctx.shadowColor = e.hit ? "#fff" : "#c36aff";
      ctx.drawImage(
        bossImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight,
      );
      ctx.restore();
      continue;
    }
    const bodyColor = e.hit
      ? "#fff"
      : e.kind === 4
        ? "#77715b"
        : e.kind === 2
        ? "#805247"
        : e.kind === 1
          ? "#b28b56"
          : "#66535f";
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.kind === 1) ctx.rotate(Math.atan2(player.y - e.y, player.x - e.x));
    ctx.shadowColor = e.kind === 4 ? "#988a57" : e.kind === 2 ? "#8b5547" : e.kind === 1 ? "#9f824e" : "#79617a";
    ctx.shadowBlur = e.kind === 4 ? 6 : e.kind === 2 ? 7 : 4;
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = e.kind === 4 ? "#373329" : e.kind === 2 ? "#3e2b2c" : e.kind === 1 ? "#4f4132" : "#352d3c";
    ctx.lineWidth = e.kind === 2 ? 3 : 2;
    ctx.beginPath();
    if (e.kind === 4) {
      ctx.moveTo(0, -e.r * 1.3);
      ctx.quadraticCurveTo(e.r * 1.2, -e.r * 0.8, e.r * 0.82, e.r * 0.65);
      ctx.lineTo(0, e.r * 1.1);
      ctx.lineTo(-e.r * 0.82, e.r * 0.65);
      ctx.quadraticCurveTo(-e.r * 1.2, -e.r * 0.8, 0, -e.r * 1.3);
    } else if (e.kind === 1) {
      ctx.moveTo(e.r * 1.5, 0);
      ctx.lineTo(-e.r * 0.65, -e.r * 0.82);
      ctx.lineTo(-e.r * 0.3, 0);
      ctx.lineTo(-e.r * 0.65, e.r * 0.82);
    } else {
      const points = e.kind === 2 ? 12 : 9;
      for (let i = 0; i < points; i++) {
        const angle = (i * Math.PI * 2) / points - Math.PI / 2;
        const wobble = i % 3 === 0 ? 1.08 : i % 2 === 0 ? 0.9 : 1;
        const radius = e.r * (e.kind === 2 && i % 2 === 0 ? 1.12 : wobble);
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (e.kind === 4) {
      ctx.fillStyle = "#d7c27b";
      ctx.shadowColor = "#e5ca70";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.ellipse(-4, -2, 3.2, 4.3, -0.15, 0, Math.PI * 2);
      ctx.ellipse(4, -2, 3.2, 4.3, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#342d24";
      ctx.beginPath();
      ctx.arc(-4, -1, 1.5, 0, Math.PI * 2);
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 2) {
      ctx.strokeStyle = "rgba(226, 175, 135, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f1d795";
      ctx.beginPath();
      ctx.arc(-e.r * 0.26, -e.r * 0.08, 2.5, 0, Math.PI * 2);
      ctx.arc(e.r * 0.26, -e.r * 0.08, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 1) {
      ctx.fillStyle = "#382c24";
      ctx.beginPath();
      ctx.arc(e.r * 0.28, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#f2e3bd";
      ctx.shadowColor = "#dfc782";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(-e.r * 0.28, -e.r * 0.1, e.r * 0.17, 0, Math.PI * 2);
      ctx.arc(e.r * 0.28, -e.r * 0.22, e.r * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#30262a";
      ctx.beginPath();
      ctx.arc(-e.r * 0.23, -e.r * 0.06, e.r * 0.065, 0, Math.PI * 2);
      ctx.arc(e.r * 0.31, -e.r * 0.2, e.r * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#392a31";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, e.r * 0.28, e.r * 0.18, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const b of bossShots) {
    if (fishBulletImage.complete && fishBulletImage.naturalWidth > 0) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.drawImage(fishBulletImage, -28, -28, 56, 56);
      ctx.restore();
    } else {
      ctx.fillStyle = "#ff69bb";
      ctx.shadowColor = "#ff3d9e";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? b.r * 1.4 : b.r * 0.55;
        const x = b.x + Math.cos(angle) * radius;
        const y = b.y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  for (const shot of enemyShots) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.shadowColor = "#a99b69";
    ctx.shadowBlur = 9;
    ctx.fillStyle = "rgba(113, 99, 61, 0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, shot.r * 1.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8c17e";
    ctx.beginPath();
    ctx.arc(0, 0, shot.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const b of bullets) {
    if (b.type === "orb") {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.shadowColor = "#d2a4ff";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(95, 49, 140, 0.36)";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d0a4e8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f0d5ff";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.shadowColor = "#9d88ff";
    ctx.shadowBlur = 15;
    const trail = ctx.createLinearGradient(-b.r * 4, 0, b.r, 0);
    trail.addColorStop(0, "rgba(126, 113, 255, 0)");
    trail.addColorStop(1, "rgba(173, 160, 255, 0.8)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(b.r * 1.8, 0);
    ctx.lineTo(-b.r * 3.8, -b.r * 0.42);
    ctx.lineTo(-b.r * 2.5, 0);
    ctx.lineTo(-b.r * 3.8, b.r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e4e0ff";
    ctx.beginPath();
    ctx.moveTo(b.r * 1.5, 0);
    ctx.lineTo(-b.r * 0.35, -b.r * 0.8);
    ctx.lineTo(-b.r * 0.8, 0);
    ctx.lineTo(-b.r * 0.35, b.r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (upgrades.orbit)
    for (let i = 0; i < upgrades.orbit; i++) {
      let a = orbitAngle + (i * Math.PI * 2) / upgrades.orbit;
      ctx.save();
      ctx.translate(player.x + Math.cos(a) * 67, player.y + Math.sin(a) * 67);
      ctx.rotate(a);
      ctx.scale(bladeScale(), bladeScale());
      ctx.fillStyle = "#e2ccff";
      ctx.shadowColor = "#aa77ff";
      ctx.shadowBlur = 17;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-7, -9);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-7, 9);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    }
  if (upgrades.nova) {
    const pulse = novaFlash > 0;
    ctx.strokeStyle = pulse ? "rgba(180,152,245,.52)" : "rgba(175,108,255,.17)";
    ctx.lineWidth = pulse ? 4 : 2;
    ctx.shadowBlur = 0;
    ctx.shadowColor = "#9778c7";
    ctx.beginPath();
    ctx.arc(player.x, player.y, novaRadius(), 0, 7);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  for (const explosion of explosions) {
    const progress = 1 - explosion.life / explosion.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.fillStyle = "rgba(231, 145, 74, 0.25)";
    ctx.strokeStyle = "#ffd18a";
    ctx.lineWidth = 5 * (1 - progress) + 1;
    ctx.shadowColor = "#ff9b4d";
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius * progress, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  const flashing = player.inv > 0 && Math.floor(time * 20) % 2;
  {
    const moving = keys.d || keys.a || keys.w || keys.s || keys.ArrowRight || keys.ArrowLeft || keys.ArrowUp || keys.ArrowDown;
    const swing = moving ? Math.sin(time * 15) * 4 : 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = flashing ? "#fff" : "#f1e6cb";
    ctx.fillStyle = flashing ? "#fff" : "#f1e6cb";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = "#d7c49b";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(0, -11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 5);
    ctx.moveTo(-1, -2);
    ctx.lineTo(-8, swing);
    ctx.moveTo(1, -2);
    ctx.lineTo(8, -swing);
    ctx.moveTo(0, 5);
    ctx.lineTo(-6, 13 + swing * 0.5);
    ctx.moveTo(0, 5);
    ctx.lineTo(6, 13 - swing * 0.5);
    ctx.stroke();
    ctx.restore();
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.r, p.r);
  }
  ctx.globalAlpha = 1;
  ctx.font = "bold 13px system-ui";
  ctx.textAlign = "center";
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 2);
    ctx.fillStyle = "#fff1ba";
    ctx.fillText(t.n, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (damageFlash > 0) {
    ctx.fillStyle = `rgba(255,32,75,${(0.32 * damageFlash) / 0.55})`;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(255,70,90,${damageFlash / 0.55})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, W, H);
  }
  let v = ctx.createRadialGradient(
    W / 2,
    H / 2,
    Math.min(W, H) * 0.15,
    W / 2,
    H / 2,
    Math.max(W, H) * 0.72,
  );
  v.addColorStop(0, "#0000");
  v.addColorStop(1, "#030310aa");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}
function loop(t) {
  let dt = Math.min((t - last) / 1000 || 0, 0.035);
  last = t;
  if (active && !paused) {
    for (let i = 0; i < gameSpeed; i++) {
      if (active && !paused) update(dt);
    }
  }
  draw();
  requestAnimationFrame(loop);
}
$("start").onclick = reset;
$("pause").onclick = () => {
  if (!active) return;
  paused = !paused;
  if (paused)
    panel("PAUSED", "The night waits for no one.", (el) => {
      let b = document.createElement("button");
      b.textContent = "RESUME";
      b.onclick = () => {
        paused = false;
        $("overlay").style.display = "none";
      };
      el.append(b);
    });
  else $("overlay").style.display = "none";
};
addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  keys[e.key] = true;
  if (e.key === "Escape") {
    if (!active) reset();
    e.preventDefault();
  }
  if (e.key.toLowerCase() === "f") {
    e.preventDefault();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }
  if (active && ["1", "2", "3"].includes(e.key)) {
    gameSpeed = Number(e.key);
    updateSpeedButtons();
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
    e.preventDefault();
  if (e.key.toLowerCase() === "p" && active) {
    if (!paused || $("panel").querySelector("h1")?.textContent === "PAUSED") {
      $("pause").click();
    }
  }
});
addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  keys[e.key] = false;
});
requestAnimationFrame(loop);
