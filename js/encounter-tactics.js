// Update 10.3: compact encounters with distinct skills and readable telegraphs.
// Abilities are limited to tactical packs; ordinary enemies remain readable.
(() => {
"use strict";
const TAU=Math.PI*2;
const COLORS={vanguard:"#87d8fa",binder:"#a8a6ff",pouncer:"#ffad68",
  skirmisher:"#ffcf7a",crossfire:"#ff79c4",crusher:"#ff6f67",ward:"#80e3cf",
  volatile:"#ffad57"};
let groupSequence=0;
function reset(){groupSequence=0;}
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
  if(role==="volatile")e.burstRadius=Math.max(e.burstRadius||86,104);
  return e;
}
function groupId(){return "pack-"+(++groupSequence);}
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
    // Skirmishers circle instead of stacking behind the player's movement.
    return {angle:Math.atan2(dy,dx)+(e.encounterSlot%2? .70:-.70),speedMult:1.32};
  }
  if(role==="pouncer"&&e.tacticDashTime>0){
    e.tacticDashTime=Math.max(0,e.tacticDashTime-dt);
    return {angle:e.tacticAngle||0,speedMult:e.tacticComboBoostUntil>now?5.4:4.55};
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
  const minDistance=role==="pouncer"?85:role==="crusher"?0:0;
  const maxDistance=role==="pouncer"?390:role==="crusher"?165:role==="binder"?160:0;
  if(maxDistance&&e.tacticCooldown===0&&distance>minDistance&&distance<maxDistance){
    e.tacticAngle=Math.atan2(dy,dx);
    e.tacticRadius=role==="crusher"?174:role==="binder"?158:0;
    e.tacticWarning=role==="pouncer"?.63:role==="crusher"?.88:.78;
    return {angle:e.tacticAngle,speedMult:0};
  }
  return null;
}
function damageMultiplier(e,enemies){
  if(!e?.encounterGroup||!Array.isArray(enemies)||e.dead)return 1;
  // One shield-bearing member can defend the nearby squad, but not itself.
  // Defeating the guard immediately removes this mitigation.
  for(const other of enemies){
    if(other===e||other.dead||other.hp<=0||other.encounterGroup!==e.encounterGroup)continue;
    if(other.encounterTactic!=="vanguard"&&other.encounterTactic!=="ward")continue;
    if((e.x-other.x)**2+(e.y-other.y)**2 < 140**2)return .77;
  }
  return 1;
}
function rangedVolley(e,shots,player){
  if(e?.encounterTactic!=="crossfire"||!Array.isArray(shots)||shots.length>=316)return 0;
  const aim=Number.isFinite(e.aimAngle)?e.aimAngle:Math.atan2(player.y-e.y,player.x-e.x);
  let created=0;
  const crusherWarning=e.encounterPartners?.some(ally=>
    ally!==e&&!ally.dead&&ally.hp>0&&
    ally.encounterTactic==="crusher"&&ally.tacticWarning>0);
  // The Crusher occupies the center; crossfire cuts off wide escape angles.
  for(const offset of (crusherWarning?[-.57,-.29,.29,.57]:[-.38,-.14,.14,.38])){
    shots.push({type:"enemyOrb",x:e.x,y:e.y,vx:Math.cos(aim+offset)*188,
      vy:Math.sin(aim+offset)*188,speed:188,turnRate:.12,
      life:3.8,r:6,damage:6,tacticShot:true});
    created++;
  }
  return created;
}
function draw(e,ctx,time,quality){
  const role=e?.encounterTactic;if(!role||e.dead)return;
  const color=COLORS[role];ctx.save();
  ctx.strokeStyle=color;ctx.lineWidth=2.6;ctx.globalAlpha=.82;
  ctx.beginPath();ctx.arc(e.x,e.y,e.r+11,0,TAU);ctx.stroke();
  if(role==="vanguard"||role==="ward"){
    ctx.beginPath();ctx.arc(e.x,e.y,140,-.85,.85);ctx.lineWidth=3;ctx.stroke();
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
    const ratio=Math.min(1,e.tacticWarning/(role==="crusher"?.88:role==="binder"?.78:.63));
    ctx.globalAlpha=.48+.4*Math.sin(time*12);
    if(role==="pouncer"){
      ctx.setLineDash([8,7]);ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(e.x,e.y);
      ctx.lineTo(e.x+Math.cos(e.tacticAngle)*260,e.y+Math.sin(e.tacticAngle)*260);
      ctx.stroke();ctx.setLineDash([]);
    }else if(role==="crusher"||role==="binder"){
      ctx.beginPath();ctx.arc(e.x,e.y,e.tacticRadius,0,TAU);
      ctx.fillStyle=role==="crusher"?"rgba(255,97,57,.15)":"rgba(143,135,255,.12)";
      ctx.fill();ctx.lineWidth=4;ctx.stroke();
      ctx.beginPath();ctx.arc(e.x,e.y,e.tacticRadius*(1-ratio*.68),0,TAU);ctx.stroke();
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
window.updateEncounterTactic=tick;
window.encounterTacticDamageMultiplier=damageMultiplier;
window.encounterTacticVolley=rangedVolley;
window.drawEncounterTactic=draw;
})();