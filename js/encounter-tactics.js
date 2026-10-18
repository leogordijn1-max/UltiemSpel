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
function assign(e,position=0,groupId=null){
  if(!e||e.kind===3||e.summoned)return e;
  const role=e.kind===0?(position%3===0?"vanguard":"binder")
    :e.kind===1?(position%2===0?"skirmisher":"pouncer")
    :e.kind===2?"crusher":e.kind===4?"crossfire"
    :e.kind===5?"volatile":e.kind===6?"ward":null;
  if(!role)return e;
  e.encounterTactic=role;
  e.encounterGroup=groupId||("pack-"+(++groupSequence));
  e.tacticCooldown=2.4+(position%3)*1.1;
  e.tacticWarning=0;e.tacticDashTime=0;
  if(role==="volatile")e.burstRadius=Math.max(e.burstRadius||86,104);
  return e;
}
function groupId(){return "pack-"+(++groupSequence);}
function tick(e,dt,player,now,visible,hooks={}){
  if(!e?.encounterTactic||e.dead||!player||!visible||!Number.isFinite(dt)||dt<=0)return null;
  const role=e.encounterTactic;
  const dx=player.x-e.x,dy=player.y-e.y;
  const distance=Math.hypot(dx,dy)||1;
  if(role==="skirmisher"&&distance>130&&distance<610){
    // Skirmishers circle instead of stacking behind the player's movement.
    return {angle:Math.atan2(dy,dx)+(e.encounterGroup?.length%2? .65:-.65),speedMult:1.15};
  }
  if(role==="pouncer"&&e.tacticDashTime>0){
    e.tacticDashTime=Math.max(0,e.tacticDashTime-dt);
    return {angle:e.tacticAngle||0,speedMult:3.4};
  }
  if(e.tacticWarning>0){
    e.tacticWarning=Math.max(0,e.tacticWarning-dt);
    if(e.tacticWarning===0){
      e.tacticCooldown=role==="pouncer"?5.8:role==="crusher"?7:7.6;
      if(role==="pouncer"){
        e.tacticDashTime=.44;
      }else if(role==="crusher"){
        if(distance<e.tacticRadius+(player.r||0))hooks.damage?.(16,e);
      }else if(role==="binder"){
        if(distance<e.tacticRadius+(player.r||0))hooks.chill?.(1.7,e);
      }
    }
    return {angle:e.tacticAngle||Math.atan2(dy,dx),speedMult:0};
  }
  e.tacticCooldown=Math.max(0,(e.tacticCooldown||0)-dt);
  const minDistance=role==="pouncer"?85:role==="crusher"?0:0;
  const maxDistance=role==="pouncer"?390:role==="crusher"?165:role==="binder"?160:0;
  if(maxDistance&&e.tacticCooldown===0&&distance>minDistance&&distance<maxDistance){
    e.tacticAngle=Math.atan2(dy,dx);
    e.tacticRadius=role==="crusher"?145:role==="binder"?135:0;
    e.tacticWarning=role==="pouncer"?.72:role==="crusher"?1.05:.92;
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
  for(const offset of [-.3,.3]){
    shots.push({type:"enemyOrb",x:e.x,y:e.y,vx:Math.cos(aim+offset)*166,
      vy:Math.sin(aim+offset)*166,speed:166,turnRate:.12,
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
    const ratio=Math.min(1,e.tacticWarning/(role==="crusher"?1.05:role==="binder"?.92:.72));
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
window.updateEncounterTactic=tick;
window.encounterTacticDamageMultiplier=damageMultiplier;
window.encounterTacticVolley=rangedVolley;
window.drawEncounterTactic=draw;
})();