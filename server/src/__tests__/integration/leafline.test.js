import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import { createTestServer, waitFor } from '../helpers/testServer.js';
import { clearAllRooms, getRoom } from '../../leafline/roomManager.js';
import { LINK_IDS } from '../../../../shared/leafline.js';

let serverUrl;
let closeServer;
let sockets = [];

beforeAll(async () => {
  const server = await createTestServer();
  serverUrl = server.url;
  closeServer = server.close;
});

afterAll(async () => {
  await closeServer();
});

beforeEach(() => clearAllRooms());

afterEach(() => {
  sockets.forEach((s) => s.disconnect());
  sockets = [];
});

async function connect() {
  const s = ioClient(`${serverUrl}/leafline`, { transports: ['websocket'] });
  s.latest = null;
  s.on('state', (state) => {
    s.latest = state;
  });
  sockets.push(s);
  await waitFor(s, 'connect');
  return s;
}

const call = (s, event, payload) => new Promise((resolve) => s.emit(event, payload, resolve));

async function until(check, timeoutMs = 2000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('Timed out waiting for condition');
    await new Promise((r) => setTimeout(r, 5));
  }
}

async function send(s, event, payload, check) {
  s.emit(event, payload);
  await until(check);
}

async function startedGame() {
  const host = await connect();
  const { code, playerId, secret } = await call(host, 'room:create', { name: 'Ana' });
  Object.assign(host, { playerId, secret });
  const b = await connect();
  const c = await connect();
  b.playerId = (await call(b, 'room:join', { code, name: 'Ben' })).playerId;
  c.playerId = (await call(c, 'room:join', { code, name: 'Cy' })).playerId;
  const players = [host, b, c];
  await send(host, 'game:start', undefined, () =>
    players.every((p) => p.latest?.phase === 'writing')
  );
  return { code, room: getRoom(code), players };
}

const CLUES = { top: 'qzone', right: 'qzrow', bottom: 'qzest', left: 'qzark' };

async function writeAndReady(room, players) {
  for (const p of players) {
    for (const linkId of LINK_IDS) p.emit('clue:update', { linkId, text: CLUES[linkId] });
    await send(
      p,
      'clue:ready',
      { ready: true },
      () => room.ready.has(p.playerId) || room.phase !== 'writing'
    );
  }
  await until(() => players.every((p) => p.latest?.phase === 'guessing'));
}

const guessersOf = (room, players) => players.filter((p) => p.playerId !== room.guess.boardOwnerId);

/** Places the solution for every unlocked slot; `wrongSlot` gets the decoy instead. */
async function placeSolution(room, guesser, wrongSlot) {
  const board = room.boards[room.currentBoardIndex];
  for (const slot of [0, 1, 2, 3]) {
    if (room.guess.locked.includes(slot)) continue;
    const cardId = slot === wrongSlot ? board.decoyCardId : board.solution[slot].cardId;
    await send(
      guesser,
      'guess:place',
      { cardId, slot },
      () => room.guess.slots[slot]?.cardId === cardId
    );
    const want = slot === wrongSlot ? 0 : board.solution[slot].rotation;
    while (room.guess.slots[slot].rotation !== want) {
      const before = room.guess.slots[slot].rotation;
      await send(
        guesser,
        'guess:rotate',
        { slot },
        () => room.guess.slots[slot].rotation !== before
      );
    }
  }
}

async function submitBoth(room, guessers) {
  const startAttempt = room.guess.attempt;
  const startPhase = room.phase;
  await send(guessers[0], 'guess:submit', undefined, () => room.guess.submitted.length === 1);
  await send(
    guessers[1],
    'guess:submit',
    undefined,
    () => room.phase !== startPhase || room.guess.attempt !== startAttempt
  );
}

describe('Leafline — two players', () => {
  it("won't start with the host alone", async () => {
    const host = await connect();
    await call(host, 'room:create', { name: 'Ana' });
    const err = waitFor(host, 'leafline:error');
    host.emit('game:start');
    expect((await err).message).toMatch(/at least 2/);
  });

  it('plays both boards with one guesser each', async () => {
    const host = await connect();
    const { code, playerId } = await call(host, 'room:create', { name: 'Ana' });
    host.playerId = playerId;
    const ben = await connect();
    ben.playerId = (await call(ben, 'room:join', { code, name: 'Ben' })).playerId;
    const players = [host, ben];
    await send(host, 'game:start', undefined, () =>
      players.every((p) => p.latest?.phase === 'writing')
    );
    const room = getRoom(code);
    expect(room.boards).toHaveLength(2);
    await writeAndReady(room, players);

    for (let board = 0; board < 2; board++) {
      const [guesser] = guessersOf(room, players);
      expect(guesser.latest.guess.submitsNeeded).toBe(1);
      await placeSolution(room, guesser);
      await send(guesser, 'guess:submit', undefined, () => room.phase === 'reveal');
      await send(host, 'board:next', undefined, () => room.phase !== 'reveal');
    }

    await until(() => ben.latest.phase === 'results');
    expect(ben.latest.score).toBe(12);
  });
});

describe('Leafline — full game', () => {
  it('only shows each player their own board while writing', async () => {
    const { players } = await startedGame();
    const [host] = players;
    expect(host.latest.myBoard.slots).toHaveLength(4);
    expect(host.latest.guess).toBeUndefined();
  });

  it('rejects readying with a clue that reuses a linked word', async () => {
    const { room, players } = await startedGame();
    const [host] = players;
    const board = room.boards.find((b) => b.ownerId === host.playerId);
    const p = board.solution[0];
    const word = room.cards.get(p.cardId).words[(1 - p.rotation + 4) % 4];
    for (const linkId of LINK_IDS) host.emit('clue:update', { linkId, text: CLUES[linkId] });
    host.emit('clue:update', { linkId: 'top', text: word });
    const err = waitFor(host, 'leafline:error');
    host.emit('clue:ready', { ready: true });
    expect((await err).message).toMatch(/^Top clue/);
    expect(room.ready.has(host.playerId)).toBe(false);
  });

  it('plays three boards: first-try win, second-try win, then a miss', async () => {
    const { room, players } = await startedGame();
    await writeAndReady(room, players);
    const host = players[0];

    // Board 1: solved first try.
    let guessers = guessersOf(room, players);
    await placeSolution(room, guessers[0]);
    await send(guessers[0], 'guess:submit', undefined, () => room.guess.submitted.length === 1);
    await until(() => guessers[1].latest.guess.submitted.length === 1);
    await send(guessers[1], 'guess:submit', undefined, () => room.phase === 'reveal');
    await until(() => host.latest.phase === 'reveal');
    expect(host.latest.reveal.points).toBe(6);
    expect(host.latest.reveal.solution).toHaveLength(4);

    // Board 2: decoy in slot 3 first, then fixed. Unsubmit in between.
    await send(
      host,
      'board:next',
      undefined,
      () => room.currentBoardIndex === 1 && room.phase === 'guessing'
    );
    guessers = guessersOf(room, players);
    await placeSolution(room, guessers[0], 3);
    await send(guessers[0], 'guess:submit', undefined, () => room.guess.submitted.length === 1);
    await send(guessers[0], 'guess:unsubmit', undefined, () => room.guess.submitted.length === 0);
    await submitBoth(room, guessers);
    expect(room.guess.attempt).toBe(2);
    expect(room.guess.locked).toEqual([0, 1, 2]);
    expect(room.guess.submitted).toEqual([]);
    await placeSolution(room, guessers[0]);
    await submitBoth(room, guessers);
    expect(room.reveal.points).toBe(2);

    // Board 3: missed twice.
    await send(
      host,
      'board:next',
      undefined,
      () => room.currentBoardIndex === 2 && room.phase === 'guessing'
    );
    guessers = guessersOf(room, players);
    await placeSolution(room, guessers[0], 0);
    await submitBoth(room, guessers);
    await placeSolution(room, guessers[0], 0);
    await submitBoth(room, guessers);
    expect(room.reveal.points).toBe(0);

    await send(host, 'board:next', undefined, () =>
      players.every((p) => p.latest.phase === 'results')
    );
    expect(players[1].latest.score).toBe(8);

    await send(host, 'play:again', undefined, () =>
      players.every((p) => p.latest.phase === 'lobby')
    );
  });

  it('swaps two cards when one is moved onto the other', async () => {
    const { room, players } = await startedGame();
    await writeAndReady(room, players);
    const [g] = guessersOf(room, players);
    const [a, b] = room.guess.tray;
    await send(g, 'guess:place', { cardId: a.cardId, slot: 0 }, () => room.guess.slots[0]);
    await send(g, 'guess:place', { cardId: b.cardId, slot: 1 }, () => room.guess.slots[1]);
    await send(
      g,
      'guess:place',
      { cardId: a.cardId, slot: 1 },
      () => room.guess.slots[1].cardId === a.cardId
    );
    expect(room.guess.slots[0].cardId).toBe(b.cardId);
    expect(room.guess.tray).toHaveLength(3);
  });

  it('removes a player who leaves the lobby, and the host can kick', async () => {
    const host = await connect();
    const { code, playerId } = await call(host, 'room:create', { name: 'Ana' });
    const ben = await connect();
    const cy = await connect();
    const benAck = await call(ben, 'room:join', { code, name: 'Ben' });
    const cyAck = await call(cy, 'room:join', { code, name: 'Cy' });
    const room = getRoom(code);

    ben.emit('room:leave');
    await until(() => !room.players.some((p) => p.id === benAck.playerId));

    const kicked = waitFor(cy, 'leafline:error');
    host.emit('room:kick', { playerId: cyAck.playerId });
    expect((await kicked).kicked).toBe(true);
    expect(room.players.map((p) => p.id)).toEqual([playerId]);

    const back = await call(cy, 'room:join', {
      code,
      playerId: cyAck.playerId,
      secret: cyAck.secret,
    });
    expect(back.error).toBeTruthy();
  });

  it('keeps the board owner from touching their own board', async () => {
    const { room, players } = await startedGame();
    await writeAndReady(room, players);
    const owner = players.find((p) => p.playerId === room.guess.boardOwnerId);
    const err = waitFor(owner, 'leafline:error');
    owner.emit('guess:place', { cardId: room.guess.tray[0].cardId, slot: 0 });
    expect((await err).message).toMatch(/your board/i);
  });

  it('rejoins mid-game with saved credentials, and refuses wrong ones', async () => {
    const { code, room, players } = await startedGame();
    const [host, ben] = players;

    host.disconnect();
    await until(() => room.players.find((p) => p.id === host.playerId).connected === false);
    expect(room.hostId).not.toBe(host.playerId);

    const again = await connect();
    const bad = await call(again, 'room:join', { code, playerId: host.playerId, secret: 'nope' });
    expect(bad.error).toBeTruthy();

    const ok = await call(again, 'room:join', {
      code,
      playerId: host.playerId,
      secret: host.secret,
    });
    expect(ok.playerId).toBe(host.playerId);
    await until(() => again.latest?.phase === 'writing');
    expect(again.latest.myBoard.slots).toHaveLength(4);
    expect(room.players.find((p) => p.id === host.playerId).connected).toBe(true);

    const late = await call(ben, 'room:join', { code, name: 'Zed' });
    expect(late.error).toBe('Game already started');
  });
});
