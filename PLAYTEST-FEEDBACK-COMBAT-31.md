# Shadow Survivor — gebruikersfeedback Frost / Water na Update 31

**Datum:** 18 oktober 2026. **Status:** designfeedback en actiepunten voor Update 32–35, 38 en 41–50; **nog geen nieuwe gameplaycode gebouwd**.

## Makerfeedback (betrouwbare primaire bron)

De maker meldt uit zijn twee daadwerkelijk gespeelde runs:

- **Water Bolt is veel te sterk**, vooral gecombineerd met hoge attack speed, knockback en damage. Normale vijanden bereikten de speler nauwelijks; **de Water-run op Normal was veel te makkelijk**.
- De **Frost Orb** (vergelijkbaar basiswapen) is ook behoorlijk sterk.
- **Beau en The Mourning Shade zijn erg leuk**, met name hun **twee sterkste aanvallen**. Die bewaren; overige aanvallen mogen aantrekkelijker en spannender.
- Bij **The Bell Tower en The Last Meme** waren vooral **de laatste, grote ultimates** indrukwekkend én moeilijk. **The Last Meme finale-ultimate is een visuele/gameplaybenchmark.** Hun andere, gewone aanvallen moeten duidelijk beter worden: mooier, interessanter en echt uitdagend.
- **Gewone enemies zijn over het algemeen te gemakkelijk.** De maker wil op termijn meer **unieke enemies waarvan uiterlijk/gewicht/silhouette precies uitlegt wat hun speciale vermogen is**. Concreet voorbeeld: een massieve, zwaar ogende vijand die **vrijwel ongevoelig is voor knockback en het trekken van Whirlpool**.
- Boss- en enemy-design moet passen bij de geplande **vloeiende, bijna-3D stylized 2.5D** presentatie. Niet simpelweg meer horde-enemies als oplossing.

## Bestaande code / verklaring om te onderzoeken

- js/enemies.js kent Drifter, Runner, **Zombie Mike (kind 2, heavy)**, Ranged Shade, Burstling en **Bulwark (kind 6, richtingsschild)**. js/enemy-archetypes.js voegt o.a. dodge/feint, seismic stomp en directional shielding toe; js/encounter-tactics.js combineert kleine tactische teams.
- js/enemies.js **damage()** reduceert standaard knockback voor bosses tot factor 0.12, kind 2 tot **0.45**, elites tot **0.6**. **Maar** js/elemental-combat.js voegt op verschillende plaatsen afzonderlijke water-push/pull toe: gewone waterhits +170, Tidal Wave +185 en Whirlpool ongeveer 680/920 x dt, **zonder overal diezelfde zware-enemyweerstand toe te passen**. Dit is een echte inconsistentie die Water crowd-control versterkt. Het is nog geen bewijs van iedere specifieke bug in een live video, dus verder testen vóór nerfs.
- Goede oplossing om te verkennen: **één gedeeld fysiek crowd-control-resistanceprofiel** voor knockback, pull en impact slow, toegepast op alle bronnen. Een heavy kan bijvoorbeeld 85–100% push/pull weerstaan, maar moet nog wel damage kunnen ontvangen, kwetsbare momenten hebben en een **duidelijk herkenbaar effect** bij botsingen geven.
- Maak Water Bolt niet kunstmatig zwak en geef niet iedere vijand immuniteit. De bedoeling is **sterke builds met echte counters**, niet generieke bullet sponges. Geen extra normale hordes als snelle moeilijkheidsoplossing.

## Concepten voor drie unieke vijandrollen (VOORSTELLEN, geen definitieve assets)

| Werknaam | Silhouette/visueel signaal | Mechanic | Fair counterplay | Hergebruik |
|---|---|---|---|---|
| **The Anchor** | Gigantisch zwaar pantser, ankerbenen, brede schouders | Verzet zich tegen knockback **en** Whirlpool-pull; loopt rustig door projectielmuur; duidelijk aangekondigde stomp | Aanval baiten, korte recovery benutten, flankeren of armor-break mechaniek | Begin met **Zombie Mike**, pas later nieuw type als echt anders |
| **Phase Stalker** | Smal, snelle afterimages, scheur-/dashsporen | Uit een ongunstige hoek dash/reposition na duidelijke waarschuwing; countert eeuwig rechtuit kiten | Visuele lijn lezen, zijwaarts ontwijken en recovery bestraffen | Bestaande **Runner** en tactische Pouncer als basis |
| **The Warden** | Groot schild of lichtketens naar 1–2 teamgenoten | Tijdelijk bondgenoten beschermen tegen push/pull en meewerken in compacte formatie | Schakel Warden uit, flank de shieldhoek of onderbreek korte beschermfase | Bestaande **Bulwark** en ward/vanguard-teamrol |

**Ontwerpregels:** uiterlijk voorspelt de echte mechanic; iedere weerstand heeft begrijpelijke tegenstrategie; geen onzichtbare immuniteiten; klein aantal sterke enemies per tactische groep; duidelijke afstands- en recoveryvensters op 1x/2x/3x en Low/High. Beschouw deze namen alleen als voorstel.

## Welke update pakt wat?

- **32 — XP, evoluties en basisbalans:** Water/Frost live gegevens gebruiken; Water Bolt attack-rate/knockback/damage-interactie en resistancelaag vergelijken met sterke Frost Orb. **Geen generieke XP-buff**, want non-sandbox Water behaalde twee earned evolutions precies op 10:00 en 17:00.
- **33 — Beau & Shade:** hun twee beste aanvallen **behouden**, vooral de andere attacks mechanisch en qua waarschuwingen/dodge/recovery spannender maken. Visuele eindpolish komt later.
- **34 — Bell & The Last Meme:** prioriteit **secundaire moves drastisch verbeteren**, niet enkel laatste ultimate; The Last Meme finale als kwaliteitslat voor alle attacks. Enige aanval mag niet goed zijn alleen omdat hij meer damage heeft.
- **35 — Enemy pressure & rollen:** speelbare prototypen van Anchor/Phase Stalker/Warden via bestaande heavy/runner/shieldrollen; consistente physicsresistance, heldere designs, echte counterplay en slimme combinaties zonder hordespam.
- **38 — Elementbalans:** echte DPS, knockback, killtempo, overlevingsdruk bij Water Bolt versus Frost Orb en andere wapens vergelijken; gericht bijstellen, niet alle upgrades onderuit halen.
- **41–45 — visual foundation:** uitwerken van de concept-art en modelachtig 2.5D-volume, zware lichaamsbouw, licht/shadows, silhouette dat vooraan vertelt wat de vijand kan.
- **46–50 — animatie/VFX:** alle bossaanvallen spectaculair, maar de gameplay-telegraphs en echte hitzones moeten overeenkomen.

## Bewijs en open vragen

Zie PLAYTEST-31-FROST-WATER.md. Beide echte runs wonnen; Water Normal 26:44, twee earned evoluties exact op 10:00/17:00, circa 144 FPS en vier bosses; Frost 28:01 was sandbox gemarkeerd maar de maker gebruikte geen developerfuncties (sandbox onderdrukte wel gewone bossreward-keuzes). De maker heeft nu **duidelijk aangegeven dat Normal Water TE makkelijk voelt** ondanks Victory. Hierdoor mag de groene CI of de geslaagde run niet als bewezen juiste moeilijkheidsbalans worden voorgesteld.

**Acceptatie:** de sterkste attacks van de eerste bosses behouden; Bell en Meme krijgen méér dan één echt memorabele aanval; de gewone wereld verdedigt zichzelf met enkele herkenbare, unieke, duidelijke counterrollen; Water is sterk maar niet zonder reacties van de speler overal onkwetsbaar.
