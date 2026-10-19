// Update 33 — readable, alternating NORMAL volleys for Beau and Shade.
// Strong showcase attacks, boss signatures and the Phase-III ultimates are untouched.
// All damage is carried by existing real projectiles / visibly warned hazards.
(() => {
  "use strict";
  const TAU = Math.PI*2;
  const TYPES = Object.freeze({
    0: Object.freeze(["fangSweep","houndCrossfire"]),
    1: Object.freeze(["mourningLances","phantomMirrors"])
  });
  const NAMES = Object.freeze({
    fangSweep:"FANG SWEEP",
    houndCrossfire:"PACK CROSSFIRE",
    mourningLances:"MOURNING LANCES",
    phantomMirrors:"PHANTOM MIRRORS"
  });
  function valid(e) {
    return !!e && e.kind===3 && !e.dead && !e.isFinalBoss &&
      (e.variant===0 || e.variant===1);
  }
  function phase(e){return e.phaseThree?3:e.phaseTwo?2:1;}
  function prepare(e,now) {
    if(!valid(e) || !Number.isFinite(now))return false;
    const i=e.secondaryVolleyCount||0;
    const mode=TYPES[e.variant][i%2];
    e.secondaryVolleyCount=i+1;
    e.secondaryVolley={
      mode,number:i+1,startedAt:now,phase:phase(e),
      // Draw the real target from e.warningX/Y while tracking, then lock.
      // game.js already stops moving it after the first .35s.
      warningEndsAt:now+(e.shotWarning||0)
    };
    window.runQaEvent?.("boss_secondary_attack",{
      boss:e.bossName|| (e.variant===0?"BEAU":"SHADE"),
      mode,phase:phase(e),warning:e.shotWarning||0
    },now);
    return true;
  }
  function cancel(e){
    if(!e || !e.secondaryVolley)return false;
    e.secondaryVolley=null;
    return true;
  }
  function geometry(e) {
    if(!valid(e) || !e.secondaryVolley)return null;
    const angle=Number.isFinite(e.shotAngle)?e.shotAngle:0;
    const fx=Math.cos(angle),fy=Math.sin(angle);
    const sx=-fy,sy=fx;
    const tx=Number.isFinite(e.warningX)?e.warningX:e.x+fx*280;
    const ty=Number.isFinite(e.warningY)?e.warningY:e.y+fy*280;
    const p=e.secondaryVolley;
    const side=p.number%2?1:-1;
    return {angle,fx,fy,sx,sy,tx,ty,side,mode:p.mode};
  }
  function source(e,g,side) {
    // Phantoms spawn near their guardian, never on top of the player.
    return {x:e.x+g.sx*side*125-g.fx*35,
      y:e.y+g.sy*side*125-g.fy*35};
  }
  function points(e) {
    const g=geometry(e);if(!g)return [];
    if(g.mode==="fangSweep")
      return [{x:g.tx+g.sx*g.side*158,y:g.ty+g.sy*g.side*158,r:62}];
    if(g.mode==="houndCrossfire")
      return [{x:g.tx,y:g.ty,r:57}];
    if(g.mode==="mourningLances")
      return [{x:g.tx+g.sx*g.side*170,y:g.ty+g.sy*g.side*170,r:65}];
    return [-1,1].map(side=>({
      x:g.tx+g.sx*side*155,y:g.ty+g.sy*side*155,r:61
    }));
  }
  function fire(e,hooks={}) {
    // Firing before the full wind-up would bypass the readable marker.
    if(!valid(e)||!e.secondaryVolley||e.shotWarning>0)return false;
    const g=geometry(e),p=e.secondaryVolley;
    const stage=phase(e),speed=290+stage*12;
    // Only one attack replaces the NORMAL volley; no extra enemies or
    // recurring timers. All hazards are delayed, allowing an additional dodge.
    if(g.mode==="fangSweep") {
      for(const off of [-.44,-.21,0,.21,.44])
        hooks.projectile?.(e,g.angle+off,
          speed+(Math.abs(off)>.4?-52:18),10+stage,"fish");
    } else if(g.mode==="houndCrossfire"){
      for(const off of [-.17,0,.17])
        hooks.projectile?.(e,g.angle+off,speed+23,11+stage,"fish");
      for(const side of [-1,1]) {
        const phantom=source(e,g,side);
        const angle=Math.atan2(g.ty-phantom.y,g.tx-phantom.x);
        hooks.projectile?.(phantom,angle,speed-12,10+stage,"fish");
        hooks.puff?.(phantom.x,phantom.y,"#ffd095",5);
      }
    } else if(g.mode==="mourningLances") {
      // Distinct fast centre spear + two slower flanks, not a blind ring spam.
      for(const [off,delta] of [[-.33,-45],[0,95],[.33,-45]])
        hooks.projectile?.(e,g.angle+off,speed+delta,11+stage,"shadow");
      for(const off of [-.77,.77])
        hooks.projectile?.(e,g.angle+off,speed-95,9+stage,"shadow");
    } else {
      // A paired apparition attack. Both mirrors and both marked flanks
      // are visible for the entire wind-up; the centre remains an escape.
      hooks.projectile?.(e,g.angle,speed+30,11+stage,"shadow");
      for(const side of [-1,1]){
        const mirror=source(e,g,side);
        hooks.projectile?.(mirror,
          Math.atan2(g.ty-mirror.y,g.tx-mirror.x),speed-17,10+stage,"shadow");
        hooks.puff?.(mirror.x,mirror.y,"#c5a0ff",6);
      }
    }
    for(const mark of points(e)){
      // The marker has been visible since prepare(); the same coordinates
      // drive collision, using the existing real bossHazards queue.
      hooks.hazard?.(mark.x,mark.y,mark.r,.76,10+stage*2);
    }
    hooks.puff?.(e.x,e.y,e.variant===0?"#ffcb91":"#c5a0ff",10);
    // Guard against the next large showcase starting during our late trap.
    const wait=1.25;
    if(e.beauFight)e.beauFight.nextAt=Math.max(e.beauFight.nextAt||0,p.warningEndsAt+wait);
    if(e.shadeFight)e.shadeFight.nextAt=Math.max(e.shadeFight.nextAt||0,p.warningEndsAt+wait);
    e.specialNextAt=Math.max(e.specialNextAt||0,p.warningEndsAt+wait);
    e.secondaryVolley=null;
    return true;
  }
  function draw(e,ctx,now,quality) {
    if(!valid(e)||!e.secondaryVolley||e.shotWarning<=0||
       !ctx || !Number.isFinite(now))return;
    const g=geometry(e);if(!g)return;
    const low=quality==="low";
    const beau=e.variant===0;
    ctx.save();
    ctx.strokeStyle=beau?"#ffbc79":"#caa1ff";
    ctx.fillStyle=beau?"#ffbc79":"#caa1ff";
    ctx.globalAlpha=.86;
    ctx.lineWidth=low?3:4;
    ctx.setLineDash([10,7]);
    if(!low){ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=10;}
    const mark=(x,y,r)=>{
      ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
      // Inner shape makes the threat readable even without bloom on Low.
      ctx.beginPath();ctx.arc(x,y,Math.max(12,r*.44),0,TAU);ctx.stroke();
    };
    const line=(x,y,dx,dy)=>{
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(dx,dy);ctx.stroke();
    };
    for(const {x,y,r} of points(e))mark(x,y,r);
    if(g.mode==="fangSweep"||g.mode==="mourningLances"){
      const spreads=g.mode==="fangSweep"?[-.44,-.21,0,.21,.44]:[-.77,-.33,0,.33,.77];
      for(const angle of spreads){
        const a=g.angle+angle;
        line(e.x,e.y,e.x+Math.cos(a)*430,e.y+Math.sin(a)*430);
      }
    } else {
      line(e.x,e.y,g.tx,g.ty);
      for(const side of [-1,1]){
        const ghost=source(e,g,side);
        mark(ghost.x,ghost.y,22);
        line(ghost.x,ghost.y,g.tx,g.ty);
      }
    }
    // Progress ring signals a real, locked warning rather than a decorative VFX.
    const total=Math.max(.01,e.secondaryVolley.warningEndsAt-e.secondaryVolley.startedAt);
    const pct=Math.max(0,Math.min(1,e.shotWarning/total));
    ctx.setLineDash([]);
    ctx.globalAlpha=.7;
    ctx.beginPath();ctx.arc(e.x,e.y,e.r+26,-Math.PI/2,
      -Math.PI/2+TAU*(1-pct));ctx.stroke();
    if(!low){
      ctx.font="bold 13px system-ui, sans-serif";
      ctx.textAlign="center";
      ctx.fillText(NAMES[g.mode],e.x,e.y-e.r-39);
    }
    ctx.restore();
  }
  window.guardianSecondaryCatalog=NAMES;
  window.prepareGuardianSecondary=prepare;
  window.fireGuardianSecondary=fire;
  window.cancelGuardianSecondary=cancel;
  window.guardianSecondaryGeometry=geometry;
  window.guardianSecondaryDangerPoints=points;
  window.drawGuardianSecondary=draw;
})();
