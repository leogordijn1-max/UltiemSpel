const { expect, saveScreenshot, test } = require("./fixtures.cjs");

async function readScene(page) {
  return page.locator("#prototype").evaluate((root) => {
    const canvas = document.querySelector("#arena");
    const transform = canvas.getContext("2d").getTransform();
    return {
      arenaWidth: Number(root.dataset.arenaWidth),
      arenaHeight: Number(root.dataset.arenaHeight),
      cameraX: Number(root.dataset.cameraX),
      cameraY: Number(root.dataset.cameraY),
      enemyX: Number(root.dataset.enemyX),
      enemyY: Number(root.dataset.enemyY),
      enemyScreenX: Number(root.dataset.enemyScreenX),
      enemyScreenY: Number(root.dataset.enemyScreenY),
      playerX: Number(root.dataset.playerX),
      playerY: Number(root.dataset.playerY),
      playerScreenX: Number(root.dataset.playerScreenX),
      playerScreenY: Number(root.dataset.playerScreenY),
      projectileX: root.dataset.projectileX ? Number(root.dataset.projectileX) : Number.NaN,
      projectileY: root.dataset.projectileY ? Number(root.dataset.projectileY) : Number.NaN,
      projectileScreenX: Number(root.dataset.projectileScreenX),
      projectileScreenY: Number(root.dataset.projectileScreenY),
      shadowScreenX: Number(root.dataset.shadowScreenX),
      shadowScreenY: Number(root.dataset.shadowScreenY),
      viewWidth: Number(root.dataset.viewWidth),
      viewHeight: Number(root.dataset.viewHeight),
      fps: Number(document.querySelector("#fps").textContent),
      canvasLayer: getComputedStyle(canvas).zIndex,
      hudLayer: getComputedStyle(document.querySelector(".combat-hud")).zIndex,
      bossLayer: getComputedStyle(document.querySelector(".boss-marker")).zIndex,
      transform: { a: transform.a, d: transform.d, e: transform.e, f: transform.f },
      dpr: window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio,
    };
  });
}

function expectSharedWorldTransform(scene) {
  expect(scene.transform.a).toBe(scene.dpr);
  expect(scene.transform.d).toBe(scene.dpr);
  expect(scene.transform.e).toBeCloseTo((scene.viewWidth / 2 - scene.cameraX) * scene.dpr, 0);
  expect(scene.transform.f).toBeCloseTo((scene.viewHeight / 2 - scene.cameraY) * scene.dpr, 0);
  expect(scene.playerScreenX).toBeCloseTo(scene.playerX - scene.cameraX + scene.viewWidth / 2, 1);
  expect(scene.playerScreenY).toBeCloseTo(scene.playerY - scene.cameraY + scene.viewHeight / 2, 1);
  expect(scene.shadowScreenX).toBeCloseTo(scene.playerScreenX, 1);
  expect(scene.shadowScreenY).toBeCloseTo(scene.playerScreenY + 13, 1);
  expect(scene.enemyScreenX).toBeCloseTo(scene.enemyX - scene.cameraX + scene.viewWidth / 2, 1);
  expect(scene.enemyScreenY).toBeCloseTo(scene.enemyY - scene.cameraY + scene.viewHeight / 2, 1);
  if (Number.isFinite(scene.projectileX)) {
    expect(scene.projectileScreenX).toBeCloseTo(scene.projectileX - scene.cameraX + scene.viewWidth / 2, 1);
    expect(scene.projectileScreenY).toBeCloseTo(scene.projectileY - scene.cameraY + scene.viewHeight / 2, 1);
  }
}

function sampleCameraFrames(page, durationMs) {
  return page.evaluate((duration) => new Promise((resolve) => {
    const root = document.querySelector("#prototype");
    const samples = [];
    let startedAt;
    let previous;
    function sample(timestamp) {
      if (startedAt === undefined) startedAt = timestamp;
      const current = {
        x: Number(root.dataset.cameraX),
        y: Number(root.dataset.cameraY),
      };
      if (previous) samples.push(Math.hypot(current.x - previous.x, current.y - previous.y));
      previous = current;
      if (timestamp - startedAt < duration) requestAnimationFrame(sample);
      else resolve(samples);
    }
    requestAnimationFrame(sample);
  }), durationMs);
}

test("2.5D visual slice: smooth camera, movement, dash, auto-lance and element styling", async ({ page }, testInfo) => {
  await page.goto("/prototypes/visual-25d/");
  await expect(page.getByRole("link", { name: /SHADOW SURVIVOR VISUAL PROTOTYPE/i })).toBeVisible();
  await expect(page.locator("#arena")).toBeVisible();
  await expect.poll(async () => (await readScene(page)).playerScreenX).toBeCloseTo(720, 0);
  await saveScreenshot(page, testInfo, "visual-25d-arena.png");

  const arena = page.locator("#arena");
  const initialScene = await readScene(page);
  expectSharedWorldTransform(initialScene);
  expect(initialScene.canvasLayer).toBe("0");
  expect(initialScene.hudLayer).toBe("3");
  expect(initialScene.bossLayer).toBe("3");
  await expect.poll(() => page.locator("#prototype").getAttribute("data-shots-fired").then(Number))
    .toBeGreaterThan(0);
  await expect.poll(() => page.locator("#prototype").getAttribute("data-enemy-hits").then(Number))
    .toBeGreaterThan(0);

  const walkSamplesPromise = sampleCameraFrames(page, 450);
  await page.keyboard.down("d");
  const walkSamples = await walkSamplesPromise;
  await page.keyboard.up("d");
  const walked = await readScene(page);
  expect(walkSamples.length).toBeGreaterThan(3);
  expect(Math.max(...walkSamples)).toBeLessThan(10);
  expect(walked.playerX).toBeGreaterThan(initialScene.playerX + 55);
  expect(Math.abs(walked.playerScreenX - walked.viewWidth / 2)).toBeLessThan(42);
  expectSharedWorldTransform(walked);
  await saveScreenshot(page, testInfo, "visual-25d-after-movement.png");

  await expect.poll(async () => Math.abs((await readScene(page)).playerScreenX - 720))
    .toBeLessThan(30);
  await page.keyboard.down("w");
  const dashSamplesPromise = sampleCameraFrames(page, 180);
  await page.keyboard.down("Shift");
  const dashSamples = await dashSamplesPromise;
  await page.keyboard.up("Shift");
  await page.keyboard.up("w");
  const dashed = await readScene(page);
  expect(dashSamples.length).toBeGreaterThan(3);
  expect(Math.max(...dashSamples)).toBeLessThan(24);
  expect(dashed.playerY).toBeLessThan(walked.playerY - 35);
  expect(Number(await page.locator("#prototype").getAttribute("data-dash-count"))).toBe(1);
  await expect.poll(async () => Math.abs((await readScene(page)).playerScreenY - 450))
    .toBeLessThan(42);
  expectSharedWorldTransform(await readScene(page));

  await page.getByRole("button", { name: /WATER/ }).click();
  await expect(page.getByRole("button", { name: /WATER/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#toast")).toContainText("WATER ATTUNEMENT");
  await saveScreenshot(page, testInfo, "visual-25d-water-dash.png");

  await expect.poll(() => page.locator("#prototype").getAttribute("data-kills").then(Number),
    { timeout: 12_000 }).toBeGreaterThan(0);
  expect(await arena.evaluate((element) => element.width)).toBeGreaterThan(0);
});

test("2.5D camera clamps smoothly at the arena corner", async ({ page }) => {
  await page.goto("/prototypes/visual-25d/?qa=1");
  await expect(page.getByRole("link", { name: /SHADOW SURVIVOR VISUAL PROTOTYPE/i })).toBeVisible();
  await page.evaluate(() => {
    window.visual25dQA.placePlayer(
      Number(document.querySelector("#prototype").dataset.arenaWidth) - 76,
      Number(document.querySelector("#prototype").dataset.arenaHeight) - 88,
    );
  });
  await expect.poll(async () => (await readScene(page)).playerScreenX).toBeGreaterThan(0);
  const atCorner = await readScene(page);
  expect(atCorner.playerX).toBe(atCorner.arenaWidth - 76);
  expect(atCorner.playerY).toBe(atCorner.arenaHeight - 88);
  expect(atCorner.cameraX).toBeCloseTo(atCorner.arenaWidth - atCorner.viewWidth / 2, 0);
  expect(atCorner.cameraY).toBeCloseTo(atCorner.arenaHeight - atCorner.viewHeight / 2, 0);
  expectSharedWorldTransform(atCorner);

  await page.keyboard.down("d");
  await page.keyboard.down("s");
  await page.waitForTimeout(240);
  await page.keyboard.up("d");
  await page.keyboard.up("s");
  const heldAtCorner = await readScene(page);
  expect(heldAtCorner.playerX).toBe(atCorner.playerX);
  expect(heldAtCorner.playerY).toBe(atCorner.playerY);
  expect(heldAtCorner.cameraX).toBeCloseTo(atCorner.cameraX, 0);
  expect(heldAtCorner.cameraY).toBeCloseTo(atCorner.cameraY, 0);
  expectSharedWorldTransform(heldAtCorner);
});
