# Shadow Survivor

## Bestandsindeling

- `index.html` bevat de interface en laadt scripts in afhankelijkheidsvolgorde.
- `styles.css` bevat de interface, overlays en touch-layout.
- `js/game.js` beheert spelstatus, voortgang, simulatie en hoofdloop.
- `js/controls.js` verbindt toetsenbord, menu's, joystick en dashknop.
- `js/enemies.js` bevat vijanden, bosses, projectiles en damage.
- `js/weapons.js` bevat Chain Lightning, Boomerang, Flame Cone en Frost Orb.
- `js/upgrades.js` beheert upgrades, XP en evolutierecepten.
- `js/render.js` tekent arena, personages, wapens en effecten.
- `js/audio.js` maakt lichte effecten en ambient geluid met Web Audio.
- `img/` bevat de originele game-afbeeldingen.
- `tests/game-logic.test.js` bevat de automatische gameplay-tests.

## Besturing

- Bewegen: WASD of pijltjestoetsen.
- Dash: Shift op desktop, DASH op touchscreens.
- Pauze: P.
- Snelheid: 1, 2 of 3.
- Fullscreen aan/uit: F.

Kies Easy, Normal of Nightmare in het startmenu. Stel daarna één Start Weapon en twee Unlockable Weapons in. Alleen het startwapen is bij de start actief; de twee andere gekozen wapens verschijnen gegarandeerd als level-up unlock. Een evolution vraagt wapenlevel 5, de bijbehorende support-upgrade op level 3 en minstens één verslagen boss. Evolutions zijn de definitieve vorm van hun wapen. Bosses geven beloningen uit je huidige build. Punten uit runs geven permanente gezondheids- of damage-upgrades in het startmenu.

Balansnotities: Emmer Mayo geeft 22% damage per level; permanente damagebonussen blijven apart van de vijf zichtbare upgradelevels. Chain Lightning springt maximaal 820 pixels vanaf de speler en valt 15% sneller aan dan voorheen. Eiad Bom start op 85 damage, schaalt gematigder per level en doet 42% van zijn normale schade tegen bosses. Tempest voert twee zelfstandige ketens uit. Ranged Shades schieten alleen zichtbaar binnen 430 pixels en houden afstand tot 300 pixels.

Audio, beste runs, achievements en permanente upgrades worden lokaal opgeslagen in `localStorage`. De Web Audio-effecten beginnen pas nadat je op Start hebt gedrukt. De game draait client-side en is geschikt voor GitHub Pages.

Run tests with `node --test tests/game-logic.test.js`.
