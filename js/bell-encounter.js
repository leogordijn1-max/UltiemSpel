// Bell Tower showcase: sweeping chimes, clockwork lanes and final Grand Peal.
(() => {
"use strict";
const TAU=Math.PI*2;
const bell=e=>!!e&&e.kind===3&&e.variant===2&&!e.isFinalBoss;
const predict=(e,p)=>{const q=window.bossCombatPredictTarget?.(e,p)||p;return {x:q.x,y:q.y,a:Math.atan2(q.y-e.y,q.x-e.x)};};
function init(e,t=0){if(!bell(e))return;e.bellFight={mode:"idle",stage:"",nextAt:t+10.5,until:0,lockAt:0,target:null,round:0,rotation:0,alternate:0,ultimateUsed:false,forced:null};}
function begin(e,mode,t,p,h){const s=e.bellFight;s.mode=mode;s.stage="tell";s.round=0;s.target=predict(e,p);s.rotation=s.target.a;s.lockAt=t+.35;s.until=t+(mode==="peal"?1.9:1.2);s.forced=null;
e.shotWarning=0;e.chargeWarning=0;e.chargeActive=0;e.shootCooldown=Math.max(e.shootCooldown||0,3);e.chargeCooldown=Math.max(e.chargeCooldown||0,3);
if(mode==="peal"){s.ultimateUsed=true;h.clearBossAttacks?.();window.beginGuardianArenaPower?.(e,t,p);h.shake?.(9);}
h.sfx?.("boss-warn");h.notify?.("BELL TOWER · "+({sweep:"RESONANT SWEEP",clock:"CLOCKWORK JUDGMENT",peal:"THE GRAND PEAL"}[mode]),"boss",3);}
function finish(e,t,h){const s=e.bellFight;window.interruptGuardianArenaPower?.(e);s.mode="idle";s.stage="";s.target=null;s.nextAt=t+(e.phaseThree?9.5:12);
e.specialRecoveryUntil=t+2.3;e.shootCooldown=Math.max(e.shootCooldown||0,2.2);e.chargeCooldown=Math.max(e.chargeCooldown||0,2.2);h.notify?.("BELL SILENCED · ATTACK NOW","boss",2);}
function marks(s){const q=s.target;if(!q)return [];const a=s.rotation,ax=Math.cos(a),ay=Math.sin(a),sx=-ay,sy=ax;
if(s.mode==="sweep"){const shift=(s.round-1)*115;return [-2,-1,0,1,2].map(k=>({x:q.x+sx*k*125+ax*shift,y:q.y+sy*k*125+ay*shift,r:62}));}
if(s.mode==="clock"){const angle=a+s.round*Math.PI/3;return Array.from({length:8},(_,i)=>i).filter(i=>i!==s.round%8&&i!==(s.round+1)%8).map(i=>({x:q.x+Math.cos(angle+i*TAU/8)*180,y:q.y+Math.sin(angle+i*TAU/8)*180,r:69}));}
const angle=a+s.round*.43;return [-2,-1,0,1,2].map(k=>({x:q.x+Math.cos(angle)*k*128,y:q.y+Math.sin(angle)*k*128,r:74}));}
function strike(e,t,h){const s=e.bellFight,q=s.target;if(!q)return;const areas=marks(s);for(const m of areas)h.hazard?.(m.x,m.y,m.r,.5,s.mode==="peal"?19:14);
if(s.mode==="sweep"){const angle=s.rotation+s.round*.18;for(const off of [-.65,-.35,0,.35,.65])h.projectile?.(e,angle+off,290,11,"bell");}
else if(s.mode==="clock"){const angle=s.rotation+s.round*Math.PI/3;for(let i=0;i<6;i++)h.projectile?.(e,angle+i*TAU/6,260,11,"bell");}
else{const angle=s.rotation+s.round*.43;for(const off of [-.5,-.25,0,.25,.5])h.projectile?.(e,angle+off,325+s.round*20,14,"bell");h.shake?.(8+s.round*2);}
h.puff?.(q.x,q.y,"#ffe29b",17);s.round++;
const total=s.mode==="peal"?4:3;
if(s.round>=total){s.stage="recover";s.until=t+.6;}else{s.stage="tell";s.until=t+(s.mode==="peal"?1.16:1.02);s.lockAt=t+.27;s.target=null;}}
function tick(e,t,dt,p,h={}){if(!bell(e)||!e.bellFight)return false;const s=e.bellFight;
if(s.mode==="idle"){if(!h.visible||!e.phaseTwo||e.phaseIntro>0||e.shotWarning>0||e.chargeWarning>0||e.chargeActive>0||e.guardianWarningUntil>t||e.specialRecoveryUntil>t)return false;
const mode=s.forced||(e.phaseThree&&!s.ultimateUsed?"peal":t>=s.nextAt?(s.alternate++%2?"clock":"sweep"):null);
if(!mode||mode==="peal"&&!e.phaseThree)return false;begin(e,mode,t,p,h);return true;}
if(s.stage==="recover"){if(t>=s.until)finish(e,t,h);return true;}
if(s.stage==="tell"){if(!s.target||t<s.lockAt){s.target=predict(e,p);s.rotation=s.target.a;}if(t>=s.until)strike(e,t,h);}return true;}
function interrupt(e,t){if(!bell(e)||!e.bellFight||e.bellFight.mode==="idle")return false;window.interruptGuardianArenaPower?.(e);Object.assign(e.bellFight,{mode:"idle",stage:"",target:null,nextAt:t+1.6});return true;}
function force(e,mode,t){if(!bell(e)||!e.bellFight||!["sweep","clock","peal"].includes(mode))return false;if(mode==="peal"&&e.bellFight.ultimateUsed)return false;e.bellFight.forced=mode;e.bellFight.nextAt=t;return true;}
function backdrop(e,ctx,t,p,quality,w,h){if(!bell(e)||e.bellFight?.mode!=="peal"||!p)return;ctx.save();ctx.fillStyle="rgba(40,25,4,.38)";ctx.fillRect(p.x-w/2,p.y-h/2,w,h);ctx.strokeStyle="#ffd777";ctx.lineWidth=quality==="low"?2:4;ctx.globalAlpha=.55;
for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(e.x,e.y,135+i*85+12*Math.sin(t*4+i),0,TAU);ctx.stroke();}
if(quality!=="low"){ctx.font="bold 26px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff0ba";ctx.fillText("THE GRAND PEAL",p.x,p.y-h*.38);}ctx.restore();}
function telegraph(e,ctx,t,quality){if(!bell(e)||e.bellFight?.stage!=="tell"||!e.bellFight.target)return;const s=e.bellFight,q=s.target;ctx.save();ctx.strokeStyle=s.mode==="peal"?"#fff1a5":"#f2c56c";ctx.globalAlpha=.88;ctx.lineWidth=quality==="low"?3:4;ctx.setLineDash([10,8]);
for(const m of marks(s)){ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,TAU);ctx.stroke();}
ctx.setLineDash([]);ctx.beginPath();ctx.arc(e.x,e.y,50+8*Math.sin(t*10),0,TAU);ctx.stroke();ctx.restore();}
window.initializeBellEncounter=init;window.updateBellEncounter=tick;window.interruptBellEncounter=interrupt;window.forceBellEncounter=force;window.drawBellBackdrop=backdrop;window.drawBellTelegraph=telegraph;
window.getBellEncounterStatus=e=>e?.bellFight?{mode:e.bellFight.mode,stage:e.bellFight.stage,round:e.bellFight.round,ultimateUsed:e.bellFight.ultimateUsed}:null;
})();