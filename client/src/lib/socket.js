import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || '';
    socket = io(serverUrl || undefined, {
      autoConnect: false,
    });
  }
  return socket;
}
