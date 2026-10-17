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
      // Three marked pounce locations. All positions locked during warning.
      // The flanks are separated enough for a player to dodge through.
      const sideX=-Math.sin(aim),sideY=Math.cos(aim);
      for(const offset of [-115,0,115]) {
        hooks.hazard?.(x+sideX*offset,y+sideY*offset,phase===3?73:63,.48,13+phase*2);
      }
    } else if(variant===1) {
      // Two staggered-looking spectral fans with a readable safe opening.
      const count=phase===3?18:phase===2?16:12;
      for(let i=0;i<count;i++){
        const theta=aim+i*2*Math.PI/count;
        const diff=Math.atan2(Math.sin(theta-aim),Math.cos(theta-aim));
        // Wide front-facing gap remains traversable.
        if(i<=1 || i>=count-1)continue;
        hooks.projectile?.(e,theta,145+phase*11,10+phase,"shadow");
      }
    } else if(variant===2) {
      // Two outward bell fan rows: middle lane remains clear.
      for(const offset of [-.85,-.66,-.45,.45,.66,.85])
        hooks.projectile?.(e,aim+offset,178+phase*12,11+phase,"bell");
      // Distinct ringing anchor away from the boss. Warning drawn in advance.
      hooks.hazard?.(x,y,phase===3?86:72,.48,11+phase*2);
    } else {
      // Final guardian reshapes positioning: four marked quadrants around the
      // snapshot, leaving a central space instead of an unavoidable full circle.
      const sideX=-Math.sin(aim),sideY=Math.cos(aim);
      const frontX=Math.cos(aim),frontY=Math.sin(aim);
      for(const [forward,side] of [[140,125],[140,-125],[-140,125],[-140,-125]])
        hooks.hazard?.(x+frontX*forward+sideX*side,
          y+frontY*forward+sideY*side,phase===3?88:72,.55,14+phase*2);
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
      if(gameTime<e.specialWarningUntil)return true;
      fireSignature(e,player,gameTime,hooks);
      return true;
    }
    if(!canStart(e,gameTime,!!hooks.visible))return busy(e,gameTime);
    const variant=e.isFinalBoss?3:e.variant;
    e.specialAim=Math.atan2(player.y-e.y,player.x-e.x);
    e.specialTargetX=player.x;
    e.specialTargetY=player.y;
    e.specialActiveName=attacks[variant].name;
    e.specialWarningUntil=gameTime+attacks[variant].warning;
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
        for(const offset of [-115,0,115])marker(x+sx*offset,y+sy*offset,phase===3?73:63);
      } else if(variant===1){
        for(const offset of [-1.15,-.78,.78,1.15]){
          ctx.beginPath();ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(aim+offset)*380,e.y+Math.sin(aim+offset)*380);
          ctx.stroke();
        }
      } else if(variant===2){
        for(const offset of [-.85,-.45,.45,.85]){
          ctx.beginPath();ctx.moveTo(e.x,e.y);
          ctx.lineTo(e.x+Math.cos(aim+offset)*380,e.y+Math.sin(aim+offset)*380);
          ctx.stroke();
        }
        marker(x,y,phase===3?86:72);
      } else {
        for(const [forward,side] of [[140,125],[140,-125],[-140,125],[-140,-125]])
          marker(x+fx*forward+sx*side,y+fy*forward+sy*side,phase===3?88:72);
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
  window.initializeBossCombat=initialize;
  window.updateBossCombat=update;
  window.isBossCombatBusy=busy;
  window.bossCombatDamageMultiplier=weakPointMultiplier;
  window.drawBossCombat=draw;
})();
