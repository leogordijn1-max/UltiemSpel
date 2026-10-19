// Run with: node --test tests/developer-mode.test.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function environment() {
  const disk = new Map([["shadowProgress", '{"points":42}']]);
  const listeners = {};
  class Element {
    constructor(tag = "div") {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.listeners = {};
      this.style = {};
      this.hidden = false;
      this.className = "";
      this.textContent = "";
      this.classList = { add() {}, remove() {} };
    }
    append(...children) {
      for (const child of children) {
        this.children.push(child);
        if (child && typeof child === "object") child.parentNode = this;
      }
    }
    remove() {
      if (this.parentNode)
        this.parentNode.children = this.parentNode.children.filter(child => child !== this);
      this.parentNode = null;
    }
    replaceWith(next) {
      if (!this.parentNode) return;
      const index = this.parentNode.children.indexOf(this);
      this.parentNode.children.splice(index, 1, next);
      next.parentNode = this.parentNode;
      this.parentNode = null;
    }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    setAttribute() {}
    querySelector(query) {
      if (query.startsWith(".")) return find(this, node => node.className.split(" ").includes(query.slice(1)));
      return null;
    }
    getContext() { return canvas; }
  }
  function find(root, predicate) {
    if (predicate(root)) return root;
    for (const child of root.children || []) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return null;
  }
  const canvas = new Proxy({
    drawImage() {},
    createRadialGradient: () => ({ addColorStop() {} }),
  }, { get(o, key) { return key in o ? o[key] : () => {}; } });
  const document = {
    body: new Element("body"),
    createElement: tag => new Element(tag),
    createTextNode: text => ({ textContent: text }),
    getElementById: id => find(document.body, e => e.id === id),
  };
  let now = 0;
  const context = {
    window: { addEventListener: (type, handler) => { listeners[type] = handler; } },
    document,
    localStorage: {
      getItem: key => disk.has(key) ? disk.get(key) : null,
      setItem: (key, value) => disk.set(key, String(value)),
    },
    active: false, paused: true, gameState: "main-menu",
    player: { x: 0, y: 0, hp: 50, maxHp: 100 },
    highest: 0, metaProgress: { points: 42 },
    W: 1280, H: 720, graphicsQuality: "high",
    ctx: canvas, runMode: "standard", victoryClaimed: false,
    boss: null, evolutions: {}, evolutionFlash: null, level: 1,
    xp: 0, needed: 10, pendingLevelUps: 0,
    selectedWeapons: ["flame", "fireball", "flameOrbit"],
    unlockedWeapons: ["flame"], startWeapon: "flame",
    unlockableWeapons: ["fireball", "flameOrbit"],
    upgrades: { flame: 1 }, time: 0,
    bullets: [], lightningSegments: [], flameBursts: [], frostZones: [],
    weaponTimers: {}, notifications: [],
    performance: { now: () => now }, setTimeout() {},
    clearMovementKeys() {}, hud() {}, choices() {},
    resetElementalCombat() {}, rebuildEnemyGrid() {},
    updateSpeedButtons() {}, updateHud() {},
    nextLevelXpRequirement: value => value + 5,
    makeStartingWeaponLevels: key => ({
      flame: key === "flame" ? 1 : 0,
      fireball: key === "fireball" ? 1 : 0,
      flameOrbit: key === "flameOrbit" ? 1 : 0,
      waterBolt: key === "waterBolt" ? 1 : 0,
      tidalWave: key === "tidalWave" ? 1 : 0,
      whirlpool: key === "whirlpool" ? 1 : 0,
      frost: key === "frost" ? 1 : 0,
      iceShards: key === "iceShards" ? 1 : 0,
      glacialPulse: key === "glacialPulse" ? 1 : 0,
    }),
    evolutionForWeapon: key => ({ id: key + "Evolution", support: "health", supportLevel: 3 }),
    notify() {},
    spawnBoss() {}, spawnFinalBoss: () => false, damage() {},
    $: () => ({ style: {} }),
    Math, Date,
  };
  // Mock career loader; the real implementation reads shadowProgress from storage.
  context.loadMetaProgress = () => JSON.parse(disk.get("shadowProgress") || "{}");
  context.storageNumber = (key, fallback) => Number(disk.get(key) || fallback);
  vm.createContext(context);
  for (const filename of ["js/storage.js", "js/elements.js", "js/world-state.js", "js/developer-mode.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), context, { filename });
  }
  function enable() {
    const parent = new Element();
    context.window.appendDeveloperSettings(parent);
    const checkbox = find(parent, item => item.tagName === "INPUT" && item.type === "checkbox");
    assert.ok(checkbox);
    checkbox.checked = true;
    checkbox.listeners.change();
  }
  function start() {
    context.window.developerBeginRun();
    context.active = true;
    context.paused = false;
    context.gameState = "playing";
    context.window.beginWorldRun();
  }
  return { context, disk, listeners, document, enable, start, find, advance: ms => { now += ms; } };
}

test("developer tools are opt-in, not enabled by default", () => {
  const t = environment();
  assert.equal(t.context.window.developerModeEnabled(), false);
  assert.equal(t.context.window.openDeveloperPanel(), false);
  assert.equal(t.context.window.isDeveloperRun(), false);
});

test("sandbox blocks career progress, scores, old world history and conquest", () => {
  const t = environment();
  t.enable();
  t.start();
  const before = Object.fromEntries(t.disk);
  for (const key of ["shadowProgress", "shadowHigh", "shadowLivingWorldV1", "shadowDominantWorldV1"])
    assert.equal(t.context.storageSet(key, "TEST WRITE"), false);
  assert.deepEqual(Object.fromEntries(t.disk), { ...before, shadowDeveloperEnabledV1: "true" });
});

test("ending a test run discards modified in-memory career progression", () => {
  const t = environment();
  t.enable();
  t.start();
  t.context.metaProgress.points = 999999;
  t.context.window.developerEndRun();
  assert.equal(t.context.metaProgress.points, 42);
  assert.equal(t.context.window.isDeveloperRun(), false);
  assert.equal(t.disk.get("shadowProgress"), '{"points":42}');
});

test("L panel pauses and resumes without opening a normal level-up screen", () => {
  const t = environment();
  t.enable();
  t.start();
  assert.equal(t.context.window.openDeveloperPanel(), true);
  assert.equal(t.context.gameState, "paused");
  assert.equal(t.context.paused, true);
  assert.ok(t.document.getElementById("developerPanel"));
  t.context.window.closeDeveloperPanel();
  assert.equal(t.context.gameState, "playing");
  assert.equal(t.context.paused, false);
});

test("world previews do not persist and remain available in one sandbox run", () => {
  const t = environment();
  t.enable();
  t.start();
  assert.equal(t.context.window.getDominantWorld(), "frozen");
  assert.equal(t.context.window.developerChangeWorld("burning"), true);
  assert.equal(t.context.window.getDominantWorld(), "burning");
  assert.equal(t.context.window.developerSetWorldCoverage(50), true);
  t.advance(900);
  assert.equal(t.context.window.getWorldConquest().coverage, 50);
  assert.equal(t.disk.has("shadowDominantWorldV1"), false);
  t.context.window.developerEndRun();
  t.context.window.abandonWorldRun();
  assert.equal(t.context.window.getDominantWorld(), "frozen");
});

test("settings cannot turn off sandbox protection during an active run", () => {
  const t = environment();
  t.enable();
  t.start();
  const parent = t.document.createElement("section");
  t.context.window.appendDeveloperSettings(parent);
  const checkbox = t.find(parent, item => item.tagName === "INPUT" && item.type === "checkbox");
  assert.equal(checkbox.disabled, true);
  assert.equal(t.context.window.isDeveloperRun(), true);
});

test("element selection remains a per-run override, never alters saved preference", () => {
  const t = environment();
  t.enable();
  t.start();
  t.context.window.openDeveloperPanel();
  const button = t.find(t.document.body, node => node.textContent === "WATER LOADOUT");
  assert.ok(button);
  button.listeners.click();
  assert.equal(t.context.window.developerRunElement(), "water");
  assert.equal(t.context.window.getWorldConquest().invading, "flooded");
  assert.equal(t.context.startWeapon, "waterBolt");
  assert.equal(t.context.storageGet("shadowRunElement", "fire"), "fire");
});

test("deleting a sandbox boss keeps L actions and resumes on close", () => {
  const t = environment();
  t.enable();
  t.start();
  t.context.boss = {kind:3,hp:100,maxHp:100,variant:0};
  t.context.damage = enemy => { enemy.dead=true; t.context.boss=null; };
  assert.equal(t.context.window.openDeveloperPanel(), true);
  const defeat = t.find(t.document.body,node=>node.textContent==="DEFEAT ACTIVE BOSS");
  assert.ok(defeat);
  assert.equal(defeat.disabled,false);
  defeat.listeners.click();
  assert.equal(t.context.boss,null);
  assert.equal(t.context.gameState,"paused");
  const nextBoss = t.find(t.document.body,node=>node.textContent==="SPAWN NORMAL BOSS");
  assert.ok(nextBoss);
  assert.equal(nextBoss.disabled,false);
  t.context.window.closeDeveloperPanel();
  assert.equal(t.context.gameState,"playing");
  assert.equal(t.context.paused,false);
});

test("boss rewards skip active developer tools and F9 panel, but passive dev setting keeps rewards", () => {
  const source=fs.readFileSync(path.join(__dirname,"../js/enemies.js"),"utf8");
  assert.match(source,/!killedFinalBoss && \(!window\.isDeveloperRun\?\.\(\) \|\|/);
  assert.match(source,/!window\.developerToolsUsed\?\.\(\)/);
  assert.match(source,/!window\.developerPanelOpen\?\.\(\)/);
});

test("L toggles developer panel and F9 no longer intercepts keyboard input", () => {
  const t = environment();
  t.enable();
  t.start();
  let prevented = 0;
  const key = value => ({ key:value, code:value==="L"?"KeyL":value, ctrlKey:false, shiftKey:false, repeat:false,
    preventDefault(){prevented++}, stopImmediatePropagation(){} });
  t.listeners.keydown(key("F9"));
  assert.equal(t.document.getElementById("developerPanel"), null);
  assert.equal(prevented,0);
  t.listeners.keydown(key("L"));
  assert.ok(t.document.getElementById("developerPanel"));
  assert.equal(t.context.paused,false);
  assert.equal(t.context.gameState,"playing");
  t.listeners.keydown(key("L"));
  assert.equal(t.document.getElementById("developerPanel"), null);
  assert.equal(t.context.paused,false);
  assert.equal(t.context.gameState,"playing");
  assert.equal(prevented,2);
});

test("L shortcut is live while Settings button can still pause", () => {
  const t=environment();
  t.enable();t.start();
  const event={code:"KeyL",key:"l",shiftKey:false,ctrlKey:false,altKey:false,repeat:false,
    preventDefault(){},stopImmediatePropagation(){}};
  t.listeners.keydown(event);
  assert.equal(t.context.paused,false);
  assert.equal(t.context.gameState,"playing");
  t.context.window.closeDeveloperPanel();
  assert.equal(t.context.gameState,"playing");
  t.context.window.openDeveloperPanel();
  assert.equal(t.context.paused,true);
  t.context.window.closeDeveloperPanel();
  assert.equal(t.context.paused,false);
});


test("85% IMPACT button updates the actual world coverage and the panel status", () => {
  const t = environment();
  t.enable();
  t.start();
  assert.equal(t.context.window.developerChangeWorld("flooded"), true);
  assert.equal(t.context.window.openDeveloperPanel({ live: true }), true);
  const button = t.find(t.document.getElementById("developerPanel"),
    node => node.tagName === "BUTTON" && node.textContent === "85% IMPACT");
  assert.ok(button, "the 85% button must exist in the live panel");
  button.listeners.click();
  assert.equal(t.context.window.getWorldConquest().target, 85);
  const status = t.find(t.document.getElementById("developerPanel"),
    node => node.className === "developer-status");
  assert.match(status.textContent, /IMPACT 85%/);
  t.advance(900);
  assert.equal(t.context.window.getWorldConquest().coverage, 85);
  assert.equal(t.disk.has("shadowDominantWorldV1"), false);
  assert.equal(t.context.window.developerSetWorldCoverage(35), false);
});


test("enabling sandbox alone is not the same as using a developer tool",()=>{
  const t=environment();
  t.enable();
  t.start();
  assert.equal(t.context.window.isDeveloperRun(),true);
  assert.equal(t.context.window.developerToolsUsed(),false);
  assert.equal(t.context.window.developerPanelOpen(),false);
  assert.equal(t.context.window.openDeveloperPanel(),true);
  assert.equal(t.context.window.developerPanelOpen(),true);
  assert.equal(t.context.window.developerToolsUsed(),false);
  const god=t.find(t.document.body,node=>
    node.tagName==="BUTTON"&&node.textContent==="ENABLE GOD MODE");
  assert.ok(god,"the developer tools panel must expose its God Mode toggle");
  god.listeners.click();
  assert.equal(t.context.window.developerToolsUsed(),true);
  assert.equal(t.context.window.developerInvincible(),true);
  t.context.window.closeDeveloperPanel();
  assert.equal(t.context.window.developerPanelOpen(),false);
  assert.equal(t.context.window.developerToolsUsed(),true);
  t.context.window.developerEndRun();
  assert.equal(t.context.window.developerToolsUsed(),false);
  assert.equal(t.context.window.isDeveloperRun(),false);
});
test("normal boss rewards may occur with passive Developer Mode, but NOT while tools are used or F9 open",()=>{
  const sourceText=fs.readFileSync(path.join(__dirname,"..","js/enemies.js"),"utf8");
  assert.match(sourceText,/!window\.developerToolsUsed\?\.\(\)/);
  assert.match(sourceText,/!window\.developerPanelOpen\?\.\(\)/);
  assert.match(sourceText,/!window\.isDeveloperRun\?\.\(\)/);
});
