# Lumen Quest — Five Realms
A single-player fantasy combat adventure about gambling, temptation, and thoughtful choices. Plain HTML, CSS, Canvas, and JavaScript; no build step or external runtime dependency.

## Play
Open **dist/index.html** in Chrome or another modern browser. The local game works without internet. With Node.js, run `node preview.cjs` and visit http://127.0.0.1:4173.

Choose a name and 5 or 10 minutes of **active gameplay**. Questions and pauses can make a whole visit last longer than that.

- **Move:** A/D or arrows. **Run:** Shift. **Jump:** Space/W/up.
- **Attack:** tap or hold J; E also works. Mobile has an attack button. Approach within striking distance.
- Enemies move toward you and show **!** before striking. Jump or move away to dodge.
- Defeat an enemy to trigger exactly one question. Action, enemies, background animation, health, and the session clock freeze while you answer.
- An answer displays its explanation and starts a **two-second return countdown automatically**. Afterward, combat resumes. **Keep reading** deliberately pauses the countdown; Resume restarts two seconds. Opening a source in another tab also pauses it.
- Correct answers earn 40–60 gold with streak bonuses and heal up to 15 HP. Wrong answers use one of five quiz chances.
- Combat health and quiz chances are separate. Zero health, zero quiz chances, or zero active time ends a run.
- Clear every enemy and answer their questions to see **Quit & keep rewards** or **Continue to next area**. Continue teleports you and restores combat health; remaining time and chances carry over.
- After the fifth area, finish the adventure and read the reflection.

## Campaign
| Area | Difficulty | Enemies | Base enemy HP | Base hit damage |
|---|---|---:|---:|---:|
| Lantern Meadow | Super Easy | 2 | 40 | 4 |
| Mirage Bazaar | Easy | 3 | 65 | 6 |
| Velvet Casino | Mid | 4 | 90 | 9 |
| House of Mirrors | Hard | 5 | 120 | 12 |
| Crown of Temptation | Extreme | 6 | 160 | 15 |

Every area has its own scenery and enemy styling. Enemy movement and attack frequency increase; wind-up warnings shorten. The last enemy in each area is an elite with 25% extra HP and 20% stronger hits. Player attacks have a cooldown and cannot hit across the map. Incoming hits grant brief invulnerability.

## Questions and values
50 authored, age-appropriate questions: ten per area. Topics include slots, roulette, casino chips, betting bonuses, near misses, chasing losses, house advantage, advertising, and misleading payout claims. No unrelated school-subject questions remain.

Questions are drawn without repetition within the campaign. The second encounter in every area is an Islamic-values question; other value questions can also appear. Explanations use short paraphrases and include links where applicable:

- [Qur’an 5:90](https://quran.com/5/90): avoiding gambling.
- [Qur’an 5:91](https://quran.com/5/91): hostility and distraction from remembrance and prayer.
- [Qur’an 2:219](https://quran.com/2/219): sin outweighing benefit.
- [Qur’an 17:26](https://quran.com/17/26): giving others their due and avoiding waste.
- [Gambling Commission: return to player](https://www.gamblingcommission.gov.uk/public-and-players/guide/return-to-player-how-much-gaming-machines-payout): a long-run average, not a promise for a session.

The casino scenarios teach awareness, not betting techniques. The game uses only earned fictional coins, with no payments, trading, or cash-out. It does not treat every randomized reward as having an identical religious ruling.

## Collection and progress
Eight heroes: two each in Rare, Epic, Legend, and Mythic, with different health, damage, and auras. Hero attacks now apply that damage directly to enemies. Equipping keeps the same health percentage and quiz chances.

Three chest prices and visible odds remain in the top-right shop. Every hero within a rarity is equally likely; duplicates refund 25%. The fixed simulated leaderboard starts with Player 2 at 2,400 points. Earn the guaranteed Rare Wisdom Compass at 1,200 points when the run finishes.

Coins, unlocked heroes, personal best, and recent results remain compatible with the earlier version and save locally. Progress is tied to the browser/profile/origin. An active campaign does not survive a reload. If browser storage is blocked, progress lasts for the current open page only.

All menus pause the action and session clock. Switching away from the tab pauses automatically. Pause/resume works during the two-second countdown too.

## Animation and files
- **dist/data.js:** heroes, chests, five area definitions, and the 50-question bank.
- **dist/engine.js:** campaign phases, timers, scoring, health, chances, chest logic, and persistence validation.
- **dist/world.js:** combat, movement, enemy AI, hit effects, camera, and five procedural environments.
- **dist/app.js:** interface, question feedback, countdowns, level choices, local saves, and audio.
- **dist/assets/heroes.png:** original collection portraits.
- **dist/assets/hero-actions.png:** new transparent 6-column × 8-row animation sheet. Columns: idle, walk A, walk B, run, attack, jump. One row for each hero.
- **ANIMATION.md:** animation asset provenance and exact generation prompt.

Characters now use distinct generated pose frames rather than the earlier sliced-sprite sway. Walking alternates planted and passing poses. Running alternates the long stride and walk poses at a faster cadence; attacks and jumps have their own frames. This is a six-pose foundation per hero, not a full hand-authored animation set.

## Verification
Run `node tests/engine.test.cjs` for state/rule tests. `node tests/browser-qa.cjs` runs a hidden installed Windows Chrome, a temporary local server, and a project-local test profile. It checks normal keyboard combat, changing animation frames, frozen questions, automatic countdowns, reading pause, mobile controls, all five area transitions, persistence, and offline loading. Later campaign tests accelerate travel and attack cooldowns to verify state transitions; they do not establish full playthrough balance. Screenshots and test results are in qa/ and excluded from publication.

## Hosting
dist/ is the complete static website. The hosted version remains private to the owner. Public hosting and Google Search indexing are separate from opening the game in Chrome. There is no shared online multiplayer leaderboard.
