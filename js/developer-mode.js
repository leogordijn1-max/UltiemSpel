// Developer Mode — intentional, local-only test sandbox. Enabled through Settings.
// A test run never writes career progression or permanent world conquest.
// Ctrl + Shift + D opens tools during a sandbox run; Escape closes tools before pause logic.
(() => {
  "use strict";
  const PREF = "shadowDeveloperEnabledV1";
  let enabled = storageGet(PREF, "false") === "true";
  let sandbox = false;
  let invincible = false;
  let testElement = null;
  let open = false;
  let wasPlaying = false;
  let panelNode = null;
  let badgeNode = null;
  let performanceNode = null;
  let frameTimes = [];
  let perfClock = 0;
  let perfSnapshot = { fps: 0, p95: 0, count: 0, ai: 0, render: 0, collisions: 0 };

  const isSandbox = () => sandbox;
  window.isDeveloperRun = isSandbox;
  window.developerRunElement = () => sandbox ? testElement : null;
  window.developerModeEnabled = () => enabled;
  function setEnabled(value) {
    // Don't allow turning protection off in the middle of an active run.
    if (active) return false;
    enabled = !!value;
    storageSet(PREF, enabled);
    return true;
  }

  function ensureBadge() {
    if (badgeNode) return badgeNode;
    badgeNode = document.createElement("div");
    badgeNode.id = "developerBadge";
    badgeNode.className = "developer-badge";
    badgeNode.setAttribute("aria-live", "polite");
    document.body.append(badgeNode);
    return badgeNode;
  }
  function ensurePerformanceOverlay() {
    if (performanceNode) return performanceNode;
    performanceNode = document.createElement("div");
    performanceNode.id = "developerPerformance";
    performanceNode.className = "developer-performance";
    performanceNode.setAttribute("aria-label", "Live test performance");
    document.body.append(performanceNode);
    return performanceNode;
  }
  function updateBadge() {
    const badge = ensureBadge();
    badge.hidden = !sandbox;
    badge.textContent = invincible
      ? "DEV SANDBOX · GOD MODE · Ctrl + Shift + D" : "DEV SANDBOX · Ctrl + Shift + D";
    const overlay = ensurePerformanceOverlay();
    overlay.hidden = !sandbox;
    if (sandbox) {
      overlay.textContent = "FPS " + perfSnapshot.fps + " · P95 FRAME " +
        perfSnapshot.p95.toFixed(1) + " ms · ENEMIES " + perfSnapshot.count +
        " · AI " + perfSnapshot.ai.toFixed(1) + " ms" +
        " · DRAW " + perfSnapshot.render.toFixed(1) + " ms" +
        " · COLLISIONS " + perfSnapshot.collisions.toFixed(1) + " ms";
    }
  }
  window.developerPerfFrame = elapsedSeconds => {
    if (!sandbox || !active || paused || !Number.isFinite(elapsedSeconds)) return;
    frameTimes.push(Math.max(1, Math.min(200, elapsedSeconds * 1000)));
    if (frameTimes.length > 120) frameTimes.shift();
    perfClock += Math.min(.2, elapsedSeconds);
    if (perfClock < .8) return;
    perfClock = 0;
    const ordered = [...frameTimes].sort((a,b)=>a-b);
    const avg = frameTimes.reduce((sum,ms)=>sum+ms,0)/Math.max(1,frameTimes.length);
    perfSnapshot = {
      fps: Math.round(1000/avg),
      p95: ordered[Math.max(0,Math.ceil(ordered.length*.95)-1)] || 0,
      count: typeof enemies !== "undefined" ? enemies.filter(e=>!e.dead).length : 0,
      ai: performanceMetrics.enemyAI || 0,
      render: performanceMetrics.render || 0,
      collisions: performanceMetrics.collisions || 0,
    };
    updateBadge();
  };
  window.developerPerfSnapshot = () => ({...perfSnapshot});

  function beginRun() {
    closePanel(false);
    // Discard mutations from any previous unsaved sandbox run.
    if (sandbox) {
      metaProgress = loadMetaProgress();
      highest = storageNumber("shadowHigh", 0, 0);
    }
    sandbox = enabled;
    frameTimes = [];
    perfClock = 0;
    perfSnapshot = { fps: 0, p95: 0, count: 0, ai: 0, render: 0, collisions: 0 };
    invincible = false;
    testElement = null;
    updateBadge();
  }
  function endRun() {
    closePanel(false);
    if (sandbox) {
      metaProgress = loadMetaProgress();
      highest = storageNumber("shadowHigh", 0, 0);
    }
    sandbox = false;
    invincible = false;
    testElement = null;
    updateBadge();
  }
  window.developerBeginRun = beginRun;
  window.developerEndRun = endRun;
  window.developerInvincible = () => sandbox && invincible;

  function available() {
    return enabled && sandbox && active &&
      (gameState === "playing" || gameState === "paused");
  }
  const small = (tag, text, cls) => {
    const n = document.createElement(tag);
    n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  function addButton(parent, text, action, disabled = false, danger = false) {
    const button = small("button", text);
    button.type = "button";
    button.disabled = disabled;
    if (danger) button.className = "developer-danger";
    button.addEventListener("click", () => {
      if (!sandbox || !active) return;
      action();
      if (open) refresh();
    });
    parent.append(button);
    return button;
  }
  function section(root, title) {
    const section = document.createElement("section");
    section.className = "developer-section";
    section.append(small("h3", title));
    root.append(section);
    return section;
  }
  function updateHud() {
    if (active && player) hud();
  }

  function maxLoadout(evolve = false) {
    if (!available()) return;
    for (const key of selectedWeapons) {
      if (!unlockedWeapons.includes(key)) unlockedWeapons.push(key);
      upgrades[key] = 5;
      const recipe = evolutionForWeapon(key);
      if (recipe) {
        upgrades[recipe.support] = Math.max(upgrades[recipe.support] || 0, recipe.supportLevel);
        if (evolve) evolutions[recipe.id] = true;
      }
    }
    if (evolve) {
      evolutionFlash = { name: "ALL ELEMENTAL EVOLUTIONS", started: time, until: time + 2.4 };
      notify("DEV · THREE ELEMENTAL EVOLUTIONS ACTIVATED", "evolution", 3);
    } else {
      notify("DEV · ALL THREE WEAPONS LEVEL 5", "wave", 2.5);
    }
    updateHud();
  }
  function grantLevels(amount) {
    if (!available()) return;
    const count = Math.max(1, Math.min(20, Math.floor(amount)));
    for (let i = 0; i < count; i++) {
      level++;
      needed = nextLevelXpRequirement(needed, level);
      pendingLevelUps++;
    }
    xp = 0;
    notify("DEV · " + count + " LEVEL-UPS QUEUED", "wave", 3);
    updateHud();
  }
  function spawnTestBoss(final = false) {
    if (!available() || boss) return;
    if (final) {
      if (runMode !== "standard" || victoryClaimed) return;
      if (!spawnFinalBoss()) return;
    } else spawnBoss();
    // Make a real boss immediately visible instead of spawning offscreen.
    boss.x = player.x + Math.min(W * .26, 260);
    boss.y = player.y - 20;
    // Keep real boss HP for balancing. Phase shortcuts are separate buttons.
    boss.hp = boss.maxHp;
    nextBossTime = Infinity;
    rebuildEnemyGrid();
    updateHud();
  }
  function forceBossPhaseTwo() {
    if (!available() || !boss) return;
    boss.hp = Math.max(1, Math.min(boss.hp, boss.maxHp * .42));
    $("bossFill").style.width = (100 * boss.hp / boss.maxHp) + "%";
    notify("DEV · BOSS PHASE II QUEUED", "boss", 3);
    updateHud();
  }
  function forceBossPhaseThree() {
    if (!available() || !boss) return;
    boss.hp = Math.max(1, Math.min(boss.hp, boss.maxHp * .27));
    $("bossFill").style.width = (100 * boss.hp / boss.maxHp) + "%";
    notify("DEV · BOSS PHASE III QUEUED", "boss", 3);
    updateHud();
  }
  function forceSignature() {
    if (!available() || !boss) return;
    if (boss.variant === 0 && !boss.isFinalBoss) {
      forceBeau("hunt");
      return;
    }
    if (boss.variant === 1 && !boss.isFinalBoss) {
      forceShade("collapse");
      return;
    }
    if (boss.variant === 2 && !boss.isFinalBoss) {
      forceBell("sweep");
      return;
    }
    boss.specialNextAt = time;
    notify("DEV · SIGNATURE ATTACK READY", "boss", 2);
    updateHud();
  }
  function forceBell(mode) {
    if (!available() || !boss || boss.variant !== 2 || boss.isFinalBoss) return;
    if (mode === "peal") {
      if (boss.bellFight) boss.bellFight.ultimateUsed = false;
      forceBossPhaseThree();
    } else if (!boss.phaseTwo) forceBossPhaseTwo();
    if (window.forceBellEncounter?.(boss, mode, time))
      notify("DEV · BELL " + mode.toUpperCase() + " READY", "boss", 2);
    updateHud();
  }
  function forceShade(mode) {
    if (!available() || !boss || boss.variant !== 1 || boss.isFinalBoss) return;
    if (mode === "eclipse") {
      if (boss.shadeFight) boss.shadeFight.ultimateUsed = false;
      forceBossPhaseThree();
    } else if (!boss.phaseTwo) forceBossPhaseTwo();
    if (window.forceShadeEncounter?.(boss, mode, time))
      notify("DEV · SHADE " + mode.toUpperCase() + " READY", "boss", 2);
    updateHud();
  }
  function forceBeau(mode) {
    if (!available() || !boss || boss.variant !== 0 || boss.isFinalBoss) return;
    if (mode === "ultimate") {
      if (boss.beauFight) boss.beauFight.ultimateUsed = false;
      forceBossPhaseThree();
    } else if (!boss.phaseTwo) forceBossPhaseTwo();
    if (window.forceBeauEncounter?.(boss, mode, time))
      notify("DEV · BEAU " + mode.toUpperCase() + " READY", "boss", 2);
    updateHud();
  }
  function triggerGuardianWarning() {
    if (!available() || !boss || !boss.guardianWorld) return;
    boss.hp = Math.max(1, Math.min(boss.hp, boss.maxHp * .42));
    $("bossFill").style.width = (100 * boss.hp / boss.maxHp) + "%";
    boss.guardianCooldownAt = time;
    notify("DEV · WORLD GUARDIAN POWER READY", "boss", 3);
    updateHud();
  }
  function defeatTestBoss() {
    if (!available() || !boss) return;
    const target = boss;
    // Use actual boss-death handling (reward, world reaction, final victory)
    // while all permanent storage is guarded by the sandbox.
    damage(target, target.hp + 999999, player, "direct");
    updateHud();
  }
  function spawnTestEnemies(target) {
    if (!available() || !player || boss || window.isBossIsolationActive?.()) return;
    const max = Math.min(250, Math.max(10, Math.floor(target)));
    const missing = Math.max(0, max - enemies.filter(e=>!e.dead).length);
    const kinds = [0, 1, 0, 2, 4, 0, 6, 5];
    for (let i = 0; i < missing; i++) {
      const e = enemySpawn(kinds[i % kinds.length], false);
      const angle = i * 2.399963229728653; // golden angle: reproducible spread
      const radius = 145 + (i % 9) * Math.max(12, Math.min(W,H)*.03);
      e.x = player.x + Math.cos(angle)*radius;
      e.y = player.y + Math.sin(angle)*radius;
      e.developerTestEnemy = true;
      e.noXp = true;
      // We moved the spawn into view, so sample its actual new world patch.
      window.initializeEnemyAdaptation?.(e, window.enemyWorldBiomeAt?.(e.x,e.y));
    }
    rebuildEnemyGrid();
    notify("DEV · " + Math.max(0, missing) + " ENEMIES ADDED · TARGET " + max, "wave", 3);
    updateHud();
  }
  function spawnEnemyVariant(world, count = 12) {
    if (!available() || !window.enemyWorldVariants?.[world] || !player ||
        boss || window.isBossIsolationActive?.()) return;
    const missing = Math.min(count, Math.max(0, 250 - enemies.filter(e=>!e.dead).length));
    for (let i = 0; i < missing; i++) {
      const e = enemySpawn([0,1,2,4,6,0][i % 6], false);
      const angle = i * 2.399963229728653;
      const radius = 165 + (i % 3) * 68;
      e.x = player.x + Math.cos(angle) * radius;
      e.y = player.y + Math.sin(angle) * radius;
      e.developerTestEnemy = true;
      e.developerForcedAffinity = world;
      e.noXp = true;
      window.initializeEnemyAdaptation?.(e, world);
    }
    rebuildEnemyGrid();
    notify("DEV · " + world.toUpperCase() + " ENEMIES: " + missing, "wave", 3);
    updateHud();
  }
  function clearTestEnemies() {
    if (!available()) return;
    enemies = enemies.filter(e=>!e.developerTestEnemy);
    rebuildEnemyGrid();
    updateHud();
  }
  function toggleInvulnerability() {
    if (!available()) return;
    invincible = !invincible;
    if (invincible && player) {
      player.hp = player.maxHp;
      player.inv = Math.max(player.inv, 1.5);
    }
    updateBadge();
    updateHud();
  }
  function changeRunElement(nextElement) {
    if (!available() || !isLivingWorldElement(nextElement)) return;
    if (!window.developerChangeRunElement?.(nextElement)) return;
    testElement = nextElement;
    const loadout = elementalLoadout(nextElement);
    selectedWeapons = [...loadout];
    startWeapon = loadout[0];
    unlockableWeapons = loadout.slice(1);
    unlockedWeapons = [startWeapon];
    upgrades = { ...upgrades, ...makeStartingWeaponLevels(startWeapon) };
    evolutions = {};
    resetElementalCombat();
    bullets = [];
    lightningSegments = [];
    flameBursts = [];
    frostZones = [];
    weaponTimers = { chain: 0, boomerang: 0, flame: 0, frost: 0 };
    window.resetWorldScars?.();
    notify("DEV · CHANGED TO " + nextElement.toUpperCase(), "wave", 2);
    updateHud();
  }
  function startWorldState(original) {
    if (!available() || !window.developerChangeWorld) return;
    window.developerChangeWorld(original);
    window.resetWorldScars?.();
    updateHud();
  }
  function changeImpact(target) {
    if (!available()) return;
    window.developerSetWorldCoverage?.(target);
    updateHud();
  }

  function renderContent() {
    const root = document.createElement("div");
    root.className = "developer-content";
    const status = small("div",
      sandbox && active
        ? (boss ? "ISOLATED BOSS ARENA · " : "") +
          "WORLD " + (window.getDominantWorld?.() || "frozen").toUpperCase() +
          " · ELEMENT " + currentLivingWorldElement().toUpperCase() +
          " · IMPACT " + (window.getWorldConquest?.().coverage || 0) + "%" +
          " · LEVEL " + level
        : "Start a run after enabling Developer Mode to unlock test actions.",
      "developer-status");
    root.append(status);
    if (!available()) return root;
    let s = section(root, "SURVIVAL & PROGRESSION");
    addButton(s, invincible ? "DISABLE GOD MODE" : "ENABLE GOD MODE", toggleInvulnerability);
    addButton(s, "HEAL TO FULL", () => { player.hp = player.maxHp; updateHud(); });
    addButton(s, "+5 LEVELS", () => grantLevels(5));
    addButton(s, "MAX ALL 3 WEAPONS", () => maxLoadout(false));
    addButton(s, "EVOLVE ALL 3 WEAPONS", () => maxLoadout(true));

    s = section(root, "SWITCH ELEMENT · SAME RUN");
    for (const id of ["fire", "water", "frost"])
      addButton(s, id.toUpperCase() + " LOADOUT", () => changeRunElement(id));
    s = section(root, "BOSS QUICK TESTS");
    addButton(s, "SPAWN NORMAL BOSS", () => spawnTestBoss(false), !!boss);
    addButton(s, "SPAWN FINAL BOSS", () => spawnTestBoss(true),
      !!boss || runMode !== "standard" || victoryClaimed);
    addButton(s, "FORCE BOSS PHASE II", forceBossPhaseTwo, !boss);
    addButton(s, "FORCE BOSS PHASE III", forceBossPhaseThree, !boss);
    addButton(s, "TRIGGER SIGNATURE ATTACK", forceSignature, !boss);
    const isBeau = !!boss && boss.variant === 0 && !boss.isFinalBoss;
    addButton(s, "BEAU · HUNTING GROUNDS", () => forceBeau("hunt"), !isBeau);
    addButton(s, "BEAU · PINCER AMBUSH", () => forceBeau("pincer"), !isBeau);
    addButton(s, "BEAU · THE FINAL HUNT", () => forceBeau("ultimate"), !isBeau);
    const isShade = !!boss && boss.variant === 1 && !boss.isFinalBoss;
    addButton(s, "SHADE · SHADOW COLLAPSE", () => forceShade("collapse"), !isShade);
    addButton(s, "SHADE · PHANTOM EXECUTION", () => forceShade("phantoms"), !isShade);
    addButton(s, "SHADE · ETERNAL ECLIPSE", () => forceShade("eclipse"), !isShade);
    const isBell = !!boss && boss.variant === 2 && !boss.isFinalBoss;
    addButton(s, "BELL · RESONANT SWEEP", () => forceBell("sweep"), !isBell);
    addButton(s, "BELL · CLOCKWORK JUDGMENT", () => forceBell("clock"), !isBell);
    addButton(s, "BELL · THE GRAND PEAL", () => forceBell("peal"), !isBell);
    addButton(s, "TRIGGER GUARDIAN POWER", triggerGuardianWarning, !boss || isBeau);
    addButton(s, "DEFEAT ACTIVE BOSS", defeatTestBoss, !boss, true);

    s = section(root, "TEST ELEMENTAL ENEMY TYPES");
    for (const id of ["frozen", "burning", "flooded"])
      addButton(s, "SPAWN 12 " + id.toUpperCase(), () => spawnEnemyVariant(id), !!boss);
    s = section(root, "ENEMY STRESS TEST · TARGET COUNT");
    for (const count of [10,50,100,250])
      addButton(s, count + " ENEMIES", () => spawnTestEnemies(count), !!boss);
    addButton(s, "CLEAR TEST ENEMIES", clearTestEnemies, false, true);
    root.append(small("p",
      boss
        ? "BOSS ISOLATION ACTIVE · Only the Guardian can summon minions. Defeat the boss to resume horde stress tests."
        : "Close Ctrl + Shift + D to resume the game and measure real FPS. Bottom-left overlay shows FPS, P95 frametime and engine costs.",
      "developer-note"));

    s = section(root, "WORLD ENVIRONMENT · TEMPORARY");
    for (const id of ["frozen", "burning", "flooded"])
      addButton(s, id.toUpperCase() + " WORLD", () => startWorldState(id));
    s = section(root, "WORLD CONQUEST · NO SAVE");
    for (const amount of [0, 15, 50, 100])
      addButton(s, amount + "% IMPACT", () => changeImpact(amount));
    addButton(s, "CLEAR LOCAL TERRAIN", () => {
      window.resetWorldScars?.();
      updateHud();
    });

    s = section(root, "TEST RUN");
    addButton(s, "RESET CURRENT RUN", () => { closePanel(false); reset(); }, false, true);
    root.append(small("p", "Test runs do not write career points, achievements, records, high scores or world conquest. Ctrl + Shift + D to open/close.", "developer-note"));
    return root;
  }

  function refresh() {
    if (!open || !panelNode) return;
    const content = panelNode.querySelector(".developer-content");
    if (content) content.replaceWith(renderContent());
  }
  function showPanel() {
    if (!enabled) return false;
    if (open) { closePanel(true); return true; }
    if (active && !["playing", "paused"].includes(gameState)) return false;
    wasPlaying = active && gameState === "playing";
    if (wasPlaying) {
      paused = true;
      gameState = "paused";
      clearMovementKeys();
    }
    open = true;
    panelNode = document.createElement("aside");
    panelNode.id = "developerPanel";
    panelNode.className = "developer-panel";
    panelNode.setAttribute("role", "dialog");
    panelNode.setAttribute("aria-modal", "true");
    panelNode.setAttribute("aria-label", "Developer Mode");
    const header = document.createElement("header");
    header.append(small("h2", "DEVELOPER MODE"));
    const close = small("button", "CLOSE · Ctrl + Shift + D");
    close.className = "developer-close";
    close.addEventListener("click", () => closePanel(true));
    header.append(close);
    panelNode.append(header, renderContent());
    document.body.append(panelNode);
    return true;
  }
  function closePanel(restore = true) {
    if (!open) return;
    panelNode?.remove();
    panelNode = null;
    open = false;
    if (restore && wasPlaying && active && gameState === "paused") {
      paused = false;
      gameState = "playing";
      $("overlay").style.display = "none";
      if (pendingLevelUps > 0) choices();
    }
    wasPlaying = false;
  }
  window.openDeveloperPanel = showPanel;
  window.closeDeveloperPanel = closePanel;

  function appendSettings(parent) {
    const area = section(parent, "DEVELOPER MODE · LOCAL TESTING");
    area.classList.add("developer-settings");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    checkbox.disabled = active;
    checkbox.addEventListener("change", () => {
      if (!setEnabled(checkbox.checked)) checkbox.checked = enabled;
      info.textContent = enabled
        ? "ENABLED · New runs are isolated test runs. Press Ctrl + Shift + D while playing."
        : "DISABLED · New runs save progress normally.";
      openButton.hidden = !enabled;
    });
    label.append(checkbox, document.createTextNode(" Enable developer sandbox"));
    area.append(label);
    const info = small("p",
      enabled
        ? "ENABLED · New runs are isolated test runs. Press Ctrl + Shift + D while playing."
        : "DISABLED · New runs save progress normally.", "developer-help");
    area.append(info);
    if (active) area.append(small("p", "This setting is locked during a run.", "developer-help"));
    const openButton = small("button", "OPEN DEVELOPER PANEL");
    openButton.hidden = !enabled;
    openButton.type = "button";
    openButton.addEventListener("click", showPanel);
    area.append(openButton);
  }
  window.appendDeveloperSettings = appendSettings;

  window.addEventListener("keydown", event => {
    if (event.code === "KeyD" && event.ctrlKey && event.shiftKey && !event.repeat && enabled) {
      event.preventDefault();
      showPanel();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closePanel(true);
    }
  }, true);
  updateBadge();
})();
