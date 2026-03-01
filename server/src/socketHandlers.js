import {
  createRoom,
  joinRoom,
  setPlayerReady,
  allPlayersReady,
  getRoomBySocket,
  getRoomCodeBySocket,
  removePlayer,
  updateSocketId,
  resetRoomToLobby,
  getRoom,
} from './roomManager.js';
import { startGame, validateWordFound, checkGameEnd, getCurrentMultiplier, isLastWord } from './gameManager.js';
import { earnPowerup, usePowerup } from './powerupManager.js';
import { COUNTDOWN_SECONDS, DISCONNECT_TIMEOUT, FINAL_COUNTDOWN_TIERS } from './constants.js';

const disconnectTimers = new Map();

function playersPayload(room) {
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    ready: p.ready,
    score: p.score,
  }));
}

function scoresPayload(room) {
  const scores = {};
  room.players.forEach((p) => (scores[p.id] = p.score));
  return scores;
}

function startCountdown(io, room) {
  room.phase = 'countdown';
  let count = COUNTDOWN_SECONDS;

  const interval = setInterval(() => {
    io.to(room.code).emit('game:countdown', { count });
    count--;
    if (count < 0) {
      clearInterval(interval);
      const gameData = startGame(room);
      room.phase = 'playing';

      // Send personalized game:start to each player (hide word positions)
      const wordsPayload = gameData.words.map((w) => ({
        word: w.word,
        found: false,
        foundBy: null,
      }));

      io.to(room.code).emit('game:start', {
        grid: gameData.grid,
        words: wordsPayload,
        scores: scoresPayload(room),
      });
    }
  }, 1000);
}

export function registerSocketHandlers(io, socket) {
  // Room: Create
  socket.on('room:create', ({ playerName, category, seriesLength }) => {
    console.log(`room:create from ${socket.id} - name: ${playerName}, category: ${category}, seriesLength: ${seriesLength}`);
    const room = createRoom(socket.id, playerName, category, seriesLength || 1);
    socket.join(room.code);
    console.log(`Room ${room.code} created with player ${playerName}`);
    socket.emit('room:created', {
      roomCode: room.code,
      players: playersPayload(room),
      category: room.category,
      playerId: socket.id,
      seriesLength: room.seriesLength,
    });
  });

  // Room: Join
  socket.on('room:join', ({ roomCode, playerName }) => {
    console.log(`room:join from ${socket.id} - name: ${playerName}, code: ${roomCode}`);
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
      category: room.category,
      playerId: socket.id,
      seriesLength: room.seriesLength,
    });
    socket.to(room.code).emit('room:update', { players: playersPayload(room) });
  });

  // Player: Ready
  socket.on('player:ready', () => {
    console.log(`player:ready from ${socket.id}`);
    const room = setPlayerReady(socket.id);
    if (!room) {
      console.log(`player:ready - no room found for ${socket.id}`);
      return;
    }
    console.log(`Room ${room.code}: players=${room.players.length}, ready=${room.players.filter(p => p.ready).length}`);
    io.to(room.code).emit('room:update', { players: playersPayload(room) });
    if (allPlayersReady(room)) {
      console.log(`Room ${room.code}: all ready, starting countdown`);
      startCountdown(io, room);
    }
  });

  // Word: Submit
  socket.on('word:submit', ({ startRow, startCol, endRow, endCol }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || !room.game || room.phase !== 'playing') return;

    const result = validateWordFound(room, socket.id, startRow, startCol, endRow, endCol);
    if (!result.valid) {
      socket.emit('word:rejected', { message: result.message || 'Not a valid word' });
      return;
    }

    // Update score (escalating value + bonus multiplier)
    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      const pState = room.game.powerups[socket.id];
      const bonusMultiplier = pState && pState.bonusActive ? 2 : 1;

      // Use final countdown points if active, otherwise use escalation tier
      // offset -1 because this word was already marked found by validateWordFound
      const basePoints = room.game.finalCountdown
        ? room.game.finalCountdownPoints
        : getCurrentMultiplier(room, -1);

      player.score += basePoints * bonusMultiplier;
      if (pState && pState.bonusActive) {
        pState.bonusActive = false;
        socket.emit('powerup:bonusUsed');
      }
    }

    const wordsPayload = room.game.words.map((w) => ({
      word: w.word,
      found: w.found,
      foundBy: w.foundBy,
    }));

    io.to(room.code).emit('word:confirmed', {
      word: result.word,
      foundBy: socket.id,
      cells: result.cells,
      scores: scoresPayload(room),
      words: wordsPayload,
    });

    // Check powerup earning
    const powerupResult = earnPowerup(room, socket.id);
    if (powerupResult) {
      socket.emit('powerup:earned', { powerups: powerupResult });
    }

    // Emit multiplier update if it changed
    const newMultiplier = getCurrentMultiplier(room);
    io.to(room.code).emit('game:multiplierUpdate', { multiplier: newMultiplier });

    // Start final countdown if last word remains and not already running
    if (isLastWord(room) && !room.game.finalCountdown) {
      room.game.finalCountdown = true;
      room.game.finalCountdownPoints = FINAL_COUNTDOWN_TIERS[0].points;

      let elapsed = 0;
      io.to(room.code).emit('game:finalCountdown', {
        seconds: FINAL_COUNTDOWN_TIERS[0].seconds,
        points: FINAL_COUNTDOWN_TIERS[0].points,
      });

      room.game.finalCountdownInterval = setInterval(() => {
        elapsed++;
        const remaining = FINAL_COUNTDOWN_TIERS[0].seconds - elapsed;

        // Check tier boundaries and update points
        for (let i = FINAL_COUNTDOWN_TIERS.length - 1; i >= 0; i--) {
          if (remaining <= FINAL_COUNTDOWN_TIERS[i].seconds) {
            room.game.finalCountdownPoints = FINAL_COUNTDOWN_TIERS[i].points;
            break;
          }
        }

        io.to(room.code).emit('game:finalCountdown', {
          seconds: Math.max(0, remaining),
          points: room.game.finalCountdownPoints,
        });

        // Stop interval once fully elapsed
        if (remaining <= 0) {
          clearInterval(room.game.finalCountdownInterval);
          room.game.finalCountdownInterval = null;
          room.game.finalCountdownPoints = 1;
        }
      }, 1000);
    }

    // Check game end
    if (checkGameEnd(room)) {
      if (room.game.finalCountdownInterval) {
        clearInterval(room.game.finalCountdownInterval);
        room.game.finalCountdownInterval = null;
      }
      room.phase = 'results';
      const scores = scoresPayload(room);
      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
      const winner =
        sortedPlayers[0].score === sortedPlayers[1].score
          ? null
          : { id: sortedPlayers[0].id, name: sortedPlayers[0].name };

      // Update series wins
      if (winner && room.seriesWins) {
        room.seriesWins[winner.id] = (room.seriesWins[winner.id] || 0) + 1;
      }

      const winsNeeded = Math.ceil(room.seriesLength / 2);
      const seriesOver = room.seriesLength === 1 || (winner && room.seriesWins[winner.id] >= winsNeeded);
      const seriesWinner = seriesOver && winner ? { id: winner.id, name: winner.name } : null;

      io.to(room.code).emit('game:end', {
        winner,
        scores,
        seriesWins: room.seriesWins,
        seriesLength: room.seriesLength,
        seriesOver,
        seriesWinner,
      });
    }
  });

  // Powerup: Use
  socket.on('powerup:use', ({ type }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'playing') return;

    const result = usePowerup(room, socket.id, type);
    if (!result.success) {
      socket.emit('room:error', { message: result.message });
      return;
    }

    if (type === 'freeze') {
      const opponent = room.players.find((p) => p.id !== socket.id);
      if (opponent) {
        io.to(room.code).emit('powerup:freeze', {
          frozenPlayerId: opponent.id,
          duration: result.duration,
        });
      }
    } else if (type === 'hint') {
      socket.emit('powerup:hint', { cells: result.cells, word: result.word, duration: result.duration });
    } else if (type === 'fog') {
      const opponent = room.players.find((p) => p.id !== socket.id);
      if (opponent) {
        io.to(opponent.id).emit('powerup:fog', {
          duration: result.duration,
        });
      }
    } else if (type === 'bonus') {
      socket.emit('powerup:bonus', {});
    } else if (type === 'rotate') {
      const opponent = room.players.find((p) => p.id !== socket.id);
      if (opponent) {
        io.to(opponent.id).emit('powerup:rotate', {
          duration: result.duration,
        });
      }
    } else if (type === 'drain') {
      io.to(room.code).emit('powerup:drain', {
        scores: scoresPayload(room),
        usedBy: socket.id,
      });
    }

    socket.emit('powerup:earned', { powerups: result.powerups });
  });

  // Room: Play Again
  socket.on('room:playAgain', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.game && room.game.finalCountdownInterval) {
      clearInterval(room.game.finalCountdownInterval);
    }
    resetRoomToLobby(room);
    io.to(room.code).emit('room:update', { players: playersPayload(room) });
    io.to(room.code).emit('game:state', {
      phase: 'lobby',
      players: playersPayload(room),
      seriesWins: room.seriesWins,
      seriesLength: room.seriesLength,
    });
  });

  // Reconnection
  socket.on('reconnect:attempt', ({ roomCode, playerName }) => {
    console.log(`reconnect:attempt from ${socket.id} - name: ${playerName}, code: ${roomCode}`);
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

    // Send full state
    const statePayload = {
      phase: room.phase,
      roomCode: room.code,
      category: room.category,
      players: playersPayload(room),
      playerId: socket.id,
      scores: scoresPayload(room),
      seriesWins: room.seriesWins,
      seriesLength: room.seriesLength,
    };

    if (room.game) {
      statePayload.grid = room.game.grid;
      statePayload.words = room.game.words.map((w) => ({
        word: w.word,
        found: w.found,
        foundBy: w.foundBy,
      }));
    }

    socket.emit('game:state', statePayload);
    socket.to(roomCode).emit('player:reconnected', { playerId: socket.id });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomCode = getRoomCodeBySocket(socket.id);
    if (!roomCode) return;
    const room = getRoom(roomCode);
    if (!room) return;

    if (room.phase === 'playing') {
      // Give them time to reconnect
      socket.to(roomCode).emit('player:disconnected', { playerId: socket.id });
      const timerKey = `${roomCode}:${socket.id}`;
      disconnectTimers.set(
        timerKey,
        setTimeout(() => {
          disconnectTimers.delete(timerKey);
          const currentRoom = getRoom(roomCode);
          if (currentRoom && currentRoom.phase === 'playing') {
            // Forfeit: opponent wins
            const opponent = currentRoom.players.find((p) => p.id !== socket.id);
            if (opponent) {
              currentRoom.phase = 'results';
              const forfeitWinner = { id: opponent.id, name: opponent.name };
              if (currentRoom.seriesWins) {
                currentRoom.seriesWins[opponent.id] = (currentRoom.seriesWins[opponent.id] || 0) + 1;
              }
              const winsNeeded = Math.ceil(currentRoom.seriesLength / 2);
              const seriesOver = currentRoom.seriesLength === 1 || (currentRoom.seriesWins[opponent.id] >= winsNeeded);
              const seriesWinner = seriesOver ? forfeitWinner : null;
              io.to(roomCode).emit('game:end', {
                winner: forfeitWinner,
                scores: scoresPayload(currentRoom),
                reason: 'opponent_disconnected',
                seriesWins: currentRoom.seriesWins,
                seriesLength: currentRoom.seriesLength,
                seriesOver,
                seriesWinner,
              });
            }
          }
          removePlayer(socket.id);
        }, DISCONNECT_TIMEOUT)
      );
    } else {
      const remainingRoom = removePlayer(socket.id);
      if (remainingRoom) {
        io.to(roomCode).emit('room:update', { players: playersPayload(remainingRoom) });
      }
    }
  });
}
