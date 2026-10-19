# Update 38.4 — Cohort Evolution: wereldfase ≠ vijandlevel

**19 oktober 2026 · branch:** `feature/living-world-prototype`

**Besluit van maker:** vóór uitgebreide graphic design-uitwerking moet de evolutie-architectuur twee onafhankelijke lagen hebben.

## Regel 1 — Een soort begint op LV1 en groeit na iedere volgende Guardian-dood

- **Soortcohort** = eerste hoofdstuk waarin het type beschikbaar is. Het is niet de daadwerkelijke willekeurige frame van de eerste spawn. Dat is belangrijk: een soort die toevallig later door RNG verschijnt, mag niet ineens een ander level krijgen.
- **Soortlevel:** `1 + max(0, gewoneGuardiansVerslagen - debuutGuardianIndex)`, begrensd op 4.
- **Wereldfase:** `1 + min(3, gewoneGuardiansVerslagen)`, bij **alle** vijanden gelijk. Deze bestuurt de overkoepelende dreigende sfeer. Het type, wapen, terrein-element en de wereld-affiniteit kunnen verder hun eigen subtiele accenten houden.
- **Geen level-4 nieuwkomer**: een familie wordt uitsluitend level 4 als haar cohort daadwerkelijk drie opeenvolgende Guardian-overwinningen heeft doorgemaakt. Gewoon veel speeltijd of een hoog wereld-era geeft haar geen gratis levels.
- **Bestaande levende vijanden** worden tijdens bossfight uit de arena gehaald door reeds bestaande isolatie; als de ronde hervat wordt verschijnen vers geëvolueerde leden. Dit spaart een onzichtbare mutatie midden in een gevecht.

## Startrooster en vijf scenario's

| Moment | Drifter + Runner (cohort 0) | Ranged Shade + Zombie Mike (cohort 1) | Burstling + Bulwark (cohort 2) | Visuele wereldstijl |
|---|---|---|---|---|
| Start, geen boss verslagen | LV1 | Vergrendeld | Vergrendeld | Era 1 |
| Na Beau (1e boss) | LV2 | Nieuwe **LV1** | Vergrendeld | Era 2 bij iedereen |
| Na Mourning Shade (2e boss) | LV3 | LV2 | Nieuwe **LV1** | Era 3 bij iedereen |
| Na Bell Tower (3e boss) | LV4 | LV3 | LV2 | Era 4 bij iedereen |
| Endless + één extra gewone boss | LV4 (cap) | LV4 | LV3 | Era 4 (visuele cap) |

`Ranged Shade` komt pas na zowel tijd 180s als Beau, `Zombie Mike` pas na zowel 360s als Beau; `Burstling` pas na zowel 540s als Mourning Shade, `Bulwark` pas na zowel 720s als Mourning Shade. Een vertraagde bossfight stelt hun debuut ook uit, in plaats van een premature verschijning. Sandbox kan de roosterpreview apart forceren.

## Regel 2 — Eén wereldstijl, verschillende level-identiteit

**Voorbeeld wereldfase 3:** de LV3 Drifter, LV2 Ranged Shade en LV1 Burstling dragen allemaal de paarse/dreigende *wereldfase-3* kroon, randen en accentkleur. Maar de Drifter heeft zijn oude herkenbare lichaam met de mutaties die bij het doorlopen van **twee** soort-evoluties horen. De Burstling is qua *vormfase* nog de eerste variant van zijn soort en heeft dus nog **niet** de specifieke mutatie van zijn level 2. Elke vijand draagt boven het lichaam 1, 2, 3 of 4 kleine lichte levelpips (ook zichtbaar in Low Quality).

**Daarom pas later in designfase:** specifieke sprite-ontwerpen per familylevel hoeven niet één-op-één te lijken op de visuele wereldfase. Maak straks een afzonderlijke stijllaag voor omgevingsbedreiging die over alle families kan, en per familie maximaal vier daadwerkelijke levensfasen. Nieuwe klasse moet *intimiderend, maar herkenbaar eerste variant* kunnen zijn.

## Gebouwd

- `js/enemy-evolution.js`: vaste family-debuutboss data, `evolutionLevel` (1–4), `worldThreatTier` (0–3), `evolutionBirthBoss`, en aparte wereldtier-/familietierfuncties. HP, snelheid, explosieradius, verhoogde XP en counter-abilities volgen **familietier**. VFX volgen **wereldtier**; 1–4 levelpips volgen familietier.
- `js/enemy-progression.js`: vrijschakeling door **zowel tijd als aantal verslagen Guardians**. Eén bron voor ambient, squads, defense, encounter plannen en developer preview. Boss-vertraagde unlock-notificaties verschijnen alsnog precies eenmaal.
- `js/game.js`: getter voor actuele werkelijk verslagen bosses; geen replay/refresh gevoelig alternatief zoals walltime.
- `js/enemies.js`: na elke Guardian meldt game dat veterans evolueren terwijl nieuwe soorten LV1 het veld betreden.
- `tests/update-38-3-evolved-defenders.test.cjs`: bestaande global-tier tests omgezet naar correcte cohort/tier matrices, inclusief kleur, een vs twee levelpips en Endless cap. Nieuw `tests/update-38-4-cohort-evolution.test.cjs`: familie-uitgestelde tijdrooster, echte bossfight-gating, mix van tiers na 2e boss, late unlock notificaties, previewisolatie en integratie.

**Verificatie:** V8/JS syntaxchecks voor aangepaste modules en gesimuleerde live-/spawnlogica met hoofdinterpreter: bij 0 kills `[0,1]` en levels `[1,1]`; bij 1 kill `[0,1,4,2]` en levels `[2,2,1,1]`; bij 2 kills alle 6 families met levels `[3,3,2,2,1,1]`; bij 3 kills alle 6 families met levels `[4,4,3,3,2,2]`. LV1 Burstling renders ook in de latere wereldfase en heeft één pip; LV3 Drifter in dezelfde fase heeft drie. **Dit is geen volledige GitHub CI of menselijke browser-/balanstest**. Die gates blijven open.

**Toekomstig design:** verfijn 24 verschillende familie-level-silhouetten pas nadat alle tierovergangen technisch geaccepteerd zijn. Niet 24 verschillende vijandsoorten; zes families, elk 4 vormen, getekend in 4 gedeelde wereldstijlen.
