// Menus, keyboard input, and touch controls.
const mainMenuMarkup = $("panel").innerHTML;
const achievementCatalog = [
  ["kills100", "First Blood", "Defeat 100 enemies total (career)", (p) => `${Math.min(p.totals.kills, 100)}/100`],
  ["kills1000", "Monster Hunter", "Defeat 1,000 enemies total (career)", (p) => `${Math.min(p.totals.kills, 1000)}/1,000`],
  ["survive5", "Five Minutes", "Survive for five minutes in one run", (p) => `${Math.min(bestSurvival(p), 300)}/300 sec`],
  ["survive10", "Ten Minutes", "Survive for ten minutes in one run", (p) => `${Math.min(bestSurvival(p), 600)}/600 sec`],
  ["boss1", "First Boss", "Defeat one boss total (career)", (p) => `${Math.min(p.totals.bosses, 1)}/1`],
  ["boss3", "Boss Hunter", "Defeat three bosses total (career)", (p) => `${Math.min(p.totals.bosses, 3)}/3`],
  ["evolution", "Evolutionary Leap", "Evolve a weapon (career)", (p) => `${p.achievements.some((a) => a.id === "evolution") ? 1 : 0}/1`],
  ["finalVictory", "Nightbreaker", "Defeat The Last Meme in Standard Mode to unlock Endless.", (p) => `${Math.min(p.totals.wins || 0, 1)}/1`],
  ["beauTrophy", "Good Dog", "Defeat Beau de Hond to unlock the playable Beau.", (p) => `${p.bossLoot?.includes("beau") ? 1 : 0}/1`],
  ["mastery4", "Master of Arms", "Unlock four weapon masteries in the permanent shop.", (p) => `${Math.min((p.weaponMasteries || []).length, 4)}/4`],
  ["flawless", "Untouched", "Complete a five-minute run without taking damage", (p) => `${Math.min(p.bestFlawlessSurvival, 300)}/300 sec`],
];

function bestSurvival(progress) { return Math.max(0, ...progress.runs.map((run) => run.survived)); }
function backButton(parent) {
  const button = document.createElement("button");
  button.textContent = "BACK";
  button.onclick = showMainMenu;
  parent.append(button);
}
function showMainMenu() {
  window.abandonWorldRun?.();
  window.clearWorldScars?.();
  menuRunMode = "standard";
  active = false;
  paused = true;
  pendingLevelUps = 0;
  choiceScreenOpen = false;
  gameState = "main-menu";
  $("panel").innerHTML = mainMenuMarkup;
  $("overlay").style.display = "flex";
  bindMainMenu();
}
function bindMainMenu() {
  const difficultySelect = $("difficulty");
  difficultySelect.value = menuDifficulty;
  difficultySelect.onchange = () => {
    menuDifficulty = difficultySelect.value;
    storageSet("shadowDifficulty", menuDifficulty);
  };
  configureAudio();
  $("start").textContent = "STANDARD · CHOOSE YOUR WEAPONS";
  $("start").onclick = () => {
    menuRunMode = "standard";
    showCharacterSelection();
  };
  $("start").onpointerdown = startAudio;
  // A new Endless run is only selectable after the first standard victory.
  let endlessButton = $("endlessStart");
  if (!endlessButton) {
    endlessButton = document.createElement("button");
    endlessButton.id = "endlessStart";
    endlessButton.className = "endless-menu-button";
    $("start").insertAdjacentElement("afterend", endlessButton);
  }
  const canStartEndless = !!metaProgress.endlessUnlocked;
  endlessButton.disabled = !canStartEndless;
  endlessButton.textContent = canStartEndless
    ? "∞ ENDLESS MODE · NEW RUN" : "∞ ENDLESS MODE · LOCKED";
  endlessButton.title = canStartEndless
    ? "Begin a new Endless run with your selected loadout."
    : "Defeat The Last Meme in Standard Mode to unlock Endless.";
  endlessButton.onclick = () => {
    if (!metaProgress.endlessUnlocked) return;
    menuRunMode = "endless";
    showCharacterSelection();
  };
  $("settingsButton").onclick = () => showSettings(false);
  $("metaShop").textContent = `PERMANENT UPGRADES · ${metaProgress.points} PTS`;
  $("metaShop").onclick = () => showMetaShop("Stats");
  $("recordsButton").onclick = showRecords;
  $("achievementsButton").onclick = showAchievements;
  $("encyclopediaButton").onclick = () => showEncyclopedia();
  $("collectionButton").onclick = () => showCollection();
  $("controlsButton").onclick = () => showControlsHelp(false);
}

function showCharacterSelection() {
  const modeName = menuRunMode === "endless" ? "ENDLESS" : "STANDARD";
  panel("CHOOSE YOUR SURVIVOR", `Select a playable character for your ${modeName} run. Each has one unique ability and still uses exactly three weapon slots.`, (parent) => {
    const grid = document.createElement("div");
    grid.className = "character-select-grid";
    for (const character of characterCatalog) {
      const available = isCharacterUnlocked(metaProgress, character.id);
      const card = document.createElement("button");
      card.className = `character-select-card${selectedCharacter === character.id && available ? " selected" : ""}`;
      card.disabled = !available;
      const artwork = character.image
        ? `<img src="${character.image}" alt="">`
        : '<span class="character-placeholder">✦</span>';
      card.innerHTML = `${artwork}<b>${character.name}</b><small>${character.ability}</small><small>${character.description}</small><span class="character-unlock">${available ? selectedCharacter === character.id ? "✓ SELECTED" : "UNLOCKED · SELECT" : "LOCKED · " + character.unlock}</span>`;
      if (available) card.onclick = () => {
        selectedCharacter = character.id;
        storageSet("shadowCharacter", selectedCharacter);
        showCharacterSelection();
      };
      grid.append(card);
    }
    parent.append(grid);
    const footer = document.createElement("div");
    footer.className = "menu-footer";
    const next = document.createElement("button");
    next.textContent = "CONTINUE · CHOOSE YOUR WEAPONS";
    next.onclick = showWeaponSelection;
    footer.append(next);
    const back = document.createElement("button");
    back.textContent = "BACK";
    back.onclick = showMainMenu;
    footer.append(back);
    parent.append(footer);
  });
}

function showWeaponSelection() {
  const allowedKeys = livingWorldElements[currentLivingWorldElement()].weapons;
  if (selectedWeapons.length !== 3 || selectedWeapons.some((key) => !allowedKeys.includes(key))) syncElementalLoadout();
  const isEndless = menuRunMode === "endless" && metaProgress.endlessUnlocked;
  panel(isEndless ? "ENDLESS · BUILD YOUR LOADOUT" : "BUILD YOUR LOADOUT",
    "Choose the order of your three " + currentLivingWorldElement().toUpperCase() + " weapons. Your starter is active immediately; the others unlock through level-ups.", (parent) => {
    const slots = document.createElement("div");
    slots.className = "loadout-select-grid";
    const slotDefinitions = [
      { label: "START WEAPON", description: "Active from the first second.", key: startWeapon, index: 0 },
      { label: "UNLOCKABLE WEAPON 1", description: "Appears as a guaranteed level-up unlock.", key: unlockableWeapons[0], index: 1 },
      { label: "UNLOCKABLE WEAPON 2", description: "Appears as a guaranteed level-up unlock.", key: unlockableWeapons[1], index: 2 },
    ];
    slotDefinitions.forEach((slot) => {
      const card = document.createElement("label");
      card.className = "loadout-select-card";
      const title = document.createElement("b");
      title.textContent = slot.label;
      const select = document.createElement("select");
      select.setAttribute("aria-label", slot.label);
      for (const weapon of weaponCatalog.filter((weapon) => allowedKeys.includes(weapon.key))) {
        const option = document.createElement("option");
        option.value = weapon.key;
        option.textContent = weapon.name;
        option.selected = slot.key === weapon.key;
        select.append(option);
      }
      const info = document.createElement("small");
      info.textContent = slot.index === 0 ? "Choose your starter. The other two weapons unlock by leveling up." : slot.description;
      select.disabled = slot.index !== 0;
      select.onchange = () => {
        const chosen = select.value;
        const remaining = selectedWeapons.filter((key) => key !== chosen);
        selectedWeapons = [chosen, ...remaining];
        startWeapon = chosen;
        unlockableWeapons = remaining;
        saveElementalLoadout(currentLivingWorldElement(), selectedWeapons);
        showWeaponSelection();
      };
      card.append(title, select, info);
      slots.append(card);
    });
    parent.append(slots);

    const grid = document.createElement("div");
    grid.className = "weapon-select-grid";
    for (const weapon of weaponCatalog.filter((weapon) => allowedKeys.includes(weapon.key))) {
      const card = document.createElement("article");
      const roleIndex = selectedWeapons.indexOf(weapon.key);
      const role = roleIndex === 0 ? "START" : roleIndex > 0 ? `UNLOCK ${roleIndex}` : "NOT SELECTED";
      card.className = `weapon-select-card ${roleIndex >= 0 ? "selected" : ""}`;
      const art = weapon.image ? `<img src="${weapon.image}" alt="">` : "<span class='weapon-icon'>✦</span>";
      card.innerHTML = `${art}<b>${weapon.name}</b><small>${role}</small><small>${weapon.description}</small>`;
      grid.append(card);
    }
    parent.append(grid);
    const footer = document.createElement("div");
    footer.className = "menu-footer";
    const start = document.createElement("button");
    start.textContent = `START ${isEndless ? "ENDLESS" : "STANDARD"} · ${weaponCatalog.find((weapon) => weapon.key === startWeapon).name} + 2 UNLOCKS`;
    start.disabled = new Set(selectedWeapons).size !== 3;
    start.onclick = () => {
      saveElementalLoadout(currentLivingWorldElement(), selectedWeapons);
      startAudio();
      reset();
    };
    footer.append(start);
    const back = document.createElement("button");
    back.textContent = "BACK";
    back.onclick = showCharacterSelection;
    footer.append(back);
    parent.append(footer);
  });
}

function showSettings(fromPause = false) {
  panel("SETTINGS", "Audio, graphics quality, and performance options", (parent) => {
    parent.innerHTML = `<fieldset id="audioSettings"><legend>Sound settings</legend><label>Effects <input id="effectVolume" type="range" min="0" max="0.6" step="0.01"></label><label>Ambient music <input id="musicVolume" type="range" min="0" max="0.5" step="0.01"></label><label><input id="muteAudio" type="checkbox"> Mute all sound</label><label><input id="showFps" type="checkbox"> Show FPS, frametime and object timings</label><label>Graphics quality <select id="graphicsQuality"><option value="low">Low · reduced glow and particles</option><option value="medium">Medium</option><option value="high">High</option></select></label></fieldset>`;
    configureAudio();
    $("showFps").checked = showFps;
    $("showFps").onchange = () => {
      showFps = $("showFps").checked;
      storageSet("shadowShowFps", showFps);
    };
    $("graphicsQuality").value = graphicsQuality;
    $("graphicsQuality").onchange = () => {
      graphicsQuality = $("graphicsQuality").value;
      storageSet("shadowGraphics", graphicsQuality);
    };
    if (fromPause) appendMenuButton(parent, "BACK TO PAUSE", showPauseMenu);
    else backButton(parent);
  });
}

function showMetaShop(category = "Stats") {
  panel("PERMANENT SHOP", `${metaProgress.points} points · Build permanent progress with stats, weapon masteries, characters and cosmetics. Achievements and boss trophies unlock extra content.`,
    (parent) => {
      const tabs = document.createElement("div");
      tabs.className = "shop-tabs";
      for (const name of ["Stats", "Weapons", "Characters", "Cosmetics"]) {
        const tab = document.createElement("button");
        tab.textContent = name.toUpperCase();
        tab.classList.toggle("selected", name === category);
        tab.onclick = () => showMetaShop(name);
        tabs.append(tab);
      }
      parent.append(tabs);
      const grid = document.createElement("div");
      grid.className = "shop-grid";
      const entries = shopEntries(category);
      for (const item of entries) {
        const state = shopEntryStatus(metaProgress, item);
        const button = document.createElement("button");
        button.className = "shop-entry";
        const eligible = state.state === "available" && metaProgress.points >= state.cost;
        const selected = item.kind === "cosmetic" && metaProgress.selectedCosmetic === item.id;
        button.disabled = state.state !== "available" && !(item.kind === "cosmetic" && state.state === "owned" && !selected);
        if (state.state === "available" && !eligible) button.disabled = true;
        let status = state.state === "available" ? `${state.cost} PTS` : state.state.toUpperCase();
        if (item.kind === "stat") status += ` · LV ${state.level}/${item.max}`;
        if (selected) status = "EQUIPPED";
        button.innerHTML = `<b>${item.name}</b><small>${item.description}</small><strong>${status}</strong>`;
        button.onclick = () => {
          if (item.kind === "cosmetic" && state.state === "owned") {
            if (equipCosmetic(metaProgress, item.id)) saveMetaProgress();
          } else if (purchaseShopEntry(metaProgress, item)) {
            if (item.kind === "mastery" && metaProgress.weaponMasteries.length >= 4) unlockAchievement("mastery4", "Master of Arms");
            if (item.kind === "cosmetic") equipCosmetic(metaProgress, item.id);
            saveMetaProgress();
          }
          showMetaShop(category);
        };
        grid.append(button);
      }
      if (category === "Characters") {
        for (const character of characterCatalog.filter((item) => item.id !== "mayoMaster" && item.id !== "survivor")) {
          const card = document.createElement("article");
          card.className = "shop-earned";
          const available = isCharacterUnlocked(metaProgress, character.id);
          card.innerHTML = `<b>${character.name}</b><small>${character.unlock}</small><strong>${available ? "UNLOCKED" : "EARN THROUGH GAMEPLAY"}</strong>`;
          grid.append(card);
        }
      }
      if (category === "Cosmetics") {
        const classic = document.createElement("button");
        classic.className = "shop-entry";
        classic.innerHTML = `<b>Classic</b><small>Original character colors.</small><strong>${metaProgress.selectedCosmetic === "classic" ? "EQUIPPED" : "OWNED · EQUIP"}</strong>`;
        classic.disabled = metaProgress.selectedCosmetic === "classic";
        classic.onclick = () => {
          equipCosmetic(metaProgress, "classic");
          saveMetaProgress();
          showMetaShop(category);
        };
        grid.prepend(classic);
      }
      parent.append(grid);
      if (category === "Stats") {
        const reset = document.createElement("button");
        reset.className = "shop-reset";
        reset.textContent = "REFUND STAT UPGRADES";
        reset.onclick = () => {
          if (!confirm("Refund all permanent stat upgrades? Your characters, masteries and cosmetics will stay unlocked.")) return;
          let refunded = 0;
          for (const stat of statShopCatalog) {
            const level = Math.max(0, Math.floor(metaProgress[stat.id] || 0));
            const receipts = metaProgress.statPurchaseCosts?.[stat.id] || [];
            // Refund what was actually paid, including legacy flat-cost upgrades.
            for (let index = 0; index < Math.min(stat.max, level); index++) {
              const legacyCost = stat.id === "hpLevel" ? 2 : stat.id === "damageLevel" ? 3 : stat.baseCost;
              refunded += Number.isFinite(receipts[index]) ? receipts[index] : legacyCost;
            }
            metaProgress[stat.id] = 0;
            if (metaProgress.statPurchaseCosts) metaProgress.statPurchaseCosts[stat.id] = [];
          }
          metaProgress.points += refunded;
          saveMetaProgress();
          showMetaShop("Stats");
        };
        parent.append(reset);
      }
      backButton(parent);
    });
}

function showRecords() {
  panel("PERSONAL RECORDS", `Lifetime: ${metaProgress.totals.kills} kills · ${metaProgress.totals.bosses} bosses · ${metaProgress.totals.runs} runs · ${metaProgress.totals.wins || 0} victories`,
    (parent) => {
      const records = metaProgress.records || emptyModeRecords();
      for (const mode of ["standard", "endless"]) {
        const section = document.createElement("section");
        section.className = "records-section";
        const heading = document.createElement("h2");
        heading.textContent = mode === "standard" ? "STANDARD" : "ENDLESS";
        section.append(heading);
        for (const difficulty of ["easy", "normal", "nightmare"]) {
          const record = normalizeModeRecord(records[mode]?.[difficulty]);
          const line = document.createElement("p");
          const formatted = `${Math.floor(record.survived / 60)}:${String(record.survived % 60).padStart(2, "0")}`;
          line.textContent = `${difficulty.toUpperCase()} · Best ${formatted} · ${record.kills} kills · ${record.bosses} bosses${mode === "standard" ? ` · ${record.wins} wins` : ""}`;
          section.append(line);
        }
        parent.append(section);
      }
      const top = document.createElement("section");
      top.className = "records-section";
      const heading = document.createElement("h2");
      heading.textContent = "TOP RUNS";
      top.append(heading);
      for (const run of metaProgress.runs.slice(0, 10)) {
        const line = document.createElement("p");
        line.textContent = `${(run.mode || "standard").toUpperCase()} · ${run.difficulty.toUpperCase()} · ${getCharacter(run.character).name} · ${Math.floor(run.survived / 60)}:${String(run.survived % 60).padStart(2, "0")} · ${run.kills} kills${run.victory ? " · VICTORY" : ""}`;
        top.append(line);
      }
      if (!metaProgress.runs.length) {
        const text = document.createElement("p");
        text.textContent = "No runs recorded yet.";
        top.append(text);
      }
      for (const run of metaProgress.runs.slice(0, 5)) {
        const details = document.createElement("details");
        details.className = "record-details";
        const summary = document.createElement("summary");
        summary.textContent = `${(run.mode || "standard").toUpperCase()} · ${run.difficulty.toUpperCase()} · ${formatGameTime(run.survived)} · ${getCharacter(run.character).name}`;
        details.append(summary);
        appendRunStatistics(details, run, { compact: true });
        top.append(details);
      }
      parent.append(top);
      backButton(parent);
    });
}

function showAchievements() {
  panel("ACHIEVEMENTS", "Progress is saved on this device.", (parent) => {
    const list = document.createElement("div");
    list.className = "encyclopedia-list";
    for (const [id, title, description, progress] of achievementCatalog) {
      const unlocked = metaProgress.achievements.some((entry) => entry.id === id);
      const card = document.createElement("article");
      card.className = `encyclopedia-card ${unlocked ? "unlocked" : "locked"}`;
      card.innerHTML = `<b>${unlocked ? "✓" : "◇"} ${title}</b><small>${description}</small><small>${progress(metaProgress)} · ${unlocked ? "UNLOCKED" : "LOCKED"}</small>`;
      list.append(card);
    }
    parent.append(list);
    backButton(parent);
  });
}

// A shared field guide keeps essential information readable, even before collection
// unlocks. Collection mode masks undiscovered entries and exposes unlock hints.
function fieldGuideEntries(category) {
  if (category === "Weapons") return weaponCatalog.map((weapon) => ({
    group: "weapons", id: weapon.key, name: weapon.name, image: weapon.image,
    text: `${weapon.description} Damage: ${weapon.damage}. Cooldown: ${weapon.cooldown}. Evolution: ${weapon.evolution}.`,
    hint: "Equip this weapon during a run.",
  }));
  if (category === "Evolutions") return evolutionRecipes.map((recipe) => ({
    group: "evolutions", id: recipe.id, name: recipe.name,
    image: weaponCatalog.find((weapon) => weapon.key === recipe.weapon)?.image || "",
    text: `${weaponCatalog.find((weapon) => weapon.key === recipe.weapon)?.name || recipe.weapon} · ${recipe.visual} Requirement: weapon level ${recipe.level}, ${recipe.supportName} level ${recipe.supportLevel}, boss defeated and evolution time milestone.`,
    hint: "Fulfill a weapon's evolution requirements during a run.",
  }));
  if (category === "Upgrades") return opts.filter(([key]) => !isWeaponKey(key)).map(([key, name, description]) => ({
    group: null, id: key, name, image: upgradeImage(key),
    text: `${description} Maximum level: ${maxUpgradeLevel(key)}. Category: ${upgradeCategory(key)}.`,
    hint: "Available as a passive upgrade.",
  }));
  if (category === "Enemies") return enemyCatalog.map((enemy, i) => ({
    group: "enemies",
    id: ["drifter", "runner", "zombieMike", "shade", "burstling", "bulwark"][i],
    name: enemy.name, image: enemy.image,
    text: `HP: ${enemy.hp}. Damage: ${enemy.damage}. Speed: ${enemy.speed}. ${enemy.ability} XP: ${enemy.xp}.`,
    hint: "Encounter this enemy in the arena.",
  }));
  if (category === "Bosses") return bossCatalog.map((boss, i) => ({
    group: "bosses", id: ["beau", "mourning", "bell", "final"][i],
    name: boss.name, image: boss.image,
    text: `${boss.attacks} ${boss.phase} Reward: unique trophy on first defeat.`,
    hint: i === 3 ? "Reach the end of Standard Mode." : "Encounter this boss during a run.",
  }));
  return characterCatalog.map((character) => ({
    group: "characters", id: character.id, name: character.name, image: character.image,
    text: `${character.ability}. ${character.description} Unlock: ${character.unlock}. ${isCharacterUnlocked(metaProgress, character.id) ? "UNLOCKED" : "LOCKED"}.`,
    hint: character.unlock,
  }));
}

function showEncyclopedia(category = "Weapons") {
  showFieldGuide(category, false);
}
function showCollection(category = "Weapons") {
  showFieldGuide(category, true);
}
function showFieldGuide(category = "Weapons", collectionMode = false) {
  const title = collectionMode ? "THE COLLECTION" : "ENCYCLOPEDIA";
  panel(title, collectionMode
    ? "Discover creatures, bosses, evolutions and playable characters. Undiscovered entries reveal hints."
    : "Field guide · Current mechanics and evolution conditions", (parent) => {
    const tabs = document.createElement("div");
    tabs.className = "encyclopedia-tabs";
    for (const name of ["Weapons", "Evolutions", "Upgrades", "Enemies", "Bosses", "Characters"]) {
      const button = document.createElement("button");
      button.textContent = name;
      button.classList.toggle("selected", name === category);
      button.onclick = () => showFieldGuide(name, collectionMode);
      tabs.append(button);
    }
    parent.append(tabs);
    const entries = fieldGuideEntries(category);
    const unlocked = (entry) => !entry.group ||
      isDiscovered(metaProgress, entry.group, entry.id) ||
      (entry.group === "characters" && isCharacterUnlocked(metaProgress, entry.id)) ||
      (entry.group === "weapons" && (selectedWeapons || []).includes(entry.id));
    if (collectionMode) {
      const discovered = entries.filter(unlocked).length;
      const progress = document.createElement("p");
      progress.className = "collection-progress";
      progress.textContent = `${discovered} / ${entries.length} discovered · ${category}`;
      parent.append(progress);
    }
    const list = document.createElement("div");
    list.className = "encyclopedia-list";
    for (const entry of entries) {
      const seen = !collectionMode || unlocked(entry);
      const card = document.createElement("article");
      card.className = `encyclopedia-card ${seen ? "collection-seen" : "collection-unseen"}`;
      if (seen && entry.image) {
        const picture = document.createElement("img");
        picture.src = entry.image;
        picture.alt = "";
        picture.loading = "lazy";
        card.append(picture);
      } else {
        const icon = document.createElement("span");
        icon.className = "weapon-icon";
        icon.textContent = seen ? "✦" : "?";
        card.append(icon);
      }
      const copy = document.createElement("div");
      const heading = document.createElement("b");
      heading.textContent = seen ? entry.name : "??? · UNKNOWN";
      const description = document.createElement("small");
      description.textContent = seen ? entry.text : entry.hint;
      copy.append(heading, description);
      card.append(copy);
      list.append(card);
    }
    parent.append(list);
    backButton(parent);
  });
}

function appendRunStatistics(parent, run, { compact = false } = {}) {
  const hasRecordedStats = run.stats && typeof run.stats === "object";
  const summary = runSummaryRows(run, weaponCatalog);
  const section = document.createElement("section");
  section.className = "run-summary";
  const heading = document.createElement("h2");
  heading.textContent = compact ? "DETAILED RUN STATS" : "YOUR RUN IN NUMBERS";
  section.append(heading);
  if (!hasRecordedStats) {
    const message = document.createElement("p");
    message.textContent = "Detailed damage stats were not recorded for this earlier run.";
    section.append(message);
    parent.append(section);
    return;
  }
  const grid = document.createElement("div");
  grid.className = "run-summary-grid";
  for (const [label, value] of summary.info) {
    const cell = document.createElement("div");
    const name = document.createElement("small");
    name.textContent = label;
    const number = document.createElement("strong");
    number.textContent = value;
    cell.append(name, number);
    grid.append(cell);
  }
  section.append(grid);
  const subtitle = document.createElement("h3");
  subtitle.textContent = "DAMAGE BY WEAPON";
  section.append(subtitle);
  const list = document.createElement("div");
  list.className = "run-damage-list";
  if (summary.damage.length) {
    for (const entry of summary.damage) {
      const line = document.createElement("div");
      const name = document.createElement("span");
      name.textContent = entry.name;
      const value = document.createElement("strong");
      value.textContent = numberForDisplay(entry.damage);
      line.append(name, value);
      list.append(line);
    }
  } else {
    const note = document.createElement("p");
    note.textContent = "No outgoing weapon damage recorded.";
    list.append(note);
  }
  section.append(list);
  parent.append(section);
}

// Called by the existing Victory/Game Over handlers, never during gameplay.
function renderRunSummaryPanel() {
  const panelNode = $("panel");
  const choicesNode = $("choices");
  if (!panelNode || !choicesNode || typeof runStats === "undefined") return;
  const holder = document.createElement("div");
  appendRunStatistics(holder, {
    survived: time, level, kills, bosses: bossesDefeated,
    evolutionCount: Object.values(evolutions).filter(Boolean).length,
    stats: runStats,
  });
  panelNode.insertBefore(holder, choicesNode);
}

bindMainMenu();
checkSavedAchievements();

// Buttons and panels created here do not reset fullscreen.
function appendMenuButton(parent, label, action, className = "") {
  const button = document.createElement("button");
  button.textContent = label;
  if (className) button.className = className;
  button.onclick = action;
  parent.append(button);
  return button;
}

function resumePausedRun() {
  if (!active || gameState !== "paused") return false;
  paused = false;
  choiceScreenOpen = false;
  gameState = "playing";
  $("overlay").style.display = "none";
  clearMovementKeys();
  return true;
}

function showPauseMenu() {
  if (!active || !["playing", "paused"].includes(gameState)) return false;
  paused = true;
  gameState = "paused";
  clearMovementKeys();
  panel("PAUSED", "Your run is safe while the game is paused.", (parent) => {
    appendMenuButton(parent, "RESUME · P", resumePausedRun);
    appendMenuButton(parent, "CURRENT BUILD", showCurrentBuild);
    appendMenuButton(parent, "CONTROLS", () => showControlsHelp(true));
    appendMenuButton(parent, "SETTINGS", () => showSettings(true));
    appendMenuButton(parent, "RESTART RUN", () => {
      if (!window.confirm("Restart this run? Unsaved run rewards will be lost.")) return;
      reset();
    }, "danger-action");
    appendMenuButton(parent, "MAIN MENU", () => {
      if (!window.confirm("Leave your current run? This run will end without completion rewards.")) return;
      showMainMenu();
    }, "danger-action");
  });
  return true;
}

function showCurrentBuild() {
  if (!active || gameState !== "paused") return;
  panel("CURRENT BUILD", `${getCharacter(selectedCharacter).name} · Level ${level} · ${formatGameTime(time)}`, (parent) => {
    const section = document.createElement("div");
    section.className = "build-details";
    const weapons = selectedWeapons.map((key) => {
      const weapon = weaponCatalog.find((w) => w.key === key);
      const evolved = evolutionRecipes.find((r) => r.weapon === key && evolutions[r.id]);
      const status = unlockedWeapons.includes(key)
        ? `Level ${currentUpgradeLevel(key)} / 5${evolved ? " · " + evolved.name + " EVOLVED" : ""}`
        : "LOCKED · unlock in a level-up";
      return [weapon?.name || key, status];
    });
    const passives = opts.filter(([key]) => !isWeaponKey(key) && currentUpgradeLevel(key) > 0)
      .map(([key, name]) => [name, `Level ${currentUpgradeLevel(key)}/${maxUpgradeLevel(key)} · ${upgradeEffectAtLevel(key, currentUpgradeLevel(key))}`]);
    for (const [heading, entries] of [["WEAPONS", weapons], ["PASSIVES", passives]]) {
      const subtitle = document.createElement("h2");
      subtitle.textContent = heading;
      section.append(subtitle);
      for (const [name, description] of entries) {
        const row = document.createElement("p");
        row.textContent = `${name} · ${description}`;
        section.append(row);
      }
      if (!entries.length) {
        const empty = document.createElement("p");
        empty.textContent = "None unlocked yet.";
        section.append(empty);
      }
    }
    parent.append(section);
    appendMenuButton(parent, "BACK TO PAUSE", showPauseMenu);
  });
}

function showControlsHelp(fromPause = false) {
  panel("CONTROLS", "Desktop-first keyboard controls", (parent) => {
    const list = document.createElement("div");
    list.className = "build-details";
    for (const [label, description] of [
      ["WASD / Arrow keys", "Move through the arena."],
      ["Shift", "Dash in the current movement direction."],
      ["P / Escape", "Pause or resume during normal gameplay."],
      ["1 / 2 / 3", "Choose simulation speed during gameplay."],
      ["F", "Toggle fullscreen without leaving your current screen."],
      ["Level-up", "Choose from three upgrades when a choice appears."],
    ]) {
      const line = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label + " — ";
      line.append(strong, document.createTextNode(description));
      list.append(line);
    }
    parent.append(list);
    appendMenuButton(parent, fromPause ? "BACK TO PAUSE" : "BACK TO MAIN MENU",
      fromPause ? showPauseMenu : showMainMenu);
  });
}

$("pause").onclick = () => {
  if (!active || !["playing", "paused"].includes(gameState)) return;
  if (gameState === "paused") resumePausedRun();
  else showPauseMenu();
};

addEventListener("keydown", (event) => {
  const editable = ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) ||
    event.target?.isContentEditable;
  if (editable) return;
  const key = event.key.toLowerCase();
  if (event.key === "Escape") {
    event.preventDefault();
    if (active && gameState === "playing") showPauseMenu();
    else if (active && gameState === "paused") resumePausedRun();
    else if (!active && gameState !== "main-menu") showMainMenu();
    return;
  }
  if (key === "f" && !event.repeat) {
    event.preventDefault();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
    return;
  }
  if (key === "p" && !event.repeat && active) {
    event.preventDefault();
    if (gameState === "playing") showPauseMenu();
    else if (gameState === "paused") resumePausedRun();
    return;
  }
  if (!active || paused || gameState !== "playing") return;
  keys[key] = true;
  keys[event.key] = true;
  if (event.key === "Shift") {
    event.preventDefault();
    if (!event.repeat) startDash();
  }
  if (["1", "2", "3"].includes(event.key)) {
    gameSpeed = Number(event.key);
    updateSpeedButtons();
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
});
addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
  keys[event.key] = false;
});

function clearMovementKeys() {
  for (const key in keys) keys[key] = false;
  touchMoveX = 0;
  touchMoveY = 0;
  $("virtualStick")?.querySelector("span")?.style.setProperty("transform", "translate(0, 0)");
}
addEventListener("blur", clearMovementKeys);
document.addEventListener("visibilitychange", () => { if (document.hidden) clearMovementKeys(); });

const stick = $("virtualStick");
if (stick) {
  let pointerId = null;
  const moveStick = (event) => {
    const bounds = stick.getBoundingClientRect();
    const radius = bounds.width * 0.34;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const scale = Math.min(1, radius / Math.max(1, Math.hypot(dx, dy)));
    touchMoveX = dx * scale / radius;
    touchMoveY = dy * scale / radius;
    stick.querySelector("span").style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
  };
  stick.addEventListener("pointerdown", (event) => { event.preventDefault(); pointerId = event.pointerId; stick.setPointerCapture(pointerId); moveStick(event); });
  stick.addEventListener("pointermove", (event) => { if (event.pointerId === pointerId) moveStick(event); });
  const releaseStick = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    touchMoveX = touchMoveY = 0;
    stick.querySelector("span").style.transform = "translate(0, 0)";
  };
  stick.addEventListener("pointerup", releaseStick);
  stick.addEventListener("pointercancel", releaseStick);
}
$("dashButton")?.addEventListener("pointerdown", (event) => { event.preventDefault(); startDash(); });
