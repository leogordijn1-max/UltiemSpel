const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function balance(){
  const window={};
  vm.runInNewContext(src("js/combat-difficulty.js"),{window,Math,Number});
  return window;
}
function director(){
  const window=balance(),spawned=[],player={x:0,y:0,viewW:1280,viewH:720};
  window.enemyOffscreenSpawn=(angle,distance,along=0)=>({x:900+along,y:900+distance});
  const box=vm.createContext({window,Math});
  vm.runInContext(src("js/encounter-pacing.js"),box);
  window.resetEncounterPacing();
  const spawn=kind=>{
    const e={kind,x:0,y:0,hp:100,damage:10,speed:60};
    spawned.push(e);return e;
  };
  return {window,player,spawned,spawn};
}
function teamFor(difficulty){
  const d=director();
  const result=d.window.spawnEncounterPatrol(900,900,d.player,d.spawned,d.spawn,difficulty);
  assert.equal(result,4,"Normal/Nightmare use four strong specialists; Easy keeps larger learner squad");
  return d.spawned;
}
test("difficulty presets have monotone squad pressure but fair readable tells",()=>{
  const b=balance(),easy=b.getCombatDifficultyTuning("easy"),
    normal=b.getCombatDifficultyTuning("normal"),
    hard=b.getCombatDifficultyTuning("nightmare");
  assert.ok(easy.squadHp<normal.squadHp&&normal.squadHp<hard.squadHp);
  assert.ok(easy.squadDamage<normal.squadDamage&&normal.squadDamage<hard.squadDamage);
  assert.ok(easy.squadSpeed<normal.squadSpeed&&normal.squadSpeed<hard.squadSpeed);
  assert.ok(easy.rangedTelegraph>normal.rangedTelegraph&&normal.rangedTelegraph>hard.rangedTelegraph);
  assert.ok(hard.rangedTelegraph>=.6,"Nightmare ranged shots must remain readable");
  assert.ok(hard.burstTelegraph>=.8,"Nightmare burst explosions must not become instant hits");
  assert.ok(easy.rangedCooldownMin>normal.rangedCooldownMin&&normal.rangedCooldownMin>hard.rangedCooldownMin);
  assert.ok(hard.shieldExposed>=1.8,"Nightmare must leave a punish window");
  assert.equal(b.getCombatDifficultyTuning("unknown"),normal);
});
test("difficulty applied to identical squads is meaningful, bounded and idempotent",()=>{
  const b=balance();
  const results={};
  for(const mode of ["easy","normal","nightmare"]){
    const e={kind:2,hp:100,damage:15,speed:100};
    assert.equal(b.applyCombatDifficultyToSquad(e,mode),true);
    results[mode]=[e.hp,e.damage,e.speed];
    const snapshot=JSON.stringify(e);
    assert.equal(b.applyCombatDifficultyToSquad(e,mode),false);
    assert.equal(JSON.stringify(e),snapshot);
  }
  for(let i=0;i<3;i++)assert.ok(results.easy[i]<results.normal[i]&&results.normal[i]<results.nightmare[i]);
  assert.ok(results.nightmare[0]<=104,"Nightmare is not a massive bullet sponge");
});
test("bosses and summoned minions are not silently altered by squad tuning",()=>{
  const b=balance();
  for(const e of [{kind:3,hp:500},{kind:1,summoned:true,hp:50},{kind:2,dead:true,hp:0}]){
    assert.equal(b.applyCombatDifficultyToSquad(e,"nightmare"),false);
    assert.ok(!e.encounterDifficultyApplied);
  }
});
test("actual director creates the intended stronger specialists on Normal and Nightmare",()=>{
  const a=teamFor("easy"),n=teamFor("normal"),h=teamFor("nightmare");
  assert.ok(a.length>=n.length,"Easy may use a larger, weaker training squad");
  assert.equal(n.length,h.length);
  assert.ok(a[0].hp<n[0].hp&&n[0].hp<h[0].hp);
  assert.ok(a[0].damage<n[0].damage&&n[0].damage<h[0].damage);
  assert.ok(a[0].speed<n[0].speed&&n[0].speed<h[0].speed);
  assert.equal(h.filter(e=>e.encounterDifficultyApplied).length,h.length);
});
test("Nightmare population and ambient pace never exceed Normal density",()=>{
  const d=director();
  for(const at of [0,180,450,900,1500]){
    assert.equal(d.window.encounterPopulationCap(at,"nightmare"),
      d.window.encounterPopulationCap(at,"normal"));
    assert.ok(d.window.encounterPopulationCap(at,"easy")<
      d.window.encounterPopulationCap(at,"normal"));
    assert.equal(d.window.encounterAmbientLimit(at,"nightmare",[]),
      d.window.encounterAmbientLimit(at,"normal",[]));
    assert.equal(d.window.encounterAmbientInterval(at,"nightmare"),
      d.window.encounterAmbientInterval(at,"normal"));
    assert.ok(d.window.encounterAmbientInterval(at,"easy")>
      d.window.encounterAmbientInterval(at,"normal"));
    assert.ok(d.window.encounterPopulationCap(at,"nightmare")<=30);
  }
});
test("main game applies fair recovery, warning and shield windows",()=>{
  const source=src("js/game.js");
  assert.match(source,/getCombatDifficultyTuning\?\.\(difficulty\)\?\.rangedTelegraph/);
  assert.match(source,/rangedTuning\?\.rangedCooldownMin/);
  assert.match(source,/rangedTuning\?\.rangedCooldownMax/);
  assert.match(source,/getCombatDifficultyTuning\?\.\(difficulty\)\?\.burstTelegraph/);
  assert.match(source,/shieldTuning\?\.shieldRaised/);
  assert.match(source,/shieldTuning\?\.shieldExposed/);
});
test("elemental boss guardrails respect weapon identity, not global player nerfs",()=>{
  const b=balance(),boss={kind:3},regular={kind:0};
  assert.equal(b.frostMoveMultiplier(regular,boss),.48);
  assert.equal(b.frostMoveMultiplier(boss,boss),.78);
  assert.equal(b.flameOrbitDamageMultiplier(regular,boss),1);
  assert.equal(b.flameOrbitDamageMultiplier(boss,boss),.82);
  assert.ok(b.flameOrbitDamageMultiplier(boss,boss)>.75,"Flame Orbit still rewards close-range boss risks");
  const combat=src("js/elemental-combat.js"),game=src("js/game.js");
  assert.match(combat,/window\.flameOrbitDamageMultiplier\?\.\(enemy,boss\)/);
  assert.match(game,/window\.frostMoveMultiplier\?\.\(e,boss\)/);
});
test("Nightmare has less raw HP inflation than the old 1.28 baseline",()=>{
  const sandbox=vm.createContext({});
  vm.runInContext(src("js/enemies.js"),sandbox);
  const stats=JSON.parse(vm.runInContext("JSON.stringify(difficultyProfiles)",sandbox));
  assert.equal(stats.normal.enemyHealth,1);
  assert.equal(stats.normal.enemyDamage,1);
  assert.equal(stats.normal.bossHealth,1);
  assert.ok(stats.nightmare.enemyHealth>=1.1&&stats.nightmare.enemyHealth<1.28);
  assert.ok(stats.nightmare.bossHealth>=1.1&&stats.nightmare.bossHealth<=1.18);
  assert.ok(stats.easy.enemyHealth<stats.normal.enemyHealth);
  assert.equal(stats.nightmare.spawnRate,1);
});
test("wave and world-defense squads receive the exact same difficulty treatment",()=>{
  const wave=src("js/enemies.js"),defense=src("js/world-defense.js");
  assert.match(wave,/window\.applyCombatDifficultyToSquad\?\.\(e, difficulty\)/);
  assert.match(defense,/window\.applyCombatDifficultyToSquad\?\.\(e,/);
  const index=src("index.html");
  assert.ok(index.indexOf("js/combat-difficulty.js")<index.indexOf("js/enemies.js"));
  assert.ok(index.indexOf("js/combat-difficulty.js")<index.indexOf("js/game.js"));
  assert.ok(index.indexOf("js/combat-difficulty.js")<index.indexOf("js/elemental-combat.js"));
});
test("difficulty update changes only two boss interactions among current element weapons",()=>{
  const combo=src("js/combat-difficulty.js");
  assert.doesNotMatch(combo,/Math\.random|spawnEnemy|enemies\.push|addXP|upgrades\[/);
  assert.match(src("js/elements.js"),/weapons: Object\.freeze\(\["waterBolt", "tidalWave", "whirlpool"\]\)/);
  assert.match(src("js/elemental-combat.js"),/upgrades\.flameOrbit/);
  assert.match(src("js/weapons.js"),/upgrades\.frost/);
});
