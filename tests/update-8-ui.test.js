const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

test("the HTML loads all UI destinations and analytics before game/controls scripts", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const id of ["game", "panel", "choices", "pause", "collectionButton", "controlsButton",
    "encyclopediaButton", "settingsButton", "characterHud", "loadout", "dashStatus", "fpsCounter"]) {
    // choices is created by the panel() helper, not present in the initial HTML.
    if (id === "choices") continue;
    assert.match(html, new RegExp('id="' + id + '"'), "Missing UI target: " + id);
  }
  const quality = html.indexOf('src="js/quality.js');
  const game = html.indexOf('src="js/game.js');
  const controls = html.indexOf('src="js/controls.js');
  assert.ok(quality > 0 && game > quality && controls > game);
  assert.match(html, /shadow-survivor-update-8-polish/);
});

test("desktop keyboard pauses and resumes without enabling gameplay shortcuts in menus", () => {
  const listeners = {};
  const elements = new Map();
  const createElement = (id) => ({
    id, textContent: "", innerHTML: "<h1>SHADOW SURVIVOR</h1>",
    disabled: false, style: {}, dataset: {},
    append() {}, insertAdjacentElement() {}, addEventListener() {},
    querySelector: () => ({style: {setProperty() {}}}),
    classList: {toggle() {}, add() {}},
  });
  const $ = (id) => {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  };
  const context = vm.createContext({
    $, document: {
      createElement: () => createElement("dynamic"),
      getElementById: $, documentElement: { requestFullscreen: () => Promise.resolve() },
      addEventListener() {}, fullscreenElement: null,
    },
    addEventListener: (type, callback) => { listeners[type] = callback; },
    storageSet: () => {},
    metaProgress: {
      points: 0, endlessUnlocked: false, achievements: [], bossLoot: [],
      totals: {kills:0,bosses:0,runs:0,wins:0}, runs: [],
    },
    menuDifficulty: "normal", menuRunMode: "standard",
    config: {}, configureAudio: () => {}, checkSavedAchievements: () => {},
    active: true, paused: false, gameState: "playing",
    choiceScreenOpen: false, pendingLevelUps: 0,
    keys: {}, touchMoveX: 0, touchMoveY: 0,
    gameSpeed: 1, updateSpeedButtons: () => {},
    reset: () => {}, startDash: () => {}, startAudio: () => {},
    window: {confirm: () => true},
    panel: (title, body, paint) => paint({append() {}}),
  });
  vm.runInContext(fs.readFileSync(path.join(root, "js/controls.js"), "utf8"), context);
  const emit = (key, tagName = "DIV") => {
    let prevented = false;
    listeners.keydown({key, target: {tagName, isContentEditable:false}, repeat: false,
      preventDefault() { prevented = true; }});
    return prevented;
  };
  assert.equal(emit("p"), true);
  assert.equal(vm.runInContext("gameState", context), "paused");
  assert.equal(vm.runInContext("paused", context), true);
  emit("1");
  assert.equal(vm.runInContext("gameSpeed", context), 1);
  assert.equal(emit("p"), true);
  assert.equal(vm.runInContext("gameState", context), "playing");
  assert.equal(vm.runInContext("paused", context), false);
  emit("3");
  assert.equal(vm.runInContext("gameSpeed", context), 3);
  assert.equal(emit("Escape"), true);
  assert.equal(vm.runInContext("gameState", context), "paused");
  assert.equal(emit("Escape"), true);
  assert.equal(vm.runInContext("gameState", context), "playing");
  emit("Shift", "INPUT");
  assert.equal(vm.runInContext("keys.Shift", context) || false, false);
});

test("all six guide categories have reachable scripts and a scrollable panel", () => {
  const controls = fs.readFileSync(path.join(root, "js/controls.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  for (const category of ["Weapons", "Evolutions", "Upgrades", "Enemies", "Bosses", "Characters"]) {
    assert.ok(controls.includes('"' + category + '"'), "Missing guide category: " + category);
  }
  assert.match(css, /#panel\s*\{[^}]*max-height:\s*calc\(100dvh/);
  assert.match(css, /\.encyclopedia-card\.collection-unseen/);
  assert.match(css, /\.run-summary-grid/);
});
