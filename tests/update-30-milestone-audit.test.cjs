const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {audit,manual}=require("../scripts/milestone-30-audit.cjs");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("Update 30 milestone independently evaluates all ten core gameplay gates",()=>{
  const result=audit();
  assert.equal(result.technicalChecks.length,10);
  assert.deepEqual(result.technicalChecks.map(c=>c.id),[
    "ELEMENTS","BOSSES","EVOLUTIONS","ISOLATION","WORLD",
    "POWERS","HUD","PERFORMANCE","VICTORY","AUTOMATION"
  ]);
  for(const gate of result.technicalChecks)
    assert.equal(gate.status,"PASS",gate.id+" "+(gate.reason||""));
  assert.equal(result.technicalPass,true);
});
test("technical completion must NOT falsely certify a release without three real runs",()=>{
  const status=audit();
  assert.equal(status.technicalPass,true);
  assert.equal(status.verifiedReleaseReady,false);
  assert.equal(status.scope,"TECHNICAL_MILESTONE_ONLY");
  assert.equal(manual.length,6);
  assert.ok(manual.every(c=>c.status==="OPEN"));
  assert.ok(manual.some(c=>c.id==="THREE_RECORDED_RUNS"));
  assert.ok(manual.some(c=>c.id==="EARNED_EVOLUTIONS"));
});
test("concise canonical documents preserve road map and manual NO-GO gate",()=>{
  const report=src("ROADMAP-31-50.md"),milestone=src("MILESTONE-30.md");
  assert.match(report,/NO-GO/);
  assert.match(report,/39/);assert.match(report,/40/);
  assert.match(milestone,/10 technical checks/);
  assert.match(milestone,/6 manual release gates/);
  assert.match(milestone,/three.*elemental weapon evolutions/i);
});
test("README documents the actual 3×3 element loadout and no cap",()=>{
 const intro=src("README.md");
 assert.match(intro,/Fire \/ Water \/ Frost/);
 assert.match(intro,/\*\*Water\*\* \(Water Bolt, Tidal Wave, Whirlpool\)/);
 assert.match(intro,/\*\*Frost\*\* \(Frost Orb, Ice Shards, Glacial Pulse\)/);
 assert.match(intro,/The Last Meme/);
 assert.match(intro,/No fixed 10\/17-minute gate; no two-evolution cap/);
 assert.match(intro,/not.*release|release gates/i);
});
test("GitHub Actions enforces actual regression suite AND technical milestone audit",()=>{
  const ci=src(".github/workflows/shadow-survivor-tests.yml");
  assert.match(ci,/run: node --test tests\/\*\.test\.js tests\/\*\.test\.cjs/);
  assert.match(ci,/node scripts\/milestone-30-audit\.cjs/);
  assert.match(ci,/Check JavaScript syntax/);
});
test("manual gates require real Frost/Fire/Water post-change playtests",()=>{
  const qa=src("NORMAL-RUN-QA.md"),roadmap=src("ROADMAP-31-50.md");
  assert.match(qa,/29 hits/);
  assert.match(qa,/three distinct full post-change element runs|pending three distinct/i);
  assert.match(qa,/FPS/);
  assert.match(roadmap,/Not release-approved/);
});
