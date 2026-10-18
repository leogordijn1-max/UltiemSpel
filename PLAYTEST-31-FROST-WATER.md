# UPDATE 31 — twee echte browserruns: Frost en Water

**18 oktober 2026 · bron:** twee door de maker zelf geëxporteerde JSON-bestanden (QA-schema 1): shadow-survivor-qa-frost-1680s.json en shadow-survivor-qa-water-1603s.json. Ruwe rapporten worden niet zonder toestemming naar GitHub gepusht. De maker zegt over de eerste run: **"ik heb in de eerste run geen gebruik gemaakt van de developer tools"**.

## 1. Volledige resultaten

| Meetgegeven | Frost | Water |
|---|---:|---:|
| Outcome | Standard Victory | Standard Victory |
| Developer sandboxflag | **true** | **false** |
| Mate van developergebruik | **Maker zegt: geen tools gebruikt** | gewone non-sandbox run |
| Eindtijd op GAMEKLOK | 28:01 | 26:44 |
| Eindlevel | 15 | 21 |
| Verzamelde XP | 957,25 | 2.202,78 |
| Kills bij laatste 30s-checkpoint | 255 | 395 |
| Geleden schade over hele run | 403,67 | 501 |
| Hits | 27 | 33 |
| Bosses verslagen | 4/4 | 4/4 |
| Normale bossrewardkeuzes | **0/3** | **3/3** |
| Evoluties | 2/2 | 2/2 |
| Eerste evolutie | Glacier 13:59 | Riptide Lance 10:00 |
| Tweede evolutie | Crystal Storm 22:52 | Tsunami 17:00 |
| Browser FPS gemiddelde | 143,66 | 143,78 |
| Minimum FPS van samples | 135 | 137,8 |
| Hoogste gemeten P95 frametijd | 13,9 ms | 7,1 ms |
| Grafisch niveau | High | High |

**BELANGRIJK bij Frost:** de game markeert die run met sandbox:true omdat Developer Mode actief was bij het beginnen, **niet noodzakelijk omdat God Mode of andere cheats zijn gebruikt**. De maker heeft expliciet bevestigd **geen developerfuncties te hebben gebruikt**. De bestaande code slaat echter in sandbox het gewone bossrewardpanel over: in de Frost-log ontbreken alle boss_reward_offer-events en in Water zijn ze driemaal aanwezig. Frost is een daadwerkelijk gespeelde browserrun maar **geen gelijkwaardige standaard-economievergelijking**, omdat het spel anders werkte. Spreek de maker nooit tegen door zonder bewijs God Mode te beweren.

**BELANGRIJK bij Water:** sandbox:false, drie gewone bossrewards en een daadwerkelijk getraceerde overwinning. Dit is ons eerste volledige non-sandbox Normal Standard browserbewijs. Beide runs gebruikten 1×/2×/3× spelsnelheid; **28:01 en 26:44 zijn gamekloktijden**, niet gegarandeerde werkelijke wandkloktijden.

## 2. Vier bosses met exacte duur

| Boss | Frost spawn → dood | Frost duur | Water spawn → dood | Water duur |
|---|---|---:|---|---:|
| Beau de Hond | 03:00 → 05:38 | 2:38 | 03:00 → 04:16 | 1:16 |
| The Mourning Shade | 08:38 → 11:58 | 3:21 | 07:16 → 08:27 | 1:11 |
| The Bell Tower | 14:58 → 18:34 | 3:36 | 11:27 → 12:34 | 1:07 |
| The Last Meme | 25:00 → 28:01 | 3:01 | 25:00 → 26:44 | 1:44 |

Beide logs tonen werkelijke boss_spawn, fase 1/2/3, boss_defeated ×4 en final_boss_victory. Finale begint exact vanaf minuut 25 na drie voorgaande echte kills. **Fair attack patterns, waarschuwingsleesbaarheid en alle save-/Endless-state zijn niet uit dit soort JSON af te leiden.**

## 3. Level-up-, XP- en evolutie-economie voor Update 32

**Frost (met onbedoeld andere rewardlogica):**
- 10:00: level 7, circa 198,63 totale XP, frost level 5, iceShards level 1, critDamage level 0: nog niet evolueerbaar.
- 17:00: level 10, circa 385,92 XP; Glacier wel aanwezig; iceShards nog level 1.
- Eerste Glacier wordt op **13:59** met frost 5 + critDamage 3 verdiend. Tweede Crystal Storm op **22:52** met iceShards 5 + critDamage 3.
- glacialPulse stond **13 van de 14** reguliere keuzemomenten op het scherm, maar werd pas op 24:24 gekozen. Dit kan repetitief voelen; eerst UX/keuze-algoritme bestuderen voor we een wijziging kiezen.
- Geen gewone bossrewardkeuzes: dit beïnvloedt vroeg supportlevel, XP/groeitempo en duur van bossgevechten.

**Water (volledige normale beloningen):**
- 10:00: level 10, circa 357,04 XP. **Riptide Lance** verdiend via waterBolt 5 + rate 3.
- 17:00: level 15, circa 953,51 XP. **Tsunami** verdiend via tidalWave 5 + knockback 3.
- Echte bossrewards: Beau 04:16 **rate 0→2**; Shade 08:27 **health 0→2**; Bell 12:34 **critChance 0→2**. Vooral de rate-reward draagt direct bij aan eerste evolutie.
- whirlpool was in **12 van 20** reguliere aanbiedingen aanwezig; pas op 15:57 voor de eerste keer gekozen. Eindlevel 21, 395 kills, twee earned evolutions. 100% wereldpersist en Endless nog niet daadwerkelijk bewezen.

**Conclusie:** géén wereldwijde XP-boost op basis van Frost alleen. Water toont dat twee evoluties volgens het huidige spel exact op de bedoelde mijlpalen haalbaar zijn, en toont véél hogere XP/kills en kortere bossgevechten. Test minstens Fire en een gewone non-sandbox Frost-run voor eerlijke elementvergelijking. Onderzoek in Update 32 of de aanbieding per level genoeg zinvolle afwisseling heeft en of er specifiek zwakke elementen/rollen zijn.

## 4. Releasegates na deze twee live bestanden

| Gate | Nieuwe stand | Wat nog ontbreekt |
|---|---|---|
| M1 Normal Standard run 25–30 game-minuten | **PASS — Water 26:44 non-sandbox Victory** | Reproduceerbaarheid in andere elementen |
| M2 twee werkelijk verdiende evoluties | **PASS — Water 10:00 en 17:00 met gear 5+3** | Meer builds en afwisseling toetsen |
| M3 vier fair solo-bossfights | **PARTIAL** — vier fases/overwinningen/logs gedocumenteerd | Makerobservatie over dodge, telegraphs, hazard overlap en Low quality |
| M4 world/save/Victory/Endless | **PARTIAL** — Victory en 15/50/85%-checkpoints bevestigd | Permanent 100% na refresh, defeat/reset en Endless-bewijs |
| M5 FPS/geheugen | **PARTIAL** — High-FPS/P95 van 2 browserruns | Low, Medium, memory profiles en zware scenetests |
| M6 drie complete elementruns | **PARTIAL** — twee complete runs, één non-sandbox | Fire, en voor zuivere economie Frost non-sandbox |

**Update 31 — live testdeel NU GEDAAN:** een echte non-sandbox Standard Normal 26:44 Victory is bekeken met gevalideerde XP-/choice-/evolutie-/boss-/framegegevens. Update 31 is daarmee **AFGEROND**. **Geen verified playable release-GO**; M3–M6 blijven deels OPEN en Update 32 volgt voor degelijke evolution/buildbalans.

## 5. Aanbevolen eerstvolgende werk

1. Update 32: level-upopties/weighted selection onderzoeken; voorkom nutteloze herhaling zonder spelerkeuze af te pakken of vereisten te verlagen.
2. Verifieer eerst waarom Frost-sandbox bossrewards mist en los verwarring op tussen Developer Mode aanstaan en tools daadwerkelijk gebruiken.
3. Vergelijk de eerste 10 en 17 minuten van een derde echte **Fire non-sandbox** run en waar mogelijk Frost zonder sandbox.
4. Vraag de maker of vooral Frost-bossfights te lang aanvoelden en of Water minder uitdagend voelde.
5. M3–M6 en het releasebesluit niet als PASS afstrepen uitsluitend omdat het JSON outcome Victory meldt.

**Code-CI vóór dit onderzoeksverslag:** 479/479 automatisch groen. Dit is documentatie op bestaande echte gebruikersdata; geen nieuwe gameplaywijziging of nieuw aantal code-tests geclaimd.
