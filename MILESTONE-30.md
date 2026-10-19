# Milestone 30 — Original technical foundation

The original phase-30 milestone established **10 technical checks** and **6 manual release gates**, all of which must be assessed independently. Its technical baseline is executed by `node scripts/milestone-30-audit.cjs` in CI; this is **not evidence that the game is fully playable or balanced**.

The checks are: **ELEMENTS, BOSSES, EVOLUTIONS, ISOLATION, WORLD, POWERS, HUD, PERFORMANCE, VICTORY, AUTOMATION**.

The 6 manual gates remain OPEN until independently verified with real browser playtests:

1. One complete **25–30 minute** Normal run at intended difficulty.
2. All **three** elemental weapon evolutions obtainable through earned weapon LV5 + support LV3 + a Guardian (no arbitrary time/cap).
3. Four bosses: dangerous, recognizable warnings, playable at 1× and performant at higher speed.
4. Persisted world outcome, career rewards and Endless behavior after reload.
5. Real FPS/P95, long-run memory, readable menus and warning geometry.
6. **Three recorded Normal** element runs (Fire, Water, Frost) following the latest combat changes.

Latest historical playtest evidence, QA checklist and release status: [NORMAL-RUN-QA.md](NORMAL-RUN-QA.md). Current architecture and decisions: [PROJECT-KOMPAS.md](PROJECT-KOMPAS.md). Compact version history and next release gates: [ROADMAP-31-50.md](ROADMAP-31-50.md).

**Status:** technical tests must pass on current HEAD and manual browser gates remain OPEN. The upcoming update 39/40 has **NO-GO** release status until all required evidence is available. The detailed previous report is still recoverable from Git history.
