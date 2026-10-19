const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
function enemyHarness(count=240){
  const context=vm.createContext({
    window:{},Math,Map,Set,
    enemyGrid:new Map(),enemies:[],gemGrid:new Map(),
    player:{x:0,y:0,r:15},W:1280,H:720
  });
  vm.runInContext(read("js/enemies.js"),context);
  const enemies=[];
  for(let i=0;i<count;i++) enemies.push({
    id:i,dead:false,kind:i%7===0?4:0,
    x:((i*73)%1800)-900+(i%3)*.013,
    y:((i*127)%1600)-800+(i%5)*.017,r:14
  });
  context.enemies=enemies;
  return {context,enemies,run:x=>vm.runInContext(x,context)};
}
function renderHarness(){
  const counters={gradients:0,colors:0};
  const ctx={
    createRadialGradient:()=>{
      counters.gradients++;
      return {addColorStop:()=>{counters.colors++}};
    }
  };
  const context=vm.createContext({ctx,Math,W:1280,H:720,
    window:{},player:{x:0,y:0}});
  vm.runInContext(read("js/render.js"),context);
  return {context,counters,run:x=>vm.runInContext(x,context)};
}
test("enemy spatial grid retains Map and REUSES its bucket arrays across ticks",()=>{
  const h=enemyHarness(1),grid=h.context.enemyGrid;
  h.run("rebuildEnemyGrid()");
  const original=[...grid.values()][0];
  assert.equal(grid.size,1);
  h.enemies[0].x+=ENEMY_GRID_DISTANCE();
  function ENEMY_GRID_DISTANCE(){return 1000;}
  h.run("rebuildEnemyGrid()");
  assert.equal(h.context.enemyGrid,grid,"stable Map avoids per-tick allocations");
  assert.equal(grid.size,1);
  assert.equal([...grid.values()][0],original,"same bucket recycled in new cell");
  assert.equal(original.length,1);
  assert.equal(original[0],h.enemies[0]);
});
test("rebuild removes dead and moved entities and has no stale target hits",()=>{
  const h=enemyHarness(100);
  h.run("rebuildEnemyGrid()");
  const before=h.run("nearbyEnemies(0,0,450)");
  assert.ok(before.length>0);
  const deleted=before[0];
  deleted.dead=true;
  const moved=before[1];moved.x=9500;moved.y=9500;
  h.run("rebuildEnemyGrid()");
  const after=h.run("nearbyEnemies(0,0,450)");
  assert.ok(!after.includes(deleted));
  assert.ok(!after.includes(moved));
  assert.ok(h.run("nearbyEnemies(9500,9500,30)").includes(moved));
  assert.equal(h.enemies.filter(x=>!x.dead).length,99,
    "optimization does not mutate enemy deaths or population");
});
test("cell queries match brute-force collision distances for dense and sparse arenas",()=>{
  for(const density of [1,80,260,600]){
    const h=enemyHarness(density);
    for(let tick=0;tick<6;tick++){
      h.run("rebuildEnemyGrid()");
      for(const radius of [35,85,140,180,290,500,1100]){
        const x=(tick-3)*71,y=(tick-2)*83;
        const expected=h.enemies.filter(e=>!e.dead &&
          (e.x-x)**2+(e.y-y)**2<=radius*radius).map(e=>e.id).sort((a,b)=>a-b);
        const actual=Array.from(h.context.nearbyEnemies(x,y,radius),e=>e.id)
          .sort((a,b)=>a-b);
        assert.deepEqual(actual,expected,
          "radius "+radius+", density "+density+", tick "+tick);
      }
      for(let i=tick;i<h.enemies.length;i+=7){
        h.enemies[i].x+=11;h.enemies[i].y-=6;
      }
    }
  }
});
test("nearest visible target still resolves correctly after repeated bucket recycling",()=>{
  const h=enemyHarness(300);
  for(let frame=0;frame<10;frame++){
    h.run("rebuildEnemyGrid()");
    for(const radius of [120,350,1000]){
      const candidates=h.enemies.filter(e=>!e.dead &&
        e.x*e.x+e.y*e.y<radius*radius)
        .sort((a,b)=>(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y));
      const expected=candidates[0]||null;
      const actual=h.context.nearestEnemy(0,0,radius);
      assert.equal(actual,expected);
    }
    h.enemies[frame%h.enemies.length].x+=21;
    h.enemies[frame%h.enemies.length].y-=33;
  }
});
test("spare bucket cache has a hard cap and never keeps enemies in free cells",()=>{
  const h=enemyHarness(420);
  h.run("rebuildEnemyGrid()");
  h.context.enemies=[];
  h.run("rebuildEnemyGrid()");
  assert.equal(h.context.enemyGrid.size,0);
  assert.ok(h.run("enemyGridBucketPool.length")<=256);
  assert.ok(h.run("enemyGridBucketPool.every(bucket=>bucket.length===0)"));
  for(let tick=0;tick<15;tick++){
    h.context.enemies=h.enemies.filter((_,i)=>i%3===tick%3);
    h.run("rebuildEnemyGrid()");
  }
  assert.ok(h.run("enemyGridBucketPool.length")<=256);
});
test("effect culling includes foreground and edge impacts but discards far-away VFX",()=>{
  const h=renderHarness();
  assert.equal(h.run("renderEffectVisible(0,0,0)"),true);
  assert.equal(h.run("renderEffectVisible(630,0,0)"),true);
  assert.equal(h.run("renderEffectVisible(900,0,0)"),false);
  assert.equal(h.run("renderEffectVisible(900,0,250)"),true);
  assert.equal(h.run("renderEffectVisible(5000,0,100)"),false);
  h.context.player.x=5000;
  assert.equal(h.run("renderEffectVisible(5000,0,50)"),true);
  assert.equal(h.run("renderEffectVisible(0,0,50)"),false);
});
test("long laser segments crossing the screen are never wrongly culled",()=>{
  const h=renderHarness();
  assert.equal(h.run("renderSegmentVisible(-2000,0,2000,0)"),true);
  assert.equal(h.run("renderSegmentVisible(0,-2000,0,2000)"),true);
  assert.equal(h.run("renderSegmentVisible(3000,-100,3400,100)"),false);
  assert.equal(h.run("renderSegmentVisible(-700,-410,-670,-370,45)"),true);
  assert.equal(h.run("renderSegmentVisible(-4500,-5000,-4000,-4800)"),false);
});
test("screen vignette uses one Canvas gradient until the viewport actually resizes",()=>{
  const h=renderHarness();
  const first=h.run("getVignettePaint()");
  assert.equal(h.counters.gradients,1);
  for(let i=0;i<500;i++) assert.equal(h.run("getVignettePaint()"),first);
  assert.equal(h.counters.gradients,1);
  h.context.W=1700;h.context.H=900;
  const next=h.run("getVignettePaint()");
  assert.notEqual(next,first);
  assert.equal(h.counters.gradients,2);
  assert.equal(h.counters.colors,4);
  assert.equal(h.run("getVignettePaint()"),next);
});
test("all substantial offscreen cosmetic groups are culled, but boss tells remain drawn",()=>{
  const s=read("js/render.js");
  assert.match(s,/if\(!renderEffectVisible\(zone\.x,zone\.y,zone\.radius\)\)continue/);
  assert.match(s,/if\(!renderSegmentVisible\(segment\.x1,segment\.y1,segment\.x2,segment\.y2\)\)continue/);
  assert.match(s,/if\(!renderEffectVisible\(burst\.x,burst\.y,burst\.radius\*1\.1\)\)continue/);
  assert.match(s,/if\(!renderEffectVisible\(explosion\.x,explosion\.y,explosion\.radius\)\)continue/);
  assert.match(s,/drawGuardianArenaPowerWarning\?\.\(e,ctx,time,graphicsQuality\)/);
  assert.match(s,/drawCombatHudEscape\?\.\(ctx,e,player,time,graphicsQuality\)/);
  assert.match(s,/drawWorldRetaliation\?\.\(ctx, time, graphicsQuality,/);
  assert.match(s,/getVignettePaint\(\)/);
  assert.doesNotMatch(s,/visibleEnemy\(\{ \.\.\.bomb, r:/);
});
test("world scars no longer allocate viewport arrays and the HUD rebuilds only on change",()=>{
  const scars=read("js/world-visuals.js"),game=read("js/game.js");
  assert.doesNotMatch(scars,/const visible=scars\.filter\(/);
  assert.match(scars,/for\(const s of scars\)\{/);
  assert.match(game,/if\(cachedLoadoutHtml !== loadoutMarkup\)/);
  assert.match(game,/cachedLoadoutHtml = null;\s*window\.resetCombatHud/);
  assert.match(game,/simulationAccumulator \+= Math\.min\(elapsed, 0\.1\) \* gameSpeed/);
  assert.match(game,/const fixedStep = 1 \/ 60/);
  assert.match(read("index.html"),/js\/render\.js\?v=[a-z0-9-]+/);
});
