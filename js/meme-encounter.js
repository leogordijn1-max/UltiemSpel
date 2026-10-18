// Final boss showcase: marked reality cuts, collapsing orbit and ultimate.
(() => {
"use strict";
const TAU=Math.PI*2, isFinal=e=>!!e&&e.kind===3&&e.isFinalBoss;
function aim(e,p){const q=window.bossCombatPredictTarget?.(e,p)||p;return{x:q.x,y:q.y,a:Math.atan2(q.y-e.y,q.x-e.x)};}
function init(e,t=0){if(!isFinal(e))return;e.memeFight={mode:"idle",stage:"",nextAt:t+10,until:0,lockAt:0,round:0,alternate:0,ultimateUsed:false,forced:null,target:null,angle:0};}
function start(e,m,t,p,h){const s=e.memeFight;s.mode=m;s.stage="tell";s.round=0;s.target=aim(e,p);s.angle=s.target.a;s.until=t+(m==="end"?2:1.25);s.lockAt=t+.33;s.forced=null;
e.shotWarning=0;e.chargeWarning=0;e.chargeActive=0;e.shootCooldown=Math.max(e.shootCooldown||0,3);e.chargeCooldown=Math.max(e.chargeCooldown||0,3);
if(m==="end"){s.ultimateUsed=true;h.clearBossAttacks?.();h.shake?.(12);}
h.notify?.("THE LAST MEME · "+({cuts:"REALITY SCISSORS",orbit:"BROKEN ORBIT",end:"THE END OF EVERYTHING"}[m]),"boss",4);h.sfx?.("boss-warn");}
function zones(s){const q=s.target;if(!q)return[];const a=s.angle,ax=Math.cos(a),ay=Math.sin(a),sx=-ay,sy=ax;
if(s.mode==="cuts"){const shift=(s.round-1)*90;return[-2,-1,0,1,2].map(k=>({x:q.x+sx*k*140+ax*shift,y:q.y+sy*k*140+ay*shift,r:68}));}
if(s.mode==="orbit"){const rot=a+s.round*.62;return Array.from({length:10},(_,i)=>i).filter(i=>i!==s.round%10&&i!==(s.round+1)%10&&i!==(s.round+2)%10).map(i=>({x:q.x+Math.cos(rot+i*TAU/10)*215,y:q.y+Math.sin(rot+i*TAU/10)*215,r:61}));}
const rot=a+s.round*.5;return[-2,-1,0,1,2].map(k=>({x:q.x+Math.cos(rot)*k*148,y:q.y+Math.sin(rot)*k*148,r:79}));}
function impact(e,t,h){const s=e.memeFight,q=s.target;if(!q)return;for(const z of zones(s))h.hazard?.(z.x,z.y,z.r,.5,s.mode==="end"?19:14);
if(s.mode==="cuts"){for(const off of [-.48,-.22,.22,.48])h.projectile?.(e,s.angle+off,310,13,"shadow");}
else if(s.mode==="orbit"){for(let i=0;i<7;i++)h.projectile?.(e,s.angle+i*TAU/7+s.round*.3,290,12,"shadow");}
else{for(const off of [-.65,-.38,-.13,.13,.38,.65])h.projectile?.(e,s.angle+off+s.round*.12,335+s.round*15,16,"shadow");h.shake?.(8+s.round*2);}
h.puff?.(q.x,q.y,"#ff7ce8",22);s.round++;const count=s.mode==="end"?4:3;
if(s.round>=count){s.stage="recovery";s.until=t+.7;}
else{s.stage="tell";s.until=t+(s.mode==="end"?1.2:1.05);s.lockAt=t+.26;s.target=null;}}
function update(e,t,dt,p,h={}){if(!isFinal(e)||!e.memeFight)return false;const s=e.memeFight;
if(s.mode==="idle"){if(!h.visible||e.phaseIntro>0||e.shotWarning>0||e.chargeWarning>0||e.chargeActive>0||e.specialRecoveryUntil>t)return false;
const m=s.forced||(e.finalPhase>=3&&!s.ultimateUsed?"end":t>=s.nextAt?(e.finalPhase>=2&&s.alternate++%2?"orbit":"cuts"):null);
if(!m||m==="end"&&e.finalPhase<3||m==="orbit"&&e.finalPhase<2)return false;start(e,m,t,p,h);return true;}
if(s.stage==="recovery"){if(t>=s.until){s.mode="idle";s.stage="";s.target=null;s.nextAt=t+9;e.specialRecoveryUntil=t+2.5;h.notify?.("REALITY STABILIZES · STRIKE NOW","boss",2);}return true;}
if(s.stage==="tell"){if(!s.target||t<s.lockAt){s.target=aim(e,p);s.angle=s.target.a;}if(t>=s.until)impact(e,t,h);}return true;}
function interrupt(e,t){if(!isFinal(e)||!e.memeFight||e.memeFight.mode==="idle")return false;Object.assign(e.memeFight,{mode:"idle",stage:"",target:null,nextAt:t+1.6});return true;}
function force(e,m,t){if(!isFinal(e)||!e.memeFight||!["cuts","orbit","end"].includes(m))return false;if(m==="end"&&e.memeFight.ultimateUsed)return false;e.memeFight.forced=m;e.memeFight.nextAt=t;return true;}
function backdrop(e,ctx,t,p,quality,w,h){if(!isFinal(e)||e.memeFight?.mode!=="end"||!p)return;ctx.save();ctx.fillStyle="rgba(10,2,20,.56)";ctx.fillRect(p.x-w/2,p.y-h/2,w,h);ctx.strokeStyle="#f764df";ctx.globalAlpha=.64;ctx.lineWidth=quality==="low"?2:5;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(e.x,e.y,130+i*90+Math.sin(t*4+i)*16,0,TAU);ctx.stroke();}if(quality!=="low"){ctx.font="bold 26px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffd0f4";ctx.fillText("THE END OF EVERYTHING",p.x,p.y-h*.38);}ctx.restore();}
function telegraph(e,ctx,t,quality){if(!isFinal(e)||e.memeFight?.stage!=="tell"||!e.memeFight.target)return;const s=e.memeFight;ctx.save();ctx.strokeStyle=s.mode==="end"?"#ff7fec":"#cda5ff";ctx.lineWidth=quality==="low"?3:5;ctx.globalAlpha=.92;ctx.setLineDash([12,8]);for(const z of zones(s)){ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();}ctx.restore();}
window.initializeMemeEncounter=init;window.updateMemeEncounter=update;window.interruptMemeEncounter=interrupt;window.forceMemeEncounter=force;window.drawMemeBackdrop=backdrop;window.drawMemeTelegraph=telegraph;window.getMemeEncounterStatus=e=>e?.memeFight?{mode:e.memeFight.mode,round:e.memeFight.round,ultimateUsed:e.memeFight.ultimateUsed}:null;
})();