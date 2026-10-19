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
  // A family starts at LV1 when its first possible chapter begins. Global
  // world threat (the dominant aesthetic) is independent from family rank.
  // New classes look like part of the same frightening world even at LV1.
  const BIRTH_BOSSES=Object.freeze({0:0,1:0,4:1,2:1,5:2,6:2});
  const PALETTE=["#9eb8c6","#f6a45d","#b784ff","#fa6479"];
  function familyBirthBoss(kind){return BIRTH_BOSSES[kind]??0;}
  function familyTier(kind,defeated=0){
    return tier(Math.max(0,Math.floor(Number(defeated)||0)-familyBirthBoss(kind)));
  }
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
    const level=familyTier(e.kind,defeated);
    if(e.evolutionTier!==undefined)return e; // idempotent for shared spawners
    e.worldThreatTier=tier(defeated);
    e.evolutionBirthBoss=familyBirthBoss(e.kind);
    e.evolutionTier=level; // zero-based: LV1=0, LV4=3
    e.evolutionLevel=level+1;
    e.evolutionName=FORMS[e.kind][level];
    // Core abilities are a fixed family+level contract, not random squad/elite
    // rolls. Squad positions can vary; what a unit CAN do never varies.
    const skills={
      0:[["pursuit"],["pursuit","intercept"],["pursuit","intercept","rally"],["pursuit","intercept","rally","relentless"]],
      1:[["sprint"],["sprint","feint"],["sprint","feint","phase"],["sprint","feint","phase","chainDash"]],
      2:[["tough"],["tough","stomp"],["tough","stomp","anchor"],["tough","stomp","anchor","quake"]],
      4:[["ranged"],["ranged","doubleShot"],["ranged","doubleShot","tripleShot"],["ranged","doubleShot","tripleShot","rapidFire"]],
      5:[["chaseFuse"],["chaseFuse","chaseBurst"],["chaseFuse","chaseBurst","shockBurst"],["chaseFuse","chaseBurst","shockBurst","cataclysm"]],
      6:[["shield"],["shield","escort"],["shield","escort","ward"],["shield","escort","ward","bastion"]]
    };
    e.evolutionAbilities=Object.freeze(skills[e.kind][level].slice());
    // Fewer, longer-lived bodies still need to fund two earned weapon
    // evolutions by 10:00 and 17:00; no XP is awarded without an actual kill.
    e.evolutionXpMultiplier=difficulty==="easy"?1:(1.34+level*.22);
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
  // A real, bounded gameplay effect for every upgraded Drifter. Allies gain
  // a visible pressure formation, but their own abilities never change.
  function combatMultiplier(e,enemies=[],player=null){
    if(!e || e.kind!==0)return 1;
    const level=e.evolutionLevel||1;
    let multiplier=1;
    if(player && level>=2 && Math.hypot(player.x-e.x,player.y-e.y)>185)
      multiplier*=1.25;
    if(level>=3 && Array.isArray(enemies) && enemies.some(a=>
      a!==e && !a.dead && a.hp>0 && a.kind===0 &&
      (a.x-e.x)**2+(a.y-e.y)**2<180**2))
      multiplier*=1.22;
    if(level>=4)multiplier*=1.13;
    return multiplier;
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
    const era=e?.worldThreatTier??level;
    if(!e || e.evolutionTier===undefined || !ctx || e.dead)return;
    const c=PALETTE[Math.min(3,Math.max(0,era))],r=e.r||13;
    ctx.save();ctx.translate(e.x,e.y);
    ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=level>=3?3.4:2.2;
    ctx.globalAlpha=.9;ctx.shadowColor=c;ctx.shadowBlur=quality==="low"?0:8+era*4;
    const spikes=e.kind===2?6:e.kind===6?4:e.kind===5?8:e.kind===4?5:e.kind===1?3:7;
    const totalSpikes=spikes+era;
    const radius=e.kind===2?r*1.42:e.kind===6?r*1.4:e.kind===4?r*2.1:e.kind===5?r*1.85:r*1.9;
    // World-era shape/colour belongs to everyone, including LV1 newcomers.
    // Family rank determines actual earned mutations and combat power.
    for(let i=0;i<totalSpikes;i++){
      const angle=(i/totalSpikes)*Math.PI*2-Math.PI/2;
      const u=Math.cos(angle),v=Math.sin(angle);
      const extension=r*(.25+.10*era);
      ctx.beginPath();ctx.moveTo(u*radius-v*5,v*radius+u*5);
      ctx.lineTo(u*(radius+extension),v*(radius+extension));
      ctx.lineTo(u*radius+v*5,v*radius-u*5);
      ctx.closePath();ctx.fill();
    }
    // Type-specific mutations: visible even under a late-run weapon storm.
    if(level>0 && e.kind===0){ // Evolved Drifter: hooked antlers and cracked core
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(side*r*.43,-r*.6);
        ctx.lineTo(side*r*.9,-r*1.4);
        ctx.lineTo(side*r*1.34,-r*1.67);ctx.stroke();
      }
    }else if(level>0 && e.kind===1){ // Runner develops long pursuit blades
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(-r*.6,side*r*.55);
        ctx.lineTo(-r*(2.0+.2*level),side*r*(1.0+.1*level));ctx.stroke();
      }
    }else if(level>0 && e.kind===2){ // Mike: enormous broken shoulder armor
      for(const side of [-1,1]){
        ctx.strokeRect(side*r*1.18-r*.23,-r*.8,r*.46,r*1.2);
      }
    }else if(level>0 && e.kind===4){ // Shade: unmistakable floating spectral crown
      ctx.beginPath();ctx.arc(0,-r*1.7,r*.78,Math.PI*.15,Math.PI*.85);
      ctx.stroke();
    }else if(level>0 && e.kind===5){ // Burstling: split burning heart
      ctx.beginPath();ctx.arc(0,0,r*(1.16+.07*level),0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r*.8,-r*.8);
      ctx.lineTo(r*.85,r*.85);ctx.stroke();
    }else if(level>0 && e.kind===6){ // Bulwark: two battle standards and jagged armor
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(side*r*.95,-r*.2);
        ctx.lineTo(side*r*1.4,-r*1.65);
        ctx.lineTo(side*r*2.02,-r*1.5);ctx.stroke();
      }
    }
    // A constant rank tag (1–4 dots) above each unit clearly distinguishes
    // e.g. a world-era III LV1 new arrival from a world-era III LV3 veteran.
    // Pips match ACTUAL level, never the scary world colour or visual era.
    ctx.globalAlpha=.96;ctx.shadowBlur=quality==="low"?0:5;
    const pipCount=level+1;
    const pitch=8;
    for(let i=0;i<pipCount;i++){
      const px=(i-(pipCount-1)/2)*pitch;
      ctx.beginPath();ctx.arc(px,-r*(e.kind===4?2.5:2.05)-9,2.8,0,Math.PI*2);
      ctx.fill();
    }
    if(quality!=="low" && era>0){
      ctx.globalAlpha=.3;
      ctx.beginPath();ctx.arc(0,0,r*(1.45+.08*Math.sin(time*2+e.x)),
        0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
  window.enemyEvolutionTier=tier;
  window.enemyFamilyDebutBossCount=familyBirthBoss;
  window.enemyFamilyEvolutionTier=familyTier;
  window.applyEnemyEvolution=evolve;
  window.evolvedEnemyTeamSteer=teamSteer;
  window.drawEnemyEvolution=draw;
  window.enemyEvolutionForms=FORMS;
  window.enemyEvolutionCombatMultiplier=combatMultiplier;
})();