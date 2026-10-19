# Update 37 — Living World, save & Endless

**19 oktober 2026 · Branch:** `feature/living-world-prototype`  
**Status: CODE + geautomatiseerde flowtests GEREED; echte maker-browseracceptatie OPEN.**

## Wat is gebouwd / gerepareerd

1. **Refresh verliest geen belangrijke runhistorie meer:** `js/storage.js` migreert veilig naar **save-versie 4**. In `shadowProgress` blijven nu `runElement`, `worldBefore`, `worldAfter`, `worldImpact` en alle **negen Fire/Water/Frost-wapens** bewaard. De oude parser gooide de negen elemental-weapons weg en liet worldvelden verdwijnen zodra je de pagina ververste. Legacy saves zonder deze velden blijven veilig inlaadbaar, met `null` voor onbekende historische waarden (we verzinnen geen worldhistorie).
2. **Eén record voor Standard Victory → Endless:** de al bestaande overgang behoudt speler-HP, XP, wapens, unlocks en dezelfde run-ID. `js/progression.js` sluit een eenmaal afgerekende Endless Game Over nu expliciet af; herhaald `recordRun("defeat")` kan daardoor niet opnieuw punten/geschiedenis schrijven. `js/game.js` reset die guard alleen bij een **nieuwe** run. Standard winst/Endless-overgangen blijven één lifetime-run met één winbonus.
3. **Afwijking tussen winst en permanent opslaan zichtbaar:** de opslag wordt synchroon geprobeerd. `js/world-state.js` houdt `getWorldConquest().saved` bij (true na geslaagde save, false bij geblokkeerde localStorage, null vóór conquest). In sandbox of bij een opslagfout toont Victory nu `THIS RUN ONLY · SAVE UNAVAILABLE` in plaats van onterecht `100% PERMANENT`. Verlies zet de tijdelijk veroverde 15/50/85%-wereld terug zonder de dominante wereld op schijf aan te passen. De oorspronkelijke wereld wordt voor de run vastgehouden.
4. **Living World onthoudt nu alle 9 elementaire wapens:** `js/living-world.js` telt Fire (Flame, Fireball, Flame Orbit), Water (Water Bolt, Tidal Wave, Whirlpool) en Frost (Frost Orb, Ice Shards, Glacial Pulse) mee in de oude, aparte `shadowLivingWorldV1`-wereldsporen. Voorheen lieten Water-runs daar geen elemental-spoor achter. Oude geschiedenis blijft intact; vervuilen door een Endless-vervolg is uitgesloten.
5. **Records laat de wereldreis zien:** `js/controls.js` toont bij Top Runs nu `FROZEN → FLOODED (100%)` enzovoort, ook na een refresh. Bij oude runs zonder gedetailleerde damagestatistieken blijft het opgeslagen wereldresultaat zichtbaar.
6. **Geen gameplay-/balansnerfs in deze update:** Update 36.1 Water Bolt, Vitality en Guardian-patronen blijven ongewijzigd. Geen nieuwe spawns, willekeurige beloningen of verborgen autosaves in een actieve run. **De speler kan na een refresh een afgeleverde run terugzien; een pauzerun midden in combat hervatten is bewust NIET geclaimd of gebouwd.**

## Technische regressiebewijzen

Nieuwe `tests/update-37-world-save-endless.test.cjs` controleert met de **echte runtimefuncties**:

- Migratie van save-versie 3 naar 4, geldige Water-loadout + worldvelden behouden en ongeldige waarden veilig begrensd.
- Echte world-stages 15 → 50 → 85, daarna defeat/restoration, refresh houdt de originele verdedigende wereld en het loss-record.
- Standard Victory, eindwinst één keer, permanent bewaarde Frozen → Flooded, daarna Endless met **dezelfde record-ID** en geen dubbele afloopbeloning; verversen behoudt records en de ontgrendeling.
- Boss-trofeeën: Beau geeft bij eerste keer +2 punten; na refresh is dezelfde trofee nog aanwezig, opnieuw winnen geeft geen dubbele beloning.
- Fire/Water/Frost wapens veranderen de persistent opgeslagen sfeer van exact één run; een herhaald record schrijft niet dubbel.
- Opslagfout en Developer-sandbox: overwinningsanimatie kan afspelen, maar game beweert geen permanent opgeslagen wereld.
- Fresh reset verwijdert de Endless-terminal-guard en script-loadvolgorde blijft geldig.

GitHub Actions test ook alle bestaande boss-, world-, save-, run-, UI-, performance- en balansregressies. **559/559 tests PASS** op de implementatie vóór documentatiebijwerking: https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39249330117.

**Grenzen:** dit zijn VM/integratie- en statische tests van echte JavaScript-modules — **geen werkelijk door een mens geklikte browserrun**, geen browser-refresh-video en geen garantie dat lastige 36.1 boss-/Water-balans nu goed voelt. De menselijke browser-gate voor Update 37 blijft expliciet **OPEN**.

## Maker-hertest — zodra je tijd hebt

1. **Defeat/herstel:** start een echte Standard Normal-run in de bevroren wereld, pak 1–2 Guardian-kills (15/50%), ga dood, open Records, refresh en controleer dat de dominante wereld **FROZEN** blijft. Het opgeslagen loss-record toont `FROZEN → FROZEN (15/50%)`, en één extra lifetime-run, maar geen Standard-win of Endless-unlock. Let erop dat reeds verdiende boss-trofeeën wel blijven.
2. **Victory/permanent:** maak een Fire of Water Standard-run af, zonder Developer Mode; bij echte winst 100% **PERMANENT**, records +1 run/+1 win, wereld wordt BURNING/FLOODED. Klik Main Menu, refresh, open Records en controleer de world journey plus de drie wapenvelden. Een volgende nieuwe run start met de veroverde wereld.
3. **Endless-overgang:** maak nog een echte Standard Victory en klik **CONTINUE IN ENDLESS MODE**. Dezelfde HP, level, XP en loadout moeten doorspelen. Eerste nieuwe ordinary Guardian: Beau, volgens Endless-cyclus. Laat je vervolgens doodgaan; na refresh moet **dezelfde record-ID** zijn bijgewerkt met Endless-score, nog steeds slechts één victory/runbonus van deze campagne en wereld blijft veroverd. Herhalen van het einde mag geen dubbele punten geven.
4. **Unieke beloningen:** versla Beau opnieuw in een latere run; de bewaarde Beau-trofee en speelbare Beau blijven unlockt, maar géén tweede eerste-trofeeprijs.
5. **Optionele herstel-/privacycheck:** probeer alleen indien je dat zelf wilt een aparte lege browsercontext met Developer Sandbox; die mag geen permanente verovering of carrière-progressie schrijven. Bestaande saves niet wissen om te testen. BrowserlocalStorage kan door privacyinstellingen geblokkeerd zijn; de Victory-tekst moet dan aangeven dat opslaan niet beschikbaar is.
6. **QA-export:** bij elk cruciaal moment JSON opslaan, plus eventueel een kort screenshot van Records/wereld na refresh. Vergelijk de nieuwe Normal Water-run ook met de open 36.1-hotfix; de automatische testen stellen de gamebalans niet vast.

## Status en volgende stap

**Updates 31–40: 7/10 technisch gebouwd (31–37, plus kleinere 32.1/36.1-hotfixes), alleen Update 31 aantoonbaar live geaccepteerd.** Mijlpaal-40 release-gates blijven NO-GO. **Volgende geplande Update 38:** negen wapens en specifiek Water Bolt/Frost Orb-balans opnieuw beoordelen; echte browsermetingen van Updates 36/36.1/37 blijven nodig voordat balans-, save- of release-GO kan worden toegekend.
