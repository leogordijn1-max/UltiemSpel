# Update 38 — All Nine Elemental Weapons & Pressure Balance

**19 oktober 2026 · Branch:** `feature/living-world-prototype`  
**Status:** alle negen matchups en Water/Frost-tuning technisch gebouwd; **maker-browseracceptatie open**.  
**Baseline CI na codewijzigingen:** [573/573 checks groen](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39256927483) vóór alleen UI-documentatieaanpassing; controleer meest recente branch-run.

## Aanleiding en constraints

- De maker wil dat **Water Bolt** (attack speed × knockback × damage) niet permanent alle vijanden uit bereik houdt, en dat **Frost Orb** niet bijna eindeloos volledige groepen uitschakelt.
- Update 37.2 werd gemaakt na een echte **26:42 Water Normal Standard Victory** met 21 hits, 333,86 damage, 369,6 healing en slechts twee hits in game-minuten 15–25. 37.2 verbeterde de vijandelijke achtervolging, aanvalskracht, offensieve Guardian-salvo's en herstelpickups. **Die correcties blijven intact**.
- Oudere Frost (28:01) en Water (26:44) runs uit Update 31 zijn bruikbare voorlopige indicaties, maar de Frost-run was **sandbox:true zonder werkelijk gebruikt developer-gereedschap**; de gewone bossreward-flow was toen daardoor afwijkend. Dat is geen eerlijke huidige Frost/Water-DPS-vergelijking.
- Eén speler kiest per run één element met **drie** bijbehorende wapens; niet alle negen tegelijk. Maximaal twee verdiende evoluties blijven op hun oorspronkelijke voorwaarden/tijdgates.

## Nieuwe concrete vijandrolmatrix

Nieuw `js/elemental-weapon-roles.js` definieert een zuiver, begrensd profiel voor **alle 9 wapens × 4 echte enemyrollen**. De tabelwaarden zijn multiplicatoren op de **daadwerkelijke damage()**, niet alleen een cosmetic label.

| Wapen | Drifter/Ranged/Burstling | Runner/Phase Stalker | Zombie Mike/Anchor | Bulwark/Warden |
|---|---:|---:|---:|---:|
| Flame Cone | 1,00× | 1,08× | 0,97× | 0,95× |
| Fireball | 1,00× | 0,94× | 1,12× | 1,05× |
| Flame Orbit | 1,00× | 1,08× | 0,98× | 1,08× |
| Water Bolt | 1,00× | 0,94× | **0,82×** | **0,86×** |
| Tidal Wave | 1,00× | **1,12×** | 0,90× | 0,95× |
| Whirlpool | 1,00× | 0,93× | 1,08× | 1,05× |
| Frost Orb | 1,00× | 1,04× | 0,90× | 0,90× |
| Ice Shards | 1,00× | 1,08× | 1,06× | 0,93× |
| Glacial Pulse | 1,00× | 1,00× | **1,12×** | 1,02× |

**Wat dit betekent:** Ieder van de negen wapens is nu neutraal in gewone content, maar krijgt twee of meer relevante voor- en nadelen in gevaarlijke samenstellingen. Dit is bewust maximaal 0,82–1,12, zodat bestaande Fire/Water/Frost-evoluties, rolkwetsbaarheden en directional shields blijven tellen. **Bossen, summons, dode vijanden, unknown weapons en burn-over-time** krijgen géén extra rolbonus. Normal/Nightmare difficulty, HP, XP, drops, collision en aantallen vijanden zijn niet gewijzigd.

### Water Bolt: alleen nog één dominante lance-hit

37.2 had al raw 14–30 schade per level, normale pierce **1** / Riptide **2**, beperkte push **75**, soak **0,65s**, minimum **1,12s** na max Rapid Casting; dat blijft. Update 38 voegt role matching toe (Water Bolt doet **18% minder tegen zware** en **14% minder tegen shielded enemies**, Runner -6%) plus **kleinere, minder frequente water-terreinsporen**: onderweg eerste op 195px i.p.v. 155px, daarna stappen 290px i.p.v. 210px, radius 54/80 i.p.v. 70/104. Op impact radius 50/76 i.p.v. 65/100.

Tidal Wave behoudt zijn bewegende, zichtbaar gerichte boog en bestaande knockback/Heavy Impact evolutie. Whirlpool behoudt zijn pulse damage en eigen pull-effect, met zwaar massaresistent gedrag van Anchor. Ze hebben dus andere nuttige functies, zonder de terugkerende Water Bolt-control te versterken.

### Frost Orb: moeilijker om vijanden permanent stil te zetten

- **Een homing orb per aanval**, eerste echte impact consumeert projectile, Phantom Shots geeft geen extra pierce, directe target krijgt geen dubbele splash-schade.
- Level 1–5 blijven **28–44 directe schade**. Groeicirkel nu **92–132px** (voorheen 100–148). Glacier geeft 1,18× radius i.p.v. 1,25× en zijn splash is 30% vs normale 22%.
- Autoaim begint tot **850px** in plaats van 1300px, homing `turnRate: 3.3` i.p.v. 4.0, bullet life 5,5 i.p.v. 7s. Een speler moet vijanden dus dichterbij laten komen voordat de control automatisch alles afhandelt.
- Cast `weaponTimers.frost` houdt rekening met **Rapid Casting time-adjustment** en handhaaft een **werkelijke minimumtijd van 2,65s** tussen orbs (ook op Rapid Casting V), zonder de cooldown van Fireball of Ice Shards te veranderen.
- Chill per target is `2,0+0,14×level` seconden (Glacier +0,5), daarna krijgt een herhaalde orb-hit binnen 4,5s slechts **55% van de normale chillduur**. Frost Orb slowt normale enemies naar **70% beweging** (voorheen Frost algemeen 48%), maar echte Guardians blijven op bestaande .78.
- Ice Shards en Glacial Pulse houden **hun eigen krachtige 48%-slow**, ook als de orb onlangs hitte; we bewaren een aparte `frostOtherUntil` naast `frostOrbChillUntil`. Geen wereldwijde nerf van alle Frost-vaardigheden.

### Andere zeven wapens en zichtbaarheid

- **Fire:** Flame Cone blijft close-range burn/runner-control, Fireball de tank-buster met Meteor Rain en Flame Orbit risicovolle close-range orbit-hits met Solar Crown.
- **Water:** Tidal Wave is gericht sweep-versus-runners, Whirlpool blijft vortex/area-damage en geen wondermiddel tegen zware ankers.
- **Frost:** Ice Shards blijft gericht pierce/fragment-systeem tegen snelle/heavy targets; Glacial Pulse houdt zijn eigen nabijheids-AoE, zware vijand-bonus en Absolute Zero tweede blast.
- `js/upgrades.js` bevat nu herkenbare Engelse weapon descriptions voor **alle negen** (sterke en zwakke matchup en eerlijkere Water/Frost tooltip). Alle resterende reguliere wapens Arcane, Blades, Bom, Chain, Boomerang en Death Pulse blijven ongewijzigd.

## Technische regressies

`tests/update-38-all-nine-weapons.test.cjs` oefent de **echte productie `damage()`** met alle 36 combinaties en kijkt of de deltas fysiek van vijand-HP afgaan. Verder worden geblokkeerde/summoned/boss/dode enemies uitgesloten, shield defense toegepast *naast* rolschade, Water Bolt pierce/recoil/terrain-ritme gecontroleerd, en Frost Orb cooldown, rerun-resistance, onderscheid van Ice/Pulse en originele evolutieregels gevalideerd. Oude Frost-testwaarden (radius, projectile turn rate, min cooldown) zijn bijgewerkt; bestaande combat-, boss-, worldsave- en performance-regressies blijven draaien.

**Grenzen:** CI bewijst uitvoerbare logica, niet de subjectieve feel, actual DPS in een complete human controlled run, of FPS bij eindgame-duizenden hits. Geen stelligheid over win-rate of hersteld boss-combat zonder nieuwe browser-run.

## Maker QA na Update 38

1. **Water · Normal · non-sandbox:** vergelijk Water Bolt level 5, Riptide, Rate 3–5 en Heavy Impact met dezelfde route als in vorige rapporten. Achtervolgen gewone vijanden nu werkelijk vaker; kan Zombie Mike dichterbij komen ondanks Water-sporen? Tidal/Whirlpool moet nog nuttig zijn. Export na afloop schema-2 QA met `hit.source`; combineer dat met persoonlijke dodge/position-feel.
2. **Frost · Normal · non-sandbox:** test Frost Orb level 1/5 en Glacier met maximaal Rapid Casting. In plaats van altijd permanent stilstand moeten normaal gespawnde runners weer tussen freeze-cycli bij je kunnen komen. Vergelijk Ice Shards/Crystal Storm en Glacial Pulse/Absolute Zero; geen achteruitgang van hun eigen slows. Check normale bossrewards én eerlijke 10:00/17:00 evoluties.
3. **Fire · Normal · non-sandbox:** speel alle drie Fire-wapens. Vooral Flame Orbit moet je dichterbij laten durven gaan zonder onbedoelde gratis onkwetsbaarheid; Fireball mag sterk tegen Anchor zijn maar niet aanvoelen als eindeloze instagib. Bosses/leesbare waarschuwingen blijven belangrijk.
4. **Drie vijandrollen vergelijken:** zoek zichtbaar minimaal één Runner/Phase Stalker, Zombie Mike/Anchor, Bulwark/Warden en een gewone Drifter. Leg per element vast of sterk/zwak herkenbaar voelt. Laat geen verschil in progressieslots of bossuitrusting doorgaan voor een bewezen weapon-DPS-effect.
5. **Acceptatie:** beoordeel na je eigen nieuwe playtests welke wapens nog te zwak/sterk zijn. Update 39 vraagt **drie gedocumenteerde complete runs**; de technische voltooiing van 38 is geen vervanging hiervoor.

**Volgende stap:** Update 39 Three Complete Normal Runs & UX Fixes. Milestone-40 release-go blijft OPEN.
