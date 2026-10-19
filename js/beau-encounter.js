// Beau de Hond showcase encounter — two specials and a phase-III ultimate.
// The existing shotgun + charge remain his ONLY standard attacks.
// One sequential state machine keeps attacks legible; no extra horde spawns.
(() => {
  "use strict";
  const isBeau = e => !!e && e.kind === 3 && e.variant === 0 && !e.isFinalBoss;
  const phase = e => e.phaseThree ? 3 : e.phaseTwo ? 2 : 1;
  const TAU = Math.PI * 2;
  const predict = (e,player) => window.bossCombatPredictTarget?.(e,player) || {x:player.x,y:player.y};
  function initialize(e,t=0) {
    if (!isBeau(e)) return;
    e.beauFight = {
      mode:"idle",stage:"",until:0,lockedAt:0,round:0,
      nextAt:t+12,alternation:0,ultimateUsed:false,
      target:{x:e.x,y:e.y},aim:0,chargeX:0,chargeY:0,
      echoes:[],force:null,trailAt:0
    };
  }
  function target(e,player) {
    const s=e.beauFight,p=predict(e,player);
    s.target={x:p.x,y:p.y};
    s.aim=Math.atan2(p.y-e.y,p.x-e.x);
  }
  function echoLocations(e) {
    const s=e.beauFight, tx=s.target.x,ty=s.target.y;
    const ax=Math.cos(s.aim),ay=Math.sin(s.aim);
    const sx=-ay,sy=ax;
    return [-1,1].map(k=>({
      x:tx - ax*170 + sx*k*235,
      y:ty - ay*170 + sy*k*235
    }));
  }
  function begin(e,which,t,player,hooks) {
    const s=e.beauFight;
    s.mode=which; s.round=0; s.echoes=[];
    e.chargeActive=0;e.chargeWarning=0;e.shotWarning=0;
    e.shootCooldown=Math.max(e.shootCooldown||0,3);
    e.chargeCooldown=Math.max(e.chargeCooldown||0,3);
    hooks.sfx?.("boss-warn");
    if(which==="hunt") {
      s.stage="huntTell";s.until=t+1.0;s.lockedAt=t+.32;
      target(e,player);
      hooks.notify?.("BEAU · HUNTING GROUNDS","boss",2.5);
    } else if(which==="pincer") {
      s.stage="pincerTell";s.until=t+1.05;s.lockedAt=t+.32;
      target(e,player);s.echoes=echoLocations(e);
      hooks.notify?.("BEAU · PINCER AMBUSH","boss",2.5);
    } else {
      s.ultimateUsed=true;s.stage="ultimateIntro";
      s.until=t+1.65;s.lockedAt=t;
      // Start the set-piece clean; old shotgun projectiles and hit markers
      // must not create unexpected hits during the cinematic warning.
      hooks.clearBossAttacks?.();
      window.beginGuardianArenaPower?.(e,t,player);
      target(e,player);
      hooks.notify?.("THE FINAL HUNT · THERE IS NO HIDING","boss",4);
      hooks.puff?.(e.x,e.y,"#ff665e",26);
      hooks.shake?.(10);
    }
  }
  function finish(e,t,hooks) {
    const s=e.beauFight;
    const ultimate=s.mode==="ultimate";
    s.mode="idle";s.stage="";s.echoes=[];
    s.force=null;s.nextAt=t+(phase(e)===3?10:13);
    if(ultimate)window.interruptGuardianArenaPower?.(e);
    e.specialRecoveryUntil=t+(ultimate?2.6:2.1);
    e.chargeCooldown=Math.max(e.chargeCooldown||0,2.5);
    e.shootCooldown=Math.max(e.shootCooldown||0,2);
    hooks.notify?.("BEAU EXPOSED · STRIKE NOW!","boss",2);
    hooks.puff?.(e.x,e.y,"#a4ffe5",18);
  }
  function mark(hooks,x,y,r,warning=.28,damage=14){
    hooks.hazard?.(x,y,r,warning,damage);
  }
  function houndShots(e,hooks,angle,speed=350) {
    for(const offset of [-.16,0,.16])
      hooks.projectile?.(e,angle+offset,speed,11,"fish");
  }
  function tick(e,t,dt,player,hooks={}) {
    if(!isBeau(e) || !e.beauFight)return false;
    const s=e.beauFight;
    if(s.mode==="idle") {
      if(!hooks.visible || !e.phaseTwo || e.phaseIntro>0 ||
          e.shotWarning>0 || e.chargeWarning>0 || e.chargeActive>0 ||
          e.guardianWarningUntil>t || e.specialRecoveryUntil>t) return false;
      let next = s.force;
      if(!next) {
        if(e.phaseThree && !s.ultimateUsed)next="ultimate";
        else if(t >= s.nextAt)next=s.alternation++%2 ? "pincer" : "hunt";
      }
      if(!next)return false;
      if(next==="ultimate" && !e.phaseThree)return false;
      s.force=null;
      begin(e,next,t,player,hooks);
      return true;
    }
    if(t<s.lockedAt && /Tell$/.test(s.stage)) {
      target(e,player);
      if(s.stage==="pincerTell")s.echoes=echoLocations(e);
    }
    if(s.stage==="huntTell" && t>=s.until) {
      const angle=Math.atan2(s.target.y-e.y,s.target.x-e.x);
      s.chargeX=Math.cos(angle);s.chargeY=Math.sin(angle);
      s.stage="huntRush";s.until=t+.66;s.trailAt=t;
      houndShots(e,hooks,angle,392+phase(e)*17);
      hooks.shake?.(5);
      hooks.puff?.(e.x,e.y,"#ffb86b",15);
    } else if(s.stage==="huntRush") {
      // Real boss movement along the locked charge lane, never teleportation.
      const step=(835+phase(e)*50)*Math.min(dt,.04);
      e.x+=s.chargeX*step;e.y+=s.chargeY*step;
      if(t>=s.trailAt){
        mark(hooks,e.x,e.y,83,.42,15+phase(e)*3);
        s.trailAt=t+.17; // visible pursuit trail; dodge perpendicular to charge
      }
      if(t>=s.until){
        s.stage="huntPause";s.until=t+.26;s.round++;
      }
    } else if(s.stage==="huntPause" && t>=s.until) {
      if(s.round>=4)finish(e,t,hooks);
      else {
        // Retarget after each committed rush; staying on the same side is unsafe.
        s.stage="huntTell";s.until=t+.78;s.lockedAt=t+.25;target(e,player);
      }
    } else if(s.stage==="pincerTell" && t>=s.until){
      for(const echo of s.echoes){
        const angle=Math.atan2(s.target.y-echo.y,s.target.x-echo.x);
        for(const offset of [-.15,0,.15])
          hooks.projectile?.(echo,angle+offset,345+phase(e)*8,12,"fish");
        hooks.puff?.(echo.x,echo.y,"#d58eff",12);
      }
      hooks.shake?.(6);
      // Boss fires down the threatened centre while echoes close both sides.
      const angle=Math.atan2(s.target.y-e.y,s.target.x-e.x);
      houndShots(e,hooks,angle,365);
      // The corridor detonates after the fish volleys, creating a timing puzzle:
      // dodge the flanks, then leave the narrow centre stripe.
      const ax=Math.cos(s.aim),ay=Math.sin(s.aim),sx=-ay,sy=ax;
      for(const distance of [-135,0,135]){
        mark(hooks,s.target.x+sx*distance,s.target.y+sy*distance,67,.62,14+phase(e));
      }
      s.stage="pincerPause";s.until=t+.75;s.round++;
    } else if(s.stage==="pincerPause" && t>=s.until){
      if(s.round>=2)finish(e,t,hooks);
      else {
        s.stage="pincerTell";s.until=t+.96;s.lockedAt=t+.27;
        target(e,player);s.echoes=echoLocations(e);
      }
    } else if(s.stage==="ultimateIntro" && t>=s.until){
      s.stage="ultimateTell";s.until=t+1.05;s.lockedAt=t+.28;target(e,player);
    } else if(s.stage==="ultimateTell" && t>=s.until){
      const ax=Math.cos(s.aim),ay=Math.sin(s.aim),sx=-ay,sy=ax;
      const x=s.target.x,y=s.target.y;
      // One tracked impact plus offset cuts off the obvious escape direction.
      mark(hooks,x,y,105,.52,17+phase(e));
      const side=s.round%2?1:-1;
      mark(hooks,x+sx*side*160+ax*90,y+sy*side*160+ay*90,89,.52,15);
      // Two staggered retreat traps punish autopilot but leave diagonal escapes.
      mark(hooks,x-ax*180,y-ay*180,84,.62,16);
      mark(hooks,x+ax*145-sx*side*165,y+ay*145-sy*side*165,74,.62,15);
      for(const off of [-.3,-.1,.1,.3])
        hooks.projectile?.(e,s.aim+off,360+phase(e)*10,12,"fish");
      hooks.puff?.(x,y,"#ff7771",20);
      hooks.shake?.(8);
      s.stage="ultimatePause";s.until=t+.43;s.round++;
    } else if(s.stage==="ultimatePause" && t>=s.until){
      if(s.round>=3){
        s.stage="ultimateFinalTell";s.until=t+1.4;
        s.lockedAt=t+.3;target(e,player);
      }else{
        s.stage="ultimateTell";s.until=t+1.0;s.lockedAt=t+.27;target(e,player);
      }
    } else if(s.stage==="ultimateFinalTell" && t>=s.until){
      const ax=Math.cos(s.aim),ay=Math.sin(s.aim),sx=-ay,sy=ax;
      const x=s.target.x,y=s.target.y;
      for(const off of [-2,-1,0,1,2]){
        mark(hooks,x+sx*off*145,y+sy*off*145,94,.54,19);
      }
      // Last beat threatens a retreat, never the entire screen.
      mark(hooks,x-ax*155,y-ay*155,83,.57,17);
      for(const off of [-.55,-.32,-.12,0,.12,.32,.55])
        hooks.projectile?.(e,s.aim+off,390,14,"fish");
      hooks.puff?.(x,y,"#ffe3a1",32);
      hooks.shake?.(14);
      hooks.sfx?.("bomb");
      s.stage="ultimateEnd";s.until=t+.58;
    } else if(s.stage==="ultimateEnd" && t>=s.until){
      finish(e,t,hooks);
    }
    return true;
  }
  function interrupt(e,t){
    if(!isBeau(e) || !e.beauFight)return false;
    const s=e.beauFight;
    if(s.mode==="idle")return false;
    // The HP phase transition interrupts the previous pattern instead of
    // skipping its warning frames and delivering an instant, unfair hit.
    s.mode="idle";s.stage="";s.echoes=[];
    window.interruptGuardianArenaPower?.(e);
    s.until=0;s.lockedAt=0;s.nextAt=t+1.5;
    e.specialRecoveryUntil=0;
    return true;
  }
  function force(e,mode,t){
    if(!isBeau(e) || !e.beauFight || !["hunt","pincer","ultimate"].includes(mode))return false;
    if(mode==="ultimate" && e.beauFight.ultimateUsed)return false;
    e.beauFight.force=mode;
    e.beauFight.nextAt=t;
    return true;
  }
  // Canvas-only cinematic VFX: no sprites or external dependencies needed.
  // Backdrop belongs behind projectiles; tells are drawn around the boss.
  function backdrop(e,ctx,t,player,quality,w,h) {
    if(!isBeau(e) || !e.beauFight || e.beauFight.mode==="idle" || !player)return;
    const s=e.beauFight,ultimate=s.mode==="ultimate";
    ctx.save();
    if(ultimate) {
      const distance=Math.max(300,Math.hypot(w,h)*.67);
      if(quality!=="low"){
        const fog=ctx.createRadialGradient(player.x,player.y,85,player.x,player.y,distance);
        fog.addColorStop(0,"rgba(9,2,15,0.03)");
        fog.addColorStop(.39,"rgba(20,4,22,0.34)");
        fog.addColorStop(1,"rgba(10,2,15,0.82)");
        ctx.fillStyle=fog;
      }else ctx.fillStyle="rgba(18,4,24,0.36)";
      ctx.fillRect(player.x-w/2,player.y-h/2,w,h);
      ctx.strokeStyle="#ff656a";
      ctx.globalAlpha=.42;
      ctx.lineWidth=quality==="low"?2:4;
      for(let i=0;i<3;i++){
        const radius=180+i*115+Math.sin(t*2.8+i)*9;
        ctx.beginPath();ctx.arc(e.x,e.y,radius,0,TAU);ctx.stroke();
      }
      if(quality!=="low"){
        ctx.font="bold 26px system-ui, sans-serif";
        ctx.textAlign="center";
        ctx.fillStyle="#ffb6b2";
        ctx.globalAlpha=.78;
        ctx.fillText("THE FINAL HUNT",player.x,player.y-h*.38);
      }
    } else {
      ctx.strokeStyle=s.mode==="hunt"?"#ffb66e":"#c9a3ff";
      ctx.lineWidth=3;ctx.globalAlpha=.28;
      const pulse=110+Math.sin(t*5)*9;
      ctx.beginPath();ctx.arc(e.x,e.y,pulse,0,TAU);ctx.stroke();
    }
    ctx.restore();
  }
  function telegraph(e,ctx,t,quality){
    if(!isBeau(e) || !e.beauFight || e.beauFight.mode==="idle")return;
    const s=e.beauFight;
    const low=quality==="low",x=s.target.x,y=s.target.y;
    const ax=Math.cos(s.aim),ay=Math.sin(s.aim),sx=-ay,sy=ax;
    ctx.save();
    ctx.lineWidth=low?3:5;
    ctx.globalAlpha=.86;
    ctx.strokeStyle=s.mode==="ultimate"?"#ff677f":s.mode==="hunt"?"#ffb36b":"#c7a0ff";
    if(!low){ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=15}
    ctx.setLineDash([13,9]);
    const mark=(px,py,r)=>{
      ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.stroke();
      if(!low){
        ctx.beginPath();ctx.moveTo(px-r*.46,py);ctx.lineTo(px+r*.46,py);
        ctx.moveTo(px,py-r*.46);ctx.lineTo(px,py+r*.46);ctx.stroke();
      }
    };
    if(s.mode==="hunt"){
      if(s.stage==="huntTell"){
        // At every phase, the drawn corridor reaches the real charge distance.
        const reach=(835+phase(e)*50)*.66+16;
        // Fast charge corridor: central aimed lane is genuinely dangerous.
        ctx.beginPath();ctx.moveTo(e.x,e.y);
        ctx.lineTo(e.x+ax*reach,e.y+ay*reach);
        ctx.lineWidth=low?52:90;ctx.globalAlpha=.19;ctx.stroke();
        ctx.globalAlpha=.9;ctx.lineWidth=low?2:4;
        ctx.beginPath();ctx.moveTo(e.x+sx*55,e.y+sy*55);
        ctx.lineTo(e.x+ax*reach+sx*55,e.y+ay*reach+sy*55);
        ctx.moveTo(e.x-sx*55,e.y-sy*55);
        ctx.lineTo(e.x+ax*reach-sx*55,e.y+ay*reach-sy*55);
        ctx.stroke();
        mark(x,y,40);
      }else if(s.stage==="huntRush"){
        ctx.setLineDash([]);
        ctx.lineWidth=low?8:18;
        ctx.globalAlpha=.4;
        ctx.beginPath();ctx.moveTo(e.x-ax*110,e.y-ay*110);
        ctx.lineTo(e.x,e.y);ctx.stroke();
      }
    }else if(s.mode==="pincer"){
      if(s.stage==="pincerTell"){
        for(const echo of s.echoes){
          ctx.save();ctx.setLineDash([]);
          ctx.globalAlpha=.38;
          ctx.fillStyle="#8e55bf";
          ctx.beginPath();ctx.arc(echo.x,echo.y,24,0,TAU);ctx.fill();
          ctx.restore();
          ctx.beginPath();ctx.moveTo(echo.x,echo.y);ctx.lineTo(x,y);ctx.stroke();
        }
        ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(x,y);ctx.stroke();
        for(const offset of [-135,0,135])mark(x+sx*offset,y+sy*offset,67);
      }
    }else{
      if(s.stage==="ultimateIntro"){
        ctx.lineWidth=8;ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(e.x,e.y,90+(s.until-t)*115,0,TAU);ctx.stroke();
      }else if(s.stage==="ultimateTell"){
        mark(x,y,105);
        mark(x-ax*180,y-ay*180,84);
        const side=s.round%2?1:-1;
        mark(x+sx*side*160+ax*90,y+sy*side*160+ay*90,89);
        mark(x+ax*145-sx*side*165,y+ay*145-sy*side*165,74);
        ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(x,y);ctx.stroke();
      }else if(s.stage==="ultimateFinalTell"){
        for(const side of [-2,-1,0,1,2])mark(x+sx*side*145,y+sy*side*145,94);
        mark(x-ax*155,y-ay*155,83);
        ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(x,y);ctx.stroke();
      }else{
        ctx.lineWidth=4;ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(x,y,100+Math.sin(t*9)*20,0,TAU);ctx.stroke();
      }
    }
    ctx.restore();
  }
  window.drawBeauBackdrop=backdrop;
  window.drawBeauTelegraph=telegraph;
  window.initializeBeauEncounter=initialize;
  window.updateBeauEncounter=tick;
  window.forceBeauEncounter=force;
  window.interruptBeauEncounter=interrupt;
  window.getBeauEncounterStatus=e=>e?.beauFight ? {
    mode:e.beauFight.mode,stage:e.beauFight.stage,round:e.beauFight.round,
    ultimateUsed:e.beauFight.ultimateUsed
  }:null;
})();
