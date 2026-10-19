# Shadow Survivor — UltiemSpel

A desktop browser roguelike built with **HTML, CSS and Canvas JavaScript**. One evolving living world, three player elements (Fire / Water / Frost), six defender families and four Guardians.

The three three-weapon loadouts are **Fire** (Flame Cone, Fireball, Flame Orbit), **Water** (Water Bolt, Tidal Wave, Whirlpool) and **Frost** (Frost Orb, Ice Shards, Glacial Pulse).

## Start

Open `index.html` in a modern desktop browser or serve the repository locally. Select **Standard → difficulty → character → three weapons**. WASD / arrows move; **Shift** dashes; **P / Esc** pauses; **F** fullscreen; 1×/2×/3× selects speed. Pause → **Current Build** shows complete weapon stats and recipes; **Controls** shows all keys; **QA export** saves the run report.

**Main development branch:** `feature/living-world-prototype`. Do not merge to `main` until the release gates in `ROADMAP-31-50.md` are accepted.

## How a run works

1. Survive short but increasingly coordinated encounters. Most enemies are 7–9 strong individuals, 3–4-person specialist squads, not waves of hundreds.
2. Defeat Beau, Mourning Shade, Bell Tower, then The Last Meme; bosses require reading drawn attack shapes, moving and deliberately recovering HP.
3. The world advances when Guardians fall. Existing families evolve one level; new families arrive at **LV1** but share the ominous global world style. See `PROJECT-KOMPAS.md`.
4. Unlock and upgrade the three selected elemental weapons. Each evolution requires weapon LV5, support LV3 and one defeated Guardian. **No fixed 10/17-minute gate; no two-evolution cap.**
5. Victory conquers the current world, persists when browser storage permits, and unlocks Endless. Defeat leaves the old defending world intact.

## Project files

- `PROJECT-KOMPAS.md` — canonical design, mechanics and important decisions.
- `ROADMAP-31-50.md` — actual release gates and concise change history.
- `NORMAL-RUN-QA.md` — manual acceptance checklist and current playtest findings.
- `MILESTONE-30.md` — original phase-30 gate and why acceptance remains separate from automated tests.

All earlier UPDATE-XX documents were folded into these concise files. Historical full texts and individual commits remain available in the **Git history**; no gameplay code has been deleted.

## Testing

Browser gameplay is the acceptance authority. GitHub Actions runs Node tests in `tests/` on pushes, but green unit tests alone cannot validate pressure, screen readability, fairness or FPS. Record a real non-sandbox Standard Normal run for each of **Fire, Water, Frost**, export the QA JSON and add actionable findings to `NORMAL-RUN-QA.md`. Never claim a test suite passed without checking its current run.
