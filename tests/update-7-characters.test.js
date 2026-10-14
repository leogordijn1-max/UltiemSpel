const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
function load(context, file) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(text, context, { filename: file });
}
function state(context, expression) {
  return JSON.parse(vm.runInContext("JSON.stringify(" + expression + ")", context));
}

test("all four characters are unique and existing weapons remain available", () => {
  const context = vm.createContext({});
  load(context, "js/characters.js");
  assert.equal(vm.runInContext("characterCatalog.length", context), 4);
  assert.equal(vm.runInContext("new Set(characterCatalog.map(c => c.id)).size", context), 4);
  assert.equal(vm.runInContext("masteryCatalog.length", context), 8);
  assert.equal(vm.runInContext("getCharacter('missing').id", context), "survivor");
});

test("character unlocks come independently from achievements, boss trophies and the shop", () => {
  const context = vm.createContext({});
  load(context, "js/characters.js");
  vm.runInContext("let p = {points:40,achievements:[],bossLoot:[],ownedCharacters:[],weaponMasteries:[],cosmetics:['classic'],totals:{bosses:0}}", context);
  assert.deepEqual(state(context,"characterCatalog.map(c=>isCharacterUnlocked(p,c.id))"),[true,false,false,false]);
  vm.runInContext("p.achievements.push({id:'boss3'}); awardBossLoot(p, 'beau');",context);
  assert.deepEqual(state(context,"characterCatalog.map(c=>isCharacterUnlocked(p,c.id))"),[true,true,true,false]);
  assert.equal(vm.runInContext("purchaseShopEntry(p,shopEntries('Characters')[0])",context),true);
  assert.equal(vm.runInContext("p.points",context),18);
  assert.equal(vm.runInContext("isCharacterUnlocked(p,'mayoMaster')",context),true);
  assert.equal(vm.runInContext("purchaseShopEntry(p,shopEntries('Characters')[0])",context),false);
  assert.equal(vm.runInContext("p.points",context),18);
});

test("boss trophies never pay the same first-kill bonus twice", () => {
  const context = vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let p={points:0,bossLoot:[]};",context);
  assert.deepEqual(state(context,"awardBossLoot(p,'beau')"),{first:true,points:2,characterUnlocked:"beau"});
  assert.deepEqual(state(context,"awardBossLoot(p,'beau')"),{first:false,points:0});
  assert.deepEqual(state(context,"awardBossLoot(p,'invalid')"),{first:false,points:0});
  assert.equal(vm.runInContext("p.points",context),2);
  assert.equal(vm.runInContext("p.bossLoot.length",context),1);
});

test("weapon masteries apply only when owned and cannot be purchased twice", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let p={points:50,weaponMasteries:[]};const item=shopEntries('Weapons').find(x=>x.id==='bomb');",context);
  assert.equal(vm.runInContext("purchaseShopEntry(p,item)",context),true);
  assert.equal(vm.runInContext("isMasteryOwned(p,'bomb')",context),true);
  assert.equal(vm.runInContext("isMasteryOwned(p,'frost')",context),false);
  assert.equal(vm.runInContext("purchaseShopEntry(p,item)",context),false);
  assert.equal(vm.runInContext("p.points",context),32);
});

test("cosmetics never increase stats and achievement-locked cosmetics stay locked", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let p={points:50,cosmetics:['classic'],selectedCosmetic:'classic',achievements:[]};",context);
  assert.equal(vm.runInContext("purchaseShopEntry(p,shopEntries('Cosmetics').find(i=>i.id==='void'))",context),false);
  assert.equal(vm.runInContext("equipCosmetic(p,'gold')",context),false);
  assert.equal(vm.runInContext("purchaseShopEntry(p,shopEntries('Cosmetics').find(i=>i.id==='neon'))",context),true);
  assert.equal(vm.runInContext("equipCosmetic(p,'neon')",context),true);
  assert.equal(vm.runInContext("p.selectedCosmetic",context),"neon");
  assert.equal(vm.runInContext("p.points",context),42);
  assert.equal(vm.runInContext("characterDamageMultiplier('survivor',makeCharacterRuntime(),100,100)",context),1);
});

test("stat purchases use increasing costs and preserve receipts for refunds", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let p={points:50,hpLevel:0,statPurchaseCosts:{hpLevel:[]}};const stat=shopEntries('Stats').find(x=>x.id==='hpLevel');purchaseShopEntry(p,stat);purchaseShopEntry(p,stat);",context);
  assert.equal(vm.runInContext("p.hpLevel",context),2);
  assert.deepEqual(state(context,"p.statPurchaseCosts.hpLevel"),[2,3]);
  assert.equal(vm.runInContext("p.points",context),45);
  assert.equal(vm.runInContext("shopEntryStatus(p,stat).cost",context),4);
});

test("old saves migrate without deleting upgrades, points or weapon selection", () => {
  const saved=JSON.stringify({version:3,points:30,hpLevel:4,damageLevel:3,totals:{kills:1500,bosses:3,runs:15},achievements:[{id:"boss3",title:"Boss Hunter"}]});
  const context=vm.createContext({localStorage:{getItem:()=>saved,setItem:()=>{}}});
  load(context,"js/storage.js");
  load(context,"js/characters.js");
  vm.runInContext("let p=loadMetaProgress()",context);
  const p=state(context,"p");
  assert.equal(p.points,30);
  assert.equal(p.hpLevel,4);
  assert.equal(p.damageLevel,3);
  assert.deepEqual(p.statPurchaseCosts.hpLevel,[2,2,2,2]);
  assert.deepEqual(p.statPurchaseCosts.damageLevel,[3,3,3]);
  assert.deepEqual(p.cosmetics,["classic"]);
  assert.equal(p.selectedCosmetic,"classic");
  assert.equal(vm.runInContext("isCharacterUnlocked(p,'zombieMike')",context),true);
});

test("invalid or insufficient shop purchases never change points or unlocks", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let p={points:1,weaponMasteries:[],hpLevel:5};",context);
  assert.equal(vm.runInContext("purchaseShopEntry(p,shopEntries('Weapons')[0])",context),false);
  assert.equal(vm.runInContext("purchaseShopEntry(p,shopEntries('Stats').find(x=>x.id==='hpLevel'))",context),false);
  assert.equal(vm.runInContext("p.points",context),1);
  assert.equal(vm.runInContext("p.weaponMasteries.length",context),0);
});

test("Soul Rush and Mayo Madness activate through kill thresholds with cooldowns", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let r=makeCharacterRuntime();",context);
  assert.equal(vm.runInContext("progressCharacterKills('survivor',r,19)",context),false);
  assert.equal(vm.runInContext("progressCharacterKills('survivor',r,1)",context),true);
  assert.equal(vm.runInContext("characterMovementMultiplier('survivor',r,100,100)",context),1.25);
  assert.equal(vm.runInContext("progressCharacterKills('survivor',r,20)",context),false);
  vm.runInContext("updateCharacterTimers(r,10);",context);
  assert.equal(vm.runInContext("progressCharacterKills('survivor',r,1)",context),true);
  vm.runInContext("r=makeCharacterRuntime();",context);
  assert.equal(vm.runInContext("progressCharacterKills('mayoMaster',r,25)",context),true);
  assert.equal(vm.runInContext("characterDamageMultiplier('mayoMaster',r,100,100)",context),1.15);
  vm.runInContext("updateCharacterTimers(r,5);",context);
  assert.equal(vm.runInContext("characterDamageMultiplier('mayoMaster',r,100,100)",context),1);
});

test("Zombie Mike rage is conditional on low HP", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext("let r=makeCharacterRuntime();",context);
  assert.equal(vm.runInContext("characterDamageMultiplier('zombieMike',r,80,120)",context),1);
  assert.equal(vm.runInContext("characterDamageMultiplier('zombieMike',r,50,120)",context),1.17);
  assert.equal(vm.runInContext("characterMovementMultiplier('zombieMike',r,50,120)",context),0.97);
});

test("Beau shoots three fish projectiles as an ability, not a fourth weapon", () => {
  const context=vm.createContext({});
  load(context,"js/characters.js");
  vm.runInContext(`let selectedCharacter='beau',characterRuntime=makeCharacterRuntime();
    let player={x:0,y:0,hp:140,maxHp:140},bullets=[],selectedWeapons=['arcane','bomb','frost'];
    let nearestEnemy=()=>({x:100,y:0}),globalDamageMultiplier=()=>1.1;
    let puff=()=>{},playSfx=()=>{};`,context);
  const game=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
  const a=game.indexOf("function fireBeauFishBarrage() {");
  const b=game.indexOf("function update(dt) {",a);
  assert.ok(a>=0 && b>a);
  vm.runInContext(game.slice(a,b),context);
  vm.runInContext("updateCharacterAbility(8)",context);
  assert.equal(vm.runInContext("bullets.length",context),3);
  assert.equal(vm.runInContext("selectedWeapons.length",context),3);
  assert.equal(vm.runInContext("bullets.every(b=>b.type==='fish' && b.hit instanceof Set)",context),true);
  assert.equal(vm.runInContext("characterRuntime.fishCooldown",context),12);
});
