const {
  closeDeveloperPanel,
  expect,
  openDeveloperPanel,
  saveScreenshot,
  startDeveloperRun,
  test,
} = require("./fixtures.cjs");

async function saveWorldScreenshot(page, testInfo, name) {
  const path = testInfo.outputPath(name);
  await page.locator(".three-game-canvas").screenshot({ path, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test("optional production 3D renderer uses real game entities and an angled orthographic camera", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    localStorage.setItem("shadowRunElement", "water");
  });
  await startDeveloperRun(page, "/?qa=1&render=3d");
  await page.getByRole("button", { name: "WATER LOADOUT" }).click();
  await page.getByRole("button", { name: "MAX ALL 3 WEAPONS" }).click();

  await page.evaluate(() => {
    waveTimer = 130;
    spawn = 9999;
    enemies = [];
    gems = [];
    xp = 0;
    needed = 1_000_000;
    const enemy = enemySpawn(0, false, true);
    enemy.x = player.x + 220;
    enemy.y = player.y + 20;
    enemy.speed = 0;
    enemy.maxHp = enemy.hp = 1_000_000;
    enemy.noXp = true;
    enemy.developerTestEnemy = true;
    rebuildEnemyGrid();
  });
  await closeDeveloperPanel(page);

  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.renderer))
    .toBe("WebGLRenderer");
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.drifterMeshCount))
    .toBeGreaterThan(0);
  const initial = await page.evaluate(() => window.__shadowRenderQA);
  expect(initial.mode).toBe("3d");
  expect(initial.projection).toBe("orthographic");
  expect(initial.cameraAngleDegrees).toBeGreaterThan(35);
  expect(initial.cameraAngleDegrees).toBeLessThan(55);
  expect(initial.playerMeshCount).toBe(1);
  expect(initial.meshCount).toBeGreaterThan(30);
  expect(initial.terrainTileCount).toBeGreaterThan(20);
  expect(initial.terrainChunkCount).toBeGreaterThan(20);
  expect(initial.terrainChunkCount).toBeLessThan(120);
  expect(initial.terrainChunkCacheSize).toBeGreaterThanOrEqual(initial.terrainChunkCount);
  expect(initial.terrainHeightRange[1] - initial.terrainHeightRange[0]).toBeGreaterThan(1);
  expect(initial.ruinMeshCount).toBeGreaterThan(0);
  expect(initial.worldTheme).toBe("water");
  const worldObjects = initial.objectDiagnostics.objects.filter(
    (object) => object.type === "world-decoration" && object.active,
  );
  expect(worldObjects.length).toBeGreaterThan(20);
  expect(worldObjects.every((object) =>
    object.worldPosition.every(Number.isFinite) &&
    object.worldScale.every(Number.isFinite) &&
    object.worldRotation.every(Number.isFinite) &&
    object.boundingBox.size.every(Number.isFinite) &&
    object.worldScale.every((value) => Math.abs(value) <= 2),
  )).toBe(true);
  expect(Math.abs(initial.playerScreenX - 720)).toBeLessThan(2);
  expect(Math.abs(initial.playerScreenY - 450)).toBeLessThan(2);
  expect(await page.locator("#game").evaluate((canvas) => getComputedStyle(canvas).visibility))
    .toBe("hidden");
  await expect(page.locator(".three-game-canvas")).toBeVisible();
  await expect(page.locator("#healthText")).toBeVisible();
  await saveScreenshot(page, testInfo, "three-production-start.png");

  const themeColors = new Map([["water", initial.terrainSurfaceColor]]);
  for (const element of ["fire", "frost", "water"]) {
    await openDeveloperPanel(page);
    await page.getByRole("button", { name: `${element.toUpperCase()} LOADOUT` }).click();
    await closeDeveloperPanel(page);
    await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.worldTheme))
      .toBe(element);
    const theme = await page.evaluate(() => window.__shadowRenderQA);
    expect(theme.terrainChunkCount).toBeGreaterThan(20);
    if (element !== "water") {
      expect(theme.terrainSurfaceColor).not.toBe(initial.terrainSurfaceColor);
    }
    themeColors.set(element, theme.terrainSurfaceColor);
    await saveWorldScreenshot(page, testInfo, `three-world-${element}.png`);
  }
  expect(themeColors.size).toBe(3);

  await openDeveloperPanel(page);
  await page.getByRole("button", { name: "MAX ALL 3 WEAPONS" }).click();
  await closeDeveloperPanel(page);
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.worldTheme))
    .toBe("water");

  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  await page.keyboard.up("d");
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.playerWorldX))
    .toBeGreaterThan(initial.playerWorldX + 20);
  const walking = await page.evaluate(() => window.__shadowRenderQA);
  expect(Math.abs(walking.playerScreenX - 720)).toBeLessThan(2);
  expect(walking.cameraX).toBe(walking.playerWorldX);

  await page.evaluate(() => {
    dashCooldown = 0;
    startDash();
    paused = true;
  });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.dashActive)).toBe(true);
  const dashing = await page.evaluate(() => window.__shadowRenderQA);
  expect(dashing.cameraX).toBe(dashing.playerWorldX);
  expect(Math.abs(dashing.playerScreenY - 450)).toBeLessThan(2);
  await saveScreenshot(page, testInfo, "three-production-dash.png");
  await page.evaluate(() => { paused = false; });
  await page.waitForFunction(() => !window.__shadowRenderQA.dashActive);

  await page.waitForFunction(() => {
    if (!elementalShots.some((shot) => shot.type === "waterBolt")) return false;
    paused = true;
    return true;
  });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.projectileMeshCount))
    .toBeGreaterThan(0);
  const combat = await page.evaluate(() => ({
    projectileMeshCount: window.__shadowRenderQA.projectileMeshCount,
    projectileCount: elementalShots.filter((shot) => shot.type === "waterBolt").length,
    drawMs: window.__shadowRenderQA.renderDurationMs,
  }));
  expect(combat.projectileCount).toBeGreaterThan(0);
  expect(combat.projectileMeshCount).toBeGreaterThan(0);
  await saveScreenshot(page, testInfo, "three-production-combat.png");

  const beforeLongWalk = await page.evaluate(() => window.__shadowRenderQA);
  await page.evaluate(() => { paused = false; });
  await page.keyboard.down("d");
  await expect.poll(
    () => page.evaluate(() => window.__shadowRenderQA.playerWorldX),
    { timeout: 15_000 },
  ).toBeGreaterThan(beforeLongWalk.playerWorldX + beforeLongWalk.terrainChunkSize * 1.15);
  await page.keyboard.up("d");
  const afterLongWalk = await page.evaluate(() => window.__shadowRenderQA);
  expect(afterLongWalk.cameraX).toBe(afterLongWalk.playerWorldX);
  expect(Math.abs(afterLongWalk.playerScreenX - 720)).toBeLessThan(2);
  expect(afterLongWalk.terrainChunkCacheSize).toBeLessThanOrEqual(240);
  expect(afterLongWalk.terrainChunkBuildCount)
    .toBeGreaterThan(beforeLongWalk.terrainChunkBuildCount);

  const buildsAtFarPoint = afterLongWalk.terrainChunkBuildCount;
  await page.keyboard.down("a");
  await expect.poll(
    () => page.evaluate(() => window.__shadowRenderQA.playerWorldX),
    { timeout: 15_000 },
  ).toBeLessThan(beforeLongWalk.playerWorldX + 80);
  await page.keyboard.up("a");
  const returned = await page.evaluate(() => window.__shadowRenderQA);
  expect(returned.cameraX).toBe(returned.playerWorldX);
  expect(returned.terrainChunkBuildCount).toBe(buildsAtFarPoint);
  expect(returned.terrainChunkCacheSize).toBeLessThanOrEqual(240);

  const performance = await page.evaluate(() => new Promise((resolve) => {
    const samples = [];
    let remaining = 60;
    function sample() {
      samples.push(window.__shadowRenderQA?.renderDurationMs || 0);
      remaining--;
      if (remaining > 0) requestAnimationFrame(sample);
      else {
        samples.sort((a, b) => a - b);
        resolve({
          meanMs: samples.reduce((sum, value) => sum + value, 0) / samples.length,
          p95Ms: samples[Math.floor(samples.length * 0.95)],
        });
      }
    }
    requestAnimationFrame(sample);
  }));
  console.log(
    `Three.js 3D scene: ${initial.meshCount} meshes; render ${performance.meanMs.toFixed(2)} ms mean, ${performance.p95Ms.toFixed(2)} ms p95`,
  );
  await testInfo.attach("three-renderer-performance.json", {
    body: Buffer.from(JSON.stringify({ initial, combat, performance }, null, 2)),
    contentType: "application/json",
  });

  await page.goto("/?qa=1");
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator(".three-game-canvas")).toHaveCount(0);
});
