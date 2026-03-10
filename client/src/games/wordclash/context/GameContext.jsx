import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext(null);

const initialState = {
  phase: 'home',         // home | lobby | playing | roundResults | gameOver
  roomCode: null,
  playerId: null,
  playerName: null,
  players: [],            // [{ id, name, color, score }]
  hostId: null,
  totalRounds: 5,
  roundTimeSeconds: 60,
  currentRound: 0,
  letters: [],
  validationStatus: null, // { word, valid, reason }
  submittedPlayerIds: [],
  iSubmitted: false,
  roundSubmissions: [],   // [{ playerId, word, score }]
  bestWords: [],          // top possible words for the round
  scores: {},             // { playerId: totalScore }
  winner: null,
  toast: null,
  opponentDisconnected: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER_INFO':
      return { ...state, playerName: action.playerName, playerId: action.playerId };

    case 'ROOM_CREATED':
    case 'ROOM_JOINED':
      return {
        ...state,
        phase: 'lobby',
        roomCode: action.roomCode,
        players: action.players,
        hostId: action.hostId,
        totalRounds: action.totalRounds,
        roundTimeSeconds: action.roundTimeSeconds,
      };

    case 'ROOM_UPDATE':
      return {
        ...state,
        players: action.players,
        hostId: action.hostId ?? state.hostId,
        totalRounds: action.totalRounds ?? state.totalRounds,
        roundTimeSeconds: action.roundTimeSeconds ?? state.roundTimeSeconds,
      };

    case 'ROOM_ERROR':
      return { ...state, toast: action.message };

    case 'ROUND_START':
      return {
        ...state,
        phase: 'playing',
        letters: action.letters,
        currentRound: action.round,
        totalRounds: action.totalRounds,
        roundTimeSeconds: action.roundTimeSeconds,
        validationStatus: null,
        submittedPlayerIds: [],
        iSubmitted: false,
        roundSubmissions: [],
      };

    case 'WORD_VALIDATION':
      return { ...state, validationStatus: { word: action.word, valid: action.valid, reason: action.reason } };

    case 'PLAYER_SUBMITTED':
      return {
        ...state,
        submittedPlayerIds: [...state.submittedPlayerIds, action.playerId],
        iSubmitted: state.iSubmitted || action.playerId === state.playerId,
      };

    case 'ROUND_END':
      return {
        ...state,
        phase: 'roundResults',
        roundSubmissions: action.submissions,
        bestWords: action.bestWords || [],
        scores: action.scores,
        currentRound: action.round,
      };

    case 'GAME_END':
      return {
        ...state,
        phase: 'gameOver',
        winner: action.winner,
        scores: action.scores,
        players: action.players ?? state.players,
      };

    case 'GAME_STATE':
      return {
        ...state,
        phase: action.phase,
        roomCode: action.roomCode ?? state.roomCode,
        players: action.players ?? state.players,
        hostId: action.hostId ?? state.hostId,
        totalRounds: action.totalRounds ?? state.totalRounds,
        roundTimeSeconds: action.roundTimeSeconds ?? state.roundTimeSeconds,
        scores: action.scores ?? {},
        iSubmitted: action.iSubmitted ?? false,
        submittedPlayerIds: action.submittedPlayerIds ?? [],
        roundSubmissions: [],
        letters: action.letters ?? [],
        currentRound: action.currentRound ?? 0,
        winner: null,
        opponentDisconnected: false,
      };

    case 'OPPONENT_DISCONNECTED':
      return { ...state, opponentDisconnected: action.disconnected };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
