import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket.js';
import { useGame } from '../context/GameContext.jsx';

export default function useSocket() {
  const { dispatch } = useGame();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) socket.connect();

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Re-send reconnect attempt on every (re)connection
      const savedRoom = sessionStorage.getItem('wordrush_room');
      const savedName = sessionStorage.getItem('wordrush_name');
      if (savedRoom && savedName) {
        console.log('Auto-reconnecting to room:', savedRoom);
        socket.emit('reconnect:attempt', { roomCode: savedRoom, playerName: savedName });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('room:created', (data) => {
      dispatch({ type: 'SET_PLAYER_INFO', playerName: data.playerName, playerId: data.playerId });
      dispatch({ type: 'ROOM_CREATED', roomCode: data.roomCode, players: data.players, category: data.category, seriesLength: data.seriesLength });
      sessionStorage.setItem('wordrush_room', data.roomCode);
      sessionStorage.setItem('wordrush_name', data.players.find(p => p.id === data.playerId)?.name || '');
    });

    socket.on('room:joined', (data) => {
      dispatch({ type: 'SET_PLAYER_INFO', playerName: data.playerName, playerId: data.playerId });
      dispatch({ type: 'ROOM_JOINED', roomCode: data.roomCode, players: data.players, category: data.category, seriesLength: data.seriesLength });
      sessionStorage.setItem('wordrush_room', data.roomCode);
      sessionStorage.setItem('wordrush_name', data.players.find(p => p.id === data.playerId)?.name || '');
    });

    socket.on('room:update', (data) => {
      dispatch({ type: 'ROOM_UPDATE', players: data.players });
    });

    socket.on('room:error', (data) => {
      dispatch({ type: 'WORD_REJECTED', message: data.message });
    });

    socket.on('game:countdown', (data) => {
      dispatch({ type: 'COUNTDOWN', count: data.count });
    });

    socket.on('game:start', (data) => {
      dispatch({ type: 'GAME_START', grid: data.grid, words: data.words, scores: data.scores });
    });

    socket.on('word:confirmed', (data) => {
      dispatch({ type: 'WORD_CONFIRMED', word: data.word, foundBy: data.foundBy, scores: data.scores, cells: data.cells });
    });

    socket.on('word:rejected', (data) => {
      dispatch({ type: 'WORD_REJECTED', message: data.message });
      setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2000);
    });

    socket.on('powerup:earned', (data) => {
      dispatch({ type: 'POWERUP_EARNED', powerups: data.powerups });
    });

    socket.on('powerup:freeze', (data) => {
      const myId = socket.id;
      if (data.frozenPlayerId === myId) {
        dispatch({ type: 'FREEZE', frozen: true });
        setTimeout(() => dispatch({ type: 'FREEZE', frozen: false }), data.duration);
      }
    });

    socket.on('powerup:hint', (data) => {
      dispatch({ type: 'HINT', cells: data.cells, word: data.word });
      setTimeout(() => dispatch({ type: 'CLEAR_HINT' }), data.duration);
    });

    socket.on('powerup:fog', (data) => {
      dispatch({ type: 'SCRAMBLE' });
      setTimeout(() => dispatch({ type: 'CLEAR_SCRAMBLE' }), data.duration);
    });

    socket.on('powerup:rotate', (data) => {
      dispatch({ type: 'ROTATE' });
      setTimeout(() => dispatch({ type: 'CLEAR_ROTATE' }), data.duration);
    });

    socket.on('powerup:bonus', () => {
      dispatch({ type: 'BONUS_ACTIVE' });
    });

    socket.on('powerup:bonusUsed', () => {
      dispatch({ type: 'BONUS_USED' });
    });

    socket.on('powerup:drain', (data) => {
      dispatch({ type: 'SCORES_UPDATE', scores: data.scores });
      const myId = socket.id;
      if (data.usedBy === myId) {
        dispatch({ type: 'WORD_REJECTED', message: 'Drained 1 point!' });
      } else {
        dispatch({ type: 'WORD_REJECTED', message: 'You lost a point to drain!' });
      }
      setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2000);
    });

    socket.on('game:multiplierUpdate', (data) => {
      dispatch({ type: 'MULTIPLIER_UPDATE', multiplier: data.multiplier });
    });

    socket.on('game:finalCountdown', (data) => {
      dispatch({ type: 'FINAL_COUNTDOWN', seconds: data.seconds, points: data.points });
    });

    socket.on('game:end', (data) => {
      dispatch({
        type: 'GAME_END',
        winner: data.winner,
        scores: data.scores,
        seriesWins: data.seriesWins,
        seriesOver: data.seriesOver,
        seriesWinner: data.seriesWinner,
      });
      if (data.seriesOver || data.seriesLength === 1) {
        sessionStorage.removeItem('wordrush_room');
        sessionStorage.removeItem('wordrush_name');
      }
    });

    socket.on('game:state', (data) => {
      if (data.playerId) {
        dispatch({ type: 'SET_PLAYER_INFO', playerId: data.playerId });
      }
      dispatch({ type: 'GAME_STATE', ...data });
    });

    socket.on('player:disconnected', () => {
      dispatch({ type: 'OPPONENT_DISCONNECTED', disconnected: true });
    });

    socket.on('player:reconnected', () => {
      dispatch({ type: 'OPPONENT_DISCONNECTED', disconnected: false });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:update');
      socket.off('room:error');
      socket.off('game:countdown');
      socket.off('game:start');
      socket.off('word:confirmed');
      socket.off('word:rejected');
      socket.off('powerup:earned');
      socket.off('powerup:freeze');
      socket.off('powerup:hint');
      socket.off('powerup:fog');
      socket.off('powerup:rotate');
      socket.off('powerup:bonus');
      socket.off('powerup:bonusUsed');
      socket.off('powerup:drain');
      socket.off('game:multiplierUpdate');
      socket.off('game:finalCountdown');
      socket.off('game:end');
      socket.off('game:state');
      socket.off('player:disconnected');
      socket.off('player:reconnected');
    };
  }, [dispatch]);

  return socketRef;
}
