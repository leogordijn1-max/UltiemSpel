const { performance } = require('node:perf_hooks');

// Deterministic mix of target searches used by the six active area/targeted weapons.
function measure(enemyCount, optimized) {
  let seed = 12345;
  const random = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const enemies = Array.from({ length: enemyCount }, (_, index) => ({
    x: (random() - 0.5) * 2600,
    y: (random() - 0.5) * 1800,
    kind: index % 7 === 0 ? 4 : index % 5 === 0 ? 2 : 0,
    dead: false,
  }));
  const ranges = [820, 1100, 1300, 220, 400, 300];
  const searches = () => {
    let checksum = 0;
    for (let query = 0; query < 100; query++) {
      const x = (query % 11 - 5) * 120;
      const y = (query % 9 - 4) * 100;
      const range = ranges[query % ranges.length];
      const rangeSquared = range * range;
      const visibleOnly = query % ranges.length === 0;
      let target = null;
      let nearestSquared = rangeSquared;
      if (optimized) {
        for (const enemy of enemies) {
          if (enemy.dead || (visibleOnly && (Math.abs(enemy.x - x) > 460 || Math.abs(enemy.y - y) > 320))) continue;
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared <= nearestSquared) { nearestSquared = distanceSquared; target = enemy; }
        }
      } else {
        target = enemies
          .filter((enemy) => !enemy.dead && (!visibleOnly || (Math.abs(enemy.x - x) <= 460 && Math.abs(enemy.y - y) <= 320)) && (enemy.x - x) ** 2 + (enemy.y - y) ** 2 < rangeSquared)
          .sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2))[0];
      }
      if (target) checksum += target.x;
    }
    return checksum;
  };
  for (let warmup = 0; warmup < 3; warmup++) searches();
  const samples = [];
  for (let sample = 0; sample < 11; sample++) {
    const started = performance.now(); searches(); samples.push(performance.now() - started);
  }
  samples.sort((a, b) => a - b);
  return samples[5];
}
for (const count of [100, 200, 300]) {
  const before = measure(count, false), after = measure(count, true);
  console.log(`${count} enemies (${Math.floor(count / 7)} ranged; mixed Chain/Arcane/Boomerang/Frost/Flame/Pulse queries) | before ${before.toFixed(2)} ms | after ${after.toFixed(2)} ms per 100 searches`);
}
