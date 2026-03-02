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
      console.log('[WordClash] Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[WordClash] Socket connection error:', err.message);
    });

    socket.on('room:created', (data) => {
      dispatch({ type: 'SET_PLAYER_INFO', playerName: data.players.find(p => p.id === data.playerId)?.name, playerId: data.playerId });
      dispatch({ type: 'ROOM_CREATED', roomCode: data.roomCode, players: data.players, hostId: data.hostId, totalRounds: data.totalRounds, roundTimeSeconds: data.roundTimeSeconds });
    });

    socket.on('room:joined', (data) => {
      dispatch({ type: 'SET_PLAYER_INFO', playerName: data.players.find(p => p.id === data.playerId)?.name, playerId: data.playerId });
      dispatch({ type: 'ROOM_JOINED', roomCode: data.roomCode, players: data.players, hostId: data.hostId, totalRounds: data.totalRounds, roundTimeSeconds: data.roundTimeSeconds });
    });

    socket.on('room:update', (data) => {
      dispatch({ type: 'ROOM_UPDATE', players: data.players, hostId: data.hostId, totalRounds: data.totalRounds, roundTimeSeconds: data.roundTimeSeconds });
    });

    socket.on('room:error', (data) => {
      dispatch({ type: 'ROOM_ERROR', message: data.message });
      setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000);
    });

    socket.on('round:start', (data) => {
      dispatch({ type: 'ROUND_START', letters: data.letters, round: data.round, totalRounds: data.totalRounds, roundTimeSeconds: data.roundTimeSeconds });
    });

    socket.on('word:validation', (data) => {
      dispatch({ type: 'WORD_VALIDATION', word: data.word, valid: data.valid, reason: data.reason });
    });

    socket.on('player:submitted', (data) => {
      dispatch({ type: 'PLAYER_SUBMITTED', playerId: data.playerId });
    });

    socket.on('round:end', (data) => {
      dispatch({ type: 'ROUND_END', submissions: data.submissions, scores: data.scores, round: data.round, bestWords: data.bestWords });
    });

    socket.on('game:end', (data) => {
      dispatch({ type: 'GAME_END', winner: data.winner, scores: data.scores, players: data.players });
    });

    socket.on('game:state', (data) => {
      dispatch({ type: 'GAME_STATE', ...data });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:update');
      socket.off('room:error');
      socket.off('round:start');
      socket.off('word:validation');
      socket.off('player:submitted');
      socket.off('round:end');
      socket.off('game:end');
      socket.off('game:state');
    };
  }, [dispatch]);

  return socketRef;
}
