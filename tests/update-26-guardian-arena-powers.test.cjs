const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function harness(){
  const window={bossCombatPredictTarget:(e,p)=>({x:p.x+(p.combatVX||0)*.2,y:p.y})};
  vm.runInNewContext(read("js/guardian-arena-powers.js"),{window,Math,Number});
  const player={x:250,y:0,r:15,combatVX:0};
  return {window,player,boss:(variant)=>({
    kind:3,variant:variant===3?3:variant,isFinalBoss:variant===3,
    x:0,y:0,phaseThree:true,phaseTwo:true,finalPhase:3
  })};
}
function drawCanvas(){
  const seen={fills:0,strokes:0,arcs:0,rects:0,saves:0,restores:0};
  const ctx={
    save(){seen.saves++},restore(){seen.restores++},
    translate(){},rotate(){},beginPath(){},closePath(){},
    arc(){seen.arcs++},moveTo(){},lineTo(){},rect(){seen.rects++},
    fill(){seen.fills++},stroke(){seen.strokes++},
    fillRect(){seen.fills++},setLineDash(){}
  };
  return {ctx,seen};
}
test("all four Guardian powers are unique, visual and active only for a live boss",()=>{
  const h=harness();
  assert.deepEqual(Array.from(h.window.guardianArenaPowerCatalog),
    ["HOUND'S KILL ZONES","ECLIPSE OF THE LOST","THE FINAL TOLL","REALITY FRACTURE"]);
  for(let kind=0;kind<4;kind++){
    const e=h.boss(kind);
    assert.equal(h.window.beginGuardianArenaPower(e,10,h.player),true);
    assert.equal(h.window.beginGuardianArenaPower(e,10,h.player),false);
    const s=h.window.guardianArenaPowerStatus();
    assert.equal(s.variant,kind);
    assert.equal(s.name,h.window.guardianArenaPowerCatalog[kind]);
    assert.equal(s.stage,"warning");
    assert.equal(s.warningLength,1.45);
    assert.equal(h.window.interruptGuardianArenaPower(e),true);
    assert.equal(h.window.guardianArenaPowerStatus().active,false);
  }
  assert.equal(h.window.beginGuardianArenaPower({kind:0,variant:1},10,h.player),false);
});
test("four giant collision geometries threaten standing still but offer a nearby dodge",()=>{
  const h=harness(),safe=[
    {u:0,v:130},   // Beau: perpendicular gap between parallel lanes
    {u:96,v:148},  // Shade: clear bright wedge outside dangerous central core
    {u:140,v:140}, // Bell: broad diagonal quadrant outside cross
    {u:170,v:0}    // Meme: adjacent bright cell in fracture checkerboard
  ];
  for(let v=0;v<4;v++){
    const b=h.boss(v);
    h.window.beginGuardianArenaPower(b,0,h.player);
    const s=h.window.guardianArenaPowerStatus();
    assert.equal(h.window.guardianArenaPowerThreat(s,s.centerX,s.centerY,15),true,
      "Guardian "+v+" must not leave standing still safe");
    const q=safe[v],angle=s.angle;
    const x=s.centerX+q.u*Math.cos(angle)-q.v*Math.sin(angle);
    const y=s.centerY+q.u*Math.sin(angle)+q.v*Math.cos(angle);
    assert.equal(h.window.guardianArenaPowerThreat(s,x,y,15),false,
      "Guardian "+v+" needs a reachable, telegraphed escape");
    assert.ok(Math.hypot(x-s.centerX,y-s.centerY)<235*1.45,
      "Escape must be reachable at base movement speed");
    h.window.resetGuardianArenaPower();
  }
});
test("windup visibly tracks for .38s, then target locks before the impact",()=>{
  const h=harness(),b=h.boss(0);
  assert.equal(h.window.beginGuardianArenaPower(b,5,h.player),true);
  h.player.x=320;
  h.window.updateGuardianArenaPower(b,5.2,h.player);
  assert.equal(h.window.guardianArenaPowerStatus().centerX,320);
  h.player.x=600;
  h.window.updateGuardianArenaPower(b,5.6,h.player);
  assert.equal(h.window.guardianArenaPowerStatus().centerX,320);
  assert.equal(h.window.guardianArenaPowerStatus().stage,"warning");
});
test("three warned impacts execute ONCE, not before a warning or during recovery",()=>{
  const h=harness(),b=h.boss(2); // Giant Bell cross
  const hits=[],events={puffs:0,shakes:0};
  const hooks={hit:amount=>hits.push(amount),
    puff:()=>{events.puffs++},shake:()=>{events.shakes++}};
  h.window.beginGuardianArenaPower(b,10,h.player);
  // Quantized 20ms game frames, no direct wall-time timers.
  for(let i=0;i<400;i++){
    const t=10+i*.02;
    h.window.updateGuardianArenaPower(b,t,h.player,hooks);
  }
  assert.deepEqual(hits,[16,18,20],"three distinct, non-stacking beats");
  assert.equal(events.puffs,3);
  assert.equal(events.shakes,3);
  assert.equal(h.window.guardianArenaPowerStatus().active,false);
  h.window.updateGuardianArenaPower(b,20,h.player,hooks);
  assert.equal(hits.length,3,"no repeat impact after finishing");
});
test("player outside the marked zones receives ZERO damage at impact",()=>{
  const h=harness();
  for(let variant=0;variant<4;variant++){
    const b=h.boss(variant),hits=[];
    h.window.beginGuardianArenaPower(b,0,h.player);
    h.player.x=1700;h.player.y=1700;
    h.window.updateGuardianArenaPower(b,.65,h.player); // lock already passed
    h.window.updateGuardianArenaPower(b,1.46,h.player,{hit:v=>hits.push(v)});
    assert.equal(hits.length,0,"moving out of the tell must dodge Guardian "+variant);
    h.window.resetGuardianArenaPower();
    h.player.x=250;h.player.y=0;
  }
});
test("only the owning Guardian can continue or cancel its power",()=>{
  const h=harness(),a=h.boss(0),b=h.boss(1);
  h.window.beginGuardianArenaPower(a,10,h.player);
  assert.equal(h.window.updateGuardianArenaPower(b,12,h.player,{hit:()=>assert.fail()}),false);
  assert.equal(h.window.interruptGuardianArenaPower(b),false);
  assert.equal(h.window.guardianArenaPowerStatus().active,true);
  assert.equal(h.window.interruptGuardianArenaPower(a),true);
  assert.equal(h.window.guardianArenaPowerStatus().active,false);
});
test("Low graphics still draws the EXACT threatened footprint and lock ring",()=>{
  const h=harness();
  for(let v=0;v<4;v++){
    const b=h.boss(v);
    h.window.beginGuardianArenaPower(b,1,h.player);
    const {ctx,seen}=drawCanvas();
    h.window.drawGuardianArenaPowerBackdrop(b,ctx,1.3,h.player,"low",1000,600);
    h.window.drawGuardianArenaPowerWarning(b,ctx,1.3,"low");
    assert.ok(seen.strokes>=2,"core telegraphs must never be disabled on Low");
    assert.ok(seen.arcs>=1,"the aim/lock ring remains visible");
    assert.equal(seen.saves,seen.restores,"canvas context must be restored");
    const before=seen.strokes;
    h.window.resetGuardianArenaPower();
    h.window.drawGuardianArenaPowerWarning(b,ctx,5,"low");
    assert.equal(seen.strokes,before);
  }
});
test("each existing phase III ultimate calls the new arena power only when initiated",()=>{
  const files=["js/beau-encounter.js","js/shade-encounter.js",
    "js/bell-encounter.js","js/meme-encounter.js"];
  for(const file of files){
    const text=read(file);
    assert.match(text,/window\.beginGuardianArenaPower\?\.\(e,t,(?:player|p)\)/);
    assert.match(text,/window\.interruptGuardianArenaPower\?\.\(e\)/);
  }
  const h=harness();
  for(let variant=0;variant<4;variant++){
    const name=files[variant],e=h.boss(variant);
    e.phaseIntro=0;e.chargeWarning=0;e.chargeActive=0;
    e.shotWarning=0;e.guardianWarningUntil=0;e.specialRecoveryUntil=0;
    e.chargeCooldown=0;e.shootCooldown=0;
    const ctx=vm.createContext({window:h.window,Math,Number});
    vm.runInContext(read(name),ctx);
    const init=["initializeBeauEncounter","initializeShadeEncounter",
      "initializeBellEncounter","initializeMemeEncounter"][variant];
    const update=["updateBeauEncounter","updateShadeEncounter",
      "updateBellEncounter","updateMemeEncounter"][variant];
    h.window[init](e,0);
    assert.equal(h.window[update](e,3,.016,h.player,{visible:true,
      clearBossAttacks:()=>{},shake:()=>{},puff:()=>{},notify:()=>{}}),true);
    assert.equal(h.window.guardianArenaPowerStatus().active,true);
    assert.equal(h.window.guardianArenaPowerStatus().variant,variant);
    h.window.resetGuardianArenaPower();
  }
});
test("game damages the player only through the standard invulnerability and dodge rules",()=>{
  const game=read("js/game.js"),render=read("js/render.js"),
    iso=read("js/boss-isolation.js"),html=read("index.html");
  assert.match(game,/updateGuardianArenaPower\?\.\(e,time,player,/);
  assert.match(game,/if\(player\.inv>0 \|\| window\.developerInvincible\?\.\(\) \|\| tryDodge\(\)\)return false;/);
  assert.match(game,/recordPlayerHit\(damage\)/);
  assert.match(game,/player\.inv=\.84/);
  assert.match(game,/resetGuardianArenaPower\?\.\(\)/);
  assert.match(iso,/interruptGuardianArenaPower\?\.\(defeatedBoss\)/);
  assert.match(render,/drawGuardianArenaPowerBackdrop\?\.\(/);
  assert.match(render,/drawGuardianArenaPowerWarning\?\.\(/);
  assert.ok(html.indexOf("js/guardian-arena-powers.js")<
    html.indexOf("js/beau-encounter.js"));
});
test("no hidden RNG, timer, extra minion, terrain scar, XP or reward is created",()=>{
  const s=read("js/guardian-arena-powers.js");
  assert.doesNotMatch(s,/Math\.random|setTimeout|setInterval|spawnEnemy|enemies\.push|addWorldScar|awardBossLoot|saveMetaProgress|dropGem\(/);
  assert.match(s,/const BEATS = 3/);
  assert.match(s,/INITIAL_TELL = 1\.45/);
  assert.match(s,/REPEAT_TELL = 1\.08/);
});
