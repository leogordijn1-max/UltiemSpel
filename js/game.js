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
const mayoCharacterImage = new Image();
mayoCharacterImage.src = "img/EmmerMayo.png";
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
  gemGrid = new Map(),
  bombs = [],
  explosions = [],
  gems = [],
  bladePositions = [],
  particles = [],
  texts = [],
  time = 0,
  growthTime = 0,
  kills = 0,
  level = 1,
  xp = 0,
  needed = 10,
  pendingLevelUps = 0,
  choiceScreenOpen = false,
  paused = true,
  active = false,
  gameState = "main-menu",
  runRecorded = false,
  spawn = 0,
  shot = 0,
  bombTimer = 0,
  orbitAngle = 0,
  shake = 0,
  novaTimer = 0,
  novaFlash = 0,
  novaEchoFlash = 0,
  pulseEchoes = [],
  bombAftershocks = [],
  damageFlash = 0,
  last = 0,
  highest = storageNumber("shadowHigh", 0, 0);
const keys = {};
let upgrades = {},
  gameSpeed = 1,
  difficulty = "normal",
  menuDifficulty = ["easy", "normal", "nightmare"].includes(
    storageGet("shadowDifficulty", "normal"),
  )
    ? storageGet("shadowDifficulty", "normal")
    : "normal",
  boss = null,
  bossShots = [],
  bossHazards = [],
  nextBossTime = 180,
  menuRunMode = "standard",
  runMode = "standard",
  endlessStartTime = 0,
  finalBossDefeated = false,
  victoryClaimed = false,
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
  bossRewardPoints = 0,
  permanentDamageBonus = 0,
  runDamageTaken = 0,
  runStats = createRunStats(),
  metaProgress = loadMetaProgress(),
  startWeapon = "arcane",
  unlockableWeapons = [],
  unlockedWeapons = [],
  selectedWeapons = loadSelectedWeapons(),
  selectedCharacter = (() => {
    const choice = storageGet("shadowCharacter", "survivor");
    return isCharacterUnlocked(metaProgress, choice) ? choice : "survivor";
  })(),
  characterRuntime = makeCharacterRuntime(),
  showFps = storageGet("shadowShowFps", "false") === "true",
  graphicsQuality = ["low", "medium", "high"].includes(
    storageGet("shadowGraphics", "high"),
  )
    ? storageGet("shadowGraphics", "high")
    : "high",
  enemyGrid = new Map(),
  hudUpdateTimer = 0,
  fpsFrames = 0,
  fpsElapsed = 0,
  currentFps = 0,
  currentFrameMs = 0,
  performanceMetrics = { enemyAI: 0, collisions: 0, render: 0 },
  simulationAccumulator = 0;
function loadSelectedWeapons() {
  const loadout = elementalLoadout();
  startWeapon = loadout[0];
  unlockableWeapons = loadout.slice(1);
  return loadout;
}
function syncElementalLoadout() {
  selectedWeapons = loadSelectedWeapons();
  return selectedWeapons;
}

// Start a fresh run and reset every timer, entity, and upgrade.
function reset() {
  window.resetBossIsolation?.();
  // Start a fresh sandbox before any discovery or rewards can be written.
  window.developerBeginRun?.();
  // Lock the dominant environment at run start. Choosing an element never conquers it.
  window.beginWorldRun?.();
  window.resetWorldScars?.();
  window.resetWorldRetaliation?.();
  window.resetWorldDefense?.();
  window.resetEncounterPacing?.();
  window.resetEnemyProgression?.();
  window.resetEncounterTactics?.();
  syncElementalLoadout();
  resetElementalCombat();
  for (const key in keys) keys[key] = false;
  touchMoveX = 0;
  touchMoveY = 0;
  difficulty = menuDifficulty;
  runMode =
    menuRunMode === "endless" && metaProgress.endlessUnlocked
      ? "endless"
      : "standard";
  endlessStartTime = 0;
  finalBossDefeated = false;
  victoryClaimed = false;
  recordedRunId = null;
  runRewardSettled = 0;
  bossesDefeated = 0;
  bossRewardPoints = 0;
  runDamageTaken = 0;
  runStats = createRunStats();
  runRecorded = false;
  if (!isCharacterUnlocked(metaProgress, selectedCharacter))
    selectedCharacter = "survivor";
  characterRuntime = makeCharacterRuntime();
  trackDiscovery("characters", selectedCharacter);
  trackDiscovery("weapons", startWeapon);
  choiceScreenOpen = false;
  unlockedWeapons = [startWeapon];
  recentAchievements = [];
  player = {
    x: 0,
    y: 0,
    r: 15,
    hp:
      140 +
      metaProgress.hpLevel * 8 +
      (selectedCharacter === "zombieMike"
        ? 20
        : selectedCharacter === "mayoMaster"
          ? -15
          : 0),
    maxHp:
      140 +
      metaProgress.hpLevel * 8 +
      (selectedCharacter === "zombieMike"
        ? 20
        : selectedCharacter === "mayoMaster"
          ? -15
          : 0),
    speed: 235 * (1 + (metaProgress.speedLevel || 0) * 0.02),
    inv: 0,
    facingX: 1,
    facingY: 0,
  };
  enemies = [];
  enemyGrid.clear();
  gemGrid.clear();
  simulationAccumulator = 0;
  bullets = [];
  enemyShots = [];
  bladePositions.length = 0;
  bombs = [];
  explosions = [];
  bossShots = [];
  bossHazards = [];
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
  novaEchoFlash = 0;
  pulseEchoes = [];
  bombAftershocks = [];
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
  // Weapon Mastery applies only to a chosen START weapon and never adds a slot.
  if (isMasteryOwned(metaProgress, startWeapon)) upgrades[startWeapon] = 2;
  permanentDamageBonus = metaProgress.damageLevel * 0.35 * 0.28;
  active = true;
  paused = false;
  gameState = "playing";
  gameSpeed = 1;
  updateSpeedButtons();
  $("speedControls").style.display = "flex";
  $("bossHud").style.display = "none";
  $("bossCountdown").style.display = "block";
  $("overlay").style.display = "none";
  $("pause").style.display = "block";
  hud();
}

// Persist only first-time discoveries; repeated spawns do not cause storage writes.
function trackDiscovery(group, key) {
  if (typeof discover !== "function" || !metaProgress) return false;
  if (!discover(metaProgress, group, key)) return false;
  saveMetaProgress();
  return true;
}

// Account for blocked hits and dodges separately from HP lost.
function recordPlayerHit(amount) {
  runDamageTaken += amount;
  if (runStats) runStats.damageTaken += Math.max(0, amount);
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
  if (!upgrades.orbit || !upgrades.bladeBlock || projectile.blocked)
    return false;
  const baseChance = Math.min(
    0.95,
    upgrades.bladeBlock * 0.16 +
      Math.max(0, upgrades.bladeBlock - 2) * 0.04 +
      (evolutions.aegisRing ? 0.08 : 0),
  );
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
      if (runStats) runStats.blocks++;
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
  if (runStats) runStats.dodges++;
  puff(player.x, player.y, "#c7f3e2", 7);
  return true;
}

// Dash in the current movement direction, or continue the last facing direction.
function startDash() {
  if (!active || paused || dashCooldown > 0) return;

  let dx =
    (keys.d || keys.ArrowRight ? 1 : 0) -
    (keys.a || keys.ArrowLeft ? 1 : 0) +
    touchMoveX;
  let dy =
    (keys.s || keys.ArrowDown ? 1 : 0) -
    (keys.w || keys.ArrowUp ? 1 : 0) +
    touchMoveY;
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
  playSfx("dash");
  dashCooldown = Math.max(3.6, 4.5 - (metaProgress.dashLevel || 0) * 0.2);
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
  const finalApproaching =
    runMode === "standard" &&
    !finalBossDefeated &&
    bossesDefeated >= STANDARD_BOSS_COUNT &&
    time >= FINAL_BOSS_TIME - 60;
  const countdown = finalApproaching
    ? Math.max(0, FINAL_BOSS_TIME - time)
    : remaining;
  $("countText").textContent = boss
    ? boss.isFinalBoss
      ? "FINAL BOSS ACTIVE"
      : "BOSS ACTIVE"
    : finalApproaching
      ? `FINAL BOSS IN ${Math.floor(countdown / 60)}:${String(Math.ceil(countdown % 60)).padStart(2, "0")}`
      : `${runMode === "endless" ? "ENDLESS " : ""}BOSS IN ${Math.floor(countdown / 60)}:${String(Math.ceil(countdown % 60)).padStart(2, "0")}`;
  $("countFill").style.width = `${
    finalApproaching
      ? Math.min(100, (1 - countdown / 60) * 100)
      : Math.max(0, Math.min(100, (1 - remaining / 180) * 100))
  }%`;
  $("bossCountdown").style.display = boss ? "none" : "block";
  const dashStatus = $("dashStatus");
  dashStatus.textContent =
    dashCooldown <= 0
      ? "DASH READY · SHIFT"
      : `DASH ${dashCooldown.toFixed(1)}s · SHIFT`;
  dashStatus.classList.toggle("ready", dashCooldown <= 0);
  const upcomingWave = waveNumber + 1;
  const waveClock = `${Math.floor(Math.max(0, waveTimer) / 60)}:${String(Math.ceil(Math.max(0, waveTimer) % 60)).padStart(2, "0")}`;
  const currentPattern = waveNumber
    ? wavePatternFor(waveNumber).name
    : "PREPARE";
  const endlessLabel =
    runMode === "endless"
      ? `ENDLESS · TIER ${currentEndlessTier() + 1} · `
      : "";
  $("waveText").textContent = boss
    ? `${endlessLabel}WAVE ${waveNumber || 1} · PAUSED DURING BOSS`
    : `${endlessLabel}WAVE ${waveNumber || 1} · ${currentPattern} · NEXT ${upcomingWave} IN ${waveClock}`;
  $("waveFill").style.width =
    `${Math.max(0, Math.min(100, (1 - waveTimer / waveDuration) * 100))}%`;
  $("healthText").textContent = Math.ceil(player.hp) + " / " + player.maxHp;
  $("hp").style.width = (100 * player.hp) / player.maxHp + "%";
  $("levelText").textContent = level;
  $("xp").style.width = (100 * xp) / needed + "%";
  const conqueredPercent = window.getWorldConquest?.().coverage || 0;
  $("stats").textContent =
    `${(window.getDominantWorld?.() || "frozen").toUpperCase()} WORLD · ${conqueredPercent}% IMPACT · ${currentLivingWorldElement().toUpperCase()} ELEMENT · ${runMode === "endless" ? "ENDLESS" : "STANDARD"} · ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}  ·  ${kills} KILLS  ·  BEST ${highest}  ·  ${enemies.length} ENEMIES`;
  const character = getCharacter(selectedCharacter);
  const boost =
    characterRuntime.activeBoost > 0
      ? ` · ACTIVE ${characterRuntime.activeBoost.toFixed(1)}s`
      : "";
  $("characterHud").textContent =
    `${character.name} · ${character.ability}${boost}`;
  const weaponNames = Object.fromEntries(
    weaponCatalog.map((weapon) => [weapon.key, weapon.name]),
  );
  $("loadout").innerHTML = selectedWeapons
    .map((key, index) => {
      const name = weaponNames[key];
      const locked = !unlockedWeapons.includes(key);
      const evolution = evolutionRecipes.find(
        (recipe) => recipe.weapon === key && evolutions[recipe.id],
      );
      const cap = maxUpgradeLevel(key);
      const state = locked
        ? "LOCKED · LEVEL-UP TO UNLOCK"
        : evolution
          ? `MAX ${upgrades[key]}/${cap} · EVOLVED`
          : `LEVEL ${upgrades[key]}/${cap}`;
      const role =
        index === 0
          ? "START WEAPON"
          : locked
            ? `UNLOCKABLE ${index}`
            : `WEAPON SLOT ${index + 1}`;
      return `<span class="weapon-slot ${locked ? "weapon-locked" : evolution ? "weapon-evolved" : ""}"><b>${role}</b><strong>${name}</strong><small>${state}</small></span>`;
    })
    .join("");
  $("fpsCounter").hidden = !showFps;
  if (showFps)
    $("fpsCounter").textContent =
      `${currentFps} FPS · ${currentFrameMs.toFixed(1)} ms · AI ${performanceMetrics.enemyAI.toFixed(1)} / hit ${performanceMetrics.collisions.toFixed(1)} / draw ${performanceMetrics.render.toFixed(1)} ms · E ${enemies.length} · P ${bullets.length} · EP ${enemyShots.length + bossShots.length} · FX ${particles.length} · XP ${gems.length}`;
}

function panel(title, body, buttons) {
  $("overlay").style.display = "flex";
  $("panel").innerHTML =
    `<h1>${title}</h1><p>${body}</p><div id="choices"></div>`;
  buttons($("choices"));
}

function showVictory() {
  if (victoryClaimed || gameState === "victory" || !active) return false;
  finalBossDefeated = true;
  if (!grantFinalVictory()) return false;
  window.completeWorldConquest?.();
  paused = true;
  choiceScreenOpen = true;
  gameState = "victory";
  bossShots = [];
  bossHazards = [];
  player.inv = Math.max(player.inv, 2.5);
  const evolvedCount = Object.values(evolutions).filter(Boolean).length;
  const currentNames = weaponCatalog
    .filter((w) => upgrades[w.key] > 0)
    .map((w) => `${w.name}${weaponIsEvolved(w.key) ? " ★" : ""}`)
    .join(", ");
  const survived = `${Math.floor(time / 60)}m ${Math.floor(time % 60)}s`;
  if (typeof playSfx === "function") playSfx("victory");
  panel(
    "VICTORY · THE NIGHT IS YOURS",
    `You defeated THE LAST MEME!<br><b>World conquered:</b> ${window.getWorldConquest?.().invading?.toUpperCase() || "UNKNOWN"} · 100% PERMANENT<br><b>Survived:</b> ${survived} · <b>Level:</b> ${level} · <b>Kills:</b> ${kills}<br><b>Bosses:</b> ${bossesDefeated} · <b>Evolutions:</b> ${evolvedCount}<br><b>Weapons:</b> ${currentNames}<br><b>Victory bonus:</b> +${FINAL_VICTORY_BONUS} permanent points<br><b>Endless Mode:</b> UNLOCKED${recentAchievements.length ? `<br><b>Achievements:</b> ${recentAchievements.join(", ")}` : ""}`,
    (container) => {
      const continueButton = document.createElement("button");
      continueButton.className = "victory-continue";
      continueButton.textContent = "CONTINUE IN ENDLESS MODE";
      continueButton.onclick = continueEndlessAfterVictory;
      container.append(continueButton);
      const menuButton = document.createElement("button");
      menuButton.textContent = "CLAIM VICTORY · MAIN MENU";
      menuButton.onclick = showMainMenu;
      container.append(menuButton);
    },
  );
  if (typeof renderRunSummaryPanel === "function") renderRunSummaryPanel();
  $("bossHud").style.display = "none";
  $("bossCountdown").style.display = "none";
  $("pause").style.display = "none";
  $("speedControls").style.display = "none";
  return true;
}

function continueEndlessAfterVictory() {
  if (gameState !== "victory" || !victoryClaimed) return false;
  // Future-proof the transition even if victory happens via a scripted event.
  window.finishBossIsolation?.(boss);
  runMode = "endless";
  menuRunMode = "endless";
  endlessStartTime = time;
  nextBossTime = time + 180;
  boss = null;
  bossShots = [];
  bossHazards = [];
  player.inv = Math.max(player.inv, 2.5);
  // Resuming the same run preserves HP, XP, loadout and achievements.
  paused = false;
  choiceScreenOpen = false;
  gameState = "playing";
  $("overlay").style.display = "none";
  $("pause").style.display = "block";
  $("speedControls").style.display = "flex";
  $("bossCountdown").style.display = "block";
  notify("ENDLESS MODE · THE HORDE NEVER STOPS", "wave", 5);
  hud();
  if (pendingLevelUps > 0) choices();
  return true;
}

function end() {
  if (!active) return;
  playSfx("gameover");
  recordRun();
  if (!victoryClaimed) window.restoreWorldOnDefeat?.();
  const activeWeapons = weaponCatalog
    .filter((weapon) => upgrades[weapon.key] > 0)
    .map((weapon) => weapon.name)
    .join(", ");
  active = false;
  paused = true;
  gameState = "game-over";
  choiceScreenOpen = false;
  panel(
    "KKR SUKKEL",
    `You survived ${Math.floor(time / 60)}m ${Math.floor(time % 60)}s in ${runMode.toUpperCase()} mode.<br><b>World:</b> ${window.getWorldConquest?.().original?.toUpperCase() || "FROZEN"} · ${victoryClaimed ? "CONQUERED" : "RESTORED BY THE GUARDIAN"}<br>Reached level ${level}, defeated ${kills} monsters, and beat ${bossesDefeated} bosses.${victoryClaimed ? "<br>Standard victory completed · Endless unlocked." : ""}<br>Weapons: ${activeWeapons}<br>Best kills: ${highest}<br>Permanent points earned: ${Math.floor(kills / 100) + bossesDefeated * 3 + bossRewardPoints + (victoryClaimed ? FINAL_VICTORY_BONUS : 0)}${recentAchievements.length ? `<br>Unlocked: ${recentAchievements.join(", ")}` : ""}`,
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
  if (typeof renderRunSummaryPanel === "function") renderRunSummaryPanel();
  $("pause").style.display = "none";
  $("speedControls").style.display = "none";
  $("bossHud").style.display = "none";
  $("bossCountdown").style.display = "none";
}

// A levelled Death Pulse; Eclipse repeats at reduced power and applies a brief slow.
function emitDeathPulse(isEcho = false) {
  if (!upgrades.nova) return;
  const radius = novaRadius();
  const amount =
    (25 + upgrades.nova * 9) * globalDamageMultiplier() * (isEcho ? 0.62 : 1);
  if (isEcho) novaEchoFlash = 0.3;
  else novaFlash = 0.2;
  for (const target of nearbyEnemies(player.x, player.y, radius + 100)) {
    const dx = target.x - player.x,
      dy = target.y - player.y;
    const hitRadius = radius + enemyHitRadius(target);
    if (dx * dx + dy * dy >= hitRadius * hitRadius) continue;
    damage(target, amount, player, "pulse");
    if (evolutions.eclipse && !target.dead) {
      target.pulseSlowUntil = Math.max(target.pulseSlowUntil || 0, time + 0.9);
    }
  }
}

// Advance the simulation by one frame.
// Automatic character abilities are independent of the three weapon slots.
function fireBeauFishBarrage() {
  const range=typeof window!=="undefined" ? window.playerWeaponRange?.(550)??550 : 550;
  const target = nearestEnemy(player.x, player.y,range,null,
    e => typeof window==="undefined"||!window.playerWeaponTargetVisible
      ||window.playerWeaponTargetVisible(e));
  if (!target) return false;
  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  for (const offset of [-0.2, 0, 0.2]) {
    const direction = angle + offset;
    const speed = 340;
    bullets.push({
      type: "fish",
      x: player.x,
      y: player.y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      speed,
      r: 10,
      d: 34 * globalDamageMultiplier(),
      pierce: 1,
      life: 2,
      hit: new Set(),
    });
  }
  puff(player.x, player.y, "#ffccae", 9);
  playSfx("fish");
  return true;
}

function updateCharacterAbility(dt) {
  updateCharacterTimers(characterRuntime, dt);
  if (selectedCharacter === "beau" && characterRuntime.fishCooldown <= 0) {
    if (fireBeauFishBarrage()) characterRuntime.fishCooldown = 12;
  }
}

function update(dt) {
  time += dt;
  window.updateWorldScarEffects?.(dt);
  updateCharacterAbility(dt);
  hudUpdateTimer += dt;
  if (!boss) growthTime += dt;
  window.updateEnemyProgression?.(growthTime, message=>notify(message,"wave",4));
  updateSpecialWeapons(dt);

  dashTimer = Math.max(0, dashTimer - dt);
  dashCooldown = Math.max(0, dashCooldown - dt);

  if (!boss) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      const nextWave=waveNumber+1;
      const wave=spawnSpecialWave(nextWave);
      if(wave.deferred){
        // Never drop another encounter onto the player during an ongoing fight.
        // Retrying doesn't advance the wave counter or accumulate old waves.
        waveTimer=6;
      }else{
        waveNumber=nextWave;
        waveDuration=Math.max(60,80-waveNumber*2);
        waveTimer=waveDuration;
        notify(
          `WAVE ${waveNumber} · ${wave.name} · ${wave.spawned} ENEMIES${wave.hint ? " · "+wave.hint : ""}`,
          "wave",4);
      }
    }
  }
  if (upgrades.health) {
    const beforeHeal = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + upgrades.health * 0.8 * dt);
    if (runStats) runStats.healing += Math.max(0, player.hp - beforeHeal);
  }
  // Standard Mode has exactly three guardians; the fourth boss is the finale.
  // Completing Bell before 25:00 preserves time for weapon evolutions.
  if(!boss){
    const encounter=nextBossEncounter(
      runMode,bossesDefeated,time,nextBossTime,finalBossDefeated);
    if(encounter==="final")spawnFinalBoss();
    else if(encounter==="ordinary")spawnBoss();
  }
  if (window.developerInvincible?.()) {
    // Reapply before all collision checks; the normal damage logic remains untouched.
    player.inv = Math.max(player.inv, 1.2);
    player.hp = player.maxHp;
  } else {
    player.inv = Math.max(0, player.inv - dt);
  }
  window.updateWorldRetaliation?.(dt, player, {
    suspended: !!boss,
    chill: seconds => {
      player.guardianChillUntil = Math.max(player.guardianChillUntil || 0, time + seconds);
    },
    push: (dx,dy,power) => {
      const length = Math.hypot(dx,dy) || 1;
      player.guardianTidePushX = (dx / length) * power;
      player.guardianTidePushY = (dy / length) * power;
      player.guardianTidePushUntil = time + .28;
    },
    damage: amount => {
      if (player.inv > 0 || window.developerInvincible?.()) return false;
      player.hp -= amount;
      recordPlayerHit(amount);
      player.inv = .85;
      damageFlash = .5;
      shake = Math.max(shake, 8);
      puff(player.x,player.y,"#ff609d",12);
      if(player.hp <= 0) end();
      return true;
    }
  });
  damageFlash = Math.max(0, damageFlash - dt);
  novaFlash = Math.max(0, novaFlash - dt);
  novaEchoFlash = Math.max(0, novaEchoFlash - dt);
  for (let i = pulseEchoes.length - 1; i >= 0; i--) {
    pulseEchoes[i] -= dt;
    if (pulseEchoes[i] <= 0) {
      pulseEchoes.splice(i, 1);
      emitDeathPulse(true);
    }
  }
  novaTimer += dt / weaponCooldownMultiplier();
  const pulseCooldown = Math.max(1.95, 2.9 - upgrades.nova * 0.19);
  if (upgrades.nova && novaTimer >= pulseCooldown) {
    novaTimer %= pulseCooldown;
    emitDeathPulse(false);
    if (evolutions.eclipse) pulseEchoes.push(0.38);
  }
  let dx =
      (keys.d || keys.ArrowRight ? 1 : 0) -
      (keys.a || keys.ArrowLeft ? 1 : 0) +
      touchMoveX,
    dy =
      (keys.s || keys.ArrowDown ? 1 : 0) -
      (keys.w || keys.ArrowUp ? 1 : 0) +
      touchMoveY,
    mag = Math.hypot(dx, dy) || 1;
  const movementSpeed =
    player.speed *
    (1 + upgrades.speed * 0.1) *
    characterMovementMultiplier(
      selectedCharacter,
      characterRuntime,
      player.hp,
      player.maxHp,
    ) *
    (player.guardianChillUntil > time ? .83 : 1);
  if (dx || dy) {
    player.facingX = dx / mag;
    player.facingY = dy / mag;

    if (dx < 0) {
      player.spriteFacing = -1;
    } else if (dx > 0) {
      player.spriteFacing = 1;
    }
  }
  const previousPlayerX = player.x, previousPlayerY = player.y;
  if (dashTimer > 0) {
    player.x += dashDirectionX * movementSpeed * 4 * dt;
    player.y += dashDirectionY * movementSpeed * 4 * dt;
  } else {
    player.x += (dx / mag) * movementSpeed * dt;
    player.y += (dy / mag) * movementSpeed * dt;
  }
  // Flooded Guardian pushes in a short, visible surge after its warning.
  if (player.guardianTidePushUntil > time) {
    player.x += (player.guardianTidePushX || 0) * dt;
    player.y += (player.guardianTidePushY || 0) * dt;
  }
  // Exact movement, including dashes: standing still must not be predicted.
  player.combatVX = (player.x - previousPlayerX) / Math.max(dt, .001);
  player.combatVY = (player.y - previousPlayerY) / Math.max(dt, .001);
  // Boss arenas are separate encounters: NO regular spawns or catch-up
  // waves. Only the boss may create minions via its own phase mechanics.
  if (!boss && !window.isBossIsolationActive?.()) {
    // Ambient mobs are atmosphere, not the main encounter. Teams get priority.
    const ambientCap=window.encounterAmbientLimit?.(growthTime,difficulty,enemies) ??
      Math.max(4,9-Math.floor(growthTime/180));
    if (enemies.length >= ambientCap) {
      // Never accumulate a catch-up horde while at the population limit.
      spawn = Math.max(spawn,.4);
    } else {
      spawn -= dt;
      const interval = window.encounterAmbientInterval?.(growthTime,difficulty) ?? 6;
      while (spawn <= 0 && enemies.length < ambientCap) {
        if (!enemySpawn()) break;
        spawn += interval;
      }
    }
  }
  window.notifyEncounterPatrol ||= message => notify(message,"wave",2.6);
  window.updateEncounterPacing?.(time,growthTime,player,enemies,
    kind => enemySpawn(kind),!!boss || !!window.isBossIsolationActive?.(),difficulty);
  shot -= dt;
  if (shot <= 0) {
    fire();
    shot = 0.95 * weaponCooldownMultiplier();
  }
  orbitAngle += dt * 2.2;
  bladePositions.length = upgrades.orbit * 2;
  if (upgrades.orbit) {
    for (let index = 0; index < upgrades.orbit; index++) {
      const angle = orbitAngle + (index * Math.PI * 2) / upgrades.orbit;
      bladePositions[index * 2] = player.x + Math.cos(angle) * 67;
      bladePositions[index * 2 + 1] = player.y + Math.sin(angle) * 67;
    }
  }
  window.notifyWorldDefense = message => notify(message, "wave", 3.5);
  window.updateWorldDefense?.(time, player, enemies, kind => enemySpawn(kind),
    !!boss || !!window.isBossIsolationActive?.(),growthTime);
  const enemyAIStarted = performance.now();
  for (const e of enemies) {
    if (e.dead) continue;
    // Summoned adds are temporary, not an endless secondary horde.
    if (e.summoned && Number.isFinite(e.summonUntil) && time >= e.summonUntil) {
      e.dead = true;
      continue;
    }

    if (e === boss && Math.abs(player.x - e.x) > 1) {
      e.facing = player.x > e.x ? 1 : -1;
    }
    const playerDx = player.x - e.x;
    const playerDy = player.y - e.y;
    const playerDistanceSquared = playerDx * playerDx + playerDy * playerDy;
    const needsPlayerDistance =
      e.kind === 4 ||
      e.kind === 5 ||
      e.eliteTrait === "charger" ||
      (upgrades.nova && upgrades.novaSlow);
    const playerDistance = needsPlayerDistance
      ? Math.sqrt(playerDistanceSquared)
      : 0;
    const onScreen = e === boss || visibleEnemy(e, 160);
    let a = onScreen ? Math.atan2(playerDy, playerDx) : 0;
    const insidePulse =
      upgrades.nova &&
      upgrades.novaSlow &&
      playerDistance < novaRadius() + enemyHitRadius(e);
    let moveAngle = a;
    // Sample real terrain a few times per second, not 300 enemies x 60 fps.
    if (onScreen && time >= (e.nextTerrainSample || 0)) {
      e.groundElement = window.terrainAt?.(e.x,e.y) || null;
      e.groundBiome = window.worldBiomeAt?.(e.x,e.y) || "frozen";
      e.nextTerrainSample = time + .22 + (Math.abs(e.x*.003+e.y*.005) % .11);
    }
    window.refreshEnemyAdaptation?.(e, time, onScreen, e.groundBiome);
    const groundElement = onScreen ? e.groundElement : null;
    const worldGround = e.groundBiome === "frozen" ? "frost"
      : e.groundBiome === "flooded" ? "water" : "fire";
    const walkingGround = groundElement || (onScreen ? worldGround : null);
    // Weapon-created terrain scars are visual and can affect movement,
    // but never inflict passive damage on enemies (including bosses).
    // Explicit hits, burns and dangerous elemental reaction zones still work.
    let moveSpeed =
      e.speed *
      (e.impactSlowUntil > time
        ? Math.max(0.58, 0.82 - (upgrades.knockback - 3) * 0.06)
        : 1) *
      (insidePulse ? 1 - upgrades.novaSlow * 0.11 : 1) *
      (walkingGround==="water" ? .86 : walkingGround==="frost" ? .74 : 1) *
      (window.enemyWorldMovement?.(e, walkingGround, time, dt) ?? 1) *
      (window.guardianWorldSpeed?.(e, walkingGround) ?? 1) *
      (e.soakedUntil > time ? 0.82 : 1) *
      (e.frostUntil > time ? 0.48 : 1) *
      (e.deepFreezeUntil > time && e !== boss ? 0.16 : 1) *
      (e.pulseSlowUntil > time ? 0.77 : 1);
    if (e.burnUntil > time && e.nextBurnTick <= time) {
      e.nextBurnTick = time + 0.5;
      damage(e, e.burnDps * 0.5, e.burnWeapon ? { x: player.x, y: player.y, type: e.burnWeapon } : player, "burn");
      if (e.dead) continue;
    }
    // Guardians can close the gap instead of harmlessly following behind a
    // player who moves faster than their base walking speed.
    if (e === boss && playerDistanceSquared > 370 * 370) moveSpeed *= 2.7;
    else if (e === boss && playerDistanceSquared > 240 * 240) moveSpeed *= 1.6;
    moveAngle = window.enemyTerrainSteer?.(e, moveAngle, onScreen, playerDistanceSquared, time) ?? moveAngle;
    if (e.kind === 4) {
      const movementMode = rangedEnemyMovementMode(e, playerDistance);
      if (movementMode === "retreat") moveAngle += Math.PI;
      else if (movementMode === "hold") moveSpeed = 0;
      else moveSpeed *= 0.65;

      if (rangedEnemyCanAttack(e, playerDistance)) {
        if (e.shotWarning > 0) {
          e.shotWarning = Math.max(0, e.shotWarning - dt);
          moveSpeed = 0;
          if (e.shotWarning === 0) {
            enemyFireOrb(e);
            window.encounterTacticVolley?.(e,enemyShots,player);
            e.shootCooldown = rand(4.5, 6.2);
          }
        } else {
          e.shootCooldown -= dt;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 0;
            e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
            e.shotWarning = 0.7;
          }
        }
      } else if (e.shotWarning > 0) {
        // An enemy leaving the visible attack area cannot finish a hidden shot.
        e.shotWarning = 0;
        e.shootCooldown = 0.9;
      }
    }
    if (e.kind === 6) {
      e.guardTimer = (e.guardTimer ?? 3) - dt;
      if (e.guardTimer <= 0) {
        e.shieldActive = !e.shieldActive;
        e.guardTimer = e.shieldActive ? 3 : 2;
      }
    }
    if (e.kind === 5) {
      if (!e.armed && onScreen && playerDistanceSquared < 115 * 115) {
        e.armed = true;
        e.burstWarning = 0.95;
      }
      if (e.armed) {
        moveSpeed = 0;
        e.burstWarning = Math.max(0, e.burstWarning - dt);
        if (e.burstWarning === 0) {
          e.dead = true;
          const radius = e.burstRadius || 86;
          if (
            playerDistanceSquared < (radius + player.r) * (radius + player.r) &&
            player.inv <= 0 &&
            !tryDodge()
          ) {
            player.hp -= e.damage;
            recordPlayerHit(e.damage);
            player.inv = 0.75;
            damageFlash = 0.42;
            shake = Math.max(shake, 8);
            if (player.hp <= 0) {
              end();
              return;
            }
          }
          explosions.push({
            x: e.x,
            y: e.y,
            radius,
            life: 0.5,
            maxLife: 0.5,
            evolved: false,
          });
          puff(e.x, e.y, "#ff985b", 11);
          continue;
        }
      }
    }
    if (e.eliteTrait === "swift") {
      e.eliteSprintTimer = (e.eliteSprintTimer ?? 2.2) - dt;
      e.eliteSprintActive = Math.max(0, (e.eliteSprintActive || 0) - dt);
      if (e.eliteSprintTimer <= 0 && onScreen) {
        e.eliteSprintActive = 1.1;
        e.eliteSprintTimer = 5.4;
      }
      if (e.eliteSprintActive > 0) moveSpeed *= 1.5;
    } else if (e.eliteTrait === "charger") {
      if (e.eliteChargeActive > 0) {
        e.eliteChargeActive = Math.max(0, e.eliteChargeActive - dt);
        e.x += e.eliteChargeX * 300 * dt;
        e.y += e.eliteChargeY * 300 * dt;
        moveSpeed = 0;
      } else if (e.eliteChargeWarning > 0) {
        e.eliteChargeWarning = Math.max(0, e.eliteChargeWarning - dt);
        moveSpeed = 0;
        if (e.eliteChargeWarning === 0) {
          e.eliteChargeActive = 0.34;
          e.eliteChargeCooldown = 6;
        }
      } else {
        e.eliteChargeCooldown = (e.eliteChargeCooldown ?? 5.5) - dt;
        if (
          e.eliteChargeCooldown <= 0 &&
          onScreen &&
          playerDistanceSquared < 350 * 350
        ) {
          const length = Math.sqrt(playerDistanceSquared) || 1;
          e.eliteChargeX = playerDx / length;
          e.eliteChargeY = playerDy / length;
          e.eliteChargeWarning = 0.75;
          moveSpeed = 0;
        }
      }
    }
    if (onScreen && e.defenseSquadId) {
      const coordinated = window.worldDefenseMovement?.(e, player, time);
      if (coordinated) {
        moveAngle = coordinated.angle;
        moveSpeed *= coordinated.speedMult;
      }
    }
    if (onScreen && e.encounterTactic && !boss) {
      const ability = window.updateEncounterTactic?.(e,dt,player,time,onScreen,{
        chill: seconds => {
          player.guardianChillUntil=Math.max(player.guardianChillUntil||0,time+seconds);
        },
        damage: amount => {
          if(player.inv>0 || window.developerInvincible?.() || tryDodge())return false;
          player.hp-=amount;
          recordPlayerHit(amount);
          player.inv=.85;damageFlash=.48;shake=Math.max(shake,10);
          puff(player.x,player.y,"#ff9478",11);
          if(player.hp<=0)end();
          return true;
        }
      });
      if (ability) {
        moveAngle=ability.angle;
        moveSpeed*=ability.speedMult;
      }
    }
    let beauActive = false;
    let shadeActive = false;
    let bellActive = false;
    let memeActive = false;
    if (e === boss) {
      // Phase-dependent attack pacing stays isolated to the active Guardian.
      if (e.isFinalBoss) {
        const nextPhase =
          e.hp <= e.maxHp * 0.33 ? 3 : e.hp <= e.maxHp * 0.66 ? 2 : 1;
        if (nextPhase > e.finalPhase) {
          e.finalPhase = nextPhase;
          window.interruptMemeEncounter?.(e, time);
          e.phaseIntro = 1.25;
          e.shotWarning = 0;
          e.shootCooldown = Math.max(e.shootCooldown, 1.7);
          e.chargeWarning = 0;
          e.chargeCooldown = Math.max(e.chargeCooldown, 2.6);
          $("bossName").textContent =
            `THE LAST MEME · PHASE ${["I", "II", "III"][nextPhase - 1]}`;
          notify(`FINAL BOSS · PHASE ${nextPhase} / 3`, "boss", 4.5);
          playSfx("boss-warn");
          puff(e.x, e.y, "#ffb4fa", 30);
        }
        e.finalIntro = Math.max(0, (e.finalIntro || 0) - dt);
      }
      if (!e.isFinalBoss && !e.phaseTwo && e.hp <= e.maxHp * 0.66) {
        e.phaseTwo = true;
        e.phaseIntro = 0.95;
        e.shotWarning = 0;
        e.shootCooldown = Math.max(1.4, e.shootCooldown);
        e.chargeWarning = 0;
        e.chargeCooldown = Math.max(2, e.chargeCooldown);
        $("bossName").textContent = `${e.bossName} · PHASE II`;
        notify(`PHASE TWO · ${e.bossName}`, "boss", 4);
        puff(e.x, e.y, "#e09aff", 23);
      } else if (!e.isFinalBoss && e.phaseTwo && !e.phaseThree &&
                 e.hp <= e.maxHp * 0.33) {
        e.phaseThree = true;
        window.interruptBeauEncounter?.(e, time);
        window.interruptShadeEncounter?.(e, time);
        window.interruptBellEncounter?.(e, time);
        e.phaseIntro = 1.25;
        e.shotWarning = 0;
        e.chargeWarning = 0;
        e.shootCooldown = Math.max(e.shootCooldown, 1.6);
        e.chargeCooldown = Math.max(e.chargeCooldown, 2.5);
        $("bossName").textContent = `${e.bossName} · PHASE III`;
        notify(`FINAL STAND · ${e.bossName} · PHASE III`, "boss", 4);
        playSfx("boss-warn");
        puff(e.x, e.y, "#f8c47b", 26);
      }
      if (e.phaseIntro > 0) {
        e.phaseIntro = Math.max(0, e.phaseIntro - dt);
        moveSpeed *= 0.4;
      } else {
        const encounterHooks = {
          visible: onScreen,
          clearBossAttacks: () => { bossShots = []; bossHazards = []; },
          projectile: (source,angle,speed,amount,type) =>
            addBossProjectile(source,angle,speed,amount,type),
          hazard: (x,y,radius,warning,amount) => {
            if (bossHazards.length < 14) bossHazards.push({
              x,y,radius,warning,
              damage: amount * (difficultyProfiles[difficulty] || difficultyProfiles.normal).enemyDamage,
            });
          },
          notify: (message,kind,duration) => notify(message,kind,duration),
          puff: (x,y,color,amount) => puff(x,y,color,amount),
          sfx: name => playSfx(name),
          shake: amount => { shake = Math.max(shake, amount); },
        };
        beauActive = window.updateBeauEncounter?.(e, time, dt, player, encounterHooks) || false;
        shadeActive = window.updateShadeEncounter?.(e, time, dt, player, encounterHooks) || false;
        bellActive = window.updateBellEncounter?.(e, time, dt, player, encounterHooks) || false;
        memeActive = window.updateMemeEncounter?.(e, time, dt, player, encounterHooks) || false;
        // Beau keeps the normal shotgun and charge; dedicated showcase
        // attacks replace his original small Hound's Ambush ability.
        const specialActive = beauActive || shadeActive || bellActive || memeActive;
        if (!specialActive && !e.isFinalBoss && e.variant !== 0 && e.variant !== 1 && e.variant !== 2)
          window.updateGuardianWorld?.(e, time, player, {
            visible: onScreen,
            scar: (type,x,y,r) => window.addWorldScar?.(type,x,y,r),
            projectile: (source,angle,speed,amount,type) => addBossProjectile(source,angle,speed,amount,type),
            warn: (message,kind,duration) => notify(message,kind,duration),
          });
        if (beauActive || shadeActive || bellActive || memeActive || window.isBossCombatBusy?.(e, time)) moveSpeed = 0;
      }
      if (beauActive || shadeActive || bellActive || memeActive) {
        // Showcase combos control boss motion while their patterns execute.
      } else if (e.chargeActive > 0) {
        e.chargeActive = Math.max(0, e.chargeActive - dt);
        e.x += e.chargeX * e.chargeSpeed * dt;
        e.y += e.chargeY * e.chargeSpeed * dt;
      } else {
        e.chargeCooldown -= dt;
        if (
          e.chargeCooldown <= 0 &&
          !e.chargeWarning &&
          e.shotWarning <= 0 &&
          e.phaseIntro <= 0 &&
          !window.isBossCombatBusy?.(e, time) &&
          visibleEnemy(e, -12)
        ) {
          e.chargeX = Math.cos(a);
          e.chargeY = Math.sin(a);
          e.chargeSpeed =
            (e.isFinalBoss
              ? 375 + e.finalPhase * 17
              : e.variant === 0
                ? 360
                : e.variant === 1
                  ? 310
                  : 395) * (e.phaseThree ? 1.31 : e.phaseTwo ? 1.18 : 1);
          e.chargeWarning = e.isFinalBoss ? 1.15 : e.variant === 2 ? 1.05 : 0.9;
        }
        if (e.chargeWarning > 0) {
          e.chargeWarning = Math.max(0, e.chargeWarning - dt);
          if (!e.chargeWarning) {
            e.chargeActive = e.isFinalBoss
              ? 0.46
              : e.variant === 1
                ? 0.54
                : 0.42;
            e.chargeCooldown = e.isFinalBoss
              ? 8.7 - (e.finalPhase - 1) * 0.7
              : (e.variant === 1 ? 8.7 : e.variant === 2 ? 7.8 : 8) *
                (e.phaseTwo ? 0.77 : 1);
          }
        }
        e.x += Math.cos(moveAngle) * moveSpeed * dt;
        e.y += Math.sin(moveAngle) * moveSpeed * dt;
      }
    } else if (!onScreen) {
      // Offscreen normal enemies keep their exact pursuit speed without angle/trig work.
      const distance =
        Math.sqrt(playerDx * playerDx + playerDy * playerDy) || 1;
      e.x += (playerDx / distance) * moveSpeed * dt;
      e.y += (playerDy / distance) * moveSpeed * dt;
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

    // Sparse, local separation stops normal enemies stacking into one silhouette.
    // Only visible non-bosses take part to limit grid queries in large hordes.
    if (onScreen && e !== boss && e.kind !== 5) {
      e.separationCooldown = (e.separationCooldown ?? 0) - dt;
      if (e.separationCooldown <= 0) {
        e.separationCooldown = 0.14 + Math.random() * 0.08;
        let count = 0;
        for (const other of nearbyEnemies(e.x, e.y, e.r * 2 + 22)) {
          if (other === e || other === boss || other.dead) continue;
          const dx = e.x - other.x,
            dy = e.y - other.y;
          const lengthSquared = dx * dx + dy * dy;
          const ideal = e.r + other.r;
          if (lengthSquared > 1 && lengthSquared < ideal * ideal) {
            const push = Math.min(
              2.5,
              (ideal - Math.sqrt(lengthSquared)) * 0.12,
            );
            e.x += (dx / Math.sqrt(lengthSquared)) * push;
            e.y += (dy / Math.sqrt(lengthSquared)) * push;
          }
          if (++count >= 5) break;
        }
      }
    }

    e.hit = Math.max(0, e.hit - dt);
    if (e === boss) {
      if (beauActive || shadeActive || bellActive || memeActive) {
        // Normal volleys are suppressed until the showcase pattern ends.
      } else if (e.shotWarning > 0) {
        // Briefly follow the player during the opening of the warning, then
        // lock directions and painted impact spots for the final dodge window.
        if (time < (e.shotTrackUntil || 0)) {
          const target = window.bossCombatPredictTarget?.(e, player) || player;
          e.shotAngle = Math.atan2(target.y - e.y, target.x - e.x);
          e.warningX = target.x;
          e.warningY = target.y;
        }
        e.shotWarning = Math.max(0, e.shotWarning - dt);
        if (e.shotWarning === 0 && visibleEnemy(e, -12) && e.phaseIntro <= 0)
          bossFire(e);
      } else if (
        e.phaseIntro <= 0 &&
        e.chargeActive <= 0 &&
        e.chargeWarning <= 0 &&
        !window.isBossCombatBusy?.(e, time)
      ) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0 && visibleEnemy(e, -12)) {
          e.shootCooldown = 0;
          const target = window.bossCombatPredictTarget?.(e, player) || player;
          e.shotAngle = Math.atan2(target.y - e.y, target.x - e.x);
          e.shotTrackUntil = time + .35;
          if (e.isFinalBoss) {
            e.shotPattern = (e.volleyCount || 0) % 3;
            e.shotRotation = time * 0.45;
            e.warningX = target.x;
            e.warningY = target.y;
            e.shotWarning = [1.2, 1.05, 0.92][e.finalPhase - 1];
          } else {
            e.shotWarning = e.phaseTwo ? 0.95 : 1.05;
          }
        }
      }
      if (e.phaseTwo || (e.isFinalBoss && e.finalPhase >= 2)) {
        e.minionCooldown = (e.minionCooldown ?? 8) - dt;
        const existingSummons = e.minionCooldown <= 0
          ? enemies.filter(enemy => enemy.summoned && !enemy.dead).length : 0;
        if (e.minionCooldown <= 0 && existingSummons < 6) {
          e.minionCooldown = e.isFinalBoss ? 13 : e.variant === 1 ? 11 : 10;
          const kind = e.isFinalBoss
            ? e.finalPhase === 3
              ? 1
              : 0
            : e.variant === 1
              ? 1
              : e.variant === 2
                ? 4
                : 0;
          const minionCount = Math.min(6 - existingSummons, e.isFinalBoss ? 2 : 2);
          for (let i = 0; i < minionCount; i++) {
            const angle = (Math.PI * 2 * i) / minionCount + time;
            const minion = {
              x: e.x + Math.cos(angle) * 115,
              y: e.y + Math.sin(angle) * 115,
              r: kind === 4 ? 15 : 11,
              hp:
                (20 + growthTime * 0.08) *
                (difficultyProfiles[difficulty]?.enemyHealth || 1) *
                (kind === 1 ? 0.65 : 1),
              speed:
                (kind === 1 ? 115 : kind === 4 ? 40 : 66) + growthTime * 0.05,
              damage: (kind === 4 ? 6 : 8) + growthTime * 0.004,
              kind,
              shootCooldown: kind === 4 ? 3.2 : undefined,
              shotWarning: 0,
              hit: 0,
              noXp: true,
              summoned: true,
              summonUntil: time + (e.isFinalBoss ? 18 : 15),
              knockbackX: 0,
              knockbackY: 0,
            };
            window.initializeEnemyAdaptation?.(minion);
            enemies.push(minion);
          }
          if (!e.summonAnnounced) {
            notify("BOSS SUMMONS · ADDITIONAL ENEMIES", "boss", 3.5);
            e.summonAnnounced = true;
          }
        }
      }
    }
    const playerHitRadius = enemyHitRadius(e) + player.r;
    const collisionDx = player.x - e.x,
      collisionDy = player.y - e.y;
    if (
      collisionDx * collisionDx + collisionDy * collisionDy <
        playerHitRadius * playerHitRadius &&
      player.inv <= 0
    ) {
      if (tryDodge()) continue;
      const contactDamage = e.damage * (window.worldDefenseAttackMultiplier?.(e) ?? 1);
      player.hp -= contactDamage;
      recordPlayerHit(contactDamage);
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
      const bladeRadius = enemyHitRadius(e) + 12 * bladeScale();
      for (let index = 0; index < upgrades.orbit; index++) {
        const bladeDx = e.x - bladePositions[index * 2],
          bladeDy = e.y - bladePositions[index * 2 + 1];
        if (
          bladeDx * bladeDx + bladeDy * bladeDy < bladeRadius * bladeRadius &&
          (!e.bladeHit || time - e.bladeHit > 0.35)
        ) {
          damage(
            e,
            (35 + upgrades.orbit * 3) * globalDamageMultiplier(),
            player,
            "blade",
          );
          e.bladeHit = time;
        }
      }
    }
  }
  enemies = enemies.filter((e) => !e.dead);
  rebuildEnemyGrid();
  updateElementalCombat(dt);
  performanceMetrics.enemyAI += performance.now() - enemyAIStarted;
  const collisionStarted = performance.now();
  for (const b of bullets) {
    if (b.type === "orb" || b.type === "frost") {
      if (!b.target || b.target.dead) {
        b.target = nearestEnemy(b.x, b.y, window.playerWeaponRange?.(650) ?? 650,
          null, e => window.playerWeaponTargetVisible?.(e) ?? true);
      }
      if(b.target && window.playerWeaponTargetVisible?.(b.target)===false)b.target=null;
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
      if (!b.returning && (b.age >= 0.8 || b.target?.dead)) {
        b.returning = true;
        b.hit.clear();
      }
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
      const returnDx = b.x - player.x,
        returnDy = b.y - player.y;
      const returnRadius = player.r + b.r;
      if (
        b.returning &&
        returnDx * returnDx + returnDy * returnDy < returnRadius * returnRadius
      ) {
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
      const dx = e.x - b.x,
        dy = e.y - b.y,
        hitRadius = enemyHitRadius(e) + b.r;
      if (!b.hit.has(e) && dx * dx + dy * dy < hitRadius * hitRadius) {
        damage(e, b.type === "fish" && e === boss ? b.d * 0.55 : b.d, b);
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
    bombTimer -= dt / weaponCooldownMultiplier();
    if (bombTimer <= 0) {
      bombs.push({
        x: player.x,
        y: player.y,
        fuse: 1.5,
        evolved: !!evolutions.megaEiad,
        radius: 150 + upgrades.bomb * 24 + (evolutions.megaEiad ? 40 : 0),
        damage: calculateBombDamage(
          upgrades.bomb,
          globalDamageMultiplier(),
          !!evolutions.megaEiad,
        ),
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
      const dx = target.x - bomb.x,
        dy = target.y - bomb.y;
      const hitRadius = bomb.radius + enemyHitRadius(target);
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        damage(
          target,
          bomb.damage * (target === boss ? 0.42 : 1),
          bomb,
          "bomb",
        );
      }
    }
    if (bomb.evolved)
      bombAftershocks.push({
        x: bomb.x,
        y: bomb.y,
        delay: 0.42,
        radius: bomb.radius * 0.72,
        damage: bomb.damage * 0.3,
      });
    puff(bomb.x, bomb.y, "#e6a96a", 26);
    playSfx("bomb");
    window.addWorldScar?.("ruin", bomb.x, bomb.y, bomb.radius);
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
  for (let i = bombAftershocks.length - 1; i >= 0; i--) {
    const aftershock = bombAftershocks[i];
    aftershock.delay -= dt;
    if (aftershock.delay > 0) continue;
    bombAftershocks.splice(i, 1);
    for (const target of nearbyEnemies(
      aftershock.x,
      aftershock.y,
      aftershock.radius + 280,
    )) {
      const dx = target.x - aftershock.x,
        dy = target.y - aftershock.y;
      const hitRadius = aftershock.radius + enemyHitRadius(target);
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        damage(
          target,
          aftershock.damage * (target === boss ? 0.42 : 1),
          aftershock,
          "bomb",
        );
      }
    }
    explosions.push({
      x: aftershock.x,
      y: aftershock.y,
      radius: aftershock.radius,
      life: 0.45,
      maxLife: 0.45,
      evolved: true,
      aftershock: true,
    });
    puff(aftershock.x, aftershock.y, "#c18bff", 12);
  }
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

    const hitDx = shot.x - player.x,
      hitDy = shot.y - player.y;
    const hitRadius = shot.r + player.r;
    if (
      hitDx * hitDx + hitDy * hitDy < hitRadius * hitRadius &&
      player.inv <= 0
    ) {
      if (tryDodge()) {
        shot.life = 0;
        continue;
      }
      player.hp -= shot.damage;
      recordPlayerHit(shot.damage);
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
  // Ground attacks are announced before impact and cannot hit a player who
  // has already moved outside the visible warning zone.
  for (let i = bossHazards.length - 1; i >= 0; i--) {
    const hazard = bossHazards[i];
    hazard.warning -= dt;
    if (hazard.warning > 0) continue;
    bossHazards.splice(i, 1);
    const dx = hazard.x - player.x,
      dy = hazard.y - player.y;
    const reach = hazard.radius + player.r;
    if (dx * dx + dy * dy <= reach * reach && player.inv <= 0 && !tryDodge()) {
      player.hp -= hazard.damage;
      recordPlayerHit(hazard.damage);
      player.inv = 0.8;
      damageFlash = 0.5;
      shake = Math.max(shake, 11);
      puff(player.x, player.y, "#eb94ff", 12);
      if (player.hp <= 0) {
        end();
        return;
      }
    }
    explosions.push({
      x: hazard.x,
      y: hazard.y,
      radius: hazard.radius,
      life: 0.48,
      maxLife: 0.48,
      evolved: true,
    });
    puff(hazard.x, hazard.y, "#ed99ff", 14);
    playSfx("bomb");
  }
  for (const b of bossShots) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (tryBladeBlock(b)) continue;
    if (b.life <= 0 || projectileOutsideArena(b)) {
      b.life = 0;
      continue;
    }
    const hitDx = b.x - player.x,
      hitDy = b.y - player.y;
    const hitRadius = b.r + player.r;
    if (
      hitDx * hitDx + hitDy * hitDy < hitRadius * hitRadius &&
      player.inv <= 0
    ) {
      if (tryDodge()) {
        b.life = 0;
        continue;
      }
      const projectileDamage = b.damage ?? 13;
      player.hp -= projectileDamage;
      recordPlayerHit(projectileDamage);
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
  bossShots = bossShots.filter((b) => b.life > 0 && !projectileOutsideArena(b));
  let collectedGem = false;
  // Slightly wider soul pickup compensates for scattered low-density fights.
  // Picking up gems remains a movement and positioning decision.
  const pickupRange =
    115 + upgrades.magnet * 55 + (metaProgress.magnetLevel || 0) * 12;
  for (const g of nearbyGems(player.x, player.y, pickupRange)) {
    const oldX = g.x,
      oldY = g.y;
    const dx = player.x - g.x,
      dy = player.y - g.y;
    const distanceSquared = dx * dx + dy * dy;
    const range = pickupRange;
    if (distanceSquared < range * range) {
      const distance = Math.sqrt(distanceSquared) || 1;
      const speed = Math.max(180, 650 * (1 - distance / range));
      g.x += (dx / distance) * speed * dt;
      g.y += (dy / distance) * speed * dt;
      updateGemGridPosition(g, oldX, oldY);
    }
    const pickupRadius = player.r + g.r + 5;
    if (distanceSquared < pickupRadius * pickupRadius) {
      g.dead = true;
      removeGemFromGrid(g);
      collectedGem = true;
      if (g.kind === "health") {
        const beforeHeal = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + g.value);
        if (runStats) runStats.healing += Math.max(0, player.hp - beforeHeal);
      } else {
        if (runStats) runStats.soulsCollected++;
        playSfx("xp");
        addXP(
          g.value *
            (g.kind === "health"
              ? 1
              : 1 + Math.max(0, upgrades.magnet - 2) * 0.05),
        );
        if (paused) break;
      }
    }
  }
  performanceMetrics.collisions += performance.now() - collisionStarted;
  if (collectedGem) gems = gems.filter((g) => !g.dead);
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
  checkRunAchievements();
  if (hudUpdateTimer >= 0.12) {
    hudUpdateTimer = 0;
    hud();
  }
}

// Keep the game loop running; simulation pauses while menus are open.
function loop(t) {
  const elapsed = (t - last) / 1000 || 0;
  currentFrameMs = elapsed * 1000;
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
    performanceMetrics.enemyAI = 0;
    performanceMetrics.collisions = 0;
    simulationAccumulator += Math.min(elapsed, 0.1) * gameSpeed;
    const fixedStep = 1 / 60;
    let steps = 0;
    while (
      simulationAccumulator >= fixedStep &&
      steps < 8 &&
      active &&
      !paused
    ) {
      update(fixedStep);
      simulationAccumulator -= fixedStep;
      steps++;
    }
  } else {
    simulationAccumulator = 0;
  }
  draw();
  // Live benchmark samples real, unpaused browser frames (not the paused F9 menu).
  window.developerPerfFrame?.(elapsed);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
