import { LINK_IDS, MAX_PLAYERS, MIN_PLAYERS, validateClue } from '../../../shared/leafline.js';
import {
  buildCardDeck,
  computeScore,
  createRng,
  dealBoards,
  evaluateGuess,
  linkWords,
  shuffle,
  submitsNeeded,
  wordsAt,
} from './engine.js';

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const PLAYER_COLORS = ['#3F7A5C', '#E59458', '#7AA9A3', '#C44A3B', '#9A6B45', '#B5838D'];
const CODE_CHARS = 'ACDEFGHJKLMNPQRSTUVWXYZ';
const SLOTS = [0, 1, 2, 3];

const rooms = new Map();
const secrets = new Map(); // playerId → secret

const cleanupTimer = setInterval(
  () => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) rooms.delete(code);
    }
  },
  10 * 60 * 1000
);
cleanupTimer.unref();

function randomCode() {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function fail(error) {
  return { error };
}

function validName(name) {
  return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 16;
}

export function getRoom(code) {
  return rooms.get(code);
}

export function clearAllRooms() {
  rooms.clear();
  secrets.clear();
}

export function createRoom(name) {
  if (!validName(name)) return fail('Name must be 1–16 characters');
  let code = randomCode();
  while (rooms.has(code)) code = randomCode();

  const playerId = randomId();
  const secret = randomId();
  secrets.set(playerId, secret);

  const room = {
    code,
    hostId: playerId,
    players: [{ id: playerId, name: name.trim(), color: PLAYER_COLORS[0], connected: true }],
    phase: 'lobby',
    cards: new Map(),
    boards: [],
    ready: new Set(),
    currentBoardIndex: 0,
    guess: null,
    reveal: null,
    score: 0,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return { room, playerId, secret };
}

export function joinRoom(rawCode, name, playerId, secret) {
  const room = rooms.get(String(rawCode ?? '').toUpperCase());
  if (!room) return fail('Room not found');

  if (playerId && secret) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player || secrets.get(playerId) !== secret) return fail('Could not rejoin that room');
    player.connected = true;
    return { room, playerId, secret };
  }

  if (room.phase !== 'lobby') return fail('Game already started');
  if (room.players.length >= MAX_PLAYERS) return fail('Room is full');
  if (!validName(name)) return fail('Name must be 1–16 characters');
  if (room.players.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) {
    return fail('Name already taken');
  }

  const newId = randomId();
  const newSecret = randomId();
  secrets.set(newId, newSecret);
  const color = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
  room.players.push({ id: newId, name: name.trim(), color, connected: true });
  return { room, playerId: newId, secret: newSecret };
}

export function disconnect(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
  if (room.hostId === playerId) {
    const next = room.players.find((p) => p.connected);
    if (next) room.hostId = next.id;
  }
  return room;
}

/** Leaving on purpose: gone from the lobby list; mid-game they just show as away. */
export function leaveRoom(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.phase === 'lobby') {
    room.players = room.players.filter((p) => p.id !== playerId);
    secrets.delete(playerId);
    if (room.players.length === 0) {
      rooms.delete(code);
      return null;
    }
  }
  return disconnect(code, playerId);
}

export function kickPlayer(code, hostId, targetId) {
  const room = rooms.get(code);
  if (!room) return fail('Room not found');
  if (room.hostId !== hostId) return fail('Only the host can remove players');
  if (room.phase !== 'lobby') return fail('Players can only be removed in the lobby');
  if (targetId === hostId) return fail("You can't remove yourself");
  room.players = room.players.filter((p) => p.id !== targetId);
  secrets.delete(targetId);
  return room;
}

export function startGame(code, hostId) {
  const room = rooms.get(code);
  if (!room) return fail('Room not found');
  if (room.hostId !== hostId) return fail('Only the host can start');
  if (room.phase !== 'lobby') return fail('Game already started');
  const connected = room.players.filter((p) => p.connected);
  if (connected.length < MIN_PLAYERS) return fail(`Need at least ${MIN_PLAYERS} players`);

  const seed = Date.now();
  const deck = buildCardDeck(undefined, createRng(seed));
  room.cards = new Map(deck.map((c) => [c.id, c]));
  room.boards = dealBoards(
    connected.map((p) => p.id),
    deck,
    createRng(seed ^ 0xdeadbeef)
  );
  room.phase = 'writing';
  room.ready = new Set();
  room.score = 0;
  room.currentBoardIndex = 0;
  room.guess = null;
  room.reveal = null;
  return room;
}

export function updateClue(code, playerId, linkId, text) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'writing') return fail('Not in writing phase');
  if (!LINK_IDS.includes(linkId)) return fail('Unknown clue position');
  if (room.ready.has(playerId)) return fail('Unready to edit your clues');
  const board = room.boards.find((b) => b.ownerId === playerId);
  if (!board) return fail('Board not found');
  board.clues[linkId] = String(text ?? '').slice(0, 20);
  return room;
}

export function setReady(code, playerId, ready) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'writing') return fail('Not in writing phase');
  const board = room.boards.find((b) => b.ownerId === playerId);
  if (!board) return fail('Board not found');

  if (ready) {
    for (const linkId of LINK_IDS) {
      const [a, b] = linkWords(room.cards, board.solution, linkId);
      const err = validateClue(board.clues[linkId], a, b);
      if (err) return fail(`${linkId[0].toUpperCase()}${linkId.slice(1)} clue: ${err}`);
    }
    room.ready.add(playerId);
  } else {
    room.ready.delete(playerId);
  }
  maybeStartGuessing(room);
  return room;
}

function maybeStartGuessing(room) {
  if (room.boards.every((b) => room.ready.has(b.ownerId))) {
    room.phase = 'guessing';
    loadBoard(room, 0);
  }
}

function loadBoard(room, index) {
  room.currentBoardIndex = index;
  room.reveal = null;
  const board = room.boards[index];
  const tray = shuffle([...SLOTS.map((s) => board.solution[s].cardId), board.decoyCardId]).map(
    (cardId) => ({ cardId, rotation: Math.floor(Math.random() * 4) })
  );

  room.guess = {
    boardOwnerId: board.ownerId,
    attempt: 1,
    slots: [null, null, null, null],
    locked: [],
    tray,
    submitted: [],
  };
}

function activeGuess(code, playerId) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'guessing' || !room.guess) return fail('No board to guess');
  if (room.guess.boardOwnerId === playerId) return fail("It's your board — stay quiet!");
  return room;
}

export function placeCard(code, playerId, cardId, slot) {
  const room = activeGuess(code, playerId);
  if (room.error) return room;
  const { guess } = room;
  if (!SLOTS.includes(slot)) return fail('Unknown slot');
  if (guess.locked.includes(slot)) return fail('That card is locked in');

  const displaced = guess.slots[slot];
  const trayIdx = guess.tray.findIndex((p) => p.cardId === cardId);
  let moving;
  if (trayIdx !== -1) {
    [moving] = guess.tray.splice(trayIdx, 1);
    if (displaced) guess.tray.splice(trayIdx, 0, displaced);
  } else {
    // Moving between spots on the board swaps the two cards.
    const from = guess.slots.findIndex((p) => p?.cardId === cardId);
    if (from === -1) return fail('Card not found');
    if (guess.locked.includes(from)) return fail('That card is locked in');
    moving = guess.slots[from];
    guess.slots[from] = displaced;
  }

  guess.slots[slot] = moving;
  guess.submitted = [];
  return room;
}

export function rotateCard(code, playerId, slot) {
  const room = activeGuess(code, playerId);
  if (room.error) return room;
  const p = room.guess.slots[slot];
  if (!p) return fail('That slot is empty');
  if (room.guess.locked.includes(slot)) return fail('That card is locked in');
  p.rotation = (p.rotation + 1) % 4;
  room.guess.submitted = [];
  return room;
}

export function returnCard(code, playerId, cardId) {
  const room = activeGuess(code, playerId);
  if (room.error) return room;
  const { guess } = room;
  const slot = guess.slots.findIndex((p) => p?.cardId === cardId);
  if (slot === -1) return fail('Card not on the board');
  if (guess.locked.includes(slot)) return fail('That card is locked in');
  guess.tray.push(guess.slots[slot]);
  guess.slots[slot] = null;
  guess.submitted = [];
  return room;
}

export function submitGuess(code, playerId) {
  const room = activeGuess(code, playerId);
  if (room.error) return room;
  const { guess } = room;
  if (guess.slots.some((p) => !p)) return fail('Fill all four spots first');

  if (!guess.submitted.includes(playerId)) guess.submitted.push(playerId);
  if (guess.submitted.length >= submitsNeeded(room)) {
    guess.submitted = [];
    evaluate(room);
  }
  return room;
}

export function unsubmitGuess(code, playerId) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'guessing' || !room.guess) return fail('No board to guess');
  room.guess.submitted = room.guess.submitted.filter((id) => id !== playerId);
  return room;
}

function evaluate(room) {
  const { guess } = room;
  const board = room.boards[room.currentBoardIndex];
  const { correctSlots, allCorrect } = evaluateGuess(guess.slots, board.solution);

  if (allCorrect || guess.attempt === 2) {
    const points = computeScore(guess.attempt, allCorrect);
    room.score += points;
    room.phase = 'reveal';
    room.reveal = {
      correctSlots,
      points,
      solution: SLOTS.map((s) => {
        const p = board.solution[s];
        return wordsAt(room.cards.get(p.cardId), p.rotation);
      }),
    };
    return;
  }

  guess.locked = correctSlots;
  for (const slot of SLOTS) {
    if (!correctSlots.includes(slot) && guess.slots[slot]) {
      guess.tray.push(guess.slots[slot]);
      guess.slots[slot] = null;
    }
  }
  guess.attempt = 2;
}

export function nextBoard(code, hostId) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'reveal') return fail('Nothing to move on from');
  if (room.hostId !== hostId) return fail('Only the host can continue');
  const next = room.currentBoardIndex + 1;
  if (next >= room.boards.length) {
    room.phase = 'results';
    room.guess = null;
    room.reveal = null;
  } else {
    room.phase = 'guessing';
    loadBoard(room, next);
  }
  return room;
}

export function playAgain(code, hostId) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'results') return fail('Game is not over');
  if (room.hostId !== hostId) return fail('Only the host can restart');
  room.phase = 'lobby';
  room.boards = [];
  room.guess = null;
  room.reveal = null;
  room.score = 0;
  room.currentBoardIndex = 0;
  return room;
}
