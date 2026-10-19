# Real playtest acceptance — Shadow Survivor

## Latest evidence: Frost (19 October 2026)

User's recorded Frost **Standard Normal non-sandbox**, High graphics, completed at **26:48.65** with **Victory**, 29 hits, **564.57 incoming damage**, 22 levels gained and 2961.58 XP. Five hits were `enemy_contact`, 16 were explicitly `guardian_hazard` or `guardian_projectile`, and eight were `unknown` (don't invent sources). Two evolutions observed: **Glacier** at ~12:29 and **Crystal Storm** at ~17:00. 70 `boss_secondary_attack` logs were registered, which measures execution—not whether each attack actually hit. Checkpoint FPS ranged 87–144; live verification required after the new changes. User feels ordinary enemy abilities underwhelming despite level markers, moving Burstlings harmless, Last Meme orbit easy, Shade's ground-hazard gaps exploitable, plus UI overloaded.

Earlier Fire non-sandbox run at ~26:08: Victory, 1040 kills, 39 hits, mostly enemy contact. Compared with Frost, more field hits; neither proves novice defeat probability.

## How to validate the newest changes

1. **Run settings:** Normal / Standard / no sandbox / 1× for boss, and repeat at 3× for FPS. Test each of **Fire, Water, Frost**. QA export → attach JSON. Do not label old telemetry as a fresh test.
2. **Enemy cohorts:** at 0, 1, 2 and 3 Guardian deaths, check actual family levels and era visual match. A newly spawned LV1 Burstling after Shade should look world-era 3 but only have its basic detonation, then gain the shard attack after Bell.
3. **Abilities:** compare two same-kind/same-level enemies from different squads. They should perform **identical core attacks**, regardless of elite or tactical selection. The difference in LV1→LV2→LV3 must be mechanically apparent: Mike's stomp, Shade's extra guided shots, Burstling's shard follow-ups, Bulwark's guard.
4. **Burstling:** must actually run into detonation range and often require a dash/route change; level-2+ tracking shards should be visible, finite and dodgeable; no unavoidable damage.
5. **Bosses:** check Last Meme's orbit inner/outer ring and large projectiles; Shade's phantom ground circles should leave *only the designed escape lane*, not free standing pockets. Always compare visible outlines with collision.
6. **Upgrade UI:** open every variety of regular, rare and evolution card; **identical dimensions**, short main effect, no clipped essential text at desktop dimensions. During combat, no multi-line boss instructions.
7. **Evolution:** finish weapon LV5 and support LV3 after at least one Guardian at any time—even before minute 10. Evolve all **three** selected elemental weapons if resources allow; do not auto-award.
8. **Stability:** 1×/3× FPS, P95, enemy peak, collisions, Low/High visual markers; Boss death restores normal spawns; saving and Endless remain functional.

**Release:** pending three distinct full post-change element runs; update 40 remains NO-GO until the maker signs off. Technical CI result must be checked separately.
