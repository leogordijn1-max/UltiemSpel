// Update 20 — cosmetic-only elemental weapon VFX. No combat or RNG mutations.
// All details are deterministic, viewport-culled, quality-scaled and capped.
(() => {
  "use strict";
  const TAU = Math.PI * 2;
  const TYPES = Object.freeze([
    "flame", "fireball", "flameOrbit",
    "waterBolt", "tidalWave", "whirlpool",
    "frost", "iceShards", "glacialPulse"
  ]);
  const TYPES_SET = new Set(TYPES);
  const MAX_IMPACTS = 28;
  let impacts = [];

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }
  function reset() { impacts = []; }
  function impact(type, x, y, start) {
    if (!TYPES_SET.has(type) || ![x, y, start].every(Number.isFinite)) return false;
    impacts = impacts.filter(e => start >= e.start && start - e.start < 0.65);
    if (impacts.length >= MAX_IMPACTS) impacts.shift();
    impacts.push({ type, x, y, start });
    return true;
  }
  function qualityLevel(value) {
    return value === "low" ? 0 : value === "medium" ? 1 : 2;
  }
  function visible(x, y, view, padding = 125) {
    return Number.isFinite(x) && Number.isFinite(y) &&
      x >= view.left - padding && x <= view.left + view.width + padding &&
      y >= view.top - padding && y <= view.top + view.height + padding;
  }
  function ring(ctx, x, y, r, color, alpha = 0.75, width = 2) {
    if (!(r > 0)) return;
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(alpha, 0, 0.9);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
  }
  function spike(ctx, x, y, angle, size, color, width = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * size * 0.25, y + Math.sin(angle) * size * 0.25);
    ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.stroke();
  }
  function crystal(ctx, x, y, size, angle, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.3, -size * 0.44);
    ctx.lineTo(-size * 0.9, 0);
    ctx.lineTo(-size * 0.3, size * 0.44);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(-size * 0.9, 0); ctx.stroke();
    ctx.restore();
  }
  function drawShot(ctx, shot, now, detail) {
    const angle = Math.atan2(shot.vy, shot.vx);
    const radius = clamp(shot.r || 7, 2, 25);
    ctx.save();
    ctx.translate(shot.x, shot.y); ctx.rotate(angle);
    ctx.lineCap = "round";
    if (shot.type === "fireball") {
      // Layered backwards ember tail and a hot, sharp centre.
      ctx.strokeStyle = "#ff7835"; ctx.lineWidth = radius * 1.15; ctx.globalAlpha = 0.42;
      ctx.beginPath(); ctx.moveTo(-radius * 3.7, 0);
      ctx.quadraticCurveTo(-radius * 1.6, -radius * (0.9 + 0.25 * Math.sin(now * 17)), radius, 0);
      ctx.stroke();
      ctx.strokeStyle = "#ffe0a0"; ctx.lineWidth = 2; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(-radius * 2.5, 0); ctx.lineTo(radius * 1.3, 0); ctx.stroke();
      if (detail) for (let j = 0; j < 3; j++) {
        const t = now * 8 + j * 2.4;
        ctx.strokeStyle = j % 2 ? "#ffad53" : "#ffe2a0";
        ctx.globalAlpha = 0.65;
        ctx.beginPath(); ctx.moveTo(-radius * (1.5 + j * .8), Math.sin(t) * radius);
        ctx.lineTo(-radius * (2.4 + j * .65), Math.sin(t + 1) * radius * 1.4); ctx.stroke();
      }
    } else if (shot.type === "waterBolt") {
      // Fast, thin pressure lance with parallel filaments and droplets.
      ctx.strokeStyle = "#bceeff"; ctx.globalAlpha = .80; ctx.lineWidth = 2.3;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(radius, side * radius * .28);
        ctx.quadraticCurveTo(-radius * 1.5, side * radius * .75, -radius * 5, side * radius * .22);
        ctx.stroke();
      }
      if (detail) for (let j = 1; j <= 3; j++) {
        ctx.globalAlpha = .53; ctx.fillStyle = "#d5faff";
        ctx.beginPath(); ctx.arc(-radius * (2.3 + j), (j % 2 ? 1 : -1) * radius * .58, 1.6, 0, TAU); ctx.fill();
      }
    } else if (shot.type === "iceShards") {
      // Cold afterimages and a prismatic crystalline body.
      ctx.globalAlpha = .65;
      crystal(ctx, -radius * 1.5, 0, radius * 1.2, 0, "#86ddff");
      if (detail) crystal(ctx, -radius * 3.1, 0, radius * .75, 0, "#b3e8ff");
      ctx.globalAlpha = .94;
      crystal(ctx, 0, 0, radius * 1.8, 0, "#f1fdff");
    }
    ctx.restore();
  }
  function drawArea(ctx, area, now, detail) {
    const fade = clamp(area.life / (area.maxLife || 1), 0, 1);
    const r = Math.max(0, area.radius || 0);
    if (!r || fade <= 0) return;
    ctx.save();
    ctx.lineCap = "round";
    if (area.type === "fire") {
      // Expanding explosion ring with ember spokes; never hides enemy tells.
      ring(ctx, area.x, area.y, r * (1.07 - fade * .12), "#ffd08b", .57 * fade, 4);
      if (detail) for (let i = 0; i < 9; i++) {
        const a = i * TAU / 9 + area.x * .001;
        ctx.globalAlpha = .5 * fade;
        spike(ctx, area.x + Math.cos(a) * r * .80, area.y + Math.sin(a) * r * .80, a,
          9 + (1 - fade) * 18, "#ffb75b", 2.5);
      }
    } else if (area.type === "frost" || area.type === "frostEcho") {
      // Angular six-fold glacial pulse instead of a generic round explosion.
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        ctx.globalAlpha = fade * .70;
        spike(ctx, area.x, area.y, a, r * .78, "#c3f6ff", 2.3);
        if (detail) crystal(ctx, area.x + Math.cos(a) * r * .78,
          area.y + Math.sin(a) * r * .78, 14 * fade + 5, a, "#f0ffff");
      }
      ring(ctx, area.x, area.y, r * .94, "#ddfdff", .42 * fade, 2);
    } else if (area.type === "water") {
      ring(ctx, area.x, area.y, r * (1 + (1 - fade) * .45), "#d8faff", .65 * fade, 2.6);
    } else if (area.type === "tidalWave") {
      // Flowing foam caps travel along the real, moving wave front.
      const start = area.angle - area.spread / 2;
      const count = detail ? 10 : 5;
      for (let i = 0; i <= count; i++) {
        const a = start + area.spread * i / count;
        const x = area.x + Math.cos(a) * r, y = area.y + Math.sin(a) * r;
        ctx.globalAlpha = fade * (.6 + .2 * Math.sin(now * 7 + i));
        ctx.strokeStyle = "#e4ffff"; ctx.lineWidth = detail ? 2.5 : 2;
        ctx.beginPath(); ctx.arc(x, y, 5 + 2 * Math.sin(now * 5 + i), a - .5, a + .6);
        ctx.stroke();
      }
    } else if (area.type === "whirlpool") {
      // Offset rotating spiral arms convey actual pull direction.
      const count = area.evolved && detail ? 3 : 2;
      for (let arm = 0; arm < count; arm++) {
        ctx.globalAlpha = fade * .76; ctx.strokeStyle = arm % 2 ? "#a0e4ff" : "#e4ffff";
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        for (let step = 0; step <= 15; step++) {
          const fraction = step / 15;
          const angle = now * (arm % 2 ? -2 : 2.4) + arm * TAU / count + fraction * 4.8;
          const x = area.x + Math.cos(angle) * r * (.12 + fraction * .70);
          const y = area.y + Math.sin(angle) * r * (.12 + fraction * .70);
          if (!step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ring(ctx, area.x, area.y, r * .24, "#e1ffff", .57 * fade, 2);
    }
    ctx.restore();
  }
  function drawCone(ctx, burst, now, detail) {
    const fade = clamp(burst.life / .42, 0, 1);
    if (!fade) return;
    const spokes = detail ? 9 : 4;
    ctx.save(); ctx.lineCap = "round";
    for (let i = 0; i < spokes; i++) {
      const t = (i + .5) / spokes;
      const a = burst.angle + (t - .5) * burst.spread * .73;
      const r = burst.radius * (.65 + .3 * Math.sin(now * 9 + i * 2) ** 2);
      ctx.globalAlpha = fade * .46;
      ctx.strokeStyle = i % 2 ? "#ffd37d" : "#ff783c";
      ctx.lineWidth = 3 + 3 * fade;
      ctx.beginPath(); ctx.moveTo(burst.x + Math.cos(a) * 20, burst.y + Math.sin(a) * 20);
      ctx.quadraticCurveTo(burst.x + Math.cos(a + .14) * r * .62,
        burst.y + Math.sin(a + .14) * r * .62,
        burst.x + Math.cos(a) * r, burst.y + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawOrbit(ctx, orb, now, index, detail) {
    const r = orb.r || 12;
    ctx.save();
    ctx.translate(orb.x, orb.y);
    ring(ctx, 0, 0, r * 1.5, "#ffb067", .57, 2);
    ctx.globalAlpha = .8; ctx.strokeStyle = "#ffe1a7"; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-r * 1.4, 0);
    ctx.quadraticCurveTo(-r * 2.7, Math.sin(now * 8 + index) * r, -r * 3.1, -r * .65); ctx.stroke();
    if (detail) for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3 + now * 3 + index;
      ctx.globalAlpha = .5;
      spike(ctx, Math.cos(a) * r, Math.sin(a) * r, a, r * 1.7, "#ffd897");
    }
    ctx.restore();
  }
  function drawFrost(ctx, orb, now, detail) {
    const r = orb.r || 12;
    ctx.save(); ctx.translate(orb.x, orb.y);
    ring(ctx, 0, 0, r * 1.65, "#bcefff", .68, 2.4);
    for (let i = 0; i < 6; i++) spike(ctx, 0, 0, i * TAU / 6 + now * .28, r * 1.65, "#e7fdff", 1.8);
    if (detail) {
      const a = Math.atan2(orb.vy || 0, orb.vx || 1);
      crystal(ctx, -Math.cos(a) * r * 2.5, -Math.sin(a) * r * 2.5, r * 1.1, a, "#a0e6ff");
    }
    ctx.restore();
  }
  function drawFrostZone(ctx, zone, now, detail) {
    ctx.save();
    const fade = clamp(zone.life / 1.4, 0, 1);
    if (detail) for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + now * .13;
      crystal(ctx, zone.x + Math.cos(a) * zone.radius, zone.y + Math.sin(a) * zone.radius,
        12 * fade + 3, a, "#b5f0ff");
    }
    ring(ctx, zone.x, zone.y, zone.radius * (1.03 - fade * .10), "#ddfbff", fade * .32, 2);
    ctx.restore();
  }
  function drawImpact(ctx, e, now, detail) {
    const age = now - e.start;
    const fade = clamp(1 - age / .6, 0, 1);
    if (fade <= 0) return;
    const palette = e.type === "fireball" || e.type === "flame" || e.type === "flameOrbit"
      ? "#ffd18b" : e.type === "waterBolt" || e.type === "whirlpool" || e.type === "tidalWave"
      ? "#bdf2ff" : "#e2faff";
    ctx.save();
    ring(ctx, e.x, e.y, 7 + age * 53, palette, fade * .76, 2.4);
    if (detail) for (let i = 0; i < 4; i++)
      spike(ctx, e.x, e.y, i * TAU / 4 + e.x * .01, 12 + age * 31, palette, 2);
    ctx.restore();
  }
  function draw(ctx, state = {}) {
    const player = state.player, now = state.time;
    const view = state.view;
    if (!ctx || !player || !view || !Number.isFinite(now)) return { total: 0, types: [] };
    const quality = qualityLevel(state.quality);
    const detail = quality === 2;
    const drawn = new Set();
    let total = 0;
    const paint = (type, x, y, radius, fn) => {
      if (!visible(x, y, view, radius)) return;
      fn();
      drawn.add(type); total++;
    };
    const shotLimit = quality === 0 ? 14 : quality === 1 ? 24 : 36;
    let count = 0;
    for (const shot of state.shots || []) {
      if (count++ >= shotLimit) break;
      if (!["fireball", "waterBolt", "iceShards"].includes(shot.type)) continue;
      paint(shot.type, shot.x, shot.y, 100, () => drawShot(ctx, shot, now, detail));
    }
    count = 0;
    for (const area of state.areas || []) {
      if (count++ >= (quality === 0 ? 16 : 30)) break;
      const type = {fire:"fireball",frost:"glacialPulse",frostEcho:"glacialPulse",
        water:"waterBolt"}[area.type] || area.type;
      if (!TYPES_SET.has(type)) continue;
      paint(type, area.x, area.y, Math.min(240, area.radius || 50), () => drawArea(ctx, area, now, detail));
    }
    count = 0;
    for (const b of state.flames || []) {
      if (count++ >= 9) break;
      paint("flame", b.x, b.y, Math.min(250,b.radius || 100), () => drawCone(ctx,b,now,detail));
    }
    count = 0;
    for (const orb of state.orbits || []) {
      if (count++ >= 12) break;
      paint("flameOrbit", orb.x, orb.y, 40, () => drawOrbit(ctx,orb,now,count,detail));
    }
    count = 0;
    for (const b of state.frostOrbs || []) {
      if (count++ >= (quality === 0 ? 10 : 22)) break;
      if (b.type !== "frost") continue;
      paint("frost", b.x, b.y, 55, () => drawFrost(ctx,b,now,detail));
    }
    count = 0;
    for (const z of state.frostZones || []) {
      if (count++ >= 10) break;
      paint("frost", z.x, z.y, Math.min(240,z.radius || 90), () => drawFrostZone(ctx,z,now,detail));
    }
    impacts = impacts.filter(e => now >= e.start && now - e.start < .65);
    count = 0;
    for (const e of impacts) {
      if (count++ >= (quality === 0 ? 9 : MAX_IMPACTS)) break;
      paint(e.type, e.x, e.y, 70, () => drawImpact(ctx,e,now,detail));
    }
    return { total, types: [...drawn] };
  }

  window.drawWeaponVfx = draw;
  window.emitWeaponVfxImpact = impact;
  window.resetWeaponVfx = reset;
  window.weaponVfxStyles = TYPES; // Read-only metadata for QA.
})();
