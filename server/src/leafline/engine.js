import { LINK_GEOMETRY, POINTS_FIRST_TRY, POINTS_SECOND_TRY } from '../../../shared/leafline.js';
import { WORD_LIST } from './words.js';

const SLOTS = [0, 1, 2, 3];

/** Visible word on an edge after rotating the card `rotation` quarter-turns clockwise. */
export function wordAt(card, edge, rotation) {
  return card.words[(edge - rotation + 4) % 4];
}

export function wordsAt(card, rotation) {
  return [0, 1, 2, 3].map((edge) => wordAt(card, edge, rotation));
}

export function linkWords(cards, solution, linkId) {
  const [a, b] = LINK_GEOMETRY[linkId];
  const pa = solution[a.slot];
  const pb = solution[b.slot];
  return [
    wordAt(cards.get(pa.cardId), a.edge, pa.rotation),
    wordAt(cards.get(pb.cardId), b.edge, pb.rotation),
  ];
}

export function createRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildCardDeck(wordList = WORD_LIST, rng = Math.random) {
  const words = shuffle(wordList, rng);
  const cards = [];
  for (let i = 0; i + 3 < words.length; i += 4) {
    cards.push({ id: `card-${i / 4}`, words: words.slice(i, i + 4) });
  }
  return cards;
}

/** Deals each player four solution cards (random rotation) plus one decoy. */
export function dealBoards(playerIds, deck, rng = Math.random) {
  const shuffled = shuffle(deck, rng);
  let idx = 0;
  return playerIds.map((ownerId) => {
    const solution = {};
    for (const slot of SLOTS) {
      solution[slot] = { cardId: shuffled[idx++].id, rotation: Math.floor(rng() * 4) };
    }
    return {
      ownerId,
      solution,
      clues: { top: '', right: '', bottom: '', left: '' },
      decoyCardId: shuffled[idx++].id,
    };
  });
}

export function evaluateGuess(slots, solution) {
  const correctSlots = SLOTS.filter((slot) => {
    const placed = slots[slot];
    const target = solution[slot];
    return placed && placed.cardId === target.cardId && placed.rotation === target.rotation;
  });
  return { correctSlots, allCorrect: correctSlots.length === 4 };
}

export function computeScore(attempt, allCorrect) {
  if (!allCorrect) return 0;
  return attempt === 1 ? POINTS_FIRST_TRY : POINTS_SECOND_TRY;
}

export function submitsNeeded(room) {
  const guessers = room.players.filter((p) => p.id !== room.guess?.boardOwnerId && p.connected);
  return guessers.length <= 2 ? guessers.length : Math.ceil(guessers.length / 2);
}

/** Per-player view of a room: hides other players' solutions until reveal. */
export function viewFor(room, playerId) {
  const view = {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    phase: room.phase,
    currentBoardIndex: room.currentBoardIndex,
    totalBoards: room.boards.length,
    score: room.score,
  };

  if (room.phase === 'writing') {
    const board = room.boards.find((b) => b.ownerId === playerId);
    if (board) {
      view.myBoard = {
        slots: SLOTS.map((slot) => {
          const p = board.solution[slot];
          return wordsAt(room.cards.get(p.cardId), p.rotation);
        }),
        clues: { ...board.clues },
      };
    }
    view.readyIds = [...room.ready];
  }

  if ((room.phase === 'guessing' || room.phase === 'reveal') && room.guess) {
    view.guess = buildGuessView(room);
  }

  if (room.phase === 'reveal' && room.reveal) {
    view.reveal = room.reveal;
  }

  return view;
}

function buildGuessView(room) {
  const { guess } = room;
  const board = room.boards[room.currentBoardIndex];
  const owner = room.players.find((p) => p.id === guess.boardOwnerId);
  const toView = (p) =>
    p && {
      cardId: p.cardId,
      rotation: p.rotation,
      words: wordsAt(room.cards.get(p.cardId), p.rotation),
    };

  return {
    boardOwnerId: guess.boardOwnerId,
    boardOwnerName: owner?.name ?? '?',
    attempt: guess.attempt,
    slots: SLOTS.map((slot) => toView(guess.slots[slot])),
    locked: guess.locked,
    tray: guess.tray.map(toView),
    clues: board.clues,
    submitted: guess.submitted,
    submitsNeeded: submitsNeeded(room),
  };
}
