// Living World 2.0 — conquest-driven elemental reactions.
// Fire invading a flooded world creates escalating steam vents and boiling basins.
(() => {
"use strict";
const LIMIT=16, TAU=Math.PI*2;
const TYPES={
  fire:{color:"#ff7946",fill:"rgba(250,91,30,.22)"},
  water:{color:"#68cfff",fill:"rgba(29,153,223,.22)"},
  frost:{color:"#aff2ff",fill:"rgba(111,212,255,.21)"},
  steam:{color:"#ffe3ae",fill:"rgba(220,228,220,.15)"},
  boiling:{color:"#ffa35f",fill:"rgba(222,101,41,.26)"}
};
let state;
const blank=()=>({kills:0,threshold:0,rifts:[],running:false,sequence:0});
state=blank();
function reset(){state=blank();state.running=true;}
function clear(){state.rifts.length=0;state.running=false;}
function element(){const id=window.currentLivingWorldElement?.();return TYPES[id]?id:"fire";}
function conquest(){return window.getWorldConquest?.()||null;}
function conquestTier(){
  const c=conquest(),percent=Number(c?.target??c?.coverage??0);
  if(!c?.active||c.original===c.invading)return 0;
  return percent>=50?2:percent>=15?1:0;
}
function reactionType(tier){
  const c=conquest();
  if(c?.original==="flooded"&&c.invading==="burning"&&element()==="fire")
    return tier>=2?"boiling":"steam";
  return element();
}
function onKill(enemy,player){
  if(!state.running||!enemy||enemy.kind===3||enemy.summoned||!player)return false;
  const tier=conquestTier();
  if(!tier){state.kills=0;state.threshold=0;return false;}
  state.threshold=tier>=2?10:45;
  if(++state.kills<state.threshold)return false;
  state.kills=0;
  if(state.rifts.length>=LIMIT)return false;
  const seq=++state.sequence,kind=reactionType(tier);
  const angle=(seq*2.399963)%TAU,distance=185+(seq%3)*80;
  const radius=kind==="boiling"?116:kind==="steam"?82:76;
  state.rifts.push({
    x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance,
    radius,warning:kind==="boiling"?2.7:2.2,elapsed:0,lastHit:-Infinity,
    type:kind,trigger:seq,tier
  });
  // A real fire scar records the invading element even when the flooded biome boils.
  window.addWorldScar?.("fire",state.rifts[state.rifts.length-1].x,
    state.rifts[state.rifts.length-1].y,radius);
  return true;
}
function tick(dt,player,hooks={}){
  if(!state.running||!Number.isFinite(dt)||dt<=0)return;
  for(const r of state.rifts){
    r.elapsed+=dt;
    if(r.elapsed<r.warning||!player)continue;
    const dx=player.x-r.x,dy=player.y-r.y;
    const distance=Math.hypot(dx,dy);
    if(distance>r.radius+(player.r||0)||player.inv>0)continue;
    const cooldown=r.type==="boiling"?1.65:r.type==="steam"?2.6:1.7;
    if(r.elapsed-r.lastHit<cooldown)continue;
    if(r.type==="steam"){
      // Steam is the first, milder reaction: visibility and temporary heat pressure.
      hooks.chill?.(.85,r);
      r.lastHit=r.elapsed;
    }else if(r.type==="boiling"){
      // Sustained boiling water is far more threatening than a steam vent.
      if(hooks.damage?.(13,r)!==false){
        hooks.push?.(dx,dy,90,r);
        r.lastHit=r.elapsed;
      }
    }else if(r.type==="frost"){
      hooks.chill?.(2.1,r);r.lastHit=r.elapsed;
    }else if(r.type==="water"){
      hooks.push?.(dx,dy,200,r);r.lastHit=r.elapsed;
    }else if(hooks.damage?.(10,r)!==false)r.lastHit=r.elapsed;
  }
}
function draw(ctx,time,quality){
  if(!state.running)return;
  ctx.save();
  for(const r of state.rifts){
    const active=r.elapsed>=r.warning,style=TYPES[r.type]||TYPES.fire;
    const steam=r.type==="steam"||r.type==="boiling";
    ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,TAU);
    ctx.fillStyle=active?style.fill:"rgba(255,255,255,.065)";ctx.fill();
    ctx.lineWidth=active?4:3;ctx.strokeStyle=style.color;
    ctx.globalAlpha=.65+.2*Math.sin(time*5+r.trigger);ctx.stroke();ctx.globalAlpha=1;
    if(steam&&active){
      // Moving vapor rings / bubbles make the reaction readable without sprites.
      const loops=quality==="low"?3:7;
      for(let i=0;i<loops;i++){
        const angle=i*TAU/loops+r.trigger;
        const drift=(time*.25+i*.19)%1;
        ctx.beginPath();
        ctx.arc(r.x+Math.cos(angle)*r.radius*.62*drift,
                r.y+Math.sin(angle)*r.radius*.62*drift,
                5+drift*(r.type==="boiling"?24:17),0,TAU);
        ctx.strokeStyle=r.type==="boiling"?"rgba(255,184,117,.65)":"rgba(234,249,255,.58)";
        ctx.lineWidth=2;ctx.stroke();
      }
    }
    if(quality!=="low"){
      ctx.beginPath();
      ctx.arc(r.x,r.y,active?r.radius*.55:Math.max(8,r.radius*(1-r.elapsed/r.warning)),0,TAU);
      ctx.strokeStyle=style.color;ctx.lineWidth=2;ctx.stroke();
    }
  }
  ctx.restore();
}
function status(){return {kills:state.kills,threshold:state.threshold,active:state.rifts.length,
  sequence:state.sequence,tier:conquestTier(),rifts:state.rifts.map(r=>({...r}))};}
window.getWorldReactionTier=conquestTier;
window.resetWorldRetaliation=reset;window.clearWorldRetaliation=clear;
window.recordWorldDestruction=onKill;window.updateWorldRetaliation=tick;
window.drawWorldRetaliation=draw;window.getWorldRetaliationStatus=status;
})();