const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("elemental encyclopedia damage ranges match production level 1 and level 5 formulas", () => {
  const upgrades = source("js/upgrades.js");
  const combat = source("js/elemental-combat.js");
  const weapons = source("js/weapons.js");

  assert.match(upgrades, /fireball".*damage: "28–52 direct \+ burn"/);
  assert.match(upgrades, /flameOrbit".*damage: "16–32 on contact"/);
  assert.match(combat, /\(22 \+ upgrades\.fireball \* 6\)/);
  assert.match(combat, /\(12 \+ upgrades\.flameOrbit \* 4\)/);
  assert.match(weapons, /\(24 \+ level \* 4\)/);
});

test("all selected elemental weapons retain distinct bounded role multipliers", () => {
  const roles = {};
  const context = vmContext(roles);
  const profiles = context.window.elementalWeaponProfiles;
  const selected = [
    "flame", "fireball", "flameOrbit",
    "waterBolt", "tidalWave", "whirlpool",
    "frost", "iceShards", "glacialPulse",
  ];
  assert.deepEqual(Object.keys(profiles).sort(), selected.slice().sort());
  for (const weapon of selected) {
    const values = Object.values(profiles[weapon]);
    assert.ok(values.every(value => value >= 0.8 && value <= 1.15), weapon);
    assert.ok(new Set(values).size >= 3, weapon);
  }
});

function vmContext(window) {
  const vm = require("node:vm");
  vm.runInNewContext(source("js/elemental-weapon-roles.js"), { window, Math, Number });
  return { window };
}
