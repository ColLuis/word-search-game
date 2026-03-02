export const SCORE_TABLE = {
  3: 10,
  4: 20,
  5: 45,
  6: 80,
  7: 150,
  8: 240,
  9: 350,
  10: 640,
};

export const LETTER_FREQUENCIES = {
  A: 8.2, B: 1.5, C: 2.8, D: 4.3, E: 12.7, F: 2.2, G: 2.0, H: 6.1,
  I: 7.0, J: 0.15, K: 0.77, L: 4.0, M: 2.4, N: 6.7, O: 7.5, P: 1.9,
  Q: 0.095, R: 6.0, S: 6.3, T: 9.1, U: 2.8, V: 0.98, W: 2.4, X: 0.15,
  Y: 2.0, Z: 0.074,
};

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');

export const DEFAULTS = {
  ROUNDS: 5,
  ROUND_TIME: 60,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  MIN_WORD_LENGTH: 3,
  MAX_WORD_LENGTH: 10,
  LETTER_COUNT: 10,
};

export const SPEED_BONUS_THRESHOLD = 15; // seconds
export const SPEED_BONUS_MULTIPLIER = 1.25;

export const ROUND_RESULTS_DELAY = 8000; // ms before next round

export const AVATAR_COLORS = ['#3B82F6', '#F97316', '#10B981', '#A855F7'];
