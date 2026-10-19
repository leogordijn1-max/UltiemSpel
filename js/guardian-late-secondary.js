// Update 34: four distinct, telegraphed NORMAL volleys for Bell and Last Meme.
// Their beloved Phase-III cinematic ultimates and showcase combos are untouched.
// Warnings and collision share the same planned geometry; no extra enemy spawns.
(() => {
  "use strict";
  const TAU=Math.PI*2;
  const MODES=Object.freeze({
    2:Object.freeze(["clapperVerdict","splitHour"]),
    3:Object.freeze(["pixelRip","glitchDouble"])
  });
  const NAMES=Object.freeze({
    clapperVerdict:"CLAPPER'S VERDICT",
    splitHour:"SPLIT HOUR",
    pixelRip:"PIXEL RIP",
    glitchDouble:"GLITCH DOUBLE"
  });
  function eligible(e){
    return !!e && e.kind===3 && !e.dead &&
      ((e.isFinalBoss===true && e.variant===3) ||
        (e.variant===2 && !e.isFinalBoss));
  }
  function stage(e){
    return e.isFinalBoss?Math.max(1,e.finalPhase||1):
      e.phaseThree?3:e.phaseTwo?2:1;
  }
  function plan(e,time){
    if(!eligible(e)||!Number.isFinite(time)||e.shotWarning<=0)return false;
    const variant=e.isFinalBoss?3:2;
    const sequence=e.lateVolleyCount||0;
    e.lateVolleyCount=sequence+1;
    e.lateSecondary={
      mode:MODES[variant][sequence%2],
      stage:stage(e),sequence:sequence+1,
      start:time,warningEndsAt:time+e.shotWarning
    };
    window.runQaEvent?.("boss_secondary_attack",{
      boss:e.bossName|| (variant===3?"THE LAST MEME":"THE BELL TOWER"),
      mode:e.lateSecondary.mode,phase:stage(e),
      warning:e.shotWarning
    },time);
    return true;
  }
  function cancel(e){
    if(!e?.lateSecondary)return false;
    e.lateSecondary=null;
    return true;
  }
  function geometry(e){
    if(!eligible(e)||!e.lateSecondary)return null;
    const angle=Number.isFinite(e.shotAngle)?e.shotAngle:0;
    const fx=Math.cos(angle),fy=Math.sin(angle);
    const sx=-fy,sy=fx;
    // The live target tracks for only the first 0.35 seconds. Once locked,
    // the rendered geometry and the actual collision use the same coordinates.
    const tx=Number.isFinite(e.warningX)?e.warningX:e.x+fx*310;
    const ty=Number.isFinite(e.warningY)?e.warningY:e.y+fy*310;
    return {angle,fx,fy,sx,sy,tx,ty,
      direction:e.lateSecondary.sequence%2?1:-1,
      mode:e.lateSecondary.mode,stage:e.lateSecondary.stage};
  }
  function emitter(e,g,side){
    return {x:e.x+g.sx*side*145-g.fx*45,
      y:e.y+g.sy*side*145-g.fy*45};
  }
  function danger(e){
    const g=geometry(e);if(!g)return [];
    if(g.mode==="clapperVerdict")
      return [-1,1].map(k=>({
        x:g.tx+g.sx*k*160,y:g.ty+g.sy*k*160,r:65
      }));
    if(g.mode==="splitHour")
      return [{x:g.tx,y:g.ty,r:75}];
    if(g.mode==="pixelRip")
      return [-1,1].map(k=>({
        x:g.tx+g.sx*k*156+g.fx*k*40,
        y:g.ty+g.sy*k*156+g.fy*k*40,r:62
      }));
    return [-1,1].map(k=>({
      x:g.tx+g.fx*k*140,y:g.ty+g.fy*k*140,r:69
    }));
  }
  function shots(e){
    const g=geometry(e);if(!g)return [];
    // Three decisive lanes instead of five decorative trajectories.
    const speed=330+g.stage*17;
    if(g.mode==="clapperVerdict")
      return [[-.43,-55],[0,65],[.43,-55]].map(([offset,delta])=>({
        origin:e,angle:g.angle+offset,speed:speed+delta,damage:13+g.stage*2,type:"bell"
      }));
    if(g.mode==="splitHour"){
      const normal=[-.25,0,.25].map(off=>({
        origin:e,angle:g.angle+off,speed:speed+28,damage:12+g.stage*2,type:"bell"
      }));
      // The two visible side bells fire inward: the player has to move,
      // but neither emitter ever spawns over the player's position.
      for(const side of [-1,1]){
        const ghost=emitter(e,g,side);
        normal.push({origin:ghost,
          angle:Math.atan2(g.ty-ghost.y,g.tx-ghost.x),
          speed:speed-25,damage:12+g.stage*2,type:"bell"});
      }
      return normal;
    }
    if(g.mode==="pixelRip")
      return [-.42,0,.42].map(off=>({
        origin:e,angle:g.angle+off,
        speed:speed+(off===0?57:-38),damage:13+g.stage*2,type:"rift"
      }));
    const shotList=[{origin:e,angle:g.angle,speed:speed+52,
      damage:14+g.stage*2,type:"rift"}];
    for(const side of [-1,1]){
      const ghost=emitter(e,g,side);
      shotList.push({origin:ghost,
        angle:Math.atan2(g.ty-ghost.y,g.tx-ghost.x),
        speed:speed-24,damage:12+g.stage*2,type:"shadow"});
      // One visible mirror projectile per side; no misleading extra edge rays.
    }
    return shotList;
  }
  function fire(e,hooks={},time){
    if(!eligible(e)||!e.lateSecondary||e.shotWarning>0 ||
      stage(e)!==e.lateSecondary.stage)return false;
    const g=geometry(e),p=e.lateSecondary;
    for(const shot of shots(e))
      hooks.projectile?.(shot.origin,shot.angle,shot.speed,shot.damage,shot.type);
    // A marked delayed strike gives an additional reaction window after
    // the projectiles fire. The bossHazards system enforces real collision.
    for(const z of danger(e))
      hooks.hazard?.(z.x,z.y,z.r,.8,14+g.stage*2);
    const bell=e.variant===2&&!e.isFinalBoss;
    hooks.puff?.(e.x,e.y,bell?"#ffe2a0":"#ff8be8",14);
    if(g.mode==="splitHour"||g.mode==="glitchDouble"){
      for(const side of [-1,1]){
        const ghost=emitter(e,g,side);
        hooks.puff?.(ghost.x,ghost.y,bell?"#ffd073":"#f7a1ff",6);
      }
    }
    // Prevent the next giant showcase from overlapping a late marked strike.
    const next=p.warningEndsAt+1.55;
    if(e.bellFight)e.bellFight.nextAt=Math.max(e.bellFight.nextAt||0,next);
    if(e.memeFight)e.memeFight.nextAt=Math.max(e.memeFight.nextAt||0,next);
    e.specialNextAt=Math.max(e.specialNextAt||0,next);
    e.lateSecondary=null;
    return true;
  }
  function draw(e,ctx,time,quality){
    if(!eligible(e)||!e.lateSecondary||e.shotWarning<=0||!ctx)return;
    const g=geometry(e);if(!g)return;
    const low=quality==="low",bell=!e.isFinalBoss;
    ctx.save();
    ctx.lineWidth=low?3:4;
    ctx.strokeStyle=bell?"#ffd679":"#fba2f3";
    ctx.fillStyle=ctx.strokeStyle;
    ctx.globalAlpha=.98;
    ctx.setLineDash([11,7]);
    if(!low){ctx.shadowBlur=12;ctx.shadowColor=ctx.strokeStyle;}
    function circle(x,y,r){
      ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
      if(!low){ctx.beginPath();ctx.arc(x,y,r*.49,0,TAU);ctx.stroke();}
    }
    function line(x,y,xx,yy){
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();
    }
    // These exact marker coordinates also feed hooks.hazard on impact.
    for(const z of danger(e))circle(z.x,z.y,z.r);
    const planned=shots(e);
    for(const shot of planned){
      const x=shot.origin.x,y=shot.origin.y;
      const end=420;
      line(x,y,x+Math.cos(shot.angle)*end,
        y+Math.sin(shot.angle)*end);
      if(shot.origin!==e)circle(x,y,22);
    }
    // The last boss visibly tears its projected geometry; decorative only,
    // never a fake hitzone and never substitutes for the marked impact.
    if(!bell&&!low){
      ctx.setLineDash([]);
      ctx.globalAlpha=.48;
      line(g.tx-g.sx*95,g.ty-g.sy*95,
           g.tx+g.sx*95,g.ty+g.sy*95);
    }
    ctx.setLineDash([]);
    ctx.globalAlpha=.9;
    const total=Math.max(.01,e.lateSecondary.warningEndsAt-e.lateSecondary.start);
    const percent=Math.max(0,Math.min(1,1-e.shotWarning/total));
    ctx.beginPath();
    ctx.arc(e.x,e.y,(e.r||60)+27,-Math.PI/2,
      -Math.PI/2+TAU*percent);ctx.stroke();
    if(!low){
      ctx.font="bold 14px system-ui, sans-serif";
      ctx.textAlign="center";
      ctx.fillText(NAMES[g.mode],e.x,e.y-(e.r||60)-42);
    }
    ctx.restore();
  }
  window.guardianLateSecondaryNames=NAMES;
  window.prepareGuardianLateSecondary=plan;
  window.fireGuardianLateSecondary=fire;
  window.cancelGuardianLateSecondary=cancel;
  window.guardianLateSecondaryDanger=danger;
  window.guardianLateSecondaryShots=shots;
  window.drawGuardianLateSecondary=draw;
})();
