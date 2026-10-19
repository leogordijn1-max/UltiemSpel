# UPDATE 33 — Beau & The Mourning Shade: secundaire aanvallen (19 oktober 2026)

**Status:** CODE GEÏMPLEMENTEERD + CI 514/514 GROEN · **geen nieuwe handmatige browser-QA voor deze aanvallen** · release/Normal-balans blijft OPEN.  
**Actieve branch:** `feature/living-world-prototype`.

## 1. Aanleiding: makerfeedback serieus genomen

Uit echte Frost- en Water-runs: maker vindt de **eerste twee bosses ontzettend leuk, met name hun twee zwaarste aanvallen**, maar hun gewone / secundaire aanvallen mochten een stuk cooler. Bij Bell Tower en The Last Meme zijn vooral de Phase-III ultimates geliefd (Meme extra sterk); zij komen in Update 34. De maker vond Normal Water en gewone enemies te gemakkelijk; [Update 32.1](UPDATE-32-1-SURVIVAL-BALANCE.md) heeft gericht Vitality, gewone vijandenschade en Water Bolt aangepast. **De maker test die wijzigingen op een later moment opnieuw; de uitkomst daarvan is nog niet bekend.**

**Ontwerpkeuze:** de bestaande showcasekrachten van Beau (`Hunting Grounds`, `Pincer Ambush`, `The Final Hunt`), Shade (`Shadow Collapse`, `Phantom Execution`, `Eternal Eclipse`), de algemene `boss-combat.js` signatures en de grote Phase-III Guardian Arena Powers zijn **niet herschreven of afgezwakt**. Alleen de **normale projectielvolley** tussendoor heeft een duidelijker identiteit gekregen. Geen extra gewone vijanden, geen gratis loot, geen hogere boss-HP, geen tijdsprong.

## 2. Nieuwe module en vier echte aanvalspatronen

Nieuw: `js/guardian-secondary-attacks.js`, geladen na `js/boss-combat.js` en vóór de aparte Guardian-showcase-scripts.

| Boss | Nieuwe gewone aanval | Werkelijke aanvallen | Waarschuwing/counterplay |
|---|---|---|---|
| **Beau** | **FANG SWEEP** | **5** fish-projectielen als brede waaier met iets trager buitenste projectielen; **1** uitgestelde grondinslag op een duidelijk gemarkeerde flank | Beweeg/dash uit de viswaaier; de andere flank en grotere zijruimte blijven open |
| **Beau** | **PACK CROSSFIRE** | **3** gerichte fish-projectielen vanaf Beau; **2** echte flankschoten vanaf zichtbaar vooraf getekende zijposities; **1** vertraagde centruminslag | Verplaats uit de gemarkeerde centrumzone, lees de twee aangekondigde zijlijnen; niet oneerlijk op de speler spawnen |
| **Shade** | **MOURNING LANCES** | **1** snelle gerichte shadow-lance met **4** tragere projectielen aan verschillende hoeken; **1** uitgestelde grondinslag op de flank | Anticipeer op de centrale speer, beweeg langs de open achter- of zijroutes |
| **Shade** | **PHANTOM MIRRORS** | **1** directe lading van Shade + **2** echte projectielen vanaf zichtbare spiegelposities; **2** uitgestelde flankinslagen | Dubbele flanken tijdig ontwijken; midden blijft bij de grondinslagen open, maar de directe lading dwingt beweging |

- Elk van de twee Guardians **wisselt deterministisch** tussen de twee patronen bij normale salvo's. Geen willekeurige onzichtbare spam of extra spawn.
- De normale aanval heeft de bestaande `shotWarning` van ongeveer **1,05s in Phase I** of **0,95s vanaf Phase II**; de waarschuwing **volgt de voorspelde spelerpositie alleen gedurende het eerste deel** en bevriest daarna, zoals de bestaande game dat al deed.
- Vanaf het **eerste warningframe** toont het Canvas op Low én High de **echte volgende impactcirkels**, projectile-richtingen en (waar relevant) de flankschutters. Een voortgangsboog bij de boss toont hoeveel van het bestaande windupvenster verstreken is.
- Na een echte volley worden de nieuwe grondzones via de **bestaande bossHazards-queue** gemaakt. Exact dezelfde `(x,y,r)` uit `guardianSecondaryDangerPoints` wordt zowel **vooraf getekend** als **voor collision gebruikt**, met daarnaast nog **0,76 game-seconden extra waarschuwing** na het afvuren.
- Alle echte contact-, dash- en dodgebescherming en damage-multiplier blijven via de al bestaande collisioncode lopen. De markers doen zelf geen schade. Geen projectiel of grondhit mag al afgaan tijdens de nog lopende volley-warning.
- De oorsprong van een flankschot ligt **125px zijwaarts en 35px achter de boss**, niet op de spelerpositie, en wordt in de telegraph getekend. Het hoofdgevaar heeft geen onontkoombare volledige schermbedekking; de twee flankcirkels laten open routes. De exacte speelbaarheid met alle VFX/combinaties moet nog menselijk getest worden.
- Direct na het afvuren schuift de start van eventuele grotere showcase-aanval zo nodig minimaal **1,25s voorbij dit salvo**. Daarmee krijgt de speler tijd om uit de laatste grondzone te komen; de grote bossaanvallen zijn niet verwijderd of veranderd.
- Fase-overgangen annuleren een nog geplande normale aanval. Een dode Guardian kan hem evenmin uitvoeren.

## 3. Integratie in live gameplay

- `js/game.js`: na opstellen van het echte normale `shotWarning` wordt voor Beau/Shade `prepareGuardianSecondary(e,time)` aangeroepen; bij overgang naar Phase II/III wordt een ongebruikte waarschuwing geannuleerd.
- `js/enemies.js`: de bestaande `bossFire()` roept alleen voor Beau/Shade een voorbereide `fireGuardianSecondary()` aan. De oorspronkelijke standaardvolleys blijven als **fallback** wanneer er geen plan bestaat, en Bell/Meme blijven onveranderd. De daadwerkelijke projectielen gebruiken `addBossProjectile`, grondzones de bestaande `bossHazards` inclusief difficulty-schadefactor.
- `js/render.js`: `drawGuardianSecondary()` rendert duidelijke warninggeometrie in wereldcoördinaten **naast** de bestaande boss-/showcase-draw.
- `index.html`: vers script toegevoegd, cache-bust voor de gewijzigde bestanden.
- **QA:** de lokale recorder krijgt één `boss_secondary_attack`-event **per gestarte standaardvolleyaanval** (name, patroon, fase, warningduur). Het is alleen een logevent en verandert niets aan XP of gameplay.

## 4. Automatische verificatie

- **13 nieuwe regressietests** in `tests/update-33-guardian-secondary.test.cjs` (waaronder echt afwachten van het warningvenster vóór schade, voorspelbare afwisseling, echte projectile- en hazard-argumenten, marker = daadwerkelijke hitzone, meerdere veilige uitwijkposities, Phase-II/III interrupt, Low/High tekenen en productie-integratie).
- Legacytests uit Update 28 en 32/32.1 aangepast om **niet op oude cache-bust-tags te falen** wanneer dezelfde scripts een nieuwe versie krijgen. Functionele checks van de oorspronkelijke performance/health/Water-code bleven intact.
- **Laatste geslaagde code-CI:** **514/514 Node-tests PASS, 0 failures** op [GitHub Actions](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39236970668). Nieuwe documentatiecommits laten het totaal niet stijgen.
- De automatische milestone-audit van de fase 11–30 blijft TECHNICAL PASS, de **verified playable release blijft NO-GO** totdat relevante manuele browserchecks zijn gedaan.

## 5. Browserchecks voor wanneer de maker weer gaat spelen

Bij het eerstvolgende normale Beau/Shade-gevecht, zonder Developer Mode:
1. Kijk in **Phase I** of FANG SWEEP / PACK CROSSFIRE en MOURNING LANCES / PHANTOM MIRRORS echt **allebei** voorkomen. Tekenlijnen en cirkels moeten helder op Low én High zijn, maar de aanval zelf moet nog echt ontwijkbaar blijven.
2. Kijk of er tussen **bestaande, geliefde grote aanvallen** nog ruimte is om te reageren. **Geen** Phase-III arena-ultimate onder een nog actieve secundaire impact plaatsen.
3. Kijk bij beide bosses of verplaatsen **na lock** wel een gemarkeerde inslag ontwijkt. Dodgen en dash-i-frames blijven werken; een ongetekende cirkel of instant-groundhit is een blocker.
4. Controleer het risico met **1×/2×/3× game speed**: de hele warning duurt even lang in gameseconden. Op 3× kan het subjectief kort lijken; voer een eerlijkheidstest op 1× uit.
5. Exporteer de QA JSON: naast de vroegere `boss_spawn/phase/defeated` events hoort `boss_secondary_attack` aanwezig te zijn. Rapporteer of de **gewone** aanvallen nu leuker én dreigender aanvoelen.
6. Vergeet de eerdere open **Update 32.1 balansherplaytest** niet: normale enemies mogen niet te makkelijk blijven, Vitality moet geen automatische onsterfelijkheid opleveren, Water Bolt is sterk maar mag niet elke druk neutraliseren.

**Volgende grotere feature-update: 34 — Bell Tower & The Last Meme hun gewone/secondaire aanvallen versterken, beide ultieme finishing attacks behouden.** De unieke zware Anchor / flankende Phase Stalker / schild-Warden uit makerfeedback volgen volgens het plan in Update 35 en de echte 2.5D-visuele stijlfase vanaf Update 41.
