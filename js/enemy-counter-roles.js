// Update 35 — visual silhouette = actual defender ability; no extra spawns.
// Upgrades existing Zombie Mike / tactical Pouncer Runner / tactical Ward Bulwark.
(() => {
  "use strict";
  const TAU=Math.PI*2;
  const LABELS=Object.freeze({
    anchor:"THE ANCHOR",phaseStalker:"PHASE STALKER",warden:"THE WARDEN"
  });
  function init(e){
    if(!e||e.dead||e.kind===3||e.summoned)return e;
    // No supernatural counter skill on a fresh, unmutated creature.
    // Same family + same evolution level = identical supernatural kit.
    // Tactical squads can cooperate but never randomly unlock a power.
    const level=e.evolutionLevel||1;
    const role=e.kind===2&&level>=3?"anchor"
      :e.kind===1&&level>=3?"phaseStalker"
      :e.kind===6&&level>=3?"warden":null;
    if(e.counterRole!==role){
      e.counterRole=role;
      if(role==="anchor")e.counterCrackedUntil=0;
      if(role==="phaseStalker")e.counterExposureUntil=0;
    }
    return e;
  }
  function protectedAllies(ward){
    if(!ward||ward.dead||ward.hp<=0||ward.counterRole!=="warden"||
       !ward.shieldActive||!Array.isArray(ward.encounterPartners))return [];
    const team=ward.encounterPartners;
    const result=[];
    for(const ally of team){
      if(result.length>=2)break;
      if(!ally||ally===ward||ally.dead||ally.hp<=0||
         ally.encounterGroup!==ward.encounterGroup)continue;
      const dx=ally.x-ward.x,dy=ally.y-ward.y;
      if(dx*dx+dy*dy<=155*155)result.push(ally);
    }
    return result;
  }
  function wardFor(e){
    if(!e||!Array.isArray(e.encounterPartners)||!e.encounterGroup)return null;
    for(const ally of e.encounterPartners){
      if(ally===e||!ally||ally.dead||ally.hp<=0||
         ally.encounterGroup!==e.encounterGroup)continue;
      if(protectedAllies(ally).includes(e))return ally;
    }
    return null;
  }
  function movementFactor(e,source="generic",now=0){
    if(!e||e.dead||e.kind===3||e.summoned)return 1;
    if(e.counterRole==="anchor")
      return source==="whirlpool"?.35:.65; // .12 baseline becomes .042/.078
    return wardFor(e)?.shieldActive ? .33 : 1;
  }
  function damageFactor(e,type,now){
    if(!e||e.dead||e.kind===3||e.summoned)return 1;
    if(e.counterRole==="anchor"&&(e.counterCrackedUntil||0)>now &&
       type!=="burn"&&type!=="poison")return 1.20;
    if(e.counterRole==="phaseStalker"&&(e.counterExposureUntil||0)>now)
      return 1.20;
    return 1;
  }
  function onDamaged(e,type,now=0){
    if(e?.dead||e?.counterRole!=="anchor")return false;
    if(type!=="bomb")return false;
    e.counterCrackedUntil=Math.max(e.counterCrackedUntil||0,now+2.6);
    return true;
  }
  function draw(e,ctx,now,quality="high"){
    if(!e?.counterRole||e.dead||!ctx?.save)return;
    const low=quality==="low",role=e.counterRole;
    ctx.save();ctx.lineWidth=low?3:4;
    if(role==="anchor"){
      const crack=(e.counterCrackedUntil||0)>now;
      ctx.strokeStyle=crack?"#ffe7ac":"#dd8a55";
      ctx.globalAlpha=crack?.95:.87;
      const size=e.r+12;
      // Four massive feet / anchors stay wider than the actual silhouette.
      for(const dx of [-1,1])for(const dy of [-1,1]){
        const x=e.x+dx*size*.72,y=e.y+dy*size*.72;
        ctx.beginPath();ctx.moveTo(x-dx*7,y);
        ctx.lineTo(x+dx*9,y);ctx.lineTo(x+dx*9,y+dy*10);ctx.stroke();
      }
      if(crack){
        ctx.beginPath();ctx.arc(e.x,e.y,e.r+15,0,TAU);ctx.stroke();
      }
    }else if(role==="phaseStalker"){
      const exposed=(e.counterExposureUntil||0)>now;
      ctx.strokeStyle=exposed?"#ffe1ad":"#f5b5ff";
      ctx.globalAlpha=.92;
      // Sleek split afterimages signal diagonal dash ability on Low too.
      const a=e.tacticAngle||0,ux=Math.cos(a),uy=Math.sin(a),
        sx=-uy,sy=ux;
      for(const side of [-1,1]){
        const x=e.x+sx*side*(e.r+15),y=e.y+sy*side*(e.r+15);
        ctx.beginPath();ctx.moveTo(x-ux*14,y-uy*14);
        ctx.lineTo(x+ux*8,y+uy*8);ctx.stroke();
      }
      if(exposed){
        ctx.beginPath();ctx.arc(e.x,e.y,e.r+14,0,TAU);ctx.stroke();
      }
    }else if(role==="warden"){
      ctx.strokeStyle=e.shieldActive?"#76f5d0":"#b4ad93";
      ctx.globalAlpha=.88;
      // Concentric shield links show who ACTUALLY resists Water push.
      ctx.beginPath();ctx.arc(e.x,e.y,e.r+16,0,TAU);ctx.stroke();
      if(e.shieldActive){
        const allies=protectedAllies(e);
        ctx.setLineDash([8,5]);
        ctx.lineWidth=low?2.4:3.1;
        for(const ally of allies){
          ctx.beginPath();ctx.moveTo(e.x,e.y);
          ctx.lineTo(ally.x,ally.y);ctx.stroke();
          ctx.beginPath();ctx.arc(ally.x,ally.y,ally.r+8,0,TAU);ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }
  window.enemyCounterRoleNames=LABELS;
  window.initializeEnemyCounterRole=init;
  window.enemyCounterProtectedAllies=protectedAllies;
  window.enemyCounterWardFor=wardFor;
  window.enemyCounterMovementFactor=movementFactor;
  window.enemyCounterDamageMultiplier=damageFactor;
  window.enemyCounterOnDamaged=onDamaged;
  window.drawEnemyCounterRole=draw;
})();
