# Update 38.3 — Evolved Defenders & Formation Warfare

**19 oktober 2026 · branch** `feature/living-world-prototype` · **status: code geïmplementeerd, post-update browser-QA ONBEKEND, complete suite in GitHub Actions-wachtrij ten tijde van documentatie**.

## Herkomst: makerfeedback en echte 38.2-run

Bron: `shadow-survivor-qa-fire-1567s.json` (schema 2, `sandbox:false`, Fire / Survivor / Standard / Normal / High).

- Victory op **26:07.77**, 1.040 kills, level 25, 24 level-ups, 39 treffers, **766,96 totaal opgelopen schade**; 26 `enemy_contact`, 1 `enemy_projectile`, 5 `guardian_hazard`, 4 `guardian_projectile`, 1 `guardian_contact`, 2 `unknown`. Vóór minuut 3 geen hits.
- Weapon evolutions: `meteorRain` op 10:00 en `inferno` op 17:00; behouden als restrictie: **twee verdiende** evoluties, geen gratis level-ups.
- 30s-checkpoints: eerste 3 minuten gemiddeld 8,7 levende vijanden, 4:30–7:00 9,6, 9:00–11:30 10,8, 13:00–17:00 13 (één piek 25), 17:30–24:00 10,1. Geen massale arena meer nodig.
- Na Bell rond 12:27 kan speler vanaf ~13:00 veel HP terugwinnen. Tussen ~14:30 en ~20:30 is HP vaak maximaal terwijl er veel kills zijn; bijna alle late damage komt van **laatste minuten**. Een win is nog te comfortabel. Dat is niet te verhelpen met nóg meer anonieme HP-scaling.
- 282 performance-windows, High; die bevatten FPS-data rond 144 en kortstondige lagere samples. **Nieuwe build performance is niet gemeten**, daarom blijft populatie begrensd.

Maker wenst: (1) Beau's echte achtervolgingscharge en Shade's radiale beschieting moeilijker, (2) minder maar sterkere, werkelijk samenwerkende enemies, (3) herkenbare maar intimiderende **evoluties van iedere enemy familie** door terreinwijzigingen en verslagen Guardians: hiermee krijgen nieuwe abilities, stats en gedrag een verhaal; eerdere vormen verdwijnen uit de spawnlijst; (4) zwakke Drifter en Burstling écht laten naderen.

## Wereldlogica: drie generaties na verslagen Guardians

Nieuw `js/enemy-evolution.js`: alle zes gewone enemies krijgen **vier opeenvolgende vormen** (basis en drie mutaties). De **generatie volgt alleen het aantal verslagen gewone Guardians**, maximaal 3: na Beau generatie 1, na Mourning Shade 2, na Bell Tower 3. Na een bossfight verlaten oude vijanden de arena (bestaande isolation); **nieuwe veldspawns worden alleen van de huidige generatie gemaakt**. De bestaande elementaire terreinaantasting kan nog zichtbare biome-affinity geven, maar vervangt het vaste generatietriggerevent niet. Een eindejaars- of minutenverhoging leidt niet vanzelf tot een nieuwe mutatie.

| Basis | Na Beau | Na Shade | Na Bell | Verandering in herkenbaar Canvas-uiterlijk |
|---|---|---|---|---|
| Drifter | Riftwalker | Griefbound | Worldbreaker | Gehoornde, gebarsten achtervolger met steeds grotere klauwkroon |
| Runner | Bloodrunner | Shadowrunner | Dreadrunner | Langere jachtmessen/spoorsporen achter zijn karakteristieke driehoek |
| Zombie Mike | Iron Mike | Ruin Mike | Last Bastion | Brede kapotte schouderplaten rond het originele Mike-sprite |
| Ranged Shade | Gloom Shade | Hex Shade | Eclipse Shade | Zwevende spectrale kroon en uitsteeksels buiten de geestvorm |
| Burstling | Feral Burstling | Core Burstling | Cataclysm Burstling | Openbarstende kern en buitenste doornsterren rond de originele ster |
| Bulwark | Iron Bulwark | Oath Bulwark | Doom Bulwark | Oorlogsbanners en extra gekartelde pantserstukken, behoudt leesbaar frontshield |

Kleurstelling van generaties is op zichzelf herkenbaar en sporen blijven zichtbaar in Low-quality zonder blur: amber → paars → karmozijn. De module **tekent de mutaties rond de bestaande enemy-body** via Canvas: geen externe sprites gedownload, geen vervanging van de originele Mike-afbeelding, geen nieuwe grafische afhankelijkheden. Later kunnen echte sprite-assets in plaats van deze programmerenderingen komen.

**Stats**: evolutiegeneraties in een vaste tabel (HP ongeveer 1,35× → 1,79× → 2,32× vóór archetypes; speed 1,09× → 1,18× → 1,27×; damage 1,11× → 1,22× → 1,34×) met afwijkingen per enemy familie. Aan de voorkant krijgt de Drifter meer basis HP/speed, de Burstling **2× de oude eigen HP-factor** (`0.7` → `1.4`) en 1.4× startspeed (was 1.25), rangafhankelijke explosieradius. Hun explosie moet nog steeds écht binnen radius raken. Na het zichtbaar waarschuwen blijft een Burstling tijdelijk naderen tot hij binnen explosiebereik is en stopt dan. Easy krijgt slechts 52% van de positieve mutatie-verschillen.

**Tijd-scaled HP/speed**: Drifter/generieke HP `32 + growthTime*0.02` ipv `20+growthTime*.08`, speed `56..73+growthTime*.008` ipv `43..63+growthTime*.06`, ranged speed `40..48+growthTime*.006` ipv `34..42+growthTime*.025`. Dit zijn **kleine onderliggende progressiewaarden**, geen compleet onbeperkte onzichtbare evoluties. Overige difficulty- en Endless-scaling blijft staan.

**Abilities**: speciale counterrol `Phase Stalker` verschijnt **niet meer in ongetransformeerde (evolutionTier 0) runners**. `The Anchor`, `Phase Stalker`, `The Warden` worden pas aan gewijzigde lichamen gehangen; Drifter-Binder/Squad-rol is normaal teamgedrag, geen willekeurige magische mutatie. Burstling en Bulwark arriveren sowieso later in de vaste roster. Bestaande archetype-zwaktes blijven bestaan.

## Minder, zwaarder, meer teamwork

- Normal ambient cap **7 tot 9** (ipv 10–14), spawns per puls max 2 (ipv 4), interval 3,1→2,4s (ipv 2,6→1,65s). Boss-isolation en bestaande mondiale 30-enemy hardcap blijven.
- Echt gespawnde patrols/volle waves hebben maximaal **3–4 gespecialiseerde leden** (ipv maximaal 5) maar een stevige HP-verhoging (patrol nu 2,55×–3,4× vóór andere systemen, wave ~2,05×–2,8×); geen extra onzichtbare horde.
- Swarm iedere vierde wave nu **10–15 sterkere leden** ipv 26–42 zwakke schietschijven; type blijft vroege Drifter/Runner, maar nu met echt contactpotentieel. Eigen wavecap 24.
- De bestaande tactische gezelschappen blijven **werkelijk linked**: guard schermt crossfire-snijder af; binder-timing activeert pouncer-ram; crusher zorgt voor druk; volatile creërt flanks. Nieuw: na mutatie kiezen Drifter en Burstling bij actieve ploeg een **verschillende werkelijke aanloophoek/offset** naar de speler (geen fake HP aura of onzichtbare schade), zolang geen bestaande speciaal aangevuurde tactic voorrang heeft.
- Minder kills betekent minder XP; daarom een oplopende XP-factor bij **werkelijk gedode** geëvolueerde vijanden, ook bij ongetransformeerd Normal iets hoger om early 5-level weapon progress te behouden. Geen free XP, level of tier.

## Hardere, nog steeds leerbare Guardians

**Beau:** zijn signature `HUNTING GROUNDS` gaat nu van 3 naar **4 op elkaar gerichte rushes**, sneller (`835+50*phase`), langer (`0.66s`), dichter op elkaar, langer accuratesse getekende `610px` charge lane, grotere daadwerkelijke trails/hits, elke rush een nieuwe vergrendelde voorspelde positie. Zijn gewone charge krijgt daarnaast `505` speed ipv `360` en `0.55s` ipv `0.42s`. Geen instant hits of teleports.

**Mourning Shade:** signature `SHADOW COLLAPSE` is nu drie opeenvolgende **18/21/24-projectielrondes** (één per ronde uitgezonderd voor de roterende veilige opening), aanzienlijk sneller, kleinere en variabele opening, zonder het hele scherm willekeurig onzichtbaar onontwijkbaar te raken. **Groene corridor-randen** tekenen dezelfde skiprichting. Ook de oude fallback radiale salvo's zijn smaller in de exit-gap en sneller. De overige Shade-ultimates blijven bestaan en onveranderd.

## Technisch en acceptatie

- Source edits: `js/enemy-evolution.js` (nieuw), `js/enemies.js`, `js/game.js`, `js/render.js`, `js/encounter-pacing.js`, `js/enemy-counter-roles.js`, `js/beau-encounter.js`, `js/shade-encounter.js`, `index.html` cacheversies.
- Nieuwe regressies: `tests/update-38-3-evolved-defenders.test.cjs` test families, stage trigger, idempotentie, Easy, samenwerking, Canvas draw en boss/squad aanpassingen. Oude tijd- en horde-tests geactualiseerd naar het nieuwe ontwerp. **Alle aangepaste JS is op syntax gecompileerd**, maar de volledige Node CI bleef op `queued` hangen op moment van schrijven. **Geen GREEN claim voor nieuwe HEAD**.
- Maker acceptance ONBEKEND: test Water/Frost/Fire Standard Normal, XP voor 10:00/17:00, 3–4 specialistisch linkende vijanden i.p.v. oneindige horde, FPS/P95 High vooral 3×, Burstling moet contact kunnen maken, Drifter moet zichtbaar dichterbij komen; boss telegraphs en collision moeten kloppen; nieuwe sprite-overlays moeten leesbaar zijn in Low en High. Geen release GO totdat echte browserruns beschikbaar zijn.

**Volgende:** maker speelt tegen deze generatie, controleert nadrukkelijk of drie distinct mutaties per familie te onderscheiden zijn en welke twee vijandrollen nu de meeste aandacht nodig hebben. Dan volledige Update 39 triple-run acceptance.
