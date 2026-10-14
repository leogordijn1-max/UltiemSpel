// Menus, keyboard input, and touch controls.
const mainMenuMarkup = $("panel").innerHTML;
const achievementCatalog = [
  ["kills100", "First Blood", "Defeat 100 enemies", (p) => `${Math.min(p.totals.kills, 100)}/100`],
  ["kills1000", "Monster Hunter", "Defeat 1,000 enemies", (p) => `${Math.min(p.totals.kills, 1000)}/1,000`],
  ["survive5", "Five Minutes", "Survive for five minutes", (p) => `${Math.min(bestSurvival(p), 300)}/300 sec`],
  ["survive10", "Ten Minutes", "Survive for ten minutes", (p) => `${Math.min(bestSurvival(p), 600)}/600 sec`],
  ["boss1", "First Boss", "Defeat a boss", (p) => `${Math.min(p.totals.bosses, 1)}/1`],
  ["boss3", "Boss Hunter", "Defeat three bosses", (p) => `${Math.min(p.totals.bosses, 3)}/3`],
  ["evolution", "Evolutionary Leap", "Evolve a weapon", (p) => `${p.achievements.some((a) => a.id === "evolution") ? 1 : 0}/1`],
  ["flawless", "Untouched", "Finish a run without taking damage", (p) => `${p.achievements.some((a) => a.id === "flawless") ? 1 : 0}/1`],
];

function bestSurvival(progress) { return Math.max(0, ...progress.runs.map((run) => run.survived)); }
function backButton(parent) {
  const button = document.createElement("button");
  button.textContent = "BACK";
  button.onclick = showMainMenu;
  parent.append(button);
}
function showMainMenu() {
  $("panel").innerHTML = mainMenuMarkup;
  $("overlay").style.display = "flex";
  bindMainMenu();
}
function bindMainMenu() {
  const difficultySelect = $("difficulty");
  difficultySelect.value = menuDifficulty;
  difficultySelect.onchange = () => {
    menuDifficulty = difficultySelect.value;
    localStorage.setItem("shadowDifficulty", menuDifficulty);
  };
  configureAudio();
  $("start").onclick = showWeaponSelection;
  $("start").onpointerdown = startAudio;
  $("settingsButton").onclick = showSettings;
  $("metaShop").textContent = `PERMANENT UPGRADES · ${metaProgress.points} PTS`;
  $("metaShop").onclick = showMetaShop;
  $("recordsButton").onclick = showRecords;
  $("achievementsButton").onclick = showAchievements;
  $("encyclopediaButton").onclick = () => showEncyclopedia();
}

function showWeaponSelection() {
  panel("BUILD YOUR LOADOUT", "Choose one Start Weapon and two different Unlockable Weapons. Only the start weapon is active at level 1.", (parent) => {
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
    start.textContent = `START RUN · ${weaponCatalog.find((weapon) => weapon.key === startWeapon).name} + 2 UNLOCKS`;
    start.disabled = new Set(selectedWeapons).size !== 3;
    start.onclick = () => {
      localStorage.setItem("shadowWeapons", JSON.stringify({ startWeapon, unlockableWeapons }));
      startAudio();
      reset();
    };
    footer.append(start);
    const back = document.createElement("button");
    back.textContent = "BACK";
    back.onclick = showMainMenu;
    footer.append(back);
    parent.append(footer);
  });
}

function showSettings() {
  panel("SETTINGS", "Audio and performance options", (parent) => {
    parent.innerHTML = `<fieldset id="audioSettings"><legend>Sound settings</legend><label>Effects <input id="effectVolume" type="range" min="0" max="0.6" step="0.01"></label><label>Ambient music <input id="musicVolume" type="range" min="0" max="0.5" step="0.01"></label><label><input id="muteAudio" type="checkbox"> Mute all sound</label><label><input id="showFps" type="checkbox"> Show FPS and object counts</label></fieldset>`;
    configureAudio();
    $("showFps").checked = showFps;
    $("showFps").onchange = () => {
      showFps = $("showFps").checked;
      localStorage.setItem("shadowShowFps", showFps);
    };
    backButton(parent);
  });
}

function showMetaShop() {
  panel("PERMANENT UPGRADES", `${metaProgress.points} points available. Purchases apply next run.`, (parent) => {
    for (const [key, label, cost] of [["hpLevel", "Starting health +8", 2], ["damageLevel", "Starting damage +10%", 3]]) {
      const button = document.createElement("button");
      button.className = "choice";
      button.textContent = `${label} · ${cost} pts · Level ${metaProgress[key]}/5`;
      button.disabled = metaProgress.points < cost || metaProgress[key] >= 5;
      button.onclick = () => {
        metaProgress.points -= cost;
        metaProgress[key]++;
        saveMetaProgress();
        showMetaShop();
      };
      parent.append(button);
    }
    backButton(parent);
  });
}

function showRecords() {
  const runs = metaProgress.runs.map((run, index) => `${index + 1}. ${Math.floor(run.survived / 60)}:${String(run.survived % 60).padStart(2, "0")} · ${run.kills} kills · ${run.difficulty}`).join("<br>") || "No completed runs yet.";
  panel("PERSONAL RECORDS", `Top runs:<br>${runs}<br><br>Lifetime: ${metaProgress.totals.kills} kills · ${metaProgress.totals.bosses} bosses · ${metaProgress.totals.runs} runs`, backButton);
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
    for (const name of ["Weapons", "Upgrades", "Enemies", "Bosses"]) {
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
          : bossCatalog.map((b) => ({ name: b.name, image: b.image, text: `${b.attacks} ${b.phase} Reward: rare build upgrade.` }));
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

$("pause").onclick = () => {
  if (!active) return;
  paused = !paused;
  if (paused) panel("PAUSED", "The night waits for no one.", (parent) => {
    const resume = document.createElement("button");
    resume.textContent = "RESUME";
    resume.onclick = () => { paused = false; $("overlay").style.display = "none"; };
    parent.append(resume);
  });
  else $("overlay").style.display = "none";
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
