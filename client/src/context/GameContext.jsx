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
  powerups: { freeze: 0, hint: 0, fog: 0, bonus: 0, mirror: 0 },
  frozen: false,
  hintCells: [],
  hintWord: null,
  fogArea: null,
  bonusActive: false,
  mirrored: false,
  countdown: null,
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
        category: action.category || state.category,
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
        powerups: { freeze: 0, hint: 0, fog: 0, bonus: 0, mirror: 0 },
        frozen: false,
        hintCells: [],
        hintWord: null,
        fogArea: null,
        bonusActive: false,
        mirrored: false,
        winner: null,
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

    case 'FOG':
      return { ...state, fogArea: action.fogArea };

    case 'CLEAR_FOG':
      return { ...state, fogArea: null };

    case 'BONUS_ACTIVE':
      return { ...state, bonusActive: true };

    case 'BONUS_USED':
      return { ...state, bonusActive: false };

    case 'MIRROR':
      return { ...state, mirrored: action.mirrored };

    case 'GAME_END':
      return { ...state, phase: 'results', winner: action.winner, scores: action.scores };

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
        powerups: { freeze: 0, hint: 0, fog: 0, bonus: 0, mirror: 0 },
        frozen: false,
        hintCells: [],
        hintWord: null,
        fogArea: null,
        bonusActive: false,
        mirrored: false,
        winner: null,
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
