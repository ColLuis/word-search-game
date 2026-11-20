import { describe, it, expect } from 'vitest';
import { validateClue, seamWords, getRatingBand } from '../../../shared/leafline.js';
import {
  wordAt,
  buildCardDeck,
  dealBoards,
  createRng,
  evaluateGuess,
  computeScore,
  linkWords,
} from '../leafline/engine.js';

const card = { id: 'c', words: ['north', 'east', 'south', 'west'] };

describe('Leafline wordAt', () => {
  it('reads words unrotated', () => {
    expect([0, 1, 2, 3].map((e) => wordAt(card, e, 0))).toEqual(['north', 'east', 'south', 'west']);
  });

  it('rotates clockwise', () => {
    expect([0, 1, 2, 3].map((e) => wordAt(card, e, 1))).toEqual(['west', 'north', 'east', 'south']);
  });
});

describe('Leafline dealing', () => {
  it('builds unique cards of four words', () => {
    const deck = buildCardDeck(undefined, createRng(1));
    expect(deck.length).toBeGreaterThan(100);
    const words = deck.flatMap((c) => c.words);
    expect(new Set(words).size).toBe(words.length);
  });

  it('gives each player four cards and a decoy, never reused', () => {
    const deck = buildCardDeck(undefined, createRng(2));
    const boards = dealBoards(['a', 'b', 'c'], deck, createRng(3));
    const ids = boards.flatMap((b) => [
      ...Object.values(b.solution).map((p) => p.cardId),
      b.decoyCardId,
    ]);
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
  });

  it('links the touching edges of neighbouring cards', () => {
    const cards = new Map([
      ['a', { id: 'a', words: ['a0', 'a1', 'a2', 'a3'] }],
      ['b', { id: 'b', words: ['b0', 'b1', 'b2', 'b3'] }],
      ['c', { id: 'c', words: ['c0', 'c1', 'c2', 'c3'] }],
      ['d', { id: 'd', words: ['d0', 'd1', 'd2', 'd3'] }],
    ]);
    const solution = {
      0: { cardId: 'a', rotation: 0 },
      1: { cardId: 'b', rotation: 0 },
      2: { cardId: 'c', rotation: 0 },
      3: { cardId: 'd', rotation: 0 },
    };
    expect(linkWords(cards, solution, 'top')).toEqual(['a1', 'b3']);
    expect(linkWords(cards, solution, 'right')).toEqual(['b2', 'd0']);
    expect(linkWords(cards, solution, 'bottom')).toEqual(['c1', 'd3']);
    expect(linkWords(cards, solution, 'left')).toEqual(['a2', 'c0']);
    const slotWords = ['a', 'b', 'c', 'd'].map((id) => cards.get(id).words);
    expect(seamWords(slotWords, 'right')).toEqual(['b2', 'd0']);
  });
});

describe('Leafline scoring', () => {
  const solution = [0, 1, 2, 3].map((s) => ({ cardId: `c${s}`, rotation: s }));

  it('needs card and rotation to match', () => {
    const slots = solution.map((p) => ({ ...p }));
    slots[2] = { cardId: 'c2', rotation: 0 };
    expect(evaluateGuess(slots, solution)).toEqual({ correctSlots: [0, 1, 3], allCorrect: false });
  });

  it('scores 6 then 2 then 0', () => {
    expect(computeScore(1, true)).toBe(6);
    expect(computeScore(2, true)).toBe(2);
    expect(computeScore(2, false)).toBe(0);
  });

  it('bands the final score', () => {
    expect(getRatingBand(4, 18)).toBe('Warming up');
    expect(getRatingBand(12, 18)).toBe('In sync');
    expect(getRatingBand(16, 18)).toBe('Mind meld');
    expect(getRatingBand(18, 18)).toBe('Perfect');
  });
});

describe('Leafline validateClue', () => {
  it('accepts a normal clue', () => {
    expect(validateClue('ocean', 'wave', 'surf')).toBeNull();
    expect(validateClue("don't", 'wave', 'surf')).toBeNull();
  });

  it('rejects empty, spaces, symbols and long clues', () => {
    expect(validateClue('', 'wave', 'surf')).toBeTruthy();
    expect(validateClue('big wave', 'ocean', 'surf')).toBeTruthy();
    expect(validateClue('surf2', 'wave', 'ocean')).toBeTruthy();
    expect(validateClue('a'.repeat(21), 'wave', 'surf')).toBeTruthy();
  });

  it('rejects reusing a linked word', () => {
    expect(validateClue('Wave', 'wave', 'surf')).toBeTruthy();
    expect(validateClue('wavelength', 'wave', 'surf')).toBeTruthy();
    expect(validateClue('cows', 'cow', 'salt')).toBeTruthy();
    expect(validateClue('rain', 'rainbow', 'surf')).toBeTruthy();
  });

  it('allows short or incidental fragments', () => {
    expect(validateClue('sur', 'wave', 'surf')).toBeNull();
    expect(validateClue('ring', 'spring', 'bell')).toBeNull();
  });
});
