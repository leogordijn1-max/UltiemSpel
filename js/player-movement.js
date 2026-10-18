// Update 12 — deterministic, frame-rate-independent movement and dash feedback.
// Owns only motion smoothing and visual snapshots; the game owns player state.
(() => {
  "use strict";
  const DASH_DURATION=.26;
  const INPUT_RESPONSE=.052;
  const STOP_RESPONSE=.038;
  const TRAIL_LIFETIME=.32;
  const SNAPSHOT_INTERVAL=.035;
  let velocityX=0,velocityY=0,lastTrailAt=-Infinity,wasDashing=false;
  let ghosts=[],rings=[];

  function reset(){
    velocityX=0;velocityY=0;lastTrailAt=-Infinity;wasDashing=false;
    ghosts=[];rings=[];
  }
  function releaseInput(){velocityX=0;velocityY=0;}
  function normalize(x,y){
    const len=Math.hypot(Number(x)||0,Number(y)||0);
    if(len<.0001)return {x:0,y:0,active:false};
    const scale=1/Math.max(1,len);
    return {x:x*scale,y:y*scale,active:true};
  }
  function motion(dt,x,y,speed,dashing=false,dashX=1,dashY=0){
    const step=Math.max(0,Math.min(.1,Number(dt)||0));
    const input=normalize(x,y);
    const targetX=input.x*speed,targetY=input.y*speed;
    const response=input.active?INPUT_RESPONSE:STOP_RESPONSE;
    const blend=1-Math.exp(-step/response);
    velocityX+=(targetX-velocityX)*blend;
    velocityY+=(targetY-velocityY)*blend;
    if(!input.active){
      if(Math.abs(velocityX)<.05)velocityX=0;
      if(Math.abs(velocityY)<.05)velocityY=0;
    }
    if(dashing){
      const dir=normalize(dashX,dashY);
      // Direction is locked for a dodge; gentle input influence does not
      // allow impossible sharp turns through telegraphed boss attacks.
      const steer=.10;
      const forwardX=dir.x*(1-steer)+input.x*steer;
      const forwardY=dir.y*(1-steer)+input.y*steer;
      const forwardLength=Math.hypot(forwardX,forwardY)||1;
      return {vx:forwardX/forwardLength*speed*4.35,
        vy:forwardY/forwardLength*speed*4.35,moving:true};
    }
    return {vx:velocityX,vy:velocityY,moving:input.active||Math.hypot(velocityX,velocityY)>.5};
  }
  function beginDash(x,y,dirX,dirY,now){
    const dir=normalize(dirX,dirY);
    rings.push({x,y,started:now,life:.27,kind:"launch",dirX:dir.x,dirY:dir.y});
    ghosts.push({x,y,started:now,dirX:dir.x,dirY:dir.y});
    lastTrailAt=now;
    wasDashing=true;
    return DASH_DURATION;
  }
  function track(x,y,now,dashing=false,dirX=1,dirY=0){
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(now))return;
    if(wasDashing&&!dashing){
      rings.push({x,y,started:now,life:.23,kind:"landing"});
      wasDashing=false;
    }
    if(dashing && now-lastTrailAt>=SNAPSHOT_INTERVAL-1e-5){
      ghosts.push({x,y,started:now,dirX,dirY});
      lastTrailAt=now;
      wasDashing=true;
    }
    ghosts=ghosts.filter(g=>now-g.started<TRAIL_LIFETIME).slice(-9);
    rings=rings.filter(r=>now-r.started<r.life).slice(-4);
  }
  function draw(ctx,now,quality="high"){
    if(!ctx || typeof ctx.save!=="function")return;
    ctx.save();
    const low=quality==="low";
    const list=low?ghosts.filter((g,i)=>i%2===0):ghosts;
    for(const g of list){
      const progress=Math.max(0,Math.min(1,(now-g.started)/TRAIL_LIFETIME));
      ctx.globalAlpha=(1-progress)*(low?.18:.34);
      ctx.fillStyle="#89e9ef";
      ctx.strokeStyle="#d7fbff";
      ctx.lineWidth=low?1.4:2.2;
      if(!low){ctx.shadowColor="#53ede6";ctx.shadowBlur=12;}
      ctx.beginPath();
      ctx.ellipse(g.x,g.y-4,11*(1-progress*.3),19*(1-progress*.3),0,0,Math.PI*2);
      ctx.fill();ctx.stroke();
    }
    ctx.shadowBlur=0;
    for(const ring of rings){
      const t=Math.max(0,Math.min(1,(now-ring.started)/ring.life));
      ctx.globalAlpha=(1-t)*(low?.28:.64);
      ctx.strokeStyle=ring.kind==="launch"?"#a7fff5":"#defeff";
      ctx.lineWidth=(1-t)*3+.5;
      ctx.beginPath();
      ctx.arc(ring.x,ring.y,18+t*(ring.kind==="launch"?30:22),0,Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function status(){return {
    dashDuration:DASH_DURATION,ghostCount:ghosts.length,ringCount:rings.length,
    velocityX,velocityY,trailLifetime:TRAIL_LIFETIME
  };}
  window.resetPlayerMovement=reset;
  window.clearPlayerMovementInput=releaseInput;
  window.normalizedPlayerInput=normalize;
  window.nextPlayerMotion=motion;
  window.beginPlayerDash=beginDash;
  window.trackPlayerMovement=track;
  window.drawPlayerMovement=draw;
  window.playerMovementStatus=status;
})();
