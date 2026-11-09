// Draw the scene in layers, from the arena backdrop to the visual effects.
let backgroundPaintCache = null;
let ambientTileCache = null;
let vignettePaintCache = null;
const renderQuery = typeof location === "undefined" ? "" : location.search;
const integrated3DRenderer = /(?:\?|&)render=3d(?:&|$)/.test(renderQuery);
const integrated25DRenderer = /(?:\?|&)render=25d(?:&|$)/.test(renderQuery);
const renderQaEnabled = /(?:\?|&)qa=1(?:&|$)/.test(renderQuery);
const integrated25DEnemyPalettes = {
  0: { body: "#403447", trim: "#8a6e9a", light: "#e5c998" },
  1: { body: "#65392b", trim: "#d47b4d", light: "#ffd08b" },
  2: { body: "#354536", trim: "#899b64", light: "#d2d49a" },
  4: { body: "#292b3a", trim: "#8996ae", light: "#d7f0ff" },
  5: { body: "#612f2a", trim: "#e35d43", light: "#ffe0a0" },
  6: { body: "#29384a", trim: "#91a9bd", light: "#d7f1ff" },
};
const integrated25DWorldThemes = {
  fire: {
    ground: "#201713",
    stone: ["#30231d", "#463027", "#251c19"],
    edge: "#725039",
    glow: "#ff6d36",
    light: "rgba(255, 104, 49, 0.13)",
    crack: "rgba(255, 112, 50, 0.78)",
    fog: "rgba(173, 64, 34, 0.12)",
  },
  water: {
    ground: "#102328",
    stone: ["#1c3439", "#29434a", "#172e35"],
    edge: "#527c7e",
    glow: "#58d5d0",
    light: "rgba(74, 202, 202, 0.15)",
    crack: "rgba(93, 197, 194, 0.42)",
    fog: "rgba(47, 150, 164, 0.13)",
  },
  frost: {
    ground: "#131f2e",
    stone: ["#26394a", "#354b5d", "#1e3040"],
    edge: "#6b9db6",
    glow: "#9ce7ff",
    light: "rgba(104, 190, 239, 0.17)",
    crack: "rgba(178, 232, 255, 0.62)",
    fog: "rgba(129, 193, 225, 0.15)",
  },
};
// Viewport culling is visual-only; game logic, projectiles and boss tells
// continue to update and collide regardless of whether their VFX are drawn.
function renderEffectVisible(x,y,radius=0) {
  if (!player) return false;
  const pad=Math.max(0,radius)+48; // include shake and stroked boundaries
  return Math.abs(x-player.x)<=W/2+pad &&
    Math.abs(y-player.y)<=H/2+pad;
}
function renderSegmentVisible(x1,y1,x2,y2,radius=32) {
  if (!player) return false;
  const left=player.x-W/2-radius-48,right=player.x+W/2+radius+48;
  const top=player.y-H/2-radius-48,bottom=player.y+H/2+radius+48;
  return Math.max(x1,x2)>=left && Math.min(x1,x2)<=right &&
    Math.max(y1,y2)>=top && Math.min(y1,y2)<=bottom;
}
function getVignettePaint() {
  if(vignettePaintCache?.width===W&&vignettePaintCache?.height===H)
    return vignettePaintCache.gradient;
  const gradient=ctx.createRadialGradient(
    W/2,H/2,Math.min(W,H)*.15,
    W/2,H/2,Math.max(W,H)*.72
  );
  gradient.addColorStop(0,"#0000");
  gradient.addColorStop(1,"#030310aa");
  vignettePaintCache={width:W,height:H,gradient};
  return gradient;
}
function glow(blur) {
  return graphicsQuality === "low"
    ? 0
    : graphicsQuality === "medium"
      ? blur * 0.65
      : blur;
}

function drawIntegrated25DLine(x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function integrated25DHash(x, y, salt = 0) {
  let value = Math.imul(x | 0, 0x45d9f3b) ^ Math.imul(y | 0, 0x119de1f3) ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function drawIntegrated25DStonePillar(x, y, size, theme, variant) {
  const height = size * (0.72 + variant * 0.32);
  const half = size * 0.32;
  ctx.save();
  ctx.fillStyle = "rgba(1, 4, 9, 0.48)";
  ctx.beginPath();
  ctx.ellipse(x + size * 0.18, y + size * 0.1, size * 0.78, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.stone[0];
  ctx.strokeStyle = theme.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - half * 1.25, y);
  ctx.lineTo(x - half, y - size * 0.13);
  ctx.lineTo(x + half * 0.85, y - size * 0.1);
  ctx.lineTo(x + half * 1.24, y + size * 0.04);
  ctx.lineTo(x + half * 0.72, y + size * 0.19);
  ctx.lineTo(x - half * 0.9, y + size * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.stone[1];
  ctx.strokeStyle = "rgba(4, 9, 13, 0.64)";
  ctx.beginPath();
  ctx.moveTo(x - half, y - size * 0.12);
  ctx.lineTo(x - half * 0.76, y - height);
  ctx.lineTo(x + half * 0.55, y - height * 0.96);
  ctx.lineTo(x + half * 0.86, y - size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = theme.stone[2];
  ctx.beginPath();
  ctx.moveTo(x + half * 0.55, y - height * 0.96);
  ctx.lineTo(x + half * 1.14, y - height * 0.85);
  ctx.lineTo(x + half * 1.24, y + size * 0.04);
  ctx.lineTo(x + half * 0.86, y - size * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.edge;
  ctx.beginPath();
  ctx.moveTo(x - half * 1.12, y - height);
  ctx.lineTo(x - half * 0.9, y - height - size * 0.1);
  ctx.lineTo(x + half * 0.8, y - height - size * 0.06);
  ctx.lineTo(x + half * 1.14, y - height * 0.85);
  ctx.lineTo(x + half * 0.55, y - height * 0.96);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.28;
  drawIntegrated25DLine(x - half * 0.48, y - height * 0.75,
    x - half * 0.2, y - height * 0.5, theme.crack, 2);
  drawIntegrated25DLine(x - half * 0.2, y - height * 0.5,
    x - half * 0.4, y - height * 0.3, theme.crack, 1.5);
  ctx.restore();
}

function drawIntegrated25DWorld(left, top) {
  const selected = typeof currentLivingWorldElement === "function"
    ? currentLivingWorldElement() : "fire";
  const element = Object.hasOwn(integrated25DWorldThemes, selected) ? selected : "fire";
  const theme = integrated25DWorldThemes[element];
  const tileSize = 256;
  const startX = Math.floor(left / tileSize) - 1;
  const endX = Math.ceil((left + W) / tileSize) + 1;
  const startY = Math.floor(top / tileSize) - 1;
  const endY = Math.ceil((top + H) / tileSize) + 1;
  const decorationCount = { tiles: 0, ruins: 0, landmarks: 0 };

  ctx.save();
  const ambient = ctx.createRadialGradient(
    left + W * 0.5, top + H * 0.46, Math.min(W, H) * 0.08,
    left + W * 0.5, top + H * 0.46, Math.max(W, H) * 0.82,
  );
  ambient.addColorStop(0, theme.light);
  ambient.addColorStop(0.58, theme.fog);
  ambient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ambient;
  ctx.fillRect(left, top, W, H);

  for (let gx = startX; gx <= endX; gx++) {
    for (let gy = startY; gy <= endY; gy++) {
      const x = gx * tileSize + integrated25DHash(gx, gy, 11) * 28 - 14;
      const y = gy * tileSize + integrated25DHash(gx, gy, 13) * 28 - 14;
      const seed = integrated25DHash(gx, gy, 17);
      const insetX = 12 + integrated25DHash(gx, gy, 21) * 22;
      const insetY = 12 + integrated25DHash(gx, gy, 25) * 20;
      const width = tileSize - 2 * insetX;
      const height = tileSize - 2 * insetY;
      ctx.globalAlpha = 0.36;
      ctx.fillStyle = theme.ground;
      ctx.beginPath();
      ctx.moveTo(x + insetX + width * 0.08, y + insetY + height * 0.04);
      ctx.lineTo(
        x + insetX + width * (0.39 + integrated25DHash(gx, gy, 15) * 0.24),
        y + insetY,
      );
      ctx.lineTo(
        x + insetX + width,
        y + insetY + height * (0.34 + integrated25DHash(gx, gy, 16) * 0.3),
      );
      ctx.lineTo(
        x + insetX + width * (0.68 + integrated25DHash(gx, gy, 18) * 0.2),
        y + insetY + height,
      );
      ctx.lineTo(x + insetX + width * 0.31, y + insetY + height - 8);
      ctx.lineTo(
        x + insetX,
        y + insetY + height * (0.39 + integrated25DHash(gx, gy, 19) * 0.24),
      );
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      const plateCount = 3 + Math.floor(integrated25DHash(gx, gy, 30) * 3);
      for (let plate = 0; plate < plateCount; plate++) {
        const plateSeed = integrated25DHash(gx * 7 + plate, gy * 11 - plate, 37);
        const px = x + 24 + plateSeed * (tileSize - 80);
        const py = y + 24 + integrated25DHash(gx * 13 - plate, gy * 5 + plate, 41) * (tileSize - 80);
        const pw = 32 + plateSeed * 32;
        const ph = 22 + integrated25DHash(gx + plate, gy - plate, 43) * 20;
        const stone = theme.stone[Math.floor(plateSeed * theme.stone.length)];
        ctx.fillStyle = stone;
        ctx.strokeStyle = theme.edge;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - pw * 0.46, py - ph * 0.35);
        ctx.lineTo(px + pw * 0.22, py - ph * 0.5);
        ctx.lineTo(px + pw * 0.53, py - ph * 0.08);
        ctx.lineTo(px + pw * 0.36, py + ph * 0.46);
        ctx.lineTo(px - pw * 0.35, py + ph * 0.5);
        ctx.lineTo(px - pw * 0.55, py + ph * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (element === "fire" && plateSeed > 0.53) {
          ctx.globalAlpha = 0.28 + plateSeed * 0.32;
          ctx.shadowColor = theme.glow;
          ctx.shadowBlur = glow(8);
          ctx.strokeStyle = theme.crack;
          ctx.lineWidth = 1 + plateSeed;
          ctx.beginPath();
          ctx.moveTo(px - pw * 0.24, py - ph * 0.3);
          ctx.lineTo(px - pw * 0.02, py - ph * 0.02);
          ctx.lineTo(px - pw * 0.16, py + ph * 0.16);
          ctx.lineTo(px + pw * 0.25, py + ph * 0.38);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      if (element === "water" && seed > 0.34) {
        const px = x + 42 + integrated25DHash(gx, gy, 51) * (tileSize - 84);
        const py = y + 42 + integrated25DHash(gx, gy, 57) * (tileSize - 84);
        const radius = 13 + seed * 20;
        ctx.save();
        ctx.globalAlpha = 0.27;
        ctx.fillStyle = "#071a25";
        ctx.strokeStyle = theme.glow;
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = glow(8);
        ctx.beginPath();
        ctx.ellipse(px, py, radius * 1.45, radius * 0.62, seed * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 0.42;
        drawIntegrated25DLine(px - radius * 0.52, py - radius * 0.11,
          px + radius * 0.37, py - radius * 0.2, "#c8ffff", 1.5);
        ctx.restore();
      } else if (element === "frost" && seed > 0.41) {
        const px = x + 36 + integrated25DHash(gx, gy, 61) * (tileSize - 72);
        const py = y + 36 + integrated25DHash(gx, gy, 67) * (tileSize - 72);
        const radius = 10 + seed * 15;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#bceeff";
        ctx.strokeStyle = "#e3fbff";
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = glow(7);
        ctx.beginPath();
        ctx.moveTo(px, py - radius);
        ctx.lineTo(px + radius * 0.26, py - radius * 0.23);
        ctx.lineTo(px + radius * 0.82, py);
        ctx.lineTo(px + radius * 0.2, py + radius * 0.24);
        ctx.lineTo(px, py + radius);
        ctx.lineTo(px - radius * 0.2, py + radius * 0.24);
        ctx.lineTo(px - radius * 0.82, py);
        ctx.lineTo(px - radius * 0.26, py - radius * 0.23);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (element === "fire" && seed > 0.62) {
        const emberX = x + integrated25DHash(gx, gy, 71) * tileSize;
        const emberY = y + integrated25DHash(gx, gy, 73) * tileSize;
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(time * 2 + seed * 9) * 0.08;
        ctx.fillStyle = "#ffb05c";
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = glow(9);
        ctx.beginPath();
        ctx.arc(emberX, emberY, 1.5 + seed * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      decorationCount.tiles++;
      const ruinSeed = integrated25DHash(gx, gy, 83);
      if (ruinSeed > 0.78) {
        const ruinX = x + tileSize * (0.2 + integrated25DHash(gx, gy, 89) * 0.6);
        const ruinY = y + tileSize * (0.2 + integrated25DHash(gx, gy, 97) * 0.6);
        drawIntegrated25DStonePillar(
          ruinX, ruinY, 48 + ruinSeed * 24, theme,
          integrated25DHash(gx, gy, 101),
        );
        decorationCount.ruins++;
      } else if (ruinSeed > 0.59) {
        const ruinX = x + tileSize * (0.2 + integrated25DHash(gx, gy, 103) * 0.6);
        const ruinY = y + tileSize * (0.2 + integrated25DHash(gx, gy, 107) * 0.6);
        const rubbleSize = 23 + ruinSeed * 18;
        ctx.fillStyle = theme.stone[1];
        ctx.strokeStyle = theme.edge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ruinX - rubbleSize, ruinY + rubbleSize * 0.12);
        ctx.lineTo(ruinX - rubbleSize * 0.64, ruinY - rubbleSize * 0.2);
        ctx.lineTo(ruinX - rubbleSize * 0.16, ruinY - rubbleSize * 0.52);
        ctx.lineTo(ruinX + rubbleSize * 0.16, ruinY - rubbleSize * 0.4);
        ctx.lineTo(ruinX + rubbleSize, ruinY + rubbleSize * 0.08);
        ctx.lineTo(ruinX + rubbleSize * 0.7, ruinY + rubbleSize * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        decorationCount.ruins++;
      }

      if (integrated25DHash(gx, gy, 113) > 0.965) {
        const landmarkX = x + tileSize * (0.24 + integrated25DHash(gx, gy, 127) * 0.52);
        const landmarkY = y + tileSize * (0.24 + integrated25DHash(gx, gy, 131) * 0.52);
        drawIntegrated25DStonePillar(landmarkX, landmarkY, 86, theme, 1);
        decorationCount.landmarks++;
      }
    }
  }
  ctx.restore();
  return { element, ...decorationCount };
}

function drawIntegrated25DPlayer(playerState, options) {
  const { moving, time, hit, bodyColor, glowColor, boosted, dash, cosmeticId } = options;
  const gait = moving ? Math.sin(time * 15) : Math.sin(time * 2) * 0.12;
  const turn = Math.atan2(playerState.facingY, playerState.facingX) + Math.PI / 2;
  ctx.save();
  ctx.translate(playerState.x, playerState.y);
  ctx.rotate(turn);

  ctx.fillStyle = "rgba(3, 5, 12, 0.52)";
  ctx.beginPath();
  ctx.ellipse(0, 7, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, dash ? 1 : Math.sin(time * 3) * 0.8);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glow(boosted ? 15 : 6);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = hit ? "#fff" : "#302638";
  ctx.lineWidth = 6;
  for (const side of [-1, 1]) {
    const stride = gait * (side === -1 ? 4 : -4);
    ctx.beginPath();
    ctx.moveTo(side * 5, 4);
    ctx.lineTo(side * 6 + stride, 12);
    ctx.lineTo(side * 6 + stride * 1.3, 17);
    ctx.stroke();
    ctx.fillStyle = hit ? "#fff" : "#11131d";
    ctx.beginPath();
    ctx.ellipse(side * 6 + stride * 1.3, 18, 4.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = hit ? "#fff" : "#33263b";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.lineTo(-13, -2 + gait * 2);
  ctx.moveTo(8, -9);
  ctx.lineTo(13, -2 - gait * 2);
  ctx.stroke();

  ctx.fillStyle = hit ? "#fff" : "#272131";
  ctx.beginPath();
  ctx.moveTo(-11, -16);
  ctx.quadraticCurveTo(-10, -5, -7, 1);
  ctx.lineTo(0, 5);
  ctx.lineTo(7, 1);
  ctx.quadraticCurveTo(10, -5, 11, -16);
  ctx.quadraticCurveTo(0, -22, -11, -16);
  ctx.fill();
  ctx.strokeStyle = hit ? "#fff" : bodyColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.lineTo(0, -9);
  ctx.lineTo(8, -14);
  ctx.stroke();

  ctx.fillStyle = hit ? "#fff" : "#40334a";
  ctx.beginPath();
  ctx.ellipse(0, -20, 7.5, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hit ? "#fff" : "#d7c6a5";
  ctx.beginPath();
  ctx.ellipse(0, -18.5, 4.3, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hit ? "#fff" : glowColor;
  ctx.shadowBlur = glow(8);
  ctx.beginPath();
  ctx.arc(-1.6, -19, 1, 0, Math.PI * 2);
  ctx.arc(1.6, -19, 1, 0, Math.PI * 2);
  ctx.fill();
  if (cosmeticId !== "classic" || boosted) {
    ctx.strokeStyle = boosted ? "#f7ed9e" : glowColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glow(12);
    ctx.beginPath();
    ctx.arc(0, -2, 23 + Math.sin(time * 6) * 1.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function beginIntegrated25DEnemyPose(enemy, time, playerState, scale, shadowY, shadowWidth, shadowHeight) {
  const radius = Math.max(9, enemy.r);
  const facing = Math.atan2(playerState.y - enemy.y, playerState.x - enemy.x) + Math.PI / 2;
  const gait = Math.sin(time * (2.6 + enemy.speed * 0.02) + enemy.x * 0.01);
  const bob = Math.sin(time * 2.8 + enemy.y * 0.008) * (enemy.kind === 5 ? 0.7 : 1.1);
  ctx.save();
  ctx.fillStyle = "rgba(3, 5, 12, 0.5)";
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + radius * shadowY, radius * scale * shadowWidth,
    radius * scale * shadowHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(enemy.x, enemy.y + bob);
  ctx.rotate(facing);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return { radius, gait };
}

function drawIntegrated25DDrifter(enemy, time, playerState) {
  const { radius, gait } = beginIntegrated25DEnemyPose(
    enemy, time, playerState, 1, 0.72, 1.05, 0.4);
  ctx.shadowColor = enemy.hit ? "#fff" : "#8a6e9a";
  ctx.shadowBlur = glow(enemy.hit ? 12 : 6);

  ctx.strokeStyle = enemy.hit ? "#fff" : "#342b3b";
  ctx.lineWidth = Math.max(3, radius * 0.32);
  for (const side of [-1, 1]) {
    const stride = gait * radius * 0.22 * (side === -1 ? 1 : -1);
    ctx.beginPath();
    ctx.moveTo(side * radius * 0.3, radius * 0.35);
    ctx.lineTo(side * radius * 0.42 + stride, radius * 0.84);
    ctx.stroke();
  }
  ctx.strokeStyle = enemy.hit ? "#fff" : "#51404f";
  ctx.lineWidth = Math.max(3, radius * 0.28);
  ctx.beginPath();
  ctx.moveTo(-radius * 0.52, -radius * 0.45);
  ctx.lineTo(-radius * 0.9, radius * 0.05 + gait * radius * 0.12);
  ctx.moveTo(radius * 0.52, -radius * 0.45);
  ctx.lineTo(radius * 0.9, radius * 0.05 - gait * radius * 0.12);
  ctx.stroke();

  ctx.fillStyle = enemy.hit ? "#fff" : "#403447";
  ctx.beginPath();
  ctx.moveTo(-radius * 0.72, -radius * 0.96);
  ctx.quadraticCurveTo(-radius * 0.82, -radius * 0.15, 0, radius * 0.55);
  ctx.quadraticCurveTo(radius * 0.82, -radius * 0.15, radius * 0.72, -radius * 0.96);
  ctx.quadraticCurveTo(0, -radius * 1.38, -radius * 0.72, -radius * 0.96);
  ctx.fill();
  ctx.strokeStyle = enemy.hit ? "#fff" : "#806b84";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.45, -radius * 0.78);
  ctx.lineTo(0, -radius * 0.51);
  ctx.lineTo(radius * 0.45, -radius * 0.78);
  ctx.stroke();

  ctx.fillStyle = enemy.hit ? "#fff" : "#59475d";
  ctx.beginPath();
  ctx.ellipse(0, -radius * 1.12, radius * 0.49, radius * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.hit ? "#fff" : "#f1d8a1";
  ctx.shadowColor = "#e7bb72";
  ctx.shadowBlur = glow(5);
  ctx.beginPath();
  ctx.ellipse(-radius * 0.17, -radius * 1.1, radius * 0.075, radius * 0.11, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.17, -radius * 1.1, radius * 0.075, radius * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawIntegrated25DRankDetails(enemy, level, palette, scale, qualityGlow) {
  const radius = Math.max(9, enemy.r);
  const headFactors = { 0: 1.55, 1: 2.1, 2: 1.55, 4: 1.7, 5: 1.48, 6: 1.55 };
  const markY = enemy.y - radius * scale * headFactors[enemy.kind] - 4;
  ctx.save();
  ctx.translate(enemy.x, markY);
  ctx.fillStyle = palette.light;
  ctx.strokeStyle = palette.trim;
  ctx.shadowColor = palette.trim;
  ctx.shadowBlur = 5 * qualityGlow;
  ctx.lineWidth = 2;

  if (level >= 2) {
    for (const side of [-1, 1]) {
      const baseX = side * radius * 0.48;
      ctx.beginPath();
      ctx.moveTo(baseX, radius * 0.12);
      ctx.lineTo(side * radius * (0.76 + level * 0.08), -radius * 0.42);
      ctx.lineTo(side * radius * 0.62, radius * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  if (level >= 3) {
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.46);
    ctx.lineTo(radius * 0.21, -radius * (0.78 + level * 0.04));
    ctx.lineTo(0, -radius * 0.64);
    ctx.lineTo(-radius * 0.21, -radius * (0.78 + level * 0.04));
    ctx.closePath();
    ctx.fill();
  }
  if (level >= 4) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * radius * 0.24, -radius * 0.48);
      ctx.lineTo(side * radius * 0.5, -radius * 1.05);
      ctx.lineTo(side * radius * 0.12, -radius * 0.73);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawIntegrated25DEnemy(enemy, time, playerState) {
  const palette = integrated25DEnemyPalettes[enemy.kind];
  if (!palette) return;

  const level = Math.max(1, Math.min(4, Math.floor(Number(enemy.evolutionLevel) || 1)));
  const qualityGlow = graphicsQuality === "low" ? 0 : graphicsQuality === "medium" ? 0.65 : 1;
  if (enemy.kind === 0) {
    drawIntegrated25DDrifter(enemy, time, playerState);
    drawIntegrated25DRankDetails(enemy, level, palette, 1, qualityGlow);
    return;
  }

  const radius = Math.max(9, enemy.r);
  const scale = enemy.kind === 1 ? 1.45 : enemy.kind === 4 ? 1.25 : 1;
  const { gait } = beginIntegrated25DEnemyPose(
    enemy, time, playerState, scale, 0.48, 1.5, 0.68);
  const body = enemy.hit ? "#fff" : palette.body;
  const trim = enemy.hit ? "#fff" : palette.trim;

  ctx.shadowColor = enemy.hit ? "#fff" : palette.trim;
  ctx.shadowBlur = 7 * qualityGlow;

  if (enemy.kind === 1) {
    for (const side of [-1, 1]) {
      const step = gait * radius * 0.2 * side;
      drawIntegrated25DLine(side * radius * 0.3, radius * 0.25, side * radius * 0.48 + step, radius * 0.95, trim, radius * 0.24);
      drawIntegrated25DLine(side * radius * 0.35, -radius * 0.35, side * radius * 0.72, radius * 0.08 + step, trim, radius * 0.2);
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.2, radius * 0.66, radius * 1.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#34251f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.52, -radius * 0.95);
    ctx.lineTo(0, -radius * 1.78);
    ctx.lineTo(radius * 0.52, -radius * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 1.06, radius * 0.1, 0, Math.PI * 2);
    ctx.arc(radius * 0.2, -radius * 1.06, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 2) {
    for (const side of [-1, 1]) {
      const step = gait * radius * 0.1 * side;
      drawIntegrated25DLine(side * radius * 0.35, radius * 0.35, side * radius * 0.44 + step, radius * 0.88, "#303b30", radius * 0.3);
      drawIntegrated25DLine(side * radius * 0.66, -radius * 0.62, side * radius * 0.94, -radius * 0.12 + step, trim, radius * 0.3);
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.82, -radius * 0.78);
    ctx.lineTo(-radius * 0.68, -radius * 0.12);
    ctx.lineTo(-radius * 0.48, radius * 0.5);
    ctx.lineTo(radius * 0.48, radius * 0.5);
    ctx.lineTo(radius * 0.68, -radius * 0.12);
    ctx.lineTo(radius * 0.82, -radius * 0.78);
    ctx.lineTo(radius * 0.38, -radius * 1.02);
    ctx.lineTo(-radius * 0.38, -radius * 1.02);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#202a22";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.fillRect(-radius * 0.68, -radius * 0.74, radius * 0.44, radius * 0.42);
    ctx.fillRect(radius * 0.24, -radius * 0.74, radius * 0.44, radius * 0.42);
    ctx.fillStyle = "#59634a";
    ctx.beginPath();
    ctx.ellipse(0, -radius * 1.02, radius * 0.43, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.arc(-radius * 0.16, -radius * 1.03, radius * 0.07, 0, Math.PI * 2);
    ctx.arc(radius * 0.16, -radius * 1.03, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
    drawIntegrated25DLine(0, -radius * 0.48, radius * 0.12, radius * 0.23, "#252d26", 2);
  } else if (enemy.kind === 4) {
    drawIntegrated25DLine(-radius * 0.48, -radius * 0.5, -radius * 0.95, radius * 0.12 + gait * 2, trim, radius * 0.22);
    drawIntegrated25DLine(radius * 0.48, -radius * 0.5, radius * 0.95, radius * 0.12 - gait * 2, trim, radius * 0.22);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, -radius * 0.86);
    ctx.quadraticCurveTo(-radius * 0.88, -radius * 0.15, -radius * 0.94, radius * 0.86);
    ctx.quadraticCurveTo(0, radius * 0.48, radius * 0.94, radius * 0.86);
    ctx.quadraticCurveTo(radius * 0.88, -radius * 0.15, radius * 0.5, -radius * 0.86);
    ctx.quadraticCurveTo(0, -radius * 1.26, -radius * 0.5, -radius * 0.86);
    ctx.fill();
    ctx.strokeStyle = "#202430";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#191d29";
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.88, radius * 0.43, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.shadowColor = palette.light;
    ctx.shadowBlur = 9 * qualityGlow;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.16, -radius * 0.88, radius * 0.09, radius * 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse(radius * 0.16, -radius * 0.88, radius * 0.09, radius * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    drawIntegrated25DLine(0, -radius * 0.42, 0, radius * 0.34, trim, 2);
  } else if (enemy.kind === 5) {
    for (let point = 0; point < 10; point++) {
      const angle = point * Math.PI / 5 + time * 0.22;
      const inner = radius * 0.78;
      const outer = radius * (point % 2 ? 1.12 : 1.48);
      drawIntegrated25DLine(Math.cos(angle) * inner, Math.sin(angle) * inner,
        Math.cos(angle) * outer, Math.sin(angle) * outer, trim, Math.max(2, radius * 0.18));
    }
    for (const side of [-1, 1]) {
      const step = gait * radius * 0.14 * side;
      drawIntegrated25DLine(side * radius * 0.54, radius * 0.45, side * radius * 0.68 + step, radius * 0.88, "#73382f", radius * 0.2);
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#542821";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#241f25";
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.16, radius * 0.5, radius * 0.43, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.shadowColor = palette.light;
    ctx.shadowBlur = 10 * qualityGlow;
    ctx.beginPath();
    ctx.arc(-radius * 0.19, -radius * 0.1, radius * 0.1, 0, Math.PI * 2);
    ctx.arc(radius * 0.19, -radius * 0.1, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb556";
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.68);
    ctx.lineTo(radius * 0.12, -radius * 1.08);
    ctx.lineTo(radius * 0.24, -radius * 0.66);
    ctx.fill();
  } else if (enemy.kind === 6) {
    for (const side of [-1, 1]) {
      const step = gait * radius * 0.08 * side;
      drawIntegrated25DLine(side * radius * 0.3, radius * 0.36, side * radius * 0.38 + step, radius * 0.82, "#263444", radius * 0.28);
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.moveTo(side * radius * 0.47, -radius * 0.78);
      ctx.lineTo(side * radius * 0.92, -radius * 0.56);
      ctx.lineTo(side * radius * 0.85, -radius * 0.03);
      ctx.lineTo(side * radius * 0.48, -radius * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.62, -radius * 0.78);
    ctx.lineTo(radius * 0.62, -radius * 0.78);
    ctx.lineTo(radius * 0.5, radius * 0.42);
    ctx.lineTo(0, radius * 0.66);
    ctx.lineTo(-radius * 0.5, radius * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#1d2b39";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.54);
    ctx.lineTo(radius * 0.34, -radius * 0.04);
    ctx.lineTo(0, radius * 0.27);
    ctx.lineTo(-radius * 0.34, -radius * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1d2937";
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.91, radius * 0.34, radius * 0.33, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.arc(-radius * 0.11, -radius * 0.92, radius * 0.055, 0, Math.PI * 2);
    ctx.arc(radius * 0.11, -radius * 0.92, radius * 0.055, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.shieldActive ? "#7ba8bc" : "#48576a";
    ctx.strokeStyle = enemy.shieldActive ? "#c4efff" : "#8a9eae";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.52, -radius * 0.37);
    ctx.lineTo(0, -radius * 0.67);
    ctx.lineTo(radius * 0.52, -radius * 0.37);
    ctx.lineTo(radius * 0.43, radius * 0.33);
    ctx.lineTo(0, radius * 0.58);
    ctx.lineTo(-radius * 0.43, radius * 0.33);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawIntegrated25DLine(0, -radius * 0.55, 0, radius * 0.43, "#d0e7f2", 1.5);
  }
  ctx.restore();

  drawIntegrated25DRankDetails(enemy, level, palette, scale, qualityGlow);
}

function drawSnowflake(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#d8fbff";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let arm = 0; arm < 6; arm++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -radius);
    ctx.moveTo(0, -radius * 0.55);
    ctx.lineTo(-radius * 0.2, -radius * 0.76);
    ctx.moveTo(0, -radius * 0.55);
    ctx.lineTo(radius * 0.2, -radius * 0.76);
    ctx.stroke();
  }
  ctx.restore();
}

function getBackgroundPaints() {
  const world = window.getVisibleWorld?.() || window.getDominantWorld?.() || "frozen";
  if (backgroundPaintCache?.width === W && backgroundPaintCache?.height === H &&
      backgroundPaintCache.world === world)
    return backgroundPaintCache;
  const theme = window.livingWorldStates?.[world];
  const colors = theme?.background || ["#111017", "#1a1720", "#1a1c22"];
  const backdrop = ctx.createLinearGradient(0, 0, W, H);
  backdrop.addColorStop(0, colors[0]);
  backdrop.addColorStop(0.52, colors[1]);
  backdrop.addColorStop(1, colors[2]);
  const ambient = ctx.createRadialGradient(
    W * 0.5,
    H * 0.48,
    0,
    W * 0.5,
    H * 0.48,
    Math.max(W, H) * 0.72,
  );
  ambient.addColorStop(0, theme?.ambient?.[0] || "rgba(112, 79, 100, 0.12)");
  ambient.addColorStop(0.6, theme?.ambient?.[1] || "rgba(80, 93, 105, 0.07)");
  ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
  backgroundPaintCache = { width: W, height: H, world, backdrop, ambient };
  return backgroundPaintCache;
}

function getAmbientTiles() {
  if (ambientTileCache) return ambientTileCache;
  ambientTileCache = Array.from({ length: 4 }, (_, index) => {
    const tile = document.createElement("canvas");
    tile.width = 256;
    tile.height = 256;
    const tileContext = tile.getContext("2d");
    const center = 86 + index * 29;
    const glow = tileContext.createRadialGradient(
      center,
      142 - index * 18,
      2,
      128,
      128,
      190,
    );
    glow.addColorStop(
      0,
      index % 2 ? "rgba(116,77,101,.19)" : "rgba(92,105,111,.17)",
    );
    glow.addColorStop(1, "rgba(14,13,19,0)");
    tileContext.fillStyle = glow;
    tileContext.fillRect(0, 0, 256, 256);
    for (let mote = 0; mote < 7; mote++) {
      const x = (index * 73 + mote * 97) % 256;
      const y = (index * 41 + mote * 61) % 256;
      tileContext.fillStyle = `rgba(219,197,132,${0.15 + (mote % 3) * 0.08})`;
      tileContext.beginPath();
      tileContext.arc(x, y, 1 + (mote % 2), 0, Math.PI * 2);
      tileContext.fill();
    }
    return tile;
  });
  return ambientTileCache;
}

function draw() {
  const renderStarted = performance.now();
  if (integrated3DRenderer && window.drawIntegrated3DScene) {
    const renderState = {
      player,
      enemies,
      bullets,
      elementalShots,
      enemyShots,
      bossShots,
      gems,
      time,
      dashTimer,
      dashDirectionX,
      dashDirectionY,
      keys,
      selectedCharacter,
      element: currentLivingWorldElement(),
      damageFlash,
      active,
      paused,
      qa: renderQaEnabled,
    };
    const sceneQa = window.drawIntegrated3DScene(renderState);
    if (renderQaEnabled) window.__shadowRenderQA = sceneQa;
    performanceMetrics.render = performance.now() - renderStarted;
    return;
  }
  let visibleDrifterCount = 0;
  let styledDrifterCount = 0;
  const qaDrifters = [];
  let styledEnemyCount = 0;
  const qaStyledEnemies = [];
  const qaVisibleFamilies = [];
  ctx.clearRect(0, 0, W, H);
  const { backdrop, ambient } = getBackgroundPaints();
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, W, H);
  if (!player) {
    performanceMetrics.render = performance.now() - renderStarted;
    return;
  }
  ctx.save();
  const visibleShake = active && !paused ? shake : 0;
  const cameraOffsetX = W / 2 - player.x + rand(-visibleShake, visibleShake);
  const cameraOffsetY = H / 2 - player.y + rand(-visibleShake, visibleShake);
  ctx.translate(cameraOffsetX, cameraOffsetY);

  // Ambient background details.
  const left = player.x - W / 2,
    top = player.y - H / 2,
    fieldStep =
      graphicsQuality === "low"
        ? 1240
        : graphicsQuality === "medium"
          ? 900
          : 620;
  if (!integrated25DRenderer) {
    const ambientTiles = getAmbientTiles();
    // Keep the legacy renderer's nebula pools and drifting motes unchanged.
    for (
      let x = Math.floor(left / fieldStep) * fieldStep;
      x < left + W + fieldStep;
      x += fieldStep
    ) {
      for (
        let y = Math.floor(top / fieldStep) * fieldStep;
        y < top + H + fieldStep;
        y += fieldStep
      ) {
        const seed = Math.abs(Math.sin(x * 0.0017 + y * 0.0023) * 43758.5453) % 1;
        ctx.globalAlpha = 0.72 + seed * 0.28;
        ctx.drawImage(
          ambientTiles[Math.floor(seed * ambientTiles.length)],
          x,
          y,
          fieldStep,
          fieldStep,
        );
        ctx.globalAlpha = 1;

        const moteX = x + ((seed * 13.7) % 1) * fieldStep;
        const moteY = y + ((seed * 31.9) % 1) * fieldStep;
        const twinkle = 0.08 + (Math.sin(time * 0.8 + seed * 30) + 1) * 0.08;
        ctx.fillStyle = `rgba(219, 197, 132, ${twinkle})`;
        ctx.shadowColor = "#a18b56";
        ctx.shadowBlur = glow(2);
        ctx.beginPath();
        ctx.arc(moteX, moteY, 1 + seed * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = glow(0);
      }
    }
  }
  // World terrain belongs below local weapon scars and entities.
  window.drawWorldEnvironment?.(left, top);
  const integratedWorld = integrated25DRenderer
    ? drawIntegrated25DWorld(left, top) : null;
  // Terrain scars live behind characters, enemies, pickups and projectiles.
  window.drawWorldScars?.(left, top);
  if (!boss) window.drawWorldRetaliation?.(ctx, time, graphicsQuality,
    {left,top,width:W,height:H});
  // Cinematic Beau arena effects stay beneath player, projectiles and tells.
  window.drawBeauBackdrop?.(boss, ctx, time, player, graphicsQuality, W, H);
  window.drawShadeBackdrop?.(boss, ctx, time, player, graphicsQuality, W, H);
  window.drawBellBackdrop?.(boss, ctx, time, player, graphicsQuality, W, H);
  window.drawMemeBackdrop?.(boss, ctx, time, player, graphicsQuality, W, H);
  window.drawGuardianArenaPowerBackdrop?.(boss,ctx,time,player,graphicsQuality,W,H);
  // XP and health pickups.
  for (const g of nearbyGems(player.x, player.y, Math.hypot(W, H) * 0.65)) {
    if (!visibleEnemy(g, -30)) continue;
    ctx.fillStyle =
      g.kind === "health"
        ? "#ff526b"
        : g.value >= 20
          ? "#ffc56b"
          : g.value >= 5
            ? "#e48aff"
            : g.value <= 1
              ? "#8ad9a1"
              : "#5be4fa";
    ctx.shadowBlur = glow(7);
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - g.r - 2);
    ctx.lineTo(g.x + g.r, g.y);
    ctx.lineTo(g.x, g.y + g.r + 2);
    ctx.lineTo(g.x - g.r, g.y);
    ctx.fill();
    ctx.shadowBlur = glow(0);
  }

  // Player bombs.
  for (const bomb of bombs) {
    if (!renderEffectVisible(bomb.x,bomb.y,0)) continue;
    const blink = bomb.fuse < 0.35 && Math.sin(time * 38) > 0;
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    if (bombImage.complete && bombImage.naturalWidth > 0) {
      const size = 52 * (1 + Math.max(0, upgrades.bomb - 1) * 0.18);
      const imageWidth = size * 1.386;
      ctx.shadowColor = blink ? "#ff7145" : "#8a6942";
      ctx.shadowBlur = glow(blink ? 16 : 5);
      ctx.drawImage(bombImage, -imageWidth / 2, -size / 2, imageWidth, size);
      if (bomb.evolved) {
        ctx.strokeStyle = "#d6a7ff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#b46dff";
        ctx.shadowBlur = glow(blink ? 26 : 14);
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    ctx.fillStyle = "#211c25";
    ctx.strokeStyle = blink ? "#ffb45f" : "#927451";
    ctx.lineWidth = 2;
    ctx.shadowColor = blink ? "#ff7145" : "#8a6942";
    ctx.shadowBlur = glow(blink ? 16 : 5);
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c89a5a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -9);
    ctx.lineTo(7, -15);
    ctx.stroke();
    ctx.fillStyle = blink ? "#fff1a1" : "#ff9458";
    ctx.beginPath();
    ctx.arc(8, -16, 2, 0, Math.PI * 2);
    ctx.fill();
    if (bomb.evolved) {
      ctx.strokeStyle = "#d6a7ff";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#b46dff";
      ctx.shadowBlur = glow(18);
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Final-boss marked ground strikes remain visible until they actually detonate.
  for (const hazard of bossHazards) {
    if (!renderEffectVisible(hazard.x,hazard.y,hazard.radius))
      continue;
    const pulse = 0.54 + 0.26 * Math.sin(time * 22);
    ctx.save();
    ctx.fillStyle = `rgba(195, 67, 221, ${0.15 + pulse * 0.08})`;
    ctx.strokeStyle = `rgba(255, 151, 237, ${pulse + 0.2})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Enemies and their projectiles.
  for (const e of enemies) {
    if (!visibleEnemy(e, -e.r * 2)) continue;
    if (e.kind === 0) {
      visibleDrifterCount++;
      if (renderQaEnabled) {
        qaDrifters.push({
          worldX: e.x,
          worldY: e.y,
          screenX: e.x + cameraOffsetX,
          screenY: e.y + cameraOffsetY,
        });
      }
    }
    if (renderQaEnabled && Object.hasOwn(integrated25DEnemyPalettes, e.kind)) {
      const family = {
        kind: e.kind,
        familyLevel: Math.max(1, Math.min(4, Math.floor(Number(e.evolutionLevel) || 1))),
        worldX: e.x,
        worldY: e.y,
        screenX: e.x + cameraOffsetX,
        screenY: e.y + cameraOffsetY,
      };
      qaVisibleFamilies.push(family);
      if (integrated25DRenderer) qaStyledEnemies.push(family);
    }
    // Distinct ice crystals / ember crown / water rings around all adapted
    // enemy silhouettes, without extra sprites or high-cost particle systems.
    // Silhouette-shifting evolved forms surround the original recognisable body.
    window.drawEnemyEvolution?.(e,ctx,time,graphicsQuality);
    window.drawEnemyWorldAura?.(e, ctx, time, graphicsQuality);
    window.drawEncounterTactic?.(e,ctx,time,graphicsQuality);
    window.drawWorldDefense?.(e, ctx, time, graphicsQuality);
    window.drawEnemyArchetype?.(e,ctx,time,graphicsQuality);
    window.drawEnemyCounterRole?.(e,ctx,time,graphicsQuality);
    window.drawGuardianWorldWarning?.(e, ctx, time, graphicsQuality === "low");
    window.drawBossCombat?.(e, ctx, time, graphicsQuality);
    window.drawGuardianSecondary?.(e,ctx,time,graphicsQuality);
    window.drawGuardianLateSecondary?.(e,ctx,time,graphicsQuality);
    window.drawBeauTelegraph?.(e, ctx, time, graphicsQuality);
    window.drawShadeTelegraph?.(e, ctx, time, graphicsQuality);
    window.drawBellTelegraph?.(e, ctx, time, graphicsQuality);
    window.drawMemeTelegraph?.(e, ctx, time, graphicsQuality);
    window.drawGuardianArenaPowerWarning?.(e,ctx,time,graphicsQuality);
    if(e===boss)window.drawCombatHudEscape?.(ctx,e,player,time,graphicsQuality);
    if (e.pulseSlowUntil > time) {
      ctx.save();
      ctx.strokeStyle = "rgba(191, 108, 255, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, enemyHitRadius(e) + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (e.frostUntil > time) {
      ctx.save();
      ctx.strokeStyle = "rgba(126, 222, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(e.x, e.y, enemyHitRadius(e) + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (e.burnUntil > time) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 124, 55, 0.85)";
      ctx.shadowColor = "#ff763e";
      ctx.shadowBlur = glow(8);
      ctx.beginPath();
      ctx.arc(
        e.x,
        e.y - enemyHitRadius(e) - 4,
        3 + Math.sin(time * 16 + e.x) * 1.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    // Ranged attack wind-up is aimed and locked before the projectile fires.
    if (e.kind === 4 && e.shotWarning > 0) {
      const angle = e.aimAngle ?? Math.atan2(player.y - e.y, player.x - e.x);
      const spread=e.encounterTactic==="crossfire"
        ? (e.tacticVolleyOffsets||[]) : [];
      const warnProgress=1-Math.min(1,e.shotWarning/.7);
      ctx.save();
      ctx.strokeStyle = "rgba(255, 222, 114, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      for(const offset of [0,...spread]){
        const attackAngle=angle+offset;
        ctx.globalAlpha=offset===0?.95:.52+.3*warnProgress;
        ctx.beginPath();ctx.moveTo(e.x,e.y);
        ctx.lineTo(e.x+Math.cos(attackAngle)*290,
          e.y+Math.sin(attackAngle)*290);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // A radial clock signals when the committed projectile fan fires.
      ctx.globalAlpha=.9;ctx.lineWidth=3;ctx.strokeStyle="#fff4ba";
      ctx.beginPath();ctx.arc(e.x,e.y,e.r+17,-Math.PI/2,
        -Math.PI/2+Math.PI*2*warnProgress);ctx.stroke();
      ctx.restore();
    }
    // Burstlings always telegraph their actual explosion radius.
    if (e.kind === 5 && e.armed && e.burstWarning > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 88, 53, 0.11)";
      ctx.strokeStyle = "rgba(255, 145, 62, 0.92)";
      const progress=1-Math.min(1,e.burstWarning/.95);
      const radius=e.burstRadius||86;
      ctx.lineWidth=3+progress*2;
      ctx.beginPath();ctx.arc(e.x,e.y,radius,0,Math.PI*2);
      ctx.fill();ctx.stroke();
      ctx.strokeStyle="#fff1c7";ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y,radius*(.22+.78*progress),0,Math.PI*2);
      ctx.stroke();
      if(graphicsQuality!=="low"){
        ctx.strokeStyle="#ffb369";ctx.lineWidth=2;
        for(let i=0;i<6;i++){
          const a=i*Math.PI/3;
          ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*(radius-13),
            e.y+Math.sin(a)*(radius-13));
          ctx.lineTo(e.x+Math.cos(a)*radius,e.y+Math.sin(a)*radius);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    // Elite charges lock direction and provide enough warning to dodge.
    if (e.eliteChargeWarning > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 153, 101, 0.84)";
      ctx.lineWidth = 4;
      ctx.setLineDash([11, 8]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(
        e.x + (e.eliteChargeX || 1) * 290,
        e.y + (e.eliteChargeY || 0) * 290,
      );
      ctx.stroke();
      ctx.restore();
    }
    // Avoid an old broad cone painted on top of a real, distinct prepared
    // normal volley: it would falsely mark safe/dangerous ground.
    if (e.kind === 3 && e.shotWarning > 0 &&
        !e.secondaryVolley && !e.lateSecondary) {
      ctx.save();
      const intensity = 0.5 + Math.sin(time * 13) * 0.15;
      ctx.fillStyle = `rgba(250, 75, 105, ${0.08 + intensity * 0.08})`;
      ctx.strokeStyle = "rgba(255, 92, 141, 0.9)";
      ctx.lineWidth = 3.5;
      ctx.setLineDash([12, 7]);
      ctx.beginPath();
      if (e.isFinalBoss) {
        const angle = e.shotAngle || 0;
        const pattern = e.shotPattern || 0;
        if (pattern === 0) {
          // Aimed rift volley; center lane is no longer an automatic safe spot.
          ctx.moveTo(e.x, e.y);
          ctx.arc(e.x, e.y, 295, angle - .86, angle + .86);
          ctx.closePath();
          ctx.fill();
        } else if (pattern === 1) {
          const count =
            (e.finalPhase || 1) === 3
              ? 16
              : (e.finalPhase || 1) === 2
                ? 14
                : 12;
          const gap = ((Math.PI * 2) / count) * 1.35;
          const exit = angle + Math.PI * .72;
          ctx.moveTo(e.x, e.y);
          ctx.arc(e.x, e.y, 185, exit + gap, exit + Math.PI * 2 - gap);
          ctx.closePath();
          ctx.fill();
          // Highlight the extra direct aimed lance.
          ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(angle)*340,e.y+Math.sin(angle)*340);
        } else {
          // This ground target is locked from the first warning frame.
          const size = 104 + (e.finalPhase || 1) * 12;
          ctx.arc(e.warningX, e.warningY, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (e.variant === 1) {
        // The ring's exit is on the SIDE. Warn separately for the
        // central shadow lances aimed at the player's locked position.
        const count = e.phaseThree ? 16 : e.phaseTwo ? 14 : 10;
        const gapHalf = (Math.PI * 2 / count) * 1.18;
        const exit = e.shotAngle + Math.PI * .72;
        ctx.moveTo(e.x, e.y);
        ctx.arc(e.x, e.y, 160, exit + gapHalf, exit + Math.PI * 2 - gapHalf);
        ctx.closePath();
        ctx.fill();
        for(const offset of (e.phaseTwo ? [-.16,0,.16] : [0])){
          const a=e.shotAngle+offset;
          ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(a)*370,e.y+Math.sin(a)*370);
        }
      } else {
        const facing = e.shotAngle || 0;
        const halfCone = e.variant === 2
          ? e.phaseThree ? .77 : e.phaseTwo ? .65 : .46
          : e.phaseThree ? .7 : e.phaseTwo ? .55 : .38;
        ctx.moveTo(e.x, e.y);
        ctx.arc(
          e.x,
          e.y,
          e.variant === 2 ? 285 : 270,
          facing - halfCone,
          facing + halfCone,
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    }
    if (e.kind === 3 && e.phaseIntro > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(246, 170, 255, 0.95)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(
        e.x,
        e.y,
        e.r * (1.5 + Math.sin(time * 14) * 0.12),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    if (e.kind === 3 && e.chargeWarning > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 95, 145, ${0.35 + Math.sin(time * 28) * 0.22})`;
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + e.chargeX * 520, e.y + e.chargeY * 520);
      ctx.stroke();
      ctx.restore();
    }
    if (e.elite) {
      const auraRadius =
        e.r + (e.kind === 2 ? e.r * 0.55 : e.kind === 3 ? e.r * 1.4 : 0) + 7;
      ctx.save();
      ctx.strokeStyle = "rgba(190, 148, 255, 0.88)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#b58aff";
      ctx.shadowBlur = glow(13);
      ctx.beginPath();
      ctx.arc(
        e.x,
        e.y,
        auraRadius + Math.sin(time * 5 + e.x) * 2,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }

    if (e.isFinalBoss) {
      // Distinct Canvas placeholder until a custom final-boss meme asset is provided.
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(Math.sin(time * 0.72) * 0.075);
      ctx.shadowColor = e.hit ? "#fff8ff" : "#d75aff";
      ctx.shadowBlur = glow(32);
      ctx.fillStyle = e.hit ? "#ffffff" : "#33204e";
      ctx.strokeStyle = "#d38eff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.25);
      ctx.lineTo(e.r * 0.76, -e.r * 0.6);
      ctx.lineTo(e.r * 0.9, e.r * 0.72);
      ctx.lineTo(0, e.r * 1.1);
      ctx.lineTo(-e.r * 0.9, e.r * 0.72);
      ctx.lineTo(-e.r * 0.76, -e.r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f9b5ff";
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.64, -e.r * 1.09);
      ctx.lineTo(-e.r * 0.35, -e.r * 1.55);
      ctx.lineTo(0, -e.r * 1.18);
      ctx.lineTo(e.r * 0.35, -e.r * 1.55);
      ctx.lineTo(e.r * 0.64, -e.r * 1.09);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = glow(20);
      ctx.fillStyle = "#fff4ff";
      ctx.beginPath();
      ctx.ellipse(
        -e.r * 0.28,
        -e.r * 0.19,
        e.r * 0.13,
        e.r * 0.18,
        -0.12,
        0,
        Math.PI * 2,
      );
      ctx.ellipse(
        e.r * 0.28,
        -e.r * 0.19,
        e.r * 0.13,
        e.r * 0.18,
        0.12,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "#34103c";
      ctx.beginPath();
      ctx.arc(-e.r * 0.26, -e.r * 0.16, 3, 0, Math.PI * 2);
      ctx.arc(e.r * 0.26, -e.r * 0.16, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Rotating satellites signal each higher phase without extra entities.
      const satellites = (e.finalPhase || 1) + 1;
      ctx.save();
      ctx.fillStyle = "#e9b3ff";
      ctx.shadowColor = "#cf6aff";
      ctx.shadowBlur = glow(15);
      for (let i = 0; i < satellites; i++) {
        const angle = (i * Math.PI * 2) / satellites + time * 0.8;
        ctx.beginPath();
        ctx.arc(
          e.x + Math.cos(angle) * e.r * 1.45,
          e.y + Math.sin(angle) * e.r * 1.45,
          5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.restore();
      continue;
    }
    if (integrated25DRenderer && Object.hasOwn(integrated25DEnemyPalettes, e.kind)) {
      drawIntegrated25DEnemy(e, time, player);
      styledEnemyCount++;
      if (e.kind === 0) styledDrifterCount++;
      continue;
    }
    if (
      e.kind === 2 &&
      redEnemyImage.complete &&
      redEnemyImage.naturalWidth > 0
    ) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const imageHeight = e.r * 2;
      const imageWidth =
        imageHeight *
        (redEnemyImage.naturalWidth / redEnemyImage.naturalHeight);
      ctx.shadowBlur = glow(8);
      ctx.shadowColor = e.hit ? "#fff" : "#91b84c";
      ctx.drawImage(
        redEnemyImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight,
      );
      ctx.restore();
      continue;
    }
    if (
      e.kind === 3 &&
      e.variant === 0 &&
      bossImage.complete &&
      bossImage.naturalWidth > 0
    ) {
      const imageHeight = e.r * 2.8;
      const imageWidth =
        imageHeight * (bossImage.naturalWidth / bossImage.naturalHeight);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(e.facing || 1, 1);
      ctx.shadowBlur = glow(22);
      ctx.shadowColor = e.hit ? "#fff" : "#c36aff";
      ctx.drawImage(
        bossImage,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight,
      );
      ctx.restore();
      continue;
    }
    // Additional enemy types receive their own clear silhouettes.
    if (e.kind === 5) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(time * 1.5);
      ctx.shadowColor = e.armed ? "#ff413e" : "#ff9b42";
      ctx.shadowBlur = glow(e.armed ? 19 : 8);
      ctx.fillStyle = e.armed ? "#ff615d" : "#e78d46";
      ctx.strokeStyle = "#66331f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const radius = e.r * (i % 2 ? 0.7 : 1.35);
        if (i === 0)
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffecc0";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    if (e.kind === 6) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = e.hit ? "#ffffff" : "#667a94";
      ctx.strokeStyle = e.shieldActive ? "#8be9fa" : "#48536c";
      ctx.lineWidth = e.shieldActive ? 5 : 2;
      ctx.shadowColor = e.shieldActive ? "#62d9ff" : "#596d8c";
      ctx.shadowBlur = glow(e.shieldActive ? 15 : 5);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const px = Math.cos(angle) * e.r,
          py = Math.sin(angle) * e.r;
        if (!i) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Distinct 16-angle shield, always locked to the PLAYER rather than
      // the enemy's walking direction. Draw the arc on its actual blocking side.
      ctx.save();
      const shieldHeading=window.enemyShieldFacing16?.(e,player) ??
        Math.atan2(player.y-e.y,player.x-e.x);
      ctx.rotate(shieldHeading);
      ctx.fillStyle=e.shieldActive?"rgba(115,236,255,.16)":"rgba(100,111,139,.10)";
      ctx.strokeStyle=e.shieldActive?"#b5f8ff":"#60728a";
      ctx.lineWidth=e.shieldActive?6:3;
      ctx.beginPath();
      ctx.arc(0,0,e.r+10,-.88,.88);
      ctx.lineTo(Math.cos(.88)*(e.r+2),Math.sin(.88)*(e.r+2));
      ctx.arc(0,0,e.r+2,.88,-.88,true);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle="#d5eeff";
      ctx.fillRect(e.r+6,-4,11,8);
      ctx.restore();
      ctx.restore();
      continue;
    }
    // Only Beau de Hond uses the original dog sprite.
    if (e.kind === 3 && e.variant !== 0) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.shadowBlur = glow(22);
      if (e.variant === 1) {
        ctx.fillStyle = e.hit ? "#fff" : "#4a315c";
        ctx.shadowColor = "#b674ff";
        ctx.beginPath();
        ctx.moveTo(0, -e.r * 1.6);
        ctx.bezierCurveTo(
          e.r * 1.2,
          -e.r * 1.3,
          e.r * 1.35,
          e.r * 0.35,
          e.r * 0.78,
          e.r * 1.2,
        );
        ctx.lineTo(0, e.r * 0.8);
        ctx.lineTo(-e.r * 0.78, e.r * 1.2);
        ctx.bezierCurveTo(
          -e.r * 1.35,
          e.r * 0.35,
          -e.r * 1.2,
          -e.r * 1.3,
          0,
          -e.r * 1.6,
        );
        ctx.fill();
        ctx.fillStyle = "#d2aaff";
        ctx.beginPath();
        ctx.ellipse(-e.r * 0.33, -e.r * 0.3, 5, 9, -0.2, 0, Math.PI * 2);
        ctx.ellipse(e.r * 0.33, -e.r * 0.3, 5, 9, 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = e.hit ? "#fff" : "#8d7580";
        ctx.shadowColor = "#e8b987";
        ctx.fillRect(-e.r * 0.58, -e.r * 1.3, e.r * 1.16, e.r * 2.25);
        ctx.fillStyle = "#e2b988";
        ctx.beginPath();
        ctx.arc(0, e.r * 0.3, e.r * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3e2a40";
        ctx.beginPath();
        ctx.arc(0, e.r * 0.72, e.r * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#eac99b";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-e.r * 0.73, -e.r * 1.3);
        ctx.lineTo(e.r * 0.73, -e.r * 1.3);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    const bodyColor = e.hit
      ? "#fff"
      : e.kind === 4
        ? "#77715b"
        : e.kind === 2
          ? "#805247"
          : e.kind === 1
            ? "#b28b56"
            : "#66535f";
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.kind === 3) ctx.scale(1.4, 1.4);
    if (e.kind === 4) ctx.scale(1.6, 1.6);
    if (e.kind === 1) ctx.rotate(Math.atan2(player.y - e.y, player.x - e.x));
    ctx.shadowColor =
      e.kind === 4
        ? "#988a57"
        : e.kind === 2
          ? "#8b5547"
          : e.kind === 1
            ? "#9f824e"
            : "#79617a";
    ctx.shadowBlur = glow(e.kind === 4 ? 6 : e.kind === 2 ? 7 : 4);
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle =
      e.kind === 4
        ? "#373329"
        : e.kind === 2
          ? "#3e2b2c"
          : e.kind === 1
            ? "#4f4132"
            : "#352d3c";
    ctx.lineWidth = e.kind === 2 ? 3 : 2;
    ctx.beginPath();
    if (e.kind === 4) {
      ctx.moveTo(0, -e.r * 1.3);
      ctx.quadraticCurveTo(e.r * 1.2, -e.r * 0.8, e.r * 0.82, e.r * 0.65);
      ctx.lineTo(0, e.r * 1.1);
      ctx.lineTo(-e.r * 0.82, e.r * 0.65);
      ctx.quadraticCurveTo(-e.r * 1.2, -e.r * 0.8, 0, -e.r * 1.3);
    } else if (e.kind === 1) {
      ctx.moveTo(e.r * 1.5, 0);
      ctx.lineTo(-e.r * 0.65, -e.r * 0.82);
      ctx.lineTo(-e.r * 0.3, 0);
      ctx.lineTo(-e.r * 0.65, e.r * 0.82);
    } else {
      const points = e.kind === 2 ? 12 : 9;
      for (let i = 0; i < points; i++) {
        const angle = (i * Math.PI * 2) / points - Math.PI / 2;
        const wobble = i % 3 === 0 ? 1.08 : i % 2 === 0 ? 0.9 : 1;
        const radius = e.r * (e.kind === 2 && i % 2 === 0 ? 1.12 : wobble);
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = glow(0);
    if (e.kind === 4) {
      ctx.fillStyle = "#d7c27b";
      ctx.shadowColor = "#e5ca70";
      ctx.shadowBlur = glow(5);
      ctx.beginPath();
      ctx.ellipse(-4, -2, 3.2, 4.3, -0.15, 0, Math.PI * 2);
      ctx.ellipse(4, -2, 3.2, 4.3, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#342d24";
      ctx.beginPath();
      ctx.arc(-4, -1, 1.5, 0, Math.PI * 2);
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 2) {
      ctx.strokeStyle = "rgba(226, 175, 135, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f1d795";
      ctx.beginPath();
      ctx.arc(-e.r * 0.26, -e.r * 0.08, 2.5, 0, Math.PI * 2);
      ctx.arc(e.r * 0.26, -e.r * 0.08, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 1) {
      ctx.fillStyle = "#382c24";
      ctx.beginPath();
      ctx.arc(e.r * 0.28, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#f2e3bd";
      ctx.shadowColor = "#dfc782";
      ctx.shadowBlur = glow(3);
      ctx.beginPath();
      ctx.arc(-e.r * 0.28, -e.r * 0.1, e.r * 0.17, 0, Math.PI * 2);
      ctx.arc(e.r * 0.28, -e.r * 0.22, e.r * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#30262a";
      ctx.beginPath();
      ctx.arc(-e.r * 0.23, -e.r * 0.06, e.r * 0.065, 0, Math.PI * 2);
      ctx.arc(e.r * 0.31, -e.r * 0.2, e.r * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#392a31";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, e.r * 0.28, e.r * 0.18, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }
  window.drawHitFeedback?.(ctx,time,graphicsQuality);
  for (const b of bossShots) {
    if (!visibleEnemy(b, -b.r * 2)) continue;
    if (
      b.visualType === "fish" &&
      fishBulletImage.complete &&
      fishBulletImage.naturalWidth > 0
    ) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.drawImage(fishBulletImage, -28, -28, 56, 56);
      ctx.restore();
    } else {
      ctx.fillStyle = b.visualType === "bell" ? "#ffd58b" : "#ad79f0";
      ctx.shadowColor = b.visualType === "bell" ? "#e9b15a" : "#8a4dd6";
      ctx.shadowBlur = glow(12);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? b.r * 1.4 : b.r * 0.55;
        const x = b.x + Math.cos(angle) * radius;
        const y = b.y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = glow(0);
    }
  }
  for (const shot of enemyShots) {
    if (!visibleEnemy(shot, -shot.r * 2)) continue;
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.shadowColor = "#f4d36e";
    ctx.shadowBlur = glow(18);
    ctx.fillStyle = "rgba(247, 213, 112, 0.4)";
    ctx.beginPath();
    ctx.arc(0, 0, shot.r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe88b";
    ctx.beginPath();
    ctx.arc(0, 0, shot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff8ce";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, shot.r * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Brief lightning links and cone-shaped flame bursts.
  for (const zone of frostZones) {
    if(!renderEffectVisible(zone.x,zone.y,zone.radius))continue;
    ctx.save();
    ctx.globalAlpha = Math.min(0.55, zone.life / 2);
    ctx.fillStyle = zone.evolved
      ? "rgba(144, 226, 255, 0.16)"
      : "rgba(102, 207, 255, 0.12)";
    ctx.strokeStyle = zone.evolved
      ? "rgba(224, 251, 255, 0.94)"
      : "rgba(143, 233, 255, 0.8)";
    ctx.lineWidth = zone.evolved ? 3 : 2;
    ctx.beginPath();
    if (zone.evolved) {
      for (let side = 0; side < 8; side++) {
        const angle = (side * Math.PI) / 4 + time * 0.14;
        const x = zone.x + Math.cos(angle) * zone.radius;
        const y = zone.y + Math.sin(angle) * zone.radius;
        if (side === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (zone.evolved) drawSnowflake(zone.x, zone.y, zone.radius * 0.23);
    ctx.restore();
  }
  for (const segment of lightningSegments) {
    if(!renderSegmentVisible(segment.x1,segment.y1,segment.x2,segment.y2))continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, segment.life / 0.24);
    ctx.strokeStyle = segment.evolved ? "#e5a8ff" : "#9cecff";
    ctx.lineWidth = segment.evolved ? 5 : 4;
    ctx.shadowColor = segment.evolved ? "#c35cff" : "#69bfff";
    ctx.shadowBlur = glow(segment.evolved ? 25 : 18);
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(
      (segment.x1 + segment.x2) / 2 + Math.sin(time * 70 + segment.y1) * 12,
      (segment.y1 + segment.y2) / 2 + Math.cos(time * 66 + segment.x1) * 12,
    );
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
    if (segment.evolved) {
      const midX = (segment.x1 + segment.x2) / 2;
      const midY = (segment.y1 + segment.y2) / 2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + Math.sin(time * 18 + segment.y1) * 30, midY - 34);
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX - Math.cos(time * 15 + segment.x1) * 28, midY + 31);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const burst of flameBursts) {
    if(!renderEffectVisible(burst.x,burst.y,burst.radius*1.1))continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, burst.life / 0.42);
    ctx.fillStyle = burst.evolved
      ? "rgba(255, 62, 71, 0.32)"
      : "rgba(255, 105, 55, 0.28)";
    ctx.strokeStyle = burst.evolved ? "#ffb4a3" : "#ffc17e";
    ctx.lineWidth = 3;
    ctx.shadowColor = burst.evolved ? "#ff334e" : "#ff6b3d";
    ctx.shadowBlur = glow(burst.evolved ? 30 : 22);
    for (let lobe = 0; lobe < burst.lobes; lobe++) {
      const offset = burst.evolved ? (lobe - 1) * 0.34 : 0;
      ctx.beginPath();
      ctx.moveTo(burst.x, burst.y);
      ctx.arc(
        burst.x,
        burst.y,
        burst.radius * (lobe === 1 && burst.evolved ? 1.08 : 1),
        burst.angle + offset - burst.spread / 2.7,
        burst.angle + offset + burst.spread / 2.7,
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Player weapons and area effects.
  for (const b of bullets) {
    if (!visibleEnemy(b, -b.r * 3)) continue;
    if (b.type === "split") {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.shadowColor = "#70f6ff";
      ctx.shadowBlur = glow(24);
      ctx.fillStyle = "rgba(89, 240, 255, 0.42)";
      ctx.beginPath();
      ctx.moveTo(b.r * 2.1, 0);
      ctx.lineTo(-b.r * 1.5, -b.r);
      ctx.lineTo(-b.r * 0.2, 0);
      ctx.lineTo(-b.r * 1.5, b.r);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#dcffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      continue;
    }
    if (b.type === "fish") {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      if (fishBulletImage.complete && fishBulletImage.naturalWidth > 0) {
        ctx.drawImage(fishBulletImage, -19, -19, 38, 38);
      } else {
        ctx.fillStyle = "#ffb7a0";
        ctx.shadowColor = "#ffbe8a";
        ctx.shadowBlur = glow(10);
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(-17, -8);
        ctx.lineTo(-17, 8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      continue;
    }
    if (b.type === "boomerang") {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.strokeStyle = b.evolved ? "#79f5e3" : "#d8caff";
      ctx.lineWidth = b.evolved ? 6 : 4;
      ctx.lineCap = "round";
      ctx.shadowColor = b.evolved ? "#32ead4" : "#a78bfa";
      ctx.shadowBlur = glow(b.evolved ? 25 : 14);
      ctx.beginPath();
      ctx.arc(0, 0, b.r, -0.85, 0.85);
      ctx.stroke();
      if (b.evolved) {
        ctx.rotate(Math.sin(time * 7 + b.x) * 0.45);
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.68, 1.2, 4.4);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if (b.type === "frost") {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.shadowColor = b.evolved ? "#e7fbff" : "#72e4ff";
      ctx.shadowBlur = glow(b.evolved ? 28 : 19);
      ctx.fillStyle = b.evolved
        ? "rgba(202, 246, 255, 0.52)"
        : "rgba(111, 218, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      if (b.evolved) drawSnowflake(0, 0, b.r * 1.45);
      ctx.fillStyle = "#dcf8ff";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    if (b.type === "orb") {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.shadowColor = "#d2a4ff";
      ctx.shadowBlur = glow(14);
      ctx.fillStyle = "rgba(95, 49, 140, 0.36)";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d0a4e8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#f0d5ff";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.shadowColor = "#9d88ff";
    ctx.shadowBlur = glow(15);
    const trail = ctx.createLinearGradient(-b.r * 4, 0, b.r, 0);
    trail.addColorStop(0, "rgba(126, 113, 255, 0)");
    trail.addColorStop(1, "rgba(173, 160, 255, 0.8)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(b.r * 1.8, 0);
    ctx.lineTo(-b.r * 3.8, -b.r * 0.42);
    ctx.lineTo(-b.r * 2.5, 0);
    ctx.lineTo(-b.r * 3.8, b.r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e4e0ff";
    ctx.beginPath();
    ctx.moveTo(b.r * 1.5, 0);
    ctx.lineTo(-b.r * 0.35, -b.r * 0.8);
    ctx.lineTo(-b.r * 0.8, 0);
    ctx.lineTo(-b.r * 0.35, b.r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawElementalCombat();
  // Update 20: purely visual elemental accents; no combat state is mutated.
  window.drawWeaponVfx?.(ctx, {
    time, quality: graphicsQuality, player,
    view: { left, top, width: W, height: H },
    shots: elementalShots, areas: elementalAreas,
    flames: flameBursts, frostOrbs: bullets, frostZones,
    orbits: fireOrbitPositions(),
  });
  if (upgrades.orbit)
    for (let i = 0; i < upgrades.orbit; i++) {
      let a = orbitAngle + (i * Math.PI * 2) / upgrades.orbit;
      ctx.save();
      ctx.translate(player.x + Math.cos(a) * 67, player.y + Math.sin(a) * 67);
      ctx.rotate(a);
      ctx.scale(bladeScale(), bladeScale());
      ctx.fillStyle = evolutions.aegisRing ? "#bafcff" : "#e2ccff";
      ctx.shadowColor = evolutions.aegisRing ? "#36f0ef" : "#aa77ff";
      ctx.shadowBlur = glow(evolutions.aegisRing ? 29 : 17);
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-7, -9);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-7, 9);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = glow(0);
    }
  if (evolutions.aegisRing) {
    ctx.save();
    ctx.strokeStyle = "rgba(92, 247, 239, 0.66)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#36f0ef";
    ctx.shadowBlur = glow(20);
    ctx.beginPath();
    ctx.arc(player.x, player.y, 67, time * 0.7, time * 0.7 + Math.PI * 1.86);
    ctx.stroke();
    ctx.restore();
  }
  if (upgrades.nova) {
    const pulse = novaFlash > 0;
    const echo = novaEchoFlash > 0;
    ctx.save();
    ctx.strokeStyle = evolutions.eclipse
      ? pulse || echo
        ? "rgba(217,132,255,.95)"
        : "rgba(154,71,219,.4)"
      : pulse
        ? "rgba(180,152,245,.52)"
        : "rgba(175,108,255,.17)";
    ctx.lineWidth = pulse || echo ? 5 : 2;
    ctx.shadowColor = evolutions.eclipse ? "#ba4cf5" : "#9778c7";
    ctx.shadowBlur = glow(evolutions.eclipse ? 14 : 0);
    ctx.beginPath();
    ctx.arc(player.x, player.y, novaRadius(), 0, Math.PI * 2);
    ctx.stroke();
    if (evolutions.eclipse) {
      ctx.strokeStyle = echo ? "rgba(248,203,255,.95)" : "rgba(141,70,185,.45)";
      ctx.lineWidth = echo ? 5 : 2;
      ctx.beginPath();
      ctx.arc(
        player.x,
        player.y,
        novaRadius() * (echo ? 0.67 : 0.58),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const explosion of explosions) {
    if(!renderEffectVisible(explosion.x,explosion.y,explosion.radius))continue;
    const progress = 1 - explosion.life / explosion.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.fillStyle = explosion.aftershock
      ? "rgba(230, 169, 255, 0.22)"
      : explosion.evolved
        ? "rgba(182, 95, 255, 0.32)"
        : "rgba(231, 145, 74, 0.25)";
    ctx.strokeStyle = explosion.evolved ? "#e3bdff" : "#ffd18a";
    ctx.lineWidth = 5 * (1 - progress) + 1;
    ctx.shadowColor = explosion.evolved ? "#a44cff" : "#ff9b4d";
    ctx.shadowBlur = glow(explosion.evolved ? 38 : 25);
    ctx.beginPath();
    ctx.arc(
      explosion.x,
      explosion.y,
      explosion.radius * progress,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
    if (explosion.evolved) {
      ctx.lineWidth = 3;
      for (let ray = 0; ray < 12; ray++) {
        const angle = (ray * Math.PI) / 6 + time * 0.18;
        ctx.beginPath();
        ctx.moveTo(
          explosion.x + Math.cos(angle) * explosion.radius * progress * 0.45,
          explosion.y + Math.sin(angle) * explosion.radius * progress * 0.45,
        );
        ctx.lineTo(
          explosion.x + Math.cos(angle) * explosion.radius * progress,
          explosion.y + Math.sin(angle) * explosion.radius * progress,
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Render dash footprints beneath the character; Low quality keeps it cheap.
  window.drawPlayerMovement?.(ctx,time,graphicsQuality);
  // Player, particles, and floating damage values.
  const flashing = player.inv > 0 && Math.floor(time * 20) % 2;

  if (dashTimer > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(117, 244, 238, 0.72)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.shadowColor = "#75f4ee";
    ctx.shadowBlur = glow(18);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 3);
    ctx.lineTo(
      player.x - dashDirectionX * 44,
      player.y - dashDirectionY * 44 + 3,
    );
    ctx.stroke();
    ctx.restore();
  }
  {
    const moving =
      keys.d ||
      keys.a ||
      keys.w ||
      keys.s ||
      keys.ArrowRight ||
      keys.ArrowLeft ||
      keys.ArrowUp ||
      keys.ArrowDown;
    const swing = moving ? Math.sin(time * 15) * 4 : 0;
    const cosmetic =
      cosmeticCatalog.find(
        (entry) => entry.id === metaProgress.selectedCosmetic,
      ) || cosmeticCatalog[0];
    const character = getCharacter(selectedCharacter);
    const bodyColor = flashing
      ? "#fff"
      : cosmetic.id === "classic"
        ? character.accent
        : cosmetic.color;
    if (integrated25DRenderer) {
      drawIntegrated25DPlayer(player, {
        moving,
        time,
        hit: !!flashing,
        bodyColor,
        glowColor: cosmetic.glow,
        boosted: characterRuntime.activeBoost > 0,
        dash: dashTimer > 0,
        cosmeticId: cosmetic.id,
      });
    } else {
      ctx.save();
      ctx.translate(player.x, player.y);
      const art =
        selectedCharacter === "zombieMike"
          ? redEnemyImage
          : selectedCharacter === "beau"
            ? bossImage
            : selectedCharacter === "mayoMaster"
              ? mayoCharacterImage
              : null;
      if (art && art.complete && art.naturalWidth > 0) {
        ctx.shadowColor = cosmetic.glow;
        ctx.shadowBlur = glow(characterRuntime.activeBoost > 0 ? 20 : 9);

        // Beau kijkt naar links wanneer hij naar links loopt.
        if (selectedCharacter === "beau" && player.facingX < 0) {
          ctx.scale(-1, 1);
        }

        ctx.drawImage(art, -22, -24 + swing * 0.2, 44, 45);
      } else {
        ctx.strokeStyle = bodyColor;
        ctx.fillStyle = bodyColor;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.shadowColor = cosmetic.glow;
        ctx.shadowBlur = glow(characterRuntime.activeBoost > 0 ? 17 : 5);
        ctx.beginPath();
        ctx.arc(0, -11, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 5);
        ctx.moveTo(-1, -2);
        ctx.lineTo(-8, swing);
        ctx.moveTo(1, -2);
        ctx.lineTo(8, -swing);
        ctx.moveTo(0, 5);
        ctx.lineTo(-6, 13 + swing * 0.5);
        ctx.moveTo(0, 5);
        ctx.lineTo(6, 13 - swing * 0.5);
        ctx.stroke();
      }
      // Cosmetics are visual only, and temporary character procs are recognizable.
      if (cosmetic.id !== "classic" || characterRuntime.activeBoost > 0) {
        ctx.strokeStyle =
          characterRuntime.activeBoost > 0 ? "#f7ed9e" : cosmetic.glow;
        ctx.lineWidth = 2;
        ctx.shadowColor = cosmetic.glow;
        ctx.shadowBlur = glow(12);
        ctx.beginPath();
        ctx.arc(0, -2, 23 + Math.sin(time * 6) * 1.7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  for (const p of particles) {
    if (
      Math.abs(p.x - player.x) > W / 2 + 40 ||
      Math.abs(p.y - player.y) > H / 2 + 40
    )
      continue;
    ctx.globalAlpha = Math.min(1, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.r, p.r);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  for (const t of texts) {
    if (
      Math.abs(t.x - player.x) > W / 2 + 40 ||
      Math.abs(t.y - player.y) > H / 2 + 40
    )
      continue;
    ctx.globalAlpha = Math.min(1, t.life * (t.critical ? 1.55 : 2));
    ctx.font=t.critical?"900 20px system-ui":t.heavy?"800 16px system-ui":"bold 13px system-ui";
    ctx.fillStyle = t.color || "#fff1ba";
    if(t.critical && graphicsQuality!=="low"){
      ctx.shadowColor="#ffdb64";
      ctx.shadowBlur=glow(12);
    }
    ctx.fillText(t.n, t.x, t.y);
    ctx.shadowBlur=0;
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (boss?.isFinalBoss && boss.finalIntro > 0 && active) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, boss.finalIntro / 0.55);
    ctx.fillStyle = "rgba(31, 8, 47, 0.66)";
    ctx.fillRect(0, H * 0.28, W, 105);
    ctx.textAlign = "center";
    ctx.shadowColor = "#de66ff";
    ctx.shadowBlur = glow(19);
    ctx.fillStyle = "#ffe4ff";
    ctx.font = "900 32px system-ui";
    ctx.fillText("THE LAST MEME", W / 2, H * 0.28 + 49);
    ctx.shadowBlur = glow(0);
    ctx.font = "700 15px system-ui";
    ctx.fillText(
      "FINAL BOSS · DEFEAT IT TO UNLOCK ENDLESS",
      W / 2,
      H * 0.28 + 77,
    );
    ctx.restore();
  }
  if (evolutionFlash && time < evolutionFlash.until) {
    const age = time - evolutionFlash.started;
    const radius = 38 + age * 210;
    const alpha = Math.max(0, 1 - age / 2.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffe896";
    ctx.lineWidth = 5;
    ctx.shadowColor = "#ffcf5a";
    ctx.shadowBlur = glow(24);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 220, 126, 0.09)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.font = "900 26px system-ui";
    ctx.fillStyle = "#fff1b8";
    ctx.fillText(`EVOLVED · ${evolutionFlash.name}`, W / 2, H / 2 - 74);
    ctx.restore();
  }
  if (damageFlash > 0) {
    ctx.fillStyle = `rgba(255,32,75,${(0.32 * damageFlash) / 0.55})`;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(255,70,90,${damageFlash / 0.55})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, W, H);
  }
  ctx.fillStyle = getVignettePaint();
  ctx.fillRect(0, 0, W, H);
  if (renderQaEnabled) {
    window.__shadowRenderQA = {
      mode: integrated25DRenderer ? "2.5d" : "legacy",
      worldTheme: integratedWorld?.element || null,
      worldTiles: integratedWorld?.tiles || 0,
      worldRuins: integratedWorld?.ruins || 0,
      worldLandmarks: integratedWorld?.landmarks || 0,
      worldCameraX: player.x,
      worldCameraY: player.y,
      playerStyle: integrated25DRenderer ? "2.5d" : "legacy",
      playerWorldX: player.x,
      playerWorldY: player.y,
      playerScreenX: player.x + cameraOffsetX,
      playerScreenY: player.y + cameraOffsetY,
      visibleDrifterCount,
      styledDrifterCount,
      styledEnemyCount,
      styledEnemies: qaStyledEnemies,
      visibleFamilies: qaVisibleFamilies,
      drifters: qaDrifters,
      dashActive: dashTimer > 0,
    };
  }
  performanceMetrics.render = performance.now() - renderStarted;
}
