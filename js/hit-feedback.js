// Update 13 — distinctive, restrained combat hit feedback.
// No damage, movement or invulnerability changes: this owns visuals only.
(() => {
  "use strict";
  const MAX_IMPACTS=38;
  const MAX_RECENT=16;
  const COLOR=Object.freeze({
    hit:"#e6e8f5",critical:"#ffe58c",kill:"#fa8bca",
    heavy:"#ffad81",boss:"#e6a5ff"
  });
  let active=[];
  let recent=[];
  let cameraKick=0;
  let clock=0;
  function reset(){active=[];recent=[];cameraKick=0;clock=0;}
  function valid(p){return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);}
  function categorize({critical,killed,boss,damage,radius}){
    if(killed && boss)return "boss";
    if(killed)return "kill";
    if(critical)return "critical";
    if(boss || damage>=28 || radius>=29)return "heavy";
    return "hit";
  }
  function register(p){
    if(!valid(p)||p.visible===false||!Number.isFinite(p.damage)||p.damage<=0)return {camera:0,sound:null};
    const now=Number.isFinite(p.now)?p.now:clock;
    clock=now;
    const x=p.x,y=p.y;
    const tier=categorize(p);
    const radius=Math.min(55,Math.max(9,Number(p.radius)||16));
    const duration=tier==="hit"?.15:tier==="heavy"?.24:.33;
    // Keep a normal hit subtle; frequent hits to the same location share feedback.
    if(tier==="hit" && recent.some(r=>r.key===p.targetKey && now-r.time<.065))
      return {camera:0,sound:null};
    recent.push({key:p.targetKey,time:now});
    recent=recent.filter(r=>now-r.time<.32).slice(-MAX_RECENT);
    const burst=tier!=="hit";
    active.push({
      x,y,radius,kind:tier,color:COLOR[tier],
      started:now,life:duration,
      angle:Math.atan2(p.directionY||0,p.directionX||1),
      spokes:tier==="boss"?9:tier==="kill"?7:tier==="critical"?6:tier==="heavy"?4:0
    });
    if(active.length>MAX_IMPACTS)active.splice(0,active.length-MAX_IMPACTS);
    // Feedback is not scaled with DPS or the number of enemies; individual
    // offscreen kills and damage-over-time ticks never shake the camera.
    let camera=0;
    if(burst && p.direct!==false && p.nearby!==false){
      camera=tier==="boss"?5:tier==="kill"?2.3:tier==="critical"?1.7:tier==="heavy"?1.1:0;
      cameraKick=Math.max(cameraKick,camera);
    }
    const sound=tier==="critical"?"crit":tier==="boss"?"boss":
      tier==="heavy" && p.direct!==false?"impact":null;
    return {camera,sound,kind:tier};
  }
  function tick(dt,now){
    const step=Math.max(0,Math.min(.1,Number(dt)||0));
    clock=Number.isFinite(now)?now:clock+step;
    cameraKick=Math.max(0,cameraKick-step*32);
    active=active.filter(v=>clock-v.started<v.life);
    recent=recent.filter(r=>clock-r.time<.32);
  }
  function draw(ctx,now,quality="high"){
    if(!ctx?.save)return;
    const low=quality==="low";
    for(const impact of active){
      const t=Math.max(0,Math.min(1,(now-impact.started)/impact.life));
      if(t>=1)continue;
      if(low && impact.kind==="hit")continue;
      const r=impact.radius*(.7+.55*t);
      ctx.save();
      ctx.globalAlpha=(1-t)*(impact.kind==="hit"?.26:.72);
      ctx.strokeStyle=impact.color;
      ctx.lineWidth=(impact.kind==="hit"?1.2:3)*(1-t*.55);
      if(!low){ctx.shadowColor=impact.color;ctx.shadowBlur=impact.kind==="hit"?0:8;}
      ctx.beginPath();ctx.arc(impact.x,impact.y,r,0,Math.PI*2);ctx.stroke();
      if(!low || impact.kind==="boss"){
        const spokes=low?Math.ceil(impact.spokes/2):impact.spokes;
        for(let i=0;i<spokes;i++){
          const a=impact.angle+i*2*Math.PI/spokes;
          const inner=r*1.12,outer=r*(1.55+t*.3);
          ctx.beginPath();
          ctx.moveTo(impact.x+Math.cos(a)*inner,impact.y+Math.sin(a)*inner);
          ctx.lineTo(impact.x+Math.cos(a)*outer,impact.y+Math.sin(a)*outer);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  function status(){return {active:active.length,recent:recent.length,cameraKick,maxImpacts:MAX_IMPACTS};}
  window.resetHitFeedback=reset;
  window.recordEnemyHitFeedback=register;
  window.updateHitFeedback=tick;
  window.drawHitFeedback=draw;
  window.hitFeedbackStatus=status;
})();
