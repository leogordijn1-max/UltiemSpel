# Update 35 — Anchor, Phase Stalker, Warden: unieke verdedigers met tegenstrategie

**Datum:** 19 oktober 2026 · **Branch:** `feature/living-world-prototype`  
**Status:** **Code geïntegreerd en CI 539/539 groen.** De maker heeft deze nieuwe enemyrollen nog **niet in een echte browserrun getest**. De Water-/Vitality-hertest na Update 32.1 en de nieuwe bossaanvallen van Updates 33–34 staan ook nog OPEN.

## Wat de maker vroeg

Tijdens de echte Frost-/Water-speeltests waren gewone vijanden te gemakkelijk, vooral tegen **Water Bolt + hoge attackspeed + knockback + damage**. De maker wil dat **het uiterlijk van een enemy duidelijk maakt wat hij kan**: een enorm zwaar uitziende enemy hoort niet door knockback en Whirlpool weggeblazen te worden; andere unieke enemies moeten eigen herkenbare speciale vaardigheden krijgen. **Niet simpelweg meer spawns, damage-bags of onduidelijke immuniteiten.** De bestaande elementen, earned evolutions, de inmiddels geliefde Guardians en het 25–30-minutenontwerp zijn leidend.

## Wat is écht geïmplementeerd?

Nieuwe module: **`js/enemy-counter-roles.js`**. We hergebruiken bestaande soorten, zodat dit **geen drie extra spawnkinds, geen extra spawns of bots per wave** creëert. Elk countertype krijgt daarnaast al een onderscheidende **Canvas-silhouette-overlay**, bruikbaar op Low en High. De definitieve prachtige stylized 2.5D-designs staan pas gepland voor Updates 41–50.

| Nieuwe rol | Bestaande enemy | Échte mechanic | Leesbaar uiterlijk | Eerlijke counter |
|---|---|---|---|---|
| **THE ANCHOR** | **Zombie Mike**, heavy (kind 2; vanaf normale unlock rond 6:00) | Nog veel steviger tegen alle Water/Whirlpool- en andere fysieke beweging, terwijl damage en XP volledig doorkomen | Vier ver uitstaande zware, verankerde voeten; heldere scheurring bij gebroken pantser | **Bomb-hit** veroorzaakt 2,6s lang een zichtbaar **Armor Crack**. Tijdens die window doen volgende directe, Frost/Fire/Water-hits **20% extra damage**. Bestaande duidelijk aangekondigde stomp blijft ontwijkbaar |
| **PHASE STALKER** | Een **Runner met tactische Pouncer-rol** in kleine encounterteams; gewone losse Runner blijft normaal | **Aangekondigde diagonale dash** in plaats van hersenloos recht naar speler; ~0,86s zichtbare corridor-warning; daadwerkelijke beweging over precies die aangewezen hoek | Slanke, gesplitste spookachtige afterimages naast silhouet; extra ring in recovery | Corridor verlaten of dash ontwijken, daarna **1,6s kwetsbare recovery** met +20% damage. Geen teleport boven op speler en geen directe onzichtbare damage |
| **THE WARDEN** | **Bulwark met bestaande Ward-tactiek** (pas na de normale kind-6 unlock rond 12:00) | Zolang zijn bestaande schild **echt omhoog** staat, beschermt hij **maximaal twee levende bondgenoten binnen 155px uit dezelfde ploeg**: zij ontvangen slechts **33% van de normale fysieke push/pull** | Heldere turquoise ring en maximaal twee **echte beschermlinks** naar de daadwerkelijk beschermde teammates | Flank het bestaande **16-richtingen-schild**, wacht tot het schild zakt of versla Warden. Bescherming verdwijnt direct; de ploeg krijgt ook de bestaande **3s formation-broken vulnerability**. Geen bescherming voor vijanden buiten team of radius |

### Wat de resistance in cijfers betekent

De bestaande Update-32 basisschalen blijven bestaan. THE ANCHOR krijgt daarbovenop een specifieke multiplier **0,65× voor gewone/Water hit-knockback** en **0,35× voor Whirlpool-pull**. Met zijn al aanwezige zware baseline van **0,12×** ontvangt hij nu dus **7,8% van normale generieke duwkracht** en **4,2% van normale Whirlpool-verplaatsing**. De normale Water Bolt-extra duw en anti-spam-multipliers worden nog steeds toegepast; dat beperkt het oneindig wegdrukken.

De **Warden** beschermt bondgenoten alleen tegen **fysieke crowd control**, niet tegen weapon damage, XP, health drops, burn, evoluties of verdere storyprogress. Het zijn bovendien expliciet **maximaal twee** bondgenoten uit een kleine groep, geen onzichtbare arena-wide-aura. De links worden alleen getekend als schild omhoog én bonding in code echt bestaat; Low graphics houdt ze zichtbaar.

### Het bestaande spellensysteem blijft echt

- Nieuwe module haakt aan op **`js/crowd-control.js`**: **alle** fysieke push/pull via Water Bolt, Tidal Wave, Whirlpool, waterhit, echte hit-knockback respecteren nu dezelfde rol-resistance. Geen verborgen tweede codepad om The Anchor toch moeiteloos te duwen.
- **`js/enemies.js`** registreert de juiste countertype bij spawn en past de **daadwerkelijke, optionele zwakte** toe bij het ontvangen van damage. Bomb zet tijdelijk Armor Crack; een levende Anchor blijft HP verliezen in plaats van immuun te worden. Bosses en summons krijgen deze speciale rollen niet.
- **`js/encounter-tactics.js`** specialiseert alleen bestaande **Pouncer**- en **Ward**-teamleden. Phase Stalker gebruikt de reeds bestaande zichtbare Pouncer-corridor; de aimhoek is bewust ±0,37 rad gedraaid, de waarschuwingsduur is **0,86s** en de dash is licht begrensd voor voldoende dodge-reactie. Na afloop is hij echt kwetsbaar. De gewone Runner-feint en overige archetypes blijven intact.
- **`js/render.js`** gebruikt `drawEnemyCounterRole` naast de bestaande World Aura, Encounter Tactic, 16-richtingsschild en charactertekeningen. Anchor heeft zeer breed spoor/voeten, Phase Stalker twee scherpe afterimages, Warden zichtbaar schild met maximaal twee echte links. Deze sprites zijn **functionele Canvas-designs**, niet de definitieve 2.5D-illustraties.
- **`js/game.js`** slaat iedere **30 game-seconden** nu ook `counterRoles: {anchor, phaseStalker, warden}` op in de lokale QA-JSON. Zo kan de maker aantonen dat rollen in een echte Water-/Frost-run daadwerkelijk voorkomen.
- Scriptversies in `index.html` bijgewerkt, counter-module geladen na de bestaande encounter-/archetypemodules en vóór gameplay-start.
- **Bestaande enemy population cap, boss isolation, 25:00 finale, earned evolutions, XP, saves en Endless-flow niet aangepast.** Nieuwe rollen worden geleidelijk zichtbaar op basis van de reeds bestaande kind-unlocks; de speciale Stalker/Warden zijn tactische groepvarianten, geen horde van abilities.

## Automatische tests

**539/539 Node-tests groen** na het toevoegen van **12 eigen Update-35-tests** in `tests/update-35-enemy-counter-roles.test.cjs`. [GitHub Actions-codecheck](https://github.com/leogordijn1-max/UltiemSpel/actions/runs/39241222863).

Getest: correcte toekenning zonder boss-/summon-lekken; mathematisch juiste zware knockback/Whirlpool weerstand, anti-spam Water Bolt; Armor Crack die alleen tijdelijk damage versterkt; Warden beschermt maximaal twee echte alive groepsgenoten, stopt meteen bij shield-down/dood/afstand/verkeerde ploeg; geen damageimmuniteit; Phase Stalker diagonal prewarning, werkelijke dash en aanvechtbare 1,6s recovery; Low/High render-instructies voor silhouette; integratie in scripts zonder nieuwe spawns. Oudere regressietests over alleen cache-bust-tagnaam in `encounter-tactics.js` zijn bijgewerkt, niet verwijderd.

**Wat een groene CI NIET bewijst:** dat een Water Bolt-speler nu voldoende echte druk voelt; dat het ontwerp op alle monitoren al tot de definitieve kunststijl behoort; dat de waarschuwing bij 3× gametempo prettig te lezen is; of dat elke fase-3 Guardianattack naast de counterrollen fair is. Dat vereist een **echte browserrun**.

## Testprotocol voor wanneer de maker wil spelen

**Standard · Normal · Developer Mode UIT, bij voorkeur Water Bolt + hoge rate/knockback**, eventueel een tweede Frost-run.

1. **Vanaf 6:00: THE ANCHOR.** Zombie Mike heeft aan de buitenkant vier zware ‘voeten’. Houd Whirlpool/Water Bolt op hem: hij hoort **niet eenvoudig weg te drijven**, maar nog wel schade te krijgen en langzaam op je af te lopen. Test zo mogelijk een Bomb-hit: duidelijke gebarsten ring en een tijdelijk venster waarin andere wapens meer schade doen. Ontwijk de stomp; die is niet instant.
2. **Vanaf tactische Pouncer-groepen: PHASE STALKER.** Zoek de gesplitste neon-afterimages en een **diagonale corridor-warning** voordat hij dash-t. Probeer zijwaarts te ontwijken; kijk of je tijdens de kwetsbare **1,6s recovery** kunt counterattacken. Er mag geen onzichtbare teleport-hits zijn.
3. **Vanaf 12:00 met Ward-Bulwark: THE WARDEN.** De heldere turquoise ring en maximaal twee beschermlijnen tonen **precies wie beschermd wordt**. Laat het schild even zakken of probeer een flank, pak één beschermde bondgenoot als Warden nog leeft en daarna na zijn dood: het verschil in push/pull hoort daadwerkelijk voelbaar te zijn. Kijk ook of de groep niet ineens overdreven sterk wordt.
4. **Low/High graphics, 1× en later 3×:** de markeringen moeten nog helder zijn, de dash mag niet onmogelijk te ontwijken worden, en de heavy/ward moet visueel zijn mechanic uitstralen zonder overdaad aan effecten. Geen FPS-stutter door extra lijnen.
5. **Download QA JSON** via pauze of einde. Nieuwe velden `counterRoles.anchor`, `counterRoles.phaseStalker` en `counterRoles.warden` kunnen in 30s-checkpoints worden gevolgd. Geef daarnaast kort aan: zijn gewone vijanden **duidelijk uitdagender** maar niet unfair? Hoe voelt Water Bolt nu na de survival-hotfix 32.1?
6. Als je tijd hebt: ook Beau/Shade/Bell/Meme hun nieuwe normale attacks uit Updates 33–34 op echte 1×/2×/3× beoordelen. De vorige grote, geliefde ultimates zijn niet gewijzigd.

## Planning na Update 35

**Roadmap 31–40:** **5/10 genummerde updates technisch gebouwd** (31 t/m 35). **Alleen Update 31 heeft live browseracceptatie**; voor Updates 32.1 en 33–35 is handmatige QA nog open, net als de overige release-gates.

**Volgende: Update 36 — FPS & memory stress in echte drukke gevechten.** De maker wil latere **41–50**-graphics uiteindelijk een uitzonderlijk vloeiende, bijna-3D stylized 2.5D-look. Juist daarom eerst meten dat rendering van tegenstrategieën, hits en waarschuwingen ook met Low/Medium/High en veel enemies goed blijft werken.
