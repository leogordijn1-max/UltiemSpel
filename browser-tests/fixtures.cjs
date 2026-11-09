const { test: base, expect } = require("@playwright/test");

const test = base.extend({
  browserErrors: [
    async ({ page }, use, testInfo) => {
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          errors.push({ type: "console", text: message.text(), location: message.location() });
        }
      });
      page.on("pageerror", (error) => {
        errors.push({ type: "page", text: error.stack || error.message });
      });

      await use(errors);
      await testInfo.attach("browser-errors.json", {
        body: Buffer.from(JSON.stringify(errors, null, 2)),
        contentType: "application/json",
      });
      expect(errors, "Unexpected browser console/page errors").toEqual([]);
    },
    { auto: true },
  ],
});

async function saveScreenshot(page, testInfo, name) {
  const path = testInfo.outputPath(name);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function startDeveloperRun(page, path = "/") {
  await page.goto(path);
  await page.getByRole("button", { name: /SETTINGS/ }).click();
  await page.locator(".developer-settings input[type=checkbox]").check();
  await page.getByRole("button", { name: /BACK/ }).click();
  await page.getByRole("button", { name: "NEW RUN" }).click();
  await page.getByRole("button", { name: /STANDARD RUN/ }).click();
  await page.getByRole("button", { name: /CONTINUE · CHOOSE SURVIVOR/ }).click();
  await page.getByRole("button", { name: /CONTINUE · CHOOSE YOUR WEAPONS/ }).click();
  await page.getByRole("button", { name: /START STANDARD/ }).click();
  await expect.poll(() => page.evaluate(() => gameState)).toBe("playing");
  await page.keyboard.press("l");
  await page.getByRole("dialog", { name: "Developer Mode" }).waitFor();
  await page.getByRole("button", { name: "ENABLE GOD MODE" }).click();
  await expect.poll(() => page.evaluate(() => window.isDeveloperRun())).toBe(true);
}

async function openDeveloperPanel(page) {
  if (await page.getByRole("dialog", { name: "Developer Mode" }).count()) return;
  await page.keyboard.press("l");
  await page.getByRole("dialog", { name: "Developer Mode" }).waitFor();
}

async function closeDeveloperPanel(page) {
  await page.getByRole("button", { name: "CLOSE · L" }).click();
  await page.getByRole("dialog", { name: "Developer Mode" }).waitFor({ state: "detached" });
  await expect.poll(() => page.evaluate(() => gameState)).toBe("playing");
}

async function spawnAndDefeatNextBoss(page, expectedVariant) {
  await openDeveloperPanel(page);
  await page.getByRole("button", { name: "SPAWN NORMAL BOSS" }).click();
  await expect.poll(() => page.evaluate(() => boss?.variant)).toBe(expectedVariant);
  await defeatActiveBoss(page, expectedVariant);
  await closeDeveloperPanel(page);
}

async function defeatActiveBoss(page, expectedVariant) {
  await page.getByRole("button", { name: "DEFEAT ACTIVE BOSS" }).click();
  await expect.poll(() => page.evaluate(() => boss)).toBeNull();
  await expect.poll(() => page.evaluate(() => bossesDefeated)).toBe(expectedVariant + 1);
}

module.exports = {
  expect,
  openDeveloperPanel,
  closeDeveloperPanel,
  defeatActiveBoss,
  saveScreenshot,
  spawnAndDefeatNextBoss,
  startDeveloperRun,
  test,
};
