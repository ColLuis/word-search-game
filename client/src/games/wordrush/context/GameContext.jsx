import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext(null);

const initialState = {
  phase: 'home',        // home | lobby | countdown | playing | results
  roomCode: null,
  playerName: null,
  playerId: null,        // socket id
  players: [],           // [{ id, name, ready, score }]
  category: null,
  grid: [],
  words: [],             // [{ word, found, foundBy, cells }]
  scores: {},            // { playerId: score }
  powerups: { freeze: 0, hint: 0, fog: 0, bonus: 0, drain: 0, rotate: 0 },
  frozen: false,
  hintCells: [],
  hintWord: null,
  scrambled: false,
  rotated: false,
  bonusActive: false,
  countdown: null,
  winner: null,
  toast: null,
  opponentDisconnected: false,
  seriesLength: 1,
  seriesWins: {},
  seriesOver: false,
  seriesWinner: null,
  multiplier: 1,
  finalCountdown: null,
  finalCountdownPoints: null,
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
        category: action.category || state.category,
        seriesLength: action.seriesLength || 1,
      };

    case 'ROOM_UPDATE':
      return { ...state, players: action.players };

    case 'COUNTDOWN':
      return { ...state, phase: 'countdown', countdown: action.count };

    case 'GAME_START':
      return {
        ...state,
        phase: 'playing',
        grid: action.grid,
        words: action.words,
        scores: action.scores,
        countdown: null,
        powerups: { freeze: 0, hint: 0, fog: 0, bonus: 0, drain: 0, rotate: 0 },
        frozen: false,
        hintCells: [],
        hintWord: null,
        scrambled: false,
        rotated: false,
        bonusActive: false,
        winner: null,
        seriesOver: false,
        seriesWinner: null,
        multiplier: 1,
        finalCountdown: null,
        finalCountdownPoints: null,
      };

    case 'WORD_CONFIRMED': {
      const words = state.words.map((w) =>
        w.word === action.word ? { ...w, found: true, foundBy: action.foundBy, cells: action.cells || w.cells } : w
      );
      return { ...state, words, scores: action.scores };
    }

    case 'WORD_REJECTED':
      return { ...state, toast: action.message };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'POWERUP_EARNED':
      return { ...state, powerups: action.powerups };

    case 'FREEZE':
      return { ...state, frozen: action.frozen };

    case 'HINT':
      return { ...state, hintCells: action.cells, hintWord: action.word };

    case 'CLEAR_HINT':
      return { ...state, hintCells: [], hintWord: null };

    case 'SCRAMBLE':
      return { ...state, scrambled: true };

    case 'CLEAR_SCRAMBLE':
      return { ...state, scrambled: false };

    case 'ROTATE':
      return { ...state, rotated: true };

    case 'CLEAR_ROTATE':
      return { ...state, rotated: false };

    case 'SCORES_UPDATE':
      return { ...state, scores: action.scores };

    case 'BONUS_ACTIVE':
      return { ...state, bonusActive: true };

    case 'BONUS_USED':
      return { ...state, bonusActive: false };

    case 'MULTIPLIER_UPDATE':
      return { ...state, multiplier: action.multiplier };

    case 'FINAL_COUNTDOWN':
      return { ...state, finalCountdown: action.seconds, finalCountdownPoints: action.points };

    case 'GAME_END':
      return {
        ...state,
        phase: 'results',
        winner: action.winner,
        scores: action.scores,
        seriesWins: action.seriesWins || state.seriesWins,
        seriesOver: action.seriesOver || false,
        seriesWinner: action.seriesWinner || null,
      };

    case 'GAME_STATE':
      return {
        ...state,
        phase: action.phase,
        grid: action.grid ?? state.grid,
        words: action.words ?? state.words,
        scores: action.scores ?? state.scores,
        players: action.players ?? state.players,
        powerups: action.powerups ?? state.powerups,
        roomCode: action.roomCode ?? state.roomCode,
        category: action.category ?? state.category,
        seriesWins: action.seriesWins ?? state.seriesWins,
        seriesLength: action.seriesLength ?? state.seriesLength,
      };

    case 'OPPONENT_DISCONNECTED':
      return { ...state, opponentDisconnected: action.disconnected };

    case 'RESET_TO_LOBBY':
      return {
        ...state,
        phase: 'lobby',
        grid: [],
        words: [],
        scores: {},
        powerups: { freeze: 0, hint: 0, fog: 0, bonus: 0, drain: 0, rotate: 0 },
        frozen: false,
        hintCells: [],
        hintWord: null,
        scrambled: false,
        rotated: false,
        bonusActive: false,
              winner: null,
        multiplier: 1,
        finalCountdown: null,
        finalCountdownPoints: null,
        players: action.players ?? state.players,
      };

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
