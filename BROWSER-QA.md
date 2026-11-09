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

## Checks and evidence

- **Smoke:** the main menu renders; the Standard run flow starts; the Canvas has non-zero backing and visible dimensions. Saves menu and active-run screenshots.
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
