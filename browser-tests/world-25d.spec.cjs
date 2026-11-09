const {
  closeDeveloperPanel,
  expect,
  openDeveloperPanel,
  saveScreenshot,
  startDeveloperRun,
  test,
} = require("./fixtures.cjs");

const elements = ["fire", "water", "frost"];

async function prepareWorldScreenshot(page) {
  await page.keyboard.press("p");
  await expect.poll(() => page.evaluate(() => paused)).toBe(true);
  await page.evaluate(() => {
    time = 7;
    shake = 0;
    enemies = [];
    rebuildEnemyGrid();
  });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.worldTheme))
    .toBeTruthy();
  await page.keyboard.press("p");
  await expect.poll(() => page.evaluate(() => paused)).toBe(false);
  await page.waitForTimeout(100);
}

async function canvasHash(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("#game");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index++) {
      hash ^= pixels[index];
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  });
}

test("2.5D world themes follow the selected element and remain camera-stable", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await startDeveloperRun(page, "/?qa=1&render=25d");
  const hashes = new Set();
  const reports = [];
  let baselinePlayer = null;

  for (const [index, element] of elements.entries()) {
    if (index > 0) {
      await openDeveloperPanel(page);
      await page.getByRole("button", { name: `${element.toUpperCase()} LOADOUT` }).click();
      await closeDeveloperPanel(page);
    } else {
      await closeDeveloperPanel(page);
    }
    await prepareWorldScreenshot(page);

    const scene = await page.evaluate(() => window.__shadowRenderQA);
    if (!baselinePlayer) baselinePlayer = {
      x: scene.playerWorldX,
      y: scene.playerWorldY,
    };
    expect(await page.evaluate(() => paused)).toBe(false);
    expect(scene.mode).toBe("2.5d");
    expect(scene.worldTheme).toBe(element);
    expect(scene.worldTiles).toBeGreaterThan(0);
    expect(scene.worldRuins).toBeGreaterThan(0);
    expect(scene.worldCameraX).toBe(scene.playerWorldX);
    expect(scene.worldCameraY).toBe(scene.playerWorldY);
    const hash = await canvasHash(page);
    hashes.add(hash);
    reports.push({ element, hash, tiles: scene.worldTiles, ruins: scene.worldRuins });
    await saveScreenshot(page, testInfo, `world-${element}.png`);

    if (index === 0) {
      const startX = scene.playerWorldX;
      await page.keyboard.down("d");
      await page.waitForTimeout(300);
      await page.keyboard.up("d");
      await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.playerWorldX))
        .toBeGreaterThan(startX + 20);
      const walking = await page.evaluate(() => window.__shadowRenderQA);
      expect(walking.worldTheme).toBe(element);
      expect(walking.worldCameraX).toBe(walking.playerWorldX);

      await page.keyboard.press("Shift");
      await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.dashActive)).toBe(true);
      const dashing = await page.evaluate(() => window.__shadowRenderQA);
      expect(dashing.worldTheme).toBe(element);
      expect(dashing.worldCameraX).toBe(dashing.playerWorldX);
      expect(dashing.worldCameraY).toBe(dashing.playerWorldY);
      await page.waitForFunction(() => !window.__shadowRenderQA.dashActive);
      await page.keyboard.press("p");
      await expect.poll(() => page.evaluate(() => paused)).toBe(true);
      await page.evaluate(({ x, y }) => {
        player.x = x;
        player.y = y;
        dashTimer = 0;
        rebuildEnemyGrid();
      }, baselinePlayer);
      await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.playerWorldX))
        .toBe(baselinePlayer.x);
      await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.playerWorldY))
        .toBe(baselinePlayer.y);
      await page.keyboard.press("p");
      await expect.poll(() => page.evaluate(() => paused)).toBe(false);
    }
  }

  expect(hashes.size, "Fire, Water, and Frost must render different ground imagery").toBe(3);
  await testInfo.attach("world-theme-pixel-hashes.json", {
    body: Buffer.from(JSON.stringify(reports, null, 2)),
    contentType: "application/json",
  });
});
