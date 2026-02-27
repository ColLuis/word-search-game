import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers.js';
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
  allowUpgrades: true,
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

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
  registerSocketHandlers(io, socket);
  socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${socket.id} (reason: ${reason})`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
