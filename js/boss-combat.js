// Boss Combat 4.4B — longer encounters, identifiable signature attacks and
// deliberate counterattack windows. The game's existing charge/fan/Guardian
// abilities stay intact; this layer never creates ordinary enemies.
(() => {
  "use strict";
  const attacks = Object.freeze({
    0: Object.freeze({ name: "HOUND'S AMBUSH", color: "#ffbb85", warning: 1.2 }),
    1: Object.freeze({ name: "ECLIPSE SHATTER", color: "#cbb0ff", warning: 1.3 }),
    2: Object.freeze({ name: "DEATH KNELL", color: "#f5d28f", warning: 1.25 }),
    3: Object.freeze({ name: "REALITY BREAK", color: "#ffa9ec", warning: 1.55 }),
  });
  const phaseOf = e => e.isFinalBoss ? Math.max(1,e.finalPhase||1) :
    e.phaseThree ? 3 : e.phaseTwo ? 2 : 1;
  // Aim toward where the moving player is going, with an intentionally short
  // and bounded lead. Standing still means no prediction.
  function predictTarget(e, player) {
    const vx = Number.isFinite(player.combatVX) ? player.combatVX : 0;
    const vy = Number.isFinite(player.combatVY) ? player.combatVY : 0;
    const lead = Math.min(0.5,0.32+phaseOf(e)*0.045);
    const lx = vx*lead, ly = vy*lead;
    const length = Math.hypot(lx,ly);
    const scale = length > 130 ? 130/length : 1;
    return {x:player.x+lx*scale,y:player.y+ly*scale};
  }
  function lockTarget(e,player){
    const target=predictTarget(e,player);
    e.specialTargetX=target.x;
    e.specialTargetY=target.y;
    e.specialAim=Math.atan2(target.y-e.y,target.x-e.x);
  }

  function maxHealth(base, {final=false, index=1}={}) {
    // Tunable encounter health, not an unbounded escalation. First boss:
    // ~2.2x previous HP. Final guardian: ~1.8x original.
    const multiplier = final ? 1.78 : 2.05 + Math.min(0.45, Math.max(0,index-1)*0.12);
    return Math.max(1,Math.round(base * multiplier));
  }
  function initialize(e, gameTime=0) {
    if (!e || e.kind!==3) return e;
    e.combatPhase=1;
    e.specialWarningUntil=0;
    e.specialActiveName="";
    e.specialAim=0;
    e.specialTargetX=e.x;
    e.specialTargetY=e.y;
    e.specialNextAt=gameTime+7.5;
    e.specialRecoveryUntil=0;
    e.specialCount=0;
    e.specialTelegraphSize=0;
    e.specialTrackingUntil=0;
    return e;
  }
  function busy(e, gameTime) {
    return !!e && e.kind===3 &&
      (e.specialWarningUntil>gameTime || e.specialRecoveryUntil>gameTime);
  }
  function weakPointMultiplier(e, gameTime) {
    // Real reward for surviving the pattern, independent of weapon type.
    if(!e || e.kind!==3) return 1;
    return e.specialRecoveryUntil>gameTime ? 1.42 : 1;
  }
  function canStart(e,gameTime,onScreen) {
    if(!e || !onScreen || e.dead || gameTime < e.specialNextAt ||
       e.phaseIntro>0 || e.shotWarning>0 || e.chargeWarning>0 ||
       e.chargeActive>0 || e.guardianWarningUntil>gameTime ||
       gameTime<e.specialRecoveryUntil) return false;
    return true;
  }
  function fireSignature(e, player, gameTime, hooks) {
    const variant = e.isFinalBoss ? 3 : e.variant;
    const phase = phaseOf(e);
    const x=e.specialTargetX, y=e.specialTargetY;
    const aim=e.specialAim;
    if(variant===0) {
      // An overlapping ambush across the player's predicted path, followed
      // by three fast hound bolts. Escape sideways or dash out of the band.
      const sideX=-Math.sin(aim),sideY=Math.cos(aim);
      for(const offset of [-90,0,90]) {
        hooks.hazard?.(x+sideX*offset,y+sideY*offset,phase===3?97:86,.22,13+phase*2);
      }
      for(const offset of [-.16,0,.16])
        hooks.projectile?.(e,aim+offset,320+phase*12,9+phase,"fish");
    } else if(variant===1) {
      // Aimed triple lance forces movement; the surrounding shadow ring
      // offers a SIDE exit rather than automatically opening at the player.
      const count=phase===3?18:phase===2?16:12;
      const gapAngle=aim+Math.PI*.72;
      for(let i=0;i<count;i++){
        const theta=aim+i*2*Math.PI/count;
        const diff=Math.atan2(Math.sin(theta-gapAngle),Math.cos(theta-gapAngle));
        if(Math.abs(diff)<Math.PI*2/count*1.35)continue;
        hooks.projectile?.(e,theta,245+phase*12,10+phase,"shadow");
      }
      for(const offset of [-.16,0,.16])
        hooks.projectile?.(e,aim+offset,325+phase*12,10+phase,"shadow");
    } else if(variant===2) {
      // Center is dangerous: a fast focused bell-strike with flanking bolts.
      for(const offset of [-.6,-.38,-.19,0,.19,.38,.6])
        hooks.projectile?.(e,aim+offset,310+phase*12,11+phase,"bell");
      hooks.hazard?.(x,y,phase===3?105:92,.24,11+phase*2);
    } else {
      // Targeting the center prevents standing still from countering Reality
      // Break; outer cells cut off the obvious diagonal routes, not all exits.
      const sideX=-Math.sin(aim),sideY=Math.cos(aim);
      const frontX=Math.cos(aim),frontY=Math.sin(aim);
      hooks.hazard?.(x,y,phase===3?113:101,.25,14+phase*2);
      for(const [forward,side] of [[155,145],[155,-145],[-155,145],[-155,-145]])
        hooks.hazard?.(x+frontX*forward+sideX*side,
          y+frontY*forward+sideY*side,phase===3?90:77,.25,14+phase*2);
    }
    e.specialCount++;
    e.specialWarningUntil=0;
    e.specialRecoveryUntil=gameTime+(phase===3?1.4:1.9);
    e.specialNextAt=gameTime+(phase===3?9.5:phase===2?11.5:14);
    e.shootCooldown=Math.max(e.shootCooldown||0,1.55);
    e.chargeCooldown=Math.max(e.chargeCooldown||0,2.4);
    hooks.notify?.("GUARDIAN EXPOSED · COUNTERATTACK NOW","boss",1.8);
    hooks.puff?.(e.x,e.y,attacks[variant].color,12);
  }
  function update(e,gameTime,player,hooks={}) {
    if(!e || e.kind!==3 || !player || !attacks[e.isFinalBoss?3:e.variant])
      return false;
    const phase=phaseOf(e);
    if(phase>e.combatPhase){
      e.combatPhase=phase;
      e.specialNextAt=Math.min(e.specialNextAt,gameTime+3.2);
    }
    if(e.specialWarningUntil>0) {
      // Follow the player's motion only during the first part of the tell.
      // The final ~0.7s is fully locked and always matches the marked danger.
      if(gameTime<e.specialTrackingUntil)lockTarget(e,player);
      if(gameTime<e.specialWarningUntil)return true;
      fireSignature(e,player,gameTime,hooks);
      return true;
    }
    if(!canStart(e,gameTime,!!hooks.visible))return busy(e,gameTime);
    const variant=e.isFinalBoss?3:e.variant;
    lockTarget(e,player);
    e.specialActiveName=attacks[variant].name;
    e.specialWarningUntil=gameTime+attacks[variant].warning;
    e.specialTrackingUntil=gameTime+.4;
    e.specialTelegraphSize=phase;
    // Cancel no active normal attack; wait for a safe opening to start.
    hooks.notify?.("GUARDIAN ATTACK · "+e.specialActiveName,"boss",2);
    return true;
  }
  function draw(e,ctx,gameTime,quality) {
    if(!e || e.kind!==3)return;
    const variant=e.isFinalBoss?3:e.variant;
    const entry=attacks[variant];
    if(!entry)return;
    const warning=e.specialWarningUntil>gameTime;
    const recovery=e.specialRecoveryUntil>gameTime;
    if(!warning && !recovery)return;
    ctx.save();
    const r=Math.max(20,e.r);
    const low=quality==="low";
    ctx.lineWidth=low?2.5:4;
    ctx.strokeStyle=warning?entry.color:"#8affdf";
    ctx.globalAlpha=warning?.85:.7;
    if(!low){ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=12}
    ctx.setLineDash(warning?[12,7]:[]);
    if(warning){
      const x=e.specialTargetX,y=e.specialTargetY;
      const aim=e.specialAim;
      const sx=-Math.sin(aim),sy=Math.cos(aim);
      const fx=Math.cos(aim),fy=Math.sin(aim);
      const phase=e.specialTelegraphSize||1;
      const marker=(px,py,rad)=>{
        ctx.beginPath();ctx.arc(px,py,rad,0,2*Math.PI);ctx.stroke();
      };
      if(variant===0){
        for(const offset of [-90,0,90])marker(x+sx*offset,y+sy*offset,phase===3?97:86);
        for(const offset of [-.16,0,.16]){
          ctx.beginPath();ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(aim+offset)*380,e.y+Math.sin(aim+offset)*380);
          ctx.stroke();
        }
      } else if(variant===1){
        const count=phase===3?18:phase===2?16:12;
        const gap=aim+Math.PI*.72;
        ctx.beginPath();ctx.arc(e.x,e.y,190,gap+.28,gap+Math.PI*2-.28);ctx.stroke();
        for(const offset of [-.16,0,.16]){
          ctx.beginPath();ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(aim+offset)*380,e.y+Math.sin(aim+offset)*380);
          ctx.stroke();
        }
      } else if(variant===2){
        for(const offset of [-.6,-.38,-.19,0,.19,.38,.6]){
          ctx.beginPath();ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(aim+offset)*380,e.y+Math.sin(aim+offset)*380);
          ctx.stroke();
        }
        marker(x,y,phase===3?105:92);
      } else {
        marker(x,y,phase===3?113:101);
        for(const [forward,side] of [[155,145],[155,-145],[-155,145],[-155,-145]])
          marker(x+fx*forward+sx*side,y+fy*forward+sy*side,phase===3?90:77);
      }
    } else {
      // Exposed core ring conveys the 42% counterattack bonus.
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(e.x,e.y,r*1.34+4*Math.sin(gameTime*9),0,Math.PI*2);
      ctx.stroke();
      if(!low){ctx.beginPath();ctx.arc(e.x,e.y,r*.72,0,Math.PI*2);ctx.stroke();}
    }
    ctx.restore();
  }
  window.bossCombatCatalog=attacks;
  window.bossCombatMaxHealth=maxHealth;
  window.bossCombatPredictTarget=predictTarget;
  window.initializeBossCombat=initialize;
  window.updateBossCombat=update;
  window.isBossCombatBusy=busy;
  window.bossCombatDamageMultiplier=weakPointMultiplier;
  window.drawBossCombat=draw;
})();
