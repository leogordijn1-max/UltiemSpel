const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function evolution(){const window={};vm.runInNewContext(read("js/enemy-evolution.js"),{window,Math,Number});return window;}
const make=kind=>({kind,x:0,y:0,hp:100,speed:100,damage:10,r:kind===2?35:13});

test("every species has its OWN LV1 birth chapter, while the whole world enters the same horror era",()=>{
 const w=evolution();
 const debut={0:0,1:0,4:1,2:1,5:2,6:2};
 const eras={
  0:[[0,1]],
  1:[[0,2],[1,2],[4,1],[2,1]],
  2:[[0,3],[1,3],[4,2],[2,2],[5,1],[6,1]],
  3:[[0,4],[1,4],[4,3],[2,3],[5,2],[6,2]]
 };
 for(const [stage,units] of Object.entries(eras)){
  for(const [kind,expectedLevel] of units){
   const e=make(kind);w.applyEnemyEvolution(e,Number(stage),"normal");
   assert.equal(e.evolutionTier+1,expectedLevel,"wrong family rank for "+kind+" in era "+stage);
   assert.equal(e.evolutionLevel,expectedLevel);
   assert.equal(e.worldThreatTier,Number(stage),"new LV1 must share the horror era");
   assert.equal(e.evolutionBirthBoss,debut[kind]);
   assert.equal(e.evolutionName,w.enemyEvolutionForms[kind][expectedLevel-1]);
  }
 }
 assert.equal(w.enemyEvolutionTier(99),3);
 assert.equal(w.enemyFamilyEvolutionTier(5,2),0);
 assert.equal(w.enemyFamilyEvolutionTier(5,3),1);
 assert.equal(w.enemyFamilyEvolutionTier(4,1),0);
 assert.equal(w.enemyFamilyEvolutionTier(0,3),3);
});

test("evolution progression is not a hidden per-frame health multiplier",()=>{
 const w=evolution(),e=make(0);w.applyEnemyEvolution(e,2,"normal");
 const stats=[e.hp,e.speed,e.damage];
 w.applyEnemyEvolution(e,2,"normal");
 assert.deepEqual([e.hp,e.speed,e.damage],stats);
 assert.equal(w.applyEnemyEvolution(make(3),3,"normal").evolutionTier,undefined);
 assert.equal(w.applyEnemyEvolution({...make(1),summoned:true},3,"normal").evolutionTier,undefined);
 const easy=make(1),normal=make(1);
 w.applyEnemyEvolution(easy,3,"easy");
 w.applyEnemyEvolution(normal,3,"normal");
 assert.ok(easy.hp<normal.hp && easy.speed<normal.speed);
});

test("evolved Burstling survives longer, arms from closer real proximity and gets bigger visible detonation",()=>{
 const w=evolution(),base=make(5),late=make(5);
 w.applyEnemyEvolution(base,0,"normal");
 w.applyEnemyEvolution(late,5,"normal");
 assert.ok(late.hp>base.hp*2);
 assert.ok(late.speed>base.speed);
 assert.ok(late.burstRadius>base.burstRadius);
 assert.match(read("js/game.js"),/playerDistanceSquared < \(e.burstRadius\+85\)\*\(e.burstRadius\+85\)/);
 assert.match(read("js/render.js"),/const radius=e.burstRadius\|\|86/);
});

test("evolved Drifter and Burstling coordinate a genuine flank, without overriding tactics",()=>{
 const w=evolution(),front=make(0),volatile=make(5),guard=make(6);
 front.encounterGroup=volatile.encounterGroup=guard.encounterGroup="squad1";
 front.encounterSlot=0;volatile.encounterSlot=1;
 w.applyEnemyEvolution(front,3);w.applyEnemyEvolution(volatile,3);
 front.encounterPartners=volatile.encounterPartners=[front,volatile,guard];
 const player={x:250,y:0};
 const a=w.evolvedEnemyTeamSteer(front,player);
 const b=w.evolvedEnemyTeamSteer(volatile,player);
 assert.ok(a&&b&&a.angle*b.angle<0,"one fronts on left, the other threatens right");
 assert.ok(a.speedMult>1&&b.speedMult>1);
 volatile.dead=true;guard.dead=true;
 assert.equal(w.evolvedEnemyTeamSteer(front,player),null);
 assert.match(read("js/game.js"),/teamSkill\|\|archetype\|\|formation/);
});

test("each evolved family changes actual Canvas silhouette while retaining old body drawing",()=>{
 const w=evolution(),visited=new Set();
 for(const kind of [0,1,2,4,5,6]){
  const e=make(kind);w.applyEnemyEvolution(e,3);
  const events=[];
  const ctx=new Proxy({},{
    get(_,key){if(key==="save"||key==="restore"||key==="stroke"||key==="fill"||
      key==="beginPath"||key==="closePath"||key==="translate"||key==="moveTo"||
      key==="lineTo"||key==="strokeRect"||key==="arc")
       return (...a)=>events.push([key,...a]);
      return undefined;
    },set:()=>true
  });
  w.drawEnemyEvolution(e,ctx,100,"low");
  assert.ok(events.some(x=>x[0]==="fill"),"real visible new spikes");
  assert.ok(events.some(x=>x[0]==="stroke"||x[0]==="strokeRect"),"real visible mutation");
  visited.add(e.evolutionName);
 }
 assert.equal(visited.size,6);
 assert.match(read("js/render.js"),/window\.drawEnemyEvolution\?\.\(e,ctx,time,graphicsQuality\)/);
 const html=read("index.html");
 assert.match(html,/js\/enemy-evolution\.js\?v=/);
});

test("smaller smarter waves and first two boss pressure increases are wired in",()=>{
 const pacing=read("js/encounter-pacing.js"),waves=read("js/enemies.js");
 assert.match(pacing,/const base=7\+Math\.min\(2/);
 assert.match(pacing,/Math\.min\(4,plan\?\.members/);
 assert.match(waves,/Math\.min\(15,10\+Math\.floor\(number\*\.35\)\)/);
 const beau=read("js/beau-encounter.js"),shade=read("js/shade-encounter.js");
 assert.match(beau,/if\(s\.round>=4\)finish\(e,t,hooks\)/);
 assert.match(beau,/const reach=\(835\+phase\(e\)\*50\)\*\.66\+16/);
 assert.match(shade,/18\+s\.round\*3/);
 assert.match(shade,/if\(i===0\)continue/);
 assert.match(shade,/#99ffe1/);
 assert.match(read("js/enemies.js"),/enemy_evolution_unlocked/);
});

test("supernatural counter-skills appear only AFTER the creature actually mutates",()=>{
 const w={};vm.runInNewContext(read("js/enemy-counter-roles.js"),{window:w,Math,Number});
 const fresh={kind:1,evolutionTier:0,encounterTactic:"pouncer"};
 w.initializeEnemyCounterRole(fresh);
 assert.equal(fresh.counterRole,null);
 const changed={kind:1,evolutionTier:2,evolutionLevel:3,encounterTactic:"pouncer"};
 w.initializeEnemyCounterRole(changed);
 assert.equal(changed.counterRole,"phaseStalker");
 const mike={kind:2,evolutionTier:2,evolutionLevel:3};
 w.initializeEnemyCounterRole(mike);
 assert.equal(mike.counterRole,"anchor");
 const ward={kind:6,evolutionTier:2,evolutionLevel:3,encounterTactic:"ward"};
 w.initializeEnemyCounterRole(ward);
 assert.equal(ward.counterRole,"warden");
 const src=read("js/enemies.js");
 assert.match(src,/window\.applyEnemyEvolution\?\.\(e,bossesDefeated,difficulty\)/);
 assert.ok(src.indexOf("window.applyEnemyEvolution?.(e,bossesDefeated,difficulty)")<
  src.indexOf("window.initializeEnemyCounterRole?.(e)"));
});

test("first-boss LV1 newcomer has same global spines and palette as a LV2 veteran but unmistakable rank dots",()=>{
 const w=evolution(),old=make(0),newKind=make(4);
 w.applyEnemyEvolution(old,1);w.applyEnemyEvolution(newKind,1);
 assert.equal(old.evolutionLevel,2);
 assert.equal(newKind.evolutionLevel,1);
 assert.equal(old.worldThreatTier,newKind.worldThreatTier);
 function drawing(e){
  const calls=[];
  const ctx=new Proxy({},{
   get(_,key){if(["save","restore","stroke","fill","beginPath","closePath",
    "translate","moveTo","lineTo","strokeRect","arc"].includes(key))
    return (...args)=>calls.push([key,...args]);return undefined;},
   set(_,key,val){calls.push(["set",key,val]);return true;}
  });
  w.drawEnemyEvolution(e,ctx,100,"low");return calls;
 }
 const base=drawing(old),arriving=drawing(newKind);
 assert.equal(base.find(x=>x[0]==="set"&&x[1]==="fillStyle")[2],
  arriving.find(x=>x[0]==="set"&&x[1]==="fillStyle")[2],"same world era colour");
 const rankY=e=>-e.r*(e.kind===4?2.5:2.05)-9;
 assert.equal(base.filter(x=>x[0]==="arc"&&x[2]===rankY(old)).length,2);
 assert.equal(arriving.filter(x=>x[0]==="arc"&&x[2]===rankY(newKind)).length,1);
 assert.ok(arriving.some(x=>x[0]==="fill"),"LV1 still has the dark era silhouette");
});

test("a new enemy introduced after the second Guardian evolves once after Bell, not to LV4",()=>{
 const w=evolution(),burst=make(5),bulwark=make(6);
 w.applyEnemyEvolution(burst,3);
 w.applyEnemyEvolution(bulwark,3);
 assert.equal(burst.evolutionLevel,2);
 assert.equal(bulwark.evolutionLevel,2);
 assert.equal(burst.worldThreatTier,3);
 assert.equal(bulwark.worldThreatTier,3);
 // In Endless, a fourth Guardian may progress the family again (cap remains LV4).
 assert.equal(w.enemyFamilyEvolutionTier(5,4)+1,3);
 assert.equal(w.enemyFamilyEvolutionTier(5,5)+1,4);
 assert.equal(w.enemyFamilyEvolutionTier(5,100)+1,4);
});
