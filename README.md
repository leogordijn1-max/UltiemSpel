# Shadow Survivor

## Bestandsindeling

- `index.html` bevat de interface en laadt scripts in afhankelijkheidsvolgorde.
- `styles.css` bevat de interface, overlays en touch-layout.
- `js/game.js` beheert spelstatus, voortgang, simulatie en hoofdloop.
- `js/controls.js` verbindt toetsenbord, menu's, joystick en dashknop.
- `js/storage.js` normaliseert en versieert lokale voortgang met veilige opslagtoegang.
- `js/progression.js` verwerkt runregistratie en achievements op het moment van de gebeurtenis.
- `js/enemies.js` bevat vijanden, bosses, projectiles en damage.
- `js/weapons.js` bevat Chain Lightning, Boomerang, Flame Cone en Frost Orb.
- `js/upgrades.js` beheert upgrades, XP en evolutierecepten.
- `js/render.js` tekent arena, personages, wapens en effecten.
- `js/audio.js` maakt lichte effecten en ambient geluid met Web Audio.
- `img/` bevat de originele game-afbeeldingen.
- `tests/game-logic.test.js` bevat de automatische gameplay-tests.
- `tests/performance-benchmark.js` vergelijkt targetselectie bij 100, 200 en 300 vijanden.

## Besturing

- Bewegen: WASD of pijltjestoetsen.
- Dash: Shift op desktop, DASH op touchscreens.
- Pauze: P.
- Snelheid: 1, 2 of 3.
- Fullscreen aan/uit: F.

Kies Easy, Normal of Nightmare in het startmenu. Stel daarna één Start Weapon en twee Unlockable Weapons in. Alleen het startwapen is bij de start actief; de twee andere gekozen wapens verschijnen gegarandeerd als level-up unlock. Een evolution vraagt wapenlevel 5, de bijbehorende support-upgrade op level 3 en minstens één verslagen boss. Evolutions zijn de definitieve vorm van hun wapen. Bosses geven beloningen uit je huidige build. Punten uit runs geven permanente gezondheids- of damage-upgrades in het startmenu.

Balansnotities: Emmer Mayo geeft 18% damage per level; permanente damagebonussen blijven apart van de vijf zichtbare upgradelevels. XP-drempels groeien met `floor(vorige drempel × factor + 4)`: factor 1.15 tot level 6, 1.105 tot level 15 en 1.085 daarna. Dat vraagt ongeveer 74 totale XP voor level 5, 334 voor level 10, 872 voor level 15, 1,809 voor level 20 en 3,325 voor level 25. Drifters geven 1 XP, runners 0.8, ranged enemies 2, tanks 5 en elites 2.5× hun typewaarde; bosses geven 14 + 18 per bossnummer. Tijdens bossgevechten leveren nieuw gespawnde vijanden geen XP op, eerder gespawnde vijanden wel. Een grove Normal-run simulatie met gemiddeld 1.2 XP per vijand, 35 seconden voor elk van zeven bossgevechten en 45–105 kills per actieve minuut komt na 25 minuten uit rond level 19–24; dit is een modelinschatting, afhankelijk van XP-ophaaltempo, enemy mix en overleving.

Level-upopties wegen wapens, supports en passives mee; gekozen locked wapens blijven gegarandeerd als unlock-optie staan. Wapenkeuzes krijgen iets meer gewicht, maar bestaande passives worden afgewogen om herhaling te beperken. Synergieën versterken onder meer Frost/Flame, Critical Eye/Force, Heavy Impact met area damage en Spirit Blades met Ward Blades. Vitality geeft +30 max HP en 0.8 HP/s per level; Rapid Casting verlaagt cooldowns multiplicatief met 10% per level. Evolutions vereisen level 5, de support op level 3 en een bosskill; de eerste, tweede en derde evolution kunnen vanaf respectievelijk 10, 17 en 22 minuten gekozen worden. Een evolution vervangt het wapen niet door een extra slot.

Chain Lightning springt maximaal 820 pixels vanaf de speler en valt 15% sneller aan dan voorheen. Eiad Bom start op 85 damage, schaalt gematigder per level en doet 42% van zijn normale schade tegen bosses. Tempest voert twee zelfstandige ketens uit. Ranged Shades schieten alleen zichtbaar binnen 430 pixels en houden afstand tot 300 pixels.

Audio, beste runs, achievements en permanente upgrades worden lokaal opgeslagen in `localStorage`. De Web Audio-effecten beginnen pas nadat je op Start hebt gedrukt. De game draait client-side en is geschikt voor GitHub Pages.

Graphics quality staat in Settings op Low, Medium of High. Dit verandert alleen decoratieve glow, achtergronddecoratie en particlelimieten. Schakel `Show FPS, frametime and object timings` in voor FPS, frametime, enemy-AI-, collision- en renderduur plus entity-aantallen.

Run tests with `node --test tests/game-logic.test.js`. Run the repeatable target-search stress benchmark with `node tests/performance-benchmark.js`.
