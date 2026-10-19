// Persistent world scars: first, non-combat stage of The Living World.
// Runs leave long-term atmospheric traces determined by equipped weapons.
(() => {
  const KEY = "shadowLivingWorldV1";
  const blank = () => ({ runs: 0, frost: 0, fire: 0, water: 0, ruin: 0, storm: 0, arcane: 0, lastRun: "" });
  function readWorld() {
    try {
      const value = JSON.parse(storageGet(KEY, "null"));
      if (!value || typeof value !== "object") return blank();
      const world = blank();
      for (const key of ["runs", "frost", "fire", "water", "ruin", "storm", "arcane"]) {
        const number = Number(value[key]);
        world[key] = Number.isFinite(number) ? Math.max(0, Math.min(100000, number)) : 0;
      }
      world.lastRun = typeof value.lastRun === "string" ? value.lastRun.slice(0, 100) : "";
      return world;
    } catch { return blank(); }
  }
  function state() {
    const world = readWorld();
    const marks = [
      ["frost", "FROZEN", "Ice spreads across the abandoned streets."],
      ["fire", "SCORCHED", "Ash settles on the surviving rooftops."],
      ["water", "DROWNED", "Floodwater rolls through the defending world."],
      ["ruin", "SHATTERED", "The roads and towers bear fresh scars."],
      ["storm", "STORM-TOUCHED", "Static hangs over the ruined city."],
      ["arcane", "HAUNTED", "The air still pulses with strange magic."],
    ];
    const first = marks.sort((a,b)=>world[b[0]]-world[a[0]])[0];
    return world.runs === 0 || world[first[0]] === 0
      ? { title:"UNTOUCHED", detail:"The world has not yet remembered a run.", runs:world.runs }
      : { title:first[1], detail:first[2], runs:world.runs };
  }
  window.getLivingWorldState = state;
  const baseRecordRun = recordRun;
  recordRun = function (...args) {
    const prior = runRecorded;
    const result = baseRecordRun(...args);
    if (result && !prior) {
      const world = readWorld();
      const influence = {
        frost: (upgrades.frost || 0) + (upgrades.iceShards || 0) + (upgrades.glacialPulse || 0),
        fire: (upgrades.flame || 0) + (upgrades.fireball || 0) + (upgrades.flameOrbit || 0),
        water: (upgrades.waterBolt || 0) + (upgrades.tidalWave || 0) + (upgrades.whirlpool || 0),
        ruin: (upgrades.bomb || 0) + (upgrades.nova || 0),
        storm: upgrades.chain || 0,
        arcane: (upgrades.arcane || 0) + (upgrades.orbit || 0) + (upgrades.boomerang || 0),
      };
      for (const [key, level] of Object.entries(influence)) {
        world[key] = Math.min(100000, world[key] + Math.max(0, Number(level) || 0));
      }
      world.runs += 1;
      world.lastRun = recordedRunId || "";
      storageSet(KEY, JSON.stringify(world));
    }
    return result;
  };
})();
