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
          <span class="cinematic-note">The world overview and visual theme swap are coming later.</span>
        </section>
        <footer class="cinematic-footer"><span>SHADOW SURVIVOR · MENU PREVIEW</span><div class="cinematic-world">WORLD STATE<strong>UNSTABLE</strong></div></footer>
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
    overlay.classList.remove("cinematic-overlay");
    originalShowMainMenu();
    renderCinematicMenu();
  };
  // bindMainMenu() already ran when controls.js loaded.
  renderCinematicMenu();
})();
