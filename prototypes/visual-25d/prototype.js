(() => {
  "use strict";

  const canvas = document.querySelector("#arena");
  let ctx = canvas.getContext("2d", { alpha: false });
  const root = document.querySelector("#prototype");
  const healthFill = document.querySelector("#health");
  const healthValue = document.querySelector("#hp-value");
  const killCount = document.querySelector("#kill-count");
  const enemyCount = document.querySelector("#enemy-count");
  const toast = document.querySelector("#toast");
  const endCard = document.querySelector("#end-card");
  const fpsLabel = document.querySelector("#fps");
  const themeButtons = [...document.querySelectorAll(".element")];
  const palettes = {
    fire: { bolt: "#ffbd76", core: "#fff1bd", glow: "#f37d43", label: "FIRE" },
    water: { bolt: "#91e8eb", core: "#e5ffff", glow: "#42bcca", label: "WATER" },
    frost: { bolt: "#ccedff", core: "#f4fbff", glow: "#7bbfe8", label: "FROST" },
  };
  const keys = new Set();
  let terrainCanvas = null;
  let terrainDpr = 0;
  const world = {
    width: 0,
    height: 0,
    arenaWidth: 2600,
    arenaHeight: 1800,
    cameraX: 1300,
    cameraY: 900,
    dpr: 1,
    time: 0,
    last: 0,
    fpsTime: 0,
    fpsFrames: 0,
  };
  const state = {
    player: { x: 0, y: 0, hp: 100, maxHp: 100, facing: 1, moving: false, invulnerable: 0, hurt: 0, dashTime: 0, dashCooldown: 0, dashX: 1, dashY: 0 },
    enemies: [],
    projectiles: [],
    particles: [],
    theme: "fire",
    shotsFired: 0,
    hits: 0,
    kills: 0,
    dashCount: 0,
    toastUntil: 0,
  };

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    world.width = bounds.width;
    world.height = bounds.height;
    world.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(world.width * world.dpr);
    canvas.height = Math.round(world.height * world.dpr);
    ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);
    if (!state.player.x) {
      state.player.x = world.arenaWidth * 0.5;
      state.player.y = world.arenaHeight * 0.5;
      world.cameraX = state.player.x;
      world.cameraY = state.player.y;
      spawnEnemies();
    }
    if (!terrainCanvas || terrainDpr !== world.dpr) cacheBackground();
  }

  function spawnEnemies() {
    const { x, y } = state.player;
    const positions = [
      [x - 210, y - 104],
      [x + 176, y - 142],
      [x + 270, y + 56],
      [x - 294, y + 8],
      [x + 8, y - 260],
      [x - 95, y + 200],
    ];
    state.enemies = positions.map(([ex, ey], index) => ({
      x: clamp(ex, 100, world.arenaWidth - 100),
      y: clamp(ey, 110, world.arenaHeight - 110),
      hp: 56,
      maxHp: 56,
      radius: 19,
      phase: index * 1.7,
      hurt: 0,
      attack: 0,
      alive: true,
    }));
    syncStatus();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function syncStatus() {
    healthFill.style.width = `${100 * state.player.hp / state.player.maxHp}%`;
    healthValue.textContent = `${Math.ceil(state.player.hp)} / ${state.player.maxHp}`;
    killCount.textContent = `${state.kills} / 6 PURGED`;
    enemyCount.textContent = state.enemies.filter((enemy) => enemy.alive).length;
    root.dataset.playerX = state.player.x.toFixed(2);
    root.dataset.playerY = state.player.y.toFixed(2);
    root.dataset.cameraX = world.cameraX.toFixed(2);
    root.dataset.cameraY = world.cameraY.toFixed(2);
    root.dataset.arenaWidth = String(world.arenaWidth);
    root.dataset.arenaHeight = String(world.arenaHeight);
    root.dataset.dashCount = String(state.dashCount);
    root.dataset.shotsFired = String(state.shotsFired);
    root.dataset.enemyHits = String(state.hits);
    root.dataset.kills = String(state.kills);
    root.dataset.playerHp = String(state.player.hp);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    state.toastUntil = world.time + 1.8;
  }

  function chooseTheme(theme) {
    if (!palettes[theme]) return;
    state.theme = theme;
    for (const button of themeButtons) {
      const selected = button.dataset.element === theme;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    showToast(`${palettes[theme].label} ATTUNEMENT`);
  }

  function addParticle(x, y, color, count = 5, power = 80, style = "spark") {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 16 + Math.random() * power;
      state.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.24 + Math.random() * 0.32, maxLife: 0.56,
        radius: 1.4 + Math.random() * 2.8, color, style, angle,
      });
    }
  }

  function nearestEnemy() {
    let target = null;
    let nearest = Infinity;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
      if (distance < nearest) {
        target = enemy;
        nearest = distance;
      }
    }
    return target;
  }

  function fireLance() {
    const target = nearestEnemy();
    if (!target) return;
    const dx = target.x - state.player.x;
    const dy = target.y - state.player.y;
    const length = Math.hypot(dx, dy) || 1;
    state.player.facing = dx >= 0 ? 1 : -1;
    state.projectiles.push({
      x: state.player.x + (dx / length) * 20,
      y: state.player.y - 20 + (dy / length) * 13,
      vx: (dx / length) * 460,
      vy: (dy / length) * 460,
      target,
      life: 2.2,
      radius: 4,
      phase: Math.random() * Math.PI * 2,
      theme: state.theme,
    });
    state.shotsFired++;
  }

  function update(dt) {
    const player = state.player;
    const moveX = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
    const moveY = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
    const length = Math.hypot(moveX, moveY);
    player.moving = length > 0;
    if (length) {
      player.facing = moveX ? Math.sign(moveX) : player.facing;
      if (player.dashTime > 0) {
        player.x += player.dashX * 660 * dt;
        player.y += player.dashY * 660 * dt;
        player.dashTime = Math.max(0, player.dashTime - dt);
      } else {
        player.x += (moveX / length) * 224 * dt;
        player.y += (moveY / length) * 224 * dt;
      }
    } else if (player.dashTime > 0) {
      player.x += player.dashX * 660 * dt;
      player.y += player.dashY * 660 * dt;
      player.dashTime = Math.max(0, player.dashTime - dt);
    }
    player.x = clamp(player.x, 76, world.arenaWidth - 76);
    player.y = clamp(player.y, 88, world.arenaHeight - 88);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.hurt = Math.max(0, player.hurt - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.phase += dt * (enemy.attack > 0 ? 2.5 : 1.7);
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.attack = Math.max(0, enemy.attack - dt);
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > 42) {
        const speed = enemy.attack > 0 ? 100 : 47;
        enemy.x += (dx / distance) * speed * dt;
        enemy.y += (dy / distance) * speed * dt;
      } else if (player.invulnerable <= 0) {
        player.hp = Math.max(0, player.hp - 13);
        player.invulnerable = 0.72;
        player.hurt = 0.22;
        enemy.attack = 0.48;
        addParticle(player.x, player.y - 22, "#f19a81", 14, 145, "impact");
        showToast("THE VEIL STRIKES · MOVE");
        if (player.hp <= 0) {
          player.hp = player.maxHp;
          player.x = world.arenaWidth * 0.5;
          player.y = world.arenaHeight * 0.5;
        }
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const bolt = state.projectiles[i];
      bolt.life -= dt;
      bolt.phase += dt * 13;
      if (!bolt.target.alive) {
        state.projectiles.splice(i, 1);
        continue;
      }
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      if (Math.hypot(bolt.x - bolt.target.x, bolt.y - (bolt.target.y - 13)) < bolt.target.radius + 8) {
        bolt.target.hp -= 28;
        bolt.target.hurt = 0.18;
        state.hits++;
        addParticle(bolt.x, bolt.y, palettes[bolt.theme].glow, 16, 130, bolt.theme);
        if (bolt.target.hp <= 0) {
          bolt.target.alive = false;
          state.kills++;
          addParticle(bolt.target.x, bolt.target.y - 30, "#e5c992", 24, 175, "burst");
          if (state.kills >= 6) endCard.hidden = false;
        }
        state.projectiles.splice(i, 1);
      } else if (bolt.life <= 0) {
        state.projectiles.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const particle = state.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }

    if (state.kills < 6 && world.time >= state.nextShot) {
      fireLance();
      state.nextShot = world.time + 0.72;
    }
    if (state.kills === 6 && world.time >= state.nextShot) {
      state.kills = 0;
      spawnEnemies();
      endCard.hidden = true;
      state.nextShot = world.time + 0.7;
    }
    if (state.toastUntil && world.time > state.toastUntil) toast.classList.remove("visible");
    syncStatus();
  }

  function polygon(points, fill, stroke, lineWidth = 1) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function drawBackground() {
    const w = world.arenaWidth, h = world.arenaHeight;
    const floor = ctx.createLinearGradient(0, 0, 0, h);
    floor.addColorStop(0, "#131d23");
    floor.addColorStop(0.5, "#202b2e");
    floor.addColorStop(1, "#111a1f");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, w, h);

    const ambient = ctx.createRadialGradient(w * 0.5, h * 0.5, 24, w * 0.5, h * 0.5, w * 0.72);
    ambient.addColorStop(0, "rgba(151, 119, 72, .12)");
    ambient.addColorStop(0.38, "rgba(91, 123, 116, .075)");
    ambient.addColorStop(1, "rgba(8, 12, 17, .12)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    for (let row = 0; row < h; row += 94) {
      for (let column = 0; column < w; column += 132) {
        const offset = (Math.floor(row / 94) % 2) * 66;
        const x = column + offset;
        const seed = Math.sin(column * 12.9898 + row * 78.233) * 43758.5453;
        const variation = seed - Math.floor(seed);
        const tile = [
          [x+3,row+10+variation*5], [x+12,row+3], [x+49,row+5+variation*4],
          [x+59,row+2], [x+119,row+4], [x+129,row+13],
          [x+125,row+52+variation*9], [x+129,row+83], [x+117,row+91],
          [x+62,row+87], [x+49,row+92], [x+7,row+89], [x+2,row+76],
        ];
        const shade = 0.008 + variation * 0.012;
        polygon(tile, `rgba(154, 164, 151, ${shade})`, "rgba(202, 195, 171, .038)", 1);
        ctx.strokeStyle = "rgba(5, 10, 13, .11)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 8, row + 14 + variation * 4);
        ctx.lineTo(x + 47, row + 9);
        ctx.lineTo(x + 54, row + 5);
        ctx.stroke();
        ctx.strokeStyle = "rgba(220, 207, 176, .08)";
        ctx.beginPath();
        ctx.moveTo(x + 16, row + 17 + variation * 3);
        ctx.lineTo(x + 48, row + 12);
        ctx.stroke();
        if (variation > 0.76) {
          ctx.strokeStyle = "rgba(4, 9, 12, .28)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 75, row + 38);
          ctx.lineTo(x + 68, row + 52);
          ctx.lineTo(x + 77, row + 59);
          ctx.lineTo(x + 71, row + 76);
          ctx.stroke();
          ctx.strokeStyle = "rgba(190, 179, 150, .1)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x + 77, row + 59);
          ctx.lineTo(x + 86, row + 63);
          ctx.stroke();
        }
      }
    }
    drawStoneInlay(w, h);
    ctx.restore();

    ctx.strokeStyle = "rgba(190, 170, 126, .26)";
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, w - 64, h - 64);
    ctx.strokeStyle = "rgba(205, 196, 163, .09)";
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, w - 96, h - 96);
    drawArchitecture(w, h);
    drawGroundDetails(w, h);
    const light = ctx.createRadialGradient(w * 0.5, h * 0.5, 18, w * 0.5, h * 0.5, h * 0.7);
    light.addColorStop(0, "rgba(225, 178, 107, .105)");
    light.addColorStop(0.36, "rgba(133, 177, 168, .055)");
    light.addColorStop(1, "rgba(8, 12, 17, 0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(204, 185, 143, .38)";
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.strokeStyle = "rgba(5, 9, 12, .68)";
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, w, h);
  }

  function cacheBackground() {
    const screenContext = ctx;
    const cache = document.createElement("canvas");
    cache.width = Math.round(world.arenaWidth * world.dpr);
    cache.height = Math.round(world.arenaHeight * world.dpr);
    ctx = cache.getContext("2d");
    ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);
    try {
      drawBackground();
    } finally {
      ctx = screenContext;
    }
    terrainCanvas = cache;
    terrainDpr = world.dpr;
  }

  function drawStoneInlay(w, h) {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(1, 0.54);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 115 + i * 82, 0, Math.PI * 2);
      ctx.strokeStyle = i === 1 ? "rgba(211, 176, 112, .32)" : "rgba(177, 190, 173, .13)";
      ctx.lineWidth = i === 1 ? 3 : 1.5;
      ctx.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      const r1 = 276, r2 = 301;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.strokeStyle = i % 3 === 0 ? "rgba(227, 188, 118, .32)" : "rgba(205, 182, 129, .16)";
      ctx.stroke();
    }
    polygon([[-20,-30],[0,-58],[20,-30],[58,0],[20,30],[0,58],[-20,30],[-58,0]], null, "rgba(218, 183, 122, .16)", 2);
    ctx.restore();
  }

  function drawArchitecture(w, h) {
    const ruins = [
      [260, 275, 1.15], [w - 260, 300, 1.05],
      [370, h - 330, 0.9], [w - 350, h - 300, 1.1],
      [w * 0.5 - 620, h * 0.5, 0.72], [w * 0.5 + 620, h * 0.5 + 30, 0.78],
      [w * 0.5 - 520, h * 0.5 - 100, 0.66], [w * 0.5 + 520, h * 0.5 + 150, 0.68],
    ];
    for (const [x, y, scale] of ruins) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      const shadow = ctx.createRadialGradient(0, 42, 12, 0, 42, 120);
      shadow.addColorStop(0, "rgba(0,0,0,.62)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(0, 42, 120, 27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#283034";
      ctx.beginPath();
      ctx.ellipse(0, 21, 96, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(181, 169, 136, .35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 18, 83, 17, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      for (const side of [-1, 1]) {
        const px = side * 48;
        polygon([[px-20,28],[px-17,-41],[px-11,-57],[px-3,-43],[px+3,28]], "#354043", "#6a7266", 2);
        polygon([[px-12,23],[px-10,-38],[px-5,-48],[px,23]], "#172126", "#394344");
        polygon([[px-24,-38],[px-21,-52],[px-11,-59],[px+2,-52],[px+5,-39]], "#7b7869", "#b2a581", 2);
      }
      polygon([[-63,-46],[-57,-62],[-42,-68],[-29,-60],[-11,-68],[8,-58],[25,-70],[43,-64],[59,-52],[62,-39],[-62,-39]], "#46504c", "#898677", 2);
      polygon([[-35,-43],[-29,-55],[-17,-61],[-7,-55],[-2,-43]], "#111b20");
      polygon([[23,-42],[30,-55],[39,-61],[48,-54],[52,-42]], "#111b20");
      polygon([[-77,29],[-69,20],[-54,21],[-48,31],[-49,39],[-80,38]], "#222a2c", "#4b5350");
      polygon([[43,27],[55,20],[71,24],[77,34],[73,41],[47,39]], "#222a2c", "#4b5350");
      ctx.fillStyle = "rgba(235, 177, 104, .8)";
      ctx.shadowColor = "#e3a15e";
      ctx.shadowBlur = 14;
      ctx.fillRect(-21, -32, 5, 7);
      ctx.fillRect(17, -31, 4, 6);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    const pillars = [
      [820, 1010, 1.15], [1810, 1050, 1.2], [430, 1190, 0.82], [2200, 560, 0.86],
    ];
    for (const [x, y, scale] of pillars) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      drawShadow(0, 9, 47, 15, 0.76);
      polygon([[-35,4],[-31,-8],[-22,-13],[22,-13],[31,-7],[36,4],[25,10],[-25,10]], "#222a2c", "#66665b", 1.5);
      const shaft = ctx.createLinearGradient(-24, -120, 25, 4);
      shaft.addColorStop(0, "#555d58");
      shaft.addColorStop(0.35, "#303a3b");
      shaft.addColorStop(0.72, "#414844");
      shaft.addColorStop(1, "#222b2e");
      polygon([[-22,-12],[-19,-112],[-13,-122],[14,-122],[21,-112],[24,-11]], shaft, "#77786b", 1.6);
      polygon([[-13,-17],[-12,-108],[-5,-116],[-4,-13]], "rgba(187, 180, 151, .17)");
      polygon([[8,-16],[11,-108],[17,-112],[17,-13]], "rgba(6, 12, 15, .38)");
      polygon([[-28,-112],[-26,-124],[-18,-131],[18,-131],[27,-124],[29,-112],[18,-107],[-18,-107]], "#55584e", "#989078", 1.8);
      polygon([[-35,-132],[-30,-145],[-21,-148],[-13,-144],[-4,-151],[6,-146],[17,-151],[28,-143],[35,-133],[27,-128],[-27,-128]], "#5d6055", "#a49b7c", 1.8);
      polygon([[-28,-138],[-23,-149],[-18,-153],[-14,-143]], "#343b3a", "#777867");
      polygon([[10,-138],[17,-149],[24,-146],[29,-136]], "#343b3a", "#777867");
      ctx.strokeStyle = "rgba(11, 17, 18, .72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, -105);
      ctx.lineTo(-7, -86);
      ctx.lineTo(1, -74);
      ctx.lineTo(-3, -54);
      ctx.stroke();
      ctx.strokeStyle = "rgba(202, 183, 142, .25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(5, -104);
      ctx.lineTo(1, -87);
      ctx.stroke();
      polygon([[-20,4],[-16,11],[16,11],[20,4]], "#343a39", "#85816d", 1.2);
      ctx.restore();
    }
  }

  function drawGroundDetails(w, h) {
    for (let i = 0; i < 110; i++) {
      const seed = i * 9283.17;
      const x = ((Math.sin(seed) * 0.5 + 0.5) * w);
      const y = 90 + ((Math.sin(seed * 0.73) * 0.5 + 0.5) * (h - 180));
      const radius = 2 + (i % 5);
      ctx.fillStyle = i % 4 === 0 ? "rgba(202, 172, 119, .2)" : "rgba(127, 147, 137, .19)";
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 2.3, radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (i % 7 === 0) {
        ctx.strokeStyle = "rgba(7, 13, 16, .42)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + radius * 4, y - radius * 1.4);
        ctx.lineTo(x + radius * 6, y + radius * 1.1);
        ctx.stroke();
      }
    }
    for (const [x, y, rx, ry] of [[980, 670, 84, 34], [1640, 1160, 92, 40], [730, 1170, 66, 29], [1880, 620, 73, 31]]) {
      const moss = ctx.createRadialGradient(x, y, 4, x, y, rx);
      moss.addColorStop(0, "rgba(97, 132, 112, .14)");
      moss.addColorStop(0.7, "rgba(86, 118, 101, .07)");
      moss.addColorStop(1, "rgba(86, 118, 101, 0)");
      ctx.fillStyle = moss;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, -0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    const rubble = [
      [130, 430], [220, 720], [480, 940], [650, 200],
      [world.arenaWidth - 180, 465], [world.arenaWidth - 270, 840],
      [world.arenaWidth - 610, 1200], [world.arenaWidth - 530, 230],
      [480, world.arenaHeight - 190], [world.arenaWidth - 330, world.arenaHeight - 160],
    ];
    for (let i = 0; i < rubble.length; i++) {
      const [x, y] = rubble[i];
      ctx.save();
      ctx.translate(x, y);
      drawShadow(0, 8, 32, 8, 0.62);
      for (let j = 0; j < 4; j++) {
        const height = 13 + ((i + j) % 3) * 6;
        polygon([[j*12-18,3],[j*12-15,-height],[j*12-8,-height-4],[j*12-3,3]], "#303a37", "#60695d", 1.5);
      }
      ctx.restore();
    }
  }

  function drawShadow(x, y, rx, ry, alpha = 0.42) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const shadow = ctx.createRadialGradient(x, y, 1, x, y, rx);
    shadow.addColorStop(0, "rgba(0, 0, 0, .8)");
    shadow.addColorStop(0.56, "rgba(0, 0, 0, .42)");
    shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLimb(startX, startY, endX, endY, width, color, highlight) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#141c20";
    ctx.lineWidth = width + 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    const material = ctx.createLinearGradient(startX - width, startY, endX + width, endY);
    material.addColorStop(0, highlight);
    material.addColorStop(0.35, color);
    material.addColorStop(1, "#202a2d");
    ctx.strokeStyle = material;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(224, 206, 166, .48)";
    ctx.lineWidth = Math.max(1, width * 0.11);
    ctx.beginPath();
    ctx.moveTo(startX - width * 0.18, startY - width * 0.19);
    ctx.lineTo(endX - width * 0.18, endY - width * 0.19);
    ctx.stroke();
    ctx.restore();
  }

  function drawDrifter(enemy) {
    const bob = Math.sin(enemy.phase * 2.2) * 2.4;
    const gait = enemy.attack > 0 ? Math.sin(enemy.phase * 8) * 5 : Math.sin(enemy.phase * 3.7) * 7;
    const x = enemy.x, y = enemy.y + bob;
    const scale = 1.18;
    drawShadow(x, enemy.y + 14, 43, 14, 0.72);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(Math.sin(enemy.phase) * 0.035);
    const flesh = enemy.hurt > 0 ? "#b98368" : "#555956";
    const bone = enemy.hurt > 0 ? "#e7c39a" : "#9e9276";
    const legSwing = gait * 0.55;

    drawLimb(-7, 0, -12 + legSwing, 23, 11, "#414443", "#777565");
    drawLimb(7, 0, 12 - legSwing, 23, 11, "#343b3b", "#666b61");
    polygon([[-20+legSwing,21],[-16+legSwing,17],[-7+legSwing,21],[-4+legSwing,27],[-23+legSwing,27]], "#75664e", "#baa57b", 1.4);
    polygon([[4-legSwing,21],[10-legSwing,18],[19-legSwing,21],[24-legSwing,27],[5-legSwing,27]], "#6c614e", "#baa57b", 1.4);
    polygon([[-19,-3],[-23,7],[-18,27],[-11,22],[-7,6],[-5,-2]], "#343b38", "#73766a", 1.5);
    polygon([[4,-3],[8,6],[12,24],[21,26],[22,9],[15,-4]], "#303739", "#747669", 1.5);

    drawLimb(-15, -39, -28 + gait * 0.35, -22, 14, "#575c54", "#89836e");
    drawLimb(15, -39, 28 - gait * 0.35, -20, 13, "#424947", "#777a6e");
    polygon([[-34,-24],[-31,-16],[-26,-19],[-21,-27],[-25,-31]], bone, "#d0b991", 1);
    polygon([[22,-26],[27,-19],[32,-17],[36,-22],[33,-28],[29,-24],[29,-31]], "#8b8068", "#c0aa7e", 1);
    for (let finger = 0; finger < 3; finger++) {
      ctx.strokeStyle = "#b8a37a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(31 + finger * 2, -20 + finger * 2);
      ctx.lineTo(37 + finger * 2, -14 + finger * 2);
      ctx.stroke();
    }

    const torso = ctx.createLinearGradient(-21, -47, 21, 4);
    torso.addColorStop(0, enemy.hurt > 0 ? "#aa7864" : "#807960");
    torso.addColorStop(0.4, flesh);
    torso.addColorStop(1, "#222c2e");
    ctx.beginPath();
    ctx.moveTo(-14,-45);
    ctx.quadraticCurveTo(-22,-29,-17,-8);
    ctx.lineTo(-11,1);
    ctx.lineTo(0,-5);
    ctx.lineTo(12,2);
    ctx.quadraticCurveTo(22,-18,14,-42);
    ctx.quadraticCurveTo(1,-50,-14,-45);
    ctx.closePath();
    ctx.fillStyle = torso;
    ctx.fill();
    ctx.strokeStyle = "#b2a581";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    polygon([[-13,-42],[-5,-39],[0,-31],[-3,-9],[-12,-5],[-17,-19]], "#293234", "#777466", 1);
    polygon([[3,-39],[13,-43],[18,-27],[12,-8],[4,-12]], "#31393a", "#777466", 1);
    for (let rib = 0; rib < 3; rib++) {
      ctx.strokeStyle = "rgba(205, 190, 155, .72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, -31 + rib * 7);
      ctx.quadraticCurveTo(0, -27 + rib * 7, 8, -31 + rib * 7);
      ctx.stroke();
    }
    polygon([[-17,-44],[-11,-52],[-1,-49],[5,-43],[-4,-38],[-14,-37]], "#766d58", "#c2ac7c", 1.5);
    polygon([[5,-43],[12,-51],[19,-45],[16,-37],[7,-38]], "#544e44", "#a99b77", 1.4);
    ctx.strokeStyle = "#c6ae7d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14,-8);
    ctx.lineTo(13,-6);
    ctx.stroke();
    polygon([[-2,-10],[2,-12],[4,-5],[0,-2]], "#d5a25e", "#ffe1a0");

    if (enemy.hurt > 0) {
      ctx.globalAlpha = Math.min(0.55, enemy.hurt * 2.7);
      ctx.strokeStyle = "#fff1d2";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -28, 19, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const head = ctx.createLinearGradient(-12, -82, 12, -42);
    head.addColorStop(0, "#aaa080");
    head.addColorStop(0.4, bone);
    head.addColorStop(1, "#514e42");
    ctx.beginPath();
    ctx.ellipse(0, -63, 13, 18, Math.sin(enemy.phase) * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = head;
    ctx.fill();
    ctx.strokeStyle = "#d0bd90";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    polygon([[-15,-65],[-13,-78],[-6,-84],[4,-83],[13,-75],[15,-63],[8,-69],[2,-72],[-6,-68]], "#282f30", "#8e8266", 1.5);
    polygon([[-12,-74],[-18,-83],[-12,-88],[-6,-79]], "#6a5e4d", "#aa946c", 1.2);
    ctx.fillStyle = "rgba(21, 24, 23, .95)";
    ctx.beginPath();
    ctx.ellipse(-5, -62, 3.2, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -62, 3.2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const eyeGlow = ctx.createRadialGradient(0, -62, 1, 0, -62, 18);
    eyeGlow.addColorStop(0, enemy.hurt > 0 ? "rgba(255, 212, 161, .75)" : "rgba(227, 119, 68, .68)");
    eyeGlow.addColorStop(1, "rgba(220, 123, 75, 0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = eyeGlow;
    ctx.fillRect(-20, -82, 40, 36);
    ctx.fillStyle = "#ffd19a";
    ctx.shadowColor = "#e48b53";
    ctx.shadowBlur = 9;
    ctx.fillRect(-6, -63, 3, 2);
    ctx.fillRect(4, -63, 3, 2);
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    if (enemy.hp < enemy.maxHp) {
      const width = 44;
      ctx.fillStyle = "rgba(7, 10, 14, .82)";
      ctx.fillRect(x - width / 2, y - 105, width, 4);
      ctx.fillStyle = "#d69d76";
      ctx.fillRect(x - width / 2, y - 105, width * Math.max(0, enemy.hp / enemy.maxHp), 4);
    }
  }

  function drawPlayer() {
    const player = state.player;
    const moving = player.moving;
    const gait = moving ? Math.sin(world.time * 12) : Math.sin(world.time * 2.3) * 0.12;
    const bob = moving ? Math.abs(gait) * 2.4 : Math.sin(world.time * 2.3) * 1.4;
    const dash = player.dashTime > 0;
    const x = player.x, y = player.y + bob;
    drawShadow(x, player.y + 14, dash ? 42 : 36, 13, dash ? 0.52 : 0.7);
    if (dash) {
      const palette = palettes[state.theme];
      const aura = ctx.createRadialGradient(x, y - 18, 2, x, y - 18, 55);
      aura.addColorStop(0, `${palette.glow}77`);
      aura.addColorStop(1, `${palette.glow}00`);
      ctx.fillStyle = aura;
      ctx.fillRect(x - 58, y - 76, 116, 116);
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.24, 1.24);
    ctx.scale(player.facing, 1);
    ctx.globalAlpha = player.invulnerable > 0 && Math.floor(world.time * 22) % 2 ? 0.55 : 1;

    const stride = gait * 9;
    drawLimb(-7, -4, -10 + stride, 20, 9, "#3e4849", "#899084");
    drawLimb(6, -4, 10 - stride, 20, 9, "#333d42", "#73817f");
    polygon([[-17+stride,18],[-10+stride,14],[-4+stride,20],[-3+stride,25],[-20+stride,25]], "#292d31", "#a99570", 1.4);
    polygon([[4-stride,19],[11-stride,15],[17-stride,20],[20-stride,25],[4-stride,25]], "#262d32", "#a99570", 1.4);
    polygon([[-14,-14],[-20,-2],[-19,15],[-9,20],[-5,7],[-4,-11]], "#252d32", "#626d6d", 1.4);
    polygon([[3,-13],[6,5],[12,19],[20,13],[17,-5],[13,-17]], "#202930", "#687674", 1.4);

    drawLimb(-14, -43, -25 - gait * 3, -23, 11, "#536266", "#98a298");
    drawLimb(13, -43, 22 + gait * 3, -23, 10, "#354449", "#7f8d8a");
    polygon([[-30,-28],[-28,-22],[-22,-21],[-18,-27],[-21,-33]], "#b5a68b", "#e4d2ad", 1.2);
    polygon([[18,-28],[23,-21],[29,-21],[32,-27],[28,-33]], "#ab9b7f", "#e1cfaa", 1.2);

    const cloak = ctx.createLinearGradient(-22, -53, 24, 20);
    cloak.addColorStop(0, "#71827e");
    cloak.addColorStop(0.28, "#46575b");
    cloak.addColorStop(0.62, "#26363c");
    cloak.addColorStop(1, "#11191e");
    ctx.beginPath();
    ctx.moveTo(-13,-49);
    ctx.quadraticCurveTo(-24,-31,-19,-7);
    ctx.lineTo(-23,12);
    ctx.lineTo(-15,20);
    ctx.lineTo(-7,12);
    ctx.lineTo(0,22);
    ctx.lineTo(7,12);
    ctx.lineTo(16,18);
    ctx.lineTo(22,5);
    ctx.quadraticCurveTo(19,-28,13,-48);
    ctx.quadraticCurveTo(0,-56,-13,-49);
    ctx.closePath();
    ctx.fillStyle = cloak;
    ctx.fill();
    ctx.strokeStyle = "#9ca69a";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    polygon([[-15,-42],[-5,-49],[0,-31],[-4,-18],[-13,-20]], "#58676a", "#9aa297", 1);
    polygon([[2,-46],[13,-45],[18,-30],[12,-19],[4,-26]], "#27343a", "#667778", 1);
    polygon([[-12,-18],[0,-22],[13,-16],[10,-7],[-9,-7]], "#8b7959", "#c9ad79", 1.4);
    ctx.strokeStyle = "#d8c18d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12,-14);
    ctx.lineTo(12,-14);
    ctx.stroke();
    polygon([[6,-17],[11,-19],[13,-11],[8,-8]], "#d2af72", "#f1d7a2");

    const face = ctx.createLinearGradient(-10, -79, 10, -47);
    face.addColorStop(0, "#d6c6a5");
    face.addColorStop(0.55, "#ae9e83");
    face.addColorStop(1, "#555453");
    ctx.beginPath();
    ctx.ellipse(0,-59,11,15,0,0,Math.PI*2);
    ctx.fillStyle = face;
    ctx.fill();
    ctx.strokeStyle = "#e1d1ae";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    polygon([[-14,-64],[-12,-77],[-4,-84],[5,-83],[14,-75],[16,-65],[8,-71],[1,-73],[-6,-68]], "#1d272e", "#87918b", 1.5);
    polygon([[-14,-63],[-20,-57],[-12,-57]], "#303b40", "#7d8881");
    ctx.fillStyle = player.hurt > 0 ? "#f5a27e" : "#263136";
    ctx.shadowColor = player.hurt > 0 ? "#ee7e65" : "#f1cc86";
    ctx.shadowBlur = player.hurt > 0 ? 16 : 5;
    ctx.fillRect(-5,-61,3,2);
    ctx.fillRect(3,-61,3,2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(39, 43, 43, .9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5,-52);
    ctx.quadraticCurveTo(0,-50,5,-52);
    ctx.stroke();

    if (player.hurt > 0) {
      ctx.globalAlpha = Math.min(0.75, player.hurt * 3.4);
      ctx.strokeStyle = "#fff0d6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0,-32,23,39,0,0,Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const lance = palettes[state.theme];
    ctx.strokeStyle = "#8b8b7b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -9);
    ctx.lineTo(22, -32);
    ctx.stroke();
    ctx.shadowColor = lance.glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = lance.bolt;
    ctx.beginPath();
    ctx.moveTo(22, -39);
    ctx.lineTo(26, -31);
    ctx.lineTo(22, -26);
    ctx.lineTo(19, -32);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.35 + Math.sin(world.time * 8) * 0.1;
    ctx.beginPath();
    ctx.arc(22, -33, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawProjectile(bolt) {
    const palette = palettes[bolt.theme];
    const pulse = 1 + Math.sin(bolt.phase) * 0.15;
    ctx.save();
    ctx.translate(bolt.x, bolt.y);
    ctx.rotate(Math.atan2(bolt.vy, bolt.vx));
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 20;
    const trail = ctx.createLinearGradient(-34, 0, 7, 0);
    trail.addColorStop(0, `${palette.glow}00`);
    trail.addColorStop(1, `${palette.glow}cc`);
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.ellipse(-10, 0, 19, 3.5 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    if (bolt.theme === "fire") {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = palette.core;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(-18, -10 - pulse * 2, -24, -3);
      ctx.quadraticCurveTo(-16, -1, -22, 4);
      ctx.quadraticCurveTo(-12, 7, -6, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (bolt.theme === "water") {
      ctx.strokeStyle = `${palette.core}bb`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-10, 0, 22, 6 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = `${palette.core}cc`;
      polygon([[-12,0],[-18,-4],[-14,0],[-18,4]], palette.core);
      polygon([[-25,-2],[-29,-5],[-26,-1],[-29,2]], `${palette.core}aa`);
    }
    ctx.fillStyle = palette.bolt;
    ctx.beginPath();
    ctx.ellipse(1, 0, 7 * pulse, 3.6 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.core;
    ctx.beginPath();
    ctx.ellipse(2, 0, 3.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const fade = Math.max(0, particle.life / particle.maxLife);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle);
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.style === "water" ? 5 : 10;

      if (particle.style === "fire") {
        ctx.beginPath();
        ctx.moveTo(-particle.radius, 0);
        ctx.quadraticCurveTo(-particle.radius * 1.2, -particle.radius * 1.8, particle.radius * 1.8, -particle.radius * 0.35);
        ctx.quadraticCurveTo(particle.radius * 1.1, particle.radius * 0.7, -particle.radius, 0);
        ctx.fill();
      } else if (particle.style === "water") {
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.radius * 1.7, particle.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, particle.radius * 0.48, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.style === "frost") {
        ctx.beginPath();
        ctx.moveTo(-particle.radius, 0);
        ctx.lineTo(0, -particle.radius * 0.65);
        ctx.lineTo(particle.radius * 1.8, 0);
        ctx.lineTo(0, particle.radius * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(244, 251, 255, .85)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-particle.radius * 0.5, 0);
        ctx.lineTo(particle.radius, 0);
        ctx.stroke();
      } else if (particle.style === "impact") {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-particle.radius * 2, 0);
        ctx.lineTo(particle.radius * 2, 0);
        ctx.moveTo(0, -particle.radius * 1.5);
        ctx.lineTo(0, particle.radius * 1.5);
        ctx.stroke();
      } else {
        ctx.lineWidth = Math.max(1, particle.radius * 0.45);
        ctx.beginPath();
        ctx.moveTo(-particle.radius * 2.2, 0);
        ctx.lineTo(particle.radius * 1.5, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(particle.radius, 0, particle.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function worldToScreen(x, y) {
    return {
      x: x - world.cameraX + world.width * 0.5,
      y: y - world.cameraY + world.height * 0.5,
    };
  }

  function updateCamera(dt) {
    const halfWidth = world.width * 0.5;
    const halfHeight = world.height * 0.5;
    const minX = Math.min(halfWidth, world.arenaWidth * 0.5);
    const maxX = Math.max(world.arenaWidth - halfWidth, world.arenaWidth * 0.5);
    const minY = Math.min(halfHeight, world.arenaHeight * 0.5);
    const maxY = Math.max(world.arenaHeight - halfHeight, world.arenaHeight * 0.5);
    const targetX = clamp(state.player.x, minX, maxX);
    const targetY = clamp(state.player.y, minY, maxY);
    const easing = 1 - Math.exp(-dt * 8.5);
    world.cameraX = clamp(world.cameraX + (targetX - world.cameraX) * easing, minX, maxX);
    world.cameraY = clamp(world.cameraY + (targetY - world.cameraY) * easing, minY, maxY);
    root.dataset.cameraX = world.cameraX.toFixed(2);
    root.dataset.cameraY = world.cameraY.toFixed(2);

    const playerScreen = worldToScreen(state.player.x, state.player.y);
    const shadowScreen = worldToScreen(state.player.x, state.player.y + 13);
    const enemy = state.enemies.find((item) => item.alive);
    const enemyScreen = enemy ? worldToScreen(enemy.x, enemy.y) : null;
    const projectile = state.projectiles[0];
    const projectileScreen = projectile ? worldToScreen(projectile.x, projectile.y) : null;
    root.dataset.viewWidth = String(world.width);
    root.dataset.viewHeight = String(world.height);
    root.dataset.playerScreenX = playerScreen.x.toFixed(2);
    root.dataset.playerScreenY = playerScreen.y.toFixed(2);
    root.dataset.shadowScreenX = shadowScreen.x.toFixed(2);
    root.dataset.shadowScreenY = shadowScreen.y.toFixed(2);
    root.dataset.enemyScreenX = enemyScreen ? enemyScreen.x.toFixed(2) : "";
    root.dataset.enemyScreenY = enemyScreen ? enemyScreen.y.toFixed(2) : "";
    root.dataset.enemyX = enemy ? enemy.x.toFixed(2) : "";
    root.dataset.enemyY = enemy ? enemy.y.toFixed(2) : "";
    root.dataset.projectileScreenX = projectileScreen ? projectileScreen.x.toFixed(2) : "";
    root.dataset.projectileScreenY = projectileScreen ? projectileScreen.y.toFixed(2) : "";
    root.dataset.projectileX = projectile ? projectile.x.toFixed(2) : "";
    root.dataset.projectileY = projectile ? projectile.y.toFixed(2) : "";
  }

  if (new URLSearchParams(window.location.search).get("qa") === "1") {
    Object.defineProperty(window, "visual25dQA", {
      value: Object.freeze({
        placePlayer(x, y) {
          state.player.x = clamp(x, 76, world.arenaWidth - 76);
          state.player.y = clamp(y, 88, world.arenaHeight - 88);
          updateCamera(1);
          syncStatus();
        },
      }),
    });
  }

  function render() {
    ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);
    ctx.fillStyle = "#0d151a";
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.setTransform(
      world.dpr,
      0,
      0,
      world.dpr,
      (world.width * 0.5 - world.cameraX) * world.dpr,
      (world.height * 0.5 - world.cameraY) * world.dpr,
    );
    ctx.drawImage(terrainCanvas, 0, 0, world.arenaWidth, world.arenaHeight);
    const actors = [
      ...state.enemies.filter((enemy) => enemy.alive).map((enemy) => ({ y: enemy.y + 22, draw: () => drawDrifter(enemy) })),
      { y: state.player.y + 22, draw: drawPlayer },
    ].sort((a, b) => a.y - b.y);
    for (const actor of actors) actor.draw();
    for (const bolt of state.projectiles) drawProjectile(bolt);
    drawParticles();
  }

  function frame(timestamp) {
    if (!world.last) world.last = timestamp;
    const dt = Math.min(0.033, Math.max(0, (timestamp - world.last) / 1000));
    world.last = timestamp;
    world.time += dt;
    update(dt);
    updateCamera(dt);
    render();
    world.fpsFrames++;
    world.fpsTime += dt;
    if (world.fpsTime >= 0.6) {
      fpsLabel.textContent = String(Math.round(world.fpsFrames / world.fpsTime));
      world.fpsFrames = 0;
      world.fpsTime = 0;
    }
    requestAnimationFrame(frame);
  }

  function startDash() {
    const player = state.player;
    if (player.dashCooldown > 0 || !keys.size) return;
    let x = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
    let y = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
    const length = Math.hypot(x, y);
    if (!length) {
      x = player.facing;
      y = 0;
    } else {
      x /= length;
      y /= length;
    }
    player.dashX = x;
    player.dashY = y;
    player.dashTime = 0.19;
    player.dashCooldown = 1.15;
    player.invulnerable = Math.max(player.invulnerable, 0.28);
    state.dashCount++;
    addParticle(player.x - x * 12, player.y - y * 12, palettes[state.theme].glow, 12, 110, state.theme);
    showToast("VEILSTEP");
    syncStatus();
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    keys.add(key);
    if (key === "shift" && !event.repeat) startDash();
    if (key === "1") chooseTheme("fire");
    if (key === "2") chooseTheme("water");
    if (key === "3") chooseTheme("frost");
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  for (const button of themeButtons) button.addEventListener("click", () => chooseTheme(button.dataset.element));
  document.querySelector("#restart").addEventListener("click", () => {
    state.kills = 0;
    state.hits = 0;
    state.shotsFired = 0;
    state.projectiles = [];
    state.player.hp = state.player.maxHp;
    state.player.x = world.width * 0.5;
    state.player.y = world.height * 0.68;
    endCard.hidden = true;
    spawnEnemies();
    syncStatus();
  });
  window.addEventListener("resize", resize);
  resize();
  state.nextShot = 0.45;
  syncStatus();
  requestAnimationFrame(frame);
})();
