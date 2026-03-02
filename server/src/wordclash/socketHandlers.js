import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocket,
  removePlayer,
  updateSettings,
  resetRoomToLobby,
} from './roomManager.js';
import {
  startRound,
  validateWord,
  submitWord,
  submitEmpty,
  allPlayersSubmitted,
  endRound,
  isGameOver,
  getWinner,
} from './gameManager.js';
import { ROUND_RESULTS_DELAY } from './constants.js';
import { findBestWords } from './dictionary.js';

function playersPayload(room) {
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    score: p.score,
  }));
}

function beginRound(io, room) {
  room.phase = 'playing';
  const { letters, round } = startRound(room);

  io.to(room.code).emit('round:start', {
    letters,
    round,
    totalRounds: room.totalRounds,
    roundTimeSeconds: room.roundTimeSeconds,
  });

  // Auto-submit timeout
  room.game.roundTimer = setTimeout(() => {
    // Auto-submit empty for anyone who hasn't submitted
    for (const player of room.players) {
      submitEmpty(room, player.id);
    }
    finishRound(io, room);
  }, room.roundTimeSeconds * 1000);
}

function finishRound(io, room) {
  if (room.game.roundTimer) {
    clearTimeout(room.game.roundTimer);
    room.game.roundTimer = null;
  }

  const roundLetters = [...room.game.letters];
  const result = endRound(room);
  if (!result) return;

  const bestWords = findBestWords(roundLetters, 5);

  room.phase = 'roundResults';

  io.to(room.code).emit('round:end', {
    submissions: result.submissions,
    scores: result.scores,
    round: result.round,
    totalRounds: room.totalRounds,
    bestWords,
  });

  // After delay, start next round or end game
  room.game.nextRoundTimer = setTimeout(() => {
    if (isGameOver(room)) {
      room.phase = 'gameOver';
      const winner = getWinner(room);
      io.to(room.code).emit('game:end', {
        winner: winner ? { id: winner.id, name: winner.name } : null,
        scores: result.scores,
        players: playersPayload(room),
      });
    } else {
      beginRound(io, room);
    }
  }, ROUND_RESULTS_DELAY);
}

export function registerWordClashHandlers(io, socket) {
  socket.on('room:create', ({ playerName }) => {
    console.log(`[WordClash] room:create from ${socket.id} - name: ${playerName}`);
    const room = createRoom(socket.id, playerName);
    socket.join(room.code);
    socket.emit('room:created', {
      roomCode: room.code,
      players: playersPayload(room),
      playerId: socket.id,
      hostId: room.hostId,
      totalRounds: room.totalRounds,
      roundTimeSeconds: room.roundTimeSeconds,
    });
  });

  socket.on('room:join', ({ roomCode, playerName }) => {
    console.log(`[WordClash] room:join from ${socket.id} - name: ${playerName}, code: ${roomCode}`);
    const result = joinRoom(roomCode.toUpperCase(), socket.id, playerName);
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return;
    }
    const room = result.room;
    socket.join(room.code);
    socket.emit('room:joined', {
      roomCode: room.code,
      players: playersPayload(room),
      playerId: socket.id,
      hostId: room.hostId,
      totalRounds: room.totalRounds,
      roundTimeSeconds: room.roundTimeSeconds,
    });
    socket.to(room.code).emit('room:update', {
      players: playersPayload(room),
    });
  });

  socket.on('room:settings', (settings) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.hostId !== socket.id) return;
    updateSettings(room, settings);
    io.to(room.code).emit('room:update', {
      players: playersPayload(room),
      totalRounds: room.totalRounds,
      roundTimeSeconds: room.roundTimeSeconds,
    });
  });

  socket.on('game:start', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('room:error', { message: 'Only host can start the game' });
      return;
    }
    if (room.players.length < 2) {
      socket.emit('room:error', { message: 'Need at least 2 players' });
      return;
    }
    beginRound(io, room);
  });

  socket.on('word:validate', ({ word }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'playing') return;
    const result = validateWord(room, word);
    socket.emit('word:validation', { word, valid: result.valid, reason: result.reason });
  });

  socket.on('word:submit', ({ word }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'playing') return;

    if (!word || word.trim().length === 0) {
      submitEmpty(room, socket.id);
    } else {
      const result = submitWord(room, socket.id, word);
      if (result.error) {
        socket.emit('room:error', { message: result.error });
        return;
      }
    }

    // Notify others this player submitted
    io.to(room.code).emit('player:submitted', { playerId: socket.id });

    // Check if all submitted → end round early
    if (allPlayersSubmitted(room)) {
      finishRound(io, room);
    }
  });

  socket.on('room:playAgain', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.hostId !== socket.id) return;

    if (room.game?.roundTimer) clearTimeout(room.game.roundTimer);
    if (room.game?.nextRoundTimer) clearTimeout(room.game.nextRoundTimer);

    resetRoomToLobby(room);
    io.to(room.code).emit('game:state', {
      phase: 'lobby',
      players: playersPayload(room),
      hostId: room.hostId,
      totalRounds: room.totalRounds,
      roundTimeSeconds: room.roundTimeSeconds,
    });
  });

  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const wasPlaying = room.phase === 'playing';

    // Auto-submit empty if in a round
    if (wasPlaying) {
      submitEmpty(room, socket.id);
    }

    const remaining = removePlayer(socket.id);
    if (!remaining) return;

    // If playing and only 1 player left, they auto-win
    if (wasPlaying && remaining.players.length === 1) {
      if (remaining.game?.roundTimer) clearTimeout(remaining.game.roundTimer);
      if (remaining.game?.nextRoundTimer) clearTimeout(remaining.game.nextRoundTimer);

      remaining.phase = 'gameOver';
      const winner = remaining.players[0];
      const scores = remaining.game?.scores || {};
      io.to(remaining.code).emit('game:end', {
        winner: { id: winner.id, name: winner.name },
        scores,
        players: playersPayload(remaining),
        reason: 'opponent_disconnected',
      });
    } else if (remaining.phase === 'playing' && allPlayersSubmitted(remaining)) {
      finishRound(io, remaining);
    } else {
      io.to(remaining.code).emit('room:update', {
        players: playersPayload(remaining),
        hostId: remaining.hostId,
      });
    }
  });
}
