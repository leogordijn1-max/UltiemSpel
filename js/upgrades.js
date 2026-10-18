// Shared catalog drives weapon selection, upgrade choices, and the encyclopedia.
const weaponCatalog = [
  { key: "arcane", name: "Arcane Bolt", image: "", description: "Automatically fires bolts at nearby enemies.", damage: "14 per bolt", cooldown: "0.95s", evolution: "Level 5 + Phantom Shots level 3 + one boss defeated → Split Dimension" },
  { key: "orbit", name: "Spirit Blades", image: "", description: "Blades orbit the player, damaging enemies and intercepting hostile shots.", damage: "38 on contact", cooldown: "Continuous", evolution: "Level 5 + Ward Blades level 3 + one boss defeated → Aegis Ring" },
  { key: "bomb", name: "Eiad Bom", image: "img/EiadBom.png", description: "Drops a delayed bomb that deals heavy area damage.", damage: "85 base; reduced vs bosses", cooldown: "12s", evolution: "Level 5 + Emmer Mayo level 3 + one boss defeated → Mega Eiad" },
  { key: "chain", name: "Chain Lightning", image: "", description: "Lightning jumps between enemies within a shorter range.", damage: "31 base", cooldown: "~5.6s", evolution: "Level 5 + Emmer Mayo level 3 + one boss defeated → Tempest" },
  { key: "boomerang", name: "Boomerang", image: "", description: "A returning blade pierces enemies on its outbound and return path.", damage: "36 base", cooldown: "5.5s", evolution: "Level 5 + Phantom Shots level 3 + one boss defeated → Returning Storm" },
  { key: "flame", name: "Flame Cone", image: "", description: "A close-range cone burns groups of enemies and applies damage over time.", damage: "55 base + burn", cooldown: "4.45s", evolution: "Level 5 + Emmer Mayo level 3 + one boss defeated → Inferno" },
  { key: "frost", name: "Frost Orb", image: "", description: "One homing orb detonates on impact, slowing nearby enemies without piercing.", damage: "28–44 direct + light AoE", cooldown: "3.92s → 3.20s", evolution: "Level 5 + Critical Force level 3 + one boss defeated → Glacier" },
  { key: "fireball", name: "Fireball", image: "", description: "Explosive fire projectile; evolution rains extra burning meteors.", damage: "28–64 + burn", cooldown: "3.4–2.6s", evolution: "Level 5 + Critical Eye level 3 + one boss defeated → Meteor Rain" },
  { key: "flameOrbit", name: "Flame Orbit", image: "", description: "Close-range fire orbs; evolution surrounds you with an inner and outer halo.", damage: "14–30 on contact", cooldown: "Continuous", evolution: "Level 5 + Vitality level 3 + one boss defeated → Solar Crown" },
  { key: "waterBolt", name: "Water Bolt", image: "", description: "A fast piercing water lance that drenches enemies and leaves pools.", damage: "20–44", cooldown: "1.4–1.0s", evolution: "Level 5 + Rapid Casting level 3 + one boss defeated → Riptide Lance" },
  { key: "tidalWave", name: "Tidal Wave", image: "", description: "A moving crescent wave that sweeps enemies away and floods its path.", damage: "25–57", cooldown: "5.6–4.4s", evolution: "Level 5 + Heavy Impact level 3 + one boss defeated → Tsunami" },
  { key: "whirlpool", name: "Whirlpool", image: "", description: "A vortex that pulls enemies in and floods the earth.", damage: "7–15 per tick", cooldown: "9–7s", evolution: "Level 5 + Soul Magnet level 3 + one boss defeated → Maelstrom" },
  { key: "iceShards", name: "Ice Shards", image: "", description: "Piercing ice darts; evolution shatters into additional fragments.", damage: "17–33 per shard", cooldown: "2.5–1.8s", evolution: "Level 5 + Critical Force level 3 + one boss defeated → Crystal Storm" },
  { key: "glacialPulse", name: "Glacial Pulse", image: "", description: "Freezing circular pulse; evolution repeats with a deep-freeze blast.", damage: "24–52", cooldown: "6.5–5.3s", evolution: "Level 5 + Vitality level 3 + one boss defeated → Absolute Zero" },
  { key: "nova", name: "Death Pulse", image: "", description: "Releases a damaging circular shockwave; evolves into a double-pulse eclipse.", damage: "34–70 base by level", cooldown: "2.9s → 1.95s", evolution: "Level 5 + Expanding Aura level 3 + one boss defeated → Eclipse" },
];

const opts = [
  ["arcane", "Arcane Bolt", "Fire additional bolts. Works with Phantom Shots."],
  ["orbit", "Spirit Blades", "Add an orbiting blade that damages enemies and can intercept shots."],
  ["bomb", "Eiad Bom", "Increase Eiad Bom damage and blast radius. Damage is reduced against bosses. Cooldown: 12 seconds."],
  ["chain", "Chain Lightning", "Lightning hits up to 2 + half your level in nearby targets. Attacks faster, but chains over a shorter range."],
  ["boomerang", "Boomerang", "A returning blade pierces enemies along its path."],
  ["flame", "Flame Cone", "Blast a wide close-range cone and burn enemies for extra damage."],
  ["frost", "Frost Orb", "One homing orb chills a wider area with each level and fires slightly faster."],
  ["fireball", "Fireball", "Explode a targeted fireball and apply a burning effect."],
  ["flameOrbit", "Flame Orbit", "Add stronger orbiting fire orbs that burn nearby enemies."],
  ["waterBolt", "Water Bolt", "Pierce enemies with a high-speed lance and leave soaked ground behind."],
  ["tidalWave", "Tidal Wave", "Send an expanding moving wave that sweeps crowds away."],
  ["whirlpool", "Whirlpool", "Pull enemies into a damaging rotating vortex."],
  ["iceShards", "Ice Shards", "Shoot several piercing ice shards that slow enemies."],
  ["glacialPulse", "Glacial Pulse", "Freeze a circle of enemies around your character."],
  ["nova", "Death Pulse", "Strengthen the expanding pulse: more damage and shorter cooldown with each level."],
  ["damage", "Emmer Mayo", "Increase damage dealt by every weapon by 18% per level."],
  ["speed", "Quickstep", "Move and dash 10% faster per level; levels 3–5 also grant a small dodge chance."],
  ["rate", "Rapid Casting", "Reduce weapon cooldowns by 10% per level, stacking multiplicatively."],
  ["magnet", "Soul Magnet", "Increase pickup reach by 55 per level; levels 3–5 also grant up to 15% more XP."],
  ["critChance", "Critical Eye", "Increase critical chance by 5 points per level; levels 3–5 also add 5% critical damage per level."],
  ["critDamage", "Critical Force", "Increase critical hit damage by 25% per level."],
  ["knockback", "Heavy Impact", "Increase knockback by 25% per level; level 3+ briefly slows regular enemies and empowers area damage against them."],
  ["health", "Vitality", "Add 30 maximum health and regenerate 0.8 health per second per level."],
  ["pierce", "Phantom Shots", "Arcane bolts and Boomerangs pierce one additional enemy."],
  ["bladeBlock", "Ward Blades", "Spirit Blades gain 16 points of projectile block chance per level, with extra protection at levels 3–5."],
  ["bladeSize", "Titan Blades", "Increase Spirit Blade size by a steady 18% per level."],
  ["novaRange", "Expanding Aura", "Increase Death Pulse radius by a steady 18% per level."],
  ["novaSlow", "Chilling Pulse", "Slow enemies inside Death Pulse by 11 percentage points per level."],
];

const evolutionRecipes = [
  { id: "tempest", name: "Tempest", weapon: "chain", support: "damage", supportName: "Emmer Mayo", level: 5, supportLevel: 3, visual: "A storm of branching violet lightning." },
  { id: "returningStorm", name: "Returning Storm", weapon: "boomerang", support: "pierce", supportName: "Phantom Shots", level: 5, supportLevel: 3, visual: "Three teal spectral blades orbit and return." },
  { id: "inferno", name: "Inferno", weapon: "flame", support: "damage", supportName: "Emmer Mayo", level: 5, supportLevel: 3, visual: "A triple-lobed crimson flame wave." },
  { id: "glacier", name: "Glacier", weapon: "frost", support: "critDamage", supportName: "Critical Force", level: 5, supportLevel: 3, visual: "A crystalline ice nova leaves a snowflake field." },
  { id: "splitDimension", name: "Split Dimension", weapon: "arcane", support: "pierce", supportName: "Phantom Shots", level: 5, supportLevel: 3, visual: "Cyan rift bolts split into spectral shards." },
  { id: "aegisRing", name: "Aegis Ring", weapon: "orbit", support: "bladeBlock", supportName: "Ward Blades", level: 5, supportLevel: 3, visual: "A radiant cyan shield ring surrounds the player." },
  { id: "megaEiad", name: "Mega Eiad", weapon: "bomb", support: "damage", supportName: "Emmer Mayo", level: 5, supportLevel: 3, visual: "A purple-starburst blast expands from the original bomb and causes a second aftershock." },
  { id: "meteorRain", name: "Meteor Rain", weapon: "fireball", support: "critChance", supportName: "Critical Eye", level: 5, supportLevel: 3, visual: "Multiple delayed meteor impacts scatter burning craters." },
  { id: "solarCrown", name: "Solar Crown", weapon: "flameOrbit", support: "health", supportName: "Vitality", level: 5, supportLevel: 3, visual: "A blazing double ring of orbiting fireballs protects the survivor." },
  { id: "riptideLance", name: "Riptide Lance", weapon: "waterBolt", support: "rate", supportName: "Rapid Casting", level: 5, supportLevel: 3, visual: "A powerful water lance pierces additional targets and scatters spray." },
  { id: "tsunami", name: "Tsunami", weapon: "tidalWave", support: "knockback", supportName: "Heavy Impact", level: 5, supportLevel: 3, visual: "Two surging tidal fronts sweep across the battlefield." },
  { id: "maelstrom", name: "Maelstrom", weapon: "whirlpool", support: "magnet", supportName: "Soul Magnet", level: 5, supportLevel: 3, visual: "Twin giant vortices draw crowds into their centres." },
  { id: "crystalStorm", name: "Crystal Storm", weapon: "iceShards", support: "critDamage", supportName: "Critical Force", level: 5, supportLevel: 3, visual: "A hail of sharp ice fragments bursts from every impact." },
  { id: "absoluteZero", name: "Absolute Zero", weapon: "glacialPulse", support: "health", supportName: "Vitality", level: 5, supportLevel: 3, visual: "A second freezing shockwave locks regular enemies in ice." },
  { id: "eclipse", name: "Eclipse", weapon: "nova", support: "novaRange", supportName: "Expanding Aura", level: 5, supportLevel: 3, visual: "Two dark-violet shockwaves hit in quick succession, with a wider radius and a short slow." },
];

function maxUpgradeLevel(key) { return 5; }
function currentUpgradeLevel(key) {
  const rawLevel = Number(upgrades[key]) || 0;
  return Math.min(maxUpgradeLevel(key), Math.max(0, Math.floor(rawLevel)));
}
function globalDamageMultiplier() {
  const raw = 1 + (upgrades.damage || 0) * 0.18 + (typeof permanentDamageBonus === "number" ? permanentDamageBonus : 0);
  const characterBonus = typeof selectedCharacter !== "undefined" &&
    typeof characterRuntime !== "undefined" && typeof player !== "undefined" && player
    ? characterDamageMultiplier(selectedCharacter, characterRuntime, player.hp, player.maxHp) : 1;
  return raw * characterBonus;
}
function calculateBombDamage(level, damageMultiplier, evolved = false, againstBoss = false) {
  return 85 * (1 + (level - 1) * 0.2) * damageMultiplier * (evolved ? 1.25 : 1) * (againstBoss ? 0.42 : 1);
}
function makeStartingWeaponLevels(startKey) {
  return Object.fromEntries(weaponCatalog.map((weapon) => [weapon.key, weapon.key === startKey ? 1 : 0]));
}
function isWeaponKey(key) { return weaponCatalog.some((weapon) => weapon.key === key); }
function isWeaponUnlocked(key) {
  if (Array.isArray(unlockedWeapons)) return unlockedWeapons.includes(key);
  return typeof selectedWeapons !== "undefined" && selectedWeapons.includes(key);
}
function evolutionForWeapon(key) { return evolutionRecipes.find((recipe) => recipe.weapon === key); }
function weaponIsEvolved(key) {
  const recipe = evolutionForWeapon(key);
  return !!(recipe && typeof evolutions !== "undefined" && evolutions[recipe.id]);
}
function nextEvolutionTime() {
  const evolvedCount = typeof evolutions === "undefined" ? 0 : Object.values(evolutions).filter(Boolean).length;
  // Two signature evolutions per Standard run; no surprise third at 22 min.
  return [600, 1020][evolvedCount] ?? Infinity;
}
function eligibleEvolutions() {
  if (typeof bossesDefeated === "undefined" || bossesDefeated < 1 || typeof evolutions === "undefined" || (typeof time === "number" ? time : 0) < nextEvolutionTime()) return [];
  return evolutionRecipes.filter((recipe) =>
    isWeaponUnlocked(recipe.weapon) && !evolutions[recipe.id] &&
    currentUpgradeLevel(recipe.weapon) >= recipe.level && currentUpgradeLevel(recipe.support) >= recipe.supportLevel,
  );
}
function eligibleUpgrade(key) {
  const currentLevel = currentUpgradeLevel(key);
  if (currentLevel >= maxUpgradeLevel(key)) return false;
  if (isWeaponKey(key)) {
    if (!selectedWeapons.includes(key) || weaponIsEvolved(key)) return false;
    return !isWeaponUnlocked(key) ? currentLevel === 0 : true;
  }
  if ((key === "novaRange" || key === "novaSlow") && !isWeaponUnlocked("nova")) return false;
  if ((key === "bladeSize" || key === "bladeBlock") && (!isWeaponUnlocked("orbit") || weaponIsEvolved("orbit"))) return false;
  if (key === "pierce" && !["arcane", "boomerang"].some((weapon) => isWeaponUnlocked(weapon) && !weaponIsEvolved(weapon))) return false;
  return true;
}
function upgradeCategory(key) {
  return weaponCatalog.some((weapon) => weapon.key === key) ? "WEAPON" :
    ["pierce", "bladeBlock", "bladeSize", "novaRange", "novaSlow"].includes(key) ? "WEAPON SUPPORT" : "PASSIVE";
}
function upgradeImage(key) {
  if (key === "damage") return "img/EmmerMayo.png";
  if (key === "bomb") return "img/EiadBom.png";
  return weaponCatalog.find((weapon) => weapon.key === key)?.image || "";
}

function upgradeEffectAtLevel(key, value) {
  const effects = {
    damage: `${value * 18}% all-weapon damage`,
    rate: `${Math.round((1 - Math.pow(0.9, value)) * 100)}% shorter weapon cooldowns`,
    magnet: `+${value * 55} pickup reach · +${Math.max(0, value - 2) * 5}% XP`,
    critDamage: `+${value * 25}% critical damage`,
    health: `+${value * 30} max HP · +${(value * 0.8).toFixed(1)} HP/s regeneration`,
    knockback: `${value * 25}% stronger knockback${value >= 3 ? ` · briefly slows enemies` : ""}`,
    pierce: `+${value} additional Arcane Bolt pierce`,
    bladeBlock: `${Math.min(95, value * 16 + Math.max(0, value - 2) * 4)}% blade projectile block chance`,
    bladeSize: `${Math.round((1 + value * 0.18) * 100)}% Spirit Blade size`,
    novaRange: `${Math.round((1 + value * 0.18) * 100)}% Death Pulse radius`,
    novaSlow: `${value * 11}% enemy slow inside Death Pulse`,
    arcane: `${value} Arcane Bolt${value === 1 ? "" : "s"} per volley`,
    orbit: `${value} orbiting Spirit Blade${value === 1 ? "" : "s"} · ${35 + value * 3} contact damage`,
    bomb: `${Math.round((1 + (value - 1) * 0.2) * 100)}% bomb damage · ${150 + value * 24} blast radius`,
    chain: `${22 + value * 9} base lightning damage · ${2 + Math.floor(value / 2)} jumps · 600 targeting range`,
    boomerang: `${28 + value * 8} base damage${value >= 4 ? " · 2 blades" : ""}`,
    flame: `${42 + value * 13} base flame damage · ${8 + value * 5} burn DPS`,
    frost: `${24 + value * 4} base damage · ${88 + value * 12}px chill radius · ${(4.1 - value * 0.18).toFixed(2)}s cooldown · no pierce`,
    fireball: `${22 + value * 6} direct damage + explosive area and burn`,
    flameOrbit: `${12 + value * 4} contact damage per rotating fireball`,
    waterBolt: `${14 + value * 6} water damage + knockback and soak`,
    tidalWave: `${17 + value * 8} wave damage + strong knockback`,
    whirlpool: `${5 + value * 2} vortex damage per tick + pull`,
    iceShards: `${13 + value * 4} damage per ice shard + chill`,
    glacialPulse: `${17 + value * 7} area damage + slowing frost`,
    nova: `${25 + value * 9} base area damage · ${(2.9 - value * 0.19).toFixed(2)}s cooldown`,
  };
  if (key === "speed") return `${value * 10}% movement and dash speed${value >= 3 ? ` · ${Math.min(12, (value - 2) * 3)}% dodge chance` : ""}`;
  if (key === "critChance") return `${value * 5}% critical chance${value >= 3 ? ` · +${(value - 2) * 5}% critical damage` : ""}`;
  return effects[key] || "Effect improves with each level";
}

function upgradeChoiceWeight(key) {
  const levelValue = currentUpgradeLevel(key);
  let weight = isWeaponKey(key) ? 2.35 : upgradeCategory(key) === "WEAPON SUPPORT" ? 1.25 : 1.35;
  // Avoid repeatedly offering a passive the build has already invested in heavily.
  if (!isWeaponKey(key)) weight *= Math.max(0.58, 1 - levelValue * 0.09);
  // Real element loadouts never mix Flame Cone and Frost Orb. Favour the
  // supports that actually advance the player's unlocked evolution recipes.
  const supportTargets=evolutionRecipes.filter(recipe=>recipe.support===key &&
    isWeaponUnlocked(recipe.weapon) && !evolutions[recipe.id] &&
    currentUpgradeLevel(recipe.weapon)>=2 && currentUpgradeLevel(recipe.support)<recipe.supportLevel);
  if(supportTargets.length)weight*=Math.min(1.65,1.3+supportTargets.length*.15);
  if ((key === "critChance" && upgrades.critDamage) || (key === "critDamage" && upgrades.critChance)) weight *= 1.45;
  if (key === "speed" && upgrades.orbit) weight *= 1.15;
  if (key === "bladeBlock" && upgrades.orbit) weight *= 1.35;
  if (key === "knockback" && (upgrades.bomb || upgrades.nova || upgrades.flame)) weight *= 1.2;
  const recipe = evolutionForWeapon(key);
  if (recipe && currentUpgradeLevel(key) >= 3 && currentUpgradeLevel(recipe.support) < recipe.supportLevel) weight *= 1.2;
  return weight;
}

// Never grant free upgrades. Keep one useful build-progress choice available
// among the three choices when a player has committed to their weapons.
function evolutionFocusKey() {
  if(typeof evolutions!=="undefined"&&
    Object.values(evolutions).filter(Boolean).length>=2)return null;
  if(typeof selectedWeapons==="undefined"||!Array.isArray(selectedWeapons))return null;
  for(const key of selectedWeapons){
    if(!isWeaponUnlocked(key)||weaponIsEvolved(key))continue;
    const recipe=evolutionForWeapon(key);
    if(!recipe)continue;
    if(currentUpgradeLevel(key)>=recipe.level &&
      currentUpgradeLevel(recipe.support)>=recipe.supportLevel)continue;
    if(currentUpgradeLevel(key)<recipe.level && eligibleUpgrade(key))return key;
    if(currentUpgradeLevel(recipe.support)<recipe.supportLevel &&
        eligibleUpgrade(recipe.support))return recipe.support;
  }
  return null;
}
function evolutionRouteHints(key, nextLevel = currentUpgradeLevel(key)) {
  if(typeof selectedWeapons==="undefined"||!Array.isArray(selectedWeapons))return "";
  if(typeof evolutions!=="undefined"&&Object.values(evolutions).filter(Boolean).length>=2)return "";
  const routes=evolutionRecipes.filter(recipe=>!evolutions[recipe.id] &&
    selectedWeapons.includes(recipe.weapon) &&
    (recipe.weapon===key || (recipe.support===key && isWeaponUnlocked(recipe.weapon))));
  return routes.slice(0,2).map(recipe=>{
    const weaponLevel=recipe.weapon===key?nextLevel:currentUpgradeLevel(recipe.weapon);
    const supportLevel=recipe.support===key?nextLevel:currentUpgradeLevel(recipe.support);
    const weaponName=weaponCatalog.find(w=>w.key===recipe.weapon)?.name||recipe.weapon;
    const bossReady=typeof bossesDefeated==="number"&&bossesDefeated>=1;
    const clock=typeof time==="number"&&time>=nextEvolutionTime();
    const ready=weaponLevel>=recipe.level&&supportLevel>=recipe.supportLevel&&bossReady&&clock;
    return '<small class="evolution-route">'+
      (ready?"EVOLUTION READY":"EVOLUTION PATH")+' · '+weaponName+' → '+recipe.name+
      ' · Weapon '+weaponLevel+'/'+recipe.level+
      ' · '+recipe.supportName+' '+supportLevel+'/'+recipe.supportLevel+
      ' · '+(bossReady?"Boss ✓":"Boss needed")+
      ' · '+(clock?"Time ✓":"10:00 / 17:00 milestone")+'</small>';
  }).join("");
}
function elementalBuildHint(key) {
  const groups={fire:["flame","fireball","flameOrbit"],water:["waterBolt","tidalWave","whirlpool"],
    frost:["frost","iceShards","glacialPulse"]};
  const names={fire:"IGNITION",water:"UNDERTOW",frost:"SHATTER"};
  const element=Object.keys(groups).find(e=>groups[e].includes(key));
  if(!element)return "";
  const companions=groups[element].filter(w=>w!==key&&isWeaponUnlocked(w));
  return companions.length
    ? '<small class="elemental-combo-hint">'+names[element]+
      ' COMBO · Alternate with '+companions.map(w=>weaponCatalog.find(x=>x.key===w)?.name||w).join(' / ')+
      ' to trigger a small, limited elemental bonus.</small>'
    : '<small class="elemental-combo-hint">ELEMENTAL COMBO · Unlock another '+element+
      ' weapon to trigger a bonus by alternating hits.</small>';
}
function makeUpgradeChoice(option, { levels = 1, rare = false } = {}) {
  const [key, name, description] = option;
  const oldLevel = currentUpgradeLevel(key);
  const unlocking = isWeaponKey(key) && !isWeaponUnlocked(key);
  const requestedLevels = Math.max(1, Math.floor(levels));
  const newLevel = unlocking ? 1 : Math.min(maxUpgradeLevel(key), oldLevel + requestedLevels);
  const appliedLevels = newLevel - oldLevel;
  const adjustedReward = rare && !unlocking && appliedLevels < requestedLevels;
  const image = upgradeImage(key);
  const recipe = evolutionForWeapon(key);
  const status = unlocking ? "LOCKED → UNLOCKED" : oldLevel === 0 ? "AVAILABLE" : `LEVEL ${oldLevel} → ${newLevel}`;
  const evolutionHint=evolutionRouteHints(key,newLevel);
  const elementalHint=isWeaponKey(key)?elementalBuildHint(key):"";
  const button = document.createElement("button");
  button.className = "choice";
  button.innerHTML = `${image ? `<img class="choice-art" src="${image}" alt="">` : ""}<small class="choice-category">${unlocking ? "WEAPON UNLOCK" : upgradeCategory(key)}${rare ? " · BOSS REWARD" : ""} · ${status}</small><b>${name}</b><small>${unlocking ? `Unlock ${name} and activate it at level 1.` : description}</small><small>${name} — ${unlocking ? "LOCKED" : `Level ${oldLevel}`} → Level ${newLevel}${rare && !unlocking ? ` (+${appliedLevels}${adjustedReward ? "; overflow → +1 permanent point" : ""})` : ""}</small><small>${upgradeEffectAtLevel(key, newLevel)}</small>${evolutionHint}${elementalHint}`;
  button.onclick = () => {
    if (button.disabled) return;
    button.disabled = true;
    if (unlocking && !unlockedWeapons.includes(key)) {
      unlockedWeapons.push(key);
      if (typeof trackDiscovery === "function") trackDiscovery("weapons", key);
    }
    upgrades[key] = newLevel;
    window.runQaEvent?.("upgrade_chosen",{key,from:oldLevel,to:newLevel,
      bossReward:!!rare,weapon:isWeaponKey(key),unlocked:unlocking},time);
    if (key === "health") {
      const healthGain = 30 * (newLevel - oldLevel);
      player.maxHp += healthGain;
    }
    if (rare && adjustedReward) {
      const overflow = requestedLevels - appliedLevels;
      metaProgress.points += overflow;
      bossRewardPoints += overflow;
      saveMetaProgress();
    }
    finishUpgradeChoice(rare);
  };
  return button;
}

function finishUpgradeChoice(rare) {
  choiceScreenOpen = false;
  if (rare) {
    if (pendingLevelUps > 0) choices();
    else if (eligibleEvolutions().length) showEvolutionOffer(eligibleEvolutions());
    else resumeRunAfterChoice();
  } else {
    pendingLevelUps = Math.max(0, pendingLevelUps - 1);
    if (pendingLevelUps > 0) choices();
    else if (eligibleEvolutions().length) showEvolutionOffer(eligibleEvolutions());
    else resumeRunAfterChoice();
  }
}

function resumeRunAfterChoice() {
  choiceScreenOpen = false;
  paused = false;
  gameState = active ? "playing" : "main-menu";
  $("overlay").style.display = "none";
}

function finishEvolutionChoice({ rare = false, consumeLevel = true } = {}) {
  choiceScreenOpen = false;
  if (rare) {
    if (pendingLevelUps > 0) choices();
    else resumeRunAfterChoice();
    return;
  }
  if (consumeLevel) pendingLevelUps = Math.max(0, pendingLevelUps - 1);
  if (pendingLevelUps > 0) choices();
  else if (eligibleEvolutions().length) showEvolutionOffer(eligibleEvolutions());
  else resumeRunAfterChoice();
}

function showEvolutionOffer(recipes = eligibleEvolutions()) {
  if (!recipes.length) return;
  paused = true;
  choiceScreenOpen = true;
  gameState = "level-up";
  panel("EVOLUTION READY", "Your weapon and support have reached their final-form requirements.", (el) => {
    recipes.forEach((recipe) => el.append(makeEvolutionChoice(recipe, { consumeLevel: false })));
  });
}

function evolutionHudStatus() {
  const count=typeof evolutions==="undefined"?0:
    Object.values(evolutions).filter(Boolean).length;
  if(count>=2)return "EVOLUTIONS 2/2 · COMPLETED";
  const milestone=nextEvolutionTime();
  const seconds=typeof time==="number"?time:0;
  const remaining=Math.max(0,Math.ceil(milestone-seconds));
  const clock=remaining?Math.floor(remaining/60)+":"+String(remaining%60).padStart(2,"0"):"READY";
  if(typeof selectedWeapons==="undefined"||!Array.isArray(selectedWeapons))
    return "EVOLUTIONS "+count+"/2 · "+clock;
  const next=selectedWeapons
    .filter(key=>isWeaponUnlocked(key))
    .map(key=>evolutionForWeapon(key))
    .filter(recipe=>recipe&&!evolutions[recipe.id])
    .sort((a,b)=>(a.level-currentUpgradeLevel(a.weapon)+
      a.supportLevel-currentUpgradeLevel(a.support))-
      (b.level-currentUpgradeLevel(b.weapon)+
      b.supportLevel-currentUpgradeLevel(b.support)))[0];
  if(!next)return "EVOLUTIONS "+count+"/2 · "+clock;
  const own=currentUpgradeLevel(next.weapon);
  const support=currentUpgradeLevel(next.support);
  return "EVOLUTIONS "+count+"/2 · "+clock+" · "+
    (weaponCatalog.find(w=>w.key===next.weapon)?.name||next.weapon)+
    " "+own+"/5 · "+next.supportName+" "+support+"/3"+
    (typeof bossesDefeated==="number"&&bossesDefeated<1?" · BOSS NEEDED":"");
}
function offerEarnedEvolution() {
  if(typeof active==="undefined"||!active||
    typeof paused==="undefined"||paused||
    typeof choiceScreenOpen!=="undefined"&&choiceScreenOpen||
    typeof gameState!=="undefined"&&gameState!=="playing"||
    typeof pendingLevelUps!=="undefined"&&pendingLevelUps>0||
    typeof boss!=="undefined"&&boss)return false;
  const candidates=eligibleEvolutions();
  if(!candidates.length)return false;
  showEvolutionOffer(candidates);
  return true;
}
if(typeof window!=="undefined"){
  window.offerEarnedEvolution=offerEarnedEvolution;
  window.evolutionFocusKey=evolutionFocusKey;
  window.evolutionHudStatus=evolutionHudStatus;
}

function evolveWeapon(recipe, { rare = false, consumeLevel = true } = {}) {
  if (!eligibleEvolutions().some((entry) => entry.id === recipe.id)) return false;
  evolutions[recipe.id] = true;
  window.runQaEvent?.("evolution",{id:recipe.id,weapon:recipe.weapon,
    support:recipe.support,level:upgrades[recipe.weapon],
    supportLevel:upgrades[recipe.support],bossesDefeated},time);
  if (typeof trackDiscovery === "function") trackDiscovery("evolutions", recipe.id);
  if (typeof playSfx === "function") playSfx("evolution");
  evolutionFlash = { name: recipe.name, started: time, until: time + 2.4 };
  notify(`WEAPON EVOLVED · ${recipe.name}`, "evolution", 5);
  unlockAchievement("evolution", "First Evolution");
  finishEvolutionChoice({ rare, consumeLevel });
  return true;
}

function makeEvolutionChoice(recipe, { rare = false, consumeLevel = !rare } = {}) {
  const button = document.createElement("button");
  button.className = "choice evolution-choice";
  button.innerHTML = `<small class="choice-category">${rare ? "BOSS TROPHY · " : "EVOLUTION · "}WEAPON COMPLETE</small><b>${recipe.name}</b><small>${weaponCatalog.find((weapon) => weapon.key === recipe.weapon).name} becomes its final form. ${recipe.visual}</small><small>Level ${upgrades[recipe.weapon]}/5 · ${recipe.supportName} level ${upgrades[recipe.support]}/5 · Boss defeated</small>`;
  button.onclick = () => evolveWeapon(recipe, { rare, consumeLevel });
  return button;
}

function chooseWeighted(pool, amount) {
  const remaining = [...pool];
  const result = [];
  while (remaining.length && result.length < amount) {
    const weights = remaining.map(([key]) => upgradeChoiceWeight(key));
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    while (roll >= weights[index]) roll -= weights[index++];
    result.push(remaining.splice(index, 1)[0]);
  }
  return result;
}

function choices() {
  if (choiceScreenOpen || pendingLevelUps <= 0 || !active || gameState === "game-over") return;
  playSfx("level");
  paused = true;
  choiceScreenOpen = true;
  gameState = "level-up";
  const eligible = opts.filter(([key]) => eligibleUpgrade(key));
  const lockedPicks = eligible.filter(([key]) => isWeaponKey(key) && !isWeaponUnlocked(key));
  const evolutionPicks = eligibleEvolutions();
  const regularSlots = 3 - (evolutionPicks.length ? 1 : 0);
  const evolutionWeapons = new Set(evolutionPicks.map((recipe) => recipe.weapon));
  const regularPool = eligible.filter(([key]) => !evolutionWeapons.has(key));
  const pick = lockedPicks.length
    ? [lockedPicks[Math.floor(Math.random() * lockedPicks.length)], ...chooseWeighted(regularPool.filter(([key]) => !lockedPicks.some(([lockedKey]) => lockedKey === key)), regularSlots - 1)]
    : chooseWeighted(regularPool, regularSlots);
  // At least one slot may advance a selected weapon's actual recipe.
  // Locked reserve slots remain guaranteed; focus is an OFFER, not an auto-pick.
  const focusKey=evolutionFocusKey();
  const focusOption=regularPool.find(([key])=>key===focusKey);
  if(focusOption && !pick.some(([key])=>key===focusKey)){
    const replaceAt=pick.length && lockedPicks.some(([key])=>key===pick[0]?.[0]) ? 1 : 0;
    if(replaceAt<regularSlots){
      if(pick.length<regularSlots)pick.push(focusOption);
      else pick[replaceAt]=focusOption;
    }
  }
  // Keep three distinct choices whenever the eligible pool can fill the screen.
  const pickedKeys = new Set(pick.map(([key]) => key));
  if (pick.length < regularSlots) {
    for (const option of chooseWeighted(regularPool.filter(([key]) => !pickedKeys.has(key)), regularSlots - pick.length)) {
      pick.push(option);
      pickedKeys.add(option[0]);
    }
  }
  if (!pick.length && !evolutionPicks.length) {
    pendingLevelUps = 0;
    resumeRunAfterChoice();
    return;
  }
  window.runQaEvent?.("upgrade_offer",{level,options:pick.map(x=>x[0]),
    evolutions:evolutionPicks.map(r=>r.id),pendingLevelUps},time);
  panel("LEVEL " + level, "Build toward two earned evolutions. Alternate different same-element weapons to trigger small elemental combos.", (el) => {
    if (evolutionPicks.length) el.append(makeEvolutionChoice(evolutionPicks[Math.floor(Math.random() * evolutionPicks.length)]));
    pick.forEach((option) => el.append(makeUpgradeChoice(option)));
  });
}

function showBossReward() {
  const evolutionPicks = eligibleEvolutions();
  const slots = evolutionPicks.length ? 2 : 3;
  const evolutionWeapons = new Set(evolutionPicks.map((recipe) => recipe.weapon));
  const eligible = opts.filter(([key]) => eligibleUpgrade(key) && (!isWeaponKey(key) || isWeaponUnlocked(key)) && !evolutionWeapons.has(key));
  const fullValue = eligible.filter(([key]) => isWeaponKey(key) || maxUpgradeLevel(key) - Math.floor(upgrades[key] || 0) >= 2);
  const rewards = chooseWeighted(fullValue.length >= slots ? fullValue : eligible, slots);
  if (!rewards.length && !evolutionPicks.length) {
    player.hp = Math.min(player.maxHp, player.hp + 35);
    if (pendingLevelUps > 0) choices();
    else resumeRunAfterChoice();
    return;
  }
  window.runQaEvent?.("boss_reward_offer",{options:rewards.map(x=>x[0]),
    evolutions:evolutionPicks.map(r=>r.id)},time);
  paused = true;
  choiceScreenOpen = true;
  gameState = "boss-reward";
  panel("BOSS TROPHY", "Choose a reward that strengthens your build and advances your earned evolutions.", (el) => {
    if (evolutionPicks.length) el.append(makeEvolutionChoice(evolutionPicks[Math.floor(Math.random() * evolutionPicks.length)], { rare: true }));
    rewards.forEach((option) => {
      const key = option[0];
      const capacity = maxUpgradeLevel(key) - currentUpgradeLevel(key);
      const amount = isWeaponKey(key) ? 1 : Math.min(2, capacity);
      el.append(makeUpgradeChoice(option, { levels: amount, rare: true }));
    });
  });
}

function addXP(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const multiplier = typeof metaProgress !== "undefined" ? 1 + (metaProgress.xpLevel || 0) * 0.02 : 1;
  const collected = amount * multiplier;
  if (typeof runStats !== "undefined" && runStats) runStats.xpCollected += collected;
  window.runQaXp?.(collected,time);
  const previousLevel=level;
  xp += collected;
  while (xp >= needed) {
    xp -= needed;
    level++;
    needed = nextLevelXpRequirement(needed, level);
    pendingLevelUps++;
  }
  if(level>previousLevel)window.runQaEvent?.("level",{
    from:previousLevel,level,gained:level-previousLevel,needed,xp},time);
  if (pendingLevelUps > 0 && !paused) choices();
}

function bladeScale() { return 1.25 * (1 + (upgrades.bladeSize || 0) * 0.18); }
function novaRadius() { return 95 * (1 + (upgrades.novaRange || 0) * 0.18) * (evolutions.eclipse ? 1.18 : 1); }
function nextLevelXpRequirement(currentRequirement, currentLevel) {
  const growth = currentLevel < 6 ? 1.15 : currentLevel < 15 ? 1.105 : 1.085;
  return Math.floor(currentRequirement * growth + 4);
}
function weaponCooldownMultiplier() { return Math.pow(0.9, upgrades.rate || 0); }
