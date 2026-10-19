const test=require("node:test"),assert=require("node:assert/strict"),
  fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function harness(){
  const window={},ctx={window,Math};
  vm.runInNewContext(read("js/enemy-archetypes.js"),ctx,{filename:"js/enemy-archetypes.js"});
  const player={x:200,y:0,r:12,inv:0};
  const spawn=(kind,x=0,y=0)=>{
    const e={kind,x,y,r:kind===2?35:kind===6?24:12,hp:100,evolutionLevel:2,
      shieldActive:kind===6};
    window.initializeEnemyArchetype(e);return e;
  };
  return {window,player,spawn};
}
test("16-direction shield turns to every sector around the enemy",()=>{
  const h=harness(),e=h.spawn(6);
  const indices=new Set();
  for(let n=0;n<16;n++){
    const angle=(n+.17)*Math.PI*2/16;
    h.player.x=Math.cos(angle)*200;h.player.y=Math.sin(angle)*200;
    const heading=h.window.enemyShieldFacing16(e,h.player);
    assert.ok(Math.abs(Math.atan2(Math.sin(heading-angle),Math.cos(heading-angle)))<=Math.PI/16+.000001);
    indices.add(e.shieldSector);
  }
  assert.equal(indices.size,16);
});
test("shield facing follows player rather than actual move angle or last position",()=>{
  const h=harness(),e=h.spawn(6);
  h.player.x=170;h.player.y=0;
  assert.equal(h.window.enemyShieldFacing16(e,h.player),0);
  h.player.x=0;h.player.y=-170;
  assert.ok(Math.abs(h.window.enemyShieldFacing16(e,h.player)+Math.PI/2)<.000001);
  h.player.x=-140;h.player.y=0;
  const heading=h.window.enemyShieldFacing16(e,h.player);
  assert.ok(Math.abs(Math.abs(heading)-Math.PI)<.000001);
  h.player.x=0;h.player.y=170;
  assert.ok(Math.abs(h.window.enemyShieldFacing16(e,h.player)-Math.PI/2)<.000001);
});
test("active Bulwark shield blocks front hits but flanking attacks work",()=>{
  const h=harness(),e=h.spawn(6);
  const front=h.window.bulwarkShieldMultiplier(e,{x:200,y:0},h.player);
  const back=h.window.bulwarkShieldMultiplier(e,{x:-200,y:0},h.player);
  const side=h.window.bulwarkShieldMultiplier(e,{x:0,y:200},h.player);
  assert.equal(front,.55);assert.equal(back,1.15);assert.equal(side,1.15);
  e.shieldActive=false;
  assert.equal(h.window.bulwarkShieldMultiplier(e,{x:200,y:0},h.player),1);
});
test("shield defense follows rotated player-facing direction including diagonals",()=>{
  const h=harness(),e=h.spawn(6);
  for(const degree of [22.5,45,90,135,180,225,270,315]){
    const rad=degree*Math.PI/180;
    h.player.x=Math.cos(rad)*160;h.player.y=Math.sin(rad)*160;
    const front=h.window.bulwarkShieldMultiplier(e,{...h.player},h.player);
    const back=h.window.bulwarkShieldMultiplier(e,{x:-h.player.x,y:-h.player.y},h.player);
    assert.equal(front,.55,degree+" degrees must block from the player's direction");
    assert.equal(back,1.15);
  }
});
test("each enemy type has a measurable specific weakness, without raw hp spam",()=>{
  const h=harness(),w=h.window.enemyArchetypeDamageMultiplier;
  const cases=[
    [0,"pulse",1.15],[1,"frost",1.30],[2,"bomb",1.25],
    [4,"blade",1.20],[5,"lightning",1.35]
  ];
  for(const [kind,attack,expected] of cases){
    const e=h.spawn(kind);
    assert.equal(w(e,attack,{x:5,y:0},{x:100,y:0}),expected,"kind "+kind);
    assert.equal(w(e,"arcane",{x:5,y:0},{x:200,y:0}),1,"unrelated weapon stays normal");
  }
  const shade=h.spawn(4);
  assert.equal(w(shade,"blade",{x:0,y:0},{x:230,y:0}),1,
    "ranged shade's weakness requires getting close");
  assert.equal(w({kind:3},"bomb",{x:0,y:0},h.player),1);
  assert.equal(w({...shade,summoned:true},"blade",{x:0,y:0},{x:100,y:0}),1);
});
test("Runner zigzags into distinct flanking lane without bonus contact damage",()=>{
  const h=harness(),e=h.spawn(1);
  e.feintCooldown=0;
  const result=h.window.updateEnemyArchetype(e,.016,h.player,1,true);
  assert.ok(result);
  assert.ok(Math.abs(result.angle)>.7);
  assert.ok(result.speedMult>1);
  assert.ok(e.feintTime>0);
  e.feintTime=0;e.feintCooldown=10;
  assert.equal(h.window.updateEnemyArchetype(e,.016,h.player,2,true),null);
});
test("Zombie Mike's stomp warns before damaging, then can be dodged",()=>{
  const h=harness(),e=h.spawn(2),hits=[];
  h.player.x=150;e.stompCooldown=0;
  assert.equal(h.window.updateEnemyArchetype(e,.016,h.player,1,true,
    {damage:n=>hits.push(n)}).speedMult,0);
  assert.ok(e.stompWarning>.9);assert.equal(hits.length,0);
  h.player.x=310;
  h.window.updateEnemyArchetype(e,1.02,h.player,2.02,true,{damage:n=>hits.push(n)});
  assert.equal(hits.length,0,"exiting the warning zone avoids the stomp");
  e.stompCooldown=0;h.player.x=110;
  h.window.updateEnemyArchetype(e,.016,h.player,10,true,{damage:n=>hits.push(n)});
  h.window.updateEnemyArchetype(e,1.02,h.player,11.02,true,{damage:n=>hits.push(n)});
  assert.deepEqual(hits,[15]);
});
test("all LV2 Mikes retain the same innate stomp regardless of their squad position",()=>{
  const h=harness(),e=h.spawn(2);
  e.encounterTactic="crusher";h.player.x=140;e.stompCooldown=0;
  assert.equal(h.window.updateEnemyArchetype(e,.016,h.player,1,true).speedMult,0);
  assert.ok(e.stompWarning>0);
  assert.match(read("js/game.js"),/const formationRoles=\["vanguard","ward","skirmisher"\]/);
});
test("no hidden attacks from offscreen, dead, summoned or boss enemies",()=>{
  const h=harness();
  const enemies=[h.spawn(1),h.spawn(2),h.spawn(6)];
  for(const e of enemies){
    assert.equal(h.window.updateEnemyArchetype(e,3,h.player,10,false),null);
    e.dead=true;
    assert.equal(h.window.updateEnemyArchetype(e,3,h.player,10,true),null);
  }
  assert.equal(h.window.updateEnemyArchetype({kind:3,x:0,y:0},1,h.player,1,true),null);
  assert.equal(h.window.updateEnemyArchetype({kind:1,x:0,y:0,summoned:true},1,h.player,1,true),null);
});
test("16-direction Bulwark shields and extra warning circles are drawable",()=>{
  const h=harness(),guard=h.spawn(6),mike=h.spawn(2);
  mike.stompWarning=.5;
  let arcs=0;
  const ctx=new Proxy({save(){},restore(){},beginPath(){},arc(){arcs++},fill(){},stroke(){}},
    {get(o,k){return k in o?o[k]:()=>{};},set(o,k,v){o[k]=v;return true;}});
  h.window.drawEnemyArchetype(mike,ctx,2,"low");
  h.window.drawEnemyArchetype(guard,ctx,2,"high");
  assert.ok(arcs>=2);
});
test("game renders shield front toward player and no longer uses fixed-facing hex badge",()=>{
  const render=read("js/render.js");
  const section=render.split("if (e.kind === 6) {")[1].split("// Only Beau")[0];
  assert.match(section,/enemyShieldFacing16\?\.\(e,player\)/);
  assert.match(section,/ctx\.rotate\(shieldHeading\)/);
  assert.match(section,/ctx\.arc\(0,0,e\.r\+10,-\.88,\.88\)/);
  assert.match(read("js/world-defense.js"),/enemyShieldFacing16/);
  assert.match(read("js/encounter-tactics.js"),/enemyShieldFacing16/);
});
test("integration applies weaknesses and shield angle to actual enemy damage without boss changes",()=>{
  const code=read("js/enemies.js"),game=read("js/game.js");
  assert.match(code,/enemyArchetypeDamageMultiplier\?\.\(/);
  assert.match(code,/bulwarkShieldMultiplier\?\.\(e,origin,player\)/);
  assert.match(code,/initializeEnemyArchetype\?\.\(e\)/);
  assert.match(game,/updateEnemyArchetype\?\.\(/);
  assert.match(game,/updateEncounterTactic\?\.\(/);
  assert.match(game,/if\(onScreen && !boss && !e\.summoned\)/);
  assert.match(read("index.html"),/enemy-archetypes\.js\?v=[^"]+/);
});
