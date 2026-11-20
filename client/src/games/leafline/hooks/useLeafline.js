import { useCallback, useEffect, useRef, useState } from 'react';
import { LEAFLINE_EVENTS as E } from 'shared/leafline.js';
import { getSocket, readSession, saveSession, clearSession } from '../lib/socket.js';

export default function useLeafline() {
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [toast, setToast] = useState(null);
  const [restoring, setRestoring] = useState(() => Boolean(readSession()));
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const reset = useCallback(() => {
    clearSession();
    setRoom(null);
    setPlayerId(null);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const rejoin = () => {
      const saved = readSession();
      if (!saved) {
        setRestoring(false);
        return;
      }
      socket.emit(E.ROOM_JOIN, saved, (ack) => {
        setRestoring(false);
        if (ack?.error) {
          reset();
        } else {
          setPlayerId(ack.playerId);
        }
      });
    };

    const onError = ({ message, kicked }) => {
      showToast(message);
      if (kicked) reset();
    };

    socket.on('connect', rejoin);
    socket.on(E.STATE, setRoom);
    socket.on(E.ERROR, onError);

    if (socket.connected) rejoin();
    else socket.connect();

    return () => {
      socket.off('connect', rejoin);
      socket.off(E.STATE, setRoom);
      socket.off(E.ERROR, onError);
      clearTimeout(toastTimer.current);
    };
  }, [reset, showToast]);

  const enter = useCallback(
    (event, payload) =>
      new Promise((resolve, reject) => {
        getSocket().emit(event, payload, (ack) => {
          if (ack?.error) return reject(new Error(ack.error));
          saveSession({ code: ack.code, playerId: ack.playerId, secret: ack.secret });
          setPlayerId(ack.playerId);
          resolve(ack);
        });
      }),
    []
  );

  const createRoom = useCallback((name) => enter(E.ROOM_CREATE, { name }), [enter]);
  const joinRoom = useCallback((code, name) => enter(E.ROOM_JOIN, { code, name }), [enter]);

  const send = useCallback((event, payload) => getSocket().emit(event, payload), []);

  const leave = useCallback(() => {
    getSocket().emit(E.ROOM_LEAVE);
    reset();
  }, [reset]);

  return { room, playerId, toast, restoring, createRoom, joinRoom, send, leave };
}
