// Living World prototype — element definitions only.
// This is a data catalog, NOT the active combat/weapon system yet.
// Existing runs and saved progression remain unchanged until integration.
const livingWorldElements = Object.freeze({
  fire: Object.freeze({
    id: "fire",
    name: "Fire",
    worldState: "burning",
    description: "Fire spreads, melts frost and leaves scorched ground.",
    weapons: Object.freeze(["flameCone", "fireball", "flameOrbit"]),
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
    weapons: Object.freeze(["frostOrb", "iceShards", "glacialPulse"]),
  }),
});
const livingWorldWeaponPlan = Object.freeze({
  flameCone: { element: "fire", label: "Flame Cone", status: "reuse-existing" },
  fireball: { element: "fire", label: "Fireball", status: "planned" },
  flameOrbit: { element: "fire", label: "Flame Orbit", status: "planned" },
  waterBolt: { element: "water", label: "Water Bolt", status: "planned" },
  tidalWave: { element: "water", label: "Tidal Wave", status: "planned" },
  whirlpool: { element: "water", label: "Whirlpool", status: "planned" },
  frostOrb: { element: "frost", label: "Frost Orb", status: "reuse-existing" },
  iceShards: { element: "frost", label: "Ice Shards", status: "planned" },
  glacialPulse: { element: "frost", label: "Glacial Pulse", status: "planned" },
});
function isLivingWorldElement(value) {
  return typeof value === "string" && Object.hasOwn(livingWorldElements, value);
}
