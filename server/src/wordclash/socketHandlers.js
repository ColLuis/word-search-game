import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocket,
  removePlayer,
  updateSettings,
  resetRoomToLobby,
  updateSocketId,
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
import { findBestWords } from './dictionary.js';

const DISCONNECT_TIMEOUT = 30000;
const disconnectTimers = new Map();

function playersPayload(room) {
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    score: p.score,
  }));
}

function scoresPayload(room) {
  const scores = {};
  for (const p of room.players) {
    scores[p.id] = room.game?.scores?.[p.id] ?? p.score ?? 0;
  }
  return scores;
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
  room.readyVotes = new Set();

  const lastRound = isGameOver(room);

  io.to(room.code).emit('round:end', {
    submissions: result.submissions,
    scores: result.scores,
    round: result.round,
    totalRounds: room.totalRounds,
    bestWords,
    isLastRound: lastRound,
  });

  // If last round, auto-advance to game over after a short delay
  if (lastRound) {
    room.game.nextRoundTimer = setTimeout(() => {
      advanceAfterResults(io, room);
    }, 5000);
  }
}

function advanceAfterResults(io, room) {
  if (isGameOver(room)) {
    room.phase = 'gameOver';
    const winner = getWinner(room);
    const scores = room.game?.scores || {};
    io.to(room.code).emit('game:end', {
      winner: winner ? { id: winner.id, name: winner.name } : null,
      scores,
      players: playersPayload(room),
    });
  } else {
    beginRound(io, room);
  }
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

  socket.on('round:ready', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'roundResults') return;

    if (!room.readyVotes) room.readyVotes = new Set();
    room.readyVotes.add(socket.id);

    io.to(room.code).emit('round:readyVote', {
      playerId: socket.id,
      readyPlayerIds: [...room.readyVotes],
    });

    if (room.readyVotes.size >= room.players.length) {
      room.readyVotes = null;
      advanceAfterResults(io, room);
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

  // Reconnection
  socket.on('reconnect:attempt', ({ roomCode, playerName }) => {
    console.log(`[WordClash] reconnect:attempt from ${socket.id} - name: ${playerName}, code: ${roomCode}`);
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('room:error', { message: 'Room no longer exists' });
      return;
    }

    const existingPlayer = room.players.find((p) => p.name === playerName);
    if (!existingPlayer) {
      socket.emit('room:error', { message: 'Player not found in room' });
      return;
    }

    // Clear disconnect timer
    const timerKey = `${roomCode}:${existingPlayer.id}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
      disconnectTimers.delete(timerKey);
    }

    const oldId = existingPlayer.id;
    updateSocketId(oldId, socket.id);
    socket.join(roomCode);

    // Build state payload
    const statePayload = {
      phase: room.phase,
      roomCode: room.code,
      players: playersPayload(room),
      playerId: socket.id,
      hostId: room.hostId,
      totalRounds: room.totalRounds,
      roundTimeSeconds: room.roundTimeSeconds,
      scores: scoresPayload(room),
    };

    if (room.phase === 'playing' && room.game) {
      statePayload.letters = room.game.letters;
      statePayload.currentRound = room.game.currentRound;
      const submittedIds = room.game.submissions
        ? [...room.game.submissions.keys()].filter((id) => room.game.submissions.get(id))
        : [];
      statePayload.submittedPlayerIds = submittedIds;
      statePayload.iSubmitted = submittedIds.includes(socket.id);
    }

    socket.emit('game:state', statePayload);
    socket.to(roomCode).emit('player:reconnected', { playerId: socket.id });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const isInGame = room.phase === 'playing' || room.phase === 'roundResults';

    if (isInGame) {
      // Give them time to reconnect
      socket.to(room.code).emit('player:disconnected', { playerId: socket.id });
      const timerKey = `${room.code}:${socket.id}`;
      disconnectTimers.set(
        timerKey,
        setTimeout(() => {
          disconnectTimers.delete(timerKey);
          const currentRoom = getRoom(room.code);
          if (!currentRoom) return;

          // Auto-submit empty if still playing
          if (currentRoom.phase === 'playing') {
            submitEmpty(currentRoom, socket.id);
          }

          const remaining = removePlayer(socket.id);
          if (!remaining) return;

          if (remaining.players.length === 1) {
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
          }
        }, DISCONNECT_TIMEOUT)
      );
    } else {
      const remaining = removePlayer(socket.id);
      if (!remaining) return;

      io.to(remaining.code).emit('room:update', {
        players: playersPayload(remaining),
        hostId: remaining.hostId,
      });
    }
  });
}
