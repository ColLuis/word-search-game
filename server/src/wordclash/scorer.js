import { SCORE_TABLE, SPEED_BONUS_THRESHOLD, SPEED_BONUS_MULTIPLIER } from './constants.js';

export function scoreWord(word, submittedAt, roundStartedAt) {
  const length = word.length;
  const baseScore = SCORE_TABLE[length] || SCORE_TABLE[10];

  const elapsed = (submittedAt - roundStartedAt) / 1000;
  const speedMultiplier = elapsed <= SPEED_BONUS_THRESHOLD ? SPEED_BONUS_MULTIPLIER : 1;

  return Math.round(baseScore * speedMultiplier);
}

export function applyDuplicatePenalty(submissions) {
  // Group by word
  const byWord = {};
  for (const sub of submissions) {
    const w = sub.word.toUpperCase();
    if (!byWord[w]) byWord[w] = [];
    byWord[w].push(sub);
  }

  for (const word in byWord) {
    const group = byWord[word];
    if (group.length > 1) {
      // Sort by submission time — fastest first
      group.sort((a, b) => a.submittedAt - b.submittedAt);
      // Fastest gets 50% of their score, rest get 0
      group[0].score = Math.round(group[0].score * 0.5);
      for (let i = 1; i < group.length; i++) {
        group[i].score = 0;
      }
    }
  }
}
