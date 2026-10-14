// Canvas, image assets, and shared helpers.
const c = document.getElementById("game"),
  ctx = c.getContext("2d");
const bossImage = new Image();
bossImage.src = "img/BeauDeHond.png";
const fishBulletImage = new Image();
fishBulletImage.src = "img/MarioVis.png";
const redEnemyImage = new Image();
redEnemyImage.src = "img/ZombieMike.png";
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
 
// Shared game state. Other scripts use these values for enemies, upgrades, and drawing.
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
  pendingLevelUps = 0,
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
  difficulty = "normal",
  menuDifficulty = localStorage.getItem("shadowDifficulty") || "normal",
  boss = null,
  bossShots = [],
  nextBossTime = 180,
  bossNumber = 0,
  dashTimer = 0,
  dashCooldown = 0,
  dashDirectionX = 1,
  dashDirectionY = 0,
  waveNumber = 0,
  waveTimer = 70,
  waveDuration = 70,
  notifications = [],
  evolutionFlash = null,
  lightningSegments = [],
  flameBursts = [],
  frostZones = [],
  weaponTimers = { chain: 0, boomerang: 0, flame: 0, frost: 0 },
  evolutions = {},
  touchMoveX = 0,
  touchMoveY = 0,
  bossesDefeated = 0,
  permanentDamageBonus = 0,
  runDamageTaken = 0,
  metaProgress = loadMetaProgress(),
  startWeapon = "arcane",
  unlockableWeapons = [],
  unlockedWeapons = [],
  selectedWeapons = loadSelectedWeapons(),
  showFps = localStorage.getItem("shadowShowFps") === "true",
  enemyGrid = new Map(),
  hudUpdateTimer = 0,
  fpsFrames = 0,
  fpsElapsed = 0,
  currentFps = 0;
let recentAchievements = [];

function loadMetaProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("shadowProgress") || "{}");
    return {
      points: Math.max(0, Number(saved.points) || 0),
      hpLevel: Math.min(5, Math.max(0, Math.floor(Number(saved.hpLevel) || 0))),
      damageLevel: Math.min(5, Math.max(0, Math.floor(Number(saved.damageLevel) || 0))),
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      runs: Array.isArray(saved.runs) ? saved.runs : [],
      totals: {
        kills: Number(saved.totals?.kills) || 0,
        bosses: Number(saved.totals?.bosses) || 0,
        runs: Number(saved.totals?.runs) || 0,
      },
    };
  } catch {
    return { points: 0, hpLevel: 0, damageLevel: 0, achievements: [], runs: [], totals: { kills: 0, bosses: 0, runs: 0 } };
  }
}

function saveMetaProgress() {
  localStorage.setItem("shadowProgress", JSON.stringify(metaProgress));
}

function loadSelectedWeapons() {
  try {
    const saved = JSON.parse(localStorage.getItem("shadowWeapons") || "null");
    const savedList = Array.isArray(saved)
      ? saved
      : saved && typeof saved === "object"
        ? [saved.startWeapon, ...(Array.isArray(saved.unlockableWeapons) ? saved.unlockableWeapons : [])]
        : [];
    const valid = [...new Set(savedList.filter((key) => weaponCatalog.some((weapon) => weapon.key === key)))].slice(0, 3);
    startWeapon = valid[0] || "arcane";
    unlockableWeapons = valid.slice(1);
    while (unlockableWeapons.length < 2) {
      const next = weaponCatalog.find((weapon) => weapon.key !== startWeapon && !unlockableWeapons.includes(weapon.key));
      if (!next) break;
      unlockableWeapons.push(next.key);
    }
    return [startWeapon, ...unlockableWeapons];
  } catch {
    startWeapon = "arcane";
    unlockableWeapons = ["orbit", "bomb"];
    return [startWeapon, ...unlockableWeapons];
  }
}

function unlockAchievement(id, title) {
  if (metaProgress.achievements.some((item) => item.id === id)) return;
  metaProgress.achievements.push({ id, title, date: new Date().toLocaleDateString() });
  recentAchievements.push(title);
  notify(`ACHIEVEMENT · ${title}`, "achievement", 5);
  saveMetaProgress();
}

function recordRun() {
  const survived = Math.floor(time);
  const earned = Math.floor(kills / 100) + bossesDefeated * 3;
  metaProgress.points += earned;
  metaProgress.totals.kills += kills;
  metaProgress.totals.bosses += bossesDefeated;
  metaProgress.totals.runs += 1;
  metaProgress.runs.push({ survived, kills, level, bosses: bossesDefeated, difficulty });
  metaProgress.runs = metaProgress.runs.sort((a, b) => b.survived - a.survived).slice(0, 5);
  if (kills >= 100) unlockAchievement("kills100", "100 Kills");
  if (metaProgress.totals.kills >= 1000) unlockAchievement("kills1000", "1000 Kills");
  if (survived >= 300) unlockAchievement("survive5", "Five Minutes");
  if (survived >= 600) unlockAchievement("survive10", "Ten Minutes");
  if (bossesDefeated >= 1) unlockAchievement("boss1", "First Boss");
  if (bossesDefeated >= 3) unlockAchievement("boss3", "Boss Hunter");
  if (Object.keys(evolutions).length) unlockAchievement("evolution", "First Evolution");
  if (runDamageTaken === 0) unlockAchievement("flawless", "Untouched Run");
  saveMetaProgress();
}

// Start a fresh run and reset every timer, entity, and upgrade.
function reset() {
  for (const key in keys) keys[key] = false;
  touchMoveX = 0;
  touchMoveY = 0;
  difficulty = menuDifficulty;
  bossesDefeated = 0;
  runDamageTaken = 0;
  unlockedWeapons = [startWeapon];
  recentAchievements = [];
  player = {
    x: 0,
    y: 0,
    r: 15,
    hp: 140 + metaProgress.hpLevel * 8,
    maxHp: 140 + metaProgress.hpLevel * 8,
    speed: 235,
    inv: 0,
    facingX: 1,
    facingY: 0,
  };
  enemies = [];
  enemyGrid.clear();
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
  pendingLevelUps = 0;
  spawn = 0;
  shot = 0;
  bombTimer = 0;
  orbitAngle = 0;
  shake = 0;
  novaTimer = 0;
  novaFlash = 0;
  damageFlash = 0;
  dashTimer = 0;
  dashCooldown = 0;
  dashDirectionX = 1;
  dashDirectionY = 0;
  waveNumber = 0;
  waveTimer = 70;
  waveDuration = 70;
  notifications = [];
  $("notifications").replaceChildren();
  evolutionFlash = null;
  lightningSegments = [];
  flameBursts = [];
  frostZones = [];
  weaponTimers = { chain: 0, boomerang: 0, flame: 0, frost: 0 };
  evolutions = {};
  upgrades = {
    ...makeStartingWeaponLevels(startWeapon),
    damage: 0,
    speed: 0,
    rate: 0,
    health: 0,
    bladeBlock: 0,
    magnet: 0,
    pierce: 0,
    novaRange: 0,
    novaSlow: 0,
    bladeSize: 0,
    critChance: 0,
    critDamage: 0,
    knockback: 0,
  };
  permanentDamageBonus = metaProgress.damageLevel * 0.35 * 0.28;
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

function notify(message, type = "info", duration = 3.5) {
  const container = $("notifications");
  if (!container) return;
  const item = document.createElement("div");
  item.className = `toast toast-${type}`;
  item.textContent = message;
  container.append(item);
  notifications.push(item);
  while (notifications.length > 4) notifications.shift().remove();
  setTimeout(() => {
    item.classList.add("toast-leaving");
    setTimeout(() => {
      item.remove();
      notifications = notifications.filter((toast) => toast !== item);
    }, 250);
  }, duration * 1000);
}

// Keep projectiles near the active play area so old shots cannot accumulate.
function projectileOutsideArena(projectile) {
  return (
    Math.abs(projectile.x - player.x) > W / 2 + 240 ||
    Math.abs(projectile.y - player.y) > H / 2 + 240
  );
}

function tryBladeBlock(projectile) {
  if (!upgrades.orbit || !upgrades.bladeBlock || projectile.blocked) return false;
  const baseChance = Math.min(0.95, upgrades.bladeBlock * 0.16 + Math.max(0, upgrades.bladeBlock - 2) * 0.04 + (evolutions.aegisRing ? 0.08 : 0));
  for (let index = 0; index < upgrades.orbit; index++) {
    const angle = orbitAngle + (index * Math.PI * 2) / upgrades.orbit;
    const bladeX = player.x + Math.cos(angle) * 67;
    const bladeY = player.y + Math.sin(angle) * 67;
    const radius = projectile.r + 10 * bladeScale();
    const dx = projectile.x - bladeX;
    const dy = projectile.y - bladeY;
    if (dx * dx + dy * dy < radius * radius && Math.random() < baseChance) {
      projectile.blocked = true;
      projectile.life = 0;
      puff(projectile.x, projectile.y, "#d4e8ff", 4);
      playSfx("block");
      return true;
    }
  }
  return false;
}

function tryDodge() {
  const chance = Math.min(0.12, Math.max(0, upgrades.speed - 2) * 0.03);
  if (!chance || Math.random() >= chance) return false;
  player.inv = 0.32;
  puff(player.x, player.y, "#c7f3e2", 7);
  return true;
}

// Dash in the current movement direction, or continue the last facing direction.
function startDash() {
  if (!active || paused || dashCooldown > 0) return;

  let dx =
    (keys.d || keys.ArrowRight ? 1 : 0) -
    (keys.a || keys.ArrowLeft ? 1 : 0) + touchMoveX;
  let dy =
    (keys.s || keys.ArrowDown ? 1 : 0) -
    (keys.w || keys.ArrowUp ? 1 : 0) + touchMoveY;
  const length = Math.hypot(dx, dy);

  if (length) {
    dx /= length;
    dy /= length;
  } else {
    dx = player.facingX;
    dy = player.facingY;
  }

  dashDirectionX = dx;
  dashDirectionY = dy;
  dashTimer = 0.28;
  dashCooldown = 4.5;
  player.inv = Math.max(player.inv, 0.2);
}

// HUD and overlay helpers.
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
  const dashStatus = $("dashStatus");
  dashStatus.textContent =
    dashCooldown <= 0
      ? "DASH READY · SHIFT"
      : `DASH ${dashCooldown.toFixed(1)}s · SHIFT`;
  dashStatus.classList.toggle("ready", dashCooldown <= 0);
  $("waveText").textContent = `WAVE ${waveNumber || 1} · NEXT IN ${Math.floor(waveTimer / 60)}:${String(Math.ceil(waveTimer % 60)).padStart(2, "0")}`;
  $("waveFill").style.width = `${Math.min(100, (1 - waveTimer / waveDuration) * 100)}%`;
  $("healthText").textContent = Math.ceil(player.hp) + " / " + player.maxHp;
  $("hp").style.width = (100 * player.hp) / player.maxHp + "%";
  $("levelText").textContent = level;
  $("xp").style.width = (100 * xp) / needed + "%";
  $("stats").textContent =
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}  ·  ${kills} KILLS  ·  BEST ${highest}  ·  ${enemies.length} ENEMIES`;
  const weaponNames = Object.fromEntries(weaponCatalog.map((weapon) => [weapon.key, weapon.name]));
  $("loadout").innerHTML = selectedWeapons
    .map((key, index) => {
      const name = weaponNames[key];
      const locked = !unlockedWeapons.includes(key);
      const evolution = evolutionRecipes.find((recipe) => recipe.weapon === key && evolutions[recipe.id]);
      const cap = maxUpgradeLevel(key);
      const state = locked ? "LOCKED · LEVEL-UP TO UNLOCK" : evolution ? `MAX ${upgrades[key]}/${cap} · EVOLVED` : `LEVEL ${upgrades[key]}/${cap}`;
      const role = index === 0 ? "START WEAPON" : locked ? `UNLOCKABLE ${index}` : `WEAPON SLOT ${index + 1}`;
      return `<span class="weapon-slot ${locked ? "weapon-locked" : evolution ? "weapon-evolved" : ""}"><b>${role}</b><strong>${name}</strong><small>${state}</small></span>`;
    }).join("");
  $("fpsCounter").hidden = !showFps;
  if (showFps) $("fpsCounter").textContent = `${currentFps} FPS · ${enemies.length} enemies · ${bullets.length + enemyShots.length + bossShots.length} shots`;
}

function panel(title, body, buttons) {
  $("overlay").style.display = "flex";
  $("panel").innerHTML =
    `<h1>${title}</h1><p>${body}</p><div id="choices"></div>`;
  buttons($("choices"));
}

function end() {
  playSfx("gameover");
  recordRun();
  const activeWeapons = Object.entries({
    "Arcane Bolt": upgrades.arcane,
    "Spirit Blades": upgrades.orbit,
    "Eiad Bom": upgrades.bomb,
    "Death Pulse": upgrades.nova,
    "Chain Lightning": upgrades.chain,
    Boomerang: upgrades.boomerang,
    "Flame Cone": upgrades.flame,
    "Frost Orb": upgrades.frost,
  }).filter(([, levelValue]) => levelValue > 0).map(([name]) => name).join(", ");
  active = false;
  paused = true;
  panel(
    "KKR SUKKEL",
    `You survived ${Math.floor(time / 60)}m ${Math.floor(time % 60)}s, reached level ${level}, defeated ${kills} monsters, and beat ${bossesDefeated} bosses.<br>Weapons: ${activeWeapons}<br>Best kills: ${highest}<br>Permanent points earned: ${Math.floor(kills / 100) + bossesDefeated * 3}${recentAchievements.length ? `<br>Unlocked: ${recentAchievements.join(", ")}` : ""}`,
    (el) => {
      let b = document.createElement("button");
      b.textContent = "TRY AGAIN";
      b.onclick = reset;
      el.append(b);
      const menuButton = document.createElement("button");
      menuButton.textContent = "MAIN MENU";
      menuButton.onclick = showMainMenu;
      el.append(menuButton);
    },
  );
  $("pause").style.display = "none";
  $("speedControls").style.display = "none";
  $("bossHud").style.display = "none";
  $("bossCountdown").style.display = "none";
}

// Advance the simulation by one frame.
function update(dt) {
  time += dt;
  hudUpdateTimer += dt;
  if (!boss) growthTime += dt;
  updateSpecialWeapons(dt);

  dashTimer = Math.max(0, dashTimer - dt);
  dashCooldown = Math.max(0, dashCooldown - dt);

  if (!boss) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      waveNumber++;
      waveDuration = Math.max(45, 80 - waveNumber * 2);
      waveTimer = waveDuration;
      notify(`WAVE ${waveNumber} · ENEMIES INCOMING`, "wave", 4);

      const waveSize = Math.min(6 + waveNumber, 16);
      const firstWaveEnemy = enemies.length;
      for (let i = 0; i < waveSize && enemies.length < 300; i++) enemySpawn();

      const wavePower = 1 + waveNumber * 0.025;
      for (const enemy of enemies.slice(firstWaveEnemy)) {
        enemy.hp *= wavePower;
        enemy.damage *= 1 + waveNumber * 0.01;
      }
    }
  }
  if (upgrades.health) {
    player.hp = Math.min(player.maxHp, player.hp + upgrades.health * 1.2 * dt);
  }
  if (!boss && time >= nextBossTime) spawnBoss();
  player.inv = Math.max(0, player.inv - dt);
  damageFlash = Math.max(0, damageFlash - dt);
  novaFlash = Math.max(0, novaFlash - dt);
  novaTimer += dt * (1 + upgrades.rate * 0.13);
  if (upgrades.nova && novaTimer >= 2.5) {
    novaTimer %= 2.5;
    novaFlash = 0.18;
    for (const target of nearbyEnemies(player.x, player.y, novaRadius() + 100)) {
      if (dist(target, player) < novaRadius() + enemyHitRadius(target)) {
        damage(target, 33 * upgrades.nova * globalDamageMultiplier());
      }
    }
  }
  let dx =
      (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0) + touchMoveX,
    dy = (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0) + touchMoveY,
    mag = Math.hypot(dx, dy) || 1;
  const movementSpeed = player.speed * (1 + upgrades.speed * 0.12);
  if (dx || dy) {
    player.facingX = dx / mag;
    player.facingY = dy / mag;
  }
  if (dashTimer > 0) {
    player.x += dashDirectionX * movementSpeed * 4 * dt;
    player.y += dashDirectionY * movementSpeed * 4 * dt;
  } else {
    player.x += (dx / mag) * movementSpeed * dt;
    player.y += (dy / mag) * movementSpeed * dt;
  }
  spawn -= dt;
  const profile = difficultyProfiles[difficulty] || difficultyProfiles.normal;
  let interval =
    (Math.max(0.12, 1.6 - growthTime * 0.0026) * (boss ? 2 : 1)) /
    profile.spawnRate;
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
    if (e.dead) continue;

    if (e === boss && Math.abs(player.x - e.x) > 1) {
      e.facing = player.x > e.x ? 1 : -1;
    }
    const playerDx = player.x - e.x;
    const playerDy = player.y - e.y;
    const playerDistance = Math.hypot(playerDx, playerDy);
    let a = Math.atan2(playerDy, playerDx);
    const insidePulse =
      upgrades.nova &&
      upgrades.novaSlow &&
      playerDistance < novaRadius() + enemyHitRadius(e);
    let moveAngle = a;
    let moveSpeed =
      e.speed *
      (e.impactSlowUntil > time ? Math.max(0.58, 0.82 - (upgrades.knockback - 3) * 0.06) : 1) *
      (insidePulse ? 1 - upgrades.novaSlow * 0.11 : 1) *
      (e.frostUntil > time ? 0.48 : 1);
    if (e.burnUntil > time && e.nextBurnTick <= time) {
      e.nextBurnTick = time + 0.5;
      damage(e, e.burnDps * 0.5);
      if (e.dead) continue;
    }
    if (e.kind === 4) {
      const movementMode = rangedEnemyMovementMode(e, playerDistance);
      if (movementMode === "retreat") moveAngle += Math.PI;
      else if (movementMode === "hold") moveSpeed = 0;
      else moveSpeed *= 0.65;

      if (rangedEnemyCanAttack(e, playerDistance)) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          enemyFireOrb(e);
          e.shootCooldown = rand(4.5, 7);
        }
      }
    }
    if (e === boss) {
      if (e.chargeActive > 0) {
        e.chargeActive = Math.max(0, e.chargeActive - dt);
        e.x += e.chargeX * e.chargeSpeed * dt;
        e.y += e.chargeY * e.chargeSpeed * dt;
      } else {
        e.chargeCooldown -= dt;
        if (e.chargeCooldown <= 0 && !e.chargeWarning) {
          e.chargeX = Math.cos(a);
          e.chargeY = Math.sin(a);
          e.chargeSpeed = e.phaseTwo ? 430 : 350;
          e.chargeWarning = 0.8;
        }
        if (e.chargeWarning > 0) {
          e.chargeWarning = Math.max(0, e.chargeWarning - dt);
          if (!e.chargeWarning) {
            e.chargeActive = 0.42;
            e.chargeCooldown = e.phaseTwo ? 5.5 : 8;
          }
        }
        e.x += Math.cos(moveAngle) * moveSpeed * dt;
        e.y += Math.sin(moveAngle) * moveSpeed * dt;
      }
      e.phaseTwo = e.hp < e.maxHp * 0.5;
    } else {
      e.x += Math.cos(moveAngle) * moveSpeed * dt;
      e.y += Math.sin(moveAngle) * moveSpeed * dt;
    }

    if (e.knockbackX || e.knockbackY) {
      e.x += e.knockbackX * dt;
      e.y += e.knockbackY * dt;
      const fade = Math.exp(-8 * dt);
      e.knockbackX *= fade;
      e.knockbackY *= fade;
      if (Math.abs(e.knockbackX) < 2) e.knockbackX = 0;
      if (Math.abs(e.knockbackY) < 2) e.knockbackY = 0;
    }

    e.hit = Math.max(0, e.hit - dt);
    if (e === boss) {
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0) bossFire(e);
      if (e.phaseTwo) {
        e.minionCooldown = (e.minionCooldown ?? 8) - dt;
        if (e.minionCooldown <= 0 && enemies.length < 58) {
          e.minionCooldown = 10;
          for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3 + time;
            enemies.push({
              x: e.x + Math.cos(angle) * 115,
              y: e.y + Math.sin(angle) * 115,
              r: 11,
              hp: (20 + growthTime * 0.08) * (difficultyProfiles[difficulty]?.enemyHealth || 1),
              speed: 66 + growthTime * 0.05,
              damage: 8 + growthTime * 0.004,
              kind: 0,
              hit: 0,
              noXp: true,
              summoned: true,
              knockbackX: 0,
              knockbackY: 0,
            });
          }
          if (!e.summonAnnounced) {
            notify("BOSS SUMMONS · ADDITIONAL ENEMIES", "boss", 3.5);
            e.summonAnnounced = true;
          }
        }
      }
    }
    if (dist(e, player) < enemyHitRadius(e) + player.r && player.inv <= 0) {
      if (tryDodge()) continue;
      player.hp -= e.damage;
      runDamageTaken += e.damage;
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
          Math.hypot(e.x - ox, e.y - oy) < enemyHitRadius(e) + 12 * bladeScale() &&
          (!e.bladeHit || time - e.bladeHit > 0.35)
        ) {
          damage(e, 38 * globalDamageMultiplier());
          e.bladeHit = time;
        }
      }
    }
  }
  enemies = enemies.filter((e) => !e.dead);
  rebuildEnemyGrid();
  for (const b of bullets) {
    if (b.type === "orb" || b.type === "frost") {
      if (!b.target || b.target.dead) {
        b.target = nearestEnemy(b.x, b.y, 1500);
      }
      if (b.target) {
        const desired = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        const current = Math.atan2(b.vy, b.vx);
        const difference = Math.atan2(
          Math.sin(desired - current),
          Math.cos(desired - current),
        );
        const angle =
          current +
          Math.max(-b.turnRate * dt, Math.min(b.turnRate * dt, difference));
        b.vx = Math.cos(angle) * b.speed;
        b.vy = Math.sin(angle) * b.speed;
      }
    }
    if (b.type === "boomerang") {
      b.age += dt;
      if (b.age >= 0.8 || b.target?.dead) b.returning = true;
      const aim = b.returning ? player : b.target || player;
      const desired = Math.atan2(aim.y - b.y, aim.x - b.x);
      const current = Math.atan2(b.vy, b.vx);
      const difference = Math.atan2(
        Math.sin(desired - current),
        Math.cos(desired - current),
      );
      const angle =
        current +
        Math.max(-b.turnRate * dt, Math.min(b.turnRate * dt, difference));
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
      if (b.returning && dist(b, player) < player.r + b.r) {
        b.life = 0;
        continue;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || projectileOutsideArena(b)) {
      b.life = 0;
      continue;
    }

    for (const e of nearbyEnemies(b.x, b.y, b.r + 280)) {
      if (!b.hit.has(e) && Math.hypot(e.x - b.x, e.y - b.y) < enemyHitRadius(e) + b.r) {
        damage(e, b.d, b);
        b.hit.add(e);
        if (b.type === "frost") {
          b.hitTarget = e;
          applyFrostBurst(b.x, b.y, b);
        }
        if (b.type === "flame") {
          e.burnUntil = Math.max(e.burnUntil || 0, time + b.burnDuration);
          e.burnDps = Math.max(e.burnDps || 0, b.burnDps);
          e.nextBurnTick = Math.min(e.nextBurnTick || Infinity, time + 0.5);
        }
        b.pierce--;
        puff(b.x, b.y, "#9b9aff", 3);
        if (b.pierce <= 0) {
          b.life = 0;
          break;
        }
      }
    }
  }
  bullets = bullets.filter((b) => b.life > 0 && !projectileOutsideArena(b));
  if (upgrades.bomb) {
    bombTimer -= dt * (1 + upgrades.rate * 0.13);
    if (bombTimer <= 0) {
      bombs.push({
        x: player.x,
        y: player.y,
        fuse: 1.5,
        evolved: !!evolutions.megaEiad,
        radius: 150 + upgrades.bomb * 24 + (evolutions.megaEiad ? 40 : 0),
        damage: calculateBombDamage(upgrades.bomb, globalDamageMultiplier(), !!evolutions.megaEiad),
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
    for (const target of nearbyEnemies(bomb.x, bomb.y, bomb.radius + 280)) {
      if (dist(target, bomb) < bomb.radius + enemyHitRadius(target)) {
        damage(target, bomb.damage * (target === boss ? 0.42 : 1), bomb);
      }
    }
    puff(bomb.x, bomb.y, "#e6a96a", 26);
    playSfx("bomb");
    explosions.push({
      x: bomb.x,
      y: bomb.y,
      radius: bomb.radius,
      life: 0.55,
      maxLife: 0.55,
      evolved: bomb.evolved,
    });
  }
  bombs = waitingBombs;
  for (const explosion of explosions) explosion.life -= dt;
  explosions = explosions.filter((explosion) => explosion.life > 0);
  for (const shot of enemyShots) {
    const desired = Math.atan2(player.y - shot.y, player.x - shot.x);
    const current = Math.atan2(shot.vy, shot.vx);
    const difference = Math.atan2(
      Math.sin(desired - current),
      Math.cos(desired - current),
    );
    const angle =
      current +
      Math.max(-shot.turnRate * dt, Math.min(shot.turnRate * dt, difference));
    shot.vx = Math.cos(angle) * shot.speed;
    shot.vy = Math.sin(angle) * shot.speed;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (tryBladeBlock(shot)) continue;
    if (shot.life <= 0 || projectileOutsideArena(shot)) {
      shot.life = 0;
      continue;
    }

    if (
      Math.hypot(shot.x - player.x, shot.y - player.y) < shot.r + player.r &&
      player.inv <= 0
    ) {
      if (tryDodge()) { shot.life = 0; continue; }
      player.hp -= shot.damage;
      runDamageTaken += shot.damage;
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
  enemyShots = enemyShots.filter(
    (shot) => shot.life > 0 && !projectileOutsideArena(shot),
  );
  for (const b of bossShots) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (tryBladeBlock(b)) continue;
    if (b.life <= 0 || projectileOutsideArena(b)) {
      b.life = 0;
      continue;
    }
    if (
      Math.hypot(b.x - player.x, b.y - player.y) < b.r + player.r &&
      player.inv <= 0
    ) {
      if (tryDodge()) { b.life = 0; continue; }
      player.hp -= 13;
      runDamageTaken += 13;
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
  bossShots = bossShots.filter(
    (b) => b.life > 0 && !projectileOutsideArena(b),
  );
  enemies = enemies.filter((e) => !e.dead);
  rebuildEnemyGrid();
  for (const g of gems) {
    let d = dist(g, player),
      range = 90 + upgrades.magnet * 55;
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
        playSfx("xp");
        addXP(g.value * (g.kind === "health" ? 1 : 1 + Math.max(0, upgrades.magnet - 2) * 0.06));
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
  if (hudUpdateTimer >= 0.12) {
    hudUpdateTimer = 0;
    hud();
  }
}

// Keep the game loop running; simulation pauses while menus are open.
function loop(t) {
  const elapsed = (t - last) / 1000 || 0;
  let dt = Math.min(elapsed, 0.035);
  last = t;
  fpsElapsed += elapsed;
  fpsFrames++;
  if (fpsElapsed >= 0.5) {
    currentFps = Math.round(fpsFrames / fpsElapsed);
    fpsFrames = 0;
    fpsElapsed = 0;
    if (showFps && player) hud();
  }
  if (active && !paused) {
    for (let i = 0; i < gameSpeed; i++) {
      if (active && !paused) update(dt);
    }
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
