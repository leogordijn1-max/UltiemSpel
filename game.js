const c = document.getElementById("game"),
  ctx = c.getContext("2d");
const bossImage = new Image();
bossImage.src = "BeauDeHond.png";
const fishBulletImage = new Image();
fishBulletImage.src = "MarioVis.png";
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
    "NIGHT FALLS",
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
    shot = 0.85 * Math.pow(0.87, upgrades.rate);
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
    const moveSpeed = e.speed * (insidePulse ? 1 - upgrades.novaSlow * 0.1 : 1);
    e.x += Math.cos(a) * moveSpeed * dt;
    e.y += Math.sin(a) * moveSpeed * dt;
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
  ctx.fillStyle = "#101526";
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
    grid = 70;
  ctx.strokeStyle = "#22283b";
  ctx.lineWidth = 1;
  for (let x = Math.floor(left / grid) * grid; x < left + W + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + H);
    ctx.stroke();
  }
  for (let y = Math.floor(top / grid) * grid; y < top + H + grid; y += grid) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + W, y);
    ctx.stroke();
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
  for (const e of enemies) {
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
    ctx.fillStyle = e.hit
      ? "#fff"
      : e.kind === 3
        ? "#a349df"
        : e.kind === 2
          ? "#d45d78"
          : e.kind === 1
            ? "#f2b565"
            : "#754a9f";
    ctx.shadowBlur = e.kind === 3 ? 18 : 0;
    ctx.shadowColor = "#c36aff";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#180c24";
    ctx.beginPath();
    ctx.arc(e.x - e.r * 0.28, e.y - 2, Math.max(2, e.r * 0.12), 0, 7);
    ctx.arc(e.x + e.r * 0.28, e.y - 2, Math.max(2, e.r * 0.12), 0, 7);
    ctx.fill();
    if (e.kind === 2) {
      ctx.fillStyle = "#381b38";
      ctx.fillRect(e.x - e.r, e.y - e.r - 12, e.r * 2, 5);
      ctx.fillStyle = "#f87da7";
      ctx.fillRect(
        e.x - e.r,
        e.y - e.r - 12,
        e.r * 2 * Math.max(0, e.hp / ((20 + growthTime * 0.08) * 4)),
        5,
      );
    }
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
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.fill();
    }
  }
  for (const b of bullets) {
    ctx.fillStyle = "#a9a5ff";
    ctx.shadowColor = "#9181ff";
    ctx.shadowBlur = 17;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
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
  ctx.fillStyle =
    player.inv > 0 && Math.floor(time * 20) % 2 ? "#fff" : "#6fe3c6";
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#42eac3";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, 7);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#142438";
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 3, 2.4, 0, 7);
  ctx.arc(player.x + 5, player.y - 3, 2.4, 0, 7);
  ctx.fill();
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
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
    e.preventDefault();
  if (e.key.toLowerCase() === "p" && active) $("pause").click();
});
addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  keys[e.key] = false;
});
requestAnimationFrame(loop);
