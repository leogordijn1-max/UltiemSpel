const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const source=read("js/encounter-tactics.js");
function testbed(){
  const window={};vm.runInNewContext(source,{window,Math});window.resetEncounterTactics();
  const player={x:180,y:0,r:12,inv:0};
  const make=(kind,slot=0,group="g1")=>{
    const e={kind,x:0,y:0,r:kind===2?35:13,hp:100,damage:10};
    window.assignEncounterTactic(e,slot,group);return e;
  };
  return {window,player,make};
}
test("small groups assign unique skill roles instead of only extra health",()=>{
  const h=testbed();
  const e=[h.make(0,0),h.make(0,1),h.make(1,0),h.make(1,1),
    h.make(2),h.make(4),h.make(5),h.make(6)];
  assert.deepEqual(e.map(v=>v.encounterTactic),
    ["vanguard","binder","skirmisher","pouncer","crusher","crossfire","volatile","ward"]);
  assert.equal(e[6].burstRadius,104);
  assert.ok(e.every(x=>x.encounterGroup==="g1"));
  assert.equal(h.window.assignEncounterTactic({kind:3},0),undefined);
});
test("charging runners have a visible windup before a high-speed lunge",()=>{
  const h=testbed(),e=h.make(1,1);
  e.tacticCooldown=0;
  const warning=h.window.updateEncounterTactic(e,.01,h.player,0,true);
  assert.equal(warning.speedMult,0);
  assert.ok(e.tacticWarning>.7);
  const windup=h.window.updateEncounterTactic(e,.3,h.player,.3,true);
  assert.equal(windup.speedMult,0);
  const release=h.window.updateEncounterTactic(e,.5,h.player,.8,true);
  assert.equal(release.speedMult,0);
  assert.ok(e.tacticDashTime>0);
  const dash=h.window.updateEncounterTactic(e,.1,h.player,1,true);
  assert.ok(dash.speedMult>=3);
});
test("binders telegraph a slow pulse instead of spamming direct damage",()=>{
  const h=testbed(),e=h.make(0,1);e.tacticCooldown=0;
  let chills=0,hits=0;
  h.player.x=80;
  const hooks={chill:()=>chills++,damage:()=>hits++};
  h.window.updateEncounterTactic(e,.01,h.player,0,true,hooks);
  assert.equal(chills,0);
  h.window.updateEncounterTactic(e,1,h.player,1,true,hooks);
  assert.equal(chills,1);assert.equal(hits,0);
  h.window.updateEncounterTactic(e,1,h.player,2,true,hooks);
  assert.equal(chills,1);
});
test("crushers telegraph an area stomp and miss if the player dodges out",()=>{
  const h=testbed(),e=h.make(2),hits=[];
  h.player.x=130;e.tacticCooldown=0;
  h.window.updateEncounterTactic(e,.01,h.player,0,true,{damage:n=>hits.push(n)});
  assert.equal(e.tacticRadius,145);
  h.player.x=320;
  h.window.updateEncounterTactic(e,1.1,h.player,1.2,true,{damage:n=>hits.push(n)});
  assert.equal(hits.length,0);
  e.tacticCooldown=0;h.player.x=85;
  h.window.updateEncounterTactic(e,.01,h.player,8,true,{damage:n=>hits.push(n)});
  h.window.updateEncounterTactic(e,1.1,h.player,9.1,true,{damage:n=>hits.push(n)});
  assert.deepEqual(hits,[16]);
});
test("crossfire shoots a bounded targeted fan after regular ranged attack",()=>{
  const h=testbed(),e=h.make(4),shots=[];
  e.aimAngle=0;
  assert.equal(h.window.encounterTacticVolley(e,shots,h.player),2);
  assert.equal(shots.length,2);
  assert.ok(shots[0].vy<0 && shots[1].vy>0);
  assert.ok(shots.every(s=>s.damage===6&&s.life===3.8&&s.turnRate<.2));
  const stranger={kind:4};assert.equal(h.window.encounterTacticVolley(stranger,shots,h.player),0);
  for(let i=0;i<315;i++)shots.push({});
  assert.equal(h.window.encounterTacticVolley(e,shots,h.player),0);
});
test("living vanguard and ward shield only their own nearby squadmates",()=>{
  const h=testbed();
  const guard=h.make(0,0),ally=h.make(1,1),outsider=h.make(1,1,"g2");
  const all=[guard,ally,outsider];
  ally.x=20;outsider.x=15;
  assert.equal(h.window.encounterTacticDamageMultiplier(ally,all),.77);
  assert.equal(h.window.encounterTacticDamageMultiplier(outsider,all),1);
  assert.equal(h.window.encounterTacticDamageMultiplier(guard,all),1);
  ally.x=250;assert.equal(h.window.encounterTacticDamageMultiplier(ally,all),1);
  ally.x=20;guard.dead=true;
  assert.equal(h.window.encounterTacticDamageMultiplier(ally,all),1);
});
test("no offscreen skill attacks or abilities on ordinary unmarked enemies",()=>{
  const h=testbed(),e=h.make(2),hits=[];
  e.tacticCooldown=0;h.player.x=90;
  assert.equal(h.window.updateEncounterTactic(e,10,h.player,0,false,{damage:n=>hits.push(n)}),null);
  assert.equal(hits.length,0);
  assert.equal(h.window.updateEncounterTactic({kind:1},1,h.player,2,true),null);
});
test("all role telegraphs draw without requiring sprites or web APIs",()=>{
  const h=testbed();let strokes=0;
  const proxy=new Proxy({save(){},restore(){},stroke(){strokes++}},
    {get(o,key){return key in o?o[key]:()=>{};},set(o,key,val){o[key]=val;return true;}});
  for(const [kind,slot] of [[0,0],[0,1],[1,0],[1,1],[2,0],[4,0],[5,0],[6,0]]){
    const e=h.make(kind,slot);e.tacticWarning=.4;e.tacticAngle=1;
    e.tacticRadius=140;
    h.window.drawEncounterTactic(e,proxy,2,"high");
  }
  assert.ok(strokes>=8);
});
test("game uses real skills for patrols, waves and rendering, but never boss minions",()=>{
  assert.match(read("js/enemies.js"),/assignEncounterTactic/);
  assert.match(read("js/encounter-pacing.js"),/assignEncounterTactic/);
  assert.match(read("js/game.js"),/updateEncounterTactic/);
  assert.match(read("js/game.js"),/encounterTacticVolley/);
  assert.match(read("js/enemies.js"),/encounterTacticDamageMultiplier/);
  assert.match(read("js/render.js"),/drawEncounterTactic/);
  assert.match(read("index.html"),/encounter-tactics\.js/);
});
