// Run from the repository root: node --test tests/living-world.test.cjs
// Regression tests run in a VM so the browser's global scripts need no bundler.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness(element = "fire", initial = "frozen") {
  const stored = {};
  if (initial !== "frozen")
    stored.shadowDominantWorldV1 = JSON.stringify({ version: 1, dominant: initial });
  let now = 0;
  const notices = [];
  let drawings = 0;
  const noop = () => {};
  const context2d = new Proxy({
    drawImage: () => drawings++,
    createRadialGradient: () => ({ addColorStop: noop }),
  }, {
    get(obj, prop) { return prop in obj ? obj[prop] : noop; },
    set(obj, prop, value) { obj[prop] = value; return true; }
  });
  function node() {
    return {
      children: [], parentNode: null, textContent: "", className: "",
      getContext: () => context2d, setAttribute: noop,
      append(...children) { for (const child of children) {
        this.children.push(child); child.parentNode = this;
      }},
      remove() { if (this.parentNode) this.parentNode.children =
        this.parentNode.children.filter(n => n !== this); this.parentNode = null; }
    };
  }
  const body = node();
  const window = {};
  const context = {
    window, document: { body, createElement: node,
      getElementById: id => body.children.find(child => child.id === id) || null },
    ctx: context2d, W: 1280, H: 720, graphicsQuality: "high",
    runMode: "standard", victoryClaimed: false, active: false,
    performance: { now: () => now }, setTimeout: noop,
    storageGet(key, fallback) { return key in stored ? stored[key] : fallback; },
    storageSet(key, value) { stored[key] = value; },
    currentLivingWorldElement: () => element,
    notify: text => notices.push(text),
    Date, Math,
  };
  vm.createContext(context);
  for (const file of ["js/world-state.js", "js/world-visuals.js"]) {
    const src = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    vm.runInContext(src, context, { filename: file });
  }
  return {
    window, context, stored, notices,
    advance(ms) { now += ms; },
    get drawings() { return drawings; },
  };
}

test("world selection is independent from the run's element", () => {
  const h = harness("fire", "frozen");
  assert.equal(h.window.getDominantWorld(), "frozen");
  h.window.beginWorldRun();
  assert.equal(h.window.getWorldConquest().invading, "burning");
  assert.equal(h.window.getDominantWorld(), "frozen");
  assert.equal(h.stored.shadowDominantWorldV1, undefined);
});

test("first and second bosses cause 15% and 50% takeover but do not save", () => {
  const h = harness();
  h.window.beginWorldRun();
  h.context.active = true;
  assert.equal(h.window.onWorldBossDefeated(1, false), true);
  h.advance(2200);
  assert.equal(h.window.getWorldConquest().coverage, 15);
  assert.equal(h.window.onWorldBossDefeated(2, false), true);
  h.advance(2200);
  assert.equal(h.window.getWorldConquest().coverage, 50);
  assert.equal(h.window.onWorldBossDefeated(3, false), false);
  assert.equal(h.stored.shadowDominantWorldV1, undefined);
});

test("death restores the world and next run starts in the old state", () => {
  const h = harness("fire", "frozen");
  h.window.beginWorldRun();
  h.window.onWorldBossDefeated(2, false);
  h.advance(2200);
  assert.equal(h.window.restoreWorldOnDefeat(), true);
  h.advance(2300);
  assert.equal(h.window.getWorldConquest().coverage, 0);
  assert.equal(h.window.getDominantWorld(), "frozen");
  assert.equal(h.window.restoreWorldOnDefeat(), false);
  h.window.abandonWorldRun();
  h.window.beginWorldRun();
  assert.equal(h.window.getDominantWorld(), "frozen");
});

test("only a claimed Standard victory can permanently change the world", () => {
  const h = harness("water", "frozen");
  h.window.beginWorldRun();
  assert.equal(h.window.completeWorldConquest(), false);
  assert.equal(h.stored.shadowDominantWorldV1, undefined);
  h.context.victoryClaimed = true;
  h.context.runMode = "endless";
  assert.equal(h.window.completeWorldConquest(), false);
  h.context.runMode = "standard";
  assert.equal(h.window.completeWorldConquest(), true);
  h.advance(2450);
  assert.equal(h.window.getWorldConquest().coverage, 100);
  assert.equal(JSON.parse(h.stored.shadowDominantWorldV1).dominant, "flooded");
  h.window.abandonWorldRun();
  h.window.beginWorldRun();
  assert.equal(h.window.getDominantWorld(), "flooded");
  assert.equal(h.window.getWorldConquest().coverage, 0);
});

test("player fire conquers frozen and flooded ground while frost freezes water", () => {
  const h = harness("fire", "frozen");
  h.window.beginWorldRun();
  h.window.resetWorldScars();
  h.window.addWorldScar("fire", 100, 100, 120);
  assert.equal(h.window.terrainAt(100, 100), "fire");
  h.window.addWorldScar("frost", 100, 100, 120);
  assert.equal(h.window.terrainAt(100, 100), "frost");
  h.window.clearWorldScars();
  h.window.resetWorldScars();
  h.window.addWorldScar("fire", 100, 100, 120);
  for (let i = 0; i < 3; i++) h.window.addWorldScar("fire", 100, 100, 120);
  assert.equal(h.window.terrainAt(100, 100), "fire");
  h.window.addWorldScar("water", 100, 100, 120);
  assert.equal(h.window.terrainAt(100, 100), "water");
});

test("local scars render and are cleared when abandoning the world", () => {
  const h = harness("water", "burning");
  h.window.beginWorldRun();
  h.window.resetWorldScars();
  h.window.addWorldScar("water", 90, 90, 110);
  assert.equal(h.window.terrainAt(90, 90), "water");
  h.window.drawWorldScars(-200, -200);
  assert.ok(h.drawings > 0);
  h.window.clearWorldScars();
  assert.equal(h.window.terrainAt(90, 90), null);
});

test("world preview is blocked while playing and does not erase old history", () => {
  const h = harness();
  h.stored.shadowLivingWorldV1 = JSON.stringify({ runs: 4, fire: 27 });
  h.context.active = true;
  assert.equal(h.window.previewWorldState("burning"), false);
  h.context.active = false;
  assert.equal(h.window.previewWorldState("burning"), true);
  assert.equal(h.window.getDominantWorld(), "burning");
  assert.equal(JSON.parse(h.stored.shadowLivingWorldV1).runs, 4);
});
