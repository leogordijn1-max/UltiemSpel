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
  if (metaProgress.totals.wins > 0) unlockAchievement("finalVictory", "Nightbreaker");
  if (metaProgress.bossLoot?.includes("beau")) unlockAchievement("beauTrophy", "Good Dog");
  if ((metaProgress.weaponMasteries || []).length >= 4) unlockAchievement("mastery4", "Master of Arms");
  if (metaProgress.totals.kills >= 100) unlockAchievement("kills100", "100 Kills");
  if (metaProgress.totals.kills >= 1000) unlockAchievement("kills1000", "1000 Kills");
  if (metaProgress.totals.bosses >= 1) unlockAchievement("boss1", "First Boss");
  if (metaProgress.totals.bosses >= 3) unlockAchievement("boss3", "Boss Hunter");
  const bestSurvival = Math.max(0, ...metaProgress.runs.map((run) => run.survived));
  if (bestSurvival >= 300) unlockAchievement("survive5", "Five Minutes");
  if (bestSurvival >= 600) unlockAchievement("survive10", "Ten Minutes");
}

// A victory saves immediately; continuing Endless later updates the same run, not a second run.
let recordedRunId = null;
let runRewardSettled = 0;
const FINAL_VICTORY_BONUS = 12;

function grantFinalVictory() {
  if (typeof victoryClaimed !== "undefined" && victoryClaimed) return false;
  victoryClaimed = true;
  metaProgress.endlessUnlocked = true;
  metaProgress.totals.wins = (metaProgress.totals.wins || 0) + 1;
  metaProgress.points += FINAL_VICTORY_BONUS;
  unlockAchievement("finalVictory", "Nightbreaker");
  recordRun("victory");
  saveMetaProgress();
  return true;
}

function recordRun(outcome = "defeat") {
  const wasRecorded = runRecorded;
  const mode = typeof runMode !== "undefined" && runMode === "endless" ? "endless" : "standard";
  const won = typeof victoryClaimed !== "undefined" && victoryClaimed === true;
  // Never count a normal run twice. Victory may later be updated on an Endless continuation.
  if (wasRecorded && !(mode === "endless" && won)) return false;

  const survived = Math.floor(time);
  const pointsForPerformance = Math.floor(kills / 100) + bossesDefeated * 3;
  const previouslyAwarded = Number.isFinite(runRewardSettled) ? runRewardSettled : 0;
  metaProgress.points += Math.max(0, pointsForPerformance - previouslyAwarded);
  runRewardSettled = Math.max(previouslyAwarded, pointsForPerformance);
  if (!wasRecorded) {
    recordedRunId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    metaProgress.totals.runs++;
    runRecorded = true;
  }
  const snapshot = {
    id: recordedRunId,
    survived,
    kills,
    level,
    bosses: bossesDefeated,
    difficulty,
    mode,
    character: typeof selectedCharacter !== "undefined" ? selectedCharacter : "survivor",
    victory: won,
  };
  if (!Array.isArray(metaProgress.runs)) metaProgress.runs = [];
  const previousIndex = metaProgress.runs.findIndex((run) => run.id === recordedRunId);
  if (previousIndex >= 0) metaProgress.runs[previousIndex] = snapshot;
  else metaProgress.runs.push(snapshot);
  metaProgress.runs.sort((a, b) => b.survived - a.survived);
  metaProgress.runs = metaProgress.runs.slice(0, 30);

  updateModeRecord(metaProgress, mode, difficulty, snapshot, !wasRecorded && outcome === "victory");
  if (survived >= 300) unlockAchievement("survive5", "Five Minutes");
  if (survived >= 600) unlockAchievement("survive10", "Ten Minutes");
  if (runDamageTaken === 0) {
    metaProgress.bestFlawlessSurvival = Math.max(metaProgress.bestFlawlessSurvival || 0, survived);
    if (survived >= 300) unlockAchievement("flawless", "Untouched Run");
  }
  saveMetaProgress();
  return true;
}
