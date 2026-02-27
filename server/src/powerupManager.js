import {
  WORDS_PER_POWERUP,
  MAX_POWERUP_CHARGES,
  FREEZE_DURATION,
  FREEZE_COOLDOWN,
  HINT_DURATION,
} from './constants.js';

export function earnPowerup(room, playerId) {
  const state = room.game.powerups[playerId];
  if (!state) return null;

  state.wordsFound = (state.wordsFound || 0) + 1;

  if (state.wordsFound % WORDS_PER_POWERUP === 0) {
    // Award random powerup type
    const type = Math.random() < 0.5 ? 'freeze' : 'hint';
    if (state[type] < MAX_POWERUP_CHARGES) {
      state[type]++;
    } else {
      // Try other type
      const other = type === 'freeze' ? 'hint' : 'freeze';
      if (state[other] < MAX_POWERUP_CHARGES) {
        state[other]++;
      }
    }
    return { freeze: state.freeze, hint: state.hint };
  }

  return null;
}

export function usePowerup(room, playerId, type) {
  const state = room.game.powerups[playerId];
  if (!state) return { success: false, message: 'Invalid state' };

  if (type === 'freeze') {
    if (state.freeze <= 0) return { success: false, message: 'No freeze charges' };

    const now = Date.now();
    if (now - (state.lastFreezeTime || 0) < FREEZE_COOLDOWN) {
      return { success: false, message: 'Freeze on cooldown' };
    }

    state.freeze--;
    state.lastFreezeTime = now;

    // Mark opponent as frozen
    const opponent = room.players.find((p) => p.id !== playerId);
    if (opponent) {
      const oppState = room.game.powerups[opponent.id];
      if (oppState) oppState.frozenUntil = now + FREEZE_DURATION;
    }

    return {
      success: true,
      duration: FREEZE_DURATION,
      powerups: { freeze: state.freeze, hint: state.hint },
    };
  }

  if (type === 'hint') {
    if (state.hint <= 0) return { success: false, message: 'No hint charges' };
    state.hint--;

    // Find random unfound word and return its cells
    const unfound = room.game.words.filter((w) => !w.found);
    if (unfound.length === 0) return { success: false, message: 'No words left' };

    const word = unfound[Math.floor(Math.random() * unfound.length)];
    return {
      success: true,
      cells: word.cells,
      duration: HINT_DURATION,
      powerups: { freeze: state.freeze, hint: state.hint },
    };
  }

  return { success: false, message: 'Unknown powerup type' };
}
