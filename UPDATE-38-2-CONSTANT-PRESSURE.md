# Update 38.2 — CONSTANT HORDE PRESSURE & FOUR DISTINCT GUARDIAN OPENERS

**19 oktober 2026 · branch:** `feature/living-world-prototype`  
**Status:** grote gerichte combat-hotfix na echte maker-telemetrie, code/automatische tests geslaagd; **menselijke browsertest na de hotfix OPEN**. Deze hotfix is **niet** de geplande volledige Update 39; daarvoor ontbreken de drie na-balans complete browserruns en UX-validatie.

## Waarom 38.1 niet volstond

**Makerfeedback, letterlijk strekking:** de game is te gemakkelijk; Vitality 1 zou nauwelijks risico overlaten; gewone waves geven geen stress, tussen waves is veel leegte, de meeste mobs sterven ver weg voordat je hoeft te bewegen; alleen runners bereiken de speler; de eerste twee Guardian-aanvallen voelen bijna hetzelfde en de cirkel-warnings zijn eenvoudig uit te lopen. **Doel:** Normal moet aanvoelen als bijna onmogelijk, maar een geoefende speler kan met excellente positionering, dodge, risk/reward pickups en buildkeuzes nog winnen. Geen nep-hits, onzichtbare AoE, gegarandeerde dood of verborgen win-lock.

**Echte bron:** lokale QA JSON `shadow-survivor-qa-fire-754s.json`, 19-10-2026, **schema 2**, Fire/Survivor/Standard/**Normal**, High, sandbox false, 1× bossfights en vaak 3× field. **Defeat na 754,98 game-seconden (12:35)** tijdens Bell Tower, 159 kills, 2 Guardians verslagen, Meteor Rain verdiend (10:00), level 12, **11 hits / 183,48 schade**, **42 HP hersteld via pickups**, **geen Vitality/regen**. Drie hits zijn duidelijk `enemy_contact`; meerdere andere zijn `guardian_projectile` of `guardian_hazard`, maar sommige `unknown` en mogen niet aan specifieke bossaanvallen worden toegeschreven. Eerste 180 seconden **nul hits**. De door QA elke 30 seconden gemeten niet-boss momentopnamen tonen doorgaans **1–4 levende vijanden** (bijvoorbeeld eerste 3m gemiddeld 1,17 en tussen 5:00–7:30 gemiddeld 1,83), uitzonderlijk een enkele 0; dus lege ruimtes zijn een gemeten structureel pacingprobleem. Er zijn **25 boss_secondary_attack-events**, maar daarmee kun je niet bewijzen hoeveel van hun projectielen raakten. Snapshot-FPS gemiddeld rond 144 op High; de nieuwe grotere Normal-druk is dus **nog niet** op FPS/GC in een browser getest.

### Diagnose in code

- `js/encounter-rhythm.js` stond binnen een actieve pack én zijn recovery **maar 2 ambient enemies toe**; daarna 11–17s rust. Dit veroorzaakte letterlijk rust na wave.
- `js/encounter-pacing.js` spawnde Normal ambient elke ~7,3 tot ~10s, en **werd juist langzamer naarmate de run vorderde**. De late ambient cap kromp tot ~4–5. Een hoog-level automatisch wapen ruimde de eenzame kleine vijand op vóór contact.
- Tactical patrols kwamen vaak pas 25–31s na vorige; de officiële grote wave duurde 60–80s. Boss-isolatie zelf is goed en blijft.
- De eerste twee boss-salvo's van alle Guardians dreigden vergelijkbaar op het voorspelde punt: 1–3 kleine gemarkeerde cirkels, paar projectielen, makkelijk één kant op lopen, hoewel de spectaculaire signatures wel echt bestaan.

## Concreet aangepast — waves

1. **Normale ambient opbouw:** minder vrijblijvend en meer dreiging, max **10–14 ambient** op Normal (ook tijdens actieve packs; ritmecontroller laat maximaal 12 tijdens pack/recover toe). De live **globale cap blijft 30**. Easy behoudt zijn eerdere trage interval, lagere ambientdruk en lange recovery.
2. **Sneller ritme:** Normal ambient nu elke **2,6s tot 1,65s** afhankelijk van growthTime, en minder lang wachten op volgende tactical patrol (ongeveer 20s → 16s als de arena het toelaat). De officiële wave begint op Normal rond **46s** en opvolgende waves ongeveer elke **38–46s** wanneer de gedeelde ritme-/dichtheidsregels het toestaan. Bossfights blokkeren nog steeds alle gewone automatische spawnbronnen.
3. **Micro-packs i.p.v. losse slachtoffers:** de *bestaande offscreen enemySpawn()* wordt op Normal in kleine aantallen per ambient-puls aangeroepen (maximaal **vier** indien minder dan vijf enemies; maximaal twee bij vijf t/m acht; daarna één). Geen teleport op of rondom de speler. Aanpassingen blijven begrensd door de bestaande ambient-/harde cap.
4. **Overlevingskans monsters in aanloop:** deze ambient vijanden hebben op Normal **1,55× → 1,90× HP** naarmate de run vordert, en niet-runner mobs zijn 12% sneller. Daardoor zou de autoaim niet zo gemakkelijk alle aanloop in een seconde afhandelen. De speciaal gebouwde patrol-HP/XP en de unieke enemy-abilities zijn niet hierbovenop opnieuw vermenigvuldigd.
5. **Rust i.p.v. leeg scherm:** de recovery ná een pack op Normal is nu slechts **2,5–3,3s** in plaats van 11–17s; na boss-end 3s. Tijdens recovery mag het ambientleven doorgaan. `waveTimer` en overige timers worden nooit gebruikt om na een boss alsnog verborgen catch-up packs ineens te dumpen. XP wordt alleen bij kills opgepakt; het speciale wave-/boss-giftsysteem is niet gewijzigd.

## Concreet aangepast — Guardians

**Geen vier kopieën van dezelfde cirkel:** `js/guardian-secondary-attacks.js` en `js/guardian-late-secondary.js` produceren nu echt andere gevarenvormen **vóór** schade; dezelfde `points()`/`danger()` coördinaten sturen ook de daadwerkelijke `bossHazards` collider, inclusief Low graphics.

| Guardian | Eerste normale aanval | Tweede normale aanval |
|---|---|---|
| **Beau de Hond** | **FANG SWEEP:** vijf snelle fish-projectielen en een **voorwaartse jachtcorridor** van 3 overlappende impactzones. Langs de schietrichting blijven lopen is geen makkelijke ontsnapping meer. | **PACK CROSSFIRE:** zijdelingse **pack-pincer** van 3 zones + twee zichtbare zijcasters die naar binnen schieten. Hier is juist voorwaarts/achterwaarts uitlopen belangrijker. |
| **Mourning Shade** | **MOURNING LANCES:** een *laterale sperenmuur* van 3 brede zones, centrale snelle speer en contrasterend snelle flanken. | **PHANTOM MIRRORS:** 4 **diagonale hoekzones** met de twee reeds zichtbare schaduwspiegelcasters; de oude makkelijke midden-/zijroute is geen gratis oplossing. |
| **Bell Tower** | **CLAPPER'S VERDICT:** 5 gevaren in een **kruis** waar je diagonaal uit moet, plus drie snelle gelijktijdige bell shots. | **SPLIT HOUR:** 3 grote zones in een **lengtecorridor** met 2 aankondigde side-emitters. Een andere dodge-richting en timing dan zijn kruis. |
| **The Last Meme** | **PIXEL RIP:** 5 **checkerboard-/diagonale fracture**-zones, met snelle rift shots. | **GLITCH DOUBLE:** 3 zones in een **voorwaarts/achterwaarts gescheurde lijn** met twee echte mirror-projectielen. |

- Gewone secondary-projectielen **sneller**: Beau/Shade `415+33×phase`, Bell/Meme `427+36×phase`; normale damage van die projectielen en gemarkeerde grondhazards hoger, nog steeds daadwerkelijk contact nodig om schade te krijgen.
- De impact-hazards na een **hele zichtbare boss-warning** hebben nu nog `0,52s` extra delay in plaats van 0,76/0,8s. De waarschuwing zelf en haar bewegende/gelockte doel is **niet** verborgen; de maker moet beslist vóór de impact kiezen of hij dash/positioning nodig heeft. Alle tests controleren waarschuwingspositie == echte collisionpositie, plus bestaande serieuze veilige ontsnappingsroutes voor perfecte skill.
- Boss-volgorde, vaste grote signatures, spectaculaire Phase-III arena-ultimates, boss loot, twee verdiende evoluties, healing en world/save/Endless blijven intact.

## Tests

De oude tests die bewust de **oude leegte en één-cirkel-bosses** vastlegden zijn expliciet naar nieuwe doelwaarden omgezet. We hebben geen tests weggehaald of genegeerd.

Nieuwe `tests/update-39-real-horde-pressure.test.cjs` controleert integratief de daadwerkelijke rhythm-/pacing-JS in VM: Normal blijft 12 ambient toestaan tijdens patrol en recovery, recovery is kort, Easy nog steeds laag en langzamer, boss-isolatie houdt encounter bronnen tegen en reset zonder catch-up, harde cap is 30, echte game-loop roept gebonden offscreen minibatches aan, en **alle vier Guardians hebben werkelijk verschillende twee openingsgeometrieën** met betrouwbare one-to-one hitboxes en een bereikbare skill-exit. Vitality/health pickups zijn expliciet bewaakt.

**584/584 CI groen vóór documentatie, zie** https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39274809360. Zie actuele branch-HEAD-CI voor het laatste resultaat.

## Maker-acceptatie nu OPEN

- Speel **Fire Standard Normal, 1× voor bosses, 3× alleen als je het wilt, QA ON, Developer Mode UIT**. Check na 1, 3, 5 en 10 gameminuten of vijanden nu doorlopend aanwezig zijn (vooral 5–10 normale alive op meerdere checkpoints) en of andere types dan runners je naderen. Komt 1 auto-target-vuurwapen nog steeds te makkelijk door alles heen, of moet je nu hele minibatches wegdraaien? Meet `hit.source` bij vijanden, per vijf minuten.
- Wees eerlijk over performance op High bij 3×. Die nieuwe dichtheid kost CPU meer dan de 38.1 baseline. Controleer de 5s FPS/P95, peak enemy count en eventuele Chromium heap; bij significante vertraging passen we de cap aan, niet blind nog honderden nieuwe spawns.
- Bekijk per Guardian twee opeenvolgende normale shots met **Low en High graphics** als het kan. Is Beau een voorwaartse corridor, Shade een zijdelingse sperenmuur, Bell een kruis? Zijn de bedreigingen echt te zien vóór ze raken? Is dodgen nu uitdagend omdat je moet leren, niet omdat een hitbox buiten de markering valt? Test vooral eerste twee salvo's, niet alleen grote Phase III.
- **Vitality blijft normaal**. Als Vitality 1 alsnog de hele run op full HP houdt, toont `hit.source` of er nog onvoldoende echte vijandcontacten plaatsvinden. De antwoordrichting is dan gevarieerde aanvallen/AI, niet healing-nerfs.
- Als deze hotfix te bruut is, vooral vlak na 0:00 met 4 sterke enemies, meten we ook dat en verbeteren het **vroegespel**, zonder te doen alsof een onervaren speler bij voorbaat geen kans mag maken.
- Voor **Update 39** blijven drie echte complete, na-fix Fire/Water/Frost Normal-speeltests nodig; deze 12:35 defeat is **niet** een complete 25–30min Standard-run en telt niet als een van de drie volledige acceptatieruns. Update 40 blijft GO/NO-GO.

**Status: technische hotfix code/test PASS, live gameplay QA ONBEWEZEN.** 
