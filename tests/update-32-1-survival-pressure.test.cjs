const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function tuning(){const window={};vm.runInNewContext(source("js/combat-difficulty.js"),{window,Math,Number});return window;}
function approx(a,b){assert.ok(Math.abs(a-b)<.000001,String(a)+" != "+String(b));}
test("Normal enemy contact damage starts fair, climbs after 5 min and caps at +50%",()=>{
 const m=tuning().enemyThreatMultiplier;
 approx(m(0,"normal"),1);approx(m(299,"normal"),1);approx(m(300,"normal"),1);
 approx(m(900,"normal"),1.25);approx(m(1500,"normal"),1.5);approx(m(3000,"normal"),1.5);
});
test("Easy stays accessible and Nightmare remains dangerous",()=>{
 const m=tuning().enemyThreatMultiplier;
 for(const at of [0,180,300,600,900,1500,2400]){
  approx(m(at,"easy"),1);
  assert.ok(m(at,"normal")>=1);
  assert.ok(m(at,"nightmare")>=1);
  assert.ok(Number.isFinite(m(at,"nightmare")));
 }
});
test("Vitality recovery starts only after three seconds without a hit",()=>{
 const v=tuning().vitalityRegenPerSecond;
 for(const n of [0,1,2,3,4,5]){
  approx(v(n,0),0);approx(v(n,2.99),0);
  assert.ok(v(n,3)>=0);assert.ok(v(n,60)>=0);
 }
 assert.equal(v(0,500),0);
});
test("single Vitality heals slowly and stacked levels have diminishing returns",()=>{
 const v=tuning().vitalityRegenPerSecond;
 approx(v(1,3),.35);
 assert.ok(v(4,4)<1,"Vitality 4 should no longer recover 3.2 HP/s");
 assert.ok(v(5,4)<1.05);
 assert.ok(v(4,4)>v(3,4) && v(3,4)>v(2,4));
 assert.ok((v(5,3)-v(4,3)) < (v(2,3)-v(1,3)));
});
test("enemy spawns, ranged projectiles and enemy skills receive scaled pressure",()=>{
 const enemies=source("js/enemies.js"),game=source("js/game.js");
 assert.match(enemies,/window\.enemyThreatMultiplier\?\.\(growthTime,difficulty\)/);
 assert.match(enemies,/window\.enemyThreatMultiplier\?\.\(currentGrowthTime,currentDifficulty\)/);
 assert.match(game,/const skillDamage=amount\*pressure/);
 assert.match(game,/recordPlayerHit\(skillDamage\)/);
});
test("boss attacks and minion hits remain untouched by normal-enemy scaling",()=>{
 const game=source("js/game.js"),enemies=source("js/enemies.js");
 assert.match(game,/damage: \(kind === 4 \? 6 : 8\) \+ growthTime \* 0\.004/);
 assert.match(enemies,/damage: \(24 \+ growthTime \* 0\.01\) \* profile\.enemyDamage/);
 assert.doesNotMatch(source("js/combat-difficulty.js"),/spawnEnemy|enemies\.push|createWave/);
});
test("real hits reset recovery and resets clear injury timer",()=>{
 const game=source("js/game.js");
 assert.match(game,/lastPlayerHitAt = -Infinity,/);
 assert.match(game,/lastPlayerHitAt = -Infinity;/);
 assert.match(game,/function recordPlayerHit\(amount\) \{\s*lastPlayerHitAt=time;/);
 assert.match(game,/window\.vitalityRegenPerSecond\?\.\(\s*upgrades\.health,time-lastPlayerHitAt\)/);
 assert.doesNotMatch(game,/player\.hp \+ upgrades\.health \* 0\.8 \* dt/);
 assert.match(game,/healing:runStats\?\.healing\|\|0/);
 assert.match(game,/vitalityRegen:window\.vitalityRegenPerSecond/);
 assert.match(game,/vitalityRecoveryBlockedFor/);
});
test("Vitality UI descriptions show the actual amount and recovery delay",()=>{
 const upgrade=source("js/upgrades.js");
 assert.match(upgrade,/3 seconds without damage/);
 assert.match(upgrade,/window\.vitalityRegenPerSecond\?\.\(value,Infinity\)/);
});
test("Water Bolt keeps damage and pierce, but high casting rate has 0.78s minimum",()=>{
 const s=source("js/elemental-combat.js");
 assert.match(s,/key==="waterBolt"\?Math\.max\(\.78,effective\):effective/);
 assert.match(s,/shot\.pierce = evolutions\.riptideLance \? 4 : 2/);
 assert.match(s,/elementalCooldown\("waterBolt", Math\.max\(0\.95, 1\.5 - upgrades\.waterBolt \* 0\.1\)\)/);
});
test("script versions update and difficulty loads before enemies",()=>{
 const html=source("index.html");
 for(const file of ["combat-difficulty.js","enemies.js","game.js",
 "elemental-combat.js","upgrades.js"]) {
  assert.ok(html.includes("js/"+file+"?v="),"versioned script missing: "+file);
 }
 assert.ok(html.indexOf("combat-difficulty.js")<html.indexOf("enemies.js"));
});
