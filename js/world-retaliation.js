// Update 9: elemental backlash scar that persists until the run ends.
(() => {
"use strict";
const LIMIT=16;
const TYPES={fire:{name:"FIRE",color:"#ff7946",fill:"rgba(250,91,30,.22)"},water:{name:"WATER",color:"#68cfff",fill:"rgba(29,153,223,.22)"},frost:{name:"FROST",color:"#aff2ff",fill:"rgba(111,212,255,.21)"}};
let state={kills:0,threshold:14,rifts:[],running:false,sequence:0};
function element(){const id=window.currentLivingWorldElement?.();return TYPES[id]?id:"fire";}
function reset(){state={kills:0,threshold:14,rifts:[],running:true,sequence:0};}
function clear(){state.rifts.length=0;state.running=false;}
function onKill(enemy,player){if(!state.running||!enemy||enemy.kind===3||enemy.summoned||!player)return false;
state.kills++;if(state.kills<state.threshold)return false;state.kills=0;
if(state.rifts.length>=LIMIT)return false;
state.sequence++;state.threshold=Math.max(10,14-Math.floor(state.sequence/3));
const angle=(state.sequence*2.399963)%(Math.PI*2),distance=180+(state.sequence%3)*85;
state.rifts.push({x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance,
radius:76,warning:2.2,elapsed:0,lastHit:-Infinity,type:element(),trigger:state.sequence});
return true;}
function tick(dt,player,hooks={}){if(!state.running||!Number.isFinite(dt)||dt<=0)return;
for(const r of state.rifts){r.elapsed+=dt;if(r.elapsed<r.warning||!player)continue;
const dx=player.x-r.x,dy=player.y-r.y;if(dx*dx+dy*dy>(r.radius+(player.r||0))**2)continue;
if(player.inv>0||r.elapsed-r.lastHit<1.7)continue;
if(r.type==="frost"){hooks.chill?.(2.1,r);r.lastHit=r.elapsed;}
else if(r.type==="water"){hooks.push?.(dx,dy,200,r);r.lastHit=r.elapsed;}
else if(hooks.damage?.(10,r)!==false)r.lastHit=r.elapsed;
}}
function draw(ctx,time,quality){if(!state.running)return;ctx.save();
for(const r of state.rifts){const active=r.elapsed>=r.warning,style=TYPES[r.type];
ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);
ctx.fillStyle=active?style.fill:"rgba(255,255,255,.07)";ctx.fill();
ctx.lineWidth=active?4:3;ctx.strokeStyle=style.color;ctx.globalAlpha=.65+.2*Math.sin(time*5);ctx.stroke();ctx.globalAlpha=1;
if(quality!=="low"){ctx.beginPath();ctx.arc(r.x,r.y,active?r.radius*.55:Math.max(8,r.radius*(1-r.elapsed/r.warning)),0,Math.PI*2);ctx.stroke();}}
ctx.restore();}
function status(){return {kills:state.kills,threshold:state.threshold,active:state.rifts.length,sequence:state.sequence,rifts:state.rifts.map(r=>({...r}))};}
window.resetWorldRetaliation=reset;window.clearWorldRetaliation=clear;window.recordWorldDestruction=onKill;window.updateWorldRetaliation=tick;window.drawWorldRetaliation=draw;window.getWorldRetaliationStatus=status;
})();