// Run records and event-driven achievements; game state is supplied by game.js.
let recentAchievements = [];

function unlockAchievement(id, title) {
  if (!grantAchievement(metaProgress, id, title)) return false;
  recentAchievements.push(title);
  notify(`ACHIEVEMENT · ${title}`, "achievement", 5);
  saveMetaProgress();
  return true;
}

function checkRunAchievements() {
  if (time >= 300) {
    unlockAchievement("survive5", "Five Minutes");
    if (runDamageTaken === 0) {
      metaProgress.bestFlawlessSurvival = Math.max(metaProgress.bestFlawlessSurvival, Math.floor(time));
      unlockAchievement("flawless", "Untouched Run");
    }
  }
  if (time >= 600) unlockAchievement("survive10", "Ten Minutes");
}

function checkSavedAchievements() {
  if (metaProgress.totals.kills >= 100) unlockAchievement("kills100", "100 Kills");
  if (metaProgress.totals.kills >= 1000) unlockAchievement("kills1000", "1000 Kills");
  if (metaProgress.totals.bosses >= 1) unlockAchievement("boss1", "First Boss");
  if (metaProgress.totals.bosses >= 3) unlockAchievement("boss3", "Boss Hunter");
  const bestSurvival = Math.max(0, ...metaProgress.runs.map((run) => run.survived));
  if (bestSurvival >= 300) unlockAchievement("survive5", "Five Minutes");
  if (bestSurvival >= 600) unlockAchievement("survive10", "Ten Minutes");
}

function recordRun() {
  if (runRecorded) return false;
  runRecorded = true;
  const survived = Math.floor(time);
  const earned = Math.floor(kills / 100) + bossesDefeated * 3;
  metaProgress.points += earned;
  metaProgress.totals.runs += 1;
  metaProgress.runs.push({ survived, kills, level, bosses: bossesDefeated, difficulty });
  metaProgress.runs = metaProgress.runs.sort((a, b) => b.survived - a.survived).slice(0, 5);
  if (survived >= 300) unlockAchievement("survive5", "Five Minutes");
  if (survived >= 600) unlockAchievement("survive10", "Ten Minutes");
  if (runDamageTaken === 0) {
    metaProgress.bestFlawlessSurvival = Math.max(metaProgress.bestFlawlessSurvival, survived);
    if (survived >= 300) unlockAchievement("flawless", "Untouched Run");
  }
  saveMetaProgress();
  return true;
}
