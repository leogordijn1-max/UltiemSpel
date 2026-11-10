const {
  closeDeveloperPanel,
  expect,
  openDeveloperPanel,
  saveScreenshot,
  startDeveloperRun,
  test,
} = require("./fixtures.cjs");

test("QA 3D diagnostics report pooled objects and survive repeated runs without reload", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await startDeveloperRun(page, "/?qa=1&render=3d");
  await closeDeveloperPanel(page);
  await page.evaluate(() => {
    reset();
    paused = true;
  });

  const scenarios = [
    { element: "fire", shot: "fireball" },
    { element: "water", shot: "waterBolt" },
    { element: "frost", shot: "iceShards" },
  ];

  for (const scenario of scenarios) {
    await openDeveloperPanel(page);
    await page.getByRole("button", { name: `${scenario.element.toUpperCase()} LOADOUT` }).click();
    await closeDeveloperPanel(page);

    await page.evaluate((shotType) => {
      paused = true;
      elementalShots = [{
        type: shotType,
        x: player.x + 45,
        y: player.y + 24,
        r: 10,
        vx: 0,
        vy: 0,
        life: 3,
      }];
      gems = [{
        kind: "xp",
        x: player.x + 12,
        y: player.y + 10,
        value: 1,
      }];
      bossHazards = [{
        x: player.x + 90,
        y: player.y,
        radius: 64,
        warning: 0.8,
        damage: 0,
      }];
      lightningSegments = [{
        x1: player.x - 60,
        y1: player.y,
        x2: player.x + 60,
        y2: player.y,
        life: 0.12,
        evolved: false,
      }];
    }, scenario.shot);

    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.projectileMeshCount
    ))).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.activeCombatEffectCount
    ))).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.gemMeshCount
    ))).toBeGreaterThan(0);
    const active = await page.evaluate(() => window.__shadowRenderQA);
    expect(active.worldTheme).toBe(scenario.element);
    expect(
      active.objectDiagnostics.suspects,
      JSON.stringify(active.objectDiagnostics.suspects, null, 2),
    ).toEqual([]);
    const projectile = active.objectDiagnostics.objects.find(
      (object) => object.type === "projectile" && object.active,
    );
    expect(projectile.name).toBe(scenario.shot);
    expect(projectile.visualProfile).toBe(
      scenario.element === "fire"
        ? "core-ring-flame-trail"
        : scenario.element === "water"
          ? "lance-ripple-trail"
          : "ice-tip-trail",
    );
    expect(projectile.parent).toBe("Scene");
    expect(projectile.worldPosition.every(Number.isFinite)).toBe(true);
    expect(projectile.worldScale.every(Number.isFinite)).toBe(true);
    expect(projectile.worldRotation.every(Number.isFinite)).toBe(true);
    expect(projectile.boundingBox.size.every(Number.isFinite)).toBe(true);
    expect(projectile.visible).toBe(true);
    expect(projectile.lifetimeSeconds).toBeGreaterThanOrEqual(0);
    const combatEffects = active.objectDiagnostics.objects.filter(
      (object) => object.type === "combat-effect" && object.active,
    );
    expect(combatEffects.length).toBeGreaterThan(0);
    expect(combatEffects.every(
      (effect) => effect.materialOpacity.every((opacity) => opacity >= 0 && opacity <= 1),
    )).toBe(true);
    const lineEffect = combatEffects.find((effect) => effect.effectShape === "line");
    expect(lineEffect.geometryParameters.height).toBe(0.08);
    const gem = active.objectDiagnostics.objects.find(
      (object) => object.type === "gem" && object.active,
    );
    expect(gem.activationTransform.rotation).toEqual([0, 0, 0]);
    if (scenario.element !== "fire") expect(gem.reuseCount).toBeGreaterThan(0);
    await page.waitForTimeout(1000);
    await saveScreenshot(page, testInfo, `three-diagnostics-${scenario.element}.png`);

    await openDeveloperPanel(page);
    await page.getByRole("button", { name: "PROJECTILES: ON" }).click();
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.renderQaIsolation.projectiles
    ))).toBe(false);
    expect(await page.evaluate(() => elementalShots.length)).toBe(1);
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.projectileMeshCount
    ))).toBe(0);
    const pooledProjectile = await page.evaluate(() => window.__shadowRenderQA
      .objectDiagnostics.objects.find(
        (object) => object.type === "projectile" && !object.active,
      ));
    expect(pooledProjectile.lastPoolTransform.rotation[2]).toBeGreaterThan(0.1);

    await page.getByRole("button", { name: "COMBAT EFFECTS: ON" }).click();
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.activeCombatEffectCount
    ))).toBe(0);
    expect(await page.evaluate(() => bossHazards.length)).toBe(1);

    await page.getByRole("button", { name: "WORLD DECORATION: ON" }).click();
    await expect.poll(() => page.evaluate(() => (
      window.__shadowRenderQA?.renderQaIsolation.decoration
    ))).toBe(false);
    await expect.poll(() => page.evaluate(() => window.__shadowRenderQA
      ?.objectDiagnostics.objects.some(
        (object) => object.type === "world-decoration" && !object.visible,
      ))).toBe(true);
    await page.getByRole("button", { name: "PROJECTILES: OFF" }).click();
      await expect.poll(() => page.evaluate(() => (
        window.__shadowRenderQA?.projectileMeshCount
      ))).toBeGreaterThan(0);
      const reusedProjectile = await page.evaluate(() => window.__shadowRenderQA
        .objectDiagnostics.objects.find(
          (object) => object.type === "projectile" && object.active,
        ));
      expect(reusedProjectile.reuseCount).toBeGreaterThan(0);
      expect(reusedProjectile.activationTransform.rotation).toEqual([0, 0, 0]);
      await page.getByRole("button", { name: "COMBAT EFFECTS: OFF" }).click();
    await page.getByRole("button", { name: "WORLD DECORATION: OFF" }).click();
    await closeDeveloperPanel(page);

    const previousFrame = await page.evaluate(() => window.__shadowRenderQA.frameCount);
    await page.evaluate(() => {
      reset();
      paused = true;
    });
    await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.frameCount))
      .toBeGreaterThan(previousFrame);
    await expect.poll(() => page.evaluate(() => gameState)).toBe("playing");
    const afterReset = await page.evaluate(() => window.__shadowRenderQA);
    expect(
      afterReset.projectileMeshCount,
      JSON.stringify(await page.evaluate(() => ({
        arrays: {
          bullets: bullets.length,
          elementalShots: elementalShots.length,
          enemyShots: enemyShots.length,
          bossShots: bossShots.length,
          bombs: bombs.length,
        },
        active: window.__shadowRenderQA.objectDiagnostics.objects.filter(
          (object) => object.type === "projectile" && object.active,
        ),
      })), null, 2),
    ).toBe(0);
    expect(afterReset.activeCombatEffectCount).toBe(0);
    expect(afterReset.gemMeshCount).toBe(0);
    expect(afterReset.renderQaIsolation).toEqual({
      projectiles: true,
      combatEffects: true,
      decoration: true,
    });
    expect(afterReset.objectDiagnostics.suspectCount).toBe(0);
    expect(afterReset.graphicsQuality).toBe("high");
    expect(afterReset.objectDiagnostics.objects.filter(
      (object) => object.type === "actor" && object.active,
    )).toHaveLength(afterReset.characters.length);
    expect(afterReset.objectDiagnostics.objects.filter(
      (object) => object.name === "player" && object.active,
    )).toHaveLength(1);
  }

  const pooledObjects = await page.evaluate(() => window.__shadowRenderQA.objectDiagnostics.objects);
  expect(pooledObjects.find(
    (object) => object.type === "projectile" && !object.active,
  )?.reuseCount).toBeGreaterThan(0);
  await page.evaluate(() => {
    graphicsQuality = "low";
  });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.graphicsQuality))
    .toBe("low");
  await page.evaluate(() => {
    graphicsQuality = "high";
  });
  await expect.poll(() => page.evaluate(() => window.__shadowRenderQA?.graphicsQuality))
    .toBe("high");
  expect(pooledObjects.find(
    (object) => object.type === "combat-effect" && !object.active,
  )?.reuseCount).toBeGreaterThan(0);
  expect(pooledObjects.find(
    (object) => object.type === "gem" && !object.active,
  )?.reuseCount).toBeGreaterThan(0);
  await testInfo.attach("three-render-object-diagnostics.json", {
    body: Buffer.from(JSON.stringify(await page.evaluate(() => {
      const diagnostics = window.__shadowRenderQA.objectDiagnostics;
      return {
        ...diagnostics,
        pooledProjectiles: diagnostics.objects.filter(
          (object) => object.type === "projectile" && !object.active,
        ),
        pooledCombatEffects: diagnostics.objects.filter(
          (object) => object.type === "combat-effect" && !object.active,
        ),
      };
    }), null, 2)),
    contentType: "application/json",
  });
});
