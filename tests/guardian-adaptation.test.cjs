// Run from repository root: node --test tests/guardian-adaptation.test.cjs
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const code=fs.readFileSync(path.join(__dirname,"../js/guardian-adaptation.js"),"utf8");
const enemyCode=fs.readFileSync(path.join(__dirname,"../js/enemy-adaptation.js"),"utf8");

function harness() {
  const scars=[], shots=[], warnings=[];
  const window={
    getDominantWorld:()=>"frozen",
    worldBiomeAt:(x)=>x>=120?"burning":"frozen",
    terrainAt:()=>null,
    addWorldScar:(...args)=>scars.push(args),
  };
  const context=vm.createContext({window,Math});
  vm.runInContext(code,context,{filename:"guardian-adaptation.js"});
  vm.runInContext(enemyCode,context,{filename:"enemy-adaptation.js"});
  const hooks={
    visible:true,
    scar:(...args)=>scars.push(args),
    projectile:(...args)=>shots.push(args),
    warn:(...args)=>warnings.push(args),
  };
  return {window,scars,shots,warnings,hooks};
}

test("world bosses defend the ORIGINAL world, not the invading element",()=>{
  const h=harness();
  const boss={kind:3};
  assert.equal(h.window.initializeGuardianWorld(boss),true);
  assert.equal(boss.guardianWorld,"frozen");
  assert.equal(h.window.guardianWorldResistance(boss,"frost"),.84);
  assert.equal(h.window.guardianWorldResistance(boss,"water"),1);
});

test("Guardian ability stays inactive during boss phase I",()=>{
  const h=harness(),boss={kind:3,phaseTwo:false,x:0,y:0};
  h.window.initializeGuardianWorld(boss,"burning");
  assert.equal(h.window.updateGuardianWorld(boss,100,{x:20,y:0,r:12},h.hooks),false);
  assert.equal(h.warnings.length,0);
  assert.equal(h.shots.length,0);
});

test("Glacial Ward warns first then chills player and freezes ground",()=>{
  const h=harness(), boss={kind:3,phaseTwo:true,x:0,y:0};
  const player={x:70,y:0,r:12};
  h.window.initializeGuardianWorld(boss,"frozen");
  h.window.updateGuardianWorld(boss,0,player,h.hooks);
  h.window.updateGuardianWorld(boss,4.2,player,h.hooks);
  assert.equal(h.warnings.length,1);
  assert.equal(player.guardianChillUntil,undefined);
  h.window.updateGuardianWorld(boss,5.3,player,h.hooks);
  assert.equal(player.guardianChillUntil,7.3);
  assert.equal(h.scars[0][0],"frost");
  assert.equal(h.shots.length,0);
  h.window.updateGuardianWorld(boss,5.35,player,h.hooks);
  assert.equal(h.scars.length,1);
});

test("Ember Salvo fires three existing boss projectiles, no duplicate volleys",()=>{
  const h=harness(), boss={kind:3,phaseTwo:true,x:0,y:0};
  const player={x:300,y:0,r:12};
  h.window.initializeGuardianWorld(boss,"burning");
  h.window.updateGuardianWorld(boss,1,player,h.hooks);
  h.window.updateGuardianWorld(boss,5.1,player,h.hooks);
  assert.equal(h.shots.length,0);
  h.window.updateGuardianWorld(boss,6.3,player,h.hooks);
  assert.equal(h.shots.length,3);
  assert.equal(h.scars[0][0],"fire");
  h.window.updateGuardianWorld(boss,7,player,h.hooks);
  assert.equal(h.shots.length,3);
});

test("Tidal Repulse pushes only nearby players and has a warning",()=>{
  const h=harness(),boss={kind:3,isFinalBoss:true,finalPhase:2,x:0,y:0};
  const player={x:120,y:0,r:12};
  h.window.initializeGuardianWorld(boss,"flooded");
  h.window.updateGuardianWorld(boss,0,player,h.hooks);
  h.window.updateGuardianWorld(boss,4.5,player,h.hooks);
  assert.equal(player.guardianTidePushX,undefined);
  h.window.updateGuardianWorld(boss,5.6,player,h.hooks);
  assert.ok(player.guardianTidePushX>0);
  assert.equal(player.guardianTidePushY,0);
  assert.equal(h.scars[0][0],"water");
});

test("boss movement and resists differ by world only on matching ground",()=>{
  const h=harness(),boss={kind:3,phaseTwo:true};
  h.window.initializeGuardianWorld(boss,"flooded");
  assert.ok(h.window.guardianWorldSpeed(boss,"water")>1.2);
  assert.equal(h.window.guardianWorldSpeed(boss,"frost"),1);
  assert.equal(h.window.guardianWorldResistance(boss,"water"),.86);
  assert.equal(h.window.guardianWorldResistance(boss,"fire"),1);
  boss.phaseTwo=false;
  assert.equal(h.window.guardianWorldSpeed(boss,"water"),1);
});

test("lightweight steering favors matching world patches without pathfinding",()=>{
  const h=harness();
  const runner={kind:1,x:0,y:0,worldAffinity:"frozen"};
  const selected=h.window.enemyTerrainSteer(runner,0,true,300*300,0);
  assert.notEqual(selected,0);
  assert.equal(h.window.enemyTerrainSteer({kind:5,x:0,y:0,worldAffinity:"frozen"},0,true,300*300,0),0);
  assert.equal(h.window.enemyTerrainSteer(runner,0,false,300*300,0),0);
  assert.equal(h.window.enemyTerrainSteer(runner,0,true,60*60,0),0);
});

test("Guardian windup is rendered on low graphics",()=>{
  const h=harness(),boss={kind:3,phaseTwo:true,x:0,y:0};
  h.window.initializeGuardianWorld(boss,"frozen");
  boss.guardianWarningUntil=10;
  let strokes=0;
  const ctx=new Proxy({stroke(){strokes++}},{
    get(obj,key){return key in obj?obj[key]:()=>{}},
    set(obj,key,val){obj[key]=val;return true},
  });
  h.window.drawGuardianWorldWarning(boss,ctx,9,true);
  assert.equal(strokes,1);
});
