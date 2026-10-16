// Presentation-only main menu. Existing game panels and run flow stay intact.
(() => {
  const originalShowMainMenu = showMainMenu;
  const overlay = document.getElementById("overlay");
  const panelNode = document.getElementById("panel");
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
            <button type="button" data-action="endless" ${metaProgress.endlessUnlocked ? "" : "disabled title='Defeat the final boss to unlock Endless Mode'"}>ENDLESS MODE ${metaProgress.endlessUnlocked ? "" : "· LOCKED"}</button>
            <button type="button" data-action="shop">PERMANENT UPGRADES</button>
            <button type="button" data-action="records">RECORDS &amp; ACHIEVEMENTS</button>
            <button type="button" data-action="settings">SETTINGS</button>
            <button type="button" data-action="more">MORE OPTIONS</button>
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
      play: () => { menuRunMode = "standard"; showCharacterSelection(); },
      endless: () => { if (metaProgress.endlessUnlocked) { menuRunMode = "endless"; showCharacterSelection(); } },
      shop: () => showMetaShop("Stats"),
      records: () => showRecords(),
      settings: () => showSettings(false),
      more: () => showMoreOptions(),
    };
    panelNode.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
      overlay.classList.remove("cinematic-overlay");
      actions[button.dataset.action]?.();
    }));
  }
  function showMoreOptions() {
    panel("MORE OPTIONS", "Existing game features", (parent) => {
      for (const [label, callback] of [
        ["ACHIEVEMENTS", showAchievements],
        ["ENCYCLOPEDIA", () => showEncyclopedia()],
        ["COLLECTION", () => showCollection()],
        ["CONTROLS", () => showControlsHelp(false)],
      ]) {
        const button = document.createElement("button");
        button.textContent = label;
        button.onclick = callback;
        parent.append(button);
      }
      backButton(parent);
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
    if (title === "SETTINGS") {
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
