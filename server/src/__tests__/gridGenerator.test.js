import { describe, it, expect } from 'vitest';
import { generateGrid } from '../gridGenerator.js';
import { GRID_SIZE } from '../constants.js';

describe('generateGrid', () => {
  const testWords = ['HELLO', 'WORLD', 'GAME', 'TEST', 'CODE'];

  it('places all words in a 12x12 grid', () => {
    const { grid, placements } = generateGrid(testWords);
    expect(grid).toHaveLength(GRID_SIZE);
    grid.forEach((row) => expect(row).toHaveLength(GRID_SIZE));
    expect(placements).toHaveLength(testWords.length);
  });

  it('all words are findable at their recorded positions', () => {
    const { grid, placements } = generateGrid(testWords);
    for (const p of placements) {
      const letters = p.cells.map((c) => grid[c.row][c.col]).join('');
      expect(letters).toBe(p.word);
    }
  });

  it('fills empty cells with letters (no nulls)', () => {
    const { grid } = generateGrid(testWords);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        expect(grid[r][c]).not.toBeNull();
        expect(grid[r][c]).toMatch(/^[A-Z]$/);
      }
    }
  });

  it('handles overlapping letters correctly', () => {
    // Words that share a common letter
    const overlapping = ['ACE', 'ARC', 'ATE'];
    const { grid, placements } = generateGrid(overlapping);
    for (const p of placements) {
      const letters = p.cells.map((c) => grid[c.row][c.col]).join('');
      expect(letters).toBe(p.word);
    }
  });

  it('throws after max attempts with impossible input', () => {
    // 20 distinct 12-char words with no shared letters can't all fit in 12x12
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const impossible = Array.from({ length: 20 }, (_, i) => {
      const ch = alphabet[i % 26];
      const ch2 = alphabet[(i + 13) % 26];
      return (ch + ch2).repeat(6);
    });
    // Make all words unique by appending index as different char combos
    const unique = impossible.map((w, i) => {
      const chars = w.split('');
      chars[0] = alphabet[i];
      chars[1] = alphabet[(i + 7) % 26];
      return chars.join('');
    });
    expect(() => generateGrid(unique)).toThrow('Failed to generate grid');
  });
});
