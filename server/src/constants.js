export const GRID_SIZE = 12;
export const WORDS_PER_GAME = 12;
export const COUNTDOWN_SECONDS = 3;
export const FREEZE_DURATION = 5000;
export const FREEZE_COOLDOWN = 10000;
export const HINT_DURATION = 3000;
export const FOG_DURATION = 5000;
export const ROTATE_DURATION = 5000;
export const FOG_SIZE = 3;
export const FOG_PATCHES = 3;
export const BONUS_MULTIPLIER = 2;
export const WORDS_PER_POWERUP = 2;
export const MAX_POWERUP_CHARGES = 99;
export const DISCONNECT_TIMEOUT = 30000;

// Escalating word values based on how many words have been found
export const ESCALATION_TIERS = [
  { threshold: 0, multiplier: 1 },
  { threshold: 6, multiplier: 2 },
  { threshold: 9, multiplier: 3 },
];

// Final countdown when only 1 word remains — points drain every 10s
export const FINAL_COUNTDOWN_TIERS = [
  { seconds: 40, points: 5 },
  { seconds: 30, points: 4 },
  { seconds: 20, points: 3 },
  { seconds: 10, points: 2 },
  { seconds: 0, points: 1 },
];
