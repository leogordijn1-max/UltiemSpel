// Mourning Shade showcase: phase II combos and phase III cinematic ultimate.
(() => {
"use strict";
const TAU=Math.PI*2;
const isShade=e=>!!e && e.kind===3 && e.variant===1 && !e.isFinalBoss;
const phase=e=>e.phaseThree?3:e.phaseTwo?2:1;
const aimAt=(e,p)=>{const q=window.bossCombatPredictTarget?.(e,p)||p;return {x:q.x,y:q.y,a:Math.atan2(q.y-e.y,q.x-e.x)};};
function initialize(e,t=0){if(!isShade(e))return; e.shadeFight={mode:"idle",stage:"",until:0,lockAt:0,nextAt:t+11,alternation:0,ultimateUsed:false,round:0,target:null,forced:null};}
function start(e,mode,t,p,h){const s=e.shadeFight;s.mode=mode;s.round=0;s.target=aimAt(e,p);s.stage="tell";s.until=t+(mode==="eclipse"?1.8:1.15);s.lockAt=t+.33;s.forced=null;
e.chargeWarning=0;e.shotWarning=0;e.chargeActive=0;e.chargeCooldown=Math.max(e.chargeCooldown||0,3);e.shootCooldown=Math.max(e.shootCooldown||0,3);
if(mode==="eclipse"){s.ultimateUsed=true;h.clearBossAttacks?.();window.beginGuardianArenaPower?.(e,t,p);h.shake?.(9);}
h.sfx?.("boss-warn");h.notify?.("MOURNING SHADE · "+({collapse:"SHADOW COLLAPSE",phantoms:"PHANTOM EXECUTION",eclipse:"ETERNAL ECLIPSE"}[mode]),"boss",3.2);}
function finish(e,t,h){const s=e.shadeFight;window.interruptGuardianArenaPower?.(e);s.mode="idle";s.stage="";s.target=null;s.nextAt=t+(phase(e)===3?9.5:12);
e.specialRecoveryUntil=t+2.2;e.chargeCooldown=Math.max(e.chargeCooldown||0,2);e.shootCooldown=Math.max(e.shootCooldown||0,2);h.notify?.("SHADE EXPOSED · COUNTERATTACK!","boss",2);}
function ring(e,h,a,count,speed){for(let i=0;i<count;i++){const angle=a+i*TAU/count;if(i===0)continue;h.projectile?.(e,angle,speed,12+phase(e)*2,"shadow");}}
function execute(e,t,h){const s=e.shadeFight,q=s.target;if(!q)return;
if(s.mode==="collapse"){
// Successive concentric ring volleys: escape the changing gap; no instant hits.
ring(e,h,q.a+s.round*.73,18+s.round*3,
   315+phase(e)*22+s.round*29);
const x=q.x+Math.cos(q.a+s.round*.85)*110,y=q.y+Math.sin(q.a+s.round*.85)*110;
h.hazard?.(x,y,95,.48,13+phase(e));h.puff?.(e.x,e.y,"#b38bff",13);
}else if(s.mode==="phantoms"){
// Phantom Execution is a rotating execution seal, not another flank crossfire.
// Six glyphs surround the locked position. Each beat leaves a broad marked
// opening that rotates 90 degrees, inviting an actual movement decision.
const rotation=q.a+s.round*Math.PI/2;
const radius=205;
for(let i=0;i<8;i++){
  if(i===0||i===1)continue; // two adjacent safe sectors
  const a=rotation+i*TAU/8;
  const x=q.x+Math.cos(a)*radius,y=q.y+Math.sin(a)*radius;
  h.hazard?.(x,y,74,.44,12+phase(e));
  h.puff?.(x,y,"#cf9bff",7);
}
// A delayed centre strike makes standing still unsafe, without unavoidable
// flanking projectiles. All impacts are independently warned.
h.hazard?.(q.x,q.y,67,.52,12);
}else{
// Escalating three-beat eclipse; telegraphs exactly match the next danger.
const ax=Math.cos(q.a),ay=Math.sin(q.a),sx=-ay,sy=ax;
for(const side of [-1,0,1])h.hazard?.(q.x+sx*side*170+ax*(s.round-1)*65,q.y+sy*side*170+ay*(s.round-1)*65,89,.42,17);
for(const off of [-.52,-.31,-.1,.1,.31,.52])h.projectile?.(e,q.a+off+s.round*.12,305+s.round*18,13,"shadow");
h.shake?.(7+s.round*2);h.puff?.(q.x,q.y,"#d2a5ff",24);
}
s.round++;
const total=s.mode==="eclipse"?3:s.mode==="collapse"?3:2;
if(s.round>=total){s.stage="recovery";s.until=t+.65;}
else{s.stage="tell";s.until=t+(s.mode==="eclipse"?1.15:.9);s.lockAt=t+.25;s.target=null;}
}
function update(e,t,dt,p,h={}){if(!isShade(e)||!e.shadeFight)return false;const s=e.shadeFight;
if(s.mode==="idle"){
if(!h.visible||!e.phaseTwo||e.phaseIntro>0||e.shotWarning>0||e.chargeWarning>0||e.chargeActive>0||e.guardianWarningUntil>t||e.specialRecoveryUntil>t)return false;
const next=s.forced||(e.phaseThree&&!s.ultimateUsed?"eclipse":t>=s.nextAt?(s.alternation++%2?"phantoms":"collapse"):null);
if(!next||next==="eclipse"&&!e.phaseThree)return false;start(e,next,t,p,h);return true;}
if(s.stage==="recovery"){if(t>=s.until)finish(e,t,h);return true;}
if(s.stage==="tell"){
if(!s.target||t<s.lockAt)s.target=aimAt(e,p);
if(t>=s.until){execute(e,t,h);}
}
return true;}
function interrupt(e,t){if(!isShade(e)||!e.shadeFight||e.shadeFight.mode==="idle")return false;const s=e.shadeFight;window.interruptGuardianArenaPower?.(e);s.mode="idle";s.stage="";s.target=null;s.nextAt=t+1.6;return true;}
function force(e,mode,t){if(!isShade(e)||!e.shadeFight||!["collapse","phantoms","eclipse"].includes(mode))return false;
if(mode==="eclipse"&&e.shadeFight.ultimateUsed)return false;e.shadeFight.forced=mode;e.shadeFight.nextAt=t;return true;}
function backdrop(e,ctx,t,p,quality,w,h){if(!isShade(e)||!e.shadeFight||e.shadeFight.mode!=="eclipse"||!p)return;
ctx.save();ctx.fillStyle="rgba(14,5,30,0.43)";ctx.fillRect(p.x-w/2,p.y-h/2,w,h);
ctx.strokeStyle="#b57cff";ctx.globalAlpha=.48;ctx.lineWidth=quality==="low"?2:4;
for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(e.x,e.y,150+k*110+Math.sin(t*3+k)*13,0,TAU);ctx.stroke();}
if(quality!=="low"){ctx.font="bold 26px system-ui";ctx.textAlign="center";ctx.fillStyle="#e7caff";ctx.fillText("ETERNAL ECLIPSE",p.x,p.y-h*.38);}ctx.restore();}
function telegraph(e,ctx,t,quality){if(!isShade(e)||!e.shadeFight)return;const s=e.shadeFight;if(s.mode==="idle"||s.stage!=="tell"||!s.target)return;
const q=s.target,ax=Math.cos(q.a),ay=Math.sin(q.a),sx=-ay,sy=ax;
ctx.save();ctx.strokeStyle=s.mode==="eclipse"?"#ec91ff":"#b99aff";ctx.globalAlpha=.85;ctx.lineWidth=quality==="low"?3:4;ctx.setLineDash([11,8]);
const circle=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();};
if(s.mode==="collapse"){
  circle(e.x,e.y,175+s.round*25);
  circle(q.x+Math.cos(q.a+s.round*.85)*110,q.y+Math.sin(q.a+s.round*.85)*110,95);
  // The ONE safe radial seam rotates every beat. This matches the skipped
  // projectile at index zero; the rest of the ring is actual projectiles.
  const gap=q.a+s.round*.73,sector=Math.PI*2/(18+s.round*3);
  ctx.save();ctx.setLineDash([]);ctx.strokeStyle="#99ffe1";ctx.lineWidth=quality==="low"?4:6;
  for(const edge of [-sector*.52,sector*.52]){
    const a=gap+edge;
    ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*70,e.y+Math.sin(a)*70);
    ctx.lineTo(e.x+Math.cos(a)*245,e.y+Math.sin(a)*245);ctx.stroke();
  }
  ctx.restore();
}
else if(s.mode==="phantoms"){
  const rotation=q.a+s.round*Math.PI/2;
  for(let i=0;i<8;i++){
    if(i===0||i===1)continue;
    const a=rotation+i*TAU/8;
    const px=q.x+Math.cos(a)*205,py=q.y+Math.sin(a)*205;
    circle(px,py,74);
    ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(px,py);ctx.stroke();
  }
  circle(q.x,q.y,67);
}
else for(const side of [-1,0,1])circle(q.x+sx*side*170+ax*(s.round-1)*65,q.y+sy*side*170+ay*(s.round-1)*65,89);
ctx.restore();}
window.initializeShadeEncounter=initialize;window.updateShadeEncounter=update;window.interruptShadeEncounter=interrupt;window.forceShadeEncounter=force;window.drawShadeBackdrop=backdrop;window.drawShadeTelegraph=telegraph;
window.getShadeEncounterStatus=e=>e?.shadeFight?{mode:e.shadeFight.mode,stage:e.shadeFight.stage,round:e.shadeFight.round,ultimateUsed:e.shadeFight.ultimateUsed}:null;
})();