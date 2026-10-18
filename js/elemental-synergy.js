// Update 21: small, earned combo rewards for alternating CURRENT elemental weapons.
// Independent of difficulty, visual quality, and old unselectable weapon systems.
(() => {
  "use strict";
  const groups = Object.freeze({
    fire: Object.freeze(["flame", "fireball", "flameOrbit"]),
    water: Object.freeze(["waterBolt", "tidalWave", "whirlpool"]),
    frost: Object.freeze(["frost", "iceShards", "glacialPulse"]),
  });
  const names = Object.freeze({ fire:"IGNITION", water:"UNDERTOW", frost:"SHATTER" });
  const rates = Object.freeze({ fire:.14, water:.10, frost:.16 });
  const markLife = 3;
  const cooldown = 1.25;
  function trigger(enemy, element, weapon, amount, now, isBoss = false) {
    if (!enemy || enemy.dead || !groups[element]?.includes(weapon) ||
        !Number.isFinite(now) || !Number.isFinite(amount) || amount <= 0)
      return { damage: amount, activated: false };
    const previous = enemy.elementalComboMark;
    const ready = (enemy.elementalComboCooldownUntil || 0) <= now;
    const activated = !!(ready && previous && previous.element === element &&
      previous.weapon !== weapon && previous.until >= now && previous.hitAt < now);
    // Every valid active-weapon hit creates a potential setup. Never trigger on
    // the same weapon twice; no stacking multipliers and no free damage tick.
    enemy.elementalComboMark = { element, weapon, until: now + markLife, hitAt: now };
    if (!activated) return { damage: amount, activated: false };
    enemy.elementalComboCooldownUntil = now + cooldown;
    const bonus = Math.min(amount * rates[element], isBoss ? 4 : 12);
    return { damage: amount + bonus, activated: true, name: names[element],
      element, bonus, bonusKnockback: element === "water" ? (isBoss ? 8 : 42) : 0,
      bonusChill: element === "frost" ? .35 : 0,
      bonusBurn: element === "fire" ? .35 : 0 };
  }
  function mark(enemy, element, weapon, now) {
    if (!enemy || enemy.dead || !groups[element]?.includes(weapon) || !Number.isFinite(now)) return;
    enemy.elementalComboMark = { element, weapon, until: now + markLife, hitAt: now };
  }
  window.triggerElementalSynergy = trigger;
  window.markElementalSynergy = mark;
  window.elementalSynergyNames = names;
})();
