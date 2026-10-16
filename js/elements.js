// Living World prototype — element definitions only.
// The run chooses one element; its three weapon slots use only that element.
const livingWorldElements = Object.freeze({
  fire: Object.freeze({
    id: "fire",
    name: "Fire",
    worldState: "burning",
    description: "Fire spreads, melts frost and leaves scorched ground.",
    weapons: Object.freeze(["flame", "fireball", "flameOrbit"]),
  }),
  water: Object.freeze({
    id: "water",
    name: "Water",
    worldState: "flooded",
    description: "Water extinguishes flames and controls enemy movement.",
    weapons: Object.freeze(["waterBolt", "tidalWave", "whirlpool"]),
  }),
  frost: Object.freeze({
    id: "frost",
    name: "Frost",
    worldState: "frozen",
    description: "Frost freezes water and slows enemies.",
    weapons: Object.freeze(["frost", "iceShards", "glacialPulse"]),
  }),
});
const livingWorldWeaponPlan = Object.freeze({
  flame: { element: "fire", label: "Flame Cone", status: "existing" },
  fireball: { element: "fire", label: "Fireball", status: "prototype" },
  flameOrbit: { element: "fire", label: "Flame Orbit", status: "prototype" },
  waterBolt: { element: "water", label: "Water Bolt", status: "prototype" },
  tidalWave: { element: "water", label: "Tidal Wave", status: "prototype" },
  whirlpool: { element: "water", label: "Whirlpool", status: "prototype" },
  frost: { element: "frost", label: "Frost Orb", status: "existing" },
  iceShards: { element: "frost", label: "Ice Shards", status: "prototype" },
  glacialPulse: { element: "frost", label: "Glacial Pulse", status: "prototype" },
});
function isLivingWorldElement(value) {
  return typeof value === "string" && Object.hasOwn(livingWorldElements, value);
}

function currentLivingWorldElement() {
  const saved = storageGet("shadowRunElement", "fire");
  return isLivingWorldElement(saved) ? saved : "fire";
}
function elementalLoadout(element = currentLivingWorldElement()) {
  const available = livingWorldElements[element].weapons;
  try {
    const saved = JSON.parse(storageGet("shadowElementLoadoutsV1", "{}") || "{}");
    const ordered = Array.isArray(saved[element]) ? saved[element] : [];
    const valid = [...new Set(ordered.filter((key) => available.includes(key)))];
    return [...valid, ...available.filter((key) => !valid.includes(key))];
  } catch {
    return [...available];
  }
}
function saveElementalLoadout(element, chosen) {
  if (!isLivingWorldElement(element)) return;
  let saved = {};
  try {
    saved = JSON.parse(storageGet("shadowElementLoadoutsV1", "{}") || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
  } catch { saved = {}; }
  const available = livingWorldElements[element].weapons;
  saved[element] = [...new Set(chosen.filter((key) => available.includes(key)))];
  storageSet("shadowElementLoadoutsV1", JSON.stringify(saved));
}
