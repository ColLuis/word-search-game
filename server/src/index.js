import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers.js';
import { registerWordClashHandlers } from './wordclash/socketHandlers.js';
import { initDictionary } from './wordclash/dictionary.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: isProduction
    ? {}
    : {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

if (isProduction) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// WordRush namespace
const wordrushNs = io.of('/wordrush');
wordrushNs.on('connection', (socket) => {
  console.log(`[WordRush] Connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
  registerSocketHandlers(wordrushNs, socket);
  socket.on('disconnect', (reason) => {
    console.log(`[WordRush] Disconnected: ${socket.id} (reason: ${reason})`);
  });
});

// WordClash namespace
const wordclashNs = io.of('/wordclash');
wordclashNs.on('connection', (socket) => {
  console.log(`[WordClash] Connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
  registerWordClashHandlers(wordclashNs, socket);
  socket.on('disconnect', (reason) => {
    console.log(`[WordClash] Disconnected: ${socket.id} (reason: ${reason})`);
  });
});

async function start() {
  await initDictionary();
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
