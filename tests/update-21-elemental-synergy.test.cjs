const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");

function comboHarness(){
  const window={};
  const context=vm.createContext({window,Math,Number,Set});
  vm.runInContext(read("js/elemental-synergy.js"),context);
  return window;
}
function upgradesHarness(){
  const window={},rendered=[];
  const context=vm.createContext({
    window, Math, document:{createElement:()=>({disabled:false})},
    notify:()=>{},unlockAchievement:()=>{},trackDiscovery:()=>{},playSfx:()=>{}
  });
  vm.runInContext([
    'let selectedWeapons=["fireball","flameOrbit","flame"];',
    'let unlockedWeapons=["fireball","flameOrbit"];',
    'let upgrades={fireball:4,flameOrbit:2,flame:0,critChance:1,health:1,damage:0,critDamage:0,rate:0,knockback:0,magnet:0};',
    'let evolutions={},bossesDefeated=0,time=500,level=8;',
    'let active=true,paused=false,choiceScreenOpen=false,gameState="playing";',
    'let pendingLevelUps=1,evolutionFlash=null;',
    'let player={hp:100,maxHp:140};',
    'let panel=(_title,_desc,paint)=>paint({append:b=>rendered.push(b)});',
    'let $=()=>({style:{display:"none"}});',
    'let metaProgress={xpLevel:0};'
  ].join("\n"),Object.assign(context,{rendered}));
  vm.runInContext(read("js/upgrades.js"),context);
  return {context,window,rendered,run:x=>vm.runInContext(x,context)};
}
test("only the nine selectable Fire / Water / Frost weapons are eligible for combos",()=>{
  const h=comboHarness(),enemy={};
  for(const [element,weapon] of [
    ["fire","flame"],["fire","fireball"],["fire","flameOrbit"],
    ["water","waterBolt"],["water","tidalWave"],["water","whirlpool"],
    ["frost","frost"],["frost","iceShards"],["frost","glacialPulse"]
  ]) assert.equal(h.triggerElementalSynergy(enemy,element,weapon,10,1).damage,10);
  assert.equal(h.triggerElementalSynergy(enemy,"fire","arcane",10,2).activated,false);
  assert.equal(h.triggerElementalSynergy(enemy,"water","boomerang",10,2).activated,false);
  assert.equal(h.triggerElementalSynergy(enemy,"dragon","flame",10,2).activated,false);
});
test("a second DISTINCT same-element weapon earns a bounded combo, no free hit",()=>{
  const h=comboHarness(),enemy={};
  assert.equal(h.triggerElementalSynergy(enemy,"fire","flame",100,1).activated,false);
  const proc=h.triggerElementalSynergy(enemy,"fire","fireball",100,1.2);
  assert.equal(proc.activated,true);
  assert.equal(proc.name,"IGNITION");
  assert.equal(proc.damage,112,"bonus capped at 12 normal-enemy damage");
  assert.equal(proc.bonusBurn,.35);
  assert.equal(h.triggerElementalSynergy(enemy,"fire","fireball",100,1.3).activated,false);
  assert.equal(h.triggerElementalSynergy(enemy,"fire","flameOrbit",100,1.5).activated,false);
  assert.equal(h.triggerElementalSynergy(enemy,"fire","flame",10,2.8).activated,true);
});
test("element and mark expiry and dead enemies block stale or fake combos",()=>{
  const h=comboHarness(),enemy={};
  h.triggerElementalSynergy(enemy,"fire","flame",20,1);
  assert.equal(h.triggerElementalSynergy(enemy,"water","waterBolt",20,1.2).activated,false);
  assert.equal(h.triggerElementalSynergy(enemy,"water","tidalWave",20,5).activated,false);
  enemy.dead=true;
  assert.equal(h.triggerElementalSynergy(enemy,"water","whirlpool",20,5.1).activated,false);
  assert.equal(h.triggerElementalSynergy(enemy,"water","whirlpool",NaN,5).activated,false);
});
test("water has distinct undertow and frost has chilled shatter, bosses capped",()=>{
  const h=comboHarness();
  const water={};
  h.triggerElementalSynergy(water,"water","waterBolt",40,2);
  const proc=h.triggerElementalSynergy(water,"water","tidalWave",40,2.3);
  assert.equal(proc.name,"UNDERTOW");
  assert.equal(proc.bonusKnockback,42);
  assert.equal(proc.damage,44);
  const frost={};
  h.markElementalSynergy(frost,"frost","frost",4);
  const chill=h.triggerElementalSynergy(frost,"frost","iceShards",50,4.2);
  assert.equal(chill.name,"SHATTER");
  assert.equal(chill.damage,58);
  assert.equal(chill.bonusChill,.35);
  const boss={};
  h.triggerElementalSynergy(boss,"fire","flame",400,2);
  const capped=h.triggerElementalSynergy(boss,"fire","fireball",400,2.3,true);
  assert.equal(capped.bonus,4);
  assert.equal(capped.damage,404);
});
test("elemental combat actually consumes earned combos without free damage",()=>{
  const window=comboHarness(),hits=[];
  const player={x:0,y:0,r:12,facingX:1,facingY:0};
  const context=vm.createContext({window,Math,player,W:1280,H:720,time:3,
    upgrades:{fireball:1,flameOrbit:1,glacialPulse:1},
    evolutions:{},boss:null,weaponCooldownMultiplier:()=>1,
    globalDamageMultiplier:()=>1,nearbyEnemies:()=>[],
    nearestEnemy:()=>null,enemyHitRadius:()=>12,
    damage:(enemy,value)=>hits.push(value),puff:()=>{},glow:x=>x});
  vm.runInContext(read("js/elemental-combat.js"),context);
  context.target={x:25,y:0};
  vm.runInContext('damageEnemyElemental(target,40,"fire",0,0,"flameOrbit");',context);
  vm.runInContext('time=3.2;damageEnemyElemental(target,40,"fire",0,0,"fireball");',context);
  assert.equal(hits[0],40);
  assert.ok(Math.abs(hits[1]-45.6)<.0001);
  assert.ok(context.target.burnUntil>5);
});
test("upgrade cards preview real evolution route progress and genuine combo hints",()=>{
  const h=upgradesHarness();
  const main=h.run('makeUpgradeChoice(opts.find(([key])=>key==="fireball"))');
  assert.match(main.innerHTML,/EVOLUTION PATH/);
  assert.match(main.innerHTML,/Meteor Rain/);
  assert.match(main.innerHTML,/Weapon 5\/5/);
  assert.match(main.innerHTML,/Critical Eye 1\/3/);
  assert.match(main.innerHTML,/Boss needed/);
  assert.match(main.innerHTML,/IGNITION COMBO/);
  const support=h.run('makeUpgradeChoice(opts.find(([key])=>key==="critChance"))');
  assert.match(support.innerHTML,/EVOLUTION PATH/);
  assert.match(support.innerHTML,/Critical Eye 2\/3/);
  assert.match(support.innerHTML,/Meteor Rain/);
});
test("focus chooses real selected recipes and HUD reports boss gate",()=>{
  const h=upgradesHarness();
  assert.equal(h.run("evolutionFocusKey()"),"fireball");
  h.run("upgrades.fireball=5");
  assert.equal(h.run("evolutionFocusKey()"),"critChance");
  assert.match(h.window.evolutionHudStatus(),/Fireball 5\/5/);
  assert.match(h.window.evolutionHudStatus(),/BOSS NEEDED/);
  h.run("bossesDefeated=1;upgrades.critChance=3;time=600");
  const next=h.run('makeUpgradeChoice(opts.find(([key])=>key==="health"))');
  assert.match(next.innerHTML,/Solar Crown/);
  assert.equal(h.run("eligibleEvolutions()[0].id"),"meteorRain");
  h.run("evolutions.meteorRain=true;evolutions.solarCrown=true");
  assert.equal(h.run("evolutionFocusKey()"),null);
  assert.equal(h.run("eligibleEvolutions().length"),0);
  assert.equal(h.window.evolutionHudStatus(),"EVOLUTIONS 2/2 · COMPLETED");
});
test("real game wiring covers flame, frost burst, elemental shots and whirlpool",()=>{
  const index=read("index.html"),combos=read("js/elemental-combat.js"),
    weapons=read("js/weapons.js"),game=read("js/game.js");
  assert.ok(index.indexOf("js/elemental-synergy.js")<index.indexOf("js/weapons.js"));
  assert.ok(index.indexOf("js/elemental-synergy.js")<index.indexOf("js/elemental-combat.js"));
  assert.match(combos,/window\.triggerElementalSynergy\?\.\(/);
  assert.match(combos,/"whirlpool",raw,time/);
  assert.match(weapons,/"fire","flame",damageValue,time/);
  assert.match(weapons,/window\.markElementalSynergy\?\.\(enemy,"frost","frost",time\)/);
  assert.match(game,/window\.triggerElementalSynergy\?\.\(e,"frost","frost"/);
  assert.doesNotMatch(read("js/elemental-synergy.js"),/Math\.random/);
});
