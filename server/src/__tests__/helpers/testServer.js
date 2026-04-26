import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { registerSocketHandlers } from '../../socketHandlers.js';
import { registerWordClashHandlers } from '../../wordclash/socketHandlers.js';
import { initDictionary } from '../../wordclash/dictionary.js';

let dictionaryInitPromise = null;

function ensureDictionary() {
  if (!dictionaryInitPromise) dictionaryInitPromise = initDictionary();
  return dictionaryInitPromise;
}

export async function createTestServer() {
  await ensureDictionary();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    transports: ['websocket'],
  });

  const wordrushNs = io.of('/wordrush');
  wordrushNs.on('connection', (socket) => registerSocketHandlers(wordrushNs, socket));

  const wordclashNs = io.of('/wordclash');
  wordclashNs.on('connection', (socket) => registerWordClashHandlers(wordclashNs, socket));

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve()))),
  };
}

/** Wait for a socket to emit a specific event, with a timeout. */
export function waitFor(socket, event, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}
