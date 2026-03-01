export const EVENTS = {
  // Room events
  ROOM_CREATE: 'room:create',
  ROOM_CREATED: 'room:created',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_UPDATE: 'room:update',
  ROOM_ERROR: 'room:error',
  ROOM_PLAY_AGAIN: 'room:playAgain',

  // Player events
  PLAYER_READY: 'player:ready',
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',

  // Game events
  GAME_COUNTDOWN: 'game:countdown',
  GAME_START: 'game:start',
  GAME_END: 'game:end',
  GAME_STATE: 'game:state',
  GAME_MULTIPLIER_UPDATE: 'game:multiplierUpdate',
  GAME_FINAL_COUNTDOWN: 'game:finalCountdown',

  // Word events
  WORD_SUBMIT: 'word:submit',
  WORD_CONFIRMED: 'word:confirmed',
  WORD_REJECTED: 'word:rejected',

  // Powerup events
  POWERUP_EARNED: 'powerup:earned',
  POWERUP_USE: 'powerup:use',
  POWERUP_FREEZE: 'powerup:freeze',
  POWERUP_HINT: 'powerup:hint',
  POWERUP_FOG: 'powerup:fog',
  POWERUP_BONUS: 'powerup:bonus',
  POWERUP_DRAIN: 'powerup:drain',
  POWERUP_ROTATE: 'powerup:rotate',
};
