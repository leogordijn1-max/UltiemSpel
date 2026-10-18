// Update 27 — readable combat priorities. Pure UI: never deals damage,
// spawns enemies, changes boss timing, or grants a "safe" guarantee from
// overlapping attacks. Escape advice is for the CURRENT arena power only.
(() => {
  "use strict";
  const DIRS = [
    ["→",0],["↘",Math.PI/4],["↓",Math.PI/2],["↙",3*Math.PI/4],
    ["←",Math.PI],["↖",5*Math.PI/4],["↑",3*Math.PI/2],["↗",7*Math.PI/4]
  ];
  const MAX_STEP=[64,96,130,170,210,260,310,370];
  let routeCache=null;
  function reset(){routeCache=null}
  // Never UNDERSTATE remaining reaction time because of float rounding.
  const sec = value => (Math.ceil(Math.max(0,value-1e-8)*10)/10).toFixed(1);
  function escape(power,player,now) {
    if (!power?.active || power.stage!=="warning" ||
        !player || !window.guardianArenaPowerThreat) return null;
    // While the power tracks you, every computed route would be stale.
    if (now < (power.lockAt ?? 0))return {kind:"tracking"};
    const px=player.x,py=player.y,r=player.r||0;
    if(!window.guardianArenaPowerThreat(power,px,py,r))
      return {kind:"clear"};
    if (routeCache && routeCache.beat===power.beat &&
        routeCache.variant===power.variant &&
        routeCache.angle===power.angle &&
        routeCache.centerX===power.centerX &&
        routeCache.centerY===power.centerY &&
        now-routeCache.time>=0 && now-routeCache.time<.13 &&
        Math.hypot(px-routeCache.px,py-routeCache.py)<25) return routeCache.route;
    // Sample 8 headings and several distances. Revalidate with a margin so
    // the marker is not placed directly on the collision boundary.
    const remaining=Math.max(0,power.warningUntil-now);
    const walkBudget=Math.max(70,Math.min(370,remaining*285));
    let result=null;
    for(const step of MAX_STEP){
      if(step>walkBudget+15)break;
      for(const [arrow,angle] of DIRS){
        const x=px+Math.cos(angle)*step,y=py+Math.sin(angle)*step;
        if(window.guardianArenaPowerThreat(power,x,y,r+10))continue;
        result={kind:"route",arrow,distance:step,x,y};
        break;
      }
      if(result)break;
    }
    if(!result)result={kind:"dash"};
    routeCache={beat:power.beat,variant:power.variant,
      centerX:power.centerX,centerY:power.centerY,
      angle:power.angle,px,py,time:now,route:result};
    return result;
  }
  function describe(boss,player,now,dashCooldown=0){
    if(!boss || boss.dead || boss.kind!==3)return {visible:false};
    const dash = dashCooldown<=0 ? "DASH READY · SHIFT" :
      "DASH "+sec(dashCooldown)+"s · SHIFT";
    const power=window.guardianArenaPowerStatus?.();
    if(power?.active && power.variant===(boss.isFinalBoss?3:boss.variant)){
      const sequence="BEAT "+(power.beat+1)+"/3";
      if(power.stage==="warning"){
        const remaining=Math.max(0,power.warningUntil-now);
        const route=escape(power,player,now);
        let instruction="DASH IF TRAPPED · WATCH ALL ATTACKS";
        if(route?.kind==="tracking")instruction="TARGET TRACKING · BAIT, THEN DODGE";
        if(route?.kind==="clear")instruction="OUTSIDE THIS POWER'S HITZONE · KEEP WATCH";
        if(route?.kind==="route")
          instruction="SAFE FROM THIS POWER "+route.arrow+" "+route.distance+"px";
        return {
          visible:true,tone:route?.kind==="clear"?"clear":"danger",
          title:power.name,detail:sequence+" · IMPACT IN "+sec(remaining)+"s",
          instruction,subtext:dash,
          progress:Math.max(0,Math.min(100,
            (1-remaining/power.warningLength)*100)),route,
          stage:"warning"
        };
      }
      return {
        visible:true,tone:power.stage==="impact"?"danger":"prepare",
        title:power.stage==="impact"?"IMPACT · MOVE!":"PREPARE NEXT STRIKE",
        detail:sequence+(power.stage==="impact"?" · HITS RESOLVED":" · NEW TARGET INCOMING"),
        instruction:"KEEP MOVING · WATCH THE NEXT TELEGRAPH",subtext:dash,
        progress:power.stage==="impact"?100:0,route:null,stage:power.stage
      };
    }
    // Never claim a counterattack bonus if the real damage multiplier is 1.
    const recovery=Math.max(0,(boss.specialRecoveryUntil||0)-now);
    if(recovery>0){
      const bonus=window.bossCombatDamageMultiplier?.(boss,now)||1;
      return {visible:true,tone:"recovery",
        title:bonus>1?"COUNTERATTACK · +42% DAMAGE":"BOSS RECOVERING",
        detail:"PUNISH WINDOW · "+sec(recovery)+"s REMAINING",
        instruction:"ATTACK NOW · AVOID RESIDUAL PROJECTILES",
        subtext:dash,progress:100,route:null,stage:"recovery"};
    }
    const incoming=[
      ["guardianWarningUntil","WORLD GUARDIAN POWER",(boss.guardianWarningUntil||0)-now],
      ["specialWarningUntil",boss.specialActiveName||"GUARDIAN ATTACK",(boss.specialWarningUntil||0)-now],
      ["chargeWarning","CHARGE INCOMING",boss.chargeWarning||0],
      ["shotWarning","PROJECTILE VOLLEY",boss.shotWarning||0]
    ].find(entry=>entry[2]>0);
    if(incoming){
      return {visible:true,tone:"danger",title:incoming[1],
        detail:"ATTACK IN "+sec(incoming[2])+"s",
        instruction:"FOLLOW THE ARENA TELEGRAPH",subtext:dash,
        progress:null,route:null,stage:"warning"};
    }
    for(const field of ["beauFight","shadeFight","bellFight","memeFight"]){
      const s=boss[field];
      if(s?.mode && s.mode!=="idle" && s.stage!=="recovery" && s.stage!=="recover"){
        const remaining=Math.max(0,(s.until||now)-now);
        return {visible:true,tone:"danger",title:s.mode.toUpperCase().replace(/([A-Z])([A-Z])/g,"$1$2"),
          detail:"BOSS SPECIAL · "+(s.stage||"ACTIVE").toUpperCase()+
            (remaining>0?" · "+sec(remaining)+"s":""),
          instruction:"DODGE THE MARKED AREAS · THEN PUNISH",
          subtext:dash,progress:null,route:null,stage:"special"};
      }
    }
    return {visible:false};
  }
  function drawEscape(ctx,boss,player,now,quality) {
    if(!ctx || !boss || !player)return;
    const ui=describe(boss,player,now,0);
    const route=ui.route;
    if(!ui.visible||ui.stage!=="warning"||route?.kind!=="route")return;
    ctx.save();
    ctx.strokeStyle="#96ffe0";
    ctx.fillStyle="#96ffe0";
    ctx.globalAlpha=.88;
    ctx.lineWidth=quality==="low"?3:2.5;
    ctx.setLineDash([7,7]);
    ctx.beginPath();ctx.moveTo(player.x,player.y);
    ctx.lineTo(route.x,route.y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(route.x,route.y,16,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(route.x,route.y,4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  window.combatHudDescribe=describe;
  window.combatHudEscape=escape;
  window.drawCombatHudEscape=drawEscape;
  window.resetCombatHud=reset;
})();
