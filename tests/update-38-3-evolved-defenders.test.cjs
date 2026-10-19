const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function evolution(){const window={};vm.runInNewContext(read("js/enemy-evolution.js"),{window,Math,Number});return window;}
const make=kind=>({kind,hp:100,speed:100,damage:10,r:kind===2?35:13});

test("first, second and third Guardian deaths evolve every one of the six regular families",()=>{
 const w=evolution(),families=[0,1,2,4,5,6];
 for(const kind of families){
  let names=[];
  for(let defeated=0;defeated<=3;defeated++){
   const e=make(kind);w.applyEnemyEvolution(e,defeated,"normal");
   assert.equal(e.evolutionTier,defeated);
   names.push(e.evolutionName);
   if(defeated)assert.ok(e.hp>100&&e.speed>100&&e.damage>10);
  }
  assert.equal(new Set(names).size,4,"each generation needs a named new form");
 }
 assert.equal(w.enemyEvolutionTier(99),3);
 assert.equal(w.enemyEvolutionTier(0),0);
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
 w.applyEnemyEvolution(late,3,"normal");
 assert.ok(late.hp>base.hp*2);
 assert.ok(late.speed>base.speed);
 assert.ok(late.burstRadius>base.burstRadius);
 assert.match(read("js/game.js"),/playerDistanceSquared < \(e.burstRadius\+45\)\*\(e.burstRadius\+45\)/);
 assert.match(read("js/render.js"),/const radius=e.burstRadius\|\|86/);
});

test("evolved Drifter and Burstling coordinate a genuine flank, without overriding tactics",()=>{
 const w=evolution(),front=make(0),volatile=make(5),guard=make(6);
 front.encounterGroup=volatile.encounterGroup=guard.encounterGroup="squad1";
 front.encounterSlot=0;volatile.encounterSlot=1;
 w.applyEnemyEvolution(front,2);w.applyEnemyEvolution(volatile,2);
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
  const e=make(kind);w.applyEnemyEvolution(e,2);
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
  assert.ok(events.some(x=>x[0]==="stroke"),"real visible mutation");
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
 const changed={kind:1,evolutionTier:1,encounterTactic:"pouncer"};
 w.initializeEnemyCounterRole(changed);
 assert.equal(changed.counterRole,"phaseStalker");
 const mike={kind:2,evolutionTier:1};
 w.initializeEnemyCounterRole(mike);
 assert.equal(mike.counterRole,"anchor");
 const ward={kind:6,evolutionTier:3,encounterTactic:"ward"};
 w.initializeEnemyCounterRole(ward);
 assert.equal(ward.counterRole,"warden");
 const src=read("js/enemies.js");
 assert.match(src,/window\.applyEnemyEvolution\?\.\(e,bossesDefeated,difficulty\)/);
 assert.ok(src.indexOf("window.applyEnemyEvolution?.(e,bossesDefeated,difficulty)")<
  src.indexOf("window.initializeEnemyCounterRole?.(e)"));
});
