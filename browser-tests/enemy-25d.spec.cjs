const {
  closeDeveloperPanel,
  expect,
  saveScreenshot,
  startDeveloperRun,
  test,
} = require("./fixtures.cjs");

const families = [
  { kind: 0, name: "Drifter" },
  { kind: 1, name: "Runner" },
  { kind: 2, name: "Zombie Mike" },
  { kind: 4, name: "Ranged Shade" },
  { kind: 5, name: "Burstling" },
  { kind: 6, name: "Bulwark" },
];
const formation = [
  [-330, -175],
  [-110, -175],
  [110, -175],
  [330, -175],
  [-220, 175],
  [220, 175],
];

async function prepareEnemyFormation(page, level) {
  await page.evaluate(({ families, formation, level }) => {
    enemies = [];
    time = 12;
    shake = 0;
    for (let index = 0; index < families.length; index++) {
      const { kind } = families[index];
      bossesDefeated = window.enemyFamilyDebutBossCount(kind) + level - 1;
      const enemy = enemySpawn(kind, false, true);
      enemy.x = player.x + formation[index][0];
      enemy.y = player.y + formation[index][1];
      enemy.speed = 0;
      enemy.noXp = true;
      enemy.developerTestEnemy = true;
    }
    rebuildEnemyGrid();
  }, { families, formation, level });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.visibleFamilies.length))
    .toBeGreaterThanOrEqual(families.length);
}

async function captureEnemyPixels(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("#game");
    const dpr = canvas.width / W;
    const qa = window.__shadowRenderQA;
    const size = Math.round(220 * dpr);
    const images = qa.visibleFamilies.map((enemy) => {
      const x = Math.max(0, Math.min(canvas.width - size,
        Math.round(enemy.screenX * dpr - size / 2)));
      const y = Math.max(0, Math.min(canvas.height - size,
        Math.round(enemy.screenY * dpr - size / 2)));
      const pixels = canvas.getContext("2d").getImageData(x, y, size, size).data;
      let hash = 2166136261;
      for (let i = 0; i < pixels.length; i++) {
        hash ^= pixels[i];
        hash = Math.imul(hash, 16777619);
      }
      return { kind: enemy.kind, familyLevel: enemy.familyLevel, hash: hash >>> 0 };
    });
    return {
      mode: qa.mode,
      styledEnemyCount: qa.styledEnemyCount,
      visibleFamilies: qa.visibleFamilies.map(({ kind, familyLevel }) => [kind, familyLevel]),
      images,
    };
  });
}

async function benchmarkRenderCost(page) {
  return page.evaluate(async () => {
    const samples = [];
    for (let frame = 0; frame < 180; frame++) {
      await new Promise(requestAnimationFrame);
      if (performanceMetrics.render > 0) samples.push(performanceMetrics.render);
    }
    const ordered = samples.slice().sort((a, b) => a - b);
    return {
      frames: samples.length,
      averageMs: samples.reduce((sum, value) => sum + value, 0) / samples.length,
      p95Ms: ordered[Math.ceil(ordered.length * 0.95) - 1],
    };
  });
}

test("2.5D renders all six existing enemy families with authentic LV1–LV4 mutations", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await startDeveloperRun(page, "/?qa=1&render=25d");
  await closeDeveloperPanel(page);
  await page.evaluate(() => {
    paused = true;
    enemies = [];
    time = 12;
  });

  const hashes = new Map(families.map(({ kind }) => [kind, new Set()]));
  for (let level = 1; level <= 4; level++) {
    await prepareEnemyFormation(page, level);
    const result = await captureEnemyPixels(page);
    expect(result.mode).toBe("2.5d");
    expect(result.styledEnemyCount).toBe(families.length);
    expect(result.visibleFamilies)
      .toEqual(families.map(({ kind }) => [kind, level]));
    for (const image of result.images) hashes.get(image.kind).add(image.hash);
    await saveScreenshot(page, testInfo, `enemy-families-lv${level}.png`);
  }
  for (const family of families) {
    expect(hashes.get(family.kind), `${family.name} should visibly mutate at each family level`)
      .toHaveProperty("size", 4);
  }
  const cost = await benchmarkRenderCost(page);
  await testInfo.attach("2.5d-render-cost.json", {
    body: Buffer.from(JSON.stringify(cost, null, 2)),
    contentType: "application/json",
  });
  console.log(`2.5D renderer, six families: ${cost.averageMs.toFixed(2)} ms average draw, ${cost.p95Ms.toFixed(2)} ms p95 (${cost.frames} frames)`);
});

test("legacy renderer remains the fallback for all six enemy families", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await startDeveloperRun(page, "/?qa=1");
  await closeDeveloperPanel(page);
  await page.evaluate(() => {
    paused = true;
    enemies = [];
    time = 12;
  });
  await prepareEnemyFormation(page, 2);

  const result = await captureEnemyPixels(page);
  expect(result.mode).toBe("legacy");
  expect(result.styledEnemyCount).toBe(0);
  expect(result.visibleFamilies).toEqual(families.map(({ kind }) => [kind, 2]));
  expect(result.images).toHaveLength(families.length);
  await saveScreenshot(page, testInfo, "enemy-families-legacy.png");
  const cost = await benchmarkRenderCost(page);
  await testInfo.attach("legacy-render-cost.json", {
    body: Buffer.from(JSON.stringify(cost, null, 2)),
    contentType: "application/json",
  });
  console.log(`Legacy renderer, six families: ${cost.averageMs.toFixed(2)} ms average draw, ${cost.p95Ms.toFixed(2)} ms p95 (${cost.frames} frames)`);
});
