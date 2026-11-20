import { LEAFLINE_EVENTS as E } from '../../../shared/leafline.js';
import { viewFor } from './engine.js';
import * as rooms from './roomManager.js';

// socket.id → { code, playerId }
const sessions = new Map();

function broadcast(ns, code) {
  const room = rooms.getRoom(code);
  if (!room) return;
  for (const [socketId, s] of sessions) {
    if (s.code === code) ns.to(socketId).emit(E.STATE, viewFor(room, s.playerId));
  }
}

function attach(socket, code, playerId) {
  sessions.set(socket.id, { code, playerId });
  socket.join(code);
}

export function registerLeaflineHandlers(ns, socket) {
  const reply = (ack, result) => {
    if (typeof ack === 'function') ack(result);
  };

  // Runs a room action for this socket's player; errors go back to that socket only.
  const act = (fn) => {
    const s = sessions.get(socket.id);
    if (!s) return;
    const result = fn(s);
    if (result?.error) {
      socket.emit(E.ERROR, { message: result.error });
      return;
    }
    broadcast(ns, s.code);
  };

  socket.on(E.ROOM_CREATE, ({ name } = {}, ack) => {
    const result = rooms.createRoom(name);
    if (result.error) return reply(ack, result);
    attach(socket, result.room.code, result.playerId);
    reply(ack, { code: result.room.code, playerId: result.playerId, secret: result.secret });
    broadcast(ns, result.room.code);
  });

  socket.on(E.ROOM_JOIN, ({ code, name, playerId, secret } = {}, ack) => {
    const result = rooms.joinRoom(code, name, playerId, secret);
    if (result.error) return reply(ack, result);
    for (const [id, s] of sessions) {
      if (s.playerId === result.playerId && id !== socket.id) sessions.delete(id);
    }
    attach(socket, result.room.code, result.playerId);
    reply(ack, { code: result.room.code, playerId: result.playerId, secret: result.secret });
    broadcast(ns, result.room.code);
  });

  socket.on(E.ROOM_KICK, ({ playerId: targetId } = {}) => {
    act((s) => {
      const result = rooms.kickPlayer(s.code, s.playerId, targetId);
      if (result.error) return result;
      for (const [id, other] of sessions) {
        if (other.playerId === targetId) {
          sessions.delete(id);
          ns.to(id).emit(E.ERROR, { message: 'You were removed from the room', kicked: true });
          ns.sockets.get(id)?.leave(s.code);
        }
      }
      return result;
    });
  });

  socket.on(E.GAME_START, () => act((s) => rooms.startGame(s.code, s.playerId)));

  socket.on(E.CLUE_UPDATE, ({ linkId, text } = {}) =>
    act((s) => rooms.updateClue(s.code, s.playerId, linkId, text))
  );

  socket.on(E.CLUE_READY, ({ ready } = {}) =>
    act((s) => rooms.setReady(s.code, s.playerId, Boolean(ready)))
  );

  socket.on(E.GUESS_PLACE, ({ cardId, slot } = {}) =>
    act((s) => rooms.placeCard(s.code, s.playerId, cardId, Number(slot)))
  );

  socket.on(E.GUESS_ROTATE, ({ slot } = {}) =>
    act((s) => rooms.rotateCard(s.code, s.playerId, Number(slot)))
  );

  socket.on(E.GUESS_RETURN, ({ cardId } = {}) =>
    act((s) => rooms.returnCard(s.code, s.playerId, cardId))
  );

  socket.on(E.GUESS_SUBMIT, () => act((s) => rooms.submitGuess(s.code, s.playerId)));

  socket.on(E.GUESS_UNSUBMIT, () => act((s) => rooms.unsubmitGuess(s.code, s.playerId)));

  socket.on(E.BOARD_NEXT, () => act((s) => rooms.nextBoard(s.code, s.playerId)));

  socket.on(E.PLAY_AGAIN, () => act((s) => rooms.playAgain(s.code, s.playerId)));

  socket.on(E.ROOM_LEAVE, () => {
    const s = sessions.get(socket.id);
    if (!s) return;
    for (const [id, other] of sessions) {
      if (other.playerId === s.playerId) sessions.delete(id);
    }
    socket.leave(s.code);
    rooms.leaveRoom(s.code, s.playerId);
    broadcast(ns, s.code);
  });

  socket.on('disconnect', () => {
    const s = sessions.get(socket.id);
    if (!s) return;
    sessions.delete(socket.id);
    const stillHere = [...sessions.values()].some((o) => o.playerId === s.playerId);
    if (!stillHere) rooms.disconnect(s.code, s.playerId);
    broadcast(ns, s.code);
  });
}
