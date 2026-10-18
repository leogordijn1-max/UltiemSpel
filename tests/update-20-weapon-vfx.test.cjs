const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function harness() {
  const window = {};
  vm.runInNewContext(read("js/weapon-vfx.js"), { window, Math, Number, Set });
  let draws = 0, depth = 0, maxDepth = 0;
  const ctx = {
    save() { depth++; maxDepth = Math.max(depth, maxDepth); },
    restore() { depth--; },
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, arc() {}, stroke() { draws++; }, fill() { draws++; },
    translate() {}, rotate() {}
  };
  const stats = () => ({ draws, depth, maxDepth });
  return { window, ctx, stats };
}
function snapshot(quality = "high") {
  return {
    quality, time: 12, player: { x: 0, y: 0 },
    view: { left: -640, top: -360, width: 1280, height: 720 },
    shots: [
      { type: "fireball", x: 20, y: 30, r: 11, vx: 350, vy: 0, life: 1 },
      { type: "waterBolt", x: 50, y: 40, r: 7, vx: 640, vy: 0, life: 1 },
      { type: "iceShards", x: -30, y: 0, r: 6, vx: 380, vy: 80, life: 1 }
    ],
    areas: [
      { type: "fire", x: 0, y: 0, radius: 75, life: 0.4, maxLife: 0.7 },
      { type: "water", x: 10, y: 0, radius: 60, life: .2, maxLife: .4 },
      { type: "frost", x: 0, y: 10, radius: 140, life: .45, maxLife: .8 },
      { type: "tidalWave", x: 0, y: 0, radius: 145, life: .5, maxLife: .9, angle: 0, spread: 1.4 },
      { type: "whirlpool", x: 30, y: 10, radius: 95, life: 2.1, maxLife: 3, evolved: true }
    ],
    flames: [{ x: 0, y: 0, radius: 120, angle: 0, spread: 1.2, life: .31 }],
    orbits: [{ x: 80, y: -10, r: 12 }],
    frostOrbs: [{ type: "frost", x: 40, y: 20, r: 13, vx: 180, vy: 25 }],
    frostZones: [{ x: 30, y: 50, radius: 100, life: 1.0 }]
  };
}
const nine = ["flame","fireball","flameOrbit","waterBolt","tidalWave",
  "whirlpool","frost","iceShards","glacialPulse"];

test("VFX coverage is exactly the nine currently selectable elemental weapons", () => {
  const h = harness();
  assert.deepEqual(Array.from(h.window.weaponVfxStyles), nine);
  assert.ok(!h.window.weaponVfxStyles.includes("boomerang"));
  assert.ok(!h.window.weaponVfxStyles.includes("arcane"));
  const result = h.window.drawWeaponVfx(h.ctx, snapshot());
  assert.deepEqual(Array.from(result.types).sort(), [...nine].sort());
  assert.ok(result.total >= 11);
  assert.equal(h.stats().depth, 0);
});

test("all three elements have visually distinct shot, area and orbit drawing paths", () => {
  const h = harness();
  const result = h.window.drawWeaponVfx(h.ctx, snapshot());
  assert.ok(result.total > 0);
  assert.ok(h.stats().draws > result.total * 2,
    "visual signatures should be richer than one circle per object");
  assert.equal(h.stats().depth, 0, "canvas save and restore must balance");
});

test("rendering is cosmetic: combat entities and data are not mutated", () => {
  const h = harness(), state = snapshot();
  const before = JSON.stringify(state);
  h.window.drawWeaponVfx(h.ctx, state);
  assert.equal(JSON.stringify(state), before);
  assert.equal(h.stats().depth, 0);
  assert.doesNotMatch(read("js/weapon-vfx.js"), /\bMath\.random\s*\(/);
});

test("offscreen effects do not render and Low quality performs less drawing", () => {
  const high = harness(), low = harness();
  const state = snapshot("high");
  high.window.drawWeaponVfx(high.ctx, state);
  low.window.drawWeaponVfx(low.ctx, { ...state, quality: "low" });
  assert.ok(high.stats().draws > low.stats().draws);
  const culled = harness();
  const far = { ...state, view: { left: 10000, top: 10000, width: 100, height: 100 } };
  assert.equal(culled.window.drawWeaponVfx(culled.ctx, far).total, 0);
  assert.equal(culled.stats().draws, 0);
});

test("projectile visual passes have a strict quality cap", () => {
  const h = harness();
  const state = snapshot("low");
  state.areas = []; state.flames = []; state.orbits = [];
  state.frostOrbs = []; state.frostZones = [];
  state.shots = Array.from({length: 250}, (_, i) =>
    ({ type: "fireball", x: i % 20, y: 0, r: 12, vx: 350, vy: 0 }));
  assert.equal(h.window.drawWeaponVfx(h.ctx, state).total, 14);
});

test("impact feedback is capped, expires, rejects unknown types, and resets", () => {
  const h = harness();
  assert.equal(h.window.emitWeaponVfxImpact("arcane", 0, 0, 12), false);
  assert.equal(h.window.emitWeaponVfxImpact("waterBolt", Infinity, 0, 12), false);
  for (let i = 0; i < 90; i++)
    assert.equal(h.window.emitWeaponVfxImpact("iceShards", i, 5, 12), true);
  const s = snapshot("high");
  for (const key of ["shots","areas","flames","orbits","frostOrbs","frostZones"]) s[key] = [];
  assert.equal(h.window.drawWeaponVfx(h.ctx, s).total, 28);
  s.time = 13;
  assert.equal(h.window.drawWeaponVfx(h.ctx, s).total, 0);
  h.window.emitWeaponVfxImpact("fireball", 0, 0, 13.1);
  h.window.resetWeaponVfx();
  assert.equal(h.window.drawWeaponVfx(h.ctx, {...s,time:13.2}).total, 0);
  assert.equal(h.stats().depth, 0);
});

test("the real game loads and wires VFX only after elemental combat exists", () => {
  const index = read("index.html");
  assert.ok(index.indexOf("js/weapon-vfx.js") > index.indexOf("js/elemental-combat.js"));
  assert.ok(index.indexOf("js/weapon-vfx.js") < index.indexOf("js/controls.js"));
  const render = read("js/render.js");
  assert.match(render, /window\.drawWeaponVfx\?\.\(ctx,/);
  assert.match(render, /shots: elementalShots, areas: elementalAreas,/);
  assert.match(render, /flames: flameBursts, frostOrbs: bullets, frostZones,/);
  const elemental = read("js/elemental-combat.js");
  assert.match(elemental, /window\.emitWeaponVfxImpact\?\.\(shot\.type,/);
  assert.match(elemental, /window\.resetWeaponVfx\?\.\(\)/);
  assert.match(read("js/weapons.js"), /window\.emitWeaponVfxImpact\?\.\("frost",/);
});
