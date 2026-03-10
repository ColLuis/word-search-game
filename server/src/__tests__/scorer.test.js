import { describe, it, expect } from 'vitest';
import { scoreWord, applyDuplicatePenalty } from '../wordclash/scorer.js';
import { SCORE_TABLE, SPEED_BONUS_MULTIPLIER } from '../wordclash/constants.js';

describe('scoreWord', () => {
  it('returns correct base scores per word length', () => {
    const now = 1000;
    // Use 20s elapsed to avoid speed bonus
    const roundStart = now - 20000;
    expect(scoreWord('CAT', now, roundStart)).toBe(SCORE_TABLE[3]);
    expect(scoreWord('WORD', now, roundStart)).toBe(SCORE_TABLE[4]);
    expect(scoreWord('HELLO', now, roundStart)).toBe(SCORE_TABLE[5]);
    expect(scoreWord('BRIDGE', now, roundStart)).toBe(SCORE_TABLE[6]);
  });

  it('applies 1.25x speed bonus within 15s', () => {
    const roundStart = 0;
    const submittedAt = 10000; // 10s elapsed
    const score = scoreWord('HELLO', submittedAt, roundStart);
    expect(score).toBe(Math.round(SCORE_TABLE[5] * SPEED_BONUS_MULTIPLIER));
  });

  it('no speed bonus after 15s', () => {
    const roundStart = 0;
    const submittedAt = 16000; // 16s elapsed
    const score = scoreWord('HELLO', submittedAt, roundStart);
    expect(score).toBe(SCORE_TABLE[5]);
  });
});

describe('applyDuplicatePenalty', () => {
  it('gives fastest 50%, others 0', () => {
    const submissions = [
      { word: 'HELLO', score: 100, submittedAt: 5000 },
      { word: 'HELLO', score: 100, submittedAt: 3000 },
      { word: 'HELLO', score: 100, submittedAt: 8000 },
    ];
    applyDuplicatePenalty(submissions);

    // Fastest (submittedAt 3000) gets 50%
    const sorted = [...submissions].sort((a, b) => a.submittedAt - b.submittedAt);
    expect(sorted[0].score).toBe(50);
    expect(sorted[1].score).toBe(0);
    expect(sorted[2].score).toBe(0);
  });

  it('does not penalize unique words', () => {
    const submissions = [
      { word: 'HELLO', score: 100, submittedAt: 5000 },
      { word: 'WORLD', score: 80, submittedAt: 3000 },
    ];
    applyDuplicatePenalty(submissions);
    expect(submissions[0].score).toBe(100);
    expect(submissions[1].score).toBe(80);
  });
});
