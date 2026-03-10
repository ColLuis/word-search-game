import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startGame,
  validateWordFound,
  checkGameEnd,
  getCurrentMultiplier,
  isLastWord,
} from '../gameManager.js';
import { WORDS_PER_GAME } from '../constants.js';

function makeRoom(category = 'Animals') {
  return {
    category,
    players: [
      { id: 'p1', score: 0 },
      { id: 'p2', score: 0 },
    ],
    game: null,
  };
}

describe('startGame', () => {
  it('selects correct number of unique words', () => {
    const room = makeRoom();
    const game = startGame(room);
    expect(game.words).toHaveLength(WORDS_PER_GAME);
    const wordTexts = game.words.map((w) => w.word);
    expect(new Set(wordTexts).size).toBe(WORDS_PER_GAME);
  });

  it('initializes all words as not found', () => {
    const room = makeRoom();
    const game = startGame(room);
    game.words.forEach((w) => {
      expect(w.found).toBe(false);
      expect(w.foundBy).toBeNull();
    });
  });
});

describe('validateWordFound', () => {
  let room;

  beforeEach(() => {
    room = makeRoom();
    startGame(room);
  });

  it('matches forward selection', () => {
    const w = room.game.words[0];
    const result = validateWordFound(room, 'p1', w.startRow, w.startCol, w.endRow, w.endCol);
    expect(result.valid).toBe(true);
    expect(result.word).toBe(w.word);
  });

  it('matches reverse selection', () => {
    const w = room.game.words[0];
    const result = validateWordFound(room, 'p1', w.endRow, w.endCol, w.startRow, w.startCol);
    expect(result.valid).toBe(true);
    expect(result.word).toBe(w.word);
  });

  it('rejects already-found words', () => {
    const w = room.game.words[0];
    validateWordFound(room, 'p1', w.startRow, w.startCol, w.endRow, w.endCol);
    const result = validateWordFound(room, 'p2', w.startRow, w.startCol, w.endRow, w.endCol);
    expect(result.valid).toBe(false);
  });

  it('blocks frozen players', () => {
    room.game.powerups['p1'].frozenUntil = Date.now() + 10000;
    const w = room.game.words[0];
    const result = validateWordFound(room, 'p1', w.startRow, w.startCol, w.endRow, w.endCol);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('frozen');
  });
});

describe('getCurrentMultiplier', () => {
  it('returns 1x when no words found', () => {
    const room = makeRoom();
    startGame(room);
    expect(getCurrentMultiplier(room)).toBe(1);
  });

  it('returns 2x after 6 words found', () => {
    const room = makeRoom();
    startGame(room);
    for (let i = 0; i < 6; i++) room.game.words[i].found = true;
    expect(getCurrentMultiplier(room)).toBe(2);
  });

  it('returns 3x after 9 words found', () => {
    const room = makeRoom();
    startGame(room);
    for (let i = 0; i < 9; i++) room.game.words[i].found = true;
    expect(getCurrentMultiplier(room)).toBe(3);
  });
});

describe('isLastWord', () => {
  it('detects when 1 word remains', () => {
    const room = makeRoom();
    startGame(room);
    const words = room.game.words;
    for (let i = 0; i < words.length - 1; i++) words[i].found = true;
    expect(isLastWord(room)).toBe(true);
  });

  it('returns false when multiple words remain', () => {
    const room = makeRoom();
    startGame(room);
    expect(isLastWord(room)).toBe(false);
  });
});

describe('checkGameEnd', () => {
  it('detects when all words are found', () => {
    const room = makeRoom();
    startGame(room);
    room.game.words.forEach((w) => (w.found = true));
    expect(checkGameEnd(room)).toBe(true);
  });

  it('returns false when words remain', () => {
    const room = makeRoom();
    startGame(room);
    expect(checkGameEnd(room)).toBe(false);
  });
});
