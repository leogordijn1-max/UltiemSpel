const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const vmWin=p=>{const window={};vm.runInNewContext(src(p),{window,Math,Number});return window};
const unit=kind=>({kind,hp:100,speed:90,damage:12,r:15});
test("6 families have deterministic nonrandom powers on each of four ranks",()=>{
  const w=vmWin("js/enemy-evolution.js");
  for(const [kind,debut] of [[0,0],[1,0],[2,1],[4,1],[5,2],[6,2]]){
    const lists=[];
    for(let rank=1;rank<=4;rank++){
      const a=unit(kind),b=unit(kind);
      w.applyEnemyEvolution(a,debut+rank-1,"normal");
      w.applyEnemyEvolution(b,debut+rank-1,"normal");
      assert.equal(a.evolutionLevel,rank);
      assert.equal(a.evolutionAbilities.length,rank===1?1:rank);
      assert.deepEqual(Array.from(a.evolutionAbilities),Array.from(b.evolutionAbilities));
      assert.deepEqual([a.hp,a.speed,a.damage],[b.hp,b.speed,b.damage]);
      assert.equal(new Set(a.evolutionAbilities).size,rank);
      lists.push(a.evolutionAbilities.join(","));
    }
    assert.equal(new Set(lists).size,4);
  }
});
test("every Mike of same rank gains same Anchor; every Warden level is guaranteed regardless of squad role",()=>{
 const evo=vmWin("js/enemy-evolution.js"),ctr=vmWin("js/enemy-counter-roles.js");
 for(const kind of [1,2,6]){
  for(let level=1;level<=4;level++){
   const a=unit(kind),b=unit(kind);
   evo.applyEnemyEvolution(a,evo.enemyFamilyDebutBossCount(kind)+level-1);
   evo.applyEnemyEvolution(b,evo.enemyFamilyDebutBossCount(kind)+level-1);
   a.encounterTactic="pouncer";b.encounterTactic="ward";
   ctr.initializeEnemyCounterRole(a);ctr.initializeEnemyCounterRole(b);
   assert.equal(a.counterRole,b.counterRole);
   assert.equal(a.counterRole,level>=3?({1:"phaseStalker",2:"anchor",6:"warden"}[kind]):null);
  }
 }
 const game=src("js/game.js");
 assert.match(game,/const formationRoles=\["vanguard","ward","skirmisher"\]/);
 assert.doesNotMatch(game,/window\.encounterTacticVolley\?\.\(e,enemyShots,player\)/);
});
test("level 2+ Ranged Shades create the exact same 1/2/3/3 projectiles independently of squad",()=>{
 const s=src("js/enemies.js"),fn=s.match(/^function enemyFireOrb\(e\) \{[\s\S]*?^\}/m);
 assert.ok(fn,"production projectile function");
 const enemies=[],ctx=vm.createContext({enemyShots:enemies,player:{x:500,y:0},difficulty:"normal",
  difficultyProfiles:{normal:{enemyDamage:1}},growthTime:0,window:{},Math});
 vm.runInContext(fn[0],ctx);
 for(const [level,count] of [[1,1],[2,2],[3,3],[4,3]]){
  enemies.length=0;
  ctx.enemyFireOrb({x:0,y:0,aimAngle:0,evolutionLevel:level});
  assert.equal(enemies.length,count);
  assert.ok(enemies.every(x=>x.damage>0&&x.life>0&&x.turnRate>0));
 }
});
test("Burstling pursues during warning and later ranks fire tracking explosive fragments",()=>{
 const e=src("js/enemy-evolution.js"),g=src("js/game.js");
 assert.match(e,/chaseFuse","chaseBurst/);
 assert.match(g,/moveSpeed\*\(1\.55\+Math\.min\(3,e\.evolutionLevel\|\|1\)\*\.24\)/);
 assert.match(g,/const angles=rank===2\?\[0\]:rank===3\?\[-\.27,0,\.27\]/);
 assert.match(g,/type:"burstShard"/);
 assert.match(g,/recordPlayerHit\(e\.damage,"enemy_explosion"\)/);
});
test("Last Meme's orbit has no free center and Shade's phantom strikes overlap except the marked exit",()=>{
 const w={};vm.runInNewContext(src("js/meme-encounter.js"),{window:w,Math,Number});
 const e={kind:3,isFinalBoss:true,variant:3,finalPhase:2,x:0,y:0,
  shotWarning:0,chargeWarning:0,chargeActive:0,phaseIntro:0,specialRecoveryUntil:0};
 w.initializeMemeEncounter(e,0);
 assert.equal(w.forceMemeEncounter(e,"orbit",0),true);
 const shots=[],hazards=[],p={x:150,y:90},h={
  visible:true,projectile:(...args)=>shots.push(args),
  hazard:(...args)=>hazards.push(args)};
 w.updateMemeEncounter(e,0,.016,p,h);
 w.updateMemeEncounter(e,2,.016,p,h);
 assert.equal(hazards.length,11);
 assert.ok(hazards.some(a=>a[0]===150&&a[1]===90&&a[2]===83));
 assert.equal(shots.length,11);
 assert.ok(shots.every(s=>s[4]==="memeOrbit"&&s[2]>=375));
 const shade=src("js/shade-encounter.js");
 assert.match(shade,/h\.hazard\?\.\(x,y,106,.44/);
 assert.match(shade,/circle\(px,py,106\)/);
});
test("all evolution recipes may be earned immediately after the first Guardian if weapon+support requirements are met",()=>{
 const s=src("js/upgrades.js");
 assert.match(s,/function nextEvolutionTime\(\) \{[\s\S]*?return 0;/);
 assert.doesNotMatch(s,/length>=2\)return (null|""|false)/);
 assert.doesNotMatch(s,/< nextEvolutionTime\(\)/);
 assert.match(s,/isWeaponUnlocked\(recipe\.weapon\) && !evolutions\[recipe\.id\]/);
 assert.match(s,/currentUpgradeLevel\(recipe\.weapon\) >= recipe\.level/);
 assert.match(s,/currentUpgradeLevel\(recipe\.support\) >= recipe\.supportLevel/);
 assert.match(s,/EVOLUTIONS "\+count\+"\/"\+max/);
});
test("upgrade cards remain equal-sized; in-fight HUD contains only scannable state and hides boss text",()=>{
 const css=src("styles.css"),up=src("js/upgrades.js"),game=src("js/game.js");
 assert.match(css,/#choices > button\.choice\{[\s\S]*?height:202px;[\s\S]*?min-height:202px;[\s\S]*?max-height:202px;/);
 assert.match(up,/class="choice-primary"/);
 assert.doesNotMatch(up,/Build toward two earned evolutions/);
 assert.match(game,/if\(combatCue\)combatCue\.hidden=true/);
 assert.match(game,/WORLD \$\{Math\.floor\(window\.getWorldConquest/);
 assert.match(css,/#loadout\{display:none !important\}/);
});
test("readable canonical documentation replaces historical update sprawl",()=>{
 for(const file of ["README.md","PROJECT-KOMPAS.md","ROADMAP-31-50.md","NORMAL-RUN-QA.md"]){
  const text=src(file);assert.ok(text.length<13000,file+" should stay concise");
 }
});
