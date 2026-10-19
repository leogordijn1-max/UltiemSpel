// Update 16 — genuinely different enemy roles and accurate 16-direction shields.
// Abilities are limited to visible normal enemies. Bosses, summons and tactical
// Crushers retain their own authored attack behavior and stay isolated.
(() => {
  "use strict";
  const TAU=Math.PI*2;
  const SECTORS=16;
  const STEP=TAU/SECTORS;
  const PROFILES=Object.freeze({
    0:Object.freeze({name:"Drifter",strength:"Reliable baseline pursuer",weakness:"Pulse +15%"}),
    1:Object.freeze({name:"Runner",strength:"Lateral feint",weakness:"Frost +30%"}),
    2:Object.freeze({name:"Zombie Mike",strength:"Telegraphed seismic stomp",weakness:"Bomb +25%"}),
    4:Object.freeze({name:"Ranged Shade",strength:"Keeps distance and targets the player",weakness:"Close combat +20%"}),
    5:Object.freeze({name:"Burstling",strength:"Telegraphed explosive charge",weakness:"Lightning +35%"}),
    6:Object.freeze({name:"Bulwark",strength:"Directional front shield",weakness:"Flanking +15% shield bypass"})
  });
  function facing(e,player){
    if(!e || !player || !Number.isFinite(e.x) || !Number.isFinite(e.y) ||
       !Number.isFinite(player.x) || !Number.isFinite(player.y))return e?.shieldFacing ?? 0;
    const dx=player.x-e.x,dy=player.y-e.y;
    if(dx*dx+dy*dy<.00001)return e.shieldFacing??0;
    const angle=Math.atan2(dy,dx);
    const snapped=Math.round(angle/STEP)*STEP;
    e.shieldFacing=snapped;
    e.shieldSector=((Math.round(angle/STEP)%SECTORS)+SECTORS)%SECTORS;
    return snapped;
  }
  function shield(e,origin,player){
    if(!e?.shieldActive || e.kind!==6)return 1;
    const heading=facing(e,player);
    const vx=(origin?.x??player?.x??e.x)-e.x;
    const vy=(origin?.y??player?.y??e.y)-e.y;
    const length=Math.hypot(vx,vy);
    if(length<.001)return .67;
    const alignment=(vx*Math.cos(heading)+vy*Math.sin(heading))/length;
    // A frontal shield blocks most direct damage, but shots from behind
    // bypass it. The arc follows the player each update, not the move vector.
    return alignment>=Math.cos(.92)?.55:1.15;
  }
  function multiplier(e,type,origin,player){
    if(!e || e.kind===3 || e.summoned)return 1;
    switch(e.kind){
      case 0:return type==="pulse"?1.15:1;
      case 1:return type==="frost"?1.30:1;
      case 2:return type==="bomb"?1.25:1;
      case 4:{
        const dist=Math.hypot((player?.x??e.x)-e.x,(player?.y??e.y)-e.y);
        return dist<165 && !["burn","poison"].includes(type)?1.2:1;
      }
      case 5:return type==="lightning"?1.35:1;
      default:return 1;
    }
  }
  function resetEnemy(e){
    if(!e || e.kind===3 || e.summoned)return e;
    if(e.kind===1 && (e.evolutionLevel||1)>=2){
      e.feintCooldown=2.1+(Math.abs(e.x*.011+e.y*.017)%1.6);
      e.feintTime=0;
      e.feintDirection=(Math.floor(Math.abs(e.x+e.y))%2)?1:-1;
    }
    if(e.kind===2 && (e.evolutionLevel||1)>=2){
      e.stompCooldown=4.4+(Math.abs(e.x*.012+e.y*.005)%2);
      e.stompWarning=0;e.stompRadius=149+Math.max(0,(e.evolutionLevel||1)-2)*31;
    }
    if(e.kind===6)e.shieldSector=0;
    return e;
  }
  function tick(e,dt,player,now,visible,hooks={}){
    if(!e || e.dead || !visible || e.summoned || e.kind===3 ||
       !player || !Number.isFinite(dt) || dt<=0)return null;
    if(e.kind===6){facing(e,player);return null;}
    const dx=player.x-e.x,dy=player.y-e.y,distance=Math.hypot(dx,dy);
    if(e.kind===1 && (e.evolutionLevel||1)>=2 && !e.eliteChargeActive && !e.eliteChargeWarning){
      if(e.feintCooldown===undefined)resetEnemy(e);
      if(e.feintTime>0){
        e.feintTime=Math.max(0,e.feintTime-dt);
        const angle=Math.atan2(dy,dx)+(e.feintDirection||1)*.83;
        return {angle,speedMult:1.48+.14*Math.max(0,(e.evolutionLevel||2)-2)};
      }
      e.feintCooldown=Math.max(0,e.feintCooldown-dt);
      if(e.feintCooldown===0 && distance>105 && distance<335){
        e.feintTime=.45;
        e.feintDirection=-(e.feintDirection||1);
        e.feintCooldown=Math.max(1.9,3.4-.48*((e.evolutionLevel||2)-2));
        return {angle:Math.atan2(dy,dx)+e.feintDirection*.83,speedMult:1.48+.14*Math.max(0,(e.evolutionLevel||2)-2)};
      }
    }
    if(e.kind===2 && (e.evolutionLevel||1)>=2){
      if(e.stompCooldown===undefined)resetEnemy(e);
      if(e.stompWarning>0){
        e.stompWarning=Math.max(0,e.stompWarning-dt);
        if(e.stompWarning===0){
          e.stompCooldown=Math.max(4.4,7.6-(e.evolutionLevel-2)*1.45);
          if(distance<(e.stompRadius||149)+(player.r||0))
            hooks.damage?.(15+Math.max(0,e.evolutionLevel-2)*6,e);
        }
        return {angle:Math.atan2(dy,dx),speedMult:0};
      }
      e.stompCooldown=Math.max(0,e.stompCooldown-dt);
      if(e.stompCooldown===0 && distance>25 && distance<182){
        e.stompWarning=Math.max(.66,1-.13*((e.evolutionLevel||2)-2));
        return {angle:Math.atan2(dy,dx),speedMult:0};
      }
    }
    return null;
  }
  function draw(e,ctx,now,quality="high"){
    if(!e || e.dead || !ctx?.save)return;
    if(e.kind===1 && e.feintTime>0){
      ctx.save();ctx.strokeStyle="#ffcb82";ctx.globalAlpha=.55;
      ctx.lineWidth=2;ctx.beginPath();
      const a=(e.feintDirection||1)*Math.PI/2;
      ctx.arc(e.x,e.y,(e.r||10)+13,a-.55,a+.55);ctx.stroke();
      ctx.restore();
    }
    if(e.kind===2 && e.stompWarning>0){
      const progress=1-e.stompWarning/1.0;
      ctx.save();ctx.strokeStyle="#ffa36d";ctx.fillStyle="rgba(255,135,65,.11)";
      ctx.lineWidth=3;ctx.beginPath();
      ctx.arc(e.x,e.y,e.stompRadius||149,0,TAU);ctx.fill();ctx.stroke();
      ctx.globalAlpha=.72;ctx.strokeStyle="#fff1cb";
      ctx.beginPath();
      ctx.arc(e.x,e.y,(e.stompRadius||149)*(.20+progress*.80),0,TAU);
      ctx.stroke();
      if(quality!=="low"){
        ctx.globalAlpha=.64;ctx.strokeStyle="#ffac6f";ctx.lineWidth=2;
        const radius=e.stompRadius||149;
        for(let i=0;i<8;i++){
          const a=i*TAU/8;
          ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*(radius-13),
            e.y+Math.sin(a)*(radius-13));
          ctx.lineTo(e.x+Math.cos(a)*radius,e.y+Math.sin(a)*radius);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  window.enemyArchetypeProfiles=PROFILES;
  window.enemyShieldFacing16=facing;
  window.bulwarkShieldMultiplier=shield;
  window.enemyArchetypeDamageMultiplier=multiplier;
  window.initializeEnemyArchetype=resetEnemy;
  window.updateEnemyArchetype=tick;
  window.drawEnemyArchetype=draw;
})();
