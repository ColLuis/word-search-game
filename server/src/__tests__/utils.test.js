import { describe, it, expect } from 'vitest';
import { shuffle } from '../utils.js';

describe('shuffle', () => {
  it('returns the same elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it('produces a different order (statistical)', () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    // Run multiple times — at least one should differ from the original
    const results = Array.from({ length: 5 }, () => shuffle(input));
    const anyDifferent = results.some(
      (r) => r.join(',') !== input.join(',')
    );
    expect(anyDifferent).toBe(true);
  });
});
