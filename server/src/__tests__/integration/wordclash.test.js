import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import { createTestServer, waitFor } from '../helpers/testServer.js';
import { clearAllRooms } from '../../wordclash/roomManager.js';

let serverUrl;
let closeServer;

beforeAll(async () => {
  const server = await createTestServer();
  serverUrl = server.url;
  closeServer = server.close;
});

afterAll(async () => {
  await closeServer();
});

beforeEach(() => {
  clearAllRooms();
});

function connectHost(name = 'Alice') {
  const s = ioClient(`${serverUrl}/wordclash`, { transports: ['websocket'] });
  s.on('connect', () => s.emit('room:create', { playerName: name }));
  return s;
}

function connectGuest() {
  return ioClient(`${serverUrl}/wordclash`, { transports: ['websocket'] });
}

describe('WordClash — room lifecycle', () => {
  it('creates a room and receives room:created with hostId', async () => {
    const host = connectHost();
    const data = await waitFor(host, 'room:created');

    expect(data.roomCode).toMatch(/^[A-Z]{4}$/);
    expect(data.hostId).toBe(host.id);
    expect(data.players).toHaveLength(1);

    host.disconnect();
  });

  it('second player joins and host gets room:update', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    const guest = connectGuest();
    const updatePromise = waitFor(host, 'room:update');
    guest.emit('room:join', { roomCode, playerName: 'Bob' });

    const [joined, update] = await Promise.all([waitFor(guest, 'room:joined'), updatePromise]);

    expect(joined.players).toHaveLength(2);
    expect(update.players.map((p) => p.name)).toContain('Bob');

    host.disconnect();
    guest.disconnect();
  });

  it('non-host cannot start the game', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    const guest = connectGuest();
    guest.emit('room:join', { roomCode, playerName: 'Bob' });
    await waitFor(guest, 'room:joined');

    guest.emit('game:start');
    const err = await waitFor(guest, 'room:error');
    expect(err.message).toMatch(/host/i);

    host.disconnect();
    guest.disconnect();
  });

  it('host starts game → both receive round:start with letters', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    const guest = connectGuest();
    guest.emit('room:join', { roomCode, playerName: 'Bob' });
    await waitFor(guest, 'room:joined');

    const hostRound = waitFor(host, 'round:start', 3000);
    const guestRound = waitFor(guest, 'round:start', 3000);
    host.emit('game:start');

    const [hr, gr] = await Promise.all([hostRound, guestRound]);
    expect(hr.letters).toBeInstanceOf(Array);
    expect(hr.letters.length).toBeGreaterThan(0);
    expect(gr.letters).toEqual(hr.letters);
    expect(hr.round).toBe(1);

    host.disconnect();
    guest.disconnect();
  });

  it('both players submit → round:end with scores', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    const guest = connectGuest();
    guest.emit('room:join', { roomCode, playerName: 'Bob' });
    await waitFor(guest, 'room:joined');

    host.emit('game:start');
    const { letters } = await waitFor(host, 'round:start', 3000);

    // Submit empty words — always valid, avoids needing real dictionary lookups
    const roundEnd = waitFor(host, 'round:end', 5000);
    host.emit('word:submit', { word: '' });
    guest.emit('word:submit', { word: '' });

    const result = await roundEnd;
    expect(result.round).toBe(1);
    expect(result.submissions).toBeDefined();
    expect(result.bestWords).toBeInstanceOf(Array);

    // Letters were usable (bestWords may be empty if letters are bad, that's fine)
    void letters;

    host.disconnect();
    guest.disconnect();
  });

  it('both ready after round:end → next round starts', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    // Set to 3 rounds so the game doesn't end after round 1
    host.emit('room:settings', { totalRounds: 3, roundTimeSeconds: 60 });

    const guest = connectGuest();
    guest.emit('room:join', { roomCode, playerName: 'Bob' });
    await waitFor(guest, 'room:joined');

    host.emit('game:start');
    await waitFor(host, 'round:start', 3000);

    // Both submit to end the round
    host.emit('word:submit', { word: '' });
    guest.emit('word:submit', { word: '' });
    await waitFor(host, 'round:end', 5000);

    // Both ready up
    const nextRound = waitFor(host, 'round:start', 5000);
    host.emit('round:ready');
    guest.emit('round:ready');

    const r2 = await nextRound;
    expect(r2.round).toBe(2);

    host.disconnect();
    guest.disconnect();
  });
});
