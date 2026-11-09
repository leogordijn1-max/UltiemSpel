const {
  closeDeveloperPanel,
  expect,
  saveScreenshot,
  startDeveloperRun,
  test,
} = require("./fixtures.cjs");

test("all Guardian models and their live phase/attack state render in production 3D", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const webglWarnings = [];
  page.on("console", (message) => {
    if (message.type() === "warning" && /webgl|shader|gl_/i.test(message.text())) {
      webglWarnings.push(message.text());
    }
  });
  await startDeveloperRun(page, "/?qa=1&render=3d");
  await closeDeveloperPanel(page);

  for (const variant of [0, 1, 2]) {
    await page.evaluate((bossIndex) => {
      enemies = [];
      boss = null;
      bossShots = [];
      bossNumber = bossIndex;
      paused = true;
      if (!spawnBoss()) throw new Error("Developer run could not spawn the Guardian");
      boss.x = player.x + 185;
      boss.y = player.y + 35;
      boss.speed = 0;
      boss.phaseIntro = 0;
      boss.shotWarning = 0;
      boss.chargeWarning = 0;
      rebuildEnemyGrid();
    }, variant);

    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.characters?.find((actor) => actor.characterType === "boss")
        ?.bossVariant
    ))).toBe(variant);
    let bossView = await page.evaluate(() => (
      window.__shadowRenderQA.characters.find((actor) => actor.characterType === "boss")
    ));
    expect(bossView.meshCount).toBeGreaterThan(10);
    expect(bossView.silhouetteFeatures.length).toBeGreaterThanOrEqual(3);
    expect(bossView.bossPhase).toBe(1);
    await saveScreenshot(page, testInfo, `three-boss-${variant}-phase-1.png`);

    await page.evaluate(() => {
      boss.phaseTwo = true;
      boss.shotWarning = 0;
      boss.chargeWarning = 120;
      boss.chargeActive = 0;
      boss.chargeCooldown = 120;
      boss.chargeX = 1;
      boss.chargeY = 0;
      bossHazards = [{
        x: boss.x + 115,
        y: boss.y,
        radius: 64,
        warning: 0.8,
        damage: 1,
      }];
    });
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.characters?.find((actor) => actor.characterType === "boss")
        ?.bossPhase
    ))).toBe(2);
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.characters?.find((actor) => actor.characterType === "boss")
        ?.bossPhasePips
    ))).toBe(2);
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.combatEffectTypes || []
    ))).toEqual(expect.arrayContaining(["charge", "boss-hazard"]));
    bossView = await page.evaluate(() => (
      window.__shadowRenderQA.characters.find((actor) => actor.characterType === "boss")
    ));
    expect(bossView.animationState).toBe("charge-warning");
    await saveScreenshot(page, testInfo, `three-boss-${variant}-warning.png`);
    await page.evaluate(() => {
      boss.phaseThree = true;
      boss.phaseIntro = 0.9;
      boss.chargeWarning = 0;
    });
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.characters?.find((actor) => actor.characterType === "boss")
        ?.bossPhasePips
    ))).toBe(3);
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.characters?.find((actor) => actor.characterType === "boss")
        ?.animationState
    ))).toBe("phase-transition");
  }

  await page.evaluate(() => {
    enemies = [];
    boss = null;
    bossShots = [];
    paused = true;
    if (!spawnFinalBoss()) throw new Error("Developer run could not spawn The Last Meme");
    boss.x = player.x + 185;
    boss.y = player.y + 35;
    boss.speed = 0;
    boss.phaseIntro = 0;
    boss.finalPhase = 3;
    boss.shotWarning = 0.8;
    boss.shotAngle = 0;
    boss.shotPattern = 2;
    boss.warningX = player.x + 105;
    boss.warningY = player.y + 30;
    bossShots = [{
      x: boss.x + 55,
      y: boss.y,
      r: 12,
      type: "rift",
      vx: 0,
      vy: 0,
    }];
    rebuildEnemyGrid();
  });
  await expect.poll(() => page.evaluate(() => (
    window.__shadowRenderQA?.characters?.find((actor) => actor.characterType === "boss")
      ?.bossVariant
  ))).toBe(3);
  const finalBoss = await page.evaluate(() => (
    window.__shadowRenderQA.characters.find((actor) => actor.characterType === "boss")
  ));
  expect(finalBoss.family).toBe("The Last Meme");
  expect(finalBoss.bossPhase).toBe(3);
  expect(finalBoss.bossPhasePips).toBe(3);
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.bossProjectileCount))
    .toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.projectileMeshCount))
    .toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.activeCombatEffectCount))
    .toBeGreaterThan(0);
  await saveScreenshot(page, testInfo, "three-boss-last-meme-phase-3-warning.png");
  const screenshotReadbackWarnings = webglWarnings.filter((warning) =>
    /GPU stall due to ReadPixels/i.test(warning));
  const unexpectedWebglWarnings = webglWarnings.filter((warning) =>
    !/GPU stall due to ReadPixels/i.test(warning));
  await testInfo.attach("webgl-warnings.json", {
    body: Buffer.from(JSON.stringify({
      warnings: webglWarnings,
      screenshotReadbackWarnings,
      unexpectedWarnings: unexpectedWebglWarnings,
    }, null, 2)),
    contentType: "application/json",
  });
  expect(unexpectedWebglWarnings).toEqual([]);
});
