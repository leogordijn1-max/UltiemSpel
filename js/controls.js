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
  $("settingsButton").onclick = showSettings;
  $("metaShop").textContent = `PERMANENT UPGRADES · ${metaProgress.points} PTS`;
  $("metaShop").onclick = () => showMetaShop("Stats");
  $("recordsButton").onclick = showRecords;
  $("achievementsButton").onclick = showAchievements;
  $("encyclopediaButton").onclick = () => showEncyclopedia();
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
  const isEndless = menuRunMode === "endless" && metaProgress.endlessUnlocked;
  panel(isEndless ? "ENDLESS · BUILD YOUR LOADOUT" : "BUILD YOUR LOADOUT",
    "Choose one Start Weapon and two different Unlockable Weapons. Only the start weapon is active at level 1.", (parent) => {
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
      for (const weapon of weaponCatalog) {
        const option = document.createElement("option");
        option.value = weapon.key;
        option.textContent = weapon.name;
        const selectedElsewhere = selectedWeapons.some((key, index) => index !== slot.index && key === weapon.key);
        option.disabled = selectedElsewhere;
        option.selected = slot.key === weapon.key;
        select.append(option);
      }
      const info = document.createElement("small");
      info.textContent = slot.description;
      select.onchange = () => {
        if (slot.index === 0) startWeapon = select.value;
        else unlockableWeapons[slot.index - 1] = select.value;
        selectedWeapons = [startWeapon, ...unlockableWeapons];
        showWeaponSelection();
      };
      card.append(title, select, info);
      slots.append(card);
    });
    parent.append(slots);

    const grid = document.createElement("div");
    grid.className = "weapon-select-grid";
    for (const weapon of weaponCatalog) {
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
      storageSet("shadowWeapons", JSON.stringify({ startWeapon, unlockableWeapons }));
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

function showSettings() {
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
    backButton(parent);
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
        line.textContent = `${(run.mode || "standard").toUpperCase()} · ${run.difficulty.toUpperCase()} · ${Math.floor(run.survived / 60)}:${String(run.survived % 60).padStart(2, "0")} · ${run.kills} kills${run.victory ? " · VICTORY" : ""}`;
        top.append(line);
      }
      if (!metaProgress.runs.length) {
        const text = document.createElement("p");
        text.textContent = "No runs recorded yet.";
        top.append(text);
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

function showEncyclopedia(category = "Weapons") {
  panel("ENCYCLOPEDIA", "Field guide · values use current game definitions", (parent) => {
    const tabs = document.createElement("div");
    tabs.className = "encyclopedia-tabs";
    for (const name of ["Weapons", "Upgrades", "Enemies", "Bosses", "Characters"]) {
      const button = document.createElement("button");
      button.textContent = name;
      button.classList.toggle("selected", name === category);
      button.onclick = () => showEncyclopedia(name);
      tabs.append(button);
    }
    parent.append(tabs);
    const entries = category === "Weapons"
      ? weaponCatalog.map((w) => ({ name: w.name, image: w.image, text: `${w.description} Damage: ${w.damage}. Cooldown: ${w.cooldown}. Evolution: ${w.evolution}.` }))
      : category === "Upgrades"
        ? opts.map(([key, name, description]) => ({ name, image: upgradeImage(key), text: `${description} Max level ${maxUpgradeLevel(key)} · ${upgradeCategory(key)}.` }))
        : category === "Enemies"
          ? enemyCatalog.map((e) => ({ name: e.name, image: e.image, text: `HP ${e.hp} · damage ${e.damage} · speed ${e.speed}. ${e.ability} XP ${e.xp}.` }))
          : category === "Bosses"
            ? bossCatalog.map((b) => ({ name: b.name, image: b.image, text: `${b.attacks} ${b.phase} Reward: rare build upgrade and unique trophy on first kill.` }))
            : characterCatalog.map((ch) => ({
              name: ch.name, image: ch.image,
              text: `${ch.ability}. ${ch.description} Unlock: ${ch.unlock}. ${isCharacterUnlocked(metaProgress, ch.id) ? "UNLOCKED" : "LOCKED"}.`,
            }));
    const list = document.createElement("div");
    list.className = "encyclopedia-list";
    for (const entry of entries) {
      const card = document.createElement("article");
      card.className = "encyclopedia-card";
      card.innerHTML = `${entry.image ? `<img src="${entry.image}" alt="">` : "<span class='weapon-icon'>✦</span>"}<div><b>${entry.name}</b><small>${entry.text}</small></div>`;
      list.append(card);
    }
    parent.append(list);
    backButton(parent);
  });
}

bindMainMenu();
checkSavedAchievements();

$("pause").onclick = () => {
  if (!active || !["playing", "paused"].includes(gameState)) return;
  paused = !paused;
  if (paused) {
    gameState = "paused";
    panel("PAUSED", "The night waits for no one.", (parent) => {
    const resume = document.createElement("button");
    resume.textContent = "RESUME";
    resume.onclick = () => { paused = false; gameState = "playing"; $("overlay").style.display = "none"; };
    parent.append(resume);
    });
  } else { gameState = "playing"; $("overlay").style.display = "none"; }
};

addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  keys[event.key] = true;
  if (event.key === "Escape") {
    if (!active) showMainMenu();
    event.preventDefault();
  }
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
  if (event.key === "Shift") { event.preventDefault(); startDash(); }
  if (active && ["1", "2", "3"].includes(event.key)) { gameSpeed = Number(event.key); updateSpeedButtons(); }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (event.key.toLowerCase() === "p" && active && (!paused || $("panel").querySelector("h1")?.textContent === "PAUSED")) $("pause").click();
});
addEventListener("keyup", (event) => { keys[event.key.toLowerCase()] = false; keys[event.key] = false; });

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
