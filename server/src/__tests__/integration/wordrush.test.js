import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import { createTestServer, waitFor } from '../helpers/testServer.js';
import { clearAllRooms } from '../../roomManager.js';

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

/** Connect and immediately create a room. */
function connectHost(name = 'Alice', category = 'Animals') {
  const s = ioClient(`${serverUrl}/wordrush`, { transports: ['websocket'] });
  s.on('connect', () => s.emit('room:create', { playerName: name, category, seriesLength: 1 }));
  return s;
}

/** Connect without auto-emitting anything. */
function connectGuest() {
  return ioClient(`${serverUrl}/wordrush`, { transports: ['websocket'] });
}

describe('WordRush — room lifecycle', () => {
  it('creates a room and receives room:created', async () => {
    const host = connectHost();
    const data = await waitFor(host, 'room:created');

    expect(data.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(data.players).toHaveLength(1);
    expect(data.players[0].name).toBe('Alice');

    host.disconnect();
  });

  it('second player joins and both get updated player lists', async () => {
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

  it('joining a non-existent room emits room:error', async () => {
    const guest = connectGuest();
    await new Promise((r) => guest.on('connect', r));
    guest.emit('room:join', { roomCode: 'ZZZZZZ', playerName: 'Alice' });
    const err = await waitFor(guest, 'room:error');
    expect(err.message).toBeTruthy();
    guest.disconnect();
  });

  it('both players ready triggers game:countdown on both sides', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    const guest = connectGuest();
    guest.emit('room:join', { roomCode, playerName: 'Bob' });
    await waitFor(guest, 'room:joined');

    const hostCountdown = waitFor(host, 'game:countdown', 5000);
    const guestCountdown = waitFor(guest, 'game:countdown', 5000);
    host.emit('player:ready');
    guest.emit('player:ready');

    const [hc, gc] = await Promise.all([hostCountdown, guestCountdown]);
    expect(hc.count).toBeGreaterThan(0);
    expect(gc.count).toBeGreaterThan(0);

    host.disconnect();
    guest.disconnect();
  });

  it('full flow: both ready → countdown ends → game:start with grid and words', async () => {
    const host = connectHost();
    const { roomCode } = await waitFor(host, 'room:created');

    const guest = connectGuest();
    guest.emit('room:join', { roomCode, playerName: 'Bob' });
    await waitFor(guest, 'room:joined');

    const hostStart = waitFor(host, 'game:start', 10000);
    const guestStart = waitFor(guest, 'game:start', 10000);
    host.emit('player:ready');
    guest.emit('player:ready');

    const [hs, gs] = await Promise.all([hostStart, guestStart]);

    expect(hs.grid).toBeDefined();
    expect(hs.words).toBeInstanceOf(Array);
    expect(hs.words.length).toBeGreaterThan(0);
    expect(gs.grid).toBeDefined();

    host.disconnect();
    guest.disconnect();
  }, 15000);
});
