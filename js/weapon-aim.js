// Update 19 — shared weapon aim: predictable target choice and conservative lead.
// No extra damage, projectile counts, or offscreen target selection.
(() => {
 "use strict";
 function finite(v){return Number.isFinite(v)?v:0;}
 function velocity(target,origin){
   if(!target||target.kind===3||target.isFinalBoss)return {x:0,y:0};
   // Movement sampled AFTER enemy movement in the previous simulation frame.
   // Direct knockbacks / dash movements are capped for fair, predictable aim.
   if(Number.isFinite(target.combatVX)&&Number.isFinite(target.combatVY)){
     const length=Math.hypot(target.combatVX,target.combatVY);
     const cap=280;
     const scale=length>cap?cap/length:1;
     return {x:target.combatVX*scale,y:target.combatVY*scale};
   }
   // Before the first sampled frame, normal pursuers usually approach the player.
   // Never invent a velocity for ranged kiting enemies.
   if(target.kind===4||!Number.isFinite(target.speed))return {x:0,y:0};
   const dx=(origin?.x??target.x)-target.x;
   const dy=(origin?.y??target.y)-target.y;
   const length=Math.hypot(dx,dy);
   if(length<1)return {x:0,y:0};
   const speed=Math.min(160,Math.max(0,target.speed));
   return {x:dx/length*speed,y:dy/length*speed};
 }
 function angle(origin,target,speed,options={}){
   if(!origin||!target)return 0;
   const dx=finite(target.x)-finite(origin.x);
   const dy=finite(target.y)-finite(origin.y);
   const straight=Math.atan2(dy,dx);
   if(!Number.isFinite(speed)||speed<=0)return straight;
   const v=velocity(target,origin);
   // Solve |relative + v*t| = projectileSpeed*t. Root must be positive.
   const a=v.x*v.x+v.y*v.y-speed*speed;
   const b=2*(dx*v.x+dy*v.y),c=dx*dx+dy*dy;
   let t=NaN;
   if(Math.abs(a)<1e-7){
     if(Math.abs(b)>1e-7)t=-c/b;
   }else{
     const disc=b*b-4*a*c;
     if(disc>=0){
       const root=Math.sqrt(disc);
       const t1=(-b-root)/(2*a),t2=(-b+root)/(2*a);
       t=Math.min(t1>0?t1:Infinity,t2>0?t2:Infinity);
     }
   }
   const horizon=Math.max(0,Math.min(.42,finite(options.maxLead)||.33));
   if(!Number.isFinite(t)||t<0)t=0;
   const aimTime=Math.min(horizon,t);
   return Math.atan2(dy+v.y*aimTime,dx+v.x*aimTime);
 }
 function targets(origin,candidates,count,maxRange=Infinity,visible=()=>true){
   if(!origin||!Array.isArray(candidates)||count<=0)return [];
   const range2=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;
   const ranked=[];
   for(let i=0;i<candidates.length;i++){
     const e=candidates[i];
     if(!e||e.dead||e.hp===0||!visible(e))continue;
     const dx=finite(e.x)-finite(origin.x);
     const dy=finite(e.y)-finite(origin.y);
     const d2=dx*dx+dy*dy;
     if(d2>range2)continue;
     const close=Math.sqrt(d2);
     // Threat priority is mostly proximity. Bosses are intentionally high
     // priority, and nearby ranged enemies slightly outrank harmless strays.
     const urgency=(e.kind===3||e.isFinalBoss)?600:e.kind===4?45:e.kind===5?25:0;
     ranked.push({enemy:e,score:close-urgency,order:i});
   }
   ranked.sort((a,b)=>a.score-b.score||a.order-b.order);
   return ranked.slice(0,Math.max(0,Math.floor(count))).map(v=>v.enemy);
 }
 function distribute(selected,shots){
   if(!selected?.length||shots<=0)return [];
   const total=Math.max(0,Math.floor(shots)),result=[];
   for(let i=0;i<total;i++)result.push(selected[i%selected.length]);
   return result;
 }
 window.weaponAimAngle=angle;
 window.weaponAimTargets=targets;
 window.weaponDistributeShots=distribute;
 window.weaponTargetVelocity=velocity;
})();
