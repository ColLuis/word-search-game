import {
  WORDS_PER_POWERUP,
  MAX_POWERUP_CHARGES,
  FREEZE_DURATION,
  FREEZE_COOLDOWN,
  HINT_DURATION,
  FOG_DURATION,
  ROTATE_DURATION,
  BLIND_DURATION,
} from './constants.js';

const ALL_TYPES = ['freeze', 'hint', 'fog', 'bonus', 'drain', 'rotate', 'shield', 'blind'];

export function earnPowerup(room, playerId) {
  const state = room.game.powerups[playerId];
  if (!state) return null;

  state.wordsFound = (state.wordsFound || 0) + 1;

  if (state.wordsFound % WORDS_PER_POWERUP === 0) {
    // Avoid giving the same powerup twice in a row
    const candidates = ALL_TYPES.filter((t) => t !== state.lastEarned);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    let earned = false;
    for (const type of shuffled) {
      if ((state[type] || 0) < MAX_POWERUP_CHARGES) {
        state[type] = (state[type] || 0) + 1;
        state.lastEarned = type;
        earned = true;
        break;
      }
    }
    // Fallback to the last-earned type if all others are maxed
    if (!earned && state.lastEarned && (state[state.lastEarned] || 0) < MAX_POWERUP_CHARGES) {
      state[state.lastEarned] = (state[state.lastEarned] || 0) + 1;
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
    drain: state.drain || 0,
    rotate: state.rotate || 0,
    shield: state.shield || 0,
    blind: state.blind || 0,
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

    return {
      success: true,
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

  if (type === 'drain') {
    if ((state.drain || 0) <= 0) return { success: false, message: 'No drain charges' };

    const opponent = room.players.find((p) => p.id !== playerId);
    if (!opponent || opponent.score <= 0) {
      return { success: false, message: 'Opponent has no points' };
    }

    state.drain--;
    opponent.score = Math.max(0, opponent.score - 1);

    return {
      success: true,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'rotate') {
    if ((state.rotate || 0) <= 0) return { success: false, message: 'No rotate charges' };
    state.rotate--;

    return {
      success: true,
      duration: ROTATE_DURATION,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'shield') {
    if ((state.shield || 0) <= 0) return { success: false, message: 'No shield charges' };
    state.shield--;
    state.shielded = true;

    return {
      success: true,
      powerups: powerupsPayload(state),
    };
  }

  if (type === 'blind') {
    if ((state.blind || 0) <= 0) return { success: false, message: 'No blind charges' };
    state.blind--;

    return {
      success: true,
      duration: BLIND_DURATION,
      powerups: powerupsPayload(state),
    };
  }

  return { success: false, message: 'Unknown powerup type' };
}

export function checkShield(room, targetId) {
  const targetState = room.game.powerups[targetId];
  if (targetState && targetState.shielded) {
    targetState.shielded = false;
    return true;
  }
  return false;
}
