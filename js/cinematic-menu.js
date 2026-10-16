// Presentation-only main menu. Existing game panels and run flow stay intact.
(() => {
  const originalShowMainMenu = showMainMenu;
  const overlay = document.getElementById("overlay");
  const panelNode = document.getElementById("panel");
  let selectedRunElement = isLivingWorldElement(storageGet("shadowRunElement", "fire")) ? storageGet("shadowRunElement", "fire") : "fire";
  window.getSelectedRunElement = () => selectedRunElement;
  const savedTheme = () => storageGet("shadowVisualTheme", "friends") === "original" ? "original" : "friends";
  function renderCinematicMenu() {
    if (gameState !== "main-menu") return;
    overlay.classList.add("cinematic-overlay");
    const theme = savedTheme();
    const world = typeof getLivingWorldState === "function" ? getLivingWorldState() : {title:"UNTOUCHED",detail:"No runs recorded.",runs:0};
    panelNode.innerHTML = `
      <main class="cinematic-menu" aria-label="Main menu">
        <header class="cinematic-top"><div class="cinematic-mode" role="group" aria-label="Visual theme">
          <span>MODE</span>
          <button type="button" data-theme="original" aria-pressed="${theme === "original"}">ORIGINAL</button>
          <button type="button" data-theme="friends" aria-pressed="${theme === "friends"}">FRIENDS</button>
        </div></header>
        <section class="cinematic-content">
          <h1 class="cinematic-title">SHADOW<br>SURVIVOR</h1>
          <p class="cinematic-subtitle">A WORLD THAT REMEMBERS</p>
          <nav class="cinematic-nav" aria-label="Main menu actions">
            <button type="button" class="cinematic-primary" data-action="play">NEW RUN</button>
            <button type="button" data-action="shop">PERMANENT UPGRADES</button>
            <button type="button" data-action="records">PERSONAL RECORDS</button>
            <button type="button" data-action="settings">SETTINGS</button>
            <button type="button" data-action="achievements">ACHIEVEMENTS</button>
            <button type="button" data-action="encyclopedia">ENCYCLOPEDIA</button>
            <button type="button" data-action="collection">COLLECTION</button>
            <button type="button" data-action="controls">CONTROLS</button>
          </nav>
          <span class="cinematic-note">${world.detail} · ${world.runs} completed runs remembered. Visual theme swapping is coming later.</span>
        </section>
        <footer class="cinematic-footer"><span>SHADOW SURVIVOR · MENU PREVIEW</span><div class="cinematic-world">WORLD STATE<strong>${world.title}</strong></div></footer>
      </main>`;
    panelNode.querySelectorAll("[data-theme]").forEach(button => button.addEventListener("click", () => {
      storageSet("shadowVisualTheme", button.dataset.theme);
      renderCinematicMenu();
    }));
    const actions = {
      play: () => showRunModeSelection(),
      shop: () => showMetaShop("Stats"),
      records: () => showRecords(),
      settings: () => showSettings(false),
      achievements: () => showAchievements(),
      encyclopedia: () => showEncyclopedia(),
      collection: () => showCollection(),
      controls: () => showControlsHelp(false),
    };
    panelNode.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      overlay.classList.remove("cinematic-overlay");
      actions[button.dataset.action]?.();
    }));
  }
  function showRunModeSelection() {
    panel("SELECT RUN MODE", "Choose how your next run begins.", (parent) => {
      const modes = document.createElement("div");
      modes.className = "cinematic-run-modes";
      const standard = document.createElement("button");
      standard.innerHTML = "<strong>STANDARD RUN</strong><small>Fight through the night and defeat the final boss.</small>";
      standard.onclick = () => { menuRunMode = "standard"; showElementSelection(); };
      const endless = document.createElement("button");
      endless.innerHTML = "<strong>ENDLESS MODE</strong><small>" +
        (metaProgress.endlessUnlocked
          ? "The night never ends. See how long you can survive."
          : "Locked · Defeat the final boss in Standard Mode to unlock.") +
        "</small>";
      endless.disabled = !metaProgress.endlessUnlocked;
      endless.onclick = () => { menuRunMode = "endless"; showElementSelection(); };
      modes.append(standard, endless);
      parent.append(modes);
    });
  }
  function showElementSelection() {
    panel("CHOOSE YOUR ELEMENT", "Choose one element. Every run has three matching weapons: one starter and two level-up unlocks.", (parent) => {
      const world = window.getLivingWorldState?.();
      if (world) {
        const context = document.createElement("p");
        context.className = "cinematic-element-world-context";
        context.textContent = "CURRENT WORLD · " + world.title + " — Your choice changes your weapons, not the world itself.";
        parent.append(context);
      }
      const grid = document.createElement("div");
      grid.className = "cinematic-element-grid";
      for (const element of Object.values(livingWorldElements)) {
        const choice = document.createElement("button");
        choice.className = "cinematic-element-card element-" + element.id;
        choice.classList.toggle("selected", selectedRunElement === element.id);
        choice.setAttribute("aria-pressed", String(selectedRunElement === element.id));
        const heading = document.createElement("strong");
        heading.textContent = element.name.toUpperCase();
        const description = document.createElement("small");
        description.textContent = element.description;
        const count = document.createElement("span");
        count.className = "cinematic-element-count";
        count.textContent = "3 elemental weapons · " + (selectedRunElement === element.id ? "SELECTED" : "SELECT");
        choice.append(heading, description, count);
        choice.onclick = () => {
          selectedRunElement = element.id;
          storageSet("shadowRunElement", selectedRunElement);
          syncElementalLoadout();
          showElementSelection();
        };
        grid.append(choice);
      }
      parent.append(grid);
      const continueButton = document.createElement("button");
      continueButton.className = "cinematic-element-continue";
      continueButton.textContent = "CONTINUE · CHOOSE SURVIVOR";
      continueButton.onclick = () => { syncElementalLoadout(); showCharacterSelection(); };
      parent.append(continueButton);
    });
  }
  showMainMenu = function () {
    overlay.classList.remove("cinematic-overlay", "cinematic-submenu");
    originalShowMainMenu();
    renderCinematicMenu();
  };
  // All pre-run panels keep their existing gameplay, unlock and purchase handlers.
  // Scope the cinematic styling only to the main-menu flow.
  const originalPanel = panel;
  panel = function (title, body, buttons) {
    const menuScreen = gameState === "main-menu" && !active;
    overlay.classList.remove("cinematic-overlay");
    overlay.classList.toggle("cinematic-submenu", menuScreen);
    originalPanel(title, body, buttons);
    panelNode.classList.toggle("cinematic-shop-panel", menuScreen && title === "PERMANENT SHOP");
    panelNode.classList.toggle("cinematic-guide-panel", menuScreen && (title === "ENCYCLOPEDIA" || title === "THE COLLECTION"));
    panelNode.classList.toggle("cinematic-records-panel", menuScreen && title === "PERSONAL RECORDS");
    if (!menuScreen) return;
    // A single top-left back control is shared by all menu screens.
    const backTarget = title === "CHOOSE YOUR SURVIVOR" ? showElementSelection
      : title === "CHOOSE YOUR ELEMENT" ? showRunModeSelection
      : (title === "BUILD YOUR LOADOUT" || title === "ENDLESS · BUILD YOUR LOADOUT") ? showCharacterSelection
      : showMainMenu;
    const choices = panelNode.querySelector("#choices");
    choices?.querySelectorAll("button").forEach(button => {
      if (/^BACK(?: TO |$)/.test(button.textContent.trim())) button.remove();
    });
    const back = document.createElement("button");
    back.className = "cinematic-screen-back";
    back.type = "button";
    back.textContent = "← BACK";
    back.onclick = backTarget;
    panelNode.prepend(back);
    if (title === "PERSONAL RECORDS") {
      const choices = panelNode.querySelector("#choices");
      const sections = choices?.querySelectorAll(":scope > .records-section");
      if (sections?.length) {
        const scroller = document.createElement("div");
        scroller.className = "records-scroll-area";
        sections[0].before(scroller);
        sections.forEach(section => scroller.append(section));
      }
    }
    if (title === "SETTINGS") {
      // Temporary phase 3 development preview. Remove when boss conquests take over.
      const worldPreview = document.createElement("section");
      worldPreview.className = "cinematic-extra cinematic-world-preview";
      const current = window.getDominantWorld?.() || "frozen";
      const worldHeading = document.createElement("h2");
      worldHeading.textContent = "WORLD PREVIEW · PROTOTYPE";
      const worldDescription = document.createElement("p");
      worldDescription.textContent = "For testing the three worlds before boss conquests are built. This changes the next run's world without changing your selected element.";
      worldPreview.append(worldHeading, worldDescription);
      for (const [key, label] of [["frozen", "FROZEN"], ["burning", "BURNING"], ["flooded", "FLOODED"]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label + (current === key ? " · CURRENT" : "");
        button.setAttribute("aria-pressed", String(current === key));
        button.onclick = () => {
          if (window.previewWorldState?.(key)) showSettings(false);
        };
        worldPreview.append(button);
      }
      panelNode.querySelector("#choices")?.prepend(worldPreview);
      const settings = document.createElement("section");
      settings.className = "cinematic-extra";
      settings.innerHTML = '<h2>VISUAL THEME</h2><p>Choose the presentation theme. Character and enemy art swapping is not implemented yet.</p>';
      for (const [value, label] of [["original","ORIGINAL"],["friends","FRIENDS"]]) {
        const button = document.createElement("button");
        button.textContent = label + (savedTheme() === value ? " · SELECTED" : "");
        button.setAttribute("aria-pressed", String(savedTheme() === value));
        button.onclick = () => { storageSet("shadowVisualTheme", value); showSettings(false); };
        settings.append(button);
      }
      panelNode.querySelector("#choices")?.prepend(settings);
    }
    if (title === "CHOOSE YOUR SURVIVOR") {
      const world = typeof getLivingWorldState === "function" ? getLivingWorldState() : null;
      if (world) {
        const message = document.createElement("div");
        message.className = "cinematic-extra";
        message.textContent = "WORLD MEMORY · " + world.title + " — " + world.detail;
        panelNode.querySelector("#choices")?.prepend(message);
      }
    }
  };
  // bindMainMenu() already ran when controls.js loaded.
  renderCinematicMenu();
})();
