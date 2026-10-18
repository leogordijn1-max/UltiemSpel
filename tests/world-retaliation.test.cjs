// Tests for all 6 defending/invading world pairs and all 3 conquest stages.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../js/world-retaliation.js"),"utf8");
const WORLD={fire:"burning",water:"flooded",frost:"frozen"};
const PAIRS=[
  ["fire","flooded",["steam","boiling","geyser"]],
  ["fire","frozen",["thaw","meltwater","thermal-fault"]],
  ["water","burning",["quench","pressure","flash-boil"]],
  ["water","frozen",["slick","ice-drift","ice-break"]],
  ["frost","flooded",["flash-freeze","ice-sheet","frost-rift"]],
  ["frost","burning",["ash-crust","brittle-crust","thermal-shatter"]]
];
function make(element="fire",original="flooded",percent=50){
  const state={element,original,percent,active:true},marks=[];
  const window={
    currentLivingWorldElement:()=>state.element,
    getWorldConquest:()=>({active:state.active,target:state.percent,original:state.original,invading:WORLD[state.element]}),
    addWorldScar:(...args)=>marks.push(args)
  };
  vm.runInNewContext(source,{window,Math});
  window.resetWorldRetaliation();
  return{window,state,marks,p:{x:0,y:0,r:15,inv:0}};
}
function kills(h,n,enemy={kind:1}){for(let i=0;i<n;i++)h.window.recordWorldDestruction(enemy,h.p);}
function spawn(h){assert.equal(h.window.forceWorldReaction(h.p),true);return h.window.getWorldRetaliationStatus().rifts.at(-1);}
test("all six invading-versus-defending world pairs define three distinct reactions",()=>{
  const h=make(),catalog=h.window.getElementReactionCatalog();
  assert.equal(Object.keys(catalog).length,6);
  for(const [element,original,expected] of PAIRS){
    const data=catalog[WORLD[element]+">"+original];
    assert.ok(data);
    assert.equal(data.length,3);
    assert.deepEqual(Array.from(data,x=>x.id),expected);
    for(const recipe of data){
      assert.ok(recipe.effects.length);
      assert.ok(recipe.name);
      assert.ok(recipe.visual);
    }
  }
});
for(const [element,original,expected] of PAIRS){
  for(const [tier,percent,killsNeeded] of [[1,15,45],[2,50,10],[3,85,7]]){
    test(element+" invades "+original+" at "+percent+"%: "+expected[tier-1],()=>{
      const h=make(element,original,percent);
      kills(h,killsNeeded-1);
      assert.equal(h.window.getWorldRetaliationStatus().active,0);
      kills(h,1);
      const s=h.window.getWorldRetaliationStatus(),r=s.rifts[0];
      assert.equal(r.type,expected[tier-1]);
      assert.equal(r.tier,tier);
      assert.equal(r.pair,WORLD[element]+">"+original);
      assert.equal(r.effects.length>0,true);
      assert.equal(s.active,1);
      assert.equal(h.marks.length,1);
      assert.equal(h.marks[0][0],element);
      assert.equal(s.lastReaction.name,r.name);
      assert.equal(r.burst,tier===3);
      h.window.updateWorldRetaliation(200,{x:10000,y:10000,r:15,inv:0});
      assert.equal(h.window.getWorldRetaliationStatus().active,1);
    });
  }
}
test("no elemental clashes before 15% or in a world already controlled by the player",()=>{
  let h=make("fire","flooded",0);
  kills(h,800);assert.equal(h.window.getWorldRetaliationStatus().active,0);
  assert.equal(h.window.forceWorldReaction(h.p),false);
  h=make("water","flooded",85);
  kills(h,800);assert.equal(h.window.getWorldRetaliationStatus().active,0);
  assert.equal(h.window.forceWorldReaction(h.p),false);
  h.state.active=false;
  assert.equal(h.window.getWorldReactionTier(),0);
});
test("normal enemies count but bosses and summoned units never do",()=>{
  const h=make();
  kills(h,100,{kind:3});kills(h,100,{kind:1,summoned:true});
  assert.equal(h.window.getWorldRetaliationStatus().active,0);
  kills(h,9);
  assert.equal(h.window.getWorldRetaliationStatus().active,0);
  kills(h,1);
  assert.equal(h.window.getWorldRetaliationStatus().active,1);
});
test("conquest increases intensity, retaining permanent scars from older stages",()=>{
  const h=make("fire","flooded",15);
  for(let i=0;i<6;i++)spawn(h);
  assert.equal(h.window.forceWorldReaction(h.p),false);
  h.state.percent=50;
  for(let i=0;i<8;i++)spawn(h);
  h.state.percent=85;
  for(let i=0;i<10;i++)spawn(h);
  assert.equal(h.window.forceWorldReaction(h.p),false);
  const s=h.window.getWorldRetaliationStatus();
  assert.equal(s.active,24);
  assert.equal(s.rifts.filter(x=>x.tier===1).length,6);
  assert.equal(s.rifts.filter(x=>x.tier===2).length,8);
  assert.equal(s.rifts.filter(x=>x.tier===3).length,10);
  assert.equal(h.marks.length,24);
  h.window.updateWorldRetaliation(999,{x:100000,y:100000});
  assert.equal(h.window.getWorldRetaliationStatus().active,24);
});
test("steam is nonlethal, boiling water heats and pushes, geyser erupts intermittently",()=>{
  let h=make("fire","flooded",15),r=spawn(h),calls={chill:0,damage:0,push:0};
  h.p.x=r.x;h.p.y=r.y;
  h.window.updateWorldRetaliation(2.4,h.p,{chill:()=>calls.chill++,damage:()=>calls.damage++});
  assert.equal(calls.chill,1);assert.equal(calls.damage,0);
  h=make("fire","flooded",50);r=spawn(h);h.p.x=r.x+5;h.p.y=r.y;
  h.window.updateWorldRetaliation(2.8,h.p,{damage:()=>calls.damage++,push:()=>calls.push++});
  assert.equal(calls.damage,1);assert.equal(calls.push,1);
  h=make("fire","flooded",85);r=spawn(h);h.p.x=r.x+5;h.p.y=r.y;
  let strikes=0;const effects={damage:()=>strikes++,push:()=>{}};
  h.window.updateWorldRetaliation(3.3,h.p,effects);
  assert.equal(strikes,1);
  h.window.updateWorldRetaliation(1.25,h.p,effects);
  assert.equal(strikes,1); // Geyser is recharging; no damage outside eruption.
  h.window.updateWorldRetaliation(2.65,h.p,effects);
  assert.equal(strikes,2);
});
test("in each of eighteen reactions, the corresponding damage/chill/push hooks fire",()=>{
  for(const [element,original] of PAIRS){
    for(const percent of [15,50,85]){
      const h=make(element,original,percent),r=spawn(h);
      h.p.x=r.x+7;h.p.y=r.y;
      const calls={damage:0,chill:0,push:0};
      h.window.updateWorldRetaliation(r.warning+.2,h.p,{
        damage:()=>calls.damage++,chill:()=>calls.chill++,push:()=>calls.push++
      });
      for(const key of ["damage","chill","push"])
        assert.equal(calls[key],r.effects.includes(key)?1:0,r.type+" should apply "+key);
    }
  }
});
test("invincibility and leaving the warning area prevent an elemental reaction hit",()=>{
  const h=make(),r=spawn(h);let hits=0;
  h.p.x=50000;h.p.y=50000;
  h.window.updateWorldRetaliation(r.warning+.1,h.p,{damage:()=>hits++});
  h.p.x=r.x;h.p.y=r.y;h.p.inv=2;
  h.window.updateWorldRetaliation(.1,h.p,{damage:()=>hits++});
  assert.equal(hits,0);
  h.p.inv=0;
  h.window.updateWorldRetaliation(.1,h.p,{damage:()=>hits++});
  assert.equal(hits,1);
});
test("a dodged damage hit cannot still push the player or count as a hit",()=>{
  const h=make(),r=spawn(h),calls={damage:0,push:0};
  h.p.x=r.x;h.p.y=r.y;
  const hooks={damage:()=>{calls.damage++;return false;},push:()=>calls.push++};
  h.window.updateWorldRetaliation(r.warning+.1,h.p,hooks);
  assert.equal(calls.damage,1);assert.equal(calls.push,0);
  h.window.updateWorldRetaliation(.1,h.p,hooks);
  assert.equal(calls.damage,2);
});
test("boss isolation suspends permanent elemental hazards without deleting them",()=>{
  const h=make("fire","flooded",50),r=spawn(h);
  h.p.x=r.x;h.p.y=r.y;
  let hits=0;
  h.window.updateWorldRetaliation(50,h.p,{suspended:true,damage:()=>hits++});
  assert.equal(hits,0);
  assert.equal(h.window.getWorldRetaliationStatus().rifts[0].elapsed,0);
  h.window.updateWorldRetaliation(r.warning+.1,h.p,{damage:()=>hits++});
  assert.equal(hits,1);
  assert.equal(h.window.getWorldRetaliationStatus().active,1);
});
test("reset and clear wipe the reaction field, no cross-run effects",()=>{
  const h=make();
  spawn(h);assert.equal(h.window.getWorldRetaliationStatus().active,1);
  h.window.clearWorldRetaliation();
  assert.equal(h.window.getWorldRetaliationStatus().active,0);
  assert.equal(h.window.forceWorldReaction(h.p),false);
  h.window.resetWorldRetaliation();
  assert.equal(h.window.getWorldRetaliationStatus().active,0);
  assert.equal(h.window.getWorldRetaliationStatus().sequence,0);
});
test("all elemental reaction visuals render without assets or browser globals",()=>{
  for(const [element,original] of PAIRS){
    const h=make(element,original,85);
    const r=spawn(h),methods={beginPath:0,arc:0,stroke:0};
    const ctx={save(){},restore(){},fill(){},lineTo(){},moveTo(){},setLineDash(){},
      beginPath(){methods.beginPath++},arc(){methods.arc++},stroke(){methods.stroke++}};
    h.window.updateWorldRetaliation(r.warning+.1,{x:10000,y:10000});
    h.window.drawWorldRetaliation(ctx,3,"high");
    assert.ok(methods.beginPath>0);
    assert.ok(methods.arc>0);
  }
});
test("reactions share the existing world, gameplay, sandbox and rendering systems",()=>{
  const read=n=>fs.readFileSync(path.join(__dirname,"..",n),"utf8");
  assert.match(read("js/enemies.js"),/recordWorldDestruction/);
  assert.match(read("js/game.js"),/updateWorldRetaliation/);
  assert.match(read("js/render.js"),/drawWorldRetaliation/);
  assert.match(read("index.html"),/world-retaliation.js/);
  assert.match(read("js/world-visuals.js"),/type:"fire",effect:"steam"/);
  assert.match(read("js/developer-mode.js"),/85, 100/);
  assert.match(read("js/developer-mode.js"),/SPAWN ELEMENT REACTION/);
});
