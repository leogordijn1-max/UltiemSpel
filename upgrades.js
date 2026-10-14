const opts = [
  ["arcane", "Arcane Bolt", "Fire extra straight magic bolts."],
  ["damage", "Emmer Mayo", "Increase all damage by 28%."],
  ["rate", "Rapid Casting", "Attack 13% faster."],
  [
    "health",
    "Vitality",
    "Increase maximum health by 40 and regenerate health over time.",
  ],
  ["orbit", "Spirit Blades", "Summon rotating blades around you."],
  [
    "bladeBlock",
    "Ward Blades",
    "Spirit Blades have a chance to block boss projectiles. Each level adds 15% block chance.",
  ],
  ["bladeSize", "Titan Blades", "Increase blade size by 30%."],
  ["pierce", "Phantom Shots", "Projectiles pierce additional enemies."],
  ["bomb", "Grave Bomb", "Drop a heavy bomb every 12 seconds. Its blast deals huge area damage."],
  ["nova", "Death Pulse", "Release powerful damaging shockwaves periodically."],
  ["novaRange", "Expanding Aura", "Increase Death Pulse radius by 25%."],
  [
    "novaSlow",
    "Chilling Pulse",
    "Continuously slow enemies inside Death Pulse. Stronger upgrades increase the slow.",
  ],
];
function choices() {
  paused = true;
  const pick = [...opts]
    .filter((o) => {
      const key = o[0];
      const maxLevel = key === "nova" ? 1 : 5;
      if ((upgrades[key] || 0) >= maxLevel) return false;
      if ((key === "novaRange" || key === "novaSlow") && !upgrades.nova)
        return false;
      if ((key === "bladeSize" || key === "bladeBlock") && !upgrades.orbit)
        return false;
      return true;
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  panel("LEVEL " + level, "Choose your next power", (el) =>
    pick.forEach((o) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.innerHTML = `${o[0] === "damage" ? '<img class="choice-art" src="img/EmmerMayo.png" alt="Pot mayonaise">' : ""}<b>${o[1]}</b><small>${o[2]}</small><small>Level ${(upgrades[o[0]] || 0) + 1}</small>`;
      b.onclick = () => {
        upgrades[o[0]] = (upgrades[o[0]] || 0) + 1;
        if (o[0] === "health") {
          player.maxHp += 40;
        }
        paused = false;
        $("overlay").style.display = "none";
      };
      el.append(b);
    }),
  );
}
function addXP(n) {
  xp += n;
  if (xp >= needed) {
    xp -= needed;
    needed = Math.floor(needed * 1.12 + 3.5);
    level++;
    choices();
  }
}
function bladeScale() {
  return 1.25 * Math.pow(1.3, upgrades.bladeSize || 0);
}
function novaRadius() {
  return 95 * Math.pow(1.25, upgrades.novaRange || 0);
}
