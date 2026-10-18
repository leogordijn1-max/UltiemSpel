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
  assert.ok(manual.some(c=>c.id==="EARNED_2_EVOLUTIONS"));
});
test("Update 30 report explicitly keeps browser acceptance OPEN and sets verified-ready roadmap",()=>{
  const report=src("MILESTONE-30-REVIEW.md");
  assert.match(report,/20\/20 geplande updates afgerond/);
  assert.match(report,/GEVERIFIEERDE SPEELBARE RELEASE: NOG NIET VRIJGEGEVEN/);
  assert.match(report,/6 HANDMATIGE RELEASEBLOKKADES OPEN/);
  for(let i=31;i<=40;i++)assert.ok(report.includes("**"+i+"**"),"missing roadmap Update "+i);
  assert.match(report,/tijdsprongen/);
  assert.match(report,/twee evoluties/i);
  assert.match(report,/NO-GO/);
});
test("current README no longer promises three evolutions or legacy selectable weapons",()=>{
  const intro=src("README.md").split("## Historisch update-archief")[0];
  assert.match(intro,/Maximaal twee evoluties/);
  assert.match(intro,/Fire.*Flame Cone, Fireball, Flame Orbit/);
  assert.match(intro,/Water.*Water Bolt, Tidal Wave, Whirlpool/);
  assert.match(intro,/Frost.*Frost Orb, Ice Shards, Glacial Pulse/);
  assert.match(intro,/The Last Meme/);
  assert.match(intro,/25:00/);
  assert.doesNotMatch(intro,/derde evolution/);
  assert.match(intro,/Nog niet|nog niet/i);
});
test("GitHub Actions enforces actual regression suite AND technical milestone audit",()=>{
  const ci=src(".github/workflows/shadow-survivor-tests.yml");
  assert.match(ci,/run: node --test tests\/\*\.test\.js tests\/\*\.test\.cjs/);
  assert.match(ci,/node scripts\/milestone-30-audit\.cjs/);
  assert.match(ci,/Check JavaScript syntax/);
});
test("manual gates can only be established from independent real playtest evidence",()=>{
  const qa=src("NORMAL-RUN-QA.md"),report=src("MILESTONE-30-REVIEW.md");
  assert.match(qa,/Nog geen bevestigde volledige menselijke/);
  assert.match(qa,/Open: browsertest/);
  assert.match(report,/gescripte campagne-replay/);
  assert.match(report,/werkelijk verdiende XP/);
  assert.match(report,/FPS\/P95/);
  assert.match(report,/Drie geregistreerde complete runs/);
});
