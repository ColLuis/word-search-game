# Word Search Game — Project Guide

## Stack

| Layer      | Tech                                                                 |
| ---------- | -------------------------------------------------------------------- |
| Client     | React 19, Vite 6, Tailwind CSS, react-router-dom 7, socket.io-client |
| Server     | Node.js 22, Express, Socket.IO 4 (WebSocket + polling)               |
| Shared     | Plain ESM module (`shared/events.js`) — event name constants         |
| Workspaces | npm workspaces: `client`, `server`, `shared`                         |
| Tests      | Vitest (server only — no client tests yet)                           |
| Hosting    | Railway (single-process, single instance)                            |

## Three Games in One Repo

There are three games sharing the same server process, split by Socket.IO namespace:

- **WordRush** (`/wordrush` namespace) — original word-search grid game
  - Server: `server/src/roomManager.js`, `server/src/gameManager.js`, `server/src/socketHandlers.js`
- **WordClash** (`/wordclash` namespace) — competitive real-time word game
  - Server: `server/src/wordclash/roomManager.js`, `server/src/wordclash/gameManager.js`, `server/src/wordclash/socketHandlers.js`
- **WordLink** (shown to players as WordLink at `/wordlink`; code and the `/leafline` Socket.IO namespace still use its old name, Leafline) — 2–6 player co-op clue game: each player writes one-word clues around a 2×2 board of word cards, then the team rebuilds every board
  - Server: `server/src/leafline/engine.js` (pure rules), `server/src/leafline/roomManager.js`, `server/src/leafline/socketHandlers.js`
  - Shared: `shared/leafline.js` — event names, clue validation and board geometry used by both server and client
  - The server sends each player their own filtered `state` (others' solutions are hidden until reveal); reconnects use a per-tab `sessionStorage` session

**Important:** Each game has parallel file structures. Changes to one game's logic should not bleed into the other. Always confirm which namespace you're targeting.

## Common Commands

```bash
npm run dev          # Start server + client concurrently (client on :5173, server on :3001)
npm run dev:server   # Server only
npm run dev:client   # Client only
npm test -w server   # Run server unit tests
npm run build        # Build client to client/dist/
```

In production the server serves `client/dist/` as static files — there is no separate client host.

## Key Architecture Notes

- **Stateful in-memory rooms.** `roomManager.js` in both games uses `new Map()` for room and socket-to-room state. There is no database. This means the server cannot be scaled horizontally without adding a Redis adapter (see Scale Plan below).
- **Single instance only.** Do not deploy multiple server replicas without first adding Socket.IO Redis adapter + sticky sessions or moving state to Redis.
- **`/health` endpoint** at `GET /health` returns `{ status: 'ok' }` — used by the host's healthcheck.
- **Dictionary init.** `initDictionary()` runs async at startup (WordClash). Server won't accept connections until it resolves.
- **CORS.** In development CORS allows `http://localhost:5173`. In production CORS is locked down (empty config = same-origin only, since client is served from the same process).

## Environment Variables

| Variable   | Default | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| `PORT`     | `3001`  | Server listen port                                       |
| `NODE_ENV` | (unset) | Set to `production` to serve static client and lock CORS |

Client uses `VITE_*` env vars — see `client/.env.example` if present.

## Scale Plan (when needed)

Current blocker: in-memory room state.

**Option A (lower effort):** Socket.IO Redis adapter + sticky sessions

- Add `@socket.io/redis-adapter`, point at a Redis instance, enable sticky sessions on the load balancer.
- Room objects stay on individual nodes but events broadcast across all.

**Option B (full horizontal scale):** Move room/round state to Redis

- Rewrite `roomManager` and `gameManager` to read/write Redis instead of `Map`.
- Fully stateless server instances.

Don't implement either until traffic requires it.
