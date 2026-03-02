import { generateLetters } from './letterGenerator.js';
import { isValidWord } from './dictionary.js';
import { scoreWord, applyDuplicatePenalty } from './scorer.js';

export function startRound(room) {
  const letters = generateLetters();
  const now = Date.now();

  if (!room.game) {
    room.game = {
      currentRound: 0,
      scores: {},
      submissions: [],
    };
    room.players.forEach((p) => { room.game.scores[p.id] = 0; });
  }

  room.game.currentRound++;
  room.game.letters = letters;
  room.game.submissions = [];
  room.game.submittedPlayerIds = new Set();
  room.game.roundStartedAt = now;

  return { letters, round: room.game.currentRound };
}

export function canFormWord(letters, word) {
  const available = {};
  for (const l of letters) {
    available[l] = (available[l] || 0) + 1;
  }
  for (const ch of word.toUpperCase()) {
    if (!available[ch] || available[ch] <= 0) return false;
    available[ch]--;
  }
  return true;
}

export function validateWord(room, word) {
  if (!room.game) return { valid: false, reason: 'No game in progress' };
  const upper = word.toUpperCase();
  if (upper.length < 3) return { valid: false, reason: 'Word must be at least 3 letters' };
  if (upper.length > 10) return { valid: false, reason: 'Word too long' };
  if (!canFormWord(room.game.letters, upper)) return { valid: false, reason: 'Cannot form word from available letters' };
  if (!isValidWord(upper)) return { valid: false, reason: 'Not a valid word' };
  return { valid: true };
}

export function submitWord(room, playerId, word) {
  if (!room.game) return null;
  const upper = word.toUpperCase();
  const now = Date.now();

  // Validate again
  const validation = validateWord(room, upper);
  if (!validation.valid) return { error: validation.reason };

  // Check if player already submitted
  if (room.game.submittedPlayerIds.has(playerId)) {
    return { error: 'Already submitted this round' };
  }

  const score = scoreWord(upper, now, room.game.roundStartedAt);

  const submission = {
    playerId,
    word: upper,
    score,
    submittedAt: now,
  };

  room.game.submissions.push(submission);
  room.game.submittedPlayerIds.add(playerId);

  return { submission };
}

export function submitEmpty(room, playerId) {
  if (!room.game) return;
  if (room.game.submittedPlayerIds.has(playerId)) return;

  room.game.submissions.push({
    playerId,
    word: '',
    score: 0,
    submittedAt: Date.now(),
  });
  room.game.submittedPlayerIds.add(playerId);
}

export function allPlayersSubmitted(room) {
  if (!room.game) return false;
  return room.game.submittedPlayerIds.size >= room.players.length;
}

export function endRound(room) {
  if (!room.game) return null;

  // Apply duplicate penalty
  const validSubmissions = room.game.submissions.filter((s) => s.word.length > 0);
  applyDuplicatePenalty(validSubmissions);

  // Accumulate scores
  for (const sub of room.game.submissions) {
    room.game.scores[sub.playerId] = (room.game.scores[sub.playerId] || 0) + sub.score;
  }

  // Sync player scores
  room.players.forEach((p) => {
    p.score = room.game.scores[p.id] || 0;
  });

  return {
    submissions: room.game.submissions.map((s) => ({
      playerId: s.playerId,
      word: s.word,
      score: s.score,
    })),
    scores: { ...room.game.scores },
    round: room.game.currentRound,
  };
}

export function isGameOver(room) {
  if (!room.game) return false;
  return room.game.currentRound >= room.totalRounds;
}

export function getWinner(room) {
  if (!room.game) return null;
  const sorted = [...room.players].sort((a, b) => (room.game.scores[b.id] || 0) - (room.game.scores[a.id] || 0));
  if (sorted.length < 2) return sorted[0] || null;
  if ((room.game.scores[sorted[0].id] || 0) === (room.game.scores[sorted[1].id] || 0)) return null; // tie
  return sorted[0];
}

export function getStats(room) {
  if (!room.game) return {};
  // Gather all submissions across rounds — we'd need to track this
  return {};
}
