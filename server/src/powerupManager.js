import {
  WORDS_PER_POWERUP,
  MAX_POWERUP_CHARGES,
  FREEZE_DURATION,
  FREEZE_COOLDOWN,
  HINT_DURATION,
  FOG_DURATION,
  FOG_SIZE,
  FOG_PATCHES,
  GRID_SIZE,
} from './constants.js';

const ALL_TYPES = ['freeze', 'hint', 'fog', 'bonus', 'steal'];

export function earnPowerup(room, playerId) {
  const state = room.game.powerups[playerId];
  if (!state) return null;

  state.wordsFound = (state.wordsFound || 0) + 1;

  if (state.wordsFound % WORDS_PER_POWERUP === 0) {
    const shuffled = [...ALL_TYPES].sort(() => Math.random() - 0.5);
    for (const type of shuffled) {
      if ((state[type] || 0) < MAX_POWERUP_CHARGES) {
        state[type] = (state[type] || 0) + 1;
        break;
      }
    }
    return powerupsPayload(state);
  }

  return null;
}

function powerupsPayload(state) {
  return {
    freeze: state.freeze || 0,
    hint: state.hint || 0,
    fog: state.fog || 0,
    bonus: state.bonus || 0,
    steal: state.steal || 0,
  };
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

    const opponent = room.players.find((p) => p.id !== playerId);
    if (opponent) {
      const oppState = room.game.powerups[opponent.id];
      if (oppState) oppState.frozenUntil = now + FREEZE_DURATION;
    }

    return {
      success: true,
      duration: FREEZE_DURATION,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'hint') {
    if (state.hint <= 0) return { success: false, message: 'No hint charges' };
    state.hint--;

    const unfound = room.game.words.filter((w) => !w.found);
    if (unfound.length === 0) return { success: false, message: 'No words left' };

    const word = unfound[Math.floor(Math.random() * unfound.length)];
    return {
      success: true,
      cells: [word.cells[0]],
      word: word.word,
      duration: HINT_DURATION,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'fog') {
    if ((state.fog || 0) <= 0) return { success: false, message: 'No fog charges' };
    state.fog--;

    const maxStart = GRID_SIZE - FOG_SIZE;
    const patches = [];
    for (let i = 0; i < FOG_PATCHES; i++) {
      patches.push({
        row: Math.floor(Math.random() * (maxStart + 1)),
        col: Math.floor(Math.random() * (maxStart + 1)),
        size: FOG_SIZE,
      });
    }

    return {
      success: true,
      patches,
      duration: FOG_DURATION,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'bonus') {
    if ((state.bonus || 0) <= 0) return { success: false, message: 'No bonus charges' };
    state.bonus--;
    state.bonusActive = true;

    return {
      success: true,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'steal') {
    if ((state.steal || 0) <= 0) return { success: false, message: 'No steal charges' };
    state.steal--;

    const opponent = room.players.find((p) => p.id !== playerId);
    if (!opponent || opponent.score <= 0) {
      return { success: false, message: 'Nothing to steal' };
    }

    opponent.score = Math.max(0, opponent.score - 1);
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.score += 1;

    return {
      success: true,
      powerups: powerupsPayload(state),
    };
  }

  return { success: false, message: 'Unknown powerup type' };
}
