import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/leafline', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

const SESSION_KEY = 'leafline_session';

// sessionStorage is per tab, so several tabs can be different players.
export function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable — the game still works, just without refresh recovery
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
