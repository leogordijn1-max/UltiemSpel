// Living World 2.0: the land retaliates against sustained destruction.
// Deterministic, bounded hazards; only ordinary kills build pressure.
(() => {
"use strict";
const LIMIT=4;
let state={kills:0,threshold:14,rifts:[],running:false,sequence:0};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function reset(){state={kills:0,threshold:14,rifts:[],running:true,sequence:0};}
function clear(){state.rifts.length=0;state.running=false;}
function onKill(enemy,player,time){if(!state.running||!enemy||enemy.kind===3||enemy.summoned||!player)return false;
state.kills++;if(state.kills<state.threshold)return false;
state.kills=0;state.sequence++;state.threshold=Math.max(10,14-Math.floor(state.sequence/3));
const angle=(state.sequence*2.399963)% (Math.PI*2);
const distance=115+(state.sequence%3)*65;
const rift={x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance,
 radius:85+Math.min(25,state.sequence*2),warning:2.2,active:2.8,elapsed:0,hit:false,trigger:state.sequence};
if(state.rifts.length>=LIMIT)state.rifts.shift();
state.rifts.push(rift);return true;}
function tick(dt,player,hooks={}){if(!state.running||!Number.isFinite(dt)||dt<=0)return;
for(let i=state.rifts.length-1;i>=0;i--){const r=state.rifts[i];r.elapsed+=dt;
if(r.elapsed>=r.warning+r.active){state.rifts.splice(i,1);continue;}
if(r.elapsed<r.warning||r.hit||!player)continue;
const dx=player.x-r.x,dy=player.y-r.y;
if(dx*dx+dy*dy>(r.radius+(player.r||0))**2)continue;
if((player.inv||0)>0)continue;
const damage=10;const applied=hooks.damage?.(damage,r)!==false;
if(applied)r.hit=true;
}}
function draw(ctx,time,quality){if(!state.running)return;ctx.save();
for(const r of state.rifts){const warn=r.elapsed<r.warning,progress=warn?clamp(r.elapsed/r.warning,0,1):1;
ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);
ctx.fillStyle=warn?"rgba(235,98,166,0.10)":"rgba(189,37,101,0.24)";ctx.fill();
ctx.lineWidth=warn?3:5;ctx.strokeStyle=warn?"#ffb0db":"#ff4d8c";ctx.globalAlpha=.55+.3*Math.sin(time*6);ctx.stroke();ctx.globalAlpha=1;
if(quality!=="low"){ctx.strokeStyle="#ffd6eb";ctx.lineWidth=2;ctx.beginPath();
ctx.arc(r.x,r.y,Math.max(8,r.radius*(1-progress)),0,Math.PI*2);ctx.stroke();}
}ctx.restore();}
function status(){return {kills:state.kills,threshold:state.threshold,active:state.rifts.length,sequence:state.sequence,rifts:state.rifts.map(r=>({...r}))};}
window.resetWorldRetaliation=reset;window.clearWorldRetaliation=clear;window.recordWorldDestruction=onKill;window.updateWorldRetaliation=tick;window.drawWorldRetaliation=draw;window.getWorldRetaliationStatus=status;
})();