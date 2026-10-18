// Living World 3.0 · Update 10.1 — coordinated defensive squads.
// Reuses the existing enemy kinds, collision, pickups and elemental affinities.
(() => {
"use strict";
const TAU=Math.PI*2, TOTAL_CAP=84;
const WORLDS={
  frozen:{name:"FROST WARDENS",color:"#a9ebff",shade:"#29647a"},
  flooded:{name:"TIDE GUARD",color:"#77d9ee",shade:"#176075"},
  burning:{name:"EMBER LEGION",color:"#ffb276",shade:"#83422a"}
};
let squads=[],nextId=1,nextAt=Infinity,stage=0,spawned=0,running=false;
const tier=()=>{
  const c=window.getWorldConquest?.();
  const percent=Number(c?.target??c?.coverage??0);
  if(!c?.active||c.original===c.invading||!WORLDS[c.original])return 0;
  return percent>=85?3:percent>=50?2:percent>=15?1:0;
};
function reset(){squads=[];nextId=1;nextAt=Infinity;stage=0;spawned=0;running=true;}
function clear(){squads=[];nextAt=Infinity;stage=0;running=false;}
const alive=e=>!!e&&!e.dead&&e.hp>0;
const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
function getSquad(e){
  if(!e?.defenseSquadId||!running)return null;
  return squads.find(s=>s.id===e.defenseSquadId)||null;
}
function leaderOf(s){return s?.members.find(e=>e.defenseRole==="commander"&&alive(e))||null;}
function prune(enemies){
  for(let i=squads.length-1;i>=0;i--){
    const s=squads[i];
    s.members=s.members.filter(e=>alive(e)&&enemies.includes(e));
    if(!s.members.length){squads.splice(i,1);continue;}
    if(!leaderOf(s)){s.commanderLost=true;for(const e of s.members)e.defenseLeaderLost=true;}
  }
}
function squadCap(t){return [0,1,2,3][t]||0;}
function cooldown(t){return [Infinity,90,64,48][t]||90;}
function composition(t){return t===1
  ?["commander","defender","hunter","hunter","ranger"]
  :t===2
  ?["commander","defender","defender","hunter","hunter","ranger"]
  :["commander","defender","defender","hunter","hunter","hunter","ranger"];
}
const KINDS={commander:2,defender:6,hunter:1,ranger:4};
function createSquad(now,player,enemies,spawnEnemy,t=stage,growthSeconds=0,budgeted=false){
  if(!running||!player||!t||!WORLDS[window.getWorldConquest?.().original]||
      squads.length>=squadCap(t)||enemies.length> TOTAL_CAP-composition(t).length)return false;
  // Real runs share the encounter budget with patrols and waves. Developer
  // Mode's explicit "SPAWN DEFENSE SQUAD" remains an intentional override.
  if(budgeted&&window.encounterCanStart?.(
      enemies,growthSeconds,"defense",composition(t).length)===false)return false;
  const roles=composition(t),members=[],id=nextId++,baseAngle=(id*2.399963)%TAU;
  const spawnAt=window.enemyOffscreenSpawn?.(baseAngle,185);
  const cx=spawnAt?.x ?? player.x+Math.cos(baseAngle)*Math.max(700,(player.viewW||0)*.5+200);
  const cy=spawnAt?.y ?? player.y+Math.sin(baseAngle)*Math.max(650,(player.viewH||0)*.5+200);
  for(let i=0;i<roles.length;i++){
    const role=roles[i];
    const kind=window.enemyDefenseRoleKind?.(role,growthSeconds) ?? KINDS[role];
    const e=spawnEnemy(kind);
    if(!e)break;
    const theta=baseAngle+Math.PI+(-2+i)*.34;
    const along=(i-(roles.length-1)/2)*54;
    const position=window.enemyOffscreenSpawn?.(baseAngle,185,along);
    e.x=position?.x ?? cx+Math.cos(theta)*(role==="commander"?0:65+(i%2)*18);
    e.y=position?.y ?? cy+Math.sin(theta)*(role==="commander"?0:65+(i%2)*18);
    e.defenseSquadId=id;e.defenseRole=role;e.defenseSlot=i;
    e.defenseLeaderLost=false;
    // Existing Bulwark shield/elite traits remain intact.
    if(role==="commander"){e.hp*=1.35;e.damage*=1.05;e.speed*=.9;}
    if(role==="hunter"){e.speed*=1.05;}
    if(role==="defender")e.hp*=1.12;
    e.xpValueMultiplier=window.encounterXpMultiplier?.(
      growthSeconds,"defense") ?? 2;
    window.initializeEnemyAdaptation?.(e,window.getWorldConquest?.().original);
    members.push(e);
  }
  if(members.length!==roles.length){
    for(const e of members)e.dead=true;
    return false;
  }
  squads.push({id,createdAt:now,stage:t,world:window.getWorldConquest().original,
    members,commanderLost:false});
  spawned++;
  window.notifyWorldDefense?.("WORLD DEFENSE · "+WORLDS[squads.at(-1).world].name+" DEPLOYED");
  return true;
}
function update(now,player,enemies,spawnEnemy,blocked=false,growthSeconds=0){
  if(!running)return false;
  if(blocked){nextAt=now+18;return false;}
  prune(enemies);
  const t=tier();
  if(t!==stage){stage=t;nextAt=now+(t?8:Infinity);}
  if(!t||now<nextAt)return false;
  const spawnedNow=createSquad(now,player,enemies,spawnEnemy,t,growthSeconds,true);
  nextAt=now+(spawnedNow?cooldown(t):8);
  return spawnedNow;
}
function behavior(e,player,now){
  const s=getSquad(e);
  if(!s||!player||!alive(e))return null;
  const commander=leaderOf(s);
  const role=e.defenseRole,leaderAlive=!!commander;
  const d=Math.hypot(player.x-e.x,player.y-e.y)||1;
  let x=player.x,y=player.y;
  // The commander stays behind its shield line. Hunters pinch from both sides.
  if(role==="commander"){
    if(d<185){x=e.x-(player.x-e.x);y=e.y-(player.y-e.y);}
    else if(d<275){x=e.x;y=e.y;}
    else{x=player.x+(e.x-player.x)*.62;y=player.y+(e.y-player.y)*.62;}
  }else if(role==="defender"&&commander){
    const dx=player.x-commander.x,dy=player.y-commander.y;
    const len=Math.hypot(dx,dy)||1;
    const side=(e.defenseSlot%2===0?1:-1)*48;
    x=commander.x+dx/len*95-dy/len*side;
    y=commander.y+dy/len*95+dx/len*side;
  }else if(role==="hunter"&&leaderAlive&&d>115){
    const vx=player.x-commander.x,vy=player.y-commander.y;
    const len=Math.hypot(vx,vy)||1;
    const side=(e.defenseSlot%2===0?1:-1)*(105+15*s.stage);
    x=player.x-vx/len*45-vy/len*side;
    y=player.y-vy/len*45+vx/len*side;
  }else if(role==="ranger"&&commander){
    const vx=player.x-commander.x,vy=player.y-commander.y;
    const len=Math.hypot(vx,vy)||1;
    x=commander.x-vx/len*70;
    y=commander.y-vy/len*70;
  }
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const dx=x-e.x,dy=y-e.y,goalDist=Math.hypot(dx,dy);
  return {angle:Math.atan2(dy,dx),speedMult:goalDist<22?.12:
    leaderAlive&&commander&&dist2(e,commander)<220*220?1.08:1};
}
function guarding(e){
  const s=getSquad(e);
  if(!s||!alive(e)||e.defenseRole==="defender")return false;
  return s.members.some(other=>alive(other)&&other.defenseRole==="defender"&&
    dist2(e,other)<130*130);
}
function protection(e){
  if(!e||!getSquad(e))return 1;
  return guarding(e) ? .70 : 1;
}
function buffs(e){
  const s=getSquad(e),leader=leaderOf(s);
  if(!leader||!alive(e)||dist2(e,leader)>245*245)return 1;
  return s.stage>=3?1.2:s.stage===2?1.14:1.08;
}
function draw(e,ctx,now,quality){
  const s=getSquad(e);
  if(!s||!alive(e))return;
  const style=WORLDS[s.world],role=e.defenseRole;
  ctx.save();
  ctx.strokeStyle=style.color;ctx.globalAlpha=.85;ctx.lineWidth=role==="commander"?3:2;
  ctx.beginPath();ctx.arc(e.x,e.y,e.r+(role==="commander"?14:8),0,TAU);ctx.stroke();
  if(role==="commander"){
    ctx.fillStyle=style.color;ctx.beginPath();
    ctx.moveTo(e.x,e.y-e.r-29);ctx.lineTo(e.x-10,e.y-e.r-16);
    ctx.lineTo(e.x+10,e.y-e.r-16);ctx.closePath();ctx.fill();
    if(quality!=="low"){ctx.globalAlpha=.28;ctx.beginPath();
      ctx.arc(e.x,e.y,205,0,TAU);ctx.stroke();}
  }else if(role==="defender"){
    const heading=window.enemyShieldFacing16?.(e,typeof player!=="undefined"?player:null)
      ??e.shieldFacing??0;
    ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,heading-.8,heading+.8);ctx.stroke();
    if(quality!=="low"){const leader=leaderOf(s);
      if(leader&&dist2(e,leader)<260*260){
        ctx.globalAlpha=.25;ctx.lineWidth=2;ctx.beginPath();
        ctx.moveTo(e.x,e.y);ctx.lineTo(leader.x,leader.y);ctx.stroke();}}
  }else if(role==="hunter"){
    ctx.fillStyle=style.color;ctx.beginPath();
    ctx.moveTo(e.x,e.y-e.r-13);ctx.lineTo(e.x-5,e.y-e.r-6);
    ctx.lineTo(e.x+5,e.y-e.r-6);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
function status(){return {stage,tier:tier(),activeSquads:squads.length,spawned,
  members:squads.reduce((n,s)=>n+s.members.filter(alive).length,0),
  squads:squads.map(s=>({id:s.id,world:s.world,commanderAlive:!!leaderOf(s),
    roles:s.members.filter(alive).map(e=>e.defenseRole)}))};}
function force(now,player,enemies,spawnEnemy,blocked=false,growthSeconds=0){
  if(blocked||!running)return false;
  prune(enemies);
  return createSquad(now,player,enemies,spawnEnemy,tier(),growthSeconds);
}
window.resetWorldDefense=reset;window.clearWorldDefense=clear;
window.updateWorldDefense=update;window.forceWorldDefense=force;
window.worldDefenseMovement=behavior;window.worldDefenseDamageMultiplier=protection;
window.worldDefenseAttackMultiplier=buffs;window.drawWorldDefense=draw;
window.getWorldDefenseStatus=status;
})();