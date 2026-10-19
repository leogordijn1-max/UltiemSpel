# Roadmap & changelog — updates 31–50

**Status 19 October 2026:** active development on `feature/living-world-prototype`. **Not release-approved.** Automated tests, especially older assertions from the pre-evolution design, require a fresh CI pass after code changes. Human Normal pressure acceptance remains OPEN.

## Concise milestone history

| Update | What it delivered |
|---|---|
| 1–30 | Playable Canvas roguelike, four Guardians, weapon upgrades/evolutions, a persistent world, run/meta progression and original MVP gate. |
| 31 | Early Frost/Water player QA, baseline strength, warning readability. |
| 32–32.1 | Normal encounter/health-pressure balancing and movement fixes. |
| 33–34 | Separate Beau/Shade/Bell/Meme secondary Guardian attacks. |
| 35 | More meaningful counterplay for heavyweight, shield and dash enemy roles. |
| 36–36.1 | FPS/QA schema 2 and Water Bolt/Frost/guardian attack tuning. |
| 37–37.2 | Save v4, permanent world restoration, Endless idempotence, and stronger survivability pressure. |
| 38–38.2 | 9×4 weapon matchups, Normal mastery, constant (bounded) waves and unique boss attack geometry. |
| 38.3–38.4 | Six enemy families, three post-Guardian mutation steps; world-era appearance separate from per-family debut rank. |
| **Current combat & UX polish** | Deterministic family-level ability escalation, stronger moving Burstlings, scarier Meme orbit and Shade gaps, simple equal-height cards, readable HUD, unrestricted earned weapon evolution, concise docs. **Pending human QA.** |
| **39** | Three recorded non-sandbox complete Fire/Water/Frost Normal runs, UX/pattern corrections from evidence. **OPEN.** |
| **40** | Release gate: gameplay difficulty, mechanics, world save, fairness, crash-free runs, performance and accessible menus. **NO-GO until human sign-off.** |
| **41–50** | Stylized 2.5D look (not pixel art), retaining top-down 2D gameplay; only after the mechanics are validated. |

## What remains deliberately open

1. **Combat:** Normal novice shouldn't casually win first runs; waves must continue to threaten after full weapon builds; evolved skills must be recognizably different.
2. **Guardians:** early attacks dangerous, specials have a real narrow counter-route, Meme orbit shouldn't have a giant safe circle; warning == collider.
3. **Builds:** all available 3 elemental weapon evolutions may be earned with max weapon/support; XP balance and boss rewards remain fair.
4. **UX:** same-size scan-friendly cards, quiet HUD, no lengthy popup instructions or unreadable text.
5. **Stability:** smoke-test all combos in real Chrome at Low/High, normal/3×; check reload/persistence, boss kill count, Endless, no animation hitch, and test suite results.

**Do not mark update 39/40 DONE because Node regressions pass.** Browser runs are not simulated by unit tests. Git history holds full removed update documents if older rationale is needed.
