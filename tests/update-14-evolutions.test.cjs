const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function upgradesHarness(){
  const rendered=[],notifications=[];
  const window={};
  const context=vm.createContext({window,Math,
    document:{createElement:()=>({})},notify:(...x)=>notifications.push(x),
    unlockAchievement:()=>{},trackDiscovery:()=>{},playSfx:()=>{}});
  vm.runInContext(`let upgrades={arcane:2,orbit:0,bomb:0,pierce:0,bladeBlock:0,damage:0};
    let selectedWeapons=["arcane","orbit","bomb"],unlockedWeapons=["arcane"];
    let evolutions={},bossesDefeated=1,time=450,level=7;
    let active=true,paused=false,choiceScreenOpen=false,gameState="playing";
    let pendingLevelUps=1,evolutionFlash=null;
    let player={hp:100,maxHp:140};
    let panel=(_title,_description,paint)=>paint({append:b=>rendered.push(b)});
    let $=()=>({style:{display:"none"}});
    let metaProgress={xpLevel:0};`,context);
  vm.runInContext(source("js/upgrades.js"),context,{filename:"js/upgrades.js"});
  return {window,context,rendered,notifications,read:s=>vm.runInContext(s,context)};
}
test("focused upgrade slot preserves a reserve weapon unlock among three choices",()=>{
  const h=upgradesHarness();
  assert.equal(h.read("evolutionFocusKey()"),"arcane");
  h.read("choices()");
  assert.equal(h.rendered.length,3);
  const names=h.rendered.map(x=>x.innerHTML);
  assert.ok(names.some(s=>s.includes("Arcane Bolt")));
  assert.ok(names.some(s=>s.includes("WEAPON UNLOCK")));
  assert.equal(new Set(names).size,3);
});
test("after leveling weapon, focus switches to its real recipe support",()=>{
  const h=upgradesHarness();
  h.read("upgrades.arcane=5");
  assert.equal(h.read("evolutionFocusKey()"),"pierce");
  assert.match(h.window.evolutionHudStatus(),/Arcane Bolt 5\/5/);
  assert.match(h.window.evolutionHudStatus(),/Phantom Shots 0\/3/);
  h.read("upgrades.pierce=3");
  assert.equal(h.read("evolutionFocusKey()"),null);
});
test("focus switches to another weapon after first evolution and stops at two",()=>{
  const h=upgradesHarness();
  h.read("evolutions.splitDimension=true;unlockedWeapons.push('orbit','bomb');upgrades.orbit=3");
  assert.equal(h.read("evolutionFocusKey()"),"orbit");
  h.read("upgrades.orbit=5;upgrades.bladeBlock=1");
  assert.equal(h.read("evolutionFocusKey()"),"bladeBlock");
  h.read("evolutions.aegisRing=true");
  assert.equal(h.read("evolutionFocusKey()"),null);
  assert.equal(h.read("nextEvolutionTime()"),Infinity);
  assert.equal(h.read("eligibleEvolutions().length"),0);
  assert.equal(h.window.evolutionHudStatus(),"EVOLUTIONS 2/2 · COMPLETED");
});
test("a fully earned first evolution appears at 10:00 without another XP pickup",()=>{
  const h=upgradesHarness();
  h.read("upgrades.arcane=5;upgrades.pierce=3;time=599;pendingLevelUps=0");
  assert.equal(h.window.offerEarnedEvolution(),false);
  h.read("time=600");
  assert.equal(h.window.offerEarnedEvolution(),true);
  assert.equal(h.read("paused"),true);
  assert.equal(h.read("gameState"),"level-up");
  assert.ok(h.rendered.some(b=>b.innerHTML.includes("Split Dimension")));
  assert.equal(h.read("upgrades.arcane"),5);
  assert.equal(h.read("upgrades.pierce"),3);
});
test("a ready second evolution appears at 17:00 and not before",()=>{
  const h=upgradesHarness();
  h.read("evolutions.splitDimension=true;unlockedWeapons.push('orbit');upgrades.orbit=5;upgrades.bladeBlock=3;pendingLevelUps=0;time=1019");
  assert.equal(h.window.offerEarnedEvolution(),false);
  h.read("time=1020");
  assert.equal(h.window.offerEarnedEvolution(),true);
  assert.ok(h.rendered.some(b=>b.innerHTML.includes("Aegis Ring")));
  assert.equal(h.read("upgrades.orbit"),5);
});
test("mid-boss, menus or outstanding level choices block surprise evolution prompts",()=>{
  const h=upgradesHarness();
  h.read("upgrades.arcane=5;upgrades.pierce=3;time=750");
  assert.equal(h.window.offerEarnedEvolution(),false);
  h.read("pendingLevelUps=0;paused=true");
  assert.equal(h.window.offerEarnedEvolution(),false);
  h.read("paused=false;var boss={kind:3}");
  assert.equal(h.window.offerEarnedEvolution(),false);
  h.read("boss=null;gameState='paused'");
  assert.equal(h.window.offerEarnedEvolution(),false);
  h.read("gameState='playing';active=false");
  assert.equal(h.window.offerEarnedEvolution(),false);
});
test("milestone HUD displays missing requirements without hiding other upgrades",()=>{
  const h=upgradesHarness();
  assert.match(h.window.evolutionHudStatus(),/EVOLUTIONS 0\/2 · 2:30/);
  assert.match(h.window.evolutionHudStatus(),/Arcane Bolt 2\/5/);
  h.read("time=600");
  assert.match(h.window.evolutionHudStatus(),/READY/);
});
function estimateScenario({minutes=25,patrolEvery=55,waveEvery=100,defenseEvery=170,collection=.7}={}){
  const win={};
  const ctx=vm.createContext({window:win,Math});
  for(const script of ["js/enemy-progression.js","js/tactical-encounters.js","js/encounter-pacing.js"])
    vm.runInContext(source(script),ctx,{filename:script});
  win.resetEnemyProgression();
  const base={0:1,1:.8,2:5,4:2,5:1.6,6:3};
  const team=(seconds,seq)=>win.chooseTacticalEncounter(seconds,seq)
    .members.reduce((sum,m)=>sum+base[m.kind],0);
  const end=minutes*60;
  let xp=0,patrols=0,waves=0,defense=0;
  for(let s=25;s<end;s+=patrolEvery)xp+=team(s,patrols++)*win.encounterXpMultiplier(s,"patrol");
  for(let s=75;s<end;s+=waveEvery){
    xp+=waves%4===3?10:team(s,waves)*win.encounterXpMultiplier(s,"wave");
    waves++;
  }
  for(let s=300;s<end;s+=defenseEvery){xp+=8.5*win.encounterXpMultiplier(s,"defense");defense++;}
  for(let s=0;s<end;s+=9.5)xp+=s<180?1:s<360?.8:1.8;
  for(let s=185,i=0;s<end && i<3;s+=270,i++)xp+=14+(i+1)*18;
  let level=1,needed=10,bank=0,upgrades=0;
  bank=xp*collection;
  while(bank>=needed && level<80){bank-=needed;level++;upgrades++;
    needed=Math.floor(needed*(level<6?1.15:level<15?1.105:1.085)+4);
  }
  return {level,upgrades,earned:Math.round(xp*collection),patrols,waves,defense};
}
test("25-minute steady Normal model can finance two focused evolutions with low density",()=>{
  const s=estimateScenario();
  // First weapon: four improvements + support three; second unlocked
  // weapon: unlock + four improvements + support three => 15 choices.
  assert.ok(s.upgrades>=15,JSON.stringify(s));
  assert.ok(s.patrols<=30&&s.waves<=16&&s.defense<=9);
  assert.ok(s.earned>800);
});
test("lower kill rate and poor soul collection remain legitimately challenging",()=>{
  const steady=estimateScenario();
  const slow=estimateScenario({patrolEvery:80,waveEvery:125,defenseEvery:230,collection:.6});
  assert.ok(slow.upgrades<steady.upgrades);
  assert.ok(slow.earned<steady.earned);
  // Model outcomes are estimates, not a claim that every player is guaranteed two.
});
test("late XP bonus rewards only strong squads, not cheap swarms",()=>{
  const w={};vm.runInNewContext(source("js/encounter-pacing.js"),{window:w,Math});
  assert.equal(w.encounterXpMultiplier(500,"patrol"),2.8+500/600*2);
  assert.equal(w.encounterXpMultiplier(900,"swarm"),.44);
  assert.ok(w.encounterXpMultiplier(1500,"wave")>w.encounterXpMultiplier(600,"wave"));
  assert.ok(w.encounterPopulationCap(1200)<=30);
});
test("big XP orbs have expanded but still proximity-based pickup range",()=>{
  const game=source("js/game.js");
  assert.match(game,/nearbyGems\(player\.x, player\.y, pickupRange \+ 95\)/);
  assert.match(game,/g\.kind!=="health" && g\.value>=6 \? 95 : 0/);
  assert.match(game,/distanceSquared < range \* range/);
  assert.match(game,/window\.offerEarnedEvolution\?\.\(\)/);
  assert.match(source("index.html"),/id="evolutionProgress"/);
  assert.match(source("js/upgrades.js"),/\[600, 1020\]\[evolvedCount\]/);
});
