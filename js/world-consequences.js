// Update 24 — The Living World has readable, tactical consequences.
// No spawned enemies, bonus XP, randomized hazards, or persistent saves.
(() => {
  "use strict";
  const WORLDS=Object.freeze({
    burning:Object.freeze({name:"BURNING",color:"#ffc078"}),
    flooded:Object.freeze({name:"FLOODED",color:"#96dfff"}),
    frozen:Object.freeze({name:"FROZEN",color:"#cef4ff"})
  });
  const NARRATIVES=Object.freeze({
    "burning>frozen":["ICEBOUND FRONTIER","THE THAWING LINE","THE LAST WINTER"],
    "burning>flooded":["STEAM FRONTIER","BOILING BORDER","THE FLOODED REALM BURNS"],
    "flooded>burning":["DROWNED EMBERS","RISING PRESSURE","THE FINAL TIDE"],
    "flooded>frozen":["BROKEN ICE","THE THAWING FLOOD","THE LAST ICE FLOE"],
    "frozen>burning":["ASHEN FROST","THE COLD ADVANCES","THE FINAL EMBER"],
    "frozen>flooded":["FROZEN SHORES","THE LOCKED CURRENT","THE LAST OPEN WATER"]
  });
  const stageOf=percent=>percent>=85?3:percent>=50?2:percent>=15?1:0;
  let lastStageNotified=0;
  let summaryCache=null,summaryAt=-Infinity;

  function snapshot(player=null){
    const c=window.getWorldConquest?.();
    if(!c?.active) return {active:false,stage:0,label:"WORLD AT REST"};
    const defender=WORLDS[c.original],invader=WORLDS[c.invading];
    const contested=!!(defender&&invader&&c.original!==c.invading);
    const progress=Math.max(0,Math.min(100,Number(c.target)||0));
    const stage=contested?stageOf(progress):0;
    const pair=c.invading+">"+c.original;
    const narratives=NARRATIVES[pair]||[];
    const ground=player&&Number.isFinite(player.x)&&Number.isFinite(player.y)
      ? window.worldBiomeAt?.(player.x,player.y) : null;
    const occupation=contested&&stage>0&&ground===c.invading;
    const tierText=stage===0?"FRONTIER INTACT":
      stage===1?"BORDER BREACHED":
      stage===2?"REALM CONTESTED":"GUARDIAN'S LAST STAND";
    const status=contested?
      (c.restored?"THE GUARDIAN RESTORED ITS HOME":
       c.conquered?"WORLD CONQUERED":
       stage>0?(narratives[stage-1]||tierText):"THE DEFENDERS HOLD")
      :"YOU ARE IN YOUR ELEMENT";
    return {
      active:true,contested,original:c.original,invading:c.invading,
      defender:defender?.name||"UNKNOWN",invader:invader?.name||"UNKNOWN",
      coverage:progress,stage,tierText,status,ground,
      occupied:occupation,conquered:!!c.conquered,restored:!!c.restored,
      territory:!contested?"UNCHALLENGED REALM":
        occupation?"ON INVADED GROUND · DEFENDERS EXPOSED":
        "ON DEFENDER GROUND · ENEMIES HOLD THE LINE",
      hazardCount:window.getWorldRetaliationStatus?.().active||0,
      defenseSquads:window.getWorldDefenseStatus?.().activeSquads||0
    };
  }
  function movement(enemy,groundBiome){
    if(!enemy||enemy.dead||enemy.kind===3||enemy.summoned)return 1;
    const c=window.getWorldConquest?.();
    if(!c?.active||c.conquered||c.restored||c.original===c.invading||
      enemy.worldAffinity!==c.original||groundBiome!==c.invading) return 1;
    const stage=stageOf(Number(c.target)||0);
    // Defensive units are slightly off-balance in occupied territory.
    // Bosses and summons are explicitly excluded, and the entire penalty
    // is bounded to 6%/9%/12% for meaningful but nontrivial terrain choice.
    return [1,.94,.91,.88][stage]||1;
  }
  function statusText(player=null,now=0){
    // The HUD refreshes often; reuse the most recent state for 0.4 game sec.
    if(summaryCache&&now>=summaryAt&&now-summaryAt<.4)return summaryCache;
    const s=snapshot(player);
    const text=s.active&&s.contested
      ? "WORLD FRONT · "+s.defender+" DEFENDS vs "+s.invader+
        " · "+s.coverage+"% INVADED · "+s.status+
        " · "+s.territory+
        " · RIFTS "+s.hazardCount+" · DEFENSE "+s.defenseSquads
      : s.active?"WORLD FRONT · "+s.defender+
        " · NO INVASION · "+s.territory:"WORLD FRONT · AT REST";
    summaryCache=text;summaryAt=now;
    return text;
  }
  function reset(){
    lastStageNotified=0;summaryCache=null;summaryAt=-Infinity;
  }
  function bossStage(count,now=0){
    const c=window.getWorldConquest?.();
    const stage=stageOf(Number(c?.target)||0);
    if(!c?.active||c.restored||c.conquered||
       c.original===c.invading||stage<=lastStageNotified||
       count!==stage||stage>3) return null;
    lastStageNotified=stage;
    summaryCache=null;
    const s=snapshot();
    return {
      stage,label:s.status,
      message:"THE WORLD FIGHTS BACK · "+s.status+" · "+
        s.defender+" DEFENDERS WILL HOLD THEIR GROUND"
    };
  }
  function endReport(){
    const c=window.getWorldConquest?.();
    if(!c?.active)return null;
    const before=WORLDS[c.original]?.name||"UNKNOWN";
    const invasion=WORLDS[c.invading]?.name||"UNKNOWN";
    const peak=c.conquered?100:c.restored?c.restorationPeak:Number(c.target)||0;
    return {
      before,invasion,peak:Math.max(0,Math.min(100,Math.round(peak))),
      after:c.conquered?invasion:before,
      outcome:c.conquered?"PERMANENTLY CONQUERED":
        c.restored?"RECLAIMED BY THE DEFENDERS":"CONTESTED — UNRESOLVED",
      saved:c.conquered
    };
  }
  window.getWorldConsequenceSnapshot=snapshot;
  window.worldConsequenceHudText=statusText;
  window.worldOccupationMovement=movement;
  window.worldConsequenceBossStage=bossStage;
  window.worldConsequenceEndReport=endReport;
  window.resetWorldConsequences=reset;
})();
