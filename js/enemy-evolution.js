// Enemy evolution — the defenders mutate in response to fallen Guardians.
// Distinct family identities survive each mutation. No random stat escalation
// disguised as lore, and no hidden area damage.
(() => {
  "use strict";
  const FORMS=Object.freeze({
    0:["Drifter","Riftwalker","Griefbound","Worldbreaker"],
    1:["Runner","Bloodrunner","Shadowrunner","Dreadrunner"],
    2:["Zombie Mike","Iron Mike","Ruin Mike","Last Bastion"],
    4:["Ranged Shade","Gloom Shade","Hex Shade","Eclipse Shade"],
    5:["Burstling","Feral Burstling","Core Burstling","Cataclysm Burstling"],
    6:["Bulwark","Iron Bulwark","Oath Bulwark","Doom Bulwark"]
  });
  const PALETTE=["","#f6a45d","#b784ff","#fa6479"];
  const profiles={
    0:{health:1.22,speed:1.11,damage:1.04}, // slow basic needs to get closer
    1:{health:1.12,speed:1.08,damage:1.05},
    2:{health:1.1,speed:1.07,damage:1.10},
    4:{health:1.23,speed:1.04,damage:1.08},
    5:{health:1.37,speed:1.14,damage:1.13},
    6:{health:1.12,speed:1.07,damage:1.10}
  };
  const tiers=Object.freeze([
    {hp:1,speed:1,damage:1},
    {hp:1.35,speed:1.09,damage:1.11},
    {hp:1.79,speed:1.18,damage:1.22},
    {hp:2.32,speed:1.27,damage:1.34}
  ]);
  function tier(defeated=0){return Math.max(0,Math.min(3,Math.floor(Number(defeated)||0)));}
  function evolve(e,defeated=0,difficulty="normal"){
    if(!e || !FORMS[e.kind] || e.kind===3 || e.summoned)return e;
    const level=tier(defeated);
    if(e.evolutionTier!==undefined)return e; // idempotent for shared spawners
    e.evolutionTier=level;
    e.evolutionName=FORMS[e.kind][level];
    const t=tiers[level],p=profiles[e.kind];
    // The new form, not passage of arbitrary time, explains the health/speed
    // changes. Easy variants have a toned-down evolution multiplier.
    const ease=difficulty==="easy"?.52:1;
    e.hp*=1+(t.hp*p.health-1)*ease;
    e.speed*=1+(t.speed*p.speed-1)*ease;
    e.damage*=1+(t.damage*p.damage-1)*ease;
    if(e.kind===5){
      e.burstRadius=Math.round(99+level*13);
      e.burstWarning=0;
    }
    if(e.kind===4)e.shootCooldown*=level>=2?.83:1;
    return e;
  }
  // Actual formation decisions: evolved frontline holds the angle, evolved
  // Burstlings attack exposed flanks while a guard/binder occupies the centre.
  // Other tactical skills remain the higher-priority decisions.
  function teamSteer(e,player){
    if(!e || !player || !e.evolutionTier || !e.encounterGroup ||
      !Array.isArray(e.encounterPartners) || e.summoned)return null;
    const friends=e.encounterPartners.filter(a=>a!==e&&!a.dead&&a.hp>0&&
      a.encounterGroup===e.encounterGroup);
    if(friends.length<1)return null;
    if(![0,5].includes(e.kind))return null;
    const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
    if(d<80)return null;
    const side=e.encounterSlot%2?-1:1;
    const isBurst=e.kind===5;
    // Approach an offset intercept point, never teleport or change collision.
    const flank=isBurst?126:78;
    const destX=player.x-dy/d*side*flank;
    const destY=player.y+dx/d*side*flank;
    return {angle:Math.atan2(destY-e.y,destX-e.x),
      speedMult:isBurst?1.18:1.12};
  }
  // Draw unmistakable new shape OUTSIDE the base silhouette, so the original
  // enemy sprite/body remains recognisable. Works on Low and High graphics.
  function draw(e,ctx,time=0,quality="high"){
    const level=e?.evolutionTier||0;
    if(!level || !ctx || e.dead)return;
    const c=PALETTE[level],r=e.r||13;
    ctx.save();ctx.translate(e.x,e.y);
    ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=level>=3?3.4:2.2;
    ctx.globalAlpha=.9;ctx.shadowColor=c;ctx.shadowBlur=quality==="low"?0:8+level*4;
    const spikes=e.kind===2?6:e.kind===6?4:e.kind===5?8:e.kind===4?5:e.kind===1?3:7;
    const radius=e.kind===2?r*1.42:e.kind===6?r*1.4:e.kind===4?r*2.1:e.kind===5?r*1.85:r*1.9;
    // Crown/spines become denser and harsher after each Guardian defeat.
    for(let i=0;i<spikes+level;i++){
      const angle=(i/(spikes+level))*Math.PI*2-Math.PI/2;
      const u=Math.cos(angle),v=Math.sin(angle);
      const extension=r*(.25+.10*level);
      ctx.beginPath();ctx.moveTo(u*radius-v*5,v*radius+u*5);
      ctx.lineTo(u*(radius+extension),v*(radius+extension));
      ctx.lineTo(u*radius+v*5,v*radius-u*5);
      ctx.closePath();ctx.fill();
    }
    // Type-specific mutations: visible even under a late-run weapon storm.
    if(e.kind===0){ // Drifter grows two hooked antlers and a cracked core
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(side*r*.43,-r*.6);
        ctx.lineTo(side*r*.9,-r*1.4);
        ctx.lineTo(side*r*1.34,-r*1.67);ctx.stroke();
      }
    }else if(e.kind===1){ // Runner develops long pursuit blades
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(-r*.6,side*r*.55);
        ctx.lineTo(-r*(2.0+.2*level),side*r*(1.0+.1*level));ctx.stroke();
      }
    }else if(e.kind===2){ // Mike: enormous broken shoulder armor
      for(const side of [-1,1]){
        ctx.strokeRect(side*r*1.18-r*.23,-r*.8,r*.46,r*1.2);
      }
    }else if(e.kind===4){ // Shade: unmistakable floating spectral crown
      ctx.beginPath();ctx.arc(0,-r*1.7,r*.78,Math.PI*.15,Math.PI*.85);
      ctx.stroke();
    }else if(e.kind===5){ // Burstling: split burning heart
      ctx.beginPath();ctx.arc(0,0,r*(1.16+.07*level),0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r*.8,-r*.8);
      ctx.lineTo(r*.85,r*.85);ctx.stroke();
    }else if(e.kind===6){ // Bulwark: two battle standards and jagged armor
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(side*r*.95,-r*.2);
        ctx.lineTo(side*r*1.4,-r*1.65);
        ctx.lineTo(side*r*2.02,-r*1.5);ctx.stroke();
      }
    }
    if(quality!=="low"){
      ctx.globalAlpha=.3;
      ctx.beginPath();ctx.arc(0,0,r*(1.45+.08*Math.sin(time*2+e.x)),
        0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
  window.enemyEvolutionTier=tier;
  window.applyEnemyEvolution=evolve;
  window.evolvedEnemyTeamSteer=teamSteer;
  window.drawEnemyEvolution=draw;
  window.enemyEvolutionForms=FORMS;
})();