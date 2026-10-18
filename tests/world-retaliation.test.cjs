const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../js/world-retaliation.js"),"utf8");
function make(element="fire",percent=50,original="flooded"){const window={currentLivingWorldElement:()=>element,getWorldConquest:()=>({active:true,target:percent,original,invading:element==="fire"?"burning":element==="water"?"flooded":"frozen"})};vm.runInNewContext(src,{window,Math});window.resetWorldRetaliation();return window;}
function kills(w,p,n){for(let i=0;i<n;i++)w.recordWorldDestruction({kind:1,summoned:false},p,0);}
test("ten kills at fifty percent produce permanent fire in a water world",()=>{let w=make("fire"),p={x:0,y:0,r:15};kills(w,p,10);let r=w.getWorldRetaliationStatus().rifts[0];assert.equal(r.type,"fire");w.updateWorldRetaliation(60,{x:1000,y:1000});assert.equal(w.getWorldRetaliationStatus().active,1);});
test("bosses and summons do not build retaliation",()=>{let w=make(),p={x:0,y:0};for(let i=0;i<40;i++){w.recordWorldDestruction({kind:3},p);w.recordWorldDestruction({kind:1,summoned:true},p);}assert.equal(w.getWorldRetaliationStatus().active,0);});
test("fire has warning and repeat damage, protected by cooldown",()=>{let w=make(),p={x:0,y:0,r:15,inv:0};kills(w,p,10);let r=w.getWorldRetaliationStatus().rifts[0];p.x=r.x;p.y=r.y;let hits=0;const h={damage:()=>{hits++;return true}};w.updateWorldRetaliation(2,p,h);assert.equal(hits,0);w.updateWorldRetaliation(.3,p,h);assert.equal(hits,1);w.updateWorldRetaliation(.5,p,h);assert.equal(hits,1);w.updateWorldRetaliation(1.3,p,h);assert.equal(hits,2);});
test("frost applies chill and water applies push without damage",()=>{for(const [type,key] of [["frost","chill"],["water","push"]]){const w=make(type,50,"burning"),p={x:0,y:0,r:15,inv:0};kills(w,p,10);let r=w.getWorldRetaliationStatus().rifts[0];p.x=r.x+5;p.y=r.y;let calls=0;w.updateWorldRetaliation(2.5,p,{[key]:()=>calls++});assert.equal(calls,1);assert.equal(r.type,type);}});
test("per-run cap and reset are bounded",()=>{let w=make(),p={x:0,y:0};kills(w,p,500);assert.ok(w.getWorldRetaliationStatus().active<=16);w.clearWorldRetaliation();assert.equal(w.getWorldRetaliationStatus().active,0);w.resetWorldRetaliation();assert.equal(w.getWorldRetaliationStatus().kills,0);});
test("elemental effects and rendering are wired",()=>{const read=n=>fs.readFileSync(path.join(__dirname,"..",n),"utf8");assert.match(read("js/game.js"),/chill: seconds/);assert.match(read("js/enemies.js"),/recordWorldDestruction/);assert.match(read("js/render.js"),/drawWorldRetaliation/);assert.match(read("index.html"),/world-retaliation.js/);assert.match(read("js/world-visuals.js"),/type:"fire",effect:"steam"/);});

test("no reactions below fifteen percent, including many kills",()=>{
  const w=make("fire",0),p={x:0,y:0};kills(w,p,250);
  assert.equal(w.getWorldRetaliationStatus().active,0);
});
test("fifteen percent brings occasional reactions, fifty percent accelerates",()=>{
  const early=make("fire",15),late=make("fire",50),p={x:0,y:0};
  kills(early,p,44);kills(late,p,9);
  assert.equal(early.getWorldRetaliationStatus().active,0);
  assert.equal(late.getWorldRetaliationStatus().active,0);
  kills(early,p,1);kills(late,p,1);
  assert.equal(early.getWorldRetaliationStatus().active,1);
  assert.equal(late.getWorldRetaliationStatus().active,1);
});
test("no element clash when attacking same-element world",()=>{
  const w=make("water",50,"flooded"),p={x:0,y:0};kills(w,p,250);
  assert.equal(w.getWorldRetaliationStatus().active,0);
});
