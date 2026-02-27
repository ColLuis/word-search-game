const rooms = new Map();
const socketToRoom = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(socketId, playerName, category) {
  const code = generateCode();
  const player = { id: socketId, name: playerName, ready: false, score: 0 };
  const room = {
    code,
    category,
    players: [player],
    phase: 'lobby', // lobby | countdown | playing | results
    game: null,     // set by gameManager on start
  };
  rooms.set(code, room);
  socketToRoom.set(socketId, code);
  return room;
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.players.length >= 2) return { error: 'Room is full' };
  if (room.phase !== 'lobby') return { error: 'Game already in progress' };

  const player = { id: socketId, name: playerName, ready: false, score: 0 };
  room.players.push(player);
  socketToRoom.set(socketId, code);
  return { room };
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function getRoomBySocket(socketId) {
  const code = socketToRoom.get(socketId);
  return code ? rooms.get(code) : null;
}

export function getRoomCodeBySocket(socketId) {
  return socketToRoom.get(socketId) || null;
}

export function setPlayerReady(socketId) {
  const room = getRoomBySocket(socketId);
  if (!room) return null;
  const player = room.players.find((p) => p.id === socketId);
  if (player) player.ready = true;
  return room;
}

export function allPlayersReady(room) {
  return room.players.length === 2 && room.players.every((p) => p.ready);
}

export function removePlayer(socketId) {
  const code = socketToRoom.get(socketId);
  if (!code) return null;
  const room = rooms.get(code);
  if (!room) return null;

  socketToRoom.delete(socketId);
  room.players = room.players.filter((p) => p.id !== socketId);

  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }
  return room;
}

export function updateSocketId(oldId, newId) {
  const code = socketToRoom.get(oldId);
  if (!code) return null;
  socketToRoom.delete(oldId);
  socketToRoom.set(newId, code);

  const room = rooms.get(code);
  if (room) {
    const player = room.players.find((p) => p.id === oldId);
    if (player) player.id = newId;
  }
  return room;
}

export function resetRoomToLobby(room) {
  room.phase = 'lobby';
  room.game = null;
  room.players.forEach((p) => {
    p.ready = false;
    p.score = 0;
  });
}

export function deleteRoom(code) {
  const room = rooms.get(code);
  if (room) {
    room.players.forEach((p) => socketToRoom.delete(p.id));
    rooms.delete(code);
  }
}
