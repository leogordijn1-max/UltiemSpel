const {
  closeDeveloperPanel,
  expect,
  saveScreenshot,
  startDeveloperRun,
  test,
} = require("./fixtures.cjs");

async function expectPlayerCentered(page) {
  const { playerScreenX, playerScreenY, width, height } = await page.evaluate(() => ({
    playerScreenX: window.__shadowRenderQA.playerScreenX,
    playerScreenY: window.__shadowRenderQA.playerScreenY,
    width: W,
    height: H,
  }));
  expect(Math.abs(playerScreenX - width / 2)).toBeLessThan(2);
  expect(Math.abs(playerScreenY - height / 2)).toBeLessThan(2);
}

for (const mode of ["legacy", "2.5d"]) {
  test(`production ${mode} renderer follows the live player and Drifter`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const path = mode === "2.5d" ? "/?qa=1&render=25d" : "/?qa=1";
    await startDeveloperRun(page, path);

    await page.evaluate(() => {
      const enemy = enemySpawn(0, false, true);
      enemy.x = player.x + 320;
      enemy.y = player.y + 55;
      enemy.speed = 0;
      enemy.hp = 1_000_000;
      enemy.noXp = true;
      enemy.developerTestEnemy = true;
      rebuildEnemyGrid();
    });
    await closeDeveloperPanel(page);
    await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.visibleDrifterCount))
      .toBeGreaterThan(0);

    const initial = await page.evaluate(() => window.__shadowRenderQA);
    expect(initial.mode).toBe(mode);
    expect(initial.playerStyle).toBe(mode);
    expect(initial.styledDrifterCount).toBe(mode === "2.5d" ? initial.visibleDrifterCount : 0);
    expect(initial.drifters.length).toBeGreaterThan(0);
    for (const drifter of initial.drifters) {
      expect(drifter.screenX - initial.playerScreenX)
        .toBeCloseTo(drifter.worldX - initial.playerWorldX, 5);
      expect(drifter.screenY - initial.playerScreenY)
        .toBeCloseTo(drifter.worldY - initial.playerWorldY, 5);
    }
    await expectPlayerCentered(page);
    await saveScreenshot(page, testInfo, `${mode}-renderer-start.png`);

    await page.keyboard.down("d");
    await page.waitForTimeout(300);
    await page.keyboard.up("d");
    await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.playerWorldX))
      .toBeGreaterThan(initial.playerWorldX + 20);
    await expectPlayerCentered(page);
    await page.keyboard.press("Shift");
    await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.dashActive)).toBe(true);
    await expectPlayerCentered(page);
    await saveScreenshot(page, testInfo, `${mode}-renderer-dash.png`);
    await page.waitForFunction(() => !window.__shadowRenderQA.dashActive);
  });
}
