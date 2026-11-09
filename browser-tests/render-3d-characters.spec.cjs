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
  [-180, -130],
  [0, -130],
  [180, -130],
  [-180, 130],
  [0, 130],
  [180, 130],
];

async function spawnFamilyFormation(page, level) {
  await page.evaluate(({ families, formation, level }) => {
    paused = true;
    enemies = [];
    time = 12;
    for (let index = 0; index < families.length; index++) {
      const { kind } = families[index];
      bossesDefeated = window.enemyFamilyDebutBossCount(kind) + level - 1;
      const enemy = enemySpawn(kind, false, true);
      enemy.x = player.x + formation[index][0];
      enemy.y = player.y + formation[index][1];
      enemy.speed = 0;
      enemy.combatVX = 0;
      enemy.combatVY = 0;
      enemy.noXp = true;
      enemy.developerTestEnemy = true;
      enemy.maxHp = enemy.hp = 1_000_000;
    }
    rebuildEnemyGrid();
  }, { families, formation, level });
  await expect.poll(() => page.evaluate(() =>
    window.__shadowRenderQA?.characters?.filter((character) => character.characterType === "enemy").length,
  )).toBe(families.length);
}

async function saveCharacterScreenshot(page, testInfo, name) {
  const path = testInfo.outputPath(name);
  await page.locator(".three-game-canvas").screenshot({ path, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

test("3D renderer builds six distinct character families with existing LV1-LV4 ranks", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await startDeveloperRun(page, "/?qa=1&render=3d");
  await closeDeveloperPanel(page);
  await page.evaluate(() => {
    paused = true;
    enemies = [];
    time = 12;
  });

  const rankResults = new Map(families.map(({ kind }) => [kind, []]));
  for (let level = 1; level <= 4; level++) {
    await spawnFamilyFormation(page, level);
    const characters = await page.evaluate(() => window.__shadowRenderQA.characters
      .filter((character) => character.characterType === "enemy")
      .sort((left, right) => left.kind - right.kind));
    expect(characters.map(({ kind, family, level: rank }) => [kind, family, rank]))
      .toEqual(families.map(({ kind, name }) => [kind, name, level]));
    for (const character of characters) {
      expect(character.meshCount, `${character.family} should use a composed 3D model`).toBeGreaterThan(15);
      expect(character.silhouetteFeatures.length).toBeGreaterThanOrEqual(3);
      expect(character.rankPips).toBe(level);
      rankResults.get(character.kind).push({
        meshCount: character.meshCount,
        rankMutation: character.rankMutation,
        rankPips: character.rankPips,
      });
    }
    await saveCharacterScreenshot(page, testInfo, `three-character-families-lv${level}.png`);
  }

  expect(new Set(families.map(({ name }) => name)).size).toBe(6);
  for (const family of families) {
    const forms = rankResults.get(family.kind);
    expect(forms).toHaveLength(4);
    expect(new Set(forms.map(({ rankMutation, rankPips }) =>
      `${rankMutation.join("|")}:${rankPips}`)).size,
    `${family.name} should visually distinguish all four ranks`).toBe(4);
  }
  const signatures = await page.evaluate(() => window.__shadowRenderQA.characters
    .filter((character) => character.characterType === "enemy")
    .map(({ family, silhouetteFeatures }) => [family, silhouetteFeatures.join("|")]));
  expect(new Set(signatures.map(([, features]) => features)).size).toBe(6);

  await page.evaluate(() => {
    const byKind = new Map(enemies.map((enemy) => [enemy.kind, enemy]));
    byKind.get(1).feintTime = 0.4;
    byKind.get(1).feintDirection = 1;
    byKind.get(2).stompWarning = 0.8;
    byKind.get(2).stompRadius = 149;
    byKind.get(4).shotWarning = 0.6;
    byKind.get(5).armed = true;
    byKind.get(5).burstWarning = 0.6;
    byKind.get(6).shieldActive = true;
    for (const enemy of enemies) enemy.hit = 0.1;
    damageFlash = 1;
  });
  await expect.poll(() => page.evaluate(() => {
    const characters = window.__shadowRenderQA?.characters || [];
    return [
      characters.find((character) => character.kind === 1)?.attackState,
      characters.find((character) => character.kind === 2)?.attackState,
      characters.find((character) => character.kind === 4)?.attackState,
      characters.find((character) => character.kind === 5)?.attackState,
      characters.find((character) => character.kind === 6)?.attackState,
    ];
  })).toEqual(["feint", "stomp-warning", "shot-warning", "burst-warning", "shield-guard"]);
  const animated = await page.evaluate(() => ({
    characters: window.__shadowRenderQA.characters,
    playerDamageFlash: window.__shadowRenderQA.characters.find(
      (character) => character.characterType === "player",
    )?.hitFlash,
  }));
  const animationByKind = new Map(animated.characters
    .filter((character) => character.characterType === "enemy")
    .map((character) => [character.kind, character]));
  expect(animationByKind.get(1).attackState).toBe("feint");
  expect(animationByKind.get(2).attackState).toBe("stomp-warning");
  expect(animationByKind.get(4).attackState).toBe("shot-warning");
  expect(animationByKind.get(5).attackState).toBe("burst-warning");
  expect(animationByKind.get(6).attackState).toBe("shield-guard");
  expect(animationByKind.get(0).hitFlash).toBe(true);
  expect(animated.playerDamageFlash).toBe(true);

  const playerBeforeWalk = animated.characters.find(
    (character) => character.characterType === "player",
  );
  await page.evaluate(() => { paused = false; damageFlash = 0; });
  await page.keyboard.down("d");
  await expect.poll(() => page.evaluate(() =>
    window.__shadowRenderQA.characters.find((character) => character.characterType === "player")?.moving,
  )).toBe(true);
  await page.waitForTimeout(220);
  await page.keyboard.up("d");
  const playerAfterWalk = await page.evaluate(() => window.__shadowRenderQA.characters.find(
    (character) => character.characterType === "player",
  ));
  expect(playerAfterWalk.worldX).toBeGreaterThan(playerBeforeWalk.worldX + 5);
  expect(playerAfterWalk.gaitPhase).not.toBe(playerBeforeWalk.gaitPhase);

  await page.evaluate(() => {
    dashCooldown = 0;
    startDash();
    paused = true;
  });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.dashActive)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA.characters.find(
    (character) => character.characterType === "player",
  )?.attackState)).toBe("dash");

  await page.evaluate(() => {
    enemies = [];
    const kinds = [0, 1, 2, 4, 5, 6];
    for (let index = 0; index < 24; index++) {
      const kind = kinds[index % kinds.length];
      const level = Math.floor(index / kinds.length) + 1;
      bossesDefeated = window.enemyFamilyDebutBossCount(kind) + level - 1;
      const enemy = enemySpawn(kind, false, true);
      const column = index % 6;
      const row = Math.floor(index / 6);
      enemy.x = player.x + (column - 2.5) * 88;
      enemy.y = player.y + (row - 1.5) * 82;
      enemy.speed = 0;
      enemy.combatVX = 0;
      enemy.combatVY = 0;
      enemy.noXp = true;
      enemy.developerTestEnemy = true;
      enemy.maxHp = enemy.hp = 1_000_000;
    }
    rebuildEnemyGrid();
  });
  await expect.poll(() => page.evaluate(() =>
    window.__shadowRenderQA?.characters?.filter((character) => character.characterType === "enemy").length,
  )).toBe(24);
  await saveCharacterScreenshot(page, testInfo, "three-character-pressure-24.png");

  const performance = await page.evaluate(() => new Promise((resolve) => {
    const frames = [];
    const draws = [];
    let previous = performance.now();
    let remaining = 90;
    function sample(now) {
      frames.push(now - previous);
      previous = now;
      draws.push(window.__shadowRenderQA?.renderDurationMs || 0);
      remaining--;
      if (remaining > 0) requestAnimationFrame(sample);
      else {
        frames.sort((a, b) => a - b);
        draws.sort((a, b) => a - b);
        resolve({
          sampledFrames: frames.length,
          averageFps: 1000 / (frames.reduce((sum, value) => sum + value, 0) / frames.length),
          frameIntervalP95Ms: frames[Math.floor(frames.length * 0.95)],
          renderMeanMs: draws.reduce((sum, value) => sum + value, 0) / draws.length,
          renderP95Ms: draws[Math.floor(draws.length * 0.95)],
          enemyCount: window.__shadowRenderQA.enemyMeshCount,
          actorMeshCount: window.__shadowRenderQA.characters.reduce((sum, character) => sum + character.meshCount, 0),
        });
      }
    }
    requestAnimationFrame(sample);
  }));
  expect(performance.sampledFrames).toBe(90);
  expect(performance.enemyCount).toBe(24);
  expect(performance.renderP95Ms).toBeGreaterThan(0);
  await testInfo.attach("three-character-pressure-performance.json", {
    body: Buffer.from(JSON.stringify(performance, null, 2)),
    contentType: "application/json",
  });
  console.log(
    `Three.js character pressure (24 enemies, ${performance.actorMeshCount} actor meshes): `
    + `${performance.averageFps.toFixed(1)} FPS; renderer ${performance.renderMeanMs.toFixed(2)} ms mean, `
    + `${performance.renderP95Ms.toFixed(2)} ms p95`,
  );
});
