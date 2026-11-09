# Browser QA

Playwright runs the real game in Chromium over a local HTTP server. The tests use the in-game Developer Mode sandbox and existing browser modules; they do not simulate a 25-minute run or change production gameplay. Node tests and browser tests remain separate.

## Setup

Use Node.js 22, then install the project-local dependency and Chromium:

```sh
npm install
npx playwright install chromium
```

## Run

```sh
npm test                 # Existing Node regression suite
npm run test:browser     # Chromium QA; starts and stops the local server
```

The browser suite can also be run headed with `npx playwright test --headed`. It serves `index.html` from `http://127.0.0.1:4173`; set `PORT` only if you also update `playwright.config.cjs`.

The isolated 2.5D visual slice is available at `http://127.0.0.1:4173/prototypes/visual-25d/` while the QA server is running. Its Chromium check runs as part of `npm run test:browser`.

The production player and all six ordinary enemy families can be previewed with the opt-in 2.5D renderer at `http://127.0.0.1:4173/?render=25d`. The normal renderer remains the default; the option is URL-only and does not change saved data or gameplay. The production world currently has no fixed arena boundary, so its existing player-centered camera is retained without edge clamping.

The experimental spatial renderer is available at `http://127.0.0.1:4173/?render=3d`. It uses the locally installed Three.js module and is a visual-only projection of existing player, enemy, projectile, and gem objects. Its continuous, subtly displaced terrain is streamed in deterministic 360-unit chunks and cached while the player moves. Remove `render=3d` to return to the unchanged Canvas renderer.

## Checks and evidence

- **Smoke:** the main menu renders; the Standard run flow starts; the Canvas has non-zero backing and visible dimensions. Saves menu and active-run screenshots.
- **Production render modes:** checks both the default renderer and `?render=25d`, including live Drifter draws, the shared world-to-screen transform, player centering while walking and dashing, and screenshots in both modes.
- **Experimental spatial 3D:** checks the real Three.js WebGL renderer, an orthographic camera at a fixed 46-degree pitch, continuous terrain chunks with height variation and bounded caching, all three element palettes, ruin/player/Drifter meshes, live water projectiles sourced from the existing weapon system, movement across chunk boundaries and back through cached terrain, dash, HUD, and Canvas fallback. Captures comparable Fire/Water/Frost environment screenshots plus dash/combat screenshots and records render timing.
- **3D characters:** checks the real player and all six ordinary enemy families at their existing LV1–LV4 ranks, distinct family silhouettes, visible rank markers/mutations, game-position tracking, walk/dash, hit feedback, and available feint/stomp/shot/burst/shield poses. Captures family/rank screenshots and measures browser frame rate plus Three.js draw time with 24 enemies.
- **Elemental 2.5D worlds:** checks Fire/Water/Frost against the existing run-element value, repeatable world tiles and ruins, distinct Canvas images, and camera following during movement and dash; captures the three themes at the same world coordinates.
- **Enemy 2.5D families:** spawns all six real enemy families at each family level derived from the existing Guardian progression, checks rendered family/level metadata and distinct Canvas pixels between LV1–LV4, saves level-by-level screenshots, and records average/P95 Canvas draw time. Also confirms the legacy renderer remains the default for all six.
- **Upgrade cards:** constructs three real upgrade choices and checks visible text/effect and identical 202×202 footprints.
- **Weapon evolution:** exercises the production eligibility function at game time zero; checks no Guardian, weapon below LV5, support below LV3, and a third eligible evolution after two are already earned.
- **Zombie Mike:** real game spawns at LV2 and LV3 reach the visible seismic warning with radii 149 and 180.
- **Burstling:** real game spawns at LV1 and LV2 detonate; verifies an explosion at both ranks and no LV1 shard versus at least one LV2 shard.
- **Mourning Shade:** the Developer Mode-spawned boss executes Phantom Execution; checks six outer hazards, the center strike, and the wider marked escape gap.
- **The Last Meme:** the Developer Mode-spawned final boss executes Broken Orbit; checks eleven outer hazards and the dangerous center.
- **Runtime errors:** each test collects uncaught page exceptions and browser console errors; any such error fails the test and is attached as JSON.

Screenshots, Playwright traces on failure, and the JSON report are written under ignored `test-results/`. The HTML report is written under ignored `playwright-report/`. Open it with `npx playwright show-report`; inspect a failure trace with `npx playwright show-trace <path-to-trace.zip>`.

## Limits

These are repeatable technical/browser checks, not human gameplay acceptance. They do not establish Normal-run difficulty, fairness under ordinary play, all three full elemental builds, FPS/P95 at 1×/3×, long-run memory, visual clarity across graphics settings, persistence/Endless behavior, or the absence of edge cases across the whole game. Keep the three recorded non-sandbox Fire/Water/Frost Normal runs in `NORMAL-RUN-QA.md` as a separate release gate.

The `?render=3d` mode is an early visual slice: the player and six ordinary enemy families have shared, procedural 3D character models and rank-based visual mutations. Animations use available movement and attack-warning state; enemies are removed from the game array immediately on death, so there is no death animation. Bosses, detailed hazards/telegraphs, several ground-based attacks, and some Canvas-only effects do not yet have 3D equivalents. The terrain is continuous, but its stylized procedural surface and elemental details are not final art. The HUD and menus remain the existing DOM interface. WebGL performance varies by device; the 24-enemy browser measurement is a stress indication, not a device-independent FPS guarantee.
