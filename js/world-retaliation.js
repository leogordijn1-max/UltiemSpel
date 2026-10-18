// Living World 2.1 — six elemental invasions, three escalation stages each.
// Reactive terrain is permanent until the current run ends, not a random timed hazard.
(() => {
  "use strict";
  const TAU = Math.PI * 2;
  const PHASE_LIMITS = { 1: 6, 2: 8, 3: 10 };
  const THRESHOLDS = { 1: 45, 2: 10, 3: 7 };
  const TERRAIN = { burning: "fire", flooded: "water", frozen: "frost" };
  const reaction = (id, name, color, fill, visual, effects, options = {}) =>
    Object.freeze({ id, name, color, fill, visual, effects, ...options });

  // Pair keys are INVADING world > DEFENDING world. Order matters!
  const REACTIONS = Object.freeze({
    "burning>flooded": [
      reaction("steam", "STEAM VENT", "#fff0d2", "rgba(214,225,221,.18)",
        "steam", ["chill"], { slow: .8, radius: 78 }),
      reaction("boiling", "BOILING BASIN", "#ffb269", "rgba(243,113,35,.26)",
        "bubble", ["damage","push"], { damage: 12, push: 100, radius: 108 }),
      reaction("geyser", "SCALDING GEYSER", "#ffdc95", "rgba(250,97,29,.31)",
        "geyser", ["damage","push"], { damage: 17, push: 200, radius: 135, burst: true })
    ],
    "burning>frozen": [
      reaction("thaw", "THAWING ICE", "#90def4", "rgba(110,194,213,.19)",
        "melt", ["push"], { push: 80, radius: 76 }),
      reaction("meltwater", "MELTWATER SINK", "#6bc7e7", "rgba(48,143,190,.28)",
        "melt", ["chill","push"], { slow: 1.5, push: 155, radius: 108 }),
      reaction("thermal-fault", "THERMAL FAULT", "#ff9464", "rgba(230,98,42,.28)",
        "crack", ["damage","push"], { damage: 16, push: 185, radius: 132, burst: true })
    ],
    "flooded>burning": [
      reaction("quench", "QUENCHING STEAM", "#c4f3ff", "rgba(137,207,212,.17)",
        "steam", ["chill"], { slow: .8, radius: 78 }),
      reaction("pressure", "PRESSURE SHOCK", "#6bd5ff", "rgba(49,160,203,.27)",
        "wave", ["damage","push"], { damage: 11, push: 150, radius: 106 }),
      reaction("flash-boil", "FLASH-BOIL ERUPTION", "#d9ffff", "rgba(114,225,234,.28)",
        "geyser", ["damage","push"], { damage: 18, push: 230, radius: 138, burst: true })
    ],
    "flooded>frozen": [
      reaction("slick", "SLICK THAW", "#74d9fa", "rgba(90,206,240,.18)",
        "wave", ["push"], { push: 100, radius: 78 }),
      reaction("ice-drift", "BROKEN ICE DRIFT", "#91d8ff", "rgba(85,178,221,.25)",
        "ice", ["chill","push"], { slow: 1.6, push: 160, radius: 106 }),
      reaction("ice-break", "ICE BREAKUP FLOOD", "#bdf7ff", "rgba(67,165,228,.32)",
        "crack", ["damage","push"], { damage: 13, push: 235, radius: 137, burst: true })
    ],
    "frozen>flooded": [
      reaction("flash-freeze", "FLASH FREEZE", "#b1f3ff", "rgba(130,215,241,.22)",
        "ice", ["chill"], { slow: 1.3, radius: 78 }),
      reaction("ice-sheet", "SPREADING ICE SHEET", "#b6eafa", "rgba(134,210,243,.29)",
        "ice", ["chill","push"], { slow: 2.2, push: 90, radius: 112 }),
      reaction("frost-rift", "SHATTERING FROST", "#f0ffff", "rgba(150,227,255,.28)",
        "crack", ["damage","chill"], { damage: 14, slow: 2.4, radius: 135, burst: true })
    ],
    "frozen>burning": [
      reaction("ash-crust", "COOLING ASH", "#d6dcdf", "rgba(125,142,159,.19)",
        "crust", ["chill"], { slow: 1.0, radius: 80 }),
      reaction("brittle-crust", "BRITTLE LAVA CRUST", "#abc9e8", "rgba(126,147,173,.26)",
        "crust", ["damage","chill"], { damage: 10, slow: 1.7, radius: 110 }),
      reaction("thermal-shatter", "THERMAL SHATTER", "#e3e8ff", "rgba(167,173,222,.29)",
        "crack", ["damage","push"], { damage: 17, push: 175, radius: 134, burst: true })
    ]
  });
  const empty = () => ({ kills:0, threshold:0, rifts:[], running:false,
    sequence:0, tier:0, lastReaction:null });
  let state = empty();

  function reset() { state = empty(); state.running = true; }
  function clear() { state.rifts.length = 0; state.running = false; state.lastReaction = null; }
  function currentConquest() { return window.getWorldConquest?.() || null; }
  function pair(conquest = currentConquest()) {
    return conquest && conquest.active && conquest.original !== conquest.invading
      ? conquest.invading + ">" + conquest.original : null;
  }
  function conquestTier() {
    const c = currentConquest(), percent = Number(c?.target ?? c?.coverage ?? 0);
    if (!pair(c) || !Number.isFinite(percent)) return 0;
    return percent >= 85 ? 3 : percent >= 50 ? 2 : percent >= 15 ? 1 : 0;
  }
  function chooseRecipe(tier) {
    const variants = REACTIONS[pair()];
    return variants?.[tier-1] || null;
  }
  function createReaction(player, tier) {
    const template = chooseRecipe(tier);
    if (!template || !player || !Number.isFinite(player.x) || !Number.isFinite(player.y)) return false;
    if (state.rifts.filter(r => r.tier === tier).length >= PHASE_LIMITS[tier]) return false;
    const seq = ++state.sequence;
    let x = player.x, y = player.y,free = false;
    // Never accept a stacked, unavoidable hazard on the final failed attempt.
    // Search progressively wider terrain rings instead. Old rifts remain
    // permanent; the search doesn't remove them or change conquest rules.
    for (let attempt = 0; attempt < 48; attempt++) {
      const angle = (seq * 2.399963 + attempt * 1.4) % TAU;
      const distance = 205 + Math.floor(attempt/6)*126 + ((seq + attempt) % 3)*42;
      const candidateX = player.x + Math.cos(angle)*distance;
      const candidateY = player.y + Math.sin(angle)*distance;
      if (state.rifts.some(r =>
          Math.hypot(r.x-candidateX,r.y-candidateY) < (r.radius + template.radius)*.82))
        continue;
      x=candidateX; y=candidateY; free=true;
      break;
    }
    if (!free) return false;
    const rift = {
      x,y,radius:template.radius,warning:tier===3?3.1:tier===2?2.6:2.2,
      elapsed:0,lastHit:-Infinity,type:template.id,name:template.name,
      tier,trigger:seq,pair:pair(),effects:template.effects.slice(),
      visual:template.visual,color:template.color,fill:template.fill,
      damage:template.damage||0,push:template.push||0,slow:template.slow||0,
      burst:!!template.burst
    };
    state.rifts.push(rift);
    state.lastReaction = {type:rift.type,name:rift.name,tier, pair:rift.pair};
    // Invading terrain replaces the local defending element; effects stay in
    // the permanent reaction overlay. Both are reset at the start of a run.
    window.addWorldScar?.(TERRAIN[currentConquest()?.invading]||"fire",x,y,rift.radius);
    return true;
  }
  function onKill(enemy,player) {
    if (!state.running || !enemy || enemy.kind===3 ||
        enemy.summoned || enemy.noXp || !player) return false;
    const tier = conquestTier();
    if (tier !== state.tier) { state.tier = tier; state.kills = 0; }
    if (!tier) { state.threshold = 0; return false; }
    state.threshold = THRESHOLDS[tier];
    if (++state.kills < state.threshold) return false;
    state.kills = 0;
    return createReaction(player,tier);
  }
  // Used only by the sandbox UI; cannot bypass the progression requirements.
  function forceReaction(player) {
    if (!state.running) return false;
    return createReaction(player,conquestTier());
  }
  // Every repeating eruption has a new, fully visible telegraph. Time values
  // are measured in simulation seconds so 1x/2x/3x behave consistently.
  const BURST_CYCLE = 3.8;
  const BURST_ACTIVE = 1.05;
  const REARM_WARNING = 0.95;
  function phaseOf(r) {
    if (r.elapsed < r.warning) return {
      phase: "forming", progress: Math.max(0, Math.min(1,r.elapsed/r.warning)),
      remaining: r.warning-r.elapsed, dangerous: false
    };
    if (!r.burst) return {phase:"active",progress:1,remaining:0,dangerous:true};
    const offset = (r.elapsed-r.warning) % BURST_CYCLE;
    if (offset < BURST_ACTIVE) return {
      phase:"active",progress:offset/BURST_ACTIVE,
      remaining:BURST_ACTIVE-offset,dangerous:true
    };
    const untilNext=BURST_CYCLE-offset;
    return untilNext <= REARM_WARNING
      ? {phase:"charging",progress:1-untilNext/REARM_WARNING,
          remaining:untilNext,dangerous:false}
      : {phase:"recovering",progress:0,remaining:untilNext,dangerous:false};
  }
  function erupting(r) { return phaseOf(r).dangerous; }
  function tick(dt,player,hooks={}) {
    if (!state.running || !Number.isFinite(dt) || dt<=0 || hooks.suspended) return;
    for (const r of state.rifts) {
      r.elapsed += dt;
      if (r.elapsed < r.warning || !player || !erupting(r)) continue;
      const dx=player.x-r.x,dy=player.y-r.y;
      if (dx*dx+dy*dy > (r.radius+(player.r||0))**2 ||
          (player.inv||0)>0) continue;
      const cooldown = r.tier===3?1.15:r.tier===2?1.8:2.5;
      if (r.elapsed-r.lastHit < cooldown) continue;
      // A rejected hit (dodge/god mode) must not apply its secondary effects.
      if (r.effects.includes("damage") && hooks.damage?.(r.damage,r)===false) continue;
      if (r.effects.includes("chill")) hooks.chill?.(r.slow,r);
      if (r.effects.includes("push")) {
        const magnitude=Math.hypot(dx,dy);
        const nx=magnitude>.01?dx/magnitude:Math.cos(r.trigger);
        const ny=magnitude>.01?dy/magnitude:Math.sin(r.trigger);
        hooks.push?.(nx,ny,r.push,r);
      }
      r.lastHit = r.elapsed;
    }
  }
  function draw(ctx,time,quality,view=null) {
    if (!state.running || !ctx) return;
    ctx.save();
    for (const r of state.rifts) {
      // These scars persist, so avoid wasting Canvas work on distant rifts.
      if (view && (r.x+r.radius+24<view.left || r.x-r.radius-24>view.left+view.width ||
          r.y+r.radius+24<view.top || r.y-r.radius-24>view.top+view.height)) continue;
      const phase=phaseOf(r),dangerous=r.effects.includes("damage");
      const warning=phase.phase==="forming"||phase.phase==="charging";
      const idle=phase.phase==="recovering";
      const active=phase.phase==="active";
      const charge=warning?phase.progress:0;
      // A continuous damaging field is always brightly bounded. A recovering
      // periodic vent is visibly muted/dashed, never drawn as if erupting.
      const alpha=warning?.14+.19*charge:idle?.075:dangerous?.34:.20;
      ctx.globalAlpha=alpha;
      ctx.fillStyle=r.fill;
      ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,TAU);ctx.fill();
      ctx.globalAlpha=warning?.65+.35*charge:idle?.38:1;
      ctx.strokeStyle=r.color;
      ctx.lineWidth=warning?3.5:active&&dangerous?4:2.4;
      if(idle)ctx.setLineDash([9,11]);
      ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,TAU);ctx.stroke();
      if(idle)ctx.setLineDash([]);
      if(warning){
        // The contracting ring arrives at the exact active boundary. This
        // telegraph is present on Low too, not hidden behind graphics settings.
        const radius=r.radius*(.98-.76*charge);
        ctx.globalAlpha=.85;ctx.lineWidth=3;ctx.strokeStyle="#fff5d8";
        ctx.beginPath();ctx.arc(r.x,r.y,radius,0,TAU);ctx.stroke();
        ctx.globalAlpha=.48+.40*charge;
        ctx.beginPath();ctx.arc(r.x,r.y,r.radius*.73,0,TAU);ctx.stroke();
      } else if(active && dangerous){
        // Small inner target identifies a damaging floor zone even without glow.
        ctx.globalAlpha=.75;ctx.lineWidth=2;ctx.strokeStyle="#fff0cc";
        ctx.beginPath();ctx.arc(r.x,r.y,r.radius*.28,0,TAU);ctx.stroke();
      } else if(idle) {
        // Visually mark the floor as temporarily safe while it recharges.
        ctx.globalAlpha=.32;ctx.lineWidth=2;ctx.strokeStyle=r.color;
        ctx.beginPath();ctx.arc(r.x,r.y,r.radius*.20,0,TAU);ctx.stroke();
      }
      if(quality==="low" || idle)continue;
      ctx.globalAlpha=active?.65:warning?.45:.22;
      const n=r.visual==="crack"?7:r.visual==="ice"?8:6;
      for(let i=0;i<n;i++){
        const a=i*TAU/n+r.trigger*.43;
        const wave=(time*.35+i*.17)%1;
        ctx.strokeStyle=r.color;ctx.lineWidth=1.5;
        ctx.beginPath();
        if(["steam","bubble","geyser","wave","melt"].includes(r.visual)){
          const reach=r.radius*(.12+wave*.73);
          const rr=r.visual==="geyser"?5+wave*27:5+wave*16;
          ctx.arc(r.x+Math.cos(a)*reach,r.y+Math.sin(a)*reach,rr,0,TAU);
        }else{
          const inner=r.radius*(r.visual==="crust"?.24:.1);
          const outer=r.radius*(.48+.45*wave);
          ctx.moveTo(r.x+Math.cos(a)*inner,r.y+Math.sin(a)*inner);
          ctx.lineTo(r.x+Math.cos(a+.12)*outer,r.y+Math.sin(a+.12)*outer);
          if(r.visual==="crack")
            ctx.lineTo(r.x+Math.cos(a+.3)*outer*.7,r.y+Math.sin(a+.3)*outer*.7);
        }
        ctx.stroke();
      }
      if(r.burst && active){
        ctx.globalAlpha=.7;ctx.beginPath();
        ctx.arc(r.x,r.y,r.radius*(.23+.65*phase.progress),0,TAU);
        ctx.strokeStyle="#fff3cf";ctx.lineWidth=3;ctx.stroke();
      }
    }
    ctx.restore();
  }
  function status() {
    return {kills:state.kills,threshold:state.threshold,active:state.rifts.length,
      sequence:state.sequence,tier:conquestTier(),pair:pair(),
      lastReaction:state.lastReaction,rifts:state.rifts.map(r=>({
        ...r,effects:r.effects.slice(),warningPhase:phaseOf(r).phase,
        secondsUntilChange:phaseOf(r).remaining,currentlyDangerous:phaseOf(r).dangerous
      }))};
  }
  window.getWorldReactionTier=conquestTier;
  window.getElementReactionCatalog=()=>REACTIONS;
  window.forceWorldReaction=forceReaction;
  window.resetWorldRetaliation=reset;window.clearWorldRetaliation=clear;
  window.recordWorldDestruction=onKill;window.updateWorldRetaliation=tick;
  window.drawWorldRetaliation=draw;window.getWorldRetaliationStatus=status;
  window.worldRetaliationPhase=phaseOf;
})();