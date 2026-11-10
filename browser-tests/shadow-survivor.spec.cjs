const {
  closeDeveloperPanel,
  expect,
  openDeveloperPanel,
  saveScreenshot,
  spawnAndDefeatNextBoss,
  startDeveloperRun,
  defeatActiveBoss,
  test,
} = require("./fixtures.cjs");

test("Chromium smoke: menu loads and a run starts on Canvas", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("main", { name: "Main menu" })).toBeVisible();
  await expect(page.locator(".cinematic-title")).toContainText("SHADOW");
  await expect(page.locator("#panel")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#overlay")).toHaveAttribute("aria-hidden", "false");
  await saveScreenshot(page, testInfo, "smoke-main-menu.png");

  await page.getByRole("button", { name: "NEW RUN" }).click();
  await page.getByRole("button", { name: /STANDARD RUN/ }).click();
  await page.getByRole("button", { name: /CONTINUE · CHOOSE SURVIVOR/ }).click();
  await page.getByRole("button", { name: /CONTINUE · CHOOSE YOUR WEAPONS/ }).click();
  await page.getByRole("button", { name: /START STANDARD/ }).click();

  await expect.poll(() => page.evaluate(() => gameState)).toBe("playing");
  await expect(page.locator("#game")).toBeVisible();
  const canvas = await page.locator("#game").evaluate((element) => ({
    width: element.width,
    height: element.height,
    cssWidth: element.getBoundingClientRect().width,
    cssHeight: element.getBoundingClientRect().height,
  }));
  expect(canvas.width).toBeGreaterThan(0);
  expect(canvas.height).toBeGreaterThan(0);
  expect(canvas.cssWidth).toBeGreaterThan(0);
  expect(canvas.cssHeight).toBeGreaterThan(0);
  await expect(page.locator(".hud-header")).toContainText("LIVE RUN");
  await expect(page.locator("#overlay")).toHaveAttribute("aria-hidden", "true");
  await saveScreenshot(page, testInfo, "smoke-active-run.png");
});

test("sandbox scenarios: combat, upgrades, evolution and Guardian warnings", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await startDeveloperRun(page);
  await expect(page.locator("#developerBadge")).toContainText("DEV SANDBOX");
  await closeDeveloperPanel(page);

  const cardMeasurements = await page.evaluate(() => {
    const selections = ["flame", "fireball", "flameOrbit"].map((key) =>
      makeUpgradeChoice(opts.find(([optionKey]) => optionKey === key)),
    );
    panel("BROWSER QA CARDS", "", (container) => selections.forEach((card) => container.append(card)));
    return [...document.querySelectorAll("#choices > button.choice")].map((card) => {
      const bounds = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      return {
        width: bounds.width,
        height: bounds.height,
        cssWidth: style.width,
        cssHeight: style.height,
        text: card.innerText.trim(),
        effect: card.querySelector(".choice-primary")?.textContent.trim(),
      };
    });
  });
  expect(cardMeasurements).toHaveLength(3);
  expect(cardMeasurements.map(({ cssWidth, cssHeight }) => [cssWidth, cssHeight]))
    .toEqual([["202px", "202px"], ["202px", "202px"], ["202px", "202px"]]);
  expect(Math.max(...cardMeasurements.map(({ width }) => width)) -
    Math.min(...cardMeasurements.map(({ width }) => width))).toBeLessThan(0.1);
  expect(Math.max(...cardMeasurements.map(({ height }) => height)) -
    Math.min(...cardMeasurements.map(({ height }) => height))).toBeLessThan(0.1);
  expect(cardMeasurements.every(({ text, effect }) => text.length > 0 && effect.length > 0)).toBe(true);
  await saveScreenshot(page, testInfo, "upgrade-cards.png");
  await page.evaluate(() => { document.getElementById("overlay").style.display = "none"; });
  await expect.poll(() => page.evaluate(() => gameState)).toBe("playing");

  const evolutionChecks = await page.evaluate(() => {
    const previous = {
      time,
      bossesDefeated,
      selectedWeapons,
      unlockedWeapons,
      upgrades,
      evolutions,
    };
    try {
      time = 0;
      bossesDefeated = 1;
      selectedWeapons = ["flame", "fireball", "flameOrbit"];
      unlockedWeapons = [...selectedWeapons];
      upgrades = {
        ...upgrades,
        flame: 5,
        fireball: 5,
        flameOrbit: 5,
        damage: 3,
        critChance: 3,
        health: 3,
      };
      evolutions = {};
      const zeroClock = eligibleEvolutions().map(({ id }) => id);
      bossesDefeated = 0;
      const noGuardian = eligibleEvolutions().map(({ id }) => id);
      bossesDefeated = 1;
      upgrades.flame = 4;
      const weaponBelowFive = eligibleEvolutions().map(({ id }) => id);
      upgrades.flame = 5;
      upgrades.damage = 2;
      const supportBelowThree = eligibleEvolutions().map(({ id }) => id);
      upgrades.damage = 3;
      evolutions = { inferno: true, meteorRain: true };
      const afterTwo = eligibleEvolutions().map(({ id }) => id);
      return { zeroClock, noGuardian, weaponBelowFive, supportBelowThree, afterTwo };
    } finally {
      time = previous.time;
      bossesDefeated = previous.bossesDefeated;
      selectedWeapons = previous.selectedWeapons;
      unlockedWeapons = previous.unlockedWeapons;
      upgrades = previous.upgrades;
      evolutions = previous.evolutions;
    }
  });
  expect(evolutionChecks.zeroClock).toEqual(["inferno", "meteorRain", "solarCrown"]);
  expect(evolutionChecks.noGuardian).toEqual([]);
  expect(evolutionChecks.weaponBelowFive).not.toContain("inferno");
  expect(evolutionChecks.supportBelowThree).not.toContain("inferno");
  expect(evolutionChecks.afterTwo).toEqual(["solarCrown"]);

  const evolutionOffer = await page.evaluate(() => {
    window.__qaEvolutionState = {
      time,
      bossesDefeated,
      selectedWeapons,
      unlockedWeapons,
      upgrades,
      evolutions,
      paused,
      choiceScreenOpen,
      gameState,
    };
    time = 0;
    bossesDefeated = 1;
    selectedWeapons = ["flame", "fireball", "flameOrbit"];
    unlockedWeapons = [...selectedWeapons];
    upgrades = {
      ...upgrades,
      flame: 5,
      fireball: 5,
      flameOrbit: 5,
      damage: 3,
      critChance: 3,
      health: 3,
    };
    evolutions = {};
    const offered = window.offerEarnedEvolution();
    return {
      offered,
      cards: [...document.querySelectorAll("#choices > button.evolution-choice")]
        .map((card) => card.innerText.trim()),
    };
  });
  expect(evolutionOffer.offered).toBe(true);
  expect(evolutionOffer.cards).toHaveLength(3);
  expect(evolutionOffer.cards.map((text) => text.split("\n")[1]))
    .toEqual(["Inferno", "Meteor Rain", "Solar Crown"]);
  await saveScreenshot(page, testInfo, "evolution-eligibility.png");
  await page.evaluate(() => {
    const previous = window.__qaEvolutionState;
    time = previous.time;
    bossesDefeated = previous.bossesDefeated;
    selectedWeapons = previous.selectedWeapons;
    unlockedWeapons = previous.unlockedWeapons;
    upgrades = previous.upgrades;
    evolutions = previous.evolutions;
    paused = previous.paused;
    choiceScreenOpen = previous.choiceScreenOpen;
    gameState = previous.gameState;
    delete window.__qaEvolutionState;
    document.getElementById("overlay").style.display = "none";
  });

  await spawnAndDefeatNextBoss(page, 0);
  await openDeveloperPanel(page);
  await page.getByRole("button", { name: "SPAWN NORMAL BOSS" }).click();
  await expect.poll(() => page.evaluate(() => boss?.variant)).toBe(1);
  await page.evaluate(() => {
    const original = window.updateShadeEncounter;
    const instrumentedHooks = new WeakSet();
    window.__qaShadeHazards = [];
    window.updateShadeEncounter = function (...args) {
      const hooks = args[4];
      if (hooks?.hazard && !instrumentedHooks.has(hooks)) {
        const emit = hooks.hazard;
        hooks.hazard = (...zone) => {
          window.__qaShadeHazards.push(zone);
          return emit(...zone);
        };
        instrumentedHooks.add(hooks);
      }
      return original(...args);
    };
  });
  await page.waitForFunction(() => boss.phaseIntro <= 0);
  await page.getByRole("button", { name: "SHADE · PHANTOM EXECUTION" }).click();
  await closeDeveloperPanel(page);
  await page.waitForFunction(() => boss?.shadeFight?.mode === "phantoms" &&
    boss.shadeFight.stage === "tell", null, { timeout: 12_000 });
  await saveScreenshot(page, testInfo, "shade-phantom-telegraph.png");
  await page.waitForFunction(() => window.__qaShadeHazards.length >= 7, null, { timeout: 8_000 });
  const shadeZones = await page.evaluate(() => window.__qaShadeHazards.slice(0, 7));
  expect(shadeZones).toHaveLength(7);
  expect(shadeZones.filter(([, , radius]) => radius === 106)).toHaveLength(6);
  expect(shadeZones.filter(([, , radius]) => radius === 67)).toHaveLength(1);
  const shadeCenter = await page.evaluate(() => boss.shadeFight.target);
  const shadeAngles = shadeZones.filter(([, , radius]) => radius === 106)
    .map(([x, y]) => Math.atan2(y - shadeCenter.y, x - shadeCenter.x))
    .sort((a, b) => a - b);
  const largestShadeGap = Math.max(...shadeAngles.map((angle, index) => {
    const next = shadeAngles[(index + 1) % shadeAngles.length] + (index + 1 === shadeAngles.length ? Math.PI * 2 : 0);
    return next - angle;
  }));
  expect(largestShadeGap).toBeGreaterThan(Math.PI / 2 - 0.02);
  await openDeveloperPanel(page);
  await defeatActiveBoss(page, 1);
  await closeDeveloperPanel(page);

  const mikeRanks = [];
  const burstlingRanks = [];
  for (const [bossCount, burstlingRank] of [[2, 1], [3, 2]]) {
    const mikeRank = bossCount;
    if (bossCount === 3) await spawnAndDefeatNextBoss(page, 2);

    const mike = await page.evaluate(() => {
      const enemy = enemySpawn(2, false, true);
      enemy.developerTestEnemy = true;
      enemy.noXp = true;
      enemy.x = player.x + 120;
      enemy.y = player.y;
      enemy.hp = 1_000_000;
      window.initializeEnemyArchetype(enemy);
      enemy.stompCooldown = 0;
      enemy.stompWarning = 0;
      window.__qaMike = enemy;
      return { level: enemy.evolutionLevel, radius: enemy.stompRadius };
    });
    expect(mike.level).toBe(mikeRank);
    await page.waitForFunction(() => window.__qaMike.stompWarning > 0, null, { timeout: 5_000 });
    mikeRanks.push(await page.evaluate(() => ({
      level: window.__qaMike.evolutionLevel,
      radius: window.__qaMike.stompRadius,
      warning: window.__qaMike.stompWarning,
    })));
    await saveScreenshot(page, testInfo, `zombie-mike-lv${mikeRank}.png`);
    await page.evaluate(() => { window.__qaMike.dead = true; });

    const burstling = await page.evaluate(() => {
      const enemy = enemySpawn(5, false, true);
      enemy.developerTestEnemy = true;
      enemy.noXp = true;
      enemy.x = player.x + 55;
      enemy.y = player.y;
      enemy.hp = 1_000_000;
      enemy.armed = true;
      enemy.burstWarning = 5;
      enemy.burstRadius = 99 + (enemy.evolutionLevel - 1) * 13;
      player.inv = 2;
      window.__qaBurstling = enemy;
      return enemy.evolutionLevel;
    });
    expect(burstling).toBe(burstlingRank);
    await saveScreenshot(page, testInfo, `burstling-lv${burstlingRank}-warning.png`);
    burstlingRanks.push(await page.evaluate(() => {
      const enemy = window.__qaBurstling;
      enemy.burstWarning = 0.01;
      const emittedExplosions = [];
      const explosionList = explosions;
      const push = explosionList.push;
      explosionList.push = function (...entries) {
        emittedExplosions.push(...entries);
        return push.apply(this, entries);
      };
      update(0.016);
      return {
        level: enemy.evolutionLevel,
        shards: enemyShots.filter(({ type }) => type === "burstShard").length,
        detonated: enemy.dead,
        explosion: emittedExplosions.some(({ x, y, radius }) =>
          Math.hypot(x - enemy.x, y - enemy.y) < 1 && radius === enemy.burstRadius),
      };
    }));
    await page.evaluate(() => { window.__qaBurstling.dead = true; });
  }
  expect(mikeRanks.map(({ level, radius }) => [level, radius])).toEqual([[2, 149], [3, 180]]);
  expect(mikeRanks.every(({ warning }) => warning > 0)).toBe(true);
  expect(burstlingRanks.map(({ level }) => level)).toEqual([1, 2]);
  expect(burstlingRanks.every(({ detonated }) => detonated)).toBe(true);
  expect(burstlingRanks.every(({ explosion }) => explosion)).toBe(true);
  expect(burstlingRanks[0].shards).toBe(0);
  expect(burstlingRanks[1].shards).toBeGreaterThanOrEqual(1);

  await openDeveloperPanel(page);
  await page.getByRole("button", { name: "SPAWN FINAL BOSS" }).click();
  await expect.poll(() => page.evaluate(() => boss?.isFinalBoss)).toBe(true);
  await page.waitForFunction(() => boss.phaseIntro <= 0);
  await page.evaluate(() => {
    const original = window.updateMemeEncounter;
    const instrumentedHooks = new WeakSet();
    window.__qaMemeHazards = [];
    window.updateMemeEncounter = function (...args) {
      const hooks = args[4];
      if (hooks?.hazard && !instrumentedHooks.has(hooks)) {
        const emit = hooks.hazard;
        hooks.hazard = (...zone) => {
          window.__qaMemeHazards.push(zone);
          return emit(...zone);
        };
        instrumentedHooks.add(hooks);
      }
      return original(...args);
    };
  });
  await page.getByRole("button", { name: "MEME · BROKEN ORBIT" }).click();
  await closeDeveloperPanel(page);
  await page.waitForFunction(() => boss?.memeFight?.mode === "orbit" &&
    boss.memeFight.stage === "tell", null, { timeout: 12_000 });
  await saveScreenshot(page, testInfo, "last-meme-orbit-telegraph.png");
  await page.waitForFunction(() => window.__qaMemeHazards.length >= 12, null, { timeout: 8_000 });
  const memeZones = await page.evaluate(() => window.__qaMemeHazards.slice(0, 12));
  expect(memeZones).toHaveLength(12);
  expect(memeZones.filter(([, , radius]) => radius === 85)).toHaveLength(11);
  expect(memeZones.filter(([, , radius]) => radius === 83)).toHaveLength(1);
});
