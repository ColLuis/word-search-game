import { LETTER_FREQUENCIES, VOWELS, CONSONANTS, DEFAULTS } from './constants.js';
import { canFormLongWord } from './dictionary.js';

function weightedRandom(pool) {
  const entries = pool.map((letter) => ({
    letter,
    weight: LETTER_FREQUENCIES[letter] || 1,
  }));
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.letter;
  }
  return entries[entries.length - 1].letter;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateLetterSet() {
  const letters = [];
  const counts = {};

  function pick(pool) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const letter = weightedRandom(pool);
      if ((counts[letter] || 0) < 2) {
        letters.push(letter);
        counts[letter] = (counts[letter] || 0) + 1;
        return;
      }
    }
    // fallback: pick any from pool under limit
    for (const l of pool) {
      if ((counts[l] || 0) < 2) {
        letters.push(l);
        counts[l] = (counts[l] || 0) + 1;
        return;
      }
    }
  }

  // 3 vowels
  for (let i = 0; i < 3; i++) pick(VOWELS);
  // 5 consonants
  for (let i = 0; i < 5; i++) pick(CONSONANTS);
  // 2 any
  const all = Object.keys(LETTER_FREQUENCIES);
  for (let i = 0; i < 2; i++) pick(all);

  return shuffle(letters);
}

export function generateLetters() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const letters = generateLetterSet();
    if (canFormLongWord(letters)) {
      return letters;
    }
  }
  // fallback: return last generated set even if no 7+ word exists
  return generateLetterSet();
}
