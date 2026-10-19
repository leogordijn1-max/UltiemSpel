// Update 10.3: compact encounters with distinct skills and readable telegraphs.
// Abilities are limited to tactical packs; ordinary enemies remain readable.
(() => {
"use strict";
const TAU=Math.PI*2;
const COLORS={vanguard:"#87d8fa",binder:"#a8a6ff",pouncer:"#ffad68",
  skirmisher:"#ffcf7a",crossfire:"#ff79c4",crusher:"#ff6f67",ward:"#80e3cf",
  volatile:"#ffad57"};
let groupSequence=0;
let brokenAnnouncements=new Set();
function reset(){groupSequence=0;brokenAnnouncements.clear();}
const validRoles={0:["vanguard","binder"],1:["skirmisher","pouncer"],
  2:["crusher"],4:["crossfire"],5:["volatile"],6:["ward"]};
function assign(e,position=0,groupId=null,requestedRole=null){
  if(!e||e.kind===3||e.summoned)return e;
  const roles=validRoles[e.kind];
  if(!roles)return e;
  const role=roles.includes(requestedRole)?requestedRole:
    e.kind===0?(position%3===0?"vanguard":"binder")
    :e.kind===1?(position%2===0?"skirmisher":"pouncer")
    :roles[0];
  e.encounterTactic=role;
  e.encounterSlot=position;
  e.encounterGroup=groupId||("pack-"+(++groupSequence));
  e.tacticCooldown=1.6+(position%3)*.7;
  e.tacticWarning=0;e.tacticDashTime=0;
  e.tacticWarningDuration=0;e.tacticDashLength=0;e.tacticDashWidth=0;
  if(role==="volatile")e.burstRadius=Math.max(e.burstRadius||86,104);
  // Selected tactical Runner and Bulwark members become visible named roles.
  window.initializeEnemyCounterRole?.(e);
  return e;
}
function groupId(){return "pack-"+(++groupSequence);}
function livingPartners(e){
  return Array.isArray(e?.encounterPartners)?
    e.encounterPartners.filter(ally=>
      ally!==e&&!ally.dead&&ally.hp>0&&ally.encounterGroup===e.encounterGroup):[];
}
function guardIntercept(e,player){
  // A living guard actually protects the ranged support instead of mindlessly
  // following the player. Killing the guard removes this physical obstacle.
  const support=livingPartners(e).find(a=>a.encounterTactic==="crossfire")||
    livingPartners(e).find(a=>a.encounterTactic==="binder");
  if(!support)return null;
  const playerDx=player.x-support.x,playerDy=player.y-support.y;
  const distance=Math.hypot(playerDx,playerDy)||1;
  const targetX=support.x+playerDx/distance*62;
  const targetY=support.y+playerDy/distance*62;
  const toX=targetX-e.x,toY=targetY-e.y;
  if(Math.hypot(toX,toY)>52 && Math.hypot(e.x-support.x,e.y-support.y)<330)
    return {angle:Math.atan2(toY,toX),speedMult:1.12};
  return null;
}
function onDeath(e,now=0,visible=true){
  if(!e?.encounterTactic||!Array.isArray(e.encounterPartners))return false;
  const remaining=livingPartners(e);
  if(e.encounterTactic==="binder"){
    // The charge currently under way is not cancelled, but a dead binder
    // must never continue powering future team attacks.
    for(const ally of remaining){
      if(ally.encounterTactic==="pouncer"){
        ally.tacticComboBoostUntil=0;
        ally.tacticLastBoostAt=now;
      }
    }
  }
  if(e.encounterTactic!=="vanguard"&&e.encounterTactic!=="ward")return false;
  if(!remaining.length)return false;
  for(const ally of remaining){
    ally.tacticExposedUntil=Math.max(ally.tacticExposedUntil||0,now+3);
    if(ally.encounterTactic==="pouncer"&&
       ally.tacticWarning<=0&&ally.tacticDashTime<=0)
      ally.tacticCooldown=Math.min(ally.tacticCooldown||0,.65);
  }
  // At most one warning per squad, including waves and late-game encounters.
  if(visible && !brokenAnnouncements.has(e.encounterGroup)){
    if(brokenAnnouncements.size>=128)brokenAnnouncements.clear();
    brokenAnnouncements.add(e.encounterGroup);
    window.notifyEncounterPatrol?.("FORMATION BROKEN · OPENING 3s");
  }
  return true;
}
function linkTeam(members){
  if(!Array.isArray(members))return 0;
  // Only a handful of squad members; avoid searching every enemy each frame.
  const team=members.filter(e=>e?.encounterTactic&&!e.dead);
  for(const e of team)e.encounterPartners=team;
  return team.length;
}
function syncTactics(e,now){
  if(e.encounterTactic!=="pouncer"||!Array.isArray(e.encounterPartners))return;
  for(const ally of e.encounterPartners){
    if(ally===e||ally.dead||ally.hp<=0||ally.encounterTactic!=="binder")continue;
    if(ally.tacticWarning>0)e.tacticCooldown=Math.min(e.tacticCooldown||0,.45);
    // One quick charge after a real slowing pulse, never repeat on the same pulse.
    if(Number.isFinite(ally.tacticPulseAt)&&now-ally.tacticPulseAt<1.6&&
        ally.tacticPulseAt!==e.tacticLastBoostAt){
      e.tacticCooldown=0;
      e.tacticComboBoostUntil=now+1.4;
      e.tacticLastBoostAt=ally.tacticPulseAt;
    }
  }
}
function tick(e,dt,player,now,visible,hooks={}){
  if(!e?.encounterTactic||e.dead||!player||!visible||!Number.isFinite(dt)||dt<=0)return null;
  const role=e.encounterTactic;
  syncTactics(e,now);
  const dx=player.x-e.x,dy=player.y-e.y;
  const distance=Math.hypot(dx,dy)||1;
  if(role==="skirmisher"&&distance>130&&distance<610){
    // Aim ahead of moving players and split left/right. This is a positional
    // threat only: actual damage still requires collision and can be dodged.
    const leadX=Math.max(-240,Math.min(240,player.combatVX||0))*.17;
    const leadY=Math.max(-240,Math.min(240,player.combatVY||0))*.17;
    const aim=Math.atan2(dy+leadY,dx+leadX);
    return {angle:aim+(e.encounterSlot%2? .70:-.70),speedMult:1.32};
  }
  if(role==="pouncer"&&e.tacticDashTime>0){
    const previous=e.tacticDashTime;
    e.tacticDashTime=Math.max(0,e.tacticDashTime-dt);
    if(e.counterRole==="phaseStalker"&&previous>0&&e.tacticDashTime===0)
      e.counterExposureUntil=now+1.6;
    return {angle:e.tacticAngle||0,
      speedMult:e.tacticComboBoostUntil>now?5.4:
        e.counterRole==="phaseStalker"?4.25:4.55};
  }
  if(e.tacticWarning>0){
    e.tacticWarning=Math.max(0,e.tacticWarning-dt);
    if(e.tacticWarning===0){
      e.tacticCooldown=role==="pouncer"?4.7:role==="crusher"?6:6.4;
      if(role==="pouncer"){
        e.tacticDashTime=.58;
      }else if(role==="crusher"){
        if(distance<e.tacticRadius+(player.r||0))hooks.damage?.(21,e);
      }else if(role==="binder"){
        e.tacticPulseAt=now;
        if(distance<e.tacticRadius+(player.r||0))hooks.chill?.(2.4,e);
      }
    }
    return {angle:e.tacticAngle||Math.atan2(dy,dx),speedMult:0};
  }
  e.tacticCooldown=Math.max(0,(e.tacticCooldown||0)-dt);
  if(role==="vanguard"||role==="ward"){
    const position=guardIntercept(e,player);
    if(position)return position;
  }
  // Two area warnings at once can produce unavoidable damage. Stagger
  // their starts while leaving the Pouncer/Binder and Crusher/Crossfire combos.
  if((role==="binder"||role==="crusher")&&e.tacticCooldown===0&&
     livingPartners(e).some(a=>
       (a.encounterTactic==="binder"||a.encounterTactic==="crusher")&&
       a.tacticWarning>0))return null;
  const minDistance=role==="pouncer"?85:role==="crusher"?0:0;
  const maxDistance=role==="pouncer"?390:role==="crusher"?165:role==="binder"?160:0;
  if(maxDistance&&e.tacticCooldown===0&&distance>minDistance&&distance<maxDistance){
    const aimed=Math.atan2(dy,dx);
    // The Phase Stalker strafes around the frontline instead of blindly
    // dashing at the player; the real corridor remains fully warned.
    e.tacticAngle=role==="pouncer"&&e.counterRole==="phaseStalker"
      ? aimed+(e.encounterSlot%2?1:-1)*.37:aimed;
    e.tacticRadius=role==="crusher"?174:role==="binder"?158:0;
    e.tacticWarning=role==="pouncer"?
      (e.counterRole==="phaseStalker"?.86:.68):role==="crusher"?.95:.85;
    e.tacticWarningDuration=e.tacticWarning;
    if(role==="pouncer"){
      // Warn the player about a corridor, not just the centerline. The
      // forward distance conservatively covers a full boosted dash.
      const dashMult=e.counterRole==="phaseStalker"?4.25:5.4;
      e.tacticDashLength=Math.min(460,Math.max(270,(e.speed||80)*dashMult*.58*1.35));
      e.tacticDashWidth=(e.r||12)+(player.r||12)+4;
    }
    return {angle:e.tacticAngle,speedMult:0};
  }
  return null;
}
function damageMultiplier(e,enemies,now=0){
  if(!e?.encounterGroup||!Array.isArray(enemies)||e.dead)return 1;
  const exposed=e.tacticExposedUntil>now?1.16:1;
  // One shield-bearing member can defend the nearby squad, but not itself.
  // Defeating the guard immediately removes this mitigation.
  for(const other of enemies){
    if(other===e||other.dead||other.hp<=0||other.encounterGroup!==e.encounterGroup)continue;
    if(other.encounterTactic!=="vanguard"&&other.encounterTactic!=="ward")continue;
    if((e.x-other.x)**2+(e.y-other.y)**2 < 140**2)return .77*exposed;
  }
  return exposed;
}
function volleyOffsets(e){
  const crusherWarning=e?.encounterPartners?.some(ally=>
    ally!==e&&!ally.dead&&ally.hp>0&&
    ally.encounterTactic==="crusher"&&ally.tacticWarning>0);
  return crusherWarning?[-.57,-.29,.29,.57]:[-.38,-.14,.14,.38];
}
function prepareVolley(e){
  if(e?.encounterTactic!=="crossfire")return [];
  // Commit to the warned fan BEFORE the 0.7-second aim delay. Never change
  // four safe corridors into an untelegraphed wider volley at fire time.
  e.tacticVolleyOffsets=volleyOffsets(e);
  e.tacticVolleyAngle=Number.isFinite(e.aimAngle)?e.aimAngle:0;
  return e.tacticVolleyOffsets;
}
function cancelVolley(e){
  if(!e)return;
  e.tacticVolleyOffsets=null;
  e.tacticVolleyAngle=null;
}
function rangedVolley(e,shots,player){
  if(e?.encounterTactic!=="crossfire"||!Array.isArray(shots)||shots.length>=316)return 0;
  const aim=Number.isFinite(e.tacticVolleyAngle)?e.tacticVolleyAngle:
    Number.isFinite(e.aimAngle)?e.aimAngle:Math.atan2(player.y-e.y,player.x-e.x);
  const offsets=e.tacticVolleyOffsets||volleyOffsets(e);
  let created=0;
  for(const offset of offsets){
    if(shots.length>=316)break;
    shots.push({type:"enemyOrb",x:e.x,y:e.y,vx:Math.cos(aim+offset)*188,
      vy:Math.sin(aim+offset)*188,speed:188,turnRate:.12,
      life:3.8,r:6,damage:6,tacticShot:true});
    created++;
  }
  cancelVolley(e);
  return created;
}
function draw(e,ctx,time,quality){
  const role=e?.encounterTactic;if(!role||e.dead)return;
  const color=COLORS[role];ctx.save();
  ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.globalAlpha=.82;
  ctx.beginPath();ctx.arc(e.x,e.y,e.r+11,0,TAU);ctx.stroke();
  if(e.tacticExposedUntil>time){
    // A visible reward for killing a guard: a temporary exposed outline.
    const remaining=e.tacticExposedUntil-time;
    ctx.globalAlpha=.38+.28*Math.sin(time*11);
    ctx.strokeStyle="#ffd58d";
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(e.x,e.y,e.r+17+(3-remaining)*2,0,TAU);
    ctx.stroke();
    ctx.strokeStyle=color;ctx.globalAlpha=.82;
  }
  if(role==="vanguard"||role==="ward"){
    const heading=window.enemyShieldFacing16?.(e,
      typeof player!=="undefined"?player:null)??e.shieldFacing??0;
    ctx.beginPath();ctx.arc(e.x,e.y,140,heading-.85,heading+.85);
    ctx.lineWidth=3;ctx.stroke();
  }
  if(role==="skirmisher"||role==="pouncer"){
    ctx.beginPath();ctx.moveTo(e.x-8,e.y-e.r-10);ctx.lineTo(e.x,e.y-e.r-19);
    ctx.lineTo(e.x+8,e.y-e.r-10);ctx.stroke();
  }
  if(role==="crossfire"){
    ctx.beginPath();ctx.moveTo(e.x-15,e.y);ctx.lineTo(e.x+15,e.y);
    ctx.moveTo(e.x,e.y-15);ctx.lineTo(e.x,e.y+15);ctx.stroke();
  }
  if(e.tacticWarning>0){
    const duration=e.tacticWarningDuration||
      (role==="crusher"?.95:role==="binder"?.85:.68);
    const progress=1-Math.min(1,e.tacticWarning/duration);
    ctx.globalAlpha=.48+.25*progress;
    if(role==="pouncer"){
      const angle=e.tacticAngle||0;
      const forwardX=Math.cos(angle),forwardY=Math.sin(angle);
      const sideX=-forwardY,sideY=forwardX;
      const length=e.tacticDashLength||290;
      const halfWidth=e.tacticDashWidth||26;
      // The warning rectangle matches the collision width of the charge.
      const startX=e.x,startY=e.y;
      const endX=startX+forwardX*length,endY=startY+forwardY*length;
      ctx.fillStyle="rgba(255,123,76,.16)";
      ctx.strokeStyle="#ffad68";ctx.lineWidth=2.6;
      if(quality!=="low"){
        ctx.beginPath();
        ctx.moveTo(startX+sideX*halfWidth,startY+sideY*halfWidth);
        ctx.lineTo(endX+sideX*halfWidth,endY+sideY*halfWidth);
        ctx.lineTo(endX-sideX*halfWidth,endY-sideY*halfWidth);
        ctx.lineTo(startX-sideX*halfWidth,startY-sideY*halfWidth);
        ctx.closePath();ctx.fill();
      }
      ctx.setLineDash([9,6]);ctx.beginPath();
      ctx.moveTo(startX+sideX*halfWidth,startY+sideY*halfWidth);
      ctx.lineTo(endX+sideX*halfWidth,endY+sideY*halfWidth);
      ctx.moveTo(startX-sideX*halfWidth,startY-sideY*halfWidth);
      ctx.lineTo(endX-sideX*halfWidth,endY-sideY*halfWidth);
      ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(startX,startY);
      ctx.lineTo(startX+forwardX*length*progress,startY+forwardY*length*progress);
      ctx.lineWidth=3.5;ctx.stroke();
      ctx.beginPath();ctx.arc(endX,endY,halfWidth,0,TAU);ctx.stroke();
    }else if(role==="crusher"||role==="binder"){
      // Two colors and a filling ring make the exact blast radius and timer
      // legible even under Low quality and against elemental terrain.
      const radius=e.tacticRadius||158;
      ctx.strokeStyle=color;ctx.lineWidth=3.3;
      ctx.fillStyle=role==="crusher"?"rgba(255,97,57,.15)":"rgba(143,135,255,.12)";
      ctx.beginPath();ctx.arc(e.x,e.y,radius,0,TAU);
      ctx.fill();ctx.stroke();
      ctx.strokeStyle="#fff3d3";ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y,radius*(.18+progress*.82),0,TAU);ctx.stroke();
      if(quality!=="low"){
        ctx.strokeStyle=color;ctx.globalAlpha=.7;
        for(let i=0;i<8;i++){
          const a=i*TAU/8;
          ctx.beginPath();
          ctx.moveTo(e.x+Math.cos(a)*(radius-14),e.y+Math.sin(a)*(radius-14));
          ctx.lineTo(e.x+Math.cos(a)*radius,e.y+Math.sin(a)*radius);
          ctx.stroke();
        }
      }
    }
  }
  if(e.encounterTactic==="binder"&&e.tacticWarning>0&&quality!=="low"){
    const partners=e.encounterPartners?.filter(ally=>
      ally!==e&&!ally.dead&&ally.hp>0&&ally.encounterTactic==="pouncer")||[];
    for(const ally of partners.slice(0,2)){
      ctx.globalAlpha=.27;ctx.lineWidth=1.7;ctx.beginPath();
      ctx.moveTo(e.x,e.y);ctx.lineTo(ally.x,ally.y);ctx.stroke();
    }
  }
  if(e.tacticDashTime>0&&quality!=="low"){
    ctx.globalAlpha=.45;ctx.lineWidth=5;ctx.beginPath();
    ctx.moveTo(e.x-Math.cos(e.tacticAngle)*40,e.y-Math.sin(e.tacticAngle)*40);
    ctx.lineTo(e.x,e.y);ctx.stroke();
  }
  ctx.restore();
}
window.resetEncounterTactics=reset;
window.newEncounterTacticGroup=groupId;
window.assignEncounterTactic=assign;
window.linkEncounterTacticTeam=linkTeam;
window.onTacticalEnemyDeath=onDeath;
window.updateEncounterTactic=tick;
window.encounterTacticDamageMultiplier=damageMultiplier;
window.encounterTacticVolley=rangedVolley;
window.prepareEncounterTacticVolley=prepareVolley;
window.cancelEncounterTacticVolley=cancelVolley;
window.encounterTacticVolleyOffsets=volleyOffsets;
window.drawEncounterTactic=draw;
})();