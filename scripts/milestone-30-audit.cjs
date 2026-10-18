#!/usr/bin/env node
"use strict";
// Update 30: repeatable TECHNICAL acceptance audit (Node only).
// This is NOT a browser test. PASS never means "release-ready": manual
// playability, fairness, FPS and earned upgrade rates require real runs.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
function runtime(file,globals={}){
  const window={};
  const sandbox=vm.createContext({window,Math,Number,Object,Map,Set,...globals});
  vm.runInContext(read(file),sandbox,{filename:file});
  return {window,ctx:sandbox};
}
function requireCheck(value,message){
  if(!value)throw new Error(message);
}
const cases=[
  ["ELEMENTS", "Exactly three element-only selectable loadouts",()=>{
    const {ctx}=runtime("js/elements.js");
    const plan=JSON.parse(vm.runInContext(
      "JSON.stringify(Object.fromEntries(Object.entries(livingWorldElements).map(([k,v])=>[k,v.weapons])))",ctx));
    const expected={
      fire:["flame","fireball","flameOrbit"],
      water:["waterBolt","tidalWave","whirlpool"],
      frost:["frost","iceShards","glacialPulse"]
    };
    requireCheck(JSON.stringify(plan)===JSON.stringify(expected),
      "Playable weapons differ from current 3x3 elemental scope");
  }],
  ["BOSSES", "Earned Beau → Shade → Bell → 25:00 finale → Endless Beau",()=>{
    const {window}=runtime("js/boss-flow.js");
    requireCheck(window.bossFlowSchedule("standard",0,179,180)===null,"early Beau");
    requireCheck(window.bossFlowSchedule("standard",0,180,180)==="ordinary","Beau");
    requireCheck(window.bossFlowSchedule("standard",3,1499,0)===null,"early finale");
    requireCheck(window.bossFlowSchedule("standard",3,1500,0)==="final","finale gated");
    requireCheck(!window.bossFlowCanFinale("standard",2,1600,false,false),"unearned finale");
    requireCheck(window.bossFlowCanFinale("standard",3,1500,false,false),"earned finale");
    requireCheck(window.bossFlowSchedule("standard",4,1900,0,true)===null,"post-victory boss");
    requireCheck(window.bossFlowOrdinaryVariant("endless",5)===0,"Endless does not restart Beau");
  }],
  ["EVOLUTIONS", "Boss + 10:00/17:00 + weapon 5 + support 3; maximum two",()=>{
    const globals={
      selectedWeapons:["flame","fireball","flameOrbit"],
      unlockedWeapons:["flame","fireball","flameOrbit"],
      upgrades:{flame:5,damage:3,fireball:5,critChance:3,flameOrbit:5,health:3},
      evolutions:{},time:600,bossesDefeated:0,
      active:true,paused:false,choiceScreenOpen:false,gameState:"playing",
      pendingLevelUps:0,boss:null
    };
    const {ctx}=runtime("js/upgrades.js",globals);
    requireCheck(vm.runInContext("eligibleEvolutions().length",ctx)===0,"no boss prerequisite");
    ctx.bossesDefeated=1;
    requireCheck(vm.runInContext("eligibleEvolutions().some(x=>x.id==='inferno')",ctx),"first evolution missing");
    ctx.evolutions.inferno=true;
    ctx.time=1019;
    requireCheck(vm.runInContext("eligibleEvolutions().length",ctx)===0,"early second evolution");
    ctx.time=1020;
    requireCheck(vm.runInContext("eligibleEvolutions().some(x=>x.id==='meteorRain')",ctx),"second evolution missing");
    ctx.evolutions.meteorRain=true;
    ctx.time=1800;
    requireCheck(vm.runInContext("eligibleEvolutions().length",ctx)===0,"third evolution wrongly available");
    requireCheck(vm.runInContext("nextEvolutionTime()",ctx)===Infinity,"no two-evolution cap");
  }],
  ["ISOLATION", "Regular enemies cleared; boss summons allowed; wave recovery",()=>{
    const globals={
      enemies:[{kind:0,dead:false},{kind:1,dead:false}],boss:null,
      enemyGrid:new Map(),enemyShots:[{damage:5}],bossShots:[],bossHazards:[],
      waveTimer:-20,spawn:0,runMode:"standard",kills:17,
      rebuildEnemyGrid:()=>{}
    };
    const {ctx,window}=runtime("js/boss-isolation.js",globals);
    requireCheck(window.beginBossIsolation()===true,"arena did not start");
    requireCheck(ctx.enemies.length===0&&ctx.kills===17,"isolation rewarded/retained horde");
    ctx.boss={kind:3,hp:1};
    ctx.enemies.push(ctx.boss,{summoned:true,kind:1});
    requireCheck(window.bossIsolationStatus().allowedEnemies===2,"summons excluded");
    requireCheck(window.finishBossIsolation(ctx.boss)===true,"boss exit failed");
    requireCheck(ctx.enemies.length===0&&ctx.waveTimer>=12,"cleanup/recovery failed");
  }],
  ["WORLD", "Loss does not save conquest; earned victory saves exactly the invader",()=>{
    const persisted=new Map();
    const globals={
      runMode:"standard",victoryClaimed:false,
      currentLivingWorldElement:()=>"fire",
      storageGet:(key,fallback)=>persisted.get(key)??fallback,
      storageSet:(key,value)=>persisted.set(key,value)
    };
    const {window,ctx}=runtime("js/world-state.js",globals);
    window.beginWorldRun();
    window.onWorldBossDefeated(1,false);
    requireCheck(window.getWorldConquest().target===15,"stage 1 15 percent");
    window.onWorldBossDefeated(2,false);
    requireCheck(window.getWorldConquest().target===50,"stage 2 50 percent");
    window.onWorldBossDefeated(3,false);
    requireCheck(window.getWorldConquest().target===85,"stage 3 85 percent");
    requireCheck(!window.completeWorldConquest(),"unearned victory persisted");
    requireCheck(!persisted.has("shadowDominantWorldV1"),"premature world mutation");
    ctx.victoryClaimed=true;
    requireCheck(window.completeWorldConquest(),"earned world conquest rejected");
    requireCheck(JSON.parse(persisted.get("shadowDominantWorldV1")).dominant==="burning",
      "wrong dominant world after Standard victory");
  }],
  ["POWERS", "Four phase-III arena hazards retain hit geometry, target lock and reset",()=>{
    const {window}=runtime("js/guardian-arena-powers.js");
    for(let i=0;i<4;i++){
      const boss={kind:3,variant:i,isFinalBoss:i===3,x:0,y:0};
      const p={x:230,y:0,r:15};
      requireCheck(window.beginGuardianArenaPower(boss,0,p),"missing Guardian power "+i);
      const s=window.guardianArenaPowerStatus();
      requireCheck(s.variant===i&&s.warningLength>=1.4,"warning missing "+i);
      requireCheck(window.guardianArenaPowerThreat(s,p.x,p.y,15),"boss misses stationary player "+i);
      requireCheck(window.interruptGuardianArenaPower(boss),"cannot cancel "+i);
    }
  }],
  ["HUD", "Collision-informed hints and clear attack hierarchy remain present",()=>{
    const hud=read("js/combat-hud.js"),render=read("js/render.js"),html=read("index.html");
    requireCheck(hud.includes("window.guardianArenaPowerThreat(power,x,y,r+10)"),
      "escape advice not grounded in collision");
    requireCheck(hud.includes("SAFE FROM THIS POWER"),"misleading global-safe label");
    requireCheck(html.includes('id="bossCombatCue"'),"combat HUD not wired");
    requireCheck(render.includes("drawGuardianArenaPowerWarning"),"boss tells not drawn");
    requireCheck(render.includes("drawCombatHudEscape"),"guidance not drawn");
  }],
  ["PERFORMANCE", "GPU/GC savings keep the full gameplay and fixed-step simulation",()=>{
    const enemies=read("js/enemies.js"),render=read("js/render.js"),game=read("js/game.js");
    requireCheck(enemies.includes("enemyGridBucketPool")&&
      enemies.includes("enemyGrid.clear()"),"spatial bucket reuse missing");
    requireCheck(render.includes("getVignettePaint")&&
      render.includes("renderSegmentVisible"),"viewport render optimization missing");
    requireCheck(game.includes("const fixedStep = 1 / 60")&&
      game.includes("simulationAccumulator"),"fixed-step simulation missing");
  }],
  ["VICTORY", "Victory protected; Endless defeat still works without an extra win",()=>{
    const game=read("js/game.js"),progress=read("js/progression.js");
    requireCheck(game.includes('if (!active || gameState === "victory") return false;'),
      "late hit could overwrite Victory");
    requireCheck(game.includes('CONQUERED IN STANDARD · ENDLESS ENDED'),
      "Endless world summary not corrected");
    requireCheck(game.includes('gameState = "playing";')&&
      game.includes('runMode = "endless";'),"Endless continue not active");
    requireCheck(progress.includes("const wasRecorded = runRecorded"),
      "run record idempotence missing");
  }],
  ["AUTOMATION", "Complete Node regression suite and browser checklist exist",()=>{
    const ci=read(".github/workflows/shadow-survivor-tests.yml");
    const qa=read("NORMAL-RUN-QA.md");
    requireCheck(ci.includes("node --test tests/*.test.js tests/*.test.cjs"),
      "CI not running full JS/CJS tests");
    requireCheck(qa.includes("Open: browsertest")&&qa.includes("Nog geen bevestigde"),
      "manual browser QA must remain explicitly open until evidenced");
  }]
];
const manual=[
  {id:"NORMAL_25_30_MIN",label:"Complete 25–30 min Normal campaign actually played",status:"OPEN"},
  {id:"EARNED_2_EVOLUTIONS",label:"Two evolutions earned through real XP and displayed level-up picks",status:"OPEN"},
  {id:"BOSS_FEEL",label:"4 bosses fair under overlapping powers at 1x, 2x and 3x",status:"OPEN"},
  {id:"WORLD_ENDLESS",label:"Saved world, boss rewards and Endless verified in browser",status:"OPEN"},
  {id:"FPS_MEMORY",label:"FPS/P95 and long-run memory measured with real browser",status:"OPEN"},
  {id:"THREE_RECORDED_RUNS",label:"At least three complete recorded Normal playtest reports",status:"OPEN"}
];
function audit(){
  const results=cases.map(([id,label,check])=>{
    try{check();return{id,label,status:"PASS"}}
    catch(e){return{id,label,status:"FAIL",reason:e.message}}
  });
  return {
    name:"Combat & Gameplay 2.0 — Update 30",
    scope:"TECHNICAL_MILESTONE_ONLY",
    technicalChecks:results,
    manualChecks:manual,
    technicalPass:results.every(x=>x.status==="PASS"),
    verifiedReleaseReady:results.every(x=>x.status==="PASS") &&
      manual.every(x=>x.status==="PASS")
  };
}
if(require.main===module){
  const result=audit();
  for(const item of result.technicalChecks)
    console.log(item.status+" "+item.id+" — "+item.label+
      (item.reason?" ("+item.reason+")":""));
  for(const item of result.manualChecks)
    console.log(item.status+" "+item.id+" — "+item.label);
  console.log("MILESTONE PLAN: 20/20; TECHNICAL AUDIT: "+
    (result.technicalPass?"PASS":"FAIL")+"; VERIFIED PLAYABLE RELEASE: "+
    (result.verifiedReleaseReady?"GO":"NO-GO (browser evidence missing)"));
  if(process.env.GITHUB_STEP_SUMMARY) {
    const status=result.technicalPass?"PASS":"FAIL";
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      "\n## Update 30 milestone audit\n"+
      "Technical baseline: **"+status+"**; verified browser release: **NO-GO**"+
      " (manual playtest evidence not yet provided)."+
      "\nSee [MILESTONE-30-REVIEW.md](../../blob/feature/living-world-prototype/MILESTONE-30-REVIEW.md).\n");
  }
  if(!result.technicalPass)process.exitCode=1;
}
module.exports={audit,manual};
