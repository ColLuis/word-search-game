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
import { startGame, validateWordFound, checkGameEnd } from './gameManager.js';
import { earnPowerup, usePowerup } from './powerupManager.js';
import { COUNTDOWN_SECONDS, DISCONNECT_TIMEOUT } from './constants.js';

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
  socket.on('room:create', ({ playerName, category }) => {
    console.log(`room:create from ${socket.id} - name: ${playerName}, category: ${category}`);
    const room = createRoom(socket.id, playerName, category);
    socket.join(room.code);
    console.log(`Room ${room.code} created with player ${playerName}`);
    socket.emit('room:created', {
      roomCode: room.code,
      players: playersPayload(room),
      category: room.category,
      playerId: socket.id,
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

    // Update score (apply bonus multiplier if active)
    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      const pState = room.game.powerups[socket.id];
      const multiplier = pState && pState.bonusActive ? 2 : 1;
      player.score += multiplier;
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

    // Check game end
    if (checkGameEnd(room)) {
      room.phase = 'results';
      const scores = scoresPayload(room);
      const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
      const winner =
        sortedPlayers[0].score === sortedPlayers[1].score
          ? null
          : { id: sortedPlayers[0].id, name: sortedPlayers[0].name };

      io.to(room.code).emit('game:end', { winner, scores });
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
          patches: result.patches,
          duration: result.duration,
        });
      }
    } else if (type === 'bonus') {
      socket.emit('powerup:bonus', {});
    } else if (type === 'steal') {
      io.to(room.code).emit('powerup:steal', {
        scores: scoresPayload(room),
        thiefId: socket.id,
      });
    }

    socket.emit('powerup:earned', { powerups: result.powerups });
  });

  // Room: Play Again
  socket.on('room:playAgain', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    resetRoomToLobby(room);
    io.to(room.code).emit('room:update', { players: playersPayload(room) });
    io.to(room.code).emit('game:state', {
      phase: 'lobby',
      players: playersPayload(room),
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
              io.to(roomCode).emit('game:end', {
                winner: { id: opponent.id, name: opponent.name },
                scores: scoresPayload(currentRoom),
                reason: 'opponent_disconnected',
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
