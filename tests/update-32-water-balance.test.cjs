const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function ccHarness(){
  const window={};vm.runInNewContext(source("js/crowd-control.js"),{window,Math,Number});
  return window;
}
function target(kind,elite=false){
  return {kind,elite,dead:false,knockbackX:0,knockbackY:0,hp:200};
}
test("normal water shots remain strong and physically move small enemies",()=>{
  const w=ccHarness(),enemy=target(0);
  assert.equal(w.applyEnemyCrowdControl(enemy,170,0,"waterBolt",30),true);
  assert.ok(enemy.knockbackX>100);
  assert.equal(enemy.knockbackY,0);
  assert.equal(enemy.hp,200,"physical crowd-control never modifies damage");
});
test("heavy Zombie Mike stays much steadier against Water Bolt and Whirlpool",()=>{
  const w=ccHarness();
  for(const kind of [0,2,3,6]){
    const e=target(kind),strength=w.enemyCrowdControlResistance(e,"whirlpool",40);
    if(kind===0)assert.equal(strength,1);
    if(kind===2)assert.equal(strength,.12);
    if(kind===3)assert.equal(strength,.10);
    if(kind===6)assert.equal(strength,.55);
    w.applyEnemyCrowdControl(e,680,0,"whirlpool",40);
    assert.ok(Math.abs(e.knockbackX-680*strength)<1e-9);
  }
  const standard=target(0),heavy=target(2);
  w.applyEnemyCrowdControl(standard,170,0,"waterBolt",80);
  w.applyEnemyCrowdControl(heavy,170,0,"waterBolt",80);
  assert.ok(heavy.knockbackX<standard.knockbackX*.15);
  assert.equal(heavy.hp,200);
});
test("rapid Water Bolt chain has decreasing ADDITIONAL shove but full damage",()=>{
  const w=ccHarness(),a=target(0);
  w.applyEnemyCrowdControl(a,170,0,"waterBolt",15);
  const first=a.knockbackX;
  w.applyEnemyCrowdControl(a,170,0,"waterBolt",15.55);
  const next=a.knockbackX-first;
  assert.ok(next<first*.5,"fast spam should no longer permanently pin enemies");
  w.applyEnemyCrowdControl(a,170,0,"waterBolt",16.6);
  const third=a.knockbackX-first-next;
  assert.ok(Math.abs(third-first)<1e-8,"recoil recovers after a safe gap");
  assert.equal(a.hp,200);
});
test("elite guards keep defense even when unshielded, but aren't invulnerable",()=>{
  const w=ccHarness(),elite=target(0,true),bulwark=target(6);
  for(const kind of ["generic","waterHit","waterBolt","whirlpool","tidalWave"]){
    assert.ok(w.enemyCrowdControlResistance(elite,kind,90)>0);
    assert.ok(w.enemyCrowdControlResistance(bulwark,kind,90)>0);
    assert.ok(w.enemyCrowdControlResistance(elite,kind,90)<1);
  }
  w.applyEnemyCrowdControl(elite,100,100,"waterBolt",90);
  assert.ok(elite.knockbackX>0);
});
test("invalid, dead or nonfinite crowd-control requests don't add bad coordinates",()=>{
  const w=ccHarness(),e=target(0);
  assert.equal(w.applyEnemyCrowdControl(e,NaN,0,"generic",0),false);
  assert.equal(w.applyEnemyCrowdControl(e,0,Infinity,"generic",0),false);
  e.dead=true;
  assert.equal(w.applyEnemyCrowdControl(e,100,100,"whirlpool",0),false);
  assert.equal(e.knockbackX,0);
  assert.equal(e.knockbackY,0);
  assert.equal(w.enemyCrowdControlResistance(e,"waterBolt",10),0);
});
test("all real water movement paths obey one shared resistance function",()=>{
  const elemental=source("js/elemental-combat.js"),enemies=source("js/enemies.js");
  assert.match(elemental,/weaponKey==="waterBolt"\?"waterBolt":"water"/);
  assert.match(elemental,/"tidalWave",time\)/);
  assert.match(elemental,/"whirlpool",time\)/);
  assert.match(enemies,/window\.applyEnemyCrowdControl\?\.\(e,/);
  const traces=elemental.match(/window\.applyEnemyCrowdControl\?\.\(/g)||[];
  assert.equal(traces.length,4,"water hit, tidal wave, whirlpool and synergy are wired");
  assert.doesNotMatch(elemental,/enemy\.knockbackX\s*=/);
  assert.doesNotMatch(elemental,/enemy\.knockbackY\s*=/);
});
function upgradeHarness(seed=.2){
  const events=[];
  const context=vm.createContext({
    window:{runQaEvent:(type,data)=>events.push({type,data})},
    Math:Object.assign(Object.create(Math),{random:()=>seed}),
    Number,Object,Set,Map,Array,
    selectedWeapons:["frost","iceShards","glacialPulse"],
    unlockedWeapons:["frost"],
    upgrades:{frost:2,critDamage:0},evolutions:{},
    level:1,gameState:"playing",choiceScreenOpen:false,
    pendingLevelUps:1,active:true,paused:false,bossesDefeated:0,
    time:100,playSfx:()=>{},panel:()=>{},player:{hp:100,maxHp:100}
  });
  vm.runInContext(source("js/upgrades.js"),context);
  function offer(level,bosses=0){
    context.level=level;context.bossesDefeated=bosses;
    context.gameState="playing";context.choiceScreenOpen=false;
    context.pendingLevelUps=1;events.length=0;
    vm.runInContext("choices()",context);
    return events.find(e=>e.type==="upgrade_offer")?.data.options||[];
  }
  return {offer,context,events};
}
test("locked loadout offers are GUARANTEED early, not forcibly occupying nearly all later levels",()=>{
  const h=upgradeHarness(.2);
  for(const l of [2,3]) {
    const cards=h.offer(l,0);
    assert.equal(cards.length,3);
    assert.ok(cards.some(k=>k==="iceShards"||k==="glacialPulse"));
  }
  const regular=h.offer(4,0);
  assert.equal(regular.length,3);
  assert.ok(regular.includes("frost"),"a meaningful weapon route is still offered");
  const interval=h.offer(6,0);
  assert.ok(interval.includes("iceShards")||interval.includes("glacialPulse"),
    "locked weapon periodically guaranteed again");
});
test("new choice pool keeps distinct cards, current build route and no free evolution",()=>{
  const h=upgradeHarness(.4);
  for(let l=3;l<=20;l++){
    const cards=h.offer(l,1);
    assert.equal(new Set(cards).size,cards.length,"duplicated offers at "+l);
    assert.ok(cards.length<=3);
    assert.ok(cards.includes("frost"),"earned build focus missing at "+l);
    assert.equal(h.context.upgrades.iceShards||0,0);
    assert.equal(h.context.upgrades.glacialPulse||0,0);
    assert.equal(h.context.evolutions.glacier||false,false);
  }
});
test("Water and Frost evolution levels/timestamps stay unchanged",()=>{
  const upgrades=source("js/upgrades.js");
  assert.match(upgrades,/return \[600, 1020\]\[evolvedCount\] \?\? Infinity/);
  assert.match(upgrades,/currentUpgradeLevel\(recipe\.weapon\) >= recipe\.level && currentUpgradeLevel\(recipe\.support\) >= recipe\.supportLevel/);
  assert.match(upgrades,/level: 5, supportLevel: 3/);
  assert.match(source("js/elemental-combat.js"),/elementalCooldown\("waterBolt", Math\.max\(0\.95, 1\.5 - upgrades\.waterBolt \* 0\.1\)\)/);
});
test("index loads resistance before enemies and changed scripts use updated URLs",()=>{
  const html=source("index.html");
  assert.ok(html.indexOf('src="js/crowd-control.js?v=32"')<
    html.indexOf('src="js/enemies.js?v=balanced-crowd-32"'));
  assert.match(html,/js\/elemental-combat\.js\?v=balanced-crowd-32/);
  assert.match(html,/js\/upgrades\.js\?v=balanced-offers-32/);
});
