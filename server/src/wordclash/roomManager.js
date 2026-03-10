import { DEFAULTS, AVATAR_COLORS } from './constants.js';

const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(code));
  return code;
}

export function createRoom(socketId, playerName) {
  const code = generateCode();
  const room = {
    code,
    phase: 'lobby',
    hostId: socketId,
    totalRounds: DEFAULTS.ROUNDS,
    roundTimeSeconds: DEFAULTS.ROUND_TIME,
    players: [
      {
        id: socketId,
        name: playerName,
        color: AVATAR_COLORS[0],
        score: 0,
      },
    ],
    game: null,
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(roomCode, socketId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.players.length >= DEFAULTS.MAX_PLAYERS) return { error: 'Room is full' };
  if (room.phase !== 'lobby') return { error: 'Game already in progress' };
  if (room.players.some((p) => p.name === playerName)) return { error: 'Name already taken' };

  const colorIndex = room.players.length;
  room.players.push({
    id: socketId,
    name: playerName,
    color: AVATAR_COLORS[colorIndex % AVATAR_COLORS.length],
    score: 0,
  });

  return { room };
}

export function getRoom(code) {
  return rooms.get(code);
}

export function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) return room;
  }
  return null;
}

export function removePlayer(socketId) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(code);
      return null;
    }

    // Transfer host if needed
    if (room.hostId === socketId) {
      room.hostId = room.players[0].id;
    }

    return room;
  }
  return null;
}

export function updateSettings(room, settings) {
  if (settings.totalRounds !== undefined) room.totalRounds = settings.totalRounds;
  if (settings.roundTimeSeconds !== undefined) room.roundTimeSeconds = settings.roundTimeSeconds;
}

export function updateSocketId(oldId, newId) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.id === oldId);
    if (player) {
      player.id = newId;
      if (room.hostId === oldId) {
        room.hostId = newId;
      }
      // Update game submissions if needed
      if (room.game?.submissions) {
        const sub = room.game.submissions.get(oldId);
        if (sub) {
          room.game.submissions.delete(oldId);
          room.game.submissions.set(newId, sub);
        }
      }
      if (room.game?.scores && room.game.scores[oldId] !== undefined) {
        room.game.scores[newId] = room.game.scores[oldId];
        delete room.game.scores[oldId];
      }
      return room;
    }
  }
  return null;
}

export function resetRoomToLobby(room) {
  room.phase = 'lobby';
  room.game = null;
  room.players.forEach((p) => { p.score = 0; });
}
