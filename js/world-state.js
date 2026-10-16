// The Living World v0.1 — one dominant world, independently of the run element.
// The original shadowLivingWorldV1 run history is deliberately preserved.
// Later, final-boss conquest will become the only way to change this saved state.
(() => {
  "use strict";
  const KEY = "shadowDominantWorldV1";
  const DEFAULT_WORLD = "frozen";
  const WORLDS = Object.freeze({
    frozen: Object.freeze({
      id: "frozen",
      name: "FROZEN",
      description: "An ancient cold holds the land together. Fire may melt it, but its guardian still reigns.",
      background: ["#0a1523", "#102335", "#152432"],
      ambient: ["rgba(100,194,231,0.13)", "rgba(119,188,226,0.04)"],
      ground: "#14364b",
      highlight: "#b4efff",
    }),
    burning: Object.freeze({
      id: "burning",
      name: "BURNING",
      description: "Scorched roads and hungry embers mark a world ruled by flame.",
      background: ["#1f1110", "#291a17", "#1e1817"],
      ambient: ["rgba(238,102,50,0.15)", "rgba(222,128,55,0.04)"],
      ground: "#3c2019",
      highlight: "#ffb16b",
    }),
    flooded: Object.freeze({
      id: "flooded",
      name: "FLOODED",
      description: "Water has claimed the broken streets. Every step stirs a silent current.",
      background: ["#071d25", "#0d2b38", "#142832"],
      ambient: ["rgba(48,158,199,0.14)", "rgba(69,189,211,0.04)"],
      ground: "#11435b",
      highlight: "#7fd9f3",
    }),
  });
  function validWorld(value) {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(WORLDS, value);
  }
  function readSavedWorld() {
    try {
      const state = JSON.parse(storageGet(KEY, "null") || "null");
      return state && validWorld(state.dominant) ? state.dominant : DEFAULT_WORLD;
    } catch { return DEFAULT_WORLD; }
  }
  let runWorld = null;
  function getDominantWorld() {
    return runWorld || readSavedWorld();
  }
  function beginWorldRun() {
    runWorld = readSavedWorld();
    return runWorld;
  }
  function getWorldInfo() {
    return WORLDS[getDominantWorld()];
  }
  // Only used by Settings > World Preview while developing phase 3.
  // Cannot change a running game and does not touch the player's old saves.
  function previewWorldState(world) {
    if (!validWorld(world) || (typeof active !== "undefined" && active)) return false;
    storageSet(KEY, JSON.stringify({ version: 1, dominant: world }));
    runWorld = null;
    return true;
  }
  function worldStatus() {
    const info = getWorldInfo();
    let runs = 0;
    try { runs = JSON.parse(storageGet("shadowLivingWorldV1", "{}") || "{}").runs || 0; }
    catch {}
    return {
      title: info.name,
      detail: info.description,
      runs: Math.max(0, Math.floor(Number(runs) || 0)),
      world: info.id,
    };
  }
  const tiles = new Map();
  function randomGenerator(seed) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function buildTile(world, variant) {
    const key = world + ":" + variant;
    if (tiles.has(key)) return tiles.get(key);
    const tile = document.createElement("canvas");
    tile.width = tile.height = 320;
    const g = tile.getContext("2d");
    if (!g) return tile;
    const rnd = randomGenerator(81647 + variant * 7789 + Object.keys(WORLDS).indexOf(world) * 91099);
    const info = WORLDS[world];
    g.fillStyle = info.ground;
    g.globalAlpha = .30;
    g.fillRect(0, 0, 320, 320);
    g.globalAlpha = 1;
    if (world === "frozen") {
      for (let i = 0; i < 12; i++) {
        const x = rnd() * 320, y = rnd() * 320;
        const r = 20 + rnd() * 59;
        g.fillStyle = i % 3 === 0 ? "rgba(154,235,253,.09)" : "rgba(60,161,195,.12)";
        g.beginPath(); g.ellipse(x, y, r, r * .44, rnd() * 2, 0, Math.PI * 2); g.fill();
      }
      g.lineCap = "round";
      for (let i = 0; i < 15; i++) {
        const x = rnd() * 320, y = rnd() * 320;
        g.strokeStyle = i % 2 ? "rgba(153,222,248,.28)" : "rgba(58,132,180,.26)";
        g.lineWidth = .6 + rnd() * 1.4;
        g.beginPath(); g.moveTo(x - 15, y + 9); g.lineTo(x, y);
        g.lineTo(x + 12 + rnd() * 18, y - 12 - rnd() * 10); g.stroke();
      }
      for (let i = 0; i < 22; i++) {
        g.fillStyle = i % 2 ? "rgba(207,247,255,.52)" : "rgba(111,210,245,.31)";
        g.fillRect(rnd() * 320, rnd() * 320, 1.2 + rnd() * 1.6, 1.2 + rnd() * 1.4);
      }
    } else if (world === "burning") {
      for (let i = 0; i < 19; i++) {
        const x = rnd() * 320, y = rnd() * 320;
        const r = 8 + rnd() * 34;
        g.fillStyle = i % 3 ? "rgba(6,8,11,.24)" : "rgba(116,44,24,.17)";
        g.beginPath(); g.ellipse(x, y, r, r * .42, rnd() * Math.PI, 0, Math.PI * 2); g.fill();
        if (i % 2) {
          g.strokeStyle = "rgba(241,116,56,.32)";
          g.lineWidth = 1 + rnd();
          g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y + rnd() * 9);
          g.lineTo(x + r * .8, y + r * .2); g.stroke();
        }
      }
      for (let i = 0; i < 38; i++) {
        g.fillStyle = i % 3 ? "rgba(255,169,80,.36)" : "rgba(236,84,41,.62)";
        g.beginPath(); g.arc(rnd() * 320, rnd() * 320, .7 + rnd() * 1.4, 0, Math.PI * 2); g.fill();
      }
    } else {
      for (let i = 0; i < 13; i++) {
        const x = rnd() * 320, y = rnd() * 320;
        const r = 16 + rnd() * 62;
        g.fillStyle = i % 3 ? "rgba(35,126,168,.20)" : "rgba(89,184,211,.13)";
        g.beginPath(); g.ellipse(x, y, r, r * .47, rnd() * .7, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(130,222,242,.34)";
        g.lineWidth = 1.1;
        for (let ring = 0; ring < 2; ring++) {
          g.beginPath(); g.ellipse(x, y, r * (.48 + ring * .27),
            r * (.22 + ring * .15), 0, .25 + ring * .6, Math.PI * 1.72); g.stroke();
        }
      }
      for (let i = 0; i < 12; i++) {
        g.strokeStyle = "rgba(159,225,243,.24)";
        g.beginPath(); const x = rnd() * 320, y = rnd() * 320;
        g.moveTo(x,y);g.quadraticCurveTo(x+20,y-5,x+42,y+2);g.stroke();
      }
    }
    tiles.set(key, tile);
    return tile;
  }
  function drawWorldEnvironment(left, top) {
    const world = getDominantWorld();
    const step = 320;
    const x0 = Math.floor(left / step) - 1;
    const y0 = Math.floor(top / step) - 1;
    ctx.save();
    ctx.globalAlpha = typeof graphicsQuality !== "undefined" && graphicsQuality === "low" ? .60 : .85;
    for (let gx = x0; gx * step < left + W + step; gx++) {
      for (let gy = y0; gy * step < top + H + step; gy++) {
        const variant = ((gx * 37 + gy * 71) % 4 + 4) % 4;
        ctx.drawImage(buildTile(world, variant), gx * step, gy * step);
      }
    }
    ctx.restore();
  }
  window.livingWorldStates = WORLDS;
  window.getDominantWorld = getDominantWorld;
  window.beginWorldRun = beginWorldRun;
  window.previewWorldState = previewWorldState;
  window.getLivingWorldState = worldStatus;
  window.drawWorldEnvironment = drawWorldEnvironment;
})();
